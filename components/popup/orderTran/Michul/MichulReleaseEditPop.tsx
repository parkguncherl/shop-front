import React, { useEffect, useRef, useState } from 'react';
import { PopupContent } from '../../PopupContent';
import { PopupFooter } from '../../PopupFooter';
import Loading from '../../../Loading';
import { PopupLayout } from '../../PopupLayout';
import { useTodayStore } from '../../../../stores/useTodayStore';
import { AgGridReact } from 'ag-grid-react';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';
import { MichulOrderEditPop } from './MichulOrderEditPop';

/** 출고수정 팝업 */
export const MichulReleaseEditPop = () => {
  /** 금일내역 스토어 - State */
  const [openModal, modalType, closeModal] = useTodayStore((s) => [s.openModal, s.modalType, s.closeModal]);

  /** 컬럼 설정  */
  const [columnDefs, setColumnDefs] = useState([
    { headerName: 'ID', field: 'id', sortable: true },
    { headerName: 'Name', field: 'name', sortable: true },
    { headerName: 'Age', field: 'age', sortable: true },
    { headerName: 'Country', field: 'country', sortable: true },
  ]);
  const rowData = [
    // 임시
    { id: 1, name: 'John Doe', age: 30, country: 'USA' },
    { id: 2, name: 'Jane Smith', age: 25, country: 'Canada' },
    { id: 3, name: 'Michael Brown', age: 40, country: 'UK' },
    { id: 4, name: 'Emily Davis', age: 35, country: 'Australia' },
    { id: 5, name: 'David Lee', age: 28, country: 'Japan' },
  ];

  return (
    <PopupLayout
      width={820}
      isEscClose={true}
      open={modalType.type === 'RELEASEEDIT'}
      title={'출고보류 수정하기'}
      onClose={() => {
        closeModal('RELEASEEDIT');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn" title="미송처리">
              미송처리
            </button>
            <button className="btn" title="미출처리">
              미출처리
            </button>
            <button className="btn" title="주문취소">
              주문취소
            </button>
            <button className="btn btnBlue" title="저장">
              저장
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('RELEASEEDIT')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="ag-theme-alpine pop">
          <AgGridReact
            headerHeight={35}
            columnDefs={columnDefs && []}
            rowData={rowData}
            gridOptions={{ rowHeight: 24 }}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
          />
        </div>
      </PopupContent>
      {/*<Loading />*/}
    </PopupLayout>
  );
};
