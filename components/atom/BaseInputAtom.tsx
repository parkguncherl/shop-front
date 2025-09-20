import React, { forwardRef, useEffect } from 'react';
import { Input } from 'antd';

export interface Props {
  name: string;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'password';
  value?: string | number;
  readonly?: boolean;
  disable?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  style?: React.CSSProperties;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  inputType?: string;
  allowClear?: boolean;
}

export const BaseInputAtom = forwardRef(function BaseInputAtom(
  {
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
    maxLength,
    onFocus,
    onBlur,
    inputType,
    allowClear,
  }: Props,
  ref: React.ForwardedRef<any>,
) {
  return (
    <>
      {inputType === 'password' ? (
        <Input.Password
          type={type}
          name={name}
          value={value}
          style={style}
          placeholder={placeholder}
          onChange={onChange}
          onKeyDown={onKeyDown}
          readOnly={readonly}
          disabled={disable}
          autoComplete={'off'}
          maxLength={maxLength}
          ref={ref}
          onFocus={onFocus}
          onBlur={onBlur}
          allowClear={allowClear ? allowClear : true}
        />
      ) : (
        <Input
          type={type}
          name={name}
          value={value}
          style={style}
          placeholder={placeholder}
          onChange={onChange}
          onKeyDown={onKeyDown}
          readOnly={readonly}
          disabled={disable}
          autoComplete={'off'}
          maxLength={maxLength}
          ref={ref}
          onFocus={onFocus}
          onBlur={onBlur}
          allowClear={allowClear ?? true}
        />
      )}
    </>
  );
});
