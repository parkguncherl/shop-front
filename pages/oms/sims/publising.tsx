import React from 'react';
import { Search } from '../../../components';
import styled from 'styled-components';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';
import { useForm } from 'react-hook-form';
import FormNewDatePicker from '../../../components/FormNewDatePicker';

interface FormValues {
  date: string;
  date2: string;
  range: [string, string];
  range2: [string, string];
  range3: [string, string];
  range4: [string, string];
  range5: [string, string];
  range6: [string, string];
}
const Publising = () => {
  const fetchOptions = async (search: string) => {
    const allOptions = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown'];
    return allOptions.filter((option) => option.toLowerCase().includes(search.toLowerCase()));
  };
  /** useForm */
  const {
    control,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<FormValues>({
    defaultValues: {
      date: '2025-02-06',
      date2: '2025-02-06',
      range: ['2025-02-06', '2025-02-06'],
      range2: ['2025-01-03', '2025-02-06'],
      range3: ['2025-01-03', '2025-02-06'],
      range4: ['2025-01-03', '2025-02-06'],
      range5: ['2025-01-03', '2025-02-06'],
      range6: ['2025-01-03', '2025-02-06'],
    },
    mode: 'onSubmit',
  });

  return (
    <>
      <h4 className="smallTitle">버튼모음</h4>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="btnArea mt10">
          <button className="btn">기본버튼</button>
          <button className="btn" disabled>
            disabled버튼
          </button>
          <button className="btn btnBlue">버튼</button>
          <button className="btn btnBlack">버튼</button>
          <button className="btn btnRed">버튼</button>
          <button className="btn btnGray">버튼</button>
        </div>
        <div className="btnArea mt10">
          <button className="btn rowAdd"></button>
          <button className="btn orderReg">주문등록 버튼</button>
          <button className="btn orderReg on">주문등록 on</button>
          <button className="btn tblBtn">테이블버튼</button>
          <button className="btn hold">
            버튼
            <span>33</span>
          </button>
          <button className="btn icoPrint">프린트버튼</button>
          <button className="btn icoPrint2">
            <span className="icon"></span>프린트버튼2
          </button>
        </div>
        <div className="btnArea mt10">
          <button className="btn edit">수정버튼</button>
          <button className="btn delete">삭제버튼</button>
          <button className="btn receipt">전표버튼</button>
          <button className="btn download">다운로드</button>
          <button className="btn excelDownload">엑셀다운로드</button>
          <button className="btn excelUpload">엑셀업로드</button>
        </div>
      </div>
      <h4 className="smallTitle mt20">search 필터</h4>
      <Search className="type_2">
        <Search.Switch title="스위치" name={'name'} checkedLabel={'체크상태'} uncheckedLabel={'언체크상태ddd'} />
        <Search.Input title={'검색'} name={'searchKeyword'} placeholder={'상품명 검색'} />
        <Search.DropDown title="드롭다운" name={'temp'} />
        <Search.DatePicker title="데이트피커" name={'temp'} />
        <Search.TwoDatePicker title="데이트피커" startName={'temp'} endName={'temp'} />
        <Search.DatePickerM title="데이트(년)" name={'name'} />
        <Search.Radio
          title="라디오"
          name={'temp'}
          options={[
            { label: '정상', value: 'N' },
            { label: '휴면', value: 'Y' },
            { label: '전체', value: '' },
          ]}
          value={'Y'}
        />
        {/*<Search.Check*/}
        {/*  title="체크박스"*/}
        {/*  name={'temp'}*/}
        {/*  options={[*/}
        {/*    { label: '정상', value: 'N' },*/}
        {/*    { label: '휴면', value: 'Y' },*/}
        {/*    { label: '전체', value: '' },*/}
        {/*  ]}*/}
        {/*  value={['Y']}*/}
        {/*/>*/}
        {/*<Search.InputChk title="인풋체크" name={'temp'} />*/}
      </Search>

      {/*<Search className="type_2">*/}
      {/*  <CustomNewDatePicker type={'range'} />*/}
      {/*  <CustomNewDatePicker title={'타이틀'} type={'date'} />*/}
      {/*</Search>*/}

      <h4 className="smallTitle mt20">커스텀 데이트피커</h4>
      {/*<div>*/}
      {/*  <CustomNewDatePicker type={'date'} className={'mb10'} />*/}
      {/*  <CustomNewDatePicker title={'타이틀'} type={'date'} className={'mb10'} />*/}
      {/*  <CustomNewDatePicker type={'range'} />*/}
      {/*</div>*/}

      {/*<h4 className="smallTitle mt20">Form 데이트피커</h4>*/}
      {/*<div>*/}
      {/*  <FormNewDatePicker<FormValues> control={control} name={'date'} type={'date'} className={'mb10'} />*/}
      {/*  <FormNewDatePicker<FormValues> control={control} title={'타이틀'} name={'date2'} type={'date'} className={'mb10'} />*/}
      {/*  <FormNewDatePicker<FormValues> control={control} name={'range'} type={'range'} className={'mb10'} />*/}
      {/*  <FormNewDatePicker<FormValues> control={control} name={'range2'} type={'range'} selectType={'type'} className={'mb10'} />*/}
      {/*  <FormNewDatePicker<FormValues> control={control} name={'range3'} type={'range'} selectType={'today'} className={'mb10'} />*/}
      {/*  <FormNewDatePicker<FormValues> control={control} name={'range4'} type={'range'} selectType={'week'} className={'mb10'} />*/}
      {/*  <FormNewDatePicker<FormValues> control={control} name={'range5'} type={'range'} selectType={'month'} className={'mb10'} />*/}
      {/*  <FormNewDatePicker<FormValues> control={control} name={'range6'} type={'range'} selectType={'year'} className={'mb10'} />*/}
      {/*</div>*/}

      <h4 className="smallTitle mt20">아이콘 모음</h4>
      <StyledDiv>
        <span className="ico_add"></span>
        <span className="ico_alarm black"></span>
        <span className="ico_logout black"></span>
        <span className="ico_headerFavorite_off black"></span>
        <span className="ico_headerFavorite_on"></span>
        <span className="ico_date"></span>
        <span className="ico_dateArrowLeft"></span>
        <span className="ico_dateArrowRight"></span>
        <span className="ico_day"></span>
        <span className="ico_delete"></span>
        <span className="ico_downArrow"></span>
        <span className="ico_download"></span>
        <span className="ico_edit"></span>
        <span className="ico_etc"></span>
        <span className="ico_excel_download"></span>
        <span className="ico_excel_download_dis"></span>
        <span className="ico_excel_upload"></span>
        <span className="ico_excel_upload_dis"></span>
        <span className="ico_favorite"></span>
        <span className="ico_favorite_off"></span>
        <span className="ico_id"></span>
        <span className="ico_leftArrow_off"></span>
        <span className="ico_leftArrow_on black"></span>
        <span className="ico_memo"></span>
        <span className="ico_menuBtnLeftArrow black"></span>
        <span className="ico_menuBtnRightArrow black"></span>
        <span className="ico_minus"></span>
        <span className="ico_plus"></span>
        <span className="ico_month"></span>
        <span className="ico_newBrowser"></span>
        <span className="ico_next_all_off"></span>
        <span className="ico_next_all_on black"></span>
        <span className="ico_next_off"></span>
        <span className="ico_next_on black"></span>
        <span className="ico_prev_all_off"></span>
        <span className="ico_prev_all_on black"></span>
        <span className="ico_prev_off"></span>
        <span className="ico_prev_on black"></span>
        <span className="ico_print"></span>
        <span className="ico_receipt_off"></span>
        <span className="ico_receipt_on black"></span>
        <span className="ico_refresh"></span>
        <span className="ico_reset"></span>
        <span className="ico_rightArrow"></span>
        <span className="ico_rightArrow_on black"></span>
        <span className="ico_rightArrow_off"></span>
        <span className="ico_search_gray"></span>
        <span className="ico_search_on"></span>
        <span className="ico_search_off"></span>
        <span className="ico_searchArrow"></span>
        <span className="ico_searchResult black"></span>
        <span className="ico_store black"></span>
        <span className="ico_store_gray"></span>
        <span className="ico_store_on"></span>
        <span className="ico_time black"></span>
        <span className="ico_triangle"></span>
        <span className="ico_upload"></span>
        <span className="ico_user black"></span>
        <span className="ico_week"></span>
        <span className="ico_year"></span>
      </StyledDiv>
    </>
  );
};
const StyledDiv = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;

  & span {
    display: block;
    width: 50px;
    height: 40px;
    background: center no-repeat;
    background-size: auto 70%;

    &.black {
      background-color: #3f4b56;
    }

    &.ico_add {
      background-image: url(/images/ico_add.svg);
    }

    &.ico_alarm {
      background-image: url(/images/ico_alarm.svg);
    }

    &.ico_date {
      background-image: url(/images/ico_date.svg);
    }

    &.ico_dateArrowLeft {
      background-image: url(/images/ico_dateArrowLeft.svg);
    }

    &.ico_dateArrowRight {
      background-image: url(/images/ico_dateArrowRight.svg);
    }

    &.ico_day {
      background-image: url(/images/ico_day.svg);
    }

    &.ico_delete {
      background-image: url(/images/ico_delete.svg);
    }

    &.ico_downArrow {
      background-image: url(/images/ico_downArow.svg);
    }

    &.ico_download {
      background-image: url(/images/ico_download.svg);
    }

    &.ico_edit {
      background-image: url(/images/ico_edit.svg);
    }

    &.ico_etc {
      background-image: url(/images/ico_etc.svg);
    }

    &.ico_excel_download {
      background-image: url(/images/ico_excel_download.svg);
    }

    &.ico_excel_download_dis {
      background-image: url(/images/ico_excel_download_dis.svg);
    }

    &.ico_excel_upload {
      background-image: url(/images/ico_excel_upload.svg);
    }

    &.ico_excel_upload_dis {
      background-image: url(/images/ico_excel_upload_dis.svg);
    }

    &.ico_favorite {
      background-image: url(/images/ico_favorite.svg);
    }

    &.ico_favorite_off {
      background-image: url(/images/ico_favorite_off.svg);
    }

    &.ico_headerFavorite_on {
      background-image: url(/images/ico_headerFavorite_on.svg);
    }

    &.ico_headerFavorite_off {
      background-image: url(/images/ico_headerFavorite_off.svg);
    }

    &.ico_id {
      background-image: url(/images/ico_id.svg);
    }

    &.ico_leftArrow_off {
      background-image: url(/images/ico_leftArrow_off.svg);
    }

    &.ico_leftArrow_on {
      background-image: url(/images/ico_leftArrow_on.svg);
    }

    &.ico_logout {
      background-image: url(/images/ico_logout.svg);
    }

    &.ico_memo {
      background-image: url(/images/ico_memo.svg);
    }

    &.ico_menuBtnLeftArrow {
      background-image: url(/images/ico_menuBtnLeftArrow.svg);
    }

    &.ico_menuBtnRightArrow {
      background-image: url(/images/ico_menuBtnRightArrow.svg);
    }
    &.ico_minus {
      background-image: url(/images/ico_minus.svg);
    }
    &.ico_plus {
      background-image: url(/images/ico_plus.svg);
    }
    &.ico_month {
      background-image: url(/images/ico_month.svg);
    }
    &.ico_newBrowser {
      background-image: url(/images/ico_newBrowser.svg);
    }
    &.ico_next_all_off {
      background-image: url(/images/ico_next_all_off.svg);
    }
    &.ico_next_all_on {
      background-image: url(/images/ico_next_all_on.svg);
    }
    &.ico_next_off {
      background-image: url(/images/ico_next_off.svg);
    }
    &.ico_next_on {
      background-image: url(/images/ico_next_on.svg);
    }
    &.ico_prev_all_off {
      background-image: url(/images/ico_prev_all_off.svg);
    }
    &.ico_prev_all_on {
      background-image: url(/images/ico_prev_all_on.svg);
    }
    &.ico_prev_off {
      background-image: url(/images/ico_prev_off.svg);
    }
    &.ico_prev_on {
      background-image: url(/images/ico_prev_on.svg);
    }
    &.ico_print {
      background-image: url(/images/ico_print.svg);
    }
    &.ico_receipt_off {
      background-image: url(/images/ico_receipt_off.svg);
    }
    &.ico_receipt_on {
      background-image: url(/images/ico_receipt_on.svg);
    }
    &.ico_refresh {
      background-image: url(/images/ico_refresh.svg);
    }
    &.ico_reset {
      background-image: url(/images/ico_reset.svg);
    }
    &.ico_rightArrow {
      background-image: url(/images/ico_rightArrow.svg);
    }
    &.ico_rightArrow_on {
      background-image: url(/images/ico_rightArrow_on.svg);
    }
    &.ico_rightArrow_off {
      background-image: url(/images/ico_rightArrow_off.svg);
    }
    &.ico_search_gray {
      background-image: url(/images/ico_search_gray.svg);
    }
    &.ico_search_on {
      background-image: url(/images/ico_search_on.svg);
    }
    &.ico_search_off {
      background-image: url(/images/ico_search_off.svg);
    }
    &.ico_searchArrow {
      background-image: url(/images/ico_searchArrow.svg);
    }
    &.ico_searchResult {
      background-image: url(/images/ico_searchResult.svg);
    }
    &.ico_store {
      background-image: url(/images/ico_store.svg);
    }
    &.ico_store_gray {
      background-image: url(/images/ico_store_gray.svg);
    }
    &.ico_store_on {
      background-image: url(/images/ico_store_on.svg);
    }
    &.ico_time {
      background-image: url(/images/ico_time.svg);
    }
    &.ico_triangle {
      background-image: url(/images/ico_triangle.svg);
    }
    &.ico_upload {
      background-image: url(/images/ico_upload.svg);
    }
    &.ico_user {
      background-image: url(/images/ico_user.svg);
    }
    &.ico_week {
      background-image: url(/images/ico_week.svg);
    }
    &.ico_year {
      background-image: url(/images/ico_year.svg);
    }
  }
`;
export default Publising;
