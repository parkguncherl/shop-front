import type { NextApiRequest, NextApiResponse } from 'next';
import { SerialPort } from 'serialport';
import escpos from 'escpos';
import SerialPortAdapter from 'escpos-serialport';
import path from 'path';

// SerialPort 어댑터 생성 함수
function createSerialPortAdapter(port: string, options: any): any {
  return new (SerialPortAdapter as any)(port, options);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const printerPort = await detectPrinterPort();
    if (!printerPort) {
      return res.status(404).json({ message: '프린터를 찾을 수 없습니다.' });
    }

    const device = createSerialPortAdapter(printerPort, {
      baudRate: 9600,
      autoOpen: false,
    });

    const options = { encoding: 'GB18030' /* default */ };
    const printer = new (escpos as any).Printer(device, options);

    await new Promise<void>((resolve, reject) => {
      device.open((error: Error | null) => {
        if (error) {
          reject(new Error(`프린터 연결 실패: ${error.message}`));
          return;
        }

        const imagePath = path.join(process.cwd(), 'public', 'test-image.png');

        (escpos as any).Image.load(imagePath, (image: any) => {
          printer
            .font('a')
            .align('ct')
            .style('bu')
            .size(1, 1)
            .text('프린터 테스트 출력')
            .feed(1)
            .image(image, 's8')
            .feed(1)
            .text('테스트 완료')
            .feed(4)
            .cut()
            .close(() => {
              console.log('프린터 테스트 완료');
              resolve();
            });
        });
      });
    });

    res.status(200).json({ message: '테스트 이미지가 성공적으로 출력되었습니다.' });
  } catch (error: any) {
    console.error('프린터 테스트 중 오류 발생:', error);
    res.status(500).json({ message: `프린터 테스트 실패: ${error.message}` });
  }
}

async function detectPrinterPort(): Promise<string | null> {
  try {
    const ports = await (SerialPort as any).list();
    const comPorts = ports
      .filter((port: any) => port.path.toLowerCase().startsWith('com'))
      .sort((a: any, b: any) => {
        const aNum = parseInt(a.path.toLowerCase().replace('com', ''));
        const bNum = parseInt(b.path.toLowerCase().replace('com', ''));
        return aNum - bNum;
      });

    if (comPorts.length > 0) {
      return comPorts[0].path;
    }
    return null;
  } catch (error) {
    console.error('프린터 포트 감지 중 오류 발생:', error);
    return null;
  }
}
