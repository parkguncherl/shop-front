import { useController, FieldValues } from 'react-hook-form';
import { DropDownOption } from '../types/DropDownOptions';
import React, { useRef, useState } from 'react';
import { TControl } from '../types/Control';
import DatePickerAtom from './atom/DatePickerAtom';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import onChange = toast.onChange;

type TProps<T extends FieldValues> = TControl<T> & {
  title?: string;
  codeUpper?: string;
  options?: DropDownOption[];
  name: string;
  type?: 'single' | 'flex';
  required?: boolean;
  defaultOptions?: DropDownOption[];
  style?: React.CSSProperties;
  // onChange?: (name: string, value: string | number) => void;
  onPropsChange?: (e: React.ChangeEvent<any>) => void;
  year?: boolean;
  disabled?: boolean;
  format?: string;
  className?: string;
};

function FormDatePicker<T extends FieldValues>(props: TProps<T>) {
  const el = useRef<HTMLDListElement | null>(null);
  const {
    field: { name, onChange: controlChange, value },
    fieldState: { error },
  } = useController({
    name: props.name,
    rules: props.rules,
    control: props.control,
  });

  const handleChange = (dateString: string) => {
    // 기존 controlChange 호출
    controlChange(dateString);

    // onPropsChange 호출 (props로 전달된 경우)
    if (props.onPropsChange) {
      const event = {
        target: {
          name,
          value: dateString,
        },
      } as React.ChangeEvent<any>;
      props.onPropsChange(event);
    }
  };

  const currentYear = dayjs().year();
  const nextYear = currentYear + 1;
  const disabledDate = (current: any) => {
    // 현재 날짜가 올해나 내년에 속하지 않는 경우 비활성화
    const year = current.year();
    return year < currentYear || year > nextYear;
  };
  const hideUnavailableYears = (value: any) => {
    if (typeof window !== 'undefined') {
      const yearDropdown = document.querySelector('.ant-picker-year-panel ul');
      if (yearDropdown) {
        const years = yearDropdown.querySelectorAll('li');
        years.forEach((yearItem) => {
          const year = parseInt(yearItem.innerText, 10);
          if (year < currentYear || year > nextYear) {
            yearItem.style.display = 'none';
          }
        });
      }
    }
  };

  return (
    <>
      {props.year ? (
        <>
          <dl ref={el} className={props.className}>
            <dt>
              <label>{props.title}</label>
              {props.required && <span className={'req'}>*</span>}
            </dt>
            <dd>
              <div className={'formBox'}>
                <DatePicker.YearPicker
                  name={name}
                  onChange={controlChange}
                  value={value ? dayjs(value) : ''}
                  disabledDate={disabledDate}
                  onOpenChange={hideUnavailableYears}
                />
              </div>
              {error && (
                <span className={'error_txt'} style={{ marginTop: '5px' }}>
                  {error?.message}
                </span>
              )}
            </dd>
          </dl>
          {error && (
            <span className={'error_txt'} style={{ marginTop: '5px' }}>
              {error?.message}
            </span>
          )}
        </>
      ) : (
        <>
          {props.title && (
            <dl ref={el} className={props.className}>
              <dt style={{ ...props.style }}>
                <label>{props.title}</label>
                {props.required && <span className={'req'}>*</span>}
              </dt>
              <dd>
                <DatePickerAtom
                  name={name}
                  onChange={handleChange}
                  value={value ? dayjs(value).format(props.format || 'YYYY-MM-DD') : ''}
                  disable={props.disabled}
                />
                {error && (
                  <span className={'error_txt'} style={{ marginTop: '5px' }}>
                    {error?.message}
                  </span>
                )}
              </dd>
            </dl>
          )}
          {!props.title && (!props.type || props.type === 'single') && (
            <>
              <DatePickerAtom name={name} onChange={handleChange} value={value} disable={props.disabled} className={props.className} />
              {error && (
                <span className={'error_txt'} style={{ marginTop: '5px' }}>
                  {error?.message}
                </span>
              )}
            </>
          )}
          {!props.title && props.type === 'flex' && (
            <>
              <DatePickerAtom name={name} onChange={handleChange} value={value} disable={props.disabled} className={props.className} />
              {error && (
                <span className={'error_txt'} style={{ marginTop: '5px' }}>
                  {error?.message}
                </span>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}

export default FormDatePicker;
