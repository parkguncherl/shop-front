import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Title, toastSuccess } from '../../../components';
import { TableHeader, toastError } from '../../../components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CellKeyDownEvent, ColDef, FullWidthCellKeyDownEvent, IRowNode, RowClassParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { GridSetting } from '../../../libs/ag-grid';
import useFilters from '../../../hooks/useFilters';
import { PARTNER_CODE } from '../../../libs/const';
import { useTodayStore } from '../../../stores/useTodayStore';
import { TodayCategorySetPop } from '../../../components/popup/today/TodayCategorySetPop';
import { useCommonStore, usePartnerCodeStore } from '../../../stores';
import { authApi } from '../../../libs';
import { TodayResponsePaging, PayResponse, OrderExtendedResponse, TodayRequestUpdateToBoryu, PartnerCodeDropDown } from '../../../generated';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useOrderStore } from '../../../stores/useOrderStore';
import { usePaymentStore } from '../../../stores/usePaymentStore';
import PrintLayout from '../../../components/print/PrintLayout';
import TunedGrid from '../../../components/grid/TunedGrid';
import { ModalTypeInterFace, PaymentPop } from '../../../components/popup/common/PaymentPop';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

/**
 * 금일내역
 */
const Today = () => {
  const nowPage = 'oms_today'; // filter 저장 2025-01-21
  const session = useSession();
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');
  const queryClient = useQueryClient();
  const gridRef = useRef<AgGridReact>(null);

  /** 공통 스토어 - State */
  const [selectedRetail, setSelectedRetail, upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData, setIsOrderOn] = useCommonStore((s) => [
    s.selectedRetail,
    s.setSelectedRetail,
    s.upMenuNm,
    s.menuNm,
    s.filterDataList, // filter 저장 2025-01-21
    s.setFilterDataList, // filter 저장 2025-01-21
    s.getFilterData, // filter 저장 2025-01-21
    s.setIsOrderOn,
  ]);
  const [selectPartnerCodeDropdown] = usePartnerCodeStore((s) => [s.selectPartnerCodeDropdown]);
  //const [columnDefs, setColumnDefs] = useState<ColDef<TodayResponsePaging>[]>([]);
  // 오늘의 주문 정보 스토어에서 필요한 상태와 함수 가져오기
  const [
    paging,
    setPaging,
    modalType,
    openModal,
    closeModal,
    getTodayOrderDetail,
    updateTodaysToBoryu,
    deleteTodayOrders,
    getTodayOrderDetailByPayId,
    //updateCustStatus,
  ] = useTodayStore((s) => [
    s.paging,
    s.setPaging,
    s.modalType,
    s.openModal,
    s.closeModal,
    s.getTodayOrderDetail,
    s.updateTodaysToBoryu,
    s.deleteTodayOrders,
    s.getTodayOrderDetailByPayId,
    // s.updateCustStatus,
  ]);

  /** 결제정보 전역상태 */
  const [setPaymentInfo, selectPaymentInfo, updateCustStatus] = usePaymentStore((s) => [s.setPaymentInfo, s.selectPaymentInfo, s.updateCustStatus]);
  const [order, setOrder, setOrderDetList, selectExtendedOrder, updateOrder] = useOrderStore((s) => [
    s.order,
    s.setOrder,
    s.setOrderDetList,
    s.selectExtendedOrder,
    s.updateOrder,
  ]);

  /** 금일내역 상태 */
  const [todayList, setTodayList] = useState<TodayResponsePaging[]>([]);
  const [gubunCodeList, setGubunCodeList] = useState<PartnerCodeDropDown[]>([]);

  const [paymentModal, setPaymentModal] = useState<ModalTypeInterFace>({
    type: 'PAYMENT_CREATE',
    active: false,
  });
  const [isPreView, setIsPreView] = useState<boolean>(true);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<TodayResponsePaging[]>([]); // 합계데이터 만들기
  // 금일내역 상세 가져오기
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState(false); // 프린트 여부

  const [filters, onChangeFilters, onFiltersReset] = useFilters(
    getFilterData(filterDataList, nowPage) || {
      // filter 저장 2025-01-21
      workYmd: today,
      searchSeller: '',
      searchSkuNm: '',
    },
  );

  /** 하위코드 목록 조회 */
  const { data: partnerCodeList, isSuccess: isCustStateSuccess } = useQuery({
    queryKey: ['/partnerCode/dropdown'],
    queryFn: () => selectPartnerCodeDropdown(PARTNER_CODE.categories),
  });

  useEffect(() => {
    console.log('partnerCodeList ===>', partnerCodeList);
    setGubunCodeList(partnerCodeList?.data.body ?? []);
  }, [isCustStateSuccess, partnerCodeList]);

  /** 금일내역 페이징 목록 조회, 거래 정보 수정 시 OrderPaymentPop 에서 키 값을 통한 캐시 무효화 동작 수행 */
  const {
    data: todayOrders,
    isLoading: isTodayOrders,
    isSuccess: isPagingSuccess,
    refetch: fetchTodayOrders,
  } = useQuery({
    queryKey: ['/orderInfo/today/paging', paging.curPage, filters.workYmd],
    queryFn: () => {
      const updatedFilters = {
        ...filters,
        workYmd: filters.workYmd || today,
      };
      const params = {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...updatedFilters,
      };
      return authApi.get('/orderInfo/today/paging', { params });
    },
    enabled: isCustStateSuccess,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (isPagingSuccess) {
      const { resultCode, body, resultMessage } = todayOrders.data;
      if (resultCode === 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
        setPaging(body?.paging);
        setTodayList(body.rows || []);
        if (body.rows && body.rows.length > 0) {
          const {
            cancelCount,
            waitingCount,
            completeCount,
            totalAmountTotal,
            payAmountTotal,
            returnAmountTotal,
            unitPriceDiscountTotal,
            discountAmountTotal,
            previousBalanceTotal,
            cashDepositTotal,
            accountDepositTotal,
            currentBalanceTotal,
            payByCreditTotal,
            logisAmtTotal,
            totSkuCntTotal,
            totBackCntTotal,
          } = body.rows.reduce(
            (
              acc: {
                cancelCount: number;
                waitingCount: number;
                completeCount: number;
                totalAmountTotal: number;
                payAmountTotal: number;
                returnAmountTotal: number;
                unitPriceDiscountTotal: number;
                discountAmountTotal: number;
                previousBalanceTotal: number;
                cashDepositTotal: number;
                accountDepositTotal: number;
                currentBalanceTotal: number;
                payByCreditTotal: number;
                logisAmtTotal: number;
                totSkuCntTotal: number;
                totBackCntTotal: number;
              },
              data: TodayResponsePaging,
            ) => {
              return {
                cancelCount: data.cancelCount ? data.cancelCount : 0,
                waitingCount: data.waitingCount ? data.waitingCount : 0,
                completeCount: data.completeCount ? data.completeCount : 0,
                totalAmountTotal: acc.totalAmountTotal + (data.totalAmount ? data.totalAmount : 0),
                payAmountTotal: acc.payAmountTotal + (data.payAmount ? data.payAmount : 0),
                returnAmountTotal: acc.returnAmountTotal + (data.returnAmount ? data.returnAmount : 0),
                unitPriceDiscountTotal: acc.unitPriceDiscountTotal + (data.unitPriceDiscount ? data.unitPriceDiscount : 0),
                discountAmountTotal: acc.discountAmountTotal + (data.discountAmount ? data.discountAmount : 0),
                previousBalanceTotal: acc.previousBalanceTotal + (data.previousBalance ? data.previousBalance : 0),
                cashDepositTotal: acc.cashDepositTotal + (data.cashDeposit ? data.cashDeposit : 0),
                accountDepositTotal: acc.accountDepositTotal + (data.accountDeposit ? data.accountDeposit : 0),
                currentBalanceTotal: acc.currentBalanceTotal + (data.currentBalance ? data.currentBalance : 0),
                payByCreditTotal: acc.payByCreditTotal + (data.payByCredit ? data.payByCredit : 0),
                logisAmtTotal: acc.logisAmtTotal + (data.logisAmt ? data.logisAmt : 0),
                totSkuCntTotal: acc.totSkuCntTotal + (data.totSkuCnt ? data.totSkuCnt : 0),
                totBackCntTotal: acc.totBackCntTotal + (data.totBackCnt ? data.totBackCnt : 0),
              };
            },
            {
              cancelCount: 0,
              waitingCount: 0,
              completeCount: 0,
              totalAmountTotal: 0,
              payAmountTotal: 0,
              returnAmountTotal: 0,
              unitPriceDiscountTotal: 0,
              discountAmountTotal: 0,
              previousBalanceTotal: 0,
              cashDepositTotal: 0,
              accountDepositTotal: 0,
              currentBalanceTotal: 0,
              payByCreditTotal: 0,
              logisAmtTotal: 0,
              totSkuCntTotal: 0,
              totBackCntTotal: 0,
            }, // 초기값 설정
          );

          setPinnedBottomRowData([
            {
              sellerName: '대기 (' + waitingCount + ') / 출고 (' + completeCount + ')',
              totalAmount: totalAmountTotal,
              payAmount: payAmountTotal,
              returnAmount: returnAmountTotal,
              unitPriceDiscount: unitPriceDiscountTotal,
              discountAmount: discountAmountTotal,
              previousBalance: previousBalanceTotal,
              cashDeposit: cashDepositTotal,
              accountDeposit: accountDepositTotal,
              currentBalance: currentBalanceTotal,
              payByCredit: payByCreditTotal,
              logisAmt: logisAmtTotal,
              totSkuCnt: totSkuCntTotal,
              totBackCnt: totBackCntTotal,
            },
          ]);
        } else {
          setPinnedBottomRowData([
            {
              sellerName: '대기 (' + 0 + ') / 출고 (' + 0 + ')',
              totalAmount: 0,
              payAmount: 0,
              returnAmount: 0,
              unitPriceDiscount: 0,
              discountAmount: 0,
              previousBalance: 0,
              cashDeposit: 0,
              accountDeposit: 0,
              currentBalance: 0,
              payByCredit: 0,
            },
          ]);
        }

        // 하단 포커스
        setTimeout(() => {
          if (gridRef.current?.api) {
            gridRef.current?.api.ensureIndexVisible(body.rows ? body.rows.length - 1 : 0);
            gridRef.current?.api.setFocusedCell(body.rows ? body.rows.length - 1 : 0, 'sellerName');
          }
        }, 10);
      } else {
        toastError(resultMessage);
      }
    }
  }, [todayOrders, isPagingSuccess, setPaging]);

  /** 보류처리하기 */
  const { mutate: updateTodayMultiOrderStatusToBoryu } = useMutation(updateTodaysToBoryu, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('보류처리 되었습니다.');
          gridRef.current?.api.deselectAll();
          await fetchTodayOrders();
        } else {
          toastError(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 주문 삭제하기 */
  const { mutate: deleteTodayOrdersMutation } = useMutation(deleteTodayOrders, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          gridRef.current?.api.deselectAll();
          await fetchTodayOrders();
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 컬럼정의 */
  const columnDefs = useMemo<ColDef<TodayResponsePaging>[]>(
    () => [
      {
        field: 'chitNo',
        headerName: '전표#',
        width: 70,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'custStatCd',
        headerName: '구분',
        minWidth: 60,
        maxWidth: 100,
        cellEditorSelector: () => {
          const selectList = (gubunCodeList ?? []).map((option) => {
            return option.codeCd;
          });
          return {
            component: 'agSelectCellEditor',
            params: {
              values: selectList,
            },
          };
        },
        editable: (params) => !(params.node?.rowPinned === 'bottom'),
        cellClass: (params) => {
          return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
        },
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        onCellValueChanged: (params) => {
          if (params.newValue != '' && params.oldValue != params.newValue) {
            updateCustStatus({ payId: params.data.payId, custStatCd: params.newValue }).then((result) => {
              const { resultCode, resultMessage } = result.data;
              if (resultCode == 200) {
                gridRef.current?.api.clearFocusedCell();
                toastSuccess('수정되었습니다.');
              } else {
                toastError('수정 과정에서 문제가 발생하였습니다.');
                console.error(resultMessage);
              }
              fetchTodayOrders();
            });
          }
        },
        valueFormatter: (params) => {
          const option = gubunCodeList.find((option) => option.codeCd === params.value);
          return option ? option.codeNm : params.value;
        },
      },
      {
        field: 'sellerName',
        headerName: '소매처',
        minWidth: 85,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'previousBalance',
        headerName: '전잔액',
        maxWidth: 80,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'totSkuCnt',
        headerName: '판매량',
        maxWidth: 45,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'totalAmount',
        headerName: '판매금액',
        maxWidth: 80,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'totBackCnt',
        headerName: '반품량',
        maxWidth: 45,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'returnAmount',
        headerName: '반품금액',
        maxWidth: 80,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'unitPriceDiscount',
        headerName: '단가DC',
        maxWidth: 80,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'discountAmount',
        headerName: '할인금액',
        maxWidth: 80,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'logisAmt',
        headerName: '물류비',
        maxWidth: 80,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'cashDeposit',
        headerName: '현금입금',
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
        suppressHeaderMenuButton: true,
      },
      {
        field: 'accountDeposit',
        headerName: '통장입금',
        maxWidth: 80,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'payByCredit',
        headerName: '당일합계',
        maxWidth: 80,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'currentBalance',
        headerName: '현잔액',
        maxWidth: 80,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      { field: 'onSiteYn', headerName: '매장판매', width: 55, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'updNm', headerName: '사용자', width: 85, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      {
        field: 'remark',
        headerName: '비고',
        width: 100,
        suppressHeaderMenuButton: true,
        cellEditor: 'agTextCellEditor',
        editable: true,
        singleClickEdit: true,
        onCellValueChanged: (params) => {
          //updateOrder
          if (params.data.inoutCd == 'D') {
            toastError('결제거래는 비고를 추가/수정할 수 없습니다.');
            if (params.node?.rowIndex != null) {
              const rowIndex = params.node.rowIndex as number;
              setTodayList((prevState) => {
                prevState[rowIndex].remark = params.oldValue;
                return [...prevState];
              });
            }
          } else {
            updateOrder({
              id: params.data.orderId,
              orderEtc: params.newValue,
            }).then(async (result) => {
              const { resultCode, resultMessage } = result.data;
              if (resultCode == 200) {
                toastSuccess('수정되었습니다.');
                await queryClient.invalidateQueries({ queryKey: ['/orderInfo/today/paging'] });
              } else {
                toastError(resultMessage);
              }
            });
          }
        },
      },
      {
        field: 'tranYmd',
        headerName: '입금일자',
        width: 85,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        valueGetter: (params) => {
          const isDisplay = (params.data?.cashDeposit && params.data.cashDeposit > 0) || (params.data?.accountDeposit && params.data.accountDeposit > 0);
          return isDisplay ? params.data?.tranYmd : null;
        },
      },
      { field: 'workYmd', headerName: '대상기간', width: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    ],
    [gubunCodeList],
  );

  useEffect(() => {
    console.log('columnDefs ===>', columnDefs);
  }, [columnDefs]);

  // 프린트 버튼 클릭 이벤트
  const handlePrintBtnClick = () => {
    // if (!isPreView || selectedIds.length === 0) {
    if (!isPreView) {
      // 미리보기 off 또는 선택된 ID 없을 경우
      return;
    }
    setIsPrinting(true);
  };

  const handleSelectionChanged = async () => {
    // 선택된 모든 행을 가져옴
    const selectedNodes = gridRef.current?.api.getSelectedNodes();
    // 각 항목을 객체 형태로 저장하여 orderId와 payId 구분
    const items = selectedNodes?.map((node) => (node.data.orderId ? { orderId: node.data.orderId } : { payId: node.data.payId })) || [];
    try {
      const orderIds = items.filter((item) => item.orderId).map((item) => item.orderId);
      const payIds = items.filter((item) => item.payId).map((item) => item.payId);
      // 각 ID와 payId에 대해 API 호출
      const orderIdResponse = orderIds.length > 0 ? await getTodayOrderDetail(orderIds) : { data: { body: [] as any[] } }; // 0 으로 파트너 아이디를 던지면 backend 에서 다시 조회해서 처리
      const payIdResponse = payIds.length > 0 ? await getTodayOrderDetailByPayId(payIds) : { data: { body: [] as any[] } };

      // 응답 데이터를 원래 순서에 맞춰 매핑
      const combinedResponse = items.map((item) => {
        if (item.orderId && (orderIdResponse?.data?.body as any[])) {
          const matchedOrder = (orderIdResponse.data.body as any[]).find((detail: { orderId: number }) => detail.orderId === item.orderId);
          return (
            matchedOrder || {
              orderId: item.orderId,
              error: 'No details found',
            }
          );
        } else if (payIdResponse?.data?.body) {
          const matchedPay = (payIdResponse.data.body as any[]).find((detail: { payId: number }) => detail.payId === item.payId);
          return (
            matchedPay || {
              payId: item.payId,
              error: 'No details found',
            }
          );
        } else {
          return {
            error: 'No details found',
          };
        }
      });
      //console.log('combinedResponse :+_', combinedResponse);
      setSelectedOrderDetail(combinedResponse); // 순서에 맞는 상세 정보 저장
    } catch (error) {
      console.error('API 호출 중 오류 발생: ', error);
    }
  };

  // color 셀 배경색 렌더러
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

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    // 필터 초기화
    onFiltersReset();
    onChangeFilters('workYmd', today);
    //await fetchTodayOrders(); // 상태가 업데이트된 후에 검색 실행
  };

  // (params: RowClassParams<any, any>) => ("ag-grid-pinned-row" | undefined)
  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params && params.data.custStatClass) {
      rtnValue = 'ag-grid-' + params.data.custStatClass;
    }
    if (params && params.data.orderCdNm && params.data.orderCdNm === '입금') {
      rtnValue = rtnValue ? rtnValue + ' ag-grid-deposit' : 'ag-grid-deposit';
    }

    if (params.node.rowPinned === 'bottom') {
      // 합계 행 스타일링
      rtnValue = rtnValue ? rtnValue + ' ag-grid-pinned-row' : 'ag-grid-pinned-row';
    } else if (params.data.delYn === 'Y') {
      rtnValue = rtnValue ? rtnValue + ' ag-row-canceled-row' : 'ag-row-canceled-row';
    }

    return rtnValue;
  }, []);

  const deleteConfirm = async () => {
    const targetOrderNodes = gridRef.current?.api.getSelectedNodes() || [];
    const listOfPayId: number[] = [];
    for (let i = 0; i < targetOrderNodes.length; i++) {
      listOfPayId.push(targetOrderNodes[i].data.payId);
    }
    deleteTodayOrdersMutation(listOfPayId);
  };

  const modifyFn = (targetOrderNode: IRowNode<any>) => {
    setIsOrderOn(false);
    // 수정을 위한 모달은 orderReg 영역에서 해당 전역 상태 변화를 인지함으로서 출력함
    if (targetOrderNode.data.orderCdNm == '입금' && targetOrderNode.data.payId) {
      /** 주문(입금거래) */
      selectPaymentInfo(targetOrderNode.data.payId).then((result) => {
        if (result && result.data) {
          const { resultCode, body, resultMessage } = result.data;
          if (resultCode === 200) {
            setSelectedRetail({
              id: (body as PayResponse).sellerId,
              sellerNm: (body as PayResponse).sellerNm,
            });
            setPaymentInfo({
              ...body,
              id: targetOrderNode.data.payId,
              workYmd: targetOrderNode.data.workYmd,
              tranYmd: targetOrderNode.data.tranYmd,
            });
            setPaymentModal({
              active: true,
              type: 'PAYMENT_UPDATE',
            });
          } else {
            toastError(resultMessage);
          }
        }
      });
    } else {
      /** 주문(결제거래) */
      selectExtendedOrder(targetOrderNode.data.orderId).then((result) => {
        const { resultCode, body, resultMessage } = result.data;
        if (resultCode === 200 && body) {
          const respondedBody: OrderExtendedResponse = body;
          setOrder(respondedBody.order || {}); // 조회를 위하여 설정된 id 및 이외의 값을 보존하고자 다음과 같이 작성
          setOrderDetList(respondedBody.detList || [{}]);
          setSelectedRetail(respondedBody.retailInfo);
          setPaymentInfo(respondedBody.payResponse);
        } else {
          toastError(resultMessage);
        }
      });
    }
  };

  const onCellKeyDown = (event: CellKeyDownEvent | FullWidthCellKeyDownEvent) => {
    const keyBoardEvent = event.event as KeyboardEvent;
    if (keyBoardEvent.key === 'Delete' || keyBoardEvent.key === 'Backspace') {
      const gridApi = gridRef.current?.api;
      const focusedCell = gridApi?.getFocusedCell();
      if (gridApi && focusedCell) {
        const rowIndex = focusedCell.rowIndex;
        const colId = focusedCell.column.getColId();
        if (colId === 'custStatCd') {
          const payId = gridApi.getDisplayedRowAtIndex(rowIndex)?.data.payId;
          console.log('gridApi.getDisplayedRowAtIndex(rowIndex)', gridApi.getDisplayedRowAtIndex(rowIndex));
          updateCustStatus({ payId: payId, custStatCd: '' }).then((result) => {
            const { resultCode, resultMessage } = result.data;
            if (resultCode == 200) {
              gridRef.current?.api.clearFocusedCell();
              toastSuccess('삭제되었습니다.');
            } else {
              toastError('삭제 과정에서 문제가 발생하였습니다.');
              console.error(resultMessage);
            }
            fetchTodayOrders().then(() => {
              console.log('success');
            });
          });
        }
      }
    }
  };

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={fetchTodayOrders} filters={filters} />
      <Search className="type_2">
        <CustomNewDatePicker
          name={'workYmd'}
          type={'date'}
          title={'일자'}
          value={filters.workYmd}
          //onChange={onChangeFilters}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.Input
          title={'소매처'}
          name={'searchSeller'}
          placeholder={'소매처 검색'}
          value={filters.searchSeller}
          onChange={onChangeFilters}
          onEnter={() => fetchTodayOrders()}
          filters={filters}
        />
        <Search.Input
          title={'상품명'}
          name={'searchSkuNm'}
          placeholder={'상품명 검색'}
          value={filters.searchSkuNm}
          onChange={onChangeFilters}
          onEnter={() => fetchTodayOrders()}
          filters={filters}
        />
      </Search>

      <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={fetchTodayOrders} isPaging={false}>
          <CustomShortcutButton
            className={`btn ${isPreView ? 'on' : ''}`}
            title="미리보기"
            onClick={() => setIsPreView(!isPreView)}
            shortcut={COMMON_SHORTCUTS.alt1}
          >
            미리보기
          </CustomShortcutButton>
          <CustomShortcutButton className="btn icoPrint" title="프린트" onClick={handlePrintBtnClick} shortcut={COMMON_SHORTCUTS.print}>
            프린트
          </CustomShortcutButton>
        </TableHeader>
        {columnDefs && columnDefs.length > 0 && (
          <div className="gridBox">
            <div className="tblPreview">
              <TunedGrid<TodayResponsePaging>
                ref={gridRef}
                onGridReady={(params) => {
                  params.api.autoSizeAllColumns(); // 모든 열 크기 자동 설정
                }}
                loading={isTodayOrders && isCustStateSuccess}
                components={frameworkComponents}
                rowData={todayList}
                columnDefs={columnDefs}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                singleClickEdit={true}
                getRowClass={getRowClass}
                onSelectionChanged={handleSelectionChanged} // 선택 변경시
                /*  더블클릭시 이동되는거 막음
                onRowDoubleClicked={(event) => {
                  modifyFn(event.node);
                }}
                */
                suppressRowClickSelection={false}
                pinnedBottomRowData={pinnedBottomRowData} // 하단에 고정된 합계 행
                className={'default check'}
                onCellKeyDown={onCellKeyDown}
              />
              <div className="btnArea">
                <CustomShortcutButton
                  className="btn"
                  title="주문수정"
                  onClick={() => {
                    const selectedNodes = gridRef.current?.api.getSelectedNodes();
                    if (selectedNodes) {
                      if (selectedNodes.length == 1) {
                        if (selectedNodes[0].data.delYn == 'Y') {
                          toastError('삭제건입니다.');
                        } else if (selectedNodes[0].data.jobStatNm != '요청' && selectedNodes[0].data.jobStatNm != '출고보류') {
                          toastError('물류 처리상태가 요청이나 출고보류인경우에만 가능 현재상태 : ' + selectedNodes[0].data.jobStatNm);
                        } else if (selectedNodes[0].data.orderCd == '7') {
                          toastError('샘플판매는 주문 수정이 불가능합니다. 취소처리는 가능합니다.');
                        } else {
                          modifyFn(selectedNodes[0]);
                        }
                      } else {
                        toastError('하나의 행을 선택하십시요.');
                      }
                    } else {
                      console.error('node 배열을 찾을 수 없음');
                    }
                  }}
                  shortcut={COMMON_SHORTCUTS.alt1}
                >
                  주문수정
                </CustomShortcutButton>
                <CustomShortcutButton
                  className="btn"
                  title="삭제하기"
                  shortcut={COMMON_SHORTCUTS.alt2}
                  onClick={() => {
                    const targetOrderNodes = gridRef.current?.api.getSelectedNodes() || [];
                    if (targetOrderNodes && targetOrderNodes.length > 0) {
                      const delNode = targetOrderNodes.filter((node) => node.data.delYn == 'Y');
                      if (delNode.length > 0) {
                        toastError('삭제건이 존재합니다.');
                      } else {
                        openModal('DELETE');
                      }
                    } else {
                      toastError('선택된건이 존재하지 않습니다.');
                    }
                  }}
                >
                  삭제하기
                </CustomShortcutButton>
                <CustomShortcutButton
                  className="btn"
                  title="보류처리"
                  shortcut={COMMON_SHORTCUTS.alt3}
                  onClick={() => {
                    openModal('BORYU');
                  }}
                >
                  보류처리
                </CustomShortcutButton>
                <CustomShortcutButton className="btn" title="구분편집" shortcut={COMMON_SHORTCUTS.alt4} onClick={() => openModal('CATEGORY_SETTING')}>
                  구분편집
                </CustomShortcutButton>
              </div>
              {/*<Pagination pageObject={paging} setPaging={(newPaging) => setPaging({ ...paging, ...newPaging })} />*/}
            </div>
            <div>
              {isPreView ? (
                <div className="previewBox">
                  {selectedOrderDetail ? (
                    <PrintLayout
                      selectedDetail={selectedOrderDetail}
                      isPrinting={isPrinting}
                      setIsPrinting={setIsPrinting}
                      type={selectedOrderDetail[0]?.payId ? 'pay' : 'default'}
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
        )}
      </div>
      <PaymentPop
        modalType={paymentModal}
        selectedRetail={selectedRetail}
        onRequestSuccess={(modalType) => {
          if (modalType.type == 'PAYMENT_UPDATE') {
            setSelectedRetail(undefined);
            setPaymentInfo(undefined);
            queryClient.invalidateQueries(['/orderInfo/today/paging']); // 금일내역 쿼리 무효화(refetch)
          }
        }}
        onClose={() => {
          setSelectedRetail(undefined);
          setPaymentInfo(undefined);
        }}
      />
      <ConfirmModal
        title={'<div class="confirmMsg arrows"><div class="top">삭제하시겠습니까?</div>'}
        open={modalType.type === 'DELETE' && modalType.active}
        onClose={() => {
          closeModal('DELETE');
        }}
        onConfirm={deleteConfirm}
      />
      <ConfirmModal
        open={modalType.type === 'BORYU' && modalType.active}
        onClose={() => {
          closeModal('BORYU');
        }}
        onConfirm={() => {
          const targetOrderNodes = gridRef.current?.api.getSelectedNodes() || [];
          const ListOfOrder: TodayRequestUpdateToBoryu[] = [];
          for (let i = 0; i < targetOrderNodes.length; i++) {
            if (targetOrderNodes[i].data.delYn == 'Y') {
              toastError(targetOrderNodes[i].data.chitNo + ' 번 전표 주문은 삭제건 입니다.');
              return;
            } else {
              ListOfOrder.push({
                orderId: targetOrderNodes[i].data.orderId,
              });
            }
          }
          console.log(ListOfOrder);
          updateTodayMultiOrderStatusToBoryu(ListOfOrder);
        }}
        title={'<div class="confirmMsg"><span class="small">선택된 주문전표를 </span><span class="big"><strong>보류</strong>&nbsp;처리하시겠어요?</span></div>'}
      />
      {modalType?.type === 'CATEGORY_SETTING' && modalType.active && <TodayCategorySetPop partnerCodeUpper={PARTNER_CODE.categories} />}
    </div>
  );
};

export default Today;
