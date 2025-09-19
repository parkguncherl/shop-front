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
import { useQuery } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { ConfirmModal } from '../../../ConfirmModal';
import { changeInven } from '../../../../api/wms-api';
import { useJobStore } from '../../../../stores/useJobStore';
import { Input } from 'antd';

interface Props {
  selectedRowData: PickingHistoryResponseResponse | undefined;
  active?: boolean; // 모달 활성화 여부
  onClose?: (trigger?: 'refetch') => void;
}

/**
 * 출고이력 상세정보 팝업
 * /components/wms/chulgo/pickingHistory/PickingBoryuRegPop
 */

export const PickingBoryuRegPop = (props: Props) => {
  const onGridReady = (event: GridReadyEvent<PickingHistoryResponseResponse, any>) => {
    event.api.sizeColumnsToFit();
  };

  // ref
  const RefForGrid = useRef<AgGridReact>(null);

  /** 전역 상태 */
  const [updateJob] = useJobStore((s) => [s.updateJob]);

  /** 상세 목록 상태 */
  const [pickingHistoryDetList, setPickingHistoryDetList] = useState<PickingHistoryResponseDet[]>([]);
  const [boryuCntn, setBoryuCntn] = useState<string>('');

  const [openedModal, setOpenedModal] = useState<string | undefined>(undefined);
  const [changedValueInfo, setChangedValueInfo] = useState<
    | {
        column: string;
        oldValue: number | string | undefined;
        newValue: number | string | undefined;
        otherInfo?: PickingHistoryResponseDet;
      }
    | undefined
  >(undefined);

  // 출고상세 목록 조회
  const {
    data: pickingHistoryDet,
    isLoading: isPickingHistoryDetLoading,
    isSuccess: isPickingHistoryDetSuccess,
    refetch: refetchPickingHistoryDet,
  } = useQuery(['/wms/pickingHistory/det', props.active], (): any => authApi.get(`/wms/pickingHistory/det/${props.selectedRowData?.jobId}`, {}), {
    enabled: props.selectedRowData?.jobId != undefined && props.selectedRowData?.jobId != 0,
  });

  useEffect(() => {
    if (isPickingHistoryDetSuccess) {
      const { resultCode, body, resultMessage } = pickingHistoryDet.data;
      if (resultCode === 200) {
        setPickingHistoryDetList(body || []);
      } else {
        toastError(resultMessage || '출고상세 목록 조회 정보가 없습니다.');
      }
    }
  }, [pickingHistoryDet, isPickingHistoryDetSuccess]);

  useEffect(() => {
    if (props.active) {
      if (props.selectedRowData?.jobId == undefined) {
        toastError('유효한 jobId 를 찾을 수 없습니다.');
      }
    }
  }, [props.active]);

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
        minWidth: 50,
        maxWidth: 50,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'completedCnt',
        headerName: '완료',
        minWidth: 50,
        maxWidth: 50,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'zoneDesc',
        headerName: 'ZONE',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'locAlias',
        headerName: 'LOCATION',
        minWidth: 120,
        maxWidth: 120,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'cntInComputer',
        headerName: '전산재고',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'cntInReal',
        headerName: '실물재고',
        minWidth: 60,
        maxWidth: 60,
        editable: true,
        onCellValueChanged: (event) => {
          if (event.newValue != null && !isNaN(Number(event.newValue))) {
            if (Number(event.newValue) >= 0) {
              setOpenedModal('chgStockCnt');
              setChangedValueInfo({
                column: event.column.getColId(),
                oldValue: event.oldValue,
                newValue: event.newValue,
                otherInfo: {
                  locId: event.data.locId,
                  skuId: event.data.skuId,
                  jobDetId: event.data.jobDetId,
                },
              });
            } else {
              event.node?.setDataValue('cntInReal', event.oldValue);
              toastError('0보다 작은 값은 입력할 수 없습니다.');
            }
          } else {
            event.node?.setDataValue('cntInReal', event.oldValue);
            toastError('숫자가 아닌 값은 입력할 수 없습니다.');
          }
        },
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'declineCnt',
        headerName: '감소건수',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
    ],
    [],
  );

  return (
    <PopupLayout
      width={880}
      isEscClose={true}
      open={props.active || false}
      title={'출고보류 등록'}
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
              title="등록"
              disabled={props.selectedRowData?.jobStatCd == '9' || props.selectedRowData?.boryuStatCd == '2'}
              onClick={() => {
                setOpenedModal('reg');
              }}
            >
              등록
            </button>
            <button
              className="btn"
              title="등록취소"
              disabled={props.selectedRowData?.jobStatCd != '9' || props.selectedRowData?.boryuStatCd == '2'}
              onClick={() => {
                setOpenedModal('regCancel');
              }}
            >
              등록취소
            </button>
            <button
              className="btn"
              title="취소"
              onClick={() => {
                if (props.onClose) {
                  props.onClose();
                }
              }}
            >
              취소
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
          ref={RefForGrid}
          preventPersonalizedColumnSetting={true}
          className={'default check'}
        />
      </PopupContent>
      <ConfirmModal
        title={'<div class="confirmMsg"><span class="small">재고 수량을 변경하시겠습니까?</span></div>'}
        open={openedModal == 'chgStockCnt'}
        onConfirm={() => {
          // 수량 변경 요청
          if (changedValueInfo?.otherInfo) {
            changeInven({
              locId: changedValueInfo.otherInfo.locId,
              skuId: changedValueInfo.otherInfo.skuId,
              befCnt: changedValueInfo.oldValue as number,
              aftCnt: changedValueInfo.newValue as number,
              invenChgCd: 'E',
              jobDetId: changedValueInfo.otherInfo.jobDetId,
            }).then((result) => {
              const { resultCode, resultMessage } = result.data;
              if (resultCode === 200) {
                toastSuccess('재고 정보가 수정되었습니다.');
              } else {
                toastError(resultMessage);
              }
              // 성공, 실패 여부에 상관없이 행하여질 동작들
              refetchPickingHistoryDet();
              setOpenedModal(undefined);
              setChangedValueInfo(undefined);
            });
          } else {
            console.error('변경에 필요한 데이터를 찾을 수 없음');
          }
        }}
        onClose={() => {
          refetchPickingHistoryDet();
          setOpenedModal(undefined);
          setChangedValueInfo(undefined);
        }}
      />
      <ConfirmModal
        title2={
          <>
            <span className={'confirmMsg strong'}>출고보류등록</span>
            <Input className={`formBox border`} value={boryuCntn} onChange={(e) => setBoryuCntn(e.target.value)} placeholder="보류사유를 반드시 입력하세요" />
          </>
        }
        open={openedModal == 'reg'}
        onConfirm={() => {
          // 출고 보류 등록 동작
          if (props.selectedRowData) {
            if (props.selectedRowData?.jobId) {
              if (!boryuCntn) {
                toastError('출고보류사유를 입력하지 않으셨습니다.');
                return;
              }

              updateJob({
                id: props.selectedRowData?.jobId,
                jobStatCd: '9', // 10190 '09' -> 출고보류
                jobEtc: boryuCntn,
                boryuStatCd: '1', // 요청
              }).then((result) => {
                const { resultCode, resultMessage } = result.data;
                if (resultCode === 200) {
                  toastSuccess('출고 보류 등록되었습니다.');
                  setOpenedModal(undefined);
                  if (props.onClose) {
                    props.onClose('refetch');
                  }
                } else {
                  toastError(resultMessage);
                }
              });
            } else {
              console.error('작업 id 를 찾을 수 없음');
            }
          } else {
            console.error('선택된 행을 찾을 수 없음');
          }
        }}
        onClose={() => {
          setOpenedModal(undefined);
        }}
      />
      <ConfirmModal
        title={'<div class="confirmMsg"><span class="small">출고보류를 취소하시겠습니까?</span></div>'}
        open={openedModal == 'regCancel'}
        onConfirm={() => {
          // 출고 보류 등록 동작
          if (props.selectedRowData) {
            if (props.selectedRowData?.jobId) {
              updateJob({
                id: props.selectedRowData?.jobId,
                jobStatCd: '5', // 10190 '09' -> 출고보류=> 출고완료
                boryuStatCd: '9', // 보류취소
              }).then((result) => {
                const { resultCode, resultMessage } = result.data;
                if (resultCode === 200) {
                  toastSuccess('출고 보류 취소되었습니다.');
                  setOpenedModal(undefined);
                  if (props.onClose) {
                    props.onClose('refetch');
                  }
                } else {
                  toastError(resultMessage);
                }
              });
            } else {
              console.error('작업 id 를 찾을 수 없음');
            }
          } else {
            console.error('선택된 행을 찾을 수 없음');
          }
        }}
        onClose={() => {
          setOpenedModal(undefined);
        }}
      />
    </PopupLayout>
  );
};
