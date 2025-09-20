import React, { useRef, useState } from 'react';
import { Input, InputRef } from 'antd';
import DropDownAtom from './atom/DropDownAtom';
import { DataListOption } from '../types/DataListOptions';
import { BaseSelectRef } from 'rc-select';

interface Props {
  options?: DataListOption[];
  title?: string;
  name: string;
  type?: React.HTMLInputTypeAttribute;
  disable?: boolean;
  onChangeInputElement?: (name: string, value: string | number) => void;
  onChangeOptions?: (name: string, value: string | number) => void;
  onKeyDownAtInput?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownAtDropDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  placeholder?: string;
  required?: boolean;
  wrapperClassNames?: string;
  refOfInput?: React.RefObject<InputRef>;
  refOfSelect?: React.RefObject<BaseSelectRef>;
  selectorShowAction?: ('focus' | 'click')[] | undefined;
  list?: string; // datalist 사용을 위한 속성
  value?: string;
}

/**
 * 본 컴포넌트 내부 dropdown 요소에서 값을 선택할 시 input 요소에 반영되는 동작이 기본
 * value 인자의 값을 외부에서 상태 등으로 통제함으로서 controlled component 와 유사하게 사용 가능
 * 내부 option 변경 이외에는 value 인자에 의하여 값이 통제됨
 * */
// todo 추후에 타 개발자들이 쉽게 이해할수 있도록 코드 정리하기
export const DataList = ({
  options,
  title,
  name,
  placeholder,
  disable,
  onChangeInputElement,
  onChangeOptions,
  onKeyDownAtInput,
  onKeyDownAtDropDown,
  type = 'text',
  required = false,
  wrapperClassNames,
  refOfInput,
  refOfSelect,
  selectorShowAction,
  list,
  value,
}: Props) => {
  /** 인자로 받는 참조가 존재하지 않을 경우 사용되는 참조 (본 참조를 통해 구현되는 동작은 인자로 받는 참조에도 적용되어야) */
  const inputRef = useRef<InputRef>(null);

  const [focusOn, setFocusOn] = useState<boolean>(false);
  const handleOnFocus = () => {
    setFocusOn(true);
  };
  const handleOnBlur = () => {
    setFocusOn(false);
  };

  /** 외부에서 검색 키워드 상태를 관리하는지 여부에 따라 분기 */
  return (
    <>
      {title ? (
        <>
          <dl className={wrapperClassNames}>
            <dt>
              <label>{title}</label>
              {required && <span className={'req'}>*</span>}
            </dt>
            <dd>
              <div className={`searchInputBox ${focusOn ? 'focus' : ''}`}>
                <Input
                  placeholder={placeholder}
                  disabled={disable}
                  type={type}
                  name={name}
                  ref={refOfInput || inputRef}
                  onChange={(e) => {
                    if (onChangeInputElement) {
                      onChangeInputElement(name, e.target.value);
                    }
                  }}
                  autoComplete={'off'}
                  list={list}
                  onKeyDown={onKeyDownAtInput}
                  value={value}
                  onFocus={handleOnFocus}
                  onBlur={handleOnBlur}
                  onEmptied={(e) => {
                    console.log(e);
                  }}
                  allowClear={true}
                />
                <DropDownAtom
                  name={name}
                  //placeholder={placeholder}
                  options={options}
                  onKeyDown={onKeyDownAtDropDown}
                  onChangeOptions={onChangeOptions}
                  ref={refOfSelect}
                  selectorShowAction={selectorShowAction}
                />
              </div>
            </dd>
          </dl>
        </>
      ) : (
        <div className={`searchInputBox ${focusOn ? 'focus' : ''}`}>
          <Input
            placeholder={placeholder}
            disabled={disable}
            type={type}
            name={name}
            ref={refOfInput || inputRef}
            onChange={(e) => {
              if (onChangeInputElement) {
                onChangeInputElement(name, e.target.value);
              }
            }}
            autoComplete={'off'}
            list={list}
            onKeyDown={onKeyDownAtInput}
            value={value}
            onFocus={handleOnFocus}
            onBlur={handleOnBlur}
            onEmptied={(e) => {
              console.log(e);
            }}
            allowClear={true}
          />
          <DropDownAtom
            name={name}
            //placeholder={placeholder}
            options={options}
            onKeyDown={onKeyDownAtDropDown}
            onChangeOptions={onChangeOptions}
            ref={refOfSelect}
            selectorShowAction={selectorShowAction}
          />
        </div>
      )}
    </>
  );
};
