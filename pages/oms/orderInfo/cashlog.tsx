import React, { useCallback, useEffect, useState } from 'react';
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
import PartnerAddPop from '../../../components/popup/partner/PartnerAddPop';
import PartnerModPop from '../../../components/popup/partner/PartnerModPop';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';

const PartnerMng = () => {
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

  // 파트너 추가하기 버튼 렌더링
  const lowAddBtnCellRenderer = (params: any) => {
    const upperPartnerNmColumn = params.data.upperPartnerNm;
    const onClick = () => {
      setSelectedPartner({});
      openModal('ADD');
    };
    // 화주만 추가할수있음 도매 X
    if (!upperPartnerNmColumn) {
      return (
        <div className="btnArea center">
          <button className="btn tblBtn" onClick={onClick}>
            +
          </button>
        </div>
      );
    } else {
      return null;
    }
  };

  const [columnDefs] = useState<ColDef[]>([
    { field: 'no', headerName: 'No', minWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '입력일자', minWidth: 150, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '계정과목', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '입금금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '출금금액', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '사용자', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '업체명', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '수량', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: ' ', headerName: '비고', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ]); // 컬럼헤더

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

  /** 셀 클릭 이벤트 */
  const onCellClicked = async (cellClickedEvent: CellClickedEvent) => {
    const { colDef, data } = cellClickedEvent;
    // 버튼 셀 제외
    if (colDef.field === 'action') {
      return;
    }
    openModal('MOD');
  };

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} search={search} />
      <span style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>(참고: 매장용도로 판매외 별로도 사용하는 내역 ※ 매출에 안잡히는내역 )</span>

      <Search className="type_2">
        <Search.TwoDatePicker
          title={'영업일자'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onEnter={search}
          filters={filters}
          onChange={onChangeFilters}
        />
        <Search.Input
          title={'계정과목'}
          name={'StockinOutNm'}
          placeholder={'계정과목 입력'}
          value={filters.StockinOutNm}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.Input
          title={'사용자'}
          name={'StockinOutNm'}
          placeholder={'사용자 입력'}
          value={filters.StockinOutNm}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.Input
          title={'내용'}
          name={'StockinOutNm'}
          placeholder={'내용 검색'}
          value={filters.StockinOutNm}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
      </Search>

      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}></TableHeader>
        <div className={'ag-theme-alpine'}>
          <AgGridReact
            headerHeight={35}
            onGridReady={onGridReady}
            loading={isLoading}
            rowData={(partners?.data?.body?.rows as PartnerResponsePaging[]) || []}
            gridOptions={{ rowHeight: 24 }}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            paginationPageSize={paging.pageRowCount}
            rowSelection={'multiple'}
            onCellClicked={onCellClicked}
            onRowClicked={(e) => {
              setSelectedPartner(e.data as PartnerResponsePaging);
              e.api.deselectAll();
            }}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
          />
        </div>
        <div className="btnArea right">
          <button className="btn" title="추가">
            추가
          </button>
          <button className="btn" title="수정">
            수정
          </button>
          <button className="btn" title="삭제">
            삭제
          </button>
          <button className="btn" title="계정과목관리" onClick={() => openModal('CATEGORYSETTING')}>
            계정과목관리
          </button>
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
      {modalType.type === 'ADD' && modalType.active && <PartnerAddPop data={selectedPartner || {}} />}
      {modalType.type === 'MOD' && modalType.active && <PartnerModPop datas={selectedPartner || {}} />}
    </div>
  );
};

export default PartnerMng;
