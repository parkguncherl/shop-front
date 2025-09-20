import React, { useState } from 'react';

const PresignedUrlChecker: React.FC = () => {
  const [url, setUrl] = useState<string>(''); // URL 입력 값을 관리
  const [isExpired, setIsExpired] = useState<boolean | null>(null);

  const isPresignedUrlExpired = (url: string): boolean => {
    try {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const expires = parseInt(urlParams.get('X-Amz-Expires') || '0', 10); // 만료 시간 (초 단위)
      const createdTime = urlParams.get('X-Amz-Date'); // 생성 시간

      if (!expires || !createdTime) {
        console.error('URL에서 만료 정보 또는 생성 정보를 찾을 수 없습니다.');
        return true;
      }

      // 생성 시간을 Date 객체로 변환
      const createdDate = new Date(
        Date.UTC(
          parseInt(createdTime.substring(0, 4)), // 연도
          parseInt(createdTime.substring(4, 6)) - 1, // 월 (0부터 시작)
          parseInt(createdTime.substring(6, 8)), // 일
          parseInt(createdTime.substring(9, 11)), // 시
          parseInt(createdTime.substring(11, 13)), // 분
          parseInt(createdTime.substring(13, 15)), // 초
        ),
      );

      // 현재 시간
      const now = new Date();
      const expiryDate = new Date(createdDate.getTime() + expires * 1000);

      // 만료 여부 판단
      return now > expiryDate;
    } catch (error) {
      console.error('URL을 확인하는 중 오류가 발생했습니다:', error);
      return true;
    }
  };

  const handleCheck = () => {
    const expired = isPresignedUrlExpired(url);
    setIsExpired(expired);
  };

  return (
    <div>
      <h1>프리사인드 URL 유효성 검사</h1>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="프리사인드 URL을 입력하세요"
        style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
      />
      <button onClick={handleCheck} style={{ padding: '8px 16px' }}>
        URL 만료 여부 확인
      </button>
      {isExpired !== null && <p>URL은 {isExpired ? <strong>만료되었습니다</strong> : <strong>유효합니다</strong>}.</p>}
    </div>
  );
};

export default PresignedUrlChecker;
