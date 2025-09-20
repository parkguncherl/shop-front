/**
 * @No.2
 * @file pages/oms/data/prodSalesTrend.tsx
 * @description  OMS > 데이터 > 실매출 상품추이
 * @status 기초생성
 * @copyright 2024
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { Search, Table, TableHeader, Title, toastError } from '../../../components';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { ColDef } from 'ag-grid-community';
import TunedGrid from '../../../components/grid/TunedGrid';
import { ProdSalesRankResponseTimeSerise } from '../../../generated';

const ProdSalesTrend = () => {
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);
  const [menuNm] = useCommonStore((s) => [s.menuNm]);
  // 필터 상태 관리
  const [filters, onChangeFilters] = useFilters({
    searchType: 'W',
    skuOrProd: 'S',
    sellerId: undefined,
  });

  // AG-Grid 컬럼 정의
  const columnDefs = useMemo<ColDef<ProdSalesRankResponseTimeSerise>[]>(
    () => [
      {
        field: 'no',
        headerName: 'No',
        maxWidth: 40,
        minWidth: 40,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuNm',
        headerName: '상품명',
        minWidth: 150,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'seasonNm',
        headerName: '계절',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'gubunCntn',
        headerName: '구분',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: `timeSerise0`,
        headerName: '당기',
        width: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'timeSerise1',
        headerName: `${filters.searchType}-1`,
        width: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'timeSerise2',
        headerName: `${filters.searchType}-2`,
        width: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'timeSerise3',
        headerName: `${filters.searchType}-3`,
        width: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'timeSerise4',
        headerName: `${filters.searchType}-4`,
        width: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'timeSerise5',
        headerName: `${filters.searchType}-5`,
        width: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'timeSerise6',
        headerName: `${filters.searchType}-6`,
        width: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'timeSerise7',
        headerName: `${filters.searchType}-7`,
        width: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'timeSerise8',
        headerName: `${filters.searchType}-8`,
        width: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'timeSerise9',
        headerName: `${filters.searchType}-9`,
        width: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'timeSerise10',
        headerName: `${filters.searchType}-10`,
        width: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'timeSerise11',
        headerName: `${filters.searchType}-11`,
        width: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
    ],
    [filters.searchType],
  );
  // 데이터 조회 API 호출
  const {
    data: loadData,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery(['/prodSalesRank/det/TimeSerise'], (): any =>
    authApi.get('/prodSalesRank/det/TimeSerise', {
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
    onChangeFilters('skuOrProd', 'S');
    onChangeFilters('searchType', 'W');
  };

  useEffect(() => {
    refetch();
  }, [filters]);

  /**
   * 배경행 no숫자별 색상 정렬 홀수일때만 ag-grid-changeOrder적용
   */
  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} reset={onReset} search={onSearch} />
      <Search className="type_2">
        <Search.Radio
          title={''}
          name={'searchType'}
          options={[
            { label: '주별', value: 'W' },
            { label: '월별', value: 'M' },
            { label: '년도별', value: 'Y' },
          ]}
          value={filters.searchType}
          onChange={(e, value) => {
            onChangeFilters('searchType', value);
          }}
        />
        <Search.RetailBar
          title={'소매처'}
          name={'retailNm'}
          placeholder={'소매처 검색'}
          allowNewRetail={false}
          onRetailDeleted={() => {
            onChangeFilters('sellerId', 0);
          }}
          onRetailSelected={(retailInfo) => {
            /** 본 영역에서만 소매처 상태 및 sellerId 필터 값이 변경됨 */
            if (retailInfo?.id) {
              onChangeFilters('sellerId', retailInfo.id);
            }
          }}
        />
        <Search.Radio
          title={''}
          name={'skuOrProd'}
          options={[
            { label: '상품별', value: 'P' },
            { label: '스큐별', value: 'S' },
          ]}
          value={filters.skuOrProd}
          onChange={(e, value) => {
            onChangeFilters('skuOrProd', value);
          }}
        />
      </Search>
      <Table>
        <TableHeader count={loadData?.data?.body?.length || 0} isPaging={false} search={onSearch} />
        <TunedGrid<ProdSalesRankResponseTimeSerise>
          ref={gridRef}
          rowData={loadData?.data?.body || []}
          loading={isLoading}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          defaultColDef={defaultColDef}
          className={'default'}
        />
      </Table>
    </div>
  );
};

export default ProdSalesTrend;
