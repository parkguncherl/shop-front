import { DropDownOption } from '../../types/DropDownOptions';
import { Select, Space } from 'antd';
import { SelectCommonPlacement } from 'antd/lib/_util/motion';
import { BaseSelectRef } from 'rc-select';
import React, { forwardRef } from 'react';

interface Props {
  value?: string | number;
  values?: string[];
  options?: DropDownOption[];
  name: string;
  placeholder?: string;
  onChangeOptions?: (name: string, value: string | number, defaultValue?: string | number) => void;
  onChangeControl?: (e: any) => void;
  placement?: SelectCommonPlacement;
  readonly?: boolean;
  disabledOptionValues?: (string | number | undefined)[];
  style?: React.CSSProperties;
  defaultValue?: string;
  defaultValues?: DropDownOption[];
  selectorShowAction?: ('focus' | 'click')[] | undefined;
  multiple?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  optionClass?: string; // 옵션class
  dropDownStyle?: React.CSSProperties;
  virtual?: boolean;
  className?: string;
  onFocus?: (e: React.FocusEvent<HTMLElement, Element>) => void;
  onBlur?: () => void;
  disabled?: boolean;
}

const DropDownAtom = forwardRef(function DropDownAtom(
  {
    value,
    values,
    options,
    name,
    placeholder,
    onChangeOptions,
    onChangeControl,
    placement = 'bottomLeft',
    readonly = false,
    disabledOptionValues = [],
    style,
    defaultValue,
    selectorShowAction,
    multiple,
    onKeyDown,
    optionClass,
    dropDownStyle,
    virtual,
    className,
    onFocus,
    onBlur,
    disabled,
  }: Props,
  ref: React.ForwardedRef<BaseSelectRef>,
) {
  const handleChange = (selectedValues: any) => {
    if (onChangeOptions) {
      onChangeOptions(name, selectedValues, defaultValue);
    }
    if (onChangeControl) {
      onChangeControl(selectedValues);
    }
  };

  return (
    <>
      {multiple ? (
        <Space>
          <Select
            mode="multiple"
            allowClear
            value={values || []} // 빈 배열로 기본값 설정
            onChange={handleChange} // onChange로 선택된 값 업데이트
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            placement={placement}
            disabled={disabled}
            aria-readonly={readonly}
            ref={ref}
            showAction={selectorShowAction}
            classNames={{ popup: { root: optionClass } }} // 최신 권장 방식
            onFocus={onFocus}
            styles={{ popup: { root: dropDownStyle } }}
            onBlur={onBlur}
          >
            {options
              ?.filter((f) => !disabledOptionValues?.includes(f.value))
              .map((o, index: any) => {
                return (
                  <Select.Option key={o.key + index} value={o.value} name={name}>
                    {o.label}
                  </Select.Option>
                );
              })}
          </Select>
        </Space>
      ) : (
        <Select
          value={options?.find((v) => String(v.value) === String(value ?? defaultValue))}
          onSelect={(v) => {
            if (onChangeOptions) {
              onChangeOptions(name, v as string);
            }
          }}
          onKeyDown={onKeyDown}
          onChange={(value) => {
            //            console.log('value =============>', value);
            const defOption = options?.find((v) => v.value === value);
            if (onChangeOptions) {
              onChangeOptions(name, value as string, defOption?.defaultValue);
            }
            if (onChangeControl) {
              onChangeControl(value);
            }
          }}
          placeholder={placeholder}
          placement={placement}
          disabled={disabled}
          aria-readonly={readonly}
          style={dropDownStyle ? dropDownStyle : { width: '100%' }}
          ref={ref}
          showAction={selectorShowAction}
          classNames={{ popup: { root: optionClass } }} // dropdownClassName 대체
          styles={{
            popup: {
              root: dropDownStyle, // 드롭다운 전용 스타일
            },
          }}
          virtual={virtual} // 가상 스크롤 여부
          className={className}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          {options
            ?.filter((f) => !disabledOptionValues?.includes(f.value))
            .map((o: any, index: any) => {
              return (
                <Select.Option key={o.key + index + o.value} value={o.value} name={name} defaultValue={o.defaultValue}>
                  {/*{o.label}*/}
                  {o.label?.includes('shopNewSeller') ? (
                    <>
                      {o.label.split('binblurNewSeller')[0]} <span>신규</span>
                    </>
                  ) : (
                    o.label
                  )}
                </Select.Option>
              );
            })}
        </Select>
      )}
    </>
  );
});

export default DropDownAtom;
