import React, { useEffect, useRef, useState } from 'react';
import { Search, Table, Title } from '../../../components';
import { TableHeader, toastError } from '../../../components';
import { CellDoubleClickedEvent, ColDef } from 'ag-grid-community';
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
import { DeliveryResponsePaging, OrderDetCreate, ProductResponseTranDataList, RetailResponseDetail } from '../../../generated';
import CustomNewDatePicker, { CustomNewDatePickerRefInterface } from '../../../components/CustomNewDatePicker';
import dayjs from 'dayjs';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import { useOrderStore } from '../../../stores/useOrderStore';
import { ProductStatus } from '../../../libs/const';
import { useProductTranDataStore } from '../../../stores/useProductTranDataStore';
import TotSailListPop from '../../../components/popup/product/TotSailListPop';
import DcSailListPop from '../../../components/popup/product/DcSailListPop';
import ReorderSailListPop from '../../../components/popup/product/ReorderSailListPop';

const ProductTranData = () => {
  const { onGridReady } = useAgGridApi();
  const nowPage = 'oms_productTranData'; // filter 저장 2025-01-21
  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData, getFileUrl, selectedRetailInCommon, setSelectedRetailInCommon] = useCommonStore(
    (s) => [s.upMenuNm, s.menuNm, s.filterDataList, s.setFilterDataList, s.getFilterData, s.getFileUrl, s.selectedRetail, s.setSelectedRetail],
  );
  const gridRef = useRef<AgGridReact>(null);
  const datePickerRef = useRef<CustomNewDatePickerRefInterface>(null);
  const [modalType, modals, openModal] = useProductTranDataStore((s) => [s.modalType, s.modals, s.openModal]);
  const [productTranData, setProductTranData] = useState<ProductResponseTranDataList[]>([]);
  const [selectedRetail, setSelectedRetail] = useState<RetailResponseDetail | undefined>(selectedRetailInCommon);
  const [setOrderDetList, orderInfo, productState] = useOrderStore((s) => [s.setOrderDetList, s.order, s.productState]);
  const [selectedSkuId, setSelectedSkuId] = useState<number>();
  const [selectedSkuNm, setSelectedSkuNm] = useState<string>();
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<ProductResponseTranDataList[]>([]); // 예솔수정 하단합계 추가

  const [filters, onChangeFilters, onFiltersReset, setFilters] = useFilters<ProductMngPagingFilter>(
    getFilterData(filterDataList, nowPage) || {
      sellerId: 0,
      startDate: dayjs().subtract(1, 'month').format('YYYY-MM-DD'), // -1년
      endDate: dayjs().format('YYYY-MM-DD'),
      searchType: 'A',
    },
  );

  const columnDefs: ColDef<ProductResponseTranDataList>[] = [
    {
      field: 'no',
      headerName: '#',
      minWidth: 40,
      maxWidth: 40,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'releaseYear',
      headerName: '등록년도',
      minWidth: 60,
      maxWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'releaseDay',
      headerName: '등록일',
      minWidth: 65,
      maxWidth: 65,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'seasonNm',
      headerName: '계절',
      minWidth: 40,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      filter: true,
    },
    {
      field: 'gubunCntn',
      headerName: Utils.getGubun('sku1', '구분1'),
      minWidth: 40,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      filter: true,
    },
    {
      field: 'skuNm',
      headerName: '상품',
      minWidth: 150,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'sellAmt',
      headerName: '판매가',
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
    },
    {
      field: 'dcAmt',
      headerName: '단가DC',
      minWidth: 40,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
    },
    {
      field: 'dcCnt',
      headerName: 'DC건수',
      minWidth: 40,
      maxWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuCnt',
      headerName: '주문수',
      minWidth: 40,
      maxWidth: 60,
      cellStyle: (params) => {
        return {
          ...GridSetting.CellStyle.RIGHT, // 기존 스타일 유지
          backgroundColor: params.value > 0 ? '#d2d577' : '#e9ead3', // 0보다 크면 빨간색, 아니면 노란색
        };
      },
      suppressHeaderMenuButton: true,
      editable: true,
      cellEditor: 'agTextCellEditor', // 기본 텍스트 에디터 사용
      cellClass: 'editCell',
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'inventoryAmt',
      headerName: '빈블러',
      minWidth: 40,
      maxWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'partnerInventoryAmt',
      headerName: '매장재고',
      minWidth: 40,
      maxWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'sellerCnt',
      headerName: '업체판매',
      minWidth: 80,
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      filter: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'resentSellDay',
      headerName: '최근판매',
      minWidth: 80,
      filter: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'sampleDay',
      headerName: '최근샘플',
      minWidth: 80,
      filter: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'totSellCnt',
      headerName: '총판매량',
      minWidth: 40,
      maxWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'reorderCnt',
      headerName: '재주문#',
      minWidth: 40,
      maxWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'reorderSellerCnt',
      headerName: '업체수',
      minWidth: 40,
      maxWidth: 50,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
  ];

  /** 상품관리 페이징 목록 조회 */
  const {
    data: products,
    isSuccess,
    refetch: productRefetch,
  } = useQuery(
    ['/product/productTranData/list'],
    (): any =>
      authApi.get('/product/productTranData/list', {
        params: {
          ...filters,
        },
      }),
    {
      enabled: filters.sellerId > 0,
    },
  );

  useEffect(() => {
    if (isSuccess && products?.data) {
      const { resultCode, body, resultMessage } = products.data;
      if (resultCode === 200 && body) {
        console.log('body ==>', body);
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
        setProductTranData(products?.data?.body);
        /** 예솔수정
         * 하단합계 추가 */
        if (body && body.length > 0) {
          const { dcCount, skuCount, inventoryAmount, partnerInventoryAmount, sellerCount, totSellCount, reorderCount, reorderSellerCount } = body.reduce(
            (
              acc: {
                dcCount: number;
                skuCount: number;
                inventoryAmount: number;
                partnerInventoryAmount: number;
                sellerCount: number;
                totSellCount: number;
                reorderCount: number;
                reorderSellerCount: number;
              },
              data: ProductResponseTranDataList,
            ) => {
              return {
                dcCount: acc.dcCount + (data.dcCnt ? data.dcCnt : 0),
                skuCount: acc.skuCount + (data.skuCnt ? data.skuCnt : 0),
                inventoryAmount: acc.inventoryAmount + (data.inventoryAmt ? data.inventoryAmt : 0),
                partnerInventoryAmount: acc.partnerInventoryAmount + (data.partnerInventoryAmt ? data.partnerInventoryAmt : 0),
                sellerCount: acc.sellerCount + (data.sellerCnt ? data.sellerCnt : 0),
                totSellCount: acc.totSellCount + (data.totSellCnt ? data.totSellCnt : 0),
                reorderCount: acc.reorderCount + (data.reorderCnt ? data.reorderCnt : 0),
                reorderSellerCount: acc.reorderSellerCount + (data.reorderSellerCnt ? data.reorderSellerCnt : 0),
              };
            },
            {
              dcCount: 0,
              skuCount: 0,
              inventoryAmount: 0,
              partnerInventoryAmount: 0,
              sellerCount: 0,
              totSellCount: 0,
              reorderCount: 0,
              reorderSellerCount: 0,
            }, // 초기값 설정
          );

          setPinnedBottomRowData([
            {
              dcCnt: dcCount,
              skuCnt: skuCount,
              inventoryAmt: inventoryAmount,
              partnerInventoryAmt: partnerInventoryAmount,
              sellerCnt: sellerCount,
              totSellCnt: totSellCount,
              reorderCnt: reorderCount,
              reorderSellerCnt: reorderSellerCount,
            },
          ]);
        }
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
    onChangeFilters('searchType', 'A');
    onChangeFilters('sellerId', 0);

    // 여기서 필터 상태를 업데이트하는 로직을 추가하세요
    await onSearch(); // 상태가 업데이트된 후에 검색 실행
  };

  useEffect(() => {
    onSearch();
  }, [filters]);

  /** 계정관리, 셀 클릭 이벤트 */
  const onCellDoubleClicked = async (cellDoubleClickedEvent: CellDoubleClickedEvent) => {
    setSelectedSkuId(cellDoubleClickedEvent.data.skuId);
    setSelectedSkuNm(cellDoubleClickedEvent.data.skuNm + ' (' + Utils.setComma(cellDoubleClickedEvent.data.sellAmt) + '원)');
    setTimeout(() => {
      if (cellDoubleClickedEvent.column.getColId() == 'totSellCnt') {
        openModal('TOTSAIL');
      } else if (cellDoubleClickedEvent.column.getColId() == 'dcCnt') {
        openModal('DCSAIL');
      } else if (cellDoubleClickedEvent.column.getColId() == 'reorderCnt') {
        openModal('REORDER');
      }
    }, 100);
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
          //selectType={'type'} //defaultType 과 selectType 이 동일하면 동일한 한가지면 펼침메뉴에 나타난다.
          ref={datePickerRef}
        />
        <Search.RetailBar
          title={'소매처'}
          name={'retailNm'}
          placeholder={'소매처 검색'}
          allowNewRetail={false}
          selectedRetail={selectedRetail} // 경로변수로 소매처 id 가 주어질 시 소매처 전역 상태를 참조함
          onRetailSelected={(retailInfo) => {
            /** 본 영역에서만 소매처 상태 및 sellerId 필터 값이 변경됨 */
            setSelectedRetail(retailInfo);
            if (retailInfo?.id) {
              onChangeFilters('sellerId', retailInfo.id);
            }
          }}
        />
        <Search.DropDown
          title={'상품구분'}
          name={'searchType'}
          value={filters.searchType}
          onChange={async (name, value) => {
            onChangeFilters('searchType', value); // 선택된 값을 상태로 업데이트
          }}
          defaultOptions={[
            { label: '일반', value: 'A' }, // 현재고가 0 인고
            { label: '제작', value: 'B' },
          ]}
        />
      </Search>

      <Table>
        <TableHeader count={productTranData.length || 0} search={productRefetch} choiceCount={50} gridRef={gridRef} isPaging={false}></TableHeader>
        <TunedGrid<ProductResponseTranDataList>
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
          onCellDoubleClicked={onCellDoubleClicked}
          //getRowClass={getRowClass}
          pinnedBottomRowData={pinnedBottomRowData} // 예솔수정 하단합계 추가
        />

        <div className="btnArea">
          <CustomShortcutButton
            className="btn"
            title="선택주문"
            onClick={() => {
              console.log('orderInfo==>', orderInfo);
              console.log('productState==>', productState);

              gridRef.current?.api.stopEditing(false);
              const filteredData: ProductResponseTranDataList[] = [];
              const productStateCd = productState && productState[0] ? productState[0] : ProductStatus.sell[0]; // 따로 셑팅된게 없으면 판매로 셑팅
              let currentNo = 1; // no를 1부터 시작
              gridRef.current?.api.forEachNode((node) => {
                const skuCnt = node.data.skuCnt;
                if (skuCnt != null && Number(skuCnt) > 0) {
                  filteredData.push({
                    ...node.data,
                    no: currentNo++, // no를 설정하고 증가
                    orderDetCd: productStateCd,
                    baseAmt: node.data.sellAmt,
                    totAmt: node.data.dcAmt > 0 ? node.data.sellAmt - node.data.dcAmt : node.data.sellAmt,
                  });
                  node.data.skuCnt = 0;
                }
              });
              if (filteredData.length > 0) {
                setOrderDetList(filteredData as OrderDetCreate[]);
                if (selectedRetail) {
                  selectedRetail.sellerId = selectedRetail.id;
                  console.log('selectedRetail ==>', selectedRetail);
                  setSelectedRetailInCommon(selectedRetail);
                }
              } else {
                toastError('주문건수가 입력된 건이 존재하지 않습니다.');
              }
            }}
            shortcut={COMMON_SHORTCUTS.gridUnder1}
          >
            선택주문
          </CustomShortcutButton>
        </div>
      </Table>
      {modalType?.type === 'TOTSAIL' && modalType.active && (
        <TotSailListPop skuId={selectedSkuId || 0} skuNm={selectedSkuNm || ''} startDate={filters.startDate} endDate={filters.endDate} />
      )}
      {modalType?.type === 'DCSAIL' && modalType.active && (
        <DcSailListPop skuId={selectedSkuId || 0} skuNm={selectedSkuNm || ''} startDate={filters.startDate} endDate={filters.endDate} />
      )}
      {modalType?.type === 'REORDER' && modalType.active && (
        <ReorderSailListPop skuId={selectedSkuId || 0} skuNm={selectedSkuNm || ''} startDate={filters.startDate} endDate={filters.endDate} />
      )}
    </div>
  );
};

export default ProductTranData;
