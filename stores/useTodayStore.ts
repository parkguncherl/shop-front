import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';
import { ApiResponse, PageObject, TodayRequestUpdateToBoryu } from '../generated';

type ModalType = 'CATEGORY_SETTING' | 'DELETE' | 'BORYU' | 'RELEASEEDIT';

interface TodayState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  loading: boolean;
  error: string | null;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

interface TodayApiState {
  updateTodaysToBoryu: (requestUpdateToBoryuList: TodayRequestUpdateToBoryu[]) => AxiosPromise<ApiResponse>;
  deleteTodayOrders: (ListOfId: number[]) => AxiosPromise<ApiResponse>;
  getTodayOrderDetail: (id: number[]) => AxiosPromise<ApiResponse>;
  getTodayOrderDetailByPayId: (id: number[]) => AxiosPromise<ApiResponse>;
  getStoreReqById: (id: number[]) => AxiosPromise<ApiResponse>;
  //updateCustStatus: (requestUpdateCustStatus: TodayRequestUpdateCustStatus) => AxiosPromise<ApiResponse>;
}

type TodayStore = TodayState & TodayApiState;

const initialStateCreator: StateCreator<TodayStore, any> = (set, get, api) => {
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
    loading: false,
    error: null,
    modalType: { type: 'RELEASEEDIT', active: false },
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

    updateTodaysToBoryu: (requestUpdateToBoryuList) => {
      set({ loading: true, error: null });
      return authApi
        .put('/orderInfo/today/update/boryu', requestUpdateToBoryuList)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to update today order', loading: false });
          throw error;
        });
    },

    deleteTodayOrders: (ListOfId) => {
      set({ loading: true, error: null });
      return authApi
        .delete('/orderInfo/today/delete', {
          data: ListOfId,
        })
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to delete today order', loading: false });
          throw error;
        });
    },
    // orderId
    getTodayOrderDetail: (id: number[]) => {
      set({ loading: true, error: null });
      return authApi
        .get(`/print/today/detail`, {
          params: {
            orderId: id,
          },
        })
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to get today order detail', loading: false });
          throw error;
        });
    },
    // payId
    getTodayOrderDetailByPayId: (id: number[]) => {
      set({ loading: true, error: null });
      return authApi
        .get(`/print/today/payDetail`, {
          params: {
            payId: id,
          },
        })
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to get today order detail', loading: false });
          throw error;
        });
    },
    getStoreReqById: (ids: number[]) => {
      set({ loading: true, error: null });
      return authApi
        .get(`/print/today/storeReq`, {
          params: {
            jobIds: ids,
          },
        })
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to get today order detail', loading: false });
          throw error;
        });
    },

    /*updateCustStatus: (requestUpdateCustStatus) => {
      set({ loading: true, error: null });
      return authApi
        .patch('/orderInfo/today/update/custStatus', requestUpdateCustStatus)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to update today order', loading: false });
          throw error;
        });
    },*/
  };
};

export const useTodayStore = create<TodayStore>()(devtools(immer(initialStateCreator)));
