import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';
import {
  ApiResponse,
  SampleRequestDeleteMoreOnce,
  SampleRequestRetrieve,
  SampleRequestRetrieveAndReturn,
  SampleRequestRetrieveCancel,
  SampleResponsePaging,
} from '../generated';

type ModalType =
  | 'ORDEREDIT'
  | 'RELEASEEDIT'
  | 'PRODUCTTALLY'
  | 'CATEGORYSETTING'
  | 'DETAIL'
  | 'SAMPLE_DELETE'
  | 'SAMPLE_RETRIEVE'
  | 'SAMPLE_RETRIEVE_RETURN'
  | 'SAMPLE_RETRIEVE_SAIL'
  | 'SAMPLE_RETRIEVE_CANCEL';

interface SampleState {
  //paging: PageObject;
  //setPaging: (pagingInfo: PageObject | undefined) => void;
  selectedSample: SampleResponsePaging | undefined;
  setSelectedSample: (sample: SampleResponsePaging | undefined) => void;
  loading: boolean;
  error: string | null;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

interface SampleApiState {
  retrieveSample: (retrieve: SampleRequestRetrieve[]) => AxiosPromise<ApiResponse>;
  retrieveCancelSample: (retrieve: SampleRequestRetrieveCancel[]) => AxiosPromise<ApiResponse>;
  retrieveAndReturnSample: (retrieveAndReturn: SampleRequestRetrieveAndReturn[]) => AxiosPromise<ApiResponse>;
  deleteSamples: (deleteMoreOnceList: SampleRequestDeleteMoreOnce[]) => AxiosPromise<ApiResponse>;
  getSampleOrderDetail: (id: number) => AxiosPromise<ApiResponse>;
  getSampleInfo: (id: number) => AxiosPromise<ApiResponse>;
  getSampleNotCollected: (sellerId: number, filters: any) => AxiosPromise<ApiResponse>;
}

type SampleStore = SampleState & SampleApiState;

const initialStateCreator: StateCreator<SampleStore, any> = (set, get, api) => {
  return {
    /*paging: {
      curPage: 1,
      pageRowCount: 1000,
    },
    setPaging: (pageObject) => {
      set((state) => ({
        paging: {
          ...state.paging,
          ...pageObject,
        },
      }));
    },*/
    selectedSample: undefined,
    setSelectedSample: (selectedSample) => {
      set((state) => ({
        selectedSample: selectedSample,
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

    retrieveSample: (retrieve) => {
      set({ loading: true, error: null });
      return authApi
        .patch('/orderTran/sample/retrieve', retrieve)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to update sample orderDet List', loading: false });
          throw error;
        });
    },

    retrieveCancelSample: (retrieve) => {
      set({ loading: true, error: null });
      return authApi
        .patch('/orderTran/sample/retrieveCancel', retrieve)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to update sample orderDet List', loading: false });
          throw error;
        });
    },

    retrieveAndReturnSample: (retrieveAndReturn) => {
      set({ loading: true, error: null });
      return authApi
        .patch('/orderTran/sample/retrieveAndReturn', retrieveAndReturn)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to update sample orderDet List', loading: false });
          throw error;
        });
    },

    deleteSamples: (deleteMoreOnceList) => {
      set({ loading: true, error: null });
      return authApi
        .delete('/orderTran/sample/delete', {
          data: deleteMoreOnceList,
        })
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to delete sample order', loading: false });
          throw error;
        });
    },

    getSampleOrderDetail: (id: number) => {
      set({ loading: true, error: null });
      return authApi
        .get(`/print/sample/detail/${id}`)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to get sample order detail', loading: false });
          throw error;
        });
    },

    getSampleInfo: (id: number) => {
      // 샘플현황
      set({ loading: true, error: null });
      return authApi
        .get(`/print/sample/sampleInfo/${id}`)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to get sample order Info', loading: false });
          throw error;
        });
    },

    getSampleNotCollected: (sellerId: number, filters: any) => {
      // 샘플 미회수
      set({ loading: true, error: null });
      return authApi
        .get(`/print/sample/sampleNotCollected/${sellerId}`, {
          params: {
            ...filters,
          },
        })
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to get sample NotCollected', loading: false });
          throw error;
        });
    },
  };
};

export const useSampleStore = create<SampleStore>()(devtools(immer(initialStateCreator)));
