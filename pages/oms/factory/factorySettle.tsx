import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DropDown, Pagination, Search, Title, toastInfo, toastSuccess } from '../../../components';
import { TableHeader, toastError } from '../../../components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColDef, RowClassParams, RowDoubleClickedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { GridSetting } from '../../../libs/ag-grid';
import useFilters from '../../../hooks/useFilters';
import { useCommonStore } from '../../../stores';
import { authApi } from '../../../libs';
import { FactoryResponseSelectList, FactorySettleRequestDelete, FactorySettleRequestTrans, FactorySettleResponsePaging } from '../../../generated';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import PrintLayout from '../../../components/print/PrintLayout';
import TunedGrid from '../../../components/grid/TunedGrid';
import { useFactorySettleStore } from '../../../stores/useFactorySettleStore';
import { Utils } from '../../../libs/utils';
import { FactorySettlePop } from '../../../components/popup/factory/FactorySettlePop';
import { ConfirmModal } from '../../../components/ConfirmModal';
import FactorySettleDetailPop from '../../../components/popup/factory/FactorySettleDetailPop';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';
import { TunedReactSelector } from '../../../components/TunedReactSelector';

/**
 * 공장정산
 */
const FactorySettle = () => {
  const nowPage = 'oms_factorySettle'; // filter 저장 2025-06-24
  const gridRef = useRef<AgGridReact>(null);
  const startDt = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'); //1개월전 1일자로 조회
  const today = dayjs(new Date()).format('YYYY-MM-DD');

  const [isPreView, setIsPreView] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState(false); // 프린트 여부
  const [printDetail, setPrintDetail] = useState<any>(null); // 프린트 데이터
  const [selectSettleData, setSelectSettleData] = useState<FactorySettleResponsePaging>();
  const [factorySettleList, setFactorySettleList] = useState<FactorySettleResponsePaging[]>([]);

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList,
    s.setFilterDataList,
    s.getFilterData,
  ]);
  const [paging, setPaging, modalType, openModal, closeModal, deleteFactorySettle] = useFactorySettleStore((s) => [
    s.paging,
    s.setPaging,
    s.modalType,
    s.openModal,
    s.closeModal,
    s.deleteFactorySettle,
  ]);

  const [filters, onChangeFilters, onFiltersReset] = useFilters(
    getFilterData(filterDataList, nowPage) || {
      // filter 저장 2025-06-24
      factoryId: 0,
      factoryNm: '',
      startDate: startDt,
      endDate: today,
    },
  );

  /** 공장옵션 조회 */
  const [factoryOption, setFactoryOption] = useState<any>([]);
  const { data: factories, isSuccess: isFetchFactorySuccess } = useQuery({
    queryKey: ['/factory/omsPartnerId'],
    queryFn: (): any => authApi.get('/factory/omsPartnerId'),
  });

  useEffect(() => {
    if (isFetchFactorySuccess && factories) {
      const { resultCode, body, resultMessage } = factories.data;
      if (resultCode === 200) {
        const factoryCodes = body?.map((item: FactoryResponseSelectList) => ({
          value: item.id,
          label: item.compNm,
        }));
        // console.log(factoryCodes);
        setFactoryOption(factoryCodes);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchFactorySuccess, factories]);

  /** 페이징 목록 조회 */
  const {
    data: factorySettles,
    isSuccess: isPagingSuccess,
    refetch: factorySettleRefetch,
  } = useQuery({
    queryKey: ['/factory-settle/paging', paging.curPage, filters.factoryId],
    queryFn: async () =>
      authApi
        .get('/factory-settle/paging', {
          params: {
            curPage: paging.curPage,
            pageRowCount: paging.pageRowCount,
            ...filters,
          },
        })
        .then((res) => res.data), // ✅ 여기서 data만 추출
    enabled: !!filters.factoryId, // factoryId가 존재할 때만 실행
  });

  useEffect(() => {
    if (isPagingSuccess) {
      const { resultCode, body, resultMessage } = factorySettles;
      if (resultCode === 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
        console.log('fetch >>', body.rows);
        setPaging(body?.paging);
        setFactorySettleList(body.rows || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isPagingSuccess, factorySettles, setPaging, setFilterDataList, filterDataList, filters]);

  /** 결제거래 삭제 */
  const queryClient = useQueryClient();
  const { mutate: removeFactorySettleMutate, isLoading: isRemoveLoading } = useMutation(deleteFactorySettle, {
    onSuccess: async (e) => {
      try {
        const { resultCode, resultMessage } = e.data;
        if (resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          await queryClient.invalidateQueries(['/factory-settle/paging']);
          closeModal(modalType.type);
        } else {
          toastError(resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const [columnDefs, setColumnDefs] = useState<ColDef<FactorySettleResponsePaging>[]>([
    {
      field: 'tranId',
      headerName: '장부ID',
      minWidth: 50,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'no',
      headerName: 'No.',
      minWidth: 40,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'workYmd',
      headerName: '입고일자',
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'inOutType',
      headerName: '유형',
      filter: true,
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        return params.value?.includes('일반') ? params.value.replace('일반', '') : params.value;
      },
    },
    {
      field: 'receivingCnt',
      headerName: '입고수량',
      minWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        return params.data?.inOutType !== '결제' && params.value ? Utils.setComma(params.value) : '';
      },
    },
    {
      field: 'outGoingCnt',
      headerName: '반출수량',
      minWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        return params.data?.inOutType !== '결제' && params.value ? Utils.setComma(params.value) : '';
      },
    },
    {
      field: 'receivingAmt',
      headerName: '입고금액',
      minWidth: 80,
      maxWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return params.data?.inOutType !== '결제' && params.value ? Utils.setComma(params.value) : '';
      },
    },
    {
      field: 'outGoingAmt',
      headerName: '반출금액',
      minWidth: 80,
      maxWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return params.data?.inOutType !== '결제' && params.value ? Utils.setComma(params.value) : '';
      },
    },
    {
      field: 'asnDcAmt',
      headerName: '단가DC',
      minWidth: 80,
      maxWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return params.data?.inOutType !== '결제' && params.value ? Utils.setComma(params.value) : '';
      },
    },
    {
      field: 'settleDcAmt',
      headerName: '할인금액',
      minWidth: 80,
      maxWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    {
      field: 'cashPayAmt',
      headerName: '현금지급',
      minWidth: 80,
      maxWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return params.data?.inOutType === '결제' && params.value ? Utils.setComma(params.value) : '';
      },
    },
    {
      field: 'accountPayAmt',
      headerName: '통장지급',
      minWidth: 80,
      maxWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return params.data?.inOutType === '결제' && params.value ? Utils.setComma(params.value) : '';
      },
    },
    {
      field: 'onCreditAmt',
      headerName: '당일합계',
      minWidth: 80,
      maxWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return params.value ? Utils.setComma(params.value) : '';
      },
    },
    {
      field: 'currentBalance',
      headerName: '현잔액',
      minWidth: 90,
      maxWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'tranYmd',
      headerName: '결제일자',
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        return params.data?.inOutType === '결제' ? params.value : '';
      },
    },
    {
      field: 'updUser',
      headerName: '사용자',
      minWidth: 80,
      maxWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'etcPrintYn',
      headerName: '비고여부',
      minWidth: 60,
      maxWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'etcCntn',
      headerName: '비고',
      minWidth: 150,
      maxWidth: 200,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
    },
  ]);

  // 최초 데이타 렌더링 및 재렌더링시
  const onRowDataUpdated = (params: any) => {
    updateTotals(); // 데이터 업데이트 시 합계도 계산
  };

  // 합계 업데이트 함수
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any[]>([]); // 합계데이터 만들기
  const updateTotals = () => {
    let receivingCnt = 0;
    let receivingAmt = 0;
    let outGoingCnt = 0;
    let outGoingAmt = 0;
    let asnDcAmt = 0;
    let settleDcAmt = 0;
    let cashPayAmt = 0;
    let accountPayAmt = 0;
    let onCreditAmt = 0;
    let currentBalance = 0;

    gridRef.current?.api.forEachNode((node) => {
      // console.log('cashPayAmt', node.data.no, node.data.cashPayAmt);
      receivingCnt += Number(node.data.receivingCnt || 0);
      receivingAmt += Number(node.data.receivingAmt || 0);
      outGoingCnt += Number(node.data.outGoingCnt || 0);
      outGoingAmt += Number(node.data.outGoingAmt || 0);
      asnDcAmt += Number(node.data.asnDcAmt || 0);
      settleDcAmt += Number(node.data.settleDcAmt || 0);
      cashPayAmt += Number(node.data.cashPayAmt || 0);
      accountPayAmt += Number(node.data.accountPayAmt || 0);
      onCreditAmt += Number(node.data.onCreditAmt || 0);
      currentBalance += Number(node.data.currentBalance || 0);
    });

    // console.log('sum cashPayAmt', cashPayAmt);
    // 합계 데이터를 상태로 설정하여 pinned bottom row에 전달
    setPinnedBottomRowData([
      {
        inOutType: 'Total',
        receivingCnt: receivingCnt,
        receivingAmt: receivingAmt,
        outGoingCnt: outGoingCnt,
        outGoingAmt: outGoingAmt,
        asnDcAmt: asnDcAmt,
        settleDcAmt: settleDcAmt,
        cashPayAmt: cashPayAmt,
        accountPayAmt: accountPayAmt,
        onCreditAmt: onCreditAmt,
        currentBalance: currentBalance,
      },
    ]);
  };

  // 프린트 버튼 클릭 이벤트
  const handlePrintBtnClick = () => {
    // if (!isPreView || selectedIds.length === 0) {
    if (!isPreView) {
      // 미리보기 off 또는 선택된 ID 없을 경우
      return;
    }
    setIsPrinting(true);
  };

  const handleSettleDelConfirm = () => {
    if (!selectSettleData) {
      toastError('삭제할 결제 정보가 없습니다.');
      return;
    }
    const factorySettleDeleteRequest: FactorySettleRequestDelete = {
      tranId: selectSettleData.tranId,
      factoryId: selectSettleData.factoryId,
      workYmd: selectSettleData.workYmd,
      cashAmt: selectSettleData.cashPayAmt,
      accountAmt: selectSettleData.accountPayAmt,
      dcAmt: selectSettleData.settleDcAmt,
    };
    console.log('삭제 데이타 >>', factorySettleDeleteRequest);

    removeFactorySettleMutate(factorySettleDeleteRequest);
  };

  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    await factorySettleRefetch();
  };

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    onChangeFilters('factoryId', 0);
    onChangeFilters('startDate', startDt);
    onChangeFilters('endDate', today);
    console.log('reset');
    setFactorySettleList([]);
  };

  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';

    if (params.data.inOutType === '결제') {
      rtnValue = rtnValue ? rtnValue + ' ag-grid-deposit' : 'ag-grid-deposit';
    }

    if (params.node.rowPinned === 'bottom') {
      // 합계 행 스타일링
      rtnValue = rtnValue ? rtnValue + ' ag-grid-pinned-row' : 'ag-grid-pinned-row';
    }

    return rtnValue;
  }, []);

  const onRowDoubleClicked = async (params: RowDoubleClickedEvent) => {
    if (params.data.inOutType !== '결제') {
      setSelectSettleData(params.data); // 선택된 데이터 저장
      openModal('SETTLE_DETAIL');
    } else {
      toastInfo('결제유형은 거래상세정보가 없어요.');
    }
  };

  /** 프린트 관련 */
  type InOutType = '결제' | '일반입고' | '일반반출' | '수선입고' | '수선반출';
  const inOutTypeMap: Record<InOutType, string> = {
    ['결제']: 'factoryPay',
    ['일반입고']: 'factoryStock',
    ['일반반출']: 'factoryOut',
    ['수선반출']: 'factoryOut',
    ['수선입고']: 'factoryRepair',
  };
  // 선택시 row데이터
  const [transReqParam, setTransReqParam] = useState<FactorySettleRequestTrans[]>([]);
  const onSelectionChanged = (params: any) => {
    const selectedRows = params.api.getSelectedRows();
    if (selectedRows.length > 0) {
      const reqParams = selectedRows.map((row: any) => ({
        factoryId: row.factoryId,
        dwDp: row.dwTp,
        workYmd: row.workYmd,
      }));
      setTransReqParam(reqParams);
    } else {
      setTransReqParam([]); // 선택 해제 시 상태 초기화
      setPrintDetail([]);
    }
  };

  // 상세조회
  const {
    data: loadTrans,
    isSuccess,
    refetch: transRefetch,
  } = useQuery(
    ['/factory-settle/trans', transReqParam],
    () =>
      authApi.get('/factory-settle/trans', {
        params: transReqParam,
      }),
    {
      enabled: !!transReqParam,
    },
  );
  useEffect(() => {
    if (transReqParam.length > 0) {
      const fetchAll = async () => {
        try {
          const results = await Promise.all(transReqParam.map((param) => authApi.get('/factory-settle/trans', { params: param })));

          // 선택된 행 데이터 가져오기
          const selectedRows = gridRef.current?.api.getSelectedRows() || [];

          // API 결과와 선택된 행 매칭 및 데이터 병합
          const factorySettleLists = results.map((res) => {
            const factorySettleList = res.data.body;
            const partnerId = factorySettleList[0]?.partnerId || null;

            // 선택된 행과 factorySettleList 매칭
            const updatedFactorySettleList = factorySettleList.map((item: any) => {
              const matchingRow = selectedRows.find((row: any) => row.dwTp === item.dwTp && row.workYmd === item.workYmd);

              // 매칭된 데이터 병합
              return matchingRow ? { ...item, ...matchingRow } : item;
            });

            return {
              partnerId, // 최상위 레벨에 partnerId 추가
              factorySettleList: updatedFactorySettleList, // 매칭된 factorySettleList 추가
            };
          });

          // 결과 설정
          setPrintDetail(factorySettleLists);
          // console.log('바디: ', factorySettleLists);
        } catch (error) {
          console.error('요청 중 오류 발생:', error);
        }
      };

      fetchAll();
    }
  }, [transReqParam]);

  useEffect(() => {
    if (factoryOption && filters.factoryId && filters.factoryId > 0) {
      factorySettleRefetch();
    }
  }, [filters]);

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={factorySettleRefetch} filters={filters} />
      <Search className="type_2">
        <CustomNewDatePicker
          title={'기간'}
          type={'range'}
          defaultType={'type'}
          startName={'startDate'}
          endName={'endDate'}
          onChange={onChangeFilters}
          value={[filters.startDate, filters.endDate]}
        />
        <TunedReactSelector
          title={'생산처'}
          name={'factoryId'}
          onChange={(option) => {
            if (option.value) {
              onChangeFilters('factoryId', option.value.toString());
            } else onChangeFilters('factoryId', 0);
          }}
          options={factoryOption}
          placeholder="생산처 선택"
        />
      </Search>

      <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={onSearch} isPaging={false}>
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
            <TunedGrid<FactorySettleResponsePaging>
              ref={gridRef}
              onGridReady={(params) => {
                params.api.autoSizeAllColumns(); // 모든 열 크기 자동 설정
              }}
              // loading={isPagingLoading}
              rowData={factorySettleList}
              columnDefs={columnDefs}
              paginationPageSize={paging.pageRowCount}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              suppressRowClickSelection={false}
              preventPersonalizedColumnSetting={true}
              getRowClass={getRowClass}
              onRowDoubleClicked={onRowDoubleClicked}
              onSelectionChanged={onSelectionChanged}
              onFirstDataRendered={onRowDataUpdated}
              onRowDataUpdated={onRowDataUpdated}
              pinnedBottomRowData={pinnedBottomRowData}
              className={'withPrint'}
            />
            <div className="btnArea">
              <CustomShortcutButton
                className="btn"
                title="결제추가"
                shortcut={COMMON_SHORTCUTS.gridUnder1}
                onClick={() => {
                  if (filters.factoryId) {
                    openModal('PAYMENT_CREATE');
                  } else {
                    toastError(' 생산처를 선택후 결제추가를 할 수 있습니다.');
                  }
                }}
              >
                결제추가
              </CustomShortcutButton>
              <CustomShortcutButton
                className="btn"
                title="결제수정"
                shortcut={COMMON_SHORTCUTS.gridUnder2}
                onClick={() => {
                  if (gridRef.current?.api.getSelectedNodes() && gridRef.current?.api.getSelectedNodes().length > 0) {
                    console.log('>>', gridRef.current?.api.getSelectedNodes()[0].data);
                    const selectedNodes = gridRef.current.api.getSelectedNodes();
                    if (selectedNodes.length !== 1) {
                      toastError('수정할 내역을 하나만 선택해주세요.');
                      return;
                    }

                    const rowData: FactorySettleResponsePaging = selectedNodes[0].data;
                    if (rowData.inOutType === '결제') {
                      setSelectSettleData(rowData);
                      openModal('PAYMENT_UPDATE');
                    } else {
                      toastError('결제수정은 결제 유형 항목만 가능합니다.');
                      return;
                    }
                  } else {
                    toastError('수정하기 전 내역을 먼저 선택해주세요.');
                    return;
                  }
                }}
                disabled={!(filters.factoryId && factorySettleList.length > 0)}
              >
                결제수정
              </CustomShortcutButton>
              <CustomShortcutButton
                className="btn"
                title="결제삭제"
                shortcut={COMMON_SHORTCUTS.ctrlZ}
                onClick={() => {
                  if (gridRef.current?.api.getSelectedNodes() && gridRef.current?.api.getSelectedNodes().length > 0) {
                    console.log('>>', gridRef.current?.api.getSelectedNodes()[0].data);
                    const selectedNodes = gridRef.current.api.getSelectedNodes();
                    if (selectedNodes.length !== 1) {
                      toastError('삭제할 내역을 하나만 선택해주세요.');
                      return;
                    }

                    const rowData: FactorySettleResponsePaging = selectedNodes[0].data;
                    if (rowData.inOutType === '결제') {
                      setSelectSettleData(rowData);
                      openModal('PAYMENT_DELETE');
                    } else {
                      toastError('결제삭제는 결제 유형 항목만 가능합니다.');
                      return;
                    }
                  } else {
                    toastError('삭제하기 전 내역을 먼저 선택해주세요.');
                    return;
                  }
                }}
                disabled={!(filters.factoryId && factorySettleList.length > 0)}
              >
                결제삭제
              </CustomShortcutButton>
            </div>
          </div>
          {isPreView ? (
            <div className="previewBox">
              {printDetail ? (
                <PrintLayout
                  selectedDetail={printDetail}
                  isPrinting={isPrinting}
                  setIsPrinting={setIsPrinting}
                  type={inOutTypeMap[printDetail[0]?.factorySettleList[0].inOutType as InOutType] || ''}
                />
              ) : (
                <div className="noRowsOverlayBox">결제내역을 선택하면 상세 정보가 표시됩니다.</div>
              )}
            </div>
          ) : (
            ''
          )}
        </div>
      </div>
      {(modalType.type === 'PAYMENT_CREATE' || modalType.type === 'PAYMENT_UPDATE') && modalType.active && (
        <FactorySettlePop factoryId={filters.factoryId} selectSettleData={modalType.type === 'PAYMENT_UPDATE' ? selectSettleData : undefined} />
      )}
      <ConfirmModal
        title={`지급일자 '${selectSettleData?.tranYmd}' 결제건을 삭제하시겠어요?`}
        open={modalType.type === 'PAYMENT_DELETE' && modalType.active}
        onConfirm={handleSettleDelConfirm}
        onClose={() => closeModal('PAYMENT_DELETE')}
      />
      {modalType.type === 'SETTLE_DETAIL' && modalType.active && selectSettleData && <FactorySettleDetailPop selectSettleData={selectSettleData} />}
    </div>
  );
};

export default FactorySettle;
