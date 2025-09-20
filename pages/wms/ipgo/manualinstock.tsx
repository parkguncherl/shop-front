import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Button, Table, TableHeader, Title, toastSuccess } from '../../../components';
import { Pagination, toastError } from '../../../components';
import { useManualinstockStore } from '../../../stores/wms/useManualinstockStore';
import { ColDef, RowClassParams } from 'ag-grid-community';
import { useMutation } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import useFilters from '../../../hooks/useFilters';
import { useCommonStore } from '../../../stores';
import { AgGridReact } from 'ag-grid-react';
import { ManualinstockPagingFilter, ManualinstockResponsePaging } from '../../../generated';
import { useSession } from 'next-auth/react';
import PartnerSkuSearch from './PartnerSkuSearch';
import { CustomHoldReasonEditor } from '../../../components/CustomHoldReasonEditor';
import { Utils } from '../../../libs/utils';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';

/**
 * 선택된 데이터의 인터페이스 정의
 */
interface SelectedData {
  partnerId: number; // 파트너 ID
  partnerNm: string; // 파트너 이름
  id: number; // SKU ID
  prodAttrAndProdNm: string;
  skuNm: string; // SKU 이름
  prodNm: string; // 제품 이름
  skuColor: string; // SKU 색상
  skuSize: string; // SKU 사이즈
  factoryId: number; //공장 ID
  factoryNm: string; // 공장 이름
  stockRsnCd: string; // 공장 이름
  hasAsn: string; // 발주 여부 (Y/N)
  totalAsnCnt: number; // 총 발주 수량
}

/**
 * Manualinstock 메인 컴포넌트
 */
