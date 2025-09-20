import { NextApiRequest, NextApiResponse } from 'next';
import { createReceiptData } from './ReceiptUtils';

// SerialPort와 iconv 모듈을 서버 사이드에서만 불러옵니다.
let SerialPort: any;
let iconv: any;

if (typeof window === 'undefined') {
  SerialPort = require('serialport').SerialPort;
  iconv = require('iconv-lite');
}

// 프린터 정보 인터페이스 정의
export interface PrinterInfo {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  productId?: string;
  vendorId?: string;
}

/**
 * 로컬 스토리지에서 저장된 프린터 정보를 가져오는 함수
 * @returns {PrinterInfo | null} 저장된 프린터 정보 또는 null
 */
function getSavedPrinterInfo(): PrinterInfo | null {
  if (typeof window !== 'undefined') {
    const savedInfo = localStorage.getItem('selectedPrinterInfo');
    return savedInfo ? JSON.parse(savedInfo) : null;
  }
  return null;
}

/**
 * 프린터 정보를 로컬 스토리지에 저장하는 함수
 * @param {PrinterInfo} printerInfo - 저장할 프린터 정보
 */
function savePrinterInfo(printerInfo: PrinterInfo): void {
  console.log('aaa', printerInfo);

  if (typeof window !== 'undefined') {
    localStorage.setItem('selectedPrinterInfo', JSON.stringify(printerInfo));
  }
}

/**
 * 프린터 정보를 자동으로 감지하고 저장하는 함수
 * @returns {Promise<PrinterInfo | null>} 감지된 프린터 정보 또는 null
 */
async function autoDetectAndSavePrinterInfo(): Promise<PrinterInfo | null> {
  try {
    const ports = await SerialPort.list();
    console.log('Available ports:', ports);

    const comPorts = ports
      .filter((port: any) => port.path.toLowerCase().startsWith('com'))
      .sort((a: any, b: any) => {
        const aNum = parseInt(a.path.toLowerCase().replace('com', ''));
        const bNum = parseInt(b.path.toLowerCase().replace('com', ''));
        return aNum - bNum;
      });

    if (comPorts.length > 0) {
      const selectedPort = comPorts[0];
      const printerInfo: PrinterInfo = {
        path: selectedPort.path,
        manufacturer: selectedPort.manufacturer,
        serialNumber: selectedPort.serialNumber,
        pnpId: selectedPort.pnpId,
        locationId: selectedPort.locationId,
        productId: selectedPort.productId,
        vendorId: selectedPort.vendorId,
      };
      console.log('Detected printer info:===', printerInfo);
      savePrinterInfo(printerInfo);
      return printerInfo;
    } else {
      console.log('No COM ports detected');
      return null;
    }
  } catch (error) {
    console.error('프린터 정보 자동 감지 중 오류 발생:', error);
    return null;
  }
}

/**
 * 프린터 정보를 가져오거나 자동 감지하는 함수
 * @returns {Promise<PrinterInfo | null>} 프린터 정보 또는 null
 */
async function getOrDetectPrinterInfo(): Promise<PrinterInfo | null> {
  const savedInfo = getSavedPrinterInfo();
  if (savedInfo) {
    console.log('Using saved printer info:', savedInfo);
    return savedInfo;
  }
  const detectedInfo = await autoDetectAndSavePrinterInfo();
  console.log('Newly detected and saved printer info:', detectedInfo);
  return detectedInfo;
}

/**
 * 프린터 포트를 여는 함수
 * @param {string} portPath - 열고자 하는 프린터 포트 경로
 * @returns {Promise<any>} 열린 프린터 포트 객체
 */
async function openReceiptPrinterPort(portPath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const port = new SerialPort({
      path: portPath,
      baudRate: 9600,
      autoOpen: false,
    });

    port.open((err: any) => {
      if (err) {
        console.error(`Error opening port ${portPath}:`, err);
        reject(new Error(`포트 ${portPath}를 열 수 없습니다: ${err.message}`));
      } else {
        console.log(`Successfully opened port ${portPath}`);
        resolve(port);
      }
    });
  });
}

/**
 * 프린터에 데이터를 쓰는 함수
 * @param {any} port - 열린 프린터 포트 객체
 * @param {string} data - 출력할 데이터
 * @returns {Promise<void>}
 */
async function writeToReceiptPrinter(port: any, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const eucKRBuffer = iconv.encode(data, 'euc-kr');
    port.write(eucKRBuffer, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * 프린터 포트를 닫는 함수
 * @param {any} port - 열린 프린터 포트 객체
 * @returns {Promise<void>}
 */
async function closeReceiptPrinterPort(port: any): Promise<void> {
  return new Promise((resolve, reject) => {
    port.close((err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * 자동 감지된 프린터로 출력하는 함수
 * @param {string} receiptData - 출력할 영수증 데이터
 * @returns {Promise<void>}
 */
async function printToDetectedPrinter(receiptData: string): Promise<void> {
  const printerInfo = await getOrDetectPrinterInfo();
  if (!printerInfo) {
    throw new Error('프린터를 찾을 수 없습니다.');
  }

  console.log('Attempting to print using printer:', printerInfo);
  let port;
  try {
    port = await openReceiptPrinterPort(printerInfo.path);
    console.log('Port opened successfully');

    console.log('Writing data to printer...');
    await writeToReceiptPrinter(port, receiptData);
    console.log('Data written successfully');
  } catch (error) {
    console.error('Error during printing process:', error);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    throw new Error(`프린터 작업 중 오류 발생: ${error.message}`);
  } finally {
    if (port) {
      console.log('Closing printer port');
      try {
        await closeReceiptPrinterPort(port);
        console.log('Printer port closed successfully');
      } catch (closeError) {
        console.error('Error closing printer port:', closeError);
      }
    }
  }
}

/**
 * API 라우트 핸들러
 * @param {NextApiRequest} req - Next.js API 요청 객체
 * @param {NextApiResponse} res - Next.js API 응답 객체
 */
export async function handlePrinterApiRoute(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { receiptData } = req.body;
      const receiptString = await createReceiptData(receiptData);
      await printToDetectedPrinter(receiptString);
      res.status(200).json({ message: 'Receipt printed successfully' });
    } catch (error: any) {
      console.error('Detailed error:', error);
      res.status(500).json({ error: `Failed to print receipt: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
