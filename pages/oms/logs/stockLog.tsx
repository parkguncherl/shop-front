/**
 OMS > 과거이력 > 재고 변경 페이지
 /oms/pastHistory/stockLog
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
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { usePastHistoryStore } from '../../../stores/usePastHistoryStore';
import { CompareValueRenderer } from './components/CompareValueRenderer';
import { ChangeDetail } from './components/ChangeDetail';
import { getNoRowSpan } from './components/RowSpanParams';
import { Utils } from '../../../libs/utils';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

// 변경 필드 매핑 정의
export const changeFieldMappings = {
  sellerFaxNo: '팩스번호',
  sellerAddr: '주소',
  sellerAddrEtc: '주소기타',
  personNm: '담당자',
  personTelNo: '담당자연락처',
  compNm: '사업자명',
  compNo: '사업자번호',
  etcScrCntn: '비고(화면)',
  etcChitCntn: '비고(전표)',
  etcAccCntn: '계좌(전표)',
  compEmail: '이메일',
  compPrnCd: '혼용률인쇄YN',
  remainYn: '잔액인쇄YN',
  etcCntn: '기타',
} as const;

// 모달 데이터 타입 정의
export interface ModalData {
  changedFields: string[];
  currentData: any;
  prevData: any;
}

/**
 * 소매처 변경로그 컴포넌트
 * @component
 * @returns {JSX.Element} 렌더링된 컴포넌트
 */
const RetailLog = () => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  // 날짜 초기값 설정 (3개월)
  const startDt = dayjs().subtract(3, 'month').startOf('month').format('YYYY-MM-DD');
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [menuNm] = useCommonStore((s) => [s.menuNm]);
  const { misongPaging: paging, setMisongPaging: setPaging } = usePastHistoryStore();

  // 모달 상태 관리
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: startDt,
    endDate: today,
    prodNm: '',
    sellerNm: '',
    partnerId: session.data?.user.partnerId,
    updUser: '',
    status: '',
  });

  // AG-Grid 컬럼 정의
  const [columnDefs] = useState<ColDef[]>([
    {
      field: 'no',
      headerName: 'No',
      maxWidth: 50,
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      rowSpan: getNoRowSpan,
      valueGetter: (params) => (params.data.displayValue !== '' ? params.data.no : ''),
      cellClassRules: {
        'merged-cell': 'value !== undefined',
      },
    },
    {
      field: 'status',
      headerName: '상태',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'updTm',
      headerName: '변경일자',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'updUser',
      headerName: '작업자',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'sellerNm',
      headerName: '업체명',
      minWidth: 140,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'sleepYn',
      headerName: '휴면',
      minWidth: 30,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: 'agCheckboxCellRenderer',
      valueGetter: (params) => {
        return params.data.sleepYn === 'Y'; // 'Y'일 때 체크, 'N'일 때 체크 해제
      },
      editable: false, // 수정 불가
    },
    {
      field: 'gubun1',
      headerName: '구분1',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'gubun2',
      headerName: '구분2',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'ceoNm',
      headerName: '대표자',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'ceoTelNo',
      headerName: '대표연락처',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
      valueFormatter: ({ value }) => Utils.getPhoneNumFormat(value),
    },
    {
      field: '',
      headerName: '기타',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: (props: ICellRendererParams) => {
        const rowIndex = props.node.rowIndex;
        if (rowIndex === null) return '-';

        const nextRow = rowIndex > 0 ? props.api.getDisplayedRowAtIndex(rowIndex - 1) : null;

        // Object.entries를 사용하여 매핑된 필드들을 체크
        const changedFields = Object.entries(changeFieldMappings)
          .filter(([field]) => nextRow?.data && props.data.tempId === nextRow.data.tempId && props.data[field] !== nextRow.data[field])
          .map(([field]) => field);

        const changeCount = changedFields.length;

        const handleClick = () => {
          if (changeCount > 0) {
            setModalData({
              changedFields,
              currentData: props.data,
              prevData: nextRow?.data,
            });
            setModalOpen(true);
          }
        };

        return (
          <div
            onClick={handleClick}
            style={{
              cursor: changeCount > 0 ? 'pointer' : 'default',
              color: changeCount > 0 ? 'blue' : 'inherit',
              fontWeight: changeCount > 0 ? 'bold' : 'normal',
            }}
          >
            {changeCount > 0 ? `${changeCount}건` : '-'}
          </div>
        );
      },
    },
  ]);
  // 데이터 조회 API 호출
  const {
    data: loadData,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery([paging.curPage], () =>
    authApi.get('/past/retaillog/paging', {
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
          title={'판매처'}
          name={'sellerNm'}
          placeholder={'판매처명 입력'}
          value={filters.sellerNm}
          onEnter={onSearch}
          onChange={onChangeFilters}
          filters={filters}
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
      </Search>

      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={onSearch} />
        <div className={'ag-theme-alpine'}>
          <AgGridReact
            ref={gridRef}
            rowData={loadData?.data?.body?.rows || []}
            loading={isLoading}
            columnDefs={columnDefs}
            onGridReady={onGridReady}
            gridOptions={{
              rowHeight: 28,
              headerHeight: 35,
              suppressRowTransform: true,
            }}
            rowSelection={'multiple'}
            suppressRowClickSelection={true}
            paginationPageSize={paging.pageRowCount}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            className={'nothingDefault'}
          />
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>

      {modalOpen && modalData && <ChangeDetail open={modalOpen} onClose={() => setModalOpen(false)} data={modalData} fieldMappings={changeFieldMappings} />}
    </div>
  );
};

export default RetailLog;
