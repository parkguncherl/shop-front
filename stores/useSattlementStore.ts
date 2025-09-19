import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, PageObject, SettlementRequestAsMoneyInput } from '../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';
//                돈통 현금 입력(돈넣기)    정산 마감 입력(돈빼기)        이력보기
type ModalType = 'ENTER_PRICE_CASH' | 'ENTER_SETT_END' | 'HISTORY' | 'ENTERPRICE_CONFIRM';

interface SettlementState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  closeModal: () => void;
  modalType: { type: ModalType | null; active: boolean };
  onClear: () => void;
  openModal: (type: ModalType) => void;
  requestAsMoneyInput: (asMoneyInput: SettlementRequestAsMoneyInput) => AxiosPromise<ApiResponse>;
  //insertMoney: (money: SettlementRequestInsertMoney) => AxiosPromise<ApiResponse>;
  //updateMoney: (money: SettlementRequestUpdateMoney) => AxiosPromise<ApiResponse>;
}

const initialState = {
  modalType: { type: null, active: false },
};

const settlementStateCreator: StateCreator<SettlementState> = (set) => ({
  ...initialState,
  paging: {
    curPage: 1,
    pageRowCount: 20,
  },
  setPaging: (pageObject) => {
    set((state) => ({
      paging: {
        ...state.paging,
        ...pageObject,
      },
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
  requestAsMoneyInput: (asMoneyInput) => {
    return authApi.put('/orderInfo/settlement/requestAsMoneyInput', asMoneyInput);
  },
  /*insertMoney: (money) => {
    return authApi.put('/orderInfo/settlement/createMoney', money);
  },
  updateMoney: (money) => {
    return authApi.patch('/orderInfo/settlement/updateMoney', money);
  },*/
});
export const useSettlementStore = create<SettlementState>()(devtools(immer(settlementStateCreator)));
