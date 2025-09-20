import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, toastError, toastSuccess } from '../../components';
import {
  SpecialPriceRequestCreate,
  OrderDetCreate,
  RetailAmtResponse,
  SpecialPriceResponseForOneProduct,
  StoreRequestReqCreate,
  StoreRequestRetCreate,
  MainVatList,
  PrintDetail,
  SkuResponsePaging,
  RetailResponseDetail,
  OrderRequestCreateInfo,
  PayRequestCreate,
  OrderRequestUpdateInfo,
  PayRequestUpdate,
  OrderRequestCreate,
  OrderRequestUpdate,
} from '../../generated';
import {
  CellEditingStartedEvent,
  CellEditingStoppedEvent,
  CellKeyDownEvent,
  CellPosition,
  ColDef,
  FullWidthCellKeyDownEvent,
  ProcessDataFromClipboardParams,
  RowClassParams,
  TextCellEditor,
} from 'ag-grid-community';
import { useCommonStore } from '../../stores';
import { defaultColDef, GridSetting } from '../../libs/ag-grid';
import { useAgGridApi } from '../../hooks';
import { OrderPaymentPop } from '../popup/orderReg/OrderPaymentPop';
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import { Utils } from '../../libs/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../libs';
import styles from '../../styles/layout/orderReg.module.scss';
import { AlignedResult, Infos, TotalSummary } from './TotalSummary';
import { Tooltip } from 'react-tooltip';
import { ProductStatus } from '../../libs/const';
import { useOrderStore } from '../../stores/useOrderStore';
import { useSpecialPriceStore } from '../../stores/useSpecialPriceStore';
import { ConfirmModal } from '../ConfirmModal';
import { useRouter } from 'next/router';
import { useStoreReqStore } from '../../stores/useStoreReqStore';
import { TodayResponseTodayAmt } from '../../generated';
import TunedGrid, { copiedRowPastedEvent } from '../grid/TunedGrid';
import PrintLayout from '../print/PrintLayout';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { SkuSearchPop } from '../popup/common/SkuSearchPop';
import { AxiosResponse } from 'axios';
import { Order } from '../../generated';
import { usePaymentStore } from '../../stores/usePaymentStore';
import { ModalTypeInterFace, PaymentPop } from '../popup/common/PaymentPop';
import { retailSearchBarRefInterface } from '../search/retail/RetailSearchBar';
import { selectRowIndexBeforeFilterAndSort } from '../../customFn/selectRowIndexBeforeFilterAndSortFn';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../CustomShortcutButton';
import { Spin } from 'antd';
import { useRetailStore } from '../../stores/useRetailStore';
import { CustomSwitch } from '../CustomSwitch';
import { useMoveAndEdit } from '../../customFn/useMoveAndEdit';

interface Props {
  onClick?: React.MouseEventHandler<HTMLElement>;
}

/**
 * 할인가에 맞추어 수정되는 실질(화면 표시용) 단가
 * @type {number}
 * @memberof displayedOrderDet
 */

export interface purpose {
  purpose: string;
  index?: number;
  searchWord?: string;
}

/**
 * 1000(천) 단위로 콤마(',') 를 추가하는 함수
 * 본 함수 사용으로 인하여 상태로 관리되는 데이터 일부의 문자열 형식의 숫자에 콤마가 추가되는 일이 발생하지 않도록 깊은 복사 필요
 * 인자로 들어오는 메인 그리드의 data 는 빈 행 없이 온전한 데이터 형태로 들어온다는 전제하에 작성
 */

