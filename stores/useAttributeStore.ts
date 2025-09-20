import { create, SetState, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, PageObject, AuthRequestCreate, AttributeResponsePaging, AttributeRequestUpdate } from '../generated'; // Attribute api interface 생성하여 임포트할 필요
import { AxiosPromise } from 'axios';
import { authApi, authDownApi } from '../libs';
import { MenuPagingFilter } from './useMenuStore';

type ModalType = 'ADD' | 'MOD' | 'AUTH_MOD' | 'EXCEL';

export type AttributePagingFilter = {
  attrNm: string | number | undefined;
  attrEngNm: string | number | undefined;
  attrType: string | number | undefined;
  attrCat: string | number | undefined;
};

type CodePagingFilter = {
  codeNm: string;
};

interface AttributeState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  codePaging: PageObject;
  setCodePaging: (pagingInfo: PageObject | undefined) => void;
  selectedAttribute: AttributeResponsePaging | undefined;
  setSelectedAttribute: (attribute: AttributeResponsePaging) => void;
  filter: AttributePagingFilter;
  setFilter: (filter: AttributePagingFilter | undefined) => void;
  codeFilter: CodePagingFilter;
  setCodeFilter: (filter: CodePagingFilter | undefined) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  /* excelDown: () => void;
  excelUpload: (formData: FormData) => void; */
  onClear: () => void;
}

export interface AttributeApiState {
  //insertAttribute: (AttributeRequest: AttributeResponsePaging) => AxiosPromise<ApiResponse>;
  updateAttribute: (AttributeRequest: { updated: AttributeRequestUpdate[]; inserted: AttributeRequestUpdate[] }) => AxiosPromise<ApiResponse>; // 값 추가, 삭제, 수정을 전부 처리
  //deleteAttribute: (attribute: Attribute) => AxiosPromise<ApiResponse>;
  updateAuth: (authRequest: AuthRequestCreate) => AxiosPromise<ApiResponse>;
}

type Attribute = AttributeState & AttributeApiState;

const initAttributeFilter: AttributePagingFilter = {
  attrNm: undefined,
  attrEngNm: undefined,
  attrType: undefined,
  attrCat: undefined,
};

const initCodeFilter: CodePagingFilter = {
  codeNm: '도메인코드',
};

const initialStateCreator: StateCreator<Attribute, any> = (set, get, api) => {
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
    codePaging: {
      curPage: 1,
      pageRowCount: 20,
    },
    setCodePaging: (pageObject) => {
      set((state) => ({
        codePaging: {
          ...state.codePaging,
          ...pageObject,
        },
      }));
    },
    selectedAttribute: undefined,
    setSelectedAttribute: (attribute: AttributeResponsePaging) => {
      set((state) => ({
        selectedAttribute: attribute,
      }));
    },
    filter: initAttributeFilter,
    setFilter: (filter) => {
      set((state) => ({
        filter: {
          ...state.filter,
          ...filter,
        },
      }));
    },
    codeFilter: initCodeFilter,
    setCodeFilter: (filter) => {
      set((state) => ({
        codeFilter: {
          ...state.codeFilter,
          ...filter,
        },
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
    updateAttribute: (attributeRequest) => {
      return authApi.put('/attribute', attributeRequest);
    },
    updateAuth: (authRequest) => {
      return authApi.post('/menu/auth/reg', authRequest);
    },
    /*excelDown: async () => {
      const res = await authDownApi.get<Blob>('/menu/excelDown');
      const blob = res.data;
      const name = decodeURIComponent(res.headers['content-disposition']); //파일명 디코딩
      const fileName = name.substring(name.indexOf('filename=') + 10);
      const _fileName = fileName.substring(0, fileName.indexOf('.xlsx') + 5);

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.target = '_self';
      if (_fileName) link.download = _fileName;
      link.click();
    },
    excelUpload: async (formData) => {
      return authApi.post('/menu/excelUpload', formData);
    },*/
    onClear: () => {
      set(() => initialStateCreator(set, get, api), true);
    },
  };
};

export const useAttributeStore = create<Attribute>()(devtools(immer(initialStateCreator)));
