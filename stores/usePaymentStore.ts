import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, PayRequestCreate, PayRequestNowAmtFilter, PayRequestUpdate, PayRequestUpdateCustStatus, PayResponse } from '../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';

/**
 * 본 전역 상태는 주문에 관한 고수준의 영역을 관할(보류, 미송, 미출 등의 주문 관련 하위 관할은 별도로 상태 관리 중)
 * */

//type ModalType = 'PAYMENT_CREATE' | 'PAYMENT_UPDATE';

interface PayState {
  paymentInfo: PayResponse;
  setPaymentInfo: (payResponse?: PayResponse) => void;
  //closeModal: (type: ModalType) => void;
  //modalType: { type: ModalType; active: boolean };
  //openModal: (type: ModalType) => void;
}

interface PayApiState {
  selectPaymentInfo: (id: number) => AxiosPromise<ApiResponse>;
  createPayment: (payRequestCreate: PayRequestCreate) => AxiosPromise<ApiResponse>;
  updatePayment: (payRequestUpdate: PayRequestUpdate) => AxiosPromise<ApiResponse>;
  getNowAmtInCondition: (nowAmtFilter: PayRequestNowAmtFilter) => AxiosPromise<ApiResponse>;
  updateCustStatus: (requestUpdateCustStatus: PayRequestUpdateCustStatus) => AxiosPromise<ApiResponse>;
}

type PayInPayStore = PayState & PayApiState;

/**
 * 전역 상태에 의도치 않은 데이터가 혼입되지 않도록 set 메서드 호출 이전 대응할 것
 * */
const initialStateCreator: StateCreator<PayInPayStore, any> = (set, get, api) => {
  return {
    /*modalType: { type: 'PAYMENT_CREATE', active: false },
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
    },*/
    paymentInfo: {},
    setPaymentInfo: (payResponse?: PayResponse) => {
      set((state) => ({
        paymentInfo: payResponse,
      }));
    },
    selectPaymentInfo: (id) => {
      return authApi.get(`/pay/${id}`);
    },
    createPayment: (payRequestCreate) => {
      console.log('payRequestCreate============================', payRequestCreate);
      return authApi.post('/pay/create', payRequestCreate);
    },
    updatePayment: (payRequestUpdate) => {
      return authApi.patch('/pay/update', payRequestUpdate);
    },
    getNowAmtInCondition: (nowAmtFilter) => {
      return authApi.get('/pay/nowAmt', {
        params: {
          ...nowAmtFilter,
        },
      });
    },
    updateCustStatus: (requestUpdateCustStatus) => {
      return authApi.patch('/pay/custStatus', requestUpdateCustStatus);
    },
  };
};

export const usePaymentStore = create<PayInPayStore>()(devtools(immer(initialStateCreator)));
