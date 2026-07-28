import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AxiosPromise } from 'axios';
import { authApi } from '@/libs';
import { VendorMngResponseVendorPagingInfo } from '@/generated';

// 협력업체 검색 필터 타입
export type VendorFilter = {
  vendorNm: string;
  phoneNo: string;
};

// 협력업체 등록/수정 요청 타입
export type VendorCreateRequest = {
  vendorNm: string;
  location?: string | null;
  phoneNo?: string | null;
  phoneNo2?: string | null;
  kakaoId?: string | null;
  kakaoStoryId?: string | null;
  instaId?: string | null;
  etcInfo?: string | null;
};

// 인라인(그리드 셀 단위) 수정 지원: id 와 변경된 필드만 전송
export type VendorUpdateRequest = Partial<VendorCreateRequest> & { id: number };

// UI 상태
interface VendorUiState {
  filters: VendorFilter;
  setFilters: (name: keyof VendorFilter, value: string) => void;
  resetFilters: () => void;

  selectedVendor: VendorMngResponseVendorPagingInfo | null;
  setSelectedVendor: (vendor: VendorMngResponseVendorPagingInfo | null) => void;

  addOpen: boolean;
  delOpen: boolean;
  setAddOpen: (open: boolean) => void;
  setDelOpen: (open: boolean) => void;
}

// API 상태
interface VendorApiState {
  fetchVendors: (filters: VendorFilter) => AxiosPromise<any>;
  /** 선택된 협력업체의 상품 목록 조회 */
  fetchVendorProducts: (vendorId: number) => AxiosPromise<any>;
  createVendor: (request: VendorCreateRequest) => AxiosPromise<any>;
  updateVendor: (request: VendorUpdateRequest) => AxiosPromise<any>;
  deleteVendor: (id: number) => AxiosPromise<any>;
}

const DEFAULT_FILTERS: VendorFilter = { vendorNm: '', phoneNo: '' };

const initialStateCreator: StateCreator<VendorUiState & VendorApiState, any> = (set) => ({
  filters: { ...DEFAULT_FILTERS },
  setFilters: (name, value) => {
    set((state) => ({ filters: { ...state.filters, [name]: value } }));
  },
  resetFilters: () => {
    set(() => ({ filters: { ...DEFAULT_FILTERS } }));
  },

  selectedVendor: null,
  setSelectedVendor: (vendor) => {
    set(() => ({ selectedVendor: vendor }));
  },

  addOpen: false,
  delOpen: false,
  setAddOpen: (open) => {
    set(() => ({ addOpen: open }));
  },
  setDelOpen: (open) => {
    set(() => ({ delOpen: open }));
  },

  fetchVendors: (filters) =>
    authApi.get('/partnerVendorMng/list', {
      params: {
        pageRowCount: 1000,
        curPage: 1,
        'filter.vendorNm': filters.vendorNm || undefined,
        'filter.phoneNo': filters.phoneNo || undefined,
      },
    }),
  fetchVendorProducts: (vendorId) => authApi.get('/vendorProductMng/list', { params: { vendorId } }),
  createVendor: (request) => authApi.post('/partnerVendorMng/create', request),
  updateVendor: (request) => authApi.put('/partnerVendorMng/update', request),
  deleteVendor: (id) => authApi.delete(`/partnerVendorMng/${id}`),
});

export const useVendorStore = create<VendorUiState & VendorApiState>()(devtools(immer(initialStateCreator)));
