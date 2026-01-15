
/**
 * --- FINAL GOOGLE APPS SCRIPT ---
 * รวมระบบยืม-คืน, เช็คสถานะ, และดึงรายการประวัติทั้งหมด
 */

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === "get_borrowed") {
      return getAllBorrowed();
    }
    
    if (action === "get_all_transactions") {
      return getAllTransactions();
    }
    
    if (action === "check") {
      return checkSingleGame(e.parameter.Board_Game);
    }
    
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
    if (!e.postData || !e.postData.contents) throw new Error("ไม่มีข้อมูลส่งมา");
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === "borrow") {
      return handleBorrow(data);
    } else if (data.action === "return") {
      return handleReturn(data);
    } else {
      throw new Error("Action ไม่ถูกต้อง");
    }
  } catch (err) {
    return output({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getAllTransactions() {
  const ss = SpreadsheetApp.getActive();
  const borrowSheet = ss.getSheetByName("BorrowData");
  if (!borrowSheet) return output({ status: "error", message: "ไม่พบชีต BorrowData" });

  const values = borrowSheet.getDataRange().getValues();
  const transactions = [];
  
  // ข้ามหัวตาราง (i=1) และอ่านจากล่างขึ้นบนเพื่อให้เห็นรายการล่าสุดก่อน
  for (let i = values.length - 1; i >= 1; i--) {
    transactions.push({
      playerCount: values[i][0],
      date: values[i][1],
      classroom: values[i][2],
      studentId: values[i][3],
      major: values[i][4],
      gameName: values[i][5],
      borrowTime: values[i][8],
      returnTime: values[i][9] || null
    });
  }
  return output({ status: "success", items: transactions });
}

function getAllBorrowed() {
  const ss = SpreadsheetApp.getActive();
  const statusSheet = ss.getSheetByName("BoardGameStatus");
  if (!statusSheet) return output({ status: "error", message: "ไม่พบชีต BoardGameStatus" });

  const values = statusSheet.getDataRange().getValues();
  const items = [];
  
  for (let i = 1; i < values.length; i++) {
    const gameName = values[i][0];
    const status = String(values[i][1]);
    
    if (status.includes("กำลัง")) {
      items.push({
        gameName: gameName,
        status: status,
        major: values[i][2] || "",
        studentId: values[i][3] || "",
        classroom: values[i][4] || "",
        timestamp: new Date().toISOString()
      });
    }
  }
  return output({ status: "success", items: items });
}

function handleBorrow(data) {
  const ss = SpreadsheetApp.getActive();
  const borrowSheet = ss.getSheetByName("BorrowData");
  const statusSheet = ss.getSheetByName("BoardGameStatus");
  if (!borrowSheet || !statusSheet) throw new Error("ไม่พบชีตที่ต้องการ");

  const statusValues = statusSheet.getDataRange().getValues();
  for (let i = 1; i < statusValues.length; i++) {
    if (statusValues[i][0] === data.Board_Game && String(statusValues[i][1]).includes("กำลัง")) {
      return output({ status: "blocked", message: "เกมนี้ถูกยืมอยู่แล้ว" });
    }
  }

  const now = new Date();
  const monthNames = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  const timeStr = Utilities.formatDate(now, "Asia/Bangkok", "HH:mm:ss");
  const dateStr = Utilities.formatDate(now, "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

  const newRow = [
    data.Player_Count || "",
    dateStr,
    data.Classroom || "",
    data.Student_ID || "",
    data.Major || "",
    data.Board_Game || "",
    month,
    year,
    timeStr,
    "" // ReturnTime
  ];

  borrowSheet.appendRow(newRow);
  addPlayerCountToMonthlySummary(month, year, Number(data.Player_Count || 0));

  let found = false;
  for (let i = 1; i < statusValues.length; i++) {
    if (statusValues[i][0] === data.Board_Game) {
      statusSheet.getRange(i + 1, 2).setValue("🟡 กำลังใช้งาน");
      statusSheet.getRange(i + 1, 3).setValue(data.Major);
      statusSheet.getRange(i + 1, 4).setValue(data.Student_ID);
      statusSheet.getRange(i + 1, 5).setValue(data.Classroom);
      found = true;
      break;
    }
  }
  if (!found) {
    statusSheet.appendRow([data.Board_Game, "🟡 กำลังใช้งาน", data.Major, data.Student_ID, data.Classroom]);
  }
  return output({ status: "success", message: "บันทึกข้อมูลสำเร็จ" });
}

function handleReturn(data) {
  const ss = SpreadsheetApp.getActive();
  const borrowSheet = ss.getSheetByName("BorrowData");
  const statusSheet = ss.getSheetByName("BoardGameStatus");
  const studentId = data.Student_ID;
  const gameName = data.Board_Game;
  
  const now = new Date();
  const timeStr = Utilities.formatDate(now, "Asia/Bangkok", "HH:mm:ss");

  const values = borrowSheet.getDataRange().getValues();
  let updated = false;

  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][3]) == String(studentId) && values[i][5] == gameName && !values[i][9]) {
      borrowSheet.getRange(i + 1, 10).setValue(timeStr);
      updated = true;
      break;
    }
  }

  const statusValues = statusSheet.getDataRange().getValues();
  for (let i = 1; i < statusValues.length; i++) {
    if (statusValues[i][0] === gameName && String(statusValues[i][3]) === String(studentId)) {
      statusSheet.getRange(i + 1, 2).setValue("🟢 พร้อมให้ยืม");
      statusSheet.getRange(i + 1, 3, 1, 3).clearContent();
      break;
    }
  }

  return output({
    status: updated ? "success" : "not_found",
    message: updated ? "คืนเกมสำเร็จ" : "ไม่พบข้อมูลการยืม หรือรหัสไม่ตรง"
  });
}

function checkSingleGame(gameName) {
  const ss = SpreadsheetApp.getActive();
  const statusSheet = ss.getSheetByName("BoardGameStatus");
  const values = statusSheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === gameName) {
      if (String(values[i][1]).includes("กำลัง")) {
        return output({ status: "borrowed", boardGame: gameName, major: values[i][2], studentId: values[i][3], classroom: values[i][4] });
      } else {
        return output({ status: "available", boardGame: gameName });
      }
    }
  }
  return output({ status: "not_found" });
}

function addPlayerCountToMonthlySummary(month, year, playerCount) {
  const ss = SpreadsheetApp.getActive();
  const summarySheet = ss.getSheetByName("Monthly Summary");
  if (!summarySheet) return;
  const lastRow = summarySheet.getLastRow();
  if (lastRow < 2) return;
  const data = summarySheet.getRange(2, 1, lastRow - 1, 5).getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] == month && Number(data[i][4]) == Number(year)) {
      let oldValue = data[i][1] || 0;
      summarySheet.getRange(i + 2, 2).setValue(Number(oldValue) + Number(playerCount));
      return;
    }
  }
}

function output(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
