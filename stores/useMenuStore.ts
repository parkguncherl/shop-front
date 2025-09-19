import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, Menu, MenuRequestCreate, PageObject, AuthRequestCreate, MenuResponsePaging, MenuRequestUpdate } from '../generated';
import { AxiosPromise } from 'axios';
import { authApi, authDownApi } from '../libs';

type ModalType = 'ADD' | 'MOD' | 'AUTH_MOD' | 'EXCEL';

export type MenuPagingFilter = Pick<Menu, 'upMenuCd'>;

/** 메뉴 페이징 필터 */
export const initMenuFilter: MenuPagingFilter = {
  upMenuCd: 'TOP',
};

interface MenuState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  filter: MenuPagingFilter;
  setFilter: (filter: MenuPagingFilter | undefined) => void;
  selectedMenu: MenuResponsePaging | undefined;
  setSelectedMenu: (menu: MenuResponsePaging) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  excelDown: () => void;
  excelUpload: (formData: FormData) => void;
  onClear: () => void;
}

export interface MenuApiState {
  insertMenu: (menuRequest: MenuRequestCreate) => AxiosPromise<ApiResponse>;
  updateMenu: (menuRequest: MenuRequestUpdate) => AxiosPromise<ApiResponse>;
  deleteMenu: (menu: Menu) => AxiosPromise<ApiResponse>;
  updateAuth: (authRequest: AuthRequestCreate) => AxiosPromise<ApiResponse>;
}

const initialStateCreator: StateCreator<MenuState & MenuApiState, any> = (set, get, api) => {
  return {
    paging: {
      curPage: 1,
      pageRowCount: 100,
    },
    setPaging: (pageObject) => {
      set((state) => ({
        paging: {
          ...state.paging,
          ...pageObject,
        },
      }));
    },
    filter: initMenuFilter,
    setFilter: (filter) => {
      set((state) => ({
        filter: {
          ...state.filter,
          ...filter,
        },
      }));
    },
    selectedMenu: undefined,
    setSelectedMenu: (menu: Menu) => {
      set((state) => ({
        selectedMenu: menu,
      }));
    },
    modalType: { type: 'AUTH_MOD', active: false },
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
    insertMenu: (menuRequest) => {
      return authApi.post('/menu', menuRequest);
    },
    updateMenu: (menuRequest) => {
      return authApi.put('/menu', menuRequest);
    },
    deleteMenu: (menu) => {
      return authApi.delete('/menu', {
        data: menu,
      });
    },
    updateAuth: (authRequest) => {
      return authApi.post('/menu/auth/reg', authRequest);
    },
    excelDown: async () => {
      const res = await authDownApi.get<Blob>('/menu/excelDown');
      const blob = res.data;
      const name = decodeURIComponent(res.headers['content-disposition']); //파일명 디코딩
      const fileName = name.substring(name.indexOf('filename=') + 10);
      const _fileName = fileName.substring(0, fileName.indexOf('.xlsx') + 5);

      if (typeof window !== 'undefined') {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.target = '_self';
        if (_fileName) link.download = _fileName;
        link.click();
      }
    },
    excelUpload: async (formData) => {
      return authApi.post('/menu/excelUpload', formData);
    },
    onClear: () => {
      set(() => initialStateCreator(set, get, api), true);
    },
  };
};

export const useMenuStore = create<MenuState & MenuApiState>()(devtools(immer(initialStateCreator)));
