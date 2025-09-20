import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
// QRCodeComponent는 value와 size를 props로 받습니다.
const QRCode = ({ value, size }: { value: string; size?: number }) => {
  return (
    <div className={'qrCodeImg'}>
      {/*<h2>QR 코드 생성</h2>*/}
      <QRCodeSVG value={value} />
    </div>
  );
};
export default QRCode;
