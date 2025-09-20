import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Title, toastSuccess } from '../../../components';
import { TableHeader, toastError } from '../../../components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CellEditingStoppedEvent, ColDef, IRowNode, RowClassParams, SelectionChangedEvent } from 'ag-grid-community';
import { AgGridReact, CustomCellRendererProps } from 'ag-grid-react';
import { GridSetting } from '../../../libs/ag-grid';
import { useAgGridApi } from '../../../hooks';
import useFilters from '../../../hooks/useFilters';
import { useSampleStore } from '../../../stores/useSampleStore';
import { SampleOrderEditPop } from '../../../components/popup/orderTran/Sample/SampleOrderEditPop';
import { SampleReleaseEditPop } from '../../../components/popup/orderTran/Sample/SampleReleaseEditPop';
import { SampleProductTallyPop } from '../../../components/popup/orderTran/Sample/SampleProductTallyPop';
import { SampleCategorySetPop } from '../../../components/popup/orderTran/Sample/SampleCategorySetPop';
import { useCommonStore } from '../../../stores';
import { authApi } from '../../../libs';
import {
  SampleResponsePaging,
  SampleInfoResponse,
  SampleRequestDeleteMoreOnce,
  SampleRequestRetrieve,
  SampleRequestRetrieveCancel,
  SampleRequestRetrieveAndReturn,
  RetailComboResponse,
} from '../../../generated';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { Utils } from '../../../libs/utils';
import { SampleElementDetPop } from '../../../components/popup/orderTran/Sample/SampleElementDetPop';
import DropDownAtom from '../../../components/atom/DropDownAtom';
import dayjs, { Dayjs } from 'dayjs';
import PrintLayout from '../../../components/print/PrintLayout';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useRouter } from 'next/router';
import TunedGrid from '../../../components/grid/TunedGrid';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import CustomNewDatePicker, { CustomNewDatePickerRefInterface } from '../../../components/CustomNewDatePicker';
import { useSession } from 'next-auth/react';
import { useOrderStore } from '../../../stores/useOrderStore';
import { ProductStatus } from '../../../libs/const';

/**
 * 샘플
 */
