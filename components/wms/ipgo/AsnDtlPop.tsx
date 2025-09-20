import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { GridSetting } from '../../../libs/ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { toastError, toastSuccess } from '../../ToastMessage';
import TunedGrid from '../../grid/TunedGrid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AsnResponseDetail } from '../../../generated';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import CustomGridLoading from '../../CustomGridLoading';
import { authApi } from '../../../libs';
import { Utils } from '../../../libs/utils';
import { Tooltip } from 'react-tooltip';
import { useAsnStore } from '../../../stores/wms/useAsnStore';
import { PopupContent, PopupFooter, PopupLayout } from '../../popup';

/**
 *  WMS / 입고 / 발주상세 팝업
 */

const AsnDtlPop = ({ dtlParam }: { dtlParam: any }) => {
  /** store & state */
  const gridRef = useRef<AgGridReact>(null);
  const [modalType, openModal, closeModal, updateAsn] = useAsnStore((s) => [s.modalType, s.openModal, s.closeModal, s.updateAsn]);
  const [rowData, setRowData] = useState<AsnResponseDetail[]>([]);
  const [titleData, setTitleData] = useState<{ partnerNm: string; factoryNm: string }>();
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<AsnResponseDetail[]>([]); // 합계데이터 만들기

  useEffect(() => {
    if (!dtlParam) {
      toastError('내용을 불러오지 못했어요.\n 페이지를 새로고침 후 다시 이용해주세요.');
      closeModal('ASN_DETAIL');
    }
  }, [dtlParam]);

  /** 상세 데이타 조회 */
  const {
    data: loadDetail,
    isLoading,
    isSuccess,
    refetch: detailRefetch,
  } = useQuery(
    ['/wms/asn/detail', dtlParam],
    () =>
      authApi.get('/wms/asn/detail', {
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
          // console.log('상세내용 응답 >>', body);
          setRowData(body || []);
          setTitleData({
            partnerNm: body[0].partnerNm,
            factoryNm: body[0].factoryNm,
          });
        } else {
          toastError('데이타를 조회하는데 장애가 발생했어요. 관리자에게 문의해주세요.');
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [isSuccess, loadDetail]);

  /** 입하등록 추가 */
  const queryClient = useQueryClient();
  const { mutate: updateAsnMutate } = useMutation(updateAsn, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('추가되었습니다.');
        await queryClient.invalidateQueries(['/wms/asn/paging']);
        await queryClient.invalidateQueries(['/wms/asn/stat/dashboard']);
        await queryClient.invalidateQueries(['/wms/asn/detail']);
        closeModal('ASN_DETAIL');
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error(err);
      toastError('등록 중 오류가 발생하였습니다.');
    },
  });

  /** 컬럼 정의 */
  const columnDefs: ColDef[] = [
    {
      field: 'no',
      headerName: 'No',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      minWidth: 200,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'genCnt',
      headerName: '발주수량',
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    {
      field: 'befInstockCnt',
      headerName: '기입고수량',
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
  ];

  /** 최초 데이타 렌더링 및 데이타 업데이트시 이벤트  */
  const onRowDataUpdated = useCallback(() => {
    updateTotals(); // 하단 합계 계산
  }, []);

  /** 그리드 하단 합계 업데이트 함수 */
  const updateTotals = () => {
    let genCnt = 0;
    let befInstockCnt = 0;

    gridRef.current?.api.forEachNode((node) => {
      genCnt += Number(node.data.genCnt || 0);
      befInstockCnt += Number(node.data.befInstockCnt || 0);
    });

    // 합계 데이터를 상태로 설정하여 pinned bottom row에 전달
    setPinnedBottomRowData([
      {
        factoryNm: 'Total',
        genCnt: genCnt,
        befInstockCnt: befInstockCnt,
      },
    ]);
  };

  /** 입하등록 추가 이벤트 */
  const handleAsnUpdate = async () => {
    const gridApi = gridRef.current?.api;

    const selectedNodes = gridApi?.getSelectedNodes();
    console.log('입하등록 추가 선택 params >>', selectedNodes);
    const paramsArray: any[] = [];
    if (selectedNodes && selectedNodes?.length > 0) {
      // const asnIds = selectedNodes.map((item) => item.data.asnId);
      selectedNodes.forEach((item) => {
        paramsArray.push({
          asnId: item.data.asnId,
        });
      });
      console.log(paramsArray);
      updateAsnMutate(paramsArray);
    } else {
      toastError('입하등록 추가할 발주 항목을 선택해주세요.');
    }
  };

  return (
    <PopupLayout
      width={555}
      isEscClose={false}
      open={modalType.type === 'ASN_DETAIL' && modalType.active}
      title={
        <div className="instockTitle">
          <span className="partnerNm">{titleData?.partnerNm}</span> 고객사의
          <span className="title"> {titleData?.factoryNm}</span> 생산처 발주건 상세 내역
        </div>
      }
      onClose={() => {
        closeModal('ASN_DETAIL');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div className="left"></div>
            <div className="right">
              <Tooltip id="my-tooltip" />
              <button
                className="btn btnBlue"
                title="입하등록 추가"
                data-tooltip-id="my-tooltip"
                data-tooltip-content="단축키는 (F10)입니다."
                data-tooltip-place="top-end"
                onClick={handleAsnUpdate}
              >
                입하등록 추가
              </button>
              <button
                className="btn"
                title="닫기"
                onClick={() => {
                  closeModal(modalType.type);
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <TunedGrid<AsnResponseDetail>
          ref={gridRef}
          rowData={rowData ?? []}
          columnDefs={columnDefs}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          preventPersonalizedColumnSetting={true}
          onFirstDataRendered={onRowDataUpdated}
          onRowDataUpdated={onRowDataUpdated}
          pinnedBottomRowData={pinnedBottomRowData}
          className={'check wmsPop'}
        />
      </PopupContent>
    </PopupLayout>
  );
};

export default AsnDtlPop;
