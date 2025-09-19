/**
 * @file pages/oms/pastHistory/expenseLog.tsx
 * @description  OMS > 변경로그 > 입출금 변경로그
 * @copyright 2024
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
import { ColDef, ICellRendererParams, RowClassParams } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { CompareValueRenderer } from './components/CompareValueRenderer';
import TunedGrid from '../../../components/grid/TunedGrid';
import { PastLogResponseExpenseLogResponse, PastLogResponseMisongLogResponse } from '../../../generated';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

/**
 * 입출금 변경로그 컴포넌트
 * @component
 * @returns {JSX.Element} 렌더링된 컴포넌트
 */
const ExpenseLog = () => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  // 날짜 초기값 설정 (1개월)
  const startDt = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [menuNm] = useCommonStore((s) => [s.menuNm]);

  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: startDt,
    endDate: today,
    userNm: '',
    status: '',
  });

  // 매장입출금 로그 목록
  const [expenseLogList, setExpenseLogList] = useState<PastLogResponseExpenseLogResponse[]>([]);

  // AG-Grid 컬럼 정의
  const [columnDefs] = useState<ColDef<PastLogResponseExpenseLogResponse>[]>([
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
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: ({ value }) => {
        return value ? value.substring(0, 8) : '';
      },
    },
    {
      field: 'userNm',
      headerName: '사용자',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'workYmd',
      headerName: '영업일자',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'type',
      headerName: '유형',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'inAmt',
      headerName: '입금금액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'outAmt',
      headerName: '출금금액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'noteCntn',
      headerName: '비고',
      minWidth: 180,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
  ]);

  // 데이터 조회 API 호출
  const {
    data: loadData,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery(['/past/expenseLog', filters.startDate, filters.endDate, filters.status], (): any =>
    authApi.get('/past/expenseLog', {
      params: {
        ...filters,
      },
    }),
  );

  // API 응답 처리
  useEffect(() => {
    if (isSuccess && loadData?.data) {
      const { resultCode, body, resultMessage } = loadData.data;
      if (resultCode === 200) {
        console.log(body);
        setExpenseLogList(body);
      } else {
        toastError(resultMessage);
      }
    }
  }, [loadData, isSuccess]);

  /**
   * 검색 버튼 클릭 핸들러
   */
  const onSearch = async () => {
    await refetch();
  };

  /**
   * 초기화 버튼 클릭 핸들러
   */
  const onReset = async () => {
    onFiltersReset();
    onChangeFilters('startDate', startDt);
    onChangeFilters('endDate', today);

    await new Promise((resolve) => setTimeout(resolve, 0));
    await onSearch();
  };

  /**
   * 배경행 no숫자별 색상 정렬 홀수일때만 ag-grid-changeOrder적용
   */
  const addClass = (currentClass: string, newClass: string) => (currentClass ? `${currentClass} ${newClass}` : newClass);

  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params && params.data.no) {
      const rowNumber = parseInt(params.data.no);
      if (!isNaN(rowNumber) && rowNumber % 2 === 1) {
        // 홀수일 때만 스타일 적용
        rtnValue = addClass(rtnValue, 'ag-grid-changeOrder');
      }
    }
    return rtnValue;
  }, []);

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
          defaultOptions={[{ value: 'P', label: '과거일자만' }]}
        />
      </Search>
      <Table>
        <TableHeader count={expenseLogList.length} search={onSearch} />
        <TunedGrid
          ref={gridRef}
          rowData={expenseLogList}
          loading={isLoading}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          suppressRowClickSelection={true}
          treeData={true}
          getDataPath={getDataPath}
          autoGroupColumnDef={autoGroupColumnDef}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          getRowClass={getRowClass}
          className={'nothingDefault'}
        />
      </Table>
    </div>
  );
};

export default ExpenseLog;
