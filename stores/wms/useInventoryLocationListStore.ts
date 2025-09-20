import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, PageObject } from '../../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../../libs';
import { StateCreator } from 'zustand/esm';

type ModalType = 'ADD';

// 재고 정보 페이징 필터 타입 정의
export type InventoryInfoRequestPagingFilter = {
  partnerId?: number;
  logisId?: number;
  locId?: number;
};

// 재고 정보 상태 인터페이스 정의
interface InventoryLocationListState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  loading: boolean;
  error: string | null;
  filters: InventoryInfoRequestPagingFilter;
  onChangeFilters: (filters: Partial<InventoryInfoRequestPagingFilter>) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

// 재고 정보 API 상태 인터페이스 정의
interface InventoryLocationListApiState {
  getInventoryLocationDetail: (id: number) => AxiosPromise<ApiResponse>;
}

// 초기 상태 및 메서드 정의
const initialStateCreator: StateCreator<InventoryLocationListState & InventoryLocationListApiState, any> = (set, get) => ({
  // 페이징 초기 상태
  paging: {
    curPage: 1,
    pageRowCount: 999999,
  },
  // 필터 초기 상태
  filters: {
    partnerId: 0,
    logisId: 0,
    locId: 0,
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
  // 필터 변경 함수
  onChangeFilters: (filters: Partial<InventoryInfoRequestPagingFilter>) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    }));
  },
  // 재고 정보 상세 조회 함수
  getInventoryLocationDetail: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.get(`/wms/inven/detail/${id}`);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
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
});

// Zustand 스토어 생성
export const useInventoryLocationListStore = create<InventoryLocationListState & InventoryLocationListApiState>()(devtools(immer(initialStateCreator)));
