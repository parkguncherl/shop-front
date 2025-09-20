import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CellKeyDownEvent, ColDef, FullWidthCellKeyDownEvent, RowClassParams, SelectionChangedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { GridSetting } from '../../../libs/ag-grid';
import useFilters from '../../../hooks/useFilters';
import { useMisongStore } from '../../../stores/useMisongStore';
import { MisongOrderEditPop } from '../../../components/popup/orderTran/Misong/MisongOrderEditPop';
import { MisongReleaseEditPop } from '../../../components/popup/orderTran/Misong/MisongReleaseEditPop';
import { MisongProductTallyPop } from '../../../components/popup/orderTran/Misong/MisongProductTallyPop';
import { MisongCategorySetPop } from '../../../components/popup/orderTran/Misong/MisongCategorySetPop';
import { useCommonStore, useMypageStore } from '../../../stores';
import { authApi } from '../../../libs';
import { MisongPrintDetail, MisongResponseResponse, Release } from '../../../generated';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { Utils } from '../../../libs/utils';
import PartnerInfoPop from '../../../components/popup/mypage/PartnerInfoPop';
import { DropDownOption } from '../../../types/DropDownOptions';
import { useOrderStore } from '../../../stores/useOrderStore';
import { useSession } from 'next-auth/react';
import CustomTooltip from '../../../components/CustomTooltip';
import SkuListPop from '../../../components/popup/misong/SkuListPop';
import DropDownAtom from '../../../components/atom/DropDownAtom';
import TunedGrid from '../../../components/grid/TunedGrid';
import MisongProcessPop from '../../../components/popup/misong/MisongProcessPop';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useRouter } from 'next/router';
import PrintLayout from '../../../components/print/PrintLayout';
import MisongCancelPop from '../../../components/popup/misong/MisongCancelPop';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

export const defaultColDef: ColDef = {
  flex: 1,
  sortable: true,
  // filter: true,
  resizable: true,
  tooltipComponent: CustomTooltip,
};
/**
 * 미송
 */
