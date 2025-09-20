/**
 * @file pages/oms/pastHistory/upcLog.tsx
 * @description OMS > 변경로그 > 상품생산단가 변경로그 메인 컴포넌트 (UnitProductionCostLog)
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
import { CellClickedEvent, ColDef, ICellRendererParams, RowClassParams, RowGroupOpenedEvent } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { Utils } from '../../../libs/utils';
import TunedGrid from '../../../components/grid/TunedGrid';
import UpcLogDetail from './components/upcLogDetail';
import { PastLogResponseUpcLogResponse } from '../../../generated';
import CompareValueRenderer from './components/CompareValueRenderer';
import CompareIsSame from './components/CompareIsSame';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

const UpcLog = () => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  // 날짜 초기값 설정 (1개월)
  const startDt = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [menuNm] = useCommonStore((s) => [s.menuNm]);

  // 모달 상태관리
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [upcLogList, setUpcLogList] = useState<PastLogResponseUpcLogResponse[]>([]);

  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: startDt,
    endDate: today,
    prodNm: '',
    userNm: '',
    status: '',
    skuNm: '',
  });

  // AG-Grid 컬럼 정의
  const [columnDefs] = useState<ColDef<PastLogResponseUpcLogResponse>[]>([
    {
      headerName: '로그',
      minWidth: 100,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        const childCount = params.node?.allChildrenCount ? params.node.allChildrenCount : null;
        return childCount ? params.data?.historyStatus + ' ( ' + childCount + ' ) ' : params.data?.historyStatus || '';
      },
    },
    {
      field: 'updYmd',
      headerName: '변경일자',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: ({ value }) => {
        return value.substring(0, 10);
      },
    },
    {
      field: 'updHms',
      headerName: '변경시간',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: ({ value }) => {
        return value.substring(0, 8);
      },
    },
    {
      field: 'updNm',
      headerName: '사용자',
      minWidth: 80,
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuCd',
      headerName: '품번',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareIsSame,
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      minWidth: 130,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareIsSame,
    },
    {
      field: 'designNm',
      headerName: '디자이너',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareIsSame,
    },
    {
      field: 'orgAmt',
      headerName: '생산원가',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareIsSame,
      valueFormatter: (params) => {
        if (params.value) {
          return Utils.setComma(params.value);
        } else {
          return null;
        }
      },
    },
    {
      field: 'sellAmt',
      headerName: '도매가',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareIsSame,
      valueFormatter: (params) => {
        if (params.value) {
          return Utils.setComma(params.value);
        } else {
          return null;
        }
      },
    },
    {
      field: 'mainYn',
      headerName: '구분',
      minWidth: 60,
      maxWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (params) => {
        if (params.data) {
          return params.data.mainYn === 'Y' ? '메인' : '부속'; // 'Y'일 때 체크, 'N'일 때 체크 해제
        } else {
          return '';
        }
      },
      editable: false, // 수정 불가
    },
    {
      field: 'compNm',
      headerName: '생산처',
      minWidth: 130,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'factoryCdNm',
      headerName: '생산유형',
      minWidth: 60,
      maxWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'gagongAmt',
      headerName: '공임비',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
      valueFormatter: ({ value }) => Utils.setComma(value),
    },
  ]);

  // 데이터 조회 API 호출
  const {
    data: loadData,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery(['/past/upcLog', filters.status, filters.startDate, filters.endDate], (): any =>
    authApi.get('/past/upcLog', {
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
        setUpcLogList(body || []);
      } else {
        toastError('조회 도중 에러가 발생하였습니다.');
        console.error(resultMessage);
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

  // selectedRow 상태
  const [selectedRow, setSelectedRow] = useState<{
    id: number;
    skuNm2: string;
  } | null>(null);

  /**
   * 그리드 row 클릭 이벤트 핸들러
   */
  const onCellClicked = useCallback((event: CellClickedEvent<PastLogResponseUpcLogResponse, any>) => {
    if (event.data) {
      if (event.column.getColId() != 'ag-Grid-AutoColumn') {
        // no 컬럼 이외의 영역 클릭할 시 동작
        if (event.data.skuFactoryId) {
          setSelectedId(event.data.skuFactoryId);
          if (event.data.skuNm) {
            setSelectedRow({
              id: event.data.skuFactoryId,
              skuNm2: event.data.skuNm,
            }); // 클릭한 row 데이터 저장
            setModalOpen(true);
          } else {
            console.error('skuNm 을 찾을 수 없음');
          }
        } else {
          console.error('skuFactoryId 를 찾을 수 없음');
        }
      }
    }
  }, []);

  const getDataPath = useCallback((data: PastLogResponseUpcLogResponse) => {
    return data.path || [];
  }, []);

  const autoGroupColumnDef = useMemo<ColDef<PastLogResponseUpcLogResponse>>(() => {
    return {
      // No 컬럼을 트리 컬럼으로
      field: 'no',
      headerName: 'No.',
      maxWidth: 60,
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      cellClassRules: {
        'ag-grid-log-tree-child': (params) => params.data?.level == 1,
      },
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        suppressCount: true,
        innerRenderer: (params: ICellRendererParams<PastLogResponseUpcLogResponse>) => {
          return params.value;
        },
      },
      suppressHeaderMenuButton: true,
    };
  }, []);

  const onRowGroupOpened = useCallback((params: RowGroupOpenedEvent) => {
    console.log(`그룹이 ${params.node.expanded ? '펼쳐짐' : '접힘'}`);
    gridRef.current?.api.refreshCells({ force: true });
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
          title={'상품명'}
          name={'skuNm'}
          placeholder={'상품명 입력'}
          value={filters.skuNm}
          onEnter={onSearch}
          onChange={onChangeFilters}
          filters={filters}
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
            { value: 'N', label: '활성' },
            { value: 'Y', label: '휴면' },
          ]}
        />
      </Search>

      <Table>
        <TableHeader count={upcLogList.length} search={onSearch} />
        <TunedGrid
          ref={gridRef}
          rowData={upcLogList}
          loading={isLoading}
          treeData={true}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          groupDefaultExpanded={0}
          onCellClicked={onCellClicked}
          suppressRowClickSelection={true}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          getRowClass={getRowClass}
          getDataPath={getDataPath}
          autoGroupColumnDef={autoGroupColumnDef}
          onRowGroupOpened={onRowGroupOpened}
          className={'nothingDefault'}
        />
      </Table>
      {modalOpen && selectedId && selectedRow && (
        <UpcLogDetail
          id={selectedId}
          skuNm2={selectedRow.skuNm2} // sku명 전달
          onClose={() => {
            setModalOpen(false);
            setSelectedId(null);
            setSelectedRow(null); // row 데이터도 초기화
          }}
        />
      )}
    </div>
  );
};

export default UpcLog;
