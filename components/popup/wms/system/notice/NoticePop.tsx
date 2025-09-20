import React, { useState, useEffect } from 'react';
import { useNoticeStore } from '../../../../../stores/useNoticeStore';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { PopupFooter } from '../../../PopupFooter';
import { PopupContent } from '../../../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../../../content';
import FormInput from '../../../../FormInput';
import { Placeholder } from '../../../../../libs/const';
import FormDropDown from '../../../../FormDropDown';
import { FileUploadPop } from '../../../common';
import { PopupLayout } from '../../../PopupLayout';

interface NoticePopProps {
  onClose: () => void;
  onSuccess?: () => void;
  notice: {
    id: number;
    title: string;
    noticeCd: string;
    noticeCntn: string;
  };
}
const NoticePop: React.FC<NoticePopProps> = ({ onClose, onSuccess, notice }) => {
  const { selectedNotice, openModal, modalType, closeModal } = useNoticeStore();

  return (
    <PopupLayout
      width={820}
      isEscClose={true}
      open={modalType.type === 'DETAIL'}
      title={`${selectedNotice?.noticeCd === '20120' ? '매뉴얼' : '공지사항'} 상세`}
      onClose={() => {
        closeModal('DETAIL');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button
              className="btn"
              title="닫기"
              onClick={() => {
                closeModal('DETAIL');
              }}
            >
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="tblBox">
          <table>
            <caption></caption>
            <colgroup>
              <col />
            </colgroup>
            <thead>
              <tr>
                <th>{selectedNotice?.title}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style={{ minHeight: '150px' }}>{selectedNotice?.noticeCntn}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PopupContent>
    </PopupLayout>
  );
};

export default NoticePop;
