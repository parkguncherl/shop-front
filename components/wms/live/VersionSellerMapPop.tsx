import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PopupContent, PopupFooter, PopupLayout } from '../../popup';
import { LbRequestLiveVersionSellerUpdate, LbVersionSellerMapResponseList } from '../../../generated';
import { toastError, toastSuccess } from '../../ToastMessage';
import { useMutation, useQuery } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { CellKeyDownEvent, ColDef, FullWidthCellKeyDownEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import TunedGrid from '../../grid/TunedGrid';
import { useSession } from 'next-auth/react';
import { authApi } from '../../../libs';
import { useProductListStore } from '../../../stores/wms/useProductListStore';

interface InvenComponentProps {
  versionId: number;
  fetchPopUp: () => void;
}

const VersionSellerMapPop: React.FC<InvenComponentProps> = (props) => {
  console.log('InvenComponentProps ==>', props);
  const [modalType, closeModal, updateVersionSellerInfo, deleteVersionSellerInfo, copyVersionSellerInfo] = useProductListStore((s) => [
    s.modalType,
    s.closeModal,
    s.updateVersionSellerInfo,
    s.deleteVersionSellerInfo,
    s.copyVersionSellerInfo,
  ]);
  const gridRef = useRef<AgGridReact>(null);
  const [gridData, setGridData] = useState<LbVersionSellerMapResponseList[]>();
  // 세션 정보
  const session = useSession();

  // 출고정보 목록 조회
  const {
    data: versionSellerMapInfos,
    isSuccess: isListSuccess,
    refetch: refetchVersionSellerMap,
  } = useQuery(
    ['/wms/lbProd/versionSellerMapListAll' + props.versionId], // filters 추가
    (): any => authApi.get('/wms/lbProd/versionSellerMapListAll/' + props.versionId),
    {
      enabled: props.versionId > 0,
    },
  );

  useEffect(() => {
    if (isListSuccess && versionSellerMapInfos?.data) {
      const { resultCode, body, resultMessage } = versionSellerMapInfos.data;
      if (resultCode === 200 && body) {
        console.log('body ==>', body);
        setGridData(body);
      } else {
        toastError(resultMessage || '재고 목록 조회에 실패했습니다.');
      }
    }
  }, [versionSellerMapInfos, isListSuccess]);

  useEffect(() => {
    setTimeout(() => {
      refetchVersionSellerMap();
    }, 200);
  }, []);

  const gridColumns = useMemo<ColDef<LbVersionSellerMapResponseList>[]>(
    () => [
      {
        field: 'no',
        headerName: 'No.',
        minWidth: 36,
        maxWidth: 36,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'lbSellerNm',
        headerName: '라방셀러명',
        minWidth: 200,
        maxWidth: 200,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'lbDate',
        headerName: '방송일',
        maxWidth: 120,
        minWidth: 120,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
        editable: true,
        cellEditor: 'agTextCellEditor', // 👈 일반 텍스트 에디터로 지정
      },
      {
        field: 'lbTime',
        headerName: '방송시간',
        maxWidth: 100,
        minWidth: 100,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
        editable: true,
        cellEditor: 'agTextCellEditor', // 👈 일반 텍스트 에디터로 지정
        valueFormatter: (params) => {
          return params.value; // 원본 값을 그대로 반환
        },
      },
      {
        field: 'lbDetail',
        headerName: '상세',
        maxWidth: 200,
        minWidth: 200,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
        editable: true,
        cellEditor: 'agTextCellEditor', // 👈 일반 텍스트 에디터로 지정
        valueFormatter: (params) => {
          return params.value; // 원본 값을 그대로 반환
        },
      },
      /*
      {
        field: 'sellerEtc',
        headerName: '셀러방송정보',
        minWidth: 400,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
        hide: true,
        cellEditor: 'agTextCellEditor', // 👈 일반 텍스트 에디터로 지정
        valueFormatter: (params) => {
          return params.value; // 원본 값을 그대로 반환
        },
      },
*/
    ],
    [],
  );

  /** 수정 */
  const { mutate: updateVersionSellerInfoMutate } = useMutation(updateVersionSellerInfo, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        props.fetchPopUp();
        refetchVersionSellerMap();
        /** 새로운 주문을 받을수 있도록 모든 정보(상태) 초기화 */
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  /** 복사 */
  const { mutate: copyVersionSellerInfoMutate } = useMutation(copyVersionSellerInfo, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('복사되었습니다.');
        props.fetchPopUp();
        refetchVersionSellerMap();
        /** 새로운 주문을 받을수 있도록 모든 정보(상태) 초기화 */
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  /** 수정 */
  const { mutate: deleteVersionSellerInfoMutate } = useMutation(deleteVersionSellerInfo, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('삭제되었습니다.');
        props.fetchPopUp();
        refetchVersionSellerMap();
        /** 새로운 주문을 받을수 있도록 모든 정보(상태) 초기화 */
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  const onCellKeyDown = (event: CellKeyDownEvent<LbRequestLiveVersionSellerUpdate, any> | FullWidthCellKeyDownEvent<LbRequestLiveVersionSellerUpdate, any>) => {
    const keyBoardEvent = event.event as KeyboardEvent;
    const target = event.event?.target as HTMLInputElement;
    console.log('target value ==> ', target.value);
    if (keyBoardEvent.key == 'Enter') {
      console.log('target value 2 ==> ', target.value);
      if (props.versionId < 1) {
        toastError('라방 버전이 잘못되었습니다. 다시 시도해주세요 ');
      } else {
        console.log('target value 2 ==> ', event.data);
        updateVersionSellerInfoMutate({
          lbVersion: props.versionId + '',
          lbVersionSellerId: event.data?.lbVersionSellerId,
          lbSellerId: event.data?.lbSellerId,
          lbDate: event.data?.lbDate,
          lbTime: event.data?.lbTime,
          lbDetail: event.data?.lbDetail,
        });
      }
    }
  };

  return (
    <PopupLayout
      width={800}
      isEscClose={true}
      open={modalType.type === 'VERSION_SELLER_MAP' && modalType.active}
      title={'[' + session.data?.user.workLogisNm + '] 라방셀러 매핑'}
      onClose={() => {
        closeModal('VERSION_SELLER_MAP');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button
              className="btn_tomato"
              title="리오더"
              onClick={() => {
                const nodes = gridRef.current?.api.getSelectedNodes();
                if (nodes && nodes.length === 1) {
                  const node = nodes[0];
                  copyVersionSellerInfoMutate({
                    lbVersionSellerId: node.data.lbVersionSellerId,
                  });
                } else {
                  toastError('리오더 건을 선택하세요 리오더 한건씩 처리할 수 있습니다.');
                }
              }}
            >
              리오더
            </button>
            <button
              className="btn_tomato"
              title="삭제"
              onClick={() => {
                const nodes = gridRef.current?.api.getSelectedNodes();
                if (nodes && nodes.length === 1) {
                  const node = nodes[0];
                  deleteVersionSellerInfoMutate({
                    lbVersion: props.versionId + '',
                    lbVersionSellerId: node.data.lbVersionSellerId,
                    lbSellerId: node.data?.lbSellerId,
                    sellerEtc: node.data?.sellerEtc,
                  });
                } else {
                  toastError('삭제할 건을 선택하세요 삭제는 한건씩 처리할 수 있습니다.');
                }
              }}
            >
              삭제하기
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('VERSION_SELLER_MAP')}>
              취소
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <TunedGrid
          columnDefs={gridColumns}
          rowData={gridData}
          defaultColDef={defaultColDef}
          onCellKeyDown={onCellKeyDown}
          singleClickEdit={true}
          ref={gridRef}
          className={'wmsDashboard check'}
        />
      </PopupContent>
    </PopupLayout>
  );
};

export default VersionSellerMapPop;
