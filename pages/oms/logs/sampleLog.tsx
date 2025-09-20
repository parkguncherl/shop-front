/**
 OMS > 변경로그 > 샘플거래 변경로그
 /oms/pastHistory/sampleLog.tsx
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
import { PastLogResponseSaleLogResponse, PastLogResponseSampleLogResponse } from '../../../generated';
import TunedGrid from '../../../components/grid/TunedGrid';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

const SampleLog = () => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  const startDt = dayjs().subtract(1, 'month').format('YYYY-MM-DD'); // 1개월
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [menuNm] = useCommonStore((s) => [s.menuNm]);

  const [sampleLogList, setSampleLogList] = useState<PastLogResponseSampleLogResponse[]>([]);

  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDateOfChangePeriod: startDt,
    endDateOfChangePeriod: today,
    startDateOfMisongPeriod: startDt,
    endDateOfMisongPeriod: today,
    skuNm: '',
    sellerNm: '',
    filtering: '',
  });

  const [columnDefs] = useState<ColDef<PastLogResponseSampleLogResponse>[]>([
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
      headerName: '샘플일자',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuNm',
      headerName: '상품',
      minWidth: 130,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuColor',
      headerName: '컬러',
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
      field: 'sampleCnt',
      headerName: '샘플',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        if (params.data?.delYn == 'Y') {
          return '삭제';
        } else {
          return params.value;
        }
      },
    },
    {
      field: 'retrieveCnt',
      headerName: '회수',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        if (params.data?.retriveCancelYn == 'Y' && params.value == 0) {
          return '취소';
        } else {
          return params.value;
        }
      },
    },
    /*{
      field: 'soldInSampleCnt',
      headerName: '샘플판매',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },*/
    {
      field: 'remainCnt',
      headerName: '잔량',
      minWidth: 80,
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
    [
      '/past/sampleLog',
      filters.startDateOfChangePeriod,
      filters.endDateOfChangePeriod,
      filters.startDateOfMisongPeriod,
      filters.endDateOfMisongPeriod,
      filters.filtering,
    ],
    () =>
      authApi.get('/past/sampleLog', {
        params: {
          ...filters,
        },
      }),
  );
  useEffect(() => {
    if (isSuccess) {
      const { resultCode, body, resultMessage } = loadData.data;
      if (resultCode === 200) {
        setSampleLogList(body || []);
      } else {
        toastError('조회 도중 에러가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [loadData, isSuccess]);

  /**
   * Event Handler
   */

  // 검색
  const onSearch = async () => {
    await refetch();
  };

  // 초기화버튼 이벤트
  const onReset = async () => {
    onFiltersReset();
    onChangeFilters('startDateOfChangePeriod', startDt);
    onChangeFilters('endDateOfChangePeriod', today);
    onChangeFilters('startDateOfMisongPeriod', startDt);
    onChangeFilters('endDateOfMisongPeriod', today);

    // 상태가 변경된 후 검색 실행 보장
    //await new Promise((resolve) => setTimeout(resolve, 0));
    //await onSearch();
  };

  const getDataPath = useCallback((data: PastLogResponseSaleLogResponse) => {
    return data.path || [];
  }, []);

  const autoGroupColumnDef = useMemo<ColDef<PastLogResponseSaleLogResponse>>(() => {
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
        innerRenderer: (params: ICellRendererParams<PastLogResponseSaleLogResponse>) => {
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
          startName={'startDateOfChangePeriod'}
          endName={'endDateOfChangePeriod'}
          onChange={onChangeFilters}
          onEnter={onSearch}
          value={[filters.startDateOfChangePeriod, filters.endDateOfChangePeriod]}
        />
        <CustomNewDatePicker
          title={'미송'}
          type={'range'}
          defaultType={'type'}
          startName={'startDateOfMisongPeriod'}
          endName={'endDateOfMisongPeriod'}
          onChange={onChangeFilters}
          onEnter={onSearch}
          value={[filters.startDateOfMisongPeriod, filters.endDateOfMisongPeriod]}
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
          name={'filtering'}
          value={filters.filtering}
          onChange={onChangeFilters}
          defaultOptions={[
            { value: '1', label: '샘플삭제만' },
            { value: '2', label: '회수취소만' },
          ]}
        />
      </Search>

      <Table>
        <TableHeader count={sampleLogList.length} search={onSearch}></TableHeader>
        <TunedGrid
          ref={gridRef}
          rowData={sampleLogList}
          loading={isLoading}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          getDataPath={getDataPath}
          autoGroupColumnDef={autoGroupColumnDef}
          treeData={true}
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

export default SampleLog;
