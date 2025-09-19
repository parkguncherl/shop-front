/**
 OMS > 과거이력 > 입고원장 페이지
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore, useMenuStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { Pagination, Search, Table, TableHeader, Title, toastError } from '../../../components';
import { GridSetting } from '../../../libs/ag-grid';
import { ColDef } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { Utils } from '../../../libs/utils';
import { usePastHistoryStore } from '../../../stores/usePastHistoryStore';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

const StockData = () => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  const startDt = dayjs().subtract(3, 'month').startOf('month').format('YYYY-MM-DD'); // 3개월
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [menuNm] = useCommonStore((s) => [s.menuNm]);
  const { stockPaging: paging, setStockPaging: setPaging } = usePastHistoryStore();

  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: startDt,
    endDate: today,
    prodNm: '',
    stockNm: '',
    partnerId: session.data?.user.partnerId,
  });

  const [columnDefs] = useState<ColDef[]>([
    {
      field: 'no',
      headerName: 'No',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'tranYmd',
      headerName: '거래일자',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'stockNm',
      headerName: '입고처',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'chitNo',
      headerName: '전표',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'gubun',
      headerName: '구분',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'pumBun',
      headerName: '품번',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'prodNm',
      headerName: '상품명',
      minWidth: 150,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'color',
      headerName: '칼라',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'size',
      headerName: '사이즈',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'dealAmt',
      headerName: '거래단가',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'danDc',
      headerName: '단가DC',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'stockCnt',
      headerName: '입고수량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'stockAmt',
      headerName: '입고금액',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'remainCnt',
      headerName: '반출수량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'remainAmt',
      headerName: '반출금액',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
  ]);

  /**
   *  API
   */

  // 목록 조회
  const {
    data: loadData,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery(
    ['fetchOldStockData', paging.curPage, paging.pageRowCount, filters],
    () =>
      authApi.get('/pastHistory/stockData/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
    {
      keepPreviousData: true, // 기존 데이터 유지 (페이징 전환 시 깜빡임 방지)
    },
  );
  useEffect(() => {
    if (isSuccess && loadData?.data) {
      const { resultCode, body, resultMessage } = loadData.data;
      if (resultCode === 200) {
        console.log('data');
        setPaging(body?.paging);
      } else {
        toastError(resultMessage);
      }
    }
  }, [loadData, isSuccess]);

  /**
   * Event Handler
   */

  // 검색
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    await refetch();
  };

  // 초기화버튼 이벤트
  const onReset = async () => {
    onFiltersReset();
    onChangeFilters('startDate', startDt);
    onChangeFilters('endDate', today);
    onChangeFilters('partnerId', session.data?.user.partnerId as number);
    // 상태가 변경된 후 검색 실행 보장
    await new Promise((resolve) => setTimeout(resolve, 0));
    await onSearch();
  };

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} reset={onReset} search={onSearch} />
      <Search className="type_2">
        <CustomNewDatePicker
          title={'기간'}
          type={'range'}
          defaultType={'type'}
          startName={'startDate'}
          endName={'endDate'}
          onChange={onChangeFilters}
          onEnter={onSearch}
          value={[filters.startDate, filters.endDate]}
        />
        <Search.Input
          title={'입고처'}
          name={'stockNm'}
          placeholder={'입고처명 입력'}
          value={filters.stockNm}
          onEnter={onSearch}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.Input
          title={'상품명'}
          name={'prodNm'}
          placeholder={'상품명 입력'}
          value={filters.prodNm}
          onEnter={onSearch}
          onChange={onChangeFilters}
          filters={filters}
        />
      </Search>

      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={onSearch}></TableHeader>
        <div className={'ag-theme-alpine pagingDefault'}>
          <AgGridReact
            ref={gridRef}
            rowData={loadData?.data?.body?.rows || []}
            loading={isLoading}
            columnDefs={columnDefs}
            onGridReady={onGridReady}
            gridOptions={{ rowHeight: 28, headerHeight: 35 }}
            rowSelection={'multiple'}
            suppressRowClickSelection={true}
            paginationPageSize={paging.pageRowCount}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            enableRangeSelection={true}
            //suppressMultiRangeSelection={false}
          />
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
    </div>
  );
};

export default StockData;
