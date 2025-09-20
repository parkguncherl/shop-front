import { ApiResponse } from '../generated';
import { AxiosPromise } from 'axios';
import { create, StateCreator } from 'zustand';
import { authApi } from '../libs';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ProductApiState {
  getProductListByKeyWord: (keyWord: string) => AxiosPromise<ApiResponse>; // 검색 키워드를 통한 조회
}

type ProductStore = ProductApiState;

const initialStateCreator: StateCreator<ProductStore, any> = () => {
  return {
    getProductListByKeyWord: (keyWord) => {
      return authApi.get('/product/listByKeyWord', {
        params: {
          prodNm: keyWord,
        },
      });
    },
  };
};

export const useProductStore = create<ProductStore>()(devtools(immer(initialStateCreator)));
