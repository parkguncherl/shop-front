'use client';

import React from 'react';
import { PopupLayout } from '@/components/popup/PopupLayout';
import { PopupContent } from '@/components/popup/PopupContent';

interface Props {
  open: boolean;
  imgUrl?: string;
  title?: string;
  onClose: () => void;
}

/**
 * 그리드 썸네일 클릭 시 원본 이미지를 크게 보여주는 공통 팝업.
 * (품목정보목록 / 협력업체관리 상품목록 등에서 공용)
 */
const ImageZoomPop = ({ open, imgUrl, title, onClose }: Props) => {
  return (
    <PopupLayout width={720} open={open} isEscClose={true} className="imgZoomPop" title={title || '이미지 보기'} onClose={onClose}>
      <PopupContent>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320, padding: 8 }}>
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={title || '이미지'}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 4 }}
            />
          ) : (
            <span>저장된 이미지가 없습니다</span>
          )}
        </div>
      </PopupContent>
    </PopupLayout>
  );
};

export default ImageZoomPop;
