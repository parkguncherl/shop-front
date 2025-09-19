/**
 * @file pages/oms/orderMng/factory.tsx
 * @description OMS > 관리 > 생산처
 * @copyright 2024
 */

import React, { useEffect, useRef, useState } from 'react';
import { Search, Table, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import { Placeholder } from '../../../libs/const';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { Utils } from '../../../libs/utils';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { useFactoryListStore } from '../../../stores/useFactoryListStore';
import { useAgGridApi } from '../../../hooks';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { RowDoubleClickedEvent, ColDef } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { FactoryAddPop } from '../../../components/popup/factory/FactoryAddPop';
import { FactoryModPop } from '../../../components/popup/factory/FactoryModPop';
import { FactoryAcctSetPop } from '../../../components/popup/factory/FactoryAcctSetPop';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { GubunListPop } from '../../../components/popup/factory/GubunListPop';
import TunedGrid from '../../../components/grid/TunedGrid';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import { FactoryResponseDefInfoPaging } from '../../../generated';

/** 주문관리 - 생산처관리 페이지 */
const Factory = () => {
  /** Grid Api */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  /** 예솔수정 하단합계 */
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<FactoryResponseDefInfoPaging[]>([]);

  /** 공장관리 스토어 - State */
  const [paging, setPaging, modalType, openModal, closeModal, selectedFactory, setSelectedFactory, updateFactory, insertFactory] = useFactoryListStore((s) => [
    s.paging,
    s.setPaging,
    s.modalType,
    s.openModal,
    s.closeModal,
    s.selectedFactory,
    s.setSelectedFactory,
    s.updateFactory,
    s.insertFactory,
  ]);

  const gridRef = useRef<AgGridReact>(null);

  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters({
    compNm: '',
    displayedType: '2',
    sleepYn: 'N',
    searchKeyWord: '',
  });

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
  /** 공장관리 필드별 설정 */ //FactoryResponseSettStatPaging
  const [columnDefs] = useState<ColDef<FactoryResponseDefInfoPaging>[]>([
    {
      field: 'no',
      headerName: 'No.',
      maxWidth: 50,
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      // headerCheckboxSelection: true,
      // checkboxSelection: true,
    },
    { field: 'compNm', headerName: '생산처', minWidth: 100, maxWidth: 100, cellStyle: GridSetting.CellStyle.LEFT, suppressHeaderMenuButton: true },
    {
      field: 'gubun1',
      headerName: Utils.getGubun('factory1', '구분1'),
      minWidth: 80,
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      filter: 'agSetColumnFilter',
      // headerComponent: CustomHeader,
    },
    {
      field: 'gubun2',
      headerName: Utils.getGubun('factory2', '구분2'),
      minWidth: 80,
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      filter: 'agSetColumnFilter',
    },
    { field: 'busiNm', headerName: '사업자명', minWidth: 100, maxWidth: 100, cellStyle: GridSetting.CellStyle.LEFT, suppressHeaderMenuButton: true },
    { field: 'ceoNm', headerName: '대표자', minWidth: 80, maxWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'ceoTelNo',
      headerName: '대표자연락처',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: ({ value }) => Utils.getPhoneNumFormat(value),
    },
    { field: 'personNm', headerName: '담당자', minWidth: 80, maxWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'personTelNo',
      headerName: '담당자연락처',
      minWidth: 120,
      maxWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: ({ value }) => Utils.getPhoneNumFormat(value),
    },
    {
      field: 'nowAmt',
      headerName: '현잔액',
      minWidth: 100,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      suppressHeaderMenuButton: true,
    },

    {
      field: 'recentPayYmd',
      headerName: '최근결제일',
      minWidth: 120,
      maxWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    { field: 'compAddr', headerName: '주소', minWidth: 120, maxWidth: 120, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'compNo',
      headerName: '사업자번호',
      minWidth: 120,
      maxWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: ({ value }) => Utils.getBizNoFormat(value),
    },
    {
      field: 'remPrnYn',
      headerName: '잔액인쇄',
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'compEmail',
      headerName: '이메일',
      minWidth: 120,
      maxWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'regYmd',
      headerName: '등록일자',
      minWidth: 100,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    { field: 'etcScrCntn', headerName: '비고', minWidth: 160, maxWidth: 160, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ]);

  /** 검색 */
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    factoryRefetch();
  };

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    await onFiltersReset();
    await onSearch();
  };

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    if (Utils.isEmptyValues(filters)) {
      toastError('검색조건을 1개 이상 입력하세요.');
      return;
    }
    await onSearch();
  };

  useEffect(() => {
    return () => {
      setPaging({
        curPage: 1,
        totalRowCount: 0,
      });
    };
  }, []);

  /** 기본정보 조회 */
  const {
    data: loadFactory,
    isLoading: isFactoryLoading,
    isSuccess: isFactorySuccess,
    refetch: factoryRefetch,
  } = useQuery(
    ['/factory/defInfo/paging', paging.curPage, filters.sleepYn, filters.compNm, filters.searchKeyWord],
    () =>
      authApi.get('/factory/defInfo/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
    {},
  );

  /** 더블클릭 시 수정 모달 오픈 */
  const onRowDoubleClicked = async (params: RowDoubleClickedEvent) => {
    setSelectedFactory(params.data); // 선택된 데이터 저장
    openModal('MOD');
  };

  /** 수정 버튼 클릭 이벤트 핸들러 */
  const handleModBtn = () => {
    // 선택된 row가 없는 경우 체크
    if (gridRef.current && gridRef.current.api.getSelectedNodes().length == 0) {
      toastError('수정할 생산처를 선택해주세요.');
      return;
    }

    // 선택된 데이터 저장 후 수정 모달 오픈
    const selectedNodes = gridRef.current?.api.getSelectedNodes();
    if (selectedNodes && selectedNodes.length === 1) {
      setSelectedFactory(selectedNodes[0].data);
      openModal('MOD');
    }
  };

  useEffect(() => {
    if (isFactorySuccess) {
      const { resultCode, body, resultMessage } = loadFactory.data;
      if (resultCode === 200 && body) {
        /*console.log('리턴값=====>', body); */
        setPaging(body.paging);
        if (body.rows && body.rows.length > 0) {
          const { nowAmount } = body.rows.reduce(
            (
              acc: {
                nowAmount: number;
              },
              data: FactoryResponseDefInfoPaging,
            ) => {
              return {
                nowAmount: acc.nowAmount + (data.nowAmt ? data.nowAmt : 0),
              };
            },
            { nowAmount: 0 },
          );

          setPinnedBottomRowData([
            {
              nowAmt: nowAmount,
            },
          ]);
        }
      } else {
        toastError(resultMessage || '데이터 조회 중 오류가 발생했습니다.');
      }
    }
  }, [loadFactory, isFactorySuccess, setPaging]);

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={search} />
      <Search className="type_2">
        <Search.Input
          title={'생산처'}
          name={'compNm'}
          placeholder={Placeholder.Default}
          value={filters.compNm}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
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
        <Search.DropDown
          title={'휴면여부'}
          name={'sleepYn'}
          value={filters.sleepYn}
          onChange={(e, value) => {
            setPaging({ ...paging, curPage: 1 });
            onChangeFilters(e, value);
          }}
          defaultOptions={[
            { label: '정상', value: 'N' },
            { label: '휴면', value: 'Y' },
            { label: '전체', value: '' },
          ]}
        />
      </Search>
      <Table>
        <TableHeader
          count={paging.totalRowCount || 0}
          paging={paging}
          setPaging={setPaging}
          search={search}
          choiceCount={50}
          gridRef={gridRef}
          isPaging={false}
        >
          <div className="btnArea">
            {/*  <button className="btn" onClick={() => openModal('GUBUN_LIST')}>
              구분
            </button>*/}
          </div>
        </TableHeader>
        <TunedGrid<FactoryResponseDefInfoPaging>
          onGridReady={onGridReady}
          loading={isFactoryLoading}
          rowData={loadFactory?.data?.body?.rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          paginationPageSize={paging.pageRowCount}
          rowSelection={'single'}
          onRowClicked={(e) => {
            console.log(e.data);
          }}
          ref={gridRef}
          onRowDoubleClicked={onRowDoubleClicked}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          className={'default'}
          pinnedBottomRowData={pinnedBottomRowData} // 예솔수정 하단합계 추가
        />
        <div className="btnArea">
          <CustomShortcutButton
            shortcut={COMMON_SHORTCUTS.gridUnder1}
            className="btn"
            title="생산처 등록"
            onClick={() => {
              console.log(modalType);
              openModal('ADD');
            }}
          >
            생산처 등록
          </CustomShortcutButton>
          <CustomShortcutButton shortcut={COMMON_SHORTCUTS.gridUnder2} className="btn" title="수정하기" onClick={handleModBtn}>
            수정하기
          </CustomShortcutButton>
          <CustomShortcutButton
            className="btn"
            title="휴면처리"
            shortcut={COMMON_SHORTCUTS.alt1}
            onClick={() => {
              const selectedNodes = gridRef.current?.api.getSelectedNodes();
              if (selectedNodes && selectedNodes.length == 1) {
                openModal('SLEEP');
              } else {
                toastError('하나의 생산처를 선택하십시요.');
              }
            }}
          >
            {filters.sleepYn == 'N' ? '휴면처리' : '휴면해제'}
          </CustomShortcutButton>
          {/*<button*/}
          {/*  className="btn"*/}
          {/*  title="복사"*/}
          {/*  onClick={() => {*/}
          {/*    const selectedNodes = gridRef.current?.api.getSelectedNodes();*/}
          {/*    if (selectedNodes && selectedNodes.length == 1) {*/}
          {/*      openModal('COPY');*/}
          {/*    } else {*/}
          {/*      toastError('하나의 생산처를 선택하십시요.');*/}
          {/*    }*/}
          {/*  }}*/}
          {/*>*/}
          {/*  복사*/}
          {/*</button>*/}
          {/*<button className="btn" title="수정" onClick={() => {}}>*/}
          {/*  수정*/}
          {/*</button>*/}
        </div>
        {modalType.type === 'CATEGORYSETTING' && modalType.active && <FactoryAcctSetPop />}
        {modalType.type === 'ADD' && modalType.active && <FactoryAddPop />}
        {modalType.type === 'GUBUN_LIST' && modalType.active && <GubunListPop />}
        {modalType.type === 'MOD' && modalType.active && <FactoryModPop data={selectedFactory || {}} />}
        {/*!gridFactoryIsFetching && !gridFactoryIsLoading && modalType.type === 'MOD' && modalType.active && <FactoryListModPop data={selectedFactory || {}} />*/}
        <ConfirmModal
          title={filters.sleepYn == 'N' ? '선택된 생산처를 휴면처리 하시겠습니까?' : '선택된 생산처를 휴면해제 하시겠습니까?'}
          open={modalType.type === 'SLEEP' && modalType.active}
          onConfirm={() => {
            const selectedNodes = gridRef.current?.api.getSelectedNodes();
            if (selectedNodes) {
              if (selectedNodes.length == 1) {
                updateFactory({
                  id: selectedNodes[0].data.id,
                  sleepYn: filters.sleepYn == 'N' ? 'Y' : 'N',
                }).then((result) => {
                  const { resultCode, body, resultMessage } = result.data;
                  if (resultCode == 200) {
                    toastSuccess(filters.sleepYn == 'N' ? '휴면처리 되었습니다.' : '휴면 해제되었습니다.');
                    factoryRefetch();
                  } else {
                    toastError(resultMessage);
                  }
                });
              } else {
                console.error('선택된 노드가 하나 이상!!');
              }
            }
          }}
          onClose={() => {
            closeModal('SLEEP');
          }}
        />
        <ConfirmModal
          title={'선택된 생산처를 복사 하시겠습니까?'}
          open={modalType.type === 'COPY' && modalType.active}
          onConfirm={() => {
            const selectedNodes = gridRef.current?.api.getSelectedNodes();
            if (selectedNodes) {
              if (selectedNodes.length == 1) {
                const selectedFactory = selectedNodes[0].data;
                insertFactory({
                  ...selectedFactory,
                  compNo: undefined,
                  compNm: selectedFactory.compNm != undefined ? selectedFactory.compNm + '_복사' : '',
                }).then((result) => {
                  const { resultCode, body, resultMessage } = result.data;
                  if (resultCode == 200) {
                    toastSuccess('생산처가 복사되었습니다.');
                    factoryRefetch();
                  } else {
                    toastError(resultMessage);
                  }
                });
              } else {
                console.error('선택된 노드가 하나 이상!!');
              }
            }
          }}
          onClose={() => {
            closeModal('COPY');
          }}
        />
      </Table>
    </div>
  );
};

export default Factory;
