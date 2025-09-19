import React, { useState } from 'react';
import { Utils } from '../libs/utils';
import { toastError } from './ToastMessage';
import { AlertMessage } from '../libs/const';
import { Input, InputRef } from 'antd';

interface Props {
  title?: string;
  styles?: React.CSSProperties;
  name: string;
  type?: React.HTMLInputTypeAttribute;
  value?: string | number;
  disable?: boolean;
  onChange?: (name: any, value: string | number) => void;
  onEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  filters?: object;
  wrapperClassNames?: string;
  reference?: React.RefObject<InputRef>;
  list?: string; // datalist 사용을 위한 속성
  keyDownEvent?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const CustomInput = ({
  title,
  styles,
  name,
  placeholder,
  value,
  disable,
  onChange,
  onEnter,
  type = 'text',
  required = false,
  filters,
  wrapperClassNames,
  reference,
  list,
  keyDownEvent,
}: Props) => {
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (onEnter) {
        if (required && Utils.isEmptyValues(filters)) {
          toastError(AlertMessage.RequiredParams || ''); // required 속성 참일 경우 값 입력 여부 검사
        } else {
          onEnter(e);
        }
      }
    } else {
      if (keyDownEvent) {
        keyDownEvent(e);
      }
    }
  };

  const [focusStates, setFocusStates] = useState<{ [key: string]: boolean }>({});
  const handleFocus = (name: string) => {
    setFocusStates((prev) => ({ ...prev, [name]: true }));
  };
  const handleBlur = (name: string) => {
    setFocusStates((prev) => ({ ...prev, [name]: false }));
  };

  return (
    <>
      {title ? (
        <dl className={wrapperClassNames}>
          <dt>
            <label>{title}</label>
            {required && <span className={'req'}>*</span>}
          </dt>
          <dd>
            <div className={`formBox border ${focusStates[name] ? 'focus' : ''}`}>
              <Input
                style={styles}
                placeholder={placeholder}
                disabled={disable}
                type={type}
                value={value}
                name={name}
                ref={reference}
                autoComplete={'off'}
                onChange={(e) => {
                  if (onChange) {
                    onChange(name, e.target.value);
                  }
                }}
                list={list}
                onKeyDown={onKeyDown}
                onFocus={() => {
                  handleFocus(name);
                }}
                onBlur={() => {
                  handleBlur(name);
                }}
                allowClear
              />
            </div>
          </dd>
        </dl>
      ) : (
        <Input
          style={styles}
          placeholder={placeholder}
          disabled={disable}
          type={type}
          value={value}
          name={name}
          autoComplete={'off'}
          ref={reference}
          onChange={(e) => {
            if (onChange) {
              onChange(name, e.target.value);
            }
          }}
          onKeyDown={onKeyDown}
          onFocus={() => {
            handleFocus(name);
          }}
          onBlur={() => {
            handleBlur(name);
          }}
          allowClear
        />
      )}
    </>
  );
};
