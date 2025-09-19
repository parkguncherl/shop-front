import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { Search, TableHeader, Title, toastError } from '../../../components';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { ColDef, RowDoubleClickedEvent } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import TunedGrid from '../../../components/grid/TunedGrid';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { AgGridReact } from 'ag-grid-react';
import { Utils } from '../../../libs/utils';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import PrintLayout from '../../../components/print/PrintLayout';
import debounce from 'lodash/debounce';
import {
  FactoryResponseSelectList,
  ReceivingHistoryRequestPagingFilter,
  ReceivingHistoryResponsePaging,
  StoreInvenResponseInvestigatedInven,
} from '../../../generated';
import { useReceivingHistoryStore } from '../../../stores/useReceivingHistoryStore';
import ReceivingHistDtlPop from '../../../components/popup/factory/ReceivingHistDtlPop';
import ReceivingHistOutGoingAddPop from '../../../components/popup/factory/ReceivingHistOutGoingAddPop';
import { DataListDropDown } from '../../../components/DataListDropDown';
import { fetchFactories } from '../../../api/wms-api';
import ReceivingHistOutGoingModPop from '../../../components/popup/factory/ReceivingHistOutGoingModPop';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

/** 입고내역 */
const ReceivingHistory = () => {
  const nowPage = 'oms_receivingHistory'; // filter 저장 2025-01-21
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);
  const session = useSession();
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  /** store & state */
  const [selectedFactory, setSelectedFactory] = useState<any>();
  const [isPreView, setIsPreView] = useState<boolean>(true);
  const [isPrinting, setIsPrinting] = useState(false); // 프린트 여부
  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList, // filter 저장 2025-01-21
    s.setFilterDataList, // filter 저장 2025-01-21
    s.getFilterData, // filter 저장 2025-01-21
  ]);
  const [paging, setPaging, modalType, openModal, closeModal] = useReceivingHistoryStore((s) => [
    s.paging,
    s.setPaging,
    s.modalType,
    s.openModal,
    s.closeModal,
  ]);

  const [selectedDetail, setSelectedDetail] = useState<any>(null); // 미리보기 상태
  const [isDisabledBtn, setIsDisabledBtn] = useState<boolean>(); // 반출수정,삭제 disabled 용
  const [dtlParam, setDtlParam] = useState<any>();

  const preFilters = getFilterData(filterDataList, nowPage);
  const [filters, onChangeFilters] = useFilters<ReceivingHistoryRequestPagingFilter>(
    preFilters || {
      // filter 저장 2025-01-21
      workYmd: today,
      factoryId: 0,
    },
  );

  const [columnDefs] = useState<ColDef<ReceivingHistoryResponsePaging>[]>([
    {
      field: 'no',
      headerName: 'No.',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'inOutTypeNm',
      headerName: '유형',
      filter: true,
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'workYmd',
      headerName: '입고일자',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'compNm',
      headerName: '생산처',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'receivingExpectedCnt',
      headerName: '입고예정수량',
      filter: true,
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'receivingCnt',
      headerName: '입고확정수량',
      filter: true,
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'outGoingCnt',
      headerName: '반출수량',
      filter: true,
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'receivingAmt',
      headerName: '입고금액',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'outGoingAmt',
      headerName: '반출금액',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'asnDcAmt',
      headerName: '단가DC',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'settleDcAmt',
      headerName: '할인금액',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'cashPayAmt',
      headerName: '현금지급',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'accountPayAmt',
      headerName: '통장지급',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'onCreditAmt',
      headerName: '당일합계',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'currentBalance',
      headerName: '잔액',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'updUser',
      headerName: '사용자',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'etcCntn',
      headerName: '비고',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
  ]);

  // 최초 데이타 렌더링
  const onRowDataUpdated = useCallback(() => {
    updateTotals(); // 합계 계산
  }, []);

  // 합계 업데이트 함수
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<ReceivingHistoryResponsePaging[]>([]); // 합계데이터 만들기
  const updateTotals = () => {
    let receivingExpectedCnt = 0;
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
      receivingExpectedCnt += Number(node.data.receivingExpectedCnt || 0);
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

    // 합계 데이터를 상태로 설정하여 pinned bottom row에 전달
    setPinnedBottomRowData([
      {
        compNm: 'Total',
        receivingExpectedCnt: receivingExpectedCnt,
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

  /** 공장옵션 조회 */
  const [factoryOption, setFactoryOption] = useState<any>([]);
  const { data: factories, isSuccess: isFetchFactorySuccess, refetch } = useQuery(['fetchFactories'], fetchFactories);
  useEffect(() => {
    if (isFetchFactorySuccess && factories) {
      const { resultCode, body, resultMessage } = factories.data;
      if (resultCode === 200) {
        const factoryCodes = body?.map((item: FactoryResponseSelectList) => ({
          value: item.id,
          label: item.compNm,
        }));
        setFactoryOption(factoryCodes);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchFactorySuccess, factories]);

  /** 입고내역 목록 조회 */
  const {
    data: receivingHistory,
    isLoading,
    isSuccess,
    refetch: receivingHistoryRefetch,
  } = useQuery({
    queryKey: ['/receiving-history/paging', paging.curPage, filters.workYmd, filters.factoryId],
    queryFn: () =>
      authApi.get('/receiving-history/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
    // 추가 최적화 옵션들
    staleTime: 5000, // 데이터 신선도 시간 설정 (5초)
    refetchOnWindowFocus: false, // 윈도우 포커스시 리패치 비활성화
    refetchOnReconnect: true, // 네트워크 재연결시 리패치
    retry: 1, // 실패시 1회 재시도
  });

  useEffect(() => {
    if (isSuccess) {
      setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
      if (receivingHistory?.data) {
        const { resultCode, body, resultMessage } = receivingHistory.data;
        if (resultCode === 200) {
          setPaging(body?.paging || {});
          setTimeout(() => {
            gridRef.current?.api.ensureIndexVisible(body.rows ? body.rows.length - 1 : 0);
            gridRef.current?.api.setFocusedCell(body.rows ? body.rows.length - 1 : 0, 'workYmd');
          }, 0); // 하단 포커스
        } else {
          toastError(resultMessage);
        }
      }
    }
  }, [receivingHistory, isSuccess, setPaging]);

  /** 검색 */
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    await receivingHistoryRefetch();
  };

  /** 검색 버튼 클릭 시 */
  // const search = async () => {
  //   await onSearch();
  // };

  /** 프린트관련 */
  // 미리보기 클릭 이벤트
  useEffect(() => {
    if (isPreView) {
      handleSelectionChanged();
    }
  }, [isPreView]);

  // 그리드 항목 선택 이벤트
  // 중복 렌더링이슈가 있어 debounce를 사용해서 300ms 까지 마지막 이벤트만 처리하도록 한다.
  const handleSelectionChanged = useCallback(
    debounce(() => {
      const selectedNodes = gridRef.current?.api.getSelectedNodes();

      if (selectedNodes && selectedNodes.length > 0) {
        const selectedData = selectedNodes[0].data;
        setIsDisabledBtn(!selectedData.inOutTypeNm.includes('반출')); // 반출수정,삭제 버튼 활성화

        if (!isPreView) return; // 미리보기 선택이 안되면 상세 API를 불러오지 않는다

        const params = {
          inOutTypeCd: selectedData.inOutTypeCd,
          factoryId: selectedData.factoryId,
          workYmd: selectedData.workYmd,
          asnWorkYmd: selectedData.asnWorkYmd,
          dwTp: selectedData.dwTp,
          asnType: selectedData.asnType,
        };

        fetchPrintDetailData(params)
          .then((response) => {
            const { resultCode, resultMessage, body } = response.data;

            if (resultCode === 200 && body) {
              console.log('상세응답 =========>', body);
              setSelectedDetail([body]);
            } else {
              toastError('상세 자료 내용을 가져오지 못했어요.');
            }
          })
          .catch((error) => {
            toastError('데이터 로딩 중 오류가 발생했습니다.');
          });
      }
    }, 300), // 300ms debounce time
    [isPreView],
  );

  // 프린트 타입
  // 프린트 타입
  const getType = () => {
    const typeMap: Record<string, string> = {
      A: 'receivingHistoryA', // 결제
      B: 'receivingHistoryB', // 일반입고
      D: 'receivingHistoryD', // 반출
      E: 'receivingHistoryE', // 수선입고
      F: 'receivingHistoryF', // 수선반출
      X: 'receivingHistoryC', // 입고예정
    };

    const dwTp = selectedDetail[0]?.dwTp;
    return dwTp ? typeMap[dwTp] ?? '' : '';
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

  // 미리보기 상세데이타 조회
  const fetchPrintDetailData = (params: any) =>
    authApi.get('/receiving-history/print/detail', {
      params: params,
    });

  // 입고상세내역 이벤트
  const onRowDoubleClicked = async (params: RowDoubleClickedEvent) => {
    if (params.data) {
      if (params.data.inOutTypeCd === 'A') {
        toastError('결제는 상세정보가 없습니다.');
        return;
      }

      setDtlParam({
        inOutTypeCd: params.data.inOutTypeCd,
        factoryId: params.data.factoryId,
        workYmd: params.data.workYmd,
        asnWorkYmd: params.data.asnWorkYmd,
        dwTp: params.data.dwTp,
      });

      console.log('params  =================>', params);
      openModal('INOUT_DETAIL');
    } else {
      toastError('상세 정보가 누락되어 다시 선택해주세요.');
    }
  };

  const handleChangeFactory = (option: any) => {
    //console.log('op0tion==>', option);
    setSelectedFactory(option);
    onChangeFilters('factoryId', option.value);
  };

  const reset = async () => {
    onChangeFilters('factoryId', 0);
    onChangeFilters('workYmd', today);
    setSelectedFactory({
      value: 0,
      label: '생산처 선택',
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await onSearch();
  };

  useEffect(() => {
    if (factoryOption && factoryOption.length > 0 && preFilters?.factoryId && preFilters?.factoryId > 0) {
      setSelectedFactory(factoryOption.filter((item: any) => item.value == preFilters.factoryId));
      onChangeFilters('factoryId', preFilters.factoryId);
    }
  }, [preFilters, factoryOption]);

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} search={onSearch} reset={reset} />
      <Search className="type_2">
        <CustomNewDatePicker title={'입고일자'} name={'workYmd'} type={'date'} value={filters.workYmd} onChange={onChangeFilters} filters={filters} />
        <DataListDropDown
          title={'생산처'}
          name={'factoryId'}
          value={selectedFactory}
          onChange={handleChangeFactory}
          options={factoryOption}
          placeholder="생산처 검색"
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
            <TunedGrid<ReceivingHistoryResponsePaging>
              ref={gridRef}
              headerHeight={35}
              onGridReady={onGridReady}
              loading={isLoading}
              rowData={receivingHistory?.data?.body?.rows || []}
              rowSelection={'single'}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              paginationPageSize={paging.pageRowCount}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              suppressRowClickSelection={false}
              onSelectionChanged={handleSelectionChanged}
              onFirstDataRendered={onRowDataUpdated}
              // onRowDataUpdated={onRowDataUpdated}
              pinnedBottomRowData={pinnedBottomRowData}
              onRowDoubleClicked={onRowDoubleClicked}
              className={'receivingHistory'}
            />
            <div className="btnArea">
              <button
                className="btn"
                title="반출등록"
                onClick={() => {
                  openModal('OUTGOING_CREATE');
                }}
              >
                반출등록
              </button>
              <button
                className="btn"
                title="반출수정"
                onClick={() => {
                  if (gridRef.current?.api.getSelectedNodes().length === 0) {
                    toastError('반출수정할 항목을 선택해주세요.');
                    return;
                  }
                  const selectedData = gridRef.current?.api.getSelectedNodes()[0].data;
                  if (!selectedData.inOutTypeNm.includes('반출')) {
                    toastError('반출내역만 수정이 가능해요.');
                    return;
                  }
                  setDtlParam({
                    inOutTypeCd: selectedData.inOutTypeCd,
                    factoryId: selectedData.factoryId,
                    workYmd: selectedData.workYmd,
                    asnWorkYmd: selectedData.asnWorkYmd,
                  });
                  openModal('OUTGOING_UPDATE');
                }}
                disabled={isDisabledBtn}
              >
                반출수정
              </button>
            </div>
          </div>
          {isPreView ? (
            <div className="previewBox">
              {selectedDetail ? (
                <PrintLayout selectedDetail={selectedDetail} isPrinting={isPrinting} setIsPrinting={setIsPrinting} type={getType()} />
              ) : (
                <div className="noRowsOverlayBox">입고내역을 선택하면 상세 정보가 표시됩니다.</div>
              )}
            </div>
          ) : (
            ''
          )}
        </div>
      </div>
      {modalType.type === 'INOUT_DETAIL' && modalType.active && dtlParam && <ReceivingHistDtlPop dtlParam={dtlParam} />}
      {modalType.type === 'OUTGOING_CREATE' && modalType.active && <ReceivingHistOutGoingAddPop />}
      {modalType.type === 'OUTGOING_UPDATE' && modalType.active && dtlParam && <ReceivingHistOutGoingModPop dtlParam={dtlParam} />}
    </div>
  );
};

export default ReceivingHistory;
