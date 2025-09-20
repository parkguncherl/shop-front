/**
 OMS > 변경로그 > 미송거래 변경로그
 /oms/pastHistory/misongLog.tsx
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
import { PastLogResponseMisongLogResponse } from '../../../generated';
import TunedGrid from '../../../components/grid/TunedGrid';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

const MisongData = () => {
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
  });

  const [misongLogList, setMisongLogList] = useState<PastLogResponseMisongLogResponse[]>([]);

  const [columnDefs] = useState<ColDef<PastLogResponseMisongLogResponse>[]>([
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
      headerName: '사용자',
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
      headerName: '영업일자',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      minWidth: 150,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuColor',
      headerName: '칼라',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuSize',
      headerName: '사이즈',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'misongCnt',
      headerName: '미송',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'sendCnt',
      headerName: '발송',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'remainCnt',
      headerName: '잔량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'bundleYn',
      headerName: '묶음',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
  ]);

  const {
    data: misongLogData,
    isLoading: isMisongLogDataLoading,
    isSuccess: isMisongLogDataSuccess,
    refetch: misongLogDataRefetch,
  } = useQuery(['/past/misongLog', filters.startCngPeriod, filters.endCngPeriod, filters.startMisongPeriod, filters.endMisongPeriod], () =>
    authApi.get('/past/misongLog', {
      params: {
        ...filters,
      },
    }),
  );

  useEffect(() => {
    if (isMisongLogDataSuccess) {
      const { resultCode, body, resultMessage } = misongLogData.data;
      if (resultCode === 200) {
        setMisongLogList(body || []);
      } else {
        toastError('페이지 조회 도중 문제가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [misongLogData, isMisongLogDataSuccess]);

  // 검색
  const onSearch = async () => {
    await misongLogDataRefetch();
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
          title={'변경'}
          type={'range'}
          defaultType={'type'}
          startName={'startCngPeriod'}
          endName={'endCngPeriod'}
          onChange={onChangeFilters}
          onEnter={onSearch}
          value={[filters.startCngPeriod, filters.endCngPeriod]}
        />
        <CustomNewDatePicker
          title={'미송'}
          type={'range'}
          defaultType={'type'}
          startName={'startMisongPeriod'}
          endName={'endMisongPeriod'}
          onChange={onChangeFilters}
          onEnter={onSearch}
          value={[filters.startMisongPeriod, filters.endMisongPeriod]}
        />
        <Search.Input
          title={'소매처'}
          name={'sellerNm'}
          placeholder={'판매처명 입력'}
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
      </Search>

      <Table>
        <TableHeader count={misongLogList.length} search={onSearch}></TableHeader>
        <TunedGrid
          ref={gridRef}
          rowData={misongLogList}
          loading={isMisongLogDataLoading}
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

export default MisongData;
