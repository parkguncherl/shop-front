import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { Button } from '../../Button';
import { CodeResponsePaging } from '../../../generated';
import { useCodeStore, useCommonStore } from '../../../stores';
import { toastError } from '../../ToastMessage';

type ICellRendererType = ICellRendererParams;

interface Props extends ICellRendererType {
  title: string;
  styles: React.CSSProperties;
  onClick: () => void;
  data: CodeResponsePaging;
}

/** 시스템 - 코드관리 : 하위코드 수 Cell Renderer*/
export const LowerCellRender = ({ title, styles, onClick, data }: Props) => {
  const { t } = useTranslation();

  /** 공통 스토어 - State */
  const [menuUpdYn, menuExcelYn] = useCommonStore((s) => [s.menuUpdYn, s.menuExcelYn]);

  /** 코드관리 스토어 - State */
  const [openModal, setSelectedCode] = useCodeStore((s) => [s.openModal, s.setSelectedCode]);

  return (
    <div
      style={{
        padding: '0px',
        fontSize: '11px',
        fontWeight: '300',
        margin: '0 auto',
        ...styles,
      }}
      onClick={() => {
        /*if (!menuUpdYn) {
          toastError(t('접근 권한이 없습니다.') || '');
          return;
        }*/
        setSelectedCode(data);
        openModal('LOWER');
      }}
    >
      <button className={'tblBtn'} onClick={onClick} style={{ width: '100%', marginTop: '2px' }}>
        {data.lowerCodeCnt}
      </button>
    </div>
  );
};
