import { useState } from 'react';

const CHUNK_SIZE = 512 * 1024; // 512KB 청크 크기

export const usePrint = () => {
  const [printStatus, setPrintStatus] = useState<string>('');

  const handlePrint = async (data: string, imageData?: Uint8Array): Promise<boolean> => {
    try {
      console.log('프린트 시작, 텍스트 데이터:', data);
      if (imageData) {
        console.log('이미지 데이터 크기:', imageData.length, 'bytes');
      }
      setPrintStatus('프린트 요청 중...');

      if (imageData) {
        // 이미지 데이터를 청크로 나누어 전송
        const chunks = Math.ceil(imageData.length / CHUNK_SIZE);
        for (let i = 0; i < chunks; i++) {
          const chunk = imageData.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          await sendPrintRequest(data, chunk, i === 0, i === chunks - 1);
        }
      } else {
        // 이미지 없는 경우 텍스트만 전송
        await sendPrintRequest(data);
      }

      setPrintStatus('출력 성공!');
      return true;
    } catch (error) {
      console.error('프린트 중 상세 오류:', error);
      if (error instanceof Error) {
        setPrintStatus(`출력 실패: ${error.message}`);
      } else {
        setPrintStatus('출력 실패: 알 수 없는 오류가 발생했습니다.');
      }
      return false;
    }
  };

  const sendPrintRequest = async (data: string, imageChunk?: Uint8Array, isFirst = true, isLast = true): Promise<void> => {
    const response = await fetch('/api/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: isFirst ? data : '',
        imageChunk: imageChunk ? Array.from(imageChunk) : undefined,
        isFirst,
        isLast,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`프린트 요청 실패: ${response.status} ${response.statusText}, 오류 내용: ${errorText}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(`서버 오류: ${result.error}`);
    }
  };

  return { handlePrint, printStatus };
};
