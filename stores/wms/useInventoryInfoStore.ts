import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, InspectionInfoCreateRequest, InventoryinfoUpdateRequest, PageObject } from '../../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../../libs';
import { StateCreator } from 'zustand/esm';

type ModalType = 'INVEN_CHANGE' | 'CREATE_INSPECTION' | 'REG_REAL_COUNT' | 'VERSION_SELLER_MAP';

// 재고 정보 페이징 필터 타입 정의
export type InventoryInfoRequestPagingFilter = {
  partnerId?: number;
  searchKeyword?: string;
  invenStatCd?: string;
  startDate?: string;
  endDate?: string;
  partnerNm: string;
};

// 재고 정보 상세 인터페이스 정의
export interface InventoryInfoDetail {
  id: number;
  skuId: number;
  logisId: number;
  logisNm: string;
  invenStatCd: string;
  invenYmd: string;
  locId: number;
  skuCd: string;
  skuNm: string;
  skuColor: string;
  skuSize: string;
  sellAmt: number;
  stdSellAmt: number;
  marRate: string;
  orgAmt: number;
  sleepYn: string;
  prodId: number;
  prodCd: string;
  prodNm: string;
  prodType: string;
  funcCd: string;
  funcDetCd: string;
  seasonCd: string;
  fabric: string;
  formYn: string;
  compCntn: string;
  gubunCntn: string;
  partnerNm: string;
  orderShortNm: string;
  location: string;
  zoneCd: string;
  zoneCdNm: string;
  factoryNm: string;
  designNm: string;
  inventoryAmt: number;
  creUser: string;
  creTm: string;
  updUser: string;
  updTm: string;
  locCntn: string;
  skuAmt: string;
}

// 재고 정보 상태 인터페이스 정의
interface InventoryInfoState {
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
interface InventoryInfoApiState {
  fetchInventoryInfos: (filter: InventoryInfoRequestPagingFilter) => AxiosPromise<ApiResponse>;
  getInventoryInfoDetail: (id: number) => AxiosPromise<ApiResponse>;
  createInventoryInfo: (inventoryInfo: Partial<InventoryInfoDetail>) => AxiosPromise<ApiResponse>;
  updateInventoryInfo: (inventoryinfoUpdateRequestList: InventoryinfoUpdateRequest[]) => AxiosPromise<ApiResponse>;
  insertInspectInfo: (inspectionInfoCreateRequest: InspectionInfoCreateRequest) => AxiosPromise<ApiResponse>;
  deleteInventoryInfo: (inventoryInfoIds: number[]) => AxiosPromise<ApiResponse>;
}

// 초기 상태 및 메서드 정의
const initialStateCreator: StateCreator<InventoryInfoState & InventoryInfoApiState, any> = (set, get) => ({
  // 페이징 초기 상태
  paging: {
    curPage: 1,
    pageRowCount: 999999,
  },
  // 필터 초기 상태
  filters: {
    partnerNm: '',
    searchKeyword: '',
    invenStatCd: '',
    startDate: '',
    endDate: '',
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
  // 재고 정보 목록 조회 함수
  fetchInventoryInfos: async (filter) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.get('/wms/inven/paging', {
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
  // 재고 정보 상세 조회 함수
  getInventoryInfoDetail: async (id) => {
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
  // 재고 정보 생성 함수
  createInventoryInfo: async (inventoryInfo) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.post('/wms/inven/create', inventoryInfo);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },
  // 재고 정보 수정 함수
  updateInventoryInfo: async (inventoryinfoUpdateRequestList) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.patch('/wms/inven/update', inventoryinfoUpdateRequestList);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },
  // 재고 정보 삭제 함수
  deleteInventoryInfo: async (inventoryInfoIds) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.delete('/wms/inven/delete', { data: inventoryInfoIds });
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },
  modalType: { type: 'INVEN_CHANGE', active: false },
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

  // 재고 실사신청 함수
  insertInspectInfo: async (inspectionInfoCreateRequest: InspectionInfoCreateRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.patch('/wms/inven/insertInspectInfo', inspectionInfoCreateRequest);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },
});

// Zustand 스토어 생성
export const useInventoryInfoStore = create<InventoryInfoState & InventoryInfoApiState>()(devtools(immer(initialStateCreator)));
