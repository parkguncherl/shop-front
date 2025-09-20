import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ApiResponse,
  PageObject,
  FactoryRequestPagingFilter,
  FactoryResponsePaging,
  FactoryRequestCreate,
  FactoryRequestUpdate,
  FactoryRequestFilter,
  FactoryRequestDeleteList,
  FactoryRequestUpdateSleepStatus,
  FactoryInfoResponse,
} from '../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';
import { StateCreator } from 'zustand/esm';

// 모달 타입 정의
type ModalType = 'CATEGORYSETTING' | 'ADD' | 'MOD' | 'CONFIRM' | 'DELETE' | 'DELETE_RECOMMAND' | 'UPDATE_SLEEP_STATUS';

// Factory 관련 상태 인터페이스 정의
interface FactoryState {
  factory: FactoryInfoResponse | undefined; // Factory 정보
  setFactory: (factory: FactoryInfoResponse) => void; // Factory 정보를 설정하는 함수
  onClear: () => void; // 상태를 초기화하는 함수
  paging: PageObject; // 페이징 정보
  setPaging: (pagingInfo: PageObject | undefined) => void; // 페이징 정보를 설정하는 함수
  delPaging: PageObject; // 삭제 페이징 정보
  setDelPaging: (pagingInfo: PageObject | undefined) => void; // 삭제 페이징 정보를 설정하는 함수
  modalType: { type: ModalType; active: boolean }; // 모달 상태
  openModal: (type: ModalType) => void; // 모달을 여는 함수
  closeModal: (type: ModalType) => void; // 모달을 닫는 함수
}

// Factory API 관련 상태 인터페이스 정의
interface FactoryApiState {
  insertFactory: (factoryRequest: FactoryRequestCreate) => AxiosPromise<ApiResponse>; // Factory를 추가하는 함수
  updateFactory: (factoryRequest: FactoryRequestUpdate) => AxiosPromise<ApiResponse>; // Factory를 업데이트하는 함수
  updateFactorySleepStatus: (factoryRequest: FactoryRequestUpdateSleepStatus) => AxiosPromise<ApiResponse>; // Factory의 Sleep 상태를 업데이트하는 함수
  deleteFactory: (id: number) => AxiosPromise<ApiResponse>; // Factory를 삭제하는 함수
  deleteFactories: (factoryRequestDeleteList: FactoryRequestDeleteList) => AxiosPromise<ApiResponse>; // 여러 Factory를 삭제하는 함수
  getFactoryDetail: (factoryId: number) => AxiosPromise<ApiResponse>; // 특정 Factory의 상세 정보를 가져오는 함수
  getFactoryTransInfo: (factoryId: number) => AxiosPromise<ApiResponse>; // Factory의 전환 정보를 가져오는 함수
  selectFactoryListPaging: (params: FactoryRequestPagingFilter) => AxiosPromise<ApiResponse>; // Factory 리스트를 페이징 처리하여 가져오는 함수
  selectFactoryOne: (filter: FactoryRequestFilter) => AxiosPromise<ApiResponse>; // 특정 Factory를 조회하는 함수
}

// Factory 상태와 API 상태를 통합
type Factory = FactoryState & FactoryApiState;

// 초기 상태 생성 함수
const initialStateCreator: StateCreator<Factory, any> = (set, get, api) => {
  return {
    factory: undefined,
    setFactory: (factory: FactoryResponsePaging) => {
      set((state) => ({
        factory: factory,
      }));
    },
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
    delPaging: {
      curPage: 1,
      pageRowCount: 50,
    },
    setDelPaging: (pageObject) => {
      set((state) => ({
        delPaging: {
          ...state.delPaging,
          ...pageObject,
        },
      }));
    },
    modalType: { type: 'ADD', active: false },
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
    selectFactoryOne: (filter) => {
      return authApi.get('/factory/selectOne', { params: filter });
    },
    insertFactory: (factoryRequest) => {
      return authApi.post('/factory/insert', factoryRequest);
    },
    updateFactory: (factoryRequest) => {
      return authApi.put('/factory/update', factoryRequest);
    },
    updateFactorySleepStatus: (factoryRequest) => {
      return authApi.patch('/factory/updateSleepYn', factoryRequest);
    },
    deleteFactory: (id) => {
      return authApi.delete(`/factory/delete/${id}`);
    },
    deleteFactories: (factoryRequestDeleteList) => {
      return authApi.delete('/factory/deletes', {
        data: factoryRequestDeleteList,
      });
    },
    getFactoryDetail: (factoryId) => {
      return authApi.get(`/factory/detail/${factoryId}`);
    },
    selectFactoryListPaging: (params) => {
      return authApi.get('/factory/paging', { params });
    },
    getFactoryTransInfo: (factoryId) => {
      return authApi.get(`/factory/trans/count/${factoryId}`);
    },
    onClear: () => {
      set(() => initialStateCreator(set, get, api), true);
    },
  };
};

// Zustand Store 생성
export const useFactoryStore = create<FactoryState & FactoryApiState>()(devtools(immer(initialStateCreator)));
