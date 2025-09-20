import React, { useEffect, useState } from 'react';
import { useCommonStore } from '../../../stores';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupLayout } from '../PopupLayout';
import { toastError, toastSuccess } from '../../ToastMessage';
import Link from 'next/link';

interface Image {
  sysFileNm: string; // 파일 시스템 이름
  url: string; // 이미지 URL
  fileNm: string; // 파일 이름
  fileSeq: number;
}

interface ImagePopProps {
  imgFile: Image[]; // 이미지 목록
  initialIndex: number; // 모달 열릴 때 기본적으로 표시할 이미지의 인덱스
}

// ImagePop 컴포넌트 정의
const ImagePop: React.FC<ImagePopProps> = ({ imgFile, initialIndex }) => {
  /** 공통 스토어 - State */
  const [modalType, closeModal, getFileUrl] = useCommonStore((s) => [s.modalType, s.closeModal, s.getFileUrl]);
  // 현재 표시할 이미지의 인덱스를 관리하는 상태
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  // 다음 이미지로 이동하는 핸들러
  const showNextImage = () => {
    setHasCopied(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % imgFile.length);
  };

  // 이전 이미지로 이동하는 핸들러
  const showPrevImage = () => {
    setHasCopied(false);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + imgFile.length) % imgFile.length);
  };

  // 이미지 다운로드
  const downloadAllImages = (imgFiles: { url: string; fileNm: string }[]) => {
    imgFiles.forEach((file, index) => {
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const link = document.createElement('a');
          link.href = file.url;
          link.download = file.fileNm;
          if (typeof window !== 'undefined') {
            document.body.appendChild(link);
          }
          link.click();
          if (typeof window !== 'undefined') {
            document.body.removeChild(link);
          }
        }
      }, index * 500);
    });
  };

  // 이미지 컨트롤C
  const [hasCopied, setHasCopied] = useState(false);
  const copyImageToClipboard = async (sysFileNm: string) => {
    try {
      const fileUrl = await getFileUrl(sysFileNm);
      const response = await fetch(fileUrl, { mode: 'cors' });
      const blob = await response.blob();
      const imageBlob = new Blob([blob], { type: 'image/png' });
      const item = new ClipboardItem({ 'image/png': imageBlob });
      await navigator.clipboard.write([item]);

      setHasCopied(true);
      toastSuccess('이미지가 클립보드에 복사되었습니다!');
    } catch (error) {
      console.error('이미지 복사 실패:', error);
    }
  };
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'c') {
        if (hasCopied) {
          return;
        }

        const sysFileNm = imgFile[currentIndex]?.sysFileNm;
        if (sysFileNm) {
          copyImageToClipboard(sysFileNm);
        }
      }
    };

    // Add event listener
    if (typeof window !== 'undefined') {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [hasCopied, imgFile, currentIndex]);

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={900}
        open={true}
        isEscClose={true}
        title={'이미지 보기'}
        onClose={() => closeModal('IMAGES')}
        footer={
          <PopupFooter>
            <button className="btn" onClick={() => closeModal('IMAGES')}>
              닫기
            </button>
          </PopupFooter>
        }
      >
        <PopupContent>
          <div className="imagePopBox">
            <div className="content">
              {imgFile.length > 0 && (
                <div className="imageContainer">
                  <button className="prevBtn" onClick={showPrevImage}></button>
                  <div className="image">
                    <span>{currentIndex + 1}</span>
                    <img src={imgFile[currentIndex].url} alt={imgFile[currentIndex].fileNm} />
                  </div>
                  <button className="nextBtn" onClick={showNextImage}></button>
                  <div className="etcBtnArea">
                    <button className="btn" onClick={() => downloadAllImages(imgFile)}>
                      묶음사진 전체 다운로드
                    </button>
                    <Link href={`${imgFile[currentIndex].url}`} className="btn" download={true}>
                      이미지 다운로드
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </PopupContent>
      </PopupLayout>
    </div>
  );
};

export default ImagePop;
