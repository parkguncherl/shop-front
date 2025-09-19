import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { StateCreator } from 'zustand/esm';

type ModalType = 'TOTSAIL' | 'DCSAIL' | 'REORDER' | 'NONE';

export interface ModalState {
  type: ModalType;
  active: boolean;
}

export interface ProductTranState {
  modals: Record<ModalType, ModalState>; // 각 ModalType별로 관리
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  modalType: { type: ModalType; active: boolean };
}

const initialStateCreator: StateCreator<ProductTranState, any> = (set, get, api) => {
  return {
    modals: {
      TOTSAIL: { type: 'TOTSAIL', active: false },
      DCSAIL: { type: 'DCSAIL', active: false },
      REORDER: { type: 'REORDER', active: false },
      NONE: { type: 'NONE', active: false },
    },
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
    modalType: { type: 'NONE', active: false },
  };
};

export const useProductTranDataStore = create<ProductTranState>()(devtools(immer(initialStateCreator)));
