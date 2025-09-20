import React from 'react';
import styles from '../../styles/delete/popup.module.scss';

interface Props {
  children: React.ReactNode;
}

export const PopupFooter = (props: Props) => {
  return <div className="popupFooter">{props.children}</div>;
};
