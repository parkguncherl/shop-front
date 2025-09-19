import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import TunedGrid from '../../grid/TunedGrid';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import CustomGridLoading from '../../CustomGridLoading';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import { PopupLayout } from '../PopupLayout';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDeliveryStore } from '../../../stores/useDeliveryStore';
import { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { DeliveryRequestUpdateDet, DeliveryResponseDet } from '../../../generated';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { Utils } from '../../../libs/utils';
import { ConfirmModal } from '../../ConfirmModal';
import { toastError, toastSuccess } from '../../ToastMessage';

export const DeliveryBoryuModPop = () => {
  const [modalType, closeModal, selectedPagingElement, updateDeliveryDet] = useDeliveryStore((s) => [
    s.modalType,
    s.closeModal,
    s.selectedPagingElement,
    s.updateDeliveryDet,
  ]);

  const [usedInConfirm, setUsedInConfirm] = useState<{ modalType: string; data: DeliveryResponseDet }>({
    modalType: '',
    data: {},
  });

  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any[]>([]); // 합계데이터 만들기

  const overOrUnderAdded = (deliveryResponseDetList: DeliveryResponseDet[]) => {
    const detList = [];
    for (let i = 0; i < deliveryResponseDetList.length; i++) {
      if (deliveryResponseDetList[i].binblurCnt != undefined && deliveryResponseDetList[i].jobCnt != undefined) {
        detList[i] = {
          ...deliveryResponseDetList[i],
          overOrUnder: (deliveryResponseDetList[i].binblurCnt as number) - (deliveryResponseDetList[i].jobCnt as number),
        };
      } else {
        detList[i] = {
          ...deliveryResponseDetList[i],
        };
      }
    }
    return detList;
  };

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
        maxWidth: 60,
        minWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'skuNm',
        headerName: '상품명',
        maxWidth: 198,
        minWidth: 198,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'realAmt',
        headerName: '판가',
        maxWidth: 80,
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'jobCnt',
        headerName: '주문',
        maxWidth: 60,
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'binblurCnt' /* 실물 값은 빈블러 재고 */,
        headerName: '실물',
        maxWidth: 60,
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'overOrUnder',
        headerName: '과부족',
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

  const {
    data: deliveryList,
    isLoading: isDeliveryList,
    isSuccess: isPagingSuccess,
    refetch: fetchDeliveryList,
  } = useQuery(['/orderInfo/delivery/det', selectedPagingElement.jobId], (): any =>
    authApi.get('/orderInfo/delivery/det', {
      params: {
        jobId: selectedPagingElement.jobId,
      },
    }),
  );

  useEffect(() => {
    if (deliveryList) {
      const { resultCode, body, resultState } = deliveryList.data;
      if (resultCode == 200) {
        const skuNmList: string[] = [];
        let sumOfRealAmt = 0;
        let sumOfJobCnt = 0;
        let sumOfBinblurCnt = 0;
        let sumOfOverOrUnder = 0;
        for (let i = 0; i < deliveryList.data.body.length; i++) {
          skuNmList[skuNmList.length] = deliveryList.data.body[i].skuNm || 0;
          sumOfRealAmt += deliveryList.data.body[i].realAmt || 0;
          sumOfJobCnt += deliveryList.data.body[i].jobCnt || 0;
          sumOfBinblurCnt += deliveryList.data.body[i].binblurCnt || 0;
          sumOfOverOrUnder += (deliveryList.data.body[i].binblurCnt || 0) - (deliveryList.data.body[i].jobCnt || 0);
        }
        setPinnedBottomRowData([
          {
            skuNm: [...new Set(skuNmList)].length.toString(), // 고유 skuNm 개수
            realAmt: sumOfRealAmt,
            jobCnt: sumOfJobCnt,
            binblurCnt: sumOfBinblurCnt,
            overOrUnder: sumOfOverOrUnder,
          },
        ]);
      }
    }
  }, [deliveryList]);

  return (
    <PopupLayout
      width={700}
      isEscClose={true}
      open={modalType.type === 'MOD_BORYU' && modalType.active}
      title={
        '[출고보류 수정]' +
        ' ' +
        (selectedPagingElement.sellerNm || '소매처 정보 없음') +
        ' (' +
        (selectedPagingElement.jobTypeNm || '작업유형 정보 없음') +
        ') - ' +
        (selectedPagingElement.tranYmd || '예정일 정보 없음') +
        ' ' +
        ('#' + selectedPagingElement.no)
      }
      onClose={() => {
        closeModal('MOD_BORYU');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div className="left">
              <button
                className="btn"
                title="미송"
                onClick={() => {
                  if (RefForGrid.current?.api.getSelectedNodes().length == 1) {
                    setUsedInConfirm(() => {
                      return {
                        data: RefForGrid.current?.api.getSelectedNodes()[0].data,
                        modalType: 'misong',
                      };
                    });
                  }
                }}
              >
                미송
              </button>
              <button
                className="btn"
                title="미출"
                onClick={() => {
                  if (RefForGrid.current?.api.getSelectedNodes().length == 1) {
                    setUsedInConfirm((prevState) => {
                      return {
                        data: RefForGrid.current?.api.getSelectedNodes()[0].data,
                        modalType: 'michul',
                      };
                    });
                  }
                }}
              >
                미출
              </button>
            </div>
            <div className="right">
              <button
                className="btn btnBlue"
                title="삭제"
                onClick={() => {
                  if (RefForGrid.current?.api.getSelectedNodes().length == 1) {
                    setUsedInConfirm((prevState) => {
                      return {
                        data: RefForGrid.current?.api.getSelectedNodes()[0].data,
                        modalType: 'delete',
                      };
                    });
                  }
                }}
              >
                삭제
              </button>
              <button
                className="btn"
                title="닫기"
                onClick={() => {
                  closeModal('MOD_BORYU');
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
        <div className="tblBox">
          <table></table>
        </div>
        <div>
          <TunedGrid
            headerHeight={35}
            onGridReady={(e) => {
              e.api.sizeColumnsToFit();
            }}
            rowData={overOrUnderAdded(deliveryList?.data.body || [])}
            columnDefs={DeliveryDetPopCols}
            defaultColDef={defaultColDef}
            gridOptions={{ rowHeight: 24 }}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            onCellKeyDown={(e) => {
              // todo
            }}
            pinnedBottomRowData={pinnedBottomRowData}
            suppressRowClickSelection={false}
            ref={RefForGrid}
            className={'pop'}
          />
        </div>
        <ConfirmModal
          title={(usedInConfirm.modalType == 'misong' ? '미송' : usedInConfirm.modalType == 'michul' ? '미출' : '삭제') + ' 처리하시겠습니까?'}
          open={usedInConfirm.modalType != ''}
          onConfirm={() => {
            const deliveryRequestUpdateDet: DeliveryRequestUpdateDet = {
              orderDetId: usedInConfirm.data.orderDetId as number,
              jobId: usedInConfirm.data.jobId as number,
              jobDetId: usedInConfirm.data.jobDetId as number,
            };
            if (usedInConfirm.modalType == 'misong') {
              // 미송
              deliveryRequestUpdateDet.orderDetCd = '99'; // 미송 (10140)
            } else if (usedInConfirm.modalType == 'michul') {
              // 미출
              deliveryRequestUpdateDet.orderDetCd = '80'; // 미출 (10140)
            }
            // 삭제일 시 orderDetCd 를 특정하지 않는다.
            updateDeliveryDet(deliveryRequestUpdateDet).then((result) => {
              const { resultCode, body, resultMessage } = result.data;
              if (resultCode == 200) {
                toastSuccess('정상 처리되었습니다.');
                setUsedInConfirm({
                  modalType: '',
                  data: {},
                });
                fetchDeliveryList();
              } else {
                toastError(resultMessage);
              }
            });
          }}
          onClose={() => {
            setUsedInConfirm({
              modalType: '',
              data: {},
            });
          }}
        />
      </PopupContent>
    </PopupLayout>
  );
};
