import { useAsnMngStore } from '../../../../stores/useAsnMngStore';
import { ColDef } from 'ag-grid-community';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import React, { useEffect, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import { AsnMngResponseMichulHist } from '../../../../generated';
import { PopupLayout } from '../../PopupLayout';
import { PopupContent } from '../../PopupContent';

const MichulDetPop = () => {
  /** store */
  const [modalType, openModal, closeModal, usedInDetHist] = useAsnMngStore((s) => [s.modalType, s.openModal, s.closeModal, s.usedInDetHist]);

  /** 컬럼 정의 */
  const ColsForMichulHistPop: ColDef[] = [
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
      field: 'workYmd',
      headerName: '미출일자',
      minWidth: 100,
      maxWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'totSkuCnt',
      headerName: '총수량',
      minWidth: 70,
      maxWidth: 70,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'retailCnt',
      headerName: '업체수',
      minWidth: 70,
      maxWidth: 70,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'minAsnCnt',
      headerName: '최소발주',
      minWidth: 70,
      maxWidth: 70,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'excessLackCnt',
      headerName: '과부족 수량',
      minWidth: 70,
      maxWidth: 70,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
  ];

  /** Component 참조 */
  const RefForGrid = useRef<AgGridReact>(null);

  const {
    data: michulHistDetData,
    isSuccess: isMichulHistDetSuccess,
    refetch: fetchMichulHist,
  } = useQuery(
    ['/asnMng/detHist/michul'],
    () => {
      return authApi.get('/asnMng/detHist/michul', {
        params: {
          skuId: usedInDetHist.skuId,
          startDate: usedInDetHist.startDate,
          endDate: usedInDetHist.endDate,
        },
      });
    },
    {
      enabled: true,
    },
  );

  const [histDetDataList, setHistDetDataList] = useState<any[]>([]);

  useEffect(() => {
    console.log(michulHistDetData);
    const histDetList: AsnMngResponseMichulHist[] = michulHistDetData?.data.body || [];
    const displayedDataList: any[] = [];
    for (let i = 0; i < histDetList.length; i++) {
      displayedDataList.push({
        ...histDetList[i],
        sharp: i + 1,
      });
    }
    setHistDetDataList(displayedDataList);
  }, [michulHistDetData]);

  return (
    <PopupLayout
      width={550}
      isEscClose={true}
      open={modalType.type === 'MICHUL_DET' && modalType.active}
      title={usedInDetHist.skuNm + ' 미출내역 상세 조회'}
      onClose={() => {
        closeModal('MICHUL_DET');
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
            columnDefs={ColsForMichulHistPop}
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

export default MichulDetPop;
