import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Title, toastError, toastSuccess } from '../../../components';
import { TableHeader } from '../../../components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ColDef, RowClassParams, SelectionChangedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { GridSetting } from '../../../libs/ag-grid';
import useFilters from '../../../hooks/useFilters';
import { useTodayStore } from '../../../stores/useTodayStore';
import { useCommonStore } from '../../../stores';
import { RetailResponseDetail, RetailSettleResponseResponse } from '../../../generated';
import { Utils } from '../../../libs/utils';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import TunedGrid from '../../../components/grid/TunedGrid';
import { authApi } from '../../../libs';
import PrintLayout from '../../../components/print/PrintLayout';
import { usePaymentStore } from '../../../stores/usePaymentStore';
import { ModalTypeInterFace, PaymentPop } from '../../../components/popup/common/PaymentPop';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import { useRouter } from 'next/router';
import { useRetailStore } from '../../../stores/useRetailStore';
import CustomNewDatePicker, { CustomNewDatePickerRefInterface } from '../../../components/CustomNewDatePicker';
import { ConfirmModal } from '../../../components/ConfirmModal';

/**
 * 소매처정산
 */
const RetailSettle = () => {
  const nowPage = 'oms_retailSettle'; // filter 저장 2025-01-21
  const router = useRouter();
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<RetailSettleResponseResponse[]>([]); // 합계데이터 만들기
  const gridRef = useRef<AgGridReact>(null);
  const [gridKey, setGridKey] = useState(0);

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm, selectedRetailInCommon, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.selectedRetail,
    s.filterDataList, // filter 저장 2025-01-21
    s.setFilterDataList, // filter 저장 2025-01-21
    s.getFilterData, // filter 저장 2025-01-21
  ]);

  const [getRetailDetail] = useRetailStore((s) => [s.getRetailDetail]);

  const [getTodayOrderDetail, getTodayOrderDetailByPayId, openModal, modalType, closeModal, deleteTodayOrders] = useTodayStore((s) => [
    s.getTodayOrderDetail,
    s.getTodayOrderDetailByPayId,
    s.openModal,
    s.modalType,
    s.closeModal,
    s.deleteTodayOrders,
  ]);

  const [paymentInfo, setPaymentInfo] = usePaymentStore((s) => [s.paymentInfo, s.setPaymentInfo]);

  const datePickerRef = useRef<CustomNewDatePickerRefInterface>(null);

  const [columnDefs] = useState<ColDef<RetailSettleResponseResponse>[]>([
    {
      field: 'workYmd',
      headerName: '영업일자',
      minWidth: 80,
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'tranYmd',
      headerName: '결제일자',
      minWidth: 80,
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        if (params.data?.inoutCd === 'D') {
          return params.value;
        } else {
          return '';
        }
      },
    },
    {
      field: 'chitNo',
      headerName: '전표#',
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    { field: 'sellCnt', headerName: '판매수량', minWidth: 70, maxWidth: 70, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'returnCnt',
      headerName: '반품수량',
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'sellAmt',
      headerName: '판매금액',
      minWidth: 80,
      maxWidth: 80,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'returnAmt',
      headerName: '반품금액',
      minWidth: 80,
      maxWidth: 80,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'baseAmtDc',
      headerName: '단가DC',
      minWidth: 80,
      maxWidth: 80,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'discountAmt',
      headerName: '할인금액',
      minWidth: 80,
      maxWidth: 80,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'vatAmt',
      headerName: '부가세',
      minWidth: 80,
      maxWidth: 80,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'logisAmt',
      headerName: '물류비',
      minWidth: 80,
      maxWidth: 80,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'cashDeposit',
      headerName: '현금입금',
      minWidth: 80,
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      suppressHeaderMenuButton: true,
    },
    {
      field: 'accountDeposit',
      headerName: '통장입금',
      minWidth: 80,
      maxWidth: 80,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'dailyTotal',
      headerName: '당일합계',
      minWidth: 90,
      maxWidth: 90,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'currentBalance',
      headerName: '현잔액',
      minWidth: 90,
      maxWidth: 90,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    { field: 'userNm', headerName: '사용자', minWidth: 120, maxWidth: 120, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'remark', headerName: '비고', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.LEFT },
  ]);

  /** 소매처정산 목록 상태 */
  const [retailSettleList, setRetailSettleList] = useState<RetailSettleResponseResponse[]>([]);
  const [isPreView, setIsPreView] = useState<boolean>(false);

  const [isPrinting, setIsPrinting] = useState(false); // 프린트 여부
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any>(null);

  const [selectedRetail, setSelectedRetail] = useState<RetailResponseDetail | undefined>(
    router.asPath.split('?').length == 2 ? selectedRetailInCommon : undefined,
  ); // 소매처 검색 영역에서 소매처를 선택할 경우 설정되는 상태(그 이외의 경우는 setState 사용 지양)
  const [paymentModal, setPaymentModal] = useState<ModalTypeInterFace>({
    type: 'PAYMENT_CREATE',
    active: false,
  });

  const preFilters = getFilterData(filterDataList, nowPage);
  const [filters, onChangeFilters] = useFilters(
    preFilters || {
      // filter 저장 2025-01-21
      sellerId: 0,
      startDate: dayjs().subtract(1, 'year').format('YYYY-MM-DD'), // -1년
      endDate: dayjs().format('YYYY-MM-DD'),
    },
  );

  /** 소매처정산 페이징 목록 조회 */
  const {
    data: retailSettles,
    isSuccess: isPagingSuccess,
    refetch: fetchRetailSettles,
  } = useQuery(
    ['/orderInfo/retailSettle', filters.sellerId, filters.startDate, filters.endDate],
    () => {
      const params = {
        ...filters,
      };
      return authApi.get('/orderInfo/retailSettle', { params });
    },
    {
      refetchOnMount: true,
      enabled: false,
    },
  );

  useEffect(() => {
    if (preFilters && preFilters.sellerId && preFilters.sellerId > 0) {
      getRetailDetail(preFilters.sellerId).then((response) => {
        if (response.data.resultCode === 200 && response.data.body) {
          setSelectedRetail(response.data.body as RetailResponseDetail);
        }
      });
    }
  }, [preFilters]);

  useEffect(() => {
    if (isPagingSuccess) {
      const { resultCode, body, resultMessage } = retailSettles.data;
      if (resultCode === 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
        setRetailSettleList(body || []);
        if (body && body.length > 0) {
          const {
            totSelllCnt,
            totReturnCnt,
            totSellAmt,
            totReturnAmt,
            totDcAmt,
            totDiscountAmt,
            totVatAmt,
            totLogisAmt,
            totCashAmt,
            totAccountAmt,
            totTodayAmt,
            totNowAmt,
          } = body.reduce(
            (
              acc: {
                totSelllCnt: number;
                totReturnCnt: number;
                totSellAmt: number;
                totReturnAmt: number;
                totDcAmt: number;
                totDiscountAmt: number;
                totLogisAmt: number;
                totVatAmt: number;
                totCashAmt: number;
                totAccountAmt: number;
                totTodayAmt: number;
                totNowAmt: number;
              },
              data: RetailSettleResponseResponse,
            ) => {
              return {
                totSelllCnt: acc.totSelllCnt + (data.sellCnt ? data.sellCnt : 0),
                totSellAmt: acc.totSellAmt + (data.sellAmt ? data.sellAmt : 0),
                totReturnCnt: acc.totReturnCnt + (data.returnCnt ? data.returnCnt : 0),
                totReturnAmt: acc.totReturnAmt + (data.returnAmt ? data.returnAmt : 0),
                totDcAmt: acc.totDcAmt + (data.baseAmtDc ? data.baseAmtDc : 0),
                totDiscountAmt: acc.totDiscountAmt + (data.discountAmt ? data.discountAmt : 0),
                totLogisAmt: acc.totLogisAmt + (data.logisAmt ? data.logisAmt : 0),
                totVatAmt: acc.totVatAmt + (data.vatAmt ? data.vatAmt : 0),
                totCashAmt: acc.totCashAmt + (data.cashDeposit ? data.cashDeposit : 0),
                totAccountAmt: acc.totAccountAmt + (data.accountDeposit ? data.accountDeposit : 0),
                totTodayAmt: acc.totTodayAmt + (data.dailyTotal ? data.dailyTotal : 0),
                totNowAmt: acc.totNowAmt + (data.currentBalance ? data.currentBalance : 0),
              };
            },
            {
              totSelllCnt: 0,
              totReturnCnt: 0,
              totSellAmt: 0,
              totReturnAmt: 0,
              totDcAmt: 0,
              totDiscountAmt: 0,
              totVatAmt: 0,
              totLogisAmt: 0,
              totCashAmt: 0,
              totAccountAmt: 0,
              totTodayAmt: 0,
              totNowAmt: 0,
            }, // 초기값 설정
          );

          setPinnedBottomRowData([
            {
              sellCnt: totSelllCnt,
              returnCnt: totReturnCnt,
              returnAmt: totReturnAmt,
              sellAmt: totSellAmt,
              baseAmtDc: totDcAmt,
              discountAmt: totDiscountAmt,
              vatAmt: totVatAmt,
              logisAmt: totLogisAmt,
              cashDeposit: totCashAmt,
              accountDeposit: totAccountAmt,
              dailyTotal: totTodayAmt,
              currentBalance: totNowAmt,
            },
          ]);
        }

        setTimeout(() => {
          gridRef.current?.api.ensureIndexVisible(body ? body.length - 1 : 0);
          gridRef.current?.api.setFocusedCell(body ? body.length - 1 : 0, 'workYmd');
        }, 0); // 하단 포커스
      } else {
        toastError(resultMessage);
      }
    }
  }, [retailSettles, isPagingSuccess]);

  useEffect(() => {
    if (router.asPath.split('?').length == 2 && router.asPath.split('?')[1] == selectedRetailInCommon?.id?.toString()) {
      /** 경로변수 존재할 시 sellerId 값을 해당 경로로부터 추출하여 할당 */
      onChangeFilters('sellerId', isNaN(Number(router.asPath.split('?')[1])) ? 0 : Number(router.asPath.split('?')[1]));
    }
  }, [onChangeFilters, router.asPath]);

  useEffect(() => {
    setRetailSettleList([]);
    if (filters.sellerId != 0) {
      fetchRetailSettles();
    }
  }, [filters.sellerId, filters.startDate, filters.endDate, fetchRetailSettles]);

  // 프린트 버튼 클릭 이벤트
  const handlePrintBtnClick = () => {
    // if (!isPreView || selectedIds.length === 0) {
    if (!isPreView) {
      // 미리보기 off 또는 선택된 ID 없을 경우
      return;
    }
    setIsPrinting(true);
  };

  /** 주문 삭제하기 */
  const { mutate: deleteTodayOrdersMutation } = useMutation(deleteTodayOrders, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          gridRef.current?.api.deselectAll();
          await fetchRetailSettles();
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const handleSelectionChanged = async (event: SelectionChangedEvent<RetailSettleResponseResponse, any>) => {
    // todo 현재는 그리드 인자를 통해 단일 선택만 가능하므로 해당 코드가 복수의 행을 필요로 할 시 정상 동작하지 않을 수 있음에 유념
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
      console.log('combinedResponse :+_', combinedResponse);
      setSelectedOrderDetail(combinedResponse); // 순서에 맞는 상세 정보 저장
    } catch (error) {
      console.error('API 호출 중 오류 발생: ', error);
    }
  };

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    // 소매처 정보를 제외한 필터 초기화
    if (selectedRetail) {
      onChangeFilters('startDate', dayjs().subtract(1, 'year').format('YYYY-MM-DD')); // -1년
      onChangeFilters('endDate', dayjs().format('YYYY-MM-DD'));
      //onChangeFilters('sellerId', 0); 여기선 셀러id 가 조회 필수 key 이니 초기화 하지 말자.
      //setSelectedRetail({});
    } else {
      toastError('소매처 선택 후 다시 시도하십시요.');
    }
  };

  /** 수정 버튼 클릭할 시 */
  const onModifyBtnClick = () => {
    if (selectedRetail) {
      const selectedNodes = gridRef.current?.api.getSelectedNodes();
      if (selectedNodes && selectedNodes[0]) {
        if (selectedNodes[0].data.inoutCd != 'D') {
          toastError('주문정보는 금일내역에서 수정가능합니다.');
        } else {
          // 결제정보 전역상태 set
          setPaymentInfo({
            id: selectedNodes[0].data.payId,
            payEtc: selectedNodes[0].data.payEtc,
            etcPrintYn: selectedNodes[0].data.payEtcPrintYn,
            cashAmt: selectedNodes[0].data.cashDeposit,
            accountAmt: selectedNodes[0].data.accountDeposit,
            discountAmt: selectedNodes[0].data.discountAmt,
            workYmd: selectedNodes[0].data.workYmd,
            tranYmd: selectedNodes[0].data.tranYmd,
          });
          setPaymentModal({
            type: 'PAYMENT_UPDATE',
            active: true,
          });
        }
      } else {
        toastError('수정할 행 선택 후 다시 시도하십시요.');
      }
    } else {
      toastError('소매처 선택 후 다시 시도하십시요.');
    }
  };

  const deleteConfirm = async () => {
    const targetOrderNodes = gridRef.current?.api.getSelectedNodes() || [];
    const listOfPayId: number[] = [];
    for (let i = 0; i < targetOrderNodes.length; i++) {
      listOfPayId.push(targetOrderNodes[i].data.payId);
    }
    deleteTodayOrdersMutation(listOfPayId);
  };

  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params && params.data.custStatClass) {
      rtnValue = 'ag-grid-' + params.data.custStatClass;
    }
    if (params && params.data.sellCnt === 0 && params.data.sellAmt === 0) {
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

  useEffect(() => {
    setGridKey((prev) => prev + 1);
  }, [pinnedBottomRowData]);

  return (
    <>
      <Title
        title={upMenuNm && menuNm ? `${menuNm}` : ''}
        reset={reset}
        search={() => {
          if (selectedRetail) {
            fetchRetailSettles();
          } else {
            toastError('소매처 선택 후 다시 시도하십시요.');
          }
        }}
        filters={filters}
      />
      <Search className="type_2">
        <CustomNewDatePicker
          type={'range'}
          title={'기간'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onChange={onChangeFilters}
          onEnter={() => {
            if (filters.sellerId == undefined || filters.sellerId == 0) {
              toastError('소매처 선택 후 다시 시도하십시요.');
            }
          }}
          filters={filters}
          defaultType={'year'}
          //selectType={'type'} //defaultType 과 selectType 이 동일하면 동일한 한가지면 펼침메뉴에 나타난다.
          ref={datePickerRef}
        />
        <Search.RetailBar
          title={'소매처'}
          name={'retailNm'}
          placeholder={'소매처 검색'}
          allowNewRetail={false}
          selectedRetail={selectedRetail} // 경로변수로 소매처 id 가 주어질 시 소매처 전역 상태를 참조함
          onRetailSelected={(retailInfo) => {
            /** 본 영역에서만 소매처 상태 및 sellerId 필터 값이 변경됨 */
            setSelectedRetail(retailInfo);
            if (retailInfo?.id) {
              onChangeFilters('sellerId', retailInfo.id);
            }
          }}
          onRetailDeleted={() => {
            setSelectedRetail({});
            setRetailSettleList([]);
            onChangeFilters('sellerId', 0);
          }}
          emptyMessage={'소매처를 검색해 주세요'}
        />
      </Search>
      <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
        <TableHeader count={retailSettleList.length} gridRef={gridRef} isPaging={false}>
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
              <TunedGrid<RetailSettleResponseResponse>
                ref={gridRef}
                key={gridKey} // 👈 key 추가
                rowSelection={'single'}
                rowData={retailSettleList}
                columnDefs={columnDefs}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                onSelectionChanged={handleSelectionChanged} // 선택 변경시
                singleClickEdit={true}
                suppressRowClickSelection={false}
                getRowClass={getRowClass}
                pinnedBottomRowData={pinnedBottomRowData} // 하단에 고정된 합계 행
                className={'default'}
              />
              <div className="btnArea">
                <CustomShortcutButton
                  className="btn"
                  title="입금하기"
                  shortcut={COMMON_SHORTCUTS.gridUnder1}
                  onClick={() => {
                    if (selectedRetail) {
                      setPaymentModal({
                        type: 'PAYMENT_CREATE',
                        active: true,
                      });
                    } else {
                      toastError('소매처 선택 후 다시 시도하십시요.');
                    }
                  }}
                >
                  입금하기
                </CustomShortcutButton>
                <CustomShortcutButton className="btn" title="수정하기" onClick={onModifyBtnClick} shortcut={COMMON_SHORTCUTS.gridUnder2}>
                  수정하기
                </CustomShortcutButton>
                <CustomShortcutButton
                  className="btn"
                  title="삭제하기"
                  shortcut={COMMON_SHORTCUTS.gridUnder3}
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
              </div>
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
          if (modalType.type == 'PAYMENT_CREATE') {
            toastSuccess('저장되었습니다.');
            setPaymentInfo({ workYmd: paymentInfo.workYmd });
          } else if (modalType.type == 'PAYMENT_UPDATE') {
            toastSuccess('수정되었습니다.');
            setPaymentInfo({ workYmd: paymentInfo.workYmd });
          }
          fetchRetailSettles();
        }}
        onClose={(closedBy) => {
          setPaymentModal((prevState) => {
            return { ...prevState, active: false };
          });
          if (closedBy?.type == 'PAYMENT_UPDATE') {
            // 업데이트 모달 닫을 시 행할 동작을 정의
            setPaymentInfo({});
          }
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
    </>
  );
};

export default RetailSettle;
