import React, { useEffect, useRef, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { GridSetting } from '../../../libs/ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { PopupLayout } from '../PopupLayout';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { toastError, toastSuccess } from '../../ToastMessage';
import TunedGrid from '../../grid/TunedGrid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReceivingHistoryRequestDcAmtUpdate, ReceivingHistoryRequestFactorySpc, ReceivingHistoryResponseDetailItem } from '../../../generated';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import CustomGridLoading from '../../CustomGridLoading';
import { authApi } from '../../../libs';
import { Utils } from '../../../libs/utils';
import { Tooltip } from 'react-tooltip';
import { useReceivingHistoryStore } from '../../../stores/useReceivingHistoryStore';
import { ConfirmModal } from '../../ConfirmModal';

/**
 *  입고내역 거래상세 팝업
 */

const ReceivingHistDtlPop = ({ dtlParam }: { dtlParam: any }) => {
  /** store & state */
  const [modalType, openModal, closeModal, updateDcAmt, upsertFactorySpc] = useReceivingHistoryStore((s) => [
    s.modalType,
    s.openModal,
    s.closeModal,
    s.updateDcAmt,
    s.upsertFactorySpc,
  ]);

  const [rowData, setRowData] = useState<ReceivingHistoryResponseDetailItem[]>([]);
  const [updDataList, setUpdDataList] = useState<ReceivingHistoryRequestDcAmtUpdate[] | undefined>(); // 단가DC 변경 내역 State
  const [confirmModal, setConfirmModal] = useState<boolean>(false);
  const gridRef = useRef<AgGridReact>(null);

  useEffect(() => {
    if (!dtlParam) {
      toastError('내용을 불러오지 못했어요.\n 페이지를 새로고침 후 다시 이용해주세요.');
      closeModal('INOUT_DETAIL');
    }
  }, [dtlParam]);

  /** 상세 조회 */
  const {
    data: loadDetail,
    isLoading,
    isSuccess,
    refetch: detailRefetch,
  } = useQuery(
    ['/receiving-history/detail', dtlParam],
    () =>
      authApi.get('/receiving-history/detail', {
        params: dtlParam,
      }),
    {
      enabled: !!dtlParam,
      refetchOnWindowFocus: false, // 윈도우 포커스시 리패치 비활성화
      refetchOnReconnect: true, // 네트워크 재연결시 리패치
      retry: 1, // 실패시 1회 재시도
    },
  );

  useEffect(() => {
    if (isSuccess) {
      const { resultCode, body, resultMessage } = loadDetail.data;
      if (resultCode === 200) {
        if (body) {
          // console.log('상세내용 응답 >>', body);
          setRowData(body || []);
        } else {
          toastError('거래정보가 없어 잠시 후 다시 이용해주세요');
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [isSuccess, loadDetail]);

  /** 생산처 품목 단가DC 업데이트  */
  const { mutate: upsertFactorySpcMutate } = useMutation(upsertFactorySpc, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        setConfirmModal(false);
        detailRefetch();
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error(err);
      toastError('등록 중 오류가 발생하였습니다.');
    },
  });

  /** 단가DC 적용 업데이트  */
  const queryClient = useQueryClient();
  const { mutate: updateDcAmtMutate } = useMutation(updateDcAmt, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        await queryClient.invalidateQueries(['/receiving-history/paging']);
        closeModal('OUTGOING_CREATE');
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error(err);
      toastError('등록 중 오류가 발생하였습니다.');
    },
  });

  /** 컬럼 정의 */
  const columnDefs: ColDef[] = [
    {
      field: 'inOutType',
      headerName: '유형',
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value.includes('일반') ? params.value.replace('일반', '') : params.value;
      },
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      maxWidth: 180,
      minWidth: 160,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'unitPrice',
      headerName: '단가',
      maxWidth: 100,
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    {
      field: 'quantity',
      headerName: '수량',
      maxWidth: 50,
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    {
      field: 'amount',
      headerName: '금액',
      maxWidth: 120,
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    // {
    //   field: 'orgAsnDcAmt',
    //   hide: true,
    // },
    {
      field: 'asnDcAmt',
      headerName: '단가DC',
      maxWidth: 90,
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      editable: true,
      cellClass: 'editCell',
      onCellValueChanged: (params) => {
        console.log('단가 Params >>', params);
        if (params.newValue === params.oldValue) return; // 값이 변경되지 않았다면 실행하지 않음

        if (isNaN(params.newValue)) {
          toastError('0 이상의 숫자만 입력가능해요.');
          params.node?.setDataValue('asnDcAmt', params.oldValue); // 잘못된 값이면 원래 값으로 되돌리기
          return;
        }
        console.log('params.data.gagongAmt >>', params.data.gagongAmt, params.newValue);
        params.node?.setDataValue('unitPrice', params.data.gagongAmt - params.newValue); // 단가
        params.node?.setDataValue('amount', params.data.quantity > 0 ? (params.data.gagongAmt - params.newValue) * params.data.quantity : 0); // 금액
        // params.node?.setDataValue('asnDcAmt', params.newValue);

        // 사용자가 직접 입력한 경우에만 단가DC 저장 실행
        if (!params.data._isAutoSet) {
          if (params.newValue !== params.data.orgAsnDcAmt) {
            setConfirmModal(true);
          }
        }

        params.data._isAutoSet = false; // 이후 값이 변경되었음을 표시
      },
      valueFormatter: (params) => {
        if (!params.data.asnDcAmt && params.data.factorySpcDcAmt) {
          // 기존 적용된 단가DC가 없을때 생산처단가DC테이블에서 가져온다.
          if (!params.data._isAutoSet) {
            // 자동 설정된 값이 아니라면
            params.node?.setDataValue('asnDcAmt', params.data.factorySpcDcAmt);
            params.data._isAutoSet = true; // 자동 설정된 값임을 표시
          }
          return params.data.factorySpcDcAmt;
        }
        return params.data.asnDcAmt;
      },
    },
  ];

  /** 단가DC 일괄적용 저장 */
  const handleDanDcUpdateConfirm = async () => {
    const gridApi = gridRef.current?.api;
    const focusedCell = gridApi?.getFocusedCell();
    const rowNode = gridApi?.getDisplayedRowAtIndex(focusedCell?.rowIndex as number);

    if (rowNode) {
      const rowData = rowNode.data;
      // 단가DC가 변경된 것만 저장한다.
      if (!rowData.factoryId || !rowData.prodId || isNaN(rowData.asnDcAmt)) {
        toastError('저장할 내용이 없어 다시 확인후 이용해주세요');
      }

      const params: ReceivingHistoryRequestFactorySpc = {
        factoryId: rowData.factoryId,
        prodId: rowData.prodId,
        updDcAmt: rowData.asnDcAmt, // 단가DC
      };
      console.log('단가DC저장 params >>', params);
      upsertFactorySpcMutate(params);
    } else {
      toastError('선택된 항목이 없어 단가DC 저장을 못했어요.');
    }
  };

  /** 저장 이벤트 핸들러 */
  const handleSave = async () => {
    const gridApi = gridRef.current?.api;
    gridApi?.stopEditing(); // 입력도중 저장을 눌렀을때 입력을 마무리 한다

    const paramsArray: ReceivingHistoryRequestDcAmtUpdate[] = [];
    gridApi?.forEachNode((node) => {
      // 기존단가DC가 변경된 것만 저장한다.
      // console.log(node.data.settleId, node.data.orgAsnDcAmt, node.data.asnDcAmt);
      if (node.data && node.data.orgAsnDcAmt !== node.data.asnDcAmt) {
        paramsArray.push({
          settleId: node.data.settleId,
          updDcAmt: node.data.asnDcAmt,
        });
      }
    });
    console.log('저장 params >>', paramsArray);
    if (paramsArray.length > 0) {
      updateDcAmtMutate(paramsArray);
    } else {
      toastError('단가DC가 수정된 내역이 없어요.');
    }
  };

  return (
    <PopupLayout
      width={700}
      isEscClose={false}
      open={modalType.type === 'INOUT_DETAIL' && modalType.active}
      title={'입고상세내역'}
      onClose={() => {
        closeModal('INOUT_DETAIL');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div className="left"></div>
            <div className="right">
              <Tooltip id="my-tooltip" />
              <button
                className="btn btnBlue"
                title="저장"
                data-tooltip-id="my-tooltip"
                data-tooltip-content="단축키는 (F10)입니다."
                data-tooltip-place="top-end"
                onClick={handleSave}
              >
                저장
              </button>
              <button
                className="btn"
                title="닫기"
                onClick={() => {
                  closeModal(modalType.type);
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="gridBox pop">
          <TunedGrid<ReceivingHistoryResponseDetailItem>
            ref={gridRef}
            rowData={rowData ?? []}
            columnDefs={columnDefs}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            preventPersonalizedColumnSetting={true}
            className={'factorySettleDetailPop'}
          />
        </div>
      </PopupContent>
      <ConfirmModal
        title={`해당 제품에 대한 일괄 할인을 적용하시겠습니까?`}
        open={confirmModal}
        onConfirm={handleDanDcUpdateConfirm}
        onClose={() => setConfirmModal(false)}
      />
    </PopupLayout>
  );
};

export default ReceivingHistDtlPop;
