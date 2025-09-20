import { PopupContent, PopupFooter, PopupLayout } from '../../../popup';
import { PickingHistoryResponseResponse } from '../../../../generated';
import TunedGrid from '../../../grid/TunedGrid';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import { PickingHistoryResponseDet } from '../../../../generated';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { authApi } from '../../../../libs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { ConfirmModal } from '../../../ConfirmModal';
import { cancelPickingJob } from '../../../../api/wms-api';

interface Props {
  jobId?: number;
  active?: boolean; // 모달 활성화 여부
  onClose?: () => void;
}

/**
 * 출고이력 상세정보 팝업
 * /components/wms/chulgo/pickingHistory/PickingHistoryDetPop
 */

export const PickingHistoryDetPop = (props: Props) => {
  const onGridReady = (event: GridReadyEvent<PickingHistoryResponseResponse, any>) => {
    event.api.sizeColumnsToFit();
  };

  // ref
  const RefForGrid = useRef<AgGridReact>(null);
  const queryClient = useQueryClient();

  /** 상세 목록 상태 */
  const [pickingHistoryDetList, setPickingHistoryDetList] = useState<PickingHistoryResponseDet[]>([]);

  const [openedModal, setOpenedModal] = useState<string | undefined>(undefined);

  /** 컬럼 정의 */
  const SkuListColsForPop = useMemo<ColDef<PickingHistoryResponseDet>[]>(
    () => [
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
        maxWidth: 200,
        minWidth: 200,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'pickingCnt',
        headerName: '피킹',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'completedCnt',
        headerName: '빈블러',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'maeJangCnt',
        headerName: '매장분',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'zoneDesc',
        headerName: 'ZONE',
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'locAlias',
        headerName: 'LOCATION',
        minWidth: 150,
        maxWidth: 150,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
    ],
    [],
  );

  // 출고정보 목록 조회
  const {
    data: pickingHistoryDet,
    isLoading: isPickingHistoryDetLoading,
    isSuccess: isPickingHistoryDetSuccess,
    refetch: refetchPickingHistoryDet,
  } = useQuery(['/wms/pickingHistory/det', props.active], (): any => authApi.get(`/wms/pickingHistory/det/${props.jobId}`, {}), {
    enabled: props.jobId != undefined && props.jobId != 0,
  });

  useEffect(() => {
    if (isPickingHistoryDetSuccess) {
      const { resultCode, body, resultMessage } = pickingHistoryDet.data;
      if (resultCode === 200) {
        setPickingHistoryDetList(body || []);
      } else {
        toastError(resultMessage || '출고 목록 조회 정보가 없습니다.');
      }
    }
  }, [pickingHistoryDet, isPickingHistoryDetSuccess]);

  useEffect(() => {
    if (props.active) {
      if (props.jobId == undefined) {
        toastError('유효한 jobId 를 찾을 수 없습니다.');
      }
    }
  }, [props.active]);

  // 부분 출고 처리
  const { mutate: cancelPickingJobMutate } = useMutation(cancelPickingJob, {
    onSuccess: async (e) => {
      if (e?.data.resultCode === 200) {
        await queryClient.invalidateQueries(['/wms/pickingHistory/list']);
        toastSuccess('취소처리 하였습니다.');
        if (props.onClose) {
          props.onClose();
        }
      } else {
        toastError(e?.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error('출고 취소 처리 중 오류:', err);
      toastError('출고취소 처리 중 오류가 발생하였습니다.');
    },
  });

  return (
    <PopupLayout
      width={812}
      open={props.active || false}
      title={'출고이력 상세보기'}
      onClose={() => {
        if (props.onClose) {
          props.onClose();
        }
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button
              className="btn"
              title="피킹 취소"
              onClick={() => {
                setOpenedModal('pickingCancel');
              }}
            >
              피킹 취소
            </button>
            <button
              className="btn"
              title="닫기"
              onClick={() => {
                if (props.onClose) {
                  props.onClose();
                }
              }}
            >
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <TunedGrid
          onGridReady={onGridReady}
          columnDefs={SkuListColsForPop}
          rowData={pickingHistoryDetList}
          defaultColDef={defaultColDef}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          /*onRowClicked={(e) => {
            console.log(e.data);
            setTimeout(() => {
              console.log('selectedSkuList.current[' + selectedCount + ']', selectedSkuList.current);
            }, 1000);
          }}*/
          ref={RefForGrid}
          preventPersonalizedColumnSetting={true}
          className={'default check'}
        />
      </PopupContent>
      <ConfirmModal
        title={'<div class="confirmMsg"><span class="small">해당 작업을 피킹 취소할 시 전체 전표가 취소 됩니다.</span></div>'}
        open={openedModal == 'pickingCancel'}
        onConfirm={() => {
          cancelPickingJobMutate(props.jobId);
        }}
        onClose={() => setOpenedModal(undefined)}
      />
    </PopupLayout>
  );
};
