import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { Button } from './Button';
import { useTranslation } from 'react-i18next';

type ICellRendererType = ICellRendererParams;

interface Props extends ICellRendererType {
  title: string;
  styles: React.CSSProperties;
  onClick: () => void;
}

export const BtnCellRenderer = ({ title, styles, onClick }: Props) => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: 'grid',
        padding: '2px',
        verticalAlign: 'middle',
        wordBreak: 'break-all',
        textAlign: 'center',
        fontSize: '11px',
        fontWeight: '300',
        color: '#333',
        ...styles,
      }}
    >
      <button className={'tblBtn'} onClick={onClick}>
        {t(title || '미리보기')}
      </button>
    </div>
  );
};
