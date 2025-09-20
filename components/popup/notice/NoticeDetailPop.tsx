import React from 'react';
import { useCsStore } from '../../../stores/useCsStore';
import { authApi } from '../../../libs';
import { toastError, toastSuccess } from '../../../components';

export const NoticeDetailPop = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => {
  const { closeModal, selectedNotice } = useCsStore();

  const handleDelete = async () => {
    try {
      await authApi.delete(`/api/notices/${selectedNotice?.id}`);
      toastSuccess('공지사항이 삭제되었습니다.');
      onDelete();
      closeModal();
    } catch (error) {
      toastError('공지사항 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="popWrap">
      <div className="popHead">
        <h1>공지사항 상세</h1>
      </div>
      <div className="popCont">
        <div className="formArea">
          <div className="formBox">
            <label>제목</label>
            <p>{selectedNotice?.title}</p>
          </div>
          <div className="formBox">
            <label>내용</label>
            <p>{selectedNotice?.noticeCntn}</p>
          </div>
        </div>
      </div>
      <div className="popFoot">
        <button className="btn" onClick={onEdit}>
          수정
        </button>
        <button className="btn" onClick={handleDelete}>
          삭제
        </button>
        <button className="btn" onClick={closeModal}>
          닫기
        </button>
      </div>
    </div>
  );
};
