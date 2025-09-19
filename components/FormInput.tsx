import React, { forwardRef, useEffect, useState } from 'react';
import { FieldError, FieldValues, useController } from 'react-hook-form';
import { BaseInputAtom } from './atom/BaseInputAtom';
import { TControl } from '../types/Control';
import { AutoComplete } from 'antd';
import { useCommonStore } from '../stores';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../libs';
import { toastError, toastSuccess } from './ToastMessage';

type IInputTextProps<T extends FieldValues> = TControl<T> & {
  type?: 'text' | 'number' | 'email' | 'password';
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<any>) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  style?: React.CSSProperties;
  inputType?: 'login' | 'label' | 'single' | 'textarea' | 'file' | 'number' | 'autocomplete' | 'password';
  disable?: boolean;
  unit?: string;
  rows?: number;
  maxLength?: number;
  //inputRef?: React.ForwardedRef<any>; // input 요소 타입을 별도로 명시하지 않았으므로 타입 에러에 유의할 것
  dtWidth?: string;
  readOnly?: boolean;
  fileId?: number | string;
  isFileNm?: boolean;
  isAuthorized?: boolean;
  onClick?: () => void;
  fileInpHidden?: boolean;
  children?: React.ReactElement;
  price?: boolean;
  handleOnFocus?: () => void;
  handleOnBlur?: () => void;
  allowClear?: boolean;
  onFieldErrorChanged?: (error: FieldError | undefined) => void; // 유효한 에러가 발생하거나 다른 에러가 발생하여 errorStatus 의 값이 변할 시 호출
  priceTxt?: string;
};

