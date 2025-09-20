import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, DeliveryRequestUpdateDet, DeliveryResponsePaging, Order, PageObject, WrongRequestInsertWrongInfo } from '../generated';
import { StateCreator } from 'zustand/esm';
import { authApi } from '../libs';
import { AxiosPromise } from 'axios';

type ModalType = 'DET' | 'MOD_BORYU' | 'REG_WRONG' | 'SKU_SEARCH';
interface DeliveryState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  selectedPagingElement: DeliveryResponsePaging;
  setSelectedPagingElement: (deliveryResponsePaging: DeliveryResponsePaging) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

interface DeliveryApiState {
  selectTradeDateAsStartDate: () => AxiosPromise<ApiResponse>;
  updateDeliveryDet: (deliveryRequestUpdateDet: DeliveryRequestUpdateDet) => AxiosPromise<ApiResponse>;
}

const initialStateCreator: StateCreator<DeliveryState & DeliveryApiState, any> = (set, get, api) => {
  return {
    paging: {
      curPage: 1,
      pageRowCount: 999999,
    },
    setPaging: (pageObject) => {
      set((state) => ({
        paging: {
          ...state.paging,
          ...pageObject,
        },
      }));
    },
    selectedPagingElement: {},
    setSelectedPagingElement: (deliveryResponsePaging: DeliveryResponsePaging) => {
      set((state) => ({
        selectedPagingElement: deliveryResponsePaging,
      }));
    },
    selectTradeDateAsStartDate: () => {
      return authApi.get('/orderInfo/delivery/tradeDateAsStartDate');
    },
    updateDeliveryDet: (deliveryRequestUpdateDet) => {
      return authApi.patch('/orderInfo/delivery/update/det', deliveryRequestUpdateDet);
    },
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

export const useDeliveryStore = create<DeliveryState & DeliveryApiState>()(devtools(immer(initialStateCreator)));
