// pages/wms/inven/components/invenloc.tsx

import React, { useEffect, useRef, useState } from 'react';
import { TableHeader } from '../../../../components';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { useAgGridApi } from '../../../../hooks';
import CustomGridLoading from '../../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../../components/CustomNoRowsOverlay';
import { GridSetting } from '../../../../libs/ag-grid';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import { toastError } from '../../../../components';
import { Pagination } from '../../../../components';
import { InventoryInfoDetail } from '../../../../stores/wms/useInventoryInfoStore';

interface InvenLocProps {
  filters: any;
  paging: any;
  setPaging: any;
  searchTrigger: boolean;
}

/**
 * Location 단위 재고 정보 그리드 컴포넌트
 */
const InvenLoc: React.FC<InvenLocProps> = ({ filters, paging, setPaging, searchTrigger }) => {
  const { onGridReady } = useAgGridApi();

  // 그리드 데이터 상태
  const [topGridData, setTopGridData] = useState<InventoryInfoDetail[]>([]);
  const [bottomGridData, setBottomGridData] = useState<InventoryInfoDetail[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isShowSubGrid, setIsShowSubGrid] = useState<boolean>(false);

  // Grid Refs
  const topGridRef = useRef<AgGridReact>(null);
  const bottomGridRef = useRef<AgGridReact>(null);
  const topGridDivRef = useRef<HTMLDivElement>(null);
  const bottomGridDivRef = useRef<HTMLDivElement>(null);

  // 상단 그리드 컬럼 정의 (Location 정보)
  const [topColumnDefs] = useState<ColDef[]>([
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      filter: false,
      sortable: false,
      maxWidth: 30,
      minWidth: 30,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'no',
      headerName: '번호',
      minWidth: 50,
      maxWidth: 50,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'partnerNm',
      headerName: 'ZONE 명',
      width: 70,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'skuCd',
      headerName: 'ZONE 코드',
      width: 120,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'prodNm',
      headerName: 'LOC 명',
      width: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'skuColor',
      headerName: 'LOC 코드',
      width: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'inventoryAmt',
      headerName: '총 재고수',
      width: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
  ]);

  // 하단 그리드 컬럼 정의 (Location별 SKU 정보)
  const [bottomColumnDefs] = useState<ColDef[]>([
    {
      field: 'no',
      headerName: '번호',
      minWidth: 50,
      maxWidth: 50,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'prodNm',
      headerName: '상품명',
      width: 160,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'skuColor',
      headerName: '색상',
      width: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'skuSize',
      headerName: '사이즈',
      width: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'partnerNm',
      headerName: '화주',
      width: 120,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'skuCnt',
      headerName: '수량',
      width: 120,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
  ]);

  // 데이터 조회
  const {
    data: inventoryInfos,
    isLoading: isInventoryInfosLoading,
    isSuccess: isPagingSuccess,
    refetch: inventoryInfoRefetch,
  } = useQuery(
    ['/wms/inven/paging', paging.curPage, searchTrigger], // Location용 별도 엔드포인트
    () =>
      authApi.get('/wms/inven/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
    {
      enabled: true,
    },
  );

  // 데이터 설정
  useEffect(() => {
    if (isPagingSuccess && inventoryInfos?.data) {
      const { resultCode, body, resultMessage } = inventoryInfos.data;
      if (resultCode === 200 && body) {
        setPaging(body.paging);
        setTopGridData(body.rows || []);
      } else {
        toastError(resultMessage || 'Location별 재고 목록 조회에 실패했습니다.');
      }
    }
  }, [inventoryInfos, isPagingSuccess, setPaging]);

  // 셀 클릭 핸들러
  const handleTopGridCellClick = async (event: any) => {
    if (!event.data) return;

    setIsDetailLoading(true);
    setIsShowSubGrid(true);

    try {
      // Location에 있는 SKU 상세 정보 조회
      const response = await authApi.get(`/wms/inven/loc/detail/${event.data.id}`);
      if (response.data.resultCode === 200 && response.data.body) {
        setBottomGridData(Array.isArray(response.data.body) ? response.data.body : [response.data.body]);
      } else {
        toastError(response.data.resultMessage || 'Location 상세 정보를 불러오는데 실패했습니다.');
        setBottomGridData([]);
      }
    } catch (error) {
      console.error('Location 상세 정보 조회 오류:', error);
      toastError('Location 상세 정보를 불러오는데 실패했습니다.');
      setBottomGridData([]);
    } finally {
      setIsDetailLoading(false);
    }
  };

  /**
   * 영역 외 클릭시 하단 그리드 닫힘 처리
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const topGridElement = topGridDivRef.current;
      const bottomGridElement = bottomGridDivRef.current;

      if (topGridElement && bottomGridElement && !topGridElement.contains(event.target as Node) && !bottomGridElement.contains(event.target as Node)) {
        setIsShowSubGrid(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={inventoryInfoRefetch} choiceCount={50}>
        <button className="btn icoPrint" title="프린트">
          프린트
        </button>
      </TableHeader>

      <div className="gridBox">
        <div className={`tblPreview columnGridArea ${isShowSubGrid ? 'show' : ''}`}>
          <div className="InfoGrid" ref={topGridDivRef}>
            <div className="ag-theme-alpine">
              {'위치 정보'}
              {isInventoryInfosLoading ? (
                <CustomGridLoading />
              ) : (
                <AgGridReact
                  ref={topGridRef}
                  onGridReady={onGridReady}
                  gridOptions={{ rowHeight: 24, headerHeight: 35 }}
                  rowData={topGridData}
                  columnDefs={topColumnDefs}
                  paginationPageSize={paging.pageRowCount}
                  onCellClicked={handleTopGridCellClick}
                  loadingOverlayComponent={CustomGridLoading}
                  noRowsOverlayComponent={CustomNoRowsOverlay}
                  rowSelection="multiple"
                  suppressRowClickSelection={true}
                />
              )}
            </div>
          </div>

          <div className="DetailGrid" ref={bottomGridDivRef}>
            <div className="ag-theme-alpine">
              {'적치 SKU 정보'}
              {isDetailLoading ? (
                <CustomGridLoading />
              ) : (
                <AgGridReact
                  ref={bottomGridRef}
                  gridOptions={{ rowHeight: 24, headerHeight: 35 }}
                  onGridReady={onGridReady}
                  rowData={bottomGridData}
                  columnDefs={bottomColumnDefs}
                  loadingOverlayComponent={CustomGridLoading}
                  noRowsOverlayComponent={CustomNoRowsOverlay}
                  domLayout="normal"
                  suppressRowHoverHighlight={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <Pagination pageObject={paging} setPaging={(newPaging: any) => setPaging({ ...paging, ...newPaging })} />
    </>
  );
};

export default React.memo(InvenLoc);
