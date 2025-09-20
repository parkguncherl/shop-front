import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import Select, { ActionMeta, InputActionMeta, SelectInstance } from 'react-select';
import { DropDownOption } from '../types/DropDownOptions';

interface Props {
  title?: string;
  name?: string;
  values?: string | number;
  placeholder?: string;
  options?: DropDownOption[];
  onChange?: (option: DropDownOption) => void; // 옵션 목록에서 변경할 시
  required?: boolean;
  onErased?: (event: React.KeyboardEvent) => void; // 백스페이스 키를 이용하여 선택된 option 의 입력 영역 value 를 삭제할 시
  isNotEmptyOption?: boolean;
  //onKeyDown?: (event: React.KeyboardEvent) => void;
}

export interface ReactSelectorInterface {
  reactSelectorReset: () => void;
}

export const TunedReactSelector = forwardRef<ReactSelectorInterface, Props>(
  ({ title, name, values, placeholder, options = [], onChange, required, onErased }, ref) => {
    const selectRef = useRef<SelectInstance>(null);
    const memoizedOptions = useMemo(() => {
      console.log('TunedReactSelector option ==>', options);
      return options; // 반드시 return 필요
    }, [options]);

    useImperativeHandle(ref, () => ({
      reactSelectorReset: () => {
        setInputValue('');
      },
    }));

    const [InputValue, setInputValue] = useState<string>('');
    const customStyles = {
      control: (provided: any) => ({
        ...provided,
        minHeight: '32px',
        fontSize: '13px',
      }),
      valueContainer: (provided: any) => ({
        ...provided,
        padding: '0 8px',
        minHeight: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden', // 반드시 유지
      }),
      singleValue: (provided: any) => ({
        ...provided,
        fontSize: '13px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis', // 길면 ... 처리
        maxWidth: '100%', // valueContainer 안에서만 표시
      }),
      input: (provided: any) => ({
        ...provided,
        fontSize: '13px',
        margin: 0,
        padding: 0,
        lineHeight: '32px',
        color: 'inherit',
      }),
      placeholder: (provided: any) => ({
        ...provided,
        fontSize: '12px',
        color: '#999',
        margin: 0,
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)', // 세로 중앙
      }),
      option: (provided: any, state: any) => ({
        ...provided,
        display: 'flex',
        minHeight: '25px',
        maxHeight: '25px',
        padding: '0 10px',
        margin: '0',
        alignItems: 'center',
        fontSize: '13px', // 리스트 글자 크기
        backgroundColor: state.isSelected ? '#0070C0' : provided.backgroundColor,
        color: state.isSelected ? '#fff' : provided.color,
      }),
    };

    const onInputChange = useCallback((newValue: string, actionMeta: InputActionMeta) => {
      if (actionMeta.action == 'input-change') {
        setInputValue(newValue);
      }
    }, []);

    const onChangeHandler = useCallback(
      (newValue: unknown, actionMeta: ActionMeta<unknown>) => {
        const selectedOption = newValue as DropDownOption;
        if (actionMeta.action == 'select-option') {
          // 옵션 선택 이벤트 한정 동작
          setInputValue(selectedOption.label || '');
          if (onChange) {
            onChange(selectedOption);
          }
        }
      },
      [onChange],
    );

    const onKeyDownHandler = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key == 'Backspace') {
          setInputValue('');
          if (onErased) {
            onErased(event);
          }
        }
      },
      [onErased],
    );

    return (
      <>
        {title ? (
          <dl>
            <dt>
              <label>{title}</label>
              {required && <span className={'req'}>*</span>}
            </dt>
            <dd>
              <Select
                ref={selectRef}
                value={
                  InputValue
                    ? memoizedOptions.find((option) => option.label == InputValue) || null
                    : values
                    ? memoizedOptions.find((option) => option.value == values) || null
                    : null
                }
                onChange={onChangeHandler}
                onInputChange={onInputChange}
                options={memoizedOptions || []}
                isSearchable // 검색 가능 여부 설정
                name={name}
                placeholder={placeholder}
                onKeyDown={onKeyDownHandler} // keydown 이벤트 핸들러 추가
                className="list"
                styles={customStyles}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null} // 이 설정을 유지
                menuPosition="fixed" // 고정된 위치를 유지
                menuShouldScrollIntoView={false} // 스크롤 시 드롭다운 고정
                noOptionsMessage={() => '검색 결과가 없습니다.'}
              />
            </dd>
          </dl>
        ) : (
          <Select
            ref={selectRef}
            value={memoizedOptions.filter((option) => {
              return option.label === InputValue;
            })}
            onChange={onChangeHandler}
            onInputChange={onInputChange}
            options={memoizedOptions || []}
            isSearchable // 검색 가능 여부 설정
            name={name}
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null} // 타입 확인
            placeholder={placeholder}
            onKeyDown={onKeyDownHandler} // keydown 이벤트 핸들러 추가
            className="list"
            styles={customStyles}
            menuPosition="absolute"
            noOptionsMessage={() => '검색 결과가 없습니다.'}
          />
        )}
      </>
    );
  },
);
TunedReactSelector.displayName = 'TunedReactSelector';
