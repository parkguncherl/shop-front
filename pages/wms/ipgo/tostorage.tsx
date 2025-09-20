/**
 적치정보
 /wms/ipgo/tostorage
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { FactoryResponseSelectList, PartnerResponseSelect, ToStoragePagingFilter } from '../../../generated';
import { Pagination, Search, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { CellEditingStoppedEvent, ColDef, SelectionChangedEvent } from 'ag-grid-community';

import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { useStoreReqStore } from '../../../stores/useStoreReqStore';
import { DataListDropDown } from '../../../components/DataListDropDown';
import { createInven, fetchFactories, fetchLocationOptions, fetchPartners, fetchZoneOptions } from '../../../api/wms-api';
import Loading from '../../../components/Loading';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import TunedGrid from '../../../components/grid/TunedGrid';
import debounce from 'lodash/debounce';
import PrintWmsLayout from '../../../components/print/PrintWmsLayout';

interface Option {
  key: number;
  value: number;
  label: string;
  zoneId: number;
}

const Tostorage = () => {
  const session = useSession();
  const startDt = dayjs().subtract(0, 'month').startOf('month').format('YYYY-MM-DD'); // 당월 1일자로 조회한다.
  const today = dayjs(new Date()).add(6, 'hour').format('YYYY-MM-DD'); // 6시간 더하기
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;
  const gridRef = useRef<AgGridReact>(null);
  const { onGridReady } = useAgGridApi();
  const [menuNm] = useCommonStore((s) => [s.menuNm]);
  const [paging, setPaging] = useStoreReqStore((s) => [s.paging, s.setPaging]);
  const [zoneOption, setZoneOption] = useState<Option[]>();
  const [locOption, setLocOption] = useState([]); // 해당 로케이션 리스트
  const [zoneId, setZoneId] = useState();

  // 필터 옵션 선택
  const [selectedPartner, setSelectedPartner] = useState();
  const [selectedFactory, setSelectedFactory] = useState();
  /** 프린트 관련 */
  const [isPreView, setIsPreView] = useState<boolean>(false);
  const [selectedDetail, setSelectedDetail] = useState<any[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const [rowData, setRowData] = useState<any[]>([]);
  const [subRowData, setSubRowData] = useState<any[]>([]);

  const [filters, onChangeFilters, onFiltersReset] = useFilters<ToStoragePagingFilter>({
    logisId: session.data?.user.workLogisId, // 물류 계정 창고검색필터
    startDate: startDt || undefined,
    endDate: today || undefined,
  });

  // 발주구분 드롭다운옵션
  const stockStatOptions = [
    { key: '1', value: '1', label: '발주' },
    { key: '9', value: '9', label: '수선' },
    { key: '2', value: '2', label: '매장분' },
  ];
  // 적치 LCTN 드롭다운옵션
  const storageOptions = [
    { key: 'none', value: 'none', label: '없음' },
    { key: 'single', value: 'single', label: '단일' },
    { key: 'multi', value: 'multi', label: '복수' },
  ];
  // 출고지시 드롭다운옵션
  const releaseOrderOptions = [
    { key: 'impossible', value: 'impossible', label: '출고 부족' },
    { key: 'possible', value: 'possible', label: '출고 가능' },
    { key: 'none', value: 'none', label: '출고 없음' },
  ];

  const [subColumnDefs] = useState<ColDef[]>([
    {
      field: 'zoneNm',
      headerName: 'ZONE',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (params) => (params.data.targetSkuYn === 'Y' ? params.data.zoneNm : ''),
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      minWidth: 250,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
      cellClassRules: {
        'ag-grid-peach': (params) => params.data.targetSkuYn === 'Y',
      },
    },
    {
      field: 'locNm',
      headerName: 'LOCATION',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'invenCnt',
      headerName: '재고',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
  ]);

  /**
   *  API
   */
  // 고객사옵션 조회
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

  const { data: zonList, isSuccess: isZoneListSuccess } = useQuery({
    queryKey: ['/zone/dropDownZoneList', workLogisId],
    queryFn: async () => {
      const res = await authApi.get('/zone/dropDownZoneList/' + Number(session.data?.user.workLogisId));
      return res.data as { resultCode: number; body: any; resultMessage: string };
    },
    enabled: !!session.data?.user.workLogisId,
  });

  useEffect(() => {
    if (isZoneListSuccess && zonList) {
      const { resultCode, body, resultMessage } = zonList;
      if (resultCode === 200) {
        const updateList = body?.map((item: any) => ({
          key: item.id,
          value: item.id,
          label: item.zoneCdNm,
          zoneId: item.zoneId,
        }));
        setZoneOption([{ key: 0, value: 0, label: '선택', zoneId: 0 }, ...updateList]);
      } else {
        toastError(resultMessage);
      }
    }
  }, [zonList, isZoneListSuccess]);

  const { data: locList, isSuccess: isLocationListSuccess } = useQuery({
    queryKey: ['/zone/locOptList', workLogisId],
    queryFn: async () => {
      const res = await authApi.get('/zone/locOptList/' + workLogisId);
      return res.data;
    },
    enabled: !!workLogisId,
  });

  /** 적치 목록 조회 */
  const {
    data: stocks,
    isLoading,
    isSuccess: isStockSuccess,
    refetch: refetchStock,
  } = useQuery(['/tostorage/paging', paging.curPage], () =>
    authApi.get('/tostorage/paging', {
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
        setRowData(body?.rows);
        setPaging(body?.paging);
      } else {
        toastError(resultMessage);
      }
    }
  }, [stocks, isStockSuccess, setPaging, locOption]);

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

  // 필터
  const handleFilterChange = (name: string, value: any) => {
    onChangeFilters(name, value);
  };
  useEffect(() => {
    if (filters) {
      search(); // 필터 상태가 변경된 후에 search 실행
    }
  }, [filters]);

  /** 컬럼 */
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  useEffect(() => {
    if (zoneOption && zoneOption.length > 0) {
      setColumnDefs([
        {
          field: 'no',
          headerName: 'No.',
          minWidth: 50,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'stockYmd',
          headerName: '입하일자',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'partnerNm',
          headerName: '고객사',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'factoryNm',
          headerName: '생산처',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'asnTypeNm',
          headerName: '발주유형',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'skuNm',
          headerName: '상품명',
          minWidth: 200,
          cellStyle: GridSetting.CellStyle.LEFT,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'season',
          headerName: '계절',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'storagedLctnCnt',
          headerName: 'LCTN #',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'pickingJobCnt',
          headerName: '출고지시',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'invenCnt',
          headerName: '가용재고',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'stockCnt',
          headerName: '입하',
          minWidth: 50,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'balanceStockCnt',
          headerName: '잔량',
          minWidth: 50,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'storagingCnt',
          headerName: '적치',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          editable: true,
          cellClass: 'editCell',
          onCellValueChanged: (params) => {
            const rowNode = params.node;
            // 행 선택
            rowNode?.setSelected(true);
          },
        },
        {
          field: 'recommLocId',
          headerName: '적치 LCTN',
          minWidth: 150,
          cellStyle: GridSetting.CellStyle.LEFT,
          suppressHeaderMenuButton: true,
          editable: true,
          cellClass: 'editCell',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: (params: any) => {
            const option: any = locOption?.filter((item: any) => item.zoneId === params?.data?.recommZoneId && item.partnerId === params?.data?.partnerId);
            return {
              values: option ? option.map((item: any) => item.locId) : [],
            };
          },
          valueFormatter: (params) => {
            const option: any = locOption?.find((opt: any) => opt.locId === params.value);
            return option?.locNm;
          },
        },
        {
          field: 'recommZoneId',
          headerName: '적치 ZONE',
          minWidth: 100,
          maxWidth: 100,
          cellStyle: GridSetting.CellStyle.LEFT,
          suppressHeaderMenuButton: true,
          editable: true,
          cellClass: 'editCell',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            values: zoneOption ? zoneOption.map((item: any) => item.value) : [],
          },
          valueFormatter: (params: any) => {
            const value = params.value ? params.value : 0;
            const option = zoneOption?.find((opt: Option) => opt.value === value);
            return option ? option.label : '';
          },
          onCellValueChanged: (params: any) => {
            setZoneId(params.newValue);
          },
        },
        {
          field: 'recommZoneId',
          headerName: '추천 존',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          editable: true,
          cellClass: 'editCell',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            values: zoneOption ? zoneOption.map((item: any) => item.value) : [],
          },
          valueFormatter: (params: any) => {
            const option: any = zoneOption.find((opt: any) => opt.value === params.value);
            return option ? option.label : '선택';
          },
          onCellValueChanged: (params: any) => {
            setZoneId(params.newValue);
          },
        },
        {
          field: 'lastLocNm',
          headerName: '최근 LCTN',
          minWidth: 150,
          cellStyle: GridSetting.CellStyle.LEFT,
          suppressHeaderMenuButton: true,
          valueFormatter: (params) => (params.value ? params.value : '-'),
        },
      ]);
    }
  }, [zoneOption]);

  /* 적치수량 입력이벤트 처리 */
  const onCellEditingStopped = (event: CellEditingStoppedEvent<any>) => {
    if (event.column.getColId() == 'storagingCnt') {
      const oldValue = event.data.storagingCnt;
      const newValue = event.newValue;

      if (newValue < 0 || !newValue || isNaN(newValue)) {
        toastError('적치수량을 정확히 입력해 주세요.');
        event.node?.setSelected(false);
      } else {
        if (oldValue > 0) {
          event.node?.setSelected(true);
        }
      }
    }
  };

  // 적치 등록 API
  const queryClient = useQueryClient();
  const { mutate: createInvenMutate, isLoading: isCreateInvenLoading } = useMutation(createInven, {
    onSuccess: async (e) => {
      const { resultCode, resultMessage, body } = e.data;

      if (resultCode === 200) {
        if (body) {
          toastError(body);
        } else {
          toastSuccess('적치등록이 완료되었습니다.');
          setSubRowData([]); // 이전 sub 그리드 데이터 삭제
        }
        await queryClient.invalidateQueries(['/tostorage/paging']);
      } else {
        toastError(resultMessage);
      }
    },
    onError: (err): void => {
      console.error(err);
      toastError('등록 중 오류가 발생하였습니다.');
    },
  });

  // 초기화버튼 이벤트
  const onReset = async () => {
    await onFiltersReset();
    await onChangeFilters('factoryId', 0);
    await onChangeFilters('partnerId', 0);
    await onChangeFilters('startDate', startDt);
    await onChangeFilters('endDate', today);

    setSelectedPartner(defaultOption);
    setSelectedFactory(defaultOption);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await onSearch();
  };

  /** 그리드 항목 선택 이벤트
   * 중복 렌더링이슈가 있어 debounce를 사용해서 300ms 까지 마지막 이벤트만 처리하도록 한다.
   * */
  const handleSelectionChanged = useCallback(
    debounce(async (event: SelectionChangedEvent) => {
      const selectedNodes = gridRef.current?.api.getSelectedNodes();

      if (selectedNodes && selectedNodes.length > 0) {
        const selectedData = selectedNodes[0].data;

        const params = {
          asnId: selectedData.asnId,
          prodId: selectedData.prodId,
          skuId: selectedData.skuId,
        };

        /** 미리보기 데이타 가져오기 */
        if (isPreView) {
          try {
            const response = await authApi.get('/tostorage/print/detail', { params });
            const { resultCode, resultMessage, body } = response.data;
            if (resultCode === 200) {
              // console.log('전표 상세 응답 >>', body);
              setSelectedDetail([body]); // 반드시 배열 형태로 전달
            } else {
              toastError('상세 자료 내용을 가져오지 못했어요.');
              console.error(resultMessage);
            }
          } catch (error) {
            toastError('데이터 로딩 중 오류가 발생했습니다.');
          }
        } else {
          /** 상품목록 가져오기 */
          try {
            const response = await authApi.get('/tostorage/prod-loc/list', { params });
            const { resultCode, resultMessage, body } = response.data;
            if (resultCode === 200) {
              // console.log('상세 응답 >>', body);
              setSubRowData(body);
            } else {
              toastError('상세 자료 내용을 가져오지 못했어요.');
              console.error(resultMessage);
            }
          } catch (error) {
            toastError('데이터 로딩 중 오류가 발생했습니다.');
          }
        }
      }
    }, 300), // 300ms debounce time
    [isPreView],
  );

  // 적치시작
  const handleSave = async () => {
    const gridApi = gridRef.current?.api;
    const selectedRows: any = gridApi?.getSelectedRows();

    if (selectedRows?.length === 0) {
      toastError('적치할 상품을 선택해주세요.', { autoClose: 1000 });
      return;
    } else {
      const invalidData = selectedRows?.some((item: any) => !item.recommLocId || isNaN(item.storagingCnt));
      if (invalidData) {
        toastError('[적치로케이션 및 수량오류] 로케이션 및 수량을 확인해주세요', { autoClose: 1000 });
        return;
      }

      const formattedRows = selectedRows.map((row: any) => ({
        stockId: row.stockId,
        logisId: row.logisId,
        partnerId: row.partnerId,
        locId: row.recommLocId,
        skuId: row.skuId,
        skuNm: row.skuNm,
        stockCnt: row.stockCnt,
        storageCnt: row.storagingCnt,
      }));

      await createInvenMutate(formattedRows);
    }
  };

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} reset={onReset} search={search} />
      <Search className="type_2">
        <Search.DropDown title={'발주구분'} name={'asnType'} defaultOptions={stockStatOptions} value={filters.asnType} onChange={handleFilterChange} />
        <DataListDropDown
          title={'고객사'}
          name={'partnerId'}
          value={selectedPartner}
          onChange={(value) => {
            setSelectedPartner(value);
            handleFilterChange('partnerId', value.value);
          }}
          options={partnerOption}
          placeholder="고객사 입력"
        />
        <DataListDropDown
          title={'생산처'}
          name={'factoryId'}
          value={selectedFactory}
          onChange={(value) => {
            setSelectedFactory(value);
            handleFilterChange('factoryId', value.value);
          }}
          options={factoryOption}
          placeholder="생산처 입력"
        />
        <Search.DropDown title={'적치 LCTN'} name={'lctnTypeCd'} value={filters.lctnTypeCd} defaultOptions={storageOptions} onChange={handleFilterChange} />
        <Search.DropDown
          title={'출고지시'}
          name={'pickingTypeCd'}
          value={filters.pickingTypeCd}
          defaultOptions={releaseOrderOptions}
          onChange={handleFilterChange}
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

      <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}>
          <button className={`btn ${isPreView ? 'on' : ''}`} title="미리보기" onClick={() => setIsPreView(!isPreView)}>
            미리보기
          </button>
        </TableHeader>
        <div className="layoutPrivewBox">
          <div className="layoutBox">
            <div className="layout100-600 show">
              <div className="gridBox">
                <div className="tblPreview">
                  <TunedGrid
                    ref={gridRef}
                    onGridReady={onGridReady}
                    rowData={rowData ?? []}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    suppressRowClickSelection={false}
                    loadingOverlayComponent={CustomGridLoading}
                    noRowsOverlayComponent={CustomNoRowsOverlay}
                    suppressContextMenu={true}
                    onSelectionChanged={handleSelectionChanged}
                    onCellEditingStopped={onCellEditingStopped}
                    rowSelection={'multiple'}
                    className={'wmsDefault check'}
                  />
                  <div className="btnArea">
                    <CustomShortcutButton className="btn" onClick={handleSave} shortcut={COMMON_SHORTCUTS.save}>
                      적치등록
                    </CustomShortcutButton>
                  </div>
                  <Pagination pageObject={paging} setPaging={setPaging} />
                </div>
              </div>
            </div>
            <div className="layout600 hide">
              <div className="gridBox">
                <div className="tblPreview">
                  <TunedGrid
                    // ref={gridRef}
                    onGridReady={onGridReady}
                    rowData={subRowData}
                    columnDefs={subColumnDefs}
                    defaultColDef={defaultColDef}
                    loadingOverlayComponent={CustomGridLoading}
                    noRowsOverlayComponent={CustomNoRowsOverlay}
                    suppressRowClickSelection={false}
                    className={'wmsDefault'}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="previewBox">
            {isPreView ? (
              selectedDetail?.length > 0 ? (
                <PrintWmsLayout selectedDetail={selectedDetail} isPrinting={isPrinting} setIsPrinting={setIsPrinting} />
              ) : (
                <div className="noRowsOverlayBox">항목을 선택하면 상세 정보가 표시됩니다.</div>
              )
            ) : null}
          </div>
        </div>
      </div>
      {isCreateInvenLoading && <Loading />}
    </div>
  );
};

export default Tostorage;
