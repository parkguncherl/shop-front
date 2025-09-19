import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PopupContent, PopupFooter, PopupLayout } from '../../popup';
import { InventoryinfoResponsePaging, OrderDetCreate } from '../../../generated';
import { toastError, toastSuccess } from '../../ToastMessage';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useInventoryInfoStore } from '../../../stores/wms/useInventoryInfoStore';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { CellKeyDownEvent, ColDef, FullWidthCellKeyDownEvent } from 'ag-grid-community';
import { Utils } from '../../../libs/utils';
import { AgGridReact } from 'ag-grid-react';
import TunedGrid from '../../grid/TunedGrid';
import { useSession } from 'next-auth/react';
import { authApi } from '../../../libs';

interface InspectionComponentProps {
  data?: InventoryinfoResponsePaging[];
  logisId: number;
  fetchPopUp: () => void;
}

const CreateInspectionPop: React.FC<InspectionComponentProps> = (props) => {
  console.log('CREATE_INSPECTION ==>', props);
  const [modalType, closeModal, insertInspectInfo] = useInventoryInfoStore((s) => [s.modalType, s.closeModal, s.insertInspectInfo]);
  const gridRef = useRef<AgGridReact>(null);
  const [gridData, setGridData] = useState<InventoryinfoResponsePaging[]>();
  const [inspectionTitle, setInspectionTitle] = useState<string>('');
  // 세션 정보
  const session = useSession();
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;
  // 재고위치정보 목록 조회
  const { data: inventoryLocationListInfos, isSuccess: isInventoryLocationListInfosSuccess } = useQuery({
    queryKey: ['/wms/inven/invenLocationList', props], // filters 추가
    queryFn: () =>
      authApi.get('/wms/inven/invenLocationList', {
        params: { logisId: workLogisId, skuIds: props.data?.map((item) => item.skuId) },
      }),
    enabled: props.data && props.data?.map((item) => item.skuId).length > 0,
  });

  useEffect(() => {
    if (isInventoryLocationListInfosSuccess) {
      console.log('isInventoryLocationListInfosSuccess ==>', inventoryLocationListInfos);
      setGridData(inventoryLocationListInfos.data.body || []);
    }
  }, [isInventoryLocationListInfosSuccess]);

  const gridColumns = useMemo<ColDef<InventoryinfoResponsePaging>[]>(
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
        field: 'partnerNm',
        headerName: '고객사',
        minWidth: 90,
        maxWidth: 90,
        cellStyle: GridSetting.CellStyle.LEFT,
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
        field: 'centerCnt',
        headerName: '빈블러',
        minWidth: 50,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'zoneCdNm',
        headerName: 'ZONE',
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'locAlias',
        headerName: 'LCTN',
        minWidth: 160,
        maxWidth: 160,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
    ],
    [],
  );

  /** 실사등록 */
  const { mutate: insertInspectInfoMutate } = useMutation(insertInspectInfo, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        setInspectionTitle('');
        toastSuccess('저장되었습니다.');
        closeModal('CREATE_INSPECTION');
        props.fetchPopUp();
        /** 새로운 주문을 받을수 있도록 모든 정보(상태) 초기화 */
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  const handleSubmit = () => {
    if (inspectionTitle) {
      gridRef.current?.api.stopEditing(false);
      const inspectDetList: any[] =
        gridData?.map((item) => ({
          locId: item.locId,
          skuId: item.skuId,
          befCnt: item.centerCnt,
        })) ?? [];
      insertInspectInfoMutate({ logisId: props.logisId, inspectTitle: inspectionTitle, inspectDetList: inspectDetList });
    } else {
      toastError('실사 제목을 입력하세요');
    }
  };

  const onCellKeyDown = (event: CellKeyDownEvent<OrderDetCreate, any> | FullWidthCellKeyDownEvent<OrderDetCreate, any>) => {
    const keyBoardEvent = event.event as KeyboardEvent;
    if (keyBoardEvent.key == 'Delete' || keyBoardEvent.key == 'Backspace') {
      /** 삭제 영역 */
      const MainGridRefCurrent = gridRef.current;
      if (MainGridRefCurrent) {
        // 선택된 행 가져오기
        const selectedNodes = MainGridRefCurrent.api.getSelectedNodes();
        const selectedRowIds = selectedNodes.map((node) => node.data.no); // no를 기준으로 행 식별
        if (selectedRowIds.length > 0) {
          // 선택된 행 제외한 데이터 필터링
          const updatedRowData = gridData?.filter((row) => !selectedRowIds.includes(row.no));
          // 행 번호 재조정
          const renumberedRowData = updatedRowData?.map((row, index) => ({
            ...row,
            no: index + 1,
          }));
          // 그리드 데이터 갱신
          setGridData(renumberedRowData);
        }
      }
    }
  };

  return (
    <PopupLayout
      width={850}
      isEscClose={true}
      open={modalType.type === 'CREATE_INSPECTION' && modalType.active}
      title={'[' + session.data?.user.workLogisNm + '] 재고실사 등록'}
      subTitle={'재고실사 결과 입력은 [재고실사] 메뉴에서 등록 해주세요'}
      onClose={() => {
        closeModal('CREATE_INSPECTION');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" onClick={handleSubmit}>
              확인
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('CREATE_INSPECTION')}>
              취소
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="formBox fileBox">
          <input
            type="text"
            value={inspectionTitle}
            onChange={(e) => setInspectionTitle(e.target.value)}
            placeholder="실사제목을 입력하세요."
            className="p-2 border rounded"
          />
        </div>

        <TunedGrid
          columnDefs={gridColumns}
          rowData={gridData}
          defaultColDef={defaultColDef}
          rowSelection={'multiple'}
          onCellKeyDown={onCellKeyDown}
          singleClickEdit={true}
          ref={gridRef}
          className={'wmsDashboard check'}
        />
      </PopupContent>
    </PopupLayout>
  );
};

export default CreateInspectionPop;
