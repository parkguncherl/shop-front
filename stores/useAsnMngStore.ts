import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ApiResponse,
  AsnMngRequestInsert,
  AsnMngResponsePaging,
  AsnMngRequestDelete,
  PageObject,
  AsnMngRequestRetrieval,
  AsnMngRequestUpdate,
  AsnMngRequestSimpleUpdate,
  AsnMngRequestInitiate,
} from '../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';
import { StateCreator } from 'zustand/esm';

type DefaultModalType =
  | 'ADD'
  | 'MOD'
  | 'ADD_SKU'
  | 'CONFIRMATION_CONFIRM'
  | 'DEL_CONFIRMED'
  | 'RETRIEVAL'
  | 'RETRIEVAL_PARTIAL'
  | 'CANCEL_CONFIRMED'
  | 'ADD_MISONG_MICHUL'
  | 'DELETE_ASN_REQUEST'
  | 'MOD_FACTORY_SPC';
type ModalTypeForEChartArea = 'ORDERHIST_DET' | 'REORDER_DET' | 'MISONG_HIST' | 'MICHUL_DET';

type ModalType = DefaultModalType | ModalTypeForEChartArea;

interface InDetHist {
  skuNm?: string;
  skuId?: number;
  startDate?: string;
  endDate?: string;
}

interface AsnState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  selectedAsnPagingList: AsnMngResponsePaging[] /** 발주 페이징 목록 중 특정 목적으로 사용하고자 하는 일부 데이터를 담는다.(메인 페이지 데이터 새로고침을 희망할 시 빈 객체 하나만을 담아 set) */;
  setSelectedAsnPagingList: (AsnPagingList: AsnMngResponsePaging[]) => void;
  usedInDetHist: InDetHist /** 주로 필터링 목적으로 사용(상세내역 팝업에서 데이터를 조회할 때 사용되는 인자로서 기능) */;
  setUsedInDetHist: (used: InDetHist) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

interface AsnMngApiState {}

interface AsnMngApiState {
  insertAsnsAsExpect: (asnRequestInsertList: AsnMngRequestInsert[]) => AxiosPromise<ApiResponse>;
  updateAsns: (asnRequestUpdates: AsnMngRequestUpdate[]) => AxiosPromise<ApiResponse>;
  updateExpectAsnMngs: (asnMngRequestSimpleUpdate: AsnMngRequestSimpleUpdate) => AxiosPromise<ApiResponse>;
  deleteAsns: (asnRequestDeleteList: AsnMngRequestDelete[]) => AxiosPromise<ApiResponse>;
  initiateAsn: (asnRequestInitiate: AsnMngRequestInitiate) => AxiosPromise<ApiResponse>;
  asnPartialRetrieval: (asnRequestRetrievalList: AsnMngRequestRetrieval[]) => AxiosPromise<ApiResponse>; // 부분 출고등록
  asnTargetCount: () => AxiosPromise<ApiResponse>; // 등록대상 건수 가져오기
  createAsnTarget: () => AxiosPromise<ApiResponse>; // asn등록
}

const initialStateCreator: StateCreator<AsnState & AsnMngApiState, any> = (set, get, api) => {
  return {
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
    selectedAsnPagingList: [],
    setSelectedAsnPagingList: (AsnPagingList) => {
      set((state) => ({
        selectedAsnPagingList: AsnPagingList,
      }));
    },
    usedInDetHist: {},
    setUsedInDetHist: (InDetHist) => {
      set((state) => ({
        usedInDetHist: InDetHist,
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
    insertAsnsAsExpect: (asnRequestInsertList) => {
      return authApi.post('/asnMng/asExpectation', asnRequestInsertList);
    },
    updateAsns: (asnRequestUpdates) => {
      return authApi.patch('/asnMng', asnRequestUpdates);
    },
    updateExpectAsnMngs: (asnMngRequestSimpleUpdate) => {
      return authApi.patch('/asnMng/updateExpectAsnMngs', asnMngRequestSimpleUpdate);
    },
    deleteAsns: (asnRequestDeleteList) => {
      return authApi.delete('/asnMng', {
        data: asnRequestDeleteList,
      });
    },
    initiateAsn: (asnRequestInitiate) => {
      return authApi.patch('/asnMng/initiate', asnRequestInitiate);
    },
    asnPartialRetrieval: (asnRequestInsertList) => {
      return authApi.post('/asnMng/Retrieval/partial', asnRequestInsertList);
    },
    asnTargetCount: () => {
      return authApi.get('/asnMng/asnTargetCount');
    },
    createAsnTarget: () => {
      return authApi.get('/asnMng/createAsnTarget');
    },
  };
};

export const useAsnMngStore = create<AsnState & AsnMngApiState>()(devtools(immer(initialStateCreator)));
