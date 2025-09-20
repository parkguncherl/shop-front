import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Select, Spin, Input, InputRef } from 'antd';
import debounce from 'lodash/debounce';
import { authApi } from '../libs';
import { Utils } from '../libs/utils';
import { toastError, toastSuccess } from './ToastMessage';
import { BaseSelectRef } from 'rc-select';

interface DebounceSelectProps {
  fetchOptions: string; // 검색어 기반 옵션 가져오기
  debounceTimeout?: number; // 디바운스 시간
  onChange?: (e: any) => void;
  onEditItem: (item: string) => void; // 옵션 추가 요소 변경
  type: 'single' | 'form';
  title?: string;
  onSearchChange?: (e: any) => void;
  defaultValue?: string;
  gbCode?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export interface DebounceSelectRefInterface {
  focusOnInput: () => void;
}

const DebounceSelect = forwardRef<DebounceSelectRefInterface, DebounceSelectProps>((props, ref) => {
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [value, setValue] = useState<string | null>(null);
  const fetchRef = useRef(0);
  const [gbVal, setGbVal] = useState(props.title);
  const [editGb, setEditGb] = useState<boolean>(false);

  const debounceSelectRef = useRef<BaseSelectRef>(null);

  useImperativeHandle(ref, () => ({
    focusOnInput: () => {
      debounceSelectRef.current?.focus?.();
    },
  }));

  // 디바운스된 fetch 함수
  const debounceFetcher = useMemo(() => {
    const loadOptions = async (search: string) => {
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      setFetching(true);

      const allOptions = props.fetchOptions?.split('\n').filter((option) => option.trim() !== ''); // 빈 값을 제거
      let filteredOptions = search ? allOptions.filter((option) => option.toLowerCase().includes(search.toLowerCase())) : allOptions;
      if (filteredOptions.length === 0) {
        filteredOptions = allOptions;
      }

      if (fetchId === fetchRef.current) {
        setOptions(filteredOptions);
      }
      setFetching(false);
    };

    return debounce(loadOptions, props.debounceTimeout);
  }, [props.fetchOptions, props.debounceTimeout]);

  const handleSearch = (search: string) => {
    setSearchValue(search);
    debounceFetcher(search);
    if (props.onSearchChange && search !== '') {
      props.onSearchChange(search);
    }
  };

  const handleChange = (selectedValue: any) => {
    if (props.onChange) props.onChange(selectedValue);
    setValue(selectedValue);
    setSearchValue('');
  };

  const handleBlur = () => {
    if (value === null || searchValue) {
      setSearchValue(searchValue);
      setValue(searchValue);
    }
  };

  useEffect(() => {
    debounceFetcher('');
  }, [debounceFetcher]);

  useEffect(() => {
    // defaultValue가 있다면 이를 value 상태에 반영
    if (props.defaultValue) {
      setValue(props.defaultValue);
    }
  }, [props.defaultValue]);

  // 옵션 추가 관련 상태 및 함수
  const [inputValue, setInputValue] = useState('');
  const [addOn, setAddOn] = useState(false);
  const inputRef = useRef<InputRef>(null);

  const addItem = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (inputValue && !options.includes(inputValue)) {
      const updatedOptions = [...options, inputValue];
      setOptions(updatedOptions);
      props.onEditItem(updatedOptions.join('\n'));
      setInputValue('');
    }
  };

  // 엔터키 시 저장
  const handleInputKeyDown = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    addItem(e);
    setAddOn(!addOn);
  };

  const removeItem = (option: string) => {
    const updatedOptions = options.filter((opt) => opt !== option);
    setOptions(updatedOptions);
    props.onEditItem(updatedOptions.join('\n'));
  };

  // 드롭다운 열릴 때 addOn 상태 관리
  const handleDropdownVisibleChange = (visible: boolean) => {
    if (!visible) {
      setAddOn(false); // 드롭다운이 닫히면 addOn을 false로 설정
    }
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
          setEditGb(false);
        } catch (error) {
          toastError('구분수정 오류');
        }
      }
    }
  };

  // Select 컴포넌트 공통 렌더링
  const renderSelect = () => (
    <Select
      showSearch
      value={value}
      onSearch={handleSearch}
      onChange={handleChange}
      onBlur={handleBlur}
      filterOption={false}
      ref={debounceSelectRef}
      placeholder={props.placeholder}
      options={options.map((opt) => ({
        label: (
          <div className="selectOpt">
            <strong>{opt}</strong>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeItem(opt);
              }}
            ></button>
          </div>
        ),
        value: opt,
      }))}
      notFoundContent={fetching ? <Spin size="small" /> : options.length === 0 ? '내용을 추가해주세요' : null}
      dropdownRender={(menu) => (
        <>
          {menu}
          <div className={'selectAdd'}>
            {!addOn ? (
              <button onClick={() => setAddOn(true)}>추가하기</button>
            ) : (
              <div className={'formBox border'}>
                <Input ref={inputRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onPressEnter={handleInputKeyDown} />
              </div>
            )}
          </div>
        </>
      )}
      onDropdownVisibleChange={handleDropdownVisibleChange}
      {...props}
    />
  );

  return (
    <>
      {props.type === 'single' ? (
        <div className="formBox border">{renderSelect()}</div>
      ) : props.type === 'form' ? (
        <dl className={props.className ? props.className : ''}>
          {props.gbCode ? (
            <dt>
              {!editGb ? (
                <>
                  {gbVal}
                  <button
                    className={'edit'}
                    onClick={() => {
                      setEditGb(true);
                    }}
                    title={'편집하기'}
                  >
                    편집
                  </button>
                </>
              ) : (
                <>
                  <div className={'formBox etc'}>
                    <Input
                      onKeyDown={onKeyDown}
                      onChange={(e) => {
                        setGbVal(e.target.value);
                      }}
                      value={gbVal}
                    />
                  </div>
                </>
              )}
            </dt>
          ) : (
            <dt>
              {props.title}
              {props.required && <span className={'req'}>*</span>}
            </dt>
          )}

          <dd>
            <div className="formBox border">{renderSelect()}</div>
          </dd>
        </dl>
      ) : null}
    </>
  );
});

export default DebounceSelect;

DebounceSelect.displayName = 'DebounceSelect';
