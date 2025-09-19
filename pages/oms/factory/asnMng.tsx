/**
 * @file pages/oms/pastHistory/productLog.tsx
 * @description OMS > 변경로그 > 상품자료 변경로그 메인 컴포넌트
 * @copyright 2024
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Table, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import { useAsnMngStore } from '../../../stores/useAsnMngStore';
import { useAgGridApi } from '../../../hooks';
import { useCodeStore, useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { CellRange, CellValueChangedEvent, ColDef, ITooltipParams, ProcessCellForExportParams, RowClassParams } from 'ag-grid-community';
import AsnAddPop from '../../../components/popup/asn/AsnAddPop';
import { Tooltip } from 'react-tooltip';
import ECharts from 'echarts-for-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import {
  AsnMngResponsePaging,
  AsnMngResponseSerieDataInExpected,
  AsnMngResponseSkuExpectInfo,
  AsnMngRequestDelete,
  AsnMngRequestUpdate,
  CodeDropDown,
  ReceivingHistoryRequestFactorySpc,
} from '../../../generated';
import dayjs from 'dayjs';
import { isNumber } from 'is-what';
import { CODE } from '../../../libs/const';
import OrderHistDetPop from '../../../components/popup/asn/det/OrderHistDetPop';
import ReOrderDetPop from '../../../components/popup/asn/det/reOrderDetPop';
import MisongHistPop from '../../../components/popup/asn/det/misongHistPop';
import MichulDetPop from '../../../components/popup/asn/det/michulDetPop';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { chartSeriesAlignFn } from '../../../customFn/chartSeriesAlignFn';
import { useMoveAndEdit } from '../../../customFn/useMoveAndEdit';
import Loading from '../../../components/Loading';
import TunedGrid from '../../../components/grid/TunedGrid';
import { Utils } from '../../../libs/utils';
import { selectRowIndexBeforeFilterAndSort } from '../../../customFn/selectRowIndexBeforeFilterAndSortFn';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import CustomTooltip from '../../../components/CustomTooltip';
import { useReceivingHistoryStore } from '../../../stores/useReceivingHistoryStore';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

interface AsnMngsTooltipValue {
  sentence: JSX.Element | string;
  outSideTagStyle?: React.CSSProperties;
}

const TooltipOnAsnMng = (props: ITooltipParams<any, AsnMngsTooltipValue>) => {
  const { value } = props;
  if (value) {
    const { sentence, outSideTagStyle } = value;
    return (
      <div
        style={{
          width: '160px',
          height: '70px',
          border: '1px solid #000', // Border
          borderRadius: '4px', // Rounded corners
          padding: '8px', // Padding
          ...outSideTagStyle,
        }}
      >
        {sentence}
      </div>
    );
  }
};

const AsnMng = () => {
  //const session = useSession();
  const nowPage = 'oms_asnMng'; // filter 저장 2025-01-21
  /** store */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();
  const queryClient = useQueryClient();
  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList, // filter 저장 2025-01-21
    s.setFilterDataList, // filter 저장 2025-01-21
    s.getFilterData, // filter 저장 2025-01-21
  ]);
  const [
    paging,
    setPaging,
    modalType,
    openModal,
    closeModal,
    updateAsns,
    selectedAsnPagingList,
    setSelectedAsnPagingList,
    usedInDetHist,
    setUsedInDetHist,
    deleteAsns,
    updateExpectAsnMngs,
    asnTargetCount,
    createAsnTarget,
    initiateAsn,
  ] = useAsnMngStore((s) => [
    s.paging,
    s.setPaging,
    s.modalType,
    s.openModal,
    s.closeModal,
    s.updateAsns,
    s.selectedAsnPagingList,
    s.setSelectedAsnPagingList,
    s.usedInDetHist,
    s.setUsedInDetHist,
    s.deleteAsns,
    s.updateExpectAsnMngs,
    s.asnTargetCount,
    s.createAsnTarget,
    s.initiateAsn,
  ]);

  const { selectCodeList } = useCodeStore(); // 드롭다운 데이터를 가져오는 함수
  const [upsertFactorySpc] = useReceivingHistoryStore((s) => [s.upsertFactorySpc]); // 생산처품목 단가DC 저장
  const [codeListAsnStatCd, setCodeListAsnStatCd] = useState<Array<CodeDropDown>>([]); // 드롭다운 정보 세팅
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any>([]); // 합계데이터 만들기
  const [graphOnOff, setGraphOnOff] = useState<boolean>(false);

  const [targetCount, setTargetCount] = useState<number>(0);
  const [asnPagingList, setAsnPagingList] = useState<AsnMngResponsePaging[]>([]);
  const [pasteStatus, setPasteStatus] = useState<{
    colId: string;
    cellRange: CellRange[];
    value: string;
  }>({
    colId: '',
    value: '',
    cellRange: [],
  });

  /** 컬럼 헤더 */
  const [columnDefs, setColDefs] = useState<ColDef[]>([]);

  const asnMngGridRef = useRef<AgGridReact>(null);
  const { moveAndEdit } = useMoveAndEdit(asnMngGridRef);

  /** 필터 */
  const [filters, onChangeFilters, onFiltersReset] = useFilters(
    getFilterData(filterDataList, nowPage) || {
      // filter 저장 2025-01-21
      searchCompNm: '',
      searchProdNm: '',
      startDate: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    },
  );

  /** 검색 */
  const search = async () => {
    await onSearch();
  };
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    await fetchAsnList();
  };

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    // 필터 초기화
    onFiltersReset();
    asnTargetCount().then((response) => {
      if (response.status === 200) {
        if (response.data.body) {
          setTargetCount(Number(response.data.body));
        }
      }
    });
  };

  useEffect(() => {
    if (codeListAsnStatCd.length === 0) {
      const getCodeList = () => {
        selectCodeList(CODE.asnStatCd).then((r) => setCodeListAsnStatCd(r || []));
      }; // 코드 상위 값으로 드롭다운 데이터를 가져옴

      getCodeList();
    }

    asnTargetCount().then((response) => {
      if (response.status === 200) {
        if (response.data.body) {
          setTargetCount(Number(response.data.body));
        }
      }
    });
  }, []);

  /** asn 페이징 목록 조회, 거래 정보 수정 시 OrderPaymentPop 에서 키 값을 통한 캐시 무효화 동작 수행 */
  const {
    data: asnData,
    isLoading: isPagingLoading,
    isSuccess: isPagingSuccess,
    refetch: fetchAsnList,
  } = useQuery(
    ['/asnMng/paging'],
    () => {
      const updatedFilters = {
        ...filters,
      };
      const params = {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...updatedFilters,
      };
      return authApi.get('/asnMng/paging', { params });
    },
    {
      enabled: true,
      refetchOnMount: true,
    },
  );

  useEffect(() => {
    if (isPagingSuccess) {
      const { resultCode, body, resultMessage } = asnData.data;
      console.log('asn===>', body);
      if (resultCode === 200) {
        if (body.rows) {
          setAsnPagingList(body.rows || []);
        } else {
          setAsnPagingList([]);
        }
        setPaging(body?.paging);
      } else {
        toastError(resultMessage);
      }
      setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
    }
  }, [asnData, isPagingSuccess, setPaging]);

  useEffect(() => {
    if (selectedAsnPagingList.length == 0) {
      // 본 전역상태를 사용하는 팝업 등에서 메인 그리드 데이터를 refetch 해야 할 경우 selectedAsnPagingList 배열을 비움으로서 refetch 가능
      fetchAsnList();
    }
  }, [selectedAsnPagingList.length]);

  useEffect(() => {
    if (asnPagingList.length > 0) {
      const mainFactoryList: string[] = [];
      const prodList: string[] = [];
      const isDistinct = (List: any[], value?: string) => {
        //console.log(List);
        if (List.length != 0) {
          for (let i = 0; i < List.length; i++) {
            if (List[i] == value) {
              return;
            }
          }
          List[List.length] = value;
        } else {
          /** 최초에는 무조건 고유함 */
          List[List.length] = value;
        }
      };

      const {
        prodCnt,
        mainFactoryCnt, // 메인생산처
        sumOfGenCnt, // 발주수량
        //sumOfNowCnt,
        //sumOfPlusMinusCnt,
        //sumOfNeedCnt,
        sumOfAsnAmt, // 발주금액
        sumOfNowCnt, // 현재고
        sumOfMisongCnt, // 미송
        sumOfMichulCnt, // 미출
        //sumOfObtainCnt,
        sumOfAsnIngCnt, // 발주중
        sumOfRecentSellCnt, // 최근 판매량
        sumOfNowSampleCnt, // 샘플잔량
        //sumOfOriginAmt,
        //sumOfSellAmt,
        //sumOfTotAmt,
      } = (asnPagingList as any).reduce(
        (
          acc: {
            prodCnt: number;
            mainFactoryCnt: number;
            sumOfGenCnt: number;
            //sumOfPlusMinusCnt: number;
            //sumOfNeedCnt: number;
            sumOfAsnAmt: number;
            sumOfNowCnt: number;
            sumOfMisongCnt: number;
            sumOfMichulCnt: number;
            //sumOfObtainCnt: number;
            sumOfAsnIngCnt: number;
            sumOfRecentSellCnt: number;
            sumOfNowSampleCnt: number;
            //sumOfOriginAmt: number;
            //sumOfSellAmt: number;
            //sumOfTotAmt: number;
          },
          data: AsnMngResponsePaging,
        ) => {
          isDistinct(mainFactoryList, data.mainFactoryNm);
          isDistinct(prodList, data.prodNm);
          return {
            prodCnt: prodList.length,
            mainFactoryCnt: mainFactoryList.length,
            sumOfGenCnt: acc.sumOfGenCnt + (data.genCnt ? data.genCnt : 0),
            //sumOfPlusMinusCnt: acc.sumOfPlusMinusCnt + (data.plusMinusCnt ? data.plusMinusCnt : 0),
            //sumOfNeedCnt: acc.sumOfNeedCnt + (data.needCnt ? data.needCnt : 0),
            sumOfAsnAmt: acc.sumOfAsnAmt + (data.asnAmt ? data.asnAmt : 0),
            sumOfNowCnt: acc.sumOfNowCnt + (data.nowCnt ? data.nowCnt : 0),
            sumOfMisongCnt: acc.sumOfMisongCnt + (data.misongCnt ? data.misongCnt : 0),
            sumOfMichulCnt: acc.sumOfMichulCnt + (data.michulCnt ? data.michulCnt : 0),
            //sumOfObtainCnt: acc.sumOfObtainCnt + (data.obtainCnt ? data.obtainCnt : 0),
            sumOfAsnIngCnt: acc.sumOfAsnIngCnt + (data.asnIngCnt ? data.asnIngCnt : 0),
            sumOfRecentSellCnt: acc.sumOfRecentSellCnt + (data.recentSellCnt ? data.recentSellCnt : 0),
            sumOfNowSampleCnt: acc.sumOfNowSampleCnt + (data.nowSampleCnt ? data.nowSampleCnt : 0),
            //sumOfOriginAmt: acc.sumOfOriginAmt + (data.originAmt ? data.originAmt : 0),
            //sumOfSellAmt: acc.sumOfSellAmt + (data.sellAmt ? data.sellAmt : 0),
            //sumOfTotAmt: acc.sumOfTotAmt + (data.totAmt ? data.totAmt : 0),
          };
        },
        {
          prodCnt: 0,
          mainFactoryCnt: 0,
          sumOfGenCnt: 0,
          //sumOfPlusMinusCnt: 0,
          //sumOfNeedCnt: 0,
          sumOfAsnAmt: 0,
          sumOfNowCnt: 0,
          sumOfMisongCnt: 0,
          sumOfMichulCnt: 0,
          //sumOfObtainCnt: 0,
          sumOfAsnIngCnt: 0,
          sumOfRecentSellCnt: 0,
          sumOfNowSampleCnt: 0,
        }, // 초기값 설정
      );
      setPinnedBottomRowData([
        {
          prodNm: prodCnt,
          mainFactoryNm: mainFactoryCnt,
          genCnt: sumOfGenCnt,
          asnAmt: sumOfAsnAmt,
          nowCnt: sumOfNowCnt,
          misongCnt: sumOfMisongCnt,
          michulCnt: sumOfMichulCnt,
          asnIngCnt: sumOfAsnIngCnt,
          recentSellCnt: sumOfRecentSellCnt,
          nowSampleCnt: sumOfNowSampleCnt,
        },
      ]);
    } else {
      setPinnedBottomRowData([
        {
          prodNm: 0,
          mainFactoryNm: 0,
          genCnt: 0,
          asnAmt: 0,
          nowCnt: 0,
          misongCnt: 0,
          michulCnt: 0,
          asnIngCnt: 0,
          recentSellCnt: 0,
          nowSampleCnt: 0,
        },
      ]);
    }
    setTimeout(() => {
      asnMngGridRef.current?.api.ensureIndexVisible(asnPagingList.length - 1, 'bottom');
      asnMngGridRef.current?.api.setFocusedCell(asnPagingList.length - 1, 'genCnt');
    }, 100);
  }, [asnPagingList]);

  useEffect(() => {
    setColDefs([
      {
        headerName: '',
        headerCheckboxSelection: true,
        filter: false,
        sortable: false,
        maxWidth: 40,
        minWidth: 40,
        suppressHeaderMenuButton: true,
        checkboxSelection: true,
        cellStyle: { textAlign: 'center' },
        //hide: true,
        colSpan: (params) => (params.node?.rowPinned ? 2 : 1),
        valueFormatter: (params) => {
          // 하단 고정 row 인 경우
          if (params.node?.rowPinned == 'bottom') {
            return '소계';
          } else {
            return '';
          }
        },
      },
      {
        field: 'no',
        headerName: 'No.',
        maxWidth: 40,
        minWidth: 40,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodNm',
        headerName: '상품명',
        minWidth: 160,
        maxWidth: 160,
        suppressHeaderMenuButton: true,
        cellStyle: (params) => {
          if (params.node.rowPinned === 'bottom') {
            return GridSetting.CellStyle.CENTER;
          } else {
            return GridSetting.CellStyle.LEFT;
          }
        },
      },
      {
        field: 'skuColor',
        headerName: '컬러',
        maxWidth: 70,
        minWidth: 70,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuSize',
        headerName: '사이즈',
        maxWidth: 70,
        minWidth: 70,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'mainFactoryNm',
        headerName: '생산처',
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'asnDcAmt' /* 공임비 툴팁정보 제공을 위한 히든컬럼 */,
        hide: true,
      },
      {
        field: 'gagongAmt',
        headerName: '공임비',
        maxWidth: 70,
        minWidth: 70,
        onCellValueChanged: (params) => {
          if (!isNaN(params.newValue)) {
            params.node?.setDataValue('asnDcAmt', params.data.skuMainGagongAmt - params.newValue);
            if (params.newValue !== params.oldValue) {
              openModal('MOD_FACTORY_SPC');
            }
          }
        },
        cellStyle: (params) => {
          console.log('비교', params.data.gagongAmt, params.data.skuMainGagongAmt);
          if (params.data && params.data.gagongAmt > params.data.skuMainGagongAmt) {
            return { ...GridSetting.CellStyle.RIGHT, color: '#344cfd', fontWeight: 500 };
          } else if (params.data && params.data.gagongAmt < params.data.skuMainGagongAmt) {
            return { ...GridSetting.CellStyle.RIGHT, color: '#d50202', fontWeight: 500 };
          }
          return GridSetting.CellStyle.RIGHT;
        },
        tooltipComponent: CustomTooltip,
        tooltipValueGetter: (params) => {
          const skuMainGagongAmt = params.data.skuMainGagongAmt ? Utils.setComma(params.data.skuMainGagongAmt) : 0;
          const asnDcAmt = params.data.asnDcAmt ? Utils.setComma(params.data.asnDcAmt) : 0;
          return `공임비 ${skuMainGagongAmt}원에서 단가DC ${asnDcAmt}원 적용되었어요`;
        },
        suppressHeaderMenuButton: true,
        editable: true,
        cellClass: (params) => {
          return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
        },
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'genCnt',
        headerName: '발주량',
        filter: true,
        maxWidth: 70,
        minWidth: 70,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        editable: true,
        cellEditor: 'agTextCellEditor', // 숫자로 하면  ArrowUp ArrowDown 시 숫자가 증감된다.
        cellClass: (params) => {
          return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
        },
      },
      {
        field: 'minAsnCnt',
        headerName: 'MOQ',
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'repairedYn',
        headerName: '수선분',
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        hide: true,
        valueFormatter: (params) => {
          if (params.data.asnType == '9') {
            // 수선분발주
            return 'Y';
          } else {
            return 'N';
          }
        },
        suppressHeaderMenuButton: true,
      },
      {
        field: 'asnAmt',
        headerName: '발주금액',
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'nowCnt',
        headerName: '현재고',
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'misongCnt',
        headerName: '미송',
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'michulCnt',
        headerName: '미출',
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'nowSampleCnt',
        headerName: '샘플잔량',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'recentSellCnt',
        headerName: '주간판매량',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'asnIngCnt',
        headerName: '입하예정',
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        /*tooltipValueGetter: (p: ITooltipParams): AsnMngsTooltipValue | undefined => {
          // todo dcAmt 가 0이 아닌 데이터가 존재할 때 온전한 테스트가 가능
          if (p.data.asnIngCnt && p.data.asnIngCnt != 0) {
            return {
              outSideTagStyle: { backgroundColor: '#f8a6a6' },
              sentence: (
                <div style={{ color: 'blue' }}>
                  <span style={{ fontWeight: 'bolder', fontSize: '16px' }}>공임비 {p.data.gagongAmt || 0}원에서</span>
                  <br />
                  <span>
                    <strong style={{ fontSize: '18px' }}> 단가 DC {p.data.dcAmt || 0}원</strong>
                  </span>
                  <br />
                  <span style={{ fontWeight: 'bolder', fontSize: '16px' }}>적용 되었어요.</span>
                </div>
              ),
            };
          }
        },*/
      },
      {
        field: 'latestWorkYmd',
        headerName: '최근발주일',
        minWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
    ]);
  }, [codeListAsnStatCd]);

  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params.node.rowPinned === 'bottom') {
      // 합계 행 스타일링
      rtnValue = rtnValue + 'ag-grid-pinned-row';
    }
    return rtnValue;
  }, []);

  useEffect(() => {
    if (modalType.type == 'ADD') {
      fetchAsnList();
    }
  }, [modalType.active]);

  const handleGraphArea = () => {
    setGraphOnOff(!graphOnOff);
  };

  const onCellValueChangedCallback = (event: CellValueChangedEvent<any>) => {
    if (event.column.getColId() == 'genCnt') {
      const pagingList = asnPagingList;
      let sumOfGenCnt = 0;
      let sumOfAsnAmt = 0;
      if (event.value != null) {
        if (isNumber(Number(event.value))) {
          const rowIndexBeforeFilterAndSort = selectRowIndexBeforeFilterAndSort(event.data, pagingList, event.column.getColId());
          if (rowIndexBeforeFilterAndSort != null) {
            console.log('rowIndexBeforeFilterAndSort==>', rowIndexBeforeFilterAndSort);
            console.log('pagingList==>', pagingList);
            console.log('event.value==>', event.value);
            pagingList[rowIndexBeforeFilterAndSort].genCnt = event.value;
            pagingList[rowIndexBeforeFilterAndSort].asnAmt =
              ((pagingList[rowIndexBeforeFilterAndSort].gagongAmt || 0) - (pagingList[rowIndexBeforeFilterAndSort].asnDcAmt || 0)) * Number(event.value); // 공임(임가공비 - DC) * 발주수량
            setAsnPagingList(pagingList);
            for (let i = 0; i < pagingList.length; i++) {
              sumOfGenCnt += Number(pagingList[i].genCnt) || 0;
              sumOfAsnAmt += Number(pagingList[i].asnAmt) || 0;
            }
            /** 발주수량 수정시 이에 맞추어 요약 행의 데이터도 수정할 필요 */
            setPinnedBottomRowData([
              {
                ...pinnedBottomRowData[0],
                genCnt: sumOfGenCnt,
                asnAmt: sumOfAsnAmt,
              },
            ]);

            setTimeout(() => {
              event.node.setSelected(true);
            }, 0);

            updateExpectAsnMngs({ id: event.data.asnId, genCnt: Number(event.value) }).then(() => console.log('등록완료===>'));
          } else {
            console.error('필터 및 정렬 이전 인덱스를 찾을 수 없음');
          }
        } else {
          if (event.newValue !== 'R' && event.newValue !== 'r' && event.newValue !== 'ㄲ') {
            toastError('숫자 이외의 값[' + event.newValue + ']은 입력이 제한됩니다.');
          }
          event.node.setDataValue('genCnt', event.oldValue);
        }
      }
    }
  };

  const { data: skuExpectInfoData, isSuccess: isSkuExpectInfoDataSuccess } = useQuery(
    ['/asnMng/skuExpectInfo', usedInDetHist.skuId, filters.startDate, filters.endDate],
    () => {
      return authApi.get('/asnMng/skuExpectInfo', {
        params: {
          skuId: usedInDetHist.skuId,
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      });
    },
    {
      enabled: true,
      refetchOnMount: false,
    },
  );

  useEffect(() => {
    /** 수요예측 chart data */
    if (isSkuExpectInfoDataSuccess) {
      const { resultCode, body, resultMessage } = skuExpectInfoData.data;
      console.log('body.xAxisData===>', body);
      if (resultCode === 200 && body.series) {
        const response = body as AsnMngResponseSkuExpectInfo;
        setOptions((prevOption: any) => {
          // 타입 인식 문제로 다시 한번 가드를 작성
          const suitedParams = ['판매', '업체(판매)', '미출', '업체(미출)', '미송', '업체(미송)', '발주수량', '업체(발주)'];
          const respondedSeries = chartSeriesAlignFn(
            response.series as AsnMngResponseSerieDataInExpected[],
            suitedParams,
          ) as AsnMngResponseSerieDataInExpected[]; // 본 함수에 타입이 명시되지 않은 관계로 반환 타입 단언
          console.log(respondedSeries);
          if (response.series) {
            return {
              ...prevOption,
              legend: {
                ...prevOption.legend,
                data: ['판매', '업체수', '미출', '미송', '발주수량'],
              },

              xAxis: [
                {
                  ...prevOption.xAxis[0],
                  data: response.xaxisData,
                },
              ],
              tooltip: {
                ...prevOption.tooltip,
                formatter: (params: any) => {
                  if (params[0] && respondedSeries.length == 8) {
                    const paramZero = params[0];
                    return (
                      paramZero.name +
                      '<br/>' +
                      '<div>' +
                      '판매 : ' +
                      (respondedSeries[0].data as number[])[paramZero.dataIndex] +
                      ' 장' +
                      '</div>' +
                      '<div>' +
                      '업체: ' +
                      (respondedSeries[1].data as number[])[paramZero.dataIndex] +
                      ' 개' +
                      '</div>' +
                      '<br />' +
                      '<div>' +
                      '미출 : ' +
                      (respondedSeries[2].data as number[])[paramZero.dataIndex] +
                      ' 장' +
                      '</div>' +
                      '<div>' +
                      '업체: ' +
                      (respondedSeries[3].data as number[])[paramZero.dataIndex] +
                      ' 개' +
                      '</div>' +
                      '<br />' +
                      '<div>' +
                      '미송 : ' +
                      (respondedSeries[4].data as number[])[paramZero.dataIndex] +
                      ' 장' +
                      '</div>' +
                      '<div>' +
                      '업체: ' +
                      (respondedSeries[5].data as number[])[paramZero.dataIndex] +
                      ' 개' +
                      '</div>' +
                      '<br />' +
                      '<div>' +
                      '발주수량 : ' +
                      (respondedSeries[6].data as number[])[paramZero.dataIndex] +
                      ' 장' +
                      '</div>' +
                      '<div>' +
                      '업체: ' +
                      (respondedSeries[7].data as number[])[paramZero.dataIndex] +
                      ' 개' +
                      '</div>' +
                      '<br />'
                    );
                  }
                },
              },
              series:
                respondedSeries.length == 8
                  ? [
                      {
                        name: '판매',
                        type: 'bar',
                        emphasis: null,
                        data: respondedSeries[0].data,
                      },
                      {
                        /** 판매와 연관된 회사 건수(업체(판매)) */
                        name: '업체수',
                        type: 'bar',
                        emphasis: null,
                        data: respondedSeries[1].data,
                      },
                      {
                        name: '미출',
                        type: 'bar',
                        emphasis: null,
                        data: respondedSeries[2].data,
                      },
                      {
                        name: '미송',
                        type: 'bar',
                        emphasis: null,
                        data: respondedSeries[4].data,
                      },
                      {
                        name: '발주수량',
                        type: 'bar',
                        emphasis: null,
                        data: respondedSeries[6].data,
                      },
                    ]
                  : prevOption.series,
            };
          }
        });
      } else {
        toastError(resultMessage);
      }
    }
  }, [skuExpectInfoData]);

  type BarLabelOption = NonNullable<echarts.BarSeriesOption['label']>;

  const labelOption: BarLabelOption = {
    show: true,
    position: 'insideBottom',
    distance: 15,
    align: 'left',
    verticalAlign: 'middle',
    //    rotate: { min: 90, max: 90 },
    formatter: '{c}  {name|{a}}',
    fontSize: 16,
    rich: {
      name: {},
    },
  };

  const [options, setOptions] = useState<any>({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: [],
    },
    xAxis: [
      {
        type: 'category',
        axisTick: { show: false },
        data: [],
      },
    ],
    yAxis: [
      {
        type: 'value',
      },
    ],
    series: [],
  });

  /*const handleSwitchChange = (checked: boolean) => {
    /** true: 예정, false: 확정*/
  /*if (checked) {
      onChangeFilters('asnStatCd', '1');
    } else {
      onChangeFilters('asnStatCd', '2');
    }
    setIsChecked(checked);
  };*/

  /** 붙여넣기 이벤트 발생시 실행되는 콜백함수 */
  const processCellFromClipboard = useCallback((params: ProcessCellForExportParams) => {
    /** 복사 상태를 갱신하기 이전에 붙여넣을 값이 숫자인지, cell 영역이 정확한지 보증할 수 있어야 한다. */
    if (pasteStatus.value != params.value) {
      setPasteStatus((prev) => {
        if (prev.value != params.value) {
          prev.value = params.value;
        }
        if (params.api.getCellRanges()?.length == 1 && params.api.getCellRanges() != prev.cellRange) {
          prev.cellRange = params.api.getCellRanges() || [];
        }
        prev.colId = params.column.getColId();
        return { ...prev };
      });
    }
    if (params.column.getColId() == 'genCnt') {
      /** 데이터 타입이 숫자인 경우 */
      if (isNumber(Number(params.value))) {
        return Number(params.value);
      } else {
        return null;
      }
    } else {
      return params.value;
    }
  }, []);

  useEffect(() => {
    /** 붙여넣기 작업 등으로 인하여 pasteStatus 가 바뀌는 경우 실행됨 */
    if (pasteStatus.cellRange.length == 1 && pasteStatus.cellRange[0].startRow && pasteStatus.cellRange[0].endRow) {
      const startIndex = pasteStatus.cellRange[0].startRow.rowIndex;
      const endIndex = pasteStatus.cellRange[0].endRow.rowIndex;
      if (pasteStatus.colId == 'genCnt' && isNumber(Number(pasteStatus.value))) {
        /** pasteStatus 는 genCnt 한정으로만 사용되지 않으므로 value 값이 숫자인지 검증하여야 한다. */
        const pagingList = asnPagingList;
        for (let i = startIndex; i < endIndex; i++) {
          pagingList[i].genCnt = Number(pasteStatus.value);
        }
        asnMngGridRef.current?.api.forEachNode((rowNode, index) => {
          if (index >= startIndex && index <= endIndex) {
            rowNode.setSelected(true);
          }
        });

        setAsnPagingList(pagingList);
      }
    }
  }, [pasteStatus]);

  /** 생산처 품목 단가DC 업데이트  */
  const { mutate: upsertFactorySpcMutate } = useMutation(upsertFactorySpc, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        closeModal('MOD_FACTORY_SPC');
        // fetchAsnList();
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error(err);
      toastError('등록 중 오류가 발생하였습니다.');
    },
  });

  /** 단가DC 일괄적용 저장 */
  const handleDanDcUpdateConfirm = async () => {
    const gridApi = asnMngGridRef.current?.api;
    const focusedCell = gridApi?.getFocusedCell();
    const rowNode = gridApi?.getDisplayedRowAtIndex(focusedCell?.rowIndex as number);

    // console.log('rowNode', rowNode);
    if (rowNode) {
      const rowData = rowNode.data;
      // 단가DC가 변경된 것만 저장한다.
      if (!rowData.factoryId || !rowData.prodId || isNaN(rowData.asnDcAmt)) {
        toastError('저장할 내용이 없어 다시 확인후 이용해주세요');
      }

      const params: ReceivingHistoryRequestFactorySpc = {
        factoryId: rowData.factoryId,
        prodId: rowData.prodId,
        updDcAmt: rowData.asnDcAmt, // 단가DC
      };
      console.log('단가DC저장 params >>', params);
      upsertFactorySpcMutate(params);
    } else {
      toastError('선택된 항목이 없어 단가DC 저장을 못했어요.');
    }
  };

  /** 발주등록 */
  const handleAsnConfirm = () => {
    asnMngGridRef.current?.api.stopEditing(false);
    const selectedPagingList = asnPagingList.filter((item) => item.genCnt && isNumber(Number(item.genCnt)));

    if (selectedPagingList.length === 0) {
      toastError('하나 이상의 발주 수량을 입력 후 시도하십시오.');
      return;
    }

    setSelectedAsnPagingList(selectedPagingList);
    openModal('CONFIRMATION_CONFIRM');

    // 확정 데이터 리스트 생성
    const confirmedElements = selectedPagingList
      .filter((item) => item.genCnt !== 0)
      .map((item) => ({
        id: item.asnId as number,
        genCnt: item.genCnt as number,
        updGagongAmt: item.gagongAmt,
        asnStatCd: '2',
      }));
    console.log('confirmedElements:', confirmedElements);
    if (confirmedElements.length === 0) return;

    updateAsns(confirmedElements).then(async (result) => {
      const { resultCode, resultMessage } = result.data;
      if (resultCode === 200) {
        toastSuccess('해당하는 수량의 발주가 확정되었습니다.');
        fetchAsnList();
        closeModal('CONFIRMATION_CONFIRM');
        setSelectedAsnPagingList([]);
      } else {
        toastError(resultMessage);
      }
    });
  };

  /** 발주등록 */
  const handleAsnMisongMichulConfirm = () => {
    if (targetCount === 0) {
      toastError('현재는 등록할 미송 미출이 없습니다.');
      return;
    } else {
      createAsnTarget().then((response) => {
        if (response.status == 200) {
          console.log('reponse ==>', response.data.body);
          toastSuccess('등록되었습니다.');
          setTargetCount(0);
          fetchAsnList(); // 재조회
        } else {
          toastError('등록에 실패하였습니다.');
        }
      });
    }
  };

  const handleAsnInitiateConfirm = () => {
    initiateAsn({ asnStatCd: '1' }).then((response) => {
      if (response.status == 200) {
        console.log('reponse ==>', response.data.body);
        toastSuccess('초기화 되었습니다.');
        fetchAsnList(); // 재조회
      } else {
        toastError('등록에 실패하였습니다.');
      }
    });
  };

  useEffect(() => {
    fetchAsnList;
  }, [filters.searchProdNm]);

  return (
    <>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} search={search} filters={filters} reset={reset} />
      <Search className="type_2">
        <CustomNewDatePicker
          title={'일자'}
          type={'range'}
          defaultType={'type'}
          startName={'startDate'}
          endName={'endDate'}
          onChange={(name, value) => {
            onChangeFilters(name, value);
          }}
          value={[filters.startDate, filters.endDate]}
        />
        <Search.Input
          title={'생산처'}
          name={'searchCompNm'}
          placeholder={'생산처 입력'}
          value={filters.searchCompNm}
          onChange={onChangeFilters}
          onEnter={() => {
            setTimeout(() => {
              fetchAsnList();
            }, 100);
          }}
        />
        <Search.Input
          title={'상품명'}
          name={'searchProdNm'}
          placeholder={'상품명 입력'}
          value={filters.searchProdNm}
          onChange={onChangeFilters}
          onEnter={() => {
            setTimeout(() => {
              fetchAsnList();
            }, 100);
          }}
          filters={filters}
        />
      </Search>
      <Tooltip id="my-tooltip" />
      {/*<h4 className="smallTitle line between">
        <div className="left">
          {isChecked ? '발주 예정목록' : '발주 확정목록'}
          <div className="ml10">
            <Space>
              <Switch checkedChildren="예정" unCheckedChildren="확정" onChange={handleSwitchChange} defaultChecked={true} />
            </Space>
          </div>
        </div>
      </h4>*/}
      <div className={`graphArea ${graphOnOff ? 'on' : ''}`}>
        <Table>
          <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search} isPaging={false} />
          <TunedGrid
            onGridReady={onGridReady}
            loading={isPagingLoading}
            rowData={asnPagingList}
            columnDefs={columnDefs}
            rowSelection={'multiple'}
            defaultColDef={{ ...defaultColDef, tooltipComponent: TooltipOnAsnMng }}
            paginationPageSize={paging.pageRowCount}
            onRowClicked={(e) => {
              setUsedInDetHist({
                skuNm: e.data?.skuNm,
                skuId: e.data?.skuId,
                startDate: filters.startDate,
                endDate: filters.endDate,
              });
            }}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            onCellValueChanged={onCellValueChangedCallback}
            getRowClass={getRowClass}
            ref={asnMngGridRef}
            enableRangeSelection={true}
            suppressRowClickSelection={true}
            processCellFromClipboard={processCellFromClipboard}
            pinnedBottomRowData={pinnedBottomRowData}
            className={'asnMng check'}
            onCellKeyDown={(event) => {
              const eventTriggeredRowIndex = event.rowIndex || 0;
              const api = event.api;
              const keyboardEvent = event.event as KeyboardEvent;
              const nowColId = api.getEditingCells().length > 0 ? api.getEditingCells()[0].colId : '';
              if (api && nowColId && nowColId == 'genCnt' && keyboardEvent.key === 'ArrowDown') {
                api.stopEditing(false);
                moveAndEdit(
                  eventTriggeredRowIndex == asnPagingList.length - 1 ? eventTriggeredRowIndex : eventTriggeredRowIndex + 1,
                  nowColId,
                  10,
                  false,
                  false,
                );
              } else if (api && nowColId && nowColId == 'genCnt' && keyboardEvent.key === 'ArrowUp') {
                api.stopEditing(false);
                moveAndEdit(
                  eventTriggeredRowIndex == asnPagingList.length - 1 ? eventTriggeredRowIndex : eventTriggeredRowIndex - 1,
                  nowColId,
                  10,
                  false,
                  false,
                );
              }
              event.event?.preventDefault(); // 다른 오작등을 막아보자
            }}
          />
          <div className="btnArea">
            <CustomShortcutButton
              className="btn"
              onClick={() => {
                openModal('DELETE_ASN_REQUEST');
              }}
              shortcut={COMMON_SHORTCUTS.gridUnder1}
            >
              초기화
            </CustomShortcutButton>
            <CustomShortcutButton
              className={targetCount > 0 ? 'btn on' : 'btn'}
              onClick={() => {
                openModal('ADD_MISONG_MICHUL');
              }}
              shortcut={COMMON_SHORTCUTS.gridUnder2}
            >
              미송/미출 ( {targetCount} )
            </CustomShortcutButton>
            <CustomShortcutButton
              className="btn"
              onClick={() => {
                openModal('ADD');
              }}
              shortcut={COMMON_SHORTCUTS.gridUnder3}
            >
              상품추가
            </CustomShortcutButton>
            <CustomShortcutButton
              className="btn"
              shortcut={COMMON_SHORTCUTS.gridUnder4}
              onClick={() => {
                openModal('CONFIRMATION_CONFIRM');
              }}
            >
              발주등록
            </CustomShortcutButton>
          </div>
        </Table>

        <h4 className="smallTitle between mt10">
          <div className="left">
            <strong>수요그래프</strong>
            <span className="graphTitle">{usedInDetHist.skuNm || ''}</span>
            <button onClick={handleGraphArea}>닫기열기</button>
          </div>
          <div className="right">
            {graphOnOff ? (
              <>
                {/*<CustomTwoDatePicker*/}
                {/*  startName={'startDate'}*/}
                {/*  endName={'endDate'}*/}
                {/*  onChange={(name, value) => {*/}
                {/*    onChangeFilters(name as 'startDate' | 'endDate', value.toString());*/}
                {/*    console.log('CustomTwoDatePicker==>[' + name + ']', value);*/}
                {/*  }}*/}
                {/*  value={[filters.startDate, filters.endDate]}*/}
                {/*/>*/}
                <CustomNewDatePicker
                  title={'일자'}
                  type={'range'}
                  defaultType={'type'}
                  startName={'startDate'}
                  endName={'endDate'}
                  onChange={(name, value) => {
                    onChangeFilters(name, value);
                  }}
                  value={[filters.startDate, filters.endDate]}
                />
              </>
            ) : (
              ''
            )}
          </div>
        </h4>
        <div className="graphBox asnMng mt5">
          <ECharts option={options} opts={{ renderer: 'svg' }} />
          <div className="btnArea">
            <button
              onClick={() => {
                if (usedInDetHist.skuId != undefined) {
                  openModal('ORDERHIST_DET');
                } else {
                  toastError('상단 목록에서 하나의 발주내역을 특정한 후 시도하십시요.');
                }
              }}
            >
              주문내역 상세
            </button>
            <button
              onClick={() => {
                if (usedInDetHist.skuId != undefined) {
                  openModal('REORDER_DET');
                } else {
                  toastError('상단 목록에서 하나의 발주내역을 특정한 후 시도하십시요.');
                }
              }}
            >
              리오더내역 상세
            </button>
            <button
              onClick={() => {
                if (usedInDetHist.skuId != undefined) {
                  openModal('MISONG_HIST');
                } else {
                  toastError('상단 목록에서 하나의 발주내역을 특정한 후 시도하십시요.');
                }
              }}
            >
              미송내역 상세
            </button>
            <button
              onClick={() => {
                if (usedInDetHist.skuId != undefined) {
                  openModal('MICHUL_DET');
                } else {
                  toastError('상단 목록에서 하나의 발주내역을 특정한 후 시도하십시요.');
                }
              }}
            >
              미출내역 상세
            </button>
          </div>
        </div>
      </div>
      {isPagingLoading && <Loading />}
      <ConfirmModal
        title={
          '<div class="confirmMsg"><span class="small">선택된 발주 목록들을 </span><span class="big"><strong>삭제</strong>&nbsp;처리하시겠어요?</span></div>'
        }
        open={modalType.type === 'DEL_CONFIRMED' && modalType.active}
        onConfirm={() => {
          const selectedNodes = asnMngGridRef.current?.api.getSelectedNodes();
          const targetData: AsnMngRequestDelete[] = [];
          if (selectedNodes) {
            for (let i = 0; i < selectedNodes.length; i++) {
              targetData[i] = {
                id: selectedNodes[i].data.asnId,
              };
            }
          }
          deleteAsns(targetData).then((result) => {
            const { resultCode, body, resultMessage } = result.data;
            if (resultCode == 200) {
              toastSuccess('삭제되었습니다.');
              fetchAsnList();
            } else {
              toastError(resultMessage);
            }
          });
        }}
        onClose={() => {
          closeModal('DEL_CONFIRMED');
        }}
        /*        onKeyDown={(event) => {
          if (event.key == 'Enter') {
            const selectedNodes = asnMngGridRef.current?.api.getSelectedNodes();
            const targetData: AsnMngRequestDelete[] = [];
            if (selectedNodes) {
              for (let i = 0; i < selectedNodes.length; i++) {
                targetData[i] = {
                  id: selectedNodes[i].data.asnId,
                };
              }
            }
            deleteAsns(targetData).then((result) => {
              const { resultCode, body, resultMessage } = result.data;
              if (resultCode == 200) {
                toastSuccess('삭제되었습니다.');
                fetchAsnList();
              } else {
                toastError(resultMessage);
              }
            });
          }
        }}*/
      />
      <ConfirmModal
        title={
          '<div class="confirmMsg"><span class="small">선택된 발주 목록의 입하를</span><span class="big"><strong>취소</strong>&nbsp;처리하시겠어요?</span></div>'
        }
        open={modalType.type === 'CANCEL_CONFIRMED' && modalType.active}
        onConfirm={() => {
          const selectedNodes = asnMngGridRef.current?.api.getSelectedNodes();
          const targetData: AsnMngRequestUpdate[] = [];
          if (selectedNodes) {
            for (let i = 0; i < selectedNodes.length; i++) {
              targetData[i] = {
                id: selectedNodes[i].data.asnId,
                asnStatCd: '2', // 발주확정(10370)(공장출고 -> 발주확정)
              };
            }
          }
          updateAsns(targetData).then((result) => {
            const { resultCode, body, resultMessage } = result.data;
            if (resultCode == 200) {
              toastSuccess('입하가 취소되었습니다.');
              fetchAsnList();
            } else {
              toastError(resultMessage);
            }
          });
        }}
        onClose={() => {
          closeModal('CANCEL_CONFIRMED');
        }}
        /*        onKeyDown={(event) => {
          if (event.key == 'Enter') {
            const selectedNodes = asnMngGridRef.current?.api.getSelectedNodes();
            const targetData: AsnMngRequestUpdate[] = [];
            if (selectedNodes) {
              for (let i = 0; i < selectedNodes.length; i++) {
                targetData[i] = {
                  id: selectedNodes[i].data.asnId,
                  asnStatCd: '2', // 발주확정(10370)
                };
              }
            }
            updateAsns(targetData).then((result) => {
              const { resultCode, body, resultMessage } = result.data;
              if (resultCode == 200) {
                toastSuccess('입하가 취소되었습니다.');
                fetchAsnList();
              } else {
                toastError(resultMessage);
              }
            });
          }
        }}*/
      />
      {/*<ConfirmModal
        title={'선택된 데이터를 출고등록 하시겠습니까?'}
        open={modalType.type === 'RETRIEVAL' && modalType.active}
        onConfirm={() => {
          const selectedData = asnMngGridRef.current?.api.getSelectedNodes()[0].data as AsnMngResponsePaging;
          updateAsns([
            {
              id: selectedData.asnId,
              asnCnt: selectedData.asnCnt == undefined || selectedData.asnCnt == 0 ? selectedData.genCnt : selectedData.asnCnt, // 0이거나 존재하지 않을 시 genCnt(발주수량)의 값으로 맞춤
              asnStatCd: '3', // 입하예정(10370)
            },
          ]).then((result) => {
            const { resultCode, body, resultMessage } = result.data;
            if (resultCode == 200) {
              toastSuccess('출고등록에 성공하였습니다.');
              fetchAsnList();
              closeModal('RETRIEVAL');
            } else {
              toastError(resultMessage);
            }
          });
        }}
        onClose={() => {
          closeModal('RETRIEVAL');
        }}
      />*/}
      <ConfirmModal
        title={
          '<div class="confirmMsg"><span class="small">선택된 상품을</span><span class="big"><strong>발주확정</strong>&nbsp;하시겠어요?</span><span class="notice">확정시 리스트는 ‘재고장’ 으로 이동됩니다</span></div>'
        }
        open={modalType.type === 'CONFIRMATION_CONFIRM' && modalType.active}
        onConfirm={handleAsnConfirm}
        onClose={() => {
          closeModal('CONFIRMATION_CONFIRM');
        }}
      />
      <ConfirmModal
        title={
          '<div class="confirmMsg"><span class="small">' +
          '<strong  style= " color: #aa0303" >' +
          targetCount +
          '  </strong > ' +
          '<span class="big">&nbsp;상품을 &nbsp;불러 오시겠어요?</span></div>'
        }
        open={modalType.type === 'ADD_MISONG_MICHUL' && modalType.active}
        onConfirm={handleAsnMisongMichulConfirm}
        onClose={() => {
          closeModal('CONFIRMATION_CONFIRM');
        }}
      />
      <ConfirmModal
        title={
          '<div class="confirmMsg"><span class="small">해당 제품에 대한</span><span class="big"><strong>일괄 할인을</strong>&nbsp;적용하시겠어요?</span></div>'
        }
        open={modalType.type === 'MOD_FACTORY_SPC' && modalType.active}
        onConfirm={handleDanDcUpdateConfirm}
        onClose={() => {
          closeModal('MOD_FACTORY_SPC');
        }}
      />
      <ConfirmModal
        title={'<div class="confirmMsg"><span class="big"><strong>초기화</strong>&nbsp;하시겠습니까?</span></div>'}
        open={modalType.type === 'DELETE_ASN_REQUEST' && modalType.active}
        onConfirm={handleAsnInitiateConfirm}
        onClose={() => {
          closeModal('MOD_FACTORY_SPC');
        }}
      />
      {modalType.type === 'ADD' && modalType.active && <AsnAddPop />}
      {/*{modalType.type === 'CONFIRMATION_CONFIRM' && modalType.active && <AsnConfirmPop />} 발주등록 confirm창으로 변경 20250217 */}
      {modalType.type === 'ORDERHIST_DET' && modalType.active && <OrderHistDetPop />}
      {modalType.type === 'REORDER_DET' && modalType.active && <ReOrderDetPop />}
      {modalType.type === 'MISONG_HIST' && modalType.active && <MisongHistPop />}
      {modalType.type === 'MICHUL_DET' && modalType.active && <MichulDetPop />}
      {/*{modalType.type === 'RETRIEVAL_PARTIAL' && modalType.active && <AsnPartialRetrievalPop />}*/}
      {isPagingLoading && <Loading />}
    </>
  );
};

export default AsnMng;
