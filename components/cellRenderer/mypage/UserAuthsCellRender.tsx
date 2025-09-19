import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { Button } from '../../Button';
import { Menu } from '../../../generated';
import { useCommonStore, useMenuStore, useMypageStore } from '../../../stores';
import { toast } from 'react-toastify';
import { toastError } from '../../ToastMessage';

type ICellRendererType = ICellRendererParams;

interface Props extends ICellRendererType {
  title: string;
  styles: React.CSSProperties;
  onClick: () => void;
  data: Menu;
}

/** mypage - 사용자 권한관리 : 권한 Cell Renderer*/
export const UserAuthsCellRenderer = ({ title, styles, onClick, data }: Props) => {
  const { t } = useTranslation();

  const [openModal] = useMypageStore((s) => [s.openModal]);

  return (
    <div
      style={{
        padding: '2px',
        fontSize: '11px',
        fontWeight: '300',
        margin: '0 auto',
        ...styles,
      }}
      onClick={() => {
        openModal('USER_AUTH_MOD');
      }}
    >
      <button className={'tblBtn'} onClick={onClick} style={{ width: '100%' }}>
        {t(title || '미리보기') || ''}
      </button>
    </div>
  );
};
