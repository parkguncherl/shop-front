import { AgGridReact } from 'ag-grid-react';
import React, { forwardRef, RefAttributes, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  BodyScrollEvent,
  CellClickedEvent,
  CellDoubleClickedEvent,
  CellEditingStartedEvent,
  CellEditingStoppedEvent,
  CellFocusedEvent,
  CellKeyDownEvent,
  CellMouseDownEvent,
  CellValueChangedEvent,
  ColDef,
  ColumnMovedEvent,
  ColumnVisibleEvent,
  FirstDataRenderedEvent,
  FullWidthCellKeyDownEvent,
  GetContextMenuItemsParams,
  type GridOptions,
  GridReadyEvent,
  IRowNode,
  MenuItemDef,
  PasteEndEvent,
  PasteStartEvent,
  ProcessCellForExportParams,
  ProcessDataFromClipboardParams,
  RowClassParams,
  RowClickedEvent,
  RowDataUpdatedEvent,
  RowDoubleClickedEvent,
  RowGroupOpenedEvent,
  RowModelType,
  RowStyle,
  SelectionChangedEvent,
  SortChangedEvent,
} from 'ag-grid-community';
import { AG_CHARTS_LOCALE_KO_KR } from 'ag-charts-locale';
import { useRouter } from 'next/router';
import { AG_GRID_LOCALE_KO, GridSetting, withCommonKeyboardSuppress } from '../../libs/ag-grid';
import { useCommonStore } from '../../stores';
import { GridResponse } from '../../generated';

export interface statusInf {
  prevEventKey?: string;
}

export interface selectedRowCopiedEvent<P> {
  copiedRowNodes: IRowNode<P>[];
}

export interface copiedRowPastedEvent<P> {
  eventTriggeredRowIndex: number | null;
  pastedRowNodes: IRowNode<P>[];
}

