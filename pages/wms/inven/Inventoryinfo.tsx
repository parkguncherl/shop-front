import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, TableHeader, Title, toastError } from '../../../components';
import { useQuery } from '@tanstack/react-query';
import { useCommonStore } from '../../../stores';
import { useSession } from 'next-auth/react';
import { InventoryinfoResponsePaging, PartnerResponseSelect } from '../../../generated';
import { fetchPartners } from '../../../api/wms-api';
import { useInventoryInfoStore } from '../../../stores/wms/useInventoryInfoStore';
import useFilters from '../../../hooks/useFilters';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import TunedGrid from '../../../components/grid/TunedGrid';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowClassParams } from 'ag-grid-community';
import { Utils } from '../../../libs/utils';
import { authApi } from '../../../libs';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import InvenChangePop from '../../../components/wms/search/InvenChangePop';
import CreateInspectionPop from '../../../components/wms/search/CreateInspectionPop';
import { ReactSelectorInterface, TunedReactSelector } from '../../../components/TunedReactSelector';
import CustomGridLoading from '../../../components/CustomGridLoading';

/**
 * 재고정보 메인 페이지 컴포넌트
 * SKU단위와 LOC단위 보기를 전환할 수 있는 메인 컴포넌트
 */
const Inventoryinfo: React.FC = () => {
  // 스위치 상태 관리 (true: SKU단위, false: LOC단위)
  const [selectedRow, setSelectedRow] = useState<InventoryinfoResponsePaging[]>([]);

  // 세션 정보
  const session = useSession();
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;

  // 메뉴 정보
  const [upMenuNm, menuNm, getFileUrl] = useCommonStore((s) => [s.upMenuNm, s.menuNm, s.getFileUrl]);
  const [openModal] = useInventoryInfoStore((s) => [s.openModal]);
  const [zoneOption, setZoneOption] = useState([]); // 존 리스트
  const [locationOption, setLocationOption] = useState([]); // location 리스트
  const topGridDivRef = useRef<HTMLDivElement>(null);
  const reactSelectRef = useRef<ReactSelectorInterface>(null);
  const [slide, setSlide] = useState<boolean>(true); // 스와이퍼
  const [imgResize, setImgResize] = useState<boolean>(false);
  const [queryKey, setQueryKey] = useState<boolean>(false);
  const [skuInvenData, setSkuInvenData] = useState<InventoryinfoResponsePaging[]>([]);
  const handleImageResize = () => {
    setImgResize(!imgResize);
  };

  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<InventoryinfoResponsePaging[]>([]); // 합계데이터 만들기
  const gridRef = useRef<AgGridReact>(null);
  // 재고 정보 스토어
  const { paging, setPaging } = useInventoryInfoStore();
  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    logisId: session.data?.user.workLogisId,
    partnerId: undefined,
    zoneId: '',
    skuNm: '',
    searchType: 'B',
  });
  const gridColumns = useMemo<ColDef<InventoryinfoResponsePaging>[]>(
    () => [
      {
        field: 'no',
        headerName: 'No.',
        minWidth: 50,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'partnerNm',
        headerName: '고객사',
        minWidth: 90,
        maxWidth: 90,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuNm',
        headerName: '상품명',
        minWidth: 150,
        maxWidth: 200,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'season',
        headerName: '계절',
        minWidth: 70,
        maxWidth: 70,
        suppressHeaderMenuButton: true,
        filter: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'funcCd',
        headerName: '스타일1',
        minWidth: 70,
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'funcDetCd',
        headerName: '스타일2',
        minWidth: 70,
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      /*
      {
        field: 'zoneCdNm',
        headerName: 'ZONE',
        minWidth: 70,
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'locAlias',
        headerName: 'LCTN',
        filter: true,
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      */
      {
        field: 'centerCnt',
        headerName: '빈블러',
        minWidth: 70,
        maxWidth: 70,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'waitingCnt',
        headerName: '대기',
        minWidth: 40,
        maxWidth: 40,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'retailCnt',
        headerName: '매장재고',
        minWidth: 60,
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      /*
      {
        field: 'weekOutCnt',
        headerName: '7일출고',
        minWidth: 60,
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'monthOutCnt',
        headerName: '한달출고',
        minWidth: 60,
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
*/
      {
        field: 'stockYmd',
        headerName: '최근입고일',
        minWidth: 80,
        maxWidth: 80,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'stockCnt',
        headerName: '입고수량',
        minWidth: 60,
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        headerTooltip: '최근입고일 입고수량',
        tooltipComponentParams: {
          showDelay: 500,
          hideDelay: 5000, // 툴팁이 사라지기 전까지 5초 유지
        },
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'jobOutYmd',
        headerName: '최근출고일',
        minWidth: 80,
        maxWidth: 80,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'jobCnt',
        headerName: '출고수량',
        minWidth: 60,
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        headerTooltip:
          '최근 입고 이후부터의 출고 수량\n' +
          '최근 출고일자의 출고수량이 아닌, 최근 입고일부터 현재까지의 출고수량입니다.\n' +
          '마지막 입고 시점부터의 출고 수량을 현재고와 비교하여 재고의 회전율을 유추하기 위함입니다.',
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
    ],
    [],
  );

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
        setZoneOption(updateList);
      } else {
        toastError(resultMessage);
      }
    }
  }, [zonList, isZoneListSuccess]);

  const { data: locationList, isSuccess: isLocationListSuccess } = useQuery({
    queryKey: ['/zone/locOptList', workLogisId],
    queryFn: async () => {
      const res = await authApi.get('/zone/locOptList/' + workLogisId);
      return res.data;
    },
    enabled: !!workLogisId,
  });

  useEffect(() => {
    if (isLocationListSuccess && locationList) {
      const { resultCode, body, resultMessage } = locationList;
      if (resultCode === 200) {
        const updateList = body?.map((item: any) => ({
          key: item.locId,
          value: item.locId,
          label: item.locNm,
          zoneId: item.zoneId,
        }));
        setLocationOption(updateList);
      } else {
        toastError(resultMessage);
      }
    }
  }, [locationList, isLocationListSuccess]);

  useEffect(() => {
    console.log('locationList ==>', locationList);
  }, [locationList]);
  // 화주 변경 핸들러
  const handleChangePartner = (option: any) => {
    onChangeFilters('partnerId', option.value.toString());
    setTimeout(() => {
      search();
    }, 10);
  };

  // 검색 기능
  const search = async () => {
    // 검색 시 페이지 1로 초기화
    setPaging({
      ...paging,
      curPage: 1,
    });
    refetchInvenSku().then(() => console.log('search refetchInvenSku ==='));
  };

  const onSearch = async () => {
    setPaging({
      ...paging,
      curPage: 1,
    });
  };

  // 초기화 기능
  const reset = async () => {
    onFiltersReset();
    reactSelectRef.current?.reactSelectorReset();
    // 파트너 선택 상태도 초기화
  };

  // 화주옵션 조회
  //const defaultOption = { value: '0', label: '전체' };
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
        setPartnerOption([...partnerCodes]);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchPartnerSuccess, partners]);

  // 출고정보 목록 조회
  const {
    data: inventoryInfos,
    isSuccess: isPagingSuccess,
    refetch: refetchInvenSku,
    isLoading: isPageLoading,
    isRefetching,
  } = useQuery(
    ['/wms/inven/sku/paging', queryKey], // filters 추가
    () =>
      authApi.get('/wms/inven/sku/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
    {
      enabled: !!filters.partnerId || !!filters.skuNm,
    },
  );
  useEffect(() => {
    console.log('isRefetching ====>', isRefetching);
  }, [isRefetching]);

  useEffect(() => {
    if (isPagingSuccess && inventoryInfos?.data) {
      const { resultCode, body, resultMessage } = inventoryInfos.data;
      if (resultCode === 200 && body) {
        setSkuInvenData(body.rows || []);
        setPaging(body.paging);
        if (body && body.rows.length > 0) {
          const { centerCnt, stockCnt, weekOutCnt, monthOutCnt, retailCnt, jobCnt, waitingCnt } = body.rows.reduce(
            (
              acc: {
                centerCnt: number;
                retailCnt: number;
                weekOutCnt: number;
                monthOutCnt: number;
                stockCnt: number;
                jobCnt: number;
                waitingCnt: number;
              },
              data: InventoryinfoResponsePaging,
            ) => {
              return {
                centerCnt: acc.centerCnt + (data.centerCnt ? data.centerCnt : 0),
                retailCnt: acc.retailCnt + (data.retailCnt ? data.retailCnt : 0),
                weekOutCnt: acc.weekOutCnt + (data.weekOutCnt ? data.weekOutCnt : 0),
                monthOutCnt: acc.monthOutCnt + (data.monthOutCnt ? data.monthOutCnt : 0),
                stockCnt: acc.stockCnt + (data.stockCnt ? data.stockCnt : 0),
                jobCnt: acc.jobCnt + (data.jobCnt ? data.jobCnt : 0),
                waitingCnt: acc.waitingCnt + (data.waitingCnt ? data.waitingCnt : 0),
              };
            },
            {
              centerCnt: 0,
              retailCnt: 0,
              weekOutCnt: 0,
              monthOutCnt: 0,
              remainCount: 0,
              stockCnt: 0,
              jobCnt: 0,
              waitingCnt: 0,
            }, // 초기값 설정
          );

          setPinnedBottomRowData([
            {
              centerCnt: centerCnt,
              retailCnt: retailCnt,
              weekOutCnt: weekOutCnt,
              monthOutCnt: monthOutCnt,
              stockCnt: stockCnt,
              jobCnt: jobCnt,
              waitingCnt: waitingCnt,
            },
          ]);
        }
      } else {
        toastError(resultMessage || '재고 목록 조회에 실패했습니다.');
      }
    }
  }, [inventoryInfos, isPagingSuccess, setPaging]);

  const [files, setFiles] = useState<any[]>([]);
  const getFileList = async (fileId: any, type?: string) => {
    if (fileId && Number(fileId) < 1) {
      console.warn('fileId가 없습니다. API 호출하지 않음.');
      return -1; // fileId가 없으면 함수 종료
    }

    try {
      const { data: fileList } = await authApi.get(`/common/file/${fileId}`);
      const { resultCode, body, resultMessage } = fileList;
      if (resultCode === 200) {
        if (type === 'row') {
          return body;
        }
        return body?.length ?? -1;
      }
      return -1;
    } catch (error) {
      console.error('파일 조회 중 오류 발생:', error);
      return -1;
    }
  };

  /** row선택 이벤트 (이미지) */
  const onSelectionChanged = (e: any) => {
    const selectedRows = e.api.getSelectedRows();
    if (selectedRows[0]?.imgFileId) {
      getFileList(selectedRows[0]?.imgFileId, 'row').then(async (fileList) => {
        // 각 파일의 URL
        const updatedFiles = await Promise.all(
          fileList.map(async (file: any) => {
            const fileUrl = await getFileUrl(file.sysFileNm);
            return { ...file, url: fileUrl };
          }),
        );

        setFiles(updatedFiles);
      });
    } else {
      setFiles([]); // 초기화
    }
  };

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
        <TunedReactSelector
          title={'고객사'}
          name={'partnerId'}
          onChange={handleChangePartner}
          options={partnerOption}
          placeholder="고객사 선택"
          ref={reactSelectRef}
        />
        <Search.Input
          title={'상품명'}
          name={'skuNm'}
          placeholder={'메인 제작 공장검색'}
          value={filters.skuNm}
          onChange={onChangeFilters}
          onEnter={() => setQueryKey(!queryKey)}
        />
        <Search.DropDown
          title={'조회구분'}
          name={'searchType'}
          defaultOptions={[
            { key: 'B', label: '빈블러재고', value: 'B' },
            { key: 'R', label: '매장재고', value: 'R' },
          ]}
          value={filters.searchType}
          onChange={(name, value) => {
            onChangeFilters(name, value);
            setQueryKey(!queryKey);
          }}
        />

        <Search.DropDown
          title={'ZONE'}
          name={'zoneId'}
          value={filters.zoneId}
          onChange={(name, value) => {
            onChangeFilters(name, value);
            setQueryKey(!queryKey);
          }}
          defaultOptions={zoneOption}
        />
      </Search>
      <div className={`makePreviewArea`}>
        {/* 테이블 헤더 - 총 건수 및 페이징 정보 표시 */}
        <TableHeader count={paging.totalRowCount || 0} search={onSearch}>
          <CustomShortcutButton className={`btn ${slide ? 'on' : ''}`} title="미리보기" onClick={() => setSlide(!slide)} shortcut={COMMON_SHORTCUTS.alt1}>
            이미지
          </CustomShortcutButton>
        </TableHeader>

        <div className="gridBox">
          <div className="tblPreview">
            <div className="layoutBox pickinginfo">
              <div className={'layout100'}>
                <div className="InfoGrid" ref={topGridDivRef}>
                  <TunedGrid<InventoryinfoResponsePaging>
                    ref={gridRef}
                    rowData={skuInvenData}
                    columnDefs={gridColumns}
                    defaultColDef={defaultColDef}
                    noRowsOverlayComponent={CustomNoRowsOverlay}
                    loadingOverlayComponent={CustomGridLoading}
                    onSelectionChanged={onSelectionChanged}
                    rowSelection={'multiple'}
                    className={'wmsDashboard check'}
                    suppressRowClickSelection={false}
                    pinnedBottomRowData={pinnedBottomRowData}
                    getRowClass={getRowClass}
                    loading={isRefetching}
                  />
                  <div className={`productImgBox ${slide ? 'on' : ''} ${imgResize ? 'onSize' : ''}`} onDoubleClick={handleImageResize}>
                    <button className={`imgResizeBtn ${imgResize ? 'small' : 'big'}`} onClick={handleImageResize}></button>
                    {files.length > 0 ? (
                      <>
                        <Swiper
                          modules={[Navigation, Pagination]}
                          navigation={{
                            nextEl: '.imgBoxNext',
                            prevEl: '.imgBoxPrev',
                          }}
                          pagination={{ clickable: true }}
                        >
                          <div className={'wrap'}>
                            {files.map((item) => (
                              <SwiperSlide key={item.url}>
                                <img src={item.url} alt="상품 이미지" />
                              </SwiperSlide>
                            ))}
                          </div>
                        </Swiper>
                        <div className={'imgBoxBtn'}>
                          <button className={'imgBoxPrev'}></button>
                          <button className={'imgBoxNext'}></button>
                        </div>
                      </>
                    ) : (
                      <div className="noImage">저장된 이미지가 없습니다</div>
                    )}
                  </div>
                  <div className="btnArea">
                    {' '}
                    <CustomShortcutButton
                      onClick={() => {
                        const selectedNodes: InventoryinfoResponsePaging[] | undefined = gridRef.current?.api
                          .getSelectedNodes()
                          ?.map((node, index) => ({ ...node.data, no: ++index }));
                        if (selectedNodes && selectedNodes.length > 0) {
                          setSelectedRow(selectedNodes);
                          openModal('INVEN_CHANGE');
                        } else if (selectedNodes && selectedNodes.length < 1) {
                          toastError('선택된건이 존재하지 않습니다.');
                        }
                      }}
                      shortcut={COMMON_SHORTCUTS.save}
                      className="btn"
                    >
                      LTCN변경
                    </CustomShortcutButton>
                    <CustomShortcutButton
                      onClick={() => {
                        const selectedNodes: InventoryinfoResponsePaging[] | undefined = gridRef.current?.api
                          .getSelectedNodes()
                          ?.map((node, index) => ({ ...node.data, no: ++index }));
                        if (selectedNodes && selectedNodes.length > 0) {
                          setSelectedRow(selectedNodes);
                          openModal('CREATE_INSPECTION');
                        } else if (selectedNodes && selectedNodes.length < 1) {
                          toastError('선택된건이 존재하지 않습니다.');
                        }
                      }}
                      shortcut={COMMON_SHORTCUTS.save}
                      className="btn"
                    >
                      재고실사등록
                    </CustomShortcutButton>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 미리보기 & 프린트 */}

          <div className="previewBox"></div>
        </div>
      </div>
      <InvenChangePop
        data={selectedRow}
        zoneOption={[{ key: 0, value: 0, label: '선택', zoneId: 0 }, ...zoneOption]} // 선택값 맨 앞에 추가해서 보낸다.
        locationOption={locationOption}
        fetchPopUp={refetchInvenSku}
      />
      <CreateInspectionPop logisId={filters.logisId || 0} data={selectedRow} fetchPopUp={refetchInvenSku} />
    </div>
  );
};

export default React.memo(Inventoryinfo);
