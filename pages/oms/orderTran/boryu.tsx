import { Search, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import { AgGridReact } from 'ag-grid-react';
import { DeliveryResponsePaging, OrderExtendedResponse, OrderResponsePageResponse, PartnerCodeDropDown } from '../../../generated';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore, usePartnerCodeStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { ColDef, RowClassParams, SelectionChangedEvent } from 'ag-grid-community';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { useOrderStore } from '../../../stores/useOrderStore';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useRouter } from 'next/router';
import PrintLayout from '../../../components/print/PrintLayout';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { usePaymentStore } from '../../../stores/usePaymentStore';
import { Utils } from '../../../libs/utils';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import TunedGrid from '../../../components/grid/TunedGrid';
import { PARTNER_CODE } from '../../../libs/const';
import { TodayCategorySetPop } from '../../../components/popup/today/TodayCategorySetPop';
import { useTodayStore } from '../../../stores/useTodayStore';

const Boryu = () => {
  const nowPage = 'oms_boryu'; // filter 저장 2025-01-21
  const router = useRouter();
  // AG-Grid API 초기화
  const { onGridReady } = useAgGridApi();

  // 예솔수정 하단합계
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<OrderResponsePageResponse[]>([]); // 예솔수정 하단합계 추가

  // 공통 스토어에서 메뉴 정보 가져오기
  const { upMenuNm, menuNm, selectedRetail, setSelectedRetail, filterDataList, setFilterDataList, getFilterData } = useCommonStore();

  /** 주문관리 스토어 - State */
  const [
    orderModalType,
    openOrderModal,
    closeOrderModal,
    setOrder,
    updateOrder,
    deleteOrders,
    orderPrint,
    selectExtendedOrder,
    setOrderDetList,
    updateOrderDetEtc,
  ] = useOrderStore((s) => [
    s.modalType,
    s.openModal,
    s.closeModal,
    s.setOrder,
    s.updateOrder,
    s.deleteOrders,
    s.orderPrint,
    s.selectExtendedOrder,
    s.setOrderDetList,
    s.updateOrderDetEtc,
  ]);

  const [todayModalType, todayOpenModal, closeTodayModal] = useTodayStore((s) => [s.modalType, s.openModal, s.closeModal]);

  const [setPaymentInfo, updateCustStatus] = usePaymentStore((s) => [s.setPaymentInfo, s.updateCustStatus]);
  const [selectPartnerCodeDropdown] = usePartnerCodeStore((s) => [s.selectPartnerCodeDropdown]);

  const initialFilters = {
    sellerId: 0,
    sellerNm: '',
    skuNm: '',
    type: '',
  };

  const [filters, onChangeFilters] = useFilters(getFilterData(filterDataList, nowPage) || initialFilters);

  const [boryuOrderList, setBoryuOrderList] = useState<OrderResponsePageResponse[]>([]);

  const [selectedDetail, setSelectedDetail] = useState([]);
  const [gubunCodeList, setGubunCodeList] = useState<PartnerCodeDropDown[]>([]);

  /** 하위코드 목록 조회 */
  const { data: partnerCodeList, isSuccess: isCustStateSuccess } = useQuery(['/partnerCode/dropdown'], () =>
    selectPartnerCodeDropdown(PARTNER_CODE.boryuCategories),
  );

  const { mutate: updateOrderDetEtcMutate } = useMutation(updateOrderDetEtc, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('비고가 변경되었습니다.');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  useEffect(() => {
    setGubunCodeList(partnerCodeList?.data.body ?? []);
  }, [isCustStateSuccess, partnerCodeList]);

  // 컬럼 정의
  const columnDefs = useMemo<ColDef<OrderResponsePageResponse>[]>(
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
        width: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        editable: true,
        onCellValueChanged: (event) => {
          console.log(event.data);
        },
      },
      {
        field: 'creTm',
        headerName: '등록일시',
        minWidth: 110,
        maxWidth: 110,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        valueFormatter: (params) => {
          if (params.value) {
            return params.value.substring(0, 16); // "2025-05-09 02:57"
          }
          return '';
        },
      },
      {
        field: 'resvYmd',
        headerName: '예약일자',
        minWidth: 90,
        maxWidth: 90,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        valueParser: (params) => {
          /** 그리드 자체 검증으로 인하여 날짜 형식(yyyy-mm-dd) 이외의 값을 입력 시 값이 반환되지 않음, 해당 정의를 통하여 기본 검증 동작 무력화 */
          return params.newValue;
        },
        cellEditor: 'agTextCellEditor',
        editable: true,
        onCellValueChanged: (event) => {
          const changedValue = event.newValue;
          console.log(changedValue);
          if (RegExp(/^\d{4}(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[01])$/).test(changedValue)) {
            setBoryuOrderList((prevState) => {
              for (let i = 0; i < prevState.length; i++) {
                if (prevState[i].no == event.data.no) {
                  // 입력값 반영
                  prevState[i] = { ...prevState[i], resvYmd: changedValue.slice(0, 4) + '-' + changedValue.slice(4, 6) + '-' + changedValue.slice(6, 8) };
                }
              }
              return [...prevState];
            });
            updateOrder({ id: event.data.id, resvYmd: changedValue.slice(0, 4) + '-' + changedValue.slice(4, 6) + '-' + changedValue.slice(6, 8) }).then(
              (result) => {
                const { resultCode, resultMessage } = result.data;
                if (resultCode == 200) {
                  toastSuccess(event.oldValue ? '예약일자가 지정되었습니다.' : '예약일자가 변경되었습니다.');
                } else {
                  toastError(event.oldValue ? '예약일자가 지정 도중 문제가 발생하였습니다.' : '예약일자 변경 도중 문제가 발생하였습니다.');
                  console.error(resultMessage);
                  setBoryuOrderList((prevState) => {
                    for (let i = 0; i < prevState.length; i++) {
                      if (prevState[i].no == event.data.no) {
                        // 입력값 원상복귀
                        prevState[i] = { ...prevState[i], resvYmd: event.oldValue };
                      }
                    }
                    return [...prevState];
                  });
                }
              },
            );
          } else {
            toastError('유효한 날짜 값을 입력하십시요.(4자리 연도, 2자리 월일)');
            setBoryuOrderList((prevState) => {
              for (let i = 0; i < prevState.length; i++) {
                if (prevState[i].no == event.data.no) {
                  // 입력값 원상복귀
                  prevState[i] = { ...prevState[i], resvYmd: event.oldValue };
                }
              }
              return [...prevState];
            });
          }
        },
      },
      {
        field: 'custStatCd',
        headerName: '유형',
        filter: true,
        minWidth: 85,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
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
        onCellValueChanged: (params) => {
          if (params.newValue != '' && params.oldValue != params.newValue) {
            updateCustStatus({ payId: params.data.payId, custStatCd: params.newValue }).then((result) => {
              const { resultCode, resultMessage } = result.data;
              if (resultCode == 200) {
                toastSuccess('수정되었습니다.');
              } else {
                toastError(resultMessage || '수정 과정에서 문제가 발생하였습니다.');
                console.error(resultMessage);
              }
              fetchBoryuOrders();
            });
          }
        },
        valueFormatter: (params) => {
          const option = gubunCodeList.find((option) => option.codeCd === params.value);
          return option ? option.codeNm : params.value;
        },
      },
      { field: 'sellerNm', headerName: '소매처', minWidth: 85, suppressHeaderMenuButton: true },
      {
        field: 'totOrderAmt',
        headerName: '판매금액',
        minWidth: 85,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'totBackAmt',
        headerName: '반품금액',
        minWidth: 85,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'totDcAmt',
        headerName: '단가DC',
        minWidth: 85,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'discountAmt',
        headerName: '할인금액',
        minWidth: 85,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'logisAmt',
        headerName: '물류비',
        minWidth: 85,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'cashAmt',
        headerName: '현금입금',
        minWidth: 85,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'accountAmt',
        headerName: '통장입금',
        minWidth: 85,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'payByCredit',
        headerName: '당일합계',
        minWidth: 85,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'updUser',
        headerName: '사용자',
        minWidth: 85,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'orderEtc',
        headerName: '비고',
        minWidth: 100,
        maxWidth: 100,
        editable: true,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.LEFT,
      },
    ],
    [gubunCodeList, updateCustStatus, updateOrder],
  );

  const BoryuGridRef = useRef<AgGridReact>(null);

  /** 보류주문 페이징 목록 조회 */
  const {
    data: boryuOrders,
    isLoading: isLoading,
    isSuccess: isLoadingSuccess,
    refetch: fetchBoryuOrders,
  } = useQuery(
    ['/order', filters.sellerId],
    () =>
      authApi.get('/order', {
        params: {
          holdYn: 'Y',
          ...filters,
        },
      }),
    {
      enabled: true,
    },
  );

  useEffect(() => {
    if (isLoadingSuccess) {
      const { resultCode, body, resultMessage } = boryuOrders.data;
      if (resultCode === 200) {
        setBoryuOrderList(body || []);
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
        //setPaging(body?.paging);
        /*setTimeout(() => {
          BoryuGridRef.current?.api.ensureIndexVisible(
            body.rows ? (body.rows.length > body.paging.pageRowCount ? body.paging.pageRowCount - 1 : body.rows.length - 1) : 0,
          );
          BoryuGridRef.current?.api.setFocusedCell(
            body.rows ? (body.rows.length > body.paging.pageRowCount ? body.paging.pageRowCount - 1 : body.rows.length - 1) : 0,
            'sellerNm',
          );
        }, 0); // 하단 포커스*/

        /**
         * 예솔수정 하단합계 */
        if (body && body.length > 0) {
          const { totOrderAmount, totBackAmount, totDcAmount, payByCreditall } = body.reduce(
            (
              acc: {
                totOrderAmount: number;
                totBackAmount: number;
                totDcAmount: number;
                payByCreditall: number;
              },
              data: OrderResponsePageResponse,
            ) => {
              return {
                totOrderAmount: acc.totOrderAmount + (data.totOrderAmt ? data.totOrderAmt : 0),
                totBackAmount: acc.totBackAmount + (data.totBackAmt ? data.totBackAmt : 0),
                totDcAmount: acc.totDcAmount + (data.totDcAmt ? data.totDcAmt : 0),
                payByCreditall: acc.payByCreditall + (data.payByCredit ? data.payByCredit : 0),
              };
            },
            {
              totOrderAmount: 0,
              totBackAmount: 0,
              totDcAmount: 0,
              payByCreditall: 0,
            }, // 초기값 설정
          );

          setPinnedBottomRowData([
            {
              totOrderAmt: totOrderAmount,
              totBackAmt: totBackAmount,
              totDcAmt: totDcAmount,
              payByCredit: payByCreditall,
            },
          ]);
        }
      } else {
        toastError('페이지 조회 도중 문제가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [boryuOrders, isLoadingSuccess]);

  useEffect(() => {
    if (router.asPath.split('?').length == 2 && router.asPath.split('?')[1] == selectedRetail?.id?.toString() && !isNaN(Number(router.asPath.split('?')[1]))) {
      // 경로변수가 존재하며, 경로변수의 값이 전역 상태 소매처의 id 와 같으며, 값이 nan 이 아닐 경우
      onChangeFilters('sellerId', selectedRetail.id);
      onChangeFilters('sellerNm', selectedRetail.sellerNm || ''); // 소매처명 필터도 이에 맞추어 동기화
    }
  }, [onChangeFilters, router.asPath]);

  /** 주문 삭제하기 */
  const { mutate: deleteBoryuOrders } = useMutation(deleteOrders, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          BoryuGridRef.current?.api.deselectAll();
          fetchBoryuOrders();
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  // 검색 버튼 클릭 또는 엔터 키 입력 시 실행
  const onSearch = async () => {
    onChangeFilters('sellerId', 0);
    await fetchBoryuOrders();
  };

  // 초기화 버튼 클릭 시 실행

  // 미리보기 버튼 클릭 이벤트 핸들러
  const [isPreView, setIsPreView] = useState<boolean>(false);
  const handlePreviewBtn = () => {
    if (selectedOrderIds.length > 0) {
      fetchDetails();
    }
    setIsPreView(!isPreView);
  };

  /** 프린트 관련 */
  // 프린트 버튼 클릭 이벤트
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const handlePrintBtnClick = () => {
    if (!isPreView) {
      // 미리보기 off 또는 선택된 ID 없을 경우
      return;
    }
    setIsPrinting(true);
  };
  const onSelectionChanged = (event: SelectionChangedEvent) => {
    // 선택된 노드 가져오기
    const selectedNodes = event.api.getSelectedNodes();
    // 선택된 노드에서 orderId만 추출하고 중복 제거
    const selectedOrderIds = Array.from(new Set(selectedNodes.map((node) => node.data.id).filter((id) => id !== undefined)));
    setSelectedOrderIds(selectedOrderIds);
    console.log('선택된 오더아이디', selectedOrderIds);
  };

  const orderProcessFn = (isReOrder: boolean) => {
    const targetOrderNodes = BoryuGridRef.current?.api.getSelectedNodes() || [];
    if (targetOrderNodes.length == 0) {
      toastError('변경하고자 하는 행을 하나 선택하십시요');
    } else if (targetOrderNodes.length > 1) {
      toastError('단일 행 수정만 가능합니다');
    } else {
      // 수정을 위한 모달은 orderReg 영역에서 해당 전역 상태 변화를 인지함으로서 출력함
      /** 주문(결제거래) */
      if (targetOrderNodes[0].data.id) {
        selectExtendedOrder(targetOrderNodes[0].data.id).then((result) => {
          const { resultCode, body, resultMessage } = result.data;
          if (resultCode === 200 && body) {
            console.log('orderInfo');
            const respondedBody: OrderExtendedResponse = body;
            if (isReOrder) {
              setOrder({ ...(respondedBody.order ?? {}), holdYn: 'N' }); // 주문으로 만들때는 보류값을 N 으로
              setSelectedRetail(respondedBody.retailInfo);
              setPaymentInfo({ ...(respondedBody.payResponse ?? {}), inoutCd: 'O' }); // 주문으로 만든다.
            }
            setOrderDetList(respondedBody.detList || [{}]);
          } else {
            toastError(resultMessage);
          }
        });
      } else {
        console.error('주문 정보를 찾을 수 없음');
      }
    }
  };

  const fetchDetails = useCallback(async () => {
    // orderIds가 변경될 때마다 이를 기반으로 데이터 fetch
    if (selectedOrderIds.length > 0) {
      setPrintData;
    }
  }, [selectedOrderIds]);

  const setPrintData = (clickedOrderId?: number) => {
    if (clickedOrderId && clickedOrderId > 0) {
      const arrayOrderId = [clickedOrderId];
      const detailListPromises = arrayOrderId.map((orderId) => orderPrint(orderId, isPreView));
      Promise.all(detailListPromises).then((results) => {
        // results는 각 API 응답 배열
        const details: any = results.flatMap((res) => res?.data?.body || []);
        setSelectedDetail(details); // 상태 업데이트
      });
    } else {
      const detailListPromises = selectedOrderIds.map((orderId) => orderPrint(orderId, isPreView));
      Promise.all(detailListPromises).then((results) => {
        // results는 각 API 응답 배열
        const details: any = results.flatMap((res) => res?.data?.body || []);
        setSelectedDetail(details); // 상태 업데이트
      });
    }
  };

  // 선택된 노드나 optionType, selectedOrderIds가 변경될 때마다 데이터를 다시 가져오도록 설정
  useEffect(() => {
    console.log('선택된 오더아이디 2==>', selectedOrderIds);
    fetchDetails();
  }, [selectedOrderIds]);

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    // 필터 초기화
    //onFiltersReset(); //먹지 않아서 강제로 셑팅
    onChangeFilters('sellerNm', '');
    onChangeFilters('skuNm', '');
    onChangeFilters('sellerId', 0);
    /*setPaging({
      curPage: 1,
    });*/
  };

  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params && params.data.custStatClass) {
      rtnValue = 'ag-grid-' + params.data.custStatClass;
    } else if (params.node.rowPinned === 'bottom') {
      // 예솔수정 합계 행 스타일링
      rtnValue = rtnValue + 'ag-grid-pinned-row';
    }
    return rtnValue;
  }, []);

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} search={onSearch} filters={filters} reset={reset} />
      <Search className="type_2">
        <Search.Input
          title={'소매처'}
          name={'sellerNm'}
          placeholder={'소매처 검색'}
          value={filters.sellerNm}
          onChange={onChangeFilters}
          onEnter={onSearch}
          filters={filters}
        />
        <Search.Input
          title={'상품명'}
          name={'skuNm'}
          placeholder={'상품명 검색'}
          value={filters.skuNm}
          onChange={onChangeFilters}
          onEnter={onSearch}
          filters={filters}
        />
        {/*<Search.DropDown
          title={'유형'}
          name={'type'}
          value={filters.type}
          onChange={onChangeFilters}
          defaultOptions={[
            { value: '9', label: '판매' },
            { value: '1', label: '반품' },
            { value: 'MISONG', label: '미송' },
            { value: 'SAMPLE', label: '샘플' },
            { value: 'MICHUL', label: '미출' },
          ]}
        />*/}
      </Search>
      <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
        <TableHeader count={boryuOrderList.length} search={onSearch} isPaging={false}>
          <CustomShortcutButton className={`btn ${isPreView ? 'on' : ''}`} title="미리보기" onClick={handlePreviewBtn} shortcut={COMMON_SHORTCUTS.alt1}>
            미리보기
          </CustomShortcutButton>
          <CustomShortcutButton className="btn icoPrint" title="프린트" onClick={handlePrintBtnClick} shortcut={COMMON_SHORTCUTS.print}>
            프린트
          </CustomShortcutButton>
        </TableHeader>
        <div className="gridBox">
          <div className="tblPreview">
            <TunedGrid
              onGridReady={onGridReady}
              loading={isLoading}
              rowData={boryuOrderList}
              columnDefs={columnDefs}
              ref={BoryuGridRef}
              defaultColDef={defaultColDef}
              rowSelection={'single'}
              onSelectionChanged={onSelectionChanged}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              onCellValueChanged={(event) => {
                const colId = event.api.getFocusedCell()?.column.getColId();
                const rowIndex = event.api.getFocusedCell()?.rowIndex;
                if (colId === 'orderEtc' && rowIndex != undefined && rowIndex > -1) {
                  const rowNode = event.api.getDisplayedRowAtIndex(rowIndex);
                  if (rowNode && rowNode.data) {
                    updateOrder({ id: event.data.id, orderEtc: event.value }).then((result) => {
                      const { resultCode, resultMessage } = result.data;
                      if (resultCode == 200) {
                        toastSuccess('비고가 변경되었습니다.');
                      } else {
                        toastSuccess('에러 발생 [' + resultMessage + ']');
                      }
                    });
                  }
                }
              }}
              singleClickEdit={true}
              suppressRowClickSelection={false}
              className={'default check'}
              onRowClicked={(param) => {
                if (param.data) {
                  setPrintData(param.data.id);
                }
              }}
              getRowClass={getRowClass}
              pinnedBottomRowData={pinnedBottomRowData} // 예솔수정 하단합계 추가
            />
            <div className="btnArea">
              <CustomShortcutButton className="btn" title="주문등록으로" onClick={() => orderProcessFn(true)} shortcut={COMMON_SHORTCUTS.gridUnder1}>
                주문등록으로
              </CustomShortcutButton>
              <CustomShortcutButton
                className="btn"
                title="삭제하기"
                shortcut={COMMON_SHORTCUTS.gridUnder2}
                onClick={() => {
                  const targetOrderNodes = BoryuGridRef.current?.api.getSelectedNodes() || [];
                  if (!targetOrderNodes.length) {
                    toastError('유효한 주문을 선택하십시요.');
                  } else {
                    openOrderModal('DELETE');
                  }
                }}
              >
                삭제하기
              </CustomShortcutButton>
              <CustomShortcutButton className="btn" title="복사하기" shortcut={COMMON_SHORTCUTS.gridUnder3} onClick={() => orderProcessFn(false)}>
                복사하기
              </CustomShortcutButton>
              <CustomShortcutButton className="btn" title="구분편집" shortcut={COMMON_SHORTCUTS.gridUnder4} onClick={() => todayOpenModal('CATEGORY_SETTING')}>
                구분편집
              </CustomShortcutButton>
            </div>
          </div>
          <div>
            {isPreView ? (
              <div className="previewBox">
                {selectedDetail && selectedDetail.length !== 0 ? (
                  <PrintLayout selectedDetail={selectedDetail} isPrinting={isPrinting} setIsPrinting={setIsPrinting} type={'boryu'} />
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

      <ConfirmModal
        open={orderModalType.type === 'DELETE' && orderModalType.active}
        onClose={() => {
          closeOrderModal('DELETE');
        }}
        onConfirm={() => {
          const targetOrderNodes = BoryuGridRef.current?.api.getSelectedNodes() || [];
          const targetOrders: number[] = [];
          for (let i = 0; i < targetOrderNodes.length; i++) {
            targetOrders.push(targetOrderNodes[i].data.id);
          }
          deleteBoryuOrders(targetOrders);
        }}
        title={'해당 (보류)주문들을 삭제하시겠습니까'}
      />
      {todayModalType?.type === 'CATEGORY_SETTING' && todayModalType.active && <TodayCategorySetPop partnerCodeUpper={PARTNER_CODE.boryuCategories} />}
    </div>
  );
};

export default Boryu;
