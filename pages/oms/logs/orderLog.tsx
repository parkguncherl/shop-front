/**
 * @file pages/oms/pastHistory/orderLog.tsx
 * @description  OMS > 변경로그 > 판매거래 변경로그
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
import { ColDef, ICellRendererParams, RowClassParams, RowClickedEvent } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { CompareValueRenderer } from './components/CompareValueRenderer';
import TunedGrid from '../../../components/grid/TunedGrid';
import { PastLogResponseSaleLogResponse } from '../../../generated';
import PreviewPop from '../../../components/popup/log/orderLog/PreviewPop';
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

const OrderLog = () => {
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

  // 모달 상태 관리
  const [isPreviewModalOpened, setIsPreviewModalOpened] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState<PastLogResponseSaleLogResponse | undefined>(undefined);

  // 전표보기 버튼 활성화 여부
  const [isChitViewed, setIsChitViewed] = useState<boolean>(false);

  const [saleLogList, setSaleLogList] = useState<PastLogResponseSaleLogResponse[]>([]);

  /**
   * 필터 상태 관리
   * 검색 조건들의 상태를 관리하고 초기값 설정
   */
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDateOfChangePeriod: startDt,
    endDateOfChangePeriod: today,
    startDateOfWorkYmd: startDt,
    endDateOfWorkYmd: today,
    sellerNm: '',
    filtering: '',
  });

  /**
   * AG-Grid 컬럼 정의
   * 그리드에 표시될 컬럼들의 설정을 정의
   */
  const [columnDefs] = useState<ColDef<PastLogResponseSaleLogResponse>[]>([
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
      headerName: '영업일자',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (params) => {
        if (params.data) {
          const workYmd: string | undefined = params.data.workYmd;
          const diffYmd: string | undefined = params.data.diffYmd;

          // 영업일자와 변경건을 합쳐서 반환
          return `${workYmd} ${diffYmd ? '(★)' : ''}`;
        }
        return '';
      },
    },
    {
      field: 'sellerNm',
      headerName: '소매처',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'chitNo',
      headerName: '전표',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'sellCnt',
      headerName: '판매량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'returnCnt',
      headerName: '반품량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'todayAmt',
      headerName: '당일합계',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'payAmount',
      headerName: '판매금액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'returnAmount',
      headerName: '반품금액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'discountAmount',
      headerName: '단가DC',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'discountAmount',
      headerName: '할인금액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'previousBalance',
      headerName: '부가세',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'previousBalance',
      headerName: '물류비',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'previousBalance',
      headerName: '전잔액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'cashDeposit',
      headerName: '현금입금',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'accountDeposit',
      headerName: '통장입금',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'payByCredit',
      headerName: '잔액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'etcCntn',
      headerName: '비고',
      minWidth: 140,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
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
  } = useQuery(
    ['/past/saleLog', filters.filtering, filters.startDateOfChangePeriod, filters.endDateOfChangePeriod, filters.startDateOfWorkYmd, filters.endDateOfWorkYmd],
    () =>
      authApi.get('/past/saleLog', {
        params: {
          ...filters,
        },
      }),
  );

  useEffect(() => {
    if (isSuccess) {
      const { resultCode, body, resultMessage } = loadData.data;
      if (resultCode === 200) {
        setSaleLogList(body || []);
      } else {
        toastError('조회 도중 에러가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [loadData, isSuccess]);

  // 행 클릭 이벤트 핸들러
  const handleRowClick = (event: RowClickedEvent<PastLogResponseSaleLogResponse, any>) => {
    console.log(event.data);
    if (isChitViewed) {
      // 전표보기 버튼이 클릭된 경우
      if (
        (event.node.allChildrenCount && event.node.allChildrenCount > 0) ||
        (event.data?.path && event.data.path.length > 1 && event.data.historyStatus != '생성')
      ) {
        // 자식 행을 가진 부모 행 혹은 자식 행이면서 로그 상태가 '생성' 이 아닌 것
        setSelectedRowData(event.data);
        setIsPreviewModalOpened(true);
      }
    }
  };

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
    onChangeFilters('startDateOfChangePeriod', startDt);
    onChangeFilters('endDateOfChangePeriod', today);
    onChangeFilters('startDateOfWorkYmd', startDt);
    onChangeFilters('endDateOfWorkYmd', today);

    await new Promise((resolve) => setTimeout(resolve, 0));
    await onSearch();
  };

  /**
   * 행 스타일링을 위한 클래스 설정
   * 홀수 번호의 행에 대해 배경색 변경을 위한 클래스 추가
   */
  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params?.data?.no) {
      const rowNumber = parseInt(params.data.no);
      if (!isNaN(rowNumber) && rowNumber % 2 === 1) {
        rtnValue += ' ag-grid-changeOrder';
      }
    }
    return rtnValue;
  }, []);

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
          title={'거래'}
          type={'range'}
          defaultType={'type'}
          startName={'startDateOfWorkYmd'}
          endName={'endDateOfWorkYmd'}
          onChange={onChangeFilters}
          onEnter={onSearch}
          value={[filters.startDateOfWorkYmd, filters.endDateOfWorkYmd]}
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
        <Search.DropDown
          title={'필터링'}
          name={'filtering'}
          value={filters.filtering}
          onChange={onChangeFilters}
          defaultOptions={[
            { value: '1', label: '과거변경만' },
            { value: '2', label: '매출감소만' },
            { value: '3', label: '주문취소만' },
            { value: '4', label: '입금변경만' },
          ]}
        />
      </Search>
      <Table>
        <TableHeader count={saleLogList.length} search={onSearch}>
          <button className={`btn ${isChitViewed ? 'on' : ''}`} title="전표보기" onClick={() => setIsChitViewed((prevState) => !prevState)}>
            전표보기
          </button>
        </TableHeader>
        <TunedGrid
          ref={gridRef}
          rowData={saleLogList}
          loading={isLoading}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          getRowClass={getRowClass}
          suppressRowClickSelection={false}
          onRowClicked={handleRowClick}
          treeData={true}
          autoGroupColumnDef={autoGroupColumnDef}
          getDataPath={getDataPath}
          groupDefaultExpanded={0}
          className={'noBtn noCheck'}
        />
      </Table>
      {isPreviewModalOpened && (
        <PreviewPop
          open={isPreviewModalOpened}
          selectedRowData={selectedRowData}
          onClose={() => {
            setIsPreviewModalOpened(false);
            setSelectedRowData(undefined);
          }}
          rowData={saleLogList}
        />
      )}
    </div>
  );
};

export default OrderLog;
