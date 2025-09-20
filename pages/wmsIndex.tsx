import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Table, TableHeader, Title, toastError } from '../components';
import { useAgGridApi } from '../hooks';
import { useCommonStore } from '../stores';
import useFilters from '../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, GridSetting } from '../libs/ag-grid';
import CustomGridLoading from '../components/CustomGridLoading';
import CustomNoRowsOverlay from '../components/CustomNoRowsOverlay';
import { CellKeyDownEvent, ColDef, RowClassParams } from 'ag-grid-community';
import { Tooltip } from 'react-tooltip';
import ECharts from 'echarts-for-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../libs';
import dayjs from 'dayjs';
import { Space, Switch } from 'antd';
import CustomTwoDatePicker from '../components/CustomTwoDatePicker';

// 더미 데이터 인터페이스
interface WmsStatData {
  id: number;
  month: string;
  partnerName: string;
  inboundQty: number;
  outboundQty: number;
  stockQty: number;
  returnQty: number;
  turnoverRate: number;
  salesQty: number;
  returnCount: number;
  refundCount: number;
  requestCount: number;
  skuCount: number;
  locationCount: number;
  holdCount: number;
  pendingCount: number;
  orderCount: number;
  expectedCount: number;
}

// 더미 데이터 생성
const generateDummyData = (count: number): WmsStatData[] => {
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    month: monthNames[i % 12], // 순차적으로 1월, 2월...12월 반복
    partnerName: `몬드 ${i + 1}`,
    inboundQty: Math.floor(Math.random() * 1000),
    outboundQty: Math.floor(Math.random() * 800),
    stockQty: Math.floor(Math.random() * 2000),
    returnQty: Math.floor(Math.random() * 100),
    turnoverRate: Math.random() * 5,
    salesQty: Math.floor(Math.random() * 500),
    returnCount: Math.floor(Math.random() * 50),
    refundCount: Math.floor(Math.random() * 30),
    requestCount: Math.floor(Math.random() * 200),
    skuCount: Math.floor(Math.random() * 1000),
    locationCount: Math.floor(Math.random() * 100),
    holdCount: Math.floor(Math.random() * 20),
    pendingCount: Math.floor(Math.random() * 40),
    orderCount: Math.floor(Math.random() * 150),
    expectedCount: Math.floor(Math.random() * 100),
  }));
};

