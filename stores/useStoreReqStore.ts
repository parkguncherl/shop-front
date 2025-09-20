import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { PageObject, ApiResponse, StoreRequestReqCreate, StoreReqRequestReqUpdate } from '../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';

/**
 * 본 전역 상태는 주문에 관한 고수준의 영역을 관할(보류, 미송, 미출 등의 주문 관련 하위 관할은 별도로 상태 관리 중)
 * */

type ModalType = 'RETURN';

interface StoreReqState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

interface StoreReqApiState {
  insertStoreReqRequest: (storeRequestReqCreateList: StoreRequestReqCreate[]) => AxiosPromise<ApiResponse>;
  insertStoreRetsRequest: (storeRequestRetCreateList: StoreRequestReqCreate[]) => AxiosPromise<ApiResponse>;
  //  insertStoreBatchRetRequest: (storeRequestBatchRetCreateList: StoreRequestBatchRetCreate[]) => AxiosPromise<ApiResponse>;
  updateStoreReq: (storeReqRequestReqUpdateList: StoreReqRequestReqUpdate[]) => AxiosPromise<ApiResponse>;
}

type StoreInStoreReqStore = StoreReqState & StoreReqApiState; // & ProductApiState;

/**
 * 전역 상태에 의도치 않은 데이터가 혼입되지 않도록 set 메서드 호출 이전 대응할 것
 * */
const initialStateCreator: StateCreator<StoreInStoreReqStore, any> = (set, get, api) => {
  return {
    paging: {
      curPage: 1,
      pageRowCount: 20,
    },
    setPaging: (pageObject) => {
      set((state) => ({
        paging: {
          ...state.paging,
          ...pageObject,
        },
      }));
    },
    modalType: { type: 'RETURN', active: false },
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
    insertStoreReqRequest: (storeRequestReqCreateList) => {
      return authApi.post('/store/req/request', storeRequestReqCreateList);
    },
    insertStoreRetsRequest: (storeRequestRetCreateList) => {
      return authApi.post('/store/req/return', storeRequestRetCreateList);
    },
    /*
    insertStoreBatchRetRequest: (storeRequestBatchRetCreateList) => {
      return authApi.post('/store/req/batchReturn', storeRequestBatchRetCreateList);
    },
*/
    updateStoreReq: (storeReqRequestReqUpdateList) => {
      return authApi.patch('/store/update/storeReq', storeReqRequestReqUpdateList);
    },
  };
};

export const useStoreReqStore = create<StoreInStoreReqStore>()(devtools(immer(initialStateCreator)));
