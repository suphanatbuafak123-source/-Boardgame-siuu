
/**
 * --- UPDATED GOOGLE APPS SCRIPT (STRICT STRING FORMATTING) ---
 * บันทึกเวลาเป็นข้อความ (String) เพื่อป้องกันปัญหา Timezone คลาดเคลื่อน
 */

const TIMEZONE = "Asia/Bangkok";

function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === "get_borrowed") return getAllBorrowed();
    if (action === "get_all_transactions") return getAllTransactions();
    throw new Error("Invalid action");
  } catch (err) {
    return output({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(10000); }
  catch (e) { return output({ status: "error", message: "Server busy" }); }
  try {
    const data = JSON.parse(e.postData.contents);
    if (action_check(data, "borrow")) return handleBorrow(data);
    if (action_check(data, "return")) return handleReturn(data);
    throw new Error("Action ไม่ถูกต้อง");
  } catch (err) {
    return output({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function action_check(data, act) { return data.action === act; }

function getAllBorrowed() {
  const ss = SpreadsheetApp.getActive();
  const statusSheet = ss.getSheetByName("BoardGameStatus");
  if (!statusSheet) return output({ status: "error", message: "ไม่พบชีต BoardGameStatus" });

  const values = statusSheet.getDataRange().getValues();
  const items = [];
  for (let i = 1; i < values.length; i++) {
    const status = String(values[i][1]);
    if (status.includes("กำลัง")) {
      let borrowDateStr = "";
      if (values[i][5] instanceof Date) {
        borrowDateStr = Utilities.formatDate(values[i][5], TIMEZONE, "yyyy-MM-dd HH:mm:ss");
      } else {
        borrowDateStr = String(values[i][5]);
      }

      items.push({
        gameName: values[i][0],
        status: status,
        major: values[i][2] || "",
        studentId: String(values[i][3]).trim(),
        classroom: values[i][4] || "",
        borrowTimestamp: borrowDateStr
      });
    }
  }
  return output({ status: "success", items: items });
}

function handleBorrow(data) {
  const ss = SpreadsheetApp.getActive();
  const borrowSheet = ss.getSheetByName("BorrowData");
  const statusSheet = ss.getSheetByName("BoardGameStatus");
  
  const gameName = data.Board_Game;
  const studentId = String(data.Student_ID).trim();

  // สร้างค่าเวลา ณ ตอนนี้ (Time in Bangkok)
  const now = new Date();
  const dateStr = Utilities.formatDate(now, TIMEZONE, "yyyy-MM-dd");
  const fullTimestamp = Utilities.formatDate(now, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  const borrowTimeOnly = Utilities.formatDate(now, TIMEZONE, "HH:mm:ss");
  
  const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const monthName = thaiMonths[now.getMonth()];
  const yearAD = now.getFullYear().toString();

  // บันทึกลง BorrowData (ใส่ ' นำหน้าเพื่อให้เป็น Text ป้องกันชีตแปลงค่า)
  borrowSheet.appendRow([
    data.Player_Count, 
    "'" + dateStr, 
    data.Classroom, 
    "'" + studentId, 
    data.Major, 
    gameName, 
    monthName, 
    yearAD, 
    "'" + borrowTimeOnly, 
    ""
  ]);

  // บันทึกลง BoardGameStatus
  statusSheet.appendRow([
    gameName, 
    "🟡 กำลังใช้งาน", 
    data.Major, 
    "'" + studentId, 
    data.Classroom, 
    "'" + fullTimestamp
  ]);
  
  return output({ status: "success", message: "บันทึกข้อมูลสำเร็จ" });
}

function handleReturn(data) {
  const ss = SpreadsheetApp.getActive();
  const borrowSheet = ss.getSheetByName("BorrowData");
  const statusSheet = ss.getSheetByName("BoardGameStatus");
  
  const studentId = String(data.Student_ID).trim();
  const gameName = String(data.Board_Game).trim();
  const now = new Date();
  const timeStr = Utilities.formatDate(now, TIMEZONE, "HH:mm:ss");

  const values = borrowSheet.getDataRange().getValues();
  let updated = false;
  
  for (let i = values.length - 1; i >= 1; i--) {
    const rowId = String(values[i][3]).trim();
    const rowGame = String(values[i][5]).trim();
    const returnTime = values[i][9];

    if (rowId === studentId && rowGame === gameName && !returnTime) {
      borrowSheet.getRange(i + 1, 10).setValue("'" + timeStr);
      updated = true;
      break;
    }
  }

  const statusValues = statusSheet.getDataRange().getValues();
  for (let i = statusValues.length - 1; i >= 1; i--) {
    const rowGame = String(statusValues[i][0]).trim();
    const rowId = String(statusValues[i][3]).trim();
    const rowStatus = String(statusValues[i][1]);
    
    if (rowGame === gameName && rowId === studentId && rowStatus.includes("กำลัง")) {
      statusSheet.getRange(i + 1, 2, 1, 5).setValues([["🟢 พร้อมให้ยืม", "", "", "", ""]]);
      break;
    }
  }
  
  return output({ status: updated ? "success" : "error", message: updated ? "คืนสำเร็จ" : "ไม่พบรายการยืม" });
}

function getAllTransactions() {
  const ss = SpreadsheetApp.getActive();
  const borrowSheet = ss.getSheetByName("BorrowData");
  const values = borrowSheet.getDataRange().getValues();
  const transactions = [];
  
  for (let i = values.length - 1; i >= 1; i--) {
    let d = values[i][1];
    let bt = values[i][8];
    let rt = values[i][9];

    // ตรวจสอบและแปลงค่าให้เป็น String เสมอ
    const formatDateStr = (v) => v instanceof Date ? Utilities.formatDate(v, TIMEZONE, "yyyy-MM-dd") : String(v);
    const formatTimeStr = (v) => v instanceof Date ? Utilities.formatDate(v, TIMEZONE, "HH:mm:ss") : String(v);

    transactions.push({
      playerCount: values[i][0], 
      date: formatDateStr(d), 
      classroom: values[i][2],
      studentId: String(values[i][3]), 
      major: values[i][4], 
      gameName: values[i][5],
      borrowTime: formatTimeStr(bt), 
      returnTime: rt ? formatTimeStr(rt) : null
    });
  }
  return output({ status: "success", items: transactions });
}

function output(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
