/**
 * @file pages/oms/pastHistory/factoryLog
 * @description OMS > 변경로그 > 생산처 변경로그 메인 컴포넌트
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
import { Utils } from '../../../libs/utils';
import TunedGrid from '../../../components/grid/TunedGrid';
import { PastLogResponseFactoryLogResponse } from '../../../generated';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

// 변경 필드 매핑 정의
export const changeFieldMappings = {
  compTelNo: '회사연락처',
  compAddr: '주소',
  personNm: '담당자',
  personTelNo: '담당자연락처',
  compNo: '사업자번호',
  detailInfo: '상세정보',
  etcScrCntn: '비고(화면)',
  etcChitCntn: '비고(전표)',
  etcAccCntn: '계좌(전표)',
  compEmail: '이메일',
  compPrnCd: '혼용률인쇄YN',
  remainYn: '잔액인쇄YN',
  etcCntn: '기타',
} as const;

/**
 * 생산처 변경로그 컴포넌트
 * @component
 * @returns {JSX.Element} 렌더링된 컴포넌트
 */
const FactorylLog = () => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  // 날짜 초기값 설정 (1개월)
  const startDt = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [menuNm] = useCommonStore((s) => [s.menuNm]);

  const [factoryLogList, setFactoryLogList] = useState<PastLogResponseFactoryLogResponse[]>([]);

  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: startDt,
    endDate: today,
    prodNm: '',
    compNm: '',
    userNm: '',
    status: '',
  });

  // AG-Grid 컬럼 정의
  const [columnDefs] = useState<ColDef<PastLogResponseFactoryLogResponse>[]>([
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
      field: 'compNm',
      headerName: '생산처',
      minWidth: 130,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
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
      field: 'factoryTypeNm',
      headerName: '공장유형',
      minWidth: 80,
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
      field: 'personNm',
      headerName: '담당자',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'personTelNo',
      headerName: '당당자연락처',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
      valueFormatter: ({ value }) => Utils.getPhoneNumFormat(value),
    },
    {
      field: 'compTelNo',
      headerName: '회사연락처',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
      valueFormatter: ({ value }) => Utils.getPhoneNumFormat(value),
    },
    {
      field: 'compAddr',
      headerName: '회사주소',
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
      field: 'detailInfo',
      headerName: '상세정보',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'etcScrCntn',
      headerName: '출력비고',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'etcChitCntn',
      headerName: '전표비고',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'compEmail',
      headerName: '회사이메일',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'remPrnYn',
      headerName: '잔액인쇄',
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
  } = useQuery(['/past/factoryLog', filters.status, filters.startDate, filters.endDate], (): any =>
    authApi.get('/past/factoryLog', {
      params: {
        ...filters,
      },
    }),
  );

  useEffect(() => {
    if (isSuccess) {
      const { resultCode, body, resultMessage } = loadData.data;
      if (resultCode === 200) {
        setFactoryLogList(body || []);
      } else {
        toastError('조회 도중 에러가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [isSuccess, loadData]);

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

  const onRowGroupOpened = useCallback((params: RowGroupOpenedEvent<PastLogResponseFactoryLogResponse>) => {
    //console.log(`그룹이 ${params.node.expanded ? '펼쳐짐' : '접힘'}`);
    params.api.refreshCells({ force: true });
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
          title={'생산처'}
          name={'compNm'}
          placeholder={'생산처명 입력'}
          value={filters.compNm}
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
        <TableHeader count={factoryLogList.length} search={onSearch} />
        <TunedGrid
          ref={gridRef}
          rowData={factoryLogList}
          loading={isLoading}
          treeData={true}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          suppressRowClickSelection={true}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          onRowClicked={(e) => console.log(e.data)}
          getRowClass={getRowClass}
          groupDefaultExpanded={0}
          uppressMaintainIndex={true}
          getDataPath={getDataPath}
          autoGroupColumnDef={autoGroupColumnDef}
          onRowGroupOpened={onRowGroupOpened}
          className={'nothingDefault'}
        />
      </Table>
    </div>
  );
};

export default FactorylLog;
