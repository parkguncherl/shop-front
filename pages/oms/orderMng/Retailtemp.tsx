/**
 * @file pages/oms/orderMng/Retail.tsx
 * @description OMS > 관리 > 소매처
 * @copyright 2024
 */

import React, { useEffect, useRef, useState } from 'react';
import { Search, Table, Title, toastSuccess } from '../../../components';
import { Pagination, TableHeader, toastError } from '../../../components';
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
import { RetailAcctSetPop } from '../../../components/popup/orderMng/retail/retailAcctSetPop';
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

/** 소매처 - 판매처관리 페이지 */
const RetailMng = () => {
  const router = useRouter();
  const { onGridReady } = useAgGridApi();
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
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

  // 라디오 버튼 선택 상태를 관리하는 state
  const [selectedOption, setSelectedOption] = useState('기본');

  const [checkedReceivable, setCheckedReceivable] = useState(true);

  /**
   * 0: 기본상태, 1: 최하단 도달, 2: 최상단 도달
   * 본 상태를 사용함으로서 이벤트 동기화 및 초기 랜더링 시 하단 스크롤 영역으로의 이동이 가능해짐
   * */
  const [scrollStatus, setScrollStatus] = useState<'0' | '1' | '2'>('0');

  const [filters, onChangeFilters, onFiltersReset] = useFilters<RetailRequestPagingFilter>({
    sellerId: 0,
    searchKeyWord: '',
    searchType: '기본',
    sleepYn: 'N',
    receivable: 'Y',
  });

  /** 판매처관리 페이징 목록 조회 */
  const {
    data: retails,
    isLoading,
    isSuccess,
    refetch: retailsRefetch,
  } = useQuery(['/retail/paging', paging.curPage, filters.searchType, filters.receivable, filters.sleepYn, filters.sellerId], (): any =>
    authApi.get('/retail/paging', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      },
    }),
  );

  useEffect(() => {
    if (router.asPath.split('?').length == 2) {
      onChangeFilters('sellerId', isNaN(Number(router.asPath.split('?')[1])) ? 0 : Number(router.asPath.split('?')[1]));
    } else {
      onChangeFilters('sellerId', 0);
    }
  }, [router.asPath]);

  // CustomHeader 컴포넌트 내부자체 처리
  const CustomHeader = (props: any) => {
    const onSortRequested = () => {
      const currentSort = props.column.getSort();
      const nextSort = currentSort === 'asc' ? 'desc' : currentSort === 'desc' ? null : 'asc';
      props.setSort(nextSort, false);
      props.api.refreshHeader();
    };

    const onFilterIconClick = () => {
      props.api.showColumnFilter(props.column.getColId());
    };

    const handleCategoryClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.target instanceof HTMLButtonElement && e.target.classList.contains('category-setting-btn')) {
        openModal('CATEGORYSETTING');
      }
    };

    return (
      <>
        <div className={`customHeader ${props.column.getSort() === 'asc' ? 'on' : ''}`}>
          <span onClick={() => onSortRequested()}>
            {props.displayName}
            {props.column.getSort() !== undefined && props.column.getSort() !== null ? (
              <span className="ag-sort-indicator-icon ag-sort-ascending-icon">
                <span className={`ag-icon ag-icon-${props.column.getSort()}`}></span>
              </span>
            ) : (
              ''
            )}
          </span>
          <button className="category-setting-btn" onClick={handleCategoryClick}>
            +
          </button>
        </div>
        <span className="ag-icon ag-icon-filter" onClick={onFilterIconClick}></span>
      </>
    );
  };

  /** 판매처관리 필드별 설정 */
  // 정산현황
  const settlementRetailCols: ColDef<RetailResponsePaging>[] = [
    {
      field: 'no',
      headerName: 'No',
      maxWidth: 80,
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      // headerCheckboxSelection: true,
      // checkboxSelection: true,
    },
    {
      field: 'compNm',
      headerName: '사업자명',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'sellerNm',
      headerName: '소매처명',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'gubun1s',
      headerName: '구분1',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      filter: 'agSetColumnFilter',
      sortable: true,
      headerComponent: CustomHeader,
    },
    {
      field: 'gubun2s',
      headerName: '구분2',
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
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'sampleCnt',
      headerName: '샘플',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'payEtc',
      headerName: '정산비고',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
  ];
  // 기본정보
  const basicInfoCols: ColDef<RetailResponsePaging>[] = [
    {
      field: 'no',
      headerName: 'No',
      maxWidth: 80,
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      // headerCheckboxSelection: true,
      // checkboxSelection: true,
    },
    {
      field: 'compNm',
      headerName: '사업자명',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'sellerNm',
      headerName: '소매처명',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'gubun1s',
      headerName: '구분1',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
      filter: 'agSetColumnFilter',
    },
    {
      field: 'gubun2s',
      headerName: '구분2',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
      filter: 'agSetColumnFilter',
    },
    {
      field: 'regYmd',
      headerName: '등록일자',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
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
      field: 'ceoNm',
      headerName: '대표자',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'ceoTelNo',
      headerName: '대표자연락처',
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
      headerName: '담당자연락처',
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
      field: 'snsId',
      headerName: 'SNS',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.LEFT,
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

  // 선택된 옵션에 따라 컬럼을 동적으로 설정
  const [columnDefs, setColumnDefs] = useState<ColDef[]>(settlementRetailCols);

  useEffect(() => {
    switch (selectedOption) {
      case '정산': // 정산현황
        setColumnDefs(settlementRetailCols);
        break;
      case '기본': // 기본정보
        setColumnDefs(basicInfoCols);
        break;
    }
    retailsRefetch();
  }, [selectedOption]);

  const [sleepTitle, setSleepTitle] = useState('정상');
  // 휴면상태에 따라 휴면상태컬럼 동적으로 설정
  useEffect(() => {
    const resetColumnDefs: ColDef<RetailResponsePaging>[] = columnDefs.filter((col: ColDef<RetailResponsePaging>) => col.field !== 'sleepYn');

    // 휴면 또는 전체일때
    if (filters.sleepYn === 'Y' || !filters.sleepYn) {
      const sleepCol = {
        field: 'sleepYn',
        headerName: '휴면상태',
        maxWidth: 80,
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        cellRenderer: 'agCheckboxCellRenderer',
        suppressHeaderMenuButton: true,
        valueGetter: (params: any) => params.data?.sleepYn === 'Y',
      };
      setColumnDefs([...resetColumnDefs, sleepCol]);
      setSleepTitle(filters.sleepYn === 'Y' ? '정상' : '정상/휴면');
    } else {
      setColumnDefs(resetColumnDefs);
      setSleepTitle('휴면');
    }
  }, [filters.sleepYn]);

  /** 검색 */
  const onSearch = async () => {
    setPaging({
      ...paging,
      curPage: 1,
    });
    await retailsRefetch();
  };

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    await onFiltersReset();
    await onSearch();
  };

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };

  useEffect(() => {
    if (isSuccess) {
      const { resultCode, body, resultMessage } = retails.data;
      if (resultCode === 200 && body) {
        setPaging(body.paging);
        if (scrollStatus == '2' && paging.pageRowCount) {
          /** 스크롤을 통해 이전 페이지로 이동하는 경우 하단 영역부터 랜더링*/
          retailGrid.current?.api.ensureIndexVisible(paging.pageRowCount - 1, 'bottom');
        }
      } else {
        toastError(resultMessage || '데이터 조회 중 오류가 발생했습니다.');
      }
    }
  }, [retails, isSuccess, setPaging]);

  /** 판매처 상세조회 */
  const fetchRetailDetail = async (retailId: number) => {
    try {
      const response = await getRetailDetail(retailId);
      console.log('판매처 상세조회 >>', response.data?.body);
      setRetail(response.data.body as RetailResponseDetail);
      openModal('MOD');
    } catch (error) {
      console.error('상세 정보를 가져오는 중 오류 발생:', error);
    }
  };

  const handleModBtn = () => {
    if (retailGrid.current && retailGrid.current.api.getSelectedNodes().length == 0) {
      toastError('수정할 소매처를 선택해주세요.');
      return;
    }
    if (retailGrid.current && retailGrid.current.api.getSelectedNodes().length > 1) {
      toastError('소매처 수정은 하나만 선택 가능합니다.');
      return;
    }
    fetchRetailDetail(retailGrid.current?.api.getSelectedNodes()[0].data.id);
  };

  useEffect(() => {
    if (scrollStatus == '1') {
      setPaging({ ...paging, curPage: (paging.curPage || 1) + 1 });
      setScrollStatus('0');
    } else if (scrollStatus == '2') {
      setPaging({ ...paging, curPage: (paging.curPage || 1) - 1 });
      setScrollStatus('0');
    }
  }, [scrollStatus]);
  // RetailMng의 onWheelAtGridWrapper를 아래와 같이 수정
  const onWheelAtGridWrapper = (event: any) => {
    if (retailGrid.current) {
      const gridInfo = retailGrid.current.api.getVerticalPixelRange();
      const rowCount = retailGrid.current.api.getDisplayedRowCount() || 0;
      const lastRowNode = retailGrid.current.api.getDisplayedRowAtIndex(rowCount - 1);

      // 페이지 마지막 행 번호가 전체 행 수보다 작을 때만 스크롤 페이징 처리
      if (lastRowNode?.rowIndex && paging.totalRowCount && lastRowNode.rowIndex + 1 < paging.totalRowCount) {
        if (event.deltaY > 70) {
          if (lastRowNode) {
            const lastRowBottom = (lastRowNode.rowTop || 0) + (lastRowNode.rowHeight || 0);
            if ((gridInfo?.bottom || 0) >= lastRowBottom) {
              if (paging.curPage && !isLoading) {
                if (paging.curPage < paging.totalRowCount) {
                  setPaging({ ...paging, curPage: paging.curPage + 1 });
                  retailsRefetch();
                }
              }
            }
          }
        } else if (event.deltaY < -80) {
          if (gridInfo?.top === 0) {
            setTimeout(() => {
              if (paging.curPage && paging.curPage > 1 && !isLoading) {
                setPaging({ ...paging, curPage: paging.curPage - 1 });
                retailsRefetch();
              }
            }, 200);
          }
        }
      }
    }
  };

  const [selectedSeller, setSelectedSeller] = useState({ sellerNm: '', id: 0 });
  const handleDeleteBtn = () => {
    if (retailGrid.current && retailGrid.current.api.getSelectedNodes().length == 0) {
      toastError('삭제할 소매처를 선택해주세요.');
      return;
    }
    if (retailGrid.current && retailGrid.current.api.getSelectedNodes().length > 1) {
      toastError('소매처 삭제는 하나만 선택 가능합니다.');
      return;
    }

    setSelectedSeller(retailGrid.current?.api.getSelectedNodes()[0].data);
    openModal('DELETE');
  };

  const handleRetailDelConfirm = async () => {
    // 삭제전 거래기록 확인
    try {
      const response = await getRetailTransInfo(selectedSeller.id);

      if (response.data.resultCode === 200) {
        // console.log('소매처 거래기록 응답 ', response.data.body);
        if (Number(response.data.body) > 0) {
          toastError('거래 정보가 있어 삭제가 불가능합니다!');
          return;
        }

        deleteRetail(selectedSeller.id).then((result) => {
          const { resultCode, resultMessage } = result.data;
          if (resultCode === 200) {
            closeModal('DELETE');
            toastSuccess('삭제되었습니다');
            retailsRefetch();
          } else {
            toastError(resultMessage);
          }
        });
      } else {
        toastError('거래 정보 조회 중 오류가 발생했습니다.');
      }
    } catch {
      toastError('거래 정보 조회 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteRecommand = () => {
    openModal('DELETE_RECOMMAND');
  };

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
          retailsRefetch();
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
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={retailsRefetch} />
      <Search className="type_2">
        <Search.Radio
          title={'검색조건'}
          name={'searchType'}
          options={[
            { label: '정산현황', value: '정산' },
            { label: '기본정보', value: '기본' },
          ]}
          value={selectedOption}
          onChange={(name, value: any) => {
            setSelectedOption(value); // 선택된 값을 상태로 업데이트
            onChangeFilters('searchType', value);
          }}
        />
        <Search.Input
          title={'검색'}
          name={'searchKeyWord'}
          placeholder={Placeholder.Default}
          value={filters.searchKeyWord || ''}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />
        <Search.Radio
          title={' '}
          name={'sleepYn'}
          options={[
            { label: '정상', value: 'N' },
            { label: '휴면', value: 'Y' },
            { label: '전체', value: '' },
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
                setCheckedReceivable(e.target.checked);
                if (e.target.checked) {
                  setPaging({
                    curPage: 1,
                    pageRowCount: 500,
                  });
                } else {
                  setPaging({
                    curPage: 1,
                    pageRowCount: 50,
                  });
                }

                onChangeFilters('receivable', e.target.checked ? 'Y' : 'N');
              }}
              disabled={filters.searchType !== '정산'}
            ></Checkbox>
          </dd>
        </dl>
      </Search>
      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}>
          <button className="btn" title="소매처 삭제 추천" onClick={() => handleDeleteRecommand()}>
            삭제 추천
          </button>
          <button className="btn" title={sleepTitle} onClick={() => openModal('UPDATE_SLEEP_STATUS')}>
            {sleepTitle}
          </button>
        </TableHeader>
        <div className={'ag-theme-alpine'} onWheel={onWheelAtGridWrapper}>
          <TunedGrid
            onGridReady={onGridReady}
            rowData={(retails?.data?.body?.rows as RetailResponsePaging[]) || []}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            paginationPageSize={paging.pageRowCount}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            onRowDoubleClicked={(e) => {
              fetchRetailDetail(e.data.id);
              e.api.deselectAll();
            }}
            onCellKeyDown={(e) => {
              const keyBoardEvent = e.event as KeyboardEvent;
              //const eventTriggeredRowIndex = event.rowIndex || 0;
              if (keyBoardEvent.key === 'Enter') {
                fetchRetailDetail(e.data.id);
                e.api.deselectAll();
              }
            }}
            ref={retailGrid}
          />
        </div>
        <div className="btnArea right">
          <button className="btn" title="등록" onClick={() => openModal('ADD')}>
            등록
          </button>
          <button className="btn" title="수정" onClick={handleModBtn}>
            수정
          </button>
          {/*<button className="btn" title="소매처 삭제" onClick={() => handleDeleteBtn()}>*/}
          {/*  소매처 삭제*/}
          {/*</button>*/}
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
      {modalType?.type === 'CATEGORYSETTING' && modalType.active && <RetailAcctSetPop />}
      {modalType.type === 'ADD' && modalType.active && <RetailAddPop />}
      {modalType.type === 'MOD' && modalType.active && <RetailModPop />}
      {modalType.type === 'DELETE_RECOMMAND' && modalType.active && <RetailDelPop />}

      <ConfirmModal
        title={`선택된 소매처 '${selectedSeller?.sellerNm}' 를 삭제하시겠습니까?`}
        open={modalType.type === 'DELETE' && modalType.active}
        onConfirm={handleRetailDelConfirm}
        onClose={() => closeModal('DELETE')}
      />

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
