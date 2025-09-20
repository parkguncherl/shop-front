import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CellKeyDownEvent, ColDef, FullWidthCellKeyDownEvent, GridReadyEvent } from 'ag-grid-community';
import { useCommonStore } from '../../../stores';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import CustomGridLoading from '../../CustomGridLoading';
import TunedGrid from '../../grid/TunedGrid';
import { PageObject, SkuResponsePaging } from '../../../generated';
import useFilters from '../../../hooks/useFilters';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { toastError } from '../../ToastMessage';
import { Utils } from '../../../libs/utils';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import FormInput from '../../FormInput';
import { useForm } from 'react-hook-form';
import { PopupContent, PopupFooter, PopupLayout } from '../index';
import { PopupSearchBox, PopupSearchType } from '../content';

interface skuSearchForIpgoPopProps {
  partnerId: number;
  skuNm?: string;
  limit?: number; // 선택 가능한 sku 의 최대 개수(0 이하일 시 할당되지 않은 경우와 동일하게 동작)
  active?: boolean; // 모달 활성화 여부
  onClose?: () => void;
  onGridReady?: () => void;
}
type SkuSearchPop = {
  skuNm: string;
  skuCnt: number;
};

/**
 * 스큐 검색 팝업(공통 모달)
 * 최초 랜더링 시점에 인자들을 받으므로 리액트 조건부 랜더링 문법을 호출 영역에 함께 사용하기
 * */
