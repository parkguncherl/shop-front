import React, { useCallback, useEffect, useState } from 'react';
import { useAgGridApi, useDidMountEffect } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { PartnerResponsePaging, StoreResponseReqPaging, TodayResponsePaging } from '../../../generated';
import { Pagination, Search, Table, TableHeader, Title, toastError } from '../../../components';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { ColDef } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { useStoreReqStore } from '../../../stores/useStoreReqStore';

/**  */
const StoreRequest = () => {
  const session = useSession();
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');
  /** Grid Api */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();
  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  /** 매장 전역 상태 저장(store)  */
  const [paging, setPaging, modalType, openModal] = useStoreReqStore((s) => [s.paging, s.setPaging, s.modalType, s.openModal]);
  /** 필터 */
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters({
    startDate: dayjs().subtract(2, 'month').startOf('month').format('YYYY-MM-DD'), // 2개월전 1일자로 조회한다.
    endDate: today,
    skuNm: '',
    storeReqCd: '1',
  });

  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<StoreResponseReqPaging[]>([]); // 합계데이터 만들기

  // 파트너 추가하기 버튼 렌더링
  /*const lowAddBtnCellRenderer = (params: any) => {
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
  };*/

  const [columnDefs] = useState<ColDef[]>([
    {
      field: 'no',
      headerName: 'No',
      minWidth: 50,
      maxWidth: 70,
      checkboxSelection: true,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    { field: 'skuNm', headerName: '상품명', minWidth: 100, maxWidth: 160, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.LEFT },
    { field: 'skuCnt', headerName: '수량', minWidth: 50, maxWidth: 70, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.RIGHT },
    {
      field: 'reqStatCd',
      headerName: '상태',
      minWidth: 50,
      maxWidth: 70,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
      valueFormatter: (params) => {
        if (params.value == 'S') {
          return '미처리';
        } else if (params.value == 'R') {
          return '요청';
        } else if (params.value == 'C') {
          // C
          return '완료';
        } else {
          return '';
        }
      },
    },
    { field: 'workYmd', headerName: '작업일', minWidth: 80, maxWidth: 120, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.LEFT },
    {
      field: 'lastEditor',
      headerName: '작업자',
      minWidth: 80,
      maxWidth: 120,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
    },
  ]);

  /** 검색 */
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    await storeStockRefetch();
  };

  /** 페이징 목록 조회 */
  const {
    data: stock,
    isLoading,
    isSuccess: isListSuccess,
    refetch: storeStockRefetch,
  } = useQuery(['/store/stock/paging', paging.curPage], () =>
    authApi.get('/store/stock/paging', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      },
    }),
  );
  useEffect(() => {
    if (isListSuccess) {
      const { resultCode, body, resultMessage } = stock.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
        if (body.rows && body.rows.length > 0) {
          const { skuCntTotal } = body.rows.reduce(
            (
              acc: {
                skuCntTotal: number;
              },
              data: StoreResponseReqPaging,
            ) => {
              return {
                skuCntTotal: acc.skuCntTotal + (data.skuCnt ? data.skuCnt : 0),
              };
            },
            {
              skuCntTotal: 0,
            }, // 초기값 설정
          );

          setPinnedBottomRowData([
            {
              skuCnt: skuCntTotal,
            },
          ]);
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [stock, isListSuccess, setPaging]);

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
    { key: 'DM', value: 'any', label: '도매' },
  ];
  /** 드롭다운 변경 시 */
  /*const onChangeOptions = useCallback(async (name: string, value: string | number) => {
    dispatch({ name: name, value: value });
  }, []);
  useDidMountEffect(() => {
    // 드롭다운 변경시
    onSearch();
  }, [filters.upperPartnerId]);*/

  /** 셀 클릭 이벤트 */
  /*const onCellClicked = async (cellClickedEvent: CellClickedEvent) => {
    const { colDef, data } = cellClickedEvent;
    // 버튼 셀 제외
    if (colDef.field === 'action') {
      return;
    }
    openModal('MOD');
  };*/

  useEffect(() => {
    /** storeReqCd, 종료일 변경될 시 검색 동작을 촉발할 목적 */
    search();
  }, [filters.storeReqCd, filters.endDate]);

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} search={search} />
      <span style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>( 참고: 매장요청반납시 물류반납요청할 Sku상품 임시저장되는곳 )</span>
      <Search className="type_2 full">
        <Search.TwoDatePicker
          title={'검색일자'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onEnter={search}
          filters={filters}
          onChange={onChangeFilters}
        />
        <Search.Input
          title={'스큐명'}
          name={'skuNm'}
          placeholder={'스큐명 입력'}
          value={filters.skuNm}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
      </Search>

      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}>
          <button className="btn icoPrint" title="프린트">
            프린트
          </button>
        </TableHeader>
        <div className={'ag-theme-alpine'}>
          <AgGridReact
            headerHeight={35}
            onGridReady={onGridReady}
            loading={isLoading}
            rowData={stock?.data?.body?.rows || []}
            gridOptions={{ rowHeight: 24 }}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            paginationPageSize={paging.pageRowCount}
            rowSelection={'multiple'}
            //onCellClicked={onCellClicked}
            onRowClicked={(e) => {
              //setSelectedPartner(e.data as PartnerResponsePaging);
              e.api.deselectAll();
            }}
            getRowClass={(params) => {
              if (params.node.rowPinned === 'bottom') {
                return 'ag-grid-pinned-row';
              }
            }}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            pinnedBottomRowData={pinnedBottomRowData} // 하단에 고정된 합계 행
          />
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
    </div>
  );
};

export default StoreRequest;
