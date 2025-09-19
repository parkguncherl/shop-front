import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, SkuFactoryRequestFilter } from '../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';
import { StateCreator } from 'zustand/esm';

// Factory API 관련 상태 인터페이스 정의
interface SkuFactoryApiState {
  getSkuFactoryListByFilter: (filter: SkuFactoryRequestFilter) => AxiosPromise<ApiResponse>;
}

// Factory 상태와 API 상태를 통합
type SkuFactory = SkuFactoryApiState;

// 초기 상태 생성 함수
const initialStateCreator: StateCreator<SkuFactory, any> = (set, get, api) => {
  return {
    getSkuFactoryListByFilter: (filter) => {
      return authApi.get('/skuFactory/list', { params: filter });
    },
  };
};

// Zustand Store 생성
export const useSkuFactoryStore = create<SkuFactory>()(devtools(immer(initialStateCreator)));
