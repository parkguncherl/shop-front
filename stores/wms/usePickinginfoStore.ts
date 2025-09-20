import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AxiosPromise } from 'axios';
import { authApi } from '../../libs';
import { ApiResponse, PageObject, PickinginfoRequestPagingFilter } from '../../generated';

// 작업정보 요청 필터 인터페이스
// export interface PickinginfoRequestPagingFilter {
//   startDate?: string;
//   endDate?: string;
//   partnerId?: string;
//   sellerId?: string;
//   workYmd?: string;
//   searchKeyword?: string;
//   sellerName?: string;
//   jobStatus?: string;
//   processable?: string;
//   partnerName?: string;
//   skuName?: string;
//   jobTypeNm?: string;
//   jobType?: string;
// }

// 작업정보 응답 인터페이스
// export interface PickinginfoResponse {
//   id: number;
//   partnerName: string;
//   jobStatus: string;
//   chitNo: string;
//   sellerName: string;
//   orderCdNm: string;
//   workYmd: string;
//   processable: boolean;
//   currentStockQuantity: string;
//   tranCnt: string;
//   jobStatusNm: string;
//   reason: string;
//   jobTypeNm?: string;
//   updTm?: string;
//   updUser?: string;
//   jobEtc?: string;
// }

// API 응답 인터페이스
interface PickinginfoApiResponse extends ApiResponse {
  body: {
    rows: PickinginfoResponse[];
    paging: PageObject;
  };
}

// 작업정보 상태 인터페이스
interface PickinginfoState {
  //paging: PageObject;
  //setPaging: (pagingInfo: PageObject | undefined) => void;
  loading: boolean;
  error: string | null;
}

// 작업정보 API 상태 인터페이스
interface PickinginfoApiState {
  getPickinginfoList: (params: PickinginfoRequestPagingFilter) => AxiosPromise<PickinginfoApiResponse>;
  startOrderProcessing: (orderId: number) => AxiosPromise<ApiResponse>;
  getPickinginfoPreviewDetail: (id: number) => AxiosPromise<ApiResponse>;
  getPickinginfoBottomGridDetail: (id: number) => AxiosPromise<ApiResponse>;
  holdJob: (jobId: number, holdReason: string) => AxiosPromise<ApiResponse>;
  releaseHold: (jobId: number) => AxiosPromise<ApiResponse>;
}

// 작업정보 하단 그리드 상세 정보 인터페이스
export interface PickinginfoBottomGridDetail {
  no: number;
  invenId: number;
  skuId: number;
  skuName: string;
  locCd: string;
  zoneCd: string;
  invenStatCd: string;
  invenStatCdNm: string;
}

// API 응답 인터페이스에 하단 그리드 상세 정보 추가
interface PickinginfoBottomGridApiResponse extends ApiResponse {
  body: PickinginfoBottomGridDetail[];
}

// 작업정보 스토어 타입
type PickinginfoStore = PickinginfoState & PickinginfoApiState;

// 초기 상태 생성자
const initialStateCreator: StateCreator<PickinginfoStore, any> = (set, get, api) => {
  return {
    // 페이징 정보 초기화
    /*paging: {
      curPage: 1,
      pageRowCount: 100,
    },
    // 페이징 정보 설정 함수
    setPaging: (pageObject) => {
      set((state) => ({
        paging: {
          ...state.paging,
          ...pageObject,
        },
      }));
    },*/
    loading: false,
    error: null,

    // 작업정보 목록 조회 API
    getPickinginfoList: (params: PickinginfoRequestPagingFilter) => {
      set({ loading: true, error: null });
      return authApi
        .get<PickinginfoApiResponse>('/wms/pickinginfo/paging', { params })
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: '작업정보 목록을 가져오는데 실패했습니다', loading: false });
          throw error;
        });
    },

    // 주문 처리 시작 API
    startOrderProcessing: (orderId: number) => {
      set({ loading: true, error: null });
      return authApi
        .post(`/wms/pickinginfo/${orderId}/start-processing`)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: '주문 처리 시작에 실패했습니다', loading: false });
          throw error;
        });
    },

    // 작업정보 프리뷰 상세 조회 API
    getPickinginfoPreviewDetail: (id: number) => {
      set({ loading: true, error: null });
      return authApi.get(`/wms/pickinginfo/detail/${id}`).then((response) => {
        set({ loading: false });
        return response;
      });
    },

    // 작업정보 하단 그리드 상세 조회 API
    getPickinginfoBottomGridDetail: (jobId: number) => {
      set({ loading: true, error: null });
      return authApi
        .get(`/wms/pickinginfo/${jobId}/bottom-grid-detail`)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: '작업정보 하단 그리드 상세 정보를 가져오는데 실패했습니다', loading: false });
          throw error;
        });
    },
    // 작업 보류 API
    holdJob: (jobId: number, holdReason: string) => {
      set({ loading: true, error: null });
      return authApi
        .post(`/wms/pickinginfo/${jobId}/hold`, holdReason, {
          headers: {
            'Content-Type': 'text/plain',
          },
        })
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: '작업 보류 처리에 실패했습니다', loading: false });
          throw error;
        });
    },
    // 보류 해제 API
    releaseHold: (jobId: number) => {
      set({ loading: true, error: null });
      return authApi
        .post(`/wms/pickinginfo/${jobId}/release-hold`)
        .then((response) => {
          set({ loading: false });
          return response;
        })
        .catch((error) => {
          set({ error: '보류 해제 처리에 실패했습니다', loading: false });
          throw error;
        });
    },
  };
};

// Zustand 스토어 생성
export const usePickinginfoStore = create<PickinginfoStore>()(devtools(immer(initialStateCreator)));
