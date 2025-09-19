import React, { useEffect, useRef } from 'react';
import { DropDown } from '../DropDown';
import { CustomInput } from '../CustomInput';
import CustomDatePicker from '../CustomDatePicker';
import { DataList } from '../DataList';
import { CustomTwoDatePicker } from '../CustomTwoDatePicker';
import { CustomInputChk } from '../CustomInputChk';
import { CustomSearchRadio } from '../CustomSearchRadio';
import { CustomSearchCheckBox } from '../CustomSearchCheckBox';
import CustomMonthPicker from '../CustomDatePickerM';
import { CustomSwitch } from '../CustomSwitch';
import { RetailSearchBar } from '../search/retail/RetailSearchBar';
import { CustomSegmented } from '../CustomSegmented';
import SearchBar from '../search/SearchBar';

interface Props {
  className: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  emptyMessage?: string;
}

export const Search = ({ className, children, style, emptyMessage }: Props) => {
  //const [allSearchCondition, setAllSearchCondition] = useState<boolean>(false); // 버튼 노출 여부
  const openBtn = useRef<HTMLButtonElement | null>(null); // 버튼 ref

  // 가로 1800이상이면 검색조건 3개, 미만이면 2개
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        const dl = document.querySelectorAll<HTMLDivElement>('.searchArea div dl');
        let conditionCount = 2; // 기본값 2로 설정

        if (document.body.classList.contains('wms')) {
          conditionCount = 2; // wms 클래스가 있을 때는 4로 설정
          if (window.innerWidth >= 1800) {
            conditionCount = 3; // 가로 1800 이상일 때는 3으로 설정
          }
        } else if (window.innerWidth >= 1800) {
          conditionCount = 3; // 가로 1800 이상일 때는 3으로 설정
        }

        if (dl.length > conditionCount) {
          openBtn.current?.classList.add('show');
        } else {
          openBtn.current?.classList.remove('show');
        }
      };

      // 초기 실행
      handleResize();

      // 창 크기 변경 이벤트 리스너 추가
      window.addEventListener('resize', handleResize);

      // 컴포넌트가 언마운트될 때 이벤트 리스너 제거
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // 버튼 클릭 이벤트
  const searchBtnHandle = (e: any) => {
    const target = e.target;
    target.parentNode.classList.toggle('on');
  };

  return (
    <div className="searchBox">
      <div className="searchArea">
        <div className={className}>{children}</div>
        <button
          className="openBtn"
          ref={openBtn}
          onClick={(e) => {
            searchBtnHandle(e);
          }}
        ></button>
      </div>
    </div>
  );
};

Search.DropDown = DropDown;
Search.Input = CustomInput;
Search.DatePicker = CustomDatePicker;
Search.DatePickerM = CustomMonthPicker;
Search.TwoDatePicker = CustomTwoDatePicker;
Search.DataList = DataList;
Search.InputChk = CustomInputChk;
Search.Radio = CustomSearchRadio;
Search.Check = CustomSearchCheckBox;
Search.Switch = CustomSwitch;
Search.Segmented = CustomSegmented;
Search.RetailBar = RetailSearchBar;
Search.Bar = SearchBar;

export default React.memo(Search);
