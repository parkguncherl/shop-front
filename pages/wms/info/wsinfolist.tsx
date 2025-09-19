/**
 화주/직원 정보 리스트
 /wms/info/wsinfolist
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAgGridApi, useDidMountEffect } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { PartnerResponsePaging } from '../../../generated';
import { Pagination, Search, Table, TableHeader, Title, toastError } from '../../../components';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { PartnerPagingFilter, usePartnerStore } from '../../../stores/usePartnerStore';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { InventoryInfoDetail } from '../../../stores/wms/useInventoryInfoStore';

const Wsinfolist = () => {
  /** Grid Api */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();
  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  /** 스토어 */
  const [paging, setPaging, selectedPartner, setSelectedPartner, modalType, openModal] = usePartnerStore((s) => [
    s.paging,
    s.setPaging,
    s.selectedPartner,
    s.setSelectedPartner,
    s.modalType,
    s.openModal,
  ]);
  /** 필터 */
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<PartnerPagingFilter>({});

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

  // 상단 그리드 컬럼 정의
  const [topColumnDefs] = useState<ColDef[]>([
    { field: 'no', headerName: 'No', minWidth: 50, maxWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'upperPartnerNm', headerName: '대표화주', minWidth: 80, maxWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'partnerNm', headerName: '매장(종사업장)', minWidth: 120, maxWidth: 120, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'shortNm', headerName: '대표약어', minWidth: 100, maxWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'partnerAddr', headerName: '상가위치', minWidth: 100, maxWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'partneraddrEtc', headerName: '세부정보', minWidth: 100, maxWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'partnerTelNo',
      headerName: '회사 전화번호',
      minWidth: 100,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        const value = params.value;
        if (value && typeof value === 'string') {
          return value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        }
        return value;
      },
      suppressHeaderMenuButton: true,
    },
    { field: 'repNm', headerName: '대표자명', minWidth: 100, maxWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'repTelNo',
      headerName: '대표자 전화번호',
      minWidth: 100,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        const value = params.value;
        if (value && typeof value === 'string') {
          return value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        }
        return value;
      },
      suppressHeaderMenuButton: true,
    },
    {
      field: 'compNo',
      headerName: '사업자번호',
      minWidth: 100,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        const value = params.value;
        if (value && typeof value === 'string') {
          return value.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
        }
        return value;
      },
      suppressHeaderMenuButton: true,
    },
    { field: 'partnerEmail', headerName: '회사이메일', minWidth: 140, maxWidth: 140, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'addTime', headerName: '화주OMS설정시간', minWidth: 120, maxWidth: 120, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'snsId', headerName: 'SNS정보', minWidth: 140, maxWidth: 140, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'etcCntn', headerName: '기타', minWidth: 160, maxWidth: 160, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'creTm', headerName: '등록일시', minWidth: 120, maxWidth: 120, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'creUser', headerName: '등록자', minWidth: 120, maxWidth: 120, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'updTm', headerName: '수정일시', minWidth: 120, maxWidth: 120, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'updUser', headerName: '수정자', minWidth: 120, maxWidth: 120, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ]);

  // 하단 그리드 컬럼 정의
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
      field: 'loginId',
      headerName: '아이디',
      minWidth: 90,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'userNm',
      headerName: '사용자명',
      minWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'phoneNo',
      headerName: '전화번호',
      minWidth: 150,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'deptNm',
      headerName: '부서',
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'positionNm',
      headerName: '직책',
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'creUser',
      headerName: '생성자',
      minWidth: 140,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'creTm',
      headerName: '생성일시',
      minWidth: 140,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'updUser',
      headerName: '수정자',
      minWidth: 140,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'updTm',
      headerName: '수정일시',
      minWidth: 140,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
  ]);
  /** 검색 */
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    await partnersRefetch();
  };

  /** 화주관리 페이징 목록 조회 */
  const {
    data: partners,
    isLoading,
    isSuccess: isListSuccess,
    refetch: partnersRefetch,
  } = useQuery(['/partner/paging', paging.curPage], () =>
    authApi.get('/partner/paging', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      },
    }),
  );
  useEffect(() => {
    if (isListSuccess) {
      const { resultCode, body, resultMessage } = partners.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
      } else {
        toastError(resultMessage);
      }
    }
  }, [partners, isListSuccess, setPaging]);

  // 셀 클릭 핸들러
  const handleTopGridCellClick = async (event: any) => {
    if (!event.data) return;

    setIsDetailLoading(true);
    setIsShowSubGrid(true);

    try {
      // Location에 있는 SKU 상세 정보 조회
      const response = await authApi.get(`/user/partner/${event.data.id}`);
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

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };
  useEffect(() => {
    // 검색 조건 또는 페이지가 변경될 때마다 검색 수행
    onSearch();
  }, []);

  /** 드롭다운 옵션 */
  const dropdownOptions = [
    { key: 'SL', value: 'select', label: '선택' },
    { key: 'HW', value: '0', label: '화주' },
    { key: 'DM', value: 'any', label: '도매' },
  ];
  /** 드롭다운 변경 시 */
  const onChangeOptions = useCallback(async (name: string, value: string | number) => {
    dispatch({ name: name, value: value });
  }, []);
  useDidMountEffect(() => {
    // 드롭다운 변경시
    onSearch();
  }, [filters.upperPartnerId]);

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} search={search} />

      <Search className="type_2 full">
        <Search.Input
          title={'검색'}
          name={'partnerNm'}
          placeholder={'소매처 입력'}
          value={filters.partnerNm}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.TwoDatePicker
          title={'기간'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onEnter={search}
          filters={filters}
          onChange={onChangeFilters}
        />
        <Search.DropDown
          title={'구분'}
          name={'upperPartnerId'}
          defaultOptions={dropdownOptions}
          placeholder={'파트너 구분'}
          onChange={onChangeOptions}
          // onEnter={onEnter}
        />
      </Search>

      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}>
          <div className={'btnArea'}></div>
        </TableHeader>
        <div className="gridBox">
          <div className={`tblPreview columnGridArea ${isShowSubGrid ? 'show' : ''}`}>
            <div className="InfoGrid" ref={topGridDivRef}>
              <div className={'ag-theme-alpine wmsDefault'}>
                <AgGridReact
                  ref={topGridRef}
                  headerHeight={35}
                  onGridReady={onGridReady}
                  loading={isLoading}
                  rowData={(partners?.data?.body?.rows as PartnerResponsePaging[]) || []}
                  gridOptions={{ rowHeight: 28 }}
                  columnDefs={topColumnDefs}
                  defaultColDef={defaultColDef}
                  paginationPageSize={paging.pageRowCount}
                  rowSelection={'multiple'}
                  onRowClicked={(e) => {
                    setSelectedPartner(e.data as PartnerResponsePaging);
                    e.api.deselectAll();
                  }}
                  onCellClicked={handleTopGridCellClick}
                  loadingOverlayComponent={CustomGridLoading}
                  noRowsOverlayComponent={CustomNoRowsOverlay}
                />
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
                    columnDefs={bottomColumnDefs}
                    rowData={bottomGridData}
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
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
    </div>
  );
};

export default Wsinfolist;
