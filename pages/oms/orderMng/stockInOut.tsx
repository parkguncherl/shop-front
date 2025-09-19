/**
 * @file pages/oms/orderMng/stockInOut.tsx
 * @description  OMS > 상품별입출고집계
 * @Feature 개발보류
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

  const [columnDefs] = useState<ColDef[]>([
    { field: 'no', headerName: 'No', minWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '품번', minWidth: 150, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '품명', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '색상', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '사이즈', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '입고가', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '도매가', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '소매가', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '공장', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '디자이너', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '거래처', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '등록일자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '최근판매', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '전기재고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '전기재고금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '입고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '입고금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '반출', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '반출금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '순수입고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '순수입고금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '판매', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '판매금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '반품', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '반품금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '순수판매', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '이고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '이고금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '샘플', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '샘플금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '회수', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '회수금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '로스', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '로스금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '당기재고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '당기재고금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '현재고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '샘플잔량', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '미송잔량', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '비고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ]); // 컬럼헤더

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

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} search={search} />
      {/*<span style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>(참고: 헤더 재고정보 → 상품별입출고집계)</span>*/}
      <Search className="type_2">
        <Search.TwoDatePicker
          title={'기간'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onEnter={search}
          filters={filters}
          onChange={onChangeFilters}
        />
        <Search.Input
          title={'상품'}
          name={'StockinOutNm'}
          placeholder={'상품 입력'}
          value={filters.StockinOutNm}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.Input
          title={'공장'}
          name={'StockinOutNm'}
          placeholder={'공장 입력'}
          value={filters.StockinOutNm}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.Input
          title={'소매처'}
          name={'StockinOutNm'}
          placeholder={'소매처 입력'}
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
