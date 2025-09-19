import { ReceiptMainType } from './ReceiptTypes';
import { ESC_COMMANDS } from './ReceiptUtils';

// 영수증 하단 메시지 컴포넌트
export const BottomMessage: ({ message }: { message: any }) => string = ({ message }) => {
  let details = `${ESC_COMMANDS.INITIALIZE}${ESC_COMMANDS.ALIGN_CENTER}`;
  details += `==========================================\n`;
  details += `${ESC_COMMANDS.ALIGN_LEFT}${message}\n`;
  return details;
};

// 영수증 푸터 컴포넌트
export const Footer: () => string = () => {
  let details = `${ESC_COMMANDS.INITIALIZE}`;
  details += `${'\n'.repeat(9)}`;
  details += `${ESC_COMMANDS.FULL_CUT}`;
  return details;
};

// 영수증 헤더 컴포넌트
export const Header: ({ isReissue, orderNumber, date }: { isReissue: any; orderNumber: any; date: any }) => string = ({ isReissue, orderNumber, date }) => {
  const reissueText = isReissue ? ' (재발행)' : '';
  const leftPart = `${orderNumber}${reissueText}`;
  const totalWidth = 40;
  const spaces = ' '.repeat(Math.max(1, totalWidth - leftPart.length - date.length));
  return `${leftPart}${spaces}${date}\n${'='.repeat(totalWidth)}\n`;
};

// 영수증 메인 타입 컴포넌트
export const Maintype: ({ mainType }: { mainType: ReceiptMainType }) => string = ({ mainType }) => {
  let details = ESC_COMMANDS.INITIALIZE;
  details += `${mainType}\n`;
  details += `==========================================\n`;
  return details;
};

// QR 코드 컴포넌트
export const QRCode: ({ qrCodeImageUrl }: { qrCodeImageUrl: any }) => string = ({ qrCodeImageUrl }) => {
  const convertImageUrlToPrinterCommand = (url: string): string => {
    let details = `${ESC_COMMANDS.INITIALIZE}`;
    details += ESC_COMMANDS.ALIGN_CENTER;
    details += '\x1D\x76\x30\x00';
    details += '\xC8\x00\xC8\x00';
    details += `${ESC_COMMANDS.LINE_FEED}`;
    return details;
  };
  return convertImageUrlToPrinterCommand(qrCodeImageUrl);
};

// 소매처 정보 컴포넌트
export const Retailer: ({ message }: { message: any }) => string = ({ message }) => {
  let details = ESC_COMMANDS.INITIALIZE;
  details += ESC_COMMANDS.ALIGN_RIGHT;
  details += `${message} 귀하`;
  details += ESC_COMMANDS.LINE_FEED;
  return details;
};

// 상점 정보 컴포넌트
export const StoreInfo: ({ message }: { message: any }) => string = ({ message }) => {
  let details = ESC_COMMANDS.INITIALIZE;
  details += ESC_COMMANDS.LINE_FEED;
  details += ESC_COMMANDS.ALIGN_CENTER;
  details += `${message}`;
  details += ESC_COMMANDS.LINE_FEED;
  return details;
};

// 영수증 서브 타입 컴포넌트
export const SubType: ({ subType }: { subType: any }) => string = ({ subType }) => {
  let details = ESC_COMMANDS.INITIALIZE;
  details += `==========================================`;
  details += ESC_COMMANDS.LINE_FEED;
  details += `${subType}`;
  details += ESC_COMMANDS.LINE_FEED;
  details += `==========================================`;
  details += ESC_COMMANDS.LINE_FEED;
  return details;
};

// 영수증 상단 메시지 컴포넌트
export const TopMessage: ({ message }: { message: any }) => string = ({ message }) => {
  let details = ESC_COMMANDS.INITIALIZE;
  details += ESC_COMMANDS.ALIGN_CENTER;
  details += ESC_COMMANDS.LINE_FEED;
  details += message;
  details += ESC_COMMANDS.LINE_FEED;
  details += ESC_COMMANDS.LINE_FEED;
  details += ESC_COMMANDS.ALIGN_LEFT;
  return details;
};

// 거래 내역 컴포넌트
export const TransactionDetails: ({ items, total }: { items: any; total: any }) => string = ({ items, total }) => {
  console.log('details ==============================>');

  let details = `${ESC_COMMANDS.INITIALIZE}${ESC_COMMANDS.ALIGN_LEFT}`;
  details += `${ESC_COMMANDS.FONT_NORMAL}품명                 단가    수량    금액\n`;
  details += `${ESC_COMMANDS.FONT_NORMAL}------------------------------------------\n`;
  console.log('details ==>', details);
  items.forEach((item: any) => {
    details += `${item.name.padEnd(3)}`;
    details += ESC_COMMANDS.LINE_FEED;
    details += `${item.price.toString().padStart(25)} ${item.orderAmt.toString().padStart(7)} ${(item.price * item.orderAmt).toString().padStart(7)}\n`;
  });
  details += `${ESC_COMMANDS.FONT_NORMAL}------------------------------------------\n`;
  details += `${ESC_COMMANDS.FONT_NORMAL}${ESC_COMMANDS.BOLD_ON}판매소계:${total.toString().padStart(30)}${ESC_COMMANDS.BOLD_OFF}\n`;
  return details;
};
