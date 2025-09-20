// stores/wms/useAsnStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, AsnRequestCreateAsn, AsnRequestUpdateAsn, PageObject } from '../../generated';
import { StateCreator } from 'zustand/esm';
import { authApi } from '../../libs';
import { AxiosPromise } from 'axios';

type ModalType = 'ASN_DETAIL';

// ASN 상태 인터페이스 정의
interface AsnState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  updateAsn: (request: AsnRequestUpdateAsn[]) => AxiosPromise<ApiResponse>;
  createEtcAsn: (request: AsnRequestCreateAsn) => AxiosPromise<ApiResponse>;
  createMarketAsn: (request: AsnRequestCreateAsn) => AxiosPromise<ApiResponse>;
}

interface AsnApiState {}

type AsnStore = AsnState & AsnApiState;

// 초기 상태 및 메서드 정의
const initialStateCreator: StateCreator<AsnStore, any> = (set, get) => {
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
    modalType: { type: 'ASN_DETAIL', active: false },
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
    updateAsn: (request) => {
      return authApi.patch('/wms/asn/update', request);
    },
    createEtcAsn: (request) => {
      return authApi.post('/wms/asn/createEtcAsn', request);
    },
    createMarketAsn: (request) => {
      return authApi.post('/wms/asn/createMarketAsn', request);
    },
  };
};

export const useAsnStore = create<AsnStore>()(devtools(immer(initialStateCreator)));
