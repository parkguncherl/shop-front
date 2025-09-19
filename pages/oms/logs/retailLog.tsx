/**
 * @file pages/oms/pastHistory/retailLog.tsx
 * @description OMS > 변경로그 > 소매처 변경로그 메인 컴포넌트
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
import { ColDef, ICellRendererParams, RowClassParams, RowGroupOpenedEvent } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { CompareValueRenderer } from './components/CompareValueRenderer';
import { ChangeDetail, ModalData } from './components/ChangeDetail';
import { Utils } from '../../../libs/utils';
import TunedGrid from '../../../components/grid/TunedGrid';
import { PastLogResponseRetailLogResponse } from '../../../generated';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

/**
 * 소매처 변경 필드의 한글 매핑 정의
 * 백엔드에서 받은 영문 필드명을 프론트엔드에서 표시할 한글명으로 매핑
 */
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

const RetailLog = () => {
  // 세션 정보 및 기본 설정
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  /**
   * 날짜 초기값 설정
   * 기본적으로 1개월 전부터 현재까지의 데이터를 조회
   */
  const startDt = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  // 전역 상태 관리
  const [menuNm] = useCommonStore((s) => [s.menuNm]);

  // 트리 데이터 상태 관리
  //const [expandedRows, setExpandedRows] = useState<Set<any>>(new Set());

  // 트리 데이터 가시성 관리 Hook 사용
  /*const { initializeRowHeight } = useTreeDataVisibility({
    gridRef,
    expandedRows,
    setExpandedRows,
  });*/

  // 모달 상태 관리
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [retailLogList, setRetailLogList] = useState<PastLogResponseRetailLogResponse[]>([]);

  /**
   * 필터 상태 관리
   * 검색 조건들의 상태를 관리하고 초기값 설정
   */
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: startDt,
    endDate: today,
    prodNm: '',
    sellerNm: '',
    userNm: '',
    status: '',
  });

  /**
   * AG-Grid 컬럼 정의
   * 그리드에 표시될 컬럼들의 설정을 정의
   */
  const [columnDefs] = useState<ColDef<PastLogResponseRetailLogResponse>[]>([
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
      minWidth: 130,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'busiTypeNm',
      headerName: '업체유형',
      minWidth: 130,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'gubun2',
      headerName: '구분2',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'compNo',
      headerName: '사업자번호',
      minWidth: 80,
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
      field: 'saibNm',
      headerName: '사입자',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'saibTelNo',
      headerName: '사입연락처',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
      valueFormatter: ({ value }) => Utils.getPhoneNumFormat(value),
    },
    {
      field: 'sleepYn',
      headerName: '휴면',
      minWidth: 30,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: 'agCheckboxCellRenderer',
      valueGetter: (params) => {
        return params.data?.sleepYn === 'Y';
      },
      editable: false,
    },
    {
      field: 'compPrnCd',
      headerName: '혼용률인쇄',
      minWidth: 30,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: 'agCheckboxCellRenderer',
      valueGetter: (params) => {
        return params.data?.sleepYn === 'Y';
      },
      editable: false,
    },
    {
      field: 'remainYn',
      headerName: '잔액인쇄',
      minWidth: 30,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: 'agCheckboxCellRenderer',
      valueGetter: (params) => {
        return params.data?.sleepYn === 'Y';
      },
      editable: false,
    },
    {
      field: 'vatYn',
      headerName: '부가세',
      minWidth: 30,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: 'agCheckboxCellRenderer',
      valueGetter: (params) => {
        return params.data?.sleepYn === 'Y';
      },
      editable: false,
    },
  ]);

  /**
   * 데이터 조회 API 호출
   * React Query를 사용하여 변경로그 데이터를 서버로부터 조회
   */
  const {
    data: loadData,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery(['/past/retailLog', filters.status, filters.startDate, filters.endDate], () =>
    authApi.get('/past/retailLog', {
      params: {
        ...filters,
      },
    }),
  );

  // 페이징 정보 업데이트
  useEffect(() => {
    if (isSuccess) {
      const { resultCode, body, resultMessage } = loadData.data;
      if (resultCode === 200) {
        setRetailLogList(body || []);
      } else {
        toastError('조회 도중 에러가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [loadData, isSuccess]);

  /**
   * 검색 버튼 클릭 핸들러
   * 현재 페이지를 1페이지로 초기화하고 데이터를 재조회
   */
  const onSearch = async () => {
    await refetch();
  };

  /**
   * 초기화 버튼 클릭 핸들러
   * 필터 값들을 초기화하고 데이터를 재조회
   */
  const onReset = async () => {
    onFiltersReset();
    onChangeFilters('startDate', startDt);
    onChangeFilters('endDate', today);
    /*onChangeFilters('prodNm', '');
    onChangeFilters('sellerNm', '');
    onChangeFilters('userNm', '');
    onChangeFilters('status', '');*/

    await new Promise((resolve) => setTimeout(resolve, 0));
    await onSearch();
  };

  /**
   * 행 스타일링을 위한 클래스 설정
   * 그룹 행의 자식 행에 대해 배경색 변경을 위한 클래스 추가
   * 상태 '생성' 일 시 별도의 배경색 적용
   */
  const getRowClass = useCallback((params: RowClassParams) => {
    // todo 그룹 행의 부모 행이 자식 행을 펼치는 시점에서의 스타일 적용이 곤란해 보임, 추후 상의하기
    if (params?.data) {
      /*if (params.data.historyStatus) {
        if (params.data.historyStatus == '생성') {
          return 'ag-grid-log-created';
        }
      }*/
      if (params.node.allChildrenCount && params.node.allChildrenCount > 0) {
        //console.log(params.node.expanded);
        //params.node.setExpanded(true);
      }
      if (params.data.path.length > 1) {
        //console.log(params.data.no);
        // tree data 형식으로 부모 이하 자식 행들에서 출력되는 행들에 적용되는 스타일
        return 'ag-grid-log-tree';
      }
    }
    return '';
  }, []);

  const getDataPath = useCallback((data: PastLogResponseRetailLogResponse) => {
    return data.path || [];
  }, []);

  const autoGroupColumnDef = useMemo<ColDef<PastLogResponseRetailLogResponse>>(() => {
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
        innerRenderer: (params: ICellRendererParams<PastLogResponseRetailLogResponse>) => {
          return params.value;
        },
      },
      suppressHeaderMenuButton: true,
    };
  }, []);

  const onRowGroupOpened = useCallback((params: RowGroupOpenedEvent) => {
    //console.log(`그룹이 ${params.node.expanded ? '펼쳐짐' : '접힘'}`);
    //console.log(params.node.expanded);
    //params.api.refreshCells({ force: true });
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
          title={'소매처'}
          name={'sellerNm'}
          placeholder={'소매처명 입력'}
          value={filters.sellerNm}
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
            { value: 'DEL', label: '삭제' },
            { value: 'MOD', label: '수정' },
          ]}
        />
      </Search>

      <Table>
        <TableHeader count={retailLogList.length} search={onSearch} isPaging={false} />
        <TunedGrid
          ref={gridRef}
          rowData={retailLogList}
          loading={isLoading}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          suppressRowClickSelection={true}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          getRowClass={getRowClass}
          className={'nothingDefault'}
          treeData={true}
          autoGroupColumnDef={autoGroupColumnDef}
          onRowGroupOpened={onRowGroupOpened}
          getDataPath={getDataPath}
          groupDefaultExpanded={0}
        />
      </Table>
      {modalOpen && modalData && <ChangeDetail open={modalOpen} onClose={() => setModalOpen(false)} data={modalData} fieldMappings={changeFieldMappings} />}
    </div>
  );
};

export default RetailLog;
