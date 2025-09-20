import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { StateCreator } from 'zustand/esm';

type ModalType = 'DET';

interface ProdSalesSumStoreState {
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

const initialStateCreator: StateCreator<ProdSalesSumStoreState, any> = (set, get, api) => {
  return {
    modalType: { type: 'DET', active: false },
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

export const useProdSalesSumStore = create<ProdSalesSumStoreState>()(devtools(immer(initialStateCreator)));
