import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Search, TableHeader, Title } from '../../../components';
import { Pagination, toastError } from '../../../components';
import { useAsnStore } from '../../../stores/wms/useAsnStore';
import { CellKeyDownEvent, ColDef, FullWidthCellKeyDownEvent, RowDoubleClickedEvent } from 'ag-grid-community';
import { useQuery } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import useFilters from '../../../hooks/useFilters';
import { useCommonStore } from '../../../stores';
import { AgGridReact } from 'ag-grid-react';
import { AsnRequestPagingFilter, AsnResponsePaging, AsnResponseStatDashBoard, PartnerResponseSelect } from '../../../generated';
import { useSession } from 'next-auth/react';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { fetchPartners } from '../../../api/wms-api';
import TunedGrid from '../../../components/grid/TunedGrid';
import debounce from 'lodash/debounce';
import { authApi } from '../../../libs';
import { useAgGridApi } from '../../../hooks';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import { Utils } from '../../../libs/utils';
import { Progress } from 'antd';
import AsnDtlPop from '../../../components/wms/ipgo/AsnDtlPop';
import PrintWmsLayout from '../../../components/print/PrintWmsLayout';
import { TunedReactSelector } from '../../../components/TunedReactSelector';
import { DropDownOption } from '../../../types/DropDownOptions';

/**
 * ASN(Advanced Shipping Notice) 페이지 컴포넌트
 * 입고 예정 정보를 조회하고 관리하는 페이지
 */
