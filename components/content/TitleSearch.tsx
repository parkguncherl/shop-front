import React from 'react';
import { DropDown } from '../DropDown';
import { CustomInput } from '../CustomInput';

interface Props {
  children: React.ReactNode;
}

export const TitleSearch = ({ children }: Props) => {
  return (
    <div className={'tit_box'}>
      <div>{children}</div>
    </div>
  );
};

TitleSearch.DropDown = DropDown;
TitleSearch.Input = CustomInput;

export default React.memo(TitleSearch);
