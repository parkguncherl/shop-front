/**
 *   WMS > 입고 > 입하이력 > 발주/수선발주 Component
 * */

import { useAgGridApi } from '../../../hooks';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useSession } from 'next-auth/react';
import { useInstockStore } from '../../../stores/wms/uselnstockStore';
import { InstockHistoryRequestPagingFilter, InstockHistoryResponseFactoryPaging, InstockResponsePrintDetail, PartnerResponseSelect } from '../../../generated';
import { ColDef, SelectionChangedEvent } from 'ag-grid-community';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../CustomShortcutButton';
import CustomGridLoading from '../../CustomGridLoading';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toastError } from '../../ToastMessage';
import { authApi } from '../../../libs';
import { TableHeader } from '../../TableHeader';
import TunedGrid from '../../grid/TunedGrid';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import PrintWmsLayout from '../../print/PrintWmsLayout';
import { Pagination } from '../../Pagination';
import debounce from 'lodash/debounce';
import dayjs from 'dayjs';
import FactoryAsnHistoryPop from './FactoryAsnHistoryPop';
import { useCommonStore } from '../../../stores';

interface Props {
  filters: InstockHistoryRequestPagingFilter; // 필터 객체
}

const FactoryAsnHistoryComponent: React.FC<Props> = ({ filters }) => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const queryClient = useQueryClient();
  const gridRef = useRef<AgGridReact>(null);
  const [paging, setPaging, modalType, openModal, closeModal] = useInstockStore((s) => [s.paging, s.setPaging, s.modalType, s.openModal, s.closeModal]);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<InstockHistoryResponseFactoryPaging[]>([]); // 합계데이터 객체
  const [filterDataList, setFilterDataList] = useCommonStore((s) => [
    s.filterDataList, //filter 예솔수정
    s.setFilterDataList, //filter 예솔수정
  ]);
  const [isPreView, setIsPreView] = useState<boolean>(true); //미리보기
  const [isPrinting, setIsPrinting] = useState(false); // 프린트
  const [selectedDetail, setSelectedDetail] = useState<InstockResponsePrintDetail | InstockResponsePrintDetail[]>(); // 선택된 데이타
  const [isDisabledBtn, setIsDisabledBtn] = useState<boolean>(true); // 버튼 disabled 상태
  const [titleData, setTitleData] = useState<any>({}); // 팝업타이틀데이터
  const [dtlParam, setDtlParam] = useState<any>(); // 상세 파라미터
  const nowPage = 'wms_instockHistory'; // filter 저장 예솔수정
  const [columnDefs] = useState<ColDef<InstockHistoryResponseFactoryPaging>[]>([
    {
      field: 'no',
      headerName: 'No.',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'partnerNm',
      headerName: '고객사',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'factoryNm',
      headerName: '생산처',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'asnTypeNm',
      headerName: '구분',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'totalCompleteInstock',
      headerName: '입하완료',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'totalCancelInStock',
      headerName: '입하취소',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'instockDtm',
      headerName: '작업일시',
      minWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        if (!params.value) return '';
        const date = dayjs(params.value);
        return date.isValid() ? date.format('M/D(ddd) HH:mm:ss') : '';
      },
    },
    {
      field: 'instockUser',
      headerName: '작업자',
      minWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    {
      field: 'outYmd',
      headerName: '입고 예정일',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        if (!params.value) return '';
        const date = dayjs(params.value);
        return date.isValid() ? date.format('YY/M/D(ddd)') : '';
      },
    },
    {
      field: 'asnWorkYmd',
      headerName: '발주일자',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        if (!params.value) return '';
        const date = dayjs(params.value);
        return date.isValid() ? date.format('YY/M/D(ddd)') : '';
      },
    },
  ]);

  /** 최초 데이타 렌더링 및 데이타 업데이트시 이벤트  */
  const onRowDataUpdated = useCallback(() => {
    updateTotals(); // 하단 합계 계산
  }, []);

  /** 합계 업데이트 함수 */
  const updateTotals = () => {
    let totalCompleteInstocks = 0;
    let totalCancelInStocks = 0;

    gridRef.current?.api.forEachNode((node) => {
      totalCompleteInstocks += Number(node.data.totalCompleteInstock || 0);
      totalCancelInStocks += Number(node.data.totalCancelInStock || 0);
    });

    // 필드 초기화
    const emptyRowData = columnDefs.reduce((acc, col) => {
      if (col.field) {
        if (col.valueFormatter) {
          // 날짜 필드일시 ''처리
          acc[col.field] = '';
        } else {
          acc[col.field] = null;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    // 입하완료수, 입하취소수만 설정
    emptyRowData.totalCompleteInstock = totalCompleteInstocks;
    emptyRowData.totalCancelInStock = totalCancelInStocks;

    setPinnedBottomRowData([emptyRowData]);
  };

  /**
   *  API
   */

  /** 목록 조회 */
  const {
    data: stockHistory,
    isLoading: isListLoading,
    isSuccess: isStockHistorySuccess,
    refetch: refetchStockHistory,
  } = useQuery(
    ['/instockHistory/factory/paging', filters, paging.curPage],
    () =>
      authApi.get('/instockHistory/factory/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
    {
      enabled: !!filters.asnType,
      staleTime: 5000, // 데이터 신선도 시간 설정 (5초)
      refetchOnWindowFocus: false, // 윈도우 포커스시 리패치 비활성화
      refetchOnReconnect: true, // 네트워크 재연결시 리패치
      retry: 1, // 실패시 1회 재시도
    },
  );
  useEffect(() => {
    if (isStockHistorySuccess && stockHistory?.data) {
      const { resultCode, body, resultMessage } = stockHistory.data;

      if (resultCode === 200) {
        setPaging(body?.paging);
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 예솔수정
      } else {
        toastError(resultMessage);
      }
    }
  }, [stockHistory, isStockHistorySuccess, setPaging]);

  /**
   * Event Handler
   */

  // 검색
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await refetchStockHistory();
  };

  /** 그리드 항목 선택 이벤트
   * 중복 렌더링이슈가 있어 debounce를 사용해서 300ms 까지 마지막 이벤트만 처리하도록 한다.
   * */
  const handleSelectionChanged = useCallback(
    debounce(async (event: SelectionChangedEvent) => {
      const selectedNodes = gridRef.current?.api.getSelectedNodes();

      if (selectedNodes && selectedNodes.length > 0) {
        const selectedData = selectedNodes[0].data;

        if (!isPreView) return; // 미리보기 선택이 안되면 상세 API를 불러오지 않는다

        const params = {
          logisId: filters.logisId ? filters.logisId : Number(session.data?.user.workLogisId),
          partnerId: selectedData.partnerId,
          factoryId: selectedData.factoryId,
          asnType: selectedData.asnTypeCd,
          workYmd: selectedData.asnWorkYmd,
          asnId: selectedData.asnId,
        };

        /** 미리보기 데이타 가져오기 */
        try {
          const response = await authApi.get('/instockHistory/preview/factory', { params });
          const { resultCode, resultMessage, body } = response.data;

          if (resultCode === 200) {
            // console.log('전표 상세 응답 >>', body);
            setSelectedDetail([body]); // 반드시 배열 형태로 전달
          } else {
            toastError('상세 자료 내용을 가져오지 못했어요.');
            console.error(resultMessage);
          }
        } catch (error) {
          toastError('데이터 로딩 중 오류가 발생했습니다.');
        }
        setIsDisabledBtn(false);
      } else {
        setIsDisabledBtn(true);
      }
    }, 300), // 300ms debounce time
    [isPreView],
  );

  /** 상세내역 버튼 클릭 */
  const handleDetailClick = () => {
    const selectedData = gridRef.current?.api.getSelectedNodes()[0].data;

    setDtlParam({
      partnerId: selectedData.partnerId,
      factoryId: selectedData.factoryId,
      workYmd: selectedData.asnWorkYmd,
      asnType: selectedData.asnTypeCd,
      logisId: filters.logisId ? filters.logisId : Number(session.data?.user.workLogisId),
    });
    setTitleData({ partnerNm: selectedData.partnerNm, factoryNm: selectedData.factoryNm });
    openModal('INSTOCK_FACTORY_HISTORY_POP');
  };

  return (
    <div>
      <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
        {/* 테이블 헤더 - 총 건수 및 페이징 정보 표시 */}
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={onSearch} isPaging={true}>
          <CustomShortcutButton
            className={`btn ${isPreView ? 'on' : ''}`}
            title="미리보기"
            onClick={() => setIsPreView(!isPreView)}
            shortcut={COMMON_SHORTCUTS.alt1}
          >
            미리보기
          </CustomShortcutButton>
          {/*<CustomShortcutButton className="btn icoPrint" title="프린트" onClick={handlePrintBtnClick} shortcut={COMMON_SHORTCUTS.print}>*/}
          {/*  프린트*/}
          {/*</CustomShortcutButton>*/}
        </TableHeader>

        <div className="gridBox">
          <div className="tblPreview">
            <TunedGrid
              ref={gridRef}
              headerHeight={35}
              onGridReady={onGridReady}
              loading={isListLoading}
              rowData={stockHistory?.data ? stockHistory?.data?.body?.rows : []}
              rowSelection={'multiple'}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              paginationPageSize={paging.pageRowCount}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              suppressRowClickSelection={false}
              onFirstDataRendered={onRowDataUpdated}
              onRowDataUpdated={onRowDataUpdated}
              pinnedBottomRowData={pinnedBottomRowData}
              onSelectionChanged={handleSelectionChanged}
              onRowDoubleClicked={handleDetailClick}
              getRowClass={(params) => {
                if (params.data) {
                  if (params.data.totalCancelInStock && params.data.totalCancelInStock > 0) {
                    return 'txtRed';
                  }
                }
                return '';
              }}
              className={'wmsDefault check'}
            />
            <div className={'btnArea'}>
              <button
                className="btn"
                onClick={() => {
                  if (gridRef.current?.api.getSelectedNodes().length !== 1) {
                    toastError('상세내역 항목을 하나만 선택해주세요.');
                    return;
                  }
                  handleDetailClick();
                }}
                disabled={isDisabledBtn}
              >
                상세보기
              </button>
            </div>
            <Pagination pageObject={paging} setPaging={setPaging} />
          </div>
          <div>
            {isPreView ? (
              <div className="previewBox">
                {selectedDetail ? (
                  <PrintWmsLayout selectedDetail={selectedDetail} isPrinting={isPrinting} setIsPrinting={setIsPrinting} />
                ) : (
                  <div className="noRowsOverlayBox">입고내역을 선택하면 상세 정보가 표시됩니다.</div>
                )}
              </div>
            ) : (
              ''
            )}
          </div>
        </div>
      </div>
      {modalType.type === 'INSTOCK_FACTORY_HISTORY_POP' && modalType.active && <FactoryAsnHistoryPop dtlParam={dtlParam} titleData={titleData} />}
    </div>
  );
};

export default FactoryAsnHistoryComponent;
