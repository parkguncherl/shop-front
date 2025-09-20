import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ApiResponse,
  PageObject,
  FactoryRequestCreate,
  FactoryRequestUpdate,
  FactoryRequestUpdateDeleteYn,
  FactoryControllerApiSelectFactoryListPagingRequest,
  FactoryRequestDelete,
} from '../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';
import { StateCreator } from 'zustand/esm';

type ModalType = 'ADD' | 'MOD' | 'SLEEP' | 'COPY' | 'GUBUN_LIST' | 'CATEGORYSETTING';

export type FactoryListPagingFilter = Pick<FactoryControllerApiSelectFactoryListPagingRequest, any>;

interface FactoryState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  selectedFactory: FactoryRequestUpdate | undefined;
  setSelectedFactory: (factory: FactoryRequestUpdate) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  onClear: () => void;
}

interface FactoryApiState {
  insertFactory: (factoryRequest: FactoryRequestCreate) => AxiosPromise<ApiResponse>;
  updateFactory: (factoryRequest: FactoryRequestUpdate) => AxiosPromise<ApiResponse>;
  deleteFactory: (factoryRequest: FactoryRequestDelete) => AxiosPromise<ApiResponse>;
}

const initialStateCreator: StateCreator<FactoryState & FactoryApiState, any> = (set, get, api) => {
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
    selectedFactory: undefined,
    setSelectedFactory: (factory) => {
      set((state) => ({
        selectedFactory: factory,
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
    insertFactory: (factoryRequest) => {
      return authApi.post('/factory', factoryRequest);
    },
    updateFactory: (factoryRequest) => {
      return authApi.put('/factory', factoryRequest);
    },
    deleteFactory: (factoryRequest) => {
      return authApi.delete('/factory', {
        data: factoryRequest,
      });
    },
    onClear: () => {
      set(() => initialStateCreator(set, get, api), true);
    },
  };
};

export const useFactoryListStore = create<FactoryState & FactoryApiState>()(devtools(immer(initialStateCreator)));
