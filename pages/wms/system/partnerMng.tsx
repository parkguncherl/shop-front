/**
 화주정보
 /wms/system/partnerMng
 */

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
    {
      headerName: '추가',
      field: 'action',
      minWidth: 50,
      cellRenderer: lowAddBtnCellRenderer,
      suppressHeaderMenuButton: true,
    },
    { field: 'no', headerName: 'No', minWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'logisNm', headerName: '센터명', filter: true, minWidth: 150, suppressHeaderMenuButton: true },
    {
      field: 'upperPartnerNm',
      headerName: '대표매장',
      maxWidth: 100,
      minWidth: 100,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value ? params.value : '대표';
      },
      cellStyle: (params) => {
        return {
          ...GridSetting.CellStyle.LEFT,
          color: params.value ? 'gray' : 'blue',
        };
      },
    },
    { field: 'partnerNm', headerName: '매장명', minWidth: 150, suppressHeaderMenuButton: true },
    { field: 'shortNm', headerName: '약어', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'partnerTelNo',
      headerName: '회사 전화번호',
      minWidth: 100,
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
    { field: 'logisId', headerName: '창고key', minWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'repNm', headerName: '대표자명', minWidth: 120, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'repTelNo',
      headerName: '대표자 전화번호',
      minWidth: 120,
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
      minWidth: 120,
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
    { field: 'partnerEmail', headerName: '회사이메일', minWidth: 150, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'addTime', headerName: '시스템 설정시간', minWidth: 110, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
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
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}></TableHeader>
        <div className={'ag-theme-alpine wmsDefault'}>
          <AgGridReact
            headerHeight={35}
            onGridReady={onGridReady}
            loading={isLoading}
            rowData={(partners?.data?.body?.rows as PartnerResponsePaging[]) || []}
            gridOptions={{ rowHeight: 28 }}
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
        <div className={'btnArea'}>
          <button
            className={'btn btnBlue'}
            onClick={() => {
              setSelectedPartner({});
              openModal('ADD');
            }}
          >
            화주 신규추가
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
