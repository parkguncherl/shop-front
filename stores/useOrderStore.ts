import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ApiResponse,
  OrderDetCreate,
  RetailAmtResponse,
  OrderRequestUpdate,
  TodayResponseTodayAmt,
  MainVatList,
  OrderControllerApiUpdateBundleYnRequest,
  OrderRequestUpdateInfo,
  OrderRequestCreateInfo,
  OrderDetRequestUpdateField,
} from '../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';
import { Order } from '../generated';
import { ProductStatus } from '../libs/const';

/**
 * 본 전역 상태는 주문에 관한 고수준의 영역을 관할(보류, 미송, 미출 등의 주문 관련 하위 관할은 별도로 상태 관리 중)
 * */

type ModalType =
  | 'PAY_CREATE'
  | 'PAY_UPDATE'
  | 'BORYU_CREATE'
  | 'ORDER_PAYMENT'
  | 'DELETE'
  | 'FOR_SAMPLE'
  | 'FOR_OTHER'
  | 'FOR_MICHUL'
  | 'SAMPLE_ORDER'
  | 'ALL_MICHUL'
  | 'REQUEST'
  | 'RETURN'
  | 'SKU_SEARCH';

interface OrderState {
  closeModal: (type: ModalType) => void;
  modalType: { type: ModalType; active: boolean };
  onClear: () => void;
  openModal: (type: ModalType) => void;
  //paging: PageObject;
  //setPaging: (pagingInfo: PageObject | undefined) => void;
  order: Order; // orderReg 내에서 소매처 선택할 시 기본적으로 order 전역 상태에 id를 등록할 것
  setOrder: (order: Order) => void;
  waitCount: number;
  setWaitCount: (count: number) => void;
  boryuCount: number;
  setBoryuCount: (count: number) => void;
  orderDetList: OrderDetCreate[];
  setOrderDetList: (orderDet: OrderDetCreate[]) => void;
  amtSummary: { retail?: RetailAmtResponse; today?: TodayResponseTodayAmt; vat?: MainVatList[] };
  setAmtSummary: (summary?: { retail?: RetailAmtResponse; today?: TodayResponseTodayAmt; vat?: MainVatList[] }) => void;
  selectWaitCount: () => AxiosPromise<ApiResponse>;
  selectBoryuCount: () => AxiosPromise<ApiResponse>;
  jangGgiCount: (orderId: number) => AxiosPromise<ApiResponse>;
  productState: string[] /* 판매상태 코드 / 코드명 / grid className / 단축키( alt + ) */;
  setProductState: (productState: string[]) => void;
}

interface OrderApiState {
  selectExtendedOrder: (orderId: number) => AxiosPromise<ApiResponse>;
  insertOrderInfo: (orderRequestCreateInfo: OrderRequestCreateInfo) => AxiosPromise<ApiResponse>;
  updateOrder: (orderRequestUpdate: OrderRequestUpdate) => AxiosPromise<ApiResponse>;
  updateOrderInfo: (orderRequestUpdateInfo: OrderRequestUpdateInfo) => AxiosPromise<ApiResponse>;
  updateBundleYn: (orderRequestUpdate: OrderControllerApiUpdateBundleYnRequest) => AxiosPromise<ApiResponse>;
  deleteOrders: (ids: number[]) => AxiosPromise<ApiResponse>;
  orderPrint: (id: number, printBtn: boolean) => AxiosPromise<ApiResponse> | null;
  updateOrderDetEtc: (orderDetRequestUpdate: OrderDetRequestUpdateField) => AxiosPromise<ApiResponse>;
}

type OrderInOrderStore = OrderState & OrderApiState; // & ProductApiState;

/**
 * 전역 상태에 의도치 않은 데이터가 혼입되지 않도록 set 메서드 호출 이전 대응할 것
 * */
