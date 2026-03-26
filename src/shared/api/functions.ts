import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

/**
 * Cloud Functions 호출 범용 래퍼
 */
export const callFunction = async <TIn = any, TOut = any>(
  name: string,
  data: TIn
): Promise<{ data: TOut | null; error: string | null }> => {
  try {
    const callable = httpsCallable<TIn, TOut>(functions, name);
    const result = await callable(data);
    return { data: result.data, error: null };
  } catch (error: any) {
    console.error(`[Functions Error: ${name}]`, error);
    return { 
      data: null, 
      error: error.message || '알 수 없는 오류가 발생했습니다.' 
    };
  }
};

/**
 * 전용 함수 호출들
 */
export const api = {
  // 장비 체크인/아웃
  checkin: (data: { scheduleId: string; nfcTagId: string; photoUrl?: string }) => 
    callFunction('checkinEquipment', data),
  
  checkout: (data: { scheduleId: string; nfcTagId: string; workLogs: string }) => 
    callFunction('checkoutEquipment', data),

  // NFC 태그 등록
  registerNfc: (data: { equipmentId: string; nfcTagId: string }) => 
    callFunction('registerNfcTag', data),

  // 로그 조회
  getBriefLogs: (data: { equipmentId: string }) => 
    callFunction('getEquipmentBriefLogs', data),
};
