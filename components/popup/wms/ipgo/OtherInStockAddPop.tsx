import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CellKeyDownEvent, ColDef, FullWidthCellKeyDownEvent } from 'ag-grid-community';
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
import { TunedReactSelector } from '../../../TunedReactSelector';
import { usePartnerStore } from '../../../../stores/usePartnerStore';
import { AsnUnit, PartnerResponseForSearching, SampleRequestDeleteMoreOnce, SkuResponsePaging } from '../../../../generated';
import { DropDownOption } from '../../../../types/DropDownOptions';
import { useAsnStore } from '../../../../stores/wms/useAsnStore';
import { SkuSearchPop } from '../../common/SkuSearchPop';
import { useCommonStore } from '../../../../stores';
import { AG_CHARTS_LOCALE_KO_KR } from 'ag-charts-locale';
import { useQueryClient } from '@tanstack/react-query';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';
import { ConfirmModal } from '../../../ConfirmModal';
import { useInstockStore } from '../../../../stores/wms/uselnstockStore';

interface OtherInStockAddPopProps {
  active?: boolean; // 모달 활성화 여부
  onClose?: () => void;
}
interface OtherInStockAdd {
  no?: number;
  prodId?: number;
  prodNm?: string;
  skuId?: number;
  color?: string;
  size?: string;
  skuFactoryNm?: string;
  stockCnt?: number;
}

/**
 * 입하정보 > 발주구분 > 입하처리 팝업 > 기타입하 추가 팝업
 */
