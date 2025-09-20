import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';
import { PopupLayout } from '../../PopupLayout';
import { useStoreReturnStore } from '../../../../stores/useStoreReturnStore';
import { ColDef } from 'ag-grid-community';
import { StoreResponseReqPaging } from '../../../../generated';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../../ToastMessage';

interface Props {
  selectedData: StoreResponseReqPaging[] | [];
}

/** 수정 확인 */
const ReturnEditConfirmPop = ({ selectedData }: Props) => {
  const [openModal, modalType, closeModal, updateReturn] = useStoreReturnStore((s) => [s.openModal, s.modalType, s.closeModal, s.updateReturn]);
  const gridRef = useRef<AgGridReact>(null);
  const columnDefs: ColDef[] = [
    {
      field: 'skuNm',
      headerName: '상품명',
      minWidth: 150,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
    },
    { field: 'skuCnt', headerName: '반납확정', minWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'stockCnt', headerName: '입하완료', minWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'lossCnt', headerName: '로스', minWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    {
      field: 'partnerInventoryAmt',
      headerName: '매장재고',
      minWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        const skuCnt = params.data?.skuCnt || 0;
        const stockCnt = params.data?.stockCnt || 0;
        const value = skuCnt - stockCnt;

        if (value < 0) {
          return `- ${Math.abs(value)}`; // 음수일 경우 -를 붙여서 표시
        } else if (value > 0) {
          return `+ ${value}`; // 양수일 경우 +를 붙여서 표시
        }
        return `${value}`; // 0일 경우 그대로 표시
      },
      cellClass: (params) => {
        const skuCnt = params.data?.skuCnt || 0;
        const stockCnt = params.data?.stockCnt || 0;
        const value = skuCnt - stockCnt;

        return value < 0 ? 'txtRed' : value > 0 ? 'txtBlue' : '';
      },
    },
  ];

  // 수정이 아닌것 거르기
  const [editConfirmData, setEditConfirmData] = useState<StoreResponseReqPaging[]>([]);
  useEffect(() => {
    const mismatchedRows = selectedData.filter((item: any) => item.returnRefund === '수정');
    setEditConfirmData(mismatchedRows);
  }, [selectedData]);

  /** 반납 취소 */
  const queryClient = useQueryClient();
  const { mutate: updateReturnMutate, isLoading } = useMutation(updateReturn, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('수정 확인되었습니다.');
        await queryClient.invalidateQueries(['/store/confirm/paging']);
        closeModal('RETURNCANCLE');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  const handleSubmit = () => {
    const updatedData: any[] = [];

    gridRef.current?.api.forEachNode((node) => {
      const { id, reqStatCd } = node.data; // id와 reqStatCd 추출
      updatedData.push({
        id,
        reqStatCd: 'C', // reqStatCd 값을 'C'로 변경
      });
    });
    updateReturnMutate(updatedData);
  };

  return (
    <PopupLayout
      width={500}
      isEscClose={true}
      open={modalType.type === 'EDITCONFIRM'}
      title={'수정 확인'}
      onClose={() => {
        closeModal('EDITCONFIRM');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" title="확인" onClick={handleSubmit}>
              확인
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
              rowData={editConfirmData}
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

export default ReturnEditConfirmPop;
