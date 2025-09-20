import React, { useRef, useState } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { Utils } from '../libs/utils';
import { toastError } from './ToastMessage';
import { RangePickerProps } from 'antd/es/date-picker';

interface DisabledRange {
  before?: dayjs.Dayjs;
  after?: dayjs.Dayjs;
}

interface Props {
  title?: string;
  name: string;
  type?: React.HTMLInputTypeAttribute;
  value?: string;
  disable?: boolean;
  onChange?: (name: any, value: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  required?: boolean;
  filters?: object;
  wrapperClassNames?: string;
  format?: string;
  dtWidth?: string;
  disabledRange?: DisabledRange;
  defaultValue?: string;
  onClick?: () => void;
}

/** react hook form 에 의한 통제는 함수를 호출하는 측에서 구현할 것 */
export const CustomDatePicker = ({
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
  format = 'YYYY-MM-DD (ddd)',
  dtWidth,
  disabledRange,
  defaultValue,
  onClick,
}: Props) => {
  const reflectedDate = useRef('');
  const [open, setOpen] = useState(false);

  const onKeyDown = (e: React.KeyboardEvent) => {
    setTimeout(() => {
      const positionSpace = (e.target as HTMLInputElement).value.replaceAll(' ', '').indexOf('(');
      const value = Utils.formatDate((e.target as HTMLInputElement).value.substring(0, positionSpace));
      if (e.key === 'Enter') {
        if (onEnter) {
          /** 반영된 날짜가 존재하여야 작동 */
          if (onChange) {
            onChange(name, value === null ? '' : dayjs(value).format('YYYY-MM-DD'));
          }
          onEnter();
        } else {
          if (value.includes('-')) {
            /** '-' 기호를 사용하여 날짜를 작성한 경우 */
            if (value.length == 8) {
              if (dayjs(value, 'YY-MM-DD').toDate().toString() == 'Invalid Date') {
                toastError('유효한 날짜 형식이 아닙니다.');
              } else {
                console.log('value.length == 8==>', value);
                reflectedDate.current = value;
              }
            } else if (value.length == 10) {
              if (dayjs(value, 'YYYY-MM-DD').toDate().toString() == 'Invalid Date') {
                toastError('유효한 날짜 형식이 아닙니다.');
              } else {
                reflectedDate.current = value;
              }
            } else {
              toastError('2자리 혹은 4자리 연도를 가지는 완전한 날짜 형식을 입력하십시요!');
            }
          } else {
            /** 순수 숫자로만 날짜를 작성한 경우 */
            if (value.length == 6) {
              const suggested = value.slice(0, 2) + '-' + value.slice(2, 4) + '-' + value.slice(4, 6);
              if (dayjs(suggested, 'YY-MM-DD').toDate().toString() == 'Invalid Date') {
                toastError('유효한 날짜 형식이 아닙니다.');
              } else {
                console.log(suggested);
                reflectedDate.current = suggested;
              }
            } else if (value.length == 8) {
              const suggested = value.slice(0, 4) + '-' + value.slice(4, 6) + '-' + value.slice(6, 8);
              if (dayjs(suggested, 'YYYY-MM-DD').toDate().toString() == 'Invalid Date') {
                toastError('유효한 날짜 형식이 아닙니다.');
              } else {
                console.log(suggested);
                reflectedDate.current = suggested;
              }
            } else {
              toastError('2자리 혹은 4자리 연도를 가지는 완전한 날짜 형식을 입력하십시요.');
            }
          }
          setOpen(false);
        }
      } else {
        console.log('value2 ==>', value);
        reflectedDate.current = value;
      }
    }, 0);
  };
  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    const before = disabledRange?.before;
    const after = disabledRange?.after;
    if (current) {
      if (before && !after) {
        return current < before;
      } else if (!before && after) {
        return current > after.add(1, 'day');
      } else if (before && after) {
        return current < before || current > after.add(1, 'day');
      }
    }
    return false;
  };

