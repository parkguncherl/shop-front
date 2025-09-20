import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';
import {
  ApiResponse,
  Create,
  UpdateCustStatus,
  PagingFilter,
  RetailRequestPagingFilter,
  MisongDataResponsePaging,
  Treat,
  Release,
  MisongResponseResponse,
} from '../generated';

type ModalType = 'ORDEREDIT' | 'RELEASEEDIT' | 'PRODUCTTALLY' | 'CATEGORYSETTING' | 'SKULIST' | 'ONETRAN' | 'CONFIRM' | 'CANCELTRAN' | 'MISONG_RELEASE';

interface MisongState {
  //paging: PageObject;
  //setPaging: (pagingInfo: PageObject | undefined) => void;
  loading: boolean;
  error: string | null;
  selectedMisong: MisongResponseResponse | undefined;
  setSelectedMisong: (code: MisongResponseResponse) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

interface MisongApiState {
  createMisongOrder: (orderData: Create) => AxiosPromise<ApiResponse>;
  updateMisongOrderStatus: (orderData: UpdateCustStatus) => AxiosPromise<ApiResponse>;
  deleteMisongOrder: (id: number) => AxiosPromise<ApiResponse>;
  getMisongPrintDetail: (id: number) => AxiosPromise<ApiResponse>;
  getMisongPrintSendDetail: (id: number) => AxiosPromise<ApiResponse>;
  getNotShippedDetail: (id: number) => AxiosPromise<ApiResponse>;
  treatSingleMisong: (misongData: Treat) => AxiosPromise<ApiResponse>;
  treatMultiMisong: (misongDataList: number[]) => AxiosPromise<ApiResponse>;
  treatMisongCancel: (releaseList: Release[]) => AxiosPromise<ApiResponse>;
  treatDeliCancel: (deliCancels: number[]) => AxiosPromise<ApiResponse>;
}

export type { PagingFilter, RetailRequestPagingFilter };

type MisongStore = MisongState & MisongApiState;

const initialStateCreator: StateCreator<MisongStore> = (set, get) => {
  return {
    /*paging: {
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
    },*/
    loading: false,
    error: null,
    selectedMisong: undefined,
    setSelectedMisong: (misongOrder) => {
      set((state) => ({
        selectedMisong: misongOrder,
      }));
    },

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

    createMisongOrder: (orderData) => {
      set({ loading: true, error: null });
      return authApi
        .post('/orderTran/misong/create', orderData)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to create misong order', loading: false });
          throw error;
        });
    },

    updateMisongOrderStatus: (orderData) => {
      set({ loading: true, error: null });
      return authApi
        .put('/orderTran/misong/update', orderData)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to update misong order', loading: false });
          throw error;
        });
    },

    deleteMisongOrder: (id) => {
      set({ loading: true, error: null });
      return authApi
        .delete(`/orderTran/misong/delete/${id}`)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to delete misong order', loading: false });
          throw error;
        });
    },

    getMisongPrintDetail: (id: number) => {
      set({ loading: true, error: null });
      return authApi
        .get('/print/misong/detail', {
          params: {
            orderId: id,
          },
        })
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to get misong order detail', loading: false });
          throw error;
        });
    },
    getMisongPrintSendDetail: (id: number) => {
      set({ loading: true, error: null });
      return authApi
        .get('/print/misong/shippedDetail', {
          params: {
            orderId: id,
          },
        })
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to get misong order detail', loading: false });
          throw error;
        });
    },
    getNotShippedDetail: (id: number) => {
      set({ loading: true, error: null });
      return authApi
        .get('/print/misong/notShippedDetail', {
          params: {
            orderId: id,
          },
        })
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to get misong order detail', loading: false });
          throw error;
        });
    },

    treatSingleMisong: (misongData) => {
      set({ loading: true, error: null });
      return authApi
        .post('/orderTran/misong/treatSingleMisong', misongData)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to create misong order', loading: false });
          throw error;
        });
    },

    treatMultiMisong: (misongDataList) => {
      set({ loading: true, error: null });
      return authApi
        .post('/orderTran/misong/treatMultiMisong', misongDataList)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to create misong order', loading: false });
          throw error;
        });
    },

    treatMisongCancel: (releaseList) => {
      set({ loading: true, error: null });
      return authApi
        .post('/orderTran/misong/treatMisongCancel', releaseList)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to create misong order', loading: false });
          throw error;
        });
    },
    treatDeliCancel: (releaseList) => {
      set({ loading: true, error: null });
      return authApi
        .post('/orderTran/misong/treatDeliCancel', releaseList)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to create misong order', loading: false });
          throw error;
        });
    },
  };
};

export const useMisongStore = create<MisongStore>()(devtools(immer(initialStateCreator)));
