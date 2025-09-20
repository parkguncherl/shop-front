import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { StateCreator } from 'zustand/esm';
import { InoutListFilter } from '../../generated/src/model/inout-list-filter';

type ModalType = 'ADD';

// 재고 정보 상태 인터페이스 정의
interface InoutListState {
  loading: boolean;
  error: string | null;
  filters: InoutListFilter;
  onChangeFilters: (filters: Partial<InoutListFilter>) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

// 초기 상태 및 메서드 정의
const initialStateCreator: StateCreator<InoutListState, any> = (set, get) => ({
  // 필터 초기 상태
  filters: {
    startDate: '',
    endDate: '',
    partnerId: 0,
    searchType: '',
    prodAttrCd: '',
    skuNm: '',
  },
  loading: false,
  error: null,
  // 필터 변경 함수
  onChangeFilters: (filters: Partial<InoutListFilter>) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
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
});

// Zustand 스토어 생성
export const useInoutListStore = create<InoutListState>()(devtools(immer(initialStateCreator)));
