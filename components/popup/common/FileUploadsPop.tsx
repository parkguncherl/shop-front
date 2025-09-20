import React, { useEffect, useRef, useState } from 'react';
import { PopupContent } from '../PopupContent';
import { Button } from '../../Button';
import { PopupFooter } from '../PopupFooter';
import { authApi } from '../../../libs';
import { toastError, toastSuccess } from '../../ToastMessage';
import { useCommonStore } from '../../../stores';
import { CommonResponseFileDown } from '../../../generated';
import { PopupLayout } from '../PopupLayout';

interface FileUploadPopProps {
  ref?: React.MutableRefObject<null>;
  onValueChange?: (fileInfo: CommonResponseFileDown, type: string) => void;
  fileId?: string;
}

export const FileUploadsPop = ({ ref, onValueChange, fileId }: FileUploadPopProps) => {
  /** 공통 스토어 - State */
  const [modalType, closeModal] = useCommonStore((s) => [s.modalType, s.closeModal]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('파일1', e);
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles, ...selectedFiles];
      selectedFiles.forEach((file) => readImage(file));
      return updatedFiles;
    });
  };
  useEffect(() => {
    console.log('✅ inputRef.current:', inputRef.current);
  }, []);

  const handleUpload = (e: React.MouseEvent) => {
    console.log('파일2', e);
    e.preventDefault();
    const formData = new FormData();
    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append('uploadFiles', files[i]);
        formData.append('fileId', fileId || '');
      }

      authApi
        .post('/common/file/uploads', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then((response) => {
          if (response.data.resultCode === 200) {
            console.log('response==>', response);
            if (onValueChange) {
              onValueChange(response.data.body, 'file');
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
          console.error(error);
        });
    } else {
      toastError('선택된 파일이 없습니다.');
      return;
    }
  };

  // 드래그 앤 드롭
  const [isDragging, setIsDragging] = useState(false);
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
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const existingFileNames = new Set(files.map((file) => file.name));

      const newFiles = droppedFiles.filter((file) => !existingFileNames.has(file.name));
      if (newFiles.length > 0) {
        setFiles((prevFiles) => [...prevFiles, ...newFiles]);
        newFiles.forEach((file) => readImage(file));
      }
    }
    setIsDragging(false);
  };

  // 미리보기
  const [filePreviews, setFilePreviews] = useState<Map<File, string>>(new Map());
  const readImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      if (e.target?.result) {
        setFilePreviews((prev) => new Map(prev).set(file, String(e.target?.result)));
      }
    };
    reader.readAsDataURL(file);
  };

  // 파일삭제
  const handleRemoveFile = (fileToRemove: File) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
    setFilePreviews((prevPreviews) => {
      const newPreviews = new Map(prevPreviews);
      newPreviews.delete(fileToRemove);
      return newPreviews;
    });
  };

  // 파일리스트 드래그앤드롭 기능
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const onDragListStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };
  const onDragOverListItem = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDropListItem = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    e.preventDefault();
    const draggedIdx = draggedIndex;
    if (draggedIdx !== null && draggedIdx !== index) {
      setFiles((prevFiles) => {
        const newFiles = [...prevFiles];
        const [movedFile] = newFiles.splice(draggedIdx, 1);
        newFiles.splice(index, 0, movedFile);
        return newFiles;
      });
    }
    setDraggedIndex(null);
  };

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
          className={`fileBoxDiv ${files.length > 0 ? 'between' : ''} ${isDragging ? 'isDragging' : ''}`}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <input ref={inputRef} type="file" id="fileInp" onChange={handleFileInputChange} multiple />
          <div className="">
            <span className="ico_upload"></span>
            파일을 드래그 하거나 클릭해주세요.
            <label htmlFor="fileInp">파일업로드</label>
          </div>
          {files.length > 0 && (
            <ul className="imagePreview">
              {files.map((file, index) => (
                <li
                  key={index}
                  draggable
                  onDragStart={(e) => onDragListStart(e, index)}
                  onDragOver={(e) => onDragOverListItem(e)}
                  onDrop={(e) => onDropListItem(e, index)}
                  className={draggedIndex === index ? 'dragging' : ''}
                >
                  {filePreviews.get(file) && (
                    <div className="img">
                      <img src={filePreviews.get(file)} alt="파일 미리보기" />
                    </div>
                  )}
                  <span>{file.name}</span>
                  <button onClick={() => handleRemoveFile(file)}>삭제</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopupContent>
    </PopupLayout>
  );
};
