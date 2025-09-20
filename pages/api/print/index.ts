import { NextApiRequest, NextApiResponse } from 'next';
import { PrinterService } from '../../../print/PrinterService';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // 제한을 10MB로 증가
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { data, imageData } = req.body;
      const printerService = PrinterService.getInstance();

      // imageData가 문자열 배열로 전송되었으므로 Uint8Array로 변환
      const imageUint8Array = imageData ? new Uint8Array(imageData) : undefined;

      await printerService.printString(data, imageUint8Array);
      res.status(200).json({ message: 'Printed successfully' });
    } catch (error: any) {
      console.error('Detailed error:', error);
      res.status(500).json({ error: `Failed to print: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
