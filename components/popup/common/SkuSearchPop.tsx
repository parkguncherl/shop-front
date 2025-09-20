import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CellKeyDownEvent, ColDef, FullWidthCellKeyDownEvent, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';
import { useCommonStore } from '../../../stores';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import CustomGridLoading from '../../CustomGridLoading';
import TunedGrid from '../../grid/TunedGrid';
import { PageObject, SkuResponsePaging } from '../../../generated';
import useFilters from '../../../hooks/useFilters';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { toastError } from '../../ToastMessage';
import { PopupLayout } from '../PopupLayout';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { Utils } from '../../../libs/utils';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { PopupSearchBox, PopupSearchType } from '../content';
import { Search } from '../../content';
import { InputRef } from 'antd';
import { CustomInput } from '../../CustomInput';

interface skuSearchPopProps {
  filter?: {
    skuNm?: string;
    partnerId?: number;
    mainFactoryNm?: string;
  };
  onSelected: (count: number, list: SkuResponsePaging[]) => void;
  disableCount?: boolean;
  limit?: number; // 선택 가능한 sku 의 최대 개수(0 이하일 시 할당되지 않은 경우와 동일하게 동작)
  active?: boolean; // 모달 활성화 여부
  onClose?: () => void;
  onGridReady?: () => void;
}

/**
 * 스큐 검색 팝업(공통 모달)
 * 최초 랜더링 시점에 인자들을 받으므로 리액트 조건부 랜더링 문법을 호출 영역에 함께 사용하기
 * */
