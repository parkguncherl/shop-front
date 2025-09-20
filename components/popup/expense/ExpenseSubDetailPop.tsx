import React, { useEffect, useRef, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { ExpenseResponsePaging } from '../../../generated';
import { PopupLayout } from '../PopupLayout';
import { useExpenseStore } from '../../../stores/useExpenseStore';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import CustomGridLoading from '../../CustomGridLoading';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import { useAgGridApi } from '../../../hooks';
import { ColDef } from 'ag-grid-community';
import { Utils } from '../../../libs/utils';
import dayjs from 'dayjs';
/**
 * 매장입출금 서브그리드 상세
 */
const ExpenseSubDetailPop = () => {
  const [modalType, closeModal, selectedDetail] = useExpenseStore((s) => [s.modalType, s.closeModal, s.selectedDetail]);
  const gridRef = useRef<AgGridReact>(null);
  const { onGridReady } = useAgGridApi();

  const [columnDefs] = useState<ColDef[]>([
    {
      field: 'no',
      headerName: 'No',
      minWidth: 40,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'workYmd',
      headerName: '영업일자',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: (params: any) => {
        // 합계 행인 경우 빈 문자열 반환
        if (params.node?.rowPinned) return '';
        // 일반 행인 경우 날짜 형식 반환
        return params.value ? dayjs(params.value).format('YY/MM/DD (ddd)') : '';
      },
    },
    {
      field: 'accountNm',
      headerName: '계정과목',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'depositCount',
      headerName: '입금건',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'totalInAmt',
      headerName: '입금금액',
      minWidth: 95,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'withdrawalCount',
      headerName: '출금건',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'totalOutAmt',
      headerName: '출금금액',
      minWidth: 95,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
  ]);

  // 총합 데이터 계산
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any[]>([]);
  const calculatePinnedBottomRowData = () => {
    const dataArray = Array.isArray(selectedDetail) ? selectedDetail : [];
    const totalDepositCount = dataArray.reduce((acc, curr) => acc + (curr.depositCount || 0), 0);
    const totalInAmt = dataArray.reduce((acc, curr) => acc + (curr.totalInAmt || 0), 0);
    const totalWithdrawalCount = dataArray.reduce((acc, curr) => acc + (curr.withdrawalCount || 0), 0);
    const totalOutAmt = dataArray.reduce((acc, curr) => acc + (curr.totalOutAmt || 0), 0);

    // 각 필드의 총합을 포함한 객체를 반환
    return [
      {
        no: null,
        depositCount: totalDepositCount,
        totalInAmt: totalInAmt,
        withdrawalCount: totalWithdrawalCount,
        totalOutAmt: totalOutAmt,
      },
    ];
  };

  // selectedDetail 변경 시 pinnedBottomRowData 업데이트
  useEffect(() => {
    setPinnedBottomRowData(calculatePinnedBottomRowData());
  }, [selectedDetail]);

  return (
    <PopupLayout
      width={633}
      isEscClose={true}
      open={modalType.type === 'SUBDETAIL'}
      title={'계정과목 상세'}
      onClose={() => closeModal('SUBDETAIL')}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn" title="닫기" onClick={() => closeModal('SUBDETAIL')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="gridBox">
          <div className={'ag-theme-alpine pop'}>
            <AgGridReact
              ref={gridRef}
              headerHeight={35}
              onGridReady={onGridReady}
              rowData={(selectedDetail as ExpenseResponsePaging[]) || []}
              gridOptions={{ rowHeight: 24 }}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pinnedBottomRowData={pinnedBottomRowData}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
            />
          </div>
        </div>
      </PopupContent>
    </PopupLayout>
  );
};

export default ExpenseSubDetailPop;
