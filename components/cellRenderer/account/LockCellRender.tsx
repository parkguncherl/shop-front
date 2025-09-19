import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { Button } from '../../Button';
import { UserResponsePaging } from '../../../generated';
import { useAccountStore, useCommonStore } from '../../../stores';
import { toastError } from '../../ToastMessage';

type ICellRendererType = ICellRendererParams;

interface Props extends ICellRendererType {
  title: string;
  styles: React.CSSProperties;
  onClick: () => void;
  data: UserResponsePaging;
}

/** 시스템 - 계정관리 : 잠금해제 Cell Renderer*/
export const LockCellRender = ({ title, styles, onClick, data }: Props) => {
  console.log('LockCellRender props:', title, onClick, data.lockYn); // 확인용 로그
  /** 공통 스토어 - State */
  const [menuUpdYn, menuExcelYn] = useCommonStore((s) => [s.menuUpdYn, s.menuExcelYn]);

  /** 계정관리 스토어 - State */
  const [openModal, setSelectedUser] = useAccountStore((s) => [s.openModal, s.setSelectedUser]);

  return (
    <div
      onClick={() => {
        if (!menuUpdYn) {
          toastError('접근 권한이 없습니다.');
          return;
        }
        setSelectedUser(data);
        openModal('UNLOCK');
      }}
    >
      {data.lockYn == 'Y' && (
        <button className={'tblBtn'} onClick={onClick} style={{ width: '100%' }}>
          잠금해제
        </button>
      )}
    </div>
  );
};
