import React from 'react';
import CardAtom from './atom/CardAtom';

interface Props {
  title?: string;
  style?: React.CSSProperties;
  bordered?: boolean;
  children?: React.ReactNode;
  firstContent: string;
  secondContent: string | number;
  secondType: string;
  thirdContent?: string;
  small?: boolean;
}

export const CustomCard = ({ title, style, bordered, children, firstContent, secondContent, secondType, thirdContent, small = false }: Props) => {
  return (
    <CardAtom title={title} style={style} bordered={bordered}>
      <div>
        <span className={small ? 'first-content small' : 'first-content'}>{firstContent}</span>
      </div>
      <div>
        <span className={small ? 'second-content small' : 'second-content'}>{secondContent}</span>&nbsp;
        <span className={small ? 'second-type small' : 'second-type'}>{secondType}</span>
      </div>
      {thirdContent && (
        <div>
          <span className={small ? 'third-content small' : 'third-content'}>{thirdContent}</span>
        </div>
      )}
      {children}
    </CardAtom>
  );
};
