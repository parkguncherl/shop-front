import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, PartnerFeeRequestForList, PartnerFeeRequestInfo } from '../../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../../libs';
import { StateCreator } from 'zustand/esm';

type ModalType = 'ADD_FEE' | 'MOD_FEE';

// 재고 정보 상태 인터페이스 정의
interface FeeState {
  loading: boolean;
  error: string | null;
  filters: PartnerFeeRequestForList;
  onChangeFilters: (filters: PartnerFeeRequestForList) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

// 재고 정보 API 상태 인터페이스 정의
interface FeeApiState {
  fetchFeeList: (filter: PartnerFeeRequestForList) => AxiosPromise<ApiResponse>;
  createFee: (partnerFee: PartnerFeeRequestInfo) => AxiosPromise<ApiResponse>;
  updateFee: (partnerFee: PartnerFeeRequestInfo) => AxiosPromise<ApiResponse>;
  deleteFee: (partnerFee: PartnerFeeRequestInfo) => AxiosPromise<ApiResponse>;
}

// 초기 상태 및 메서드 정의
const initialStateCreator: StateCreator<FeeState & FeeApiState, any> = (set, get) => ({
  // 페이징 초기 상태
  paging: {
    curPage: 1,
    pageRowCount: 999999,
  },
  // 필터 초기 상태
  filters: {
    partnerId: 0,
    histYn: 'N',
  },
  loading: false,
  error: null,
  // 필터 변경 함수
  onChangeFilters: (filters: Partial<PartnerFeeRequestForList>) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    }));
  },
  // 수수료 정보 목록 조회 함수
  fetchFeeList: async (filter) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.get('/wms/fee/partnerFeeList', {
        params: {
          ...filter,
        },
      });
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },
  // 수수료 정보 생성 함수
  createFee: async (partnerFeeRequestInfo) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.post('/wms/fee/createPartnerFee', partnerFeeRequestInfo);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },
  // 수수료 정보 수정 함수
  updateFee: async (partnerFeeRequestInfo) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.patch('/wms/fee/updatePartnerFee', partnerFeeRequestInfo);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },
  // 수수료 정보 삭제 함수
  deleteFee: async (partnerFeeRequestInfo) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.patch('/wms/fee/deletePartnerFee', partnerFeeRequestInfo);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },
  modalType: { type: 'ADD_FEE', active: false },
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
export const useFeeStore = create<FeeState & FeeApiState>()(devtools(immer(initialStateCreator)));
