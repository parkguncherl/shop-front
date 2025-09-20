import React, { useState } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

interface Props {
  name: string;
  type?: React.HTMLInputTypeAttribute;
  value?: string;
  disable?: boolean;
  onChange?: (e?: any) => void;
  onEnter?: () => void;
  placeholder?: string;
  required?: boolean;
  filters?: object;
  wrapperClassNames?: string;
  format?: string;
  dtWidth?: string;
  style?: React.CSSProperties;
  allowClear?: boolean;
  handleFocus?: (name: string) => void;
  handleBlur?: (name: string) => void;
  focusStates?: { [key: string]: boolean };
  className?: string;
}

const DatePickerAtom = ({
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
  format = 'YYYY-MM-DD',
  dtWidth,
  style,
  className,
  allowClear = true,
}: Props) => {
  return (
    <div className={`formBox border ${className}`}>
      <DatePicker
        placeholder={placeholder}
        disabled={disable}
        format={format}
        value={!value ? undefined : dayjs(value, format)}
        name={name}
        allowClear={allowClear}
        onChange={onChange}
        style={style}
      />
    </div>
  );
};

export default DatePickerAtom;
