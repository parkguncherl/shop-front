import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';
import { ApiResponse, Create, DeleteMichul, PageObject, UpdateCustStatus, UpdateMichul } from '../generated';

type ModalType = 'ORDEREDIT' | 'RELEASEEDIT' | 'PRODUCTTALLY' | 'CATEGORYSETTING' | 'CONFIRM_REGISTER_ASN' | 'CONFIRM_DELETE_ATEACH';

interface MichulState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  loading: boolean;
  error: string | null;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

interface MichulApiState {
  createMichulOrder: (orderData: Create) => AxiosPromise<ApiResponse>;
  updateMichul: (update: UpdateMichul) => AxiosPromise<ApiResponse>;
  deleteMichuls: (deleteMichulList: DeleteMichul[]) => AxiosPromise<ApiResponse>;
  getMichulOrderDetail: (id: number) => AxiosPromise<ApiResponse>;
}

type MichulStore = MichulState & MichulApiState;

const initialStateCreator: StateCreator<MichulStore, any> = (set, get, api) => {
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
    loading: false,
    error: null,
    modalType: { type: 'ORDEREDIT', active: false },
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

    createMichulOrder: (orderData) => {
      set({ loading: true, error: null });
      return authApi
        .post('/orderTran/michul/create', orderData)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to create michul order', loading: false });
          throw error;
        });
    },

    updateMichul: (update) => {
      set({ loading: true, error: null });
      return authApi
        .put('/orderTran/michul/update', update)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to update michul order', loading: false });
          throw error;
        });
    },

    deleteMichuls: (deleteMichulList) => {
      set({ loading: true, error: null });
      return authApi
        .delete('/orderTran/michul/delete', {
          data: deleteMichulList,
        })
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to delete michul', loading: false });
          throw error;
        });
    },

    getMichulOrderDetail: (id: number) => {
      set({ loading: true, error: null });
      return authApi
        .get(`/orderTran/michul/detail/${id}`)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to get michul order detail', loading: false });
          throw error;
        });
    },
  };
};

export const useMichulStore = create<MichulStore>()(devtools(immer(initialStateCreator)));
