import { AgGridReact, AgGridReactProps } from 'ag-grid-react';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  CellClickedEvent,
  CellKeyDownEvent,
  ColDef,
  Column,
  ColumnHeaderClickedEvent,
  ColumnMovedEvent,
  ColumnVisibleEvent,
  FullWidthCellKeyDownEvent,
  type GridOptions,
  GridReadyEvent,
  IRowNode,
  RowSelectionOptions,
  SortChangedEvent,
  ViewportChangedEvent,
} from 'ag-grid-community';
import { AG_GRID_LOCALE_KO, GridSetting, withCommonKeyboardSuppress } from '@/libs/ag-grid';
import { useCommonStore } from '@/stores';

type clickSelectionConfig = {
  colField: string; // 적용 대상 컬럼
  withoutDeselection: boolean; // 타 행 선택해제 없이 선택될지 여부
  selectAllByHeaderClick?: boolean; // 헤더 클릭할 경우 전체선택할지 여부
};
type extendedRowSelectionOptions<P> = RowSelectionOptions<P> & {
  // 기본 설정과 겹치는 영역이 존재할 시 이하 정의된 확장 설정이 우선
  clickSelectionConfigByPerCol?: clickSelectionConfig[]; // 유효한 값이 주어질 시 rowSelection 일부 속성 잠금, selection 동작은 api를 통해 명시적으로 통제함
};

/** 페이징 관련 타입 */
type pagingStrategy = 'add' | 'other';
interface DefaultPagingOptions {
  pagingStrategy?: pagingStrategy;
}

export interface AddPagingOptions extends DefaultPagingOptions {
  // add 전략에서는 controlledRowData 상태를 초기화하여 페이징 동작 초기화 가능
  pagingStrategy: 'add';
}
export interface OtherPagingOptions extends DefaultPagingOptions {
  pagingStrategy: 'other';
  // todo 추후 이러한 식의 뼈대 기반 확장 가능
}

/** 복사, 붙여넣기 이벤트 */
export interface selectedRowCopiedEvent<P> {
  copiedRowNodes: IRowNode<P>[];
}
export interface copiedRowPastedEvent<P> {
  eventTriggeredRowIndex: number | null;
  pastedRowNodes: IRowNode<P>[];
}

/** custom api 인터페이스*/
export interface PagingInitializationEvent {
  from: 'api' | 'depsChanging'; // 페이징 초기화 요청의 출처
}

/** api 인터페이스 */
export interface TunedGridApi<P> {
  onTouchedByBottom?: () =>
    | Promise<void>
    | {
        pausedMilliseconds: number; //onTouchedByBottom 재 트리거가 허용되기까지의 중간 텀
      };
  onSelectedRowCopied?: (event: selectedRowCopiedEvent<P>) => void;
  onCopiedRowNodePasted?: (event: copiedRowPastedEvent<P>) => void;
  onWheel?: (event: React.WheelEvent<HTMLDivElement>) => void;
  onInitializePaging?: (event: PagingInitializationEvent) => void;
}
/** 인자 목록 */
export interface TunedGridOptions<P, PO> extends GridOptions<P> {
  columnDefs: ColDef<P>[]; // 컬럼 정의 제공을 의무화하는 차원에서 재정의
  colIndexForSuppressKeyEvent?: number; // 인자 제공할 경우 다중 선택 사용 시 해당 인덱스의 컬럼으로 포커싱 후 이후 동작을 진행함
  preventPersonalizedColumnSetting?: boolean; // 개인화된 컬럼 셋팅 비활성 여부, true 값을 명시적으로 제공해야만 비활성화
  gridId?: string;
  className?: string;
  rowData?: P[];
  gridOptions?: GridOptions<P>;
  savedPrevClickedNodeCnt?: number; // 이전에 클릭된 행(node)들 중 저장될 행의 개수(2 이상의 값을 할당하여야)
  enableBrowserTooltips?: boolean;
  rowSelection?: extendedRowSelectionOptions<P>;
  pagingOptions?: PO;
  pagingDeps?: React.DependencyList; // 내부에서 hook 트리거 등에 사용 가능한 페이징 관련 의존 배열
  //pagingOptions?: PagingOptions; // 본 인자 주어질 경우 상태 제어권 일부는 컴포넌트에 위임되어 외부 상태에 대응하여 요구되는 동작을 작동시킴, 상태로서 관리하여 적절한 시점에 페이징 동작을 비활성화, 재활성화 가능
}

