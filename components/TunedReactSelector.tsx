import React, { useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useDarkMode } from '@/contexts/ThemeContext';
import { ActionMeta, InputActionMeta, SelectInstance } from 'react-select';
import { DropDownOption } from '@/types/DropDownOptions';
import ClientSidedReactSelect from './clientSideOnly/ClientSidedReactSelect';

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
  ref?: React.Ref<ReactSelectorInterface>;
  // ── 멀티 셀렉트(콤보 다중선택) 모드 ──
  isMulti?: boolean;
  multiValues?: (string | number)[]; // 선택된 값 목록
  onChangeMulti?: (values: (string | number)[]) => void; // 선택 변경 시 값 배열 전달
}

export interface ReactSelectorInterface {
  reactSelectorReset: () => void;
}

export const TunedReactSelector = ({
  title,
  name,
  values,
  placeholder,
  options = [],
  onChange,
  required,
  onErased,
  ref,
  isMulti,
  multiValues,
  onChangeMulti,
}: Props) => {
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
  const isDark = useDarkMode();
  const dk = {
    bg: '#252538',
    bg2: '#1e1e30',
    border: 'rgba(255,255,255,0.45)',
    text: '#d0d0e0',
    muted: '#555570',
    hover: '#2a2a3e',
    selected: '#2d1b69',
    selectedText: '#a78bfa',
  };

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      // 검색영역 일반 input(.formBox.border 바깥 높이 ≈ 30px)과 높이를 맞춘다
      minHeight: '30px',
      height: '30px',
      boxSizing: 'border-box',
      fontSize: '13px',
      ...(isDark && { backgroundColor: dk.bg, borderColor: dk.border, boxShadow: 'none' }),
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      padding: '0 8px',
      minHeight: '28px',
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
    }),
    // 우측 드롭다운 화살표/클리어 아이콘이 컨트롤 높이를 밀어올리지 않도록 축소
    indicatorsContainer: (provided: any) => ({
      ...provided,
      height: '28px',
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      padding: '0 4px',
    }),
    clearIndicator: (provided: any) => ({
      ...provided,
      padding: '0 4px',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      fontSize: '13px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '100%',
      ...(isDark && { color: dk.text }),
    }),
    input: (provided: any) => ({
      ...provided,
      fontSize: '13px',
      margin: 0,
      padding: 0,
      lineHeight: '28px',
      color: isDark ? dk.text : 'inherit',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      fontSize: '12px',
      color: isDark ? dk.muted : '#999',
      margin: 0,
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
    }),
    menu: (provided: any) => ({
      ...provided,
      ...(isDark && { backgroundColor: dk.bg, border: `1px solid ${dk.border}` }),
    }),
    menuPortal: (provided: any) => ({
      ...provided,
      zIndex: 9999,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      display: 'flex',
      minHeight: '25px',
      maxHeight: '25px',
      padding: '0 10px',
      margin: '0',
      alignItems: 'center',
      fontSize: '13px',
      backgroundColor: isDark
        ? state.isSelected ? dk.selected : state.isFocused ? dk.hover : dk.bg
        : state.isSelected ? '#0070C0' : provided.backgroundColor,
      color: isDark
        ? state.isSelected ? dk.selectedText : dk.text
        : state.isSelected ? '#fff' : provided.color,
    }),
    // 멀티 선택 칩
    multiValue: (provided: any) => ({
      ...provided,
      ...(isDark && { backgroundColor: dk.selected }),
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      fontSize: '12px',
      ...(isDark && { color: dk.selectedText }),
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      ...(isDark && { color: dk.selectedText }),
    }),
  };

  // 멀티 모드: 값 배열 기반으로 react-select 를 그대로 사용
  const selectedMulti = useMemo(
    () => (memoizedOptions ?? []).filter((o) => (multiValues ?? []).map(String).includes(String(o.value))),
    [memoizedOptions, multiValues],
  );

  const renderMultiSelect = () => (
    <ClientSidedReactSelect
      isMulti
      closeMenuOnSelect={false}
      value={selectedMulti}
      onChange={(vals: unknown) => {
        const arr = (vals as DropDownOption[]) ?? [];
        onChangeMulti?.(arr.map((o) => o.value as string | number));
      }}
      options={memoizedOptions || []}
      isSearchable
      name={name}
      placeholder={placeholder}
      className="list"
      styles={{
        ...customStyles,
        // 칩이 여러 개면 높이가 늘어야 하므로 고정 높이 해제
        control: (provided: any) => ({
          ...provided,
          minHeight: '30px',
          boxSizing: 'border-box',
          fontSize: '13px',
          ...(isDark && { backgroundColor: dk.bg, borderColor: dk.border, boxShadow: 'none' }),
        }),
        valueContainer: (provided: any) => ({ ...provided, padding: '2px 6px' }),
        indicatorsContainer: (provided: any) => ({ ...provided }),
      }}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
      menuShouldScrollIntoView={false}
      noOptionsMessage={() => '검색 결과가 없습니다.'}
    />
  );

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

  if (isMulti) {
    return title ? (
      <dl>
        <dt>
          <label>{title}</label>
          {required && <span className={'req'}>*</span>}
        </dt>
        <dd>{renderMultiSelect()}</dd>
      </dl>
    ) : (
      renderMultiSelect()
    );
  }

  return (
    <>
      {title ? (
        <dl>
          <dt>
            <label>{title}</label>
            {required && <span className={'req'}>*</span>}
          </dt>
          <dd>
            <ClientSidedReactSelect
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
        <ClientSidedReactSelect
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
};
