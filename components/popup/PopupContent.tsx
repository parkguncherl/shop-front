import React from 'react';

interface Props {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const PopupContent = (props: Props) => {
  return <div className={`popupContent ${props.className}`}>{props.children}</div>;
};
