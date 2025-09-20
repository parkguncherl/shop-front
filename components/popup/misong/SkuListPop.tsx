import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupLayout } from '../PopupLayout';
import { PopupContent } from '../PopupContent';
import { useAsnMngStore } from '../../../stores/useAsnMngStore';
import TunedGrid from '../../grid/TunedGrid';
import { AsnMngRequestInsert, MisongResponseGroupBySku } from '../../../generated';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import Loading from '../../Loading';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { toastError, toastSuccess } from '../../ToastMessage';
import { Utils } from '../../../libs/utils';
import { ColDef, RowClassParams } from 'ag-grid-community';
import { ConfirmModal } from '../../ConfirmModal';
import { useMisongStore } from '../../../stores/useMisongStore';

interface SkuListPopProps {
  startDate: string;
  endDate: string;
}

const SkuListPop: React.FC<SkuListPopProps> = ({ startDate, endDate }) => {
  const [selectedSku, setSelectedSku] = useState<MisongResponseGroupBySku[]>([]);
  const [confirmModal, setConfirmModal] = useState(false);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<MisongResponseGroupBySku[]>([]); // 합계데이터 만들기
  /** store */
  const [insertAsnsAsExpect, deleteAsns] = useAsnMngStore((s) => [s.insertAsnsAsExpect, s.deleteAsns]);

  const [modalType, openModal, closeModal] = useMisongStore((s) => [s.modalType, s.openModal, s.closeModal]);

  /** 컬럼 정의 */
  const SkuListColsForPop: ColDef<MisongResponseGroupBySku>[] = [
    {
      field: 'no',
      headerName: 'No',
      minWidth: 50,
      maxWidth: 50,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      width: 90,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
      filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains', // 기본 필터 옵션
      },
    },
    {
      field: 'totAmt',
      headerName: '거래금액',
      maxWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'misongCnt',
      headerName: '미송',
      maxWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'sendCnt',
      headerName: '발송',
      maxWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'remainCnt',
      headerName: '잔량',
      maxWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'nowCnt',
      headerName: '현재고',
      maxWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'lessCnt',
      headerName: '과부족',
      maxWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: (params) => {
        return {
          ...GridSetting.CellStyle.CENTER,
          color: params.value < 0 ? 'red' : 'black', // Set color based on value
        };
      },
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'asnStatCd',
      headerName: '발주',
      maxWidth: 70,
      suppressHeaderMenuButton: true,
      cellStyle: (param) => {
        if (param.value === '2') {
          /** 발주상태(asnStatCd(10370)) 가 2(발주확정) 인 경우 더 이상 수정할 수 없음 (disable 처리) */
          return {
            backgroundColor: 'e0e0e0',
            color: '#a0a0a0',
            pointerEvents: 'none' /* This makes the cell non-interactive */,
            opacity: '0.5',
            textAlign: 'center',
          };
        } else {
          return GridSetting.CellStyle.CENTER;
        }
      },
      valueFormatter: (params: any) => {
        console.log('=============>', params.node?.rowPinned);
        if (params.node?.rowPinned === 'bottom') {
          return '';
        } else if (params.value == '2') {
          /** 발주상태(asnStatCd(10370)) 가 2(발주확정) 인 경우 더 이상 수정할 수 없음 */
          return params.data?.workYmd;
        } else {
          if (params.value == '1') {
            return '▣';
          } else {
            return '□';
          }
        }
      },
      onCellClicked: (e) => {
        if (e.data) {
          const rowData = e.data as MisongResponseGroupBySku;
          if (rowData.asnStatCd == '2') {
            /** 발주상태(asnStatCd(10370)) 가 2(발주확정) 인 경우 더 이상 수정할 수 없음 */
          } else {
            if (!rowData.asnStatCd) {
              /** 발주추가 */
              insertAsnsAsExpect([
                {
                  skuId: rowData.skuId,
                  //totAmt: rowData.totAmt,
                  asnOrigin: '미송',
                },
              ]).then((result) => {
                const { resultCode, body, resultMessage } = result.data;
                if (resultCode == 200) {
                  toastSuccess('추가 성공');
                  fetchMisongOrder();
                } else {
                  toastError('발주 추가 중 문제가 발생하였습니다.');
                }
              });
            } else {
              /** 발주삭제 */
              deleteAsns([
                {
                  skuId: rowData.skuId,
                },
              ]).then((result) => {
                const { resultCode, body, resultMessage } = result.data;
                if (resultCode == 200) {
                  toastSuccess('삭제 성공');
                  fetchMisongOrder();
                } else {
                  toastError('발주 취소 중 문제가 발생하였습니다.');
                }
              });
            }
          }
        }
      },
    },
  ];

  /** 조건에 해당하는 상품 데이터(row) 조회 */
  const {
    data: misongOrders,
    isLoading: isMisongOrders,
    isSuccess: isMisongSuccess,
    refetch: fetchMisongOrder,
  } = useQuery(['/orderTran/misong/selectMisongListGroupBySku'], () =>
    authApi.get('/orderTran/misong/selectMisongListGroupBySku', {
      params: {
        startDate: startDate,
        endDate: endDate,
      },
    }),
  );

  useEffect(() => {
    if (isMisongSuccess) {
      console.log('misongOrders ===>', misongOrders);
      const { resultCode, body, resultMessage } = misongOrders.data;
      if (resultCode === 200) {
        if (body && body.length > 0) {
          const { misongCount, sendCount, nowCount, remainCount, totMisongAmt } = body.reduce(
            (
              acc: {
                misongCount: number;
                sendCount: number;
                nowCount: number;
                remainCount: number;
                totMisongAmt: number;
              },
              data: MisongResponseGroupBySku,
            ) => {
              return {
                misongCount: acc.misongCount + (data.misongCnt ? data.misongCnt : 0),
                sendCount: acc.sendCount + (data.sendCnt ? data.sendCnt : 0),
                nowCount: acc.nowCount + (data.nowCnt ? data.nowCnt : 0),
                remainCount: acc.remainCount + (data.remainCnt ? data.remainCnt : 0),
                totMisongAmt: acc.totMisongAmt + (data.totAmt ? data.totAmt : 0),
              };
            },
            {
              delayCount: 0,
              misongCount: 0,
              sendCount: 0,
              nowCount: 0,
              remainCount: 0,
              totMisongAmt: 0,
            }, // 초기값 설정
          );

          setPinnedBottomRowData([
            {
              totAmt: totMisongAmt,
              sendCnt: sendCount,
              misongCnt: misongCount,
              nowCnt: nowCount,
              remainCnt: remainCount,
            },
          ]);
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [isMisongSuccess, misongOrders]);

  const confirmedAsnAdd = () => {
    const processedForInsert: AsnMngRequestInsert[] = [];
    for (let i = 0; i < selectedSku.length; i++) {
      processedForInsert[i] = {
        skuId: selectedSku[i].skuId,
      };
    }
    insertAsnsAsExpect(processedForInsert).then((result) => {
      const { resultCode, body, resultMessage } = result.data;
      if (resultCode == 200) {
        toastSuccess('추가되었습니다.');
        setConfirmModal(false);
        //closeModal('ADD');
      } else {
        toastError('추가 동작 도중 문제가 발생하였습니다.');
      }
    });
  };

  const onKeyDownAtConfirmModal = (e: KeyboardEvent) => {
    if (e.key == 'Enter') {
      confirmedAsnAdd();
    }
  };

  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params.node.rowPinned === 'bottom') {
      // 합계 행 스타일링
      rtnValue = rtnValue + 'ag-grid-pinned-row';
    }
    return rtnValue;
  }, []);

  return (
    <PopupLayout
      width={1000}
      height={600}
      isEscClose={true}
      open={modalType.type === 'SKULIST' && modalType.active}
      title={'상품별 보기'}
      onClose={() => {
        closeModal('SKULIST');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn" title="닫기" onClick={() => closeModal('SKULIST')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <TunedGrid<MisongResponseGroupBySku>
          colIndexForSuppressKeyEvent={2}
          headerHeight={35}
          onGridReady={(e) => {
            e.api.sizeColumnsToFit();
          }}
          rowData={(misongOrders?.data.body as MisongResponseGroupBySku[]) || []}
          columnDefs={SkuListColsForPop}
          defaultColDef={defaultColDef}
          gridOptions={{
            rowHeight: 24,
          }}
          getRowClass={getRowClass}
          pinnedBottomRowData={pinnedBottomRowData}
          className={'pop'}
        />
      </PopupContent>
      {isMisongOrders && <Loading />}
      <ConfirmModal
        title={'발주예정 상품으로 추가하시겠습니까?'}
        open={confirmModal}
        onConfirm={confirmedAsnAdd}
        /*onKeyDown={onKeyDownAtConfirmModal}*/
        onClose={() => setConfirmModal(false)}
      />
    </PopupLayout>
  );
};

export default SkuListPop;