export interface TunedGridProps<P> {
  colIndexForSuppressKeyEvent?: number; // 인자 제공할 경우 다중 선택 사용 시 해당 인덱스의 컬럼으로 포커싱 후 이후 동작을 진행함
  columnDefs: ColDef<P>[];
  headerHeight?: number;
  onGridReady?: (event: GridReadyEvent<P, any>) => void;
  onWheel?: (event: any) => void;
  rowData?: P[];
  defaultColDef?: ColDef;
  gridOptions?: GridOptions;
  components?: any;
  onCellMouseDown?: (event: CellMouseDownEvent<P, any>) => void;
  onCellKeyDown?: (event: CellKeyDownEvent<P, any> | FullWidthCellKeyDownEvent<P, any>) => void;
  onCellFocused?: (event: CellFocusedEvent<P, any>) => void;
  getRowClass?: (params: RowClassParams<P, any>) => string;
  getRowStyle?: (params: RowClassParams<P, any>) => RowStyle | undefined;
  onCellEditingStarted?: (event: CellEditingStartedEvent<P, any>) => void;
  onCellEditingStopped?: (event: CellEditingStoppedEvent<P, any>) => void;
  onRowClicked?: (event: RowClickedEvent<P, any>) => void;
  onRowDoubleClicked?: (event: RowDoubleClickedEvent<P, any>) => void;
  onCellClicked?: (event: CellClickedEvent<P>) => void;
  onCellDoubleClicked?: (event: CellDoubleClickedEvent<P>) => void;
  onCellValueChanged?: (event: CellValueChangedEvent<P>) => void;
  //onRowValueChanged?: (event: RowValueChangedEvent) => void;
  onBodyScroll?: (event: BodyScrollEvent<P, any>) => void;
  onReachEachSide?: (event: 'T' | 'B') => void;
  onPasteStart?: (event: PasteStartEvent) => void;
  onPasteEnd?: (event: PasteEndEvent) => void;
  className?: string;
  loading?: boolean;
  paginationPageSize?: number;
  loadingOverlayComponent?: any;
  noRowsOverlayComponent?: any;
  pinnedBottomRowData?: any;
  processCellForClipboard?: (params: ProcessCellForExportParams<P, any>) => void;
  processCellFromClipboard?: (params: ProcessCellForExportParams<P, any>) => void;
  processDataFromClipboard?: (params: ProcessDataFromClipboardParams<P, any>) => string[][] | null;
  onSelectedRowCopied?: (event: selectedRowCopiedEvent<P>) => void;
  onCopiedRowNodePasted?: (event: copiedRowPastedEvent<P>) => void;
  onSelectionChanged?: (event: SelectionChangedEvent<P>) => void;
  suppressRowClickSelection?: boolean;
  //suppressMultiRangeSelection?: boolean;
  rowModelType?: RowModelType;
  infiniteInitialRowCount?: number;
  cacheBlockSize?: number;
  preventPersonalizedColumnSetting?: boolean; // true 값을 명시적으로 제공해야만 비활성화
  autoGroupColumnDef?: ColDef<P, any>;
  rowSelection?: 'multiple' | 'single';
  suppressContextMenu?: boolean;
  singleClickEdit?: boolean;
  savedPrevClickedNodeCnt?: number; // 2 이상의 값을 할당하여야
  onSortChanged?: (event: SortChangedEvent<P, any>) => void;
  enableRangeSelection?: boolean;
  enableFillHandle?: boolean;
  treeData?: boolean;
  masterDetail?: boolean;
  detailRowHeight?: number;
  detailCellRendererParams?: any;
  getDataPath?: any;
  uppressMaintainIndex?: any;
  rowGroupPanelShow?: any;
  groupDefaultExpanded?: number;
  suppressMakeColumnVisibleAfterUnGroup?: boolean;
  keepDetailRows?: boolean;
  groupDisplayType?: string;
  groupSelectsChildren?: boolean;
  isExternalFilterPresent?: () => boolean;
  doesExternalFilterPass?: (node: any) => boolean;
  containerStyle?: React.CSSProperties;
  domLayout?: 'normal' | 'autoHeight' | 'print';
  onFirstDataRendered?: (event: FirstDataRenderedEvent) => void;
  onRowDataUpdated?: (event: RowDataUpdatedEvent) => void;
  onRowGroupOpened?: (event: RowGroupOpenedEvent) => void;
  suppressClickEdit?: boolean;
}

// MultiChoiceFn 위에 추가
const getSerializableColumnDefs = (columnDefs: any[]): any[] => {
  return columnDefs.map((col) => ({
    field: col.field,
    headerName: col.headerName,
    hide: col.hide,
    minWidth: col.minWidth,
    width: col.width,
    flex: col.flex,
    pinned: col.pinned,
  }));
};

/**
 * keyForBeingPressed 인자로 들어온 키에 해당하는 키가 눌린 상태로 화살표 이동할 시 다중 행 선택이 이루어짐
 * ArrowDown, ArrowUp 키는 본 요소 내부에서 사용되므로 외부에서 이벤트 리스너를 던질 시 유의하여야 함
 * */