export const OtherInStockAddPop = ({ active = false, onClose }: OtherInStockAddPopProps) => {
  const { onGridReady } = useAgGridApi();
  const queryClient = useQueryClient();
  /** Component 참조 */
  const RefForGrid = useRef<AgGridReact>(null);
  const [modalType, openModal, closeModal] = useInstockStore((s) => [s.modalType, s.openModal, s.closeModal]);

  /** 전역 상태 */
  const [selectPartnerList] = usePartnerStore((s) => [s.selectPartnerList]);
  const [createEtcAsn] = useAsnStore((s) => [s.createEtcAsn]);
  //const [getSkuFactoryListByFilter] = useSkuFactoryStore((s) => [s.getSkuFactoryListByFilter]);
  const [removeEmptyRows] = useCommonStore((s) => [s.removeEmptyRows]);

  /** 지역 state */
  const [otherInStockCandidateList, setOtherInStockCandidateList] = useState<OtherInStockAdd[]>([]);
  const [partnerOptionList, setPartnerOptionList] = useState<DropDownOption[]>([]);
  const [skuSearchPopEnabled, setSkuSearchPopEnabled] = useState(false);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<OtherInStockAdd[]>([{}]); // 합계데이터 만들기
  //const [typedKeyWord, setTypedKeyWord] = useState('');

  /** 검색 조건 타이핑 시 onChangeFilter 호출, filter 상태 변경 */
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    prodNm: '',
    partnerId: 0,
    factoryNm: '',
  });

  /** 컬럼 정의 */
  const OtherInStockAddPopColDef = useMemo<ColDef<OtherInStockAdd>[]>(
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
        minWidth: 250,
        sortable: false,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'color',
        headerName: '색상',
        minWidth: 100,
        sortable: false,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'size',
        headerName: '사이즈',
        minWidth: 100,
        sortable: false,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuFactoryNm',
        headerName: '생산처',
        minWidth: 100,
        sortable: false,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'stockCnt',
        headerName: '입하수량',
        minWidth: 100,
        sortable: false,
        cellStyle: GridSetting.CellStyle.CENTER,
        onCellClicked: (event) => {
          event.api.startEditingCell({
            rowIndex: event.rowIndex as number,
            colKey: 'stockCnt',
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
      setOtherInStockCandidateList([]);
      setPinnedBottomRowData([{}]);
      onClose();
    }
  }, [onFiltersReset, onClose]);

  // 생산처명에서 엔터 키 클릭할 시 동작하는 함수
  const enterOnFactoryNm = (enterKeyEvent: React.KeyboardEvent<HTMLInputElement>) => {
    if (filters.partnerId != 0) {
      setSkuSearchPopEnabled(true);
    } else {
      toastError('고객사 선택 후 다시 시도하십시요.');
    }
  };

  // 상품명에서 엔터 키 클릭할 시 동작하는 함수
  const enterOnProdNm = (enterKeyEvent: React.KeyboardEvent<HTMLInputElement>) => {
    if (filters.partnerId != 0) {
      setSkuSearchPopEnabled(true);
    } else {
      toastError('고객사 선택 후 다시 시도하십시요.');
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
          setOtherInStockCandidateList((prevOtherInStockCandidate) => {
            return prevOtherInStockCandidate.filter((value, index) => {
              return index != eventTriggeredRowIndex;
            });
          });
        } /*else if (keyBoardEvent.key == 'ArrowDown') {
          if (eventTriggeredRowIndex == otherInStockCandidateList.length - 1 && otherInStockCandidateList[eventTriggeredRowIndex].prodNm != undefined) {
            setOtherInStockCandidateList((prevOtherInStockCandidate) => {
              return [...prevOtherInStockCandidate, {}];
            });
            if (event.api.getFocusedCell()) {
              event.api.setFocusedCell(eventTriggeredRowIndex + 1, (event.api.getFocusedCell() as CellPosition).column);
            }
          }
        }*/
      } else if ((event as CellKeyDownEvent).column.getColId() == 'stockCnt') {
        if (keyBoardEvent.key == 'ArrowDown') {
          if (
            event.api.getEditingCells()[0] &&
            event.api.getEditingCells()[0].rowIndex == event.rowIndex &&
            event.api.getEditingCells()[0].colId == 'stockCnt' &&
            event.rowIndex < otherInStockCandidateList.length
          ) {
            event.api.startEditingCell({
              rowIndex: event.rowIndex + 1,
              colKey: 'stockCnt',
            });
          }
        } else if (keyBoardEvent.key == 'ArrowUp') {
          if (
            event.api.getEditingCells()[0] &&
            event.api.getEditingCells()[0].rowIndex == event.rowIndex &&
            event.api.getEditingCells()[0].colId == 'stockCnt' &&
            event.rowIndex > 0
          ) {
            event.api.startEditingCell({
              rowIndex: event.rowIndex - 1,
              colKey: 'stockCnt',
            });
          }
        }
      }
    }
  };

  const onSkuSelected = (count: number, list: SkuResponsePaging[]) => {
    const updatedOtherInStockCandidateList = removeEmptyRows(otherInStockCandidateList, 'no');
    for (let i = 0; i < list.length; i++) {
      updatedOtherInStockCandidateList[updatedOtherInStockCandidateList.length] = {
        no: otherInStockCandidateList.length + i + 1,
        prodId: list[i].prodId,
        prodNm: list[i].prodNm,
        skuId: list[i].skuId,
        color: list[i].skuColor,
        size: list[i].skuSize,
        skuFactoryNm: list[i].mainFactoryNm,
      };
    }
    setOtherInStockCandidateList([...updatedOtherInStockCandidateList]);
    /*list.map((selected, index) => {
      getSkuFactoryListByFilter({
        skuId: selected.skuId,
      }).then((result) => {
        const { resultCode, body, resultMessage } = result.data;
        if (resultCode == 200) {
          const skuFactoryResponseByFilteringList = body as SkuFactoryResponseByFiltering[];
          for (let i = 0; i < skuFactoryResponseByFilteringList.length; i++) {
            if (skuFactoryResponseByFilteringList[i].mainYn == 'Y') {
              // 메인생산처인 경우
              updatedOtherInStockCandidateList[updatedOtherInStockCandidateList.length] = {
                no: otherInStockCandidateList.length + index,
                prodId: selected.prodId,
                prodNm: selected.prodNm,
                skuId: selected.skuId,
                color: selected.skuColor,
                size: selected.skuSize,
                skuFactoryNm: skuFactoryResponseByFilteringList[i].factoryNm,
              };
              if (updatedOtherInStockCandidateList.length == list.length) {
                // 마지막 요소도 마무리함
                setOtherInStockCandidateList(updatedOtherInStockCandidateList.sort((a, b) => (a.no || 0) - (b.no || 0)));
              }
            }
          }
        } else {
          console.error(resultMessage);
          toastError(selected.skuNm + ' 의 생산처 관련 정보를 조회하는 도중 문제가 발생하였습니다.');
          return;
        }
      });
    });
    //setOtherInStockCandidateList();*/
  };

  useEffect(() => {
    selectPartnerList(undefined).then((result) => {
      const { resultCode, body, resultMessage } = result.data;
      if (resultCode == 200) {
        const partnerResponseForSearchingList = body as PartnerResponseForSearching[];
        setPartnerOptionList(
          partnerResponseForSearchingList.map((partnerResponseForSearching) => {
            return {
              key: partnerResponseForSearching.id,
              value: partnerResponseForSearching.id,
              label: partnerResponseForSearching.partnerNm,
            };
          }),
        );
      } else {
        console.error(resultMessage);
        toastError(resultMessage);
      }
    });
  }, [selectPartnerList]);

  // 상품추가 핸들러
  const handleAddProduct = async () => {
    console.log('추가');
    const asnUnitList: AsnUnit[] = [];

    for (let i = 0; i < otherInStockCandidateList.length; i++) {
      const item = otherInStockCandidateList[i];
      if (!item.skuId) {
        console.error('일부 데이터의 skuId 를 찾을 수 없음');
      } else if (item.stockCnt && item.stockCnt > 0) {
        asnUnitList.push({
          skuId: item.skuId,
          skuCnt: item.stockCnt,
        });
      }
    }

    if (filters.partnerId == undefined) {
      toastError('요청에 필요한 화주 정보를 찾을 수 없습니다.');
      console.error('filters.partnerId 부재');
      return;
    }

    if (asnUnitList.length === 0) {
      toastError('입하 처리하고자 하는 상품의 수량을 입력 후 다시 시도하십시요.');
      console.error('asnUnitList 부재');
      return;
    }

    try {
      const result = await createEtcAsn({
        partnerId: filters.partnerId,
        asnUnits: asnUnitList,
      });

      const { resultCode, resultMessage } = result.data;
      if (resultCode === 200) {
        toastSuccess('기타입하가 정상 등록되었습니다.');
        await queryClient.invalidateQueries(['/instock/paging']);
        closeHandler();
      } else {
        console.error(resultMessage);
        toastError(resultMessage);
      }
    } catch (error) {
      console.error('상품 추가 요청 중 오류 발생', error);
      toastError('상품 추가 중 오류가 발생했습니다.');
    }
  };

  const [open, setOpen] = useState<boolean>(false);

  return (
    <PopupLayout
      width={980}
      isEscClose={false}
      open={active}
      title={'기타입하 추가'}
      onClose={closeHandler}
      isSubPopUpOpened={skuSearchPopEnabled}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button
              className="btn btnBlue"
              title="상품 추가"
              onClick={() => {
                setOpen(true);
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
        <Search className="type_2">
          <TunedReactSelector
            title={'고객사'}
            name={'partnerNm'}
            onChange={(option) => {
              onChangeFilters('partnerId', Number(option.value));
            }}
            options={partnerOptionList}
            placeholder={'고객사명 입력'}
          />
          <Search.Input
            title={'생산처'}
            name={'factoryNm'}
            placeholder={'생산처명 입력'}
            value={filters.factoryNm}
            onEnter={enterOnFactoryNm}
            onChange={onChangeFilters}
            filters={filters}
          />
          <Search.Input
            title={'상품'}
            name={'prodNm'}
            placeholder={'상품명 입력'}
            value={filters.prodNm}
            onEnter={enterOnProdNm}
            onChange={onChangeFilters}
            filters={filters}
          />
          <div className="btnArea">
            <button
              className="btn btnBlack"
              title="검색"
              onClick={() => {
                setSkuSearchPopEnabled(true);
              }}
            >
              검색
            </button>
          </div>
        </Search>
        <div className="mt10">
          <div className={'ag-theme-alpine default check'}>
            <AgGridReact
              onGridReady={onGridReady}
              gridOptions={{ rowHeight: 28, localeText: AG_CHARTS_LOCALE_KO_KR }}
              headerHeight={35}
              columnDefs={OtherInStockAddPopColDef}
              rowData={otherInStockCandidateList}
              defaultColDef={defaultColDef}
              onCellKeyDown={onCellKeyDown}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              onCellEditingStopped={(event) => {
                if (event.column.getColId() == 'stockCnt') {
                  if (event.newValue) {
                    if (!isNaN(event.newValue)) {
                      if (event.newValue >= 0) {
                        let stockCntTotal = 0;
                        setOtherInStockCandidateList((prevState) => {
                          for (let i = 0; i < prevState.length; i++) {
                            if (i == event.rowIndex) {
                              prevState[i].stockCnt = event.newValue;
                              stockCntTotal += Number(event.newValue);
                            } else {
                              if (prevState[i].stockCnt) {
                                stockCntTotal += Number(prevState[i].stockCnt as number);
                              }
                            }
                          }
                          return prevState;
                        });
                        setPinnedBottomRowData([
                          {
                            stockCnt: stockCntTotal,
                          },
                        ]);
                        event.node.setSelected(true);
                      } else {
                        toastError('0 이상의 숫자를 입력하십시요.');
                        event.node.setDataValue('stockCnt', undefined);
                      }
                    } else {
                      toastError('숫자 이외의 값은 입력할 수 없습니다.');
                      event.node.setDataValue('stockCnt', undefined);
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
          partnerId: filters.partnerId,
          mainFactoryNm: filters.factoryNm,
        }}
        disableCount={true}
        //skuNm={typedKeyWord}
        onSelected={onSkuSelected}
      />
      <ConfirmModal
        title={
          '<div class="confirmMsg"><span class="small">현재 입력된 상품을 </span><span class="big"><strong>입하</strong>&nbsp;처리하시겠어요?</span></div>'
        }
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        onConfirm={() => {
          handleAddProduct();
          setOpen(false);
        }}
      />
    </PopupLayout>
  );
};
