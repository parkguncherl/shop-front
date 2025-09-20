/**
 * @No.1
 * @file pages/oms/data/prodSalesRank.tsx
 * @description  OMS > 데이터 > 상품 실매출순위
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
import { Search, Table, TableHeader, Title, toastError } from '../../../components';
import { GridSetting } from '../../../libs/ag-grid';
import { ColDef, RowClassParams } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs, { OpUnitType } from 'dayjs';
import TunedGrid from '../../../components/grid/TunedGrid';
import CustomNewDatePicker, { DatePickerSelectType } from '../../../components/CustomNewDatePicker';
import {
  ProdSalesRankResponseBasedOnProd,
  ProdSalesRankResponseBasedOnSku,
  ProductResponseResponseBySearch,
  SkuResponseResponseBySearch,
} from '../../../generated';
import { Utils } from '../../../libs/utils';
import { useSkuStore } from '../../../stores/useSkuStore';
import { SearchBarRefInterface } from '../../../components/search/SearchBar';
import { useProductStore } from '../../../stores/useProductStore';
import ProdSalesRankDetPop from '../../../components/popup/data/ProdSalesRankDetPop';

const ProdSalesRank = () => {
  const { onGridReady } = useAgGridApi();

  const gridRef = useRef<AgGridReact>(null);
  const searchBarRef = useRef<SearchBarRefInterface>(null);

  // 날짜 초기값 설정 (기본 1주(금주 시작, 말일까지))
  const startDateConfigurer = useCallback((opUnitType: OpUnitType, prev?: boolean) => {
    // prev == true 일 시 각각 한 주 혹은 한 달 이전 값을 반환
    if (opUnitType == 'week') {
      return prev ? dayjs().startOf('week').add(1, 'day').subtract(1, 'week').format('YYYY-MM-DD') : dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD');
    } else {
      return prev ? dayjs().startOf(opUnitType).subtract(1, 'month').format('YYYY-MM-DD') : dayjs().startOf(opUnitType).format('YYYY-MM-DD');
    }
  }, []);

  const endDateConfigurer = useCallback((opUnitType: OpUnitType, prev?: boolean) => {
    if (opUnitType == 'week') {
      return prev ? dayjs().endOf('week').add(1, 'day').subtract(1, 'week').format('YYYY-MM-DD') : dayjs().endOf('week').add(1, 'day').format('YYYY-MM-DD');
    } else {
      return prev ? dayjs().endOf(opUnitType).subtract(1, 'month').format('YYYY-MM-DD') : dayjs().endOf(opUnitType).format('YYYY-MM-DD');
    }
  }, []);

  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: startDateConfigurer('week'),
    endDate: endDateConfigurer('week'),
    prevStartDate: startDateConfigurer('week', true),
    prevEndDate: endDateConfigurer('week', true),
    period: 'week' as DatePickerSelectType,
    prodId: 0,
    skuId: 0,
    searchType: 'prod' as 'prod' | 'sku',
  });

  const [menuNm] = useCommonStore((s) => [s.menuNm]);
  const [selectSkuListByKeyWord] = useSkuStore((s) => [s.selectSkuListByKeyWord]);
  const [getProductListByKeyWord] = useProductStore((s) => [s.getProductListByKeyWord]);

  const [prodSalesRankList, setProdSalesRankList] = useState<ProdSalesRankResponseBasedOnProd[]>([]);
  const [prevProdSalesRankList, setPrevProdSalesRankList] = useState<ProdSalesRankResponseBasedOnProd[]>([]);

  const [skuSalesRankList, setSkuSalesRankList] = useState<ProdSalesRankResponseBasedOnSku[]>([]);
  const [prevSkuSalesRankList, setPrevSkuSalesRankList] = useState<ProdSalesRankResponseBasedOnSku[]>([]);

  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(undefined);

  const defaultColumnDefFn: (searchType: 'prod' | 'sku') => ColDef<ProdSalesRankResponseBasedOnProd | ProdSalesRankResponseBasedOnSku>[] = useCallback(
    (searchType) => {
      return [
        {
          field: 'rank',
          headerName: '순위',
          maxWidth: 40,
          minWidth: 40,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: searchType == 'prod' ? 'prodNm' : 'skuNm',
          headerName: '품목명',
          minWidth: 100,
          maxWidth: 150,
          cellStyle: GridSetting.CellStyle.LEFT,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'season',
          headerName: '계절',
          minWidth: 50,
          maxWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'gubun1',
          headerName: '구분1',
          minWidth: 50,
          maxWidth: 100,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'realAmt',
          headerName: '실매출액',
          minWidth: 60,
          maxWidth: 100,
          cellStyle: GridSetting.CellStyle.RIGHT,
          suppressHeaderMenuButton: true,
          valueFormatter: (params) => {
            if (params.value) {
              return Utils.setComma(params.value);
            } else {
              return null;
            }
          },
        },
        {
          field: 'realCnt',
          headerName: '실판매량',
          minWidth: 50,
          maxWidth: 80,
          cellStyle: GridSetting.CellStyle.RIGHT,
          suppressHeaderMenuButton: true,
          valueFormatter: (params) => {
            if (params.value) {
              return Utils.setComma(params.value);
            } else {
              return null;
            }
          },
        },
        {
          field: 'sellerCnt',
          headerName: '소매처',
          minWidth: 40,
          maxWidth: 60,
          cellStyle: GridSetting.CellStyle.RIGHT,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'rateBasedOnTotRealAmt',
          headerName: '%',
          minWidth: 40,
          maxWidth: 60,
          cellStyle: GridSetting.CellStyle.RIGHT,
          suppressHeaderMenuButton: true,
        },
      ];
    },
    [],
  );

  // 상품별 실매출 순위 조회 영역
  const {
    data: prodSalesRankData,
    isLoading: isProdSalesRankDataLoading,
    isSuccess: isProdSalesRankDataSuccess,
    refetch: prodSalesRankDataRefetch,
  } = useQuery(['/prodSalesRank/prodSalesRank', filters.startDate, filters.endDate, filters.prodId], (): any =>
    authApi.get('/prodSalesRank/prodSalesRank', {
      params: {
        ...filters,
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
    }),
  );

  // API 응답 처리
  useEffect(() => {
    if (isProdSalesRankDataSuccess) {
      const { resultCode, body, resultMessage } = prodSalesRankData.data;
      if (resultCode == 200) {
        setProdSalesRankList(body || []);
      } else {
        toastError('상품별 실매출 순위 조회 도중 문제가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [prodSalesRankData, isProdSalesRankDataSuccess]);

  // 이전 기간 상품별 실매출 순위 조회 영역
  const {
    data: prevProdSalesRankData,
    isLoading: isPrevProdSalesRankDataLoading,
    isSuccess: isPrevProdSalesRankDataSuccess,
    refetch: prevProdSalesRankDataRefetch,
  } = useQuery(['/prodSalesRank/prodSalesRank', filters.prevStartDate, filters.prevEndDate, filters.prodId], (): any =>
    authApi.get('/prodSalesRank/prodSalesRank', {
      params: {
        ...filters,
        startDate: filters.prevStartDate,
        endDate: filters.prevEndDate,
      },
    }),
  );

  // API 응답 처리
  useEffect(() => {
    if (isPrevProdSalesRankDataSuccess) {
      const { resultCode, body, resultMessage } = prevProdSalesRankData.data;
      if (resultCode == 200) {
        setPrevProdSalesRankList(body || []);
      } else {
        toastError((filters.period == 'week' ? '지난 주' : '이전 달') + ' 상품별 실매출 순위 조회 도중 문제가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [prevProdSalesRankData, isPrevProdSalesRankDataSuccess]);

  // 스큐별 실매출 순위 조회 영역
  const {
    data: skuSalesRankData,
    isLoading: isSkuSalesRankDataLoading,
    isSuccess: isSkuSalesRankDataSuccess,
    refetch: skuSalesRankDataRefetch,
  } = useQuery(['/prodSalesRank/skuSalesRank', filters.startDate, filters.endDate, filters.skuId], (): any =>
    authApi.get('/prodSalesRank/skuSalesRank', {
      params: {
        ...filters,
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
    }),
  );

  // API 응답 처리
  useEffect(() => {
    if (isSkuSalesRankDataSuccess) {
      const { resultCode, body, resultMessage } = skuSalesRankData.data;
      if (resultCode == 200) {
        setSkuSalesRankList(body || []);
      } else {
        toastError('스큐별 실매출 순위 조회 도중 문제가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [skuSalesRankData, isSkuSalesRankDataSuccess]);

  // 이전 기간 스큐별 실매출 순위 조회 영역
  const {
    data: prevSkuSalesRankData,
    isLoading: isPrevSkuSalesRankDataLoading,
    isSuccess: isPrevSkuSalesRankDataSuccess,
    refetch: prevSkuSalesRankDataRefetch,
  } = useQuery(['/prodSalesRank/skuSalesRank', filters.prevStartDate, filters.prevEndDate, filters.skuId], (): any =>
    authApi.get('/prodSalesRank/skuSalesRank', {
      params: {
        ...filters,
        startDate: filters.prevStartDate,
        endDate: filters.prevEndDate,
      },
    }),
  );

  // API 응답 처리
  useEffect(() => {
    if (isPrevSkuSalesRankDataSuccess) {
      const { resultCode, body, resultMessage } = prevSkuSalesRankData.data;
      if (resultCode == 200) {
        setPrevSkuSalesRankList(body || []);
      } else {
        toastError('스큐별 실매출 순위 조회 도중 문제가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [prevSkuSalesRankData, isPrevSkuSalesRankDataSuccess]);

  /**
   * 검색 버튼 클릭 핸들러
   */
  const onSearch = async () => {
    await prodSalesRankDataRefetch();
    await prevProdSalesRankDataRefetch();

    await skuSalesRankDataRefetch();
    await prevSkuSalesRankDataRefetch();
  };

  /**
   * 초기화 버튼 클릭 핸들러
   */
  const onReset = async () => {
    onFiltersReset();
    onChangeFilters('startDate', startDateConfigurer('week')); // 금주 첫날
    onChangeFilters('endDate', endDateConfigurer('week')); // 금주 말일
    onChangeFilters('prevStartDate', startDateConfigurer('week', true)); // 금주 첫날
    onChangeFilters('prevEndDate', endDateConfigurer('week', true)); // 금주 말일
    onChangeFilters('period', 'week'); // 기간 '주별'
    onChangeFilters('searchType', 'prod'); // 검색유형 '품목명'
    onChangeFilters('skuId', 0);
    onChangeFilters('prodId', 0);
    searchBarRef.current?.eraseInputValue(); // 입력값 초기화
    //await new Promise((resolve) => setTimeout(resolve, 0));
    //await onSearch();
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
        <Search.Segmented
          title={'기간'}
          name={'period'}
          checkedLabel={'주별'}
          uncheckedLabel={'월별'}
          onChange={(name, value) => {
            const applied: OpUnitType = value ? 'week' : 'month';
            console.log(startDateConfigurer(applied), endDateConfigurer(applied));
            onChangeFilters('period', applied);
            onChangeFilters('startDate', startDateConfigurer(applied));
            onChangeFilters('endDate', endDateConfigurer(applied));
            onChangeFilters('prevStartDate', startDateConfigurer(applied, true));
            onChangeFilters('prevEndDate', endDateConfigurer(applied, true));
          }}
          value={filters.period == 'week'}
        />
        <CustomNewDatePicker
          type={'range'}
          title={'변경일자'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onEnter={onSearch}
          onChange={(name, value) => {
            if (name == 'startDate') {
              onChangeFilters('startDate', value);
              onChangeFilters(
                'prevStartDate',
                dayjs(value)
                  .subtract(1, filters.period == 'week' ? 'week' : 'month')
                  .format('YYYY-MM-DD'),
              );
            } else {
              onChangeFilters('endDate', value);
              onChangeFilters(
                'prevEndDate',
                dayjs(value)
                  .subtract(1, filters.period == 'week' ? 'week' : 'month')
                  .format('YYYY-MM-DD'),
              );
            }
          }}
          defaultType={filters.period}
          selectType={filters.period}
        />
        <Search.Bar<SkuResponseResponseBySearch | ProductResponseResponseBySearch>
          title={'상품검색'}
          ref={searchBarRef}
          name={filters.searchType == 'prod' ? 'prodId' : 'skuId'}
          placeholder={(filters.searchType == 'prod' ? '품목' : 'sku') + '명 입력'}
          displayedObjKey={filters.searchType == 'prod' ? 'prodNm' : 'skuNm'}
          onDataSelected={(name, value) => {
            if (name == 'prodId') {
              const selectedProdData = value as ProductResponseResponseBySearch;
              onChangeFilters('prodId', selectedProdData.id || 0);
              console.log(selectedProdData);
            } else {
              const selectedSkuData = value as SkuResponseResponseBySearch;
              onChangeFilters('skuId', selectedSkuData.id || 0);
              console.log(selectedSkuData);
            }
          }}
          onSearch={(typedValue) => {
            return filters.searchType == 'prod' ? getProductListByKeyWord(typedValue) : selectSkuListByKeyWord(typedValue);
          }}
        />
        <Search.Radio
          title={'검색유형'}
          name={'searchType'}
          options={[
            { label: '품목명', value: 'prod' },
            { label: 'sku', value: 'sku' },
          ]}
          value={filters.searchType}
          onChange={(name, value) => {
            searchBarRef.current?.eraseInputValue();
            onChangeFilters('skuId', 0);
            onChangeFilters('prodId', 0);
            onChangeFilters(name, value);
          }}
        />
      </Search>
      <Table>
        <TableHeader count={filters.searchType == 'prod' ? prodSalesRankList.length : skuSalesRankList.length} search={onSearch}>
          <button
            className="btn"
            onClick={() => {
              if (gridRef.current?.api.getSelectedNodes()[0]) {
                setSelectedRowData(gridRef.current?.api.getSelectedNodes()[0].data);
                setOpenDetailModal(true);
              } else {
                toastError('하나의 행을 선택한 후 재시도하십시요.');
              }
            }}
          >
            상세보기
          </button>
        </TableHeader>
        <div className="layoutBox">
          {/* 왼쪽 */}
          <div className="layout50">
            <div className="gridBox">
              <TunedGrid
                ref={gridRef}
                rowData={filters.searchType == 'prod' ? prodSalesRankList : skuSalesRankList}
                loading={filters.searchType == 'prod' ? isProdSalesRankDataLoading : isSkuSalesRankDataLoading}
                columnDefs={defaultColumnDefFn(filters.searchType)}
                onGridReady={onGridReady}
                rowSelection={'single'}
                suppressRowClickSelection={false}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                getRowClass={getRowClass}
                className={'nothingDefault'}
              />
            </div>
          </div>
          {/* 오른쪽 */}
          <div className="layout50">
            <div className="gridBox">
              <TunedGrid
                ref={gridRef}
                rowData={filters.searchType == 'prod' ? prevProdSalesRankList : prevSkuSalesRankList}
                loading={filters.searchType == 'prod' ? isPrevProdSalesRankDataLoading : isPrevSkuSalesRankDataLoading}
                columnDefs={defaultColumnDefFn(filters.searchType)}
                onGridReady={onGridReady}
                rowSelection={'single'}
                suppressRowClickSelection={false}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                getRowClass={getRowClass}
                className={'nothingDefault'}
              />
            </div>
          </div>
        </div>
      </Table>
      <ProdSalesRankDetPop open={openDetailModal} onClose={() => setOpenDetailModal(false)} selectedRowData={selectedRowData} />
    </div>
  );
};

export default ProdSalesRank;
