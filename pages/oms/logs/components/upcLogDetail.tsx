/**
 * @file pages/oms/pastHistory/components/upcLogDetail.tsx
 * @description OMS > 변경로그 > 상품생산 단가 상세 이력 조회 모달 컴포넌트
 * @copyright 2024
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { PopupLayout, PopupFooter, PopupContent } from '../../../../components/popup';
import { GridSetting } from '../../../../libs/ag-grid';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import { Utils } from '../../../../libs/utils';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import CustomGridLoading from '../../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../../components/CustomNoRowsOverlay';
import TunedGrid from '../../../../components/grid/TunedGrid';
import { useSession } from 'next-auth/react';
import { AgGridReact } from 'ag-grid-react';

interface UpcLogDetailProps {
  id: number;
  skuNm2: string;
  onClose: () => void;
}

/**
 * 상품생산 단가 상세 이력 조회 모달 컴포넌트
 */
const UpcLogDetail: React.FC<UpcLogDetailProps> = ({ id, skuNm2, onClose }) => {
  const session = useSession();
  const gridRef = useRef<AgGridReact>(null);

  // AG-Grid 컬럼 정의
  const [columnDefs] = React.useState<ColDef[]>([
    {
      field: 'no',
      headerName: 'No',
      maxWidth: 40,
      minWidth: 40,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      // 같은번호 안나오게 셀렌더
      cellRenderer: (props: ICellRendererParams) => {
        const currentNo = props.value;
        const rowIndex = props.node.rowIndex;
        if (rowIndex === null || rowIndex === 0) return currentNo;

        const prevRow = props.api.getDisplayedRowAtIndex(rowIndex - 1);
        const prevNo = prevRow?.data?.no;
        // 이전 행의 no와 현재 행의 no가 같으면 빈 값 반환
        return currentNo === prevNo ? '' : currentNo;
      },
    },
    {
      field: 'status',
      headerName: '상태',
      minWidth: 40,
      maxWidth: 40,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'updTm',
      headerName: '변경일자',
      minWidth: 140,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: ({ value }) => {
        return Utils.getFormattedDate(value);
      },
    },
    {
      field: 'updUser',
      headerName: '작업자',
      minWidth: 80,
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'compNm',
      headerName: '생산처',
      minWidth: 130,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'mainYn',
      headerName: '메인여부',
      minWidth: 60,
      maxWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: 'agCheckboxCellRenderer',
      valueGetter: (params) => {
        return params.data.sleepYn === 'Y'; // 'Y'일 때 체크, 'N'일 때 체크 해제
      },
      editable: false, // 수정 불가
    },
    {
      field: 'gagongAmt',
      headerName: '공임비',
      minWidth: 130,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'etcCntn',
      headerName: '비고',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
  ]);

  /**
   * 상세 이력 데이터 조회
   */
  const { data: loadData, isLoading } = useQuery(['upcLogDetail', id], () =>
    authApi.get(`/past/upcLog/detail/${id}`, {
      params: {
        partnerId: session.data?.user.partnerId,
      },
    }),
  );

  /**
   * 모달 닫기 핸들러
   */
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <PopupLayout
      open={true}
      isEscClose={true}
      width={1000}
      title={`${skuNm2} - 단가 변경이력`}
      onClose={handleClose}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn" onClick={handleClose}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <TunedGrid
          ref={gridRef}
          rowData={loadData?.data?.body || []}
          loading={isLoading}
          columnDefs={columnDefs}
          suppressRowClickSelection={true}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
        />
      </PopupContent>
    </PopupLayout>
  );
};

export default UpcLogDetail;
