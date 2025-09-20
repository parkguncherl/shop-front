import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ApiResponse,
  ApiResponseListCodeDropDown,
  PartnerCodeControllerApiSelectPartnerCodePagingRequest,
  PartnerCodeControllerApiSelectDropdownByPartnerCodeUpperRequest,
  PageObject,
  PartnerCodeRequestDelete,
  ApiResponseListPartnerCodeResponseLowerSelect,
  PartnerCodeResponseLowerSelect,
  PartnerCodeRequestCreate,
  ApiResponseListPartnerCodeDropDown,
  PartnerCodeRequestSoftDelete,
} from '../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';
import { StateCreator } from 'zustand/esm';
import data from '@react-google-maps/api/src/components/drawing/Data';

type ModalType = 'ADD' | 'MOD' | 'LOWER' | 'EXCEL';

/** 코드 페이징 필터 */
export type PartnerCodePagingFilter = Pick<PartnerCodeControllerApiSelectPartnerCodePagingRequest, 'codeUpper' | 'codeCd' | 'codeNm'>;

interface PartnerCodeState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  selectedPartnerCode: PartnerCodeResponseLowerSelect[] | undefined;
  setSelectedPartnerCode: (code: PartnerCodeResponseLowerSelect[]) => void;
  updatePartnerCodeItem: (id: number, updateData: PartnerCodeResponseLowerSelect) => void;
  partnerCodeDropDown: PartnerCodeControllerApiSelectDropdownByPartnerCodeUpperRequest | undefined;
  setPartnerCodeDropDown: (codeDropDown: PartnerCodeControllerApiSelectDropdownByPartnerCodeUpperRequest) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

interface PartnerCodeApiState {
  selectDropdownByPartnerCodeUpper: () => AxiosPromise<ApiResponseListCodeDropDown>;
  savePartnerCode: (codeRequest: PartnerCodeRequestCreate) => AxiosPromise<ApiResponse>;
  deletePartnerCode: (codeRequest: PartnerCodeRequestDelete) => AxiosPromise<ApiResponse>;
  updatePartnerCodeToDeletedStatus: (codeRequests: PartnerCodeRequestSoftDelete) => AxiosPromise<ApiResponse>;
  selectLowerPartnerCodeByCodeUpper: (codeUpper: string, searchKeyword?: string) => AxiosPromise<ApiResponseListPartnerCodeResponseLowerSelect>;
  selectPartnerCodeDropdown: (codeUpper: string) => AxiosPromise<ApiResponseListPartnerCodeDropDown>; // 코드 콤보용
}

const initialStateCreator: StateCreator<PartnerCodeState & PartnerCodeApiState, any> = (set, get, api) => {
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
    selectedPartnerCode: undefined,
    setSelectedPartnerCode: (code) => {
      set((state) => ({
        selectedPartnerCode: code,
      }));
    },
    partnerCodeDropDown: undefined,
    setPartnerCodeDropDown: (partnerCodeDropDown) => {
      set((state) => ({
        partnerCodeDropDown: {
          ...state.partnerCodeDropDown,
          ...partnerCodeDropDown,
        },
      }));
    },
    updatePartnerCodeItem: (id, updateData) => {
      set((state) => ({
        selectedPartnerCode: state.selectedPartnerCode?.map((item) => (item.id === id ? { ...item, ...updateData } : item)),
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
    selectDropdownByPartnerCodeUpper: () => {
      return authApi.get('/partnerCode/dropdown', {
        params: {
          ...get().partnerCodeDropDown,
        },
      });
    },
    savePartnerCode: (codeRequest) => {
      return authApi.post('/partnerCode', codeRequest);
    },
    deletePartnerCode: (codeRequest) => {
      return authApi.delete('/partnerCode', {
        data: codeRequest,
      });
    },
    updatePartnerCodeToDeletedStatus: (codeRequests: PartnerCodeRequestSoftDelete) => {
      return authApi.put('/partnerCode/update-status', codeRequests);
    },
    selectLowerPartnerCodeByCodeUpper: (codeUpper: string, searchKeyword?: string) => {
      return authApi.get('/partnerCode/lowerCodeList', {
        params: { codeUpper: codeUpper, searchKeyword: searchKeyword },
      });
    },
    selectPartnerCodeDropdown: (codeUpper: string) => {
      return authApi.get('/partnerCode/dropdown', {
        params: { codeUpper: codeUpper },
      });
    },
  };
};

export const usePartnerCodeStore = create<PartnerCodeState & PartnerCodeApiState>()(devtools(immer(initialStateCreator)));
