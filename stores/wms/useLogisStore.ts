import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, LogisResponsePaging, PageObject } from '../../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../../libs';
import { StateCreator } from 'zustand/esm';
import { string } from 'yup';

type ModalType = 'LOCATION_REG';

// 창고 페이징 필터 타입 정의
export type LogisRequestPagingFilter = {
  logisId?: string;
  logisKey?: string;
  logisNm?: string;
  startDate?: string;
  endDate?: string;
};

// 창고 상세 정보 인터페이스 정의
export interface LogisDetail {
  id: number;
  logisKey?: string;
  logisNm: string;
  logisAddr?: string;
  logisDesc?: string;
  logisTelNo?: string;
  personNm?: string;
  personTelNo?: string;
  centerInfo?: string;
  creUser?: string;
  creTm?: string;
  updUser?: string;
  updTm?: string;
}

// 창고 상태 인터페이스 정의
interface LogisState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  loading: boolean;
  error: string | null;
  filters: LogisRequestPagingFilter;
  onChangeFilters: (filters: Partial<LogisRequestPagingFilter>) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

// 창고 API 상태 인터페이스 정의
interface LogisApiState {
  fetchLogis: (filter: LogisRequestPagingFilter) => AxiosPromise<LogisResponsePaging | any>;
  createLogis: (logisDetail: Partial<LogisDetail>) => AxiosPromise<ApiResponse>;
  updateLogis: (logisDetail: Partial<LogisDetail>) => AxiosPromise<ApiResponse>;
  deleteLogis: (logisIds: number[]) => AxiosPromise<ApiResponse>;
}

// 초기 상태 및 메서드 정의
const initialStateCreator: StateCreator<LogisState & LogisApiState, any> = (set, get) => ({
  paging: {
    curPage: 1,
    pageRowCount: 20,
  },
  filters: {
    logisKey: '',
    logisNm: '',
    startDate: '',
    endDate: '',
  },
  setPaging: (pageObject) => {
    set((state) => ({
      paging: {
        ...state.paging,
        ...(pageObject || {}),
      },
    }));
  },
  loading: false,
  error: null,
  modalType: { type: 'LOCATION_REG', active: false },
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
  onChangeFilters: (filters: Partial<LogisRequestPagingFilter>) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    }));
  },
  fetchLogis: async (filter) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.get('/logis/paging', {
        params: {
          ...filter,
          ...get().paging,
        },
      });
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },
  createLogis: async (logisDetail) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.post('/logis/create', logisDetail);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },
  updateLogis: async (logisDetail) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.put('/logis/update', logisDetail);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },
  deleteLogis: async (logisIds) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.delete('/logis/delete', { data: logisIds });
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },
});

export const useLogisStore = create<LogisState & LogisApiState>()(devtools(immer(initialStateCreator)));
