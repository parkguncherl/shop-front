/**
 *   WMS > 입고 > 입하등록 > 매장분 반납 Component
 * */

import { useAgGridApi } from '../../../hooks';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useInstockStore } from '../../../stores/wms/uselnstockStore';
import { InstockPagingFilter, InstockResponsePaging, InstockReturnRequestDetail, InstockReturnResponsePaging } from '../../../generated';
import { ColDef, SelectionChangedEvent } from 'ag-grid-community';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { Utils } from '../../../libs/utils';
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
import dayjs from 'dayjs';
import ReturnAsnPop from './ReturnAsnPop';
import debounce from 'lodash/debounce';
import { useSession } from 'next-auth/react';
import { ConfirmModal } from '../../ConfirmModal';

interface Props {
  filters: InstockPagingFilter; // 필터 객체
}

const StoreReturnAsnComponent: React.FC<Props> = ({ filters }) => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const queryClient = useQueryClient();
  const gridRef = useRef<AgGridReact>(null);
  const [paging, setPaging] = useInstockStore((s) => [s.paging, s.setPaging]);
  const [modalType, openModal, closeModal] = useInstockStore((s) => [s.modalType, s.openModal, s.closeModal]);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<InstockResponsePaging[]>([]); // 합계데이터 객체
  const [isPreView, setIsPreView] = useState<boolean>(true); //미리보기
  const [isPrinting, setIsPrinting] = useState(false); // 프린트
  const [selectedDetail, setSelectedDetail] = useState<any>(null); // 선택된 데이타

  const [columnDefs] = useState<ColDef<InstockReturnResponsePaging>[]>([
    {
      field: 'no',
      headerName: 'No.',
      maxWidth: 50,
      minWidth: 50,
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
      field: 'repNm',
      headerName: '고객명',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'prodCnt',
      headerName: '품목#',
      maxWidth: 50,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuCnt',
      headerName: 'SKU#',
      maxWidth: 50,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'totalGenCnt',
      headerName: '반납확정',
      maxWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'befAsnCompleteCnt',
      headerName: '입하완료',
      maxWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'asnStatNm',
      headerName: '입하상태',
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'sheetPrintDt',
      headerName: '전표인쇄',
      minWidth: 150,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => (params.value ? dayjs(params.value).format('M/DD (ddd) HH:mm:ss') : ''),
    },
    {
      field: 'sheetPrintNm',
      headerName: '작업자',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'outYmd',
      headerName: '입고예정일' /*asn 수량입력일*/,
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => (params.value ? dayjs(params.value).format('YY/MM/DD(ddd)') : ''),
    },
    {
      field: 'creTm',
      headerName: '반납확정일시',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => (params.value ? dayjs(params.value).format('MM/DD(ddd) HH:mm:ss') : ''),
    },
  ]);

  /** 최초 데이타 렌더링 및 데이타 업데이트시 이벤트  */
  const onRowDataUpdated = useCallback(() => {
    updateTotals(); // 하단 합계 계산
  }, []);

  /** 합계 업데이트 함수 */
  const updateTotals = () => {
    let totalProdCnt = 0;
    let totalSkuCnt = 0;
    let totalGenCnts = 0;
    let totalBefAsnCompleteCnt = 0;

    gridRef.current?.api.forEachNode((node) => {
      totalProdCnt += Number(node.data.prodCnt || 0);
      totalSkuCnt += Number(node.data.skuCnt || 0);
      totalGenCnts += Number(node.data.totalGenCnt || 0);
      totalBefAsnCompleteCnt += Number(node.data.befAsnCompleteCnt || 0);
    });

    // grid pinned bottom row에 전달
    setPinnedBottomRowData([
      {
        partnerNm: 'Total',
        prodCnt: totalProdCnt,
        skuCnt: totalSkuCnt,
        totalGenCnt: totalGenCnts,
        befAsnCompleteCnt: totalBefAsnCompleteCnt,
      },
    ]);
  };

  /**
   *  API
   */
  /** 목록 조회 */
  const {
    data: stocks,
    isLoading: isListLoading,
    isSuccess: isStockSuccess,
    refetch: refetchStock,
  } = useQuery(
    ['/instock/return/paging', filters, paging.curPage],
    () =>
      authApi.get('/instock/return/paging', {
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
    if (isStockSuccess && stocks?.data) {
      const { resultCode, body, resultMessage } = stocks.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
      } else {
        toastError(resultMessage);
      }
    }
  }, [stocks, isStockSuccess, setPaging]);

  /**
   * Event Handler
   */

  // 검색
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await refetchStock();
  };

  /** 그리드 항목 선택 이벤트
   * 중복 렌더링이슈가 있어 debounce를 사용해서 300ms 까지 마지막 이벤트만 처리하도록 한다.
   * */
  const handleSelectionChanged = useCallback(
    debounce(async (event: SelectionChangedEvent) => {
      const selectedNodes = gridRef.current?.api.getSelectedNodes();

      console.log('셀렉트 >>', event);

      if (selectedNodes && selectedNodes.length > 0) {
        const selectedData = selectedNodes[0].data;

        if (!isPreView) return; // 미리보기 선택이 안되면 상세 API를 불러오지 않는다

        const params = {
          partnerId: selectedData.partnerId,
          creTm: selectedData.creTm,
          // repAsnNm: selectedData.repAsnNm,
        };

        /** 미리보기 데이타 가져오기 */
        try {
          const response = await authApi.get('/instock/preview/returnDetail', { params });
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
      } else {
      }
    }, 300), // 300ms debounce time
    [isPreView],
  );

  /** 프린트 버튼 클릭 이벤트 */
  const handlePrintBtnClick = async () => {
    // 미리보기 off 또는 선택된 ID 없을 경우는 작동 안됨
    if (!isPreView) return;

    const selectedNodes = gridRef.current?.api.getSelectedNodes();

    if (selectedNodes?.length === 0) {
      toastError('프린트할 항목을 먼저 선택해주세요.');
      return;
    }

    const items =
      selectedNodes?.map((node) => ({
        partnerId: node.data.partnerId,
        creTm: node.data.creTm,
      })) || [];

    console.log('전표 출력 요청 params>>', items);
    /** 전표(프린트) 데이타 가져오기 */
    try {
      const response = await authApi.post('/instock/print/returnDetail', items);
      const { resultCode, resultMessage, body } = response.data;

      if (resultCode === 200) {
        console.log('전표 상세 응답 >>', body);
        setSelectedDetail(body); // 반드시 배열 형태로 전달
        await refetchStock(); // 목록 refetch
        await queryClient.invalidateQueries(['/instock/stat/dashboard']); // 통계데이타 refetch
      } else {
        toastError('상세 자료 내용을 가져오지 못했어요.');
        console.error(resultMessage);
      }
    } catch (error) {
      toastError('데이터 로딩 중 오류가 발생했습니다.');
    }
    console.log('items >>', items);
    setIsPrinting(true);
  };

  /** 입하처리 버튼 클릭 */
  const [selectedData, setSelectedData] = useState<InstockReturnRequestDetail>();
  const [titleData, setTitleData] = useState<any>({});
  const handleStockClick = () => {
    if (!gridRef.current) return;
    const selectedRows = gridRef.current.api.getSelectedRows();

    if (selectedRows.length === 0) {
      toastError('선택된 행이 없습니다.');
      return;
    }
    /*
    if (selectedRows[0].asnStatNm !== '입하중') {
      toastError('입하중인 항목만 입하처리가 가능합니다.');
      return;
    }
    */

    if (selectedRows[0].partnerId && selectedRows[0].creTm) {
      // 첫 번째 선택된 행만 객체로 변환
      setSelectedData({
        partnerId: selectedRows[0].partnerId as number,
        creTm: selectedRows[0].creTm as string,
      });
    } else {
      console.error('첫번째 선택된 행을 찾을 수 없음');
    }

    console.log('선택된 데이터:', {
      partnerId: selectedRows[0].partnerId,
      creTm: selectedRows[0].creTm,
      partnerNm: selectedRows[0].partnerNm,
    });
    setTitleData({ partnerNm: selectedRows[0].partnerNm, type: '매장분 반납' });
    openModal('INSTOCK_RETURN_ASN_POP');
  };

  return (
    <>
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
          <CustomShortcutButton className="btn icoPrint" title="프린트" onClick={handlePrintBtnClick} shortcut={COMMON_SHORTCUTS.print}>
            프린트
          </CustomShortcutButton>
        </TableHeader>

        <div className="gridBox">
          <div className="tblPreview">
            <TunedGrid<InstockResponsePaging>
              ref={gridRef}
              headerHeight={35}
              onGridReady={onGridReady}
              loading={isListLoading}
              rowData={stocks?.data?.body?.rows || []}
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
              onRowDoubleClicked={handleStockClick}
              className={'check wmsDashboard'}
            />
            <div className="btnArea">
              <CustomShortcutButton
                className="btn"
                onClick={() => {
                  if (gridRef.current?.api.getSelectedNodes().length !== 1) {
                    toastError('입하처리할 항목을 하나만 선택해주세요.');
                    return;
                  }
                  handleStockClick();
                }}
                shortcut={COMMON_SHORTCUTS.save}
              >
                입하처리
              </CustomShortcutButton>
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
      {modalType.type === 'INSTOCK_RETURN_ASN_POP' && modalType.active && <ReturnAsnPop dtlParam={selectedData} titleData={titleData} />}
    </>
  );
};

export default StoreReturnAsnComponent;
