/**
 OMS > 변경로그 > 정산거래 변경로그
 /oms/pastHistory/settlementLog.tsx
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

const MisongData = () => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  const startDt = dayjs().subtract(3, 'month').startOf('month').format('YYYY-MM-DD'); // 3개월
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [menuNm] = useCommonStore((s) => [s.menuNm]);
  const { misongPaging: paging, setMisongPaging: setPaging } = usePastHistoryStore();

  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: startDt,
    endDate: today,
    prodNm: '',
    sellerNm: '',
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
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'sellerNm',
      headerName: '판매처',
      minWidth: 200,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'chitNo',
      headerName: '전표',
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'pumBun',
      headerName: '품번',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.LEFT,
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
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'size',
      headerName: '사이즈',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'dealAmt',
      headerName: '거래단가',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'compYn',
      headerName: '완료',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'misongCnt',
      headerName: '미송수량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'sendCnt',
      headerName: '전송수량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'remainCnt',
      headerName: '잔량수량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'remainAmt',
      headerName: '잔량금액',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'etcCntn',
      headerName: '비고',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
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
    ['fetchOldMisongData', paging.curPage],
    () =>
      authApi.get('/pastHistory/misongData/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
    // {
    //   enabled: false,
    // },
  );
  useEffect(() => {
    if (isSuccess && loadData?.data) {
      const { resultCode, body, resultMessage } = loadData.data;
      if (resultCode === 200) {
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
    console.log('search');
    setPaging({
      curPage: 1,
    });
    await refetch();
  };

  // 초기화버튼 이벤트
  const onReset = async () => {
    console.log('reset');
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
      <Search className="type_2 full">
        <Search.TwoDatePicker
          title={'거래일자'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onEnter={onSearch}
          filters={filters}
          onChange={onChangeFilters}
        />
        <Search.Input
          title={'판매처'}
          name={'sellerNm'}
          placeholder={'판매처명 입력'}
          value={filters.sellerNm}
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
        <div className={'ag-theme-alpine'}>
          <AgGridReact
            ref={gridRef}
            rowData={loadData?.data?.body?.rows || []}
            loading={isLoading}
            columnDefs={columnDefs}
            onGridReady={onGridReady}
            gridOptions={{ rowHeight: 24, headerHeight: 35 }}
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

export default MisongData;
