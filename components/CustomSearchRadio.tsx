import React from 'react';
import { Utils } from '../libs/utils';
import { toastError } from './ToastMessage';
import { AlertMessage } from '../libs/const';
import { Radio } from 'antd';

interface RadioOption {
  label: string;
  value: string | number;
}

interface Props {
  title?: string;
  name: string;
  value?: string | number;
  disable?: boolean;
  options: RadioOption[]; // 라디오 버튼 옵션 배열
  onChange?: (name: any, value: string | number) => void;
  onEnter?: () => void;
  required?: boolean;
  filters?: object;
  wrapperClassNames?: string;
  button?: boolean;
}

export const CustomSearchRadio = ({ title, name, value, disable, options, onChange, onEnter, required = false, filters, wrapperClassNames, button }: Props) => {
  const radioGroup = button ? (
    <Radio.Group
      name={name}
      className={'btnRadio'}
      value={value}
      disabled={disable}
      onChange={(e) => {
        if (onChange) {
          onChange(name, e.target.value);
        }
      }}
      optionType="button" // 버튼 스타일 사용
      buttonStyle="solid"
    >
      {options.map((option) => (
        <Radio key={option.value} value={option.value}>
          {option.label}
        </Radio>
      ))}
    </Radio.Group>
  ) : (
    <Radio.Group
      name={name}
      value={value}
      disabled={disable}
      onChange={(e) => {
        if (onChange) {
          onChange(name, e.target.value);
        }
      }}
    >
      {options.map((option) => (
        <Radio key={option.value} value={option.value}>
          {option.label}
        </Radio>
      ))}
    </Radio.Group>
  );

  return (
    <>
      {title ? (
        <dl className={wrapperClassNames}>
          <dt>
            <label>{title}</label>
            {required && <span className={'req'}>*</span>}
          </dt>
          <dd>
            <div className="formBox">{radioGroup}</div>
          </dd>
        </dl>
      ) : (
        <>{radioGroup}</>
      )}
    </>
  );
};
