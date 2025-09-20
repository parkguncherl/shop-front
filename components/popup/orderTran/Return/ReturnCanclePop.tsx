import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';
import { PopupLayout } from '../../PopupLayout';
import { useStoreReturnStore } from '../../../../stores/useStoreReturnStore';
import { ColDef } from 'ag-grid-community';
import { StoreRequestReqUpdate, StoreResponseReqPaging } from '../../../../generated';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { useRef } from 'react';

interface Props {
  selectedData: StoreResponseReqPaging[] | [];
}

/** 반납 취소 */
const ReturnCanclePop = ({ selectedData }: Props) => {
  const [openModal, modalType, closeModal, updateReturn] = useStoreReturnStore((s) => [s.openModal, s.modalType, s.closeModal, s.updateReturn]);
  const gridRef = useRef<AgGridReact>(null);
  const columnDefs: ColDef[] = [
    {
      field: 'skuNm',
      headerName: '상품명',
      minWidth: 200,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
    },
    { field: 'partnerInventoryAmt', headerName: '매장', minWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'skuCnt', headerName: '반납예정', minWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    {
      field: 'updateSkuCnt',
      headerName: '반납취소',
      minWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      editable: (params) => !(params.node?.rowPinned === 'bottom'),
      cellClass: (params) => {
        return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
      },
      valueGetter: (params) => {
        // updateSkuCnt 값을 가져옵니다.
        return params.data.updateSkuCnt !== undefined ? params.data.updateSkuCnt : params.data.skuCnt;
      },
      valueSetter: (params) => {
        const newValue = params.newValue;
        if (newValue !== undefined && newValue !== null) {
          // 수정된 값을 updateSkuCnt에 반영
          params.data.updateSkuCnt = newValue;
          return true; // 값 반영
        }
        return false; // 값이 없으면 수정하지 않음
      },
      valueParser: (params) => {
        // 숫자만 허용
        const parsedValue = parseInt(params.newValue, 10);
        return isNaN(parsedValue) ? 0 : parsedValue; // 숫자가 아니면 0 반환
      },
    },
  ];

  /** 편집모드 설정 */
  const gridOptions = {
    rowHeight: 24,
    onGridReady: (params: any) => {
      // 첫 번째 행과 updateSkuCnt을 자동으로 편집 상태로 설정
      const firstRowIndex = 0; // 첫 번째 행의 인덱스
      // 편집 모드 시작 (firstRowIndex와 updateSkuCnt 컬럼으로 지정)
      params.api.startEditingCell({
        rowIndex: firstRowIndex,
        colKey: 'updateSkuCnt',
      });
    },
  };

  /** 반납 취소 */
  const queryClient = useQueryClient();
  const { mutate: updateReturnMutate, isLoading } = useMutation(updateReturn, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('반납 취소되었습니다.');
        await queryClient.invalidateQueries(['/store/stock/paging']);
        closeModal('RETURNCANCLE');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  const handleSubmit = () => {
    gridRef.current?.api.stopEditing();
    const allRowData = gridRef.current?.api.getRenderedNodes().map((node: any) => {
      const rowData = node.data;

      // updateSkuCnt가 설정되지 않았다면 기본값을 skuCnt로 설정
      if (rowData.updateSkuCnt === undefined || rowData.updateSkuCnt === null) {
        rowData.updateSkuCnt = rowData.skuCnt;
      }
      rowData.updateType = 1; // 반납취소

      return rowData;
    });

    // 각 행에 대해 반납예정 수와 반납취소 수 비교
    allRowData?.forEach((rowData) => {
      const skuCnt = rowData.skuCnt || 0; // 반납예정 수
      const updateSkuCnt = rowData.updateSkuCnt || 0; // 반납취소 수

      // 반납취소 수가 반납예정 수보다 크면 오류 처리
      if (updateSkuCnt > skuCnt) {
        toastError('반납취소 수가 반납예정 수보다 많을 수 없습니다.');
        return;
      }
    });

    // console.log('전체 데이터:', allRowData);
    updateReturnMutate(allRowData as StoreRequestReqUpdate[]);
  };

  return (
    <PopupLayout
      width={500}
      isEscClose={true}
      open={modalType.type === 'RETURNCANCLE'}
      title={'반납 취소'}
      onClose={() => {
        closeModal('RETURNCANCLE');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" title="확인" onClick={handleSubmit}>
              확인
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('RETURNCANCLE')}>
              취소
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="gridBox">
          <div className={'ag-theme-alpine pop'}>
            <AgGridReact
              ref={gridRef}
              headerHeight={35}
              rowSelection={'multiple'}
              rowData={selectedData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              gridOptions={gridOptions}
              suppressRowClickSelection={true}
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

export default ReturnCanclePop;
