import { NextApiRequest, NextApiResponse } from 'next';
import { handlePrinterApiRoute } from '../../../Receipt/ReceiptPrinter';

/**
 * 영수증 출력 API 라우트 핸들러
 * @param {NextApiRequest} req - Next.js API 요청 객체
 * @param {NextApiResponse} res - Next.js API 응답 객체
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await handlePrinterApiRoute(req, res);
}