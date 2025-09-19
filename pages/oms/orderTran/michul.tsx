import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Title, toastSuccess } from '../../../components';
import { toastError } from '../../../components';
import { useQuery } from '@tanstack/react-query';
import { CellClickedEvent, ColDef, RowClassParams, RowClickedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { GridSetting } from '../../../libs/ag-grid';
import { useAgGridApi } from '../../../hooks';
import useFilters from '../../../hooks/useFilters';
import { useMichulStore } from '../../../stores/useMichulStore';
import { MichulOrderEditPop } from '../../../components/popup/orderTran/Michul/MichulOrderEditPop';
import { MichulReleaseEditPop } from '../../../components/popup/orderTran/Michul/MichulReleaseEditPop';
import { MichulProductTallyPop } from '../../../components/popup/orderTran/Michul/MichulProductTallyPop';
import { MichulCategorySetPop } from '../../../components/popup/orderTran/Michul/MichulCategorySetPop';
import { useCommonStore } from '../../../stores';
import { authApi } from '../../../libs';
import {
  MichulResponseStatusProd,
  MichulResponseStatusRetail,
  MichulResponseAtEachProd,
  AsnMngRequestInsert,
  MichulResponseAtEachRetail,
  DeleteMichul,
  PastLogResponseMisongLogResponse,
  SkuResponsePaging,
} from '../../../generated';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';
import { Utils } from '../../../libs/utils';
import { useAsnMngStore } from '../../../stores/useAsnMngStore';
import TunedGrid from '../../../components/grid/TunedGrid';
import { ConfirmModal } from '../../../components/ConfirmModal';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

/**
 * 미출
 */
const Michul = () => {
  const nowPage = 'oms_michul'; // filter 저장 2025-01-21
  const router = useRouter();
  const { onGridReady } = useAgGridApi();

  const leftGridRef = useRef<AgGridReact>(null);
  const rightGridRef = useRef<AgGridReact>(null);

  const [paging, setPaging, modalType, openModal, closeModal, getMichulOrderDetail, updateMichul, deleteMichuls] = useMichulStore((s) => [
    s.paging,
    s.setPaging,
    s.modalType,
    s.openModal,
    s.closeModal,
    s.getMichulOrderDetail,
    s.updateMichul,
    s.deleteMichuls,
  ]);

  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList, // filter 저장 2025-01-21
    s.setFilterDataList, // filter 저장 2025-01-21
    s.getFilterData, // filter 저장 2025-01-21
  ]);
  const [insertAsnsAsExpect, deleteAsns] = useAsnMngStore((s) => [s.insertAsnsAsExpect, s.deleteAsns]);
  const [isPreView, setIsPreView] = useState<boolean>(false);
  const [michulHist, setMichulHist] = useState<MichulResponseAtEachProd[] | MichulResponseAtEachRetail[]>([]); // 내역
  //  const [isChecked, setIsChecked] = useState(true); // 최초 '상품 미출현황'

  const [filtersAtEachProd, onChangeFiltersAtEachProd, onFiltersAtEachProdReset] = useFilters({
    skuId: undefined,
    workYmd: undefined,
  });

  const [filtersAtEachRetail, onChangeFiltersAtEachRetail] = useFilters({
    sellerId: undefined,
    workYmd: undefined,
  });

  const initialFilters = {
    startDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    prodNm: '',
    sellerNm: '',
    isChecked: true,
  };

  const [filters, onChangeFilters] = useFilters(getFilterData(filterDataList, nowPage) || initialFilters); // filter 저장 2025-01-21

  useEffect(() => {
    console.log('getFilterData(filterDataList, nowPage) ==>', getFilterData(filterDataList, nowPage));
  }, []);

  const {
    data: michulStatusProd,
    isSuccess: isMichulStatusProdSuccess,
    refetch: fetchMichulStatusProd,
  } = useQuery(
    ['/orderTran/michul/prod/status', filters.startDate, filters.endDate],
    () =>
      authApi.get('/orderTran/michul/prod/status', {
        params: filters,
      }),
    {
      enabled: true,
    },
  );

  const {
    data: michulStatusAtEachProd,
    isSuccess: isMichulStatusAtEachProdSuccess,
    refetch: fetchMichulStatusAtEachProd,
  } = useQuery(
    ['/orderTran/michul/prod/statusAtEach'],
    () =>
      authApi.get('/orderTran/michul/prod/statusAtEach', {
        params: {
          skuId: filtersAtEachProd.skuId,
          workYmd: filtersAtEachProd.workYmd,
        },
      }),
    {
      enabled: false,
    },
  );

  const {
    data: michulStatusRetail,
    isSuccess: isMichulStatusRetailSuccess,
    refetch: fetchMichulStatusRetail,
  } = useQuery(
    ['/orderTran/michul/retail/status', filters.startDate, filters.endDate],
    () =>
      authApi.get('/orderTran/michul/retail/status', {
        params: filters,
      }),
    {
      enabled: true,
    },
  );

  const {
    data: michulStatusAtEachRetail,
    isSuccess: isMichulStatusAtEachRetailSuccess,
    refetch: fetchMichulStatusAtEachRetail,
  } = useQuery(
    ['/orderTran/michul/retail/statusAtEach'],
    () =>
      authApi.get('/orderTran/michul/retail/statusAtEach', {
        params: {
          sellerId: filtersAtEachRetail.sellerId,
          workYmd: filtersAtEachRetail.workYmd,
        },
      }),
    {
      enabled: false,
    },
  );

  useEffect(() => {
    if (isMichulStatusProdSuccess) {
      const { resultCode, body, resultMessage } = michulStatusProd.data;
      if (resultCode === 200) {
        console.log('filterDataList 1==>', filterDataList);

        setTimeout(() => {
          leftGridRef.current?.api.ensureIndexVisible(body ? body.length - 1 : 0);
          leftGridRef.current?.api.setFocusedCell(body ? body.length - 1 : 0, 'prodNm');
        }, 0); // 하단 포커스
      } else {
        toastError(resultMessage);
      }
    }
  }, [isMichulStatusProdSuccess, michulStatusProd]);

  useEffect(() => {
    if (isMichulStatusRetailSuccess) {
      const { resultCode, body, resultMessage } = michulStatusRetail.data;
      if (resultCode === 200) {
        console.log('filterDataList 2==>', filterDataList);
        setTimeout(() => {
          leftGridRef.current?.api.ensureIndexVisible(body ? body.length - 1 : 0);
          leftGridRef.current?.api.setFocusedCell(body ? body.length - 1 : 0, 'sellerNm');
        }, 0); // 하단 포커스
      } else {
        toastError(resultMessage);
      }
    }
  }, [isMichulStatusRetailSuccess, michulStatusRetail]);

  /** 컬럼 정의 */
  const StatusProdColumnDefs = useMemo<ColDef<MichulResponseStatusProd>[]>(
    () => [
      { field: 'no', headerName: 'No.', width: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'workYmd', headerName: '미출일자', maxWidth: 80, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'prodNm', headerName: '상품명', maxWidth: 120, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.LEFT },
      { field: 'skuColor', headerName: '컬러', maxWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'skuSize', headerName: '사이즈', maxWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'totSkuCnt', headerName: '수량', maxWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'retailCnt', headerName: '업체수', maxWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      {
        field: 'michulTot',
        headerName: '미출금액',
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      }, // todo 컬럼추가건 데이터 필요 > sum = SKU_CNT x SELL_AMT 작업
      { field: 'minAsnCnt', headerName: 'MOQ', hide: true, maxWidth: 80, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'excessLackCnt', headerName: '과부족', hide: true, maxWidth: 80, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      {
        field: 'ids',
        headerName: '발주',
        maxWidth: 60,
        hide: false,
        suppressHeaderMenuButton: true,
        cellStyle: (param) => {
          const rowData = param.data as MichulResponseStatusProd;
          if (rowData.asnStatCd == '2') {
            /** 발주상태(asnStatCd(10370)) 가 2(발주확정) 인 경우 더 이상 수정할 수 없음 (disable 처리) */
            return {
              backgroundColor: 'e0e0e0',
              color: '#a0a0a0',
              pointerEvents: 'none' /* This makes the cell non-interactive */,
              opacity: '0.5',
              textAlign: 'center',
            };
          } else {
            return GridSetting.CellStyle.CENTER;
          }
        },
        valueFormatter: (params: any) => {
          if (params.data.asnStatCd == '2') {
            /** 발주상태(asnStatCd(10370)) 가 2(발주확정) 인 경우 더 이상 수정할 수 없음 */
            return params.data.workYmd;
          } else {
            if (params.data.asnStatCd == '1') {
              return '▣';
            } else {
              return '□';
            }
          }
        },
        onCellClicked: (e) => {
          if (e.data) {
            const rowData = e.data as MichulResponseStatusProd;
            if (rowData.asnStatCd == '2') {
              /** 발주상태(asnStatCd(10370)) 가 2(발주확정) 인 경우 더 이상 수정할 수 없음 */
            } else {
              if (!rowData.asnStatCd) {
                /** 발주추가 */
                insertAsnsAsExpect([
                  {
                    skuId: rowData.skuId,
                    genCnt: rowData.totSkuCnt,
                    asnOrigin: '미출',
                  },
                ]).then((result) => {
                  const { resultCode, body, resultMessage } = result.data;
                  if (resultCode == 200) {
                    toastSuccess('추가 성공');
                    fetchMichulStatusProd();
                  } else {
                    toastError('발주 추가 중 문제가 발생하였습니다.');
                  }
                });
              } else {
                /** 발주삭제 */
                deleteAsns([
                  {
                    skuId: rowData.skuId,
                  },
                ]).then((result) => {
                  const { resultCode, body, resultMessage } = result.data;
                  if (resultCode == 200) {
                    toastSuccess('삭제 성공');
                    fetchMichulStatusProd();
                  } else {
                    toastError('발주 취소 중 문제가 발생하였습니다.');
                  }
                });
              }
            }
          }
        },
      },
    ],
    [],
  );
  const HistColumnDefs: ColDef<MichulResponseAtEachProd>[] = [
    {
      field: 'no',
      headerName: 'No.',
      minWidth: 45,
      maxWidth: 45,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'workYmd',
      headerName: '미출일자',
      minWidth: 80,
      maxWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      minWidth: 105,
      hide: filters.isChecked, // 업체별일 경우만 상품명이 나온다.
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
    },
    {
      field: 'sellerNm',
      headerName: '소매처',
      maxWidth: 105,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
    },
    {
      field: 'skuCnt',
      headerName: '수량',
      maxWidth: 35,
      minWidth: 35,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      editable: true,
      onCellValueChanged: (event) => {
        console.log(event.data);
        updateMichul({
          id: event.data.id,
          skuCnt: event.newValue,
        }).then((result) => {
          const { resultCode, body, resultMessage } = result.data;
          if (resultCode == 200) {
            toastSuccess('수정되었습니다.');
            fetchMichulStatusProd();
          } else {
            toastError('수정 도중 문제가 발생하였습니다.');
          }
        });
      },
    },
    {
      field: 'michulEtc',
      headerName: '비고',
      minWidth: 150,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
      editable: true,
      onCellValueChanged: (event) => {
        console.log(event.data);
        updateMichul({
          id: event.data.id,
          michulEtc: event.newValue,
        }).then((result) => {
          const { resultCode, body, resultMessage } = result.data;
          if (resultCode == 200) {
            toastSuccess('수정되었습니다.');
            fetchMichulStatusProd();
          } else {
            toastError('수정 도중 문제가 발생하였습니다.');
          }
        });
      },
    },
  ];

  const StatusRetailColumnDefs: ColDef<MichulResponseStatusRetail>[] = [
    {
      field: 'no',
      headerName: 'No.',
      width: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'workYmd',
      headerName: '미출일자',
      maxWidth: 85,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'sellerNm',
      headerName: '소매처',
      maxWidth: 150,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'productCnt',
      headerName: '상품#',
      maxWidth: 85,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'skuCnt',
      headerName: '스큐#',
      maxWidth: 85,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'totSkuCnt',
      headerName: '수량',
      minWidth: 120,
      maxWidth: 120,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
  ];

  interface MichulOrderDetailResponse {
    michulId: number;
    chitNo: number;
    sellerName: string;
    inputDate: string;
    michulItems: Array<{
      productName: string;
      unitPrice: number;
      quantity: number;
      amount: number;
    }>;
    totalCount: number;
    grandTotalAmount: number;
    previousBalance: number;
    dailyTotal: number;
    currentBalance: number;
  }

  // handleGridCellClick 함수를 수정합니다.
  const handleGridCellClick = async (event: CellClickedEvent) => {
    console.log(event.data);
    if (event.data && event.data.id && isPreView) {
      try {
        const response = await getMichulOrderDetail(event.data.id);
        if (response.data.resultCode === 200 && response.data.body) {
          // API 응답 구조를 로그로 확인
          console.log('Michul Order Detail Response:', response.data.body);

          // 응답 데이터를 타입 단언과 함께 매핑
          const responseBody = response.data.body as MichulOrderDetailResponse;
          const mappedOrderDetail = {
            orderId: responseBody.michulId,
            chitNo: responseBody.chitNo,
            sellerName: responseBody.sellerName,
            inputDate: responseBody.inputDate,
            orderItems: responseBody.michulItems.map((item) => ({
              productName: item.productName,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              amount: item.amount,
            })),
            totalCount: responseBody.totalCount,
            grandTotalAmount: responseBody.grandTotalAmount,
            previousBalance: responseBody.previousBalance,
            dailyTotal: responseBody.dailyTotal,
            currentBalance: responseBody.currentBalance,
          };

          //setSelectedOrderDetail(mappedOrderDetail);
        } else {
          toastError(response.data.resultMessage || '상세 정보를 불러오는 데 실패했습니다.');
        }
      } catch (error) {
        console.error('Error fetching michul order detail:', error);
        toastError('상세 정보를 불러오는 데 실패했습니다.');
      }
    }
  };

  const ColorCellRenderer: React.FC<{ value: string; data: any }> = ({ value, data }) => {
    return (
      <div className="custStatCd" style={{ backgroundColor: value, padding: '0 5px', margin: '0 -5px', height: '100%' }}>
        {data.custStatNm}
      </div>
    );
  };

  const frameworkComponents = {
    colorCellRenderer: ColorCellRenderer,
  };

  const handleSwitchChange = (checked: boolean) => {
    onChangeFilters('isChecked', checked);
    if (checked) {
      setTimeout(() => {
        leftGridRef.current?.api.ensureIndexVisible(michulStatusProd?.data.body ? michulStatusProd.data.body.length - 1 : 0);
        leftGridRef.current?.api.setFocusedCell(michulStatusProd?.data.body ? michulStatusProd.data.body.length - 1 : 0, 'prodNm');
      }, 0); // 하단 포커스
    } else {
      setTimeout(() => {
        leftGridRef.current?.api.ensureIndexVisible(michulStatusRetail?.data.body ? michulStatusRetail?.data.body.length - 1 : 0);
        leftGridRef.current?.api.setFocusedCell(michulStatusRetail?.data.body ? michulStatusRetail.data.body.length - 1 : 0, 'sellerNm');
      }, 0); // 하단 포커스
    }
    //onSearch();
  };

  const getStatRowClass = useCallback((params: RowClassParams) => {
    if (params && params.data.custStatClass) {
      return 'ag-grid-' + params.data.custStatClass;
    } else {
      return '';
    }
  }, []);

  const getAtEachRowClass = useCallback((params: RowClassParams) => {
    if (params && params.data.custStatClass) {
      return 'ag-grid-' + params.data.custStatClass;
    } else {
      return '';
    }
  }, []);

  const onLeftRowClicked = (event: RowClickedEvent) => {
    if (filters.isChecked) {
      if (filtersAtEachProd.skuId != event.data.skuId || michulHist.length == 0) {
        onChangeFiltersAtEachProd('skuId', event.data.skuId);
      }
      if (filtersAtEachProd.workYmd != event.data.workYmd) {
        onChangeFiltersAtEachProd('workYmd', event.data.workYmd);
      }
    } else {
      if (filtersAtEachRetail.sellerId != event.data.sellerId || michulHist.length == 0) {
        onChangeFiltersAtEachRetail('sellerId', event.data.sellerId);
      }
      if (filtersAtEachRetail.workYmd != event.data.workYmd) {
        onChangeFiltersAtEachRetail('workYmd', event.data.workYmd);
      }
    }
  };

  // 아래는 row 클릭후 filter 정보 변경시
  useEffect(() => {
    if (filters.isChecked) {
      fetchMichulStatusAtEachProd();
    }
  }, [filtersAtEachProd]);

  useEffect(() => {
    if (!filters.isChecked) {
      fetchMichulStatusAtEachRetail();
    }
  }, [filtersAtEachRetail]);

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    // 필터 초기화
    //onFiltersReset(); //먹지 않아서 강제로 셑팅
    // Object.entries(initialFilters).forEach(([key, value]) => onChangeFilters(key, value));
    onChangeFilters('startDate', dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
    onChangeFilters('endDate', dayjs().format('YYYY-MM-DD'));
    onChangeFilters('prodNm', '');
    onChangeFilters('sellerNm', '');
    onChangeFilters('isChecked', true);
  };

  const onSearch = () => {
    onChangeFilters('sellerId', 0); // 주문에서 클릭으로 넘어온게 아니면 null 로 셑팅한다.
    setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
    setTimeout(async () => {
      if (filters.isChecked) {
        fetchMichulStatusProd();
      } else {
        fetchMichulStatusRetail();
      }
    }, 200);
  };

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} search={onSearch} reset={reset} filters={filters} />
      <Search className="type_2">
        <CustomNewDatePicker
          type={'range'}
          title={'기간'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onChange={onChangeFilters}
          filters={filters}
          defaultType={'type'}
        />
        <Search.Input
          title={'상품명'}
          name={'prodNm'}
          placeholder={'상품명 검색'}
          value={filters.prodNm}
          onChange={onChangeFilters}
          onEnter={() => {
            onChangeFilters('startDate', Utils.getStartDayDefault());
            onChangeFilters('endDate', dayjs().format('YYYY-MM-DD'));
            onSearch();
          }}
          filters={filters}
        />
        <Search.Input
          title={'소매처명'}
          name={'sellerNm'}
          placeholder={'소매처명 검색'}
          value={filters.sellerNm}
          onChange={onChangeFilters}
          onEnter={onSearch}
          filters={filters}
        />
        <Search.Switch
          title={'상품/업체'}
          name={'ProductOrSeller'}
          checkedLabel={'상품'}
          uncheckedLabel={'업체'}
          onChange={(e, value) => {
            handleSwitchChange(value);
          }}
          onEnter={onSearch}
          value={filters.isChecked}
        />
      </Search>

      <div className="layoutBox">
        {/* 왼쪽 */}
        <div className="layout60">
          <h4 className="smallTitle line between">
            <div className="left">{filters.isChecked ? '상품 미출현황' : '업체 미출현황'}</div>
          </h4>
          <div className="gridBox">
            {filters.isChecked && isMichulStatusProdSuccess && (
              <TunedGrid
                ref={leftGridRef}
                onGridReady={onGridReady}
                components={frameworkComponents}
                rowData={(michulStatusProd?.data.body as MichulResponseStatusProd[]) || []}
                columnDefs={StatusProdColumnDefs}
                paginationPageSize={paging.pageRowCount}
                onRowClicked={(event) => {
                  onLeftRowClicked(event);
                }}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                getRowClass={getStatRowClass}
                singleClickEdit={true}
                //suppressRowClickSelection={false}
                className={'michul check'}
              />
            )}
            {!filters.isChecked && isMichulStatusRetailSuccess && (
              <TunedGrid
                ref={leftGridRef}
                onGridReady={onGridReady}
                components={frameworkComponents}
                rowData={(michulStatusRetail?.data.body as MichulResponseStatusRetail[]) || []}
                columnDefs={StatusRetailColumnDefs}
                paginationPageSize={paging.pageRowCount}
                onRowClicked={(event) => {
                  onLeftRowClicked(event);
                }}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                getRowClass={getStatRowClass}
                singleClickEdit={true}
                suppressRowClickSelection={false}
                className={'michul'}
              />
            )}
            <div className="btnArea">
              <CustomShortcutButton
                className="btn"
                title="내역삭제"
                shortcut={COMMON_SHORTCUTS.ctrlZ}
                onClick={() => {
                  const selectedNodes = leftGridRef.current?.api.getSelectedNodes();
                  if (selectedNodes && selectedNodes.length > 0) {
                    openModal('CONFIRM_DELETE_ATEACH');
                  } else {
                    toastError('하나 이상의 행을 선택 후 재시도하십시요.');
                  }
                }}
              >
                내역삭제
              </CustomShortcutButton>
              {/*<CustomShortcutButton*/}
              {/*  className="btn"*/}
              {/*  title="전체선택"*/}
              {/*  shortcut={COMMON_SHORTCUTS.gridUnder1}*/}
              {/*  onClick={() => {*/}
              {/*    leftGridRef.current?.api.selectAll();*/}
              {/*  }}*/}
              {/*>*/}
              {/*  전체선택*/}
              {/*</CustomShortcutButton>*/}
              {/*<CustomShortcutButton*/}
              {/*  className={'btn ' + (!filters.isChecked ? 'btnGray disabled' : '')}*/}
              {/*  disabled={!filters.isChecked}*/}
              {/*  title="발주예정"*/}
              {/*  shortcut={COMMON_SHORTCUTS.gridUnder2}*/}
              {/*  onClick={() => {*/}
              {/*    //선택된 노드를 발주예정으로 처리*/}
              {/*    const selectedNodes = leftGridRef.current?.api.getSelectedNodes();*/}
              {/*    if (selectedNodes && selectedNodes.length != 0) {*/}
              {/*      for (let i = 0; i < selectedNodes.length; i++) {*/}
              {/*        if (selectedNodes[i].data.asnStatCd == '2') {*/}
              {/*          /** 발주상태(asnStatCd(10370)) 가 2(발주확정) 인 경우 더 이상 수정할 수 없음 */}
              {/*          toastError('발주확정 데이터는 수정할 수 없습니다.');*/}
              {/*          return;*/}
              {/*        }*/}
              {/*      }*/}
              {/*      openModal('CONFIRM_REGISTER_ASN');*/}
              {/*    } else {*/}
              {/*      toastError('하나 이상의 행을 선택하십시요.');*/}
              {/*    }*/}
              {/*  }}*/}
              {/*>*/}
              {/*  발주예정*/}
              {/*</CustomShortcutButton>*/}
            </div>
          </div>
        </div>
        {/* 오른쪽 */}
        <div className="layout40">
          <h4 className="smallTitle line between">
            <div className="left">{filters.isChecked ? '상품 미출내역' : '업체 미출내역'}</div>
          </h4>
          <div className="gridBox">
            {filters.isChecked && isMichulStatusAtEachProdSuccess && (
              <TunedGrid
                ref={rightGridRef}
                onGridReady={onGridReady}
                components={frameworkComponents}
                rowData={(michulStatusAtEachProd?.data.body as MichulResponseAtEachProd[]) || []}
                columnDefs={HistColumnDefs}
                paginationPageSize={paging.pageRowCount}
                onCellClicked={handleGridCellClick}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                onCellKeyDown={(e) => {
                  console.log('e==>', e);
                  //if(e.data)
                }}
                getRowClass={getAtEachRowClass}
                className={'michul'}
              />
            )}
            {!filters.isChecked && isMichulStatusAtEachRetailSuccess && (
              <TunedGrid
                ref={rightGridRef}
                onGridReady={onGridReady}
                components={frameworkComponents}
                rowData={(michulStatusAtEachRetail?.data.body as MichulResponseAtEachRetail[]) || []}
                columnDefs={HistColumnDefs}
                paginationPageSize={paging.pageRowCount}
                onCellClicked={handleGridCellClick}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                onCellKeyDown={(e) => {
                  console.log('e==>', e);
                  //if(e.data)
                }}
                getRowClass={getAtEachRowClass}
                className={'michul'}
              />
            )}
            <div className="btnArea"></div>
          </div>
        </div>
      </div>
      <ConfirmModal
        title={'<div class="confirmMsg arrows"><div class="top"><span>미출상품을</span><em>옆</em><span>발주예정으로</span></div>이동시키겠어요?</div>'}
        open={modalType.type === 'CONFIRM_REGISTER_ASN' && modalType.active}
        onConfirm={() => {
          const asExpect: AsnMngRequestInsert[] = [];
          const selectedNodes = leftGridRef.current?.api.getSelectedNodes();
          if (selectedNodes) {
            for (let i = 0; i < selectedNodes.length; i++) {
              if (selectedNodes[i].data.asnStatCd != '1') {
                // 발주예정 상태가 아닌 데이터에 한하여 요청 배열에 추가(확정 데이터는 모달 출력에서 걸러짐)
                asExpect[asExpect.length] = {
                  skuId: selectedNodes[asExpect.length].data.skuId,
                  genCnt: selectedNodes[asExpect.length].data.totSkuCnt,
                  asnOrigin: '미출',
                };
              }
            }
            insertAsnsAsExpect(asExpect).then((result) => {
              const { resultCode, body, resultMessage } = result.data;
              if (resultCode == 200) {
                toastSuccess('발주 추가 성공');
                fetchMichulStatusProd();
              } else {
                toastError('발주 추가 중 문제가 발생하였습니다.');
              }
            });
          }
        }}
        onClose={() => {
          closeModal('CONFIRM_REGISTER_ASN');
        }}
      />
      <ConfirmModal
        title={`<div class="confirmMsg"><span class="small">선택된 ${
          leftGridRef.current && leftGridRef.current.api && leftGridRef.current.api.getSelectedNodes() ? leftGridRef.current.api.getSelectedNodes().length : 0
        }개의 ${filters.isChecked ? '상품' : '업체'}별 미출내역을</span><span class="big"><strong>삭제처리</strong>&nbsp;하시겠어요?</span></div> `}
        open={modalType.type === 'CONFIRM_DELETE_ATEACH' && modalType.active}
        onConfirm={() => {
          const selectedNodes = leftGridRef.current?.api.getSelectedNodes();
          if (selectedNodes && selectedNodes.length > 0) {
            const deleteMichulList: DeleteMichul[] = [];
            for (let i = 0; i < selectedNodes.length; i++) {
              console.log('selectedNodes', selectedNodes[i].data.ids);
              if (selectedNodes[i].data.ids) {
                selectedNodes[i].data.ids.split(',').forEach((id: string) => {
                  deleteMichulList.push({
                    id: Number(id.trim()), // 문자열을 숫자로 변환, 공백 제거
                  });
                });
              }
            }
            deleteMichuls(deleteMichulList).then((result) => {
              const { resultCode, body, resultMessage } = result.data;
              if (resultCode == 200) {
                toastSuccess('삭제 성공');
                filters.isChecked ? fetchMichulStatusAtEachProd() : fetchMichulStatusAtEachRetail();
                fetchMichulStatusProd().then((r) => console.log('삭제 성공'));
              } else {
                toastError(resultMessage);
              }
            });
          }
        }}
        onClose={() => {
          closeModal('CONFIRM_DELETE_ATEACH');
        }}
      />
      {modalType?.type === 'ORDEREDIT' && modalType.active && <MichulOrderEditPop />}
      {modalType?.type === 'RELEASEEDIT' && modalType.active && <MichulReleaseEditPop />}
      {modalType?.type === 'PRODUCTTALLY' && modalType.active && <MichulProductTallyPop />}
      {modalType?.type === 'CATEGORYSETTING' && modalType.active && <MichulCategorySetPop />}
    </div>
  );
};

export default Michul;
