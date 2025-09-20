import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, TableHeader, Title, toastError } from '../../../components';
import { useQuery } from '@tanstack/react-query';
import { useCommonStore } from '../../../stores';
import { useSession } from 'next-auth/react';
import { DataListDropDown } from '../../../components/DataListDropDown';
import { InventoryinfoResponsePaging, InventoryLocationListResponse, PartnerResponseSelect, SkuLocationInfoListResponse } from '../../../generated';
import { fetchPartners } from '../../../api/wms-api';
import useFilters from '../../../hooks/useFilters';
import TunedGrid from '../../../components/grid/TunedGrid';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowClassParams } from 'ag-grid-community';
import { Utils } from '../../../libs/utils';
import { authApi } from '../../../libs';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

/**
 * 재고정보 메인 페이지 컴포넌트
 * SKU단위와 LOC단위 보기를 전환할 수 있는 메인 컴포넌트
 */
const InventoryLocationList: React.FC = () => {
  // 스위치 상태 관리 (true: SKU단위, false: LOC단위)
  const [selectedRow, setSelectedRow] = useState<InventoryinfoResponsePaging>({});

  // 세션 정보
  const session = useSession();
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;

  // 메뉴 정보
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  const [zoneOption, setZoneOption] = useState([]); // 존 리스트
  const topGridDivRef = useRef<HTMLDivElement>(null);
  const rightGridDivRef = useRef<HTMLDivElement>(null);
  const [selectedPartner, setSelectedPartner] = useState<any>();
  const [selectedZone, setSelectedZone] = useState<any>();
  const [rowData, setRowData] = useState<InventoryLocationListResponse[]>();
  const [rowDataRight, setRowDataRight] = useState<SkuLocationInfoListResponse[]>();
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<InventoryLocationListResponse[]>([]); // 합계데이터 만들기
  const [pinnedBottomRowDataRight, setPinnedBottomRowDataRight] = useState<SkuLocationInfoListResponse[]>([]); // 합계데이터 만들기

  const gridRef = useRef<AgGridReact>(null);
  const subGridRef = useRef<AgGridReact>(null);
  // 재고 정보 스토어
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    logisId: workLogisId,
    partnerId: undefined,
    zoneId: '0',
    skuNm: '',
  });

  const gridColumns = useMemo<ColDef<InventoryLocationListResponse>[]>(
    () => [
      {
        field: 'no',
        headerName: 'No.',
        minWidth: 36,
        maxWidth: 36,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'partnerNm',
        headerName: '고객사',
        filter: true,
        minWidth: 150,
        maxWidth: 150,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'zoneCdNm',
        headerName: 'ZONE',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'locAlias',
        headerName: '로케이션',
        filter: true,
        minWidth: 150,
        maxWidth: 150,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'centerCnt',
        headerName: '총재고량',
        minWidth: 100,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'skuCountPercent',
        headerName: '비율(%)',
        minWidth: 100,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value) + ' %';
        },
      },
    ],
    [],
  );

  const rightGridColumns = useMemo<ColDef<SkuLocationInfoListResponse>[]>(
    () => [
      {
        field: 'no',
        headerName: 'No.',
        minWidth: 36,
        maxWidth: 36,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'partnerNm',
        headerName: '고객사',
        minWidth: 150,
        maxWidth: 150,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuNm',
        headerName: '상품',
        minWidth: 250,
        maxWidth: 250,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'totalInven',
        headerName: '물류재고',
        minWidth: 70,
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
    ],
    [],
  );

  const { data: zonList, isSuccess: isZoneListSuccess } = useQuery(
    ['/zone/dropDownZoneList'], // 쿼리 키에 zoneId 포함
    (): any => authApi.get(`/zone/dropDownZoneList/` + Number(workLogisId)),
    {
      enabled: !!session.data?.user.workLogisId, // logisId가 유효할 때에만 실행
    },
  );

  useEffect(() => {
    if (isZoneListSuccess && zonList) {
      const { resultCode, body, resultMessage } = zonList.data;
      if (resultCode === 200) {
        const updateList = body?.map((item: any) => ({
          key: item.id,
          value: item.id,
          label: item.zoneCdNm,
          zoneId: item.zoneId,
        }));
        setZoneOption(updateList);
      } else {
        toastError(resultMessage);
      }
    }
  }, [zonList, isZoneListSuccess]);

  // 화주 변경 핸들러
  const handleChangePartner = (option: any) => {
    setSelectedPartner(option);
    onChangeFilters('partnerId', option.value.toString());
    setTimeout(() => {
      search();
    }, 10);
  };

  const handleChangeZone = (option: any) => {
    setSelectedZone(option);
    onChangeFilters('zoneId', option.value);
    setTimeout(() => {
      search();
    }, 10);
  };

  // 검색 기능
  const search = async () => {
    // 검색 시 페이지 1로 초기화
    refetchInvenLocation().then(() => console.log('search refetchInvenSku ==='));
  };

  // 초기화 기능
  const reset = async () => {
    onFiltersReset();
    setSelectedPartner(null);
    refetchInvenLocation().then(() => console.log('reset refetchInvenSku ==='));
  };

  // 화주옵션 조회
  const defaultOption = { value: '0', label: '전체' };
  const [partnerOption, setPartnerOption] = useState<any>([defaultOption]);
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

  // 재고위치정보 목록 조회
  const {
    data: inventoryLocationListInfos,
    isFetching: isFetching,
    isSuccess: isInventoryLocationListInfosSuccess,
    refetch: refetchInvenLocation,
  } = useQuery(
    ['/wms/inven/invenLocationList'], // filters 추가
    () =>
      authApi.get('/wms/inven/invenLocationList', {
        params: filters,
      }),
    {
      enabled: !!filters.logisId,
    },
  );

  // 재고위치정보 목록 조회
  const {
    data: skuLocationInfos,
    isFetching: isSkuLocationFetching,
    isSuccess: isSkuLocationSuccess,
    refetch: refetchSkuLocation,
  } = useQuery(
    ['/wms/inven/selectInventoryLocationDetailList'], // filters 추가
    () =>
      authApi.get('/wms/inven/selectInventoryLocationDetailList', {
        params: { logisId: filters.logisId, ...selectedRow },
      }),
    {
      enabled: !!selectedRow.locId,
    },
  );

  useEffect(() => {
    if (isInventoryLocationListInfosSuccess && inventoryLocationListInfos) {
      if (inventoryLocationListInfos.data.resultCode === 200 && inventoryLocationListInfos.data.body) {
        setRowData(inventoryLocationListInfos.data.body);
        if (inventoryLocationListInfos.data.body && inventoryLocationListInfos.data.body.length > 0) {
          const { centerCnt } = inventoryLocationListInfos.data.body.reduce(
            (
              acc: {
                centerCnt: number;
              },
              data: InventoryinfoResponsePaging,
            ) => {
              return {
                centerCnt: acc.centerCnt + (data.centerCnt ? data.centerCnt : 0),
              };
            },
            {
              centerCnt: 0,
            }, // 초기값 설정
          );

          setPinnedBottomRowData([
            {
              centerCnt: centerCnt,
            },
          ]);
        }
      } else {
        toastError(inventoryLocationListInfos.data.resultMessage || '재고 목록 조회에 실패했습니다.');
      }
    }
  }, [inventoryLocationListInfos, isInventoryLocationListInfosSuccess]);

  useEffect(() => {
    refetchSkuLocation().then((result) => {
      if (result.data && result.status == 'success') {
        console.log('fetchVatInouts==>', result.data);
        const { resultCode, body, resultMessage } = result.data.data;
        if (resultCode === 200) {
          setRowDataRight(body);

          if (body && body.length > 0) {
            const { totalInven } = body.reduce(
              (
                acc: {
                  totalInven: number;
                },
                data: SkuLocationInfoListResponse,
              ) => {
                return {
                  totalInven: acc.totalInven + (data.totalInven ? data.totalInven : 0),
                };
              },
              {
                totalInven: 0,
              }, // 초기값 설정
            );

            setPinnedBottomRowDataRight([{ totalInven: totalInven }]);
          }
        } else {
          toastError(resultMessage);
        }
      }
    });
  }, [selectedRow]);

  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params.node.rowPinned === 'bottom') {
      // 합계 행 스타일링
      rtnValue = rtnValue ? rtnValue + ' ag-grid-pinned-row' : 'ag-grid-pinned-row';
    }

    return rtnValue;
  }, []);

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} search={search} filters={filters} reset={reset} />
      <Search className="type_2">
        <DataListDropDown
          title={'고객사'}
          name={'partnerId'}
          value={selectedPartner}
          onChange={handleChangePartner}
          options={partnerOption}
          placeholder="고객사명 입력"
        />
        <Search.Input title={'상품명'} name={'skuNm'} placeholder={'상품명 입력'} value={filters.skuNm} onChange={onChangeFilters} onEnter={search} />
        <Search.DropDown title={'ZONE'} name={'zoneId'} value={selectedZone} onChange={handleChangeZone} defaultOptions={zoneOption} />
      </Search>
      <div className={`makePreviewArea`}>
        {/* 테이블 헤더 - 총 건수 및 페이징 정보 표시 */}
        <TableHeader count={rowData?.length || 0} search={search}></TableHeader>
        <div className="gridBox">
          <div className="tblPreview">
            <div className="layoutBox pickinginfo">
              <div className={'layout50'}>
                <div className="InfoGrid" ref={topGridDivRef}>
                  <TunedGrid<InventoryLocationListResponse>
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={gridColumns}
                    defaultColDef={defaultColDef}
                    suppressRowClickSelection={false}
                    noRowsOverlayComponent={CustomNoRowsOverlay}
                    rowSelection={'multiple'}
                    className={'wmsDashboard check'}
                    onRowClicked={(e) => {
                      setSelectedRow({
                        locId: e.data?.locId,
                        partnerId: e.data?.partnerId,
                      });
                    }}
                    loading={isFetching}
                    pinnedBottomRowData={pinnedBottomRowData}
                    getRowClass={getRowClass}
                  />
                  <div className="btnArea"></div>
                </div>
              </div>
              <div className={'layout50'}>
                <div className="InfoGrid" ref={rightGridDivRef}>
                  <TunedGrid<SkuLocationInfoListResponse>
                    ref={subGridRef}
                    rowData={rowDataRight}
                    columnDefs={rightGridColumns}
                    defaultColDef={defaultColDef}
                    suppressRowClickSelection={false}
                    noRowsOverlayComponent={CustomNoRowsOverlay}
                    rowSelection={'multiple'}
                    className={'wmsDashboard check'}
                    loading={isSkuLocationFetching}
                    pinnedBottomRowData={pinnedBottomRowDataRight}
                    getRowClass={getRowClass}
                  />
                  <div className="btnArea"></div>
                </div>
              </div>
            </div>
          </div>
          {/* 미리보기 & 프린트 */}
          <div className="previewBox"></div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(InventoryLocationList);
