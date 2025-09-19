/**
 * @file pages/oms/pastHistory/ipgoLog.tsx
 * @description OMS > 변경로그 > 상품자료 변경로그 메인 컴포넌트
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
import NumberofOthers from './components/NumberofOthers';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { usePastHistoryStore } from '../../../stores/usePastHistoryStore';
import { CompareValueRenderer } from './components/CompareValueRenderer';
import { ChangeDetail, ModalData } from './components/ChangeDetail';
import { Utils } from '../../../libs/utils';
import TunedGrid from '../../../components/grid/TunedGrid';
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

/**
 * 상품 변경로그 컴포넌트
 * @component
 * @returns {JSX.Element} 렌더링된 컴포넌트
 */
const ProductLog = () => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  // 날짜 초기값 설정 (3개월)
  const startDt = dayjs().subtract(3, 'month').startOf('month').format('YYYY-MM-DD');
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [menuNm] = useCommonStore((s) => [s.menuNm]);
  const { logPaging: paging, setLogPaging: setPaging } = usePastHistoryStore();

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
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'updTm',
      headerName: '변경일자',
      minWidth: 140,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: ({ value }) => {
        return Utils.getFormattedDate(value);
      },
    },
    {
      field: 'updUser',
      headerName: '변경자',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'sellerNm',
      headerName: '상품',
      minWidth: 130,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: '',
      headerName: '컬러',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: '',
      headerName: '사이즈',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'sleepYn',
      headerName: '휴면 ',
      minWidth: 40,
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
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: '',
      headerName: '혼용률',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: '',
      headerName: '판가',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: '',
      headerName: '판매원가',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: '',
      headerName: '메인생산처',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: '',
      headerName: 'MOQ',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: '',
      headerName: '디자이너',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: '',
      headerName: '제작여부',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: '',
      headerName: '제작거래처',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: '',
      headerName: '외부바코드',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: '',
      headerName: '복종1',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: '',
      headerName: '복종2',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: '',
      headerName: '비고',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: '',
      headerName: '그외',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: NumberofOthers,
      cellRendererParams: {
        setModalData: setModalData,
        setModalOpen: setModalOpen,
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
    authApi.get('/past/retailLog/paging', {
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
          title={'상품'}
          name={'sellerNm'}
          placeholder={'상품명 입력'}
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
          className={'pagingDefault'}
        />
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>

      {modalOpen && modalData && <ChangeDetail open={modalOpen} onClose={() => setModalOpen(false)} data={modalData} fieldMappings={changeFieldMappings} />}
    </div>
  );
};

export default ProductLog;
