import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponsePageResponseContactResponsePaging, ContactResponsePaging, PageObject } from '../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';

type ModalType = 'DETAIL';

interface ContactState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  selectContact: ContactResponsePaging | undefined;
  setSelectContact: (selectContact: ContactResponsePaging | undefined) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  selectContactPaging: () => AxiosPromise<ApiResponsePageResponseContactResponsePaging>;
}

export const useContactState = create<ContactState>()(
  devtools(
    immer((set, get) => ({
      paging: {
        curPage: 1,
        pageRowCount: 20,
      },
      setPaging: (pageObject) => {
        set((state) => {
          state.paging = {
            ...state.paging,
            ...pageObject,
          };
        });
      },
      selectContact: {},
      setSelectContact: (selectContact) => {
        set((state) => {
          state.selectContact = {
            ...state.selectContact,
            ...selectContact,
          };
        });
      },
      selectContactPaging: () => {
        return authApi.get('/contact/paging', {
          params: {
            curPage: get().paging.curPage,
            pageRowCount: get().paging.pageRowCount,
          },
        });
      },
      modalType: { type: 'DETAIL', active: false },
      openModal: (type) => {
        set((state) => {
          state.modalType.type = type;
          state.modalType.active = true;
        });
      },
      closeModal: (type) => {
        set((state) => {
          state.modalType.type = type;
          state.modalType.active = false;
        });
      },
      // insertMenu: (menuRequest) => {
      //   return authApi.post('/menu', menuRequest);
      // },
      // updateMenu: (menuRequest) => {
      //   return authApi.put('/menu', menuRequest);
      // },
      // deleteMenu: (menu) => {
      //   return authApi.delete('/menu', {
      //     data: menu,
      //   });
      // },
      // updateAuth: (authRequest) => {
      //   return authApi.post('/menu/auth/reg', authRequest);
      // },
    })),
  ),
);
