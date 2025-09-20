import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import { useTranslation } from 'react-i18next';

const resultType = 'street_address|postal_code';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) {
      res.statusCode = 400;
      return res.send('위도 혹은 경도 데이터가 없습니다.' || '');
    }
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=ko&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&result_type=${resultType}`;
      const { data } = await axios.get(url);
      res.send(data);
    } catch (error) {
      res.statusCode = 404;
      return res.end();
    }
    res.statusCode = 405;
    return res.end();
  }
};
