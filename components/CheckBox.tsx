import React from 'react';
import { Checkbox } from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';

type Props = {
  label?: string;
  checked?: boolean;
  onChange?: (e: CheckboxChangeEvent) => void;
  children?: React.ReactNode;
  // type?: 'circle' | 'rectangular';
};

export const CheckBox = ({ label, checked, onChange, children }: Props) => {
  return (
    <Checkbox checked={checked} onChange={onChange} onKeyPress={(e) => e.preventDefault()}>
      {label} {children}
    </Checkbox>
  );
};
