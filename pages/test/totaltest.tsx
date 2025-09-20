import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import { Search, Table, TableHeader, Pagination } from '../../components';
import { useCommonStore, useContactState } from '../../stores';
import { useTranslation } from 'react-i18next';
import { defaultColDef } from '../../libs/ag-grid';
import { AccessLogDeatilPop } from '../../components/popup/system/accessLog';
import { useAgGridApi } from '../../hooks';
import useFilters from '../../hooks/useFilters';
import { Placeholder } from '../../libs/const';

interface Product {
  category: string;
  status: string;
  invoice: string;
  retailer: string;
  salesAmount: number;
  returnAmount: number;
  discountAmount: number;
  unitPriceDiscount: number;
  cashDeposit: number;
  bankDeposit: number;
}

const Today: React.FC = () => {
  const { t } = useTranslation();
  const { gridApi, onGridReady } = useAgGridApi();

  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  const [modalType, openModal, paging, setSelectContact, setPaging] = useContactState((s) => [
    s.modalType,
    s.openModal,
    s.paging,
    s.setSelectContact,
    s.setPaging,
  ]);

  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    loginId: undefined,
    userNm: undefined,
  });
  const [rowData, setRowData] = useState<Product[]>([]);

  const reset = async () => {
    await onFiltersReset();
    setPaging({ curPage: 1 });
  };

  const onRowClicked = (e: any) => {
    const selectedData = e.api.getSelectedRows()[0];
    setSelectContact(selectedData);
    openModal('DETAIL');
    e.api.deselectAll();
  };

  let columnDefs: ColDef[];
  // eslint-disable-next-line prefer-const
  columnDefs = [
    {
      field: 'category',
      headerName: '카테고리',
      filter: 'agSetColumnFilter',
      cellStyle: { textAlign: 'center' }, // 중앙 정렬
      minWidth: 105,
      maxWidth: 130,
    },
    {
      field: 'status',
      headerName: '출고상태',
      filter: 'agSetColumnFilter',
      cellStyle: { textAlign: 'center' }, // 중앙 정렬
      minWidth: 105,
      maxWidth: 130,
    },
    {
      field: 'invoice',
      headerName: '전표',
      filter: 'agTextColumnFilter',
      cellStyle: { textAlign: 'center' }, // 중앙 정렬
      minWidth: 105,
      maxWidth: 130,
    },
    {
      field: 'retailer',
      headerName: '소매처',
      filter: 'agTextColumnFilter',
      cellStyle: { textAlign: 'center' }, // 중앙 정렬
      minWidth: 105,
      maxWidth: 130,
    },
    {
      field: 'salesAmount',
      headerName: '판매금액',
      filter: 'agNumberColumnFilter',
      minWidth: 105,
      maxWidth: 130,
      cellStyle: { textAlign: 'right' }, // 오른쪽 정렬
      valueFormatter: (params) => {
        if (params.value !== undefined && params.value !== null) {
          return `₩${params.value.toLocaleString()}`;
        }
        return ''; // 값이 없는 경우 빈 문자열 반환
      },
    },
    {
      field: 'returnAmount',
      headerName: '반품금액',
      minWidth: 105,
      maxWidth: 130,
      cellStyle: { textAlign: 'right' }, // 오른쪽 정렬
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => {
        if (params.value !== undefined && params.value !== null) {
          return `₩${params.value.toLocaleString()}`;
        }
        return ''; // 값이 없는 경우 빈 문자열 반환
      },
    },
    {
      field: 'discountAmount',
      headerName: '할인금액',
      minWidth: 105,
      maxWidth: 130,
      filter: 'agNumberColumnFilter',
      cellStyle: { textAlign: 'right' }, // 오른쪽 정렬
      valueFormatter: (params) => {
        if (params.value !== undefined && params.value !== null) {
          return `₩${params.value.toLocaleString()}`;
        }
        return ''; // 값이 없는 경우 빈 문자열 반환
      },
    },
    {
      field: 'unitPriceDiscount',
      headerName: '단가DC',
      minWidth: 105,
      maxWidth: 130,
      filter: 'agNumberColumnFilter',
      cellStyle: { textAlign: 'right' }, // 오른쪽 정렬
      valueFormatter: (params) => {
        if (params.value !== undefined && params.value !== null) {
          return `₩${params.value.toLocaleString()}`;
        }
        return ''; // 값이 없는 경우 빈 문자열 반환
      },
    },
    {
      field: 'cashDeposit',
      headerName: '현금입금',
      minWidth: 105,
      maxWidth: 130,
      filter: 'agNumberColumnFilter',
      cellStyle: { textAlign: 'right' }, // 오른쪽 정렬
      valueFormatter: (params) => {
        if (params.value !== undefined && params.value !== null) {
          return `₩${params.value.toLocaleString()}`;
        }
        return ''; // 값이 없는 경우 빈 문자열 반환
      },
    },
    {
      field: 'bankDeposit',
      headerName: '통장입금',
      minWidth: 105,
      maxWidth: 130,
      filter: 'agNumberColumnFilter',
      cellStyle: { textAlign: 'right' }, // 오른쪽 정렬
      valueFormatter: (params) => {
        if (params.value !== undefined && params.value !== null) {
          return `₩${params.value.toLocaleString()}`;
        }
        return ''; // 값이 없는 경우 빈 문자열 반환
      },
    },
  ];

  useEffect(() => {
    const dummyData: Product[] = Array.from({ length: 10000 }, (_, i) => ({
      category: ['', '사장님지인', '', '^^', '긴급'][Math.floor(Math.random() * 5)],
      status: ['준비중', '출고완료', '배송중', '배송완료'][Math.floor(Math.random() * 4)],
      invoice: `2024-${String(i + 1).padStart(5, '0')}`,
      retailer: `소매처 ${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
      salesAmount: Math.floor(Math.random() * 1000000) + 10000,
      returnAmount: Math.floor(Math.random() * 50000),
      discountAmount: Math.floor(Math.random() * 30000),
      unitPriceDiscount: Math.floor(Math.random() * 5000),
      cashDeposit: Math.floor(Math.random() * 500000),
      bankDeposit: Math.floor(Math.random() * 500000),
    }));
    setRowData(dummyData);
  }, []);

  const localeText = {
    // ... 로케일 텍스트 정의
  };

  return (
    <div>
      <h2>{upMenuNm && menuNm ? `${menuNm}` : ''}</h2>
      <Search className="type_2">
        <Search.Input title={'영업일자'} name={'loginId'} placeholder={t(Placeholder.Default) || ''} value={filters.loginId} onChange={onChangeFilters} />
        <Search.Input title={t('검색') || ''} name={'userNm'} placeholder={'소매처/상품명 검색'} value={filters.userNm} onChange={onChangeFilters} />
      </Search>

      <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          enableRangeSelection={true}
          enableCharts={true}
          groupSelectsChildren={true}
          rowGroupPanelShow={'always'}
          pivotPanelShow={'always'}
          suppressDragLeaveHidesColumns={true}
          suppressMakeColumnVisibleAfterUnGroup={true}
          rowSelection={'multiple'}
          pagination={true}
          paginationAutoPageSize={true}
          localeText={localeText}
          onRowClicked={onRowClicked}
        />
      </div>

      <div className="btnArea right">
        <button className="btn" title="주문수정">
          주문수정
        </button>
        <button className="btn" title="주문취소">
          주문취소
        </button>
        <button className="btn" title="보류처리">
          보류처리
        </button>
        <button className="btn" title="출고수정">
          출고수정
        </button>
        <button className="btn" title="상품집계">
          상품집계
        </button>
        <button className="btn" title="카테고리">
          카테고리
        </button>
      </div>

      <Pagination pageObject={paging} setPaging={setPaging} />

      {modalType.type === 'DETAIL' && modalType.active && <AccessLogDeatilPop />}
    </div>
  );
};

export default Today;
