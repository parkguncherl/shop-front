import React, { useEffect, useState } from 'react';
import { DatePicker } from 'antd';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { Utils } from '../libs/utils';
import { toastError } from './ToastMessage';
import { AlertMessage } from '../libs/const';
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
}

/** react hook form 에 의한 통제는 함수를 호출하는 측에서 구현할 것 */
export const CustomMonthPicker = ({
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
  format = 'YYYY-MM',
  dtWidth,
  disabledRange,
  defaultValue,
}: Props) => {
  const [reflectedDate, setReflectedDate] = useState('');
  const [isModifying, setModificationStatus] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setModificationStatus(false);
  }, [reflectedDate]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const value = Utils.removeMatch((e.target as HTMLInputElement).value, '(월)');
    if (e.key === 'Enter') {
      if (onEnter && !isModifying) {
        /** 반영된 날짜가 존재하여야 작동 */
        if (Utils.isEmptyValues(filters)) {
          toastError(AlertMessage.RequiredParams);
        } else {
          onEnter();
        }
      } else {
        if (value.includes('-')) {
          /** '-' 기호를 사용하여 날짜를 작성한 경우 */
          if (value.length == 7) {
            if (dayjs(value, 'YYYY-MM').isValid()) {
              setReflectedDate(value);
            } else {
              toastError('유효한 년월 형식이 아닙니다.');
            }
          } else {
            toastError('YYYY-MM 형식으로 입력해주세요.');
          }
        } else {
          /** 순수 숫자로만 날짜를 작성한 경우 */
          if (value.length == 6) {
            const suggested = value.slice(0, 4) + '-' + value.slice(4, 6);
            if (dayjs(suggested, 'YYYY-MM').isValid()) {
              setReflectedDate(suggested);
            } else {
              toastError('유효한 년월 형식이 아닙니다.');
            }
          } else {
            toastError('YYYYMM 형식으로 입력해주세요.');
          }
        }
        setOpen(false);
      }
    } else {
      setModificationStatus(true);
    }
  };

  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    const before = disabledRange?.before;
    const after = disabledRange?.after;
    if (current) {
      if (before && !after) {
        return current < before;
      } else if (!before && after) {
        return current > after.add(1, 'month');
      } else if (before && after) {
        return current < before || current > after.add(1, 'month');
      }
    }
    return false;
  };

  return (
    <dl className={wrapperClassNames}>
      <dt>
        <label>{title}</label>
        {required && <span className="req">*</span>}
      </dt>
      <dd>
        <div className="formBox">
          <DatePicker
            picker="month"
            placeholder={placeholder}
            disabled={disable}
            format={format}
            value={!value ? (reflectedDate ? dayjs(reflectedDate, 'YYYY-MM') : undefined) : dayjs(value, format)}
            name={name}
            onChange={(e) => {
              if (onChange) {
                onChange(name, e === null ? '' : dayjs(e).format('YYYY-MM'));
              }
            }}
            open={open}
            onOpenChange={(isOpen) => setOpen(isOpen)}
            onKeyDown={onKeyDown}
            disabledDate={disabledDate}
            defaultValue={!defaultValue ? undefined : dayjs(defaultValue, format)}
          />
        </div>
      </dd>
    </dl>
  );
};

export default CustomMonthPicker;
