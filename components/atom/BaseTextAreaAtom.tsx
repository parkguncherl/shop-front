import React from 'react';
import { Input } from 'antd';

export interface Props {
  name: string;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'password';
  value?: string | number;
  readonly?: boolean;
  disable?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  style?: React.CSSProperties;
  rows?: number;
  maxLength?: number;
}

export const BaseTextAreaAtom = ({
  name,
  label,
  placeholder,
  type = 'text',
  value = '',
  readonly,
  disable,
  onChange,
  onKeyDown,
  style,
  rows,
  maxLength,
}: Props) => {
  const { TextArea } = Input;
  return (
    <>
      <TextArea
        rows={rows}
        maxLength={maxLength}
        name={name}
        value={value}
        style={style}
        placeholder={placeholder}
        onChange={onChange}
        onKeyDown={onKeyDown}
        readOnly={readonly}
        disabled={disable}
        autoComplete={'off'}
      ></TextArea>
    </>
  );
};
