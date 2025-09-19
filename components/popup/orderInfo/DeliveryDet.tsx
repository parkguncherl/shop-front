import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import TunedGrid from '../../grid/TunedGrid';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import CustomGridLoading from '../../CustomGridLoading';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import { PopupLayout } from '../PopupLayout';
import React, { useMemo, useRef } from 'react';
import { useDeliveryStore } from '../../../stores/useDeliveryStore';
import { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { Table } from '../../content';
import { useStoreReqStore } from '../../../stores/useStoreReqStore';
import { toastError, toastSuccess } from '../../ToastMessage';

export const DeliveryDet = () => {
  /** 출고 관련 전역 상태 */
  const [modalType, closeModal, selectedPagingElement] = useDeliveryStore((s) => [s.modalType, s.closeModal, s.selectedPagingElement]);
  const [updateStoreReq] = useStoreReqStore((s) => [s.updateStoreReq]);
  const queryClient = useQueryClient();

  /** 컬럼 정의 */
  const DeliveryDetPopCols = useMemo<ColDef[]>(
    () => [
      {
        headerCheckboxSelection: false,
        headerName: '선택',
        checkboxSelection: true,
        filter: false,
        sortable: false,
        cellClass: 'stringType',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        hide: true,
      },
      {
        field: 'no',
        headerName: '#',
        minWidth: 40,
        maxWidth: 40,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'jobTypeNm',
        headerName: '유형',
        maxWidth: 80,
        minWidth: 80,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuNm',
        headerName: '상품명',
        maxWidth: 180,
        minWidth: 180,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'jobCnt',
        headerName: '지시수량',
        maxWidth: 80,
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        editable: true,
      },
      {
        field: 'binblurCnt',
        headerName: '빈블러',
        maxWidth: 70,
        minWidth: 70,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'sellerCnt',
        headerName: '매장',
        maxWidth: 70,
        minWidth: 70,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'inventoryYn',
        headerName: '재고',
        maxWidth: 60,
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'asn',
        headerName: 'ASN',
        maxWidth: 60,
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
    ],
    [],
  );

  /** Component 참조 */
  const RefForGrid = useRef<AgGridReact>(null);

  const { data: deliveryList, refetch: deliveryRefetch } = useQuery(['/orderInfo/delivery/det', selectedPagingElement.jobId], (): any =>
    authApi.get('/orderInfo/delivery/det', {
      params: {
        jobId: selectedPagingElement.jobId,
        jobType: selectedPagingElement.jobType,
      },
    }),
  );

  const { mutate: updateStoreReqMutate } = useMutation(updateStoreReq, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('수정되었습니다.');
          await queryClient.invalidateQueries(['/orderInfo/delivery/det', selectedPagingElement.jobId]);
        } else {
          toastError(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  return (
    <PopupLayout
      width={800}
      isEscClose={true}
      open={modalType.type === 'DET' && modalType.active}
      title={
        (selectedPagingElement.sellerNm || '소매처 정보 없음') +
        ' (' +
        (selectedPagingElement.jobTypeNm || '작업유형 정보 없음') +
        ') - ' +
        (selectedPagingElement.tranYmd || '예정일 정보 없음') +
        ' ' +
        ('#' + selectedPagingElement.no)
      }
      subTitle={selectedPagingElement.deliveryEtc === null ? '※보류내용 : 없음' : '※보류내용 : ' + selectedPagingElement.deliveryEtc}
      onClose={() => {
        closeModal('DET');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button
              className="btn cancle"
              title="수정"
              onClick={() => {
                if (RefForGrid.current) {
                  RefForGrid.current.api.stopEditing(false);
                  const modifiedData: any[] = [];
                  RefForGrid.current.api.forEachNode((node) => {
                    modifiedData.push(node.data); // 모든 행 데이터 수집
                  });
                  console.log('수정된 데이터:', modifiedData);
                  updateStoreReqMutate(modifiedData);
                }
              }}
            >
              수정
            </button>

            <button className="btn" title="닫기" onClick={() => closeModal('DET')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="tblBox">
          <table></table>
        </div>
        <Table>
          <TunedGrid
            onGridReady={(e) => {
              e.api.sizeColumnsToFit();
            }}
            rowData={deliveryList?.data.body || []}
            columnDefs={DeliveryDetPopCols}
            defaultColDef={defaultColDef}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            onRowClicked={(e) => {
              console.log(e.data);
            }}
            onCellKeyDown={(e) => {
              // todo
            }}
            ref={RefForGrid}
            className={'pop'}
            singleClickEdit={true}
          />
        </Table>
      </PopupContent>
    </PopupLayout>
  );
};
