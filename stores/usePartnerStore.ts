import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ApiResponse,
  PageResponsePartnerResponsePaging,
  PartnerResponsePaging,
  PartnerControllerApiSelectPartnerPagingRequest,
  PartnerRequestCreate,
  PartnerRequestDelete,
  PartnerRequestUpdate,
  PageObject,
  PartnerResponseSelect,
  PartnerRequestFilterForList,
} from '../generated';
import { AxiosPromise } from 'axios';
import { authApi, authDownApi } from '../libs';
import { StateCreator } from 'zustand/esm';

type ModalType = 'ADD' | 'MOD';

/** 파트너 페이징 필터 */
export type PartnerPagingFilter = Pick<PartnerControllerApiSelectPartnerPagingRequest, any>;

interface PartnerState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  selectedPartner: PartnerResponsePaging | undefined;
  setSelectedPartner: (partner: PartnerResponsePaging) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

interface PartnerApiState {
  selectMyPartner: () => AxiosPromise<ApiResponse>;
  selectPartnerPaging: (filter: PartnerPagingFilter) => AxiosPromise<PageResponsePartnerResponsePaging>;
  selectPartnerList: (requestFilterForList?: PartnerRequestFilterForList) => AxiosPromise<ApiResponse>;
  insertPartner: (partnerRequest: PartnerRequestCreate) => AxiosPromise<ApiResponse>;
  updatePartner: (partnerRequest: PartnerRequestUpdate) => AxiosPromise<ApiResponse>;
  updatePartnerAll: (partnerRequest: PartnerRequestUpdate) => AxiosPromise<ApiResponse>;
  deletePartner: (partnerRequest: PartnerRequestDelete) => AxiosPromise<ApiResponse>;
  insertPartners: (partnerRequestList: PartnerRequestCreate[]) => AxiosPromise<ApiResponse>;
  excelDown: (partnerRequest: PartnerPagingFilter) => void;
  excelTemplate: () => void;
}

const initialStateCreator: StateCreator<PartnerState & PartnerApiState, any> = (set, get, api) => {
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
    selectedPartner: undefined,
    setSelectedPartner: (partner) => {
      set((state) => ({
        selectedPartner: partner,
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
    selectMyPartner: () => {
      return authApi.get('/partner/my-partner', {});
    },
    selectPartnerPaging: (filter) => {
      return authApi.get('/partner/paging', {
        params: {
          ...filter,
          ...get().paging,
        },
      });
    },
    selectPartnerList: (requestFilterForList) => {
      return authApi.get('/partner/list', {
        params: {
          ...requestFilterForList,
        },
      });
    },
    insertPartner: (partnerRequest) => {
      return authApi.post('/partner', partnerRequest);
    },
    updatePartner: (partnerRequest) => {
      return authApi.put('/partner', partnerRequest);
    },
    updatePartnerAll: (partnerRequest) => {
      return authApi.put('/partner/updatePartnerAll', partnerRequest);
    },
    deletePartner: (partnerRequest) => {
      return authApi.delete('/partner', {
        data: partnerRequest,
      });
    },
    insertPartners: (partnerRequestList) => {
      return authApi.put('/partner', partnerRequestList);
    },
    excelDown: async (partnerRequest) => {
      const params = '?partnerCd=' + partnerRequest.partnerCd + '&partnerNm=' + partnerRequest.partnerNm;
      const res = await authDownApi.get<Blob>('/partner/excel-down' + params.replaceAll('undefined', ''));
      const blob = res.data;
      const name = decodeURIComponent(res.headers['content-disposition']); // 파일명 디코딩
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
      const res = await authDownApi.get<Blob>('/partner/excel-template');
      const blob = res.data;
      const name = decodeURIComponent(res.headers['content-disposition']); // 파일명 디코딩
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
  };
};

export const usePartnerStore = create<PartnerState & PartnerApiState>()(devtools(immer(initialStateCreator)));
