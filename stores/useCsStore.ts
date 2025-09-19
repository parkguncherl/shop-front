import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { PageObject, NoticeResponse } from '../generated';

type ModalType = 'CREATE' | 'DETAIL' | 'EDIT' | 'DELETE';

interface CsState {
  closeModal: () => void;
  modalType: { type: ModalType | null; active: boolean };
  onClear: () => void;
  openModal: (type: ModalType) => void;
  paging: PageObject;
  selectedNotice: NoticeResponse | undefined;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  setSelectedNotice: (notice: NoticeResponse) => void;
}

type Cs = CsState;

const initialStateCreator: StateCreator<CsState, any> = (set, get, api) => {
  return {
    modalType: { type: null, active: false },
    selectedNotice: undefined,
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
    setSelectedNotice: (notice) => {
      set(() => ({
        selectedNotice: notice,
      }));
    },
    openModal: (type) => {
      set(() => ({
        modalType: {
          type,
          active: true,
        },
      }));
    },
    closeModal: () => {
      set(() => ({
        modalType: {
          type: null,
          active: false,
        },
      }));
    },
    onClear: () => {
      set(() => initialStateCreator(set, get, api), true);
    },
  };
};

export const useCsStore = create<Cs>()(devtools(immer(initialStateCreator)));
