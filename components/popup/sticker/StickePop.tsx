import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import useAppStore from '../../../stores/useAppStore';
import { authApi } from '../../../libs';
import { toastError, toastSuccess } from '../../../components/ToastMessage';
import { ApiResponse } from '../../../generated';
import { StickerWindow, TitleBar, CloseButton, TextArea, ButtonContainer, ClearButton, SaveButton, ResizeHandle } from './StickerStyles';

// 스티커 팝업의 props 정의
interface StickerProps {
  onClose: () => void; // 스티커 창을 닫는 함수
}

// 스티커 업데이트를 위한 데이터 구조 정의
interface StickerUpdate {
  noticeCntn: string; // 스티커 내용
  partnerId: string; // 파트너 ID
  updUser: string; // 업데이트한 사용자
}

// API 응답 타입 정의 (스티커 데이터 포함)
interface ApiResponseWithSticker extends ApiResponse {
  data?: {
    resultCode: number;
    resultMessage: string;
    body?: {
      id?: number;
      noticeCd?: string;
      noticeCntn?: string;
      updUser?: string;
    };
  };
}

const StickerPopup: React.FC<StickerProps> = ({ onClose }) => {
  // 앱 스토어에서 세션 정보 가져오기
  const { session } = useAppStore();

  // 스티커 내용 상태
  const [content, setContent] = useState<string>('');

  // 스티커 창 크기 상태
  const [size, setSize] = useState({ width: 300, height: 250 });

  // 스티커 창 위치 상태 (초기 위치는 화면 우하단)
  const [position, setPosition] = useState(() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    return { x: windowWidth - 480, y: windowHeight - 370 };
  });

  // 스티커 창에 대한 ref
  const stickerRef = useRef<HTMLDivElement | null>(null);

  // 드래그 상태 ref
  const isDragging = useRef<boolean>(false);

  // 드래그 시작 위치 ref
  const startPos = useRef({ x: 0, y: 0 });

  // 스티커 데이터 조회 쿼리
  const {
    data: stickerData,
    isLoading,
    isError,
    error,
    refetch: refetchSticker,
  } = useQuery<ApiResponseWithSticker, Error>(
    ['/notice/sticker', session?.user?.partnerId],
    () => authApi.get(`/notice/sticker?partnerId=${session?.user?.partnerId}`),
    {
      enabled: !!session?.user?.partnerId, // 파트너 ID가 있을 때만 쿼리 실행
      onSuccess: (response) => {
        console.log('API Response:', response);
        if (response.data?.resultCode === 200 && response.data?.body) {
          setContent(response.data.body.noticeCntn || '');
        }
      },
      onError: (err) => {
        toastError('스티커 내용을 불러오는데 실패했습니다.');
        console.error('스티커 내용 조회 오류:', err);
      },
    },
  );

  // 스티커 내용 업데이트 뮤테이션
  const updateSticker = useMutation<ApiResponseWithSticker, Error, StickerUpdate>((updateData) => authApi.put('/notice/sticker', updateData), {
    onSuccess: (data) => {
      if (data.data?.resultCode === 200) {
        toastSuccess('내용이 성공적으로 저장되었습니다.');
        refetchSticker(); // 저장 후 데이터 다시 조회
      } else {
        toastError(data.data?.resultMessage || '저장에 실패했습니다.');
      }
    },
    onError: (err) => {
      toastError('스티커 내용을 저장하는데 실패했습니다.');
      console.error('스티커 내용 저장 오류:', err);
    },
  });

  // 저장 버튼 클릭 핸들러
  const handleSave = () => {
    if (!session?.user?.partnerId || !session?.user?.partnerNm) {
      toastError('유효한 사용자 정보가 없습니다.');
      return;
    }

    const updateData: StickerUpdate = {
      noticeCntn: content,
      partnerId: session.user.partnerId.toString(),
      updUser: session.user.partnerNm,
    };
    updateSticker.mutate(updateData);
  };

  // 리사이즈 핸들러
  const handleMouseMove = (e: MouseEvent) => {
    if (stickerRef.current) {
      const newWidth = e.clientX - stickerRef.current.getBoundingClientRect().left;
      const newHeight = e.clientY - stickerRef.current.getBoundingClientRect().top;
      setSize({ width: Math.max(newWidth, 200), height: Math.max(newHeight, 150) });
    }
  };

  const handleMouseUp = () => {
    if (typeof window !== 'undefined') {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  // 드래그 핸들러
  const handleMouseDownMove = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMoveMove = (e: MouseEvent) => {
    if (isDragging.current) {
      const newX = e.clientX - startPos.current.x;
      const newY = e.clientY - startPos.current.y;
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUpMove = () => {
    isDragging.current = false;
  };

  // 마우스 이벤트 리스너 등록 및 해제
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.addEventListener('mousemove', handleMouseMoveMove);
      document.addEventListener('mouseup', handleMouseUpMove);
    }

    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('mousemove', handleMouseMoveMove);
        document.removeEventListener('mouseup', handleMouseUpMove);
      }
    };
  }, []);

  // 디버깅을 위한 content 상태 변경 감지
  useEffect(() => {
    console.log('Content updated:', content);
  }, [content]);

  return (
    <StickerWindow
      ref={stickerRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
    >
      <TitleBar onMouseDown={handleMouseDownMove}>
        <span>{session?.user?.partnerNm || '내'} 메모</span>
        <CloseButton onClick={onClose}>&times;</CloseButton>
      </TitleBar>
      {isLoading ? (
        <div>로딩 중...</div>
      ) : (
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="매장 중요 정보를 공유하세요..."
          disabled={updateSticker.isLoading}
        />
      )}
      <ButtonContainer>
        <ClearButton onClick={() => setContent('')} disabled={isLoading || updateSticker.isLoading}>
          지우기
        </ClearButton>
        <SaveButton onClick={handleSave} disabled={isLoading || updateSticker.isLoading}>
          {updateSticker.isLoading ? '저장 중...' : '저장'}
        </SaveButton>
      </ButtonContainer>
      <ResizeHandle onMouseDown={handleMouseDownResize} />
    </StickerWindow>
  );
};

export default StickerPopup;
