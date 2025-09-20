import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, SpecialPriceRequestCreate, SpecialPriceRequestFilterForOneProduct } from '../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';

interface SpecialPriceState {
  // todo 추후 추가
}

type ModalType = 'DC_APPLY';

interface SpecialPriceApiState {
  closeModal: (type: ModalType) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  insertSpecialPrice: (insertRequestCreate: SpecialPriceRequestCreate) => AxiosPromise<ApiResponse>;
  selectSpecialPrice: (selectRequestFilter: SpecialPriceRequestFilterForOneProduct) => AxiosPromise<ApiResponse>;
}

type SpecialPrice = SpecialPriceState & SpecialPriceApiState;

/**
 * 전역 상태에 의도치 않은 데이터가 혼입되지 않도록 set 메서드 호출 이전 대응할 것
 * */
const initialStateCreator: StateCreator<SpecialPrice, any> = (set, get, api) => {
  return {
    insertSpecialPrice: (insertRequestCreate) => {
      return authApi.post('/special-prices/insert', insertRequestCreate);
    },
    selectSpecialPrice: (selectRequestFilter) => {
      return authApi.get('/special-prices/selectForOne', {
        params: selectRequestFilter,
      });
    },
    modalType: { type: 'DC_APPLY', active: false },
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

export const useSpecialPriceStore = create<SpecialPrice>()(devtools(immer(initialStateCreator)));
