import React from 'react';
import styles from '../../../styles/delete/popup.module.scss';
import classNames from 'classnames/bind';
import { CustomInput } from '../../CustomInput';
import { DropDown } from '../../DropDown';
import SearchBar from '../../search/SearchBar';

const cx = classNames.bind(styles);

interface Props {
  className: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const PopupSearchType = (props: Props) => {
  return (
    <div className={cx(props.className)} style={props.style}>
      {props.children}
    </div>
  );
};

PopupSearchType.Input = CustomInput;
PopupSearchType.DropDown = DropDown;
PopupSearchType.Bar = SearchBar;