const Misong = () => {
  const nowPage = 'oms_misong'; // filter 저장 2025-01-21
  const session = useSession();
  const router = useRouter();

  const gridRef = useRef<AgGridReact>(null);

  const [isPreView, setIsPreView] = useState<boolean>(false);
  const [selectedOrderDetId, setSelectedOrderDetId] = useState<number>(0);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any[]>([]); // 합계데이터 만들기
  const [selectedMisongPrintDetail, setSelectedMisongPrintDetail] = useState<MisongPrintDetail[]>([]);
  const [optionType, setOptionType] = useState('misong'); // 전표 옵션 체인지

  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData, selectedRetailInCommon] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList, // filter 저장 2025-01-21
    s.setFilterDataList, // filter 저장 2025-01-21
    s.getFilterData, // filter 저장 2025-01-21
    s.selectedRetail,
  ]);

  const initialFilters = {
    startDate: Utils.getStartDayBefore3Month(), // 최초 3개월 전 부터 본다.
    endDate: session.data?.user.workYmd ? session.data?.user.workYmd : dayjs().format('YYYY-MM-DD'),
    sellerId: 0,
    sellerNm: '',
    skuNm: '',
    misongStateCd: 'N',
    workYmd: session.data?.user.workYmd ? session.data?.user.workYmd : dayjs().format('YYYY-MM-DD'),
    dateType: 'E',
  };

  const [filters, onChangeFilters, onFiltersReset] = useFilters(getFilterData(filterDataList, nowPage) || initialFilters); // filter 저장 2025-01-21

  const [
    //paging,
    //setPaging,
    modalType,
    openModal,
    closeModal,
    getMisongPrintDetail,
    updateMisongOrderStatus,
    selectedMisong,
    setSelectedMisong,
    getMisongPrintSendDetail,
    getNotShippedDetail,
    treatMisongCancel,
    treatMultiMisong,
  ] = useMisongStore((s) => [
    //s.paging,
    //s.setPaging,
    s.modalType,
    s.openModal,
    s.closeModal,
    s.getMisongPrintDetail,
    s.updateMisongOrderStatus,
    s.selectedMisong,
    s.setSelectedMisong,
    s.getMisongPrintSendDetail,
    s.getNotShippedDetail,
    s.treatMisongCancel,
    s.treatMultiMisong,
  ]);

  const [modalTypeForPartner, openModalForPartner] = useMypageStore((s) => [s.modalType, s.openModal]);
  const [updateBundleYn, updateOrderDetEtc] = useOrderStore((s) => [s.updateBundleYn, s.updateOrderDetEtc]);

  const { mutate: updateBundleYnMutate } = useMutation(updateBundleYn, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('묶음여부가 변경되었습니다.');
        fetchMisongOrders();
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  const { mutate: treatMultiMisongMutate } = useMutation(treatMultiMisong, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('처리 되었습니다.');
        closeModal('CONFIRM');
        fetchMisongOrders();
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  const { mutate: updateOrderDetEtcMutate } = useMutation(updateOrderDetEtc, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('비고가 변경되었습니다.');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  const columnDefs = useMemo<ColDef<MisongResponseResponse>[]>(
    () => [
      {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        filter: false,
        sortable: false,
        maxWidth: 30,
        minWidth: 30,
        suppressHeaderMenuButton: true,
        hide: true,
      },
      {
        field: 'no',
        headerName: 'No.',
        minWidth: 36,
        maxWidth: 36,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'jobId',
        headerName: 'Job',
        minWidth: 45,
        maxWidth: 45,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        hide: true,
      },
      { field: 'id', headerName: 'ID', hide: true },
      {
        field: 'chitNo',
        headerName: '전표#',
        minWidth: 40,
        maxWidth: 40,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'workYmd',
        headerName: '미송일자',
        minWidth: 80,
        maxWidth: 80,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'deliYmd',
        headerName: '발송일자',
        minWidth: 80,
        maxWidth: 80,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'sellerNm',
        headerName: '소매처',
        minWidth: 80,
        maxWidth: 150,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.LEFT,
        filter: true,
      },
      {
        field: 'skuNm',
        headerName: '상품명',
        minWidth: 160,
        wrapText: false,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.LEFT,
        /*filter: 'agTextColumnFilter',
        filterParams: {
          defaultOption: 'contains', // 기본 필터 옵션
        }, 불필요 필터 삭제함 예솔체크 */
      },
      {
        field: 'baseAmt',
        headerName: '판매가',
        minWidth: 65,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'totAmt',
        headerName: '거래금액',
        minWidth: 65,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'misongCnt',
        headerName: '미송',
        minWidth: 35,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'sendCnt',
        headerName: '발송',
        minWidth: 35,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'majangCnt',
        headerName: '매장',
        minWidth: 35,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'remainCnt',
        headerName: '잔량',
        minWidth: 45,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        filter: true,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'nowCnt',
        headerName: '실재고',
        minWidth: 45,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'remainAmt',
        headerName: '잔량금액',
        minWidth: 65,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'sendAmt',
        headerName: '발송금액',
        minWidth: 65,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        hide: true,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'period',
        headerName: '경과일',
        minWidth: 45,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          if (params.data?.deliYmd && params.data?.workYmd && params.data?.remainCnt === 0) {
            const deliDate = new Date(params.data.deliYmd); // '2025-01-01' → Date 객체
            const workDate = new Date(params.data.workYmd); // '2025-01-01' → Date 객체
            // 2. 밀리초 단위로 차이 계산
            const diffInMilliseconds = deliDate.getTime() - workDate.getTime();
            return diffInMilliseconds / (1000 * 60 * 60 * 24); // 결과: 숫자 (예: 5, -3, 0)
          } else {
            return params.value;
          }
        },
      },
      {
        field: 'bundleYn',
        headerName: '묶음발송',
        minWidth: 60,
        suppressHeaderMenuButton: true,
        editable: (params) => {
          return params.data?.rank === 1;
        },
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values:
            [
              { key: '1', value: 'Y', label: 'Y' },
              { key: '2', value: 'N', label: 'N' },
            ].map((code: DropDownOption) => code.label) || [],
        },
        onCellValueChanged: (e) => {
          updateBundleYnMutate({ orderId: e.data.id?.toString(), bundleYn: e.data.bundleYn });
        },
        cellStyle: (params) => {
          return {
            ...GridSetting.CellStyle.CENTER, // 객체를 직접 spread
            color: params.data?.rank !== 1 ? '#e8e8e8' : 'inherit',
          };
        },
        cellClass: (params) => {
          return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
        },
      },
      {
        field: 'userNm',
        headerName: '사용자',
        minWidth: 45,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'orderDetEtc',
        headerName: '비고',
        minWidth: 80,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        editable: true,
      },
    ],
    [updateBundleYnMutate], //misongOrders?.data?.body?.rows
  );

  const [misongList, setMisongList] = useState<MisongResponseResponse[]>([]);

  const {
    data: misongOrders,
    isLoading: isMisongOrders,
    isSuccess: isPagingSuccess,
    refetch: fetchMisongOrders,
  } = useQuery({
    queryKey: ['/orderTran/misong', filters],
    queryFn: (): any =>
      authApi.get('/orderTran/misong', {
        params: {
          ...filters,
        },
      }),
  });

  useEffect(() => {
    if (isPagingSuccess) {
      const { resultCode, body, resultMessage } = misongOrders.data;
      if (resultCode === 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
        //setPaging(body.paging);
        setMisongList(body || []);
        /*setTimeout(() => {
          gridRef.current?.api.ensureIndexVisible(
            body.rows ? (body.rows.length > body.paging.pageRowCount ? body.paging.pageRowCount - 1 : body.rows.length - 1) : 0,
          );
          gridRef.current?.api.setFocusedCell(
            body.rows ? (body.rows.length > body.paging.pageRowCount ? body.paging.pageRowCount - 1 : body.rows.length - 1) : 0,
            'skuNm',
          );
        }, 0); // 하단 포커스*/
        if (body && body.length > 0) {
          const { delayCount, misongCount, sendCount, nowCount, remainCount } = body.reduce(
            (
              acc: {
                delayCount: number;
                misongCount: number;
                sendCount: number;
                nowCount: number;
                remainCount: number;
              },
              data: MisongResponseResponse,
            ) => {
              return {
                delayCount: acc.delayCount + (data.delayCnt ? data.delayCnt : 0),
                misongCount: acc.misongCount + (data.misongCnt ? data.misongCnt : 0),
                sendCount: acc.sendCount + (data.sendCnt ? data.sendCnt : 0),
                nowCount: acc.nowCount + (data.nowCnt ? data.nowCnt : 0),
                remainCount: acc.remainCount + (data.remainCnt ? data.remainCnt : 0),
              };
            },
            {
              delayCount: 0,
              misongCount: 0,
              sendCount: 0,
              nowCount: 0,
              remainCount: 0,
            }, // 초기값 설정
          );

          setPinnedBottomRowData([
            {
              sellerNm: '출고보류(' + delayCount + ')',
              sendCnt: sendCount,
              misongCnt: misongCount,
              nowCnt: nowCount,
              remainCnt: remainCount,
            },
          ]);
        }
      } else {
        toastError('페이지 조회 도중 문제가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [misongOrders, isPagingSuccess]);

  useEffect(() => {
    if (
      router.asPath.split('?').length == 2 &&
      router.asPath.split('?')[1] == selectedRetailInCommon?.id?.toString() &&
      !isNaN(Number(router.asPath.split('?')[1]))
    ) {
      // 경로변수가 존재하며, 경로변수의 값이 전역 상태 소매처의 id 와 같으며, 값이 nan 이 아닐 경우
      onChangeFilters('sellerId', selectedRetailInCommon.id);
      onChangeFilters('sellerNm', selectedRetailInCommon.sellerNm || ''); // 소매처명 필터도 이에 맞추어 동기화
    }
  }, [onChangeFilters, router.asPath]);

  // 검색 버튼 클릭 또는 엔터 키 입력 시 실행
  const onSearch = async () => {
    onChangeFilters('sellerId', 0); // 소매처 id 초기화를 생략할 시 본 값으로 인한 조건 간섭으로 적절한 값이 출력되지 않을 우려
    await fetchMisongOrders();
  };

  const { mutate: updateMisongOrderStatusMutate } = useMutation(updateMisongOrderStatus, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          await fetchMisongOrders();
        } else {
          toastError(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const updateMisongOrderFn = async () => {
    const gridApi = gridRef.current?.api;
    const focusedCell = gridApi?.getFocusedCell();
    const gridRowData = misongOrders?.data?.body?.rows;
    if (focusedCell && focusedCell.rowIndex && gridRowData) {
      if (gridRowData[focusedCell.rowIndex] && gridRowData[focusedCell.rowIndex].id) {
        updateMisongOrderStatusMutate({
          id: gridRowData[focusedCell.rowIndex].id as number,
          custStatCd: gridRowData[focusedCell.rowIndex].custStatCd as string,
        });
      }
    }
  };

  const addClass = (currentClass: string, newClass: string) => (currentClass ? `${currentClass} ${newClass}` : newClass);

  const getRowClassForMisong = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params && params.data.rowNum && params.data.rowNum > 0) {
      rtnValue = addClass(rtnValue, 'ag-grid-changeOrder');
    }
    if (params.node.rowPinned === 'bottom') {
      // 합계 행 스타일링
      rtnValue = addClass(rtnValue, 'ag-grid-pinned-row');
    }
    return rtnValue;
  }, []);

  const ColorCellRenderer: React.FC<{ value: string; data: any }> = ({ value, data }) => {
    return (
      <div className="custStatCd" style={{ backgroundColor: value, padding: '0 5px', margin: '0 -5px', height: '100%' }}>
        {data.custStatNm}
      </div>
    );
  };

  const frameworkComponents = {
    colorCellRenderer: ColorCellRenderer,
  };

  const formatDate = (dateString: any) => {
    const date = parseISO(dateString);
    return format(date, 'yyyy-MM-dd (EEE)', { locale: ko });
  };

  const formatNumberWithCommas = (number: number | undefined) => {
    return number?.toLocaleString() ?? '';
  };

  const onCellKeyDown = (event: CellKeyDownEvent | FullWidthCellKeyDownEvent) => {
    console.log('onCellKeyDown ==>', event);
    const keyBoardEvent = event.event as KeyboardEvent;
    if (keyBoardEvent.key == 'Enter') {
      misongTran();
    }
  };

  const misongTran = () => {
    const gridApi = gridRef.current?.api;
    const nodes = gridApi?.getSelectedNodes();
    if (nodes?.length === 1) {
      const rowNode = nodes[0];
      setSelectedMisong(rowNode?.data);
      if (rowNode && rowNode?.data.remainCnt < 1) {
        toastError('미송처리가 모두 완료된건 입니다.');
      } else {
        openModal('ONETRAN');
      }
    } else if (nodes?.length && nodes?.length > 1) {
      let index = 0;
      let sellerId: number;
      nodes.forEach((node) => {
        if (node.data.remainCnt < 1) {
          toastError('선택하신 목록중 [' + (index + 1) + ']번째 가 미송처리가 모두 완료된건이 포함되어 있습니다.');
          return;
        }

        if (index === 0) {
          sellerId = node.data.sellerId;
        } else if (sellerId && sellerId !== node.data.sellerId) {
          toastError('선택하신 목록중 [' + (index + 1) + ']번째 가 소매처가 다릅니다. 동일한 소매처끼리 발송 가능합니다.');
          return;
        }

        index++;
      });

      // validation 통과 된후 에 confirm 띄운다.
      if (index === nodes?.length) {
        openModal('CONFIRM');
      }
    } else {
      const rowIndex = gridApi?.getFocusedCell()?.rowIndex;
      if (rowIndex && rowIndex > -1) {
        const rowNode = gridApi.getDisplayedRowAtIndex(rowIndex);
        setSelectedMisong(rowNode?.data);
        if (rowNode && rowNode?.data.remainCnt < 1) {
          toastError('미송처리가 모두 완료된 건 입니다.');
        } else {
          openModal('ONETRAN');
        }
      } else {
        toastError('그리드에서 행을 선택한 후 재시도하십시요.');
      }
    }
  };

  const misongCancel = () => {
    const gridApi = gridRef.current?.api;
    const rowIndex = gridApi?.getFocusedCell()?.rowIndex;
    if (rowIndex && rowIndex > -1) {
      const rowNode = gridApi.getDisplayedRowAtIndex(rowIndex);
      if (rowNode?.data.bundleYn === 'Y') {
        if (!confirm(' 묶음 처리된 주문건입니다. 해제하시겠습니까?')) {
          return false;
        }
      }
      setSelectedOrderDetId(rowNode?.data.orderDetId);
      if (rowNode && rowNode?.data.sendCnt < 1) {
        toastError('해당 미송건에 해제할 발송 건이 존재하지 않습니다.');
      } else {
        openModal('CANCELTRAN');
      }
    } else {
      toastError('처리할 내용을 그리드에서 선택한 후 발송처리 하세요');
    }
  };

  /*const misongRelease = () => {
    const selectedNodes = gridRef.current?.api.getSelectedNodes();
    if (selectedNodes && selectedNodes.length) {
      const releaseList: Release[] = [];
      for (let i = 0; i < selectedNodes.length; i++) {
        releaseList[releaseList.length] = {
          orderDetId: selectedNodes[i].data.orderDetId,
        };
      }
      treatSendCancel(releaseList).then((result) => {
        const { resultCode, body, resultMessage } = result.data;
        if (resultCode == 200) {
          toastSuccess('미송 해제되었습니다.');
        } else {
          toastError(resultMessage);
        }
      });
    }
  };*/

  /** 프린트 관련 */
  // 프린트 버튼 클릭 이벤트
  const [isPrinting, setIsPrinting] = useState(false);
  const handlePrintBtnClick = () => {
    // if (!isPreView || selectedIds.length === 0) {
    if (!isPreView) {
      // 미리보기 off 또는 선택된 ID 없을 경우
      return;
    }
    setIsPrinting(true);
  };
  const handleVoucherOption = (value: any) => {
    setOptionType(value);
  };

  // 그리드 선택 상태가 변경될 때 호출되는 함수
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [selectedSellerIds, setSelectedSellerIds] = useState<number[]>([]);
  const onSelectionChanged = async (event: SelectionChangedEvent) => {
    // 선택된 노드 가져오기
    const selectedNodes = event.api.getSelectedNodes();
    // 선택된 노드에서 orderId만 추출하고 중복 제거
    const newSelectedOrderIds = Array.from(new Set(selectedNodes.map((node) => node.data.id).filter((id) => id !== undefined)));
    const newSelectedSellerIds = Array.from(new Set(selectedNodes.map((node) => node.data.sellerId).filter((id) => id !== undefined)));
    setSelectedOrderIds(newSelectedOrderIds);
    setSelectedSellerIds(newSelectedSellerIds);
  };

  // 데이터를 가져오는 함수
  const fetchDetails = useCallback(async () => {
    if (selectedOrderIds.length === 0) return;

    try {
      const detailListPromises =
        optionType === 'notShipped'
          ? selectedOrderIds.map((orderId) => getNotShippedDetail(orderId))
          : optionType === 'shipped'
          ? selectedOrderIds.map((orderId) => getMisongPrintSendDetail(orderId))
          : selectedOrderIds.map((orderId) => getMisongPrintDetail(orderId));

      const detailLists = await Promise.all(detailListPromises);

      // 필요한 데이터 추출하여 설정
      const details: any = detailLists.flatMap((detail) => detail.data.body);
      setSelectedMisongPrintDetail(details);
    } catch (error) {
      console.error('주문 상세 정보를 가져오는 도중 오류 발생:', error);
    }
  }, [selectedOrderIds, selectedSellerIds, optionType]);

  // 선택된 노드나 optionType이 변경될 때마다 데이터를 다시 가져오도록 설정
  useEffect(() => {
    fetchDetails();
  }, [selectedOrderIds, selectedSellerIds, optionType]);

  // 검색 버튼 클릭 또는 엔터 키 입력 시 실행
  /*const onSearch = () => {
    onChangeFilters('sellerId', 0); // 주문에서 클릭으로 넘어온게 아니면 null 로 셑팅한다.
    setTimeout(async () => {
      await fetchMisongOrders();
    }, 200);
  };*/

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    // 필터 초기화
    //onFiltersReset(); // 이거 안먹어서 강제 셑팅
    Object.entries(initialFilters).forEach(([key, value]) => onChangeFilters(key, value));
    //setPaging({
    //  curPage: 1,
    //});
  };

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} search={fetchMisongOrders} filters={filters} reset={reset} />
      <Search className="type_2">
        <Search.DropDown
          title={''}
          name={'dateType'}
          showAll={false}
          defaultOptions={[
            { key: 1, value: 'A', label: '전체' },
            { key: 2, value: 'E', label: '미송일' },
            { key: 3, value: 'C', label: '발송일' },
          ]}
          value={filters.dateType}
          onChange={(name, value) => {
            onChangeFilters(name, value);
          }}
          optionClass={'searchOption'}
          dropDownStyle={{ width: '80px' }}
        />
        <CustomNewDatePicker
          title={''}
          type={'range'}
          defaultType={'type'}
          startName={'startDate'}
          endName={'endDate'}
          onChange={(name, value) => {
            onChangeFilters(name, value);
          }}
          value={[filters.startDate, filters.endDate]}
        />
        <Search.Input title={'소매처'} name={'sellerNm'} placeholder={'소매처 검색'} value={filters.sellerNm} onChange={onChangeFilters} filters={filters} />
        <Search.Input title={'상품명'} name={'skuNm'} placeholder={'상품명 검색'} value={filters.skuNm} onChange={onChangeFilters} filters={filters} />
        <Search.DropDown
          title={'상태'}
          name={'misongStateCd'}
          placeholder={'미송상태'} // 예솔수정 전체선택시 미송상태 단어가 노출됨
          defaultOptions={[
            { label: '미발송', value: 'N', key: 1 },
            { label: '가능', value: 'E', key: 2 },
            { label: '발송', value: 'Y', key: 3 },
            { label: '전체', value: '', key: 4 },
          ]}
          value={filters.misongStateCd}
          showAll={false}
          onChange={onChangeFilters}
        />
      </Search>

      <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
        <TableHeader count={misongList.length} search={fetchMisongOrders} gridRef={gridRef} isPaging={false}>
          <CustomShortcutButton
            className={`btn ${isPreView ? 'on' : ''}`}
            title="미리보기"
            onClick={() => setIsPreView(!isPreView)}
            shortcut={COMMON_SHORTCUTS.alt1}
          >
            미리보기
          </CustomShortcutButton>
          <CustomShortcutButton
            className={`btn`}
            title="화주설정"
            shortcut={COMMON_SHORTCUTS.alt2}
            onClick={() => {
              openModalForPartner('PARTNER_INFO');
            }}
          >
            화주설정
          </CustomShortcutButton>
          <DropDownAtom
            name={'temp'}
            options={[
              { key: 1, value: 'misong', label: '미송현황' },
              { key: 2, value: 'shipped', label: '발송내역' },
              { key: 3, value: 'notShipped', label: '미발송내역' },
            ]}
            value={optionType}
            onChangeOptions={(name, selectedValues) => {
              handleVoucherOption(selectedValues);
            }}
            className={`previewDropDown ${isPreView ? 'on' : ''}`}
          />

          <CustomShortcutButton className="btn icoPrint" title="프린트" onClick={handlePrintBtnClick} shortcut={COMMON_SHORTCUTS.print}>
            프린트
          </CustomShortcutButton>
        </TableHeader>
        <div className="gridBox">
          <div className="tblPreview">
            <TunedGrid<MisongResponseResponse>
              ref={gridRef}
              loading={isMisongOrders}
              rowData={misongList}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onCellKeyDown={onCellKeyDown}
              onCellValueChanged={(event) => {
                const colId = event.api.getFocusedCell()?.column.getColId();
                const rowIndex = event.api.getFocusedCell()?.rowIndex;
                if (colId === 'orderDetEtc' && rowIndex != undefined && rowIndex > -1) {
                  const rowNode = event.api.getDisplayedRowAtIndex(rowIndex);
                  console.log('rownude ==>', rowNode);
                  if (rowNode && rowNode.data) {
                    updateOrderDetEtcMutate({ id: Number(rowNode.data.orderDetId), orderDetEtc: event.value });
                  }
                }
              }}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              onCellEditingStopped={updateMisongOrderFn}
              pinnedBottomRowData={pinnedBottomRowData} // 하단에 고정된 합계 행
              getRowClass={getRowClassForMisong}
              onSelectionChanged={onSelectionChanged}
              singleClickEdit={true}
              preventPersonalizedColumnSetting={true}
              suppressRowClickSelection={false} // 이넘이 있으면 ctrl + 클릭이 멀티로 되지 않는다.2025-07-15 박근철 수정
              className={'withPrint check'}
            />
            <div className="btnArea">
              <CustomShortcutButton className="btn" title="발송처리" onClick={misongTran} shortcut={COMMON_SHORTCUTS.gridUnder1}>
                발송처리
              </CustomShortcutButton>
              <CustomShortcutButton className="btn" title="발송해제" onClick={misongCancel} shortcut={COMMON_SHORTCUTS.gridUnder2}>
                발송해제
              </CustomShortcutButton>
              <CustomShortcutButton className="btn" title="미송해제" onClick={() => openModal('MISONG_RELEASE')} shortcut={COMMON_SHORTCUTS.gridUnder3}>
                미송해제
              </CustomShortcutButton>
              <CustomShortcutButton className="btn" title="상품별보기" onClick={() => openModal('SKULIST')} shortcut={COMMON_SHORTCUTS.gridUnder4}>
                상품별보기
              </CustomShortcutButton>
            </div>
          </div>
          {isPreView ? (
            <div className="previewBox">
              {selectedMisongPrintDetail && selectedMisongPrintDetail.length !== 0 ? (
                <PrintLayout
                  key={optionType}
                  selectedDetail={selectedMisongPrintDetail}
                  isPrinting={isPrinting}
                  setIsPrinting={setIsPrinting}
                  type={optionType}
                />
              ) : (
                <div className="noRowsOverlayBox">주문을 선택하면 상세 정보가 표시됩니다.</div>
              )}
            </div>
          ) : (
            ''
          )}
        </div>
      </div>
      {modalType?.type === 'ONETRAN' && modalType.active && <MisongProcessPop data={selectedMisong} fetchPopUp={fetchMisongOrders} />}
      {modalType?.type === 'CANCELTRAN' && modalType.active && <MisongCancelPop orderDetId={selectedOrderDetId} fetchPopUp={fetchMisongOrders} />}
      {modalType?.type === 'SKULIST' && modalType.active && <SkuListPop startDate={filters.startDate} endDate={filters.endDate} />}
      {modalType?.type === 'ORDEREDIT' && modalType.active && <MisongOrderEditPop />}
      {modalType?.type === 'RELEASEEDIT' && modalType.active && <MisongReleaseEditPop />}
      {modalType?.type === 'PRODUCTTALLY' && modalType.active && <MisongProductTallyPop />}
      {modalType?.type === 'CATEGORYSETTING' && modalType.active && <MisongCategorySetPop />}
      {modalTypeForPartner?.type === 'PARTNER_INFO' && modalTypeForPartner.active && <PartnerInfoPop />}
      <ConfirmModal
        title={`<div class="confirmMsg"><span class="small">선택된 ${
          gridRef?.current?.api?.getSelectedNodes()?.length || '0'
        }건의 미송을 모두</span><span class="big"><strong>발송처리</strong>&nbsp;하시겠어요?</span></div>`}
        open={modalType.type === 'CONFIRM' && modalType.active}
        onConfirm={() => {
          const gridApi = gridRef.current?.api;
          const selectedNodes = gridApi?.getSelectedNodes();
          const selectedData = selectedNodes?.map((node) => node.data.orderDetId) || [];
          treatMultiMisongMutate(selectedData);
        }}
        onClose={() => {
          closeModal('CONFIRM');
        }}
      />
      <ConfirmModal
        title={'<div class="confirmMsg"><span class="small">선택된 상품을 </span><span class="big"><strong>미송해제</strong>&nbsp;처리하시겠어요?</span></div>'}
        open={modalType.type === 'MISONG_RELEASE' && modalType.active}
        onConfirm={() => {
          const selectedNodes = gridRef.current?.api.getSelectedNodes();
          if (selectedNodes && selectedNodes.length) {
            const releaseList: Release[] = [];
            for (let i = 0; i < selectedNodes.length; i++) {
              releaseList[releaseList.length] = {
                orderDetId: selectedNodes[i].data.orderDetId,
              };
            }
            treatMisongCancel(releaseList).then((result: any) => {
              const { resultCode, body, resultMessage } = result.data;
              if (resultCode == 200) {
                toastSuccess('미송 해제되었습니다.');
                fetchMisongOrders();
                closeModal('MISONG_RELEASE');
              } else {
                toastError(resultMessage);
              }
            });
          }
        }}
        onClose={() => {
          closeModal('MISONG_RELEASE');
        }}
      />
    </div>
  );
};

export default Misong;
