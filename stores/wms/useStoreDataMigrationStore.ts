import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, MigrationResponseMigrationInfo, PageObject } from '../../generated';
import { StateCreator } from 'zustand/esm';
import { AxiosPromise } from 'axios';
import { authApi } from '../../libs';

interface StoreDataMigrationState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  getMigInfo: (partnerId: number) => AxiosPromise<MigrationResponseMigrationInfo>;
  removeFactory: (partnerId: number) => AxiosPromise<ApiResponse>;
}

interface StoreDataMigrationApiState {}

type StoreDataMigration = StoreDataMigrationState & StoreDataMigrationApiState;

// 초기 상태 및 메서드 정의
const initialStateCreator: StateCreator<StoreDataMigration, any> = (set, get) => {
  return {
    paging: {
      curPage: 1,
      pageRowCount: 50,
    },
    setPaging: (pageObject) => {
      set((state) => ({
        paging: {
          ...state.paging,
          ...pageObject,
        },
      }));
    },
    getMigInfo: (partnerId) => {
      return authApi.get('/migration/getMigData/' + partnerId);
    },
    removeFactory: (partnerId) => {
      return authApi.delete('/migration/factory/remove/' + partnerId);
    },
  };
};

export const useStoreDataMigrationStore = create<StoreDataMigration>()(devtools(immer(initialStateCreator), { name: 'Manualinstock Store' }));