const Asn = () => {
  const nowPage = 'wms_asn'; // filter 저장 예솔수정
  const session = useSession();
  const { onGridReady } = useAgGridApi();

  const gridRef = useRef<AgGridReact>(null);

  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList, //filter 예솔수정
    s.setFilterDataList, //filter 예솔수정
    s.getFilterData, //filter 예솔수정
    s.selectedRetail, //화주 예솔수정
  ]);

  const [paging, setPaging, modalType, openModal, closeModal] = useAsnStore((s) => [s.paging, s.setPaging, s.modalType, s.openModal, s.closeModal]);

  /**
   * 필터 상태 초기화 예솔수정으로 주석처리함
   */
  /*const [filters, onChangeFilters] = useFilters<AsnRequestPagingFilter>({
    logisId: session.data?.user.workLogisId ? Number(session.data?.user.workLogisId) : undefined, // 물류 계정 창고검색필터
    partnerId: undefined,
    compNm: '',
    prodNm: '',
    asnType: '1',
  });*/

  const initialFilters = {
    logisId: session.data?.user.workLogisId ? Number(session.data?.user.workLogisId) : undefined,
    partnerId: undefined,
    compNm: '',
    prodNm: '',
    asnType: '1',
  };
  const [filters, onChangeFilters] = useFilters(getFilterData(filterDataList, nowPage) || initialFilters); // filter 예솔수정

  const [rowData, setRowData] = useState<AsnResponsePaging[]>([]);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<AsnResponsePaging[]>([]); // 합계데이터 만들기
  const [asnStatData, setAsnStatData] = useState<AsnResponseStatDashBoard>();
  const [isPreView, setIsPreView] = useState<boolean>(true);
  const [isPrinting, setIsPrinting] = useState(false); // 프린트 여부
  const [selectedDetail, setSelectedDetail] = useState<any>(null); // 미리보기 상태
  const [dtlParam, setDtlParam] = useState<any>(); // 상세보기 상태

  /** 발주 통계 대시보드 데이타 조회 */
  const {
    data: asnStat,
    isLoading: isStatLoading,
    isSuccess: isStatSuccess,
    refetch: refetchStat,
  } = useQuery({
    queryKey: ['/wms/asn/stat/dashboard', filters],
    queryFn: () =>
      authApi.get('/wms/asn/stat/dashboard', {
        params: {
          logisId: filters.logisId ? filters.logisId : Number(session.data?.user.workLogisId),
        },
      }),
    enabled: !!filters.logisId,
    staleTime: 5000, // 데이터 신선도 시간 설정 (5초)
    refetchOnWindowFocus: false, // 윈도우 포커스시 리패치 비활성화
    refetchOnReconnect: true, // 네트워크 재연결시 리패치
    retry: 1, // 실패시 1회 재시도
  });

  useEffect(() => {
    if (isStatSuccess && asnStat) {
      const { resultCode, body, resultMessage } = asnStat.data;
      if (resultCode == 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 예솔수정
        setAsnStatData(body || {});
      } else {
        toastError(resultMessage);
        setAsnStatData({
          maxAsnPartnerNm: '',
          maxGenCnt: 0,
          totalGenCnt: 0,
          totalPartnerCnt: 0,
        });
      }
    }
  }, [asnStat, isStatSuccess]);

  /** 목록 페이징 데이터 조회*/
  const {
    data: asnData,
    isLoading: isListLoading,
    isSuccess: isListSuccess,
    refetch: refetchAsn,
  } = useQuery({
    queryKey: ['/wms/asn/paging', paging.curPage, filters.logisId, filters.partnerId],
    queryFn: () =>
      authApi.get('/wms/asn/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
    enabled: !!filters.logisId,
    staleTime: 5000, // 데이터 신선도 시간 설정 (5초)
    refetchOnWindowFocus: false, // 윈도우 포커스시 리패치 비활성화
    refetchOnReconnect: true, // 네트워크 재연결시 리패치
    retry: 1, // 실패시 1회 재시도
  });

  useEffect(() => {
    if (isListSuccess) {
      const { resultCode, body, resultMessage } = asnData.data;
      if (resultCode === 200) {
        setRowData(body.rows || []);
        setPaging({
          ...paging,
          ...body?.paging,
          totalRowCount: body?.paging?.totalRowCount || 0,
        });
      } else {
        toastError('목록 페이징 데이터 조회 도중 문제가 발생하였습니다.');
        console.error(resultMessage);
        // 에러 시 빈 데이터로 초기화
        setRowData([]);
        setPaging({
          ...paging,
          totalRowCount: 0,
        });
      }
    }
  }, [asnData, isListSuccess, setPaging]);

  /** 화주옵션 조회 */
  const [partnerOption, setPartnerOption] = useState<any[]>([]);
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;
  const { data: partners, isSuccess: isFetchPartnerSuccess } = useQuery(['fetchPartners'], () => fetchPartners(workLogisId));
  useEffect(() => {
    if (isFetchPartnerSuccess && partners) {
      const { resultCode, body, resultMessage } = partners.data;
      if (resultCode === 200) {
        const partnerCodes = body?.map((item: PartnerResponseSelect) => ({
          key: item.id,
          value: item.id,
          label: item.partnerNm,
        }));
        setPartnerOption([{ key: 'all', value: '', label: '전체' }, ...partnerCodes]);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchPartnerSuccess, partners]);

  /** 검색 */
  const search = async () => {
    setPaging({
      ...paging,
      curPage: 1,
    });
    await refetchAsn();
  };

  /** 필터 초기화 및 검색 */
  const reset = async () => {
    await defaultFilters();
    await search();
  };

  /** 필터 초기화 값 설정 */
  const defaultFilters = async () => {
    const defaultFilter: AsnRequestPagingFilter = {
      logisId: Number(session.data?.user.workLogisId) || undefined,
      partnerId: undefined,
      compNm: '',
      prodNm: '',
      asnType: '1',
    };

    Object.entries(defaultFilter).forEach(([key, value]) => {
      onChangeFilters(key as keyof AsnRequestPagingFilter, value);
    });
  };

  /** 그리드 컬럼 정의 */
  const [columnDefs] = useState<ColDef<AsnResponsePaging>[]>([
    {
      field: 'no',
      headerName: 'No.',
      minWidth: 50,
      maxWidth: 50,
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
      field: 'factoryNm',
      headerName: '생산처',
      minWidth: 150,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'asnTypeNm',
      headerName: '발주구분',
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'asnWorkYmd',
      headerName: '발주일',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'asnPeriod',
      headerName: '경과일',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'prodCnt',
      headerName: '품목 #',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuCnt',
      headerName: 'SKU #',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'totalGenCnt',
      headerName: '발주수량',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'befInstockCnt',
      headerName: '기입고수량',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      filter: true,
    },
  ]);

  /** 최초 데이타 렌더링 및 데이타 업데이트시 이벤트  */
  const onRowDataUpdated = useCallback(() => {
    updateTotals(); // 하단 합계 계산
  }, []);

  /** 그리드 하단 합계 업데이트 함수 */
  const updateTotals = () => {
    let prodCnt = 0;
    let skuCnt = 0;
    let totalGenCnt = 0;
    let befInstockCnt = 0;

    gridRef.current?.api.forEachNode((node) => {
      prodCnt += Number(node.data.prodCnt || 0);
      skuCnt += Number(node.data.skuCnt || 0);
      totalGenCnt += Number(node.data.totalGenCnt || 0);
      befInstockCnt += Number(node.data.befInstockCnt || 0);
    });

    // 합계 데이터를 상태로 설정하여 pinned bottom row에 전달
    setPinnedBottomRowData([
      {
        factoryNm: 'Total',
        prodCnt: prodCnt,
        skuCnt: skuCnt,
        totalGenCnt: totalGenCnt,
        befInstockCnt: befInstockCnt,
      },
    ]);
  };

  /** 고객사 변경 이벤트 */
  const handleChangePartner = useCallback(
    async (option: DropDownOption) => {
      //setSelectedPartner(option);
      onChangeFilters('partnerId', option.value || '');
      await new Promise((resolve) => setTimeout(resolve, 0));
      await search();
    },
    [onChangeFilters, search],
  );

  /** 그리드 항목 선택 이벤트
   * 중복 렌더링이슈가 있어 debounce를 사용해서 300ms 까지 마지막 이벤트만 처리하도록 한다.
   * */
  const handleSelectionChanged = useCallback(
    debounce(async () => {
      const selectedNodes = gridRef.current?.api.getSelectedNodes();

      if (selectedNodes && selectedNodes.length > 0) {
        const selectedData = selectedNodes[0].data;

        if (!isPreView) return; // 미리보기 선택이 안되면 상세 API를 불러오지 않는다

        const params = {
          logisId: filters.logisId ? filters.logisId : Number(session.data?.user.workLogisId),
          partnerId: selectedData.partnerId,
          factoryId: selectedData.factoryId,
          asnType: selectedData.asnTypeCd,
          workYmd: selectedData.asnWorkYmd,
        };

        /** 전표(미리보기) 데이타 가져오기 */
        try {
          const response = await authApi.get('/wms/asn/print/detail', { params });
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
      }
    }, 300), // 300ms debounce time
    [isPreView],
  );

  /** 프린트 버튼 클릭 이벤트 */
  const handlePrintBtnClick = () => {
    // 미리보기 off 또는 선택된 ID 없을 경우는 작동 안됨
    if (!isPreView) return;
    if (!selectedDetail) {
      toastError('프린트할 항목을 먼저 선택해주세요.');
      return;
    }
    setIsPrinting(true);
  };

  /** 상세보기 (셀 더블클릭 이벤트) */
  const onRowDoubleClicked = async (params: RowDoubleClickedEvent) => {
    if (params.data) {
      setDtlParam({
        logisId: filters.logisId ? filters.logisId : Number(session.data?.user.workLogisId),
        partnerId: params.data.partnerId,
        factoryId: params.data.factoryId,
        asnType: params.data.asnTypeCd,
        workYmd: params.data.asnWorkYmd,
      });
      // console.log('params>>', params.data);
      openModal('ASN_DETAIL');
    } else {
      toastError('상세 정보가 누락되어 다시 선택해주세요.');
    }
  };

  /** 상세보기 (셀 엔터 이벤트) */
  const onCellKeyDown = (event: CellKeyDownEvent | FullWidthCellKeyDownEvent) => {
    const keyBoardEvent = event.event as KeyboardEvent;
    if (keyBoardEvent.key === 'Enter') {
      if (gridRef.current && gridRef.current.api.getSelectedNodes().length == 0) {
        // 선택 없이 특정 행 위에서 엔터키를 사용한 경우
        event.node.setSelected(true);
      }

      const selectedData = gridRef.current?.api.getSelectedNodes()[0].data;

      setDtlParam({
        logisId: filters.logisId ? filters.logisId : Number(session.data?.user.workLogisId),
        partnerId: selectedData.partnerId,
        factoryId: selectedData.factoryId,
        asnType: selectedData.asnTypeCd,
        workYmd: selectedData.asnWorkYmd,
      });

      openModal('ASN_DETAIL');
    }
  };

  /** 상세보기 (상세보기 버튼 이벤트) */
  const onClickDetail = async () => {
    const gridApi = gridRef.current?.api;

    const selectedNodes = gridApi?.getSelectedNodes();
    if (selectedNodes && selectedNodes?.length > 0) {
      const selectedData = selectedNodes[0].data;

      setDtlParam({
        logisId: filters.logisId ? filters.logisId : Number(session.data?.user.workLogisId),
        partnerId: selectedData.partnerId,
        factoryId: selectedData.factoryId,
        asnType: selectedData.asnTypeCd,
        workYmd: selectedData.asnWorkYmd,
      });

      openModal('ASN_DETAIL');
    } else {
      toastError('상세보기할 항목을 선택해주세요.');
    }
  };

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={search} />
      <Search className="type_2">
        {/* 예솔수정으로 주석처리
        <TunedReactSelector
          title={'고객사'}
          name={'partnerId'}
          onChange={handleChangePartner}
          options={partnerOption}
          placeholder="고객사 선택" />
          */}
        <TunedReactSelector
          title={'고객사'}
          name={'partnerId'}
          onChange={handleChangePartner}
          options={partnerOption}
          placeholder="고객사 선택"
          values={filters.partnerId} //예솔수정
        />
        <Search.Input
          title={'생산처'}
          name={'compNm'}
          placeholder={'생산처명 입력'}
          value={filters.compNm}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.Input
          title={'상품'}
          name={'prodNm'}
          placeholder={'상품명 입력'}
          value={filters.prodNm || ''}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.DropDown
          title={'발주 구분'}
          name={'asnType'}
          defaultOptions={[
            { label: '발주', value: '1' },
            { label: '수선발주', value: '9' },
          ]}
          value={filters.asnType}
          onChange={async (e, value) => {
            onChangeFilters(e, value);
            await new Promise((resolve) => setTimeout(resolve, 0));
            await search();
          }}
        />
      </Search>

      <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
        {/* 대시보드 영역 */}
        <div className="tableDashboard">
          <div className="itemBox">
            <dl>
              <dt>총 고객사</dt>
              <dd>{asnStatData?.totalPartnerCnt}</dd>
            </dl>
            <dl>
              <dt>총 발주</dt>
              <dd>
                {Utils.setComma(Number(asnStatData?.totalGenCnt))}
                <span>장</span>
              </dd>
            </dl>
            <dl>
              <dt>{asnStatData?.maxAsnPartnerNm}</dt>
              <dd className="progress">
                <div className="number">
                  {Utils.setComma(Number(asnStatData?.maxGenCnt))}
                  <span>장</span>
                </div>
                <div className="progress">
                  <Progress
                    percent={Number(((Number(asnStatData?.maxGenCnt) / Number(asnStatData?.totalGenCnt)) * 100).toFixed(1))}
                    percentPosition={{ align: 'center', type: 'inner' }}
                  />
                </div>
              </dd>
            </dl>
          </div>
        </div>
        {/* 테이블 영역 */}
        <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
          {/* 테이블 헤더 - 총 건수 및 페이징 정보 표시 */}
          <TableHeader
            count={paging.totalRowCount || 0}
            paging={paging}
            setPaging={setPaging}
            search={search} // 페이지 변경 시 검색 실행
            isPaging={true}
          >
            <CustomShortcutButton
              className={`btn ${isPreView ? 'on' : ''}`}
              title="미리보기"
              onClick={() => setIsPreView(!isPreView)}
              shortcut={COMMON_SHORTCUTS.alt1}
            >
              미리보기
            </CustomShortcutButton>
            <CustomShortcutButton className="btn icoPrint" title="프린트" onClick={handlePrintBtnClick} shortcut={COMMON_SHORTCUTS.print}>
              프린트
            </CustomShortcutButton>
          </TableHeader>

          <div className="gridBox">
            <div className="tblPreview">
              <TunedGrid<AsnResponsePaging>
                ref={gridRef}
                headerHeight={35}
                onGridReady={onGridReady}
                loading={isListLoading}
                rowData={rowData}
                rowSelection={'single'}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                paginationPageSize={paging.pageRowCount}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                suppressRowClickSelection={false}
                onSelectionChanged={handleSelectionChanged}
                onFirstDataRendered={onRowDataUpdated}
                onRowDataUpdated={onRowDataUpdated}
                pinnedBottomRowData={pinnedBottomRowData}
                onRowDoubleClicked={onRowDoubleClicked}
                onCellKeyDown={onCellKeyDown}
                className={'check wmsDashboard'}
              />
              <div className={'btnArea'}>
                <CustomShortcutButton className={'btn'} onClick={onClickDetail} title="상세보기" shortcut={{ alt: true, key: '2' }}>
                  상세보기
                </CustomShortcutButton>
              </div>
              <Pagination
                pageObject={paging}
                setPaging={setPaging} // 페이지 변경 핸들러
              />
            </div>
            <div>
              {isPreView ? (
                <div className="previewBox">
                  {selectedDetail ? (
                    <PrintWmsLayout selectedDetail={selectedDetail} isPrinting={isPrinting} setIsPrinting={setIsPrinting} />
                  ) : (
                    <div className="noRowsOverlayBox">입고내역을 선택하면 상세 정보가 표시됩니다.</div>
                  )}
                </div>
              ) : (
                ''
              )}
            </div>
          </div>
        </div>
      </div>
      {modalType.type === 'ASN_DETAIL' && modalType.active && dtlParam && <AsnDtlPop dtlParam={dtlParam} />}
    </div>
  );
};

export default Asn;
