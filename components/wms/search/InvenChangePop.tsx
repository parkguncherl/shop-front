import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PopupContent, PopupFooter, PopupLayout } from '../../popup';
import { InventoryinfoResponsePaging, InventoryinfoUpdateRequest, OrderDetCreate } from '../../../generated';
import { toastError, toastSuccess } from '../../ToastMessage';
import { useMutation } from '@tanstack/react-query';
import { useInventoryInfoStore } from '../../../stores/wms/useInventoryInfoStore';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { CellKeyDownEvent, ColDef, FullWidthCellKeyDownEvent } from 'ag-grid-community';
import { Utils } from '../../../libs/utils';
import { AgGridReact } from 'ag-grid-react';
import TunedGrid from '../../grid/TunedGrid';
import { useSession } from 'next-auth/react';

interface InvenComponentProps {
  data?: InventoryinfoResponsePaging[];
  zoneOption: Option[];
  locationOption: Option[];
  fetchPopUp: () => void;
}

interface Option {
  key: number;
  value: number;
  label: string;
  zoneId: number;
}

const InvenChangePop: React.FC<InvenComponentProps> = (props) => {
  console.log('InvenComponentProps ==>', props);
  const [modalType, closeModal, updateInventoryInfo] = useInventoryInfoStore((s) => [s.modalType, s.closeModal, s.updateInventoryInfo]);
  const gridRef = useRef<AgGridReact>(null);
  const [gridData, setGridData] = useState<InventoryinfoResponsePaging[]>();
  const [zoneOption, setZoneOption] = useState<Option[]>();
  const [locationOption, setLocationOption] = useState<Option[]>();
  // 세션 정보
  const session = useSession();

  useEffect(() => {
    setGridData(props.data || []);
    setZoneOption(props.zoneOption);
    setLocationOption(props.locationOption);
  }, [props.data, props.zoneOption, props.locationOption]);

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
        minWidth: 150,
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
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'toZone',
        headerName: 'TO ZONE',
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
        editable: true,
        cellClass: 'editCell',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: zoneOption ? zoneOption.map((item: any) => item.value) : [],
        },
        valueFormatter: (params: any) => {
          const value = params.value ? params.value : 0;
          const option = zoneOption?.find((opt: Option) => opt.value === value);
          return option ? option.label : '';
        },
      },
      {
        field: 'toLoc',
        headerName: 'TO LCTN',
        minWidth: 160,
        maxWidth: 160,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
        editable: true,
        cellClass: 'editCell',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: (params: any) => {
          const selectedZoneId = params.data.toZone; // 행 데이터에서 toZone 값
          const filteredLocations = locationOption ? locationOption.filter((item: Option) => item.zoneId === selectedZoneId) : [];
          return {
            values: filteredLocations ? filteredLocations.map((item: any) => item.value) : [],
          };
        },
        valueFormatter: (params: any) => {
          const option: any = props.locationOption.find((opt: any) => opt.value === params.value);
          return option ? option.label : 'LCTN 선택';
        },
      },
      {
        field: 'chgCnt',
        headerName: '변경수량',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
        editable: true,
      },
    ],
    [zoneOption, locationOption],
  );

  /** 로케이션 수정 */
  const { mutate: updateInventoryInfoMutate } = useMutation(updateInventoryInfo, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        closeModal('INVEN_CHANGE');
        props.fetchPopUp();
        /** 새로운 주문을 받을수 있도록 모든 정보(상태) 초기화 */
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  const makeAllDataFromFirstZoneLoc = () => {
    const api = gridRef.current?.api;
    const focusedCell = api?.getFocusedCell();

    if (api && focusedCell) {
      const focusedRowIndex = focusedCell.rowIndex; // 포커스된 셀의 rowIndex 가져오기
      const focusedRowNode = api.getDisplayedRowAtIndex(focusedRowIndex);
      if (focusedRowNode) {
        const { toZone, toLoc } = focusedRowNode.data;
        api.forEachNode((node) => {
          if (node !== focusedRowNode) {
            // 변경이 필요한 경우에만
            if (node.data.toZone !== toZone) {
              node.setDataValue('toZone', toZone);
            }
            if (node.data.toLoc !== toLoc) {
              node.setDataValue('toLoc', toLoc);
            }
          }
          node.setDataValue('chgCnt', node.data.centerCnt);
        });
      }
    }
  };

  const handleSubmit = () => {
    gridRef.current?.api.stopEditing(false);
    const updateDataList: InventoryinfoUpdateRequest[] =
      gridData?.map((item) => ({
        locId: item.locId,
        skuId: item.skuId,
        skuNm: item.skuNm,
        toZone: item.toZone,
        toLoc: item.toLoc,
        chgCnt: item.chgCnt,
      })) ?? [];
    const hasInvalidData = updateDataList.some((item) => !item.toZone || !item.toLoc || item.chgCnt === null || item.chgCnt === undefined);
    if (hasInvalidData) {
      toastError('toZone, toLoc, 변경수랑은 모두 필수 입니다.');
    } else {
      updateInventoryInfoMutate(updateDataList);
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
      width={1100}
      open={modalType.type === 'INVEN_CHANGE' && modalType.active}
      title={'[' + session.data?.user.workLogisNm + ']재고위치 변경처리'}
      isEscClose={true}
      onClose={() => {
        closeModal('INVEN_CHANGE');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" onClick={makeAllDataFromFirstZoneLoc}>
              LCTN 일괄변경
            </button>
            <button className="btn btnBlue" onClick={handleSubmit}>
              확인
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('INVEN_CHANGE')}>
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

export default InvenChangePop;
