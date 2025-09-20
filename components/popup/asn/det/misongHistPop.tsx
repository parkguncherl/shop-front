import { PopupLayout } from '../../PopupLayout';
import { PopupContent } from '../../PopupContent';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import React, { useEffect, useRef, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { useAsnMngStore } from '../../../../stores/useAsnMngStore';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import { Utils } from '../../../../libs/utils';
import { AsnMngResponseMisongHist } from '../../../../generated';

const MisongHistPop = () => {
  /** store */
  const [modalType, openModal, closeModal, usedInDetHist] = useAsnMngStore((s) => [s.modalType, s.openModal, s.closeModal, s.usedInDetHist]);

  /** 컬럼 정의 */
  const ColsForMisongHistPop: ColDef[] = [
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
      minWidth: 40,
      maxWidth: 40,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'workYmd',
      headerName: '미송일자',
      minWidth: 100,
      maxWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'sellerNm',
      headerName: '판매처',
      minWidth: 140,
      maxWidth: 140,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
    },
    {
      field: 'baseAmt',
      headerName: '거래단가',
      minWidth: 100,
      maxWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'finishYn',
      headerName: '완료',
      minWidth: 70,
      maxWidth: 70,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'misongCnt',
      headerName: '미송',
      minWidth: 70,
      maxWidth: 70,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'sendCnt',
      headerName: '발송',
      minWidth: 70,
      maxWidth: 70,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
  ];

  /** Component 참조 */
  const RefForGrid = useRef<AgGridReact>(null);

  const {
    data: misongHistDetData,
    isSuccess: isMisongHistDetSuccess,
    refetch: fetchMisongHist,
  } = useQuery(
    ['/asnMng/detHist/misong'],
    () => {
      return authApi.get('/asnMng/detHist/misong', {
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
    console.log(misongHistDetData);
    const histDetList: AsnMngResponseMisongHist[] = misongHistDetData?.data.body || [];
    const displayedDataList: any[] = [];
    for (let i = 0; i < histDetList.length; i++) {
      displayedDataList.push({
        ...histDetList[i],
        sharp: i + 1,
      });
    }
    setHistDetDataList(displayedDataList);
  }, [misongHistDetData]);

  return (
    <PopupLayout
      width={750}
      isEscClose={true}
      open={modalType.type === 'MISONG_HIST' && modalType.active}
      title={usedInDetHist.skuNm + ' 미송내역 상세 조회'}
      onClose={() => {
        closeModal('MISONG_HIST');
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
            columnDefs={ColsForMisongHistPop}
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

export default MisongHistPop;
