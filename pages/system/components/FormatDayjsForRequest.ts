// utils/date.ts와 같은 별도 파일에 추가
import dayjs from 'dayjs';

export function FormatDayjsForRequest(data: any): any {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map((item) => FormatDayjsForRequest(item));
  }

  if (typeof data === 'object' && data !== null) {
    const result: Record<string, any> = {};

    for (const key in data) {
      const value = data[key];

      // dayjs 객체인지 확인
      if (value && typeof value === 'object' && value.$d instanceof Date) {
        // dayjs 객체를 YYYY-MM-DD 형식의 문자열로 변환
        result[key] = dayjs(value).format('YYYY-MM-DD');
      } else if (typeof value === 'object' && value !== null) {
        // 중첩된 객체는 재귀적으로 처리
        result[key] = FormatDayjsForRequest(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  return data;
}
export default FormatDayjsForRequest;
