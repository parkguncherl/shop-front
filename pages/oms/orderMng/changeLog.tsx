/**
 * @file pages/oms/sims/changeLog.tsx
 * @description  OMS > 변경로그
 * @Feature 개발보류 ( cre_user : OMS 1차메뉴정리 )
 * @copyright 2024.12.27
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useAgGridApi, useDidMountEffect } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { PartnerResponsePaging } from '../../../generated';
import { Pagination, Search, Table, TableHeader, Title, toastError } from '../../../components';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { PartnerPagingFilter, usePartnerStore } from '../../../stores/usePartnerStore';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import PartnerAddPop from '../../../components/popup/partner/PartnerAddPop';
import PartnerModPop from '../../../components/popup/partner/PartnerModPop';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { DatePicker } from 'antd';

const PartnerMng = () => {
  /** Grid Api */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();
  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  /** 스토어 */
  const [paging, setPaging, selectedPartner, setSelectedPartner, modalType, openModal] = usePartnerStore((s) => [
    s.paging,
    s.setPaging,
    s.selectedPartner,
    s.setSelectedPartner,
    s.modalType,
    s.openModal,
  ]);
  /** 필터 */
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<PartnerPagingFilter>({});

  // 파트너 추가하기 버튼 렌더링
  const lowAddBtnCellRenderer = (params: any) => {
    const upperPartnerNmColumn = params.data.upperPartnerNm;
    const onClick = () => {
      setSelectedPartner({});
      openModal('ADD');
    };
    // 화주만 추가할수있음 도매 X
    if (!upperPartnerNmColumn) {
      return (
        <div className="btnArea center">
          <button className="btn tblBtn" onClick={onClick}>
            +
          </button>
        </div>
      );
    } else {
      return null;
    }
  };

  // 라디오 버튼 선택 상태를 관리하는 state
  const [selectedOption, setSelectedOption] = useState('상품자료');

  // 라디오 버튼 변경 핸들러
  const handleRadioChange = (value: any) => {
    setSelectedOption(value);
  };
  /*// 공통 ID 컬럼 정의
  const commonIdColumn: ColDef = {
    headerName: 'No',
    field: 'No',
    width: 60,
    valueGetter: (params) => (params.node?.rowIndex ?? -1) + 1,
    cellStyle: { ...GridSetting.CellStyle.CENTER, fontWeight: 'bold', maxWidth: 60 },
    suppressHeaderMenuButton: true,
  };*/
  // 각 옵션에 대한 개별 컬럼 정의
  const 상품자료Columns: ColDef[] = [
    { field: 'no', headerName: 'No', minWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경일자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '품번', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '품명', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: ' ',
      headerName: '휴먼',
      maxWidth: 60,
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      checkboxSelection: true,
      cellClass: 'ag-checkbox-cell',
      // headerCheckboxSelection: true,
    },
    { field: '', headerName: '칼라', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '사이즈', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '구분1', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '구분2', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '구분3', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '혼용률', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입고가', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '도매가', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '소매가', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '제품원가', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: ' ',
      headerName: '휴먼',
      maxWidth: 60,
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      checkboxSelection: true,
      cellClass: 'ag-checkbox-cell',
      // headerCheckboxSelection: true,
    },
    { field: '', headerName: '도매특가', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '소매특가', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '공임특가', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '현재고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ];

  const 판매처자료Columns: ColDef[] = [
    { field: 'no', headerName: 'No', minWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경일자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '판매처', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: ' ',
      headerName: '휴먼',
      maxWidth: 60,
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      checkboxSelection: true,
      cellClass: 'ag-checkbox-cell',
      // headerCheckboxSelection: true,
    },
    { field: '', headerName: '구분1', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '구분2', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '현잔액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '잔액상한', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '매입잔액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: 'DC율', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ];

  const 입고처자료Columns: ColDef[] = [
    { field: 'no', headerName: 'No', minWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경일자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입고처', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: ' ',
      headerName: '휴먼',
      maxWidth: 60,
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      checkboxSelection: true,
      cellClass: 'ag-checkbox-cell',
      // headerCheckboxSelection: true,
    },
    { field: '', headerName: '구분1', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '구분2', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '현잔액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '잔액상한', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ];

  const 계정과목자료Columns: ColDef[] = [
    { field: 'no', headerName: 'No', minWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경일자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '계정과목', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '수정 계정과목', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '삭제/추가', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: ' ',
      headerName: '휴먼',
      maxWidth: 60,
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      checkboxSelection: true,
      cellClass: 'ag-checkbox-cell',
      // headerCheckboxSelection: true,
    },
    { field: '', headerName: '계정그룹', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ];

  const 판매거래Columns: ColDef[] = [
    { field: 'no', headerName: 'No', maxWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '거래일자', minWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '판매처', minWidth: 150, suppressHeaderMenuButton: true },
    { field: '', headerName: '업태', minWidth: 150, suppressHeaderMenuButton: true },
    {
      field: ' ',
      headerName: '결제수정',
      maxWidth: 60,
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      checkboxSelection: true,
      cellClass: 'ag-checkbox-cell',
      // headerCheckboxSelection: true,
    },
    { field: '', headerName: '전표', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '세금', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '전작액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '전매입잔액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '판매량', minWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '반품량', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '판매금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '반품금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '매입금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '할인금액', minWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '부가세', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '현잔액수정', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '현매입액수정', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '단가DC', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '현금지급', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '통장지급', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '외상금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '잔액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '매입잔액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '비고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },

    { field: '', headerName: '입력자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ];

  const 입고거래Columns: ColDef[] = [
    { field: 'no', headerName: 'No', maxWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '거래일자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '판매처', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '업태', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: ' ',
      headerName: '결제수정',
      maxWidth: 60,
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      checkboxSelection: true,
      cellClass: 'ag-checkbox-cell',
      // headerCheckboxSelection: true,
    },
    { field: '', headerName: '전표', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '세금', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '전잔액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '전매입잔액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '판매량', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '반품량', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '판매금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '반품금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '매입금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '할인금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '부가세', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '현잔액수정', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '현매입액수정', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '단가DC', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '현금지급', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '통장지급', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '통장지급', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '외상금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '잔액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '매입잔액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '비고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ];

  const 이고거래Columns: ColDef[] = [
    { field: 'no', headerName: 'No', maxWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '이고일자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '어디로', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입고확인', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '전표', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '이고량', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '사입가금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '원가금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '도매가금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '보낸메세지', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '받은메세지', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '비고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ];

  const 보류거래Columns: ColDef[] = [
    { field: 'no', headerName: 'No', maxWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '거래일자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '판매처', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '업태', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '전표', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: ' ',
      headerName: '결제수정',
      maxWidth: 60,
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      checkboxSelection: true,
      cellClass: 'ag-checkbox-cell',
      // headerCheckboxSelection: true,
    },
    { field: '', headerName: '판매량', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '반품량', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '판매금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '반품금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '매입금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '할인금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '부가세', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '단가DC', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '현금입금', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '통장입금', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '비고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ];

  const 정산거래Columns: ColDef[] = [
    { field: 'no', headerName: 'No', maxWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '영업일자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경일자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '전기시제', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '차기시제', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '돈통현금', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '현금과부족', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '비고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ];

  const 입출금거래Columns: ColDef[] = [
    { field: 'no', headerName: 'No', maxWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '거래일자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: ' ',
      headerName: '정산제외',
      maxWidth: 60,
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      checkboxSelection: true,
      cellClass: 'ag-checkbox-cell',
      // headerCheckboxSelection: true,
    },
    { field: '', headerName: '계정과목', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입금금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '출금금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '비고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ];

  const 미송거래Columns: ColDef[] = [
    { field: 'no', headerName: 'No', maxWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '거래일자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '판매처', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '전표', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '품번', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '품명', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '칼라', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '사이즈', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '거래단가', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: ' ',
      headerName: '완료',
      maxWidth: 60,
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      checkboxSelection: true,
      cellClass: 'ag-checkbox-cell',
      // headerCheckboxSelection: true,
    },
    { field: '', headerName: '미송', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '발송', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '비고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ];

  const 샘플거래Columns: ColDef[] = [
    { field: 'no', headerName: 'No', maxWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '거래일자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '판매처', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '전표', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '품번', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '품명', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '칼라', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '사이즈', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '거래단가', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: ' ',
      headerName: '완료',
      maxWidth: 60,
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      checkboxSelection: true,
      cellClass: 'ag-checkbox-cell',
      // headerCheckboxSelection: true,
    },
    { field: '', headerName: '샘플', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '회수', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '비고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ];

  const 오더거래Columns: ColDef[] = [
    { field: 'no', headerName: 'No', maxWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '거래일자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '판매처', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '전표', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '품번', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '품명', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '칼라', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '사이즈', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '거래단가', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: ' ',
      headerName: '완료',
      maxWidth: 60,
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      checkboxSelection: true,
      cellClass: 'ag-checkbox-cell',
      // headerCheckboxSelection: true,
    },
    { field: '', headerName: '오더', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '발송', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '비고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ];

  const 부가세거래Columns: ColDef[] = [
    { field: 'no', headerName: 'No', maxWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '거래일자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '판매처', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '전표', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: ' ',
      headerName: '발행',
      maxWidth: 60,
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      checkboxSelection: true,
      cellClass: 'ag-checkbox-cell',
      // headerCheckboxSelection: true,
    },
    {
      field: ' ',
      headerName: '완료',
      maxWidth: 60,
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      checkboxSelection: true,
      cellClass: 'ag-checkbox-cell',
      // headerCheckboxSelection: true,
    },
    { field: '', headerName: '청구금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '현금입금', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '통장입금', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '할인금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '비고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '입력시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: '', headerName: '변경시간', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ];

  // 선택된 옵션에 따라 컬럼을 동적으로 설정
  const [columnDefs, setColumnDefs] = useState<ColDef[]>(상품자료Columns);

  useEffect(() => {
    switch (selectedOption) {
      case '상품자료':
        setColumnDefs(상품자료Columns);
        break;
      case '판매처자료':
        setColumnDefs(판매처자료Columns);
        break;
      case '입고처자료':
        setColumnDefs(입고처자료Columns);
        break;
      case '계정과목자료':
        setColumnDefs(계정과목자료Columns);
        break;
      case '판매거래':
        setColumnDefs(판매거래Columns);
        break;
      case '입고거래':
        setColumnDefs(입고거래Columns);
        break;
      case '이고거래':
        setColumnDefs(이고거래Columns);
        break;
      case '보류거래':
        setColumnDefs(보류거래Columns);
        break;
      case '정산거래':
        setColumnDefs(정산거래Columns);
        break;
      case '입출금거래':
        setColumnDefs(입출금거래Columns);
        break;
      case '미송거래':
        setColumnDefs(미송거래Columns);
        break;
      case '샘플거래':
        setColumnDefs(샘플거래Columns);
        break;
      case '오더거래':
        setColumnDefs(오더거래Columns);
        break;
      case '부가세거래':
        setColumnDefs(부가세거래Columns);
        break;
    }
  }, [selectedOption]);

  /** 검색 */
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    await partnersRefetch();
  };

  /** 화주관리 페이징 목록 조회 */
  const {
    data: partners,
    isLoading,
    isSuccess: isListSuccess,
    refetch: partnersRefetch,
  } = useQuery(['/partner/paging', paging.curPage], () =>
    authApi.get('/partner/paging', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      },
    }),
  );
  useEffect(() => {
    if (isListSuccess) {
      const { resultCode, body, resultMessage } = partners.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
      } else {
        toastError(resultMessage);
      }
    }
  }, [partners, isListSuccess, setPaging]);

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };
  useEffect(() => {
    // 검색 조건 또는 페이지가 변경될 때마다 검색 수행
    onSearch();
  }, []);

  /** 드롭다운 옵션 */
  const dropdownOptions = [
    { key: 'SL', value: 'select', label: '선택' },
    { key: 'HW', value: '0', label: '화주' },
    { key: 'DM', value: 'any', label: '도매' },
  ];
  /** 드롭다운 변경 시 */
  const onChangeOptions = useCallback(async (name: string, value: string | number) => {
    dispatch({ name: name, value: value });
  }, []);
  useDidMountEffect(() => {
    // 드롭다운 변경시
    onSearch();
  }, [filters.upperPartnerId]);

  /** 셀 클릭 이벤트 */
  const onCellClicked = async (cellClickedEvent: CellClickedEvent) => {
    const { colDef, data } = cellClickedEvent;
    // 버튼 셀 제외
    if (colDef.field === 'action') {
      return;
    }
    openModal('MOD');
  };
  const [selectedGridValue, setSelectedGridValue] = useState<string | number>(1);

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} search={search} />
      {/*<span style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>(참고: 헤더 변경로그(각메뉴의 수정/삭제가 일어나면 남는 로그자료))</span>*/}

      <Search.Radio
        name={'companyOptionLeft'}
        options={[
          { label: '상품자료', value: '상품자료' },
          { label: '판매처자료', value: '판매처자료' },
          { label: '입고처자료', value: '입고처자료' },
          { label: '계정과목자료', value: '계정과목자료' },
          { label: '판매거래', value: '판매거래' },
          { label: '입고거래', value: '입고거래' },
          { label: '이고거래', value: '이고거래' },
          { label: '보류거래', value: '보류거래' },
          { label: '정산거래', value: '정산거래' },
          { label: '입출금거래', value: '입출금거래' },
          { label: '미송거래', value: '미송거래' },
          { label: '샘플거래', value: '샘플거래' },
          { label: '오더거래', value: '오더거래' },
          { label: '부가세거래', value: '부가세거래' },
        ]}
        value={selectedGridValue}
        onChange={(name, value) => {
          setSelectedGridValue(value); // 선택된 값을 상태로 업데이트
          handleRadioChange(value);
        }}
        button={true}
      />

      <Search className="type_2">
        <Search.TwoDatePicker
          title={'변경일자'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onEnter={search}
          filters={filters}
          onChange={onChangeFilters}
        />
        <Search.Input
          title={'변경자'}
          name={'StockinOutNm'}
          placeholder={'변경자 입력'}
          value={filters.StockinOutNm}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.Input
          title={'조회조건'}
          name={'StockinOutNm'}
          placeholder={'조회조건 입력'}
          value={filters.StockinOutNm}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
      </Search>

      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}></TableHeader>
        <div className={'ag-theme-alpine'}>
          <AgGridReact
            headerHeight={35}
            onGridReady={onGridReady}
            loading={isLoading}
            rowData={(partners?.data?.body?.rows as PartnerResponsePaging[]) || []}
            gridOptions={{ rowHeight: 24 }}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            paginationPageSize={paging.pageRowCount}
            rowSelection={'multiple'}
            onCellClicked={onCellClicked}
            onRowClicked={(e) => {
              setSelectedPartner(e.data as PartnerResponsePaging);
              e.api.deselectAll();
            }}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
          />
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
      {modalType.type === 'ADD' && modalType.active && <PartnerAddPop data={selectedPartner || {}} />}
      {modalType.type === 'MOD' && modalType.active && <PartnerModPop datas={selectedPartner || {}} />}
    </div>
  );
};

export default PartnerMng;
