import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { PageObject } from '../generated';

interface PastHistoryState {
  stockPaging: PageObject;
  setStockPaging: (pagingInfo: PageObject | undefined) => void;
  salePaging: PageObject;
  setSalePaging: (pagingInfo: PageObject | undefined) => void;
  samplePaging: PageObject;
  setSamplePaging: (pagingInfo: PageObject | undefined) => void;
  misongPaging: PageObject;
  setMisongPaging: (pagingInfo: PageObject | undefined) => void;
  logPaging: PageObject;
  setLogPaging: (pagingInfo: PageObject | undefined) => void;
}

const initialStateCreator: StateCreator<PastHistoryState> = (set, get) => {
  return {
    stockPaging: {
      curPage: 1,
      pageRowCount: 20,
    },
    setStockPaging: (pageObject) => {
      set((state) => ({
        stockPaging: {
          ...state.stockPaging,
          ...pageObject,
        },
      }));
    },
    salePaging: {
      curPage: 1,
      pageRowCount: 20,
    },
    setSalePaging: (pageObject) => {
      set((state) => ({
        salePaging: {
          ...state.salePaging,
          ...pageObject,
        },
      }));
    },
    misongPaging: {
      curPage: 1,
      pageRowCount: 20,
    },
    setMisongPaging: (pageObject) => {
      set((state) => ({
        misongPaging: {
          ...state.misongPaging,
          ...pageObject,
        },
      }));
    },
    samplePaging: {
      curPage: 1,
      pageRowCount: 20,
    },
    setSamplePaging: (pageObject) => {
      set((state) => ({
        samplePaging: {
          ...state.samplePaging,
          ...pageObject,
        },
      }));
    },
    logPaging: {
      curPage: 1,
      pageRowCount: 50,
    },
    setLogPaging: (pageObject) => {
      set((state) => ({
        logPaging: {
          ...state.logPaging,
          ...pageObject,
        },
      }));
    },
  };
};

export const usePastHistoryStore = create<PastHistoryState>()(devtools(immer(initialStateCreator)));
