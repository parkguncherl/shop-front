/**
 *   WMS > 입고 > 입하이력 > 발주/수선발주 Component > 상세이력
 * */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PopupContent, PopupFooter, PopupLayout } from '../../popup';
import { Table } from '../../content';
import TunedGrid from '../../grid/TunedGrid';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import CustomGridLoading from '../../CustomGridLoading';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import { ConfirmModal } from '../../ConfirmModal';
import { useInstockStore } from '../../../stores/wms/uselnstockStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { toastError, toastInfo, toastSuccess } from '../../ToastMessage';
import { InstockHistoryResponseInstockHistoryFactoryDetail } from '../../../generated';
import { ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import { AgGridReact } from 'ag-grid-react';
import { useSession } from 'next-auth/react';
import { cancelInStock, deleteStock } from '../../../api/wms-api';

const FactoryAsnHistoryPop = ({ dtlParam, titleData }: { dtlParam: any; titleData: any }) => {
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
    ['/instockHistory/factory/detail', dtlParam],
    () =>
      authApi.get('/instockHistory/factory/detail', {
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
      field: 'asnType',
      headerName: 'asnType',
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      hide: true,
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      minWidth: 200,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'repAsn',
      headerName: '입하추가',
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'stockCnt',
      headerName: '입하완료',
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'cancelInstockCnt',
      headerName: '입하취소',
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'stockDtm',
      headerName: '작업일시',
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => (params.value ? dayjs(params.value).format('M/DD (ddd) HH:mm:ss') : ''),
    },
    {
      field: 'stockUser',
      headerName: '작업자',
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
  ];

  /** 최초 데이타 렌더링 및 데이타 업데이트시 이벤트  */
  const onRowDataUpdated = useCallback(() => {
    updateTotals(); // 하단 합계 계산
  }, []);

  /** 그리드 하단 합계 업데이트 함수 */
  const updateTotals = () => {
    let stockCnt = 0;
    let cancelInstockCnt = 0;
    const uniqueSkuTypes: Set<string> = new Set();

    gridRef.current?.api.forEachNode((node) => {
      stockCnt += Number(node.data.stockCnt || 0);
      cancelInstockCnt += Number(node.data.cancelInstockCnt || 0);

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
        cancelInstockCnt: cancelInstockCnt,
      },
    ]);
  };

  /** 입하취소 버튼클릭 */
  const handleCancleClick = () => {
    const selectedNodes = gridRef.current?.api.getSelectedNodes();
    if (selectedNodes && selectedNodes.length > 0) {
      const paramsList: any = [];
      let hasCancelledItem = false;

      selectedNodes.forEach((node) => {
        if (node.data.cancelInstockCnt > 0) {
          hasCancelledItem = true;
        }

        const params = {
          logisId: Number(session.data?.user.workLogisId),
          partnerId: node.data.partnerId,
          factoryId: node.data.factoryId,
          workYmd: node.data.workYmd,
          asnId: node.data.asnId,
          skuId: node.data.skuId,
          asnType: node.data.asnType,
        };
        paramsList.push(params);
      });

      // 하나라도 취소된 건이 있으면 에러 메시지 표시
      if (hasCancelledItem) {
        toastError('입하 취소된 건은 입하 취소하실 수 없습니다.');
        return;
      }
      setParamsList(paramsList);
      setDeleteOpen(true); // 팝업닫기
    } else {
      // 선택 안했을시
      toastError('입하취소하실 내용을 선택해주세요.');
    }
  };

  /** 입하취소 */
  const queryClient = useQueryClient();
  const { mutate: cancelStockMutate, isLoading: isCancleStockLoading } = useMutation(cancelInStock, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        if (e.data.resultMessage) {
          toastInfo(e.data.resultMessage);
        } else {
          toastSuccess('해당 건 취소 되었습니다.');
        }

        await queryClient.invalidateQueries(['/instockHistory/factory/detail']);
        await queryClient.invalidateQueries(['/instockHistory/factory/paging']);
        closeModal('INSTOCK_FACTORY_HISTORY_POP');
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error(err);
      toastError('삭제 중 오류가 발생하였습니다.');
    },
  });

  /** 입하취소 */
  const handleCancle = () => {
    cancelStockMutate(paramsList);
  };

  return (
    <PopupLayout
      width={900}
      open={modalType.type === 'INSTOCK_FACTORY_HISTORY_POP' && modalType.active}
      onClose={() => {
        closeModal('INSTOCK_FACTORY_HISTORY_POP');
      }}
      title={
        <div className="instockTitle">
          <span className="partnerNm">{titleData.partnerNm}</span> 고객사의
          <span className="title"> {titleData.factoryNm}</span> 생산처 발주건 상세 이력
        </div>
      }
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn" title="입하취소" onClick={handleCancleClick}>
              입하취소
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('INSTOCK_FACTORY_ASN_POP')}>
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

        <ConfirmModal
          title={
            '<div class="confirmMsg"><span class="small">현재 선택한 상품을 </span><span class="big"><strong>입하취소</strong>&nbsp;하시겠어요?</span><span class="notice">취소된 목록은 입하등록에서 다시 조회 할 수 있어요</span></div>'
          }
          open={deleteOpen}
          onClose={() => {
            setDeleteOpen(false);
          }}
          onConfirm={() => {
            handleCancle();
            setDeleteOpen(false);
          }}
        />
      </PopupContent>
    </PopupLayout>
  );
};

export default FactoryAsnHistoryPop;
