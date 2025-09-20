import { useState } from 'react';
import { ReceiptData } from './ReceiptTypes';
import { printReceipt } from './ReceiptUtils';

export const usePrintReceipt = () => {
  const [printStatus, setPrintStatus] = useState<string>('');

  const handlePrint = async (receiptData: ReceiptData) => {
    try {
      await printReceipt(receiptData);
      setPrintStatus('영수증 출력 성공!');
      return true;
    } catch (error: unknown) {
      console.error('Detailed client error:', error);
      if (error instanceof Error) {
        setPrintStatus(`영수증 출력 실패: ${error.message}`);
      } else {
        setPrintStatus('영수증 출력 실패: 알 수 없는 오류가 발생했습니다.');
      }
      return false;
    }
  };

  return { handlePrint, printStatus };
};
