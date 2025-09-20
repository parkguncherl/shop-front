/**
 OMS > 변경로그 > 보류거래 변경로그
 /oms/pastHistory/boryuLog.tsx
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { Search, Table, TableHeader, Title, toastError } from '../../../components';
import { GridSetting } from '../../../libs/ag-grid';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { Utils } from '../../../libs/utils';
import { PastLogResponseBoryuLogResponse, PastLogResponseMisongLogResponse } from '../../../generated';
import TunedGrid from '../../../components/grid/TunedGrid';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

const BoryuLog = () => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  const startDt = dayjs().subtract(1, 'month').format('YYYY-MM-DD'); // 1개월
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [menuNm] = useCommonStore((s) => [s.menuNm]);

  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startCngPeriod: startDt,
    endCngPeriod: today,
    startMisongPeriod: startDt,
    endMisongPeriod: today,
    skuNm: '',
    sellerNm: '',
    orderCd: '',
  });

  const [boryuLogList, setBoryuLogList] = useState<PastLogResponseBoryuLogResponse[]>([]);

  const [columnDefs] = useState<ColDef<PastLogResponseBoryuLogResponse>[]>([
    {
      headerName: '로그',
      minWidth: 100,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        const childCount = params.node?.allChildrenCount ? params.node.allChildrenCount : null;
        return childCount ? params.data?.historyStatus + ' ( ' + childCount + ' ) ' : params.data?.historyStatus || '';
      },
    },
    {
      field: 'updYmd',
      headerName: '변경일자',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: ({ value }) => {
        return value ? value.substring(0, 10) : '';
      },
    },
    {
      field: 'updHms',
      headerName: '변경시간',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: ({ value }) => {
        return value ? value.substring(0, 8) : '';
      },
    },
    {
      field: 'userNm',
      headerName: '등록일시',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },

    {
      field: 'sellerNm',
      headerName: '소매처',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },

    {
      field: 'workYmd',
      headerName: '예약일자',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'orderCdNm',
      headerName: '유형',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'sellCnt',
      headerName: '판매량',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'returnCnt',
      headerName: '반품량',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'dailyTotal',
      headerName: '당일합계',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'sellAmt',
      headerName: '판매금액',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'returnAmt',
      headerName: '반품금액',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'baseAmtDc',
      headerName: '단가DC',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'discountAmt',
      headerName: '할인금액',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'vatAmt',
      headerName: '부가세',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'logisAmt',
      headerName: '물류비',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'cashAmt',
      headerName: '현금입금',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'accountAmt',
      headerName: '통장입금',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'etc',
      headerName: '비고',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
  ]);

  const {
    data: boryuLogData,
    isLoading: isBoryuLogDataLoading,
    isSuccess: isBoryuLogDataSuccess,
    refetch: boryuLogDataRefetch,
  } = useQuery(['/past/boryuLog', filters.startCngPeriod, filters.endCngPeriod, filters.orderCd], (): any =>
    authApi.get('/past/boryuLog', {
      params: {
        ...filters,
      },
    }),
  );

  useEffect(() => {
    if (isBoryuLogDataSuccess) {
      const { resultCode, body, resultMessage } = boryuLogData.data;
      if (resultCode === 200) {
        console.log(body);
        setBoryuLogList(body || []);
      } else {
        toastError('페이지 조회 도중 문제가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [boryuLogData, isBoryuLogDataSuccess]);

  // 검색
  const onSearch = async () => {
    await boryuLogDataRefetch();
  };

  // 초기화버튼 이벤트
  const onReset = async () => {
    onFiltersReset();
    onChangeFilters('startCngPeriod', startDt);
    onChangeFilters('endCngPeriod', today);
    onChangeFilters('startMisongPeriod', startDt);
    onChangeFilters('endMisongPeriod', today);

    // 상태가 변경된 후 검색 실행 보장
    await new Promise((resolve) => setTimeout(resolve, 0));
    await onSearch();
  };

  const getDataPath = useCallback((data: PastLogResponseMisongLogResponse) => {
    return data.path || [];
  }, []);

  const gridStyles = `
  .align-right {
    text-align: right !important;
  }
`;

  const autoGroupColumnDef = useMemo<ColDef<PastLogResponseMisongLogResponse>>(() => {
    return {
      // No 컬럼을 트리 컬럼으로
      field: 'no',
      headerName: 'No',
      maxWidth: 60,
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      cellClassRules: {
        'ag-grid-log-tree-child': (params) => params.data?.level == 1,
      },
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        suppressCount: true,
        innerRenderer: (params: ICellRendererParams<PastLogResponseMisongLogResponse>) => {
          return params.value;
        },
      },
      suppressHeaderMenuButton: true,
    };
  }, []);

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} reset={onReset} search={onSearch} />
      <Search className="type_2">
        <CustomNewDatePicker
          title={'기간'}
          type={'range'}
          defaultType={'type'}
          startName={'startCngPeriod'}
          endName={'endCngPeriod'}
          onChange={onChangeFilters}
          onEnter={onSearch}
          value={[filters.startCngPeriod, filters.endCngPeriod]}
        />
        <Search.Input
          title={'소매처'}
          name={'sellerNm'}
          placeholder={'소매처명 입력'}
          value={filters.sellerNm}
          onEnter={onSearch}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.Input
          title={'상품명'}
          name={'skuNm'}
          placeholder={'상품명 입력'}
          value={filters.skuNm}
          onEnter={onSearch}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.DropDown
          title={'필터링'}
          name={'orderCd'}
          value={filters.orderCd}
          onChange={onChangeFilters}
          defaultOptions={[
            { value: '9', label: '판매' },
            { value: '1', label: '반품' },
            { value: '5', label: '샘플' },
          ]}
        />
      </Search>

      <Table>
        <TableHeader count={boryuLogList.length} search={onSearch}></TableHeader>
        <TunedGrid
          ref={gridRef}
          rowData={boryuLogList}
          loading={isBoryuLogDataLoading}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          treeData={true}
          getDataPath={getDataPath}
          autoGroupColumnDef={autoGroupColumnDef}
          rowSelection={'multiple'}
          suppressRowClickSelection={true}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          enableRangeSelection={true}
          //suppressMultiRangeSelection={false}
          className={'nothingDefault'}
        />
      </Table>
    </div>
  );
};

export default BoryuLog;
