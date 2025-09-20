import { Search, Table, TableHeader, Title, toastError } from '../../../components';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import dayjs from 'dayjs';
import TunedGrid from '../../../components/grid/TunedGrid';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { PastLogResponseSettlementHistoryResponse, PastLogResponseUpcLogResponse } from '../../../generated';
import { Utils } from '../../../libs/utils';
import { useSession } from 'next-auth/react';
import CompareValueRenderer from '../logs/components/CompareValueRenderer';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

const SettlementHistory = () => {
  const session = useSession();
  /** Grid Api */
  const { onGridReady } = useAgGridApi();

  /** 참조 */
  const gridRef = useRef<AgGridReact>(null);

  // 날짜 초기값 설정 (1개월)
  const startDt = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');
  /** 공통 스토어 - State */
  const [upMenuNm, menuNm, selectedRetailInCommon] = useCommonStore((s) => [s.upMenuNm, s.menuNm, s.selectedRetail]);

  /** 필터 */
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    userNm: '',
    status: '',
  });

  /** 정산이력 및 상세 목록 */
  const [settlementHistList, setSettlementHistList] = useState<PastLogResponseSettlementHistoryResponse[]>([]);

  const {
    data: settlementHist,
    isLoading: isSettlementHistLoading,
    isSuccess: fetchHistSuccess,
    refetch: fetchSettlementHist,
  } = useQuery(['/past/settlementHistory', filters.startDate, filters.endDate, filters.status], () =>
    authApi.get('/past/settlementHistory', {
      params: {
        ...filters,
      },
    }),
  );

  useEffect(() => {
    if (fetchHistSuccess) {
      const { resultCode, body, resultMessage } = settlementHist.data;
      if (resultCode == 200) {
        console.log(body);
        setSettlementHistList(body);
      } else {
        toastError('페이지 조회 도중 문제가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [settlementHist, isSettlementHistLoading, fetchHistSuccess]);

  /**
   * 검색 버튼 클릭 핸들러
   */
  const onSearch = async () => {
    await fetchSettlementHist();
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

  /** 그리드 컬럼 */
  const columnDefs = useMemo<ColDef<PastLogResponseSettlementHistoryResponse>[]>(
    () => [
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
        headerName: '영업일자',
        minWidth: 120,
        maxWidth: 120,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        valueFormatter: (params) => {
          return params.value ? dayjs(params.value).format('MM/DD (ddd)') : '';
        },
      },
      {
        field: 'prevTense',
        headerName: '전기시재',
        minWidth: 90,
        maxWidth: 90,
        suppressHeaderMenuButton: true,
        cellRenderer: CompareValueRenderer,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'cashIncome',
        headerName: '현금입금',
        minWidth: 90,
        maxWidth: 90,
        suppressHeaderMenuButton: true,
        cellRenderer: CompareValueRenderer,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'sumOfInAmt',
        headerName: '매장입금',
        minWidth: 90,
        maxWidth: 90,
        suppressHeaderMenuButton: true,
        cellRenderer: CompareValueRenderer,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'sumOfOutAmt',
        headerName: '매장출금',
        minWidth: 90,
        maxWidth: 90,
        suppressHeaderMenuButton: true,
        cellRenderer: CompareValueRenderer,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'cashInComputer',
        headerName: '전산현금',
        minWidth: 90,
        maxWidth: 90,
        suppressHeaderMenuButton: true,
        cellRenderer: CompareValueRenderer,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'wonTot',
        headerName: '돈통금액',
        minWidth: 90,
        maxWidth: 90,
        suppressHeaderMenuButton: true,
        cellRenderer: CompareValueRenderer,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'differenceInCash',
        headerName: '현금차액',
        minWidth: 90,
        maxWidth: 90,
        suppressHeaderMenuButton: true,
        cellRenderer: CompareValueRenderer,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'endSettlement',
        headerName: '돈빼기',
        minWidth: 90,
        maxWidth: 90,
        suppressHeaderMenuButton: true,
        cellRenderer: CompareValueRenderer,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'futureTense',
        headerName: '차기시재',
        minWidth: 90,
        maxWidth: 90,
        suppressHeaderMenuButton: true,
        cellRenderer: CompareValueRenderer,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
    ],
    [],
  );

  const getDataPath = useCallback((data: PastLogResponseUpcLogResponse) => {
    return data.path || [];
  }, []);

  const autoGroupColumnDef = useMemo<ColDef<PastLogResponseSettlementHistoryResponse>>(() => {
    return {
      // No 컬럼을 트리 컬럼으로
      field: 'no',
      headerName: 'No',
      maxWidth: 60,
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      cellRenderer: 'agGroupCellRenderer',
      cellClassRules: {
        'ag-grid-log-tree-child': (params) => params.data?.level == 1,
      },
      cellRendererParams: {
        suppressCount: true,
        innerRenderer: (params: ICellRendererParams<PastLogResponseSettlementHistoryResponse>) => {
          return params.value;
        },
      },
      suppressHeaderMenuButton: true,
    };
  }, []);

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} filters={filters} reset={onReset} search={onSearch} />
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
          placeholder={'소매처명 입력'}
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
            { value: 'N', label: '기본' },
            { value: 'P', label: '이력' },
          ]}
        />
      </Search>
      <Table>
        <TableHeader count={settlementHistList.length} search={onSearch} />
        <TunedGrid
          ref={gridRef}
          headerHeight={35}
          onGridReady={onGridReady}
          treeData={true}
          loading={isSettlementHistLoading}
          groupDefaultExpanded={0}
          rowData={settlementHistList}
          getDataPath={getDataPath}
          autoGroupColumnDef={autoGroupColumnDef}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          suppressRowClickSelection={false}
          className={'nothingDefault'}
        />
      </Table>
    </div>
  );
};

export default SettlementHistory;
