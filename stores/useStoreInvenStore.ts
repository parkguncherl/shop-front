import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, StoreInvenRequestUpdateInvenByStoreInven } from '../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';

/**
 * 본 전역 상태는 주문에 관한 고수준의 영역을 관할(보류, 미송, 미출 등의 주문 관련 하위 관할은 별도로 상태 관리 중)
 * */

type ModalType = 'RETURN';

interface StoreInvenState {
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

interface StoreInvenApiState {
  updateInvenByStoreInven: (updateInvenByStoreInvenList: StoreInvenRequestUpdateInvenByStoreInven[]) => AxiosPromise<ApiResponse>;
}

type StoreInStoreReqStore = StoreInvenState & StoreInvenApiState;

/**
 * 전역 상태에 의도치 않은 데이터가 혼입되지 않도록 set 메서드 호출 이전 대응할 것
 * */
const initialStateCreator: StateCreator<StoreInStoreReqStore, any> = (set, get, api) => {
  return {
    modalType: { type: 'RETURN', active: false },
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
    updateInvenByStoreInven: (updateInvenByStoreInvenList) => {
      return authApi.patch('/orderTran/storeInven/byStoreInven', updateInvenByStoreInvenList);
    },
  };
};

export const useStoreInvenStore = create<StoreInStoreReqStore>()(devtools(immer(initialStateCreator)));
