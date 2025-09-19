import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { PageObject } from '../../generated';
import { StateCreator } from 'zustand/esm';
//                      발주 입하처리 팝업        매장분반납 입하처리팝업            상품추가               입하이력 발주&수선 상세            입하이력 매장분반납 상세
type ModalType = 'INSTOCK_FACTORY_ASN_POP' | 'INSTOCK_RETURN_ASN_POP' | 'INSTOCK_ADD_OTHER' | 'INSTOCK_FACTORY_HISTORY_POP' | 'INSTOCK_RETURN_HISTORY_POP';

interface InstockState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  // updateAsn: (request: AsnRequestUpdateAsn[]) => AxiosPromise<ApiResponse>;
}

interface InstockApiState {}

type InstockStore = InstockState & InstockApiState;

// 초기 상태 및 메서드 정의
const initialStateCreator: StateCreator<InstockStore, any> = (set, get) => {
  return {
    paging: {
      curPage: 1,
      pageRowCount: 50,
    },
    setPaging: (pageObject) => {
      set((state) => ({
        paging: {
          ...state.paging,
          ...pageObject,
        },
      }));
    },
    modalType: { type: 'INSTOCK_FACTORY_ASN_POP', active: false },
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
    // updateAsn: (request) => {
    //   return authApi.patch('/wms/asn/update', request);
    // },
  };
};

export const useInstockStore = create<InstockStore>()(devtools(immer(initialStateCreator), { name: 'Manualinstock Store' }));