  // focus 관련
  const [focusStates, setFocusStates] = useState<{ [key: string]: boolean }>({});
  const handleFocus = (name: string) => {
    setFocusStates((prev) => ({ ...prev, [name]: true }));
  };
  const handleBlur = (name: string) => {
    setFocusStates((prev) => ({ ...prev, [name]: false }));
  };

  {
    /*
      <dl className={wrapperClassNames}>
            <dt>
              <label>{title}</label>
              {required && <span className="req">*</span>}
            </dt>
            <dd>
              <div className={`formBox ${focusStates[name] ? 'focus' : ''} border`}>
  <DatePicker
    placeholder={placeholder}
    disabled={disable}
    format={format}
    value={
      !value
        ? reflectedDate.current.length == 10
          ? dayjs(reflectedDate.current, 'YYYY-MM-DD')
          : reflectedDate.current.length == 8
            ? dayjs(reflectedDate.current, 'YY-MM-DD')
            : undefined
        : dayjs(value, format)
    }
    name={name}
    onChange={(e) => {
      if (onChange) {
        console.log('e... onChange==>', e);
        onChange(name, e === null ? '' : dayjs(e).format('YYYY-MM-DD'));
      }
    }}
    open={open}
    onOpenChange={(isOpen) => setOpen(isOpen)}
    onKeyDown={onKeyDown}
    disabledDate={disabledDate}
    defaultValue={!defaultValue ? undefined : dayjs(defaultValue, format)}
    onClick={Utils.datePickerOnClick}
    onFocus={() => {
      handleFocus(name);
    }}
    onBlur={() => {
      handleBlur(name);
    }}
  />
</div>
</dd>
</dl>
  */
  }
  return (
    <>
      {title ? (
        <>
          <dl className={wrapperClassNames}>
            <dt>
              <label>{title}</label>
              {required && <span className="req">*</span>}
            </dt>
            <dd>
              <div className={`formBox border`}>
                {/*// 일반 DatePicker(with title) */}
                <DatePicker
                  placeholder={placeholder}
                  disabled={disable}
                  format={format}
                  value={
                    !value
                      ? reflectedDate.current.length == 10
                        ? dayjs(reflectedDate.current, 'YYYY-MM-DD')
                        : reflectedDate.current.length == 8
                        ? dayjs(reflectedDate.current, 'YY-MM-DD')
                        : undefined
                      : dayjs(value, format)
                  }
                  name={name}
                  onChange={(e) => {
                    if (onChange) {
                      console.log('e... onChange==>', e);
                      onChange(name, e === null ? '' : dayjs(e).format('YYYY-MM-DD'));
                    }
                  }}
                  open={open}
                  onOpenChange={(isOpen) => setOpen(isOpen)}
                  onKeyDown={onKeyDown}
                  disabledDate={disabledDate}
                  defaultValue={!defaultValue ? undefined : dayjs(defaultValue, format)}
                  onClick={Utils.datePickerOnClick}
                />
              </div>
            </dd>
          </dl>
        </>
      ) : (
        <div className={`formBox border`}>
          {/*// 일반 DatePicker(withOut title) */}
          <DatePicker
            placeholder={placeholder}
            disabled={disable}
            format={format}
            value={
              !value
                ? reflectedDate.current.length == 10
                  ? dayjs(reflectedDate.current, 'YYYY-MM-DD')
                  : reflectedDate.current.length == 8
                  ? dayjs(reflectedDate.current, 'YY-MM-DD')
                  : undefined
                : dayjs(value, format)
            }
            name={name}
            onChange={(e) => {
              if (onChange) {
                console.log('e... onChange==>', e);
                onChange(name, e === null ? '' : dayjs(e).format('YYYY-MM-DD'));
              }
            }}
            open={open}
            onOpenChange={(isOpen) => setOpen(isOpen)}
            onKeyDown={onKeyDown}
            disabledDate={disabledDate}
            defaultValue={!defaultValue ? undefined : dayjs(defaultValue, format)}
            onClick={Utils.datePickerOnClick}
          />
        </div>
      )}
    </>
  );
};

export default CustomDatePicker;
