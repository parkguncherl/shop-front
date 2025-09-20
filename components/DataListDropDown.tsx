import React, { forwardRef, useEffect, useMemo } from 'react';
import Select from 'react-select';

interface Props {
  title?: string;
  name?: string;
  placeholder?: string;
  value?: string[] | undefined | null | any;
  options?: string[] | any;
  onChange?: (option: any) => void;
  required?: boolean;
  readonly?: boolean;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  tabIndex?: number;
  isDisabled?: boolean; // isDisabled 속성을 추가합니다.
}

// eslint-disable-next-line react/display-name
export const DataListDropDown = forwardRef<any, Props>(
  ({ title, name, placeholder, value, options, onChange, required, onKeyDown, readonly = false, tabIndex }, ref) => {
    const customClassNames = useMemo(
      () => ({
        control: () => 'dataListControl',
        option: (state: any) => (state.isSelected ? 'dataListOpt selected' : 'dataListOpt'),
        menu: () => 'dataListMenu',
        menuList: () => 'dataListMenuList',
        noOptionsMessage: () => 'dataListNoOptMng',
      }),
      [],
    );

    useEffect(() => {
      console.log(value);
    }, [value]);

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
                ref={ref}
                value={value}
                onChange={onChange}
                options={options || []}
                isSearchable // 검색 가능 여부 설정
                placeholder={placeholder}
                onKeyDown={onKeyDown} // keydown 이벤트 핸들러 추가
                className="dataListSelect"
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null} // 이 설정을 유지
                menuPosition="fixed" // 고정된 위치를 유지
                menuShouldScrollIntoView={false} // 스크롤 시 드롭다운 고정
                noOptionsMessage={() => '검색 결과가 없습니다.'}
                classNames={customClassNames}
              />
            </dd>
          </dl>
        ) : (
          <Select
            ref={ref}
            value={value}
            onChange={onChange}
            options={options || []}
            isSearchable // 검색 가능 여부 설정
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null} // 타입 확인
            placeholder={placeholder}
            onKeyDown={onKeyDown} // keydown 이벤트 핸들러 추가
            className="dataListSelect"
            menuPosition="absolute"
            noOptionsMessage={() => '검색 결과가 없습니다.'}
            classNames={customClassNames}
          />
        )}
      </>
    );
  },
);
