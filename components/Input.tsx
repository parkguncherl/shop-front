import React, { ChangeEvent, forwardRef, KeyboardEvent } from 'react';

interface Props {
  title?: string;
  type?: React.HTMLInputTypeAttribute;
  value?: number | string;
  name?: string;
  dtWidth?: string;
  disable?: boolean;
  readOnly?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: KeyboardEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  style?: React.CSSProperties;
  onFocus?: () => void;
  onBlur?: () => void;
  withDropdown?: boolean;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  (
    {
      title,
      placeholder,
      value,
      name,
      dtWidth,
      disable,
      readOnly,
      onChange,
      onKeyPress,
      onKeyDown,
      onFocus,
      onBlur,
      withDropdown,
      type = 'text',
      required = false,
      style,
      ...props
    },
    ref,
  ) => {
    return (
      <>
        {withDropdown ? (
          <div className={'formBox borderNone'}>
            <input
              {...props}
              ref={ref} // ✅ ref를 전달
              type={type}
              value={value}
              placeholder={placeholder}
              disabled={disable}
              readOnly={readOnly}
              onChange={onChange}
              name={name}
              onKeyPress={onKeyPress}
              onKeyDown={onKeyDown}
              autoComplete={'off'}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
        ) : (
          <dl style={style}>
            <dt style={{ width: dtWidth ? dtWidth : '' }}>
              <label>{title}</label>
              {required && <span className={'req'}>*</span>}
            </dt>
            <dd>
              <div className={'formBox border'}>
                <input
                  {...props}
                  ref={ref} // ✅ ref를 전달
                  type={type}
                  value={value}
                  placeholder={placeholder}
                  disabled={disable}
                  readOnly={readOnly}
                  onChange={onChange}
                  name={name}
                  onKeyPress={onKeyPress}
                  onKeyDown={onKeyDown}
                  autoComplete={'off'}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </dd>
          </dl>
        )}
      </>
    );
  },
);

Input.displayName = 'Input';
