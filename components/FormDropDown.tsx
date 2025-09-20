import { useController, FieldValues } from 'react-hook-form';
import { DropDownOption } from '../types/DropDownOptions';
import React, { forwardRef, useEffect, useRef, useState } from 'react';
import DropDownAtom from './atom/DropDownAtom';
import { authApi } from '../libs';
import { ApiResponseListCodeDropDown } from '../generated';
import { TControl } from '../types/Control';
import { BaseSelectRef } from 'rc-select';
import { Input } from 'antd';
import { toastError, toastSuccess } from './ToastMessage';
import { Utils } from '../libs/utils';

type TProps<T extends FieldValues> = TControl<T> & {
  title?: string;
  codeUpper?: string;
  options?: DropDownOption[];
  name: string;
  type?: 'single' | 'flex';
  required?: boolean;
  defaultOptions?: DropDownOption[];
  style?: React.CSSProperties;
  onChange?: (name: string, value: string | number) => void;
  readonly?: boolean;
  disabledOptionValues?: string[];
  multiple?: boolean;
  multipleDefaultValues?: DropDownOption[];
  virtual?: boolean;
  isPartnerCode?: boolean;
  disabled?: boolean;
  gbCode?: string;
  className?: string;
  refOfDropDown?: React.RefObject<BaseSelectRef>;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  defaultValue?: string;
};

