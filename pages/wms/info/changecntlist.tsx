/**
 수량변경 이력
 /wms/info/changecntlist
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAgGridApi, useDidMountEffect } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { FactoryResponseSelectList, InstockResponsePaging, LocsetResponseOptionList, PartnerResponseSelect } from '../../../generated';
import { Button, Pagination, Search, Table, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { CellKeyDownEvent, CellValueChangedEvent, ColDef } from 'ag-grid-community';

import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { useStoreReqStore } from '../../../stores/useStoreReqStore';
import { DataListDropDown } from '../../../components/DataListDropDown';
import { createInven, createStock, fetchFactories, fetchLocOptions, fetchPartners } from '../../../api/wms-api';
import { session } from 'next-auth/core/routes';

const Inventorymovelist = () => {
  const session = useSession();
  const startDt = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'); // 1개월전 1일자로 조회한다.
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');
  const gridRef = useRef<AgGridReact>(null);
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;

  const { onGridReady } = useAgGridApi();
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  const [paging, setPaging] = useStoreReqStore((s) => [s.paging, s.setPaging]);

  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: startDt,
    endDate: today,
    skuNm: '',
    partnerId: 0,
    factoryId: 0,
    location: '',
    updUser: '',
  });

  const [locOption, setLocOption] = useState<LocsetResponseOptionList[]>([]);

  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any[]>([]); // 합계데이터 만들기
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        filter: false,
        sortable: false,
        maxWidth: 30,
        minWidth: 30,
        suppressHeaderMenuButton: true,
        //hide: true,
      },
      {
        field: 'no',
        headerName: 'No',
        maxWidth: 70,
        minWidth: 70,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'creTm',
        headerName: '변경타입',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'creTm',
        headerName: '변경일시',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'partnerNm',
        headerName: '화주',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'chgYn',
        headerName: '승인여부',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodNm',
        headerName: '상품명',
        maxWidth: 180,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuColor',
        headerName: '칼라',
        maxWidth: 100,
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
        field: 'location',
        headerName: '적치위치',
        maxWidth: 200,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'befCnt',
        headerName: '기존수량',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'aftCnt',
        headerName: '변경수량',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'code',
        headerName: '변경사유코드',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'etc',
        headerName: '비고',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'updUser',
        headerName: '작업자',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
    ],
    [locOption],
  );

  // 최초 데이타 렌더링 및 재렌더링시
  const onRowDataUpdated = (params: any) => {
    params.api.forEachNode((node: any) => {
      // 적치수량 필드에 기본값 설정
      node.setDataValue('invenCnt', node.data.stockCnt);

      if (node.data.stockCnt > 0) {
        node.setSelected(true); // 모든 행을 선택 상태로 설정
      }
    });

    updateTotals(); // 데이터 업데이트 시 합계도 계산
  };

  const onCellValueChanged = (event: CellValueChangedEvent<InstockResponsePaging>): void => {
    const { colDef, node, newValue, oldValue, data } = event;

    // 값이 실제로 변경되지 않은 경우는 제외
    if (oldValue === newValue) {
      return;
    }

    // 초기 값(originalValue)과 비교하여 상태 설정
    const initialOriginalValue = 0;

    // console.log('onCellValueChanged', {
    //   event: event,
    //   newValue: newValue,
    //   initialOriginalValue: initialOriginalValue,
    // });

    // 입력값변경에 따른 체크박스 자동 체크
    if (initialOriginalValue !== newValue) {
      node.setSelected(true);
    } else {
      node.setSelected(false);
    }

    // 셀 변경이 있을 때마다 합계 업데이트
    updateTotals();
  };

  // 합계 업데이트 함수
  const updateTotals = () => {
    let stockTotal = 0;
    let invenTotal = 0;

    gridRef.current?.api.forEachNode((node) => {
      stockTotal += Number(node.data.stockCnt || 0);
      invenTotal += Number(node.data.invenCnt || 0);
    });

    // 합계 데이터를 상태로 설정하여 pinned bottom row에 전달
    setPinnedBottomRowData([{ skuSize: 'Total', stockCnt: stockTotal, invenCnt: invenTotal }]);
  };

  /**
   *  API
   */

  // 화주옵션 조회
  const defaultOption: any = { value: 0, label: '전체' };
  const [partnerOption, setPartnerOption] = useState<any>([]);
  const { data: partners, isSuccess: isFetchPartnerSuccess } = useQuery(['fetchPartners'], () => fetchPartners(workLogisId));
  useEffect(() => {
    if (isFetchPartnerSuccess && partners) {
      const { resultCode, body, resultMessage } = partners.data;
      if (resultCode === 200) {
        const partnerCodes = body?.map((item: PartnerResponseSelect) => ({
          value: item.id,
          label: item.partnerNm,
        }));
        setPartnerOption([defaultOption, ...partnerCodes]);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchPartnerSuccess, partners]);

  // 공장옵션 조회
  const [factoryOption, setFactoryOption] = useState<any>([]);
  const { data: factories, isSuccess: isFetchFactorySuccess } = useQuery(['fetchFactories'], fetchFactories);
  useEffect(() => {
    if (isFetchFactorySuccess && factories) {
      const { resultCode, body, resultMessage } = factories.data;
      if (resultCode === 200) {
        const factoryCodes = body?.map((item: FactoryResponseSelectList) => ({
          value: item.id,
          label: item.compNm,
        }));
        setFactoryOption([defaultOption, ...factoryCodes]);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchFactorySuccess, factories]);

  // 공장옵션 조회
  const { data: locs, isSuccess: isFetchLocSuccess } = useQuery(
    ['fetchLocOptions', session.data?.user.workLogisId],
    () => fetchLocOptions(Number(session.data?.user.workLogisId)),
    {
      enabled: !!session.data?.user.workLogisId, // logisId가 유효할 때에만 실행
    },
  );
  useEffect(() => {
    if (isFetchLocSuccess && locs) {
      const { resultCode, body, resultMessage } = locs.data;
      if (resultCode === 200) {
        // console.log('locs data>', locs.data.body);
        const locNms = body?.map((item: LocsetResponseOptionList) => ({
          // locationId: item.id,
          locationNm: item.location,
          // zoneCd: item.zoneCd,
          zoneCdNm: item.zoneCdNm,
        }));
        setLocOption(locNms);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchLocSuccess, locs]);

  //적치 목록 조회
  const {
    data: stocks,
    isLoading,
    isSuccess: isStockSuccess,
    refetch: refetchStock,
  } = useQuery(['', paging.curPage], () =>
    authApi.get('', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      },
    }),
  );
  useEffect(() => {
    if (isStockSuccess && stocks?.data) {
      const { resultCode, body, resultMessage } = stocks.data;
      if (resultCode === 200) {
        // console.log('stocks data>', stocks.data);
        setPaging(body?.paging);
      } else {
        toastError(resultMessage);
      }
    }
  }, [stocks, isStockSuccess, setPaging]);

  // 적치 등록 API
  const queryClient = useQueryClient();
  const { mutate: createInvenMutate } = useMutation(createInven, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        await queryClient.invalidateQueries(['/tostorage/paging']);
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error(err);
      toastError('등록 중 오류가 발생하였습니다.');
    },
  });

  /** 검색 */
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    await refetchStock();
  };

  // 검색 버튼 클릭
  const search = async () => {
    await onSearch();
  };

  // 초기화버튼 이벤트
  const onReset = async () => {
    await onFiltersReset();
    await onChangeFilters('startDate', startDt);
    await onChangeFilters('endDate', today);
    await onChangeFilters('factoryId', 0);
    await onChangeFilters('partnerId', 0);
    setSelectedPartner(defaultOption);
    setSelectedFactory(defaultOption);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await onSearch();
  };

  // 필터 옵션 선택
  const [selectedPartner, setSelectedPartner] = useState();
  const [selectedFactory, setSelectedFactory] = useState();

  const handleChangePartner = (option: any) => {
    setSelectedPartner(option);
    onChangeFilters('partnerId', option.value);
  };

  const handleChangeFactory = (option: any) => {
    setSelectedFactory(option);
    onChangeFilters('factoryId', option.value);
  };

  // 적치시작
  const handleSave = async () => {
    const gridApi = gridRef.current?.api;
    const selectedRows: any = gridApi?.getSelectedRows();

    if (selectedRows?.length === 0) {
      toastError('적치할 상품의 입력수량을 입력해주세요.', { autoClose: 1000 });
      return;
    } else {
      console.log('selectedRows:', selectedRows);
      const invalidRow = selectedRows.some((row: any) => row.invenCnt <= 0);

      if (invalidRow) {
        toastError('적치할 상품의 입력수량을 정확히 입력해주세요.', { autoClose: 1000 });
      }
      // await createInvenMutate(selectedRows);
    }
  };

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} reset={onReset} search={search} />
      <Search className="type_2 full">
        <Search.TwoDatePicker
          title={'검색기간'}
          startName={'startDate'}
          endName={'endDate'}
          //value={[filters.startDate, filters.endDate]}
          onEnter={onSearch}
          filters={filters}
          onChange={onChangeFilters}
        />
        <DataListDropDown
          title={'화주'}
          name={'partnerId'}
          value={selectedPartner}
          onChange={handleChangePartner}
          options={partnerOption}
          placeholder="화주 입력"
        />
        <Search.Input
          title={'상품명'}
          name={'skuNm'}
          placeholder={'스큐명 입력'}
          value={filters.skuNm}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.Input
          title={'적치위치'}
          name={'location'}
          placeholder={'Loc 입력'}
          value={filters.location}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.Input
          title={'작업자'}
          name={'updUser'}
          placeholder={'작업자입력'}
          value={filters.updUser}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
      </Search>

      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}></TableHeader>
        <div className={'ag-theme-alpine wmsDefault'}>
          <AgGridReact
            ref={gridRef}
            rowData={stocks?.data?.body?.rows || []}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            gridOptions={{ rowHeight: 24, headerHeight: 35 }}
            rowSelection={'multiple'}
            suppressRowClickSelection={true}
            paginationPageSize={paging.pageRowCount}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            enableRangeSelection={true}
            //suppressMultiRangeSelection={false}
            onCellValueChanged={onCellValueChanged}
            getRowClass={(params) => {
              if (params.node.rowPinned === 'bottom') {
                return 'ag-grid-pinned-row';
              }
            }}
            /* pinnedBottomRowData={pinnedBottomRowData} // 하단에 고정된 합계 행
            onFirstDataRendered={onRowDataUpdated}*/
            onRowDataUpdated={onRowDataUpdated}
          />
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
    </div>
  );
};

export default Inventorymovelist;
