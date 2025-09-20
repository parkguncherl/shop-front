import { PopupLayout } from '../../PopupLayout';
import { PopupContent } from '../../PopupContent';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import React, { useEffect, useRef, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { useAsnMngStore } from '../../../../stores/useAsnMngStore';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import { AsnMngResponseOrderHistDet } from '../../../../generated';
import { Utils } from '../../../../libs/utils';

const OrderHistDetPop = () => {
  /** store */
  const [modalType, openModal, closeModal, usedInDetHist] = useAsnMngStore((s) => [s.modalType, s.openModal, s.closeModal, s.usedInDetHist]);

  /** 컬럼 정의 */
  const ColsForSpecSellHistPop: ColDef[] = [
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
      field: 'sharp',
      headerName: '',
      minWidth: 50,
      maxWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
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
      field: 'orderDetTp',
      headerName: '유형',
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

  /** Component 참조 */
  const RefForGrid = useRef<AgGridReact>(null);

  const {
    data: orderHistDetData,
    isSuccess: isOrderHistDetSuccess,
    refetch: fetchOrderHist,
  } = useQuery(
    ['/asnMng/detHist/order'],
    () => {
      return authApi.get('/asnMng/detHist/order', {
        params: {
          skuId: usedInDetHist.skuId,
        },
      });
    },
    {
      enabled: true,
    },
  );

  const [histDetDataList, setHistDetDataList] = useState<any[]>([]);

  useEffect(() => {
    const histDetList: AsnMngResponseOrderHistDet[] = orderHistDetData?.data.body || [];
    console.log(histDetList);
    const displayedDataList: any[] = [];
    for (let i = 0; i < histDetList.length; i++) {
      displayedDataList.push({
        ...histDetList[i],
        sharp: i + 1,
      });
    }
    setHistDetDataList(displayedDataList);
  }, [orderHistDetData]);

  return (
    <PopupLayout
      width={910}
      isEscClose={true}
      open={modalType.type === 'ORDERHIST_DET' && modalType.active}
      title={usedInDetHist.skuNm + ' 판매내역 조회'}
      onClose={() => {
        closeModal('ORDERHIST_DET');
      }}
    >
      <PopupContent>
        <div className={'ag-theme-alpine'}>
          <AgGridReact
            headerHeight={30}
            onGridReady={(e) => {
              e.api.sizeColumnsToFit();
            }}
            rowData={histDetDataList}
            columnDefs={ColsForSpecSellHistPop}
            defaultColDef={defaultColDef}
            gridOptions={{
              rowHeight: 24,
            }}
            ref={RefForGrid}
          />
        </div>
      </PopupContent>
    </PopupLayout>
  );
};

export default OrderHistDetPop;
