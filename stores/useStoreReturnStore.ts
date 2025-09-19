import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { PageObject, ApiResponse, StoreRequestReqUpdate } from '../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';

/**
 * 매장분 반납 store
 * */
//                    확정취소          수정확인          반납취소           반납확정
type ModalType = 'CONFIRMCANCLE' | 'EDITCONFIRM' | 'RETURNCANCLE' | 'RETURNCONFIRM';

interface StoreReturnState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  subPaging: PageObject;
  setSubPaging: (pagingInfo: PageObject | undefined) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

interface StoreReturnApiState {
  updateReturn: (StoreRequestReqUpdateList: StoreRequestReqUpdate[]) => AxiosPromise<ApiResponse>;
  updateConfirmCntn: (request: StoreRequestReqUpdate) => AxiosPromise<ApiResponse>;
  printReturnDetail: (tranTm: string) => AxiosPromise<ApiResponse>;
}

type ReturnStore = StoreReturnState & StoreReturnApiState;

/**
 * 전역 상태에 의도치 않은 데이터가 혼입되지 않도록 set 메서드 호출 이전 대응할 것
 * */
const initialStateCreator: StateCreator<ReturnStore, any> = (set, get, api) => {
  return {
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
    subPaging: {
      curPage: 1,
      pageRowCount: 20,
    },
    setSubPaging: (pageObject) => {
      set((state) => ({
        subPaging: {
          ...state.subPaging,
          ...pageObject,
        },
      }));
    },
    modalType: { type: 'CONFIRMCANCLE', active: false },
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
    updateReturn: (returnList) => {
      return authApi.patch('/store/return', returnList);
    },
    printReturnDetail: (tranTm) => {
      return authApi.get('/print/return/detail', {
        params: {
          tranTm: tranTm,
        },
      });
    },
    updateConfirmCntn: (request) => {
      return authApi.patch('/store/req/conUpdate', request);
    },
  };
};

export const useStoreReturnStore = create<ReturnStore>()(devtools(immer(initialStateCreator)));
