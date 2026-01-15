
import { BorrowerInfo } from '../types';

// สำคัญ: ต้องเป็น URL จากการ Deploy ล่าสุด (Deploy -> New Deployment -> Anyone)
const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbzy0OM3fCiUy7yIG8r5jD9QeyaJzkJy1M3xkLfdkqHbf59S2e6qS8hlk2hq1Hzzs2ofdw/exec';

interface ApiResponse {
  status: 'success' | 'not_found' | 'error' | 'blocked' | 'borrowed' | 'available';
  message?: string;
  items?: any[];
}

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * ดึงข้อมูลผู้ยืมทั้งหมด (เฉพาะที่กำลังยืม)
 */
export const fetchBorrowedItems = async (): Promise<ServiceResponse> => {
  try {
    const response = await fetch(`${GOOGLE_SHEET_API_URL}?action=get_borrowed`, {
      method: 'GET',
      mode: 'cors',
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result: ApiResponse = await response.json();
    if (result.status === 'success') {
      return { success: true, data: result.items || [] };
    }
    return { success: false, message: result.message || 'ไม่พบรายการที่ยืม' };
  } catch (error) {
    console.error('❌ Error fetching from Google Sheet:', error);
    return { 
      success: false, 
      message: 'ไม่สามารถดึงข้อมูลได้' 
    };
  }
};

/**
 * ดึงประวัติการทำรายการทั้งหมด (Checklist)
 */
export const fetchAllTransactions = async (): Promise<ServiceResponse> => {
  try {
    const response = await fetch(`${GOOGLE_SHEET_API_URL}?action=get_all_transactions`, {
      method: 'GET',
      mode: 'cors',
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result: ApiResponse = await response.json();
    if (result.status === 'success') {
      return { success: true, data: result.items || [] };
    }
    return { success: false, message: result.message || 'ไม่พบประวัติการทำรายการ' };
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    return { success: false, message: 'ไม่สามารถดึงประวัติได้' };
  }
};

export const recordBorrowing = async (borrowerInfo: BorrowerInfo): Promise<ServiceResponse> => {
  try {
    const results = [];
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
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      
      const resData: ApiResponse = await response.json();
      results.push(resData);
    }
    
    const anyBlocked = results.some(r => r.status === 'blocked');
    const allSuccess = results.every(r => r.status === 'success');

    if (anyBlocked) return { success: false, message: 'บอร์ดเกมบางรายการถูกคนอื่นยืมตัดหน้าไปแล้ว' };
    return { success: allSuccess, message: allSuccess ? 'บันทึกสำเร็จ' : 'บางรายการบันทึกล้มเหลว' };
  } catch (error) {
    console.error('❌ Error recording borrow:', error);
    return { success: false, message: 'ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง' };
  }
};

export const recordReturn = async (studentId: string, gameName: string): Promise<ServiceResponse> => {
  try {
    const payload = { 
      action: 'return', 
      Student_ID: studentId.trim(), 
      Board_Game: gameName 
    };
    
    const response = await fetch(GOOGLE_SHEET_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    
    const result: ApiResponse = await response.json();
    return { success: result.status === 'success', message: result.message };
  } catch (error) {
    console.error('❌ Error recording return:', error);
    return { success: false, message: 'การเชื่อมต่อขัดข้อง ไม่สามารถแจ้งคืนได้' };
  }
};
