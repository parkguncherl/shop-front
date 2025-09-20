import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ApiResponse,
  ApiResponseListCodeDropDown,
  ApiResponseListCodeResponseLowerSelect,
  CodeControllerApiSelectCodePagingRequest,
  CodeControllerApiSelectDropdownByCodeUpperRequest,
  CodeDropDown,
  CodeRequestCreate,
  CodeRequestDelete,
  CodeRequestUpdate,
  CodeResponsePaging,
  PageObject,
} from '../generated';
import { AxiosPromise } from 'axios';
import { authApi, authDownApi } from '../libs';
import { StateCreator } from 'zustand/esm';
import { CODE } from '../libs/const';

type ModalType = 'ADD' | 'MOD' | 'LOWER' | 'EXCEL';

/** 코드 페이징 필터 */
export type CodePagingFilter = Pick<CodeControllerApiSelectCodePagingRequest, 'codeUpper' | 'codeCd' | 'codeNm'>;

interface CodeState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  selectedCode: CodeResponsePaging | undefined;
  setSelectedCode: (code: CodeResponsePaging) => void;
  codeUpper: string | undefined;
  setCodeUpper: (codeUpper: string) => void;
  codeDropDown: CodeControllerApiSelectDropdownByCodeUpperRequest | undefined;
  setCodeDropDown: (codeDropDown: CodeControllerApiSelectDropdownByCodeUpperRequest) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

interface CodeApiState {
  selectDropdownByCodeUpper: (inCodeUpper: string) => AxiosPromise<ApiResponseListCodeDropDown>;
  insertCode: (codeRequest: CodeRequestCreate) => AxiosPromise<ApiResponse>;
  updateCode: (codeRequest: CodeRequestUpdate) => AxiosPromise<ApiResponse>;
  updateCodeUseNotUse: (codeRequest: CodeRequestUpdate) => AxiosPromise<ApiResponse>;
  deleteCode: (codeRequest: CodeRequestDelete) => AxiosPromise<ApiResponse>;
  selectLowerCodeByCodeUpper: () => AxiosPromise<ApiResponseListCodeResponseLowerSelect>;
  selectLowerCodeByInputCode: (codeUpperVal: string) => AxiosPromise<ApiResponseListCodeResponseLowerSelect>;
  insertCodes: (codeRequestList: CodeRequestCreate[]) => AxiosPromise<ApiResponse>;
  excelDown: (codeRequest: CodePagingFilter) => void;
  excelTemplate: () => void;
  selectCodeList: (inCodeUpper: string) => Promise<CodeDropDown[] | undefined>;
}

const initialStateCreator: StateCreator<CodeState & CodeApiState, any> = (set, get, api) => {
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
    selectedCode: undefined,
    setSelectedCode: (code) => {
      set((state) => ({
        selectedCode: code,
      }));
    },
    codeUpper: undefined,
    setCodeUpper: (codeUpper) => {
      set((state) => ({
        codeUpper: codeUpper,
      }));
    },
    codeDropDown: undefined,
    setCodeDropDown: (codeDropDown) => {
      set((state) => ({
        codeDropDown: {
          ...state.codeDropDown,
          ...codeDropDown,
        },
      }));
    },
    modalType: { type: 'ADD', active: false },
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
    selectDropdownByCodeUpper: (inCodeUpper: string) => {
      return authApi.get('/code/dropdown', {
        params: {
          codeUpper: inCodeUpper,
        },
      });
    },
    insertCode: (codeRequest) => {
      return authApi.post('/code', codeRequest);
    },
    updateCode: (codeRequest) => {
      return authApi.put('/code', codeRequest);
    },
    updateCodeUseNotUse: (codeRequest) => {
      return authApi.put('/code/updateCodeUseNotUse', codeRequest);
    },
    deleteCode: (codeRequest) => {
      return authApi.delete('/code', {
        data: codeRequest,
      });
    },
    selectLowerCodeByCodeUpper: () => {
      return authApi.get('/code/lower/' + get().codeUpper);
    },
    selectLowerCodeByInputCode: (codeUpperVal: string) => {
      return authApi.get('/code/lower/' + codeUpperVal);
    },
    insertCodes: (codeRequestList) => {
      return authApi.put('/code/lower/' + get().codeUpper, codeRequestList);
    },

    excelDown: async (codeRequest) => {
      const params = '?codeUpper=' + codeRequest.codeUpper + '&codeCd=' + codeRequest.codeCd + '&codeNm=' + codeRequest.codeNm;
      const res = await authDownApi.get<Blob>('/code/excel-down' + params.replaceAll('undefined', ''));
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
    excelTemplate: async () => {
      const res = await authDownApi.get<Blob>('/code/excel-template');
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
    selectCodeList: async (inCodeUpper: string) => {
      const response = await authApi.get('/code/dropdown', {
        params: {
          codeUpper: inCodeUpper,
        },
      });

      if (response.data.resultCode === 200 && response.data.body) {
        console.log('response========>', response);
        return response.data.body as Array<CodeDropDown>;
      }
    },
  };
};

export const useCodeStore = create<CodeState & CodeApiState>()(devtools(immer(initialStateCreator)));
