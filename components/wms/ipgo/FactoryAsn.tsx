/**
 *   WMS > 입고 > 입하등록 > 발주/수선발주 Component
 * */

import { useAgGridApi } from '../../../hooks';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useSession } from 'next-auth/react';
import { useInstockStore } from '../../../stores/wms/uselnstockStore';
import { InstockPagingFilter, InstockResponsePaging, InstockResponsePrintDetail } from '../../../generated';
import { ColDef, SelectionChangedEvent } from 'ag-grid-community';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { Utils } from '../../../libs/utils';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../CustomShortcutButton';
import CustomGridLoading from '../../CustomGridLoading';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createStock, updateStockStatusByPrint } from '../../../api/wms-api';
import { toastError, toastSuccess } from '../../ToastMessage';
import { authApi } from '../../../libs';
import { TableHeader } from '../../TableHeader';
import TunedGrid from '../../grid/TunedGrid';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import PrintWmsLayout from '../../print/PrintWmsLayout';
import { Pagination } from '../../Pagination';
import debounce from 'lodash/debounce';
import { OtherInStockAddPop } from '../../popup/wms/ipgo/OtherInStockAddPop';
import FactoryAsnPop from './FactoryAsnPop';
import { Button } from '../../Button';
import dayjs from 'dayjs';

interface Props {
  filters: InstockPagingFilter; // 필터 객체
}

const FactoryAsnComponent: React.FC<Props> = ({ filters }) => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const queryClient = useQueryClient();
  const gridRef = useRef<AgGridReact>(null);
  const [paging, setPaging, modalType, openModal, closeModal] = useInstockStore((s) => [s.paging, s.setPaging, s.modalType, s.openModal, s.closeModal]);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<InstockResponsePaging[]>([]); // 합계데이터 객체
  const [isPreView, setIsPreView] = useState<boolean>(true); //미리보기
  const [isPrinting, setIsPrinting] = useState(false); // 프린트
  const [selectedDetail, setSelectedDetail] = useState<InstockResponsePrintDetail | InstockResponsePrintDetail[]>(); // 선택된 데이타
  const [dtlParam, setDtlParam] = useState<any>(); // 입하처리 선택 데이타
  const [titleData, setTitleData] = useState<any>({}); // 팝업타이틀데이터

  const [columnDefs] = useState<ColDef<InstockResponsePaging>[]>([
    {
      field: 'no',
      headerName: 'No.',
      maxWidth: 70,
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'partnerNm',
      headerName: '고객사',
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'factoryNm',
      headerName: '생산처',
      maxWidth: 150,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'repAsnNm',
      headerName: '입하추가',
      maxWidth: 100,
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
      headerName: '발주수량',
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
      maxWidth: 150,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => (params.value ? dayjs(params.value).format('M/DD (ddd) HH:mm:ss') : ''),
    },
    {
      field: 'sheetPrintUser',
      headerName: '작업자',
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'outYmd',
      headerName: '입고예정일' /*asn 수량입력일*/,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => (params.value ? dayjs(params.value).format('YY/M/DD (ddd)') : ''),
    },
    {
      field: 'asnWorkYmd',
      headerName: '발주일자',
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => (params.value ? dayjs(params.value).format('YY/M/DD (ddd)') : ''),
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
    let totalGenCnt = 0;
    let befAsnCompleteCnt = 0;

    gridRef.current?.api.forEachNode((node) => {
      totalProdCnt += Number(node.data.prodCnt || 0);
      totalSkuCnt += Number(node.data.skuCnt || 0);
      totalGenCnt += Number(node.data.totalGenCnt || 0);
      befAsnCompleteCnt += Number(node.data.befAsnCompleteCnt || 0);
    });

    // grid pinned bottom row에 전달
    setPinnedBottomRowData([
      {
        partnerNm: 'Total',
        prodCnt: totalProdCnt,
        skuCnt: totalSkuCnt,
        totalGenCnt: totalGenCnt,
        befAsnCompleteCnt: befAsnCompleteCnt,
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
    ['/instock/paging', filters, paging.curPage],
    () =>
      authApi.get('/instock/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
    {
      enabled: !!filters.asnType,
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

  useEffect(() => {
    console.log('factory asn filters ===>', filters);
  }, [filters]);

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
          logisId: filters.logisId ? filters.logisId : Number(session.data?.user.workLogisId),
          partnerId: selectedData.partnerId,
          factoryId: selectedData.factoryId,
          asnType: selectedData.asnTypeCd,
          workYmd: selectedData.asnWorkYmd,
          repAsnNm: selectedData.repAsnNm,
        };

        /** 미리보기 데이타 가져오기 */
        try {
          const response = await authApi.get('/instock/preview/detail', { params });
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
        logisId: filters.logisId ? filters.logisId : Number(session.data?.user.workLogisId),
        partnerId: node.data.partnerId,
        factoryId: node.data.factoryId,
        asnType: node.data.asnTypeCd,
        workYmd: node.data.asnWorkYmd,
        repAsnNm: node.data.repAsnNm,
      })) || [];

    // console.log('전표 출력 요청 params>>', items);
    /** 전표(프린트) 데이타 가져오기 */
    try {
      const response = await authApi.post('/instock/print/detail', items);
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

  // 입하처리 이벤트
  const handleInboundProcessing = () => {
    const selectedData = gridRef.current?.api.getSelectedNodes()[0].data;
    /*
    if (selectedData.asnStatNm !== '입하중') {
      toastError('입하중인 항목만 입하처리가 가능합니다.');
      return;
    }
    */

    setDtlParam({
      partnerId: selectedData.partnerId,
      factoryId: selectedData.factoryId,
      workYmd: selectedData.asnWorkYmd,
      asnType: selectedData.asnTypeCd,
      repYn: selectedData.repYn,
    });
    setTitleData({
      partnerNm: selectedData.partnerNm,
      factoryNm: selectedData.factoryNm,
      repAsnNm: selectedData.repAsnNm,
    });
    openModal('INSTOCK_FACTORY_ASN_POP');
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
              rowData={stocks?.data ? stocks?.data?.body?.rows : []}
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
              onRowDoubleClicked={handleInboundProcessing}
              className={'check wmsDashboard'}
            />
            <div className="btnArea">
              <button
                className="btn"
                onClick={() => {
                  if (gridRef.current?.api.getSelectedNodes().length !== 1) {
                    toastError('입하처리할 항목을 하나만 선택해주세요.');
                    return;
                  }
                  handleInboundProcessing();
                }}
              >
                입하처리
              </button>
              <CustomShortcutButton className="btn" onClick={() => openModal('INSTOCK_ADD_OTHER')} shortcut={COMMON_SHORTCUTS.save}>
                기타입하 추가
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
      {modalType.type === 'INSTOCK_FACTORY_ASN_POP' && modalType.active && dtlParam && <FactoryAsnPop dtlParam={dtlParam} titleData={titleData} />}
      {/*modalType.type == 'INSTOCK_ADD_OTHER' && modalType.active && <OtherInStockAddPop active={modalType.type == 'INSTOCK_ADD_OTHER' && modalType.active} />*/}
      {/*{modalType.type === 'ASN_DETAIL' && modalType.active && dtlParam && <AsnDtlPop dtlParam={dtlParam} />}*/}
      <OtherInStockAddPop
        active={modalType.type == 'INSTOCK_ADD_OTHER' && modalType.active}
        onClose={() => {
          console.log('OtherInStockAddPop onClose');
          closeModal('INSTOCK_ADD_OTHER');
        }}
      />
    </div>
  );
};

export default FactoryAsnComponent;
