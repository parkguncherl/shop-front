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
import { Utils } from '../../../../libs/utils';

interface InvenSkuProps {
  filters: any;
  paging: any;
  setPaging: any;
  searchTrigger: boolean;
}

/**
 * Loc 단위 재고 정보 그리드 컴포넌트
 */
const InvenSku: React.FC<InvenSkuProps> = ({ filters, paging, setPaging, searchTrigger }) => {
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
      headerName: 'No.',
      minWidth: 50,
      maxWidth: 50,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'zoneCdNm',
      headerName: 'ZONE 명',
      width: 70,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'zoneCd',
      headerName: 'ZONE 코드',
      width: 120,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'location',
      headerName: 'LOC명',
      width: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'locCntn',
      headerName: 'LOC설명',
      width: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'skuAmt',
      headerName: '총품목수',
      width: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },

    {
      field: 'inventoryAmt',
      headerName: '총재고수',
      width: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
  ]);

  // 하단 그리드 컬럼 정의
  const [bottomColumnDefs] = useState<ColDef[]>([
    {
      field: 'no',
      headerName: 'No.',
      minWidth: 50,
      maxWidth: 50,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'partnerNm',
      headerName: '도매',
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'prodCd',
      headerName: '상품 코드',
      minWidth: 120,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'skuCd',
      headerName: 'SKU 코드',
      minWidth: 120,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'prodNm',
      headerName: '상품명',
      minWidth: 140,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'skuColor',
      headerName: '컬러',
      minWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'skuSize',
      headerName: '사이즈',
      minWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'skuNm',
      headerName: '스큐명',
      minWidth: 180,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'inventoryAmt',
      headerName: '물류 재고수',
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    {
      field: 'sellAmt',
      headerName: '도매가',
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'marRate',
      headerName: '마진율',
      minWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'orgAmt',
      headerName: '원가',
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'sleepYn',
      headerName: '휴먼',
      minWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      cellRenderer: 'agCheckboxCellRenderer',
      valueGetter: (params) => {
        return params.data.sleepYn === 'Y'; // 'Y'일 때 체크, 'N'일 때 체크 해제
      },
      editable: false, // 수정 불가
    },
    {
      field: 'gubunCntn',
      headerName: '구분',
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'factoryNm',
      headerName: '메인공장',
      minWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'designNm',
      headerName: '디자이너',
      minWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'prodattrCd',
      headerName: '제작',
      minWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'seasonCd',
      headerName: '시즌',
      minWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'releaseYmd',
      headerName: '출시일',
      minWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'minasnCnt',
      headerName: '최소발주수량',
      minWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'fabric',
      headerName: '원단',
      minWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'compCntn',
      headerName: '혼용율',
      minWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'funcCd',
      headerName: '스타일1',
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'funcdetCd',
      headerName: '스타일2',
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'inAmt',
      headerName: '입고가',
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'retailAmt',
      headerName: '소매가',
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'skuCntn',
      headerName: '비고',
      minWidth: 120,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'extbarCode',
      headerName: '외부바코드',
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'inbarCode',
      headerName: '내부바코드',
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'yochug',
      headerName: '요척',
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'creUser',
      headerName: '생성자',
      minWidth: 140,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'creTm',
      headerName: '생성일시',
      minWidth: 140,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'updUser',
      headerName: '수정자',
      minWidth: 140,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'updTm',
      headerName: '수정일시',
      minWidth: 140,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
  ]);
  const {
    data: inventoryInfos,
    isLoading: isInventoryInfosLoading,
    isSuccess: isPagingSuccess,
    refetch: inventoryInfoRefetch,
  } = useQuery(
    ['/wms/inven/loc/paging', paging.curPage, paging.pageRowCount, searchTrigger], // filters 추가
    () =>
      authApi.get('/wms/inven/loc/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          partnerId: filters.partnerId === '0' ? undefined : filters.partnerId, // partnerId 처리
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
        toastError(resultMessage || '재고 목록 조회에 실패했습니다.');
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
      const response = await authApi.get(`/wms/inven/loc/${event.data.id}`);
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
      <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={inventoryInfoRefetch}>
        <button className="btn icoPrint" title="프린트">
          프린트
        </button>
      </TableHeader>

      <div className="gridBox">
        <div className={`tblPreview columnGridArea ${isShowSubGrid ? 'show' : ''}`}>
          <div className="InfoGrid" ref={topGridDivRef}>
            <div className="ag-theme-alpine wmsDefault">
              {isInventoryInfosLoading ? (
                <CustomGridLoading />
              ) : (
                <AgGridReact
                  ref={topGridRef}
                  onGridReady={onGridReady}
                  gridOptions={{ rowHeight: 28, headerHeight: 35, alwaysShowHorizontalScroll: true }}
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
            <div className="ag-theme-alpine wmsDefault">
              {isDetailLoading ? (
                <CustomGridLoading />
              ) : (
                <AgGridReact
                  ref={bottomGridRef}
                  gridOptions={{ rowHeight: 28, headerHeight: 35 }}
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

export default React.memo(InvenSku);
