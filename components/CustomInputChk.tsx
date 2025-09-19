import React, { useState } from 'react';
import { Utils } from '../libs/utils';
import { toastError } from './ToastMessage';
import { AlertMessage } from '../libs/const';
import { Input, InputRef } from 'antd';
import { Simulate } from 'react-dom/test-utils';
import keyDown = Simulate.keyDown;
import { CheckBox } from './CheckBox';

interface Props {
  title?: string;
  name: string;
  type?: React.HTMLInputTypeAttribute;
  value?: string | number;
  disable?: boolean;
  onChange?: (name: any, value: string | number) => void;
  onEnter?: () => void;
  placeholder?: string;
  required?: boolean;
  filters?: object;
  checked?: boolean;
  wrapperClassNames?: string;
  reference?: React.RefObject<InputRef>;
  list?: string; // datalist 사용을 위한 속성
  keyDownEvent?: (e: React.KeyboardEvent) => void;
}

export const CustomInputChk = ({
  title,
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
  checked: initialChecked = false,
}: Props) => {
  const [checked, setChecked] = useState(initialChecked);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (onEnter) {
        if (Utils.isEmptyValues(filters)) {
          toastError(AlertMessage.RequiredParams || '');
        } else {
          onEnter();
        }
      }
    } else {
      if (keyDownEvent) {
        keyDownEvent(e);
      }
    }
  };

  const handleCheckboxChange = (e: any) => {
    setChecked(e.target.checked);
  };

  return (
    <>
      {title ? (
        <dl className={`${wrapperClassNames} full`}>
          <dt>
            <label>{title}</label>
            {required && <span className={'req'}>*</span>}
          </dt>
          <dd>
            <div className="formBox inpChk">
              <Input
                placeholder={placeholder}
                disabled={disable}
                type={type}
                value={value}
                name={name}
                ref={reference}
                onChange={(e) => {
                  if (onChange) {
                    onChange(name, e.target.value);
                  }
                }}
                list={list}
                onKeyDown={onKeyDown}
              />
              <CheckBox label={'사업자명'} checked={checked} onChange={handleCheckboxChange}></CheckBox>
            </div>
          </dd>
        </dl>
      ) : (
        <>
          <Input
            placeholder={placeholder}
            disabled={disable}
            type={type}
            value={value}
            name={name}
            ref={reference}
            onChange={(e) => {
              if (onChange) {
                onChange(name, e.target.value);
              }
            }}
            onKeyDown={onKeyDown}
          />
          <CheckBox label={'사업자명'} checked={checked} onChange={handleCheckboxChange}></CheckBox>
        </>
      )}
    </>
  );
};
