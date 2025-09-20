import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ApiResponse,
  PageObject,
  RetailRequestPagingFilter,
  RetailResponsePaging,
  RetailRequestCreate,
  RetailRequestUpdate,
  RetailRequestFilter,
  RetailRequestDeleteList,
  RetailRequestUpdateSleepStatus,
  RetailResponseDetail,
  RetailRequestRetailAmtFilter,
} from '../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';
import { StateCreator } from 'zustand/esm';

type ModalType = 'CATEGORYSETTING' | 'ADD' | 'MOD' | 'CONFIRM' | 'DELETE' | 'DELETE_RECOMMAND' | 'UPDATE_SLEEP_STATUS';

interface RetailState {
  retail: RetailResponseDetail | undefined;
  setRetail: (retail: RetailResponseDetail) => void;
  onClear: () => void;
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  delPaging: PageObject;
  setDelPaging: (pagingInfo: PageObject | undefined) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

interface RetailApiState {
  //listRetail: (retailRequest: RetailRequestFilter) => AxiosPromise<ApiResponse>;
  insertRetail: (retailRequest: RetailRequestCreate) => AxiosPromise<ApiResponse>;
  updateRetail: (retailRequest: RetailRequestUpdate) => AxiosPromise<ApiResponse>; //updateRetailSleepStatus
  updateRetailSleepStatus: (retailRequest: RetailRequestUpdateSleepStatus) => AxiosPromise<ApiResponse>;
  deleteRetail: (retailId: number) => AxiosPromise<ApiResponse>;
  deleteRetails: (retailRequestDeleteList: RetailRequestDeleteList) => AxiosPromise<ApiResponse>;
  getRetailDetail: (retailId: number) => AxiosPromise<ApiResponse>;
  getRetailDetail2: (retailId: number) => AxiosPromise<ApiResponse>;
  getRetailTransInfo: (retailId: number) => AxiosPromise<ApiResponse>;
  selectRetailListPaging: (params: RetailRequestPagingFilter) => AxiosPromise<ApiResponse>;
  selectRetailListForReg: (params: RetailRequestFilter) => AxiosPromise<ApiResponse>; // 거래처 목록 조회(등록 영역)
  selectSomeRetailAmt: (params: RetailRequestRetailAmtFilter) => AxiosPromise<ApiResponse>; // 소매처별 금전거래 총합 조회
}

type Retail = RetailState & RetailApiState;

const initialStateCreator: StateCreator<Retail, any> = (set, get, api) => {
  return {
    retail: undefined,
    setRetail: (retail: RetailResponsePaging) => {
      set((state) => ({
        retail: retail,
      }));
    },
    paging: {
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
    },
    delPaging: {
      curPage: 1,
      pageRowCount: 999999,
    },
    setDelPaging: (pageObject) => {
      set((state) => ({
        delPaging: {
          ...state.delPaging,
          ...pageObject,
        },
      }));
    },
    modalType: { type: 'ADD', active: false },
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
    selectRetailListForReg: (filter) => {
      return authApi.get('/retail/listForReg', { params: filter });
    },
    selectSomeRetailAmt: (filter) => {
      return authApi.get('/retail/retailAmt', { params: filter });
    },
    /*listRetail: (retailRequest) => {
      return authApi.post('/retail/list', retailRequest);
    },*/
    insertRetail: (retailRequest) => {
      return authApi.post('/retail/insert', retailRequest);
    },
    updateRetail: (retailRequest) => {
      return authApi.put('/retail/update', retailRequest);
    },
    updateRetailSleepStatus: (retailRequest) => {
      return authApi.patch('/retail/updateSleepYn', retailRequest);
    },
    deleteRetail: (retailId) => {
      return authApi.delete(`/retail/delete/${retailId}`);
    },
    deleteRetails: (retailRequestDeleteList) => {
      return authApi.delete('/retail/deletes', {
        data: retailRequestDeleteList,
      });
    },
    getRetailDetail: (retailId) => {
      return authApi.get(`/retail/detail/${retailId}`);
    },
    getRetailDetail2: (retailId) => {
      return authApi.get(`/retail/detail2/${retailId}`);
    },
    selectRetailListPaging: (params) => {
      return authApi.get('/retail/paging', { params });
    },
    getRetailTransInfo: (retailId) => {
      return authApi.get(`/retail/trans/count/${retailId}`);
    },
    onClear: () => {
      set(() => initialStateCreator(set, get, api), true);
    },
  };
};

export const useRetailStore = create<RetailState & RetailApiState>()(devtools(immer(initialStateCreator)));
