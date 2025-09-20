import { ApiResponse } from '../generated';
import { AxiosPromise } from 'axios';
import { create, StateCreator } from 'zustand';
import { authApi } from '../libs';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface SkuApiState {
  selectSkuListByKeyWord: (keyWord: string) => AxiosPromise<ApiResponse>; // 검색 키워드를 통한 조회
}

type SkuStore = SkuApiState;

const initialStateCreator: StateCreator<SkuStore, any> = () => {
  return {
    selectSkuListByKeyWord: (keyWord) => {
      return authApi.get('/sku/listByKeyWord', {
        params: {
          skuNm: keyWord,
        },
      });
    },
  };
};

export const useSkuStore = create<SkuStore>()(devtools(immer(initialStateCreator)));