const Manualinstock = () => {
  // 기본 설정 및 훅 초기화
  const session = useSession();
  const gridRef = useRef<AgGridReact>(null);
  const { upMenuNm, menuNm } = useCommonStore();
  const { paging, setPaging, createManualInstock } = useManualinstockStore();

  // 상태 관리
  const [rowDatas, setRowDatas] = useState<ManualinstockResponsePaging[]>([]);
  const [, setSelectedRowIndex] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  // 필터 설정
  const [filters, onChangeFilters] = useFilters<ManualinstockPagingFilter>({
    logisId: session.data?.user.workLogisId ? Number(session.data.user.workLogisId) : undefined,
  });

  /**
   * 그리드 컬럼 정의
   */
  const manualinstockColumns = useMemo<ColDef[]>(
    () => [
      {
        // 체크박스 컬럼
        minWidth: 50,
        maxWidth: 50,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'partnerNm',
        headerName: '화주명',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodAttrAndProdNm',
        headerName: '상품명',
        maxWidth: 150,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuSize',
        headerName: '사이즈',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuColor',
        headerName: '컬러',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'stockCnt',
        headerName: '수량',
        minWidth: 80,
        maxWidth: 80,
        editable: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => params.value?.toLocaleString(),
      },
      {
        field: 'factoryNm',
        headerName: '공장입력',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'stockRsnCd',
        headerName: '사유 코드',
        maxWidth: 150,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        editable: true,
        ...CustomHoldReasonEditor('10250'),
      },
      {
        field: 'hasAsn',
        headerName: '화주ASN확정여부',
        maxWidth: 120,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        cellRenderer: 'agCheckboxCellRenderer',
        valueGetter: (params) => {
          return params.data.hasAsn === 'Y'; // 'Y'일 때 체크, 'N'일 때 체크 해제
        },
        editable: false, // 수정 불가
      },
      {
        field: 'totalAsnCnt',
        headerName: '화주발주수량',
        maxWidth: 80,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
    ],
    [],
  );

  /**
   * 검색 결과 선택 핸들러
   */
  const handleSearchSelect = (selectedData: SelectedData[]) => {
    if (!selectedData.length) return;

    setRowDatas((prev) => {
      const lastNo = prev.length > 0 ? Number(prev[prev.length - 1].no || 0) : 0;

      const newRows = selectedData.map((item, index) => ({
        partnerId: item.partnerId,
        partnerNm: item.partnerNm,
        prodAttrAndProdNm: item.prodAttrAndProdNm,
        skuId: item.id,
        skuNm: item.skuNm,
        prodNm: item.prodNm,
        factoryId: item.factoryId,
        factoryNm: item.factoryNm,
        skuColor: item.skuColor,
        skuSize: item.skuSize,
        stockCnt: 1,
        no: lastNo + index + 1,
        isSelected: true,
        hasAsn: item.hasAsn,
        totalAsnCnt: item.totalAsnCnt,
      }));

      return [...prev, ...newRows];
    });

    setShowSearch(false);

    setTimeout(() => {
      if (gridRef.current?.api) {
        const firstRowIndex = gridRef.current.api.getDisplayedRowCount() - 1;
        gridRef.current.api.setFocusedCell(firstRowIndex, 'stockCnt');
        gridRef.current.api.startEditingCell({
          rowIndex: firstRowIndex,
          colKey: 'stockCnt',
        });
      }
    }, 100);
  };

  /**
   * 데이터 저장 뮤테이션
   */
  const { mutate: createMutate } = useMutation(createManualInstock, {
    onSuccess: (response) => {
      if (response.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        setRowDatas([]);
      } else {
        toastError(response.data.resultMessage);
      }
    },
  });

  /**
   * 저장 버튼 핸들러
   */
  const handleSave = async () => {
    const invalidRows = rowDatas.filter((row) => !row.partnerId || !row.skuId || !row.stockCnt);
    if (invalidRows.length > 0) {
      toastError('필수 입력값이 누락되었습니다.');
      return;
    }

    for (const row of rowDatas) {
      if (!row.id) {
        const saveData = {
          logisId: Number(session.data?.user.workLogisId),
          partnerId: row.partnerId,
          asnDetails: {
            skuId: row.skuId,
            stockCnt: row.stockCnt,
            zone: row.zone,
            stockRsnCd: row.stockRsnCd || '',
            stockCd: '3',
            factoryId: row.factoryId,
          }, // 단일 객체
        };
        await createMutate(saveData); // 단일 객체 전달
      }
    }
  };

  /**
   * 선택된 행 삭제 핸들러
   */
  const handleDeleteSelected = () => {
    if (!gridRef.current?.api) return;

    const selectedNodes = gridRef.current.api.getSelectedNodes();

    if (selectedNodes.length === 0) {
      if (rowDatas.length === 0) {
        toastError('삭제할 데이터가 없습니다.');
        return;
      }

      const newData = rowDatas.slice(0, -1);
      setRowDatas(newData);
      return;
    }

    const selectedIndexes = new Set(selectedNodes.map((node) => node.rowIndex));
    const newData = rowDatas.filter((_, index) => !selectedIndexes.has(index));

    setRowDatas(newData);
    toastSuccess(`${selectedNodes.length}개 행이 삭제되었습니다.`);
  };

  /**
   * 행 추가 핸들러
   */
  const handleAddRow = () => {
    setShowSearch(true);
  };

  /**
   * 자동 선택 설정
   */
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.forEachNode((node) => {
        if (node.data.isSelected) {
          node.setSelected(true);
        }
      });
    }
  }, [rowDatas]);

  /**
   * 배경행 no숫자별 색상 정렬 홀수일때만 ag-grid-changeOrder적용
   */
  const addClass = (currentClass: string, newClass: string) => (currentClass ? `${currentClass} ${newClass}` : newClass);
  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    // params와 params.data가 존재하는지 체크
    if (params?.data?.no) {
      const rowNumber = parseInt(params.data.no);
      if (!isNaN(rowNumber) && rowNumber % 2 === 1) {
        rtnValue = addClass(rtnValue, 'ag-grid-changeOrder');
      }
    }
    return rtnValue;
  }, []);

  return (
    <div className="relative">
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} />
      <Table>
        <TableHeader count={rowDatas.length} paging={paging} setPaging={setPaging}></TableHeader>
        {/* AG Grid 컴포넌트 */}
        <div className="ag-theme-alpine noSearch">
          <AgGridReact
            ref={gridRef}
            rowData={rowDatas}
            columnDefs={manualinstockColumns}
            defaultColDef={defaultColDef}
            gridOptions={{
              rowHeight: 28,
              headerHeight: 35,
              suppressRowClickSelection: true,
              rowSelection: 'multiple',
            }}
            onGridReady={(params) => {
              params.api.sizeColumnsToFit();
            }}
            enableRangeSelection={true}
            rowMultiSelectWithClick={true}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            getRowClass={getRowClass}
          />
        </div>
        <div className={'btnArea'}>
          <CustomShortcutButton className="btn btnBlue" onClick={handleAddRow} shortcut={COMMON_SHORTCUTS.alt1}>
            상품추가
          </CustomShortcutButton>
          <CustomShortcutButton className="btn" onClick={handleDeleteSelected} shortcut={COMMON_SHORTCUTS.ctrlZ}>
            삭제
          </CustomShortcutButton>
          <CustomShortcutButton className="btn btnGreen" onClick={handleSave} shortcut={COMMON_SHORTCUTS.save}>
            입하저장
          </CustomShortcutButton>
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>

      {/* 검색 모달 */}
      {showSearch && (
        <span>
          <button
            onClick={() => {
              setShowSearch(false);
              setSelectedRowIndex(null);
            }}
          />
          <PartnerSkuSearch
            onSelect={handleSearchSelect}
            isOpen={showSearch}
            onClose={() => {
              setShowSearch(false);
              setSelectedRowIndex(null);
            }}
          />
        </span>
      )}
    </div>
  );
};

export default React.memo(Manualinstock);
