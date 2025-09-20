import React, { forwardRef, RefAttributes, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ApiResponse } from '../../generated';
import { DataListOption } from '../../types/DataListOptions';
import { toastError } from '../ToastMessage';
import { InputRef } from 'antd';
import { BaseSelectRef } from 'rc-select';
import { AxiosPromise, AxiosResponse } from 'axios';
import { DataList } from '../DataList';

interface Props<T> {
  title?: string;
  name: string;
  placeholder?: string;
  displayedObjKey: string; // 옵션 목록에 출력될 값의 key 를 입력(본 key 에 대응되는 값은 목록 이외에도 조건문 영역에서도 사용됨)
  onDataSelected: (name: string, value: T | undefined) => string | void; // 드롭다운 목록에서 데이터 선택할 시 동작(데이터를 찾을 수 없을 경우 value 는 undefined)(상위 컴포넌트에서 InputValue 를 커스터마이징하고 싶을 경우 값을 반환할 수 있음)
  onDataErased?: (typedValue: string, type: 'all' | 'partial') => void; // 지움 이벤트 발생 시 작동(내부적으로 완전 초기화 동작 수행될 경우 type == all, 부분 수정을 위한 동작일 시 partial)
  onSearch: (typedValue: string) => AxiosPromise<ApiResponse>; // 키워드 입력 후 검색 시도할 시(엔터키 누를 시) 호출
  selectedData?: T | undefined;
  onTypingOccurred?: (name: string, value: string | number) => void;
  onError?: (result: AxiosResponse<ApiResponse, any>) => void;
  emptyMessage?: string;
}

export interface SearchBarRefInterface {
  focusOnInput: () => void;
  eraseInputValue: () => void;
}

