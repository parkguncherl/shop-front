import React, { useEffect, useRef, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { CheckBox } from '../../CheckBox';
import { PopupLayout } from '../PopupLayout';
import { useSettlementStore } from '../../../stores/useSattlementStore';
import { Utils } from '../../../libs/utils';
import { ConfirmModal } from '../../ConfirmModal';
import TunedGrid from '../../grid/TunedGrid';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import CustomGridLoading from '../../CustomGridLoading';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import { Pagination } from '../../Pagination';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import { useAgGridApi } from '../../../hooks';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';

const EnterHistoryPop = () => {
  /** store */
  const [paging, setPaging, modalType, openModal, closeModal] = useSettlementStore((s) => [s.paging, s.setPaging, s.modalType, s.openModal, s.closeModal]);
  /** Grid Api */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  /** 그리드 컬럼 */
  const [columnDefs] = useState<ColDef[]>([
    {
      field: 'no',
      headerName: 'No',
      minWidth: 40,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'creTm',
      headerName: '입력일시',
      minWidth: 120,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        return params.value ? dayjs(params.value).format('YY/MM/DD (ddd) HH:mm') : '';
      },
    },
    { field: 'temp1', headerName: '전기시재', minWidth: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'temp2', headerName: '현금입금', minWidth: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'temp3', headerName: '계정입금', minWidth: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'temp4', headerName: '계정출금', minWidth: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'temp5', headerName: '전산현금', minWidth: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'temp6', headerName: '돈통현금', minWidth: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'temp7', headerName: '현금차액', minWidth: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'temp8', headerName: '정산마감', minWidth: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'temp8', headerName: '차기시재', minWidth: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'temp8', headerName: '사용자', minWidth: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
  ]);

  /** 메인그리드 페이징 목록 조회 */
  const { data, isLoading, isSuccess, refetch } = useQuery(['/store/stock/paging', paging.curPage], () => authApi.get('/store/stock/paging', {}));
  const handleSubmit = () => {};

  return (
    <PopupLayout
      width={100}
      isEscClose={true}
      open={modalType.type === 'HISTORY' && modalType.active}
      title={'이력보기'}
      onClose={() => {
        closeModal();
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" onClick={handleSubmit}>
              확인
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal()}>
              취소
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="gridBox">
          <div className={'ag-theme-alpine pop'}>
            <TunedGrid
              ref={gridRef}
              headerHeight={35}
              onGridReady={onGridReady}
              loading={isLoading}
              rowData={[]}
              gridOptions={{ rowHeight: 24 }}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              paginationPageSize={paging.pageRowCount}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              suppressRowClickSelection={false}
            />
          </div>
          <Pagination pageObject={paging} setPaging={setPaging} />
        </div>
      </PopupContent>
    </PopupLayout>
  );
};

export default EnterHistoryPop;