const WmsIndex = () => {
  const { gridApi, onGridReady } = useAgGridApi();
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any>([]);
  const [graphOnOff, setGraphOnOff] = useState<boolean>(false);
  const [isOverview, setIsOverview] = useState<boolean>(true);

  // 페이징 상태
  const [paging, setPaging] = useState({
    curPage: 1,
    totalRowCount: 0,
    pageRowCount: 50,
  });

  // 필터 상태
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    searchPartnerName: '',
    startDate: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });

  // 그리드 데이터 상태
  const [wmsData, setWmsData] = useState<WmsStatData[]>(generateDummyData(20));

  // ag-Grid 레퍼런스
  const wmsGridRef = useRef<AgGridReact>(null);

  // 컬럼 정의
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([
    {
      field: 'id',
      headerName: 'No',
      maxWidth: 70,
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'partnerName',
      headerName: '화주명',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'inboundQty',
      headerName: '입고량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'outboundQty',
      headerName: '출고량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'stockQty',
      headerName: '재고량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'returnQty',
      headerName: '반품량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'turnoverRate',
      headerName: '창고사용율',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => `${params.value.toFixed(2)}%`,
    },
    {
      field: 'salesQty',
      headerName: '판매량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'returnCount',
      headerName: '반품수',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'refundCount',
      headerName: '반납수',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'requestCount',
      headerName: '요청수',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'requestCount',
      headerName: '이동건수',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'holdCount',
      headerName: '상품수',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuCount',
      headerName: 'SKU수',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'locationCount',
      headerName: 'LOC수',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'holdCount',
      headerName: '보류건수',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'pendingCount',
      headerName: '미처리수',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'orderCount',
      headerName: '발주건수',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'expectedCount',
      headerName: '입하예정수',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
  ]);

  // 차트 옵션
  const [options, setOptions] = useState<any>({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        let tooltip = params[0].name + '<br/>';
        params.forEach((param: any) => {
          const value = param.seriesName.includes('율') ? param.value.toFixed(2) + '%' : param.value.toLocaleString();
          tooltip += `${param.seriesName}: ${value}<br/>`;
        });
        return tooltip;
      },
    },
    legend: {
      data: [
        '입고량',
        '출고량',
        '재고량',
        '반품량',
        '창고사용율',
        '판매량',
        '반품수',
        '반납수',
        '요청수',
        '이동건수',
        '상품수',
        'SKU수',
        'LOC수',
        '보류건수',
        '미처리수',
        '발주건수',
        '입하예정수',
      ],
      selected: {
        입고량: true,
        출고량: true,
        재고량: false,
        반품량: false,
        창고사용율: false,
        판매량: false,
        반품수: false,
        반납수: false,
        요청수: false,
        이동건수: false,
        상품수: false,
        SKU수: false,
        LOC수: false,
        보류건수: false,
        미처리수: false,
        발주건수: false,
        입하예정수: false,
      },
      type: 'scroll',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: wmsData.map((d) => d.month),
        axisLabel: {
          interval: 0,
          rotate: 0,
        },
      },
    ],
    yAxis: [
      {
        type: 'value',
        name: '수량',
        position: 'left',
        axisLabel: {
          formatter: (value: number) => value.toLocaleString(),
        },
      },
      {
        type: 'value',
        name: '비율(%)',
        position: 'right',
        axisLabel: {
          formatter: (value: number) => value.toFixed(2) + '%',
        },
      },
    ],
    series: [
      {
        name: '입고량',
        type: 'bar',
        data: wmsData.map((d) => d.inboundQty),
        itemStyle: { color: '#5470c6' },
      },
      {
        name: '출고량',
        type: 'bar',
        data: wmsData.map((d) => d.outboundQty),
        itemStyle: { color: '#91cc75' },
      },
      {
        name: '재고량',
        type: 'bar',
        data: wmsData.map((d) => d.stockQty),
        itemStyle: { color: '#fac858' },
      },
      {
        name: '반품량',
        type: 'bar',
        data: wmsData.map((d) => d.returnQty),
        itemStyle: { color: '#ee6666' },
      },
      {
        name: '창고사용율',
        type: 'line',
        yAxisIndex: 1,
        data: wmsData.map((d) => d.turnoverRate),
        itemStyle: { color: '#73c0de' },
      },
      {
        name: '판매량',
        type: 'bar',
        data: wmsData.map((d) => d.salesQty),
        itemStyle: { color: '#3ba272' },
      },
      {
        name: '반품수',
        type: 'bar',
        data: wmsData.map((d) => d.returnCount),
        itemStyle: { color: '#fc8452' },
      },
      {
        name: '반납수',
        type: 'bar',
        data: wmsData.map((d) => d.refundCount),
        itemStyle: { color: '#9a60b4' },
      },
      {
        name: '요청수',
        type: 'bar',
        data: wmsData.map((d) => d.requestCount),
        itemStyle: { color: '#ea7ccc' },
      },
      {
        name: '이동건수',
        type: 'bar',
        data: wmsData.map((d) => d.requestCount),
        itemStyle: { color: '#58d9f9' },
      },
      {
        name: '상품수',
        type: 'bar',
        data: wmsData.map((d) => d.holdCount),
        itemStyle: { color: '#7ec699' },
      },
      {
        name: 'SKU수',
        type: 'bar',
        data: wmsData.map((d) => d.skuCount),
        itemStyle: { color: '#f49f42' },
      },
      {
        name: 'LOC수',
        type: 'bar',
        data: wmsData.map((d) => d.locationCount),
        itemStyle: { color: '#aa7dcd' },
      },
      {
        name: '보류건수',
        type: 'bar',
        data: wmsData.map((d) => d.holdCount),
        itemStyle: { color: '#e485b7' },
      },
      {
        name: '미처리수',
        type: 'bar',
        data: wmsData.map((d) => d.pendingCount),
        itemStyle: { color: '#6be6c1' },
      },
      {
        name: '발주건수',
        type: 'bar',
        data: wmsData.map((d) => d.orderCount),
        itemStyle: { color: '#d4a4eb' },
      },
      {
        name: '입하예정수',
        type: 'bar',
        data: wmsData.map((d) => d.expectedCount),
        itemStyle: { color: '#ff9f7f' },
      },
    ],
  });

  // 검색 기능
  const search = async () => {
    // 실제 환경에서는 API 호출
    setWmsData(generateDummyData(20));
    calculateSummary();
  };

  // 합계 계산
  const calculateSummary = () => {
    const summary = wmsData.reduce((acc, curr) => ({
      id: 0,
      partnerName: '합계',
      inboundQty: acc.inboundQty + curr.inboundQty,
      outboundQty: acc.outboundQty + curr.outboundQty,
      stockQty: acc.stockQty + curr.stockQty,
      returnQty: acc.returnQty + curr.returnQty,
      turnoverRate: acc.turnoverRate + curr.turnoverRate,
      salesQty: acc.salesQty + curr.salesQty,
      returnCount: acc.returnCount + curr.returnCount,
      refundCount: acc.refundCount + curr.refundCount,
      requestCount: acc.requestCount + curr.requestCount,
      skuCount: acc.skuCount + curr.skuCount,
      locationCount: acc.locationCount + curr.locationCount,
      holdCount: acc.holdCount + curr.holdCount,
      pendingCount: acc.pendingCount + curr.pendingCount,
      orderCount: acc.orderCount + curr.orderCount,
      expectedCount: acc.expectedCount + curr.expectedCount,
      month: acc.month,
    }));

    setPinnedBottomRowData([summary]);
  };

  useEffect(() => {
    calculateSummary();
  }, [wmsData]);

  const getRowClass = useCallback((params: RowClassParams) => {
    if (params.node.rowPinned === 'bottom') {
      return 'ag-grid-pinned-row';
    }
    return '';
  }, []);

  return (
    <>
      <Title title={'BLUR Dashboard'} search={search} filters={filters} />

      <Search className="type_2">
        <Search.Input
          title={'화주명'}
          name={'searchPartnerName'}
          placeholder={'화주명 입력'}
          value={filters.searchPartnerName}
          onChange={onChangeFilters}
          onEnter={search}
        />
        <Search.TwoDatePicker
          title={'조회기간'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onEnter={search}
          filters={filters}
          onChange={onChangeFilters}
        />
        <Search.Radio
          title={'ㅤ'}
          name={'prodAttrCd'}
          options={[
            { label: '일별', value: '1' },
            { label: '주별', value: '2' },
            { label: '월별', value: '3' },
            { label: '년별', value: '4' },
          ]}
          value={'1'}
          onChange={(name, value) => {
            value;
            onChangeFilters(name, value);
          }}
          filters={filters}
        />
      </Search>

      <h4 className="smallTitle line between">
        <div className="left">물류 현황 (From to sum 데이터)</div>
      </h4>

      <div className={`gridArea ${graphOnOff ? 'on' : ''}`}>
        <Table>
          <TableHeader count={paging.totalRowCount || 0} paging={paging} search={search} />
          <div className={'ag-theme-alpine'} style={{ height: '500px' }}>
            <AgGridReact
              ref={wmsGridRef}
              onGridReady={onGridReady}
              rowData={wmsData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowHeight={24}
              headerHeight={35}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              getRowClass={getRowClass}
              pinnedBottomRowData={pinnedBottomRowData}
            />
          </div>
        </Table>

        <h4 className="smallTitle between">
          <div className="left">
            <strong>추이 그래프 </strong>
            <button onClick={() => setGraphOnOff(!graphOnOff)}>{graphOnOff ? '접기' : '펼치기'}</button>
          </div>
        </h4>

        {graphOnOff && (
          <div className="graphBox wmsStats mt5">
            <ECharts option={options} opts={{ renderer: 'svg' }} />
          </div>
        )}
      </div>
    </>
  );
};

export default WmsIndex;
