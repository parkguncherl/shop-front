import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, HomeResponseDetail, HomeRequestUpdate, PageObject, CodeRequestCreate, HomeRequestInsert } from '../../generated';
import { AxiosPromise } from 'axios';
import { authApi, authDownApi } from '../../libs';
import { StateCreator } from 'zustand/esm/index';

type ModalType = 'ADD' | 'MOD' | 'EXCEL';

interface HomeState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  selectedHome: HomeResponseDetail | undefined;
  setSelectedHome: (home: HomeResponseDetail) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: () => void;
}

interface HomeApiState {
  selectHome: () => AxiosPromise<{ data: HomeResponseDetail[] }>;
  updateHome: (homeRequest: HomeRequestUpdate) => AxiosPromise<ApiResponse>;
  deleteHome: () => AxiosPromise<ApiResponse>;
  insertHome: (homeRequest: HomeRequestInsert) => AxiosPromise<ApiResponse>;
  excelDown: () => void;
}

const initialStateCreator: StateCreator<HomeState & HomeApiState, any> = (set, get) => {
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
    selectedHome: undefined,
    setSelectedHome: (home) => {
      set({ selectedHome: home });
    },
    modalType: { type: 'MOD', active: false },
    openModal: (type) => {
      set({ modalType: { type, active: true } });
    },
    closeModal: () => {
      set({ modalType: { type: 'MOD', active: false } });
    },
    selectHome: () => {
      return authApi.get('/home');
    },
    updateHome: (homeRequest) => {
      return authApi.put('/home', homeRequest);
    },
    deleteHome: () => {
      return authApi.delete('/home');
    },
    insertHome: (homeRequest) => {
      return authApi.post('/home', homeRequest);
    },
    excelDown: async () => {
      const res = await authDownApi.get<Blob>('/home/excel-down');
      const blob = res.data;
      const name = decodeURIComponent(res.headers['content-disposition']);
      const fileName = name.substring(name.indexOf('filename=') + 10);
      const _fileName = fileName.substring(0, fileName.indexOf('.xlsx') + 5);

      if (typeof window !== 'undefined') {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.target = '_self';
        if (_fileName) link.download = _fileName;
        link.click();
      }
    },
  };
};

export const useHomeStore = create<HomeState & HomeApiState>()(devtools(immer(initialStateCreator)));
