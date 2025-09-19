import React from 'react';
interface Props {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}
const PopupFormType = (props: Props) => {
  return (
    <div className={props.className} style={props.style}>
      {props.children}
    </div>
  );
};

export default PopupFormType;