/** 시스템 - 메뉴접근 주문등록 페이지 */
export const OrderReg = ({ onClick }: Props) => {
  const focusByArrowKeyIsAllowedCols = ['skuNm', 'baseAmt', 'skuCnt', 'dcAmt']; // 그리드에서 화살표 키를 통한 이동이 허용되는 컬럼 목록

  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const isManualFocusChange = useRef(false); // 포커스 이벤트 생겨도 스큐 팝업 안띄우기 위해

  /** 공통 스토어 - State */
  const [selectedRetail, setSelectedRetail, removeEmptyRows, removeDuplicatedRows] = useCommonStore((s) => [
    s.selectedRetail,
    s.setSelectedRetail,
    s.removeEmptyRows,
    s.removeDuplicatedRows,
  ]);

  /** 주문관리 스토어 - State */
  const [
    orderModalType,
    openOrderModal,
    closeOrderModal,
    orderDetList,
    setOrderDetList,
    order,
    setOrder,
    amtSummary,
    setAmtSummary,
    orderPrint,
    productState,
    setProductState,
    insertOrderInfo,
    updateOrderInfo,
    selectWaitCount,
  ] = useOrderStore((s) => [
    s.modalType,
    s.openModal,
    s.closeModal,
    s.orderDetList,
    s.setOrderDetList,
    s.order,
    s.setOrder,
    s.amtSummary,
    s.setAmtSummary,
    s.orderPrint,
    s.productState,
    s.setProductState,
    s.insertOrderInfo,
    s.updateOrderInfo,
    s.selectWaitCount,
  ]);

  /** 특가 정보 요청 스토어 */
  const [insertSpecialPrice, selectSpecialPrice, spModalType, openSpModal, closeSpModal] = useSpecialPriceStore((s) => [
    s.insertSpecialPrice,
    s.selectSpecialPrice,
    s.modalType,
    s.openModal,
    s.closeModal,
  ]);

  /** 소매처 전역 스토어 */
  const [selectSomeRetailAmt, getRetailDetail] = useRetailStore((s) => [s.selectSomeRetailAmt, s.getRetailDetail]);

  const [insertStoreReqRequest, insertStoreRetsRequest] = useStoreReqStore((s) => [s.insertStoreReqRequest, s.insertStoreRetsRequest]);

  /** 결제정보 전역상태 */
  const [/*openPaymentModal, closePaymentModal, paymentModalType,*/ paymentInfo, setPaymentInfo] = usePaymentStore((s) => [
    //s.openModal,
    //s.closeModal,
    //s.modalType,
    s.paymentInfo,
    s.setPaymentInfo,
  ]);

  const buttonReturnRef = useRef<HTMLButtonElement>(null);
  const buttonRequestRef = useRef<HTMLButtonElement>(null);
  const buttonPaymentRef = useRef<HTMLButtonElement>(null);

  const MainGridRef = useRef<AgGridReact<OrderDetCreate>>(null);
  const { moveAndEdit } = useMoveAndEdit(MainGridRef);
  const retailSearchBarRef = useRef<retailSearchBarRefInterface>(null);
  const btnArea = useRef<HTMLDivElement>(null);

  const openPurpose = useRef<purpose>({
    purpose: 'add',
  });
  const previewRef = useRef<HTMLDivElement>(null); // 영수증 출력 관련
  // 할인 관련 정보(타이핑 직후 유효함, 리 랜더링 시 초기화 됨), 추후 confirmModal 을 통하여 제품 할인가 적용할 시 사용 가능
  const SpecialPriceRequest = useRef<SpecialPriceRequestCreate>({
    prodId: 0,
    dcAmt: 0,
  });

  const [paymentModal, setPaymentModal] = useState<ModalTypeInterFace>({
    type: 'PAYMENT_CREATE',
    active: false,
  });

  const [omsArea, setOmsArea] = useState<any>(localStorage.getItem('OMS_AREA') ? localStorage.getItem('OMS_AREA') : '');
  const [printBtn, setPrintBtn] = useState(false); // 전표 onoff버튼
  const [infoTabBtn, setInfoTabBtn] = useState(0); // 당일요약, 부가세 버튼
  const delayCount = useRef(0); // 보류건수

  /** 영수증 출력 관련 */
  const [printType, setPrintType] = useState('');
  const [printOrderData, setPrintOrderData] = useState<PrintDetail[]>();

  const [isPrinting, setIsPrinting] = useState(false); // 인쇄버튼 클릭시

  /** 컬럼 설정  */
  const [columnDefs] = useState<ColDef[]>([
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      filter: false,
      sortable: false,
      width: 35,
      hide: true,
    },
    {
      field: 'no',
      headerName: 'No.',
      minWidth: 35,
      maxWidth: 35,
      width: 55,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      suppressMovable: true,
      comparator: (valueA, valueB, nodeA, nodeB) => {
        return Utils.comparator(valueA, valueB, nodeA, nodeB);
      },
    },
    {
      field: 'orderDetCd',
      headerName: '유형',
      minWidth: 45,
      maxWidth: 45,
      width: 45,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      suppressMovable: true,
      valueFormatter: (params) => {
        switch (params.value) {
          case ProductStatus.sell[0]:
            return ProductStatus.sell[1];
          case ProductStatus.refund[0]:
            return ProductStatus.refund[1];
          case ProductStatus.beforeDelivery[0]:
            return ProductStatus.beforeDelivery[1];
          case ProductStatus.sample[0]:
            return ProductStatus.sample[1];
          case ProductStatus.notDelivered[0]:
            return ProductStatus.notDelivered[1];
          default:
            return '';
        }
      },
      comparator: (valueA, valueB, nodeA, nodeB) => {
        return Utils.comparator(valueA, valueB, nodeA, nodeB);
      },
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      minWidth: 230,
      maxWidth: 230,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressMovable: true,
      suppressKeyboardEvent: () => {
        return false;
      },
      editable: (params) => {
        /**
         * 엔터와 같은 특정 키보드 이벤트 발생 시 작동
         * 특정 row, column 교차 지점에서만 셀 수정이 가능토록 함
         * 이 경우는 no 값 부재 시(추가를 위해 비어있는 행) 수정이 가능토록 함
         * */
        return params.node.data?.no == undefined;
      },
      cellClass: (params) => {
        return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
      },
      suppressHeaderMenuButton: true,
      comparator: (valueA, valueB, nodeA, nodeB) => {
        return Utils.comparator(valueA, valueB, nodeA, nodeB);
      },
    },
    {
      field: 'skuSize',
      headerName: '사이즈',
      width: 70,
      hide: true,
    },
    {
      field: 'skuColor',
      headerName: '색상',
      minWidth: 90,
      hide: true,
    },
    {
      /**
       * 단가는 소매처에 따른 실질적인 개당 가격 (== 수량이 1일 경우의 금액)
       * */
      field: 'baseAmt',
      headerName: '단가',
      minWidth: 55,
      maxWidth: 55,
      width: 55,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      suppressMovable: true,
      menuTabs: [],
      editable: (params) => {
        // 이전 셀의 값 확인
        return params.data.skuNm !== null && params.data.skuNm !== undefined && params.data.skuNm !== '';
      },
      cellClass: (params) => {
        const isEdit = params.data.skuNm !== null && params.data.skuNm !== undefined && params.data.skuNm !== '';
        return !(params.node?.rowPinned === 'bottom') && isEdit && params.column.getColDef().editable ? 'editCell' : '';
      },
      valueFormatter: (params) => {
        if (params.value) {
          return Utils.setComma(params.value);
        } else {
          return null;
        }
      },
      comparator: (valueA, valueB, nodeA, nodeB) => {
        return Utils.comparator(valueA, valueB, nodeA, nodeB);
      },
    },
    {
      field: 'skuCnt',
      headerName: '수량',
      suppressMovable: true,
      minWidth: 45,
      maxWidth: 45,
      width: 45,
      editable: (params) => {
        // 이전 셀의 값 확인
        return params.data.skuNm !== null && params.data.skuNm !== undefined && params.data.skuNm !== '';
      },
      cellClass: (params) => {
        const isEdit = params.data.skuNm !== null && params.data.skuNm !== undefined && params.data.skuNm !== '';
        return !(params.node?.rowPinned === 'bottom') && isEdit && params.column.getColDef().editable ? 'editCell' : '';
      },
      cellEditor: 'agTextCellEditor',
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        if (params.value) {
          return Utils.setComma(params.value);
        } else {
          return null;
        }
      },
      comparator: (valueA, valueB, nodeA, nodeB) => {
        return Utils.comparator(valueA, valueB, nodeA, nodeB);
      },
    },
    {
      field: 'totAmt',
      headerName: '금액',
      minWidth: 55,
      maxWidth: 55,
      width: 55,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressMovable: true,
      headerClass: 'header-align-center',
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        if (params.value) {
          return Utils.setComma(params.value);
        } else {
          return null;
        }
      },
      comparator: (valueA, valueB, nodeA, nodeB) => {
        return Utils.comparator(valueA, valueB, nodeA, nodeB);
      },
    },
    {
      field: 'dcAmt',
      headerName: '단가DC',
      suppressMovable: true,
      menuTabs: [],
      minWidth: 55,
      maxWidth: 55,
      width: 55,
      cellStyle: GridSetting.CellStyle.RIGHT,
      headerClass: 'header-align-center',
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        if (params.value) {
          return Utils.setComma(params.value);
        } else {
          return null;
        }
      },
      editable: (params) => {
        // 이전 셀의 값 확인
        return params.data.skuNm !== null && params.data.skuNm !== undefined && params.data.skuNm !== '';
      },
      cellClass: (params) => {
        const isEdit = params.data.skuNm !== null && params.data.skuNm !== undefined && params.data.skuNm !== '';
        return !(params.node?.rowPinned === 'bottom') && isEdit && params.column.getColDef().editable ? 'editCell' : '';
      },
      comparator: (valueA, valueB, nodeA, nodeB) => {
        return Utils.comparator(valueA, valueB, nodeA, nodeB);
      },
    },
  ]);

  /** 거래처별 금전정보 조회 */
  /*const {
    data: retailAmt,
    isSuccess: isRetailAmtSuccess,
    refetch: retailAmtRefetch,
  } = useQuery(
    ['/retail/retailAmt'],
    () =>
      authApi.get('/retail/retailAmt', {
        params: {
          sellerId: selectedRetail?.id,
        },
      }),
    {
      enabled: false,
    },
  );*/

  /** 금일 금전정보 조회 */
  const {
    data: todayAmt,
    isSuccess: isTodayAmtSuccess,
    refetch: todayAmtRefetch,
  } = useQuery(
    ['/orderInfo/today/todayAmt'],
    () =>
      authApi.get('/orderInfo/today/todayAmt', {
        params: {
          // 별도의 전달할 파라미터 없음
        },
      }),
    {
      enabled: true,
    },
  );

  const fetchDelayCount = () => {
    selectWaitCount().then((response) => {
      if (response.data.resultCode === 200) {
        delayCount.current = Number(response.data.body);
      } else {
        delayCount.current = 0;
      }
    });
  };

  /** 금일 금전 정보 동기화*/
  useEffect(() => {
    if (isTodayAmtSuccess) {
      const { resultCode, body, resultMessage } = todayAmt.data;
      if (resultCode === 200) {
        console.log('todayAmt', body);
        setAmtSummary({ ...amtSummary, today: body });
      } else {
        toastError(resultMessage);
      }
    }
  }, [todayAmt, isTodayAmtSuccess]);

  /** 소매처별 mainVatList 조회 */
  const { data: maintVat } = useQuery(['/vat/mainVatListForSeller/'], () => authApi.get(`/vat/mainVatListForSeller/${selectedRetail?.id}`, {}), {
    enabled: !!selectedRetail && !!selectedRetail.id, // Disable automatic query on render
  });

  /* 페이지 클릭시 order head main right 영역 찾는 함수 박근철 추가 2024-12-18 omsArea 가 ORDER 이면 order 쪽에 포커싱 되어있는 상황 */
  useEffect(() => {
    fetchDelayCount();
    // 원래의 setItem 메서드 저장
    const originalSetItem = localStorage.setItem;
    // localStorage.setItem 메서드 오버라이드
    localStorage.setItem = function (key: string, value: string) {
      // 커스텀 이벤트 생성
      const event = new CustomEvent<any>('localStorageChanged', {
        detail: {
          key,
          newValue: value,
        },
      });

      // 이벤트 디스패치
      window.dispatchEvent(event);

      // 원래의 setItem 메서드 호출
      originalSetItem.call(localStorage, key, value);
    };

    // 이벤트 리스너 함수
    const handleStorageChange = (event: CustomEvent<any>) => {
      const { key, newValue } = event.detail || {};
      if (key === 'OMS_AREA') {
        setOmsArea(newValue);
      }
    };

    // 이벤트 리스너 추가
    window.addEventListener('localStorageChanged', handleStorageChange as EventListener);
    // 클린업 함수
    return () => {
      // 원래의 setItem 메서드로 복원
      localStorage.setItem = originalSetItem;
      // 이벤트 리스너 제거
      window.removeEventListener('localStorageChanged', handleStorageChange as EventListener);
    };
  }, []);
  // 페이지 클릭시 order head main right 영역 찾는 함수 끝

  // 단축키 이벤트 저장영역 단축키는 모두 여기로
  /*useEffect(() => {
    if (omsArea === 'ORDER') {
      const handleKeyDown = (event: KeyboardEvent) => {
        // 기능 키의 경우 기본 동작 방지 처리하고 상태값 변경으로 인한 동작을 통하여 필요한 함수를 실행한다.
        const functionKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
        if (functionKeys.includes(event.key)) {
          event.preventDefault();
          if (event.key === 'F1') {
            // 판매
            handleTabClick(event, 0, orderDetList, order, productState);
          } else if (event.key === 'F2') {
            // 반품
            handleTabClick(event, 1, orderDetList, order, productState);
          } else if (event.key === 'F3') {
            // 미송
            handleTabClick(event, 2, orderDetList, order, productState);
          } else if (event.key === 'F10') {
            // 결제팝업
            handlePayment();
          }
        }
      };

      // 전역 키보드 이벤트 리스너 등록
      window.addEventListener('keydown', handleKeyDown);
      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [omsArea]);*/

  const onSelectRetailInRetailSearchBar = (retailInfo: RetailResponseDetail | undefined) => {
    setSelectedRetail(retailInfo); // commonStore 내부 전역 소매처 상태 업데이트
    setOrder({ ...order, id: undefined, sellerId: retailInfo ? retailInfo.id : undefined }); // 소매처 id 관련 정보 갱신, 소매처 정보 변경 시 order Id 또한 초기화(주문 수정 상태 해제)
    if (retailInfo) {
      /** 소매처 변경 시 */
      /** 거래처별 금전정보 조회 */
      const realDetList = orderDetList.filter((det) => typeof det.no === 'number' && det.no > 0); // 키보드를 업다운하면 계속 row 가 추가될수 있다.
      if (realDetList.length > 0) {
        /** 소매처 변경 시 특가 동기화 */
        selectSpecialPrice({
          sellerId: retailInfo.id,
        }).then((response) => {
          const copiedDetList = JSON.parse(JSON.stringify(orderDetList)); //[...orderDetList];
          const { resultCode, body, resultMessage } = response.data;
          if (resultCode == 200) {
            const respondedBody = [...(body as SpecialPriceResponseForOneProduct[])];
            if (respondedBody.length != 0) {
              for (let inner = 0; inner < orderDetList.length; inner++) {
                /** 응답값에 할인 정보가 존재할 시 실행 */
                for (let inner02 = 0; inner02 < respondedBody.length; inner02++) {
                  //const totAmt = (copiedDetList[inner].skuCnt || 0) * ((copiedDetList[inner].baseAmt as number) - (respondedBody[inner02].dcAmt || 0));
                  if (copiedDetList[inner].skuNm == respondedBody[inner02].skuNm) {
                    copiedDetList[inner] = {
                      ...copiedDetList[inner],
                      dcAmt: respondedBody[inner02].dcAmt,
                      totAmt: (copiedDetList[inner].skuCnt || 0) * ((copiedDetList[inner].baseAmt as number) - (respondedBody[inner02].dcAmt || 0)),
                    };
                  }
                }
              }
              setOrderDetList(copiedDetList); // 주문상세 동기화
            }
          } else {
            toastError(resultMessage);
          }
          //          moveAndEdit(orderDetList.length, 'skuNm', 10, false, false);
        });
      } else {
        /*
        openOrderModal('SKU_SEARCH');
        openPurpose.current.purpose = 'add';
        openPurpose.current.searchWord = '';
        openPurpose.current.index = orderDetList.length; // 신규 스큐를 추가하는 경우에만 사용하므로 editing 종료는 최하단에 비어있는 행에서만 일어난다(비어있는 최하단 행을 제거하였으므로 추가될 인덱스 값은 길이와 동일)
        */
      }
      fetchDelayCount();
    } else {
      /** 소매처 정보가 부재할 시(undefined) */
      const copiedDetList = JSON.parse(JSON.stringify(orderDetList)); //[...orderDetList];
      for (let i = 0; i < orderDetList.length; i++) {
        if (copiedDetList[i].skuNm) {
          copiedDetList[i] = {
            ...copiedDetList[i],
            dcAmt: 0,
            totAmt: (copiedDetList[i].skuCnt || 0) * (copiedDetList[i].baseAmt as number),
          };
        }
      }
      setOrderDetList(copiedDetList); // 주문상세 동기화
    }
  };

  // tab 버튼 목록(memoization 을 통한 불필요한 재생성 방지)
  const tabLabels = useMemo(
    () => [ProductStatus.sell[1], ProductStatus.refund[1], ProductStatus.beforeDelivery[1], ProductStatus.sample[1], ProductStatus.notDelivered[1]],
    [],
  );

  /**
   * (주문등록 그리드의 우측 방향 기준으로)단가 이하 영역들을 수정하는데 사용되는 함수
   * no 값을 인덱스 대용으로서 사용함
   * */
  const rightAreaValueUpdateFn = (
    orderDetList: OrderDetCreate[], // 기존 주문상세 상태
    data: OrderDetCreate | undefined,
    editedCellColId: string | undefined, // 편집이 일어난 셀의 colId
    value: string | number, // 이벤트 콜백에서 반환받은 이벤트(입력값)
  ) => {
    const searchedData = JSON.parse(JSON.stringify(orderDetList));
    console.log('value ==>', value);
    const rowIndexBeforeFilterAndSort = selectRowIndexBeforeFilterAndSort(data, searchedData, editedCellColId); //(no || 0) - 1; // no 는 1부터 시작하니 1을 빼준다.(index 대용으로서 사용)
    if (rowIndexBeforeFilterAndSort != null && searchedData[rowIndexBeforeFilterAndSort].skuId) {
      // 기존 요소를 수정하는 경우 본 조건 이하에 작성(참조할 index 값에 관한 타입 가드이므로)
      const sellAMT = Number(searchedData[rowIndexBeforeFilterAndSort].baseAmt) + Number(searchedData[rowIndexBeforeFilterAndSort].dcAmt); // 판매원가(단가 + 할인가)
      const eventValue = Utils.removeComma(value ? value.toString() : ''); // 금액 값의 콤마 제거

      /** 본 영역은 편집 종료에 따른 데이터 변경 로직에 집중 */
      if (editedCellColId == 'skuCnt') {
        if (eventValue && !isNaN(Number(eventValue))) {
          searchedData[rowIndexBeforeFilterAndSort].skuCnt = Number(eventValue);
          searchedData[rowIndexBeforeFilterAndSort].totAmt = Number(eventValue) * (searchedData[rowIndexBeforeFilterAndSort].baseAmt as number);
        } else {
          toastError('숫자가 아닌 [' + eventValue + '] [' + rowIndexBeforeFilterAndSort + '] 값은 입력할 수 없습니다.1');
        }
      } else if (editedCellColId == 'dcAmt') {
        if (selectedRetail == undefined) {
          toastError('소매처 선택후 다시 시도하십시요.');
        } else {
          // 수정 전 값을 원본에서 찾아봄
          const focusedCell = MainGridRef.current?.api.getFocusedCell();
          if (focusedCell?.rowIndex) {
            const rowNode = MainGridRef.current?.api.getDisplayedRowAtIndex(focusedCell?.rowIndex);
            console.log('rowNode ==>', rowNode);
            if (rowNode) {
              const targetNo = rowNode.data?.no; // 박근철 수정 2025-07-14 focusedCell 에는 이미 변경된 값이 있어서 이전 oldValue 를 찾는 로직 추가
              const oldRow = orderDetList.find((det) => det.no === targetNo);
              const oldValue = oldRow?.dcAmt;
              if (oldValue && Number(eventValue) == Number(oldValue)) {
                console.log('oldValue ==>', oldValue, eventValue);
                return;
              }
            }
          }

          if (eventValue && !isNaN(Number(eventValue))) {
            console.log('eventValue ============>', eventValue);
            /** 할인가 영구 적용 혹은 한시적 적용 */
            SpecialPriceRequest.current.dcAmt = Number(eventValue);
            SpecialPriceRequest.current.prodId = searchedData[rowIndexBeforeFilterAndSort].prodId;

            openSpModal('DC_APPLY');

            for (let i = 0; i < searchedData.length; i++) {
              if (i == rowIndexBeforeFilterAndSort) {
                const sellAmtInFor = Number(searchedData[i].baseAmt) + Number(searchedData[i].dcAmt); // 판매원가(단가 + 할인가)
                searchedData[i].dcAmt = Number(eventValue);
                searchedData[i].baseAmt = sellAmtInFor - (searchedData[i].dcAmt || 0);
                searchedData[i].totAmt = (searchedData[i].baseAmt as number) * (searchedData[i].skuCnt as number);
              }
            }
          } else {
            if (eventValue) {
              toastError('숫자가 아닌 [' + eventValue + '] [' + rowIndexBeforeFilterAndSort + '] 값은 입력할 수 없습니다.1');
            }
          }
        }
      } else if (editedCellColId == 'baseAmt') {
        if (selectedRetail == undefined) {
          toastError('소매처 선택후 다시 시도하십시요.');
        } else {
          // 수정 전 값을 원본에서 찾아봄
          const focusedCell = MainGridRef.current?.api.getFocusedCell();
          const focusIndex = focusedCell ? focusedCell?.rowIndex : -1;
          //const cellData =
          const rowNode = focusIndex > -1 ? MainGridRef.current?.api.getDisplayedRowAtIndex(focusIndex) : undefined;
          if (rowNode) {
            const targetNo = rowNode.data?.no; // 박근철 수정 2025-07-14 focusedCell 에는 이미 변경된 값이 있어서 이전 oldValue 를 찾는 로직 추가
            const oldRow = orderDetList.find((det) => det.no === targetNo);
            const oldValue = oldRow?.baseAmt;
            //console.log('oldRow oldValue[' + oldValue + '] ==============>', oldRow);
            //console.log('focusedCell sellAMT[' + sellAMT + ']==============>', focusedCell);
            if (oldValue !== undefined) {
              if (Number(eventValue) == Number(oldValue)) {
                // 동일하면 빠져나간다.
                return;
              }
            }
            if (eventValue && !isNaN(Number(eventValue))) {
              /** 단가(baseAmt)를 수정할 시 원가와의 차액을 할인가로 반영 */
              SpecialPriceRequest.current.dcAmt = sellAMT - Number(eventValue); // 단가에서 변경된 가격(낮게 수정된 가격)을 제함
              SpecialPriceRequest.current.prodId = searchedData[rowIndexBeforeFilterAndSort].prodId;
              openSpModal('DC_APPLY');
              for (let i = 0; i < searchedData.length; i++) {
                if (i == rowIndexBeforeFilterAndSort) {
                  searchedData[i].dcAmt = sellAMT - Number(eventValue);
                  searchedData[i].totAmt = Number(eventValue) * (searchedData[i].skuCnt as number);
                  searchedData[i].baseAmt = Number(eventValue);
                }
              }
            } else {
              toastError('숫자가 아닌[' + rowIndexBeforeFilterAndSort + '] 값은 입력할 수 없습니다.3');
            }
          }
        }
      }
      setOrderDetList(searchedData);
    }
  };

  /** 그리드 셀 편집 시작 이벤트 콜백 */
  const cellEditingStartedCallBack = useCallback((cellEditingStartedEvent: CellEditingStartedEvent<OrderDetCreate, any>) => {
    /** grid cell 내부 input 요소의 autocomplete 속성을 off 로 처리하고자 작성됨 */
    const cellEditorInstances = cellEditingStartedEvent.api.getCellEditorInstances();
    if (cellEditorInstances.length > 0) {
      const cellEditorInstance = cellEditorInstances[0] as TextCellEditor;
      const eInput = cellEditorInstance.getGui().querySelector('input');
      if (eInput) {
        eInput.setAttribute('autocomplete', 'off');
      }
    }
  }, []);

  /** 그리드 셀 편집 종료 이벤트 콜백 */
  const onCellEditingStopped = (cellEditingStoppedEvent: CellEditingStoppedEvent<OrderDetCreate>) => {
    console.log('cellEditingStoppedEvent ==>', cellEditingStoppedEvent);
    const editedCellColId = cellEditingStoppedEvent.api.getFocusedCell()?.column.getColId(); // 편집이 일어난 셀의 컬럼 id
    if (editedCellColId !== 'skuNm') {
      rightAreaValueUpdateFn(orderDetList, cellEditingStoppedEvent.data, editedCellColId, cellEditingStoppedEvent.value);
    }
  };

  /** 전달받은 데이터를 내부적으로 수정 후 setState 수행 */
  const changeProductsState = useCallback(
    (currentRef: AgGridReact | null, state: string, searchedData: OrderDetCreate[]) => {
      const modifiedData: OrderDetCreate[] = JSON.parse(JSON.stringify(searchedData));
      if (currentRef?.api) {
        const selectedNodes = currentRef?.api.getSelectedNodes();
        for (let i = 0; i < selectedNodes.length; i++) {
          for (let j = 0; j < modifiedData.length; j++) {
            if (modifiedData[j].no == selectedNodes[i].data.no && modifiedData[j].skuNm != undefined) {
              modifiedData[j].orderDetCd = state;
            }
          }
        }
        setOrderDetList(modifiedData);
      }
    },
    [setOrderDetList],
  );

  /** 전달받은 모든 데이터를 내부적으로 수정 후 setState 수행 */
  const changeAllProductsState = useCallback(
    (currentRef: AgGridReact | null, state: string, searchedData: OrderDetCreate[]) => {
      const modifiedData: OrderDetCreate[] = JSON.parse(JSON.stringify(searchedData));
      if (currentRef?.api) {
        for (let j = 0; j < modifiedData.length; j++) {
          if (modifiedData[j].skuNm != undefined) {
            modifiedData[j].orderDetCd = state;
          }
        }
        setOrderDetList(modifiedData);
      }
    },
    [setOrderDetList],
  );

  const handleTabClick = useCallback(
    (clickEvent: any | null, index: number, orderDetListStatus: OrderDetCreate[], orderGlobalStatus: Order, productGlobalStatus: string[]) => {
      if (clickEvent) {
        console.log('e==>', { clickEvent, index });
        const btn = clickEvent.target; // 클릭된 버튼
        const area = btnArea.current; // btnArea 참조

        if (!area) return;

        // 클릭된 버튼의 크기와 위치 가져오기
        const btnRect = btn.getBoundingClientRect();
        const areaRect = area.getBoundingClientRect();

        // offset 계산
        const offsetLeft = btnRect.left - areaRect.left; // 버튼의 왼쪽 위치
        const offsetTop = btnRect.top - areaRect.top; // 버튼의 위쪽 위치

        // CSS 변수로 위치와 크기 설정
        area.style.setProperty('--bg-left', `${offsetLeft}px`);
        area.style.setProperty('--bg-top', `${offsetTop}px`);
        area.style.setProperty('--bg-width', `${btnRect.width}px`);
        area.style.setProperty('--bg-height', `${btnRect.height}px`);
      }

      // 선택된 버튼 상태 업데이트
      setProductState([productGlobalStatus[0], tabLabels[index]]);
      if (index === 0) {
        // 판매
        if (productGlobalStatus[0] == ProductStatus.sample[0]) {
          /** 샘플 상태에서 판매 상태로 되돌리려 시도하는 경우 모든 주문상세 데이터가 판매 상태로 변경됨 */
          if (orderDetListStatus.length == 1 && orderDetListStatus[0].skuNm == undefined) {
            // 데이터가 존재하지 않는 경우(최초 랜더링 등) 컨펌 모달 생략
            setOrder({ ...orderGlobalStatus, orderCd: '9' });
          } else {
            // 컨펌 모달 출력 후 확인 클릭 시 전부 변경
            openOrderModal('FOR_OTHER');
          }
        } else {
          /** selected 된 행의 상태를 판매로 변경 */
          changeProductsState(MainGridRef.current, ProductStatus.sell[0], [...(orderDetListStatus ?? [])]);
        }
        setProductState(ProductStatus.sell); // 두 경우 모두 productState 전역 상태가 변경됨, 샘플 상태에서 변경하는 경우 컨펌 과정을 거치지 않을 시(onClose) 상태 변경 번복
      } else if (index === 1) {
        // 반품
        if (productGlobalStatus[0] == ProductStatus.sample[0]) {
          /** 샘플 상태에서 반품 상태로 되돌리려 시도하는 경우 모든 주문상세 데이터가 반품 상태로 변경됨 */
          if (orderDetListStatus.length == 1 && orderDetListStatus[0].skuNm == undefined) {
            // 데이터가 존재하지 않는 경우(최초 랜더링 등) 컨펌 모달 생략
            setOrder({ ...orderGlobalStatus, orderCd: '9' });
          } else {
            // 컨펌 모달 출력 후 확인 클릭 시 전부 변경
            openOrderModal('FOR_OTHER');
          }
        } else {
          /** selected 된 행의 상태를 반품으로 변경 */
          changeProductsState(MainGridRef.current, ProductStatus.refund[0], [...(orderDetListStatus ?? [])]);
        }
        setProductState(ProductStatus.refund); // 두 경우 모두 productState 전역 상태가 변경됨, 샘플 상태에서 변경하는 경우 컨펌 과정을 거치지 않을 시(onClose) 상태 변경 번복
      } else if (index === 2) {
        // 미송
        if (productGlobalStatus[0] == ProductStatus.sample[0]) {
          /** 샘플 상태에서 미송 상태로 되돌리려 시도하는 경우 모든 주문상세 데이터가 미송 상태로 변경됨 */
          if (orderDetListStatus.length == 1 && orderDetListStatus[0].skuNm == undefined) {
            // 데이터가 존재하지 않는 경우(최초 랜더링 등) 컨펌 모달 생략
            setOrder({ ...orderGlobalStatus, orderCd: '9' });
          } else {
            // 컨펌 모달 출력 후 확인 클릭 시 전부 변경
            openOrderModal('FOR_OTHER');
          }
        } else {
          /** selected 된 행의 상태를 미송으로 변경 */
          changeProductsState(MainGridRef.current, ProductStatus.beforeDelivery[0], [...(orderDetListStatus ?? [])]);
        }
        setProductState(ProductStatus.beforeDelivery); // 두 경우 모두 productState 전역 상태가 변경됨, 샘플 상태에서 변경하는 경우 컨펌 과정을 거치지 않을 시(onClose) 상태 변경 번복
      } else if (index === 3) {
        // 샘플
        if (orderDetListStatus.length == 1 && orderDetListStatus[0].skuNm == undefined) {
          // 데이터가 존재하지 않는 경우(최초 랜더링 등) 컨펌 모달 생략
          setOrder({ ...orderGlobalStatus, orderCd: '5' }); // 주문분류는 샘플(5)
        } else if (productGlobalStatus[0] != ProductStatus.sample[0]) {
          // 컨펌 모달 출력 후 확인 클릭 시 전부 변경
          openOrderModal('FOR_SAMPLE');
        }
        setProductState(ProductStatus.sample); // 두 경우 모두 productState 전역 상태가 변경됨
      } else if (index === 4) {
        // 미출
        if (productGlobalStatus[0] == ProductStatus.sample[0]) {
          /** 샘플 상태에서 미출 상태로 되돌리려 시도하는 경우 모든 주문상세 데이터가 미출 상태로 변경됨 */
          if (orderDetListStatus.length == 1 && orderDetListStatus[0].skuNm == undefined) {
            // 데이터가 존재하지 않는 경우(최초 랜더링 등) 컨펌 모달 생략
            setOrder({ ...orderGlobalStatus, orderCd: '9' });
          } else {
            // 컨펌 모달 출력 후 확인 클릭 시 전부 변경
            openOrderModal('FOR_OTHER');
          }
        } else {
          /** selected 된 행의 상태를 미출로 변경 */
          changeProductsState(MainGridRef.current, ProductStatus.notDelivered[0], [...(orderDetListStatus ?? [])]);
        }
        setProductState(ProductStatus.notDelivered); // 두 경우 모두 productState 전역 상태가 변경됨, 샘플 상태에서 변경하는 경우 컨펌 과정을 거치지 않을 시(onClose) 상태 변경 번복
      }
    },
    [changeAllProductsState, changeProductsState, closeOrderModal, openOrderModal, setOrder, setProductState, tabLabels],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F1' && event.shiftKey) {
        router.push({ pathname: '/oms/orderInfo/today' });
      }

      if (event.key === 'F2' && event.shiftKey) {
        retailSearchBarRef.current?.focusOnInput();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

  /**
   * 주문수량, 할인가 연산, 상태 반영은 AgGridReact 의 onCellEditingStopped 에서
   * */
  const onCellKeyDown = (event: CellKeyDownEvent<OrderDetCreate, any> | FullWidthCellKeyDownEvent<OrderDetCreate, any>) => {
    const keyBoardEvent = event.event as KeyboardEvent;
    const eventTriggeredRowIndex = event.rowIndex || 0;
    const api = event.api;
    const realDetList = orderDetList.filter((det) => typeof det.no === 'number' && det.no > 0); // 키보드를 업다운하면 계속 row 가 추가될수 있다.
    if (!api) return;

    const focusedCell = api.getFocusedCell(); // 현재 포커스된 셀
    const isNowEditing = api.getEditingCells().some((cell) => {
      return focusedCell && cell.rowIndex === focusedCell.rowIndex && cell.colId === focusedCell.column.getColId();
    });

    console.log('현재 셀이 에디팅 중인가? ==>', isNowEditing);

    if (keyBoardEvent.key === 'Enter') {
      /** 검색 키워드 입력 후 엔터키를 사용한 경우 */
      const nowColId = api.getEditingCells().length > 0 ? api.getEditingCells()[0].colId : '';
      const colId = api.getFocusedCell()?.column.getColId();
      if ((nowColId === 'skuNm' || colId === 'skuNm') && eventTriggeredRowIndex === realDetList.length) {
        /** 최하단 행에서 keyDown 이 발생한 경우 */
        openOrderModal('SKU_SEARCH');
        openPurpose.current.purpose = 'add';
        openPurpose.current.searchWord = event.data?.skuNm || '';
        openPurpose.current.index = eventTriggeredRowIndex; // 신규 스큐를 추가하는 경우에만 사용하므로 editing 종료는 최하단에 비어있는 행에서만 일어난다(비어있는 최하단 행을 제거하였으므로 추가될 인덱스 값은 길이와 동일)
      } else {
        if (nowColId === 'skuNm' || colId === 'skuNm') {
          // row 데이터 수정 영역
          openOrderModal('SKU_SEARCH');
          openPurpose.current.purpose = 'modify';
          openPurpose.current.index = eventTriggeredRowIndex;
        }
      }

      setTimeout(() => {
        if (event.api.getFocusedCell()) {
          const nowRowIndex = event.api.getFocusedCell()?.rowIndex || 0;
          MainGridRef.current?.api.ensureIndexVisible(nowRowIndex); // ✅ 스크롤
        }
      }, 100);
    } else if (keyBoardEvent.key === 'F1') {
      handleTabClick(null, 0, orderDetList, order, productState); // 판매 버튼 활성화
    } else if (keyBoardEvent.key === 'F2') {
      handleTabClick(null, 1, orderDetList, order, productState); // 반품 버튼 활성화
    } else if (keyBoardEvent.key === 'F3') {
      handleTabClick(null, 2, orderDetList, order, productState); // 미송 버튼 활성화
    } else if (keyBoardEvent.key === 'F10') {
      handlePayment(false); // 결제팝업
    } else if (keyBoardEvent.key == 'Delete' || keyBoardEvent.key == 'Backspace') {
      /** 삭제 영역 */
      const MainGridRefCurrent = MainGridRef.current;
      /** 편집 상태인 cell (row) 가 없는 경우에만 작동 */
      if (MainGridRefCurrent && MainGridRefCurrent.api.getEditingCells().length == 0) {
        if (MainGridRefCurrent.api.getSelectedNodes().length == 0) {
          /** 노드 선택 없이 해당 row 삭제*/
          const oneRowDeleted: OrderDetCreate[] = JSON.parse(JSON.stringify(orderDetList)).filter((data: OrderDetCreate) => data.no != event.data?.no);
          for (let i = 0; i < oneRowDeleted.length; i++) {
            if (oneRowDeleted[i].skuId) {
              oneRowDeleted[i].no = i + 1;
            } else {
              oneRowDeleted[i].no = undefined;
            }
          }
          if (oneRowDeleted.length == 0) {
            setOrderDetList([{}]);
          } else {
            setOrderDetList(oneRowDeleted);
          }
          if (eventTriggeredRowIndex != 0 && eventTriggeredRowIndex == oneRowDeleted.length && event.api.getFocusedCell()) {
            /** (최상단 행이 아닌)최하단 행 삭제 시 인접한 상단 행을 포커싱 */
            moveAndEdit(eventTriggeredRowIndex - 1, (event.api.getFocusedCell() as CellPosition).column.getColId(), 0, false, false);
          }
        } else {
          /** 하나 이상의 선택된 노드 삭제*/
          const deletionReflectedList: OrderDetCreate[] = JSON.parse(JSON.stringify(orderDetList)).filter((data: OrderDetCreate) => {
            let whetherSelectedOrNot = true; // 기본적으로 true (모든 데이터가 삭제 없이 영속된다는 가정에서 출발)
            MainGridRefCurrent.api.getSelectedNodes().forEach((node) => {
              if (node.data?.no == data.no) {
                // 삭제 대상 행의 no 와 no 값이 일치하는 경우
                whetherSelectedOrNot = false; // 영속되지 아니함
              }
            });
            return whetherSelectedOrNot;
          });
          for (let i = 0; i < deletionReflectedList.length; i++) {
            if (i == deletionReflectedList.length - 1 && deletionReflectedList[i].skuNm == undefined) {
              /** 최하단 행에 상품 정보가 할당되지 않은 경우는 no 값을 할당하지 않음*/
              deletionReflectedList[i].no = undefined;
            } else {
              deletionReflectedList[i].no = i + 1;
            }
          }
          if (deletionReflectedList.length == 0) {
            setOrderDetList([{}]);
          } else {
            setOrderDetList(deletionReflectedList);
          }
          if (eventTriggeredRowIndex != 0 && eventTriggeredRowIndex == deletionReflectedList.length && api.getFocusedCell()) {
            /** (최상단 행이 아닌)최하단 행 삭제 시 인접한 상단 행을 포커싱 */
            moveAndEdit(eventTriggeredRowIndex - 1, (api.getFocusedCell() as CellPosition).column.getColId(), 0, false, false);
          }
        }
      }
    } else if (keyBoardEvent.key === 'Escape') {
      // 일단 할일을 막는다. 2025-07-15 박근철
      event.event?.preventDefault(); // 다른 오작등을 막아보자
      /*
      if (removeEmptyRows(orderDetList, 'skuNm').length == 0) {
        /!** 데이터 부재 시 esc 키를 사용함으로서 소매처 속성 초기화 *!/
        setOrder({ ...order, sellerId: undefined, sellerNm: undefined });
        setSelectedRetail(undefined);
        retailSearchBarRef.current?.focusOnInput(); // todo
      }
*/
    } else if (keyBoardEvent.key == 'ArrowRight' || (!keyBoardEvent.shiftKey && keyBoardEvent.key == 'Tab')) {
      // 화살표 이동 가능 영역을 통제하기 위하여 작성함
      if (event.rowIndex != null && api.getFocusedCell()?.column.getColId()) {
        const takenColId = api.getFocusedCell()?.column.getColId() as string;
        if (isNowEditing && keyBoardEvent.key == 'ArrowRight' && takenColId === 'skuCnt') {
          api.stopEditing(true);
          setTimeout(() => {
            if (event.rowIndex) {
              api.setFocusedCell(event.rowIndex, 'dcAmt');
            }
          }, 10);
        } else if (focusByArrowKeyIsAllowedCols.filter((cols) => cols == takenColId).length == 0) {
          // 우로 이동한 컬럼이 화살표 키를 통한 이동이 허용되지 않는 컬럼인 경우
          let columnDefsIndex = -1; // 컬럼정의 상태에서 이동한 컬럼에 대응하는 컬럼 요소의 인덱스
          for (let i = 0; i < columnDefs.length; i++) {
            if (columnDefs[i].field == takenColId) {
              columnDefsIndex = i;
            }
          }
          if (columnDefsIndex != -1) {
            // 이동한 컬럼 우측에 이동 가능한 컬럼이 존재하는지 확인
            let mostRightIndex = -1; // 이동 가능한 컬럼 중 가장 우측에 위치하는 컬럼의 인덱스
            for (let i = columnDefsIndex; i < columnDefs.length; i++) {
              if (focusByArrowKeyIsAllowedCols.filter((cols) => cols == columnDefs[i].field).length != 0) {
                mostRightIndex = i;
              }
            }
            if (mostRightIndex != -1) {
              moveAndEdit(event.rowIndex, columnDefs[mostRightIndex].field as string, 0, false, false);
            } else {
              moveAndEdit(event.rowIndex, columnDefs[columnDefsIndex - 1].field as string, 0, false, false);
            }
          } else {
            console.error('컬럼 인덱스 값을 찾을 수 없음');
          }
        }
        // 그 외에는 평시와 마찬가지 동작(우로 이동)
      }
    } else if (keyBoardEvent.key == 'ArrowLeft' || (keyBoardEvent.shiftKey && keyBoardEvent.key == 'Tab')) {
      // 화살표 이동 가능 영역을 통제하기 위하여 작성함
      if (event.rowIndex != null && event.api.getFocusedCell()?.column.getColId()) {
        const takenColId = event.api.getFocusedCell()?.column.getColId() as string;
        if (isNowEditing && keyBoardEvent.key == 'ArrowLeft' && takenColId === 'dcAmt') {
          api.stopEditing(true);
          setTimeout(() => {
            if (event.rowIndex) {
              api.setFocusedCell(event.rowIndex, 'skuCnt');
            }
          }, 10);
        } else if (isNowEditing && keyBoardEvent.key == 'ArrowLeft' && takenColId === 'skuCnt') {
          api.stopEditing(true);
          setTimeout(() => {
            if (event.rowIndex) {
              api.setFocusedCell(event.rowIndex, 'baseAmt');
            }
          }, 10);
        } else if (focusByArrowKeyIsAllowedCols.filter((cols) => cols == takenColId).length == 0) {
          // 좌로 이동한 컬럼이 화살표 키를 통한 이동이 허용되지 않는 컬럼인 경우
          let columnDefsIndex = -1; // 컬럼정의 상태에서 이동한 컬럼에 대응하는 컬럼 요소의 인덱스
          for (let i = 0; i < columnDefs.length; i++) {
            if (columnDefs[i].field == takenColId) {
              columnDefsIndex = i;
            }
          }
          if (columnDefsIndex != -1) {
            // 이동한 컬럼 좌측에 이동 가능한 컬럼이 존재하는지 확인
            let mostLeftIndex = -1; // 이동 가능한 컬럼 중 가장 좌측에 위치하는 컬럼의 인덱스
            for (let i = 0; i <= columnDefsIndex; i++) {
              if (focusByArrowKeyIsAllowedCols.filter((cols) => cols == columnDefs[i].field).length != 0) {
                mostLeftIndex = i;
              }
            }
            if (mostLeftIndex != -1) {
              moveAndEdit(event.rowIndex, columnDefs[mostLeftIndex].field as string, 0, false, false);
            } else {
              moveAndEdit(event.rowIndex, columnDefs[columnDefsIndex + 1].field as string, 0, false, false);
            }
          } else {
            console.error('컬럼 인덱스 값을 찾을 수 없음');
          }
        }
        // 그 외에는 평시와 마찬가지 동작(좌로 이동)
      }
    } else {
      if (!keyBoardEvent.shiftKey) {
        if (keyBoardEvent.key == 'ArrowDown') {
          const nowColId = api.getEditingCells().length > 0 ? api.getEditingCells()[0].colId : '';
          if (nowColId && api.getEditingCells().length == 1 && (nowColId == 'skuCnt' || nowColId == 'dcAmt')) {
            api.stopEditing(false);
            moveAndEdit(eventTriggeredRowIndex == orderDetList.length - 1 ? eventTriggeredRowIndex : eventTriggeredRowIndex + 1, nowColId, 10, false, false);
          } else if (eventTriggeredRowIndex == realDetList.length - 1 && realDetList[eventTriggeredRowIndex].no != undefined) {
            console.log('eventTriggeredRowIndex==>', eventTriggeredRowIndex);
            // 비어있는 행 추가
            if (orderDetList.length === realDetList.length) {
              setOrderDetList([...realDetList, {}]);
              moveAndEdit(realDetList.length, 'skuNm', 30, true, false);
            } else if (event.api.getFocusedCell()) {
              moveAndEdit(eventTriggeredRowIndex + 1, 'skuNm', 10, false, false);
            }
          }
        } else if (keyBoardEvent.key == 'ArrowUp') {
          if (eventTriggeredRowIndex > 0) {
            console.log('eventTriggeredRowIndex ===>', eventTriggeredRowIndex);
            console.log('MainGridRef.current?.api.getEditingCells().length ===>', api.getEditingCells().length);
            const nowColId = api.getEditingCells().length > 0 ? api.getEditingCells()[0].colId : '';
            if (nowColId && api.getEditingCells().length == 1 && (nowColId == 'skuCnt' || nowColId == 'dcAmt')) {
              api.stopEditing(false);
              moveAndEdit(eventTriggeredRowIndex == 0 ? 0 : eventTriggeredRowIndex - 1, nowColId, 30, false, false);
            } else if (api.getEditingCells().length === 1 && nowColId === 'skuNm' && realDetList.length === eventTriggeredRowIndex) {
              isManualFocusChange.current = true;
              setTimeout(() => {
                api.setFocusedCell(eventTriggeredRowIndex - 1, nowColId);
              }, 10);
            }
          } else {
            // 상품명 이상으로 안올라가기
            setTimeout(() => {
              const colId = event.api.getFocusedCell()?.column.getColId();
              if (colId) {
                const activeElement = document.activeElement as HTMLElement;
                const isHeader = activeElement.closest('.ag-header-cell');
                if (isHeader) {
                  activeElement.blur(); // 헤더에 포커스가 잡히면 해제
                  // 포커스를 현재 row의 colId 셀에 다시 둠
                  moveAndEdit(eventTriggeredRowIndex, colId, 0, false, false);
                }
              }
            }, 0);
          }
        }
      }
    }
    event.event?.preventDefault(); // 다른 오작등을 막아보자
  };

  /** 스큐 검색 공통 팝업에서 스큐 선택 콜백이 호출된 경우 */
  const onSkuSelected = useCallback(
    (count: number, list: SkuResponsePaging[], orderDetList: OrderDetCreate[], productState: string[]) => {
      const detList = removeEmptyRows(orderDetList, 'skuNm');
      if (openPurpose.current.purpose == 'add') {
        for (let i = 0; i < list.length; i++) {
          detList[detList.length] = {
            ...list[i],
            no: detList.length + 1,
            skuCnt: count,
            baseAmt: (list[i].sellAmt || 0) - (list[i].dcAmt || 0) || 0, // 원가에서 소매처별 특가 공재
            totAmt: ((list[i].sellAmt || 0) - (list[i].dcAmt || 0)) * count || 0,
            orderDetCd: productState[0],
          };
        }

        detList[detList.length] = {};
      } else if (openPurpose.current.purpose == 'modify') {
        if (openPurpose.current.index) {
          /** 첫번쨰 선택된 요소를 제외한 나머지 요소의 개수만큼 각 하위 요소가 이동 (예: 길이 5의 배열에서 3번째 요소 선택 시 나머지 두개(5-2-1)의 요소가 이동 */
          const movedElementCnt = detList.length - openPurpose.current.index - 1;
          for (let i = 0; i < movedElementCnt; i++) {
            detList[openPurpose.current.index + list.length + i] = {
              ...detList[i + openPurpose.current.index + 1],
              no: Number(detList[openPurpose.current.index].no) + list.length + i,
            };
          }
          for (let i = 0; i < list.length; i++) {
            const dataAsElement = list[i];
            // 추가되는 요소(수정 대상 행 이하 선택 노드 개수만큼)
            // 이벤트 발생한 요소는 첫번째 추가되는 요소로 덮어씌움
            console.log('detList ===>', detList, openPurpose.current.index);
            const lastIndex = openPurpose.current.index; //Math.min(openPurpose.current.index, detList.length - 1);
            console.log('detList[openPurpose.current.index].no ===>', detList[lastIndex].no);
            detList[openPurpose.current.index + i] = {
              ...dataAsElement,
              no: Number(detList[lastIndex].no) + i,
              skuCnt: count,
              baseAmt: (dataAsElement.sellAmt || 0) - (dataAsElement.dcAmt || 0) || 0, // 원가에서 소매처별 특가 공재
              totAmt: (dataAsElement.sellAmt || 0) - (dataAsElement.dcAmt || 0) || 0,
              orderDetCd: detList[lastIndex].orderDetCd, // 수정 대상 row 의 주문상세코드
            };
          }
        }
      }
      setOrderDetList(detList);
      moveAndEdit(detList.length - 1, 'skuNm', 200, false, false);
    },
    [removeEmptyRows, setOrderDetList],
  );

  /** 선택된 행 붙여넣기 이벤트 발생할 시 */
  const onCopiedRowNodePasted = (event: copiedRowPastedEvent<OrderDetCreate>) => {
    const copiedDetList = JSON.parse(JSON.stringify(orderDetList));
    let copiedRowIndexBeforeFilterAndSort = null; // 복사된 행의 오리지널 rowIndex, 이하 for 문 반복시마다 i 인덱스에 대응하는 pastedRowNodes[i] 기준으로 재할당.
    let pastedRowIndexBeforeFilterAndSort: number | null = copiedDetList.length - 1; // 붙여넣기 이벤트가 발생한 행의 오리지널 rowIndex, 최초에는 상세목록의 최하단 행에 대응하는 인덱스를 할당함, 이후 붙여넣기(ctrl + v) 이벤트가 발생한 행의 정렬 이전 인덱스 할당한 뒤 불변
    const eventTriggeredRowIndex = event.eventTriggeredRowIndex;
    MainGridRef.current?.api.forEachNodeAfterFilterAndSort((rowNode, index) => {
      if (eventTriggeredRowIndex == index) {
        pastedRowIndexBeforeFilterAndSort = selectRowIndexBeforeFilterAndSort(rowNode.data, copiedDetList, undefined); // 붙여넣기 이벤트가 발생한 행의 정렬 이전 인덱스 할당
      }
    });
    for (let i = 0; i < event.pastedRowNodes.length; i++) {
      // 붙여넣기 이벤트에서 반환된 노드의 개수만큼 반복
      copiedRowIndexBeforeFilterAndSort = selectRowIndexBeforeFilterAndSort(event.pastedRowNodes[i].data, copiedDetList, undefined); // 반복이 이루어짐에 따라 재할당
      if (copiedRowIndexBeforeFilterAndSort != null && eventTriggeredRowIndex != null) {
        if (pastedRowIndexBeforeFilterAndSort != null) {
          copiedDetList[pastedRowIndexBeforeFilterAndSort + i] = {
            ...copiedDetList[copiedRowIndexBeforeFilterAndSort],
            no: (copiedDetList[pastedRowIndexBeforeFilterAndSort] && copiedDetList[pastedRowIndexBeforeFilterAndSort].no + i) || copiedDetList.length + i, // 붙여넣기 이벤트가 발생한 행의 no + i, 혹은 길이 + i(신규 붙여넣기)
          };
        }
      }
    }
    setOrderDetList(copiedDetList);
  };

  /** 'clipBoard' 로부터 붙여넣기 동작 수행할 시 실행됨, 반환값에 따라 그리드에 붙여 넣어지는 값이 결정됨 */
  const processDataFromClipboard = useCallback((params: ProcessDataFromClipboardParams<OrderDetCreate, any>) => {
    const list = params.data; // 가로새로 동작으로 인하여 배열이 중첩된 형태([row][cell])
    if (list[0].length == 1) {
      /** 셀 단위 수정만 허용하는 차원에서 다음 조건을 명시함([0][cell].length == 1 -> 붙여넣기 동작이 수행되는 행의 셀 요소가 단일함(셀 단위 붙여넣기)) */
      return params.data;
    } else {
      /** 주문상세 상태 변화 시점에 data 배열 반환으로 인하여 일시적으로 컬럼에 잘못된 값이 표시되는걸 방지하고자 빈 배열 반환 */
      return [];
    }
  }, []);

  const summary = useCallback(
    (
      amtSummary: { retail?: RetailAmtResponse; today?: TodayResponseTodayAmt; vat?: MainVatList[] },
      orderDetList: OrderDetCreate[],
      selectedRetail: RetailResponseDetail | undefined,
      respondedMainVat?: AxiosResponse<any, any>,
    ) => {
      const displayedInfo: Infos = {
        headerInfo: [],
        pay: [],
        today: [],
        vat: [],
      };
      let totalOrderCountForSell = 0;
      let totalOrderCountForRefund = 0;
      let totalSampleCount = 0;
      let totalMichulCount = 0;

      let totalThisOrderDetAmt = 0;
      for (let i = 0; i < removeEmptyRows(orderDetList).length; i++) {
        if (orderDetList[i].orderDetCd == '90' || orderDetList[i].orderDetCd == '99') {
          // 판매, 미송
          totalOrderCountForSell += Number(orderDetList[i].skuCnt || 0);
          // 당잔에 카운트
          totalThisOrderDetAmt += Number(orderDetList[i].totAmt || 0);
        } else if (orderDetList[i].orderDetCd == '40') {
          // 반품
          totalOrderCountForRefund += Number(orderDetList[i].skuCnt || 0);
          // 당잔에 디스카운트
          totalThisOrderDetAmt -= Number(orderDetList[i].totAmt || 0);
        } else if (orderDetList[i].orderDetCd == '50') {
          // 샘플
          totalSampleCount += Number(orderDetList[i].skuCnt || 0);
        } else if (orderDetList[i].orderDetCd == '80') {
          // 미출
          totalMichulCount += Number(orderDetList[i].skuCnt || 0);
        }
      }

      // mainVat
      if (respondedMainVat?.data) {
        respondedMainVat?.data.body.forEach((data: MainVatList) =>
          displayedInfo.vat.push({
            key: (displayedInfo.vat.length + 1).toString(),
            deopsitVatAmt: data.deopsitVatAmt,
            issuVatAmt: data.issuVatAmt,
            stndrYm: data.stndrYm,
            requireVatAmt: data.requireVatAmt,
          }),
        );
      }

      displayedInfo.headerInfo.push({
        key: (displayedInfo.headerInfo.length + 1).toString(),
        label: '판매',
        value: totalOrderCountForSell.toString(),
      });
      displayedInfo.headerInfo.push({
        key: (displayedInfo.headerInfo.length + 1).toString(),
        label: '반품',
        value: totalOrderCountForRefund.toString(),
      });
      displayedInfo.headerInfo.push({
        key: (displayedInfo.headerInfo.length + 1).toString(),
        label: '미송',
        value: totalOrderCountForSell.toString(), // '판매' 영역의 value 를 공유
      });
      displayedInfo.headerInfo.push({
        key: (displayedInfo.headerInfo.length + 1).toString(),
        label: '샘플',
        value: totalSampleCount.toString(),
      });
      displayedInfo.headerInfo.push({
        key: (displayedInfo.headerInfo.length + 1).toString(),
        label: '미출',
        value: totalMichulCount.toString(),
      });

      displayedInfo.pay.push({
        key: (displayedInfo.pay.length + 1).toString(),
        label: '전잔',
        value: Utils.setComma((selectedRetail?.nowAmt || 0).toString()),
      });

      displayedInfo.pay.push({
        key: (displayedInfo.pay.length + 1).toString(),
        label: '당일 합계',
        value: Utils.setComma(totalThisOrderDetAmt.toString()),
      });

      displayedInfo.pay.push({
        key: (displayedInfo.pay.length + 1).toString(),
        label: '입금 합계',
        value: Utils.setComma((amtSummary?.retail?.todayAccountAmt || 0).toString()),
      });
      displayedInfo.pay.push({
        key: (displayedInfo.pay.length + 1).toString(),
        label: '할인',
        value: Utils.setComma((amtSummary?.retail?.todayDiscountAmt || 0).toString()),
      });
      displayedInfo.pay.push({
        key: (displayedInfo.pay.length + 1).toString(),
        label: '당잔',
        value: Utils.setComma((amtSummary?.retail?.todayAmt || 0).toString()),
      });

      displayedInfo.today.push({
        key: (displayedInfo.today.length + 1).toString(),
        label: '실매출',
        value: Utils.setComma((amtSummary?.today?.todaySailAmt || 0).toString()),
      });
      displayedInfo.today.push({
        key: (displayedInfo.today.length + 1).toString(),
        label: '반품',
        value: Utils.setComma((amtSummary?.today?.todayReturnAmt || 0).toString()),
      });
      displayedInfo.today.push({
        key: (displayedInfo.today.length + 1).toString(),
        label: '일반 판매',
        value: Utils.setComma((amtSummary?.today?.todayNormalSailAmt || 0).toString()),
      });
      displayedInfo.today.push({
        key: (displayedInfo.today.length + 1).toString(),
        label: '제작 판매',
        value: Utils.setComma((amtSummary?.today?.todayOrderSailAmt || 0).toString()),
      });
      displayedInfo.today.push({
        key: (displayedInfo.today.length + 1).toString(),
        label: '주문 취소',
        value: Utils.setComma((amtSummary?.today?.todayCancelAmt || 0).toString()),
      });
      return displayedInfo;
    },
    [removeEmptyRows],
  );

  const getRowClass = (params: RowClassParams) => {
    if (params.data.orderDetCd == ProductStatus.refund[0]) {
      return ProductStatus.refund[2];
    } else if (params.data.orderDetCd == ProductStatus.beforeDelivery[0]) {
      return ProductStatus.beforeDelivery[2];
    } else if (params.data.orderDetCd == ProductStatus.sample[0]) {
      return ProductStatus.sample[2];
    } else if (params.data.orderDetCd == ProductStatus.notDelivered[0]) {
      return ProductStatus.notDelivered[2];
    } else {
      /** 데이터가 부재한 행(최하단 행)의 주문상세 코드가 정의되지 않은 경우 productState 의 값을 따른다. */
      if (params.data.orderDetCd == undefined) {
        if (productState[0] == ProductStatus.refund[0]) {
          return ProductStatus.refund[2];
        } else if (productState[0] == ProductStatus.beforeDelivery[0]) {
          return ProductStatus.beforeDelivery[2];
        } else if (productState[0] == ProductStatus.sample[0]) {
          return ProductStatus.sample[2];
        } else if (productState[0] == ProductStatus.notDelivered[0]) {
          return ProductStatus.notDelivered[2];
        }
      }
      return '';
    }
  };

  // tab 버튼 클릭 핸들러
  useEffect(() => {
    const area = btnArea.current;
    if (!area) return;

    // 활성화된 버튼을 찾음
    const activeButton = area.querySelector('.btn.on') as HTMLButtonElement;
    if (activeButton) {
      const btnRect = activeButton.getBoundingClientRect();
      const areaRect = area.getBoundingClientRect();

      // CSS 변수 업데이트
      area.style.setProperty('--bg-left', `${btnRect.left - areaRect.left}px`);
      area.style.setProperty('--bg-top', `${btnRect.top - areaRect.top}px`);
      area.style.setProperty('--bg-width', `${btnRect.width}px`);
      area.style.setProperty('--bg-height', `${btnRect.height}px`);
    }
  }, [productState[1]]);

  // 여기서 각종 소매처 정보를 조회한다. 잦은 랜더링 방지위해 retail.id 가 변경될때만
  useEffect(() => {
    if (selectedRetail && selectedRetail.id && selectedRetail.id > 0) {
      getRetailDetail(selectedRetail.id).then((result) => {
        const { resultCode, body, resultMessage } = result.data;
        if (resultCode === 200) {
          const retailInfo = body as RetailResponseDetail;
          setSelectedRetail(retailInfo);
          selectSomeRetailAmt({ sellerId: retailInfo.id }).then((result) => {
            const { resultCode, body, resultMessage } = result.data;
            if (resultCode === 200) {
              console.log('retailAmt', body);
              setAmtSummary({ ...amtSummary, retail: body });
              isManualFocusChange.current = true;
              moveAndEdit(orderDetList.length - 1, 'skuNm', 10, false, false);
            } else {
              toastError('소매처별 금전정보 조회 도중 문제가 발생하였습니다.');
              console.error(resultMessage);
            }
          });
        } else {
          toastError('소매처별 금전정보 조회 도중 문제가 발생하였습니다.');
          console.error(resultMessage);
        }
      });
    }
  }, [selectedRetail?.id]);

  const handleInfoTabBtnClick = useCallback(
    (index: number) => {
      if (index == 0) {
        // 당일 요약 클릭 시
        todayAmtRefetch(); // 금일 금전정보 refetch
      }
      setInfoTabBtn(index);
    },
    [todayAmtRefetch],
  );

  // 전표onoff 버튼 클릭 핸들러
  const handleOnoffClick = () => {
    setPrintBtn((prevState) => !prevState);
  };

  const handlePrintClick = async () => {
    setPrintType('orderState');
    if (!selectedRetail || orderDetList.length === 0) {
      toastError('주문 정보가 없거나 거래처가 선택되지 않았습니다.');
      return;
    }
    getAllRows();
    setIsPrinting(true);
  };
  // 주문내역 전표 생성
  const getAllRows = () => {
    const printOrderData: PrintDetail = {};
    const rowData: any[] = [];
    if (MainGridRef.current?.api) {
      const displayedRowCount = MainGridRef.current.api.getDisplayedRowCount();

      if (displayedRowCount !== undefined) {
        for (let i = 0; i < displayedRowCount; i++) {
          const rowNode = MainGridRef.current.api.getDisplayedRowAtIndex(i);
          if (rowNode?.data && rowNode?.data.skuId && rowNode?.data.skuNm) {
            const tempSkuCnt = rowNode?.data.skuCnt ? rowNode?.data.skuCnt : 0; // 소스 정리
            printOrderData.totSkuCnt = (printOrderData.totSkuCnt || 0) + tempSkuCnt;
            rowData.push(rowNode.data);
          }
        }
      }
    }
    printOrderData.inputDate = dayjs().format('YYYY-MM-DD(ddd) HH:mm:ss');
    printOrderData.workYmd = session.data?.user.workYmd;
    printOrderData.sellerNm = selectedRetail?.sellerNm;
    printOrderData.partnerId = session.data?.user.partnerId;
    printOrderData.orderItems = rowData;

    summary(amtSummary, orderDetList, selectedRetail, maintVat).pay.map((value: any) => {
      if (value.label === '당일 합계') {
        // 기존에는 당잔 이었으나 7월 1일자로 변경됨
        printOrderData.totOrderAmt = parseInt(Utils.removeComma(value.value) || '0'); // 총금액 셑팅
      }
    });
    console.log('printOrderData==>', printOrderData);

    setPrintOrderData([printOrderData]);
  };
  const OrderPrint = async (id: any) => {
    // 프린트
    const orderData = await orderPrint(id, printBtn);
    if (orderData) {
      setPrintOrderData([orderData.data.body] as PrintDetail[]);
      setIsPrinting(true);
    }
    // console.log(orderData, '프린트 확인');
    // console.log(printType, '<== 프린트 타입');
  };
  const ReqOrRetPrint = () => {
    // 매장 반납,요청 프린트정보
    if (printBtn) {
      getAllRows();
      setIsPrinting(true);
    }
  };

  const orderPrintParams = new Set(['orderSample', 'orderRequest', 'orderReturn', 'orderState', 'orderDefault']);

  const handlePayment = (isBoryu: boolean) => {
    console.log('오더뎃리스트', orderDetList);
    console.log('소매처', selectedRetail);
    if (orderDetList && orderDetList[0].skuNm != undefined) {
      // 결제 모달 출력
      if (selectedRetail) {
        /*
        if (!selectedRetail.sellerId) {
          selectedRetail.sellerId = selectedRetail.id;
        }
*/
        if (buttonPaymentRef.current?.innerHTML == '샘플저장') {
          openOrderModal('SAMPLE_ORDER');
        } else if (buttonPaymentRef.current?.innerHTML == '미출저장') {
          openOrderModal('ALL_MICHUL');
        } else {
          if (isBoryu) {
            openOrderModal('BORYU_CREATE');
          } else {
            openOrderModal('PAY_CREATE');
          }
        }
      } else {
        toastError('소매처를 선택해 주십시오.');
      }
    } else {
      /** 주문할 상품이 부재한 경우(입금거래) */
      if (selectedRetail) {
        setPaymentModal({
          type: 'PAYMENT_CREATE',
          active: true,
        });
        //openOrderModal('PAY_CREATE');
      } else {
        toastError('주문을 요청할 거래처를 특정해 주십시오.');
      }
    }
  };

  // 샘플이나 모든주문이 미출인경우 바로 등록하는 프로세스
  /** 주문 등록(create) */
  const { mutate: postOrderRequest } = useMutation(insertOrderInfo, {
    onSuccess: async (e: any) => {
      const { resultCode, body, resultMessage } = e.data;
      if (resultCode === 200) {
        /** 콜백 미정의 시 기본 동작(토스트, 상태 초기화 등) */
        toastSuccess('저장되었습니다.');
        /** 새로운 주문을 받을수 있도록 모든 정보(상태) 초기화 */
        setOrderDetList([{}]);
        setOrder({ bundleYn: 'N', orderCd: '9' });
        setSelectedRetail(undefined);
        setPaymentInfo({});
        setProductState(ProductStatus.sell); // orderReg 영역 라디오버튼 선택 상태를 order 상태에 맞춤

        await queryClient.invalidateQueries(['/orderTran/sample']);
        await queryClient.invalidateQueries(['/past/sampleLog']);
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  // 샘플이나 모든주문이 미출인경우 바로 등록하는 프로세스
  /** 주문 수정(update) */
  const { mutate: postOrderUpdateRequest } = useMutation(updateOrderInfo, {
    onSuccess: async (e: any) => {
      const { resultCode, body, resultMessage } = e.data;
      if (resultCode === 200) {
        /** 콜백 미정의 시 기본 동작(토스트, 상태 초기화 등) */
        toastSuccess('저장되었습니다.');
        /** 새로운 주문을 받을수 있도록 모든 정보(상태) 초기화 */
        setOrderDetList([{}]);
        setOrder({ bundleYn: 'N', orderCd: '9' });
        setSelectedRetail(undefined);
        setPaymentInfo({});
        setProductState(ProductStatus.sell); // orderReg 영역 라디오버튼 선택 상태를 order 상태에 맞춤
        //}
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  /** 모달 영역에서 즉시 주문을 생성하기 위해 생성한 함수 */
  const immediateOrderCreation = useCallback(
    (
      orderCd: string,
      order: Order,
      orderDetList: OrderDetCreate[],
      selectedRetail: RetailResponseDetail | undefined,
      payInfo?: PayRequestCreate,
      boryuYn = false,
    ) => {
      if (selectedRetail) {
        const orderRequestCreateInfo: OrderRequestCreateInfo = {
          orderDetList: removeEmptyRows(orderDetList, 'skuNm') /** 주문상세(orderDet) 정보 설정 */,
        }; // 주문 생성

        const orderRequestCrate: OrderRequestCreate = {
          ...order,
          logisAmt: 0,
          etcPrintYn: 'N',
          orderCd: orderCd,
          holdYn: boryuYn ? 'Y' : 'N',
        };
        let payRequestCreate: PayRequestCreate | undefined = undefined;
        if (orderCd == '5' || orderCd == '8') {
          payRequestCreate = {}; // 결제 정보는 비어있다. 샘플과 미출은 결제 정보 없다.
        } else {
          payRequestCreate = payInfo;
        }
        const SelectedSellerId = Number(selectedRetail.id);

        if (!isNaN(SelectedSellerId)) {
          /** 주문(order) 정보 설정 */
          orderRequestCreateInfo.orderRequestCreate = orderRequestCrate;
          setOrder({ ...orderRequestCrate }); // 요청 값(order)을 전역 상태에 할당함
          setPaymentInfo({ ...payRequestCreate }); // 요청 값(pay)을 전역 상태에 할당함
          postOrderRequest(orderRequestCreateInfo);
        } else {
          console.log('invalid SellerId');
        }
      } else {
        toastError('소매처 정보를 찾을 수 없습니다.');
      }
    },
    [postOrderRequest, removeEmptyRows, setOrder, setPaymentInfo],
  );

  /** 모달 영역에서 즉시 주문을 생성하기 위해 생성한 함수 */
  const immediateOrderUpdate = useCallback(
    (
      orderCd: string,
      order: Order,
      orderDetList: OrderDetCreate[],
      selectedRetail: RetailResponseDetail | undefined,
      payInfo?: PayRequestCreate,
      boryuYn = false,
    ) => {
      if (selectedRetail) {
        const orderRequestUpdateInfo: OrderRequestUpdateInfo = {
          orderDetList: removeEmptyRows(orderDetList, 'skuNm') /** 주문상세(orderDet) 정보 설정 */,
        }; // 주문 생성

        const orderRequestUpdate: OrderRequestUpdate = {
          ...order,
          logisAmt: 0,
          etcPrintYn: 'N',
          orderCd: orderCd,
          holdYn: boryuYn ? 'Y' : 'N',
        };
        let payRequestUpdate: PayRequestUpdate | undefined = undefined;
        if (orderCd == '5' || orderCd == '8') {
          payRequestUpdate = {}; // 결제 정보는 비어있다. 샘플과 미출은 결제 정보 없다.
        } else {
          payRequestUpdate = payInfo;
        }
        const SelectedSellerId = Number(selectedRetail.id);

        if (!isNaN(SelectedSellerId)) {
          /** 주문(order) 정보 설정 */
          orderRequestUpdateInfo.orderRequestUpdate = orderRequestUpdate;
          setOrder({ ...orderRequestUpdate }); // 요청 값(order)을 전역 상태에 할당함
          setPaymentInfo({ ...orderRequestUpdate }); // 요청 값(pay)을 전역 상태에 할당함
          postOrderUpdateRequest(orderRequestUpdateInfo);
        } else {
          console.log('invalid SellerId');
        }
      } else {
        toastError('소매처 정보를 찾을 수 없습니다.');
      }
    },
    [postOrderUpdateRequest, removeEmptyRows, setOrder, setPaymentInfo],
  );

  return (
    <aside className={`${styles.orderBox}`} onClick={onClick}>
      <div>
        <div className="gridBox">
          <div className="gridBoxInfo">
            <div className="left">
              <h3 className="bigTitle">
                {order.id ? (
                  <span className={'edit'}>
                    주문수정중 <Spin />
                  </span>
                ) : (
                  '주문등록'
                )}
                {selectedRetail ? (
                  <>
                    {selectedRetail.etcScrCntn ? (
                      <div className={`${styles.etcArea}`}>
                        <span></span>
                        <em>{selectedRetail.etcScrCntn}</em>
                      </div>
                    ) : (
                      ''
                    )}
                  </>
                ) : (
                  ''
                )}
              </h3>
            </div>
            <div className="right">
              <div className="btnArea mb20">
                {order.id ? (
                  <button
                    className="btn"
                    onClick={() => {
                      // '취소' 버튼 클릭 시 주문 등록에 필요한 모든 전역 상태 초기화
                      setOrderDetList([{}]);
                      setOrder({ bundleYn: 'N', orderCd: '9' });
                      setSelectedRetail(undefined);
                      setPaymentInfo({});
                      setProductState(ProductStatus.sell); // orderReg 영역 라디오버튼 선택 상태를 order 상태에 맞춤
                    }}
                  >
                    취소
                  </button>
                ) : (
                  ''
                )}
              </div>
            </div>
          </div>
        </div>
        <div className={`${styles.searchBox}`}>
          <div className={`${styles.inputArea}`}>
            <Search.RetailBar
              name={'sellerNm'}
              onRetailSelected={onSelectRetailInRetailSearchBar}
              onRetailInserted={(response) => {
                setSelectedRetail(response);
                moveAndEdit(orderDetList.length - 1, 'skuNm', 100, false, false);
              }}
              ref={retailSearchBarRef}
              selectedRetail={selectedRetail}
              allowNewRetail={true}
              onRetailDeleted={() => setSelectedRetail(undefined)}
            />
            <span className={`${styles.ico_search}`}>검색아이콘</span>
            <div>
              <button className={`${styles.ico_print}`} title={'인쇄'} onClick={handlePrintClick}>
                인쇄
              </button>
              <CustomSwitch title={' '} name={'printBtn'} checkedLabel={'켜기'} uncheckedLabel={'끄기'} onChange={handleOnoffClick} value={printBtn} />
              {/*<button className={`${styles.ico_memo}`} title={'메모'}>*/}
              {/*  메모*/}
              {/*</button>*/}
            </div>
          </div>
          <div className={`${styles.btnArea}`}>
            <CustomShortcutButton
              shortcut={COMMON_SHORTCUTS.shift3}
              onClick={() => router.push({ pathname: '/oms/orderMng/RetailSettle', query: selectedRetail?.id?.toString() || '' })}
            >
              업체내역
            </CustomShortcutButton>
            <CustomShortcutButton
              shortcut={COMMON_SHORTCUTS.shift4}
              className={selectedRetail && selectedRetail.misongCount && selectedRetail.misongCount > 0 ? 'btn_exist-data' : ''}
              onClick={() => router.push({ pathname: '/oms/orderTran/Misong', query: selectedRetail?.id?.toString() || '' })}
            >
              미송관리
            </CustomShortcutButton>
            <CustomShortcutButton
              shortcut={COMMON_SHORTCUTS.shift5}
              className={selectedRetail && selectedRetail.sampleCount && selectedRetail.sampleCount > 0 ? 'btn_exist-data' : ''}
              onClick={() => router.push({ pathname: '/oms/orderTran/sample', query: selectedRetail?.id?.toString() || '' })}
            >
              샘플관리
            </CustomShortcutButton>
            <CustomShortcutButton
              shortcut={COMMON_SHORTCUTS.shift6}
              onClick={() => router.push({ pathname: '/oms/orderTran/boryu', query: selectedRetail?.id?.toString() || '' })}
            >
              보류관리
            </CustomShortcutButton>
            <CustomShortcutButton
              shortcut={COMMON_SHORTCUTS.shift7}
              onClick={() => router.push({ pathname: '/oms/orderInfo/delivery', query: { jobStatCd: '9' } })}
              tooltipPlace={'left'}
              className="shortcut-button-container"
              dataCount={delayCount.current ? delayCount.current : 0}
            >
              출고보류
            </CustomShortcutButton>
          </div>
        </div>

        <div className="gridBox">
          <div className="gridBoxInfo">
            <div className="left">
              <div className="btnArea orderRegTabBtn" ref={btnArea}>
                {tabLabels.map((label, index) => {
                  const shortcutKey = (() => {
                    switch (index) {
                      case 0:
                        return COMMON_SHORTCUTS.f1;
                      case 1:
                        return COMMON_SHORTCUTS.f2;
                      case 2:
                        return COMMON_SHORTCUTS.f3;
                      case 3:
                        return COMMON_SHORTCUTS.f4;
                      case 4:
                        return COMMON_SHORTCUTS.f6;
                      default:
                        return COMMON_SHORTCUTS.f1;
                    }
                  })();

                  return (
                    <CustomShortcutButton
                      key={index}
                      onClick={(event: any) => handleTabClick(event, index, orderDetList, order, productState)}
                      shortcut={shortcutKey}
                      title={label}
                      className={`btn orderReg ${label == productState[1] ? 'on' : ''} ${index === 3 ? 'disabled' : ''}`}
                    >
                      {label}
                    </CustomShortcutButton>
                  );
                })}
              </div>
            </div>
            <Tooltip id="my-tooltip" />
            <div className="right">
              <div className="btnArea">
                <CustomShortcutButton
                  onClick={() => {
                    setOrder({ ...order, onSiteYn: order.onSiteYn == 'Y' ? 'N' : 'Y' });
                  }}
                  shortcut={COMMON_SHORTCUTS.f7}
                  title="매장"
                  className={`btn orderRegRight ${order.onSiteYn == 'Y' ? 'on' : ''}`}
                >
                  매장
                </CustomShortcutButton>

                <CustomShortcutButton
                  onClick={() => {
                    setOrder({ ...order, bundleYn: order.bundleYn == 'Y' ? 'N' : 'Y' });
                  }}
                  shortcut={COMMON_SHORTCUTS.f8}
                  title="묶음"
                  className={`btn orderRegRight ${order.bundleYn == 'Y' ? 'on' : ''}`}
                  tooltipPlace={'left'}
                >
                  묶음
                </CustomShortcutButton>
              </div>
            </div>
          </div>
          <div className="grid" tabIndex={-1}>
            <TunedGrid<OrderDetCreate>
              suppressClickEdit={true}
              className={'orderReg'}
              colIndexForSuppressKeyEvent={3}
              headerHeight={35}
              onGridReady={onGridReady}
              rowData={JSON.parse(JSON.stringify(orderDetList))} // 깊은 복사를 사용하여 rowData 상태가 철저히 프로그램적으로 의도된 값을 가지도록 하기
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              gridOptions={{ rowHeight: 30, suppressMovableColumns: true }}
              //suppressRowClickSelection={false}
              ref={MainGridRef}
              onCellKeyDown={onCellKeyDown}
              onCellEditingStarted={cellEditingStartedCallBack}
              onCellEditingStopped={onCellEditingStopped}
              getRowClass={getRowClass}
              preventPersonalizedColumnSetting={true}
              onCopiedRowNodePasted={onCopiedRowNodePasted}
              processDataFromClipboard={processDataFromClipboard}
              processCellFromClipboard={(event) => {
                if (event.node?.rowIndex) {
                  rightAreaValueUpdateFn(orderDetList, orderDetList[event.node.rowIndex], event.column.getColId(), event.value);
                }
              }}
              onCellClicked={(params) => {
                setTimeout(() => {
                  if (params.rowIndex !== null && params.rowIndex > -1) {
                    params.api.startEditingCell({
                      rowIndex: params.rowIndex,
                      colKey: params.column.getId(),
                    });
                  }
                }, 50); // 또는 50ms 정도 줘보세요
              }}
            />
          </div>
          <div className="gridBoxInfo">
            <div className="left">
              <div className="btnArea">
                <CustomShortcutButton
                  onClick={() => {
                    if (orderDetList[0].skuNm != undefined) {
                      for (let i = 0; i < orderDetList.length; i++) {
                        if ((orderDetList[i].inventoryAmt as number) < (orderDetList[i].skuCnt as number)) {
                          // 재고 상관없이 요청가능 하게 수정 2025-07-17 김예솔 차장님 요청
                          //                          toastError(orderDetList[i].skuNm + ' 에 대한 요청수량이 재고수량을 초과함');
                          //                          return;
                        }
                      }
                      openOrderModal('REQUEST');
                    }
                  }}
                  shortcut={COMMON_SHORTCUTS.NONE}
                  title="요청"
                  className="btn"
                  disabled={!orderDetList || orderDetList.length === 0 || !orderDetList[0].skuNm || productState == ProductStatus.sample}
                  ref={buttonRequestRef}
                >
                  요청
                </CustomShortcutButton>

                <CustomShortcutButton
                  onClick={() => {
                    MainGridRef.current?.api.clearFocusedCell();
                    openOrderModal('RETURN');
                  }}
                  shortcut={COMMON_SHORTCUTS.NONE}
                  title="반납"
                  className="btn"
                  disabled={!orderDetList || orderDetList.length === 0 || !orderDetList[0].skuNm || productState == ProductStatus.sample}
                  ref={buttonReturnRef}
                >
                  반납
                </CustomShortcutButton>

                <CustomShortcutButton
                  onClick={() => {
                    const detList = removeDuplicatedRows('skuNm', removeEmptyRows(orderDetList), (originRow, duplicatedRow) => {
                      return {
                        ...originRow,
                        skuCnt: (originRow.skuCnt || 0) + (duplicatedRow.skuCnt || 0),
                        totAmt: (originRow.baseAmt || 0) * ((originRow.skuCnt || 0) + (duplicatedRow.skuCnt || 0)),
                      };
                    });
                    detList[detList.length] = {};
                    setOrderDetList(detList);
                  }}
                  shortcut={COMMON_SHORTCUTS.NONE}
                  title="수량합치기"
                  className="btn"
                  disabled={
                    !orderDetList ||
                    orderDetList.length === 0 ||
                    !orderDetList[0].skuNm ||
                    removeEmptyRows(orderDetList).length == removeDuplicatedRows('skuNm', removeEmptyRows(orderDetList)).length
                  }
                  ref={buttonReturnRef}
                >
                  수량합치기
                </CustomShortcutButton>

                <CustomShortcutButton
                  onClick={() => {
                    handlePayment(true);
                  }}
                  shortcut={COMMON_SHORTCUTS.NONE}
                  title="보류저장"
                  className="btn"
                  disabled={!orderDetList || orderDetList.length === 0 || (!orderDetList[0].skuNm && !selectedRetail)}
                >
                  보류저장
                </CustomShortcutButton>
              </div>
            </div>
            <div className="right">
              <button
                onClick={() => handlePayment(false)}
                className={`btn btnBlue`}
                disabled={!orderDetList || orderDetList.length === 0 || (!orderDetList[0].skuNm && !selectedRetail)}
                data-tooltip-id="my-tooltip"
                data-tooltip-content="단축키는 (F10)입니다."
                data-tooltip-place="top-end"
                key={1}
                ref={buttonPaymentRef}
              >
                {summary(amtSummary, orderDetList, selectedRetail, maintVat).headerInfo.map((value: AlignedResult, index, headerInfoList) => {
                  // 헤더 구문 뒤에 따라오는 금액 관련 정보(샘플, 미출의 경우는 반환되는 값에 포함(접합) 되지 않음)
                  const followedSentence = summary(amtSummary, orderDetList, selectedRetail, maintVat).pay.map((value: AlignedResult) => {
                    return value.label === '당일 합계'
                      ? value.value !== '0'
                        ? `${value.value} 원 결제`
                        : '입금하기' // value.value가 0이면 '입금하기'를 표시
                      : null;
                  });

                  // headerInfo 배열의 순서는 -> '판매', '반품', '미송', '샘플', '미출'
                  if (index < 2) {
                    // 판매, 반품, 미송(미송 요소의 반환값은 판매 요소의 반환값과 같으므로 본 조건문은 판매, 반품 영역만을 기준으로 판단)
                    return (
                      <>
                        {value.value !== '0' && (
                          <span key={value.key} className={`${value.key === '1' ? 'sale' : 'return'}`}>
                            {value.value}
                          </span>
                        )}
                        {
                          value.key === '2' && (headerInfoList[0].value != '0' || headerInfoList[1].value != '0') ? followedSentence : '' // ('반품' 요소에서)판매 혹은 반품 수량 중 하나 이상이 0이 아닌 경우
                        }
                      </>
                    );
                  } else if (index > 2 && headerInfoList[0].value == '0' && headerInfoList[1].value == '0') {
                    // 판매(미송), 반품 수량이 0인 경우에만 해당 영역 조건문이 검토됨(미송 요소 이후의 배열 요소만을 검토(index > 2))
                    if (value.key == '4' && value.value !== '0') {
                      return '샘플저장';
                    } else if (value.key == '5' && value.value !== '0') {
                      return '미출저장';
                    } else if (index == headerInfoList.length - 1 && headerInfoList[3].value == '0' && headerInfoList[4].value == '0') {
                      return followedSentence;
                    }
                  }
                })}
              </button>
            </div>
          </div>
        </div>
        <div className="previewBox" ref={previewRef}>
          {printOrderData && isPrinting && printType && orderPrintParams.has(printType) && (
            <PrintLayout selectedDetail={printOrderData} isPrinting={isPrinting} setIsPrinting={setIsPrinting} type={printType} />
          )}
        </div>
        <TotalSummary
          SummaryInfo={summary(amtSummary, orderDetList, selectedRetail, maintVat)} // 결제, 당일 요약, 부가세 정보를 표시하는데 사용되는 정보
          handleInfoTabBtnClick={handleInfoTabBtnClick}
          infoTabBtn={infoTabBtn}
        />
        {orderModalType.type == 'SKU_SEARCH' && orderModalType.active && (
          <SkuSearchPop
            filter={{
              skuNm: openPurpose.current.searchWord,
            }}
            active={orderModalType.type == 'SKU_SEARCH' && orderModalType.active}
            onClose={() => {
              closeOrderModal('SKU_SEARCH');
              moveAndEdit(orderDetList.length - 1, 'skuNm', 50, false, false);
            }}
            onSelected={(count, list) => {
              onSkuSelected(count, list, orderDetList, productState);
            }}
          />
        )}
        <OrderPaymentPop
          OrderPrint={OrderPrint}
          setPrintType={setPrintType}
          onRequestSuccess={(type) => {
            if (type == 'create') {
              // 주문 성공 직후 소매처 검색 영역으로 포커싱
              setTimeout(() => {
                retailSearchBarRef.current?.focusOnInput();
              }, 100);
            }
          }}
        />
        <PaymentPop
          modalType={paymentModal}
          onClose={() => {
            setPaymentModal((prevState) => {
              return { ...prevState, active: false };
            });
          }}
          OrderPrint={OrderPrint}
          setPrintType={setPrintType}
          selectedRetail={selectedRetail}
          onRequestSuccess={(modalType) => {
            if (modalType.type == 'PAYMENT_CREATE') {
              toastSuccess('저장되었습니다.');
              /** 새로운 주문을 받을수 있도록 모든 정보(상태) 초기화 */
              setSelectedRetail(undefined);
              setPaymentInfo({});
            } else if (modalType.type == 'PAYMENT_UPDATE') {
              toastSuccess('수정되었습니다.');
              /** 새로운 주문을 받을수 있도록 모든 정보(상태) 초기화 */
              setSelectedRetail(undefined);
              setPaymentInfo({});
            }
          }}
        />
        <ConfirmModal
          title={'해당 제품에 대한 일괄 할인을 적용하시겠습니까?'}
          open={spModalType.type === 'DC_APPLY' && spModalType.active}
          onConfirm={() => {
            if (SpecialPriceRequest.current.prodId != 0) {
              return insertSpecialPrice({
                prodId: SpecialPriceRequest.current.prodId,
                dcAmt: SpecialPriceRequest.current.dcAmt,
                sellerId: selectedRetail?.id,
              }).then(async (result) => {
                if (result.data.resultCode === 200) {
                  toastSuccess('저장되었습니다.');
                  await queryClient.invalidateQueries(['/special-prices/insert']);

                  const dcAmt = SpecialPriceRequest.current.dcAmt as number;
                  const prodId = SpecialPriceRequest.current.prodId as number;
                  const synchronizedData: OrderDetCreate[] = removeEmptyRows(orderDetList);
                  for (let i = 0; i < synchronizedData.length; i++) {
                    if (synchronizedData[i].prodId == prodId) {
                      const orgSellAmt = Number(synchronizedData[i].baseAmt) + Number(synchronizedData[i].dcAmt); // 판매원가(단가 + 할인가)
                      synchronizedData[i].dcAmt = dcAmt;
                      synchronizedData[i].baseAmt = orgSellAmt - dcAmt;
                      synchronizedData[i].totAmt = (synchronizedData[i].baseAmt as number) * (synchronizedData[i].skuCnt as number);
                    }
                  }
                  synchronizedData[synchronizedData.length] = {};
                  setOrderDetList(synchronizedData);
                } else {
                  toastError(result.data.resultMessage);
                  throw new Error(result.data.resultMessage);
                }
              });
            }
          }}
          onClose={() => {
            /** 해당 주문의 특정 sku 에 한정되는 할인만 적용 */
            closeSpModal('DC_APPLY');
            SpecialPriceRequest.current = {};
            /** 기존 포커싱 상태가 잔존할 경우 해당 상태를 가져와 api 재호출 */
            if (MainGridRef.current?.api.getFocusedCell()?.rowIndex) {
              moveAndEdit((MainGridRef.current.api.getFocusedCell() as CellPosition).rowIndex, 'dcAmt', 500, false, true); // 마지막인자 true 이면 에디팅 모드로 들어가지 않고 포커스만 된다.
            }
          }}
        />
        <ConfirmModal
          title={
            '<div class="confirmMsg"><span class="big">작성 중인 주문전표를 <strong>샘플</strong>로</span><span class="small">전환하시겠어요??</span></div>'
          }
          open={orderModalType.type === 'FOR_SAMPLE' && orderModalType.active}
          onConfirm={() => {
            setProductState(ProductStatus.sample);
            changeAllProductsState(MainGridRef.current, ProductStatus.sample[0], [...(orderDetList ?? [])]);
            closeOrderModal('FOR_SAMPLE');
            setOrder({ ...order, orderCd: '5' }); // 주문분류는 샘플(5)
            setPrintType('orderSample');
            moveAndEdit(orderDetList.length - 1, 'skuNm', 200, false, false);
          }}
          onClose={(reason) => {
            if (reason != 'confirm') {
              setProductState(ProductStatus.sell); // 상태 변경 번복
            }
            closeOrderModal('FOR_SAMPLE');
          }}
        />
        <ConfirmModal
          title={`<div class="confirmMsg"><span class="big">작성 중인 샘플을 <strong>${productState[1]}전표</strong>로</span><span class="small">전환하시겠어요?</span></div>`}
          open={orderModalType.type === 'FOR_OTHER' && orderModalType.active}
          onConfirm={() => {
            changeAllProductsState(MainGridRef.current, productState[0], [...(orderDetList ?? [])]);
            setOrder({ ...order, orderCd: '9' }); // 판매 (10120)
          }}
          onClose={(reason) => {
            if (reason != 'confirm') {
              setProductState(ProductStatus.sample); // 상태 변경 번복
            }
            closeOrderModal('FOR_OTHER');
          }}
        />
        {/*<ConfirmModal
          title={'미출 관리 영역에 등록하시겠습니까?'}
          open={orderModalType.type === 'FOR_MICHUL' && orderModalType.active}
          onConfirm={() => {
            closeOrderModal('FOR_MICHUL');
            postOrderRequestForInsert({
              order: {
                ...order,
                sellerId: selectedRetail?.id,
                orderCd: '8',
                holdYn: 'N',
              },
              orderDetList: removeEmptyRow(orderDetList),
            });
          }}
          onClose={() => {
            closeOrderModal('FOR_MICHUL');
            changeAllProductsState(MainGridRef.current, ProductStatus.sell[0], [...(orderDetList ?? [])]);
          }}
          onKeyDown={(event) => {
            if (event.key == 'Enter') {
              closeOrderModal('FOR_MICHUL');
              postOrderRequestForInsert({
                order: {
                  ...order,
                  sellerId: selectedRetail?.id,
                  orderCd: '8',
                  holdYn: 'N',
                },
                orderDetList: removeEmptyRow(orderDetList),
              });
            }
          }}
        />*/}
        <ConfirmModal
          title={
            '<div class="confirmMsg arrows"><div class="top"><span>빈블러에서</span><em>옆</em><span>매장으로</span></div>상품 이동을 요청하시겠어요?</div>'
          }
          open={orderModalType.type === 'REQUEST' && orderModalType.active}
          onConfirm={() => {
            const storeReqList: StoreRequestReqCreate[] = [];
            const emptyRowRemoved: OrderDetCreate[] = removeEmptyRows(orderDetList, 'skuNm');
            for (let i = 0; i < emptyRowRemoved.length; i++) {
              storeReqList[i] = {
                skuId: emptyRowRemoved[i].skuId,
                skuCnt: emptyRowRemoved[i].skuCnt,
                etcCntn: '매장요청',
              };
            }
            insertStoreReqRequest(storeReqList).then((response) => {
              const { resultCode, body, resultMessage } = response.data;
              if (resultCode == 200) {
                toastSuccess('요청이 저장되었습니다.');
                ReqOrRetPrint();
                setPrintType('orderRequest');
                setOrderDetList([{}]);
                closeOrderModal('REQUEST');
              } else {
                console.log(response);
                toastError(resultMessage);
                setTimeout(() => {
                  buttonRequestRef.current?.blur();
                }, 500); // 버튼 포커스 제거)
              }
            });
          }}
          onClose={() => {
            closeOrderModal('REQUEST');
          }}
        />
        <ConfirmModal
          title={
            '<div class="confirmMsg"><span class="small">현재 입력된 상품을</span><span class="big"><strong>미출</strong>&nbsp;처리하시겠어요?</span></div>'
          }
          open={orderModalType.type === 'ALL_MICHUL' && orderModalType.active}
          onConfirm={() => {
            if (order.id || 0 > 0) {
              immediateOrderCreation('8', order, orderDetList, selectedRetail); // 8: 미출
            } else {
              immediateOrderCreation('8', order, orderDetList, selectedRetail);
            }
          }}
          onClose={() => {
            closeOrderModal('REQUEST');
          }}
          /*
          leftBtn={'보류처리'}
          leftBtnFn={() => {
            if (order.id || 0 > 0) {
              immediateOrderUpdate('8', order, orderDetList, selectedRetail, undefined, true);
            } else {
              immediateOrderCreation('8', order, orderDetList, selectedRetail, undefined, true);
            }
          }}
*/
        />
        <ConfirmModal
          title={`<div class="confirmMsg">
                    <span class="small">
                      현재 입력된 상품을 ${order.onSiteYn === 'Y' ? '(매장재고로)' : ''}
                    </span>
                    <span class="big">
                      <strong>샘플 발행</strong>&nbsp;하시겠어요?
                    </span>
                  </div>
                `}
          open={orderModalType.type === 'SAMPLE_ORDER' && orderModalType.active}
          onConfirm={() => {
            if (order.id && order.id > 0 && order.orderCd == '5') {
              toastError('샘플은 신규주문으로 진행하시기 바랍니다. 주문수정으로는 샘플주문을 만들 수 없습니다.');
            } else {
              immediateOrderCreation('5', order, orderDetList, selectedRetail); // 샘플 '5'
            }
          }}
          onClose={() => {
            closeOrderModal('REQUEST');
          }}
          leftBtn={'보류처리'}
          leftBtnFn={() => {
            console.log('order==>', order);
            if (order.id || 0 > 0) {
              immediateOrderUpdate('5', order, orderDetList, selectedRetail, undefined, true); // 샘플 '5'
            } else {
              immediateOrderCreation('5', order, orderDetList, selectedRetail, undefined, true); // 샘플 '5'
            }
          }}
        />
        <ConfirmModal
          title={'<div class="confirmMsg arrows"><div class="top"><span>매장에서</span><em>옆</em><span>빈블러로</span></div>상품 재고를 반납하시겠어요?</div>'}
          open={orderModalType.type === 'RETURN' && orderModalType.active}
          onConfirm={() => {
            const storeRetList: StoreRequestRetCreate[] = [];
            const emptyRowRemoved: OrderDetCreate[] = removeEmptyRows(orderDetList, 'skuNm');
            for (let i = 0; i < emptyRowRemoved.length; i++) {
              storeRetList[i] = {
                skuId: emptyRowRemoved[i].skuId,
                skuCnt: emptyRowRemoved[i].skuCnt,
                etcCntn: '매장반납',
              };
            }
            insertStoreRetsRequest(storeRetList).then((response) => {
              const { resultCode, body, resultMessage } = response.data;
              try {
                if (resultCode === 200) {
                  toastSuccess('반납에 성공하였습니다.');
                  ReqOrRetPrint();
                  setPrintType('orderReturn');
                  setOrderDetList([{}]);
                  closeOrderModal('RETURN');
                } else {
                  console.log(response);
                  toastError(resultMessage);
                  setTimeout(() => {
                    buttonReturnRef.current?.blur();
                  }, 500); // 버튼 포커스 제거)
                }
              } catch (e) {
                console.log(e);
              }
            });
          }}
          onClose={() => {
            closeOrderModal('RETURN');
          }}
        />
      </div>
    </aside>
  );
};
