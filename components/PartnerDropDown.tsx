import React, { useEffect, useState } from 'react';
import { authApi } from '../libs';
import { ApiResponseListPartnerCodeDropDown, PartnerCodeResponseLowerSelect } from '../generated';
import { useQuery } from '@tanstack/react-query';
import { toastError } from './ToastMessage';
import { DropDownOption } from '../types/DropDownOptions';
import DropDownAtom from './atom/DropDownAtom';
import { SelectCommonPlacement } from 'antd/lib/_util/motion';
import { BaseSelectRef } from 'rc-select';

interface Props {
  title?: string;
  name: string;
  placeholder?: string;
  codeUpper?: string;
  partnerId?: number;
  enumName?: string;
  value?: string | number;
  onChange?: (event: string, value: string | number, defaultValue?: string | number) => void;
  style?: React.CSSProperties;
  isSearch?: boolean;
  required?: boolean;
  dtWidth?: string;
  defaultOptions?: DropDownOption[];
  placement?: SelectCommonPlacement;
  wrapperClassNames?: string;
  dropDownStyle?: React.CSSProperties;
  readonly?: boolean;
  ref?: React.RefObject<BaseSelectRef>;
  filterData?: string;
}

export const PartnerDropDown = ({
  title,
  name,
  placeholder,
  codeUpper,
  partnerId,
  value = '',
  onChange,
  style,
  isSearch,
  required,
  dtWidth,
  defaultOptions,
  placement,
  enumName,
  wrapperClassNames,
  dropDownStyle,
  readonly = false,
  ref,
  filterData,
}: Props) => {
  const { data, isLoading } = useQuery(
    ['/partnerCode/dropdown/' + codeUpper],
    () =>
      authApi.get<ApiResponseListPartnerCodeDropDown>('/partnerCode/dropdown', {
        params: {
          codeUpper,
          partnerId,
        },
      }),
    {
      enabled: !!codeUpper,
      select: (e) => {
        if (filterData) {
          const keywords = filterData.split(',').map((s) => s.trim());
          return e.data?.body
            ?.map((v: PartnerCodeResponseLowerSelect) => ({ key: v.codeCd, value: v.codeCd, label: v.codeNm, defaultValue: v.defCodeVal }))
            .filter((fData) => fData.label && keywords.some((keyword) => fData.label?.includes(keyword))) as DropDownOption[];
        } else {
          return e.data?.body?.map((v: PartnerCodeResponseLowerSelect) => ({
            key: v.codeCd,
            value: v.codeCd,
            label: v.codeNm,
            defaultValue: v.defCodeVal,
          })) as DropDownOption[];
        }
      },
      onError: (e) => {
        toastError(e?.toString() || '오류');
      },
    },
  );
  useEffect(() => {
    console.log(data);
  }, [data]);

  // focus 관련
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
            <div className={`formBox ${focusStates[name] ? 'focus' : ''} border`}>
              <div className="selBox">
                <DropDownAtom
                  name={name}
                  placeholder={placeholder || '선택'}
                  value={value}
                  options={[{ key: '선택', value: '선택', label: '선택' }, ...(data || [])]}
                  onChangeOptions={onChange}
                  placement={placement}
                  style={dropDownStyle}
                  readonly={readonly}
                  ref={ref}
                  onFocus={() => {
                    handleFocus(name);
                  }}
                  onBlur={() => {
                    handleBlur(name);
                  }}
                />
              </div>
            </div>
          </dd>
        </dl>
      ) : (
        <div className={`formBox ${focusStates[name] ? 'focus' : ''} border`}>
          <DropDownAtom
            name={name}
            placeholder={placeholder || '선택'}
            value={value}
            options={[{ key: '선택', value: '선택', label: '선택' }, ...(data || [])]}
            onChangeOptions={onChange}
            placement={placement}
            style={dropDownStyle}
            readonly={readonly}
            ref={ref}
            onFocus={() => {
              handleFocus(name);
            }}
            onBlur={() => {
              handleBlur(name);
            }}
          />
        </div>
      )}
    </>
  );
};
