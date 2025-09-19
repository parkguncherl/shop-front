import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ApiResponse,
  PageObject,
  RetailResponsePaging,
  VatInoutRequestCreate,
  VatInoutRequestDelete,
  VatInoutRequestUpdate,
  VatRequestCreate,
  VatRequestUpdate,
  VatResponsePaging,
} from '../generated';
import { StateCreator } from 'zustand/esm';
import { authApi } from '../libs';
import { AxiosPromise } from 'axios';

type ModalType = 'ADD' | 'MOD' | 'DELETE' | 'DEPOSIT' | 'INOUT_ADD' | 'INOUT_DEL';

interface VatState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  vatResponsePaging: VatResponsePaging[];
  setVatResponsePaging: (vatResponsePaging: VatResponsePaging[]) => void;
  vatResponsePagingInfo: VatResponsePaging | undefined;
  setVatResponsePagingInfo: (vatResponsePaging: VatResponsePaging | undefined) => void;
  retail: RetailResponsePaging | undefined;
  setRetail: (retail: RetailResponsePaging | undefined) => void;
  vatStndrYmd: string | undefined;
  setVatStndrYmd: (vatStrYmd: string | undefined) => void;
  vatStrYmd: string | undefined;
  setVatStrYmd: (vatStrYmd: string | undefined) => void;
  vatEndYmd: string | undefined;
  setVatEndYmd: (vatEndYmd: string | undefined) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

interface VatApiState {
  insertVatInfo: (vatRequestCreate: VatRequestCreate) => AxiosPromise<ApiResponse>;
  insertVatInouts: (vatInoutsRequestCreate: VatInoutRequestCreate[]) => AxiosPromise<ApiResponse>;
  updateVatInfo: (vatRequestUpdate: VatRequestUpdate) => AxiosPromise<ApiResponse>;
  updateVatInout: (vatInoutRequestUpdate: VatInoutRequestUpdate) => AxiosPromise<ApiResponse>;
  deleteVatInout: (vatInoutRequestDelete: VatInoutRequestDelete) => AxiosPromise<ApiResponse>;
  updateVatIssuYn: (vatRequestUpdate: Pick<VatRequestUpdate, 'id' | 'issuYn'>) => AxiosPromise<ApiResponse>;
  deleteVat: (vatRequestUpdate: Pick<VatRequestUpdate, 'id'>) => AxiosPromise<ApiResponse>;
  selectVatInfoById: (id: number) => AxiosPromise<ApiResponse>;
  getVatDetail: (id: number) => AxiosPromise<ApiResponse>;
}

const initialStateCreator: StateCreator<VatState & VatApiState, any> = (set, get, api) => {
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
    vatResponsePaging: [],
    setVatResponsePaging: (vatResponsePaging) => {
      set(() => ({
        vatResponsePaging: vatResponsePaging,
      }));
    },
    vatResponsePagingInfo: undefined,
    setVatResponsePagingInfo: (vatResponsePaging) => {
      set(() => ({
        vatResponsePagingInfo: vatResponsePaging,
      }));
    },
    retail: undefined,
    setRetail: (retail) => {
      set(() => ({
        retail: retail,
      }));
    },
    vatStndrYmd: undefined,
    setVatStndrYmd: (vatStndrYmd) => {
      set(() => ({
        vatStndrYmd: vatStndrYmd,
      }));
    },
    vatStrYmd: undefined,
    setVatStrYmd: (vatStrYmd) => {
      set(() => ({
        vatStrYmd: vatStrYmd,
      }));
    },
    vatEndYmd: undefined,
    setVatEndYmd: (vatEndYmd) => {
      set(() => ({
        vatEndYmd: vatEndYmd,
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
    insertVatInfo: (VatRequestCreate) => {
      return authApi.post('/vat', VatRequestCreate);
    },
    insertVatInouts: (vatInoutsRequestCreate) => {
      return authApi.post('/vat/inout', vatInoutsRequestCreate);
    },
    updateVatInfo: (vatRequestUpdate) => {
      return authApi.patch('/vat', vatRequestUpdate);
    },
    updateVatInout: (vatInoutRequestUpdate) => {
      return authApi.patch('/vat/inout', vatInoutRequestUpdate);
    },
    deleteVatInout: (vatInoutRequestDelete) => {
      return authApi.delete('/vat/inout', {
        data: vatInoutRequestDelete,
      });
    },
    updateVatIssuYn: (VatRequestCreate) => {
      return authApi.patch('/vat/issuYn', VatRequestCreate);
    },
    deleteVat: (vatRequestUpdate) => {
      return authApi.delete('/vat', { data: vatRequestUpdate });
    },
    selectVatInfoById: (id) => {
      return authApi.get(`/vat/${id}`);
    },
    getVatDetail: (id) => {
      return authApi.get(`/print/vat/detail/${id}`);
    },
  };
};

export const useVatStore = create<VatState & VatApiState>()(devtools(immer(initialStateCreator)));