const InnerTunedGrid = <P,>(props: TunedGridProps<P>, ref: React.Ref<AgGridReact> | null) => {
  const router = useRouter();

  const [selectGridColumnState, updateGridColumnState, initGridColumnState] = useCommonStore((s) => [
    s.selectGridColumnState,
    s.updateGridColumnState,
    s.initGridColumnState,
  ]);

  /** 최초에는 ref 훅을 할당받으나 forward 형식으로 주어진 ref 가 존재할 시 해당 ref 를 할당한다. */
  let innerRef = useRef<AgGridReact>(null);
  if (ref != null) {
    innerRef = ref as RefObject<AgGridReact>; // 외부에서 전달된 ref 를 사용하기 위해 타입 단언
  }
  /** 컬럼 정의는 상태로서 관리됨 */
  const [columnDefs, setColumnDefs] = useState(props.columnDefs || []);
  /** 인자로 들어온 키 목록 중 그리드에서 눌려있는 키 목록을 상태로서 관리 */
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [firstRender, setFirstRender] = useState(true);
  const isLoadingRef = useRef(false);
  const [prevClickedNodeList, setPrevClickedNodeList] = useState<IRowNode[]>([]); // todo get 메서드 등을 사용하여 외부에서 클릭된 노드 히스토리를 사용하도록 구현 가능

  /** 본 페이지에서 사용되는 클립보드(복사 이후 사용하기 위해 임시 저장되는 값) 상태 관리 */
  const [copiedRowNode, setCopiedRowNode] = useState<IRowNode[]>([]);

  useEffect(() => {
    if (props.columnDefs && !firstRender) {
      if (!props.preventPersonalizedColumnSetting) {
        selectGridColumnState(router.pathname).then((result) => {
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
          } else {
            setColumnDefs(props.columnDefs);
          }
        });
      } else {
        setColumnDefs(props.columnDefs);
      }
    }
  }, [props.columnDefs]);

  useEffect(() => {
    if (isLoadingRef.current) {
      isLoadingRef.current = !!props.loading;
    }
  }, [props.loading]);

  const onGridReady = (event: GridReadyEvent) => {
    setFirstRender(false);
    if (!props.preventPersonalizedColumnSetting) {
      selectGridColumnState(router.pathname).then((result) => {
        const { resultCode, body } = result.data;
        // console.log('result.data>>', result.data);
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
    /** 저장된 컬럼 정보 fetch 이후 콜백 호출 */
    if (props.onGridReady) {
      props.onGridReady(event);
    }
  };

  /** 컨텍스트 메뉴(팝업창) 관리 */
  const getContextMenuItems = (params: GetContextMenuItemsParams) => {
    const customMenuItem: MenuItemDef[] = [
      {
        name: '그리드컬럼 설정 초기화',
        action: () => {
          initGridColumnState({
            uri: router.pathname,
            columnState: JSON.stringify(props.columnDefs),
          }).then((result) => {
            if (result.data.resultCode === 200) {
              innerRef.current?.api.resetColumnState();
            }
          });
        },
        cssClasses: ['blue', 'bold'],
        icon: '<span class="ag-icon ico_refresh"></span>',
      },
      {
        name: '엑셀다운로드',
        action: () => {
          innerRef.current?.api.exportDataAsExcel();
        },
        cssClasses: ['blue', 'bold'],
        icon: '<span class="ag-icon ico_refresh"></span>',
      },
    ];

    // separator를 MenuItemDef로 정의 (타입 단언 사용)
    const separatorItem = {
      name: '',
      separator: true,
    } as MenuItemDef;

    return [
      separatorItem,
      ...customMenuItem, // 전개연산자 사용하여 펼쳐줘야 함
    ];
  };

  const defaultGridOption: GridOptions = {
    rowHeight: 28,
    localeText: AG_CHARTS_LOCALE_KO_KR,
    getContextMenuItems: getContextMenuItems,
  };

  // 기존 키에 관한 정보 저장(여기서는 arrowDown, arrowUp)
  const prevEventKey = useRef<string | undefined>(undefined);

  const onKeyUp = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
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
  }, []);

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
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
      return keyList;
    });
  }, []);

  const onCellMouseDown = useCallback((event: CellMouseDownEvent<P, any>, pressedKeys: string[], savedPrevClickedNodeCnt: number | undefined) => {
    setPrevClickedNodeList((prevClickedNodeList) => {
      // setState 내부 콜백 함수는 외부 함수에 비해 실행 시점이 뒤에 위치함에 유의
      if (savedPrevClickedNodeCnt == undefined || savedPrevClickedNodeCnt < 2 || prevClickedNodeList.length == savedPrevClickedNodeCnt) {
        // 길이 인자(savedPrevClickedNodeCnt)가 제공되지 않았거나 인자의 값이 유효하지 않거나 값에 해당하는 길이만큼의 node 가 이미 저장된 경우
        if (prevClickedNodeList.length == 2) {
          // 배열의 앞 요소(가장 이전에 클릭된)를 제거
          prevClickedNodeList.shift();
        }
      }

      /** 마우스 클릭 관련 동작 실행 영역 */
      const previousClickedRowIndex =
        (prevClickedNodeList[prevClickedNodeList.length - 1] && prevClickedNodeList[prevClickedNodeList.length - 1].rowIndex) || -1; // 본 mouseDown 이벤트 발생 이전에 클릭된 행의 rowIndex
      if (pressedKeys.includes('Control')) {
        // 컨트롤 키 클릭된 상태에서 마우스 클릭시 행 선택, 해제
        if (event.api.getSelectedNodes().length == 0) {
          event.api.forEachNodeAfterFilterAndSort((rowNodeInFor, indexInFor) => {
            if (event.node.rowIndex == indexInFor || previousClickedRowIndex == indexInFor) {
              // 클릭한 행, 이전에 마지막으로 클릭한 행을 select
              rowNodeInFor.setSelected(true);
            }
          });
        } else {
          // 최초 이후 동작
          event.node.setSelected(true);
        }
      } else {
        if (event.api.getSelectedNodes().length > 1) {
          // 선택된 행이 2개 이상일 경우에만 다음 동작이 수행됨(전체 선택해제 후 클릭된 행을 선택)
          const focusedCell = event.api.getFocusedCell(); // 현재 포커스된 셀 정보 가져오기
          if (focusedCell) {
            const focusedRowIndex = focusedCell.rowIndex; // 포커스된 셀의 rowIndex 가져오기
            event.api.deselectAll(); // 전체 선택 해제
            const focusedNode = event.api.getDisplayedRowAtIndex(focusedRowIndex); // 포커스된 RowNode 가져오기
            if (focusedNode) {
              focusedNode.setSelected(true); // 포커스(클릭)된 행 다시 선택
            }
          }
        }
      }
      if (pressedKeys.includes('Shift')) {
        if (event.rowIndex != null && previousClickedRowIndex != -1) {
          const eventRowIndex = event.api.getFocusedCell()?.rowIndex;
          if (eventRowIndex) {
            event.api.forEachNodeAfterFilterAndSort((rowNode, index) => {
              if (
                previousClickedRowIndex > eventRowIndex
                  ? index >= eventRowIndex && index <= previousClickedRowIndex
                  : index <= eventRowIndex && index >= previousClickedRowIndex
              ) {
                rowNode.setSelected(true);
              }
            });
            // 마지막 클릭된 셀에 포커스 설정
            const lastSelectedNode = event.api.getRowNode(String(event.rowIndex));
            if (lastSelectedNode) {
              event.api.setFocusedCell(event.rowIndex, event.column.getColId());
            }
          }
        }
      }

      /** 최신화된 상태 반영 영역 */
      prevClickedNodeList.push(event.node);
      return prevClickedNodeList;
    });
  }, []);

  const onSortChanged = useCallback(
    (event: SortChangedEvent<P, any>) => {
      // 정렬 발생할 시 prevClickedNodeList 초기화
      setPrevClickedNodeList((prevState) => {
        prevState.length = 0;
        return prevState;
      });

      if (props.onSortChanged) {
        props.onSortChanged(event);
      }
    },
    [props.onSortChanged],
  );

  const onColumnMoved = (event: ColumnMovedEvent) => {
    if (event.finished && !props.preventPersonalizedColumnSetting) {
      const currentColumns = event.api.getColumnDefs();
      if (currentColumns) {
        // undefined 체크 추가
        const serializableColumns = JSON.stringify(event.api.getColumnDefs());
        updateGridColumnState({
          uri: router.pathname,
          columnState: serializableColumns,
        });
      }
    }
  };

  const onColumnVisible = (event: ColumnVisibleEvent) => {
    if (!props.preventPersonalizedColumnSetting) {
      const currentColumns = event.api.getColumnDefs();
      if (currentColumns) {
        // undefined 체크 추가
        const serializableColumns = JSON.stringify(event.api.getColumnDefs());
        updateGridColumnState({
          uri: router.pathname,
          columnState: serializableColumns,
        });
      }
    }
  };

  const MultiChoiceFn = useCallback(
    (
      keyDownEvent: CellKeyDownEvent | FullWidthCellKeyDownEvent,
      AgGridRef: AgGridReact,
      prevEventKey: React.MutableRefObject<string | undefined>,
      targetColId?: string,
    ) => {
      const clickedRowIndex = keyDownEvent.rowIndex || 0;
      const gridDataLength = AgGridRef.api.getDisplayedRowCount() || 0;

      /** 키보드 이벤트 및 하위 요소들 */
      const keyBoardEvent = keyDownEvent.event as KeyboardEvent;
      const key = keyBoardEvent.key;
      const rowNode = keyDownEvent.node;

      const focusedCell = AgGridRef.api.getFocusedCell();
      if ((key == 'ArrowDown' || key == 'ArrowUp') && keyBoardEvent.shiftKey) {
        if (targetColId && keyDownEvent.api.getFocusedCell()?.column.getColId() != targetColId) {
          /** targetColId 가 인자로 존재할 시 해당 colId 에 해당하는 영역으로 포커싱 */
          AgGridRef?.api.setFocusedCell(keyDownEvent.rowIndex as number, targetColId);
        } else {
          /** 여기서부터 본 다중선택 영역 */
          if (prevEventKey.current == key && focusedCell) {
            /** 기존 키와 동일한 키가 사용됨(방향 동일), 최초 선택이 아닌 경우이므로 focusedCell 값 존재 */
            const conditionForArrowDown = clickedRowIndex + 1 < gridDataLength; // 클릭된 행의 인덱스 + 1(다음 행으로 이동하므로 1을 추가하여 보정) 이 데이터 배열의 길이보다 작아야 한다(초과 시 그리드 영역을 벗어남)
            const conditionForArrowUp = clickedRowIndex != 0; // 클릭된 행의 인덱스가 0이면 안 된다(작을 경우 역시 그리드 영역을 벗어나므로)
            if (key == 'ArrowDown' ? conditionForArrowDown : conditionForArrowUp) {
              AgGridRef.api.setFocusedCell(key == 'ArrowDown' ? clickedRowIndex + 1 : clickedRowIndex - 1, targetColId || focusedCell.column.getColId());
              AgGridRef.api.forEachNodeAfterFilterAndSort((rowNodeInFor, indexInFor) => {
                if (indexInFor == (key == 'ArrowDown' ? clickedRowIndex + 1 : clickedRowIndex - 1)) {
                  rowNodeInFor.setSelected(!rowNodeInFor.isSelected());
                }
              });
            }
          } else {
            /** 기존 키와 다른 키가 사용됨(방향이 변경되었거나 최초 선택) */
            rowNode.setSelected(!rowNode.isSelected());
          }
          prevEventKey.current = key; // 동기화
        }
      }
    },
    [],
  );

  const onCellKeyDown = useCallback(
    (
      event: CellKeyDownEvent<P, any> | FullWidthCellKeyDownEvent<P, any>,
      columnDefs: ColDef<P, any>[],
      colIndexForSuppressKeyEvent: number | undefined,
      rowData: P[] | undefined,
    ) => {
      const keyBoardEvent = event.event as KeyboardEvent;
      const targetColId = colIndexForSuppressKeyEvent
        ? columnDefs[colIndexForSuppressKeyEvent].colId || columnDefs[colIndexForSuppressKeyEvent].field
        : undefined;
      if (keyBoardEvent.key == 'ArrowDown' || keyBoardEvent.key == 'ArrowUp') {
        /** 복수의 행 선택을 처리하는 함수 */
        if (innerRef.current) {
          MultiChoiceFn(event, innerRef.current, prevEventKey, targetColId);
          if (pressedKeys.find((key) => key == 'Shift') != undefined && pressedKeys.find((key) => key == 'Control') != undefined) {
            /** Shift, Control 키가 모두 눌린 상태에서 화살표 키를 사용한 경우 */
            if (event.rowIndex) {
              const rowIndex = event.rowIndex;
              /** 필터링과 정렬(소팅)이 이루어진 노드를 순환 */
              innerRef.current.api.forEachNodeAfterFilterAndSort((rowNode, index) => {
                if (keyBoardEvent.key == 'ArrowDown' ? index >= rowIndex : index <= rowIndex) {
                  rowNode.setSelected(true);
                }
              });
            }
          }
        }
      } else {
        if (keyBoardEvent.code == 'KeyA' && pressedKeys.find((key) => key == 'Control') != undefined) {
          // ctrl + 'A'
          if (rowData != undefined) {
            // client 영역에서 전체 로드되지 않는 경우(예: dataSource 사용) 전체선택 비활성화
            //innerRef.current?.api.selectAllFiltered(); // ctrl + a(A) => 전체선택
            // 1. rowNode들을 가져와서 필터링된 노드만 선택
            innerRef.current?.api.forEachNodeAfterFilter((node) => {
              node.setSelected(true);
            });
          }
        } else if (keyBoardEvent.code == 'KeyD' && pressedKeys.find((key) => key == 'Control') != undefined) {
          // ctrl + 'D'
          if (rowData != undefined) {
            // client 영역에서 전체 로드되지 않는 경우(예: dataSource 사용) 전체선택해제 비활성화
            innerRef.current?.api.deselectAll(); // ctrl + d(D) => 전체선택해제
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
    },
    [pressedKeys, props.onCellKeyDown, props.onSelectedRowCopied, props.onCopiedRowNodePasted],
  );

  const onColumnEverythingChanged = (params: any) => {
    // console.log('param ==============>', params);
    if (params.source === 'columnMenu') {
      initGridColumnState({
        uri: router.pathname,
        columnState: JSON.stringify(props.columnDefs),
      }).then((result) => {
        const { resultCode, body, resultMessage } = result.data;
        if (resultCode === 200) {
          console.log('initiated');
        }
      });
    }
  };

  const gridComponents = {
    ...props.components,
    NUMBER_COMMA: GridSetting.CellRenderer.NUMBER_COMMA,
    PERCENTAGE: GridSetting.CellRenderer.PERCENTAGE,
  };

  return (
    <div className={`ag-theme-alpine ${props.className}`} onWheel={props.onWheel} onKeyDown={onKeyDown} onKeyUp={onKeyUp} tabIndex={-1}>
      <AgGridReact<P>
        columnDefs={columnDefs.map(withCommonKeyboardSuppress)} // React 상태컬럼 방향키로 헤더까지 안올라가게 수정 2025-08-27
        headerHeight={props.headerHeight ? props.headerHeight : 35}
        onGridReady={onGridReady}
        rowData={props.rowData}
        defaultColDef={props.defaultColDef}
        gridOptions={{
          ...defaultGridOption,
          ...props.gridOptions,
        }}
        components={gridComponents}
        suppressContextMenu={props.suppressContextMenu}
        singleClickEdit={props.singleClickEdit === null ? true : props.singleClickEdit}
        onCellMouseDown={(event) => {
          onCellMouseDown(event, pressedKeys, props.savedPrevClickedNodeCnt);
          if (props.onCellMouseDown) {
            props.onCellMouseDown(event);
          }
        }}
        onCellKeyDown={(event) => {
          onCellKeyDown(event, props.columnDefs, props.colIndexForSuppressKeyEvent, props.rowData);
        }}
        onCellFocused={props.onCellFocused}
        onCellDoubleClicked={props.onCellDoubleClicked}
        paginationPageSize={props.paginationPageSize}
        getRowClass={props.getRowClass}
        getRowStyle={props.getRowStyle}
        onCellEditingStarted={props.onCellEditingStarted}
        onCellEditingStopped={props.onCellEditingStopped}
        onCellValueChanged={props.onCellValueChanged}
        onRowClicked={props.onRowClicked}
        onCellClicked={props.onCellClicked}
        loading={isLoadingRef.current}
        noRowsOverlayComponent={props.noRowsOverlayComponent}
        pinnedBottomRowData={props.pinnedBottomRowData}
        ref={ref}
        onSortChanged={onSortChanged}
        rowModelType={props.rowModelType}
        rowSelection={props.rowSelection || 'multiple'}
        suppressRowClickSelection={props.suppressRowClickSelection !== undefined ? props.suppressRowClickSelection : true}
        //suppressMultiRangeSelection={props.suppressMultiRangeSelection}
        processCellForClipboard={props.processCellForClipboard} // 클립보드를 위해 -> 복사 동작 발생 시 촉발
        processCellFromClipboard={props.processCellFromClipboard} // 클립보드 로부터 -> 붙여넣기 동작 발생 시 촉발
        processDataFromClipboard={props.processDataFromClipboard}
        onSelectionChanged={props.onSelectionChanged}
        onRowDoubleClicked={props.onRowDoubleClicked}
        infiniteInitialRowCount={props.infiniteInitialRowCount}
        cacheBlockSize={props.cacheBlockSize}
        onPasteStart={props.onPasteStart}
        onPasteEnd={props.onPasteEnd}
        onColumnMoved={onColumnMoved}
        onColumnVisible={onColumnVisible}
        onBodyScroll={(e) => {
          if (props.rowData && props.rowData.length > 0 && e.api.getVerticalPixelRange().bottom == (defaultGridOption.rowHeight || 24) * props.rowData.length) {
            /** rowData 가 주어진 경우 */
            if (props.onReachEachSide) {
              props.onReachEachSide('B');
            }
          } /*else if (
            e.api.getGridOption('datasource') &&
            (e.api.getGridOption('datasource') as IDatasource).rowCount &&
            e.api.getVerticalPixelRange().bottom ==
              (props.gridOptions.rowHeight || 24) * ((e.api.getGridOption('datasource') as IDatasource).rowCount as number)
          ) {
            if (props.onReachEachSide) {
              props.onReachEachSide('B');
            }
          }*/
          if (props.onBodyScroll) {
            /** 최상단 도달 시의 이벤트는 현재 미지원 */
            props.onBodyScroll(e);
          }
          /** 스크롤시 자동 컬럼 사이징 처리 */
          // e.api.autoSizeAllColumns();
        }}
        localeText={AG_GRID_LOCALE_KO}
        enableRangeSelection={props.enableRangeSelection}
        enableFillHandle={props.enableFillHandle}
        treeData={props.treeData}
        getDataPath={props.getDataPath}
        autoSizeStrategy={{
          type: 'fitCellContents',
        }}
        groupDefaultExpanded={props.groupDefaultExpanded}
        onFirstDataRendered={props.onFirstDataRendered}
        onRowDataUpdated={props.onRowDataUpdated}
        autoGroupColumnDef={props.autoGroupColumnDef}
        onRowGroupOpened={props.onRowGroupOpened}
        //onColumnHeaderContextMenu={onColumnHeaderContextMenu}
        //onColumnEverythingChanged={onColumnEverythingChanged}
        enableBrowserTooltips={true} // 브라우저 기본 툴팁 비활성화
        tooltipShowDelay={100}
        tooltipHideDelay={50000}
        stopEditingWhenCellsLoseFocus={true}
        suppressClickEdit={props.suppressClickEdit}
      />
    </div>
  );
};

function fixedForwardRef<P>(
  render: (props: P, ref: React.Ref<AgGridReact> | null) => JSX.Element,
): (props: P & React.RefAttributes<AgGridReact>) => JSX.Element {
  return forwardRef(render) as (props: P & RefAttributes<AgGridReact>) => JSX.Element;
}

const TunedGrid = fixedForwardRef(InnerTunedGrid);
export default TunedGrid;