const FormInput = forwardRef(function FormInput<T extends FieldValues>(
  {
    control,
    rules,
    name,
    label = '',
    placeholder,
    type = 'text',
    required = false,
    onKeyDown,
    style,
    inputType = 'label',
    disable = false,
    unit,
    rows,
    maxLength,
    //inputRef,
    dtWidth,
    readOnly,
    fileId,
    isFileNm = false,
    isAuthorized = false,
    onClick,
    fileInpHidden,
    children,
    price,
    handleOnFocus,
    handleOnBlur,
    allowClear,
    onFieldErrorChanged,
    priceTxt,
    ...props
  }: IInputTextProps<T>,
  ref?: React.ForwardedRef<any>, // input 요소 타입을 별도로 명시하지 않았으므로 타입 에러에 유의할 것
) {
  const {
    field: { value, onChange: controlChange, ref: refForUseController },
    fieldState: { isDirty, isTouched, error },
  } = useController({ name, rules, control });

  /** 공통 스토어 - API */
  const [fileDownload, deleteFile] = useCommonStore((s) => [s.fileDownload, s.deleteFile]);

  /** 파일 목록 조회 */
  const {
    data: files,
    isLoading: filesIsLoading,
    refetch: filesRefetch,
  } = useQuery(
    { queryKey: ['/common/file', fileId] },
    () =>
      authApi.get('/common/file', {
        params: { id: fileId },
      }),
    {
      enabled: !!fileId,
      onSuccess: (e) => {
        const { resultCode, body, resultMessage } = e.data;
        if (resultCode === 200) {
          if (isFileNm) {
            // 알람 모델은 파일명이 보여야됨
            setFileName(body?.fileNm);
          } else {
            // 일감#596 요청으로 초기에 첨부된 파일명이 안 보이도록 처리
            setFileName('');
          }
        } else {
          toastError(resultMessage);
        }
      },
    },
  );

  /** 파일 삭제 */
  const { mutate: deleteFileMutate, isLoading: deleteFileIsLoading } = useMutation(deleteFile, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const [fileName, setFileName] = useState<string>('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (props.onChange instanceof Function) {
      props.onChange(event);
    }
    if (inputType === 'number') {
      const value: string = event.target.value.replaceAll(',', '');
      if (value == '' || value == 'undefined' || isNaN(Number(value))) {
        controlChange(event);
      } else {
        const removedCommaValue = Number(value);
        const formattedValue = removedCommaValue.toLocaleString();
        controlChange(formattedValue);
      }
    } else {
      controlChange(event);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (props.onChange instanceof Function) {
      props.onChange(event);
    }
    controlChange(event.target.files?.[0]);
    if (event.target.files?.[0]) {
      setFileName(event.target.files?.[0].name);
    } else {
      setFileName('');
    }
  };

  const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (props.onChange instanceof Function) {
      props.onChange(event);
    }
    controlChange(event);
  };

  const [focusStates, setFocusStates] = useState<{ [key: string]: boolean }>({});
  const handleFocus = (name: string) => {
    setFocusStates((prev) => ({ ...prev, [name]: true }));
  };
  const handleBlur = (name: string) => {
    setFocusStates((prev) => ({ ...prev, [name]: false }));
  };

  const [errorStatus, setErrorStatus] = useState<FieldError | undefined>(undefined); // 개별 formInput 의 error 상태

  useEffect(() => {
    if (onFieldErrorChanged && error?.message != errorStatus?.message) {
      // 객체 참조로 동일 에러 여부를 구분하기 곤란한 관계로 다음과 같이 message 값을 비교함
      onFieldErrorChanged(error);
      setErrorStatus(error);
    }
  }, [onFieldErrorChanged, error, errorStatus]);

  return (
    <>
      {/* login */}
      {inputType === 'login' && (
        <dl>
          <dt style={{ width: dtWidth ?? '' }}>
            {['loginId', 'password'].includes.name ? <label>{label}</label> : <label>{label}</label>}

            {required && <span className={'req'}>*</span>}
          </dt>
          <dd>
            <div
              className={`formBox border ${disable ? 'disabled' : ''} ${focusStates[name] ? 'focus' : ''} ${price ? 'price' : ''} ${
                priceTxt ? 'priceTxt' : ''
              }`}
            >
              <input
                type={type}
                name={name}
                value={value || ''}
                style={style}
                placeholder={placeholder}
                onChange={controlChange}
                onKeyDown={onKeyDown}
                disabled={disable}
                maxLength={maxLength}
                readOnly={readOnly ?? false}
                ref={ref || refForUseController}
                onFocus={() => {
                  handleFocus(name);
                }}
                onBlur={() => {
                  handleBlur(name);
                }}
              />
              {priceTxt ? <span className={'priceTxt'}>{priceTxt}</span> : ''}
            </div>
            {error && (
              <span className={'error_txt'} style={{ marginTop: '5px' }}>
                {error?.message}
              </span>
            )}
          </dd>
        </dl>
      )}
      {/* with label */}
      {(inputType === 'label' || inputType === 'number') && (
        <dl>
          <dt style={{ width: dtWidth ?? '' }}>
            {['loginId', 'password'].includes.name ? <label>{label}</label> : <label>{label}</label>}

            {required && <span className={'req'}>*</span>}
          </dt>
          <dd>
            <div
              className={`formBox border ${disable ? 'disabled' : ''} ${focusStates[name] ? 'focus' : ''} ${price ? 'price' : ''}  ${
                priceTxt ? 'priceTxt' : ''
              }`}
              style={{ flexWrap: unit ? 'initial' : 'wrap' }}
            >
              <BaseInputAtom
                type={type}
                disable={disable}
                placeholder={placeholder}
                name={name}
                value={value}
                onChange={handleChange}
                onKeyDown={onKeyDown}
                style={style}
                maxLength={maxLength}
                readonly={readOnly ?? false}
                ref={ref || refForUseController}
                onFocus={() => {
                  if (handleOnFocus) {
                    handleOnFocus();
                  }
                  handleFocus(name);
                }}
                onBlur={() => {
                  if (handleOnBlur) {
                    handleOnBlur();
                  } else {
                    handleBlur(name);
                  }
                }}
                allowClear={allowClear}
              />
              {priceTxt ? <span className={'priceTxt'}>{priceTxt}</span> : ''}
              {unit && <span style={{ width: '50px', border: 'none', backgroundColor: 'transparent' }}>{unit}</span>}
            </div>
            {!onFieldErrorChanged && error && (
              <span className={'error_txt'} style={{ marginTop: '5px' }}>
                {error?.message}
              </span>
            )}
          </dd>
        </dl>
      )}
      {/* without label */}
      {inputType === 'single' && (
        <div
          className={`formBox border ${disable ? 'disabled' : ''} ${focusStates[name] ? 'focus' : ''} ${price ? 'price' : ''}  ${priceTxt ? 'priceTxt' : ''}`}
        >
          <BaseInputAtom
            type={type}
            disable={disable}
            placeholder={placeholder}
            name={name}
            value={value}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            style={style}
            maxLength={maxLength}
            readonly={readOnly ?? false}
            ref={ref || refForUseController}
            onFocus={() => {
              handleFocus(name);
            }}
            onBlur={() => {
              handleBlur(name);
            }}
            allowClear={allowClear}
          />
          {priceTxt ? <span className={'priceTxt'}>{priceTxt}</span> : ''}
          {error && <span className={'error_txt'}>{error?.message}</span>}
        </div>
      )}
      {inputType === 'textarea' && (
        <>
          <dl>
            <dt>
              <label>{label}</label>
              {required && <span className={'req'}>*</span>}
            </dt>
            <dd>
              <div className={`formBox ${focusStates[name] ? 'focus' : ''} border`}>
                <textarea
                  name={name}
                  value={value || ''}
                  style={style}
                  placeholder={placeholder}
                  onChange={controlChange}
                  onKeyDown={onKeyDown}
                  disabled={disable}
                  maxLength={maxLength}
                  readOnly={readOnly ?? false}
                  ref={ref || refForUseController}
                  onFocus={() => {
                    handleFocus(name);
                  }}
                  onBlur={() => {
                    handleBlur(name);
                  }}
                />
              </div>
              {error && (
                <span className={'error_txt'} style={{ marginTop: '5px' }}>
                  {error?.message}
                </span>
              )}
            </dd>
          </dl>
        </>
      )}
      {inputType === 'file' && (
        <dl>
          <dt>
            <label>{label}</label>
            {required && <span className={'req'}>*</span>}
          </dt>
          <dd>
            <div className={`formBox fileBox ${fileInpHidden ? 'hidden' : ''}`}>
              <BaseInputAtom
                type="text"
                disable={true}
                placeholder={placeholder}
                name={name}
                value={value}
                onChange={handleChange}
                onKeyDown={onKeyDown}
                readonly={true}
                allowClear={allowClear}
              />
              {children}
              <button className={`btn`} onClick={onClick} disabled={disable}>
                파일 업로드
              </button>
            </div>
            {error && (
              <span className={'error_txt'} style={{ marginTop: '5px' }}>
                {error?.message}
              </span>
            )}
          </dd>
        </dl>
      )}
      {inputType === 'password' && (
        <>
          <div className={`formBox border ${disable ? 'disabled' : ''} ${focusStates[name] ? 'focus' : ''} ${price ? 'price' : ''}`}>
            <BaseInputAtom
              type={type}
              inputType={inputType}
              disable={disable}
              placeholder={placeholder}
              name={name}
              value={value}
              onChange={handleChange}
              onKeyDown={onKeyDown}
              style={style}
              maxLength={maxLength}
              readonly={readOnly ?? false}
              ref={ref || refForUseController}
              onFocus={() => {
                handleFocus(name);
              }}
              onBlur={() => {
                handleBlur(name);
              }}
              allowClear={allowClear}
            />
          </div>
          {error && <span className={'error_txt'}>{error?.message}</span>}
        </>
      )}
      {inputType === 'autocomplete' && (
        <>
          <AutoComplete placeholder={placeholder} value={value} onChange={handleChange} onKeyDown={onKeyDown} style={style} maxLength={maxLength} />
          {error && <span className={'error_txt'}>{error?.message}</span>}
        </>
      )}
    </>
  );
}) as <T extends FieldValues>(props: IInputTextProps<T> & { ref?: React.ForwardedRef<any> }) => React.ReactElement;

export default FormInput;
