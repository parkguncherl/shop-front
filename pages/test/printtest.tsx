import React, { useEffect, useRef, useState } from 'react';
import {
  checkLabelStatus,
  clearBuffer,
  directDrawText,
  draw1DBarcode,
  drawBitmap,
  drawBlock,
  drawDeviceFont,
  drawQRCode,
  drawTrueTypeFont,
  drawVectorFont,
  getLabelData,
  printBuffer,
  setAutoCutter,
  setLabelId,
  setLength,
  setWidth,
} from '../../components/print/BixolonLabel';
import { requestPrint } from '../../components/print/BixolonSdkApiCommon';
import { Button } from 'antd';
import { el } from 'date-fns/locale';
import { len } from 'zrender/lib/core/vector';
import * as https from 'node:https';

/**
 * Bixolon Printer 테스트
 *
 * WebPrintSDK App 요청 URL
 * http://127.0.0.1:18080/WebPrintSDK/
 *
 */

interface SellerInfo {
  partnerLogo: string;
  parnerQrCode: string;
  sellerName: string;
  sellerAddr: string;
  sellerSns: string;
}

const BixolonLabelPrintTest = () => {
  const [result, setResult] = useState(null);
  const [printLogicalNm, setPrintLogicalNm] = useState('XD5'); // 프린트 논리이름 (SDK 설치시 사용한 이름)
  const [issueId, setIssueId] = useState(1);
  const canvasWidth = 4 * 96; // 4인치 픽셀크기
  const canvasHeight = 6 * 96; // 6인치 픽셀크기

  const [sellerInfo, setSellerInfo] = useState<SellerInfo>();

  useEffect(() => {
    setSellerInfo({
      partnerLogo:
        'data:image/png;base64,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',
      parnerQrCode: 'https://u.wechat.com/IF1szN5xuz5qsXzMXruo2z4',
      sellerName: '경주 어나더  (경주점)',
      sellerAddr: '프릴몬드 THE OT 1F, A-24 Tel 02 2117 4524 H.P 010 1111 2222',
      sellerSns: 'KakaoTalk ID + FRILLMOND Wechat ID _ FRILLMOND24',
    });
  }, []);

  const handlePrintLabel = async () => {
    // 4x6인치 라벨지 기준 샘플

    setLabelId(issueId); // 중복 요청 처리 기능을 사용시 이 함수를 사용해야 한다. (Optional)
    setAutoCutter(true, 1); //자동커팅기능설정
    checkLabelStatus(); // 프린터의 상태를 체크합니다. 프린터가 에러상태인 경우 이후에 호출한 함수는 처리되지 않는다.
    clearBuffer(); // 프린터 버퍼를 초기화 합니다.
    setWidth(812); // = 4inch x 203 DPI  (dot단위)

    // 테두리 사각형
    drawBlock(20, 20, 800, 1200, 'B', 10);

    //파트너 로고
    drawBitmap(sellerInfo?.partnerLogo as string, 700, 100, 55, false);
    //drawVectorFont(' A N N E ', 750, 100, 'K', 80, 80, 0, true, true, false, 1, 0, false);
    //소매처 명
    const sellerNameArr = splitString(sellerInfo?.sellerName as string, 7);
    let num = 1;
    sellerNameArr.forEach((sellerName) => {
      if (num === 1) {
        drawVectorFont(sellerName as string, 600, 100, 'K', 150, 170, -3, true, false, false, 1, 0, false);
      } else if (num === 2) {
        drawVectorFont(sellerName as string, 400, 100, 'K', 150, 170, -3, true, false, false, 1, 0, false);
      }
      num++;
    });
    drawVectorFont(sellerInfo?.sellerAddr as string, 120, 100, 'K', 27, 27, 0, true, false, false, 1, 0, false);
    drawVectorFont(sellerInfo?.sellerSns as string, 80, 100, 'K', 27, 27, 0, true, false, false, 1, 0, false);
    drawQRCode(sellerInfo?.parnerQrCode as string, 200, 1000, 1, 'H', 4, 1);

    // drawVectorFont(' FRILLMOND ', 750, 100, 'K', 80, 80, 0, true, true, false, 1, 0, false);
    // drawVectorFont('일산 예솔 소매처', 600, 100, 'K', 150, 170, -3, true, false, false, 1, 0, false);
    // drawVectorFont('(동대문 매장)', 400, 100, 'K', 150, 170, -3, true, false, false, 1, 0, false);
    // drawVectorFont('프릴몬드 THE OT 1F, A-24 Tel 02 2117 4524 H.P 010 1111 2222', 120, 100, 'K', 27, 27, 0, true, false, false, 1, 0, false);
    // drawVectorFont('KakaoTalk ID + FRILLMOND Wechat ID _ FRILLMOND24', 80, 100, 'K', 27, 27, 0, true, false, false, 1, 0, false);
    // drawQRCode('https://u.wechat.com/IF1szN5xuz5qsXzMXruo2z4', 200, 1000, 1, 'H', 4, 1);

    // 이미지 Base64 데이타 출력 샘플
    // const imgData =
    //   'data:image/gif;base64,R0lGODlhAAEAAcQAALe9v9ve3/b393mDiJScoO3u74KMkMnNz4uUmKatsOTm552kqK+1uNLW18DFx3B7gP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4wLWMwNjAgNjEuMTM0Nzc3LCAyMDEwLzAyLzEyLTE3OjMyOjAwICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjAxODAxMTc0MDcyMDY4MTE5QjEwQjYyNTc4MkUxRURBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjEzN0VEMDZBQjMyNzExRTE4REMzRUZGMkFCOTM1NkZBIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjEzN0VEMDY5QjMyNzExRTE4REMzRUZGMkFCOTM1NkZBIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzUgTWFjaW50b3NoIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MDI4MDExNzQwNzIwNjgxMTlCMTBCNjI1NzgyRTFFREEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MDE4MDExNzQwNzIwNjgxMTlCMTBCNjI1Nzgy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';
    // drawBitmap(imgData, 30, 50, 400, false);
    // // QR code 출력 샘플
    // drawQRCode('http://www.naver.com', 40, 550, 0, 'L', 4, 0);

    printBuffer(); // 프린트 버퍼에 있는 데이터를 출력

    // 앞에 함수로 인해 생성된 Json data를 가져옵니다.
    const strSubmit = getLabelData();
    console.log(strSubmit);

    /**
     * 라벨 JSON 데이타 구조
     *
     * {
     *   "id":1, //setId function
     *   "functions":{  //printing function
     *     "func1":{"function name":[func1 parameters]},
     *     "func2":{"function name":[func2 parameters]},
     *     ....
     *     "funcN":{"function name":[funcN parameters]},
     *   }
     * }
     */

    setIssueId(issueId + 1);

    requestPrint(printLogicalNm, strSubmit, viewResult); // 프린트 요청
  };

  // 프린트 결과 callBack 함수
  const viewResult = (result: any) => {
    setResult(result);
  };

  const splitString = (str: string, chunkSize: number) => {
    const result = [];
    for (let i = 0; i < str.length; i += chunkSize) {
      result.push(str.slice(i, i + chunkSize));
    }
    return result;
  };

  document.querySelector('#myDiv')?.addEventListener('mousemove', function (event) {
    const x = event.offsetX;
    const y = event.offsetY;
    document.querySelector('#myDiv').innerText = 'x 좌표:' + x + 'y 좌표:' + y;
  });

  const testPrint = async () => {
    let i = 0;
    for (i = 0; i < 3; i++) {
      handlePrintLabel();
    }
  };

  return (
    <div>
      <button onClick={() => testPrint()}>Bixolon 라벨 프린트 테스트 </button>
      {result && <div style={{ marginTop: '10px', color: 'blue' }}>프린트 결과응답: {result}</div>}

      <div style={{ marginTop: '30px' }}>
        <h3>Bixolon Label 좌표체크 (요소안에 마우스오버)</h3>
        <div id="myDiv" style={{ width: canvasWidth, height: canvasHeight, border: '1px solid gray', textAlign: 'center' }}></div>
      </div>
    </div>
  );
};

export default BixolonLabelPrintTest;
