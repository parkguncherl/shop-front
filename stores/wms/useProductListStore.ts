import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ApiResponse,
  LbRequestLiveSellerEtcUpdate,
  LbRequestLiveVersionSellerCopy,
  LbRequestLiveVersionSellerUpdate,
  LiveExcelDownload,
  PageObject,
} from '../../generated';
import { StateCreator } from 'zustand/esm';
import { authApi, authDownApi } from '../../libs';
import { AxiosPromise } from 'axios';
type ModalType = 'VERSION_SELLER_MAP' | 'INIT_INVEN_DATA';

// 재고 정보 상태 인터페이스 정의
interface ProductListState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  loading: boolean;
  error: string | null;
  excelDown: (liveExcelDownload: LiveExcelDownload) => void;
  excelDownEnglish: (liveExcelDownload: LiveExcelDownload) => void;
  updateSellingProd: (lbRequestLiveSellerEtcUpdate: LbRequestLiveSellerEtcUpdate) => AxiosPromise<ApiResponse>;
  updateVersionSellerInfo: (lbRequestLiveVersionSellerUpdate: LbRequestLiveVersionSellerUpdate) => AxiosPromise<ApiResponse>;
  copyVersionSellerInfo: (lbRequestLiveVersionSellerCopy: LbRequestLiveVersionSellerCopy) => AxiosPromise<ApiResponse>;
  deleteVersionSellerInfo: (lbRequestLiveVersionSellerUpdate: LbRequestLiveVersionSellerUpdate) => AxiosPromise<ApiResponse>;
  initInvenData: (versionId: string) => AxiosPromise<ApiResponse>;
}

// 초기 상태 및 메서드 정의
const initialStateCreator: StateCreator<ProductListState, any> = (set, get) => ({
  // 페이징 초기 상태
  paging: {
    curPage: 1,
    pageRowCount: 999999,
  },
  modalType: { type: 'VERSION_SELLER_MAP', active: false },
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
  // 필터 초기 상태
  filters: {
    lbPartnerId: '',
    lbSellerId: 0,
    lbVersion: '',
    prodNm: '',
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
  excelDown: async (liveExcelDownload) => {
    const params = '?lbVersion=' + liveExcelDownload.lbVersion + '&lbVersionSellerId=' + liveExcelDownload.lbVersionSellerId + '&eng=N';
    const res = await authDownApi.get<Blob>('/wms/lbProd/live-excel-down' + params.replaceAll('undefined', ''));
    const blob = res.data;
    const name = decodeURIComponent(res.headers['content-disposition']); //파일명 디코딩
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
  excelDownEnglish: async (liveExcelDownload) => {
    const params = '?lbVersion=' + liveExcelDownload.lbVersion + '&lbVersionSellerId=' + liveExcelDownload.lbVersionSellerId + '&eng=Y';
    const res = await authDownApi.get<Blob>('/wms/lbProd/live-excel-down' + params.replaceAll('undefined', ''));
    const blob = res.data;
    const name = decodeURIComponent(res.headers['content-disposition']); //파일명 디코딩
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
  updateSellingProd: async (productRequestFilter) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.post('/wms/lbProd/update-prod-info', productRequestFilter);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },

  updateVersionSellerInfo: async (lbRequestLiveVersionSellerUpdate) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.post('/wms/lbProd/update-version-seller-info', lbRequestLiveVersionSellerUpdate);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },

  copyVersionSellerInfo: async (lbRequestLiveVersionSellerCopy) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.post('/wms/lbProd/copy-version-seller-info', lbRequestLiveVersionSellerCopy);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },

  deleteVersionSellerInfo: async (lbRequestLiveVersionSellerUpdate) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.post('/wms/lbProd/delete-version-seller-info', lbRequestLiveVersionSellerUpdate);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },

  initInvenData: async (versionId) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.put('/wms/lbProd/initInvenData/' + versionId);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ loading: false, error: (error as Error).message || 'Error occurred' });
      throw error;
    }
  },
});

// Zustand 스토어 생성
export const useProductListStore = create<ProductListState>()(devtools(immer(initialStateCreator)));
