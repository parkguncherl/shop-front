/**
 *   WMS > 입고 > 입하이력 > 매장분반납 Component > 상세이력
 * */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AgGridReact } from 'ag-grid-react';
import { useInstockStore } from '../../../stores/wms/uselnstockStore';
import { InstockHistoryResponseInstockHistoryFactoryDetail } from '../../../generated';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { toastError } from '../../ToastMessage';
import { ColDef } from 'ag-grid-community';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import dayjs from 'dayjs';
import { PopupContent, PopupFooter, PopupLayout } from '../../popup';
import { Table } from '../../content';
import TunedGrid from '../../grid/TunedGrid';
import CustomGridLoading from '../../CustomGridLoading';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import { ConfirmModal } from '../../ConfirmModal';

const StoreReturnAsnHistoryPop = ({ dtlParam, titleData }: { dtlParam: any; titleData: any }) => {
  const session = useSession();
  const gridRef = useRef<AgGridReact>(null);
  const [modalType, closeModal] = useInstockStore((s) => [s.modalType, s.closeModal]);
  const [rowData, setRowData] = useState<InstockHistoryResponseInstockHistoryFactoryDetail[]>();
  const [pinnedRowData, setPinnedRowData] = useState<any[]>();
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [paramsList, setParamsList] = useState<any[]>([]);

  /** 상세 조회 */
  const {
    data: loadDetail,
    isLoading,
    isSuccess,
    refetch: detailRefetch,
  } = useQuery(
    ['/instockHistory/return/detail', dtlParam],
    () =>
      authApi.get('/instockHistory/return/detail', {
        params: dtlParam,
      }),
    {
      enabled: !!dtlParam,
      refetchOnWindowFocus: false, // 윈도우 포커스시 리패치 비활성화
      refetchOnReconnect: true, // 네트워크 재연결시 리패치
      retry: 1, // 실패시 1회 재시도
    },
  );

  useEffect(() => {
    if (isSuccess) {
      const { resultCode, body, resultMessage } = loadDetail.data;
      if (resultCode === 200) {
        if (body) {
          setRowData(body || []);
        } else {
          toastError('상세정보가 없어 잠시 후 다시 이용해주세요');
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [isSuccess, loadDetail]);

  /** 컬럼 정의 */
  const columns: ColDef[] = [
    {
      field: 'no',
      headerName: 'No.',
      minWidth: 50,
      maxWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      minWidth: 200,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'asnStatNm',
      headerName: '입하추가',
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'genCnt',
      headerName: '반납확정',
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'stockCnt',
      headerName: '입하수량',
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    // {
    //   field: 'cancelInstockCnt',
    //   headerName: '입하취소',
    //   minWidth: 90,
    //   cellStyle: GridSetting.CellStyle.CENTER,
    //   suppressHeaderMenuButton: true,
    // },
    {
      field: 'creTm',
      headerName: '입하일시',
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => (params.value ? dayjs(params.value).format('M/DD (ddd) HH:mm:ss') : ''),
    },
  ];

  /** 최초 데이타 렌더링 및 데이타 업데이트시 이벤트  */
  const onRowDataUpdated = useCallback(() => {
    updateTotals(); // 하단 합계 계산
  }, []);

  /** 그리드 하단 합계 업데이트 함수 */
  const updateTotals = () => {
    let stockCnt = 0;
    let genCnt = 0;
    const uniqueSkuTypes: Set<string> = new Set();

    gridRef.current?.api.forEachNode((node) => {
      stockCnt += Number(node.data.stockCnt || 0);
      genCnt += Number(node.data.genCnt || 0);
      // cancelInstockCnt += Number(node.data.cancelInstockCnt || 0);

      const skuNm = node.data.skuNm;
      if (skuNm) {
        const skuType = skuNm.split('.')[0];
        uniqueSkuTypes.add(skuType);
      }
    });

    setPinnedRowData([
      {
        skuNm: `품목수 : ${uniqueSkuTypes.size}`,
        stockCnt: stockCnt,
        genCnt: genCnt,
      },
    ]);
  };

  return (
    <PopupLayout
      width={900}
      open={modalType.type === 'INSTOCK_RETURN_HISTORY_POP' && modalType.active}
      onClose={() => {
        closeModal('INSTOCK_RETURN_HISTORY_POP');
      }}
      title={
        <div className="instockTitle">
          <span className="partnerNm">{titleData.partnerNm}</span> 고객사의
          <span className="title">매장분반납</span> 상세 이력
        </div>
      }
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn" title="닫기" onClick={() => closeModal('INSTOCK_RETURN_HISTORY_POP')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <Table>
          <TunedGrid
            ref={gridRef}
            onGridReady={(e) => {
              e.api.sizeColumnsToFit();
            }}
            rowData={rowData}
            columnDefs={columns}
            defaultColDef={defaultColDef}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            onFirstDataRendered={onRowDataUpdated}
            onRowDataUpdated={onRowDataUpdated}
            pinnedBottomRowData={pinnedRowData}
            getRowClass={(params) => {
              if (params.node.rowIndex !== 0) {
                if (params.data.cancelInstockCnt > 0) {
                  return 'noEditRow';
                }
              }
              return '';
            }}
            className={'pop instock check'}
          />
        </Table>
      </PopupContent>
    </PopupLayout>
  );
};

export default StoreReturnAsnHistoryPop;
