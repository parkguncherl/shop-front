/**
 * @No.9
 * @file pages/oms/data/salesPeriod.tsx
 * @description  OMS > 데이터 > 기간별 매출추이
 * @status 기초생성
 * @copyright 2024
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { Search, Table, TableHeader, Title, toastError } from '../../../components';
import { GridSetting } from '../../../libs/ag-grid';
import { ColDef } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import TunedGrid from '../../../components/grid/TunedGrid';
import { SalesPeriodResponseSalesSituation } from '../../../generated';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';
import { Utils } from '../../../libs/utils';

const SalesPeriod = () => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  // 날짜 초기값 설정 (1개월)
  const startDt = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [menuNm] = useCommonStore((s) => [s.menuNm]);

  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: startDt,
    endDate: today,
    period: 'week', // 주별
    prodAttrCd: '', // 전체 (제작상품 'Y', 일반상품 'N')
  });

  const [salesSituationList, setSalesSituationList] = useState<SalesPeriodResponseSalesSituation[]>([]);

  // AG-Grid 컬럼 정의
  const [columnDefs] = useState<ColDef[]>([
    {
      field: 'no',
      headerName: '#',
      maxWidth: 40,
      minWidth: 40,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'workYmd',
      headerName: '영업일자',
      minWidth: 140,
      maxWidth: 140,
      valueFormatter: (params) => {
        return params.value;
      },
      suppressHeaderMenuButton: true,
    },
    {
      field: 'chitCnt',
      headerName: '전표수',
      minWidth: 100,
      maxWidth: 100,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'saleItemCnt',
      headerName: '판매 품목수',
      minWidth: 100,
      maxWidth: 100,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'sellCnt',
      headerName: '판매량',
      minWidth: 100,
      maxWidth: 100,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'returnCnt',
      headerName: '반품수량',
      minWidth: 100,
      maxWidth: 100,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'realSellCnt',
      headerName: '실판매량',
      minWidth: 100,
      maxWidth: 100,
      valueFormatter: (params) => {
        return Utils.setComma((params.data?.sellCnt || 0) - (params.data?.returnCnt || 0));
      },
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'sellAmt',
      headerName: '판매금액',
      minWidth: 100,
      maxWidth: 100,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'returnAmt',
      headerName: '반품금액',
      minWidth: 100,
      maxWidth: 100,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'baseAmtDc',
      headerName: '단가DC',
      minWidth: 100,
      maxWidth: 100,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'discountAmt',
      headerName: '할인금액',
      minWidth: 100,
      maxWidth: 100,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'realAmt',
      headerName: '실매출액',
      minWidth: 100,
      maxWidth: 100,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'orgSellAmt',
      headerName: '판매원가',
      minWidth: 100,
      maxWidth: 100,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'profitBySail',
      headerName: '판매이득',
      minWidth: 100,
      maxWidth: 100,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'cashAmt',
      headerName: '현금입금',
      minWidth: 100,
      maxWidth: 100,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'accountAmt',
      headerName: '통장입금',
      minWidth: 100,
      maxWidth: 100,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'payByCredit',
      headerName: '외상금액',
      minWidth: 100,
      maxWidth: 100,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
  ]);

  // 데이터 조회 API 호출
  const {
    data: salesSituationData,
    isLoading: isSalesSituationDataLoading,
    isSuccess: isSalesSituationDataSuccess,
    refetch: salesSituationDataFetch,
  } = useQuery(['/salesPeriod/salesSituationInPeriod', filters.startDate, filters.endDate, filters.period, filters.prodAttrCd], () =>
    authApi.get('/salesPeriod/salesSituationInPeriod', {
      params: {
        ...filters,
      },
    }),
  );

  // API 응답 처리
  useEffect(() => {
    if (isSalesSituationDataSuccess) {
      const { resultCode, body, resultMessage } = salesSituationData.data;
      if (resultCode === 200) {
        setSalesSituationList(
          ((body as SalesPeriodResponseSalesSituation[]) || []).map((value) => {
            if (filters.period == 'day') {
              // 일별
              return { ...value, workYmd: value.workYmd };
            } else if (filters.period == 'week') {
              // 주별
              return { ...value, workYmd: value.weekEnd };
            } else {
              // 월별
              return { ...value, workYmd: value.workYm };
            }
          }),
        );
      } else {
        toastError(resultMessage);
      }
    }
  }, [isSalesSituationDataSuccess, salesSituationData]);

  /**
   * 검색 버튼 클릭 핸들러
   */
  const onSearch = async () => {
    await salesSituationDataFetch();
  };

  /**
   * 초기화 버튼 클릭 핸들러
   */
  const onReset = async () => {
    onFiltersReset();
    onChangeFilters('startDate', startDt);
    onChangeFilters('endDate', today);
    onChangeFilters('period', 'week'); // 주별
    onChangeFilters('prodAttrCd', ''); // 전체 (제작상품 'Y', 일반상품 'N')*/
  };

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} reset={onReset} search={onSearch} />
      <Search className="type_2">
        <CustomNewDatePicker
          type={'range'}
          title={'검색'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onChange={onChangeFilters}
          filters={filters}
          defaultType={'type'}
          //selectType={'type'} //defaultType 과 selectType 이 동일하면 동일한 한가지면 펼침메뉴에 나타난다.
        />
        <Search.DropDown
          title={'기간'}
          name={'period'}
          value={filters.period}
          onChange={onChangeFilters}
          showAll={false}
          defaultOptions={[
            { label: '일별', value: 'day' },
            { label: '주별', value: 'week' },
            { label: '월별', value: 'month' },
          ]}
        />
        <Search.Radio
          title={'상품유형'}
          name={'prodAttrCd'}
          options={[
            { label: '일반상품', value: 'N' },
            { label: '제작상품', value: 'Y' },
            { label: '전체', value: '' },
          ]}
          value={filters.prodAttrCd}
          onChange={onChangeFilters}
        />
      </Search>
      <Table>
        <TableHeader count={salesSituationList.length} search={onSearch} />
        <TunedGrid
          ref={gridRef}
          rowData={salesSituationList}
          loading={isSalesSituationDataLoading}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          suppressRowClickSelection={true}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          className={'nothingDefault'}
        />
      </Table>
    </div>
  );
};

export default SalesPeriod;
