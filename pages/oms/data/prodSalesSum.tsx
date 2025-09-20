import React, { useEffect, useRef, useState } from 'react';
import { Search, Table, TableHeader, Title, toastError } from '../../../components';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { useAgGridApi } from '../../../hooks';
import useFilters from '../../../hooks/useFilters';
import { ProductMngPagingFilter } from '../../../stores/useProductMngStore';
import { authApi } from '../../../libs';
import { useQuery } from '@tanstack/react-query';
import { Utils } from '../../../libs/utils';
import TunedGrid from '../../../components/grid/TunedGrid';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useCommonStore } from '../../../stores';
import { AgGridReact } from 'ag-grid-react';
import { ProductResponseSalesSumList } from '../../../generated';
import CustomNewDatePicker, { CustomNewDatePickerRefInterface } from '../../../components/CustomNewDatePicker';
import dayjs from 'dayjs';
import { useProdSalesSumStore } from '../../../stores/useProdSalesSumStore';
import ProdSalesSumDet from '../../../components/popup/data/ProdSalesSumDet';

const ProductSalesSum = () => {
  const { onGridReady } = useAgGridApi();
  const nowPage = 'oms_prodSalesSum'; // filter 저장 2025-01-21
  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList,
    s.setFilterDataList,
    s.getFilterData,
  ]);
  const [modalType, openModal, closeModal] = useProdSalesSumStore((s) => [s.modalType, s.openModal, s.closeModal]);
  const gridRef = useRef<AgGridReact>(null);
  const datePickerRef = useRef<CustomNewDatePickerRefInterface>(null);
  const [productTranData, setProductTranData] = useState<ProductResponseSalesSumList[]>([]);
  const [clickedRowData, setClickedRowData] = useState<ProductResponseSalesSumList | null>(null);
  const [popTitle, setPopTitle] = useState<string>('');
  const [filters, onChangeFilters] = useFilters<ProductMngPagingFilter>(
    getFilterData(filterDataList, nowPage) || {
      skuNm: '',
      startDate: dayjs().subtract(1, 'month').format('YYYY-MM-DD'), // -1년
      endDate: dayjs().format('YYYY-MM-DD'),
      searchType: 'P',
      productType: 'N',
    },
  );

  const columnDefs: ColDef<ProductResponseSalesSumList>[] = [
    {
      field: 'no',
      headerName: '#',
      minWidth: 50,
      maxWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'star',
      headerName: '☆',
      minWidth: 30,
      maxWidth: 30,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return params.value ? '☆' : '★';
      },
    },
    {
      field: 'releaseYear',
      headerName: '등록년도',
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'prodNm',
      headerName: '상품',
      minWidth: 150,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuColor',
      headerName: '칼라',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
      hide: filters.searchType === 'P',
    },
    {
      field: 'skuSize',
      headerName: '사이즈',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
      hide: filters.searchType === 'P' || filters.searchType === 'C',
    },
    {
      field: 'orgAmt',
      headerName: '제품원가',
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'sellAmt',
      headerName: '판매가',
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'seasonNm',
      headerName: '계절',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      filter: true,
    },
    {
      field: 'designNm',
      headerName: '디자이너',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      filter: true,
    },
    {
      field: 'gubunCntn',
      headerName: Utils.getGubun('sku1', '구분'),
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      filter: true,
    },
    {
      field: 'invenCnt',
      headerName: '현재고',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'sampleCnt',
      headerName: '생플잔량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'misongCnt',
      headerName: '미송잔량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'misongCnt',
      headerName: '합산재고*',
      minWidth: 65,
      maxWidth: 65,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      headerTooltip: '합산재고 = 입고예정 + 현재고 + 샘플잔량 - 미송잔량 -> 현재고 + 들어올/나갈 수량',
      valueFormatter: (params: any) => {
        const totInvenCnt = params.data.invenCnt + params.data.sampleCnt - params.data.misongCnt;
        return Utils.setComma(totInvenCnt);
      },
    },
    {
      field: 'totSellCnt',
      headerName: '판매량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'totRtnCnt',
      headerName: '반품량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'totRtnCnt',
      headerName: '반품률',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        const rtnRate = Number(((100 * params.value) / params.data.totSellCnt).toFixed(1));
        return rtnRate + '%';
      },
    },
    {
      field: 'totRtnCnt',
      headerName: '실판매',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      headerTooltip: '실판매금액 = 판매금액 - 반품금액',
      valueFormatter: (params: any) => {
        const totSaleCnt = params.data.totSellCnt - params.value;
        return Utils.setComma(totSaleCnt);
      },
    },
    {
      field: 'dcAmt',
      headerName: '단가DC',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'discountAmt',
      headerName: '할인금액',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'dcAmt',
      headerName: '순수매출',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        const pureAmt = params.data.totSellAmt - params.data.dcAmt - params.data.discountAmt;
        return Utils.setComma(pureAmt);
      },
    },
    {
      field: 'dcAmt',
      headerName: '판매이득*',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      headerTooltip: '판매이득 = 순수매출 - 매출원가 -> 매출원가 = 판매원가 * 실판매량',
      valueFormatter: (params: any) => {
        const pureAmt = params.data.totSellAmt - params.value - params.data.discountAmt;
        const netAmt = params.data.orgAmt * params.data.totSellCnt;
        const gainAmt = pureAmt - netAmt;
        return Utils.setComma(gainAmt);
      },
    },
    {
      field: 'dcAmt',
      headerName: '실손익',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      headerTooltip: '실손익 = 판매이득 - 재고원가 -> 재고원가 = 판매원가 * 합산재고',
      valueFormatter: (params: any) => {
        const pureAmt = params.data.totSellAmt - params.value - params.data.discountAmt;
        const netAmt = params.data.orgAmt * params.data.totSellCnt;
        const gainAmt = pureAmt - netAmt;
        const totInvenCnt = params.data.invenCnt + params.data.sampleCnt - params.data.misongCnt;
        const totNotSaleAmt = totInvenCnt * params.data.orgAmt;
        const realGainAmt = gainAmt - totNotSaleAmt;
        return Utils.setComma(realGainAmt);
      },
    },
  ];

  /** 상품관리 페이징 목록 조회 */
  const {
    data: products,
    isSuccess,
    refetch: productRefetch,
  } = useQuery(['/product/productSailSum/list'], (): any =>
    authApi.get('/product/productSailSum/list', {
      params: {
        ...filters,
      },
    }),
  );

  useEffect(() => {
    if (isSuccess && products?.data) {
      const { resultCode, body, resultMessage } = products.data;
      if (resultCode === 200 && body) {
        console.log('body ==>', body);
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
        setProductTranData(products?.data?.body);
      } else {
        toastError(resultMessage || '데이터 조회 중 오류가 발생했습니다.');
      }
    }
  }, [products, isSuccess]);

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };
  // 검색
  const onSearch = async () => {
    await productRefetch();
  };
  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    // 필터 초기화
    //onFiltersReset(); // 필터 초기화
    onChangeFilters('startDate', dayjs().subtract(1, 'month').format('YYYY-MM-DD'));
    onChangeFilters('endDate', dayjs().format('YYYY-MM-DD'));
    onChangeFilters('searchType', 'P');
    onChangeFilters('sellerId', 0);

    // 여기서 필터 상태를 업데이트하는 로직을 추가하세요
    await onSearch(); // 상태가 업데이트된 후에 검색 실행
  };

  useEffect(() => {
    onSearch();
  }, [filters]);

  /** 셀 클릭 이벤트 */
  const onCellClicked = async (cellClickedEvent: CellClickedEvent) => {
    if (cellClickedEvent.column.getColId() === 'star') {
      cellClickedEvent.node.setDataValue('star', cellClickedEvent.data.star ? 0 : 1);
    } else {
      const rowData = cellClickedEvent.data;
      // 상태에 행 데이터 저장
      setClickedRowData(rowData);
      if (filters.searchType === 'P') {
        setPopTitle(rowData.prodNm);
      } else if (filters.searchType === 'C') {
        setPopTitle(rowData.prodNm + ' ' + rowData.skuColor);
      } else if (filters.searchType === 'S') {
        setPopTitle(rowData.prodNm + ' ' + rowData.skuColor + ' ' + rowData.skuSize);
      }
      setTimeout(() => {
        openModal('DET');
      }, 100);
    }
  };

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} search={search} filters={filters} reset={reset} />
      <Search className="type_2">
        <CustomNewDatePicker
          type={'range'}
          title={'기간'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onChange={onChangeFilters}
          onEnter={() => {
            if (filters.sellerId == undefined || filters.sellerId == 0) {
              toastError('소매처 선택 후 다시 시도하십시요.');
            }
          }}
          filters={filters}
          defaultType={'month'}
          ref={datePickerRef}
        />
        <Search.Input
          title={'상품명'}
          name={'skuNm'}
          placeholder={'상품명을 입력하세요.'}
          value={filters.skuNm}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.Radio
          title={'상품구분'}
          name={'searchType'}
          options={[
            { label: '상품별', value: 'P' },
            { label: '칼라', value: 'C' },
            { label: '스큐별', value: 'S' },
          ]}
          value={filters.searchType}
          onChange={(e, value) => {
            onChangeFilters('searchType', value);
          }}
        />
        <Search.Radio
          title={'상품유형'}
          name={'productType'}
          value={filters.productType}
          options={[
            { label: '일반', value: 'N' },
            { label: '제작', value: 'O' },
          ]}
          onChange={async (name, value) => {
            onChangeFilters('productType', value); // 선택된 값을 상태로 업데이트
          }}
        />
      </Search>

      <Table>
        <TableHeader count={productTranData.length || 0} search={productRefetch} choiceCount={50} gridRef={gridRef} isPaging={false}></TableHeader>
        <TunedGrid<ProductResponseSalesSumList>
          ref={gridRef}
          onGridReady={onGridReady}
          rowData={productTranData || []}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          preventPersonalizedColumnSetting={true}
          gridOptions={{
            suppressTouch: true,
          }}
          rowSelection={'multiple'}
          className={'default'}
          onCellClicked={onCellClicked}
        />

        <div className="btnArea"></div>
      </Table>
      {modalType.type == 'DET' && modalType.active && clickedRowData && (
        <ProdSalesSumDet
          open={modalType.active}
          onClose={() => {
            closeModal(modalType.type);
          }}
          startDate={filters.startDate}
          endDate={filters.endDate}
          detData={clickedRowData || {}}
          titleNm={popTitle}
        />
      )}
    </div>
  );
};

export default ProductSalesSum;
