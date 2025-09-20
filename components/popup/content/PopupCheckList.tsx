import React from 'react';
import styles from '../../../styles/delete/popup.module.scss';

interface Props {
  children: React.ReactNode;
}

export const PopupCheckList = (props: Props) => {
  return <div className={styles.chklist_box}>{props.children}</div>;
};
