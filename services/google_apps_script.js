
/**
 * --- LATEST GOOGLE APPS SCRIPT (COPY THIS TO YOUR PROJECT) ---
 * ส่วนนี้คือโค้ดสำหรับฝั่ง Google Apps Script เพื่อให้ระบบดึงข้อมูลได้
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    return createJsonResponse({ status: "error", message: "Server busy" });
  }

  try {
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const borrowSheet = ss.getSheetByName("BorrowData");
    if (!borrowSheet) throw new Error("ไม่พบ Sheet: BorrowData");

    // 🔍 GET BORROWED ITEMS (ดึงรายการที่ยังไม่คืน)
    if (data.action === "get_borrowed") {
      const values = borrowSheet.getDataRange().getValues();
      const borrowedItems = [];
      
      // เริ่มวนลูปจากแถวที่ 2 (index 1) ข้ามหัวตาราง
      for (let i = 1; i < values.length; i++) {
        // คอลัมน์ G (index 6) คือสถานะ "🟡 กำลังใช้งาน"
        if (values[i][6] === "🟡 กำลังใช้งาน") {
          borrowedItems.push({
            timestamp: values[i][0],
            major: values[i][1],
            studentId: values[i][2],
            classroom: values[i][3],
            gameName: values[i][4],
            playerCount: values[i][5],
            status: values[i][6],
            borrowTime: values[i][9] || ""
          });
        }
      }
      return createJsonResponse({ status: "success", items: borrowedItems });
    }

    // 📘 BORROW ACTION (บันทึกการยืม)
    else if (data.action === "borrow") {
      const now = new Date();
      const monthNames = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
      const timeStr = Utilities.formatDate(now, "Asia/Bangkok", "HH:mm:ss");
      
      const newRow = [
        Utilities.formatDate(now, "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss"), 
        data.Major || "",        
        data.Student_ID || "",   
        data.Classroom || "",    
        data.Board_Game || "",   
        data.Player_Count || "", 
        "🟡 กำลังใช้งาน",        
        monthNames[now.getMonth()],                   
        now.getFullYear(),                    
        timeStr,                 
        ""                       
      ];
      borrowSheet.appendRow(newRow);
      return createJsonResponse({ status: "success", message: "บันทึกข้อมูลเรียบร้อย" });
    }

    // 🔁 RETURN ACTION (บันทึกการคืน)
    else if (data.action === "return") {
      const values = borrowSheet.getDataRange().getValues();
      const studentId = data.Student_ID;
      const gameName = data.Board_Game;
      let updated = false;

      for (let i = values.length - 1; i >= 1; i--) {
        if (values[i][2] == studentId && values[i][4] == gameName && values[i][6] === "🟡 กำลังใช้งาน") {
          borrowSheet.getRange(i + 1, 7).setValue("🟢 คืนแล้ว");
          borrowSheet.getRange(i + 1, 11).setValue(Utilities.formatDate(new Date(), "Asia/Bangkok", "HH:mm:ss"));
          updated = true;
          break;
        }
      }
      return createJsonResponse({ 
        status: updated ? "success" : "not_found", 
        message: updated ? "คืนเกมสำเร็จ" : "ไม่พบข้อมูลการยืม" 
      });
    }

  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
