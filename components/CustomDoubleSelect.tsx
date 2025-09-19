import React, { useEffect, useMemo, useRef, useState, forwardRef } from 'react';
import { Input, InputRef, Select, Spin } from 'antd';
import { FieldValues } from 'react-hook-form';

interface Props<T extends FieldValues> {
  fetchOptions: string; // 검색어 기반 옵션 가져오기
  debounceTimeout?: number; // 디바운스 시간
  onChange?: (e: any) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onEditItem: (item: string) => void; // 옵션 추가 요소 변경
  type: 'single' | 'form';
  title?: string;
  required?: boolean;
  defaultValue?: string | string[];
}

const CustomDoubleSelect = forwardRef(function CustomDoubleSelect<T extends FieldValues>(
  { fetchOptions, debounceTimeout = 0, onChange, onEditItem, type, title, required, defaultValue, ...props }: Props<T>,
  ref?: React.ForwardedRef<any>,
) {
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [value, setValue] = useState<string[] | null>(null); // 여러 개의 선택값을 저장하는 배열로 변경
  const fetchRef = useRef(0);

  // 디바운스된 fetch 함수
  const debounceFetcher = useMemo(() => {
    const loadOptions = async () => {
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      setFetching(true);

      const allOptions = fetchOptions.split('\n');
      if (fetchId === fetchRef.current) {
        setOptions(allOptions);
      }
      setFetching(false);
    };

    return loadOptions;
  }, [fetchOptions]);

  useEffect(() => {
    debounceFetcher(); // 초기 로딩 시 옵션을 가져옴
  }, [debounceFetcher]);

  // 디폴드 벨류 추가시
  useEffect(() => {
    if (defaultValue !== undefined && defaultValue !== null) {
      setValue((prevValue) => {
        const defaultArray = Array.isArray(defaultValue) ? defaultValue : [defaultValue];
        // 빈 문자열 제거
        return prevValue ? [...new Set([...prevValue, ...defaultArray.filter((v) => v !== '')])] : defaultArray.filter((v) => v !== '');
      });
    }
  }, [defaultValue]);

  const handleChange = (selectedValue: any) => {
    const selectedArray = Array.isArray(selectedValue) ? selectedValue : [selectedValue];

    // 값 상태 업데이트
    setValue((prevValue) => {
      const combinedValue = [...new Set([...selectedArray])].filter((value) => value !== undefined);
      return combinedValue;
    });

    if (onChange) onChange(selectedArray); // 부모로 전달
  };

  // 옵션 추가 관련 상태 및 함수
  const [inputValue, setInputValue] = useState('');
  const [addOn, setAddOn] = useState(false);
  const inputRef = useRef<InputRef>(null);

  const addItem = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (inputValue && !options.includes(inputValue)) {
      const updatedOptions = [...options, inputValue];
      setOptions(updatedOptions);
      onEditItem(updatedOptions.join('\n'));
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
    onEditItem(updatedOptions.join('\n'));
  };

  // 드롭다운 열릴 때 addOn 상태 관리
  const handleDropdownVisibleChange = (visible: boolean) => {
    if (!visible) {
      setAddOn(false); // 드롭다운이 닫히면 addOn을 false로 설정
    }
  };

  // Select 컴포넌트 공통 렌더링
  const renderSelect = () => (
    <Select
      mode="multiple" // 다중 선택 가능
      value={value}
      onChange={handleChange}
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
      showSearch
      notFoundContent={fetching ? <Spin size="small" /> : null}
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
      ref={ref}
      onInputKeyDown={(e) => {
        if (e.key === 'Tab') {
          e.stopPropagation();
        }
      }}
    />
  );

  return (
    <>
      {type === 'single' ? (
        <div className="formBox border">{renderSelect()}</div>
      ) : type === 'form' ? (
        <dl>
          <dt>
            {title}
            {required && <span className={'req'}>*</span>}
          </dt>
          <dd>
            <div className="formBox border">{renderSelect()}</div>
          </dd>
        </dl>
      ) : null}
    </>
  );
}) as <T extends FieldValues>(props: Props<T> & { ref?: React.ForwardedRef<any> }) => React.ReactElement;

export default CustomDoubleSelect;
