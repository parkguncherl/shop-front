import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, LocsetRequestPagingFilter, PageObject } from '../../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../../libs';
import { StateCreator } from 'zustand/esm';
import Locset from '../../pages/wms/system/locset';

// 적치위치 상세 정보 인터페이스 정의
export interface RowData {
  id?: number | undefined;
  logisId?: number | undefined;
  logisNm?: string | undefined;
  zoneCd?: string | undefined;
  zoneCdNm?: string | undefined;
  location?: string | undefined;
  locCntn?: string | undefined;
}

// 적치위치 상태 인터페이스 정의
interface LosetState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  loading: boolean;
  error: string | null;
}

// 적치위치 API 상태 인터페이스 정의
interface LosetApiState {
  fetchLosets: (filter: LocsetRequestPagingFilter) => AxiosPromise<any>;
  createLocset: (locsets: Partial<RowData>) => AxiosPromise<ApiResponse>;
  updateLocset: (Locset: Partial<RowData>) => AxiosPromise<ApiResponse>;
  deleteLocsets: (losetIds: (number | undefined)[]) => AxiosPromise<ApiResponse>;
  // excelTemplate: () => Promise<void>;
  // excelUpload: (file: File) => AxiosPromise<ApiResponse>;
  // excelDownload: (filter: LocsetRequestPagingFilter) => Promise<void>;
}

type LosetStore = LosetState & LosetApiState;

// 초기 상태 및 메서드 정의
const initialStateCreator: StateCreator<LosetStore, any> = (set, get) => ({
  // 페이징 초기 상태
  paging: {
    curPage: 1,
    pageRowCount: 20,
  },
  // 페이징 정보 업데이트 함수
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
  // 적치위치 목록 조회 함수
  fetchLosets: async (filter) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.get('/locset/paging', {
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
  // 적치위치 생성 함수
  createLocset: async (Locset: RowData) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.post('/locset/create', Locset);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },
  // 적치위치 수정 함수
  updateLocset: async (Locset) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.put('/locset/update', Locset);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },
  // 적치위치 삭제 함수
  deleteLocsets: async (losetIds) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.delete('/locset/delete', { data: losetIds });
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },
  // 엑셀 템플릿 다운로드 함수
  // excelTemplate: async () => {
  //   set({ loading: true, error: null });
  //   try {
  //     const response = await authApi.get('/locset/excel-template', { responseType: 'blob' });
  //     const url = window.URL.createObjectURL(new Blob([response.data]));
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.setAttribute('download', 'locset_template.xlsx');
  //     document.body.appendChild(link);
  //     link.click();
  //     link.remove();
  //     set({ loading: false });
  //   } catch (error) {
  //     set({ loading: false, error: (error as Error).message || 'Error occurred' });
  //     throw error;
  //   }
  // },
  // 엑셀 파일 업로드 함수
  // excelUpload: async (file) => {
  //   set({ loading: true, error: null });
  //   try {
  //     const formData = new FormData();
  //     formData.append('file', file);
  //     const response = await authApi.post('/locset/excel-upload', formData, {
  //       headers: { 'Content-Type': 'multipart/form-data' },
  //     });
  //     set({ loading: false });
  //     return response;
  //   } catch (error) {
  //     set({ loading: false, error: (error as Error).message || 'Error occurred' });
  //     throw error;
  //   }
  // },
  // 엑셀 데이터 다운로드 함수
  // excelDownload: async (filter) => {
  //   set({ loading: true, error: null });
  //   try {
  //     const response = await authApi.get('/locset/excel-down', {
  //       params: filter,
  //       responseType: 'blob',
  //     });
  //     const url = window.URL.createObjectURL(new Blob([response.data]));
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.setAttribute('download', 'locset_data.xlsx');
  //     document.body.appendChild(link);
  //     link.click();
  //     link.remove();
  //     set({ loading: false });
  //   } catch (error) {
  //     set({ loading: false, error: (error as Error).message || 'Error occurred' });
  //     throw error;
  //   }
  // },
});

// Zustand 스토어 생성
export const useLocsetStore = create<LosetStore>()(devtools(immer(initialStateCreator)));