export const SkuSearchForIpgoPop = (props: skuSearchForIpgoPopProps) => {
  /** 공통 스토어 - State */
  const [selectedRetail] = useCommonStore((s) => [s.selectedRetail]);

  /** Component 참조 */
  const ProductSearchRef = useRef<HTMLInputElement>(null);
  const ProductAmtRef = useRef<HTMLInputElement>(null);
  const RefForGrid = useRef<AgGridReact>(null);
  const focusedRowRef = useRef<number>(-1);
  const previousSelection = useRef<SkuResponsePaging[]>([]);

  /** 본 팝업에서 선택된 스큐 목록 */
  const selectedSkuList = useRef<SkuResponsePaging[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);

  /** 검색을 통해 얻은 스큐 목록 */
  const [searchedSkuList, setSearchedSkuList] = useState<SkuResponsePaging[]>([]);

  const [paging, setPaging] = useState<PageObject>({
    curPage: 1,
    pageRowCount: 500,
  });

  /** 검색 조건 타이핑 시 onChangeFilter 호출, filter 상태 변경 */
  const [filters, onChangeFilters] = useFilters({
    skuNm: props.skuNm, // 메인 그리드에서 키워드 입력 후 모달을 열 경우에 대응
    sellerId: selectedRetail?.id,
  });

  const {
    data: skuPagingList,
    isLoading: isSkuListLoading,
    isSuccess: isSkuListFetched,
    refetch: fetchSkuList,
  } = useQuery(['/sku/paging', paging.curPage, paging.pageRowCount], (): any =>
    authApi.get('/sku/paging', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      },
    }),
  );

  useEffect(() => {
    if (isSkuListFetched) {
      const { resultCode, body, resultMessage } = skuPagingList.data;
      if (resultCode == 200) {
        setPaging(body?.paging);
        setSearchedSkuList((body.rows as SkuResponsePaging[]) || []);
        console.log(body.paging);
        if (body && body.paging && filters.skuNm && body.paging.totalRowCount > 0) {
          /** 검색 키워드가 입력된 경우 그리드 영역에 포커싱 */
          focusedRowRef.current = body.paging.focusedIndex === -1 ? 0 : body.paging.focusedIndex;
          setTimeout(
            () => {
              RefForGrid.current?.api.ensureIndexVisible(focusedRowRef.current);
              RefForGrid.current?.api.setFocusedCell(focusedRowRef.current, 'skuNm');
            },
            body.paging.totalRowCount > 400 ? 900 : 100,
          );
        } else {
          ProductSearchRef.current?.focus();
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [skuPagingList, isSkuListFetched, isSkuListLoading]);

  useEffect(() => {
    if (RefForGrid.current?.api && searchedSkuList) {
      RefForGrid.current.api.forEachNode((node) => {
        if (selectedSkuList.current.some((data) => data.skuId === node.data.skuId)) {
          node.setSelected(true);
        }
      });
    }
  }, [searchedSkuList, selectedSkuList]);

  /*  useEffect(() => {
    if (isSkuListFetched && focusedRowRef.current > -1) {
      RefForGrid.current?.api.ensureIndexVisible(focusedRowRef.current);
      RefForGrid.current?.api.setFocusedCell(focusedRowRef.current, 'skuNm');
    }
  }, [focusedRowRef.current]);*/

  /** 컬럼 정의 */
  const SkuListColsForPop = useMemo<ColDef<SkuResponsePaging>[]>(
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
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuNm',
        headerName: '상품명',
        maxWidth: 250,
        minWidth: 250,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuCd',
        headerName: '상품코드',
        minWidth: 160,
        suppressHeaderMenuButton: true,
        hide: true,
      },
      {
        field: 'skuSize',
        headerName: '사이즈',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        hide: true,
      },
      {
        field: 'skuColor',
        headerName: '색상',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        hide: true,
      },
      {
        field: 'sellAmt',
        headerName: '판매가',
        maxWidth: 90,
        minWidth: 90,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
        cellRenderer: (params: any) => {
          return <span className="mr21">{Utils.setComma(params.value)}</span>;
        },
        suppressHeaderMenuButton: true,
      },
      {
        field: 'inventoryAmt',
        headerName: '빈블러', // 센터재고
        maxWidth: 60,
        minWidth: 60,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'partnerInventoryAmt',
        headerName: '매장', // 매장재고
        maxWidth: 60,
        minWidth: 60,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'dcAmt',
        headerName: '단가 DC',
        maxWidth: 90,
        minWidth: 90,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
        cellRenderer: (params: any) => {
          return <span className="mr21">{Utils.setComma(params.value)}</span>;
        },
        suppressHeaderMenuButton: true,
      },
      {
        field: 'sellerNm',
        headerName: '판매처',
        minWidth: 50,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
    ],
    [],
  );

  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      params.api.sizeColumnsToFit();
      ProductSearchRef.current?.focus();
      if (props.onGridReady) {
        props.onGridReady();
      }
    },
    [props.onGridReady],
  );

  /** 검색 */
  const onSearch = async () => {
    previousSelection.current = [];
    await fetchSkuList(); // 최신화된 필터 사용하여 refetch
  };

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };

  // selection 변경 이벤트 핸들러
  const onSelectionChanged = useCallback(() => {
    // api를 통해 선택된 행들을 가져옵니다
    const selectedNodes = RefForGrid.current?.api.getSelectedNodes();
    const selectedData: SkuResponsePaging[] | undefined = selectedNodes?.map((node) => node.data);
    // 선택된게 있을때만 작동
    console.log('selectedNodes', selectedNodes?.length);
    console.log('selectedData', selectedData);
    console.log('previousSelection.current.length', previousSelection.current.length);
    if (selectedData) {
      if (selectedSkuList.current.length > 0 && previousSelection.current.length >= selectedData.length) {
        // 이전선택이 줄어들었을때 선택을 취소했을때는 취소한것을 제거해주어야 한다.
        const removedItems = previousSelection.current.filter((prevItem) => !selectedData.some((currItem) => currItem.skuId === prevItem.skuId));
        console.log('removedItems.length', removedItems.length);
        if (removedItems && removedItems.length > 0) {
          selectedSkuList.current = selectedSkuList.current.filter((skuInfo) => !removedItems.some((removeItem) => removeItem.skuId === skuInfo.skuId));
          previousSelection.current = selectedData;
        } else {
          // 제거 할게 없으면 중복제거해서 담는다.
          selectedSkuList.current = [...selectedSkuList.current, ...selectedData].reduce((acc: SkuResponsePaging[], item) => {
            if (!acc.some((obj) => obj.skuId === item.skuId)) {
              acc.push(item);
            }
            return acc;
          }, []);
        }
        // 선택이 늘었을때는 아래와 같이 처리한다.
      } else {
        previousSelection.current = selectedData;
        // 중복제거해서 담는다.
        selectedSkuList.current = [...selectedSkuList.current, ...selectedData].reduce((acc: SkuResponsePaging[], item) => {
          if (!acc.some((obj) => obj.skuId === item.skuId)) {
            acc.push(item);
          }
          return acc;
        }, []);
      }
      setSelectedCount(selectedSkuList.current.length); // 카운트를 셑팅한다 ref 는 바로 적용이 안되는경우가 있다.
    }
  }, []);

  /**
   * 본 함수는 컴포넌트 인자 props 에 의존적
   * searchedData 인자에는 참조가 아닌 복사(spread 연산자 사용) 전달할 필요
   * 최초 랜더링 직후 여러 노드를 선택할시 마지막으로 포커스된 단일 행만 메인 그리드에 반영되는 문제에 대응함
   * enter, tab 키를 사용하여 상품수량 영역으로 이동 가능
   * */
  const onCellKeyDown = (event: CellKeyDownEvent | FullWidthCellKeyDownEvent) => {
    const keyBoardEvent = event.event as KeyboardEvent;
    const selectedData: SkuResponsePaging[] = [];
    let isSelectedKeyDown = false;
    if (keyBoardEvent.key === 'Enter') {
      if (RefForGrid.current && RefForGrid.current.api.getSelectedNodes().length == 0) {
        // 선택 없이 특정 행 위에서 엔터키를 사용한 경우
        selectedData[selectedData.length] = event.data;
      } else if (RefForGrid.current && RefForGrid.current.api.getSelectedNodes().length != 0) {
        // 하나 이상의 요소 선택 후 엔터키 혹은 tab 키를 사용한 경우
        for (let i = 0; i < RefForGrid.current.api.getSelectedNodes().length; i++) {
          selectedData[selectedData.length] = RefForGrid.current.api.getSelectedNodes()[i].data;
        }
        isSelectedKeyDown = true;
      }
      /** 선택된 데이터를 selectedSkuList 상태에 반영 */
      /*
      setSelectedSkuList((selectedSkuList) => {
        let filtered = [...selectedData];
        selectedSkuList.forEach((value) => {
          // 기존 데이터 각각에 관하여 선택된 데이터에 같은 스큐가 존재할 경우 필터링
          filtered = filtered.filter((sku) => sku.skuId != value.skuId);
        });
        return [...selectedSkuList, ...filtered];
      });
*/
      if (isSelectedKeyDown) {
        ProductAmtRef.current?.select();
      } else {
        ProductSearchRef.current?.select();
      }
    } else if (keyBoardEvent.key === 'Escape' || keyBoardEvent.key == 'Tab') {
      // esc 키 혹은 tab 키를 사용하여 상품명 검색 영역으로 포커스
      ProductSearchRef.current?.focus();
    }
  };

  /**
   * 상품명 영역 키보드 입력 callBack
   * */
  const keyDownEventOnProd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      search();
    } else if (e.key === 'Escape') {
      // 상품명 영역에서 esc 키를 사용하여 모달을 닫을 수 있다.
      if (props.onClose) {
        props.onClose();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault(); // tab 키 사용시 발생하는 이벤트를 억제(미작성 시 동작 통제가 곤란함)
      ProductAmtRef.current?.focus();
    }
  };

  /**
   * 상품수량 영역 키보드 입력 callBack
   * */
  const keyDownEventOnAmt = (e: React.KeyboardEvent) => {
    if (e.key == 'Tab') {
      e.preventDefault(); // tab 키 사용시 발생하는 이벤트를 억제(미작성 시 동작 통제가 곤란함)
      RefForGrid.current?.api.setFocusedCell(RefForGrid.current?.api.getFocusedCell()?.rowIndex || 0, 'skuNm');
    } else if (e.key === 'Enter') {
      const targetValue = (e.target as HTMLInputElement).value;
      if (!isNaN(Number(targetValue))) {
        if (props.limit && props.limit > 0 && selectedSkuList.current.length > props.limit) {
          toastError('상품 종류는 ' + (props.limit == 1 ? '하나' : props.limit + '개') + '를 초과할 수 없습니다.');
        } else {
          if (props.onClose) {
            props.onClose();
          }
        }
      } else {
        toastError('상품수량 값은 숫자인 경우에만 유효합니다.');
      }
    }
  };

  // 휠 방향 감지
  const onWheel = (event: any) => {
    const gridInfo = RefForGrid.current?.api.getVerticalPixelRange();
    const rowCount = RefForGrid.current?.api.getDisplayedRowCount() ? RefForGrid.current?.api.getDisplayedRowCount() : 0;
    const lastRowNode = RefForGrid.current?.api.getDisplayedRowAtIndex(rowCount - 1);
    // 페이지 last row 번호 보다 페이징 토탈 카운트 보다 작을때만 스크롤 페이징 처리 한다.
    if (lastRowNode?.rowIndex && paging.totalRowCount && lastRowNode?.rowIndex + 1 < paging.totalRowCount) {
      if (event.deltaY > 99) {
        console.log('스크롤 ==> ', event.deltaY);
        // 마지막 행이 보이는 경우 추가 데이터 로드
        if (lastRowNode) {
          const lastRowBottom = (lastRowNode.rowTop || 0) + (lastRowNode.rowHeight || 0);
          // 마지막 행이 완전히 보이는 경우 추가 데이터 로드
          if ((gridInfo?.bottom || 0) >= lastRowBottom) {
            if (paging.curPage && !isSkuListLoading) {
              if (paging.curPage < paging.totalRowCount) {
                // 맨 마지막 페이지 에서는 더이상 증가하면 안된다.
                setPaging({ ...paging, curPage: paging?.curPage + 1 });
              }
            }
          }
        }
      } else if (event?.deltaY < -99) {
        if (gridInfo?.top === 0) {
          setTimeout(() => {
            if (paging.curPage && paging.curPage > 1 && !isSkuListLoading) {
              setPaging({ ...paging, curPage: paging?.curPage - 1 });
            }
          }, 200);
        }
      }
    }
  };

  /** useForm */
  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<SkuSearchPop>({
    //resolver: yupResolver(YupSchema.ProductRequest(prodAttrOpen)),
    defaultValues: { skuNm: props.skuNm, skuCnt: 1 },
    mode: 'onSubmit',
  });

  return (
    <PopupLayout
      width={800}
      open={props.active || false}
      title={'상품검색 (' + selectedCount + '개 선택됨)'}
      className={'skuSearchPop'}
      onClose={() => {
        if (props.onClose) {
          props.onClose();
        }
      }}
      isEscClose={true}
      footer={
        <PopupFooter>
          {/*<div className="btnArea">*/}
          {/*  <button*/}
          {/*    className="btn"*/}
          {/*    title="닫기"*/}
          {/*    onClick={() => {*/}
          {/*      if (props.onClose) {*/}
          {/*        props.onClose();*/}
          {/*      }*/}
          {/*    }}*/}
          {/*  >*/}
          {/*    닫기*/}
          {/*  </button>*/}
          {/*</div>*/}
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          <PopupSearchType className={'type_2'}>
            <FormInput<SkuSearchPop>
              ref={ProductSearchRef}
              control={control}
              name={'skuNm'}
              label={'상품명'}
              placeholder={'키워드 입력 후 엔터키 클릭'}
              // value={filters.skuNm || ''}
              onChange={(e) => onChangeFilters(e.target.name, e.target.value)}
              onKeyDown={keyDownEventOnProd}
            />
            <FormInput<SkuSearchPop>
              ref={ProductAmtRef}
              control={control}
              name={'skuCnt'}
              label={'상품수량'}
              placeholder={'키워드 입력 후 엔터키 클릭'}
              onKeyDown={keyDownEventOnAmt}
              handleOnFocus={() => {
                /*if (ProductAmtRef.current) {
                  // 포커스 시 사용자에게 보여주는 값을 지우고 입력 가능 상태로 전환하기 위한 동작
                  ProductAmtRef.current.focus();
                  ProductAmtRef.current.select();
                }*/
              }}
            />
          </PopupSearchType>
        </PopupSearchBox>
        <div className="mt10">
          <TunedGrid<SkuResponsePaging>
            colIndexForSuppressKeyEvent={2}
            onGridReady={onGridReady}
            columnDefs={SkuListColsForPop}
            rowData={searchedSkuList}
            defaultColDef={defaultColDef}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            onCellKeyDown={onCellKeyDown}
            onRowClicked={(e) => {
              console.log(e.data);
              setTimeout(() => {
                console.log('selectedSkuList.current[' + selectedCount + ']', selectedSkuList.current);
              }, 1000);
            }}
            ref={RefForGrid}
            onWheel={onWheel}
            preventPersonalizedColumnSetting={true}
            onSelectionChanged={onSelectionChanged}
          />
        </div>
      </PopupContent>
    </PopupLayout>
  );
};
