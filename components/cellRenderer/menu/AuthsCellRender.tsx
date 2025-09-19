import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { Button } from '../../Button';
import { Menu } from '../../../generated';
import { useCommonStore, useMenuStore } from '../../../stores';
import { toast } from 'react-toastify';
import { toastError } from '../../ToastMessage';

type ICellRendererType = ICellRendererParams;

interface Props extends ICellRendererType {
  title: string;
  styles: React.CSSProperties;
  onClick: () => void;
  data: Menu;
}

/** 시스템 - 메뉴접근 권한관리 : 권한 Cell Renderer*/
export const AuthsCellRenderer = ({ title, styles, onClick, data }: Props) => {
  const { t } = useTranslation();

  /** 공통 스토어 - State */
  const [menuUpdYn, menuExcelYn] = useCommonStore((s) => [s.menuUpdYn, s.menuExcelYn]);

  const [openModal] = useMenuStore((s) => [s.openModal]);

  return (
    <div
      style={{
        padding: '2px',
        fontSize: '11px',
        fontWeight: '300',
        margin: '0 auto',
        ...styles,
      }}
      onClick={(e) => {
        if (!menuUpdYn) {
          toastError(t('접근 권한이 없습니다.') || '');
          return;
        }
        if (data.menuCd === data.upMenuCd) {
          toast.warning(t('권한은 하위메뉴에만 줄수 있습니다.') || '');
        } else {
          openModal('AUTH_MOD');
        }
      }}
    >
      <button className={'tblBtn'} onClick={onClick} style={{ width: '100%' }}>
        {t(title || '미리보기') || ''}
      </button>
    </div>
  );
};