export const SkuSearchPop = (props: skuSearchPopProps) => {
  console.log('SkuSearchPop  ===>', props);
  /** 공통 스토어 - State */
  const [selectedRetail] = useCommonStore((s) => [s.selectedRetail]);

  /** Component 참조 */
  const ProductSearchRef = useRef<InputRef>(null);
  const ProductAmtRef = useRef<InputRef>(null);
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
    pageRowCount: 200,
  });

  /** 검색 조건 타이핑 시 onChangeFilter 호출, filter 상태 변경 */
  const [filters, onChangeFilters] = useFilters({
    skuNm: undefined,
    skuCnt: 0,
    sellerId: selectedRetail?.id,
  });

  const {
    data: skuPagingList,
    isLoading: isSkuListLoading,
    isFetched: isSkuListFetched,
    refetch: fetchSkuList,
  } = useQuery(
    ['/sku/paging', paging.curPage, paging.pageRowCount, props.filter?.skuNm, props.filter?.partnerId, props.filter?.mainFactoryNm, filters],
    (): any =>
      authApi.get('/sku/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
          skuNm: filters.skuNm,
          partnerId: props.filter?.partnerId,
          mainFactoryNm: props.filter?.mainFactoryNm,
          sellerId: selectedRetail && selectedRetail.id ? selectedRetail.id : undefined,
        },
      }),
    {
      enabled: false, //props.active, // 모달이 열릴 시 활성화
      //enabled: props.skuNm != undefined || filters.skuNm != undefined, // 속성 혹은 필터를 통하여 스큐명이 주어질 시 활성화
    },
  );

  useEffect(() => {
    if (isSkuListFetched) {
      const { resultCode, body, resultMessage } = skuPagingList.data;
      if (resultCode == 200) {
        setPaging(body?.paging);
        console.log('selectedSkuList ==>', selectedSkuList);
        const selectedSkuIds = new Set(selectedSkuList.current.map((sku: SkuResponsePaging) => sku.skuId));
        const filteredSkuList = ((body.rows as SkuResponsePaging[]) || []).filter((sku) => !selectedSkuIds.has(sku.skuId));
        setSearchedSkuList(filteredSkuList);
        //setSearchedSkuList((body.rows as SkuResponsePaging[]) || []);
        if (filters.skuNm && body.paging.totalRowCount > 0) {
          /** 검색 키워드가 입력된 경우(혹은 인자로 전달된 경우) 그리드 영역에 포커싱 */
          focusedRowRef.current = body.paging.focusedIndex === -1 ? 0 : body.paging.focusedIndex;
          if (RefForGrid.current && RefForGrid.current?.api) {
            setTimeout(() => {
              RefForGrid.current?.api.ensureIndexVisible(focusedRowRef.current);
              RefForGrid.current?.api.setFocusedCell(focusedRowRef.current, 'skuNm');
            }, 50);
          }
        }
      } else {
        toastError('스큐 목록 조회 도중 문제가 발생하였습니다.');
        console.error(resultMessage);
      }
      setTimeout(() => {
        // 포커스가 안잡혀 있을때만 잡는다
        if (ProductSearchRef.current && document.activeElement !== (ProductSearchRef.current as unknown as Element)) {
          ProductSearchRef.current.focus();
        }
      }, 300);
    }
  }, [skuPagingList, isSkuListFetched, isSkuListLoading]);

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
        maxWidth: 55,
        minWidth: 55,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'jobCount',
        headerName: '출고중',
        maxWidth: 55,
        minWidth: 55,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'realInventoryAmt',
        headerName: '실재고',
        maxWidth: 55,
        minWidth: 55,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
        cellStyle: (params) => {
          return {
            ...GridSetting.CellStyle.CENTER,
            color: params.value < 0 ? 'red' : '', // Set color based on value
          };
        },
        suppressHeaderMenuButton: true,
      },
      {
        field: 'partnerInventoryAmt',
        headerName: '매장', // 매장재고
        maxWidth: 55,
        minWidth: 55,
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

  useEffect(() => {
    if (props.active) {
      // 열림
      console.log('open  ==>', props.filter?.skuNm);
      if (props.filter?.skuNm) {
        onChangeFilters('skuNm', props.filter?.skuNm);
        setTimeout(() => {
          onSearch();
        }, 600);
      } else {
        onSearch();
      }
    } else {
      // 닫힘
      selectedSkuList.current = []; // 선택된 sku 목록 제거
      setSelectedCount(0); // 수량 상태 초기화
      onChangeFilters('skuNm', '');
      setSearchedSkuList([]);
    }
  }, [props.active]);

  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      params.api.sizeColumnsToFit();
      if (props.onGridReady) {
        props.onGridReady();
      }
    },
    [props.onGridReady],
  );

  /** 검색 */
  const onSearch = useCallback(async () => {
    previousSelection.current = [];
    await fetchSkuList(); // 최신화된 필터 사용하여 refetch
  }, [fetchSkuList]);

  /** 검색 버튼 클릭 시 */
  const search = useCallback(async () => {
    await onSearch();
  }, [onSearch]);

  // selection 변경 이벤트 핸들러
  const onSelectionChanged = useCallback((event: SelectionChangedEvent<SkuResponsePaging, any>) => {
    // api를 통해 선택된 행들을 가져옵니다
    const selectedNodes = event.api.getSelectedNodes();
    const selectedData: SkuResponsePaging[] = selectedNodes.flatMap((node) => (node.data ? [node.data] : []));

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
      if (isSelectedKeyDown) {
        if (props.disableCount) {
          // 수량 입력 생략 후 즉시 onSelected 호출
          props.onSelected(0, [...selectedSkuList.current]); // 기존 배열을 복사한 새로운 배열(스큐 목록) 반환
          if (props.onClose) {
            props.onClose();
          }
        } else {
          ProductAmtRef.current?.focus();
        }
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
    /*if (e.key === 'Enter') {
      search();
    } else*/
    /*if (e.key === 'Escape') {
      // 상품명 영역에서 esc 키를 사용하여 모달을 닫을 수 있다.
      if (props.onClose) {
        props.onClose();
      }
    } else */

    if (e.key === 'Tab') {
      e.preventDefault(); // tab 키 사용시 발생하는 이벤트를 억제(미작성 시 동작 통제가 곤란함)
      ProductAmtRef.current?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const api = RefForGrid.current?.api;
      if (api) {
        if (api?.getFocusedCell()) {
          api.ensureIndexVisible(api.getFocusedCell()?.rowIndex || 0); // ✅ 스크롤 먼저 스크롤이 움직여야 포커스도 이동됨
          api.setFocusedCell(api.getFocusedCell()?.rowIndex || 0, 'skuNm');
        } else {
          api.setFocusedCell(0, 'skuNm');
        }
        //      e.preventDefault(); // tab 키 사용시 발생하는 이벤트를 억제(미작성 시 동작 통제가 곤란함)
      }
    }
  };

  /*
  const enterDownEventOnProd = useCallback(async () => {
    await search();
  }, [search]);
*/

  /**
   * 상품수량 영역 키보드 입력 callBack
   * */
  const keyDownEventOnAmt = (e: React.KeyboardEvent) => {
    if (e.key == 'Tab') {
      e.preventDefault(); // tab 키 사용시 발생하는 이벤트를 억제(미작성 시 동작 통제가 곤란함)
      RefForGrid.current?.api.setFocusedCell(RefForGrid.current?.api.getFocusedCell()?.rowIndex || 0, 'skuNm');
    } /*else if (e.key === 'Enter') {
      const targetValue = (e.target as HTMLInputElement).value;
      if (!isNaN(Number(targetValue))) {
        if (props.limit && props.limit > 0 && selectedSkuList.current.length > props.limit) {
          toastError('상품 종류는 ' + (props.limit == 1 ? '하나' : props.limit + '개') + '를 초과할 수 없습니다.');
        } else {
          props.onSelected(Number(targetValue), [...selectedSkuList.current]); // 기존 배열을 복사한 새로운 배열(스큐 목록) 반환
          if (props.onClose) {
            props.onClose();
          }
        }
      } else {
        toastError('상품수량 값은 숫자인 경우에만 유효합니다.');
      }
    }*/
  };

  const enterDownEventOnAmt = useCallback(
    (e: React.KeyboardEvent) => {
      const targetValue = (e.target as HTMLInputElement).value || 1; // 0이 들어갈 수 없음(기본값 1)
      console.log(targetValue);
      if (!isNaN(Number(targetValue))) {
        if (props.limit && props.limit > 0 && selectedSkuList.current.length > props.limit) {
          toastError('상품 종류는 ' + (props.limit == 1 ? '하나' : props.limit + '개') + '를 초과할 수 없습니다.');
        } else {
          props.onSelected(Number(targetValue), [...selectedSkuList.current]); // 기존 배열을 복사한 새로운 배열(스큐 목록) 반환
          if (props.onClose) {
            props.onClose();
          }
        }
      } else {
        toastError('상품수량 값은 숫자인 경우에만 유효합니다.');
      }
    },
    [props.limit, props.onClose],
  );

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

  return (
    <PopupLayout
      width={915}
      open={props.active || false}
      title={'상품검색 (' + selectedCount + '개 선택됨)'}
      className={'skuSearchPop'}
      isEscClose={true}
      onClose={props.onClose}
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
            <Search.Input
              title={'상품명'}
              name={'skuNm'}
              placeholder={'키워드 입력 후 엔터키 클릭'}
              value={filters.skuNm}
              keyDownEvent={keyDownEventOnProd}
              onEnter={search}
              onChange={onChangeFilters}
              filters={filters}
              reference={ProductSearchRef}
            />
            <CustomInput
              title={'상품수량'}
              name={'skuCnt'}
              placeholder={'키워드 입력 후 엔터키 클릭'}
              value={undefined}
              keyDownEvent={keyDownEventOnAmt}
              onEnter={enterDownEventOnAmt}
              filters={filters}
              reference={ProductAmtRef}
              disable={props.disableCount}
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
            /*onRowClicked={(e) => {
              console.log(e.data);
              setTimeout(() => {
                console.log('selectedSkuList.current[' + selectedCount + ']', selectedSkuList.current);
              }, 1000);
            }}*/
            ref={RefForGrid}
            onWheel={onWheel}
            preventPersonalizedColumnSetting={true}
            onSelectionChanged={onSelectionChanged}
            className={'default check'}
          />
        </div>
      </PopupContent>
    </PopupLayout>
  );
};
