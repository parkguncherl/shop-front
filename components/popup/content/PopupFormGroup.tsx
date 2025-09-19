import React from 'react';
import styles from '../../../styles/delete/popup.module.scss';
interface Props {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  title?: string;
}
const PopupFormGroup = (props: Props) => {
  return (
    <>
      {props.title ? (
        <div className={`${props.className} popupFormGroup`}>
          <h4 className="smallTitle">{props.title}</h4>
          <div>{props.children}</div>
        </div>
      ) : (
        <div className={`${props.className} popupFormGroup`}>
          <div>{props.children}</div>
        </div>
      )}
    </>
  );
};

export default PopupFormGroup;