const FormDropDownInner = <T extends FieldValues>(props: TProps<T>, ref: React.ForwardedRef<BaseSelectRef>) => {
  const {
    field: { name, onChange: controlChange, value },
    fieldState: { error },
  } = useController({
    name: props.name,
    rules: props.rules,
    control: props.control,
  });
  const el = useRef<HTMLDListElement | null>(null);
  const [dropDownData, setDropDownData] = useState<DropDownOption[]>(props.defaultOptions || []);
  const params = { codeUpper: props.codeUpper };
  const [gbVal, setGbVal] = useState(props.title);

  useEffect(() => {
    if (props.codeUpper) {
      getDropDownData();
    }
  }, [props.codeUpper]);

  const getDropDownData = async () => {
    try {
      const apiUrl = props.isPartnerCode ? '/partnerCode/dropdown' : '/code/dropdown';
      const res = await authApi.get<ApiResponseListCodeDropDown>(apiUrl, {
        params: {
          ...params,
        },
      });
      const newDropDownData = [
        ...dropDownData,
        ...(res.data.body || [])
          .map(
            (v) =>
              ({
                key: v.codeCd,
                value: v.codeCd,
                label: v.codeNm,
              } as DropDownOption),
          )
          .filter((f) => f),
      ];
      setDropDownData(newDropDownData);
    } catch (err) {
      console.log('실패');
    }
  };

  const values = props.multiple ? (Array.isArray(value) ? value : []) : value;

  const [focusStates, setFocusStates] = useState<{ [key: string]: boolean }>({});
  const handleFocus = (name: string) => {
    setFocusStates((prev) => ({ ...prev, [name]: true }));
  };
  const handleBlur = (name: string) => {
    setFocusStates((prev) => ({ ...prev, [name]: false }));
  };

  const onKeyDown = async (e: React.KeyboardEvent) => {
    if (e.code === 'Enter') {
      if (props.gbCode && gbVal) {
        try {
          const result = await authApi.post('/partnerCode/updatePartnerCode', {
            partnerId: 0,
            codeUpper: 'P0010',
            codeCd: props.gbCode,
            codeNm: gbVal,
          });
          const { resultCode, body, resultMessage } = result.data;
          if (resultCode == 200) {
            Utils.updateGubun(props.gbCode, gbVal); // 로컬스토리지 정보 변경
            /*
            await updateSession({
              ...session,
              user: {
                ...session?.user,
                [(props.gbCode as string).toLowerCase()]: gbVal,
              },
            });
*/
            toastSuccess('구분 변경 성공');
          } else {
            toastError('구분수정 오류');
          }
        } catch (error) {
          toastError('구분수정 오류');
        }
      }
    }
  };

  const onChange = (value: string) => {
    setGbVal(value);
  };

  return (
    <>
      {props.multiple ? (
        <dl>
          <dt>
            <label>{props.title}</label>
            {props.required && <span className={'req'}>*</span>}
          </dt>
          <dd>
            <div className={`formBox ${props.disabled ? 'disabled' : ''} ${focusStates[name] ? 'focus' : ''} border`}>
              <DropDownAtom
                name={name}
                values={values}
                options={props.codeUpper ? dropDownData : props.options || []}
                onChangeOptions={props.onChange}
                onChangeControl={controlChange}
                defaultValues={props.defaultOptions || []}
                readonly={props.readonly}
                multiple={props.multiple}
                ref={props.refOfDropDown}
                virtual={props.virtual}
                onFocus={() => {
                  handleFocus(name);
                }}
                onBlur={() => {
                  handleBlur(name);
                }}
                disabled={props.disabled}
                onKeyDown={props.onKeyDown}
              />
            </div>
            {error && (
              <span className={'error_txt'} style={{ marginTop: '5px' }}>
                {error?.message}
              </span>
            )}
          </dd>
        </dl>
      ) : (
        <>
          {props.title && (
            <dl ref={el} style={{ ...props.style }} className={props.className}>
              <dt>
                {props.gbCode ? <Input onKeyDown={onKeyDown} onChange={(e) => setGbVal(e.target.value)} value={gbVal} /> : <label>{props.title}</label>}
                {props.required && <span className={'req'}>*</span>}
              </dt>
              <dd>
                <div className={`formBox ${props.disabled ? 'disabled' : ''} ${focusStates[name] ? 'focus' : ''} border`}>
                  <DropDownAtom
                    name={name}
                    value={value || ''}
                    options={props.codeUpper ? dropDownData : props.options || []}
                    onChangeOptions={props.onChange}
                    onChangeControl={controlChange}
                    readonly={props.readonly}
                    virtual={props.virtual}
                    ref={props.refOfDropDown}
                    onFocus={() => {
                      handleFocus(name);
                    }}
                    onBlur={() => {
                      handleBlur(name);
                    }}
                    onKeyDown={props.onKeyDown}
                    disabled={props.disabled}
                    defaultValue={props.defaultValue || ''}
                  />
                </div>
                {error && (
                  <span className={'error_txt'} style={{ marginTop: '5px' }}>
                    {error?.message}
                  </span>
                )}
              </dd>
            </dl>
          )}
          {!props.title && (!props.type || props.type === 'single') && (
            <div className={`formBox ${props.disabled ? 'disabled' : ''} ${focusStates[name] ? 'focus' : ''} border ${props.className}`}>
              <DropDownAtom
                name={name}
                value={value}
                options={props.codeUpper ? dropDownData : props.options || []}
                onChangeOptions={props.onChange}
                onChangeControl={controlChange}
                readonly={props.readonly}
                disabledOptionValues={props.disabledOptionValues}
                virtual={props.virtual}
                style={props.style}
                ref={props.refOfDropDown}
                onFocus={() => {
                  handleFocus(name);
                }}
                onBlur={() => {
                  handleBlur(name);
                }}
                onKeyDown={props.onKeyDown}
                disabled={props.disabled}
              />
              {error && <span className={'error_txt'}>{error?.message}</span>}
            </div>
          )}
          {!props.title && props.type === 'flex' && (
            <>
              <DropDownAtom
                name={name}
                value={value}
                options={props.codeUpper ? dropDownData : props.options || []}
                onChangeOptions={props.onChange}
                onChangeControl={controlChange}
                readonly={props.readonly}
                virtual={props.virtual}
                ref={props.refOfDropDown}
                onFocus={() => {
                  handleFocus(name);
                }}
                onBlur={() => {
                  handleBlur(name);
                }}
                onKeyDown={props.onKeyDown}
                disabled={props.disabled}
              />
              {error && (
                <span className={'error_txt'} style={{ marginTop: 5 }}>
                  {error?.message}
                </span>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

/** 제네릭 사용을 위한 타입 캐스팅 */
const FormDropDown = forwardRef(FormDropDownInner) as <T extends FieldValues>(
  props: TProps<T>,
  ref: React.ForwardedRef<BaseSelectRef>,
) => ReturnType<typeof FormDropDownInner>;

export default FormDropDown;
