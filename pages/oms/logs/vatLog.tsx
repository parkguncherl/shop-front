/**
 OMS > 변경로그 > 부가세거래 변경로그
 /oms/pastHistory/vatLog.tsx
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
import { PastLogResponseFactoryLogResponse, PastLogResponseVatLogResponse } from '../../../generated';
import TunedGrid from '../../../components/grid/TunedGrid';
import CompareValueRenderer from './components/CompareValueRenderer';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

const MisongData = () => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  const startDt = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'); // 1개월
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [menuNm] = useCommonStore((s) => [s.menuNm]);

  const [vatLogList, setVatLogList] = useState([]);

  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: startDt,
    endDate: today,
    userNm: '',
    status: '',
  });

  const [columnDefs] = useState<ColDef<PastLogResponseVatLogResponse>[]>([
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
      field: 'workYmd',
      headerName: '청구일자',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'sellerNm',
      headerName: '소매처',
      minWidth: 200,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'chargedAmt',
      headerName: '청구금액',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'dcAmt',
      headerName: '할인금액',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'issuYn',
      headerName: '발행취소',
      minWidth: 30,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.data?.issuYn == 'N' ? 'Y' : 'N'; // 발행여부 N, 최초에는 발행여부는 null(Y로 간주 가능) 이므로 N일 경우 취소로 간주(Y -> N)
      },
      editable: false,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'vatStrYmd',
      headerName: '대상기간시작',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'vatEndYmd',
      headerName: '대상기간종료',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'etcCntn',
      headerName: '비고',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
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
  } = useQuery(['/past/vatLog', filters.startDate, filters.endDate, filters.status], () =>
    authApi.get('/past/vatLog', {
      params: {
        ...filters,
      },
    }),
  );
  useEffect(() => {
    if (isSuccess) {
      const { resultCode, body, resultMessage } = loadData.data;
      if (resultCode === 200) {
        setVatLogList(body || []);
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
    onChangeFilters('startDate', startDt);
    onChangeFilters('endDate', today);
    // 상태가 변경된 후 검색 실행 보장
    await new Promise((resolve) => setTimeout(resolve, 0));
    await onSearch();
  };

  const getDataPath = useCallback((data: PastLogResponseFactoryLogResponse) => {
    return data.path || [];
  }, []);

  const autoGroupColumnDef = useMemo<ColDef<PastLogResponseFactoryLogResponse>>(() => {
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
        innerRenderer: (params: ICellRendererParams<PastLogResponseFactoryLogResponse>) => {
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
          startName={'startDate'}
          endName={'endDate'}
          onChange={onChangeFilters}
          onEnter={onSearch}
          value={[filters.startDate, filters.endDate]}
        />
        <Search.Input
          title={'사용자'}
          name={'userNm'}
          placeholder={'사용자명 입력'}
          value={filters.userNm}
          onEnter={onSearch}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.DropDown
          title={'상태'}
          name={'status'}
          value={filters.status}
          onChange={onChangeFilters}
          defaultOptions={[
            { value: '1', label: '과거일자만' },
            { value: '2', label: '발행취소만' },
          ]}
        />
      </Search>

      <Table>
        <TableHeader count={vatLogList.length} search={onSearch} />
        <TunedGrid
          ref={gridRef}
          rowData={vatLogList}
          loading={isLoading}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          getDataPath={getDataPath}
          treeData={true}
          autoGroupColumnDef={autoGroupColumnDef}
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
