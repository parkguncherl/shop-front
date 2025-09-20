import React, { useEffect, useState } from 'react';
import { authApi } from '../libs';
import { ApiResponseListCodeDropDown, ApiResponseListEnumResponse } from '../generated';
import { useQuery } from '@tanstack/react-query';
import { toastError } from './ToastMessage';
import { DropDownOption } from '../types/DropDownOptions';
import DropDownAtom from './atom/DropDownAtom';
import { SelectCommonPlacement } from 'antd/lib/_util/motion';
import { AxiosError } from 'axios';

interface Props {
  title?: string; // 드롭다운 상단에 표시할 제목
  excludeCode?: string; // 특정코드는 제외
  name: string; // 드롭다운의 이름
  placeholder?: string; // 선택하지 않았을 때 보여줄 플레이스홀더
  codeUpper?: string; // 코드 상위값(API 요청 시 사용)
  enumName?: string; // 열거형 이름(API 요청 시 사용)
  value?: string | number; // 선택된 값 (단일 선택 모드)
  values?: string[]; // 선택된 값들 (다중 선택 모드)
  onChange?: (name: string, value: string | number) => void; // 값이 변경되었을 때 실행될 함수
  style?: React.CSSProperties; // 스타일 적용
  isSearch?: boolean; // 검색 가능 여부
  required?: boolean; // 필수 입력 여부
  dtWidth?: string; // 드롭다운 너비
  defaultOptions?: DropDownOption[]; // 기본 옵션 목록
  placement?: SelectCommonPlacement; // 드롭다운 위치 설정
  wrapperClassNames?: string; // 래퍼 클래스 이름
  type?: 'cpo' | 'multiple'; // 선택 유형 (단일 또는 다중 선택)
  dropDownStyle?: React.CSSProperties; // 드롭다운 스타일
  readonly?: boolean; // 읽기 전용 여부
  optionClass?: string; // 옵션class
  showAll?: boolean; // 전체 옵션 표시 여부
  sort?: 'ASC' | 'DESC';
}

export const DropDown = ({
  title,
  excludeCode,
  name,
  placeholder,
  codeUpper,
  value = '',
  values,
  onChange,
  style,
  isSearch,
  required,
  dtWidth,
  defaultOptions,
  placement,
  enumName,
  wrapperClassNames,
  type,
  dropDownStyle,
  readonly = false,
  optionClass,
  showAll = true,
  sort,
}: Props) => {
  // '전체'라는 옵션을 기본 값으로 추가
  const allOption: DropDownOption = { key: '999', value: '', label: '전체' };
  const [dropDownOption, setDropDownOption] = useState<DropDownOption[]>(showAll ? [allOption] : defaultOptions || []);
  const [codeDropDownListAsOption, setCodeDropDownListAsOption] = useState<DropDownOption[]>([]);

  // 코드 상위 값을 통한 드롭다운 옵션을 가져오는 API 호출
  useQuery({
    queryKey: ['/code/dropdown', codeUpper, sort],
    queryFn: async () => {
      const res = await authApi.get<ApiResponseListCodeDropDown>('/code/dropdown', {
        params: { codeUpper, sort },
      });

      const { resultCode, body, resultMessage } = res.data;
      if (resultCode !== 200) {
        console.error(resultMessage);
        toastError('조회 도중 문제가 발생하였습니다.');
        return [];
      }

      const result =
        body
          ?.filter((v) => (v.codeCd ? (excludeCode ? excludeCode.indexOf(v.codeCd) < 0 : true) : true))
          .map((v) => ({
            key: v.codeCd,
            value: v.codeCd,
            label: v.codeNm,
          })) ?? [];

      setCodeDropDownListAsOption(result);
      return result;
    },
    enabled: !!codeUpper,
  });

  // 드롭다운에서 보여줄 옵션 리스트 (기본 옵션, API로 불러온 옵션, 열거형 옵션)
  // showAll prop에 따라 조건부로 allOption 추가 (사용법 showAll={false} )(선택적)
  useEffect(() => {
    if (showAll) {
      setDropDownOption([allOption, ...(defaultOptions || []), ...codeDropDownListAsOption]);
    } else {
      setDropDownOption([...(defaultOptions || []), ...codeDropDownListAsOption]);
    }
  }, [showAll, defaultOptions, codeDropDownListAsOption]);

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
            {required && <span className={'req'}>*</span>} {/* 필수 항목일 때 별표 표시 */}
          </dt>
          <dd>
            <div className={`formBox ${focusStates[name] ? 'focus' : ''} border`}>
              <div className="selBox">
                {/* DropDownAtom 컴포넌트를 사용해 드롭다운을 구현 */}
                <DropDownAtom
                  name={name}
                  placeholder={placeholder}
                  value={type === 'multiple' ? undefined : value} // 단일 선택 모드
                  values={type === 'multiple' ? values : []} // 다중 선택 모드
                  options={dropDownOption}
                  onChangeOptions={onChange}
                  placement={placement}
                  dropDownStyle={dropDownStyle}
                  readonly={readonly}
                  multiple={type === 'multiple'} // 다중 선택 여부
                  optionClass={optionClass}
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
        // 제목이 없는 경우 간단히 DropDownAtom만 렌더링
        <DropDownAtom
          name={name}
          placeholder={placeholder}
          value={value}
          options={dropDownOption}
          onChangeOptions={onChange}
          placement={placement}
          dropDownStyle={dropDownStyle}
          readonly={readonly}
          optionClass={optionClass}
        />
      )}
    </>
  );
};
