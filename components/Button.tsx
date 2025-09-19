import React, { ReactElement, ReactNode } from 'react';
import { IComponentProps } from '../types/IComponentProps';
import styles from '../styles/delete/button.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

type ButtonStyle = IComponentProps;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyle {
  children: ReactNode;
  loading?: boolean;
}

export const Button = ({ className, children, ...props }: ButtonProps): ReactElement => {
  return (
    <button
      type={'button'}
      className={cx(className)}
      {...props}
      onClick={(e) => {
        if (props.onClick) {
          props.onClick(e);
        }
        (e.target as HTMLButtonElement).blur();
      }}
    >
      {children}
    </button>
  );
};
