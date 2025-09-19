import React, { useEffect, useRef, useState } from 'react';
import { PopupContent } from '../../PopupContent';
import { PopupFooter } from '../../PopupFooter';
import Loading from '../../../Loading';
import { PopupLayout } from '../../PopupLayout';
import { useTodayStore } from '../../../../stores/useTodayStore';
import { Tooltip } from 'react-tooltip';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { ColDef, IRowNode, TextCellEditor } from 'ag-grid-community';
import { useAgGridApi } from '../../../../hooks';
import useFilters from '../../../../hooks/useFilters';
import { ProductResponsePaging } from '../../../../generated';
import { PagingFilter } from '../../../../stores/useMisongStore';
import { useCommonStore } from '../../../../stores';
import { InputRef } from 'antd';
import { BaseSelectRef } from 'rc-select';
import { DataListOption } from '../../../../types/DataListOptions';
import { Utils } from '../../../../libs/utils';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';

export interface displayedOrderResponsePaging extends ProductResponsePaging {
  //  no: boolean;
  orderAmt?: number;
  productState?: productState;
  totalPrice?: number;
}

// 'sell' | 'refund' | 'beforeDelivery' | 'sample' | 'notDelivered'
export enum productState {
  sell,
  refund,
  beforeDelivery,
  sample,
  notDelivered,
}

export interface purpose {
  purpose: string;
  index?: number;
  searchWord?: string;
}

interface client {
  name?: string;
  value?: string;
}

/**
 * 1000(천) 단위로 콤마(',') 를 추가하는 함수
 * 본 함수 사용으로 인하여 상태로 관리되는 데이터 일부의 문자열 형식의 숫자에 콤마가 추가되는 일이 발생하지 않도록 json 직렬화, 역직렬화(JSON.parse(JSON.stringify(data)))를 통한 깊은 복사 필요
 * 인자로 들어오는 메인 그리드의 data 는 빈 행 없이 온전한 데이터 형태로 들어온다는 전제하에 작성
 */
// export const displayedSearchedData = (displayedOrderResponsePaging: displayedOrderResponsePaging[]) => {
//   const displayed: displayedOrderResponsePaging[] = [];
//   if (displayedOrderResponsePaging) {
//     for (let i = 0; i < displayedOrderResponsePaging.length; i++) {
//       displayed[i] = displayedOrderResponsePaging[i];
//       //displayed[i].sellAmt = displayed[i].sellAmt?.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
//       //displayed[i].totalPrice = displayed[i].totalPrice?.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
//     }
//   }
//   return displayed;
// };

