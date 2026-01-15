
import { BorrowerInfo } from '../types';

// หมายเหตุ: ตรวจสอบให้แน่ใจว่าได้ Deploy Google Apps Script เป็น "Anyone" และใช้ URL ล่าสุดที่ได้จากการ Deploy
const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycby_BgOS0nvxRP1x3sjKDgic4jIez8_zZawKRA7kOQXGKp6ySzGhDI-pKg_kKexx6x3DJw/exec';

interface ApiResponse {
  status: 'success' | 'not_found' | 'error';
  message?: string;
  items?: any[];
}

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * ดึงรายการบอร์ดเกมที่ยังไม่คืน
 * ปรับเป็น POST เพื่อเลี่ยงปัญหา CORS ในบางเบราว์เซอร์
 */
export const fetchBorrowedItems = async (): Promise<ServiceResponse> => {
  try {
    const response = await fetch(GOOGLE_SHEET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'get_borrowed' }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse = await response.json();
    if (result.status === 'success') {
      return { success: true, data: result.items || [] };
    }
    return { success: false, message: result.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' };
  } catch (error) {
    console.error('❌ Error fetching from Google Sheet:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (Network Error)' 
    };
  }
};

/**
 * บันทึกการยืม
 */
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
    
    const allSuccess = results.every(r => r.status === 'success');
    return { 
      success: allSuccess, 
      message: allSuccess ? 'บันทึกสำเร็จ' : 'บางรายการบันทึกล้มเหลว' 
    };
  } catch (error) {
    console.error('❌ Error recording borrow:', error);
    return { success: false, message: 'ไม่สามารถส่งข้อมูลได้ กรุณาตรวจสอบอินเทอร์เน็ต' };
  }
};

/**
 * บันทึกการคืน
 */
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
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const result: ApiResponse = await response.json();
    return { success: result.status === 'success', message: result.message };
  } catch (error) {
    console.error('❌ Error recording return:', error);
    return { success: false, message: 'การเชื่อมต่อขัดข้อง ไม่สามารถแจ้งคืนได้' };
  }
};
