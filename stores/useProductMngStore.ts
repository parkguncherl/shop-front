import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { authApi } from '../libs';
import {
  ApiResponse,
  PageObject,
  ProductControllerApiGetProductListRequest,
  ProductControllerApiUpdateProductRequest,
  ProductControllerApiDeleteProductSkuRequest,
  ProductRequestSkuGridUpdate,
  ProductRequestCreate,
} from '../generated';
import { StateCreator } from 'zustand/esm';
import { AxiosPromise } from 'axios';

type ModalType = 'ADD' | 'MOD' | 'SKUADD';

export type ProductMngPagingFilter = Pick<ProductControllerApiGetProductListRequest, any>;

export interface ModalState {
  type: ModalType;
  active: boolean;
}

export interface ProductState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  selectedProduct: any | undefined;
  setSelectedProduct: (product: any) => void;
  modals: Record<ModalType, ModalState>; // 각 ModalType별로 관리
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  onClear: () => void;
}

export interface ProductApiState {
  insertProduct: (productRequest: ProductRequestCreate) => AxiosPromise<ApiResponse>;
  updateProduct: (productRequest: ProductControllerApiUpdateProductRequest) => AxiosPromise<ApiResponse>;
  updateProductGrid: (productRequest: ProductRequestSkuGridUpdate) => AxiosPromise<ApiResponse>;
  deleteProduct: (productRequest: ProductControllerApiDeleteProductSkuRequest) => AxiosPromise<ApiResponse>;
}

const initialStateCreator: StateCreator<ProductState & ProductApiState, any> = (set, get, api) => {
  return {
    paging: {
      curPage: 1,
      pageRowCount: 999999,
    },
    setPaging: (pageObject) => {
      set((state) => ({
        paging: {
          ...state.paging,
          ...pageObject,
        },
      }));
    },
    selectedProduct: undefined,
    setSelectedProduct: (product) => {
      set({ selectedProduct: product });
    },
    modals: {
      ADD: { type: 'ADD', active: false },
      MOD: { type: 'MOD', active: false },
      DETAIL: { type: 'DETAIL', active: false },
      SKUADD: { type: 'SKUADD', active: false },
    },
    openModal: (type) => {
      set((state) => ({
        modals: {
          ...state.modals,
          [type]: { ...state.modals[type], active: true },
        },
      }));
    },
    closeModal: (type) => {
      set((state) => ({
        modals: {
          ...state.modals,
          [type]: { ...state.modals[type], active: false },
        },
      }));
    },
    insertProduct: async (product) => {
      return authApi.post('/product', product);
    },
    updateProduct: async (product) => {
      return authApi.put('/product', product);
    },
    updateProductGrid: async (product) => {
      return authApi.put('/product/grid', product);
    },
    deleteProduct: async (productId) => {
      return authApi.delete(`/product/${productId}`);
    },
    onClear: () => {
      set(() => initialStateCreator(set, get, api), true);
    },
  };
};

export const useProductMngStore = create<ProductState & ProductApiState>()(devtools(immer(initialStateCreator)));
