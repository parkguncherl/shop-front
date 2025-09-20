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
import { useRef } from 'react';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Props {
  selectedData: StoreResponseReqPaging[] | [];
}

/** 반납 확정 */
const ReturnConfirmPop = ({ selectedData }: Props) => {
  /** store */
  const [openModal, modalType, closeModal, updateReturn] = useStoreReturnStore((s) => [s.openModal, s.modalType, s.closeModal, s.updateReturn]);
  const gridRef = useRef<AgGridReact>(null);

  const columnDefs: ColDef[] = [
    {
      field: 'skuNm',
      headerName: '상품명',
      minWidth: 200,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
      valueGetter: (params) => {
        if (!params.node?.rowPinned) {
          return params.data.skuNm?.split('.')[0] || params.data.skuNm;
        } else {
          return params.data.skuNm;
        }
      },
    },
    { field: 'skuColor', headerName: '색상', minWidth: 50, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'skuSize', headerName: '사이즈', minWidth: 50, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    {
      field: 'skuCnt',
      headerName: '반납확정',
      minWidth: 50,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
  ];

  /** 반납 확정 */
  const queryClient = useQueryClient();
  const { mutate: updateReturnMutate, isLoading } = useMutation(updateReturn, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('반납 확정되었습니다.');
        await queryClient.invalidateQueries(['/store/stock/paging']);
        closeModal('RETURNCONFIRM');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  const handleSubmit = () => {
    const allRowData = gridRef.current?.api.getRenderedNodes().map((node: any) => {
      const rowData = node.data;
      rowData.updateType = 2; // 반납확정
      return rowData;
    });

    console.log('전체 데이터:', allRowData);
    updateReturnMutate(allRowData as StoreRequestReqUpdate[]);
  };
  return (
    <PopupLayout
      width={500}
      isEscClose={true}
      open={modalType.type === 'RETURNCONFIRM'}
      title={'반납 확정'}
      onClose={() => {
        closeModal('RETURNCONFIRM');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" title="확인" onClick={handleSubmit}>
              확인
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('RETURNCONFIRM')}>
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
              gridOptions={{ rowHeight: 24 }}
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

export default ReturnConfirmPop;