const initialStateCreator: StateCreator<OrderInOrderStore, any> = (set, get, api) => {
  return {
    /*paging: {
      curPage: 1,
      pageRowCount: 999999,
    },
    setPaging: (pageObject) => {
      set((state) => ({
        paging: {
          ...state.paging,
          ...pageObject,
        },
      }));
    },*/
    /** order 설정의 경우 orderDetList 의 빈 배열 의존으로 인하여 orderDetList 변화에 따라 즉시 상태를 변경하기가 어려울 수 있음, 기본적으로 전송 직전 최신화
     * 본 전역 상태 변경시 OrderReg 영역이 상태 변화에 대응하여 반응함
     * id 값이 undefined 로 변경될 시 주문 생성 혹은 업데이트가 이루어진 것으로 간주할 수 있음
     * id(orderId) 값이 undefined 가 아닐 경우 주문 수정 상태
     * orderCd 동기화 여부 확인! */
    order: { bundleYn: 'N', orderCd: '9' },
    setOrder: (order: Order) => {
      set((state) => ({
        order: order,
      }));
    },
    /** orderDetList 의 경우 초기에 부재하는 값(이를태면 id) 이 요청을 통해 주문상세 호출할 시 저장되어 있어야 함 */
    orderDetList: [{}],
    setOrderDetList: (orderDet: OrderDetCreate[]) => {
      set((state) => ({
        orderDetList: orderDet,
      }));
    },
    waitCount: 0,
    setWaitCount: (count: number) => {
      set((state) => ({
        waitCount: count,
      }));
    },
    boryuCount: 0,
    setBoryuCount: (count: number) => {
      set((state) => ({
        boryuCount: count,
      }));
    },
    amtSummary: {},
    setAmtSummary: (summary?: { retail?: RetailAmtResponse; today?: TodayResponseTodayAmt; vat?: MainVatList[] }) => {
      set((state) => ({
        amtSummary: summary,
      }));
    },
    productState: ProductStatus.sell,
    setProductState: (productState: string[]) => {
      set((state) => ({
        productState: productState,
      }));
    },
    modalType: { type: 'PAY_CREATE', active: false },
    openModal: (type) => {
      set((state) => ({
        modalType: {
          type,
          active: true,
        },
      }));
    },
    closeModal: (type) => {
      set((state) => ({
        modalType: {
          type,
          active: false,
        },
      }));
    },
    selectExtendedOrder: (orderId) => {
      return authApi.get(`/order/extended/${orderId}`);
    },
    insertOrderInfo: (orderRequestCreateInfo) => {
      return authApi.post('/order/insert/info', orderRequestCreateInfo);
    },
    updateOrder: (orderRequestUpdate) => {
      return authApi.patch('/order/update', orderRequestUpdate);
    },
    updateOrderInfo: (orderRequestUpdateInfo) => {
      return authApi.patch('/order/update/info', orderRequestUpdateInfo);
    },
    updateBundleYn: (orderRequestUpdate) => {
      return authApi.patch('/order/updateBundleYn', orderRequestUpdate);
    },
    deleteOrders: (ListOfId) => {
      return authApi.delete('/order/delete', {
        data: ListOfId,
      });
    },
    onClear: () => {
      set(() => initialStateCreator(set, get, api), true);
    },
    selectWaitCount: () => {
      return authApi.get('/job/searchDelayCount');
    },
    jangGgiCount: (orderId) => {
      return authApi.put('/print/jangggiCntPlus', null, {
        params: {
          orderId: orderId,
        },
      });
    },
    selectBoryuCount: () => {
      return authApi.get('/order/selectBoryuCount');
    },
    orderPrint: (orderId: any, printBtn: boolean) => {
      if (!printBtn) {
        return null;
      }
      return authApi.get('/print/order/detail', {
        params: {
          orderId: orderId,
        },
      });
    },
    updateOrderDetEtc: (orderDetRequestUpdate) => {
      return authApi.patch('/order/updateOrderDetEtc', orderDetRequestUpdate);
    },
  };
};

export const useOrderStore = create<OrderInOrderStore>()(devtools(immer(initialStateCreator)));
