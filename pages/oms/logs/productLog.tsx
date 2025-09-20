/**
 * @file pages/oms/pastHistory/productLog.tsx
 * @description OMS > 변경로그 > 상품자료 변경로그 메인 컴포넌트
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
import { PastLogResponseProductLogList, PastLogResponseSaleLogResponse } from '../../../generated';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

// 변경 필드 매핑 정의
export const changeFieldMappings = {
  releaseYmd: '출시일자',
  seasonCd: '계절',
  personNm: '품번',
  compCntn: '혼용율',
  minAsnCnt: 'MOQ',
  prodAttrCd: '제작여부',
  funcCd: '복종1',
  funcDetCd: '복종2',
  skuCntn: '비고',
  extBarCode: '외부바코드',
  designNm: '디자이너명',
  yochug: '요척',
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

  /**
   * 날짜 초기값 설정
   * 기본적으로 1개월 전부터 현재까지의 데이터를 조회
   */
  const startDt = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [menuNm] = useCommonStore((s) => [s.menuNm]);

  const [productLogList, setProductLogList] = useState<PastLogResponseProductLogList[]>([]);

  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: startDt,
    endDate: today,
    skuNm: '',
    userNm: '',
    status: '',
  });

  // AG-Grid 컬럼 정의
  const [columnDefs] = useState<ColDef<PastLogResponseProductLogList>[]>([
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
        return dayjs(value).format('YYYY-MM-DD');
      },
    },
    {
      field: 'updHms',
      headerName: '변경시간',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: ({ value }) => {
        return value.slice(0, 8);
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
      field: 'skuCd',
      headerName: '품번',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuNm',
      headerName: '상품',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'skuColor',
      headerName: '칼라',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'skuSize',
      headerName: '사이즈',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'compCntn',
      headerName: '혼용율',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'designNm',
      headerName: '디자이너',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'seasonCd',
      headerName: '시즌',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'funcCd',
      headerName: '스타일1',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'funcDetCd',
      headerName: '스타일2',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },

    {
      field: 'gubunCntn',
      headerName: '구분',
      minWidth: 80,
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
      editable: false, // 수정 불가
    },
    {
      field: 'orgAmt',
      headerName: '생산원가',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'sellAmt',
      headerName: '도매가',
      minWidth: 80,
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
  } = useQuery(['/past/productLog', filters.status], () =>
    authApi.get('/past/productLog', {
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
        setProductLogList(body || []);
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
   * 행 스타일링을 위한 클래스 설정
   * 홀수 번호의 행에 대해 배경색 변경을 위한 클래스 추가
   * 상태 '생성' 일 시 별도의 배경색 적용
   */
  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params?.data) {
      if (params.data.historyStatus) {
        if (params.data.historyStatus == '생성') {
          rtnValue += 'ag-grid-log-created';
        }
      }
      if (params.data.no) {
        const rowNumber = parseInt(params.data.no);
        if (!isNaN(rowNumber) && rowNumber % 2 === 1) {
          rtnValue += ' ag-grid-log';
        }
      }
    }
    return rtnValue;
  }, []);

  const getDataPath = useCallback((data: PastLogResponseProductLogList) => {
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
        <TableHeader count={productLogList.length} search={onSearch} />
        <TunedGrid
          ref={gridRef}
          rowData={productLogList}
          loading={isLoading}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          suppressRowClickSelection={true}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          onRowClicked={(e) => console.log(e.data)}
          getRowClass={getRowClass}
          treeData={true}
          autoGroupColumnDef={autoGroupColumnDef}
          getDataPath={getDataPath}
          groupDefaultExpanded={0}
          className={'nothingDefault'}
        />
      </Table>
    </div>
  );
};

export default ProductLog;
