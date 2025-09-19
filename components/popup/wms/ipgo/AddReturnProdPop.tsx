import React, { useCallback, useMemo, useRef, useState } from 'react';
import { CellKeyDownEvent, CellPosition, ColDef, FullWidthCellKeyDownEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { PopupSearchBox, PopupSearchType } from '../../content';
import { PopupContent } from '../../PopupContent';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { toastError, toastSuccess } from '../../../ToastMessage';
import useFilters from '../../../../hooks/useFilters';
import { useAgGridApi } from '../../../../hooks';
import { PopupLayout } from '../../PopupLayout';
import { PopupFooter } from '../../PopupFooter';
import { Search } from '../../../content';
import { AsnUnit, SkuResponsePaging } from '../../../../generated';
import { useAsnStore } from '../../../../stores/wms/useAsnStore';
import { SkuSearchPop } from '../../common/SkuSearchPop';
import { useCommonStore } from '../../../../stores';
import { AG_CHARTS_LOCALE_KO_KR } from 'ag-charts-locale';
import { useQueryClient } from '@tanstack/react-query';

interface AddReturnProdPopProps {
  active?: boolean; // 모달 활성화 여부
  onClose?: () => void;
  partnerId?: number;
  creTm?: string;
  workYmd?: string;
}
interface AddReturnProd {
  no?: number;
  prodId?: number;
  prodNm?: string;
  skuId?: number;
  color?: string;
  size?: string;
  partnerInventoryAmt?: number;
  returnCnt?: number;
}

/**
 *  입하정보 > 발주구분 > 입하처리 팝업 > 반납상품 추가 팝업
 */
export const AddReturnProdPop = ({ active = false, onClose, partnerId = 0, creTm }: AddReturnProdPopProps) => {
  const { onGridReady } = useAgGridApi();
  const queryClient = useQueryClient();
  /** Component 참조 */
  const RefForGrid = useRef<AgGridReact>(null);

  /** 전역 상태 */
  const [createMarketAsn] = useAsnStore((s) => [s.createMarketAsn]);
  const [removeEmptyRows] = useCommonStore((s) => [s.removeEmptyRows]);

  /** 지역 state */
  const [addedReturnProdCandidateList, setAddedReturnProdCandidateList] = useState<AddReturnProd[]>([]);
  const [skuSearchPopEnabled, setSkuSearchPopEnabled] = useState(false);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<AddReturnProd[]>([{}]); // 합계데이터 만들기

  /** 검색 조건 타이핑 시 onChangeFilter 호출, filter 상태 변경 */
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    prodNm: '',
    factoryNm: '',
  });

  /** 컬럼 정의 */
  const OtherInStockAddPopColDef = useMemo<ColDef<AddReturnProd>[]>(
    () => [
      {
        headerCheckboxSelection: false,
        headerName: '선택',
        checkboxSelection: true,
        filter: false,
        sortable: false,
        cellClass: 'stringType',
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        hide: true,
      },
      {
        field: 'no',
        headerName: 'No.',
        maxWidth: 40,
        minWidth: 40,
        sortable: false,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodNm',
        headerName: '상품',
        maxWidth: 250,
        minWidth: 250,
        sortable: false,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'color',
        headerName: '색상',
        maxWidth: 100,
        minWidth: 100,
        sortable: false,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'size',
        headerName: '사이즈',
        maxWidth: 100,
        minWidth: 100,
        sortable: false,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'partnerInventoryAmt',
        headerName: '매장재고',
        maxWidth: 100,
        minWidth: 100,
        sortable: false,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'returnCnt',
        headerName: '반납수량',
        maxWidth: 100,
        minWidth: 100,
        sortable: false,
        cellStyle: GridSetting.CellStyle.CENTER,
        onCellClicked: (event) => {
          event.api.startEditingCell({
            rowIndex: event.rowIndex as number,
            colKey: 'returnCnt',
          });
        },
        editable: (params) => {
          return !!params.node.data?.prodId;
        },
        suppressHeaderMenuButton: true,
      },
    ],
    [],
  );

  /**
   * 검색 버튼 클릭 핸들러
   */
  const onSearch = async (enterKeyEvent?: React.KeyboardEvent<HTMLInputElement>) => {
    // todo 추가하기
  };

  const closeHandler = useCallback(() => {
    if (onClose) {
      onFiltersReset();
      setAddedReturnProdCandidateList([]);
      setPinnedBottomRowData([{}]);
      onClose();
    }
  }, [onFiltersReset, onClose]);

  // 상품명에서 엔터 키 클릭할 시 동작하는 함수
  const enterOnProdNm = (enterKeyEvent: React.KeyboardEvent<HTMLInputElement>) => {
    if (partnerId != 0) {
      setSkuSearchPopEnabled(true);
    } else {
      console.error('partnerId 값을 찾을 수 없음.');
    }
  };

  const onCellKeyDown = (event: CellKeyDownEvent | FullWidthCellKeyDownEvent) => {
    const keyBoardEvent = event.event as KeyboardEvent;
    const eventTriggeredRowIndex = event.rowIndex || 0;
    if (keyBoardEvent.code == 'Space' && event.data.stockCnt == undefined) {
      setTimeout(() => event.node.setSelected(false), 100);
    } else {
      if ((event as CellKeyDownEvent).column.getColId() == 'skuNm') {
        if (keyBoardEvent.key == 'Backspace' || keyBoardEvent.key == 'Delete') {
          setAddedReturnProdCandidateList((prevAddedReturnProdCandidateList) => {
            return prevAddedReturnProdCandidateList.filter((value, index) => {
              return index != eventTriggeredRowIndex;
            });
          });
        }
      } else if ((event as CellKeyDownEvent).column.getColId() == 'returnCnt') {
        if (keyBoardEvent.key == 'ArrowDown') {
          if (
            event.api.getEditingCells()[0] &&
            event.api.getEditingCells()[0].rowIndex == event.rowIndex &&
            event.api.getEditingCells()[0].column.getColId() == 'returnCnt' &&
            event.rowIndex < addedReturnProdCandidateList.length
          ) {
            event.api.startEditingCell({
              rowIndex: event.rowIndex + 1,
              colKey: 'returnCnt',
            });
          }
        } else if (keyBoardEvent.key == 'ArrowUp') {
          if (
            event.api.getEditingCells()[0] &&
            event.api.getEditingCells()[0].rowIndex == event.rowIndex &&
            event.api.getEditingCells()[0].column.getColId() == 'returnCnt' &&
            event.rowIndex > 0
          ) {
            event.api.startEditingCell({
              rowIndex: event.rowIndex - 1,
              colKey: 'returnCnt',
            });
          }
        }
      }
    }
  };

  const onSkuSelected = (count: number, list: SkuResponsePaging[]) => {
    const updatedAddedReturnProdCandidateList = removeEmptyRows(addedReturnProdCandidateList, 'no');
    for (let i = 0; i < list.length; i++) {
      updatedAddedReturnProdCandidateList[updatedAddedReturnProdCandidateList.length] = {
        no: addedReturnProdCandidateList.length + i + 1,
        prodId: list[i].prodId,
        prodNm: list[i].prodNm,
        skuId: list[i].skuId,
        color: list[i].skuColor,
        size: list[i].skuSize,
        partnerInventoryAmt: list[i].partnerInventoryAmt,
      };
    }
    setAddedReturnProdCandidateList([...updatedAddedReturnProdCandidateList]);
  };

  return (
    <PopupLayout
      width={830}
      isEscClose={false}
      open={active}
      title={'반납상품 추가'}
      onClose={closeHandler}
      isSubPopUpOpened={skuSearchPopEnabled}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button
              className="btn btnBlue"
              title="상품 추가"
              onClick={() => {
                // todo 상품 추가 요청 동작
                const asnUnitList: AsnUnit[] = [];
                for (let i = 0; i < addedReturnProdCandidateList.length; i++) {
                  if (!addedReturnProdCandidateList[i].skuId) {
                    console.error('일부 데이터의 skuId 를 찾을 수 없음');
                  } else {
                    if (addedReturnProdCandidateList[i].returnCnt && (addedReturnProdCandidateList[i].returnCnt as number) > 0) {
                      asnUnitList[asnUnitList.length] = {
                        skuId: addedReturnProdCandidateList[i].skuId as number,
                        skuCnt: addedReturnProdCandidateList[i].returnCnt as number,
                      };
                    }
                  }
                }
                if (partnerId == undefined) {
                  toastError('요청에 필요한 화주 정보를 찾을 수 없습니다.');
                  console.error('partnerId 부재');
                } else if (asnUnitList.length == 0) {
                  toastError('입하 처리하고자 하는 상품의 수량을 입력 후 다시 시도하십시요');
                  console.error('asnUnitList 부재');
                } else if (creTm == undefined) {
                  toastError('요청에 필요한 생성일시를 찾을 수 없습니다.');
                  console.error('creTm 부재');
                } else {
                  console.log({
                    partnerId: partnerId,
                    asnUnits: asnUnitList,
                    createDateTime: creTm,
                  });
                  createMarketAsn({
                    partnerId: partnerId,
                    asnUnits: asnUnitList,
                    createDateTime: creTm,
                  }).then(async (result) => {
                    const { resultCode, body, resultMessage } = result.data;
                    if (resultCode == 200) {
                      toastSuccess('매장분 반납이 정상 처리되었습니다.');
                      await queryClient.invalidateQueries(['/instock/return/detail']);
                      closeHandler();
                    } else {
                      console.error(resultMessage);
                      toastError(resultMessage || '반납을 위한 입하처리 도중 문제가 발생하였습니다.');
                    }
                  });
                }
              }}
            >
              상품 추가
            </button>
            <button className="btn" title="닫기" onClick={closeHandler}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          <PopupSearchType className={'type_2'}>
            <Search.Input
              title={'상품'}
              name={'prodNm'}
              placeholder={'상품명 입력'}
              value={filters.prodNm}
              onEnter={enterOnProdNm}
              onChange={onChangeFilters}
              filters={filters}
            />
          </PopupSearchType>
        </PopupSearchBox>
        <div className="mt10">
          <div className={'ag-theme-alpine default check'}>
            <AgGridReact
              onGridReady={onGridReady}
              gridOptions={{ rowHeight: 28, localeText: AG_CHARTS_LOCALE_KO_KR }}
              headerHeight={35}
              columnDefs={OtherInStockAddPopColDef}
              rowData={addedReturnProdCandidateList}
              defaultColDef={defaultColDef}
              onCellKeyDown={onCellKeyDown}
              onCellEditingStopped={(event) => {
                if (event.column.getColId() == 'returnCnt') {
                  if (event.newValue) {
                    if (!isNaN(event.newValue)) {
                      if (event.newValue >= 0) {
                        const updatedAddedReturnProdCandidateList = addedReturnProdCandidateList;
                        let returnCntTotal = 0;
                        for (let i = 0; i < updatedAddedReturnProdCandidateList.length; i++) {
                          if (i == event.rowIndex) {
                            if ((updatedAddedReturnProdCandidateList[i].partnerInventoryAmt || 0) < event.newValue) {
                              toastError('반납수량은 매장재고보다 클 수 없습니다.');
                              event.node.setDataValue('returnCnt', event.oldValue);
                              return;
                            } else {
                              updatedAddedReturnProdCandidateList[i].returnCnt = event.newValue;
                              returnCntTotal += Number(event.newValue);
                            }
                          } else {
                            if (updatedAddedReturnProdCandidateList[i].returnCnt) {
                              returnCntTotal += Number(updatedAddedReturnProdCandidateList[i].returnCnt as number);
                            }
                          }
                        }
                        setAddedReturnProdCandidateList(updatedAddedReturnProdCandidateList);
                        setPinnedBottomRowData([
                          {
                            returnCnt: returnCntTotal,
                          },
                        ]);
                        event.node.setSelected(true);
                      } else {
                        toastError('0 이상의 숫자를 입력하십시요.');
                        event.node.setDataValue('returnCnt', undefined);
                      }
                    } else {
                      toastError('숫자 이외의 값은 입력할 수 없습니다.');
                      event.node.setDataValue('returnCnt', undefined);
                    }
                  }
                }
              }}
              pinnedBottomRowData={pinnedBottomRowData}
              /*onCellEditingStopped={(e) => {
                if (e.column.getColId() == 'prodNm' && e.rowIndex != null) {
                  if (filters.partnerId != 0) {
                    setSkuSearchPopEnabled(true);
                    setTypedKeyWord(e.newValue.toString());
                  } else {
                    e.node.setDataValue('prodNm', '');
                    toastError('고객사 선택 후 다시 시도하십시요.');
                  }
                }
              }}*/
              ref={RefForGrid}
              rowSelection={'multiple'}
              suppressRowClickSelection={true}
              suppressRowDeselection={true}
              className={'default check'}
            />
          </div>
        </div>
      </PopupContent>
      <SkuSearchPop
        active={skuSearchPopEnabled}
        onClose={() => {
          setSkuSearchPopEnabled(false);
        }}
        filter={{
          skuNm: filters.prodNm, // 스큐명에 대응되는 국소적 이름을 지니므로 사용 가능
          partnerId: partnerId,
        }}
        disableCount={true}
        //skuNm={typedKeyWord}
        onSelected={onSkuSelected}
      />
    </PopupLayout>
  );
};
