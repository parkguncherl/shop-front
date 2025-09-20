import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { PageObject, ProductResponsePaging } from '../generated'; // Attribute api interface 생성하여 임포트할 필요

type ModalType = 'PAYMANAGE'; // 결제거래,

interface OrderState {
  closeModal: () => void;
  modalType: { type: ModalType | null; active: boolean };
  onClear: () => void;
  openModal: (type: ModalType) => void;
  paging: PageObject;
  selectedOrder: ProductResponsePaging | undefined;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  setSelectedOrder: (order: ProductResponsePaging) => void;
}

type Order = OrderState;

const initialState: Order = {
  closeModal: () => {},
  modalType: { type: null, active: false },
  onClear: () => {},
  openModal: () => {},
  paging: {
    curPage: 1,
    pageRowCount: 20,
  },
  selectedOrder: undefined,
  setPaging: () => {},
  setSelectedOrder: () => {},
};

const initialStateCreator: StateCreator<Order, any> = (set, get, api) => ({
  ...initialState,
  setPaging: (pageObject) => {
    set((state) => ({
      paging: {
        ...state.paging,
        ...pageObject,
      },
    }));
  },
  setSelectedOrder: (order) => {
    set(() => ({
      selectedOrder: order,
    }));
  },
  openModal: (type) => {
    set(() => ({
      modalType: {
        type,
        active: true,
      },
    }));
  },
  closeModal: () => {
    set(() => ({
      modalType: {
        type: null,
        active: false,
      },
    }));
  },
  onClear: () => {
    set(() => initialState, true);
  },
});

export const usePayMngStore = create<Order>()(devtools(immer(initialStateCreator)));
