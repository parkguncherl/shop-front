import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { RetailResponsePaging } from '../generated';

interface RetSalesSumState {
  closeModal: (type: ModalType) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
}

type ModalType = 'DETAIL';

/**
 * 전역 상태에 의도치 않은 데이터가 혼입되지 않도록 set 메서드 호출 이전 대응할 것
 * */
const initialStateCreator: StateCreator<RetSalesSumState, any> = (set, get, api) => {
  return {
    modalType: { type: 'DETAIL', active: false },
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
  };
};

export const useRetSalesSumStore = create<RetSalesSumState>()(devtools(immer(initialStateCreator)));
