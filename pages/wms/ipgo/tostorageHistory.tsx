/**
 적치이력
 /wms/ipgo/tostorageHistory
 */
import React, { useEffect, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import {
  FactoryResponseSelectList,
  PartnerResponseSelect,
  ToStorageHistoryRequestCancel,
  ToStorageHistoryRequestPagingFilter,
  ToStorageHistoryResponsePaging,
} from '../../../generated';
import { Pagination, Search, Table, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { ColDef } from 'ag-grid-community';

import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { useStoreReqStore } from '../../../stores/useStoreReqStore';
import { DataListDropDown } from '../../../components/DataListDropDown';
import { cancelTostorage, fetchFactories, fetchPartners } from '../../../api/wms-api';
import { Utils } from '../../../libs/utils';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import TunedGrid from '../../../components/grid/TunedGrid';

const TostorageHistory = () => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  const startDt = dayjs().subtract(0, 'month').startOf('month').format('YYYY-MM-DD'); // 당월 1일자로 조회한다.
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  /** 예솔수정 필터저장 */
  const nowPage = 'wms_tostorageHistory'; // filter 저장 예솔수정

  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList, //filter 예솔수정
    s.setFilterDataList, //filter 예솔수정
    s.getFilterData, //filter 예솔수정
  ]);

  const [paging, setPaging] = useStoreReqStore((s) => [s.paging, s.setPaging]);

  /** 예솔수정 하단합계 */
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<ToStorageHistoryResponsePaging[]>([]); // 합계데이터 객체

  /*  useEffect(() => {
    console.log('pinnedBottomRowData ===>', pinnedBottomRowData);
  }, [pinnedBottomRowData]);*/

  const [rowData, setRowData] = useState<ToStorageHistoryResponsePaging[]>([]);

  /** 예솔수정 필터저장 */
  /*const [filters, onChangeFilters, onFiltersReset] = useFilters({
    logisId: session.data?.user.workLogisId, // 물류 계정 창고검색필터
    partnerId: 0,
    factoryId: 0,
    asnType: '',
    startDate: startDt,
    endDate: today,
  });*/

  const [filters, onChangeFilters] = useFilters<ToStorageHistoryRequestPagingFilter>(
    getFilterData(filterDataList, nowPage) || {
      logisId: session.data?.user.workLogisId, // 물류 계정 창고검색필터
      partnerId: undefined, // 화주id
      factoryId: 0,
      asnType: '',
      startDate: startDt,
      endDate: today,
    },
  );

  // 발주구분 드롭다운옵션
  const asnTypeOption = [
    { key: '1', value: '1', label: '발주' },
    { key: '9', value: '9', label: '수선' },
    { key: '2', value: '2', label: '매장분' },
  ];

  const [columnDefs] = useState<ColDef<ToStorageHistoryResponsePaging>[]>([
    {
      field: 'no',
      headerName: 'No.',
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'partnerNm',
      headerName: '고객사',
      minWidth: 150,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'asnTypeNm',
      headerName: '발주구분',
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'factoryNm',
      headerName: '생산처',
      minWidth: 150,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'storageDtm',
      headerName: '적치일시',
      minWidth: 150,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => (params.value ? dayjs(params.value).format('YY/M/D(ddd) HH:mm:ss') : ''),
    },
    {
      field: 'skuNm',
      headerName: '상품',
      minWidth: 200,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'prodTcYn',
      headerName: 'TC여부',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => (params.value === 'Y' ? 'TC' : ''),
    },
    {
      field: 'zoneNm',
      headerName: 'ZONE',
      minWidth: 200,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'invenCnt',
      headerName: '수량',
      minWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'locNm',
      headerName: 'LCTN',
      minWidth: 200,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'workUser',
      headerName: '작업자',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
  ]);

  /**
   *  API
   */

  /** 적치이력 목록 조회 */
  const {
    data: stockHistories,
    isLoading,
    isSuccess: isStockSuccess,
    refetch: refetchStock,
  } = useQuery(
    ['/tostorage-history/paging', paging.curPage, filters],
    () =>
      authApi.get('/tostorage-history/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
    {
      enabled: !!filters,
      staleTime: 5000, // 데이터 신선도 시간 설정 (5초)
      refetchOnWindowFocus: false, // 윈도우 포커스시 리패치 비활성화
      refetchOnReconnect: true, // 네트워크 재연결시 리패치
      retry: 1, // 실패시 1회 재시도
    },
  );
  useEffect(() => {
    if (isStockSuccess && stockHistories?.data) {
      const { resultCode, body, resultMessage } = stockHistories.data;
      if (resultCode === 200) {
        setRowData(body?.rows);
        setPaging(body?.paging);
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 예솔수정
        /** 예솔수정 재고조사 하단합계 */
        if (body?.rows && body?.rows.length > 0) {
          const { invenCount } = body.rows.reduce(
            (
              acc: {
                invenCount: number;
              },
              data: ToStorageHistoryResponsePaging,
            ) => {
              return {
                invenCount: acc.invenCount + (data.invenCnt ? data.invenCnt : 0),
              };
            },
            {
              invenCount: 0,
            },
          );

          setPinnedBottomRowData([
            {
              invenCnt: invenCount,
            },
          ]);
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [stockHistories, isStockSuccess, setPaging]);

  // 고객사옵션 조회
  const defaultOption: any = { value: 0, label: '전체' };
  const [partnerOption, setPartnerOption] = useState<any>([]);
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;
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

  // 생산처옵션 조회
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

  /** 컬럼 */

  // 적치 취소 API
  const queryClient = useQueryClient();
  const { mutate: cancelTostorageMutate, isLoading: isCancelLoading } = useMutation(cancelTostorage, {
    onSuccess: async (e) => {
      const { resultCode, resultMessage, body } = e.data;
      if (resultCode === 200) {
        toastSuccess('적치취소되었습니다.');
        if (body) {
          toastError(body);
        }
        await queryClient.invalidateQueries(['/tostorage-history/paging']);
      } else {
        toastError(resultMessage);
      }
    },
    onError: (err): void => {
      console.error(err);
      toastError('등록 중 오류가 발생하였습니다.');
    },
  });

  const onReset = async () => {
    const defaultFilter: ToStorageHistoryRequestPagingFilter = {
      logisId: session.data?.user.workLogisId, // 물류 계정 창고검색필터
      partnerId: 0,
      factoryId: 0,
      asnType: '',
      startDate: startDt,
      endDate: today,
    };

    Object.entries(defaultFilter).forEach(([key, value]) => {
      onChangeFilters(key as keyof ToStorageHistoryRequestPagingFilter, value);
    });
  };

  // 적치취소
  const handleTostorageCancel = () => {
    const gridApi = gridRef.current?.api;
    const selectedRows: any = gridApi?.getSelectedRows();

    if (selectedRows?.length === 0) {
      toastError('적치취소할 상품을 선택해주세요.', { autoClose: 1000 });
      return;
    } else {
      const paramList = selectedRows.map((item: ToStorageHistoryRequestCancel) => {
        return {
          stockId: item.stockId,
          logisId: item.logisId,
          partnerId: item.partnerId,
          skuNm: item.skuNm,
        };
      });

      console.log('취소 params>>', paramList);
      cancelTostorageMutate(paramList);
    }
  };

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} reset={onReset} search={search} />
      <Search className="type_2">
        <Search.DropDown title={'발주구분'} name={'asnType'} defaultOptions={asnTypeOption} value={filters.asnType} onChange={onChangeFilters} />
        <DataListDropDown
          title={'고객사'}
          name={'partnerId'}
          // value={selectedPartner}
          onChange={(option) => {
            onChangeFilters('partnerId', option.value);
          }}
          options={partnerOption}
          placeholder="고객사 입력"
        />
        <DataListDropDown
          title={'생산처'}
          name={'factoryId'}
          // value={selectedFactory}
          onChange={(option) => {
            onChangeFilters('factoryId', option.value);
          }}
          options={factoryOption}
          placeholder="생산처 입력"
        />
        <Search.TwoDatePicker
          title={'일자'}
          startName={'startDate'}
          endName={'endDate'}
          filters={filters}
          value={[filters.startDate ?? '', filters.endDate ?? '']}
          onChange={onChangeFilters}
        />
      </Search>

      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search} />
        <TunedGrid
          ref={gridRef}
          onGridReady={onGridReady}
          rowData={stockHistories?.data?.body?.rows || []}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          suppressContextMenu={true}
          rowSelection={'multiple'}
          className={'wmsDefault check'}
          pinnedBottomRowData={pinnedBottomRowData} // 예솔수정 재고이력 하단합계
        />
        <div className="btnArea">
          <CustomShortcutButton className="btn" onClick={handleTostorageCancel} shortcut={COMMON_SHORTCUTS.save}>
            적치취소
          </CustomShortcutButton>
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
      {/*{isCreateInvenLoading && <Loading />}*/}
    </div>
  );
};

export default TostorageHistory;
