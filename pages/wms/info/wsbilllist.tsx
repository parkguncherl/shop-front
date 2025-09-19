/**
 * 입점업체 정산리스트 컴포넌트
 * 경로: /wms/info/wsbilllist
 * 기능: 입점업체의 정산 정보를 표시하고 관리하는 페이지
 */

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { DropDown, Search, Title } from '../../../components';
import { Pagination, TableHeader, toastError } from '../../../components';
import { usePickinginfoStore, PickinginfoRequestPagingFilter, PickinginfoResponse } from '../../../stores/wms/usePickinginfoStore';
import { ColDef } from 'ag-grid-community';
import { useQuery } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import useFilters from '../../../hooks/useFilters';
import { useCommonStore } from '../../../stores';
import { AgGridReact } from 'ag-grid-react';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { useAgGridApi } from '../../../hooks';
import { Utils } from '../../../libs/utils';
import dayjs from 'dayjs';

/**
 * 메인 컴포넌트 정의
 */
const Wsbilllist: React.FC = () => {
  // AG Grid API 및 공통 스토어 초기화
  const { onGridReady } = useAgGridApi();
  const { upMenuNm, menuNm } = useCommonStore();
  const { paging, setPaging, getPickinginfoList, getPickinginfoBottomGridDetail } = usePickinginfoStore();

  /**
   * 상태 관리
   */
  // 그리드 데이터 상태
  const [topGridData, setTopGridData] = useState<PickinginfoResponse[]>([]);
  const [bottomGridData, setBottomGridData] = useState<any[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isShowSubGrid, setIsShowSubGrid] = useState<boolean>(false);

  // 그리드 참조 객체
  const topGridRef = useRef<AgGridReact>(null);
  const bottomGridRef = useRef<AgGridReact>(null);

  // 그리드 합계 데이터 상태
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any[]>([]);
  const [bottomPinnedRowData, setBottomPinnedRowData] = useState<any[]>([]);

  /**
   * 필터 설정
   */
  const [filters, onChangeFilters, onFiltersReset] = useFilters<PickinginfoRequestPagingFilter>({
    startDate: Utils.getStartDayDefault(),
    endDate: dayjs().format('YYYY-MM-DD'),
    partnerId: '',
    sellerId: '',
    workYmd: '',
    sellerName: '',
    jobStatus: '',
    partnerName: '',
    skuName: '',
    jobType: '',
  });

  /**
   * 데이터 조회 쿼리
   */
  const {
    data: pickinginfos,
    isLoading: isPickinginfosLoading,
    isSuccess: isPickinginfosSuccess,
    refetch: refetchPickinginfos,
  } = useQuery(
    ['/wms/pickinginfo/paging', paging.curPage],
    () => {
      const params = {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      };
      return getPickinginfoList(params);
    },
    {
      keepPreviousData: true,
      onError: (error) => {
        toastError('데이터 조회 중 오류가 발생했습니다.');
        console.error('데이터 조회 오류:', error);
      },
    },
  );

  /**
   * 검색 및 초기화 함수
   */
  const onSearch = () => {
    setPaging({
      curPage: 1,
    });
    refetchPickinginfos();
  };

  const reset = async () => {
    await onFiltersReset();
    onSearch();
  };

  /**
   * HTML 렌더링 컴포넌트
   */
  const SafeHtml: React.FC<{ html: string }> = ({ html }) => <div dangerouslySetInnerHTML={{ __html: html }} />;

  /**
   * 상단 그리드 컬럼 정의
   */
  const topGridColumns = useMemo<ColDef<PickinginfoResponse>[]>(
    () => [
      {
        field: 'id',
        headerName: '번호',
        minWidth: 70,
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'partnerName',
        headerName: '화주',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'partnerName',
        headerName: '매장',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'partnerName',
        headerName: '대표자명',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'currentStockQuantity',
        headerName: '수수료율',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'id',
        headerName: '매출액',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'id',
        headerName: '반품액',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'id',
        headerName: '실매출액',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'id',
        headerName: '수수료',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'id',
        headerName: '전기재고',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'id',
        headerName: '당기재고',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'id',
        headerName: '순수입고',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'id',
        headerName: '순수판매',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'id',
        headerName: '샘플',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'id',
        headerName: '샘플회수',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'id',
        headerName: '청구예정액',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
    ],
    [],
  );

  /**
   * 하단 그리드 컬럼 정의
   */
  const bottomGridColumns = useMemo<ColDef[]>(() => topGridColumns, [topGridColumns]);

  /**
   * 하단 그리드 데이터 업데이트 함수
   */
  const updateBottomGrid = async (selectedId: string | number) => {
    try {
      const id = typeof selectedId === 'string' ? parseInt(selectedId, 10) : selectedId;
      if (isNaN(id)) throw new Error('유효하지 않은 ID입니다.');

      const bottomGridResponse = await getPickinginfoBottomGridDetail(id);
      const { resultCode, body, resultMessage } = bottomGridResponse.data;

      if (resultCode === 200 && body) {
        const mappedData = Array.isArray(body)
          ? body.map((item) => ({
              id: item.id,
              partnerName: item.partnerName,
              currentStockQuantity: item.currentStockQuantity,
              ...item,
            }))
          : [body];

        setBottomGridData(mappedData);
      } else {
        throw new Error(resultMessage || '상세 정보를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Detail API Error:', error);
      toastError(error instanceof Error ? error.message : '상세 정보를 불러오는데 실패했습니다.');
      setBottomGridData([]);
    }
  };

  /**
   * 상단 그리드 셀 클릭 핸들러
   */
  const handleTopGridCellClick = async (event: any) => {
    if (event.data && event.data.id) {
      setIsDetailLoading(true);
      try {
        await updateBottomGrid(event.data.id);
        setIsShowSubGrid(true);
      } catch (error) {
        console.error('Detail API Error:', error);
        toastError('상세 정보를 불러오는데 실패했습니다.');
        setBottomGridData([]);
      } finally {
        setIsDetailLoading(false);
      }
    }
  };

  /**
   * 데이터 로딩 완료 후 처리
   */
  useEffect(() => {
    if (isPickinginfosSuccess && pickinginfos?.data) {
      const { resultCode, body, resultMessage } = pickinginfos.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
        setTopGridData(body.rows || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [pickinginfos, isPickinginfosSuccess, setPaging]);

  /**
   * 영역 외 클릭시 서브그리드 닫힘 처리
   */
  const topGridDivRef = useRef<HTMLDivElement>(null);
  const bottomGridDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const topGridElement = topGridDivRef.current;
      const bottomGridElement = bottomGridDivRef.current;

      if (
        topGridElement &&
        bottomGridElement &&
        !topGridElement.contains(event.target as Node) &&
        !bottomGridElement.contains(event.target as Node) &&
        !isElementInsideScrollbar(event.target as Node)
      ) {
        setIsShowSubGrid(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isElementInsideScrollbar = (target: Node): boolean => {
    const targetElement = target instanceof HTMLElement ? target : null;
    return targetElement ? targetElement.scrollHeight > targetElement.clientHeight : false;
  };

  /**
   * 상단 그리드 합계 업데이트 함수
   */
  const updateTotals = () => {
    let totalSum = 0;
    let returnSum = 0;
    let realSum = 0;
    let commissionSum = 0;
    let prevStockSum = 0;
    let curStockSum = 0;
    let pureInSum = 0;
    let pureSaleSum = 0;
    let sampleSum = 0;
    let sampleReturnSum = 0;
    let billSum = 0;

    topGridRef.current?.api.forEachNode((node) => {
      totalSum += Number(node.data.id || 0);
      returnSum += Number(node.data.id || 0);
      realSum += Number(node.data.id || 0);
      commissionSum += Number(node.data.id || 0);
      prevStockSum += Number(node.data.id || 0);
      curStockSum += Number(node.data.id || 0);
      pureInSum += Number(node.data.id || 0);
      pureSaleSum += Number(node.data.id || 0);
      sampleSum += Number(node.data.id || 0);
      sampleReturnSum += Number(node.data.id || 0);
      billSum += Number(node.data.id || 0);
    });

    setPinnedBottomRowData([
      {
        partnerName: '합계',
        id: totalSum,
        id_return: returnSum,
        id_real: realSum,
        id_commission: commissionSum,
        id_prevstock: prevStockSum,
        id_curstock: curStockSum,
        id_purein: pureInSum,
        id_puresale: pureSaleSum,
        id_sample: sampleSum,
        id_samplereturn: sampleReturnSum,
        id_bill: billSum,
      },
    ]);
  };

  /**
   * 하단 그리드 합계 업데이트 함수
   */
  const updateBottomTotals = () => {
    let totalSum = 0;
    let returnSum = 0;
    let realSum = 0;
    let commissionSum = 0;
    let prevStockSum = 0;
    let curStockSum = 0;
    let pureInSum = 0;
    let pureSaleSum = 0;
    let sampleSum = 0;
    let sampleReturnSum = 0;
    let billSum = 0;

    bottomGridRef.current?.api.forEachNode((node) => {
      totalSum += Number(node.data.id || 0);
      returnSum += Number(node.data.id || 0);
      realSum += Number(node.data.id || 0);
      commissionSum += Number(node.data.id || 0);
      prevStockSum += Number(node.data.id || 0);
      curStockSum += Number(node.data.id || 0);
      pureInSum += Number(node.data.id || 0);
      pureSaleSum += Number(node.data.id || 0);
      sampleSum += Number(node.data.id || 0);
      sampleReturnSum += Number(node.data.id || 0);
      billSum += Number(node.data.id || 0);
    });

    setBottomPinnedRowData([
      {
        partnerName: '합계',
        id: totalSum,
        id_return: returnSum,
        id_real: realSum,
        id_commission: commissionSum,
        id_prevstock: prevStockSum,
        id_curstock: curStockSum,
        id_purein: pureInSum,
        id_puresale: pureSaleSum,
        id_sample: sampleSum,
        id_samplereturn: sampleReturnSum,
        id_bill: billSum,
      },
    ]);
  };

  /**
   * 컴포넌트 렌더링
   */
  return (
    <div>
      {/* 타이틀 영역 */}
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={onSearch} />

      {/* 검색 영역 */}
      <Search className="type_2">
        <Search.DatePickerM title={'검색월'} name={'startDate'} onEnter={onSearch} filters={filters} onChange={onChangeFilters} />
        <Search.Input
          title={'화주'}
          name={'partnerName'}
          placeholder={'화주/도매 검색'}
          value={filters.partnerName}
          onChange={onChangeFilters}
          onEnter={onSearch}
        />
      </Search>
      <Search className="type">물류 청구날짜설정 매월 [Date] 입력</Search>

      {/* 테이블 헤더 영역 */}
      <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={onSearch} />

      {/* 그리드 영역 */}
      <div className="gridBox">
        <div className={`columnGridArea ${isShowSubGrid ? 'show' : ''}`}>
          {/* 상단 그리드 */}
          <div className="InfoGrid" ref={topGridDivRef}>
            <div className="ag-theme-alpine">
              {isPickinginfosLoading ? (
                <CustomGridLoading />
              ) : (
                <AgGridReact
                  ref={topGridRef}
                  rowData={topGridData}
                  columnDefs={topGridColumns}
                  defaultColDef={defaultColDef}
                  onGridReady={onGridReady}
                  gridOptions={{
                    rowHeight: 24,
                    headerHeight: 35,
                    suppressRowClickSelection: true,
                  }}
                  paginationPageSize={paging.pageRowCount}
                  loadingOverlayComponent={CustomGridLoading}
                  noRowsOverlayComponent={CustomNoRowsOverlay}
                  onCellClicked={handleTopGridCellClick}
                  pinnedBottomRowData={pinnedBottomRowData}
                  getRowClass={(params) => {
                    if (params.node.rowPinned === 'bottom') {
                      return 'ag-grid-pinned-row';
                    }
                  }}
                  onFirstDataRendered={updateTotals}
                  onRowDataUpdated={updateTotals}
                />
              )}
            </div>
          </div>

          {/* 하단 그리드 */}
          <div className="DetailGrid" ref={bottomGridDivRef}>
            <div className="ag-theme-alpine">
              {isDetailLoading ? (
                <CustomGridLoading />
              ) : (
                <AgGridReact
                  ref={bottomGridRef}
                  rowData={bottomGridData}
                  columnDefs={bottomGridColumns}
                  defaultColDef={defaultColDef}
                  onGridReady={onGridReady}
                  gridOptions={{
                    rowHeight: 24,
                    headerHeight: 35,
                    suppressRowClickSelection: true,
                  }}
                  loadingOverlayComponent={CustomGridLoading}
                  noRowsOverlayComponent={CustomNoRowsOverlay}
                  domLayout="normal"
                  pinnedBottomRowData={bottomPinnedRowData}
                  getRowClass={(params) => {
                    if (params.node.rowPinned === 'bottom') {
                      return 'ag-grid-pinned-row';
                    }
                  }}
                  onFirstDataRendered={updateBottomTotals}
                  onRowDataUpdated={updateBottomTotals}
                />
              )}
            </div>
          </div>

          {/* 페이지네이션 */}
          <Pagination pageObject={paging} setPaging={setPaging} />
        </div>
      </div>

      {/* 에러 메시지 */}
      {!isPickinginfosSuccess && <div className="error-message">데이터 로딩 중 오류가 발생했습니다. 페이지를 새로고침하거나 관리자에게 문의해주세요.</div>}
    </div>
  );
};

// React.memo를 사용하여 불필요한 리렌더링 방지
export default React.memo(Wsbilllist);
