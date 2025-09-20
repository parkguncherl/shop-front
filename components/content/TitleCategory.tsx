import React from 'react';
import { DropDownOption } from '../../types/DropDownOptions';
import { useTranslation } from 'react-i18next';
import DropDownAtom from '../atom/DropDownAtom';

interface Props {
  title?: string;
  name: string;
  options?: DropDownOption[];
  value?: string;
  onChangeOptions?: (name: string, value: string | number) => void;
  onReset?: () => void;
}

export const TitleCategory = ({ title = '전체', name, options, value = 'TOP', onChangeOptions, onReset }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="titleCategoryBox">
      <div className="labelWrap">
        <span className="txt" dangerouslySetInnerHTML={{ __html: t(title) || '' }} onClick={onReset}></span>
        <span className="arrow"></span>
      </div>
      <DropDownAtom value={value} options={options} name={name} onChangeOptions={onChangeOptions} dropDownStyle={{ width: '150px' }} />
    </div>
  );
};
