
import { BorrowerInfo } from '../types';

// ใส่ URL ของ Apps Script ที่ deploy แล้ว
const GOOGLE_SHEET_API_URL =
  'https://script.google.com/macros/s/AKfycby_BgOS0nvxRP1x3sjKDgic4jIez8_zZawKRA7kOQXGKp6ySzGhDI-pKg_kKexx6x3DJw/exec';

interface ApiResponse {
  status: 'success' | 'not_found' | 'error';
  message?: string;
  games?: string[];
}

interface ServiceResponse {
  success: boolean;
  message?: string;
}

const handleApiError = (message?: string): string => {
  if (!message) return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
  
  // แปลง Error ทางเทคนิคเป็นภาษาคนที่เข้าใจง่าย
  if (message.includes("Cannot read properties of null") && message.includes("getDataRange")) {
    return "ระบบขัดข้อง: ไม่พบ Sheet 'BorrowData' หรือ 'BoardGameStatus' ใน Google Sheet กรุณาตรวจสอบชื่อ Sheet ให้ถูกต้อง";
  }
  if (message.includes("ไม่พบ Sheet")) {
    return "ระบบขัดข้อง: " + message;
  }
  
  return message;
};

export const recordBorrowing = async (borrowerInfo: BorrowerInfo): Promise<ServiceResponse> => {
  try {
    // We send one request for each borrowed game.
    for (const gameName of borrowerInfo.games) {
      const payload = {
        action: 'borrow',
        Student_ID: borrowerInfo.studentId.trim(),
        Classroom: borrowerInfo.classroom.trim(),
        Player_Count: borrowerInfo.numberOfPlayers.trim(),
        Major: borrowerInfo.major,
        Board_Game: gameName,
      };

      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });
      
      const text = await response.text();
      try {
        const result: ApiResponse = JSON.parse(text);
        if (result.status === 'error') {
          console.error('Error from Google Sheet:', result.message);
          return { success: false, message: handleApiError(result.message) };
        }
      } catch (e) {
        console.error('Failed to parse JSON response from Google Sheet. Raw response:', text);
        return { success: false, message: 'ได้รับข้อมูลตอบกลับที่ไม่ถูกต้องจากเซิร์ฟเวอร์' };
      }
    }

    return { success: true };

  } catch (error) {
    console.error('❌ Error sending to Google Sheet:', error);
    return { success: false, message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' };
  }
};