type customGridRefs<P> = {
  customs: {
    api: {
      //initializePagingStatus: () => void | Promise<unknown>;
    };
  };
};
// TunedGrid 참조 타입
export type TunedGridRef<P> = AgGridReact<P> & customGridRefs<P>;
type excludedTypes = 'columnDefs';

// 첫번째 제네릭은 다루어지는 행의 (데이터)타입, 두번째는 페이징 타입(option)
type TunedGridProps<P, PO extends DefaultPagingOptions> =
  // 추후 일부 api를 노출하지 않고자 할 때 Omit key에 해당 타입 지정
  Omit<AgGridReactProps<P>, excludedTypes> &
    TunedGridOptions<P, PO> &
    TunedGridApi<P> & {
      ref?: React.Ref<TunedGridRef<P>>;
    };

/**
 * components/grid/TunedGrid.tsx
 * desc: 기존 Ag grid react 에 해당 애플리케이션에서 요구하는 사항을 추가한 공통 컴포넌트
 *
 * 이하 사용시 유의사항
 * keyForBeingPressed 인자로 들어온 키에 해당하는 키가 눌린 상태로 화살표 이동할 시 다중 행 선택이 이루어짐
 * ArrowDown, ArrowUp 키는 본 요소 내부에서 사용되므로 외부에서 이벤트 리스너를 던질 시 유의하여야 함
 * */