const Sample = () => {
  const nowPage = 'oms_sample'; // filter 저장 2025-01-21
  const session = useSession();
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');
  const router = useRouter();
  const { onGridReady } = useAgGridApi();

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData, selectedRetailInCommon, setSelectedRetailInCommon] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList, // filter 저장 2025-01-21
    s.setFilterDataList, // filter 저장 2025-01-21
    s.getFilterData, // filter 저장 2025-01-21
    s.selectedRetail,
    s.setSelectedRetail,
  ]);

  const [
    modalType,
    openModal,
    closeModal,
    setSelectedSample,
    getSampleOrderDetail,
    retrieveSample,
    retrieveCancelSample,
    retrieveAndReturnSample,
    deleteSamples,
    getSampleInfo,
    getSampleNotCollected,
  ] = useSampleStore((s) => [
    s.modalType,
    s.openModal,
    s.closeModal,
    s.setSelectedSample,
    s.getSampleOrderDetail,
    s.retrieveSample,
    s.retrieveCancelSample,
    s.retrieveAndReturnSample,
    s.deleteSamples,
    s.getSampleInfo,
    s.getSampleNotCollected,
  ]);

  const [setOrder, setOrderDetList, updateOrderDetEtc] = useOrderStore((s) => [s.setOrder, s.setOrderDetList, s.updateOrderDetEtc]);

  const { mutate: updateOrderDetEtcMutate } = useMutation(updateOrderDetEtc, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('비고가 변경되었습니다.');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  const initialFilters = {
    startDate: Utils.getStartDayBefore3Month(), // 최초 3개월 전 부터 본다.
    endDate: today,
    sellerId: '',
    sellerNm: '',
    prodNm: '',
    searchType: 'A',
  };

  const [filters, onChangeFilters] = useFilters(getFilterData(filterDataList, nowPage) || initialFilters); // filter 저장 2025-01-21

  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any[]>([]); // 합계데이터 만들기
  const [columnDefs, setColumnDefs] = useState<ColDef<SampleResponsePaging>[]>([]);
  const [isPreView, setIsPreView] = useState<boolean>(false);
  const [retailListCombo, setRetailListCombo] = useState<RetailComboResponse[]>([]);

  const [sampleList, setSampleList] = useState<SampleResponsePaging[]>([]); /** 최초 fetch 이후로 sampleOrders 와 별도의 데이터로 다루어짐 */

  const gridRef = useRef<AgGridReact>(null);
  const previewRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<CustomNewDatePickerRefInterface | null>(null);

  const {
    data: sampleOrders,
    isLoading: isSampleOrders,
    isSuccess: isSampleFetchSuccess,
    refetch: fetchSampleOrders,
  } = useQuery({
    queryKey: ['/orderTran/sample', filters.searchType, filters.startDate, filters.endDate, filters.sellerId],
    queryFn: (): any =>
      authApi.get('/orderTran/sample', {
        params: {
          ...filters,
        },
      }),
  });

  useEffect(() => {
    if (isSampleFetchSuccess) {
      const { resultCode, body, resultMessage } = sampleOrders.data;
      if (resultCode === 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
        setSampleList(JSON.parse(JSON.stringify(body)) || []);

        /** sample 데이터 refetch 시 동기화*/
        const forRetail: { id: number | undefined; retailNm: string | undefined } = {
          id: undefined,
          retailNm: undefined,
        };
        const forWorkYmd: { id: number | undefined; workYmd: string | undefined } = {
          id: undefined,
          workYmd: undefined,
        };
        const forProdNm: { id: number | undefined; prodNm: string | undefined } = {
          id: undefined,
          prodNm: undefined,
        };
        const ids: number[] = [];
        const retails: string[] = []; // 소매처 이름 목록(여러번 등장하였는지 여부와 관계없이 각각 하나의 값만 저장됨(고윳값))
        const workYmds: string[] = []; // 일시 목록(여러번 등장하였는지 여부와 관계없이 각각 하나의 값만 저장됨(고윳값))
        const prodNms: string[] = []; // 상품명 목록(여러번 등장하였는지 여부와 관계없이 각각 하나의 값만 저장됨(고윳값))
        const respondedRows = JSON.parse(JSON.stringify(body || [])); // 그리드 전역상태(sampleList)에 본 값을 사용할 시 간섭으로 인하여 오리지널 데이터가 보존되지 않을 가능성이 존재

        for (let i = 0; i < respondedRows.length; i++) {
          if (respondedRows[i].id && !isAlreadyExist<number>(ids, respondedRows[i].id as number)) {
            if (respondedRows[i].id) {
              ids[ids.length] = respondedRows[i].id as number;
            } else {
              console.log('id를 찾을 수 없음');
            }
          }
          if (respondedRows[i].sellerNm && !isAlreadyExist<string>(retails, respondedRows[i].sellerNm as string)) {
            if (respondedRows[i].sellerNm) {
              retails[retails.length] = respondedRows[i].sellerNm as string;
            } else {
              console.log('소매처명을 찾을 수 없음');
            }
          }
          if (respondedRows[i].workYmd && !isAlreadyExist<string>(workYmds, respondedRows[i].workYmd as string)) {
            if (respondedRows[i].workYmd) {
              workYmds[workYmds.length] = respondedRows[i].workYmd as string;
            } else {
              console.log('샘플일시를 찾을 수 없음');
            }
          }
          if (respondedRows[i].prodNm && !isAlreadyExist<string>(prodNms, respondedRows[i].prodNm as string)) {
            if (respondedRows[i].prodNm) {
              prodNms[prodNms.length] = respondedRows[i].prodNm as string;
            } else {
              console.log('상품명을 찾을 수 없음');
            }
          }
        }
        // row 클릭시 데이터 가져올때 깜빡임 방지 하기 위해서 추가 했으나 별 효과 없음
        if (columnDefs && [].length === 0) {
          setColumnDefs([
            {
              headerCheckboxSelection: true,
              checkboxSelection: true,
              filter: false,
              sortable: false,
              minWidth: 30,
              suppressHeaderMenuButton: true,
              hide: true,
            },
            {
              field: 'orderId',
              headerName: 'ID',
              minWidth: 60,
              suppressHeaderMenuButton: true,
              cellStyle: GridSetting.CellStyle.CENTER,
              hide: true,
            },
            {
              field: 'workYmd',
              headerName: '샘플일자',
              minWidth: 80,
              suppressHeaderMenuButton: true,
              cellStyle: GridSetting.CellStyle.CENTER,
              resizable: true,
            },
            {
              field: 'returnYmd',
              headerName: '회수일자',
              minWidth: 90,
              suppressHeaderMenuButton: true,
              cellStyle: GridSetting.CellStyle.CENTER,
            },
            {
              field: 'sellerNm',
              headerName: '소매처',
              minWidth: 100,
              suppressHeaderMenuButton: true,
              cellStyle: GridSetting.CellStyle.LEFT,
            },
            {
              field: 'prodNm',
              headerName: '상품명',
              minWidth: 100,
              suppressHeaderMenuButton: true,
              cellStyle: GridSetting.CellStyle.LEFT,
            },
            {
              field: 'skuColor',
              headerName: '컬러',
              minWidth: 50,
              suppressHeaderMenuButton: true,
              cellStyle: GridSetting.CellStyle.CENTER,
            },
            {
              field: 'skuSize',
              headerName: '사이즈',
              minWidth: 50,
              suppressHeaderMenuButton: true,
              cellStyle: GridSetting.CellStyle.CENTER,
            },
            {
              field: 'totAmt',
              headerName: '거래금액',
              minWidth: 70,
              suppressHeaderMenuButton: true,
              cellStyle: GridSetting.CellStyle.RIGHT,
              cellRenderer: (params: any) => {
                if (params.node.rowPinned === 'bottom') {
                  return '';
                } else {
                  return Utils.setComma(params.value);
                }
              },
            },
            {
              field: 'sampleCnt',
              headerName: '샘플',
              minWidth: 50,
              suppressHeaderMenuButton: true,
              cellStyle: GridSetting.CellStyle.RIGHT,
              valueFormatter: (params) => {
                return Utils.setComma(params.value);
              },
            },
            {
              field: 'returnCnt',
              headerName: '회수',
              minWidth: 50,
              suppressHeaderMenuButton: true,
              cellStyle: GridSetting.CellStyle.RIGHT,
              valueFormatter: (params) => {
                return Utils.setComma(params.value);
              },
              editable: true,
              cellEditor: 'agTextCellEditor',
              cellClass: (params) => {
                return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
              },
              onCellValueChanged: (event) => {
                console.log(event.node?.rowIndex);
              },
            },
            /*{
              field: 'soldCnt',
              headerName: '판매',
              minWidth: 50,
              suppressHeaderMenuButton: true,
              cellStyle: (cellClassParams) => {
                for (let i = 0; i < respondedRows.length; i++) {
                  if (respondedRows[i].orderDetId == cellClassParams.data?.orderDetId && cellClassParams.value != respondedRows[i].soldCnt) {
                    // 주문상세 id가 오리지널 샘플 목록의 요소 중 하나와 일치하며 오리지널 값과 같지 않을 경우 대응하는 스타일 반환
                    return { ...GridSetting.CellStyle.RIGHT, backgroundColor: 'lightgreen' };
                  }
                }
                return { ...GridSetting.CellStyle.RIGHT };
              },
              valueFormatter: (params) => {
                return Utils.setComma(params.value);
              },
              editable: true,
              cellEditor: 'agTextCellEditor',
              cellClass: (params) => {
                return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
              },
            },*/
            {
              field: 'nowCnt',
              headerName: '잔량',
              minWidth: 50,
              suppressHeaderMenuButton: true,
              cellStyle: GridSetting.CellStyle.RIGHT,
              valueFormatter: (params) => {
                return Utils.setComma(params.value);
              },
            },
            {
              field: 'period',
              headerName: '경과일',
              filter: true,
              minWidth: 50,
              suppressHeaderMenuButton: true,
              cellStyle: GridSetting.CellStyle.CENTER,
            },
            {
              field: 'userNm',
              headerName: '사용자',
              minWidth: 70,
              suppressHeaderMenuButton: true,
              cellStyle: GridSetting.CellStyle.CENTER,
            },
            {
              field: 'orderDetEtc',
              headerName: '비고',
              minWidth: 70,
              suppressHeaderMenuButton: true,
              cellStyle: GridSetting.CellStyle.LEFT,
              editable: true,
            },
            {
              field: undefined,
              headerName: '상세보기',
              minWidth: 70,
              suppressHeaderMenuButton: true,
              cellStyle: GridSetting.CellStyle.CENTER,
              hide: true,
              cellRenderer: (params: CustomCellRendererProps) => {
                if (params.node.rowPinned === 'bottom') {
                  return '';
                } else {
                  return (
                    <button className={'tblBtn'} style={{ width: '100%' }}>
                      상세보기
                    </button>
                  );
                }
              },
              onCellClicked: (event) => {
                setSelectedSample(event.data);
                openModal('DETAIL');
              },
            },
            /*{
              field: 'remark',
              headerName: '비고',
              minWidth: 60,
              suppressHeaderMenuButton: true,
              cellStyle: GridSetting.CellStyle.LEFT,
            },*/
          ]);
        }

        // 합계 데이터 시작
        if (body && body.length > 0) {
          const { nowCntTotal, sampleCountTotal, returnCountTotal } = body.reduce(
            (
              acc: {
                nowCntTotal: number;
                sampleCountTotal: number;
                returnCountTotal: number;
              },
              data: SampleResponsePaging,
            ) => {
              return {
                nowCntTotal: acc.nowCntTotal + (data.nowCnt ? data.nowCnt : 0),
                sampleCountTotal: acc.sampleCountTotal + (data.sampleCnt ? data.sampleCnt : 0),
                returnCountTotal: acc.returnCountTotal + (data.returnCnt ? data.returnCnt : 0),
              };
            },
            {
              nowCntTotal: 0,
              sampleCountTotal: 0,
              returnCountTotal: 0,
            }, // 초기값 설정
          );

          setPinnedBottomRowData([
            {
              totAmt: undefined,
              nowCnt: nowCntTotal,
              sampleCnt: sampleCountTotal,
              returnCnt: returnCountTotal,
            },
          ]);
        }

        // 마지막 포커스row 가 보일수 있게 이동
        const lastDisp = body.length;
        if (lastDisp > 10) {
          setTimeout(() => {
            gridRef.current?.api.ensureIndexVisible(lastDisp - 1);
            gridRef.current?.api.setFocusedCell(lastDisp - 1, 'prodNm');
            //lastCellPosition.current = null;
            //gridRef.current?.api.clearFocusedCell();
          }, 100);
        }
      } else {
        toastError('페이지 조회 도중 문제가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [sampleOrders, isSampleFetchSuccess]);

  useEffect(() => {
    if (
      router.asPath.split('?').length == 2 &&
      router.asPath.split('?')[1] == selectedRetailInCommon?.id?.toString() &&
      !isNaN(Number(router.asPath.split('?')[1]))
    ) {
      // 경로변수가 존재하며, 경로변수의 값이 전역 상태 소매처의 id 와 같으며, 값이 nan 이 아닐 경우
      onChangeFilters('sellerId', selectedRetailInCommon.id);
      onChangeFilters('sellerNm', selectedRetailInCommon.sellerNm || ''); // 소매처명 필터도 이에 맞추어 동기화
    }
  }, [onChangeFilters, router.asPath]);

  /** 프린트 관련 조회 */
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any>(null);
  interface SampleOrderDetailResponse {
    sampleId: number;
    partnerId: number;
    chitNo: number;
    jangGgiCnt: number;
    sellerName: string;
    sellerId: number;
    inputDate: string;
    payType: string;
    orderEtc: string;
    sampleItems: Array<{
      productName: string;
      unitPrice: number;
      quantity: number;
      amount: number;
      prodId: number;
    }>;
    totalCount: number;
    grandTotalAmount: number;
    previousBalance: number;
    dailyTotal: number;
    currentBalance: number;
    sampleInfo: SampleData;
    sampleNotCollected: SampleNotCollected[];
  }
  interface SampleData {
    chitNo: number;
    sellerNm: string;
    workYmdFormated: string;
    tranDate: string;
    totalCount: number;
    jangGgiCnt: number;
    sampleNotReturnCount: number;
    sampleNotReturnList: SampleInfoDet[];
    sampleReturnCount: number;
    sampleReturnList: SampleInfoDet[];
    sampleSailCount: number;
    sampleSailList: SampleInfoDet[];
  }
  interface SampleInfoDet {
    skuNm: string;
    sampleCnt: number;
    baseAmt: number;
    workYmdFormated: string;
    tranDate: string;
    totSkuCnt: number; // 전체 건수
    totAmt: number; // 총 주문금액
    cashAmt: number; // 총 현금입금액
    accountAmt: number; // 총 계좌 입금액
  }
  interface SampleNotCollected {
    SampleNotCollectedList: SampleNotCollectedItem[];
    totSkuCnt: number; // 전체 건수
    totOrderAmt: number; // 총 액수
  }
  interface SampleNotCollectedItem {
    id: number;
    skuNm: string;
    sampleCnt: number;
    baseAmt: number;
    workYmdFormated: string;
    tranDate: string;
  }

  // 그리드 선택 상태가 변경될 때 호출되는 함수
  const onSelectionChanged = async (event: SelectionChangedEvent) => {
    const focusedCell = event.api.getFocusedCell(); // 현재 포커스된 셀 정보
    if (focusedCell?.column.getColId() != 'soldCnt') {
      // 선택된 노드 가져오기
      const selectedNodes = event.api.getSelectedNodes();
      // 선택된 노드에서 orderId만 추출하고 중복 제거
      const newSelectedOrderIds = Array.from(new Set(selectedNodes.map((node) => node.data.orderId).filter((id) => id !== undefined)));
      const newSelectedSellerIds = Array.from(new Set(selectedNodes.map((node) => node.data.sellerId).filter((sellerId) => sellerId !== undefined)));

      if (newSelectedOrderIds.length > 0 && newSelectedSellerIds.length > 0) {
        await fetchOrderDetails(newSelectedSellerIds, newSelectedOrderIds);
      }
    }
  };

  const fetchOrderDetails = async (newSelectedSellerIds: string[], selectedOrderIds: number[]) => {
    try {
      const fetchPromises = selectedOrderIds.map(async (orderId, index) => {
        const [sampleOrderResult, sampleInfoResult, sampleNotCollectedResult] = await Promise.all([
          getSampleOrderDetail(orderId),
          getSampleInfo(orderId),
          getSampleNotCollected(parseInt(newSelectedSellerIds[index]), filters),
        ]);

        if (sampleOrderResult.data.resultCode !== 200) {
          throw new Error(`${sampleOrderResult.data.resultMessage} (샘플주문 상세 조회)`);
        }
        if (sampleInfoResult.data.resultCode !== 200) {
          throw new Error(`${sampleInfoResult.data.resultMessage} (샘플현황 조회)`);
        }
        if (sampleNotCollectedResult.data.resultCode !== 200) {
          throw new Error(`${sampleNotCollectedResult.data.resultMessage} (미회수 조회 영역)`);
        }

        // 필요한 데이터 추출
        const sampleOrderDet = sampleOrderResult.data.body as SampleOrderDetailResponse;
        const sampleInfoBody = sampleInfoResult.data.body as SampleInfoResponse;
        const notCollectedBody = sampleNotCollectedResult.data.body;

        // 결과 반환
        return {
          orderId: sampleOrderDet.sampleId,
          sellerId: sampleOrderDet.sellerId,
          partnerId: sampleOrderDet.partnerId,
          chitNo: sampleOrderDet.chitNo,
          sellerName: sampleOrderDet.sellerName,
          inputDate: sampleOrderDet.inputDate,
          payType: sampleOrderDet.payType,
          orderEtc: sampleOrderDet.orderEtc,
          jangGgiCnt: sampleOrderDet.jangGgiCnt,
          sampleItems: sampleOrderDet.sampleItems.map((item) => ({
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            amount: item.amount,
            prodId: item.prodId,
          })),
          totalCount: sampleOrderDet.totalCount,
          grandTotalAmount: sampleOrderDet.grandTotalAmount,
          previousBalance: sampleOrderDet.previousBalance,
          dailyTotal: sampleOrderDet.dailyTotal,
          currentBalance: sampleOrderDet.currentBalance,
          sampleInfo: sampleInfoBody,
          sampleNotCollected: notCollectedBody,
        };
      });

      const allData = await Promise.all(fetchPromises);
      setSelectedOrderDetail(allData);
    } catch (error) {
      console.error('Error fetching sample order details:', error);
    }
  };

  // 프린트 버튼
  const [isPrinting, setIsPrinting] = useState(false);
  const handlePrintClick = async () => {
    if (!isPreView) {
      // 미리보기 off되어있으면 실행X
      return;
    }
    setIsPrinting(true);
  };

  /** array 내부에 comparedValue 에 대응되는 값이 존재하는지 확인 */
  function isAlreadyExist<T>(array: T[], comparedValue: T) {
    if (array.length == 0) {
      return false;
    } else {
      for (let j = 0; j < array.length; j++) {
        if (array[j] == comparedValue) {
          return true;
        }
      }
      return false;
    }
  }

  //useEffect(() => {}, [isSampleFetchSuccess, sampleOrders]);

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

  // 검색 버튼 클릭 또는 엔터 키 입력 시 실행
  const onSearch = async () => {
    onChangeFilters('sellerId', 0); // 소매처 id 초기화를 생략할 시 본 값으로 인한 조건 간섭으로 적절한 값이 출력되지 않을 우려
    await fetchSampleOrders();
  };

  // 모든 거래처 조회
  const { data: retailComboData, isSuccess: isRetailListCombo } = useQuery({
    queryKey: ['/retail/listForCombo'],
    queryFn: () =>
      authApi.get('/retail/listForCombo', {
        params: {},
      }),
    enabled: true,
  });

  useEffect(() => {
    if (isRetailListCombo) {
      setRetailListCombo(retailComboData.data.body);
    }
  }, [isRetailListCombo, retailComboData]);

  // 전표 옵션 체인지
  const [optionType, setOptionType] = useState();
  const [optValue, setOptValue] = useState('sample');
  const handleVoucherOption = (value: any) => {
    setOptionType(value);
    setOptValue(value);
  };

  useEffect(() => {
    handleVoucherOption('sample');
  }, []);

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    // 필터 초기화
    onChangeFilters('startDate', dayjs(today).subtract(1, 'month').startOf('month').format('YYYY-MM-DD'));
    onChangeFilters('endDate', today);
    onChangeFilters('sellerNm', '');
    onChangeFilters('prodNm', '');
    onChangeFilters('searchType', 'A');
    datePickerRef.current?.initDatePicker('type', dayjs(today).subtract(1, 'month').startOf('month'), dayjs(today));
  };

  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params && params.data.rowNum && params.data.rowNum > 0) {
      rtnValue = rtnValue ? rtnValue + ' ag-grid-changeOrder' : 'ag-grid-changeOrder';
    }

    if (params.node.rowPinned === 'bottom') {
      // 합계 행 스타일링
      rtnValue = rtnValue ? rtnValue + ' ag-grid-pinned-row' : 'ag-grid-pinned-row';
    }

    return rtnValue;
  }, []);

  const onCellEditingStoppedFn = (event: CellEditingStoppedEvent<SampleResponsePaging, any>) => {
    //const eventTriggeredRowIndex = event.rowIndex as number;
    //    const fetchedSampleOrders: SampleResponsePaging[] = sampleOrders.data.body || [];
    //    const displayedSampleRows = sampleList;
    const editedSampleRow: SampleResponsePaging | undefined = event.data;
    if (event.column.getColId() == 'returnCnt' && event.newValue != event.oldValue) {
      if (editedSampleRow?.sampleCnt && event.newValue > editedSampleRow.sampleCnt) {
        toastError('"회수" 의 값은 "현재고" 보다 클 수 없습니다.');
        event.node.setDataValue('returnCnt', event.oldValue);
      } else {
        if (editedSampleRow) {
          retrieveSample([{ jobDetId: editedSampleRow.jobDetId, retrieveCnt: event.newValue }]).then((result) => {
            const { resultCode, resultMessage } = result.data;
            if (resultCode == 200) {
              if (resultMessage != '') {
                toastSuccess(resultMessage);
              } else if (event.newValue == editedSampleRow.sampleCnt) {
                toastSuccess('전 상품이 회수 처리되었습니다.');
              } else {
                toastSuccess(event.newValue + '개의 상품이 회수 처리되었습니다.');
              }
              fetchSampleOrders();
            } else {
              toastError(resultMessage || '회수 처리 도중 문제가 발생하였습니다.');
              setTimeout(() => {
                fetchSampleOrders();
              }, 2000);
            }
          });
        }
      }
    } /*else if (event.column.getColId() == 'soldCnt' && event.newValue != event.oldValue) {
      if (event.rowIndex != null) {
        if (targetRowsSelector(displayedSampleRows, 'soldCnt')[0].sellerId != editedSampleRow?.sellerId) {
          toastError('동일한 소매처가 아닌 경우 변경할 수 없습니다.');
          event.node.setDataValue('soldCnt', event.oldValue);
        } else if (event.newValue < (fetchedSampleOrders[event.rowIndex].soldCnt || 0)) {
          toastError('"판매" 값에는 기존 값보다 작은 값을 입력할 수 없습니다.');
          event.node.setDataValue('soldCnt', event.oldValue);
        } else if (editedSampleRow?.nowCnt && event.newValue > editedSampleRow.nowCnt) {
          toastError('"판매" 의 값은 "현재고" 보다 클 수 없습니다.');
          event.node.setDataValue('soldCnt', event.oldValue);
        } else {
          setSampleList((sampleList) => {
            for (let i = 0; i < sampleList.length; i++) {
              if (sampleList[i].orderDetId == event.data?.orderDetId) {
                sampleList[i].soldCnt = event.newValue;
              }
            }
            return [...sampleList];
          });
        }
      }
    }*/
  };

  /*const targetRowsSelector = useCallback(
    (sampleListStatus: any[], colKey: string) => {
      const targetRows: SampleResponsePaging[] = [];
      const fetchedSampleOrders: any[] = sampleOrders.data.body || [];
      for (let i = 0; i < sampleListStatus.length; i++) {
        if (sampleListStatus[i][colKey] != fetchedSampleOrders[i][colKey]) {
          targetRows.push(sampleListStatus[i]);
        }
      }
      return targetRows;
    },
    [sampleOrders],
  );*/

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={onSearch} filters={filters} />
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
          //selectType={'type'} //defaultType 과 selectType 이 동일하면 동일한 한가지면 펼침메뉴에 나타난다.
          ref={datePickerRef}
        />
        <Search.Input
          title={'소매처'}
          name={'sellerNm'}
          placeholder={'소매처 검색'}
          value={filters.sellerNm}
          onChange={onChangeFilters}
          onEnter={onSearch}
          filters={filters}
        />
        <Search.Input
          title={'상품명'}
          name={'prodNm'}
          placeholder={'상품명 검색'}
          value={filters.prodNm}
          onChange={onChangeFilters}
          onEnter={onSearch}
          filters={filters}
        />
        <Search.DropDown
          title={'상태'}
          name={'searchType'}
          value={filters.searchType}
          onChange={async (name, value) => {
            onChangeFilters('searchType', value); // 선택된 값을 상태로 업데이트
            //onSearch();
          }}
          defaultOptions={[
            { label: '미회수', value: 'A' },
            { label: '회수', value: 'B' }, // 현재고가 0 인고
            { label: '샘플결제', value: 'C' },
          ]}
        />
      </Search>

      <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
        <TableHeader count={sampleList.length || 0} search={onSearch} isPaging={false}>
          <DropDownAtom
            name={'previewOpt'}
            options={[
              { key: 1, value: 'sample', label: '샘플' },
              { key: 2, value: 'status', label: '현황' },
              { key: 3, value: 'collected', label: '회수' },
              { key: 4, value: 'notCollected', label: '미회수' },
            ]}
            value={optValue}
            onChangeOptions={(name, selectedValues) => {
              handleVoucherOption(selectedValues);
            }}
            className={`previewDropDown ${isPreView ? 'on' : ''}`}
          />
          <CustomShortcutButton
            className={`btn ${isPreView ? 'on' : ''}`}
            title="미리보기"
            onClick={() => setIsPreView(!isPreView)}
            shortcut={COMMON_SHORTCUTS.alt1}
          >
            미리보기
          </CustomShortcutButton>
          <CustomShortcutButton className="btn icoPrint" title="프린트" onClick={handlePrintClick} shortcut={COMMON_SHORTCUTS.print}>
            프린트
          </CustomShortcutButton>
        </TableHeader>
        {columnDefs && columnDefs.length > 0 && (
          <div className="gridBox">
            <div className="tblPreview">
              <TunedGrid<SampleResponsePaging>
                ref={gridRef}
                onGridReady={onGridReady}
                loading={isSampleOrders}
                components={frameworkComponents}
                rowData={sampleList}
                columnDefs={columnDefs}
                onCellEditingStopped={onCellEditingStoppedFn}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                getRowClass={getRowClass}
                pinnedBottomRowData={pinnedBottomRowData} // 하단에 고정된 합계 행
                onSelectionChanged={onSelectionChanged}
                singleClickEdit={true}
                suppressRowClickSelection={false}
                className={'withPrint check'}
                onCellValueChanged={(event) => {
                  const colId = event.api.getFocusedCell()?.column.getColId();
                  const rowIndex = event.api.getFocusedCell()?.rowIndex;
                  if (colId === 'orderDetEtc' && rowIndex != undefined && rowIndex > -1) {
                    const rowNode = event.api.getDisplayedRowAtIndex(rowIndex);
                    if (rowNode && rowNode.data) {
                      updateOrderDetEtcMutate({ id: Number(rowNode.data.orderDetId), orderDetEtc: event.value });
                    }
                  }
                }}
              />
              <div className="btnArea">
                <button
                  className="btn"
                  title="회수후판매"
                  onClick={() => {
                    if (gridRef.current) {
                      const selectedNodes = gridRef.current.api.getSelectedNodes();
                      if (selectedNodes.length == 0) {
                        toastError('판매수량이 변경된 행을 찾을 수 없습니다.');
                      } else {
                        for (let i = 0; i < selectedNodes.length; i++) {
                          if (i != 0 && selectedNodes[i].data.sellerId != selectedNodes[0].data.sellerId) {
                            toastError('본 동작은 같은 소매처의 샘플 목록을 선택하였을때만 동작합니다.');
                            return;
                          }
                        }
                        openModal('SAMPLE_RETRIEVE_SAIL');
                      }
                    } else {
                      console.error('그리드의 참조를 얻는데 실패하였습니다.');
                    }
                  }}
                >
                  회수후판매
                </button>
                <button
                  className="btn"
                  title="회수후반납"
                  onClick={() => {
                    if (gridRef.current) {
                      if (gridRef.current.api.getSelectedNodes().length == 0) {
                        toastError('하나의 행을 선택한 후 재시도하십시요.');
                      } else {
                        openModal('SAMPLE_RETRIEVE_RETURN');
                      }
                    } else {
                      console.error('그리드의 참조를 얻는데 실패하였습니다.');
                    }
                  }}
                >
                  회수후반납
                </button>
                <button
                  className="btn"
                  title="회수하기"
                  onClick={() => {
                    if (gridRef.current) {
                      if (gridRef.current.api.getSelectedNodes().length == 0) {
                        toastError('하나이상의 행을 선택한 후 재시도하십시요.');
                      } else {
                        openModal('SAMPLE_RETRIEVE');
                      }
                    } else {
                      console.error('그리드의 참조를 얻는데 실패하였습니다.');
                    }
                  }}
                >
                  회수하기
                </button>
                <button
                  className="btn"
                  title="샘플삭제"
                  onClick={() => {
                    if (gridRef.current) {
                      if (gridRef.current.api.getSelectedNodes().length != 0) {
                        openModal('SAMPLE_DELETE');
                      } else {
                        toastError('하나 이상의 행을 선택한 후 재시도하십시요.');
                      }
                    } else {
                      console.error('그리드의 참조를 얻는데 실패하였습니다.');
                    }
                  }}
                >
                  샘플삭제
                </button>
                {(filters.searchType === 'A' || filters.searchType === 'B') && (
                  <button
                    className="btn"
                    title="회수취소"
                    onClick={() => {
                      if (gridRef.current) {
                        if (gridRef.current.api.getSelectedNodes().length == 0) {
                          toastError('하나의 행을 선택한 후 재시도하십시요.');
                        } else {
                          openModal('SAMPLE_RETRIEVE_CANCEL');
                        }
                      } else {
                        console.error('그리드의 참조를 얻는데 실패하였습니다.');
                      }
                    }}
                  >
                    회수취소
                  </button>
                )}
              </div>
            </div>
            {isPreView ? (
              <div>
                <div className="previewBox" ref={previewRef}>
                  {selectedOrderDetail && optionType ? (
                    ['sample', 'status', 'collected', 'notCollected'].includes(optionType) ? (
                      <PrintLayout selectedDetail={selectedOrderDetail} isPrinting={isPrinting} setIsPrinting={setIsPrinting} type={optionType || ''} />
                    ) : (
                      <div className="noRowsOverlayBox">주문을 선택하면 상세 정보가 표시됩니다.</div>
                    )
                  ) : (
                    <div className="noRowsOverlayBox">주문을 선택하면 상세 정보가 표시됩니다.</div>
                  )}
                </div>
              </div>
            ) : (
              ''
            )}
          </div>
        )}
      </div>
      <ConfirmModal
        title={
          '<div class="confirmMsg"><span class="small">선택된 샘플을 </span><span class="big"><strong>전량 삭제</strong>&nbsp;처리하시겠어요?</span></div>'
        }
        open={modalType.type === 'SAMPLE_DELETE' && modalType.active}
        onClose={() => {
          closeModal('SAMPLE_DELETE');
        }}
        onConfirm={() => {
          const nodes = gridRef?.current?.api.getSelectedNodes() || [];
          const deleteMoreOnceList: SampleRequestDeleteMoreOnce[] = nodes.map((node) => ({
            orderId: node.data.orderId,
            orderDetId: node.data.orderDetId,
          }));

          console.log('deleteMoreOnceList', deleteMoreOnceList);
          closeModal('SAMPLE_DELETE');
          deleteSamples(deleteMoreOnceList).then((result) => {
            const { resultCode, resultMessage } = result.data;
            if (resultCode == 200) {
              toastSuccess('삭제에 성공하였습니다.');
              fetchSampleOrders();
            } else {
              toastError(resultMessage);
            }
          });
        }}
      />
      <ConfirmModal
        title={'<div class="confirmMsg"><span class="small">선택된 샘플을 </span><span class="big"><strong>회수처리</strong>&nbsp;하시겠어요?</span></div>'}
        open={modalType.type === 'SAMPLE_RETRIEVE' && modalType.active}
        onClose={() => {
          closeModal('SAMPLE_RETRIEVE');
        }}
        onConfirm={() => {
          closeModal('SAMPLE_RETRIEVE');
          const nodes = gridRef?.current?.api.getSelectedNodes() || [];
          const retriveList: SampleRequestRetrieve[] = nodes.map((node) => ({
            jobDetId: node.data.jobDetId,
            retrieveCnt: 0, // 멀티이면 모두 처리여러 값은 상관없다
            singleMultiType: 'M', // 멀티이면 모두 처리
          }));

          retrieveSample(retriveList).then((result) => {
            const { resultCode, resultMessage } = result.data;
            console.log('resultCode==>', resultCode);
            console.log('resultMessage==>', resultMessage);
            if (resultCode == 200) {
              toastSuccess('회수 처리되었습니다!');
              fetchSampleOrders();
            } else {
              toastError(resultMessage);
            }
          });
        }}
      />
      <ConfirmModal
        width={450}
        title={
          '<div class="confirmMsg"><span class="small">선택된 샘플을 </span><span class="big"><strong>회수처리 후</strong>&nbsp;매장분판매 하시겠어요?</span><span class="small">샘플결제시에는 상품추가 및 수량변경을 할수 없습니다.  </span></div>'
        }
        open={modalType.type === 'SAMPLE_RETRIEVE_SAIL' && modalType.active}
        onClose={() => {
          closeModal('SAMPLE_RETRIEVE_SAIL');
        }}
        onConfirm={() => {
          if (gridRef.current) {
            closeModal('SAMPLE_RETRIEVE_SAIL');
            const selectedNodes: IRowNode<SampleResponsePaging>[] = gridRef.current.api.getSelectedNodes();
            const retriveList: SampleRequestRetrieve[] = selectedNodes.map((node, index, array) => ({
              jobDetId: node.data?.jobDetId,
              retrieveCnt: 0, // 멀티이면 모두 처리여러 값은 상관없다
              singleMultiType: 'M', // 멀티이면 모두 처리
            }));
            retrieveSample(retriveList).then((result) => {
              const { resultCode, resultMessage } = result.data;
              if (resultCode == 200) {
                toastSuccess('회수 처리되었습니다!');
                fetchSampleOrders();

                // 소매처와 주문, 주문상세 정보 등록
                setSelectedRetailInCommon({
                  id: selectedNodes[0].data?.sellerId,
                  sellerNm: selectedNodes[0].data?.sellerNm,
                });
                setOrder({
                  bundleYn: 'N',
                  orderCd: '7',
                  onSiteYn: 'Y',
                  sellerId: selectedNodes[0].data?.sellerId,
                  sampleSailOrderId: selectedNodes[0].data?.orderId,
                });
                setOrderDetList(
                  selectedNodes.map((node, index) => {
                    return {
                      no: index + 1,
                      skuId: node.data?.skuId,
                      skuNm: node.data?.skuNm,
                      sellAmt: node.data?.sellAmt,
                      skuCnt: node.data?.nowCnt,
                      dcAmt: node.data?.dcAmt,
                      baseAmt: (node.data?.sellAmt || 0) - (node.data?.dcAmt || 0) || 0, // 원가에서 소매처별 특가 공재
                      totAmt: ((node.data?.sellAmt || 0) - (node.data?.dcAmt || 0)) * (node.data?.nowCnt || 1) || 0,
                      orderDetCd: ProductStatus.sell[0],
                    };
                  }),
                );
              } else {
                toastError(resultMessage);
              }
            });
          } else {
            console.error('그리드에 관한 참조(current) 를 찾을 수 없음');
          }
        }}
      />
      <ConfirmModal
        title={
          '<div class="confirmMsg arrows"><div class="top"><span>샘플회수 후</span><em>옆</em><span>빈블러로</span></div>상품 재고를 반납하시겠어요?</div>'
        }
        open={modalType.type === 'SAMPLE_RETRIEVE_RETURN' && modalType.active}
        onClose={() => {
          closeModal('SAMPLE_RETRIEVE_RETURN');
        }}
        onConfirm={() => {
          closeModal('SAMPLE_RETRIEVE_RETURN');
          const nodes = gridRef?.current?.api.getSelectedNodes() || [];
          const retriveAndReturnlList: SampleRequestRetrieveAndReturn[] = nodes.map((node) => ({
            jobDetId: node.data.jobDetId,
            sampleCnt: node.data.sampleCnt,
          }));

          console.log('retriveAndReturnlList ==>', retriveAndReturnlList);

          retrieveAndReturnSample(retriveAndReturnlList).then((result) => {
            const { resultCode, resultMessage } = result.data;
            if (resultCode == 200) {
              toastSuccess('회수 및 반납요청 처리되었습니다.');
              fetchSampleOrders();
            } else {
              toastError(resultMessage);
            }
          });
        }}
      />
      <ConfirmModal
        title={
          '<div class="confirmMsg"><span class="small">선택된 회수샘플을 </span><span class="big"><strong>전량 취소</strong>&nbsp;처리하시겠어요?</span></div>'
        }
        open={modalType.type === 'SAMPLE_RETRIEVE_CANCEL' && modalType.active}
        onClose={() => {
          closeModal('SAMPLE_RETRIEVE_CANCEL');
        }}
        onConfirm={() => {
          closeModal('SAMPLE_RETRIEVE_CANCEL');
          const nodes = gridRef?.current?.api.getSelectedNodes() || [];
          const retriveCancelList: SampleRequestRetrieveCancel[] = nodes.map((node) => ({
            jobDetId: node.data.jobDetId,
            sampleCnt: node.data.sampleCnt,
          }));

          retrieveCancelSample(retriveCancelList).then((result) => {
            const { resultCode, resultMessage } = result.data;
            if (resultCode == 200) {
              toastSuccess('회수 취소 처리되었습니다.');
              fetchSampleOrders();
            } else {
              toastError(resultMessage);
            }
          });
        }}
      />
      {modalType?.type === 'ORDEREDIT' && modalType.active && <SampleOrderEditPop />}
      {modalType?.type === 'RELEASEEDIT' && modalType.active && <SampleReleaseEditPop />}
      {modalType?.type === 'PRODUCTTALLY' && modalType.active && <SampleProductTallyPop />}
      {modalType?.type === 'CATEGORYSETTING' && modalType.active && <SampleCategorySetPop />}
      {modalType?.type === 'DETAIL' && modalType.active && <SampleElementDetPop />}
    </div>
  );
};

export default Sample;