/** 결제거래 팝업 */
export const MisongOrderEditPop = () => {
  const [etcPrintOn, setEtcPrintOn] = useState<boolean>(false); // 비고인쇄 추가하기 버튼
  const cashInp = useRef<any>(null);
  const [tabBtn, setTabBtn] = useState([true, false, false, false, false]); // tab기능 버튼

  // tab 버튼 목록
  const tabLabels = ['판매', '반품', '미송', '샘플', '미출'];

  /** Grid Api */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();

  /** 거래처 조회를 위한 필터 */
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<PagingFilter>({});

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  /** 공통 스토어 - State */
  const [menuUpdYn, menuExcelYn] = useCommonStore((s) => [s.menuUpdYn, s.menuExcelYn]);

  /** 금일내역 스토어 - State */
  const [openModal, modalType, closeModal] = useTodayStore((s) => [s.openModal, s.modalType, s.closeModal]);

  const MainGridRef = useRef<AgGridReact>(null);
  const SearchAreaRef = useRef<InputRef>(null);
  const SelectorRef = useRef<BaseSelectRef>(null);
  const orderAmt = useRef<number>(0); // 수량

  const openPurpose = useRef<purpose>({
    purpose: 'add',
  });
  const selectedClient = useRef<client>({});
  const multiSelectedNodeAtInit = useRef<IRowNode[]>([]);
  const activated = useRef<boolean>(false);

  /** 컬럼 정의 */
  const OrderCols: ColDef<displayedOrderResponsePaging>[] = [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      filter: false,
      sortable: false,
      minWidth: 40,
      maxWidth: 40,
      cellStyle: GridSetting.CellStyle.CENTER,
      hide: true,
    },
    {
      field: 'no',
      headerName: 'NO',
      minWidth: 54,
      maxWidth: 54,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'productState',
      headerName: '상태',
      minWidth: 59,
      maxWidth: 59,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        switch (params.value) {
          case productState.sell:
            return '판매';
          case productState.refund:
            return '반품';
          case productState.beforeDelivery:
            return '미송';
          case productState.sample:
            return '샘플';
          case productState.notDelivered:
            return '미출';
          default:
            return '';
        }
      },
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      minWidth: 132,
      maxWidth: 132,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressKeyboardEvent: (params) => {
        return false;
      },
      editable: (params) => {
        /**
         * 엔터와 같은 특정 키보드 이벤트 발생 시 작동
         * 특정 row, column 교차 지점에서만 셀 수정이 가능토록 함
         * 이 경우는 no 값 부재 시(추가를 위해 비어있는 행) 수정이 가능토록 함
         * */
        return params.node.data?.no == undefined;
      },
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuSize',
      headerName: '사이즈',
      width: 70,
      hide: true,
    },
    {
      field: 'skuColor',
      headerName: '색상',
      minWidth: 90,
      hide: true,
    },
    {
      field: 'sellAmt',
      headerName: '단가',
      minWidth: 79,
      maxWidth: 79,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'orderAmt',
      headerName: '수량',
      minWidth: 59,
      maxWidth: 59,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'totalPrice',
      headerName: '금액',
      minWidth: 80,
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      headerClass: 'header-align-center',
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'dcAmt',
      headerName: '단가DC',
      minWidth: 80,
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      headerClass: 'header-align-center',
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      editable: true,
    },
  ];

  /** 컬럼 설정  */
  const [columnDefs, setColumnDefs] = useState<ColDef[]>(OrderCols);

  /** 본문에 표시될 주문 데이터 */
  const [orderRegData, setOrderRegData] = useState<displayedOrderResponsePaging[]>([]);
  const [clientDataList, setClientDataList] = useState<DataListOption[]>([]);

  /** 전달받은 데이터를 내부적으로 수정 후 setState 수행 */
  const changeProductsState = (currentRef: AgGridReact | null, state: productState, searchedData: displayedOrderResponsePaging[]) => {
    const modifiedData: displayedOrderResponsePaging[] = [...searchedData];
    if (currentRef?.api) {
      const selectedNodes = currentRef?.api.getSelectedNodes();
      for (let i = 0; i < selectedNodes.length; i++) {
        for (let j = 0; j < modifiedData.length; j++) {
          if (modifiedData[j].no == selectedNodes[i].data.no) {
            modifiedData[j].productState = state;
          }
        }
      }
      setOrderRegData(searchedData);
    }
  };

  // 현금입금 포커스
  useEffect(() => {
    if (modalType.active && cashInp.current) {
      cashInp.current.focus();
    }
  }, [modalType.active]);

  // tab 버튼 클릭 핸들러
  const handleTabClick = (e: any, index: number) => {
    setTabBtn(tabBtn.map((state, i) => i === index));
    if (index === 0) {
      changeProductsState(MainGridRef.current, productState.sell, [...orderRegData]);
    } else if (index === 1) {
      changeProductsState(MainGridRef.current, productState.refund, [...orderRegData]);
    } else if (index === 2) {
      changeProductsState(MainGridRef.current, productState.beforeDelivery, [...orderRegData]);
    } else if (index === 3) {
      changeProductsState(MainGridRef.current, productState.sample, [...orderRegData]);
    } else if (index === 4) {
      changeProductsState(MainGridRef.current, productState.notDelivered, [...orderRegData]);
    }
  };

  return (
    <PopupLayout
      width={630}
      isEscClose={true}
      open={modalType.type === 'RELEASEEDIT'}
      title={'주문 수정하기'}
      onClose={() => {
        closeModal('RELEASEEDIT');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn" title="닫기" onClick={() => closeModal('RELEASEEDIT')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="gridBox">
          <div className="gridBoxInfo">
            <div className="left">
              <div className="btnArea mt15">
                {tabLabels.map((label, index) => (
                  <button
                    key={index}
                    data-tooltip-id="my-tooltip"
                    data-tooltip-content={`${label} 버튼 단축키는 (${index + 1})  입니다`}
                    onClick={(e) => handleTabClick(e, index)}
                    className={`btn btnGray ${tabBtn[index] ? 'on' : ''} ${index === 3 ? 'disabled' : ''}`}
                    title={label}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Tooltip id="my-tooltip" />
            <div className="right">
              <div className="btnArea">
                <button className="btn btnGray" title="매장" data-tooltip-id="my-tooltip" data-tooltip-content="매장 버튼입니다">
                  매장
                </button>
                <button className="btn btnGray" title="묶음" data-tooltip-id="my-tooltip" data-tooltip-content="묶음 버튼입니다">
                  묶음
                </button>
                <button className="btn hold" title="보류" data-tooltip-id="my-tooltip" data-tooltip-content="보류 버튼입니다">
                  보류<span>3</span>
                </button>
              </div>
            </div>
          </div>
          <div className={'ag-theme-alpine orderEditPop'}>
            <AgGridReact
              headerHeight={35}
              onGridReady={(params) => {
                onGridReady(params);
              }}
              rowSelection={'multiple'}
              rowData={orderRegData.length ? JSON.parse(JSON.stringify(orderRegData)) : [{}]}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              gridOptions={{ rowHeight: 24 }}
              ref={MainGridRef}
              // onCellKeyDown={(e) => {
              //   onCellKeyDown(e, MainGridRef.current, [...orderRegData]);
              // }}
              onCellEditingStarted={(cellEditingStartedEvent) => {
                orderAmt.current = 0; // 편집 시점에 inventoryAmt 초기화, 타 row 에 값 작성시 기존 데이터가 사용되는 상황 방지
                openPurpose.current.searchWord = ''; // 시점에서 역시 초기화
                /** grid cell 내부 input 요소의 autocomplete 속성을 off 로 처리하고자 작성됨 */
                const cellEditorInstances = cellEditingStartedEvent.api.getCellEditorInstances();
                if (cellEditorInstances.length > 0) {
                  const cellEditorInstance = cellEditorInstances[0] as TextCellEditor;
                  const eInput = cellEditorInstance.getGui().querySelector('input');
                  if (eInput) {
                    eInput.setAttribute('autocomplete', 'off');
                  }
                }
              }}
              onCellEditingStopped={(cellEditingStoppedEvent) => {
                if (cellEditingStoppedEvent.api.getFocusedCell()?.column.getColId() == 'orderAmt') {
                  orderAmt.current = cellEditingStoppedEvent.value;
                }
              }}
              suppressRowClickSelection={true}
              // getRowStyle={getRowStyle}
              getRowClass={(params) => {
                if (params.data.productState == productState.refund) {
                  return 'ag-grid-refund';
                } else if (params.data.productState == productState.beforeDelivery) {
                  return 'ag-grid-beforeDelivery';
                } else if (params.data.productState == productState.sample) {
                  return 'ag-grid-sample';
                } else if (params.data.productState == productState.notDelivered) {
                  return 'ag-grid-notDelivered';
                } else {
                  return '';
                }
              }}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
            />
          </div>
        </div>
      </PopupContent>
      {/*<Loading />*/}
    </PopupLayout>
  );
};
