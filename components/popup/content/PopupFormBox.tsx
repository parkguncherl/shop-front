import React from 'react';
interface Props {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}
const PopupFormBox = (props: Props) => {
  return <div className={`${props.className} popupFormBox`}>{props.children}</div>;
};

export default PopupFormBox;