const TunedGrid = <P, PO extends DefaultPagingOptions = DefaultPagingOptions>({ ref, pagingDeps = [], rowData, ...props }: TunedGridProps<P, PO>) => {
  const defaultGridOption: GridOptions = {
    rowHeight: 28,
    //localeText: AG_CHARTS_LOCALE_KO_KR,
  };

  /** 컨트롤 키 press 가 발생할 시 일부 설정을 고정하여 연관 동작의 원할한 실행을 가능토록 하는 상수 */
  const rowSelectionOptionInCtrlInterrupt: RowSelectionOptions<P, any, any> = {
    mode: 'multiRow',
    checkboxes: false, // 기본적으로 체크박스 비활성화
    headerCheckbox: false, // 헤더 체크박스 안 보이게
    enableClickSelection: true,
    enableSelectionWithoutKeys: true,
  };

  const gridComponents = {
    ...props.components,
    NUMBER_COMMA: GridSetting.CellRenderer.NUMBER_COMMA,
    MONTH_DAY: GridSetting.CellRenderer.MONTH_DAY,
    PERCENTAGE: GridSetting.CellRenderer.PERCENTAGE,
    DATE: GridSetting.CellRenderer.DATE,
    DATETIME: GridSetting.CellRenderer.DATETIME,
  };

  /** 참조 및 외부 노출 ref 속성 실 구현 */
  const gridRef = useRef<AgGridReact>(null);

  /** 기존 키에 관한 정보 저장(여기서는 arrowDown, arrowUp) */
  const prevEventKey = useRef<string | undefined>(undefined);

  /** 컬럼 정의는 상태로서 관리됨 */
  const [columnDefs, setColumnDefs] = useState<ColDef<P>[]>(props.columnDefs || []);
  /** 인자로 들어온 키 목록 중 그리드에서 눌려있는 키 목록을 상태로서 관리 */
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);

  /** 본 페이지에서 사용되는 클립보드(복사 이후 사용하기 위해 임시 저장되는 값) 상태 관리 */
  const [copiedRowNode, setCopiedRowNode] = useState<IRowNode<P>[]>([]);
  /** 컴포넌트의 의도된 동작(페이징)을 위하여 외부 상태와 적절히 동기화되어 관리되어지는 상태 */
  const [controlledRowData, setControlledRowData] = useState<P[]>([]);

  /** 최하단 도달 시점에 이벤트를 트리거할지 결정하는 분기 참조 */
  const isReachedEventTriggerAllowed = useRef(true);

  /** 참조를 통해 외부로 노출되는 영역을 정의함 */
  useImperativeHandle<AgGridReact<P>, TunedGridRef<P>>(ref, () => {
    const grid = gridRef.current as AgGridReact<P>;

    return Object.assign<AgGridReact<P>, customGridRefs<P>>(grid ?? {}, {
      // 이하 TunedGrid 에서 노출코자 하는 기타 속성 및 api 목록
      customs: {
        api: {
          // todo
          initializePagingStatus: () => {
            // 현재 진행 중인 페이징 동작을 TunedGrid 하에서 초기화(비활성화와 유사한 부분이 다수 존재하나 이는 페이징 동작을 계속하리라 여기어 작성되었다는 점을 유념하여야 한다)
            if (props.pagingOptions) {
              // 각 전략별로 컴포넌트 수준에서 적절한 초기화 동작 수행
              if (props.pagingOptions.pagingStrategy == 'add') {
                setControlledRowData([]);
              }
            }

            // 페이징 초기화 발생 시점 콜백 호출
            if (props.onInitializePaging) {
              props.onInitializePaging({
                from: 'api',
              });
            }
          },
        },
      },
    });
  });

  /** cell click 이벤트를 외부 값과 동기화 */
  const onCellClicked = (event: CellClickedEvent<P>) => {
    if (props.onCellClicked) {
      props.onCellClicked(event);
    }
    if (
      props.rowSelection?.mode == 'multiRow' && // 다중선택 옵션이 주어지지 않을 경우 이하 동작 미시행
      props.rowSelection?.clickSelectionConfigByPerCol &&
      props.rowSelection?.clickSelectionConfigByPerCol.length > 0
    ) {
      // clickSelectionConfigByPerCol 이 유효하게 주어진 경우 이하 동작 수행
      const clickSelectionConfigList = props.rowSelection?.clickSelectionConfigByPerCol as clickSelectionConfig[];
      if (
        clickSelectionConfigList.filter((value) => value.colField == event.column.getColDef().field).length > 0 &&
        clickSelectionConfigList.filter((value) => value.colField == event.column.getColDef().field)[0].withoutDeselection
      ) {
        // deselect 없이 단일 선택
        event.node.setSelected(!event.node.isSelected());
      } else {
        event.api.deselectAll();
        event.node.setSelected(!event.node.isSelected());
      }
    }
  };

  const onColumnHeaderClicked = (event: ColumnHeaderClickedEvent<P>) => {
    if (props.onColumnHeaderClicked) {
      props.onColumnHeaderClicked(event);
    }
    if (
      props.rowSelection?.mode == 'multiRow' && // 다중선택 옵션이 주어지지 않을 경우 이하 동작 미시행
      props.rowSelection?.clickSelectionConfigByPerCol &&
      props.rowSelection?.clickSelectionConfigByPerCol.length > 0
    ) {
      const clickSelectionConfigList = props.rowSelection?.clickSelectionConfigByPerCol as clickSelectionConfig[];
      if (
        clickSelectionConfigList.filter((value) => value.colField == (event.column as Column).getColDef().field).length > 0 &&
        clickSelectionConfigList.filter((value) => value.colField == (event.column as Column).getColDef().field)[0].withoutDeselection
      ) {
        if (event.api.getSelectedNodes().length > 0) {
          event.api.deselectAll();
        } else {
          event.api.selectAll();
        }
      }
    }
  };

  const onGridReady = (event: GridReadyEvent) => {
    if (props.pagingOptions) {
      if (props.pagingOptions.pagingStrategy == 'add') {
        if (controlledRowData.length > 0) {
          setControlledRowData([]);
        }
      }
    }

    /** 개인화된 컬럼 설정 불러오는 영역 */
    /*
    if (!props.preventPersonalizedColumnSetting && props.gridId) {
      selectGridColumnState(props.gridId).then((result) => {
        const { resultCode, body } = result.data;
        if (resultCode === 200 && body) {
          const GridResponse = body as GridResponse;
          if (GridResponse.columnState) {
            const savedColumns = JSON.parse(GridResponse.columnState) as ColDef<P>[];
            const mergedColumns = props.columnDefs.map((origCol) => {
              const savedCol = savedColumns.find((sc) => sc.field === origCol.field);
              return savedCol ? { ...origCol, ...savedCol } : origCol;
            });
            setColumnDefs(mergedColumns);
            // console.log('머지', mergedColumns);
          }
        }
      });
    }
    */

    /** 저장된 컬럼 정보 fetch 이후 콜백 호출 */
    if (props.onGridReady) {
      props.onGridReady(event);
    }
  };

  const onKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
    /** 눌린 키 목록 최신화(목록에서 제거) */
    setPressedKeys((keyList) => {
      if (event.key == 'Shift') {
        /** 인자의 첫번째 키에서 손을 뗀 경우 */
        prevEventKey.current = undefined;
        setColumnDefs((prevColumnDefs) => {
          for (let i = 0; i < prevColumnDefs.length; i++) {
            prevColumnDefs[i].suppressKeyboardEvent = () => {
              // 키보드 기본 동작 억제 설정 초기화
              return false;
            };
          }
          return [...prevColumnDefs];
        });
      }

      return keyList.filter((key) => key != event.key); // 키 목록에서 해당 키 제거;
    });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    /** 눌린 키 목록 최신화(목록에 추가) */
    setPressedKeys((keyList) => {
      if (!keyList.includes(event.key)) {
        keyList.push(event.key); // 기존 키 목록에 해당 키가 포함되지 않은 경우에만 pressedKeys 상태에 해당 키가 추가된다.

        if (event.key == 'Shift') {
          setColumnDefs((prevColumnDefs) => {
            for (let i = 0; i < prevColumnDefs.length; i++) {
              prevColumnDefs[i].suppressKeyboardEvent = (params) => {
                const key = params.event.key;
                // key 클릭 상태에서만 화살표 키 기본 동작을 억제함으로서 본 컬럼에서 화살표 키를 사용해 다음 행으로 이동이 가능하도록 함
                return key === 'ArrowDown' || key === 'ArrowUp';
              };
            }
            return [...prevColumnDefs];
          });
        }
      }
      return [...keyList];
    });
  };

  const onSortChanged = (event: SortChangedEvent<P>) => {
    // todo 추후 개인화 컬럼 설정 등에서 사용처를 찾지 못할 경우 해당 정의는 불필요하므로 삭제하기
    if (props.onSortChanged) {
      props.onSortChanged(event);
    }
  };

  const onColumnMoved = (event: ColumnMovedEvent) => {
    /*
    if (event.finished && !props.preventPersonalizedColumnSetting && props.gridId) {
      const currentColumns = event.api.getColumnDefs();
      if (currentColumns) {
        // undefined 체크 추가
        const serializableColumns = JSON.stringify(event.api.getColumnDefs());
        updateGridColumnState({
          uri: props.gridId,
          columnState: serializableColumns,
        });
      }
    }
*/
  };

  const onColumnVisible = (event: ColumnVisibleEvent) => {
    if (!props.preventPersonalizedColumnSetting && props.gridId) {
      /*
      const currentColumns = event.api.getColumnDefs();
      if (currentColumns) {
        // undefined 체크 추가
        const serializableColumns = JSON.stringify(event.api.getColumnDefs());
        updateGridColumnState({
          uri: props.gridId,
          columnState: serializableColumns,
        });
      }
*/
    }
  };

  const MultiChoiceFn = (
    keyDownEvent: CellKeyDownEvent | FullWidthCellKeyDownEvent,
    prevEventKey: React.MutableRefObject<string | undefined>,
    targetColId?: string,
  ) => {
    const clickedRowIndex = keyDownEvent.rowIndex || 0;
    const gridDataLength = keyDownEvent.api.getDisplayedRowCount() || 0;

    /** 키보드 이벤트 및 하위 요소들 */
    const keyBoardEvent = keyDownEvent.event as KeyboardEvent;
    const key = keyBoardEvent.key;
    const rowNode = keyDownEvent.node;

    const focusedCell = keyDownEvent.api.getFocusedCell();
    if ((key == 'ArrowDown' || key == 'ArrowUp') && keyBoardEvent.shiftKey) {
      if (targetColId && keyDownEvent.api.getFocusedCell()?.column.getColId() != targetColId) {
        /** targetColId 가 인자로 존재할 시 해당 colId 에 해당하는 영역으로 포커싱, 이 동작 직후 다중 선택 가능 */
        keyDownEvent?.api.setFocusedCell(keyDownEvent.rowIndex as number, targetColId);
      } else {
        /** 여기서부터 본 다중선택 영역 */
        if (prevEventKey.current == key && focusedCell) {
          /** 기존 키와 동일한 키가 사용됨(방향 동일), 최초 선택이 아닌 경우이므로 focusedCell 값 존재 */
          const conditionForArrowDown = clickedRowIndex + 1 < gridDataLength; // 클릭된 행의 인덱스 + 1(다음 행으로 이동하므로 1을 추가하여 보정) 이 데이터 배열의 길이보다 작아야 한다(초과 시 그리드 영역을 벗어남)
          const conditionForArrowUp = clickedRowIndex != 0; // 클릭된 행의 인덱스가 0이면 안 된다(작을 경우 역시 그리드 영역을 벗어나므로)
          if (key == 'ArrowDown' ? conditionForArrowDown : conditionForArrowUp) {
            keyDownEvent.api.setFocusedCell(key == 'ArrowDown' ? clickedRowIndex + 1 : clickedRowIndex - 1, targetColId || focusedCell.column.getColId()); // 각각 화살표 키 방향에 해당하는 쪽으로 포커싱 이동
            keyDownEvent.api.forEachNodeAfterFilterAndSort((rowNodeInFor, indexInFor) => {
              if (indexInFor == (key == 'ArrowDown' ? clickedRowIndex + 1 : clickedRowIndex - 1)) {
                rowNodeInFor.setSelected(!rowNodeInFor.isSelected());
              }
            });
          }
        } else {
          /** 기존 키와 다른 키가 사용됨(방향이 변경되었거나 최초 선택) */
          rowNode.setSelected(!rowNode.isSelected());
          if (focusedCell) {
            keyDownEvent.api.setFocusedCell(clickedRowIndex, targetColId || focusedCell.column.getColId()); // 해당 행 포커싱(동작 일관성 유지)
          }
        }
        prevEventKey.current = key; // 동기화
      }
    }
  };

  const onCellKeyDown = (
    event: CellKeyDownEvent<P> | FullWidthCellKeyDownEvent<P>,
    columnDefs: ColDef<P>[],
    colIndexForSuppressKeyEvent: number | undefined,
    rowData: P[] | undefined,
  ) => {
    // 기존 innerRef.current 사용 영역들은 전달된 keydownEvent 값으로 대체됨
    const keyBoardEvent = event.event as KeyboardEvent;
    const targetColId = colIndexForSuppressKeyEvent
      ? columnDefs[colIndexForSuppressKeyEvent].colId || columnDefs[colIndexForSuppressKeyEvent].field
      : undefined;
    if (keyBoardEvent.key == 'ArrowDown' || keyBoardEvent.key == 'ArrowUp') {
      /** 복수의 행 선택을 처리하는 함수 */
      MultiChoiceFn(event, prevEventKey, targetColId);
      if (pressedKeys.find((key) => key == 'Shift') != undefined && pressedKeys.find((key) => key == 'Control') != undefined) {
        /** Shift, Control 키가 모두 눌린 상태에서 화살표 키를 사용한 경우 */
        if (event.rowIndex) {
          const rowIndex = event.rowIndex;
          /** 필터링과 정렬(소팅)이 이루어진 노드를 순환 */
          event.api.forEachNodeAfterFilterAndSort((rowNode, index) => {
            if (keyBoardEvent.key == 'ArrowDown' ? index >= rowIndex : index <= rowIndex) {
              rowNode.setSelected(true);
            }
          });
        }
      }
    } else {
      if (keyBoardEvent.code == 'KeyA' && pressedKeys.find((key) => key == 'Control') != undefined) {
        // ctrl + 'A'
        if (rowData != undefined) {
          // client 영역에서 전체 로드되지 않는 경우(예: dataSource 사용) 전체선택 비활성화
          //innerRef.current?.api.selectAllFiltered(); // ctrl + a(A) => 전체선택
          // 1. rowNode들을 가져와서 필터링된 노드만 선택
          event.api.forEachNodeAfterFilter((node) => {
            node.setSelected(true);
          });
        }
      } else if (keyBoardEvent.code == 'KeyD' && pressedKeys.find((key) => key == 'Control') != undefined) {
        // ctrl + 'D'
        if (rowData != undefined) {
          // client 영역에서 전체 로드되지 않는 경우(예: dataSource 사용) 전체선택해제 비활성화
          event.api.deselectAll(); // ctrl + d(D) => 전체선택해제
        }
      } else if (keyBoardEvent.code == 'KeyC' && pressedKeys.find((key) => key == 'Control') != undefined) {
        // ctrl + c
        if (event.api.getSelectedNodes().length != 0) {
          // 본 영역은 그리드 api 와 별도로 동작한다(기존 그리드의 동작을 억제하지 않는 방식), 하나 이상의 행 선택
          // 셀 선택은 그리드 api 를 통하여 처리
          if (props.onSelectedRowCopied) {
            props.onSelectedRowCopied({ copiedRowNodes: event.api.getSelectedNodes() });
          }
          setCopiedRowNode(event.api.getSelectedNodes());
        }
      } else if (keyBoardEvent.code == 'KeyV' && pressedKeys.find((key) => key == 'Control') != undefined) {
        if (copiedRowNode.length != 0) {
          if (props.onCopiedRowNodePasted) {
            props.onCopiedRowNodePasted({ pastedRowNodes: copiedRowNode, eventTriggeredRowIndex: event.rowIndex });
          }
          setCopiedRowNode([]);
        }
      }
    }
    if (props.onCellKeyDown) {
      /** 외부에서 할당한 리스너 */
      props.onCellKeyDown(event);
    }
  };

  const onViewportChanged = (event: ViewportChangedEvent<P>) => {
    if (props.onViewportChanged) {
      props.onViewportChanged(event);
    }
    // 이하 최하단 도달에 따른 콜백 트리거를 위한 동작
    if (props.onTouchedByBottom) {
      const api = event.api;
      const lastDisplayedRowIndex = api.getLastDisplayedRowIndex();
      const totalRowCount = api.getDisplayedRowCount();

      // 최초 랜더링 시점 무시하도록 처리
      if (lastDisplayedRowIndex != -1) {
        // 마지막 row가 "보이는 순간"
        if (lastDisplayedRowIndex === totalRowCount - 1 && isReachedEventTriggerAllowed.current) {
          isReachedEventTriggerAllowed.current = false;

          if (props.onTouchedByBottom) {
            const returnValueOfTouchedByBottom = props.onTouchedByBottom();
            if (returnValueOfTouchedByBottom instanceof Promise) {
              returnValueOfTouchedByBottom.finally(() => {
                isReachedEventTriggerAllowed.current = true;
              });
            } else {
              setTimeout(() => {
                isReachedEventTriggerAllowed.current = true;
              }, returnValueOfTouchedByBottom.pausedMilliseconds);
            }
          }
        }
      }
    }
  };

  /** 외부 컬럼 정의와의 동기화 */
  /*useEffect(() => {
    if (props.columnDefs) {
      if (!props.preventPersonalizedColumnSetting && props.gridId) {
        selectGridColumnState(props.gridId).then((result) => {
          const { resultCode, body } = result.data;
          if (resultCode === 200 && body) {
            const GridResponse = body as GridResponse;
            if (GridResponse.columnState) {
              const savedColumns = JSON.parse(GridResponse.columnState) as ColDef<P>[];

              // 원본 컬럼(props.columnDefs)을 기준으로 저장된 설정을 병합
              const mergedColumns = props.columnDefs.map((origCol) => {
                const savedCol = savedColumns.find((sc) => sc.field === origCol.field);
                return savedCol
                  ? {
                      ...origCol, // 원본 컬럼 (cellRenderer 포함)
                      ...savedCol, // 저장된 설정 (width, order 등)
                      cellRenderer: origCol.cellRenderer, // cellRenderer는 원본 유지
                      cellStyle: origCol.cellStyle, // cellStyle도 원본 유지
                    }
                  : origCol;
              });
              setColumnDefs(mergedColumns);
            }
          }
        });
      } else {
        setColumnDefs(props.columnDefs);
      }
    }
  }, [props.columnDefs]);*/

  /** 인자로 받은 rowData 변경에 따른 동작 */
  useEffect(() => {
    if (props.pagingOptions != undefined) {
      /** 페이징 동작 영역 */
      // props.rowData 상태 변경 시점에 페이징 설정 존재할 시 필요한 동작을 실행하는 영역
      if (props.pagingOptions.pagingStrategy == 'add') {
        const api = gridRef.current?.api; // (AgGridReact ref면 보통 .api)
        if (api != undefined) {
          // api 존재 확인으로 그리드 마운트 이후 시점임을 보장(onGridReady 호출 이후)
          if (controlledRowData.length > 0) {
            api.applyTransaction({ add: rowData }); // controlledRowData 를 동기화하여 리랜더링을 유발하여 스크롤을 무효화하는 대신 api를 통한 추가를 사용하여 스크롤 무호화 없이 자연스레 추가
          } else {
            setControlledRowData(rowData || []); // 최초 controlledRowData 할당
          }
        }
      }
    }
  }, [rowData]);

  /** pagingOption 변경에 따른 동기화 */
  useEffect(() => {
    if (props.pagingOptions == undefined) {
      /** 페이징 동작 비활성화에 필요한 동작 정의 */
      setControlledRowData([]);
      return;
    }

    return () => {
      // 페이징 관련 정리 동작
      if (props.pagingOptions) {
        // 각 전략별로 컴포넌트 수준에서 적절한 정리 동작 수행
        if (props.pagingOptions.pagingStrategy == 'add') {
          setControlledRowData([]);
        }
      }
    };
  }, [props.pagingOptions]);

  /** paging 의존 배열 hook */
  useEffect(() => {
    if (props.pagingOptions) {
      if (props.pagingOptions.pagingStrategy == 'add') {
        // add 전략에서는 의존 배열 변경 시점에 페이징 초기화 동작 수행
        setControlledRowData([]);
      }
    }

    // 페이징 초기화 발생 시점 콜백 호출
    /** onInitializePaging 콜백은 의존 배열 변경에 따른 내부 동작이 모두 호출된 이후에 호출됨을 보장함 */
    if (props.onInitializePaging) {
      props.onInitializePaging({
        from: 'depsChanging',
      });
    }
  }, [...pagingDeps]); // 배열 자체가 아닌 내부 요소들을 전개해서 등록(이를 통해 리 랜더링 시의 부수 효과로 hook 이 동작하는 걸 방지)

  return (
    <div className={`ag-theme-quartz ${props.className}`} onWheel={props.onWheel} onKeyDown={onKeyDown} onKeyUp={onKeyUp} tabIndex={-1}>
      <AgGridReact<P>
        {...props}
        columnDefs={columnDefs.map(withCommonKeyboardSuppress)} // React 상태컬럼 방향키로 헤더까지 안올라가게 수정 2025-08-27
        headerHeight={props.headerHeight ? props.headerHeight : 35}
        onGridReady={onGridReady}
        rowData={controlledRowData.length > 0 ? controlledRowData : rowData}
        gridOptions={{
          ...defaultGridOption,
          ...props.gridOptions,
        }}
        onColumnHeaderClicked={onColumnHeaderClicked}
        components={gridComponents}
        onCellKeyDown={(event) => {
          onCellKeyDown(event, props.columnDefs, props.colIndexForSuppressKeyEvent, rowData);
        }}
        ref={gridRef}
        onCellClicked={onCellClicked}
        onSortChanged={onSortChanged}
        onViewportChanged={onViewportChanged}
        rowSelection={
          pressedKeys.includes('Control') // Control(컨트롤(ctrl)) 키 누른 경우 별도로 지정한 옵션값으로 변경함
            ? rowSelectionOptionInCtrlInterrupt
            : (typeof props.rowSelection == 'object' // RowSelectionOptions 타입의 인자가 전달된 경우
                ? props.rowSelection.mode == 'multiRow' // 다중 선택인 경우와 단일 선택인 경우 사용 가능한 옵션이 다른 관계로 분기
                  ? {
                      // 다중선택 case
                      ...props.rowSelection,
                      checkboxes: false, // 기본적으로 체크박스 비활성화
                      headerCheckbox: false, // 다중 선택인 경우는 헤더 체크박스도 비활성화
                      enableClickSelection:
                        props.rowSelection.clickSelectionConfigByPerCol && props.rowSelection.clickSelectionConfigByPerCol.length > 0
                          ? false // clickSelectionConfigByPerCol 이 유효하게 주어진 경우 설정을 '잠금'
                          : props.rowSelection.enableClickSelection,
                    }
                  : {
                      // 단일선택 case
                      ...props.rowSelection,
                      checkboxes: false, // 기본적으로 체크박스 비활성화
                      enableClickSelection:
                        props.rowSelection.clickSelectionConfigByPerCol && props.rowSelection.clickSelectionConfigByPerCol.length > 0
                          ? false // clickSelectionConfigByPerCol 이 유효하게 주어진 경우 설정을 '잠금'
                          : props.rowSelection.enableClickSelection,
                    }
                : props.rowSelection) || 'multiple' // 그 외에는 인자로 받은 값 사용 혹은 기본값 사용
        } // Ctrl 키를 누른 상태에서 요구되는 별도 동작에 대처하고자 다음과 같이 처리함
        //onColumnMoved={onColumnMoved}
        //onColumnVisible={onColumnVisible}
        localeText={AG_GRID_LOCALE_KO}
        autoSizeStrategy={{
          type: 'fitCellContents',
        }}
        //enableBrowserTooltips={props.enableBrowserTooltips === undefined ? true : props.enableBrowserTooltips} // todo 커스텀 툴팁을 써야 하는경우
        // tooltipShowDelay={100}
        // tooltipHideDelay={50000}
        stopEditingWhenCellsLoseFocus={true}
      />
    </div>
  );
};
export default TunedGrid;
