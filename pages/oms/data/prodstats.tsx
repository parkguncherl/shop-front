/**
 * @No.12
 * @file pages/oms/data/Prodstats.tsx
 * @description  OMS > 데이터 > 생산 통계
 * @status 기초생성
 * @copyright 2024
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { Pagination, Search, Table, TableHeader, Title, toastError } from '../../../components';
import { GridSetting } from '../../../libs/ag-grid';
import { ColDef, ICellRendererParams, RowClassParams } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { usePastHistoryStore } from '../../../stores/usePastHistoryStore';
import TunedGrid from '../../../components/grid/TunedGrid';

const ActSalesRetTrend = () => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  // 날짜 초기값 설정 (3개월)
  const startDt = dayjs().subtract(3, 'month').startOf('month').format('YYYY-MM-DD');
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [menuNm] = useCommonStore((s) => [s.menuNm]);
  const { logPaging: paging, setLogPaging: setPaging } = usePastHistoryStore();

  // 모달 상태 관리
  const [modalOpen, setModalOpen] = useState(false);

  // 안전하게 렌더링하는 컴포넌트를 정의
  const SafeHtml: React.FC<{ html: string }> = ({ html }) => <div dangerouslySetInnerHTML={{ __html: html }} />;

  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: startDt,
    endDate: today,
    prodNm: '',
    sellerNm: '',
    partnerId: session.data?.user.partnerId,
    updUser: '',
    status: '',
    diffYmd: '',
  });

  // AG-Grid 컬럼 정의
  const [columnDefs] = useState<ColDef[]>([
    {
      field: 'no',
      headerName: 'No',
      maxWidth: 40,
      minWidth: 40,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      // 같은번호 안나오게 셀렌더
      cellRenderer: (props: ICellRendererParams) => {
        const currentNo = props.value;
        const rowIndex = props.node.rowIndex;
        if (rowIndex === null || rowIndex === 0) return currentNo;

        const prevRow = props.api.getDisplayedRowAtIndex(rowIndex - 1);
        const prevNo = prevRow?.data?.no;
        // 이전 행의 no와 현재 행의 no가 같으면 빈 값 반환
        return currentNo === prevNo ? '' : currentNo;
      },
    },
    {
      field: 'status',
      headerName: '상태',
      minWidth: 40,
      maxWidth: 40,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      headerName: '영업일자',
      minWidth: 140,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (params) => {
        const workYmd = params.data.workYmd;
        const diffYmd = params.data.diffYmd;

        // 영업일자와 변경건을 합쳐서 반환
        return `${workYmd} ${diffYmd ? '(★)' : ''}`;
      },
    },
  ]);
  // 데이터 조회 API 호출
  const {
    data: loadData,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery([paging.curPage], (): any =>
    authApi.get('/past/expenseLog', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      },
    }),
  );

  // API 응답 처리
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
   * 검색 버튼 클릭 핸들러
   */
  const onSearch = async () => {
    setPaging({ curPage: 1 });
    await refetch();
  };

  /**
   * 초기화 버튼 클릭 핸들러
   */
  const onReset = async () => {
    onFiltersReset();
    onChangeFilters('startDate', startDt);
    onChangeFilters('endDate', today);
    onChangeFilters('partnerId', session.data?.user.partnerId as number);
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

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} reset={onReset} search={onSearch} />
      <Search className="type_2 full">
        <Search.TwoDatePicker
          title={'변경일자'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onEnter={onSearch}
          filters={filters}
          onChange={onChangeFilters}
        />
        <Search.Input
          title={'작업자'}
          name={'updUser'}
          placeholder={'변경자명 입력'}
          value={filters.updUser}
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
            { value: '삭제', label: '삭제' },
            { value: '수정', label: '수정' },
          ]}
        />
        <Search.Radio
          title={'전체'}
          name={'diffYmd'}
          options={[
            { label: '영업일변견경', value: '' },
            { label: '', value: 'Y' },
          ]}
          value={filters.diffYmd}
          onChange={(e, value) => {
            setPaging({ ...paging, curPage: 1 });
            onChangeFilters(e, value);
          }}
        />
      </Search>
      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={onSearch} />
        <div className={'ag-theme-alpine'}>
          <TunedGrid
            ref={gridRef}
            rowData={loadData?.data?.body?.rows || []}
            loading={isLoading}
            columnDefs={columnDefs}
            onGridReady={onGridReady}
            suppressRowClickSelection={true}
            paginationPageSize={paging.pageRowCount}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            getRowClass={getRowClass}
          />
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
    </div>
  );
};

export default ActSalesRetTrend;
