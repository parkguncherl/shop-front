import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { Search, Table, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { CellEditingStoppedEvent, ColDef } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import 'dayjs/locale/ko';
import TunedGrid from '../../../components/grid/TunedGrid';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import {
  OrderDetCreate,
  ProductResponseTranDataList,
  SkuResponsePaging,
  StoreInvenRequestUpdateInvenByStoreInven,
  StoreInvenResponseInvestigatedInven,
  StoreInvenResponseInvestigationHist,
  StoreResponseReqPaging,
} from '../../../generated';
import { SkuSearchPop } from '../../../components/popup/common/SkuSearchPop';
import { ChangeConfirmPop } from '../../../components/popup/orderTran/StoreInven/ChangeConfirmPop';
import { useStoreInvenStore } from '../../../stores/useStoreInvenStore';
import { selectRowIndexBeforeFilterAndSort } from '../../../customFn/selectRowIndexBeforeFilterAndSortFn';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import { ProductStatus } from '../../../libs/const';
import { useOrderStore } from '../../../stores/useOrderStore';

/** 매장재고조사 */
const StoreInven = () => {
  const nowPage = 'oms_storeInven'; // filter 저장 2025-01-21
  const session = useSession();
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  /** Grid Api */
  const { onGridReady } = useAgGridApi();

  const gridRef = useRef<AgGridReact>(null);
  const subGridRef = useRef<AgGridReact>(null);

  /** 공통 스토어 - State */
  const [menuNm, removeEmptyRows, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.menuNm,
    s.removeEmptyRows,
    s.filterDataList, // filter 저장 2025-01-21
    s.setFilterDataList, // filter 저장 2025-01-21
    s.getFilterData, // filter 저장 2025-01-21
  ]);

  const [updateInvenByStoreInven] = useStoreInvenStore((s) => [s.updateInvenByStoreInven]);
  const [setOrderDetList] = useOrderStore((s) => [s.setOrderDetList]);
  /** 필터 */
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters(
    getFilterData(filterDataList, nowPage) || {
      // filter 저장 2025-01-21
      isChecked: false,
      startDate: dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'), // 1개월전 1일자로 조회한다.
      endDate: today,
      skuNm: '',
    },
  );

  /** 예솔수정 하단합계 두종류 */
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<StoreInvenResponseInvestigatedInven[]>([]);
  const [subpinnedBottomRowData, setsubPinnedBottomRowData] = useState<StoreInvenResponseInvestigationHist[]>([]);

  const [investigatedInvenList, setInvestigatedInvenList] = useState<StoreInvenResponseInvestigatedInven[]>([{}]); // 조사
  const [invenHistoryList, setInvenHistoryList] = useState<StoreInvenResponseInvestigationHist[]>([]); // 이력

  const [openSkuSearchPop, setOpenSkuSearchPop] = useState({
    open: false,
    skuNm: undefined,
  });

  const [openChangeConfirmPop, setOpenChangeConfirmPop] = useState(false);

  /** 매장재고조사 - 조사 */
  const [investigatedInvenColumnDefs] = useState<ColDef<StoreInvenResponseInvestigatedInven>[]>([
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      filter: false,
      sortable: false,
      maxWidth: 30,
      minWidth: 40,
      suppressHeaderMenuButton: true,
      hide: true,
    },
    { field: 'no', headerName: 'No.', minWidth: 50, maxWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'season', headerName: '시즌', minWidth: 70, maxWidth: 70, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    {
      field: 'skuNm',
      headerName: '상품명',
      minWidth: 200,
      maxWidth: 200,
      suppressHeaderMenuButton: true,
      editable: (params) => {
        /**
         * 엔터와 같은 특정 키보드 이벤트 발생 시 작동
         * 특정 row, column 교차 지점에서만 셀 수정이 가능토록 함
         * 이 경우는 no 값 부재 시(추가를 위해 비어있는 행) 수정이 가능토록 함
         * */
        return params.node.data?.no == undefined;
      },
      cellStyle: GridSetting.CellStyle.LEFT,
    },
    { field: 'skuColor', headerName: '칼라', minWidth: 60, maxWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'skuSize', headerName: '사이즈', minWidth: 60, maxWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'skuCntBef', headerName: '조사 전', minWidth: 60, maxWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    {
      field: 'skuCntAft',
      headerName: '조사 후',
      minWidth: 60,
      maxWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      editable: (params) => {
        return params.node.data?.no != undefined;
      },
    },
  ]);

  /** 매장재고조사 - 이력 */
  const [invenHistoryColumnDefs] = useState<ColDef<StoreInvenResponseInvestigationHist>[]>([
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      filter: false,
      sortable: false,
      maxWidth: 30,
      minWidth: 40,
      suppressHeaderMenuButton: true,
      hide: true,
    },
    { field: 'no', headerName: 'No.', minWidth: 50, maxWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'tranTm',
      headerName: '조사 일시',
      minWidth: 150,
      maxWidth: 150,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        return params.value ? dayjs(params.value).format('YY-MM-DD (ddd) HH:mm:ss') : '';
      },
    },
    { field: 'season', headerName: '시즌', minWidth: 70, maxWidth: 70, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    {
      field: 'skuNm',
      headerName: '상품명',
      minWidth: 200,
      maxWidth: 200,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
    },
    { field: 'skuColor', headerName: '칼라', minWidth: 60, maxWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'skuSize', headerName: '사이즈', minWidth: 60, maxWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'skuCnt', headerName: '조사 전', minWidth: 60, maxWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    {
      field: 'realCnt',
      headerName: '조사 후',
      minWidth: 60,
      maxWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    { field: 'userNm', headerName: '사용자', minWidth: 100, maxWidth: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'etcCntn', headerName: '비고', minWidth: 200, maxWidth: 200, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.LEFT },
  ]);

  /** 매장재고조사 - 조사 */
  const {
    data: investigatedInven,
    isLoading: investigatedInvenIsLoading,
    isSuccess: investigatedInvenIsSuccess,
    refetch: investigatedInvenRefetch,
  } = useQuery(['/orderTran/storeInven/investigatedInven'], (): any =>
    authApi.get('/orderTran/storeInven/investigatedInven', {
      params: {
        ...filters,
      },
    }),
  );

  useEffect(() => {
    if (investigatedInvenIsSuccess) {
      const { resultCode, body, resultMessage } = investigatedInven.data;
      if (resultCode === 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
        setInvestigatedInvenList([...body, {}]);

        /** 예솔수정 재고조사 하단합계 */
        if (body && body.length > 0) {
          const { skuCountBefore, skuCountAfter } = body.reduce(
            (
              acc: {
                skuCountBefore: number;
                skuCountAfter: number;
              },
              data: StoreInvenResponseInvestigatedInven,
            ) => {
              return {
                skuCountBefore: acc.skuCountBefore + (data.skuCntBef ? data.skuCntBef : 0),
                skuCountAfter: acc.skuCountAfter + (data.skuCntAft ? data.skuCntAft : 0),
              };
            },
            {
              skuCountBefore: 0,
              skuCountAfter: 0,
            },
          );

          setPinnedBottomRowData([
            {
              skuCntBef: skuCountBefore,
              skuCntAft: skuCountAfter,
            },
          ]);
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [investigatedInven, investigatedInvenIsSuccess]);

  /** 매장재고조사 - 이력 */
  const {
    data: invenHistory,
    isLoading: invenHistoryIsLoading,
    isSuccess: invenHistoryIsSuccess,
    refetch: invenHistoryRefetch,
  } = useQuery(
    ['/orderTran/storeInven/invenHistory', filters.startDate, filters.endDate],
    (): any =>
      authApi.get('/orderTran/storeInven/invenHistory', {
        params: {
          ...filters,
        },
      }),
    {
      enabled: filters.isChecked,
    },
  );

  useEffect(() => {
    if (invenHistoryIsSuccess) {
      const { resultCode, body, resultMessage } = invenHistory.data;
      if (resultCode === 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
        setInvenHistoryList(body || []);

        /** 예솔수정 재고이력 하단합계 */
        if (body && body.length > 0) {
          const { skuCount, realCount } = body.reduce(
            (
              acc: {
                skuCount: number;
                realCount: number;
              },
              data: StoreInvenResponseInvestigationHist,
            ) => {
              return {
                skuCount: acc.skuCount + (data.skuCnt ? data.skuCnt : 0),
                realCount: acc.realCount + (data.realCnt ? data.realCnt : 0),
              };
            },
            {
              skuCount: 0,
              realCount: 0,
            },
          );

          setsubPinnedBottomRowData([
            {
              skuCnt: skuCount,
              realCnt: realCount,
            },
          ]);
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [invenHistory, invenHistoryIsSuccess]);

  const handleSwitchChange = (checked: boolean) => {
    onChangeFilters('isChecked', checked);
  };

  /** 검색 */
  const onSearch = useCallback(
    async (isChecked: boolean) => {
      console.log(isChecked);
      if (!isChecked) {
        // 조사
        await investigatedInvenRefetch();
      } else {
        // 이력
        await invenHistoryRefetch();
      }
    },
    [invenHistoryRefetch, investigatedInvenRefetch],
  );

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    onChangeFilters('startDate', dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'));
    onChangeFilters('endDate', today);
    onChangeFilters('skuNm', '');
    await onSearch(filters.isChecked);
  };

  /** 그리드 셀 편집 종료 이벤트 콜백 */
  const onCellEditingStoppedOnUnchecked = (cellEditingStoppedEvent: CellEditingStoppedEvent<StoreInvenResponseInvestigatedInven>) => {
    const editedCellColId = cellEditingStoppedEvent.api.getFocusedCell()?.column.getColId(); // 편집이 일어난 셀의 컬럼 id
    if (editedCellColId == 'skuNm') {
      if (!openSkuSearchPop.open) {
        setOpenSkuSearchPop({ skuNm: cellEditingStoppedEvent.value, open: true });
        cellEditingStoppedEvent.api.stopEditing(true);
        cellEditingStoppedEvent.node.setDataValue('skuNm', null);
      }
    } else if (editedCellColId == 'skuCntAft') {
      const rowIndexBeforeFilterAndSort = selectRowIndexBeforeFilterAndSort(cellEditingStoppedEvent.data, investigatedInvenList, editedCellColId);

      if (rowIndexBeforeFilterAndSort != null) {
        if (investigatedInvenList[rowIndexBeforeFilterAndSort].skuCntBef == 0) {
          // 스큐 팝업을 통하여 추가된 행
          if (investigatedInvenList[rowIndexBeforeFilterAndSort].skuCntAft == 0) {
            // 추가된 행에서 skuCntAft 에 0을 입력할 경우 무의미한 행(데이터)으로 간주하고 삭제한다.
            setInvestigatedInvenList((prevInvenList) => {
              return prevInvenList.filter((value, index) => {
                return rowIndexBeforeFilterAndSort != index;
              });
            });
          }
        } else {
          if (investigatedInvenList[rowIndexBeforeFilterAndSort].skuCntBef == Number(cellEditingStoppedEvent.value)) {
            toastError('변경하고자 하는 수량이 기존 수량과 같을 시 입력값을 반영하지 않습니다.');
            cellEditingStoppedEvent.node.setDataValue('skuCntAft', null);
          } else {
            setInvestigatedInvenList((prevInvenList) => {
              const newState: StoreInvenResponseInvestigatedInven[] = [...prevInvenList];
              newState[rowIndexBeforeFilterAndSort].skuCntAft = cellEditingStoppedEvent.value != '' ? Number(cellEditingStoppedEvent.value) : undefined;
              return newState;
            });
            if (cellEditingStoppedEvent.value == null) {
              cellEditingStoppedEvent.node.setDataValue('skuCntAft', null);
            }
          }
        }
      }
    }
  };

  const onSkuSelected = (count: number, list: SkuResponsePaging[]) => {
    const newState = removeEmptyRows(investigatedInvenList, 'no');
    for (let i = 0; i < list.length; i++) {
      newState[newState.length] = {
        no: newState.length + 1,
        season: list[i].season,
        skuId: list[i].skuId,
        skuNm: list[i].skuNm,
        skuColor: list[i].skuColor,
        skuSize: list[i].skuSize,
        skuCntBef: 0, // skuCntBef 가 0 인지 확인함으로서 추가된 행을 구분할 수 있다(skuCntAft 0으로 설정 후 반영할 시 재고 데이터가 전부 삭제되므로 본 영역에서 조회되지 않는다 -> SkuSearchPop 에서 selected 된 경우만 skuCntBef 가 0)
        skuCntAft: count,
      };
    }
    newState[newState.length] = {};
    setInvestigatedInvenList(newState);
  };

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch(filters.isChecked);
  };

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} search={search} reset={reset} />
      <Search className="type_2">
        <Search.Switch
          title={'상태'}
          name={'temp'}
          value={filters.isChecked}
          disabled={false}
          onChange={(e: string, value: boolean) => {
            handleSwitchChange(value);
          }}
          checkedLabel={'이력'}
          uncheckedLabel={'조사'}
          filters={filters}
        />
        {filters.isChecked ? (
          <>
            <Search.Input
              title={'상품명'}
              name={'skuNm'}
              placeholder={'상품명을 입력하세요.'}
              value={filters.skuNm}
              onEnter={search}
              onChange={onChangeFilters}
              filters={filters}
            />
            <CustomNewDatePicker
              title={'기간'}
              type={'range'}
              defaultType={'type'}
              startName={'startDate'}
              endName={'endDate'}
              onChange={onChangeFilters}
              onEnter={search}
              value={[filters.startDate, filters.endDate]}
            />
          </>
        ) : (
          <></>
        )}
      </Search>
      {!filters.isChecked ? (
        <Table>
          <TableHeader count={removeEmptyRows(investigatedInvenList).length} search={search} gridRef={gridRef}>
            <button
              className="btn"
              title="변경"
              onClick={() => {
                if (
                  investigatedInvenList.filter((value) => value.skuCntAft !== undefined && value.skuCntAft !== null && value.skuCntBef !== value.skuCntAft)
                    .length !== 0
                ) {
                  setOpenChangeConfirmPop(true);
                } else {
                  toastError('수량 변경을 행할 행을 찾을 수 없습니다.');
                }
              }}
            >
              변경
            </button>
          </TableHeader>
          <div className="gridBox">
            <div className="tblPreview">
              <TunedGrid<StoreInvenResponseInvestigatedInven>
                ref={gridRef}
                colIndexForSuppressKeyEvent={3}
                onGridReady={onGridReady}
                rowData={investigatedInvenList} // 깊은 복사를 사용하여 rowData 상태가 철저히 프로그램적으로 의도된 값을 가지도록 하기
                columnDefs={investigatedInvenColumnDefs}
                defaultColDef={defaultColDef}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                onCellEditingStopped={onCellEditingStoppedOnUnchecked}
                className={'default check'}
                pinnedBottomRowData={pinnedBottomRowData} // 예솔수정 재고조사 하단합계
              />
              <div className="btnArea">
                <CustomShortcutButton
                  className="btn"
                  title="주문창에 붙여넎기"
                  onClick={() => {
                    gridRef.current?.api.stopEditing(false);
                    const filteredData: ProductResponseTranDataList[] = [];
                    const productStateCd = ProductStatus.sell; // 따로 셑팅된게 없으면 판매로 셑팅
                    let currentNo = 1; // no를 1부터 시작
                    const nodes = gridRef.current?.api.getSelectedNodes();
                    if (nodes && nodes.length > 0) {
                      nodes.forEach((node) => {
                        const skuCnt = node.data.skuCntBef; // 조사전 건수로 한다.
                        if (skuCnt != null && Number(skuCnt) > 0) {
                          filteredData.push({
                            ...node.data,
                            no: currentNo++, // no를 설정하고 증가
                            skuId: node.data.skuId,
                            orderDetCd: productStateCd,
                            baseAmt: node.data.sellAmt,
                            totAmt: node.data.sellAmt,
                            skuCnt: node.data.skuCntBef,
                          });
                          node.data.skuCnt = 0;
                        }
                      });
                      if (filteredData.length > 0) {
                        setOrderDetList(filteredData as OrderDetCreate[]);
                      } else {
                        toastError('주문건수가 입력된 건이 존재하지 않습니다.');
                      }
                    } else {
                      toastError('선택된건이 없습니다.');
                    }
                  }}
                  shortcut={COMMON_SHORTCUTS.gridUnder1}
                >
                  주문창에 붙여넎기
                </CustomShortcutButton>
              </div>
            </div>
          </div>
        </Table>
      ) : (
        <Table>
          <TableHeader count={removeEmptyRows(invenHistoryList).length} search={search} gridRef={gridRef}></TableHeader>
          <div className="gridBox">
            <div className="tblPreview">
              <TunedGrid<StoreInvenResponseInvestigatedInven>
                ref={subGridRef}
                colIndexForSuppressKeyEvent={3}
                onGridReady={onGridReady}
                rowData={JSON.parse(JSON.stringify(invenHistoryList))} // 깊은 복사를 사용하여 rowData 상태가 철저히 프로그램적으로 의도된 값을 가지도록 하기
                columnDefs={invenHistoryColumnDefs}
                defaultColDef={defaultColDef}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                suppressRowClickSelection={false}
                className={'default'}
                pinnedBottomRowData={subpinnedBottomRowData} // 예솔수정 재고이력 하단합계
              />
            </div>
          </div>
        </Table>
      )}
      {openSkuSearchPop.open && (
        <SkuSearchPop
          filter={{
            skuNm: openSkuSearchPop.skuNm,
          }}
          //skuNm={openSkuSearchPop.skuNm}
          active={openSkuSearchPop.open}
          onClose={() => {
            setOpenSkuSearchPop({ skuNm: undefined, open: false });
          }}
          onSelected={onSkuSelected}
        />
      )}
      {openChangeConfirmPop && (
        <ChangeConfirmPop
          active={openChangeConfirmPop}
          onConfirm={(fields) => {
            const requestArgument: StoreInvenRequestUpdateInvenByStoreInven[] = investigatedInvenList
              .filter((value) => value.skuCntAft !== undefined && value.skuCntAft !== null && value.skuCntBef !== value.skuCntAft)
              // skuCntAft 가 존재하며, skuCntBef 와 수량이 같지 않아야 한다.
              .map((value) => {
                return {
                  skuId: value.skuId,
                  skuCnt: value.skuCntBef || 0, // 신규인 경우 skuCntBef 가 부재한다
                  realCnt: value.skuCntAft,
                  newYn: !value.skuCntBef ? 'Y' : 'N', // 신규인 경우 skuCntBef 가 부재한다
                  etcCntn: fields.etcCntn,
                };
              });
            updateInvenByStoreInven(requestArgument).then((result) => {
              const { resultCode, resultMessage } = result.data;
              if (resultCode == 200) {
                toastSuccess('변경되었습니다.');
                investigatedInvenRefetch();
              } else {
                toastError('정보 변경 도중 문제가 발생하였습니다.');
                console.error(resultMessage);
              }
            });
          }}
          onClose={() => {
            setOpenChangeConfirmPop(false);
          }}
        />
      )}
    </div>
  );
};

export default StoreInven;
