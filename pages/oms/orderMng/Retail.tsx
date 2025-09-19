/**
 * @file pages/oms/orderMng/Retail.tsx
 * @description OMS > 관리 > 소매처 (조건부 그리드)
 * @copyright 2024
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Table, Title, toastSuccess } from '../../../components';
import { TableHeader, toastError } from '../../../components';
import { useRetailStore } from '../../../stores/useRetailStore';
import { RetailResponseDetail, RetailRequestPagingFilter, RetailResponsePaging } from '../../../generated';
import { ColDef } from 'ag-grid-community';
import { useQuery } from '@tanstack/react-query';
import { useAgGridApi } from '../../../hooks';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import useFilters from '../../../hooks/useFilters';
import { authApi } from '../../../libs';
import { Placeholder } from '../../../libs/const';
import { RetailAddPop } from '../../../components/popup/orderMng/retail/RetailAddPop';
import { RetailModPop } from '../../../components/popup/orderMng/retail/RetailModPop';
import { useCommonStore } from '../../../stores';
import { AgGridReact } from 'ag-grid-react';
import { useRouter } from 'next/router';
import { Utils } from '../../../libs/utils';
import { ConfirmModal } from '../../../components/ConfirmModal';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { Checkbox } from 'antd';
import { RetailDelPop } from '../../../components/popup/orderMng/retail/RetailDelPop';
import TunedGrid from '../../../components/grid/TunedGrid';
import { useSession } from 'next-auth/react';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';

const RetailMng = () => {
  const nowPage = 'oms_retail'; // filter 저장 2025-01-21
  const router = useRouter();
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList, // filter 저장 2025-01-21
    s.setFilterDataList, // filter 저장 2025-01-21
    s.getFilterData, // filter 저장 2025-01-21
  ]);

  // Store 상태 및 함수들
  const [paging, setPaging, retail, setRetail, deleteRetail, updateRetailSleepStatus, modalType, openModal, closeModal, getRetailDetail, getRetailTransInfo] =
    useRetailStore((s) => [
      s.paging,
      s.setPaging,
      s.retail,
      s.setRetail,
      s.deleteRetail,
      s.updateRetailSleepStatus,
      s.modalType,
      s.openModal,
      s.closeModal,
      s.getRetailDetail,
      s.getRetailTransInfo,
    ]);

  const retailGrid = useRef<AgGridReact>(null);

  // 상태 관리
  const [checkedReceivable, setCheckedReceivable] = useState(true);
  const [scrollStatus, setScrollStatus] = useState<'0' | '1' | '2'>('0');
  const [sleepTitle, setSleepTitle] = useState('정상');
  const [selectedSeller, setSelectedSeller] = useState({ sellerNm: '', id: 0 });

  /**
   * 필터 상태 관리
   * @description 검색 조건 및 필터링을 위한 상태 관리
   */
  const [filters, onChangeFilters] = useFilters<RetailRequestPagingFilter>(
    getFilterData(filterDataList, nowPage) || {
      // filter 저장 2025-01-21
      sellerId: 0,
      searchKeyWord: '',
      searchType: '정산', // 예솔체크
      sleepYn: 'N',
      receivable: 'Y',
      isSettlementView: true, // 예솔체크
    },
  );

  useEffect(() => {
    setCheckedReceivable(filters.receivable === 'Y');
  }, [filters]);

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    onChangeFilters('sellerId', 0);
    onChangeFilters('searchKeyWord', '');
    onChangeFilters('sleepYn', 'N');
    onChangeFilters('receivable', 'Y');
    onChangeFilters('searchType', '정산현황');
    onChangeFilters('isSettlementView', true);
    setCheckedReceivable(true);

    setTimeout(() => {
      refetchSettlement();
    }, 100);
  };

  /**
   * 정산현황 데이터 조회 API
   * @description 정산현황 조회 시 사용되는 API
   */
  const {
    data: settlementData,
    isLoading: isSettlementLoading,
    isSuccess: isSettlementSuccess,
    refetch: refetchSettlement,
  } = useQuery({
    queryKey: ['/retail/paging', paging.curPage, 'settlement', filters],
    queryFn: () =>
      authApi.get('/retail/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          searchType: '정산',
          ...filters,
        },
      }),
    enabled: filters.isSettlementView,
  });

  /**
   * 기본정보 데이터 조회 API
   * @description 기본정보 조회 시 사용되는 API
   */
  const {
    data: basicData,
    isLoading: isBasicLoading,
    isSuccess: isBasicSuccess,
    refetch: refetchBasic,
  } = useQuery({
    queryKey: ['/retail/paging', paging.curPage, 'basic', filters],
    queryFn: () =>
      authApi.get('/retail/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          searchType: '기본',
          ...filters,
        },
      }),
    enabled: !filters.isSettlementView,
  });

  // 데이터 로딩 상태
  const isLoading = isSettlementLoading || isBasicLoading;

  /** 판매처관리 필드별 설정 */
  const settlementRetailCols: ColDef<RetailResponsePaging>[] = [
    {
      field: 'no',
      headerName: 'No.',
      maxWidth: 80,
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      // headerCheckboxSelection: true,
      // checkboxSelection: true,
    },
    {
      field: 'sellerNm',
      headerName: '소매처',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'compNm',
      headerName: '사업자명',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'gubun1',
      headerName: session.data?.user.seller1 || '구분1',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      filter: 'agSetColumnFilter',
      // sortable: true,
      // headerComponent: CustomHeader,
    },
    {
      field: 'gubun2',
      headerName: session.data?.user.seller2 || '구분2',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      filter: 'agSetColumnFilter',
    },
    {
      field: 'nowAmt',
      headerName: '현잔액',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'resentPayYmd',
      headerName: '최근결제일',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'sailYmd',
      headerName: '최근판매일',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'sailAmt',
      headerName: '최근판매액',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'resentTranYmd',
      headerName: '최근입금일',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'resentAmt',
      headerName: '최근입금액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'misongCnt',
      headerName: '미송',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      hide: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'sampleCnt',
      headerName: '샘플',
      minWidth: 80,
      hide: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'payEtc',
      headerName: '비고',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
  ];

  const basicInfoCols: ColDef<RetailResponsePaging>[] = [
    {
      field: 'no',
      headerName: 'No.',
      maxWidth: 80,
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      // headerCheckboxSelection: true,
      // checkboxSelection: true,
    },
    {
      field: 'sellerNm',
      headerName: '소매처',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'compNm',
      headerName: '사업자명',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'gubun1',
      headerName: Utils.getGubun('seller1', '구분1'),
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
      filter: 'agSetColumnFilter',
      // headerComponent: CustomHeader,
    },
    {
      field: 'gubun2',
      headerName: Utils.getGubun('seller2', '구분2'),
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
      filter: 'agSetColumnFilter',
    },
    {
      field: 'ceoNm',
      headerName: '대표자',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'ceoTelNo',
      headerName: '대표자(연락처)',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: ({ value }) => Utils.getPhoneNumFormat(value),
    },
    {
      field: 'personNm',
      headerName: '담당자',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'personTelNo',
      headerName: '담당자(연락처)',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: ({ value }) => Utils.getPhoneNumFormat(value),
    },
    {
      field: 'sellerAddr',
      headerName: '주소',
      minWidth: 150,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'compNo',
      headerName: '사업자번호',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: ({ value }) => Utils.getBizNoFormat(value),
    },
    {
      field: 'compEmail',
      headerName: '이메일',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'snsId',
      headerName: 'SNS',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
      hide: true,
    },
    {
      field: 'compPrnCd',
      headerName: '혼용률인쇄',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (params) => {
        if (params.data?.compPrnCd === 'A') {
          return '신규거래상품만 인쇄';
        }
        if (params.data?.compPrnCd === 'B') {
          return '샘플전표만 인쇄';
        }
        if (params.data?.compPrnCd === 'C') {
          return '인쇄안함';
        }
      },
    },
    {
      field: 'remainYn',
      headerName: '잔액인쇄',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: 'agCheckboxCellRenderer',
      valueGetter: (params) => params.data?.remainYn === 'Y',
    },
    {
      field: 'vatYn',
      headerName: '부가세',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: 'agCheckboxCellRenderer',
      valueGetter: (params) => params.data?.vatYn === 'Y',
    },
    {
      field: 'regYmd',
      headerName: '등록일자',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'etcScrCntn',
      headerName: '비고(화면)',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
  ];

  // Switch 컴포넌트 onChange 핸들러
  const handleSwitchChange = (e: any, value: boolean) => {
    console.log('벨류 ==>', value);
    onChangeFilters('isSettlementView', !value);
    onChangeFilters('searchType', value ? '기본' : '정산');
  };

  // URL 파라미터 처리
  useEffect(() => {
    if (router.asPath.split('?').length == 2) {
      onChangeFilters('sellerId', isNaN(Number(router.asPath.split('?')[1])) ? 0 : Number(router.asPath.split('?')[1]));
    } else {
      onChangeFilters('sellerId', 0);
    }
  }, [router.asPath]);

  // 데이터 조회 결과 처리
  useEffect(() => {
    const currentData = filters.isSettlementView ? settlementData : basicData;
    const isCurrentSuccess = filters.isSettlementView ? isSettlementSuccess : isBasicSuccess;

    if (isCurrentSuccess && currentData) {
      const { resultCode, body, resultMessage } = currentData.data;
      if (resultCode === 200 && body) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
        setPaging(body.paging);
        if (scrollStatus == '2' && paging.pageRowCount) {
          retailGrid.current?.api.ensureIndexVisible(paging.pageRowCount - 1, 'bottom');
        }
      } else {
        toastError(resultMessage || '데이터 조회 중 오류가 발생했습니다.');
      }
    }
  }, [settlementData, basicData, isSettlementSuccess, isBasicSuccess]);

  useEffect(() => {
    filters.isSettlementView ? refetchSettlement() : refetchBasic();
  }, [filters.isSettlementView]);
  /**
   * 스크롤 이벤트 핸들러
   * @description 무한 스크롤 구현을 위한 이벤트 처리
   */
  const onWheelAtGridWrapper = useCallback(
    (event: any) => {
      if (!retailGrid.current) return;

      const gridInfo = retailGrid.current.api.getVerticalPixelRange();
      const rowCount = retailGrid.current.api.getDisplayedRowCount() || 0;
      const lastRowNode = retailGrid.current.api.getDisplayedRowAtIndex(rowCount - 1);

      // 페이지 마지막 행 번호가 전체 행 수보다 작을 때만 스크롤 페이징 처리
      if (lastRowNode?.rowIndex && paging.totalRowCount && lastRowNode.rowIndex + 1 < paging.totalRowCount) {
        if (event.deltaY > 70) {
          if (lastRowNode) {
            const lastRowBottom = (lastRowNode.rowTop || 0) + (lastRowNode.rowHeight || 0);
            if ((gridInfo?.bottom || 0) >= lastRowBottom) {
              if (paging.curPage && !isLoading && paging.curPage < paging.totalRowCount) {
                setPaging({ ...paging, curPage: paging.curPage + 1 });
                filters.isSettlementView ? refetchSettlement() : refetchBasic();
              }
            }
          }
        } else if (event.deltaY < -80) {
          if (gridInfo?.top === 0) {
            setTimeout(() => {
              if (paging.curPage && paging.curPage > 1 && !isLoading) {
                setPaging({ ...paging, curPage: paging.curPage - 1 });
                filters.isSettlementView ? refetchSettlement() : refetchBasic();
              }
            }, 200);
          }
        }
      }
    },
    [paging, isLoading],
  );

  // 소매처 수정
  const handleModBtn = () => {
    if (retailGrid.current && retailGrid.current.api.getSelectedNodes().length == 0) {
      toastError('수정할 소매처를 선택해주세요.');
      return;
    }
    if (retailGrid.current && retailGrid.current.api.getSelectedNodes().length > 1) {
      toastError('소매처 수정은 하나만 선택 가능합니다.');
      return;
    }

    const selectedId = retailGrid.current?.api.getSelectedNodes()[0].data.id;
    if (selectedId !== undefined) {
      getRetailDetail(selectedId).then((response) => {
        if (response.data.resultCode === 200 && response.data.body) {
          setRetail(response.data.body as RetailResponseDetail);
          openModal('MOD');
        } else {
          toastError(response.data.resultMessage || '상세 정보를 불러오는 데 실패했습니다.');
        }
      });
    }
  };

  // 삭제하기
  const handleRetailDelConfirm = async () => {
    try {
      const response = await getRetailTransInfo(selectedSeller.id);
      if (response.data.resultCode === 200) {
        if (Number(response.data.body) > 0) {
          toastError('거래 정보가 있어 삭제가 불가능합니다!');
          return;
        }
        const result = await deleteRetail(selectedSeller.id);
        if (result.data.resultCode === 200) {
          closeModal('DELETE');
          toastSuccess('삭제되었습니다');
          filters.isSettlementView ? refetchSettlement() : refetchBasic();
        } else {
          toastError(result.data.resultMessage);
        }
      }
    } catch {
      toastError('거래 정보 조회 중 오류가 발생했습니다.');
    }
  };

  // 휴면여부
  const handleSleepStatusChange = () => {
    if (retailGrid.current && retailGrid.current.api.getSelectedNodes().length != 0) {
      const idList = [];
      for (let i = 0; i < retailGrid.current.api.getSelectedNodes().length; i++) {
        idList[idList.length] = retailGrid.current.api.getSelectedNodes()[i].data.id;
      }

      updateRetailSleepStatus({ listOfId: idList }).then((result) => {
        const { resultCode, resultMessage } = result.data;
        if (resultCode === 200) {
          closeModal('UPDATE_SLEEP_STATUS');
          toastSuccess('휴면상태가 변경되었습니다.');
          filters.isSettlementView ? refetchSettlement() : refetchBasic();
        } else {
          toastError(resultMessage);
        }
      });
    } else {
      toastError('휴면상태를 변경할 소매처를 선택하십시요');
    }
  };
  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={filters.isSettlementView ? refetchSettlement : refetchBasic} />

      {/* 검색 영역 */}
      <Search className="type_2">
        <Search.Switch
          title={'검색조건'}
          name={'searchType'}
          checkedLabel={'기본정보'}
          uncheckedLabel={'정산현황'}
          onChange={handleSwitchChange}
          value={filters.searchType === '기본'}
          filters={filters}
        />
        <Search.Input
          title={'검색'}
          name={'searchKeyWord'}
          placeholder={Placeholder.Default}
          value={filters.searchKeyWord || ''}
          onChange={onChangeFilters}
          onEnter={() => (filters.isSettlementView ? refetchSettlement() : refetchBasic())}
          filters={filters}
        />
        <Search.DropDown
          title={'휴면여부'}
          name={'sleepYn'}
          defaultOptions={[
            { key: '1', label: '정상', value: 'N' },
            { key: '2', label: '휴면', value: 'Y' },
          ]}
          value={filters.sleepYn}
          onChange={(e, value) => {
            setPaging({ ...paging, curPage: 1 });
            onChangeFilters(e, value);
          }}
        />
        <dl>
          <dt>
            <label>미수금</label>
          </dt>
          <dd>
            <Checkbox
              name={'receivable'}
              checked={checkedReceivable}
              onChange={(e) => {
                onChangeFilters('receivable', e.target.checked ? 'Y' : 'N');
                setPaging({
                  curPage: 1,
                  // pageRowCount: e.target.checked ? 500 : 50,
                  pageRowCount: 999999,
                });
              }}
            />
          </dd>
        </dl>
      </Search>

      {/* 그리드 영역 */}
      <Table>
        <TableHeader
          count={paging.totalRowCount || 0}
          paging={paging}
          setPaging={setPaging}
          search={filters.isSettlementView ? refetchSettlement : refetchBasic}
          isPaging={false}
        ></TableHeader>

        {/* 정산현황 그리드 */}
        {filters.isSettlementView && (
          <TunedGrid
            ref={retailGrid}
            onGridReady={onGridReady}
            rowData={(settlementData?.data?.body?.rows as RetailResponsePaging[]) || []}
            columnDefs={settlementRetailCols}
            defaultColDef={defaultColDef}
            // components={{ customHeaderComponent: CustomHeader }}
            paginationPageSize={paging.pageRowCount}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            onRowDoubleClicked={(e) => {
              if (e.data?.id !== undefined) {
                getRetailDetail(e.data.id).then((response) => {
                  if (response.data.resultCode === 200 && response.data.body) {
                    setRetail(response.data.body as RetailResponseDetail);
                    openModal('MOD');
                  } else {
                    toastError(response.data.resultMessage || '상세 정보를 불러오는 데 실패했습니다.');
                  }
                });
              }
            }}
            onWheel={onWheelAtGridWrapper}
            onCellKeyDown={(e) => {
              const keyBoardEvent = e.event as KeyboardEvent;
              if (e.data?.id !== undefined) {
                getRetailDetail(e.data.id).then((response) => {
                  if (response.data.resultCode === 200 && response.data.body) {
                    setRetail(response.data.body as RetailResponseDetail);
                    openModal('MOD');
                  } else {
                    toastError(response.data.resultMessage || '상세 정보를 불러오는 데 실패했습니다.');
                  }
                });
              }
            }}
            className={'default'}
          />
        )}

        {/* 기본정보 그리드 */}
        {!filters.isSettlementView && (
          <TunedGrid
            ref={retailGrid}
            onGridReady={onGridReady}
            rowData={(basicData?.data?.body?.rows as RetailResponsePaging[]) || []}
            columnDefs={basicInfoCols}
            defaultColDef={defaultColDef}
            // components={{ customHeaderComponent: CustomHeader }}
            paginationPageSize={paging.pageRowCount}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            onRowDoubleClicked={(e) => {
              if (e.data?.id !== undefined) {
                getRetailDetail(e.data.id).then((response) => {
                  if (response.data.resultCode === 200 && response.data.body) {
                    setRetail(response.data.body as RetailResponseDetail);
                    openModal('MOD');
                  } else {
                    toastError(response.data.resultMessage || '상세 정보를 불러오는 데 실패했습니다.');
                  }
                });
              }
            }}
            onCellKeyDown={(e) => {
              const keyBoardEvent = e.event as KeyboardEvent;
              if (e.data?.id !== undefined) {
                getRetailDetail(e.data.id).then((response) => {
                  if (response.data.resultCode === 200 && response.data.body) {
                    setRetail(response.data.body as RetailResponseDetail);
                    openModal('MOD');
                  } else {
                    toastError(response.data.resultMessage || '상세 정보를 불러오는 데 실패했습니다.');
                  }
                });
              }
            }}
            className={'default'}
          />
        )}

        <div className="btnArea">
          <CustomShortcutButton className="btn" title="소매처 등록" onClick={() => openModal('ADD')} shortcut={COMMON_SHORTCUTS.alt1}>
            소매처 등록
          </CustomShortcutButton>
          <CustomShortcutButton className="btn" title="수정하기" onClick={handleModBtn} shortcut={COMMON_SHORTCUTS.alt2}>
            수정하기
          </CustomShortcutButton>
          <CustomShortcutButton className="btn" title={'휴면처리'} onClick={() => openModal('UPDATE_SLEEP_STATUS')} shortcut={COMMON_SHORTCUTS.alt3}>
            휴면처리
          </CustomShortcutButton>
          <CustomShortcutButton className="btn" title="소매처 삭제 추천" onClick={() => openModal('DELETE_RECOMMAND')} shortcut={COMMON_SHORTCUTS.alt4}>
            삭제 추천
          </CustomShortcutButton>
        </div>
        {/*<Pagination pageObject={paging} setPaging={setPaging} />*/}
      </Table>

      {/* 모달 컴포넌트들 */}
      {/*{modalType?.type === 'CATEGORYSETTING' && modalType.active && <RetailAcctSetPop />}*/}
      {modalType.type === 'ADD' && modalType.active && <RetailAddPop />}
      {modalType.type === 'MOD' && modalType.active && <RetailModPop />}
      {modalType.type === 'DELETE_RECOMMAND' && modalType.active && <RetailDelPop />}

      <ConfirmModal
        title={`선택된 소매처 '${selectedSeller?.sellerNm}' 를 삭제하시겠습니까?`}
        open={modalType.type === 'DELETE' && modalType.active}
        onConfirm={handleRetailDelConfirm}
        onClose={() => closeModal('DELETE')}
      />

      {/* 휴면상태 변경 확인 모달 */}
      <ConfirmModal
        title={`선택된 소매처들을 ${sleepTitle} 상태로 변경 하시겠습니까?`}
        open={modalType.type === 'UPDATE_SLEEP_STATUS' && modalType.active}
        onConfirm={handleSleepStatusChange}
        onClose={() => closeModal('UPDATE_SLEEP_STATUS')}
      />
    </div>
  );
};

export default RetailMng;
