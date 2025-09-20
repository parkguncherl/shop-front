import React, { useEffect, useState } from 'react';
import { useCommonStore } from '../../../stores';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupLayout } from '../PopupLayout';
import { toastError, toastSuccess } from '../../ToastMessage';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../../libs';

interface Files {
  sysFileNm: string; // 파일 시스템 이름
  url: string; // 이미지 URL
  fileNm: string; // 파일 이름
  fileSeq: number;
}

interface Props {
  file: Files[]; // 이미지 목록
  setFile: any;
  initialIndex: number; // 모달 열릴 때 기본적으로 표시할 이미지의 인덱스
}

// FilesShowPop 컴포넌트 정의
const FilesShowPop: React.FC<Props> = ({ file, initialIndex, setFile }) => {
  /** 공통 스토어 - State */
  const [modalType, closeModal, getFileUrl] = useCommonStore((s) => [s.modalType, s.closeModal, s.getFileUrl]);
  // 현재 표시할 이미지의 인덱스를 관리하는 상태
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  // 다음 이미지로 이동하는 핸들러
  const showNextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % file.length);
  };

  // 이전 이미지로 이동하는 핸들러
  const showPrevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + file.length) % file.length);
  };

  // 다운로드
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
  // 파일삭제
  const deleteFileMutation = useMutation(
    async ({ fileId, sysFileNm }: { fileId: string; sysFileNm: string }) => {
      // API 호출
      await authApi.delete(`/common/fileDeleteByKey`, {
        params: {
          fileId: fileId,
          key: sysFileNm,
        },
      });
    },
    {
      onSuccess: () => {
        // 성공시 호출
      },
      onError: (error) => {
        console.error(error);
      },
    },
  );

  // 파일 삭제 처리 함수
  const handleFileDeleteCommon = (index: number, fileList: any[], setFileList: (updatedList: any[]) => void, deleteFileMutation: any, errorMessage: string) => {
    const deleteFile = fileList[index];

    // API 호출
    deleteFileMutation.mutate(
      {
        fileId: deleteFile.fileId,
        sysFileNm: deleteFile.sysFileNm,
      },
      {
        onSuccess: () => {
          // 성공 시 로컬 상태 업데이트
          const updatedFileList = fileList.filter((_: any, i: number) => i !== index);

          // 삭제 후 순서대로 fillSeq 업데이트
          updatedFileList.forEach((item: any, i: number) => {
            item.fillSeq = i + 1;
          });

          // 상태 업데이트
          setFileList(updatedFileList);
        },
        onError: (error: any) => {
          console.error(errorMessage, error);
        },
      },
    );
  };

  // handleImgFileDelete

  // handleFileDelete
  const handleFileDelete = (index: number) => {
    handleFileDeleteCommon(index, file, setFile, deleteFileMutation, '파일 삭제 실패');
  };

  return (
    <div className="filesPopBox">
      <PopupLayout
        width={620}
        open={true}
        isEscClose={true}
        title={'작업지시서 목록'}
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
              {file.length > 0 && (
                <div className="fileBoxArea pop">
                  {file.map((f: any, index: number) => {
                    return (
                      <div key={f.sysFileNm}>
                        <a href={f.url} className="btn download" download={true}>
                          <span>{f.fileNm}</span>
                        </a>
                        <button className="deleteBtn" title="삭제" onClick={() => handleFileDelete(index)}>
                          <span></span>
                          <span></span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </PopupContent>
      </PopupLayout>
    </div>
  );
};

export default FilesShowPop;
