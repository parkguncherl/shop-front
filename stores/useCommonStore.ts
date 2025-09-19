import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, CommonRequestFileDownload, GridRequest, RetailResponseDetail, RetailResponsePaging } from '../generated';
import { AxiosPromise } from 'axios';
import { authApi, authDownApi } from '../libs';
import { toastError } from '../components';
import { fetchPartners } from '../api/wms-api';

type ModalType = 'UPLOAD' | 'UPLOADS' | 'IMAGES' | 'PRIVACY' | 'FILES';

export interface HistoryType {
  histMenuNm: string;
  histMenuUri: string;
}

export interface FilterData {
  uri: string;
  filterData: any;
}

export interface PartnerOption {
  value: number;
  label: string;
}
interface CommonState {
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType, index?: number) => void;
  closeModal: (type: ModalType) => void;
  selectedRetail: RetailResponseDetail | undefined;
  setSelectedRetail: (retail?: RetailResponseDetail) => void;
  upMenuNm: string | undefined;
  setUpMenuNm: (upMenuNm: string) => void;
  menuNm: string | undefined;
  setMenuNm: (menuNm: string) => void;
  isOrderOn: boolean;
  setIsOrderOn: (isOrderOn: boolean) => void;
  menuUpdYn: boolean;
  setMenuUpdYn: (menuUpdYn: boolean) => void;
  menuExcelYn: boolean;
  setMenuExcelYn: (menuExcelYn: boolean) => void;
  //downedFunctionKey: string | undefined; // 기능 키 (f1 ~ f12) 상태 관리
  //setDownedFunctionKey: (downedFunctionKey: string) => void;
  historyList: HistoryType[];
  setHistoryList: (historyList: HistoryType[]) => void;
  removeDuplicatedRows: <P>(
    comparedColField: string, // 중복 검사의 척도로서 기능하는 행의 필드명
    rows: P[], // 빈 배열 제거 후 대입하기를 권장
    onDuplicationDetected?: (originRow: P, duplicatedRow: P, originRowIndex: number, duplicatedRowIndex: number) => P | void, // 중복 행을 발견하였을 때 작동되는 콜백 함수, 반환 값을 특정하여 중복 행의 데이터를 수정할 수 있다.
  ) => P[];
  removeEmptyRows: <P>(rows: P[], colField?: string) => P[];
  filterDataList: FilterData[];
  setFilterDataList: (filterDataList: FilterData[]) => void;
  partnerOptions: PartnerOption[];
}

interface CommonApiState {
  fileDownload: (commonRequest: CommonRequestFileDownload) => void;
  fileDownloadBlob: (commonRequest: CommonRequestFileDownload) => any;
  deleteFile: (commonRequest: any) => AxiosPromise<ApiResponse>;
  getFileUrl: (fileKey: string) => Promise<string>;
  selectGridColumnState: (uri: string) => AxiosPromise<ApiResponse>;
  updateGridColumnState: (gridRequest: GridRequest) => AxiosPromise<ApiResponse>;
  initGridColumnState: (gridRequest: GridRequest) => AxiosPromise<ApiResponse>;
  getFilterData: (filterDataList: FilterData[], uri: string) => any;
  fetchPartnerOptions: (workLogisId: number, allDataText?: string) => Promise<void>;
}

