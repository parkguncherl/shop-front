import { SerialPort } from 'serialport';
import iconv from 'iconv-lite';

interface PrinterInfo {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  productId?: string;
  vendorId?: string;
}

export class PrinterService {
  private static instance: PrinterService;

  private constructor() {
    console.log('PrinterService instance created');
  }

  public static getInstance(): PrinterService {
    if (!PrinterService.instance) {
      PrinterService.instance = new PrinterService();
    }
    return PrinterService.instance;
  }

  async getOrDetectPrinterInfo(): Promise<PrinterInfo | null> {
    const savedInfo = this.getSavedPrinterInfo();
    if (savedInfo) {
      console.log('Using saved printer info:', savedInfo);
      return savedInfo;
    }
    const detectedInfo = await this.autoDetectAndSavePrinterInfo();
    console.log('Newly detected and saved printer info:', detectedInfo);
    return detectedInfo;
  }

  private getSavedPrinterInfo(): PrinterInfo | null {
    if (typeof window !== 'undefined') {
      const savedInfo = localStorage.getItem('selectedPrinterInfo');
      return savedInfo ? JSON.parse(savedInfo) : null;
    }
    return null;
  }

  private async autoDetectAndSavePrinterInfo(): Promise<PrinterInfo | null> {
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
        console.log('Detected printer info:', printerInfo);
        this.savePrinterInfo(printerInfo);
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

  private savePrinterInfo(printerInfo: PrinterInfo): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedPrinterInfo', JSON.stringify(printerInfo));
    }
  }

  async printString(data: string, imageData?: Uint8Array): Promise<void> {
    const printerInfo = await this.getOrDetectPrinterInfo();
    if (!printerInfo) {
      throw new Error('프린터를 찾을 수 없습니다.');
    }

    let port;
    try {
      port = await this.openPrinterPort(printerInfo.path);

      // 텍스트 데이터 출력
      await this.writeToPrinter(port, data);

      // 이미지 데이터가 있으면 출력
      if (imageData) {
        await this.writeImageToPrinter(port, imageData);
      }
    } finally {
      if (port) {
        await this.closePrinterPort(port);
      }
    }
  }

  private async openPrinterPort(portPath: string): Promise<SerialPort> {
    return new Promise((resolve, reject) => {
      const port = new SerialPort({ path: portPath, baudRate: 9600 }, (err: { message: any }) => {
        if (err) {
          reject(new Error(`포트 ${portPath}를 열 수 없습니다: ${err.message}`));
        } else {
          resolve(port);
        }
      });
    });
  }

  private async writeToPrinter(port: SerialPort, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const eucKRBuffer = iconv.encode(data, 'euc-kr');
      port.write(eucKRBuffer, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private async writeImageToPrinter(port: SerialPort, imageData: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      // 여기에 프린터 특정 이미지 출력 명령어를 추가해야 합니다.
      // 예: ESC/POS 명령어 세트를 사용하는 경우
      const imageCommand = Buffer.from([0x1d, 0x76, 0x30, 0x00]); // GS v 0 명령어
      const width = 384; // 예시 너비, 실제 프린터에 맞게 조정 필요
      const height = imageData.length / width;
      const sizeBytes = Buffer.alloc(4);
      sizeBytes.writeUInt16LE(width, 0);
      sizeBytes.writeUInt16LE(height, 2);

      port.write(Buffer.concat([imageCommand, sizeBytes, Buffer.from(imageData)]), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private async closePrinterPort(port: SerialPort): Promise<void> {
    return new Promise((resolve, reject) => {
      port.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
