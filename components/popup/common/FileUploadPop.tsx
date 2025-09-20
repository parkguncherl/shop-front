import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { PopupContent } from '../PopupContent';
import { PopupFooter } from '../PopupFooter';
import { authApi } from '../../../libs';
import { toastError, toastSuccess } from '../../ToastMessage';
import { useCommonStore } from '../../../stores';
import { CommonResponseFileDown } from '../../../generated';
import { PopupLayout } from '../PopupLayout';

interface FileUploadPopProps {
  ref?: React.MutableRefObject<null>;
  onValueChange?: (fileInfo: CommonResponseFileDown) => void;
  fileId?: number;
  imageFileWidth?: number;
  imageFileHeight?: number;
}

export const FileUploadPop = ({ ref, onValueChange, fileId, imageFileWidth, imageFileHeight }: FileUploadPopProps) => {
  /** 공통 스토어 - State */
  const [modalType, closeModal] = useCommonStore((s) => [s.modalType, s.closeModal]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | undefined>();
  const [filePreview, setFilePreview] = useState<string | undefined>();
  const [isDragging, setIsDragging] = useState(false);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      readImage(selectedFile);
    }
  };

  const handleUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (file) {
      const formData = new FormData();
      formData.append('uploadFile', file);
      formData.append('fileId', fileId ? fileId.toString() : '0'); // FormData의 append 메서드는 두 번째 파라미터가 string 또는 Blob(파일)이어야 합니다.
      if (imageFileWidth && imageFileHeight) {
        formData.append('imageFileWidth', imageFileWidth ? imageFileWidth.toString() : '0');
        formData.append('imageFileHeight', imageFileHeight ? imageFileHeight.toString() : '0');
      }

      authApi
        .post('/common/file/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then((response) => {
          if (response.data.resultCode === 200) {
            if (onValueChange) {
              onValueChange(response.data.body);
            }
            toastSuccess('업로드되었습니다.');
            closeModal('UPLOAD');
          } else {
            toastError(response.data.resultMessage);
            closeModal('UPLOAD');
            throw new Error(response.data.resultMessage);
          }
        })
        .catch((error) => {
          console.log('error occured', error);
          console.error(error);
          toastError(error.message);
        });
    } else {
      toastError('선택된 파일이 없습니다.');
    }
  };

  // 드래그 앤 드롭
  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      setIsDragging(true);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      readImage(droppedFile);
    }
    setIsDragging(false);
  };

  // 미리보기
  const readImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      if (e.target?.result) {
        setFilePreview(String(e.target.result));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setFile(undefined);
    setFilePreview(undefined);
  };

  const uniqueId = `fileInp-${Math.random().toString(36).substr(2, 9)}`; // 고유한 id 생성

  return (
    <PopupLayout
      width={800}
      open={true}
      isEscClose={true}
      title={'파일 업로드'}
      onClose={() => closeModal('UPLOAD')}
      footer={
        <PopupFooter>
          <div className={'btnArea'}>
            <button className={'btn'} onClick={handleUpload}>
              파일 업로드
            </button>
            <button className={'btn'} onClick={() => closeModal('UPLOAD')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div
          className={`fileBoxDiv one ${file ? 'hide' : ''} ${isDragging ? 'isDragging' : ''}`}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <input ref={inputRef} type="file" id={uniqueId} onChange={handleFileInputChange} style={{ display: 'none' }} />
          <div className="">
            <span className="ico_upload"></span>
            파일을 드래그 하거나 클릭해주세요.
            <label htmlFor={uniqueId}>파일업로드</label>
          </div>
          {file && (
            <ul className="imagePreview">
              <li>
                {filePreview && (
                  <div className="img">
                    <img src={filePreview} alt="파일 미리보기" />
                  </div>
                )}
                <div className="info">
                  <span>{file.name}</span>
                  <button onClick={handleRemoveFile}>삭제</button>
                </div>
              </li>
            </ul>
          )}
        </div>
      </PopupContent>
    </PopupLayout>
  );
};
