// TypeScript 타입 정의
interface ServerURL {
  url: string;
}

interface Callback {
  (result: string, ...args: any[]): void;
}

// 전역 변수
const localAddress = '//127.0.0.1:18080/WebPrintSDK/';
const connectionMode = 'http:';
let wsPrint: WebSocketPrint | null = null;

// WebSocketPrint 클래스
export class WebSocketPrint {
  private websocket: WebSocket | undefined;
  private connectedSocket = false;
  private callback: Callback;
  private request: string;

  constructor(serverURL: string, strPrinterName: string, request: string, callback: Callback) {
    this.request = request;
    this.callback = callback;
    this.initWebSocket(serverURL + strPrinterName + request);
  }

  private onMessage = (msg: MessageEvent): void => {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      const res = JSON.parse(msg.data);
      const ret = res.Result;
      const responseID = res.ResponseID;

      if (this.request === '/requestMSRData') {
        const { Track1, Track2, Track3 } = res;
        this.callback(ret, Track1, Track2, Track3);
      } else {
        this.callback(`${responseID}:${ret}`);
      }
    } else {
      this.callback(msg.data);
    }
  };

  private onClose = (): void => {
    if (!this.connectedSocket) {
      this.callback('Cannot connect to server');
    }
    this.websocket?.close();
    this.connectedSocket = false;
    wsPrint = null;
  };

  private initWebSocket(uri: string): void {
    this.websocket = new WebSocket(uri);
    this.websocket.onopen = () => console.log(`open : ${uri}`);
    this.websocket.onerror = () => {
      if (this.websocket?.readyState === WebSocket.CLOSED) {
        this.callback('Cannot connect to server');
      }
    };
    this.websocket.onmessage = this.onMessage;
    this.websocket.onclose = this.onClose;
  }

  public send(data: string): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(data);
    } else {
      this.websocket!.onopen = () => {
        if (this.websocket?.readyState === WebSocket.OPEN) {
          this.websocket.send(data);
          this.connectedSocket = true;
        }
      };
    }
  }
}

// 함수들
export function toHexBinary(s: string): string {
  return Array.from(s)
    .map((char) => `0${char.charCodeAt(0).toString(16)}`.slice(-2))
    .join('');
}

export function makeResultInquiryData(requestId: number, responseId: string, timeout: number): string {
  return JSON.stringify({
    RequestID: requestId,
    ResponseID: responseId,
    Timeout: timeout,
  });
}

// 프린트 요청
export function requestPrint(strPrinterName: string, strSubmit: string, callback: Callback): void {
  callback('');
  const serverURL = getServerURL().url;

  // @ts-ignore
  if (connectionMode === 'ws:' || connectionMode === 'wss:') {
    if (!wsPrint) {
      wsPrint = new WebSocketPrint(serverURL, strPrinterName, '', callback);
    }
    wsPrint.send(strSubmit);
  } else {
    const requestURL = `${serverURL}${strPrinterName}`;
    const xmlHttpReq = new XMLHttpRequest();

    console.log('프린트 요청 전문 >>', {
      requestURL: requestURL,
      printerName: strPrinterName,
      strSubmit: JSON.stringify(strSubmit),
    });

    xmlHttpReq.open('POST', requestURL, true);
    // xmlHttpReq.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    xmlHttpReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xmlHttpReq.send(strSubmit);

    xmlHttpReq.onreadystatechange = function () {
      if (xmlHttpReq.readyState == 4 && xmlHttpReq.status == 200) {
        const res = JSON.parse(xmlHttpReq.responseText);
        const ret = res.Result;

        console.log('프린트 요청 응답전문 >>', {
          res: res,
          ret: res.Result,
        });
        if (ret.includes('ready') || ret.includes('progress')) {
          checkResult('POST', strPrinterName, res.RequestID, res.ResponseID, callback);
        } else if (ret.includes('duplicated')) {
          callback(res.Result);
        }
      } else if (xmlHttpReq.status === 404) {
        callback('No printers');
      } else {
        callback('Cannot connect to server');
      }
    };
  }
}

export function requestMSRData(strPrinterName: string, timeout: number, callback: Callback): void {
  const serverURL = getServerURL().url;
  const inquiryData = JSON.stringify({ Timeout: timeout });

  // @ts-ignore
  if (connectionMode === 'ws:' || connectionMode === 'wss:') {
    if (!wsPrint) {
      wsPrint = new WebSocketPrint(serverURL, strPrinterName, '/requestMSRData', callback);
    }
    wsPrint.send(inquiryData);
  } else {
    const requestURL = `${serverURL}${strPrinterName}/requestMSRData`;
    const xmlHttpCheck = new XMLHttpRequest();

    xmlHttpCheck.open('POST', requestURL, true);
    xmlHttpCheck.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xmlHttpCheck.send(inquiryData);

    xmlHttpCheck.onreadystatechange = function () {
      if (xmlHttpCheck.readyState === XMLHttpRequest.DONE) {
        if (xmlHttpCheck.status === 200) {
          const res = JSON.parse(xmlHttpCheck.responseText);
          const { Track1, Track2, Track3 } = res;
          callback(res.Result, Track1, Track2, Track3);
        } else if (xmlHttpCheck.status === 404) {
          callback('No printers');
        } else {
          callback('Cannot connect to server');
        }
      }
    };
  }
}

// 프린트 결과 요청
export function checkResult(method: string, strPrinterName: string, requestId: number, responseId: string, callback: Callback): void {
  const serverURL = getServerURL().url;
  const requestURL = `${serverURL}${strPrinterName}/checkStatus`;
  const inquiryData = makeResultInquiryData(requestId, responseId, 30);

  const xmlHttpCheck = new XMLHttpRequest();

  console.log('프린트 결과 요청 전문 >>', {
    inquiryData: inquiryData,
  });

  xmlHttpCheck.open(method, requestURL, true);
  // xmlHttpCheck.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
  xmlHttpCheck.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

  xmlHttpCheck.send(inquiryData);

  xmlHttpCheck.onreadystatechange = function () {
    if (xmlHttpCheck.readyState === XMLHttpRequest.DONE) {
      if (xmlHttpCheck.status === 200) {
        try {
          const res = JSON.parse(xmlHttpCheck.responseText);
          const ret = res.Result;

          console.log('프린트 결과 응답 전문 >>', xmlHttpCheck.responseText);

          if (ret.includes('ready') || ret.includes('progress')) {
            checkResult(method, strPrinterName, requestId, responseId, callback);
          } else {
            callback(`${res.ResponseID}:${ret}`);
          }
        } catch (error) {
          console.error('JSON parse error:', error);
          callback('Cannot parse server response');
        }
      } else if (xmlHttpCheck.status === 404) {
        callback('No printers');
      } else {
        callback('Cannot connect to server');
      }
    }
  };
}

export function getServerURL(): ServerURL {
  return { url: `${connectionMode}${localAddress}` };
}

export function getBrowser(): { name: string; version: string } {
  const ua = navigator.userAgent;
  const tem: RegExpExecArray | null = null;
  const M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if (/trident/i.test(M[1])) {
    const rv = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return { name: 'IE', version: rv[1] || '' };
  }
  if (M[1] === 'Chrome') {
    const opr = ua.match(/\bOPR|Edge\/(\d+)/);
    if (opr) return { name: 'Opera', version: opr[1] };
  }
  return { name: M[1] || navigator.appName, version: M[2] || '0' };
}

export function isEmpty(data: any): boolean {
  return data === undefined || data === null || data === '';
}
