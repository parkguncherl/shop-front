import { ReceiptData } from './ReceiptTypes';
import * as ReceiptComponents from './ReceiptComponents';

// ESC/POS 명령어 정의
export const ESC_COMMANDS = {
  INITIALIZE: '\x1B\x40', // 프린터 초기화
  ALIGN_LEFT: '\x1B\x61\x00', // 왼쪽 정렬
  ALIGN_CENTER: '\x1B\x61\x01', // 가운데 정렬
  ALIGN_RIGHT: '\x1B\x61\x02', // 오른쪽 정렬
  FONT_NORMAL: '\x1D\x21\x00', // 일반 폰트
  BOLD_ON: '\x1B\x45\x01', // 굵은 글씨 켜기
  BOLD_OFF: '\x1B\x45\x00', // 굵은 글씨 끄기
  LINE_FEED: '\x0A', // 줄바꿈
  FULL_CUT: '\x1D\x56\x00', // 용지 완전 절단
};

/**
 * 영수증 데이터를 생성하는 함수
 * @param {ReceiptData} data - 영수증 데이터
 * @returns {Promise<string>} 생성된 영수증 문자열
 */
export async function createReceiptData(data: ReceiptData): Promise<string> {
  let receipt = '';

  receipt += ReceiptComponents.Maintype({ mainType: data.mainType });
  if (data.retailer) {
    receipt += ReceiptComponents.Retailer({ message: data.retailer });
  }
  receipt += ReceiptComponents.Header({
    isReissue: data.isReissue,
    orderNumber: data.orderNumber,
    date: data.date,
  });
  if (data.qrCodeData) {
    try {
      const qrCodeImageUrl = await fetchReceiptQRCodeImageUrl(data.qrCodeData);
      receipt += ReceiptComponents.QRCode({ qrCodeImageUrl });
    } catch (error) {
      console.error('QR 코드가 없습니다', error);
      receipt += `${ESC_COMMANDS.ALIGN_CENTER}QR 코드가 없습니다\n`;
    }
  }
  if (data.storeInfo) {
    receipt += ReceiptComponents.StoreInfo({ message: data.storeInfo });
  }
  if (data.topMessage) {
    receipt += ReceiptComponents.TopMessage({ message: data.topMessage });
  }
  if (data.subType) {
    receipt += ReceiptComponents.SubType({ subType: data.subType });
  }
  if (data.items && data.items.length > 0) {
    receipt += ReceiptComponents.TransactionDetails({ items: data.items, total: data.total });
  }
  if (data.bottomMessage) {
    receipt += ReceiptComponents.BottomMessage({ message: data.bottomMessage });
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  receipt += ReceiptComponents.Footer();

  return receipt;
}

/**
 * QR 코드 이미지 URL을 가져오는 함수
 * @param {string} data - QR 코드에 포함될 데이터
 * @returns {Promise<string>} QR 코드 이미지 URL
 */
async function fetchReceiptQRCodeImageUrl(data: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const url = new URL('/api/receipt/qrCode', baseUrl);
  url.searchParams.append('data', data);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch QR code: ${response.statusText}`);
  }
  const result = await response.json();
  return result.qrCodeDataUrl;
}

/**
 * 영수증 출력 함수
 * @param {ReceiptData} receiptData - 영수증 데이터
 * @returns {Promise<void>}
 */
export async function printReceipt(receiptData: ReceiptData): Promise<void> {
  try {
    const response = await fetch('/api/receipt/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ receiptData }),
    });

    if (!response.ok) {
      throw new Error('Failed to print receipt');
    }

    const result = await response.json();
    console.log(result.message);
  } catch (error) {
    console.error('Failed to print receipt:', error);
    throw error;
  }
}
