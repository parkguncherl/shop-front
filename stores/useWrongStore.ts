import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, PageObject, WrongRequestInsertWrongInfo, WrongResponsePaging } from '../generated';
import { authApi } from '../libs';
import { AxiosPromise } from 'axios';

type ModalType = 'WRONG_ADD' | 'WRONG_MOD' | 'WRONG_CANCEL' | 'WRONG_MERGE';

interface WrongState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  selectedWrongDelivery: WrongResponsePaging | undefined;
  setSelectedWrongDelivery: (selectedWrongDelivery: WrongResponsePaging | undefined) => void;
}

interface WrongApiState {
  registerWrongInfo: (insertWrongInfo: WrongRequestInsertWrongInfo) => AxiosPromise<ApiResponse>;
  deleteWrongInfo: (jobId: number) => AxiosPromise<ApiResponse>;
  rejectWrongInfo: (jobId: number) => AxiosPromise<ApiResponse>;
  tranWrongInfo: (jobId: number) => AxiosPromise<ApiResponse>;
}

type WrongStore = WrongState & WrongApiState;

const initialStateCreator: StateCreator<WrongStore, any> = (set, get, api) => {
  return {
    paging: {
      curPage: 1,
      pageRowCount: 999999, //999999,
    },
    setPaging: (pageObject) => {
      set((state) => ({
        paging: {
          ...state.paging,
          ...pageObject,
        },
      }));
    },
    modalType: { type: 'WRONG_ADD', active: false },
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
    // todo 전역 상태 사용
    selectedWrongDelivery: undefined,
    setSelectedWrongDelivery: (selectedWrongDelivery?: WrongResponsePaging) => {
      set((state) => ({
        selectedWrongDelivery: selectedWrongDelivery,
      }));
    },
    registerWrongInfo: (insertWrongInfo) => {
      return authApi.post('/orderInfo/wrong/register', insertWrongInfo);
    },
    deleteWrongInfo: (jobId) => {
      return authApi.delete(`/orderInfo/wrong/${jobId}`);
    },
    rejectWrongInfo: (jobId) => {
      return authApi.put('/orderInfo/wrong/reject/' + jobId);
    },
    tranWrongInfo: (jobId) => {
      return authApi.put('/orderInfo/wrong/tran/' + jobId);
    },
  };
};

export const useWrongStore = create<WrongStore>()(devtools(immer(initialStateCreator)));
