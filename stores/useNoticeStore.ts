// C:\work\binblur-oms-frontend\stores\useNoticeStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, NoticeRequestCreate, NoticeRequestUpdate, PageObject } from '../generated';
import { AxiosPromise, AxiosRequestConfig } from 'axios';
import { authApi } from '../libs';
import { StateCreator } from 'zustand/esm';

// 모달 타입 정의
type ModalType = 'ADD' | 'MOD' | 'DETAIL';

// 공지사항 페이징 필터 타입 정의
export type NoticeRequestPagingFilter = {
  title?: string;
  startDate?: string;
  endDate?: string;
  noticeCd?: string;
  authCds: number[];
};

// 공지사항 상세 정보 인터페이스 정의
export interface NoticeDetail {
  id: number;
  noticeCd: string;
  title: string;
  noticeCntn: string;
  moveUri: string;
  authCds: string;
  creUser: string;
  creTm: string;
  updUser: string;
  updTm: string;
  deleteYn: string;
  readCnt: number;
}

// 공지사항 상태 인터페이스 정의
interface NoticeState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  selectedNotice: NoticeDetail | undefined;
  setSelectedNotice: (notice: NoticeDetail) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  loading: boolean;
  error: string | null;
  filters: NoticeRequestPagingFilter;
  onChangeFilters: (filters: Partial<NoticeRequestPagingFilter>) => void;
}

// 공지사항 API 상태 인터페이스 정의
interface NoticeApiState {
  fetchNotices: (filter: NoticeRequestPagingFilter) => AxiosPromise<any>;
  createNotice: (noticeRequest: NoticeRequestCreate) => AxiosPromise<ApiResponse>;
  updateNotice: (noticeRequest: NoticeRequestUpdate) => AxiosPromise<ApiResponse>;
  deleteNotice: (noticeId: number) => AxiosPromise<ApiResponse>;
  getNoticeDetail: (noticeId: number) => AxiosPromise<ApiResponse>; // ApiResponse<NoticeDetail>에서 변경
}

// 초기 상태 및 메서드 정의
const initialStateCreator: StateCreator<NoticeState & NoticeApiState, any> = (set, get, api) => {
  return {
    // 페이징 초기 상태
    paging: {
      curPage: 1,
      pageRowCount: 20,
    },
    // 필터 초기 상태
    filters: {
      title: '',
      startDate: '',
      endDate: '',
      noticeCd: '',
      authCds: [],
    },
    // 페이징 정보 설정 메서드
    setPaging: (pageObject) => {
      set((state) => ({
        paging: {
          ...state.paging,
          ...(pageObject || {}),
        },
      }));
    },
    // 선택된 공지사항 초기 상태
    selectedNotice: undefined,
    // 선택된 공지사항 설정 메서드
    setSelectedNotice: (notice) => {
      set((state) => ({
        selectedNotice: notice,
      }));
    },
    // 모달 초기 상태
    modalType: { type: 'ADD', active: false },
    // 모달 열기 메서드
    openModal: (type) => {
      set((state) => ({
        modalType: {
          type,
          active: true,
        },
      }));
    },
    // 모달 닫기 메서드
    closeModal: (type) => {
      set((state) => ({
        modalType: {
          type,
          active: false,
        },
      }));
    },
    // 로딩 상태 초기값
    loading: false,
    // 에러 상태 초기값
    error: null,
    // 필터 변경 메서드
    onChangeFilters: (filters: Partial<NoticeRequestPagingFilter>) => {
      set((state) => ({
        filters: {
          ...state.filters,
          ...filters,
        },
      }));
    },
    // 공지사항 목록 조회 메서드
    fetchNotices: async (filter) => {
      set({ loading: true, error: null });
      try {
        const config: AxiosRequestConfig = {
          params: {
            ...filter,
            ...get().paging,
          },
        };
        const response = await authApi.get('/notice/paging', config);
        set({ loading: false });
        return response;
      } catch (error) {
        set({ loading: false, error: (error as Error).message || 'Error occurred' });
        throw error;
      }
    },
    // 공지사항 생성 메서드
    createNotice: async (noticeRequest) => {
      set({ loading: true, error: null });
      try {
        const response = await authApi.post('/notice/create', noticeRequest);
        set({ loading: false });
        return response;
      } catch (error) {
        set({ loading: false, error: (error as Error).message || 'Error occurred' });
        throw error;
      }
    },
    // 공지사항 수정 메서드
    updateNotice: async (noticeRequest) => {
      set({ loading: true, error: null });
      try {
        const response = await authApi.put('/notice/update', noticeRequest);
        set({ loading: false });
        return response;
      } catch (error) {
        set({ loading: false, error: (error as Error).message || 'Error occurred' });
        throw error;
      }
    },
    // 공지사항 ID삭제 메서드
    deleteNotice: async (noticeId: number) => {
      set({ loading: true, error: null });
      try {
        const response = await authApi.delete(`/notice/delete/${noticeId}`); // URL 파라미터로 변경
        set({ loading: false });
        return response;
      } catch (error) {
        set({ loading: false, error: (error as Error).message || 'Error occurred' });
        throw error;
      }
    },
    // 공지사항 여러개삭제 메서드
    deleteBulkNotices: async (noticeIds: number[]) => {
      set({ loading: true, error: null });
      try {
        const response = await authApi.delete('/notice/delete', { data: noticeIds });
        set({ loading: false });
        return response;
      } catch (error) {
        set({ loading: false, error: (error as Error).message || 'Error occurred' });
        throw error;
      }
    },
    // 공지사항 상세 조회 메서드 (조회수 증가 포함)
    getNoticeDetail: async (noticeId) => {
      set({ loading: true, error: null });
      try {
        const response = await authApi.get<ApiResponse>(`/notice/detail/${noticeId}`);
        set({ loading: false });
        return response;
      } catch (error) {
        set({ loading: false, error: (error as Error).message || 'Error occurred' });
        throw error;
      }
    },
  };
};

export const useNoticeStore = create<NoticeState & NoticeApiState>()(devtools(immer(initialStateCreator)));
