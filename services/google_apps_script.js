
/**
 * --- FINAL GOOGLE APPS SCRIPT (FIXED TIMEZONE & FORMATTING) ---
 */

const TIMEZONE = "Asia/Bangkok";

function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === "get_borrowed") return getAllBorrowed();
    if (action === "get_all_transactions") return getAllTransactions();
    if (action === "check") return checkSingleGame(e.parameter.Board_Game);
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
    if (data.action === "borrow") return handleBorrow(data);
    if (data.action === "return") return handleReturn(data);
    throw new Error("Action ไม่ถูกต้อง");
  } catch (err) {
    return output({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getAllBorrowed() {
  const ss = SpreadsheetApp.getActive();
  const statusSheet = ss.getSheetByName("BoardGameStatus");
  if (!statusSheet) return output({ status: "error", message: "ไม่พบชีต BoardGameStatus" });

  const values = statusSheet.getDataRange().getValues();
  const items = [];
  for (let i = 1; i < values.length; i++) {
    const status = String(values[i][1]);
    if (status.includes("กำลัง")) {
      // แปลงค่าวันที่ยืมให้เป็น string ที่แน่นอน
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

  const now = new Date();
  const dateStr = Utilities.formatDate(now, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  
  const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const monthName = thaiMonths[now.getMonth()];
  const yearAD = now.getFullYear().toString();
  const borrowTime = Utilities.formatDate(now, TIMEZONE, "HH:mm:ss");

  // บันทึกลง BorrowData
  borrowSheet.appendRow([
    data.Player_Count, dateStr, data.Classroom, studentId, data.Major, 
    gameName, monthName, yearAD, borrowTime, ""
  ]);

  // บันทึกลง BoardGameStatus
  statusSheet.appendRow([gameName, "🟡 กำลังใช้งาน", data.Major, studentId, data.Classroom, dateStr]);
  
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
  let updatedInBorrowData = false;
  
  for (let i = values.length - 1; i >= 1; i--) {
    const rowId = String(values[i][3]).trim();
    const rowGame = String(values[i][5]).trim();
    const returnTime = values[i][9];

    if (rowId === studentId && rowGame === gameName && !returnTime) {
      borrowSheet.getRange(i + 1, 10).setValue(timeStr);
      updatedInBorrowData = true;
      break;
    }
  }

  const statusValues = statusSheet.getDataRange().getValues();
  let updatedInStatus = false;
  for (let i = statusValues.length - 1; i >= 1; i--) {
    const rowGame = String(statusValues[i][0]).trim();
    const rowId = String(statusValues[i][3]).trim();
    const rowStatus = String(statusValues[i][1]);
    
    if (rowGame === gameName && rowId === studentId && rowStatus.includes("กำลัง")) {
      statusSheet.getRange(i + 1, 2, 1, 5).setValues([["🟢 พร้อมให้ยืม", "", "", "", ""]]);
      updatedInStatus = true;
      break;
    }
  }
  
  if (updatedInBorrowData || updatedInStatus) {
    return output({ status: "success", message: "คุณคืนบอร์ดเกมแล้ว" });
  } else {
    return output({ status: "not_found", message: "รหัสประจำตัวไม่ถูกต้อง" });
  }
}

function getAllTransactions() {
  const ss = SpreadsheetApp.getActive();
  const borrowSheet = ss.getSheetByName("BorrowData");
  const values = borrowSheet.getDataRange().getValues();
  const transactions = [];
  
  for (let i = values.length - 1; i >= 1; i--) {
    // บังคับให้วันที่และเวลาเป็น String เสมอ เพื่อป้องกันปัญหากับ JSON.stringify
    let dateVal = values[i][1];
    if (dateVal instanceof Date) {
      dateVal = Utilities.formatDate(dateVal, TIMEZONE, "yyyy-MM-dd");
    }

    let bTime = values[i][8];
    if (bTime instanceof Date) {
      bTime = Utilities.formatDate(bTime, TIMEZONE, "HH:mm:ss");
    }

    let rTime = values[i][9];
    if (rTime instanceof Date) {
      rTime = Utilities.formatDate(rTime, TIMEZONE, "HH:mm:ss");
    }

    transactions.push({
      playerCount: values[i][0], 
      date: String(dateVal), 
      classroom: values[i][2],
      studentId: values[i][3], 
      major: values[i][4], 
      gameName: values[i][5],
      borrowTime: String(bTime), 
      returnTime: rTime ? String(rTime) : null
    });
  }
  return output({ status: "success", items: transactions });
}

function checkSingleGame(gameName) {
  const ss = SpreadsheetApp.getActive();
  const statusSheet = ss.getSheetByName("BoardGameStatus");
  const values = statusSheet.getDataRange().getValues();
  
  const currentBorrowers = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === gameName && String(values[i][1]).includes("กำลัง")) {
      currentBorrowers.push({
        studentId: values[i][3],
        classroom: values[i][4]
      });
    }
  }
  
  if (currentBorrowers.length > 0) {
    return output({ 
      status: "borrowed", 
      boardGame: gameName, 
      borrowers: currentBorrowers,
      message: "เกมนี้กำลังถูกยืมอยู่โดยหลายคน" 
    });
  }
  return output({ status: "available", boardGame: gameName });
}

function output(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