export const InnerSearchBar = <T,>(
  { title, placeholder, name, displayedObjKey, onDataSelected, onDataErased, onSearch, selectedData, onTypingOccurred, onError, emptyMessage }: Props<T>,
  ref: React.Ref<SearchBarRefInterface>,
) => {
  const [InputValue, setInputValue] = useState<string>('');
  const [respondedDataList, setRespondedDataList] = useState<any[]>([]);
  const [selectedDataOnBar, setSelectedDataOnBar] = useState<T | undefined>(undefined);

  const refOfInput = useRef<InputRef>(null);
  const refOfSelect = useRef<BaseSelectRef>(null);

  useImperativeHandle(ref, () => ({
    focusOnInput: () => {
      refOfInput.current?.focus();
    },
    eraseInputValue: () => {
      onEraseOccurred(InputValue);
    },
  }));

  useEffect(() => {
    /** selectedData 의 상태 변경 시 실행될 동작을 다음 callBack 내에 정의 */
    setSelectedDataOnBar(selectedData);
    if (selectedData != undefined) {
      // 인자로 데이터가 주어질 시
      if ((selectedData as any)[displayedObjKey]) {
        setInputValue((selectedData as any)[displayedObjKey]);
      } else {
        console.error('인자로 주어진 key 값에 해당하는 데이터를 찾을 수 없음');
      }
    } else {
      onEraseOccurred(InputValue);
    }
  }, [selectedData]);

  /** 데이터가 선택 혹은 미정의될 경우 실행할 동작을 모아놓은 함수(일부 검색 동작 및 목록에서의 데이터 선택 동작 한정으로 호출되어야 함(호출 시점 신뢰 차원)) */
  const DoSomethingOnSelection = useCallback(
    ({ nameArg = name, selectedDataArg }: { nameArg?: string; selectedDataArg?: T | undefined }) => {
      setSelectedDataOnBar(selectedDataArg);
      const passedInputValueByOther = onDataSelected(nameArg, selectedDataArg); // 데이터 선택 콜백을 호출하는 컴포넌트에서 InputValue 를 커스터마이징하고 싶을 경우 값을 반환할 수 있음
      if (selectedDataArg != undefined && (selectedDataArg as any)[displayedObjKey]) {
        setInputValue(passedInputValueByOther || (selectedDataArg as any)[displayedObjKey]);
      }
    },
    [displayedObjKey, name, onDataSelected],
  );

  /** 지움 이벤트 발생시(텍스트 일부 지움이 아닌 전체 지움 및 내부적으로 선택된 데이터 초기화) 동작 */
  const onEraseOccurred = useCallback(
    (inputValueArg: string) => {
      if (selectedDataOnBar) {
        /** 컴포넌트 내부적으로 선택된 데이터 존재할 시 완전 초기화 동작 수행 */
        setInputValue('');
        setSelectedDataOnBar(undefined);
      }
      if (onDataErased) {
        onDataErased(inputValueArg, selectedDataOnBar != undefined ? 'all' : 'partial');
      }
    },
    [onDataErased, selectedDataOnBar],
  );

  /** 인자의 상태가 변경될 시 소매처 관련 데이터를 적절한 형식으로 수정하여 반환 */
  const displayedDataList = useCallback(
    (respondedDataList: any[]) => {
      const displayedClients: DataListOption[] = [];
      if (respondedDataList[0]) {
        if (!Object.keys(respondedDataList[0]).includes(displayedObjKey)) {
          console.error('응답값에서 해당하는 key 를 찾을 수 없음');
        } else if (!Object.keys(respondedDataList[0]).includes('id')) {
          console.error('응답값에서 id 를 찾을 수 없음');
        } else {
          if (respondedDataList.length) {
            for (let i = 0; i < respondedDataList.length; i++) {
              if (respondedDataList[i] && respondedDataList[i]) {
                const idAsIdentifier = respondedDataList[i].id as string | number;
                displayedClients.push({
                  key: i,
                  value: respondedDataList[i][displayedObjKey],
                  label: respondedDataList[i][displayedObjKey],
                  identifier: idAsIdentifier.toString(),
                });
              }
            }
          }
        }
      }
      return displayedClients;
    },
    [displayedObjKey],
  );

  /** 검색 */
  const onEnterForSearch = useCallback(
    (InputValue: string) => {
      onSearch(InputValue).then((result) => {
        if (result.data) {
          const { resultCode, body, resultMessage } = result.data;
          if (resultCode == 200) {
            const dataList = body as any[];
            if (dataList.length == 0) {
              // 검색결과가 0건이면 undefined 처리, 호출
              DoSomethingOnSelection({
                selectedDataArg: undefined,
              });
            } else {
              setRespondedDataList(dataList);
              if (dataList.length == 1) {
                // 검색결과가 1건이면 해당 데이터를 선택하는 과정을 생략하고 바로 콜백을 호출
                DoSomethingOnSelection({
                  selectedDataArg: dataList[0],
                });
              } else if (dataList.length > 1) {
                refOfSelect.current?.focus();
              }
            }
          } else {
            if (onError) {
              onError(result);
            } else {
              toastError(resultMessage);
            }
          }
        }
      });
    },
    [DoSomethingOnSelection, onError, onSearch],
  );

  /** 데이터 드롭다운에서 값을 선택할 시 작동 */
  const onChangeOptionsOfDataList = (name: string, value: string | number) => {
    for (let i = 0; i < respondedDataList.length; i++) {
      if (respondedDataList[i][displayedObjKey] == value) {
        DoSomethingOnSelection({
          nameArg: name,
          selectedDataArg: respondedDataList[i],
        });
      }
    }
  };

  /** 입력으로 인하여 input 값 변경 발생 시 동작 */
  const onChangeInputElementOfDataList = (name: string, value: string | number) => {
    setInputValue(value.toString());
    if (onTypingOccurred) {
      onTypingOccurred(name, value);
    }
  };

  /** 검색 버튼 혹은 엔터 키 사용 시 */
  const onKeyDownAtInputOfDataList = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (InputValue == '') {
        if (emptyMessage) {
          toastError(emptyMessage);
        } else {
          toastError('검색조건을 1개 이상 입력하세요.');
        }
      } else {
        onEnterForSearch(InputValue); // 검색에 필요한 키워드를 인자로 넣은 뒤 콜백 함수 호출
      }
    } else if (e.key === 'Backspace') {
      onEraseOccurred(InputValue);
    }
  };

  const onKeyDownAtDropDownOfDataList = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onEraseOccurred(InputValue);
      refOfInput.current?.focus();
    }
  };

  return (
    <>
      <DataList
        title={title}
        name={name}
        placeholder={placeholder || '검색 키워드 입력'}
        options={displayedDataList(respondedDataList)}
        onChangeOptions={onChangeOptionsOfDataList}
        onChangeInputElement={onChangeInputElementOfDataList}
        onKeyDownAtInput={onKeyDownAtInputOfDataList}
        onKeyDownAtDropDown={onKeyDownAtDropDownOfDataList}
        refOfInput={refOfInput}
        refOfSelect={refOfSelect}
        selectorShowAction={['focus']}
        value={InputValue}
      />
    </>
  );
};

function fixedForwardRef<P>(
  render: (props: P, ref: React.Ref<SearchBarRefInterface> | null) => JSX.Element,
): (props: P & React.RefAttributes<SearchBarRefInterface>) => JSX.Element {
  return forwardRef(render) as (props: P & RefAttributes<SearchBarRefInterface>) => JSX.Element;
}

const SearchBar = fixedForwardRef(InnerSearchBar);
export default SearchBar;
