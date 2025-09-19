import {
  ApiResponse,
  ExpenseRequestCreate,
  ExpenseRequestUpdate,
  ExpenseResponseDetail,
  ExpenseResponsePaging,
  PageObject,
  ExpenseRequestSubDetail,
} from '../generated';
import { AxiosPromise } from 'axios';
import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { authApi } from '../libs';

type ModalType = 'CATEGORYSETTING' | 'ADD' | 'MOD' | 'DELETE' | 'RELEASEEDIT' | 'SUBDETAIL';

interface ExpenseState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  subPaging: PageObject;
  subSetPaging: (pagingInfo: PageObject | undefined) => void;
  selectedDetail: ExpenseResponsePaging[] | [];
  setSelectedDetail: (detail: ExpenseResponsePaging[] | []) => void;
  loading: boolean;
  error: string | null;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

interface ExpenseApiState {
  createExpense: (requestCreate: ExpenseRequestCreate) => AxiosPromise<ApiResponse>;
  updateExpense: (requestUpdate: ExpenseRequestUpdate) => AxiosPromise<ApiResponse>;
  deleteExpense: (id: number) => AxiosPromise<ApiResponse>;
  getExpenseDetail: (id: number) => AxiosPromise<ExpenseResponseDetail>;
  getExpenseSubDetail: (detailInfo: ExpenseRequestSubDetail) => AxiosPromise<ApiResponse>;
  getAccountFrequency: () => AxiosPromise<ApiResponse>;
}

type ExpenseStore = ExpenseState & ExpenseApiState;

const initialStateCreator: StateCreator<ExpenseStore, any> = (set, get, api) => {
  return {
    paging: {
      curPage: 1,
      pageRowCount: 999999,
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
      pageRowCount: 999999,
    },
    subSetPaging: (pageObject) => {
      set((state) => ({
        subPaging: {
          ...state.subPaging,
          ...pageObject,
        },
      }));
    },
    selectedDetail: [],
    setSelectedDetail: (selectedDetail: ExpenseResponsePaging[]) => {
      set((state) => ({
        selectedDetail: selectedDetail,
      }));
    },
    loading: false,
    error: null,
    modalType: { type: 'RELEASEEDIT', active: false },
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
    createExpense: (expense) => {
      set({ loading: true, error: null });
      return authApi
        .post('/orderInfo/expense/create', expense)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to create expense', loading: false });
          throw error;
        });
    },

    updateExpense: (expense) => {
      set({ loading: true, error: null });
      return authApi
        .put('/orderInfo/expense/update', expense)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to update expense', loading: false });
          throw error;
        });
    },

    deleteExpense: (id: number) => {
      set({ loading: true, error: null });
      return authApi
        .delete(`/orderInfo/expense/delete/${id}`)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to delete expense', loading: false });
          throw error;
        });
    },

    getExpenseDetail: (id: number) => {
      set({ loading: true, error: null });
      return authApi
        .get(`/orderInfo/expense/detail/${id}`)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to get Expense detail', loading: false });
          throw error;
        });
    },

    getExpenseSubDetail: (detailInfo: ExpenseRequestSubDetail) => {
      set({ loading: true, error: null });
      return authApi
        .get(`/orderInfo/expense/sub/detail`, {
          params: detailInfo,
        })
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to get Expense detail', loading: false });
          throw error;
        });
    },

    getAccountFrequency: () => {
      set({ loading: true, error: null });
      return authApi
        .get(`/orderInfo/expense/accountFrequency`)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: 'Failed to get Expense accountFrequency', loading: false });
          throw error;
        });
    },
  };
};

export const useExpenseStore = create<ExpenseStore>()(devtools(immer(initialStateCreator)));
