import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, FactorySettleRequestCreate, FactorySettleRequestDelete, FactorySettleRequestUpdateDcAmt, PageObject } from '../generated';
import { StateCreator } from 'zustand/esm';
import { authApi } from '../libs';
import { AxiosPromise } from 'axios';

// 모달 타입 정의
type ModalType = 'PAYMENT_CREATE' | 'PAYMENT_UPDATE' | 'PAYMENT_DELETE' | 'SETTLE_DETAIL';

// Factory 정산 관련 상태 인터페이스 정의
interface FactorySettleState {
  onClear: () => void; // 상태를 초기화하는 함수
  paging: PageObject; // 페이징 정보
  setPaging: (pagingInfo: PageObject | undefined) => void; // 페이징 정보를 설정하는 함수
  modalType: { type: ModalType; active: boolean }; // 모달 상태
  openModal: (type: ModalType) => void; // 모달을 여는 함수
  closeModal: (type: ModalType) => void; // 모달을 닫는 함수
}

interface FactorySettleRequestState {
  factoryId: number;
  workYmd: Date | string;
  tranYmd: Date | string;
  cashAmt?: number | string;
  accountAmt?: number | string;
  dcAmt?: number | string;
  etcCntn?: string;
  tranId?: number;
}

// Factory API 관련 상태 인터페이스 정의
interface FactorySettleApiState {
  insertFactorySettle: (factorySettleRequest: FactorySettleRequestState) => AxiosPromise<ApiResponse>;
  updateFactorySettle: (factorySettleRequest: FactorySettleRequestState) => AxiosPromise<ApiResponse>;
  deleteFactorySettle: (FactorySettleRequestDelete: FactorySettleRequestDelete) => AxiosPromise<ApiResponse>;
  updateTransDcAmt: (updateTransDcAmtRequest: FactorySettleRequestUpdateDcAmt) => AxiosPromise<ApiResponse>;
}

// Factory 상태와 API 상태를 통합
type PayFactory = FactorySettleState & FactorySettleApiState;

// 초기 상태 생성 함수
const initialStateCreator: StateCreator<PayFactory, any> = (set, get, api) => {
  return {
    paging: {
      curPage: 1,
      pageRowCount: 50,
    },
    setPaging: (pageObject) => {
      set((state) => ({
        paging: {
          ...state.paging,
          ...pageObject,
        },
      }));
    },
    modalType: { type: 'PAYMENT_CREATE', active: false },
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
    onClear: () => {
      set(() => initialStateCreator(set, get, api), true);
    },
    insertFactorySettle: (factorySettleRequest) => {
      return authApi.post('/factory-settle/pay/create', factorySettleRequest);
    },
    updateFactorySettle: (factorySettleRequest) => {
      return authApi.put('/factory-settle/pay/modify', factorySettleRequest);
    },
    deleteFactorySettle: (FactorySettleRequestDelete) => {
      return authApi.delete('/factory-settle/pay/remove', {
        data: FactorySettleRequestDelete,
      });
    },
    updateTransDcAmt: (updateTransDcAmtRequest) => {
      return authApi.put('/factory-settle/trans/dcamt/modify', updateTransDcAmtRequest);
    },
  };
};

// Zustand Store 생성
export const useFactorySettleStore = create<FactorySettleState & FactorySettleApiState>()(devtools(immer(initialStateCreator)));
