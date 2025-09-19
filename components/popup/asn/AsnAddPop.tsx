import React, { useEffect, useRef, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupLayout } from '../PopupLayout';
import { PopupContent } from '../PopupContent';
import { useAsnMngStore } from '../../../stores/useAsnMngStore';
import TunedGrid from '../../grid/TunedGrid';
import { AsnMngRequestInsert, SkuResponsePaging } from '../../../generated';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import useFilters from '../../../hooks/useFilters';
import { Search, toastError, toastSuccess } from '../../../components';
import { AgGridReact } from 'ag-grid-react';
import { Utils } from '../../../libs/utils';
import { CellKeyDownEvent, ColDef, FullWidthCellKeyDownEvent, IRowNode } from 'ag-grid-community';
import { ConfirmModal } from '../../ConfirmModal';
import { PopupSearchBox, PopupSearchType } from '../content';
import { InputRef } from 'antd';
import CustomGridLoading from '../../CustomGridLoading';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';

// todo 마저 마무리하기, 이어서 공임 dc 영역도 진행하기
const AsnAddPop = () => {
  const queryClient = useQueryClient();

  const [confirmModal, setConfirmModal] = useState(false);

  /** store */
  const [modalType, closeModal, insertAsnsAsExpect] = useAsnMngStore((s) => [s.modalType, s.closeModal, s.insertAsnsAsExpect]);

  /** 검색 조건 타이핑 시 onChangeFilter 호출, filter 상태 변경 */
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters({
    skuNm: '',
  });

  /** 컬럼 정의 */
  const OrderColsForPop: ColDef<SkuResponsePaging>[] = [
    {
      headerCheckboxSelection: false,
      headerName: '선택',
      checkboxSelection: true,
      filter: false,
      sortable: false,
      cellClass: 'stringType',
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      hide: true,
    },
    {
      field: 'no',
      headerName: 'NO',
      minWidth: 50,
      maxWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      minWidth: 290,
      maxWidth: 290,
      suppressKeyboardEvent: () => {
        return false;
      },
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuCd',
      headerName: '상품코드',
      suppressHeaderMenuButton: true,
      hide: true,
    },
    {
      field: 'skuSize',
      headerName: '사이즈',
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      hide: true,
    },
    {
      field: 'skuColor',
      headerName: '색상',
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      hide: true,
    },
  ];

  /** Component 참조 */
  const SkuSearchRef = useRef<InputRef>(null);
  const SkuAmtRef = useRef<HTMLInputElement>(null);
  const RefForGrid = useRef<AgGridReact>(null);

  /**
   * 여러 값 선택 시 current 내의 selected 요소 변경
   * 메인 그리드에 반영되는 값은 init 요소의 일부 (current 는 사용자로 하여금 선택한 행을 분간하도록 배경색을 적용하는데 사용한다)
   * */
  const [searched, setSearchedData] = useState<SkuResponsePaging[]>([]);
  //const [asmAmt, setAsmAmt] = useState(0);

  /** 조건에 해당하는 상품 데이터(row) 조회 */
  const {
    data: skusForAsn,
    isLoading: isSkusForAsnLoading,
    refetch: skuRefetch, // 키 무효화 대신 본 요소 호출하여 refetch
    isSuccess: isSkusForAsnSuccess,
  } = useQuery(
    [],
    () =>
      authApi.get('/sku/paging', {
        params: {
          curPage: 1,
          pageRowCount: 500,
          ...filters,
        },
      }),
    {
      enabled: false,
    },
  );

  useEffect(() => {
    if (filters.skuNm != '' && isSkusForAsnSuccess) {
      // 최초 랜더링 시 기존 검색을 통하여 반환받은 skusForAsn 이 남아있을 수 있으므로 filter.skuNm 값 검증, 최초 랜더링으로 인한 동작일 시 이하 코드는 작동하지 않음
      const { resultCode, body, resultMessage } = skusForAsn.data;
      if (resultCode === 200) {
        setSearchedData(body.rows || []);
        if (body && body.paging) {
          setTimeout(() => {
            RefForGrid.current?.api.setFocusedCell(body.paging.curPage < 0 ? 0 : body.paging.curPage, 'skuNm');
          }, 50);
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [isSkusForAsnSuccess, skusForAsn, isSkusForAsnLoading]);

  const onCellKeyDown = (event: CellKeyDownEvent | FullWidthCellKeyDownEvent) => {
    const keyBoardEvent = event.event as KeyboardEvent;
    //const selectedSkuRows = [];
    if (keyBoardEvent.key === 'Enter') {
      if (RefForGrid.current && RefForGrid.current.api.getSelectedNodes().length == 0) {
        // 선택 없이 특정 행 위에서 엔터키를 사용한 경우
        toastError('선택된 상품이 없습니다.');
      } else {
        setConfirmModal(true);
      }
    }
  };

  const addOperation = () => {
    if (RefForGrid.current && RefForGrid.current.api.getSelectedNodes().length == 0) {
      // 선택 없이 특정 행 위에서 엔터키를 사용한 경우
      toastError('선택된 상품이 없습니다.');
    } else {
      setConfirmModal(true);
    }
  };

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    if (Utils.isEmptyValues({ skuNm: filters.skuNm })) {
      toastError('검색조건을 1개 이상 입력하세요.');
      return;
    }
    await onSearch();
  };

  /** 검색 */
  const onSearch = async () => {
    await skuRefetch(); // 최신화된 필터 사용하여 refetch
  };

  const confirmedAsnAdd = () => {
    const processedForInsert: AsnMngRequestInsert[] = [];
    if (RefForGrid.current && RefForGrid.current.api.getSelectedNodes().length != 0) {
      for (let i = 0; i < RefForGrid.current?.api.getSelectedNodes().length; i++) {
        processedForInsert[i] = {
          skuId: RefForGrid.current?.api.getSelectedNodes()[i].data.skuId,
        };
      }
      insertAsnsAsExpect(processedForInsert).then(async (result) => {
        const { resultCode, resultMessage } = result.data;
        if (resultCode == 200) {
          toastSuccess('추가되었습니다.');
          setConfirmModal(false);
          await queryClient.invalidateQueries(['/asnMng/skuExpectInfo/expected']);
          closeModal('ADD');
        } else {
          console.error(resultMessage);
          toastError('추가 동작 도중 문제가 발생하였습니다.');
        }
      });
    } else {
      console.error('선택된 행 노드를 찾을 수 없음');
    }
  };

  /*const onKeyDownAtConfirmModal = (e: KeyboardEvent) => {
    if (e.key == 'Enter') {
      confirmedAsnAdd();
    }
  };*/

  return (
    <PopupLayout
      width={500}
      isEscClose={false}
      open={modalType.type === 'ADD' && modalType.active}
      title={'상품검색'}
      onClose={() => {
        closeModal('ADD');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" title="추가" onClick={() => addOperation()}>
              추가
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('ADD')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          <PopupSearchType className={'type_1'}>
            <Search.Input
              name={'skuNm'}
              title={'상품명'}
              reference={SkuSearchRef}
              placeholder={'키워드 입력 후 엔터키 클릭'}
              value={filters.skuNm || ''}
              onChange={(name, value) => {
                console.log(value);
                onChangeFilters(name, value);
              }}
              onEnter={search}
            />
          </PopupSearchType>
        </PopupSearchBox>
        <div>
          <div className="gridBox mt10">
            <TunedGrid<SkuResponsePaging>
              colIndexForSuppressKeyEvent={2}
              onGridReady={(e) => {
                e.api.sizeColumnsToFit();
              }}
              rowData={searched}
              columnDefs={OrderColsForPop}
              defaultColDef={defaultColDef}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              onCellKeyDown={(e) => {
                onCellKeyDown(e);
              }}
              preventPersonalizedColumnSetting={true}
              ref={RefForGrid}
              className={'pop check'}
            />
          </div>
        </div>
      </PopupContent>
      <ConfirmModal
        title={'<div class="confirmMsg"><span class="small">발주예정 상품으로</span><span class="big"><strong>추가</strong>&nbsp;하시겠어요?</span></div>'}
        open={confirmModal}
        onConfirm={confirmedAsnAdd}
        onClose={() => setConfirmModal(false)}
      />
    </PopupLayout>
  );
};

export default AsnAddPop;