const initialStateCreator: StateCreator<CommonState & CommonApiState, any> = (set, get, api) => {
  return {
    modalType: { type: 'UPLOAD', active: false },
    openModal: (type, index) => {
      set((state) => ({
        modalType: {
          type,
          active: true,
        },
        index: index,
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
    /** 전역 상태로 다루어지는 소매처 정보 (국소적으로 사용할 소매처 정보는 타 store 혹은 해당 페이지 컴포넌트에 별도로 정의하여 사용할 것) */
    selectedRetail: undefined,
    setSelectedRetail: (retail?: RetailResponsePaging) => {
      set((state) => ({
        selectedRetail: retail,
      }));
    },
    upMenuNm: undefined,
    setUpMenuNm: (upMenuNm: string) => {
      set((state) => ({
        upMenuNm: upMenuNm,
      }));
    },
    menuNm: undefined,
    setMenuNm: (menuNm: string) => {
      set((state) => ({
        menuNm: menuNm,
      }));
    },
    isOrderOn: false,
    setIsOrderOn: (isOrderOn: boolean) => {
      set((state) => ({
        isOrderOn: isOrderOn,
      }));
    },
    menuUpdYn: false,
    setMenuUpdYn: (menuUpdYn: boolean) => {
      set((state) => ({
        menuUpdYn: menuUpdYn,
      }));
    },
    menuExcelYn: false,
    setMenuExcelYn: (menuExcelYn: boolean) => {
      set((state) => ({
        menuExcelYn: menuExcelYn,
      }));
    },
    filterDataList: [],
    setFilterDataList: (newFilterDataList: FilterData[]) => {
      set((state: { filterDataList: FilterData[] }) => {
        // 기존 데이터가 없는 경우 바로 대체
        if (state.filterDataList.length === 0) {
          return { filterDataList: newFilterDataList };
        }
        // 새 데이터로 기존 데이터 대체 또는 추가
        const updatedFilterDataList = newFilterDataList.reduce(
          (acc, newFilterData) => {
            const existingIndex = acc.findIndex((item) => item.uri === newFilterData.uri);
            if (existingIndex !== -1) {
              // 동일한 `uri`가 있으면 대체
              acc[existingIndex] = newFilterData;
            } else {
              // 없으면 추가
              acc.push(newFilterData);
            }
            return acc;
          },
          [...state.filterDataList],
        ); // 현재 상태 복사

        return {
          filterDataList: updatedFilterDataList,
        };
      });
    },
    /*downedFunctionKey: undefined,
    setDownedFunctionKey: (downedFunctionKey: string) => {
      set((state) => ({
        downedFunctionKey: downedFunctionKey,
      }));
    },*/
    historyList: [],
    setHistoryList: (historyList: HistoryType[]) => {
      set((state) => ({
        historyList: historyList,
      }));
    },
    fileDownload: async (commonRequest) => {
      const params = '?id=' + commonRequest.id + '&fileSeq=' + commonRequest.fileSeq;

      const res = await authDownApi.get('/common/file/download' + params.replaceAll('undefined', ''));
      const blob = res.data;

      if (typeof window !== 'undefined') {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.target = '_self';
        link.download = commonRequest.fileNm!;
        link.click();
      }
    },
    fileDownloadBlob: async (commonRequest) => {
      const params = '?id=' + commonRequest.id + '&fileSeq=' + commonRequest.fileSeq;

      const res = await authDownApi.get('/common/file/download' + params.replaceAll('undefined', ''));
      return res.data;
    },

    deleteFile: (commonRequest) => {
      return authApi.delete('/common/fileDeleteBySeq/' + commonRequest.fileId + '/' + commonRequest.fileSeq, {});
    },
    getFileUrl: async (fileKey: string) => {
      if (!fileKey || fileKey.trim() === '') {
        return '';
      } else {
        return await authApi.get('/common/getFileUrl', { params: { fileKey: fileKey } }).then((res) => {
          if (res.data.resultCode === 200) {
            return res.data.body;
          } else {
            return '';
          }
        });
      }
    },
    selectGridColumnState: (uri) => {
      return authApi.get('/common/grid-column', {
        params: {
          uri: uri,
        },
      });
    },
    updateGridColumnState: (gridRequest) => {
      return authApi.post('/common/grid-column/update', gridRequest);
    },
    initGridColumnState: (gridRequest) => {
      // 실제로 삭제함
      return authApi.post('/common/grid-column/init', gridRequest);
    },
    getFilterData: (filterDataList: FilterData[], uri: string) => {
      const filterInfo = filterDataList.filter((data: FilterData) => data.uri === uri);
      if (filterInfo && filterInfo.length > 0) {
        return filterInfo[0].filterData;
      } else {
        return undefined;
      }
    },
    removeDuplicatedRows: (comparedColField, rows, onDuplicationDetected) => {
      const copiedRows = JSON.parse(JSON.stringify(rows));
      for (let outer = 0; outer < copiedRows.length; outer++) {
        // 중복 요소는 빈 배열로 만들고 상태 반영 직전 제거
        if (Object.keys(copiedRows[outer]).length == 0) {
          // 빈 배열은 continue
        } else {
          for (let inner = 0; inner < copiedRows.length; inner++) {
            if (outer != inner && copiedRows[outer][comparedColField] == copiedRows[inner][comparedColField]) {
              // 대상 행의 인덱스(i)가 아닌 다른 인덱스(x, x!= i)에 대응하는 row 의 colNm 'key' 에 대응하는 value 가, 대상 행 key - value 의 value 와 동일한 경우
              // copiedRows[i].skuCnt = (copiedRows[i].skuCnt || 0) + (copiedRows[x].skuCnt || 0); // 스큐 수량 반영
              if (onDuplicationDetected) {
                const returnedRow = onDuplicationDetected(copiedRows[outer], copiedRows[inner], outer, inner);
                if (returnedRow) {
                  // copiedRows[outer] 값 수정을 희망할 경우 수정된 값을 return
                  copiedRows[outer] = returnedRow;
                }
              }
              copiedRows[inner] = {}; // 빈 행값 할당 (상단 if 문에서 continue 처리 된다.)
              break;
            }
          }
        }
      }
      return copiedRows.filter((det: any) => Object.keys(det).length != 0);
    },
    removeEmptyRows: (rows, colField) => {
      if (colField == undefined) {
        // key 배열 요소 부재를 기준으로 필터링(빈 객체 할당한 경우)
        return JSON.parse(JSON.stringify(rows)).filter((row: any) => Object.keys(row).length != 0);
      } else {
        // 특정 key 에 대응하는 값의 정의 여부에 따라 분기
        return JSON.parse(JSON.stringify(rows)).filter((row: any) => row[colField] != undefined);
      }
    },
    partnerOptions: [],
    fetchPartnerOptions: async (workLogisId: number, allDataText?: string) => {
      try {
        const { data } = await fetchPartners(workLogisId);
        const { resultCode, body, resultMessage } = data;

        if (resultCode === 200) {
          const partnerCodes =
            body?.map((item: any) => ({
              value: item.id,
              label: item.partnerNm,
            })) ?? [];
          if (allDataText) {
            set({ partnerOptions: [{ value: null, label: allDataText }, ...partnerCodes] });
          } else {
            set({ partnerOptions: partnerCodes });
          }
        } else {
          toastError(resultMessage);
        }
      } catch (err) {
        toastError('파트너 조회 실패');
      }
    },
  };
};

export const useCommonStore = create<CommonState & CommonApiState>()(devtools(immer(initialStateCreator)));