export const recordReturn = async (studentId: string, gameName: string): Promise<ServiceResponse> => {
  try {
    const payload = {
      action: 'return',
      Student_ID: studentId.trim(),
      Board_Game: gameName,
    };

    const response = await fetch(GOOGLE_SHEET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    try {
      const result: ApiResponse = JSON.parse(text);
      if (result.status === 'success') {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: handleApiError(result.message) };
      }
    } catch (e) {
      console.error('Failed to parse JSON response on return. Raw response:', text);
      return { success: false, message: 'ได้รับข้อมูลตอบกลับที่ไม่ถูกต้องจากเซิร์ฟเวอร์' };
    }
  } catch (error) {
    console.error('❌ Error sending return to Google Sheet:', error);
    return { success: false, message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' };
  }
};

/**
 * --- LATEST GOOGLE APPS SCRIPT (COPY THIS TO YOUR PROJECT) ---
 * 
 * function doPost(e) {
 *   const lock = LockService.getScriptLock();
 *   try {
 *     lock.waitLock(10000);
 *   } catch (e) {
 *     return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Server busy" })).setMimeType(ContentService.MimeType.JSON);
 *   }
 * 
 *   try {
 *     if (!e.postData || !e.postData.contents) throw new Error("ไม่มีข้อมูลส่งมา");
 * 
 *     const data = JSON.parse(e.postData.contents);
 *     const ss = SpreadsheetApp.getActiveSpreadsheet();
 *     const borrowSheet = ss.getSheetByName("BorrowData");
 *     const statusSheet = ss.getSheetByName("BoardGameStatus");
 * 
 *     if (!borrowSheet || !statusSheet) throw new Error("ไม่พบ Sheet: BorrowData หรือ BoardGameStatus");
 * 
 *     const now = new Date();
 *     const monthNames = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
 *     const month = monthNames[now.getMonth()];
 *     const year = now.getFullYear();
 * 
 *     // เวลาเฉพาะ HH:mm:ss
 *     const timeStr = Utilities.formatDate(now, "Asia/Bangkok", "HH:mm:ss");
 * 
 *     // 📘 BORROW
 *     if (data.action === "borrow") {
 * 
 *       const newRow = [
 *         Utilities.formatDate(now, "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss"), // A: datetime เดิม
 *         data.Major || "",        // B
 *         data.Student_ID || "",   // C
 *         data.Classroom || "",    // D
 *         data.Board_Game || "",   // E
 *         data.Player_Count || "", // F
 *         "🟡 กำลังใช้งาน",        // G: สถานะ
 *         month,                   // H
 *         year,                    // I: ปี
 *         timeStr,                 // J: Borrow_Time ใหม่
 *         ""                       // K: Return_Time ใหม่
 *       ];
 * 
 *       borrowSheet.appendRow(newRow);
 * 
 *       addPlayerCountToMonthlySummary(month, year, Number(data.Player_Count || 0));
 * 
 *       // อัปเดตสถานะ BoardGameStatus
 *       const games = statusSheet.getDataRange().getValues();
 *       let found = false;
 * 
 *       for (let i = 1; i < games.length; i++) {
 *         if (games[i][0] === data.Board_Game) {
 *           statusSheet.getRange(i + 1, 2).setValue("🟡 กำลังใช้งาน");
 *           statusSheet.getRange(i + 1, 3).setValue(data.Major);
 *           statusSheet.getRange(i + 1, 4).setValue(data.Student_ID);
 *           statusSheet.getRange(i + 1, 5).setValue(data.Classroom);
 *           found = true;
 *           break;
 *         }
 *       }
 * 
 *       if (!found) {
 *         statusSheet.appendRow([
 *           data.Board_Game,
 *           "🟡 กำลังใช้งาน",
 *           data.Major,
 *           data.Student_ID,
 *           data.Classroom
 *         ]);
 *       }
 * 
 *       return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "บันทึกข้อมูลเรียบร้อย" })).setMimeType(ContentService.MimeType.JSON);
 *     }
 * 
 *     // 🔁 RETURN
 *     else if (data.action === "return") {
 *       const studentId = data.Student_ID;
 *       const gameName = data.Board_Game;
 * 
 *       if (!studentId || !gameName) throw new Error("ข้อมูลไม่ครบถ้วน");
 * 
 *       const values = borrowSheet.getDataRange().getValues();
 *       let updated = false;
 * 
 *       for (let i = values.length - 1; i >= 1; i--) {
 *         if (
 *           values[i][2] == studentId &&   // C: Student_ID
 *           values[i][4] == gameName &&    // E: Board_Game
 *           values[i][6] === "🟡 กำลังใช้งาน" // G: สถานะ
 *         ) {
 *           borrowSheet.getRange(i + 1, 7).setValue("🟢 คืนแล้ว"); // สถานะ
 *           borrowSheet.getRange(i + 1, 11).setValue(timeStr);     // K: Return_Time
 *           updated = true;
 *           break;
 *         }
 *       }
 * 
 *       // เคลียร์สถานะ BoardGameStatus
 *       const statusValues = statusSheet.getDataRange().getValues();
 *       for (let i = 1; i < statusValues.length; i++) {
 *         if (statusValues[i][0] === gameName) {
 *           if (String(statusValues[i][3]) === String(studentId)) {
 *             statusSheet.getRange(i + 1, 2).setValue("🟢 พร้อมให้ยืม");
 *             statusSheet.getRange(i + 1, 3, 1, 3).clearContent();
 *           }
 *           break;
 *         }
 *       }
 * 
 *       return ContentService.createTextOutput(JSON.stringify({
 *         status: updated ? "success" : "not_found",
 *         message: updated ? "คืนเกมสำเร็จ" : "ไม่พบข้อมูลการยืม"
 *       })).setMimeType(ContentService.MimeType.JSON);
 *     }
 * 
 *     else {
 *       throw new Error("Action ไม่ถูกต้อง");
 *     }
 * 
 *   } catch (err) {
 *     return ContentService.createTextOutput(JSON.stringify({
 *       status: "error",
 *       message: err.toString()
 *     })).setMimeType(ContentService.MimeType.JSON);
 *   } finally {
 *     lock.releaseLock();
 *   }
 * }
 * 
 * 
 * 
 * // 📌 Monthly Summary
 * function addPlayerCountToMonthlySummary(month, year, playerCount) {
 *   const ss = SpreadsheetApp.getActive();
 *   const summarySheet = ss.getSheetByName("Monthly Summary");
 * 
 *   if (!summarySheet) return;
 * 
 *   const lastRow = summarySheet.getLastRow();
 *   const data = summarySheet.getRange(2, 1, lastRow - 1, 5).getValues();
 * 
 *   for (let i = 0; i < data.length; i++) {
 *     const rowMonth = data[i][0];
 *     const rowYear = data[i][4];
 * 
 *     if (rowMonth == month && Number(rowYear) == Number(year)) {
 * 
 *       let oldValue = data[i][1];
 *       if (!oldValue || isNaN(oldValue)) oldValue = 0;
 * 
 *       const newValue = Number(oldValue) + Number(playerCount);
 * 
 *       summarySheet.getRange(i + 2, 2).setValue(newValue);
 *       return;
 *     }
 *   }
 * }
 */
