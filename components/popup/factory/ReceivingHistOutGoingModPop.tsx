import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CellValueChangedEvent, ColDef } from 'ag-grid-community';
import { GridSetting } from '../../../libs/ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { PopupLayout } from '../PopupLayout';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { toastError, toastSuccess } from '../../ToastMessage';
import TunedGrid from '../../grid/TunedGrid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FactoryResponseSelectList,
  ReceivingHistoryRequestDcAmtUpdate,
  ReceivingHistoryRequestOutGoingDelete,
  ReceivingHistoryResponseOutGoingDetail,
} from '../../../generated';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import CustomGridLoading from '../../CustomGridLoading';
import { authApi } from '../../../libs';
import { Utils } from '../../../libs/utils';
import { Tooltip } from 'react-tooltip';
import { useReceivingHistoryStore } from '../../../stores/useReceivingHistoryStore';
import { Table } from '../../content';
import { TableHeader } from '../../TableHeader';
import { fetchFactories } from '../../../api/wms-api';
import CustomTooltip from '../../CustomTooltip';
import { DeleteConfirmModal } from '../../DeleteConfirmModal';

/**
 *  입고내역 반출수정 팝업
 */

const ReceivingHistOutGoingModPop = ({ dtlParam }: { dtlParam: any }) => {
  /** store & state */
  const [modalType, openModal, closeModal, updateOutGoing, deleteOutGoing] = useReceivingHistoryStore((s) => [
    s.modalType,
    s.openModal,
    s.closeModal,
    s.updateOutGoing,
    s.deleteOutGoing,
  ]);
  const [row, setRow] = useState<ReceivingHistoryResponseOutGoingDetail[]>([]);
  const [outGoingType, setOutGoingType] = useState<string>();
  const [delRow, setDelRow] = useState<ReceivingHistoryResponseOutGoingDetail>(); // 삭제대상

  const gridRef = useRef<AgGridReact>(null);

  useEffect(() => {
    if (!dtlParam) {
      toastError('반출상품수정할 정보가 없어 다시 이용해주세요.');
      closeModal('OUTGOING_UPDATE');
    }
  }, []);

  /** 공장옵션 조회 */
  const [factoryOption, setFactoryOption] = useState<any>([]);
  const { data: factories, isSuccess: isFetchFactorySuccess, refetch } = useQuery(['fetchFactories'], fetchFactories);
  useEffect(() => {
    if (isFetchFactorySuccess && factories) {
      const { resultCode, body, resultMessage } = factories.data;
      if (resultCode === 200) {
        const factoryCodes = body?.map((item: FactoryResponseSelectList) => ({
          key: item.id,
          value: item.id,
          label: item.compNm,
        }));

        setFactoryOption(factoryCodes);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchFactorySuccess, factories]);

  /** 반출상품 수정 정보 조회 */
  const {
    data: loadData,
    isLoading,
    isSuccess: isDetailSuccess,
    refetch: detailRefetch,
  } = useQuery(
    ['/receiving-history/ouggoing/detail', dtlParam],
    () =>
      authApi.get('/receiving-history/ouggoing/detail', {
        params: dtlParam,
      }),
    {
      refetchOnWindowFocus: false, // 윈도우 포커스시 리패치 비활성화
      refetchOnReconnect: true, // 네트워크 재연결시 리패치
      retry: 1, // 실패시 1회 재시도
    },
  );

  useEffect(() => {
    if (isDetailSuccess) {
      const { resultCode, body, resultMessage } = loadData.data;
      if (resultCode === 200) {
        if (body) {
          setRow(body);
          console.log('body >>', body);
          setOutGoingType(body[0].inOutType);
        } else {
          toastError('반출상품 수정 정보가 없어 잠시 후 다시 이용해주세요');
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [isDetailSuccess, loadData]);

  /** 반출상품수정 */
  const queryClient = useQueryClient();
  const { mutate: updateOutGoingMutate } = useMutation(updateOutGoing, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        await queryClient.invalidateQueries(['/receiving-history/paging']);
        closeModal('OUTGOING_UPDATE');
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error(err);
      toastError('수정 중 오류가 발생하였습니다.');
    },
  });

  /** 결제거래 삭제 */
  const { mutate: removeOutGoingMutate, isLoading: isRemoveLoading } = useMutation(deleteOutGoing, {
    onSuccess: async (e) => {
      try {
        const { resultCode, resultMessage } = e.data;
        if (resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          await queryClient.invalidateQueries(['/receiving-history/paging']);
          detailRefetch();
          setModalOpen(false);
        } else {
          toastError(resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** Grid 컬럼 정의 */
  const columnDefs: ColDef[] = [
    {
      field: 'no',
      headerName: 'No.',
      width: 40,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'factoryNm',
      headerName: '반출처',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      width: 160,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      // filter: 'agSetColumnFilter',
    },
    {
      field: 'orgAmt',
      headerName: '판매원가',
      width: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    {
      field: 'centerInventoryCnt',
      headerName: '빈블러',
      width: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    {
      field: 'partnerInventoryCnt',
      headerName: '매장',
      width: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    {
      field: 'inpOutGoingCnt',
      headerName: '반출',
      width: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellClass: 'editCell',
      editable: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
      tooltipComponent: CustomTooltip,
      tooltipValueGetter: (params) => {
        if (params.data?.inpOutGoingCnt > params.data.partnerInventoryCnt) return '매장재고수량에 대해 반출처리가 가능해요.';
      },
    },
    // {
    //   field: 'outGoingFactoryId',
    //   headerName: '반출처ID[API전달값]',
    //   hide: true,
    // },
    // {
    //   field: 'outGoingFactoryNm',
    //   headerName: '반출처',
    //   minWidth: 100,
    //   cellStyle: GridSetting.CellStyle.CENTER,
    //   suppressHeaderMenuButton: true,
    //   // cellClass: 'editCell',
    //   // cellEditor: 'agRichSelectCellEditor',
    //   // editable: true,
    //   // cellEditorParams: (params: any) => {
    //   //   return {
    //   //     values: factoryOption.map((item: any) => item.label),
    //   //     allowTyping: true,
    //   //     filterList: true,
    //   //     highlightMatch: true,
    //   //   };
    //   // },
    //   // onCellValueChanged: (params) => {
    //   //   const selectedFactoryNm = params.newValue;
    //   //   const selectedFactoryObj = factoryOption.find((item: any) => item.label === selectedFactoryNm);
    //   //   if (selectedFactoryObj) {
    //   //     const rowNode = params.node;
    //   //     if (rowNode) {
    //   //       rowNode.setDataValue('outGoingFactoryId', selectedFactoryObj.value); // hidden컬럼에 저장
    //   //     }
    //   //   }
    //   // },
    // },
    {
      field: 'inpGagongAmt',
      headerName: '공임비',
      width: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      editable: true,
      cellClass: 'editCell',
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    {
      field: 'outGoingAmt',
      headerName: outGoingType === '일반반출' ? '폐기금액' : '반출금액',
      width: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    {
      field: 'inpDcAmt',
      headerName: '단가DC',
      width: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      editable: true,
      cellClass: 'editCell',
    },
  ];

  /** 최초 데이터 렌더링 시 그리드 업데이트 */
  const onRowDataUpdated = (params: any) => {
    params.api.forEachNode((node: any) => {
      if (node.data) {
        // console.log('node.data.outGoingAmt', node.data.outGoingAmt);
        node.setDataValue('inpOutGoingCnt', node.data.outGoingCnt); // 반출수량
        // node.setDataValue('outGoingFactoryNm', node.data.factoryNm); // 반출처
        node.setDataValue('inpGagongAmt', node.data.gagongAmt); // 공임비
        node.setDataValue('inpDcAmt', node.data.outDcAmt); // 단가DC
      }
    });
  };

  /** 셀 수정 시 변경된 행 추적 */
  const onCellValueChanged = (event: CellValueChangedEvent): void => {
    const { colDef, node, newValue, oldValue } = event;
    // console.log('셀변경 >>>', colDef.field, newValue, oldValue);

    if (!['inpOutGoingCnt', 'inpGagongAmt', 'inpDcAmt'].includes(colDef.field!)) return; // 수량, 금액, 단가DC는 무시
    if (oldValue === undefined) return; // 최초 렌더링시는 계산 안함
    let isVerify = true;

    // 반출수량 변경
    if (colDef.field === 'inpOutGoingCnt') {
      if (isNaN(newValue) || newValue <= 0) {
        toastError('반출수량은 0 이상의 숫자만 입력해주세요.');
        isVerify = false;
      }

      if (newValue > node.data.partnerInventoryCnt) {
        toastError('매장재고 수량 이하로 입력해주세요.', { autoClose: 300 });
        isVerify = false;
      }

      if (isVerify) {
        // 반출금액 계산반영
        node.setDataValue('outGoingAmt', node.data.inpGagongAmt > 0 ? newValue * (node.data.inpGagongAmt - node.data.inpDcAmt) : 0);
      }
    }

    // 공임비 변경시 반출금액 재계산한다.
    if (colDef.field === 'inpGagongAmt') {
      if (isNaN(newValue) || newValue <= 0) {
        toastError('공임비는 0 이상의 숫자만 입력해주세요.');
        isVerify = false;
      }

      if (isVerify) {
        // 반출금액 계산반영
        node.setDataValue('outGoingAmt', node.data.inpOutGoingCnt > 0 ? (newValue - node.data.inpDcAmt) * node.data.inpOutGoingCnt : 0);
      }
    }

    // 단가DC 변경시 반출금액을 재계산한다.
    if (colDef.field === 'inpDcAmt') {
      if (isNaN(newValue)) {
        toastError('단가DC는 숫자만 입력해주세요.');
        node.setDataValue('inpDcAmt', 0);
        isVerify = false;
      }

      if (isVerify) {
        node.setDataValue('outGoingAmt', node.data.inpOutGoingCnt > 0 ? (node.data.inpGagongAmt - newValue) * node.data.inpOutGoingCnt : 0);
      }
    }

    // 정상입력시 셀 선택
    node.setSelected(['inpOutGoingCnt', 'inpGagongAmt', 'inpDcAmt'].includes(colDef.field!) && isVerify);
  };

  /** 저장 이벤트 핸들러 */
  const handleSave = async () => {
    const gridApi = gridRef.current?.api;

    gridApi?.stopEditing(); // 입력도중 저장을 눌렀을때 입력을 마무리 한다

    const paramsArray: ReceivingHistoryRequestDcAmtUpdate[] = [];
    gridApi?.forEachNode((node) => {
      // 변경된 것만 저장한다.
      if (node.data && row) {
        row.map((item) => {
          if (node.data.settleId === item.settleId) {
            if (node.data.inpOutGoingCnt !== item.outGoingCnt || node.data.inpGagongAmt !== item.gagongAmt || node.data.inpDcAmt !== item.outDcAmt) {
              paramsArray.push(node.data);
            }
          }
        });
      }
    });
    console.log('반출수정 params >>', paramsArray);
    if (paramsArray.length > 0) {
      updateOutGoingMutate(paramsArray);
    } else {
      toastError('수정된 내역이 없어요.');
    }

    // const selectedRows: any = gridApi?.getSelectedRows();
    //
    // if (selectedRows?.length === 0) {
    //   toastError('변경 내용이 있다면 아직 입력이 마무리가 안되었어요.', { autoClose: 1000 });
    //   return;
    // } else {
    //   // 반출수량과 공임비 유효성 체크
    //   const invalidRow = selectedRows.some((row: any) => row.inpOutGoingCnt <= 0 || row.inpGagongAmt <= 0);
    //
    //   if (invalidRow) {
    //     toastError('반출할 상품의 반출수량 또는 공임비를 다시 확인해주세요.', { autoClose: 1000 });
    //     return;
    //   }
    //
    //   console.log('반출 수정 params >>', selectedRows);
    //   // updateOutGoingMutate(selectedRows[0]);
    // }
  };

  /** 반출삭제 */
  const handleOutGoingDelConfirm = () => {
    if (!delRow) {
      toastError('삭제할 반출 정보가 없습니다.');
      return;
    } else {
      const outGoingDeleteRequest: ReceivingHistoryRequestOutGoingDelete = {
        settleId: delRow.settleId || 0,
      };
      console.log('삭제 데이타 >>', delRow);
      removeOutGoingMutate(outGoingDeleteRequest);
    }
  };
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PopupLayout
      width={1050}
      isEscClose={false}
      open={modalType.type === 'OUTGOING_UPDATE' && modalType.active}
      title={outGoingType === '수선반출' ? '반출상품수정 (수선반출분)' : '반출상품수정 (일반반출분)'}
      onClose={() => {
        closeModal('OUTGOING_UPDATE');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div className="left"></div>
            <div className="right">
              <Tooltip id="my-tooltip" />
              <button
                className="btn"
                title="반출삭제"
                onClick={() => {
                  if (gridRef.current?.api.getSelectedNodes() && gridRef.current?.api.getSelectedNodes().length > 0) {
                    // console.log('>>', gridRef.current?.api.getSelectedNodes()[0].data);
                    const selectedNodes = gridRef.current.api.getSelectedNodes();
                    if (selectedNodes.length !== 1) {
                      toastError('삭제할 내역을 하나만 선택해주세요.');
                      return;
                    }

                    const rowData = selectedNodes[0].data;
                    console.log('rowData', rowData);

                    setDelRow(rowData);
                    setModalOpen(true);
                  } else {
                    toastError('삭제하기 전 내역을 먼저 선택해주세요.');
                    return;
                  }
                }}
              >
                반출삭제
              </button>
              <button
                className="btn btnBlue"
                title="저장"
                // ref={buttonOkRef}
                data-tooltip-id="my-tooltip"
                data-tooltip-content="단축키는 (F10)입니다."
                data-tooltip-place="top-end"
                onClick={() => {
                  handleSave();
                }}
              >
                저장
              </button>

              <button
                className="btn"
                title="닫기"
                // ref={buttonCancelRef}
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
        <Table>
          <TableHeader count={0} isCount={false} title={'상품명 '} gridRef={gridRef} />
        </Table>

        <div className="gridBox pop">
          <TunedGrid<ReceivingHistoryResponseOutGoingDetail>
            ref={gridRef}
            rowData={row || []}
            columnDefs={columnDefs}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            rowSelection={'multiple'}
            enableRangeSelection={true}
            suppressRowClickSelection={true}
            preventPersonalizedColumnSetting={true}
            className={'factorySettleDetailPop'}
            onCellValueChanged={onCellValueChanged}
            onRowDataUpdated={onRowDataUpdated}
          />
        </div>
      </PopupContent>
      <DeleteConfirmModal
        dispTitle={`상품 ${delRow?.skuNm}의 반출건을 삭제하시겠어요?`}
        width={500}
        open={modalOpen}
        onConfirm={handleOutGoingDelConfirm}
        onClose={() => setModalOpen(false)}
      />
    </PopupLayout>
  );
};

export default ReceivingHistOutGoingModPop;
