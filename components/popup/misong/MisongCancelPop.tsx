import React, { useCallback, useEffect, useRef } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupLayout } from '../PopupLayout';
import { PopupContent } from '../PopupContent';
import { useMisongStore } from '../../../stores/useMisongStore';
import { toastError, toastSuccess } from '../../ToastMessage';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { ColDef, RowClassParams } from 'ag-grid-community';
import { MisongJobInfoResponse } from '../../../generated';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import TunedGrid from '../../grid/TunedGrid';
import { AgGridReact } from 'ag-grid-react';

interface MisongCancelPopProps {
  orderDetId: number;
  fetchPopUp: () => void;
}

const MisongCancelPop: React.FC<MisongCancelPopProps> = (props) => {
  const [modalType, closeModal, treatDeliCancel] = useMisongStore((s) => [s.modalType, s.closeModal, s.treatDeliCancel]);
  const gridRef = useRef<AgGridReact>(null);

  const { data: misongList, isSuccess } = useQuery(['/job/selectMisongTranList/' + props.orderDetId], (): any =>
    authApi.get('/job/selectMisongTranList/' + props.orderDetId),
  );

  useEffect(() => {
    if (isSuccess && misongList && misongList.data.body) {
      const lastRequestedJob = misongList.data?.body
        .slice()
        .reverse()
        .find((m: MisongJobInfoResponse) => m.jobStatusNm === '요청');

      if (lastRequestedJob) {
        const gridApi = gridRef.current?.api;

        // 방법 1: forEachNode 사용
        gridApi?.forEachNode((node) => {
          if (node.data.jobDetId === lastRequestedJob.jobDetId) {
            node.setSelected(true);
          }
        });
      }
    }
  }, [isSuccess, misongList]);

  /** 미송처리 */
  const { mutate: treatDeliCancelMutate } = useMutation(treatDeliCancel, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('해제 되었습니다.');
        props.fetchPopUp();
        closeModal('CANCELTRAN');
        /** 새로운 주문을 받을수 있도록 모든 정보(상태) 초기화 */
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  const handleSubmit = () => {
    if (Array.isArray(misongList.data?.body)) {
      if (misongList.data?.body.filter((m: MisongJobInfoResponse) => m.jobStatusNm === '요청').length > 0) {
        const gridApi = gridRef.current?.api;
        const selectedNodes = gridApi?.getSelectedNodes();
        const selectedData = selectedNodes?.map((node) => node.data.jobDetId) || [];
        if (selectedNodes && selectedNodes.filter((node: any) => node.data.jobStatusNm !== '요청').length > 0) {
          toastError('작업 상태가 요청인 건만 처리할 수 있습니다.');
          return false;
        } else {
          treatDeliCancelMutate(selectedData);
        }
      } else {
        toastError('작업 상태가 요청인 건이 존재하지 않습니다.');
      }
    } else {
      toastError('대상건이 존재하지 않습니다.');
    }
  };

  const columnDefs: ColDef<MisongJobInfoResponse>[] = [
    {
      headerCheckboxSelection: true,
      filter: false,
      sortable: false,
      maxWidth: 30,
      minWidth: 30,
      suppressHeaderMenuButton: true,
      checkboxSelection: (params: any) => {
        // 예: jobStatusNm이 '완료'인 경우 체크박스 비활성화
        return params.data.jobStatusNm !== '완료';
        // 또는 여러 조건을 조합할 수도 있습니다
        // return params.data.jobStatusNm !== '완료' && params.data.isActive === true;
      },
    },
    {
      field: 'tranYmd',
      headerName: '발송일자',
      width: 90,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'jobStatusNm',
      headerName: '작업상태',
      width: 90,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'jobCnt',
      headerName: '발송건수',
      width: 90,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
  ];

  const getRowClass = useCallback((params: RowClassParams) => {
    if (params.data.jobStatusNm != '요청') {
      return 'ag-grid-pinned-row';
    } else {
      return '';
    }
  }, []);

  useEffect(() => {
    console.log(misongList?.data.body);
  }, [misongList]);

  return (
    <PopupLayout
      width={420}
      isEscClose={true}
      open={modalType.type === 'CANCELTRAN' && modalType.active}
      title={'발송해제'}
      onClose={() => {
        closeModal('CANCELTRAN');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" onClick={handleSubmit}>
              확인
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('CANCELTRAN')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="gridBox">
          <TunedGrid<MisongJobInfoResponse>
            ref={gridRef}
            className={'pop'}
            headerHeight={35}
            onGridReady={(e) => {
              e.api.sizeColumnsToFit();
            }}
            rowData={(misongList?.data.body as MisongJobInfoResponse[]) || []}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            gridOptions={{
              rowHeight: 24,
            }}
            getRowClass={getRowClass}
          />
        </div>
      </PopupContent>
      <div>※ 작업상태가 [요청]인 것만 해제 됩니다.</div>
    </PopupLayout>
  );
};

export default MisongCancelPop;
