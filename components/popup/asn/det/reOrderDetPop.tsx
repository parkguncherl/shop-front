import { PopupLayout } from '../../PopupLayout';
import { PopupContent } from '../../PopupContent';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import React, { useEffect, useRef, useState } from 'react';
import { useAsnMngStore } from '../../../../stores/useAsnMngStore';
import { ColDef } from 'ag-grid-community';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import { AsnMngResponseReOrderDet, AsnMngResponseReOrderRetail } from '../../../../generated';
import { Utils } from '../../../../libs/utils';
import useFilters from '../../../../hooks/useFilters';

const ReOrderDetPop = () => {
  /** store */
  const [modalType, openModal, closeModal, usedInDetHist] = useAsnMngStore((s) => [s.modalType, s.openModal, s.closeModal, s.usedInDetHist]);

  /** Component 참조 */
  const LGridRef = useRef<AgGridReact>(null);
  const RGridRef = useRef<AgGridReact>(null);

  const [reOrderDetFilters, onChangeReOrderDetFilters] = useFilters({
    skuId: usedInDetHist.skuId,
    retailId: undefined,
  });

  /** 컬럼 정의 */
  const LColsForReOrderDetPop: ColDef[] = [
    {
      field: 'sellerNm',
      headerName: '소매처명',
      minWidth: 130,
      maxWidth: 130,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
    },
    {
      field: 'reOrderCnt',
      headerName: '리오더 횟수',
      minWidth: 100,
      maxWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
  ];
  const RColsForReOrderDetPop: ColDef[] = [
    {
      field: 'workYmd',
      headerName: '일자',
      minWidth: 100,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'gubun1',
      headerName: '구분',
      maxWidth: 70,
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'baseAmt',
      headerName: '거래단가',
      maxWidth: 80,
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'dcAmt',
      headerName: '단가DC',
      maxWidth: 80,
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'skuCnt',
      headerName: '판매량',
      maxWidth: 70,
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'totAmt',
      headerName: '판매금액',
      maxWidth: 80,
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      editable: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'returnSkuCnt',
      headerName: '반품수량',
      maxWidth: 70,
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      editable: true,
    },
    {
      field: 'returnTotAmt',
      headerName: '반품금액',
      maxWidth: 80,
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      editable: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
  ];

  const {
    data: ReOrderCountForEachRetail,
    isSuccess: isReOrderCountForEachRetailSuccess,
    refetch: fetchReOrderCountForEachRetail,
  } = useQuery(
    ['/asnMng/detHist/reorder/retail'],
    () => {
      return authApi.get('/asnMng/detHist/reorder/retail', {
        params: {
          skuId: usedInDetHist.skuId,
        },
      });
    },
    {
      enabled: true,
    },
  );

  const {
    data: ReOrderListForEachRetail,
    isSuccess: isReOrderListForEachRetailSuccess,
    refetch: fetchReOrderListForEachRetail,
  } = useQuery(
    ['/asnMng/detHist/reorder/det', reOrderDetFilters.retailId],
    () => {
      return authApi.get('/asnMng/detHist/reorder/det', {
        params: {
          ...reOrderDetFilters,
        },
      });
    },
    {
      enabled: false,
    },
  );

  useEffect(() => {
    fetchReOrderListForEachRetail();
    console.log(reOrderDetFilters);
  }, [reOrderDetFilters.retailId]);

  return (
    <PopupLayout
      width={900}
      isEscClose={true}
      open={modalType.type === 'REORDER_DET' && modalType.active}
      title={'리오더 상세정보 조회'}
      onClose={() => {
        closeModal('REORDER_DET');
      }}
    >
      <PopupContent>
        <div className="layoutPrivewBox">
          <div className="layoutBox">
            <div className="layout30">
              <div className="gridBox">
                <div className="tblPreview">
                  <div className={'ag-theme-alpine'}>
                    <AgGridReact
                      headerHeight={30}
                      onGridReady={(e) => {
                        e.api.sizeColumnsToFit();
                      }}
                      onRowClicked={(e) => {
                        onChangeReOrderDetFilters('retailId', e.data.retailId);
                      }}
                      rowData={(ReOrderCountForEachRetail?.data.body as AsnMngResponseReOrderRetail[]) || []}
                      columnDefs={LColsForReOrderDetPop}
                      defaultColDef={defaultColDef}
                      gridOptions={{
                        rowHeight: 24,
                      }}
                      ref={LGridRef}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="layout70">
              <div className="gridBox">
                <div className="tblPreview">
                  <div className={'ag-theme-alpine'}>
                    <AgGridReact
                      headerHeight={30}
                      onGridReady={(e) => {
                        e.api.sizeColumnsToFit();
                      }}
                      rowData={(ReOrderListForEachRetail?.data.body as AsnMngResponseReOrderDet[]) || []}
                      columnDefs={RColsForReOrderDetPop}
                      defaultColDef={defaultColDef}
                      gridOptions={{
                        rowHeight: 24,
                      }}
                      ref={RGridRef}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopupContent>
    </PopupLayout>
  );
};

export default ReOrderDetPop;
