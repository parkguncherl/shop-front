import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ApiResponse,
  PageObject,
  ReceivingHistoryRequestDcAmtUpdate,
  ReceivingHistoryRequestFactorySpc,
  ReceivingHistoryRequestOutGoingCreate,
  ReceivingHistoryRequestOutGoingDelete,
  ReceivingHistoryRequestOutGoingUpdate,
} from '../generated';
import { StateCreator } from 'zustand/esm';
import { authApi } from '../libs';
import { AxiosPromise } from 'axios';

// 모달 타입 정의
type ModalType = 'OUTGOING_CREATE' | 'OUTGOING_UPDATE' | 'OUTGOING_DELETE' | 'INOUT_DETAIL';

// 입고내역 관련 상태 인터페이스 정의
interface ReceivingHistoryState {
  onClear: () => void; // 상태를 초기화하는 함수
  paging: PageObject; // 페이징 정보
  setPaging: (pagingInfo: PageObject | undefined) => void; // 페이징 정보를 설정하는 함수
  modalType: { type: ModalType; active: boolean }; // 모달 상태
  openModal: (type: ModalType) => void; // 모달을 여는 함수
  closeModal: (type: ModalType) => void; // 모달을 닫는 함수
}

interface ReceivingHistoryApiState {
  createOutGoing: (request: ReceivingHistoryRequestOutGoingCreate) => AxiosPromise<ApiResponse>;
  updateOutGoing: (request: ReceivingHistoryRequestOutGoingUpdate[]) => AxiosPromise<ApiResponse>;
  deleteOutGoing: (request: ReceivingHistoryRequestOutGoingDelete) => AxiosPromise<ApiResponse>;
  updateDcAmt: (request: ReceivingHistoryRequestDcAmtUpdate[]) => AxiosPromise<ApiResponse>;
  upsertFactorySpc: (request: ReceivingHistoryRequestFactorySpc) => AxiosPromise<ApiResponse>;
}

// Factory 상태와 API 상태를 통합
type ReceivingHistory = ReceivingHistoryState & ReceivingHistoryApiState;

// 초기 상태 생성 함수
const initialStateCreator: StateCreator<ReceivingHistory, any> = (set, get, api) => {
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
    modalType: { type: 'OUTGOING_CREATE', active: false },
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
    createOutGoing: (request) => {
      return authApi.post('/receiving-history/outgoing/create', request);
    },
    updateOutGoing: (updateList) => {
      return authApi.put('/receiving-history/outgoing/update', updateList);
    },
    deleteOutGoing: (request) => {
      return authApi.delete('/receiving-history/outgoing/delete', { data: request });
    },
    updateDcAmt: (updateList) => {
      return authApi.put('/receiving-history/dcamt/update', updateList);
    },
    upsertFactorySpc: (request) => {
      return authApi.post('/receiving-history/factoryspc/upsert', request);
    },
  };
};

// Zustand Store 생성
export const useReceivingHistoryStore = create<ReceivingHistoryState & ReceivingHistoryApiState>()(devtools(immer(initialStateCreator)));
