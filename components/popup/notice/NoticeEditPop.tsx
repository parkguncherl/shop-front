import React, { useState, useEffect } from 'react';
import { useCsStore } from '../../../stores/useCsStore';
import { authApi } from '../../../libs';
import { toastError, toastSuccess } from '../../../components';

export const NoticeEditPop = ({ onSuccess }: { onSuccess: () => void }) => {
  const { closeModal, selectedNotice } = useCsStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (selectedNotice) {
      setTitle(selectedNotice.title || '');
      setContent(selectedNotice.noticeCntn || '');
    }
  }, [selectedNotice]);

  const handleSubmit = async () => {
    try {
      await authApi.put(`/api/notices/${selectedNotice?.id}`, { title, content });
      toastSuccess('공지사항이 수정되었습니다.');
      onSuccess();
      closeModal();
    } catch (error) {
      toastError('공지사항 수정에 실패했습니다.');
    }
  };

  return (
    <div className="popWrap">
      <div className="popHead">
        <h1>공지사항 수정</h1>
      </div>
      <div className="popCont">
        <div className="formArea">
          <div className="formBox">
            <label>제목</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="formBox">
            <label>내용</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="popFoot">
        <button className="btn" onClick={handleSubmit}>
          수정
        </button>
        <button className="btn" onClick={closeModal}>
          취소
        </button>
      </div>
    </div>
  );
};
