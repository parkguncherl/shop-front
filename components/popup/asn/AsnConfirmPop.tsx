import React, { useEffect, useRef, useState } from 'react';
import { useAsnMngStore } from '../../../stores/useAsnMngStore';
import { ColDef } from 'ag-grid-community';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { PopupLayout } from '../PopupLayout';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { toastError, toastSuccess } from '../../ToastMessage';
import TunedGrid from '../../grid/TunedGrid';
import { useQueryClient } from '@tanstack/react-query';
const AsnConfirmPop = () => {
  const queryClient = useQueryClient();

  /** store */
  const [modalType, closeModal, updateAsns, selectedAsnPagingList, setSelectedAsnPagingList] = useAsnMngStore((s) => [
    s.modalType,
    s.closeModal,
    s.updateAsns,
    s.selectedAsnPagingList,
    s.setSelectedAsnPagingList,
  ]);

  /** 컬럼 정의 */
  const ColsForAsnConfirmPop: ColDef[] = [
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
      field: 'sharp',
      headerName: '#',
      minWidth: 50,
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'mainFactoryNm',
      headerName: '메인생산처',
      maxWidth: 120,
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'prodNm',
      headerName: '상품명',
      maxWidth: 130,
      minWidth: 130,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuColor',
      headerName: '칼라',
      maxWidth: 90,
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuSize',
      headerName: '사이즈',
      maxWidth: 90,
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'genCnt',
      headerName: '발주수량',
      maxWidth: 90,
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      editable: true,
    },
  ];

  /** Component 참조 */
  const RefForGrid = useRef<AgGridReact>(null);

  const [comfirmedDataList, setComfirmedDataList] = useState<any[]>([]);

  useEffect(() => {
    const dataList: any[] = [];
    for (let i = 0; i < selectedAsnPagingList.length; i++) {
      if (selectedAsnPagingList[i].genCnt && selectedAsnPagingList[i].genCnt != 0) {
        dataList.push({
          ...selectedAsnPagingList[i],
          sharp: i + 1,
        });
      }
    }
    if (dataList.length != 0) {
      setComfirmedDataList(dataList);
    }
  }, [selectedAsnPagingList]);

  return (
    <PopupLayout
      width={700}
      isEscClose={true}
      open={modalType.type === 'CONFIRMATION_CONFIRM' && modalType.active}
      title={'해당 발주목록을 확정 하시겠습니까?'}
      onClose={() => {
        closeModal('CONFIRMATION_CONFIRM');
      }}
      footer={
        <PopupFooter>
          <div className={'btnArea'}>
            <button
              className="btn btnBlue"
              title="확인"
              onClick={() => {
                const confirmedElements: any[] = [];
                for (let i = 0; i < comfirmedDataList.length; i++) {
                  if (comfirmedDataList[i].genCnt && comfirmedDataList[i].genCnt != 0) {
                    confirmedElements.push({
                      id: comfirmedDataList[i].asnId as number,
                      genCnt: comfirmedDataList[i].genCnt as number,
                      asnStatCd: '2',
                    });
                  }
                }
                if (confirmedElements.length != 0) {
                  updateAsns(confirmedElements).then(async (result) => {
                    const { resultCode, resultMessage } = result.data;
                    if (resultCode === 200) {
                      toastSuccess('해당하는 수량의 발주가 확정되었습니다.');
                      await queryClient.invalidateQueries(['/asnMng/skuExpectInfo/expected']);
                      closeModal('CONFIRMATION_CONFIRM');
                      setSelectedAsnPagingList([]);
                    } else {
                      toastError(resultMessage);
                    }
                  });
                }
              }}
            >
              확인
            </button>
          </div>
          <div className="btnArea">
            <button className="btn" title="닫기" onClick={() => closeModal('CONFIRMATION_CONFIRM')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <TunedGrid
          headerHeight={30}
          onGridReady={(e) => {
            e.api.sizeColumnsToFit();
          }}
          rowData={comfirmedDataList}
          columnDefs={ColsForAsnConfirmPop}
          defaultColDef={defaultColDef}
          gridOptions={{
            rowHeight: 24,
          }}
          ref={RefForGrid}
        />
      </PopupContent>
    </PopupLayout>
  );
};

export default AsnConfirmPop;
