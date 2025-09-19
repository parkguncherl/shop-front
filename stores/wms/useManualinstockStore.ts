// stores/wms/useManualinstockStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ManualinstockResponsePaging, ManualinstockPartnerResponse, ManualinstockSkuResponse, PageObject } from '../../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../../libs';
import { StateCreator } from 'zustand/esm';

// 기타 입하 상태 인터페이스 정의
interface ManualinstockState {
  paging: PageObject;
  partners: ManualinstockPartnerResponse[];
  selectedPartnerId: number | null;
  skus: ManualinstockSkuResponse[];
  setPaging: (pagingInfo: PageObject | undefined) => void;
  setPartners: (partners: ManualinstockPartnerResponse[]) => void;
  setSelectedPartnerId: (partnerId: number | null) => void;
  setSkus: (skus: ManualinstockSkuResponse[]) => void;
  loading: boolean;
  error: string | null;
}

interface ManualinstockApiState {
  // 기존 페이징 조회 API
  fetchManualinstockList: (filter: {
    skuNm?: string;
    stockStatCd?: string;
    endDate?: string;
    page: { pageRowCount: number | undefined; curPage: number | undefined };
    logisId?: number;
    startDate?: string;
    prodNm?: string;
  }) => AxiosPromise<{
    resultCode: number;
    resultMessage: string;
    stockRsnCd: string;
    body: { rows: ManualinstockResponsePaging[]; paging: PageObject };
  }>;

  // 화주 검색 API
  searchPartners: (filter: { partnerNm?: string; compNo?: string }) => AxiosPromise<{
    resultCode: number;
    resultMessage: string;
    body: ManualinstockPartnerResponse[];
  }>;

  // SKU 검색 API
  searchSkus: (filter: { partnerId: number; prodNm?: string; skuNm?: string }) => AxiosPromise<{
    resultCode: number;
    resultMessage: string;
    body: ManualinstockSkuResponse[];
  }>;

  /*  // 기타 입하 생성 API
  createManualInstock: (data: {
    asnDetails: {
      stockRsnCd: string;
      zone: string | undefined;
      stockCnt: number | undefined;
      skuId: number | undefined;
    }[];
    partnerId: number | undefined;
    logisId: number;
  }) => AxiosPromise<{ resultCode: number; resultMessage: string; body: boolean }>;
}*/

  // asnDetails를 배열에서 단일 객체로 수정
  createManualInstock: (data: {
    asnDetails: {
      stockRsnCd: string;
      zone: string | undefined;
      stockCnt: number | undefined;
      skuId: number | undefined;
      stockCd: string;
      factoryId: number | undefined;
    }; // 단일 객체
    partnerId: number | undefined;
    logisId: number;
  }) => AxiosPromise<{ resultCode: number; resultMessage: string; body: boolean }>;
}

type ManualinstockStore = ManualinstockState & ManualinstockApiState;

// 초기 상태 및 메서드 정의
const initialStateCreator: StateCreator<ManualinstockStore, any> = (set, get) => ({
  // 상태 초기값
  paging: {
    curPage: 1,
    pageRowCount: 20,
  },
  partners: [],
  selectedPartnerId: null,
  skus: [],
  loading: false,
  error: null,

  // 상태 변경 메서드들
  setPaging: (pageObject) => {
    set((state) => ({
      paging: {
        ...state.paging,
        ...(pageObject || {}),
      },
    }));
  },

  setPartners: (partners) => {
    set({ partners });
  },

  setSelectedPartnerId: (partnerId) => {
    set({ selectedPartnerId: partnerId });
  },

  setSkus: (skus) => {
    set({ skus });
  },

  // API 메서드들
  fetchManualinstockList: async (filter) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.get('/wms/manualinstock/paging', {
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

  searchPartners: async (filter) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.get('/wms/manualinstock/partners', {
        params: filter,
      });
      if (response.data.resultCode === 1) {
        set({ partners: response.data.body });
      }
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },

  searchSkus: async (filter) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.get('/wms/manualinstock/skus', {
        params: filter,
      });
      if (response.data.resultCode === 1) {
        set({ skus: response.data.body });
      }
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },

  createManualInstock: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.post('/wms/manualinstock/create', data);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },
});

export const useManualinstockStore = create<ManualinstockStore>()(devtools(immer(initialStateCreator), { name: 'Manualinstock Store' }));
