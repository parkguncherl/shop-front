import TunedGrid from '../../../grid/TunedGrid';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';
import React, { useEffect, useRef, useState } from 'react';
import { ColDef, RowClassParams } from 'ag-grid-community';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { PopupLayout } from '../../PopupLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import { WrongDetUnionInfo, WrongResponsePaging } from '../../../../generated';
import { Utils } from '../../../../libs/utils';
import { useWrongStore } from '../../../../stores/useWrongStore';
import { ProductStatus } from '../../../../libs/const';
import { toastError, toastSuccess } from '../../../ToastMessage';

export const WrongDeliveryPop = (props: WrongResponsePaging) => {
  /** 출고 관련 전역 상태 */
  const { modalType, closeModal, rejectWrongInfo, tranWrongInfo } = useWrongStore();
  /** Component 참조 */
  const WrongDetBefGrid = useRef<AgGridReact>(null);
  const [gridData, setGridData] = useState<WrongDetUnionInfo[]>([]);
  const queryClient = useQueryClient();

  // 오출고 현황 조회 API 호출
  useQuery({
    queryKey: ['/orderInfo/wrong/union/' + props.jobId],
    queryFn: (): any =>
      authApi.get('/orderInfo/wrong/union/' + props.jobId).then((res) => {
        console.log('====> res.data===>', res.data);
        if (res.status == 200) {
          setGridData(res.data.body.wrongDetUnionInfo);
        }
      }),
    enabled: true,
  });

  const { mutate: rejectWrongInfoMutate } = useMutation(rejectWrongInfo, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('반려되었습니다.');
          await queryClient.invalidateQueries({
            queryKey: ['/orderInfo/wrong/wmsList'],
          });
          closeModal('WRONG_MOD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const { mutate: tranWrongInfoMutate } = useMutation(tranWrongInfo, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('처리되었습니다.');
          await queryClient.invalidateQueries({
            queryKey: ['/orderInfo/wrong/wmsList'],
          });
          closeModal('WRONG_MOD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 좌측 그리드 컬럼 정의 */
  const [OriginDataCols] = useState<ColDef[]>([
    {
      headerName: '선택',
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
      sortable: false,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      sortable: false,
      minWidth: 250,
      maxWidth: 250,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'jobCnt',
      headerName: '출고지시',
      sortable: false,
      maxWidth: 70,
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
    },
    {
      field: 'realCnt',
      headerName: '실제출고',
      sortable: false,
      maxWidth: 70,
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
    },
    {
      field: 'addJobCnt',
      headerName: '추가출고',
      sortable: false,
      maxWidth: 70,
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
    },
    {
      field: 'minusJobCnt',
      headerName: '재고수정',
      sortable: false,
      maxWidth: 70,
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
    },
    {
      field: 'binblurCnt',
      headerName: '재고',
      sortable: false,
      maxWidth: 70,
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
    },
  ]);

  const getRowClass = (params: RowClassParams) => {
    if (params.data.orderDetCd == ProductStatus.refund[0]) {
      return ProductStatus.refund[2];
    } else if (params.data.orderDetCd == ProductStatus.beforeDelivery[0]) {
      return ProductStatus.beforeDelivery[2];
    } else if (params.data.orderDetCd == ProductStatus.sample[0]) {
      return ProductStatus.sample[2];
    } else if (params.data.orderDetCd == ProductStatus.notDelivered[0]) {
      return ProductStatus.notDelivered[2];
    } else {
      return '';
    }
  };

  return (
    <PopupLayout
      width={800}
      isEscClose={true}
      open={modalType.type === 'WRONG_MERGE' && modalType.active}
      title={
        <>
          {props.sellerNm}
          <span style={{ fontSize: '14px' }}> 고객사</span> {props.jobTypeNm}
          <span style={{ fontSize: '14px' }}>건 ( {props.wrongStatCdNm} )</span>
        </>
      }
      onClose={() => {
        closeModal('WRONG_MERGE');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            {props.wrongStatCdNm === '진행중' && (
              <>
                <button
                  className="btn"
                  title="반려"
                  onClick={() => {
                    if (props.jobId) {
                      rejectWrongInfoMutate(props.jobId);
                    }
                  }}
                >
                  반려
                </button>
                <button
                  className="btn"
                  title="등록"
                  disabled={props.jobTypeNm === '처리'}
                  onClick={() => {
                    if (props.jobId) {
                      tranWrongInfoMutate(props.jobId);
                    }
                  }}
                >
                  등록
                </button>
              </>
            )}
            <button className="btn" title="닫기" onClick={() => closeModal('WRONG_MERGE')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="gridBox">
          <div style={{ height: '30px' }}>
            <h3>{(Utils.formatDateWithDay(props.tranYmd) || '예정일 정보 없음') + ' ' + ('#' + props.no)}</h3>
          </div>
          <TunedGrid<WrongDetUnionInfo>
            headerHeight={35}
            onGridReady={(e) => {
              e.api.sizeColumnsToFit();
            }}
            getRowStyle={(params) => {
              if (params.data?.delYn == 'Y') {
                return { backgroundColor: '#A4A4A4' };
              }
            }}
            rowData={gridData}
            columnDefs={OriginDataCols}
            defaultColDef={defaultColDef}
            gridOptions={{ rowHeight: 24 }}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            ref={WrongDetBefGrid}
            className={'pop'}
            getRowClass={getRowClass}
          />
        </div>
      </PopupContent>
    </PopupLayout>
  );
};
