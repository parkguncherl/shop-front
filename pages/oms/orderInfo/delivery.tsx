/**
 * @file pages/oms/orderInfo/delivery.tsx
 * @description OMS > 출고현황
 * @copyright 2025
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ColDef, RowClassParams, SelectionChangedEvent } from 'ag-grid-community';
import useFilters from '../../../hooks/useFilters';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { Search, TableHeader, Title, toastError } from '../../../components';
import { Placeholder } from '../../../libs/const';
import { AgGridReact } from 'ag-grid-react';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { useCommonStore } from '../../../stores';
import { useAgGridApi } from '../../../hooks';
import dayjs from 'dayjs';
import { useDeliveryStore } from '../../../stores/useDeliveryStore';
import TunedGrid from '../../../components/grid/TunedGrid';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { DeliveryDet } from '../../../components/popup/orderInfo/DeliveryDet';
import { DeliveryResponsePaging, DeliveryResponseTradeDateAsStartDate, OrderExtendedResponse } from '../../../generated';
import { DeliveryBoryuModPop } from '../../../components/popup/orderInfo/DeliveryBoryuModPop';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import { Utils } from '../../../libs/utils';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';
import PrintLayout from '../../../components/print/PrintLayout';
import { useOrderStore } from '../../../stores/useOrderStore';
import { usePaymentStore } from '../../../stores/usePaymentStore';
import { useTodayStore } from '../../../stores/useTodayStore';
import { WrongDeliveryReqPop } from '../../../components/popup/orderInfo/WrongDeliveryReqPop';
import { useSearchParams } from 'next/navigation';

const Delivery = () => {
  /** store */
  const nowPage = 'oms_delivery'; // filter 저장 2025-01-21
  const { onGridReady } = useAgGridApi();
  const [minStartDate, setMinStartDate] = useState<string>('');
  const searchParams = useSearchParams();
  const jobStatCd = searchParams.get('jobStatCd');
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<DeliveryResponsePaging[]>([]); // 예솔수정 하단합계 추가

  /** 전역상태 */
  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData, setSelectedRetail] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList, // filter 저장 2025-01-21
    s.setFilterDataList, // filter 저장 2025-01-21
    s.getFilterData, // filter 저장 2025-01-21
    s.setSelectedRetail,
  ]);
  const [paging, setPaging, setSelectedPagingElement, modalType, openModal, closeModal, selectTradeDateAsStartDate] = useDeliveryStore((s) => [
    s.paging,
    s.setPaging,
    s.setSelectedPagingElement,
    s.modalType,
    s.openModal,
    s.closeModal,
    s.selectTradeDateAsStartDate,
  ]);
  const [setOrder, setOrderDetList, selectExtendedOrder] = useOrderStore((s) => [s.setOrder, s.setOrderDetList, s.selectExtendedOrder]);
  const [setPaymentInfo] = usePaymentStore((s) => [s.setPaymentInfo]);

  const filterInit = {
    skuNm: '',
    sellerNm: '',
    startDate: '',
    jobStatCd: '',
    endDate: dayjs().format('YYYY-MM-DD'),
  };
  /** 필터 */
  const [filters, onChangeFilters, dispatch] = useFilters(getFilterData(filterDataList, nowPage) || filterInit);

  const [isPreView, setIsPreView] = useState<boolean>(true);
  const [selectedDetail, setSelectedDetail] = useState<any>([]); // 전표상세
  const [isPrinting, setIsPrinting] = useState(false); // 프린트 여부

  const [getTodayOrderDetail, getTodayOrderDetailByPayId, getStoreReqById] = useTodayStore((s) => [
    s.getTodayOrderDetail,
    s.getTodayOrderDetailByPayId,
    s.getStoreReqById,
  ]);

  const reset = () => {
    onChangeFilters('skuNm', '');
    onChangeFilters('sellerNm', '');
    onChangeFilters('jobStatCd', '');
    onChangeFilters('startDate', minStartDate ? minStartDate : dayjs().format('YYYY-MM-DD')); // 처리전 min 일자가 있으면 가져온다.
    onChangeFilters('endDate', dayjs().format('YYYY-MM-DD'));
  };

  const [deliveryData, setDeliveryData] = useState([]); // 메인 그리드 데이터

  /** 그리드 참조 */
  const gridRef = useRef<AgGridReact>(null);

  /** 검색 */
  const search = async () => {
    await onSearch();
  };
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    await fetchDeliveryList();
  };

  /** 컬럼 헤더 */
  const columnDefs = useMemo<ColDef<DeliveryResponsePaging>[]>(
    () => [
      { field: 'no', headerName: 'No.', minWidth: 50, maxWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
      { field: 'workYmd', headerName: '영업일', minWidth: 90, maxWidth: 90, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
      { field: 'chitNo', headerName: '전표#', minWidth: 70, maxWidth: 70, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'sellerNm', headerName: '소매처', minWidth: 100, maxWidth: 100, cellStyle: GridSetting.CellStyle.LEFT, suppressHeaderMenuButton: true },
      { field: 'deliverySeq', headerName: '출고#', minWidth: 70, maxWidth: 70, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      {
        field: 'deliveryStat',
        headerName: '출고상태',
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'jobTypeNm',
        headerName: '거래유형',
        filter: true,
        minWidth: 120,
        maxWidth: 120,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        suppressKeyboardEvent: (params) => {
          const { event, node } = params;
          const keyboardEvent = event as KeyboardEvent;

          // 첫 행에서 ↑ 누를 때 차단
          if (keyboardEvent.key === 'ArrowUp' && node.rowIndex === 0) {
            return true; // 기본 동작 막음 (헤더로 이동 안 됨)
          }
          return false;
        },
      },
      {
        field: 'skuCnt',
        headerName: 'SKU',
        minWidth: 70,
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'deliveryCnt',
        headerName: '출고수량',
        minWidth: 70,
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'inventoryYn',
        headerName: '재고',
        filter: true,
        minWidth: 70,
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      { field: 'deliveryEtc', headerName: '비고', minWidth: 200, cellStyle: GridSetting.CellStyle.LEFT, suppressHeaderMenuButton: true },
    ],
    [],
  );

  const {
    data: deliveryList,
    isLoading: isDeliveryList,
    isSuccess: isPagingSuccess,
    refetch: fetchDeliveryList,
  } = useQuery(
    ['/orderInfo/delivery/paging', paging.curPage, paging.pageRowCount, filters.startDate, filters.endDate],
    () =>
      authApi.get('/orderInfo/delivery/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
    { refetchOnMount: false },
  );

  useEffect(() => {
    if (isPagingSuccess) {
      const { resultCode, body, resultMessage } = deliveryList.data;
      if (resultCode === 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
        setPaging(body.paging);
        setDeliveryData(body.rows || []);
        setTimeout(() => {
          gridRef.current?.api.ensureIndexVisible(
            body.rows ? (body.rows.length > body.paging.pageRowCount ? body.paging.pageRowCount - 1 : body.rows.length - 1) : 0,
          );
          gridRef.current?.api.setFocusedCell(
            body.rows ? (body.rows.length > body.paging.pageRowCount ? body.paging.pageRowCount - 1 : body.rows.length - 1) : 0,
            'sellerNm',
          );
        }, 0); // 하단 포커스
        /** 예솔수정
         * 하단합계 추가 */
        if (body.rows && body.rows.length > 0) {
          const { deliveryCount } = body.rows.reduce(
            (
              acc: {
                deliveryCount: number; // 데이터 유형
              },
              data: DeliveryResponsePaging,
            ) => {
              return {
                deliveryCount: acc.deliveryCount + (data.deliveryCnt ? data.deliveryCnt : 0), // 합계 구하기
              };
            },
            {
              deliveryCount: 0,
            }, // 초기값 설정
          );

          setPinnedBottomRowData([
            {
              deliveryCnt: deliveryCount,
            },
          ]);
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [deliveryList, isPagingSuccess, setPaging]);

  useEffect(() => {
    // 넘어온 파라메터가 있으면 초기데이터를 셑팅한다.
    if (jobStatCd) {
      onChangeFilters('jobStatCd', jobStatCd);
    }

    selectTradeDateAsStartDate().then((result) => {
      const { resultCode, body, resultMessage } = result.data;
      if (resultCode === 200) {
        const startDate = (body as DeliveryResponseTradeDateAsStartDate).startDate;
        if (startDate) {
          if (!filters.startDate) {
            onChangeFilters('startDate', startDate);
          }
          setMinStartDate(startDate);
        }
      } else {
        toastError(resultMessage);
      }
    });
  }, []); // 최초만 실행해야 한다.

  // 프린트 버튼 클릭 이벤트
  const handlePrintBtnClick = () => {
    if (!isPreView) {
      return;
    }
    setIsPrinting(true);
  };

  const handleSelectionChanged = async (event: SelectionChangedEvent<DeliveryResponsePaging, any>) => {
    // todo 현재는 그리드 인자를 통해 단일 선택만 가능하므로 해당 코드가 복수의 행을 필요로 할 시 정상 동작하지 않을 수 있음에 유념
    // 선택된 모든 행을 가져옴
    console.log('event', event);
    const selectedNode = gridRef.current?.api.getSelectedNodes()[0];

    if (selectedNode) {
      const selectedNodes = [selectedNode];

      // 각 항목을 객체 형태로 저장하여 orderId와 payId 구분
      const items = selectedNodes?.map((node) => (node.data.orderId ? { orderId: node.data.orderId } : { payId: node.data.payId })) || [];
      const jobIems = selectedNodes?.map((node) => ({ jobId: node.data.jobId })) || [];

      try {
        const orderIds = items.filter((item) => item.orderId).map((item) => item.orderId);
        const payIds = items.filter((item) => item.payId).map((item) => item.payId);
        const jobIds = jobIems.filter((item) => item.jobId).map((item) => Number(item.jobId));
        // 각 ID와 payId에 대해 API 호출
        // 매장분요청
        if (selectedNode.data.jobType === 'C') {
          const storeReqResponse = await getStoreReqById(jobIds);
          console.log('storeReqResponse ==>', storeReqResponse);

          // 응답 데이터를 원래 순서에 맞춰 매핑
          const combinedResponse = jobIems.map((item) => {
            if (item.jobId && (storeReqResponse?.data?.body as any[])) {
              const matchedOrder = (storeReqResponse.data.body as any[]).find((detail: { jobId: number }) => detail.jobId === item.jobId);
              console.log('item.jobId [' + item.jobId + ']matchedOrder ==>', matchedOrder);
              return (
                matchedOrder || {
                  orderId: item.jobId,
                  error: 'No details found 1',
                }
              );
            } else {
              return {
                error: 'No details found 2',
              };
            }
          });
          console.log('storeReqResponse combinedResponse :+_ ==>', combinedResponse);
          setSelectedDetail(combinedResponse); // 순서에 맞는 상세 정보 저장
        } else {
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
          setSelectedDetail(combinedResponse); // 순서에 맞는 상세 정보 저장
        }
      } catch (error) {
        console.error('API 호출 중 오류 발생: ', error);
      }
    }
  };

  useEffect(() => {
    search();
  }, [filters.jobStatCd]);

  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params && params.data.deliveryStat && params.data.deliveryStat.startsWith('출고보류(요)')) {
      rtnValue = rtnValue ? rtnValue + ' ag-grid-deposit' : 'ag-grid-deposit';
    } else if (params.node.rowPinned === 'bottom') {
      // 합계 행 스타일링
      rtnValue = rtnValue + 'ag-grid-pinned-row';
    }
    return rtnValue;
  }, []);

  return (
    <>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} search={search} filters={filters} reset={reset} />
      <Search className="type_2">
        <CustomNewDatePicker
          type={'range'}
          title={'기간'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onChange={onChangeFilters}
          filters={filters}
          defaultType={'type'}
          maxDays={31}
        />
        <Search.Input
          title={'소매처'}
          name={'sellerNm'}
          placeholder={Placeholder.Default}
          value={filters.sellerNm}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />
        <Search.Input
          title={'상품명'}
          name={'skuNm'}
          placeholder={Placeholder.Default}
          value={filters.skuNm}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />
        <Search.DropDown
          title={'출고구분'}
          name={'jobStatCd'}
          value={filters.jobStatCd}
          onChange={onChangeFilters}
          defaultOptions={[
            { key: '1', value: '1', label: '요청' },
            { key: '2', value: '5', label: '완료' },
            { key: '3', value: '9', label: '출고보류' },
            { key: '4', value: '8', label: '오출고' },
          ]}
        />
      </Search>
      <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search} gridRef={gridRef} isPaging={false}>
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

        <div className="gridBox">
          <div className="tblPreview">
            <TunedGrid<DeliveryResponsePaging>
              onGridReady={onGridReady}
              rowData={deliveryData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pinnedBottomRowData={pinnedBottomRowData} // 예솔수정 하단합계 추가
              paginationPageSize={paging.pageRowCount}
              rowSelection={'single'}
              onRowDoubleClicked={(e) => {
                if (e.data) {
                  openModal('DET');
                  setSelectedPagingElement(e.data);
                }
              }}
              onSelectionChanged={handleSelectionChanged}
              ref={gridRef}
              suppressRowClickSelection={false}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              className={'default'}
              getRowClass={getRowClass}
            />
            <div className="btnArea">
              <CustomShortcutButton
                className="btn"
                title="보류수정"
                shortcut={COMMON_SHORTCUTS.alt1}
                onClick={() => {
                  if (gridRef.current?.api.getSelectedNodes()[0] && gridRef.current?.api.getSelectedNodes()[0].data) {
                    const selectedRowData = gridRef.current?.api.getSelectedNodes()[0].data as DeliveryResponsePaging;
                    if (selectedRowData.deliveryStatCd == '9') {
                      //setSelectedPagingElement(gridRef.current.api.getSelectedNodes()[0].data);
                      //openModal('REG_WRONG');
                      /** 10190 '09' -> 출고보류 */
                      if (selectedRowData.orderId) {
                        console.log(selectedRowData.orderId);
                        selectExtendedOrder(selectedRowData.orderId).then((result) => {
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
                      } else {
                        console.error('제시된 행의 데이터에서 orderId 를 찾을 수 없음');
                      }
                    } else {
                      toastError('출고보류 상태의 행을 선택하십시요.');
                    }
                  }
                }}
              >
                보류수정
              </CustomShortcutButton>
              <CustomShortcutButton
                className="btn"
                title="오출고 등록"
                shortcut={COMMON_SHORTCUTS.alt2}
                onClick={() => {
                  if (gridRef.current?.api.getSelectedNodes()[0] && gridRef.current?.api.getSelectedNodes()[0].data) {
                    console.log('gridRef.current.api.getSelectedNodes()[0].data ==>', gridRef.current.api.getSelectedNodes()[0].data);
                    if (gridRef.current.api.getSelectedNodes()[0].data.deliveryStatCd != '5') {
                      toastError('오출고등록은 출고 완료 상태에서 등록 가능합니다.');
                    } else {
                      setSelectedPagingElement(gridRef.current.api.getSelectedNodes()[0].data);
                      openModal('REG_WRONG');
                    }
                  } else {
                    toastError('오출고 등록을 행할 작업을 선택하십시요.');
                  }
                }}
              >
                오출고 등록
              </CustomShortcutButton>
            </div>
          </div>
          <div>
            {isPreView ? (
              <div className="previewBox">
                {selectedDetail ? (
                  <PrintLayout selectedDetail={selectedDetail} isPrinting={isPrinting} setIsPrinting={setIsPrinting} type={'default'} />
                ) : (
                  <div className="noRowsOverlayBox">주문을 선택하면 상세 정보가 표시됩니다.</div>
                )}
              </div>
            ) : (
              ''
            )}
          </div>
        </div>
      </div>
      {modalType.type === 'DET' && modalType.active && <DeliveryDet />}
      {modalType.type === 'MOD_BORYU' && modalType.active && <DeliveryBoryuModPop />}
      {modalType.type === 'REG_WRONG' && modalType.active && <WrongDeliveryReqPop />}
    </>
  );
};

export default Delivery;
