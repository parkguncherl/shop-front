import React, { useEffect, useRef, useState } from 'react';
import { Button, Search, Table, Title, toastError, toastSuccess } from '../../../components';
import { Pagination, TableHeader } from '../../../components';
import { useQuery } from '@tanstack/react-query';
import { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { GridSetting } from '../../../libs/ag-grid';
import { useAgGridApi } from '../../../hooks';
import { PARTNER_CODE } from '../../../libs/const';
import { useInventoryInfoStore, InventoryInfoDetail } from '../../../stores/wms/useInventoryInfoStore';
import { useCommonStore, usePartnerCodeStore } from '../../../stores';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { authApi } from '../../../libs';
import useFilters from '../../../hooks/useFilters';
import { useSession } from 'next-auth/react';

const Invenadjustment: React.FC = () => {
  // ag-Grid 레퍼런스 및 API 훅
  const gridRef = useRef<AgGridReact>(null);
  const { onGridReady } = useAgGridApi();

  // 세션 정보 가져오기
  const session = useSession();

  // 상위 메뉴명과 현재 메뉴명 상태
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  // 파트너 코드 상태 관리 훅
  const [selectPartnerCodeDropdown] = usePartnerCodeStore((s) => [s.selectPartnerCodeDropdown]);

  // 재고 정보 스토어에서 필요한 상태와 함수 가져오기
  const { paging, setPaging, getInventoryInfoDetail } = useInventoryInfoStore();

  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    searchKeyword: '',
    partnerId: session.data?.user.partnerId,
    compCntn: '',
    partnerNm: '',
    seasonCd: [],
    skuSize: [],
    skuColor: '',
    prodAttrCd: '',
    sleepYn: '',
    designId: null,
    factoryId: null,
  });

  // 그리드 컬럼 정의 및 데이터 상태
  const [topColumnDefs, setTopColumnDefs] = useState<ColDef[]>([]);
  const [bottomColumnDefs, setBottomColumnDefs] = useState<ColDef[]>([]);
  const [topGridData, setTopGridData] = useState<InventoryInfoDetail[]>([]);
  const [bottomGridData, setBottomGridData] = useState<InventoryInfoDetail[]>([]);
  const [selectedTopRow, setSelectedTopRow] = useState<InventoryInfoDetail | null>(null);

  // 상세 정보 로딩 상태
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // 파트너 코드 드롭다운 데이터 조회
  const { data: partnerCodeList, isLoading: isCustStateLoading } = useQuery(['/partnerCode/dropdown'], () =>
    selectPartnerCodeDropdown(PARTNER_CODE.categories),
  );

  // 각 ref 사용
  const topGridRef = useRef<AgGridReact>(null);
  const bottomGridRef = useRef<AgGridReact>(null);

  // 재고 정보 목록 조회
  const {
    data: inventoryInfos,
    isLoading: isInventoryInfosLoading,
    isSuccess: isPagingSuccess,
    refetch: inventoryInfoRefetch,
  } = useQuery(
    ['/wms/inven/paging', paging.curPage],
    () =>
      authApi.get('/wms/inven/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
    {
      enabled: !isCustStateLoading,
    },
  );

  // 컬럼 정의 설정
  useEffect(() => {
    // 상단 그리드 컬럼 정의 (SKU 정보 및 총 재고수)
    setTopColumnDefs([
      { field: 'no', headerName: '번호', minWidth: 50, maxWidth: 50, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'partnerNm', headerName: '화주', width: 70, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'skuCd', headerName: 'SKU 코드', width: 160, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'prodNm', headerName: '상품명', width: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'skuColor', headerName: '색상', width: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'skuSize', headerName: '사이즈', width: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'inventoryAmt', headerName: '적치위치', width: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'inventoryAmt', headerName: '물류재고수량', width: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      {
        field: 'stockCnt',
        headerName: '입력수량',
        editable: true,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        cellClass: 'custom-cell-color',
        suppressHeaderMenuButton: true,
        headerClass: 'custom-header-class',
        valueParser: (params) => {
          const newValue = Number(params.newValue);
          if (isNaN(newValue) || newValue < 0) {
            toastError('숫자(양수)만 입력가능합니다.', { autoClose: 1000 });
            return 0;
          }
          return isNaN(newValue) ? 0 : newValue;
        },
        valueFormatter: (params) => {
          const asnCnt = params.data.asnCnt ? Number(params.data.asnCnt) : 0;
          return params.value ? params.value : asnCnt;
        },
      },
      {
        field: '',
        headerName: '사유',
        width: 120,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        headerClass: 'custom-header-class',
        cellClass: 'custom-cell-color',
        editable: true,
      },
      {
        field: '',
        headerName: '기타',
        width: 120,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        headerClass: 'custom-header-class',
        cellClass: 'custom-cell-color',
        editable: true,
      },
    ]);

    // 하단 그리드 컬럼 정의 (상세 재고 정보 및 위치)
    setBottomColumnDefs([
      { field: 'no', headerName: '번호', minWidth: 50, maxWidth: 50, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'partnerNm', headerName: '화주', width: 70, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'skuCd', headerName: 'SKU 코드', width: 120, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'prodNm', headerName: '상품명', width: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'skuColor', headerName: '색상', width: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'skuSize', headerName: '사이즈', width: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'inventoryAmt', headerName: '화주재고수량', width: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      {
        field: 'stockCnt',
        headerName: '입력수량',
        editable: true,
        maxWidth: 100,
        cellClass: 'custom-cell-color',
        suppressHeaderMenuButton: true,
        headerClass: 'custom-header-class',
        cellStyle: GridSetting.CellStyle.CENTER,
        valueParser: (params) => {
          const newValue = Number(params.newValue);
          if (isNaN(newValue) || newValue < 0) {
            toastError('숫자(양수)만 입력가능합니다.', { autoClose: 1000 });
            return 0;
          }
          return isNaN(newValue) ? 0 : newValue;
        },
        valueFormatter: (params) => {
          const asnCnt = params.data.asnCnt ? Number(params.data.asnCnt) : 0;
          return params.value ? params.value : asnCnt;
        },
      },
      {
        field: '',
        headerName: '사유',
        width: 120,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        headerClass: 'custom-header-class',
        cellClass: 'custom-cell-color',
        editable: true,
      },
      {
        field: '',
        headerName: '기타',
        width: 120,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        headerClass: 'custom-header-class',
        cellClass: 'custom-cell-color',
        editable: true,
      },
    ]);
  }, []);

  // 출고정보 목록 조회 결과 처리
  useEffect(() => {
    if (isPagingSuccess && inventoryInfos?.data) {
      const { resultCode, body, resultMessage } = inventoryInfos.data;
      if (resultCode === 200 && body) {
        setPaging(body.paging);
        setTopGridData(body.rows || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [inventoryInfos, isPagingSuccess, setPaging]);

  // 검색 버튼 클릭 시 실행되는 함수
  const search = async () => {
    filters.partnerId = session.data?.user.partnerId;
    await onSearch();
  };

  // 검색 실행 함수
  const onSearch = async () => {
    filters.partnerId = session.data?.user.partnerId;
    setPaging({
      curPage: 1,
    });
    await inventoryInfoRefetch();
  };

  // 초기화 버튼 클릭 시 실행되는 함수
  const reset = async () => {
    onFiltersReset();
    filters.partnerId = session.data?.user.partnerId;
    await onSearch();
  };

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  function handleSave() {}

  return (
    <div>
      {/* 타이틀 컴포넌트 */}
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} search={search} filters={filters} reset={reset} />

      {/* 검색 컴포넌트 */}
      <Search className="type2_full">
        <Search.Input
          title={'도매명'}
          name={'partnerNm'}
          placeholder={'도매명 검색'}
          value={filters.partnerNm}
          onChange={onChangeFilters}
          onEnter={onSearch}
          filters={filters}
        />
        <Search.Input
          title={'상품검색'}
          name={'searchKeyword'}
          placeholder={'상품코드/상품명 검색'}
          value={filters.searchKeyword}
          onChange={onChangeFilters}
          onEnter={onSearch}
          filters={filters}
        />
      </Search>

      {/* 테이블 헤더 컴포넌트 */}
      <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={inventoryInfoRefetch} choiceCount={50}>
        <button className="btn btnGreen" onClick={handleSave}>
          저장
        </button>
      </TableHeader>

      <div className="gridBox">
        {/* 상단 그리드 (SKU 정보 및 총 재고수) */}
        <div className="InfoGrid">
          물류재고
          <div className={'ag-theme-alpine'} style={{ height: '400px' }}>
            <AgGridReact
              ref={topGridRef}
              onGridReady={onGridReady}
              gridOptions={{ rowHeight: 24, headerHeight: 35 }}
              rowData={topGridData}
              columnDefs={topColumnDefs}
              paginationPageSize={paging.pageRowCount}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              rowSelection="multiple"
            />
            )
          </div>
        </div>
        <div className="DetailGrid">
          화주재고
          <div className={'ag-theme-alpine'} style={{ height: '400px' }}>
            <AgGridReact
              ref={bottomGridRef}
              gridOptions={{ rowHeight: 24, headerHeight: 35 }}
              onGridReady={onGridReady}
              rowData={topGridData}
              columnDefs={bottomColumnDefs}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              domLayout="normal"
              suppressRowHoverHighlight={false}
            />
            )
          </div>
        </div>
      </div>

      {/* 페이지네이션 컴포넌트 */}
      <Pagination pageObject={paging} setPaging={(newPaging) => setPaging({ ...paging, ...newPaging })} />
    </div>
  );
};

export default Invenadjustment;
