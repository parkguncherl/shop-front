import React from 'react';
import { Checkbox } from 'antd';

interface CheckboxOption {
  label: string;
  value: string | number;
}

interface Props {
  title?: string;
  name: string;
  value?: (string | number)[]; // 체크박스 그룹에서는 배열로 여러 값을 선택할 수 있음
  disable?: boolean;
  options: CheckboxOption[]; // 체크박스 옵션 배열
  onChange?: (name: any, value: (string | number)[]) => void;
  onEnter?: () => void;
  required?: boolean;
  filters?: object;
  wrapperClassNames?: string;
}

export const CustomSearchCheckBox = ({ title, name, value, disable, options, onChange, onEnter, required = false, filters, wrapperClassNames }: Props) => {
  return (
    <>
      {title ? (
        <dl className={wrapperClassNames}>
          <dt>
            <label>{title}</label>
            {required && <span className={'req'}>*</span>}
          </dt>
          <dd>
            <div className="formBox">
              <Checkbox.Group
                name={name}
                value={value}
                disabled={disable}
                onChange={(checkedValues) => {
                  if (onChange) {
                    onChange(name, checkedValues);
                  }
                }}
              >
                {options.map((option) => (
                  <Checkbox key={option.value} value={option.value}>
                    {option.label}
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </div>
          </dd>
        </dl>
      ) : (
        <Checkbox.Group
          name={name}
          value={value}
          disabled={disable}
          onChange={(checkedValues) => {
            if (onChange) {
              onChange(name, checkedValues);
            }
          }}
        >
          {options.map((option) => (
            <Checkbox key={option.value} value={option.value}>
              {option.label}
            </Checkbox>
          ))}
        </Checkbox.Group>
      )}
    </>
  );
};
