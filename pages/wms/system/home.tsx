/**
 회사정보
 /wms/system/home
 */

import React, { useEffect, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { HomeResponseDetail } from '../../../generated';
import { Pagination, Table, Title, toastError, toastSuccess } from '../../../components';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { useHomeStore } from '../../../stores/wms/useHomeStore';
import { CellClickedEvent, CellDoubleClickedEvent, ColDef } from 'ag-grid-community';
import HomeFormModal from '../../../components/popup/wms/HomeFormModal';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { Modal, Button } from 'antd';

// 홈 컴포넌트 정의
const Home = () => {
  /** Grid Api */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();
  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  const [paging, setPaging, selectedHome, setSelectedHome, modalType, openModal, closeModal] = useHomeStore((s) => [
    s.paging,
    s.setPaging,
    s.selectedHome,
    s.setSelectedHome,
    s.modalType,
    s.openModal,
    s.closeModal,
  ]);

  const [columnDefs] = useState<ColDef[]>([
    { field: 'homeNm', headerName: '업체명', minWidth: 150, suppressHeaderMenuButton: true },
    { field: 'homeFaxNo', headerName: '팩스번호', minWidth: 120, suppressHeaderMenuButton: true },
    { field: 'homeAddr', headerName: '주소', minWidth: 200, suppressHeaderMenuButton: true },
    { field: 'homeTelNo', headerName: '전화번호', minWidth: 120, suppressHeaderMenuButton: true },
    { field: 'ceoNm', headerName: '대표자명', minWidth: 120, suppressHeaderMenuButton: true },
    { field: 'repTelNo', headerName: '대표연락처', minWidth: 120, suppressHeaderMenuButton: true },
    { field: 'homeCompNo', headerName: '사업자번호', minWidth: 120, suppressHeaderMenuButton: true },
    { field: 'homeEmail', headerName: '이메일', minWidth: 150, suppressHeaderMenuButton: true },
    { field: 'homeAccount', headerName: '입금계좌', minWidth: 150, suppressHeaderMenuButton: true },
  ]);

  const {
    data: homesResponse,
    isLoading,
    isSuccess: isListSuccess,
    refetch: homeRefetch,
  } = useQuery(['/home', paging.curPage], () =>
    authApi.get('/home', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
      },
    }),
  );

  useEffect(() => {
    if (isListSuccess) {
      const { body, resultCode, resultMessage } = homesResponse.data;
      if (body) {
        setPaging({ ...paging, totalRowCount: body.rows.length });
      } else {
        toastError('물류센터정보 조회 중 오류가 발생했습니다.');
      }
    }
  }, [homesResponse, isListSuccess, setPaging]);

  const search = async () => {
    setPaging({ curPage: 1 });
    await homeRefetch();
  };

  useEffect(() => {
    search();
  }, []);

  const onCellClicked = async (cellClickedEvent: CellDoubleClickedEvent) => {
    const { data } = cellClickedEvent;
    setSelectedHome(data);
    openModal('MOD');
  };

  return (
    <div>
      <Title title="회사정보" search={search} />

      <Table>
        <div className={'ag-theme-alpine noSearch'}>
          <AgGridReact
            headerHeight={35}
            onGridReady={onGridReady}
            loading={isLoading}
            rowData={homesResponse?.data?.body.rows || []} // 기본값 처리
            gridOptions={{ rowHeight: 28 }}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            paginationPageSize={paging.pageRowCount}
            rowSelection={'single'}
            onCellDoubleClicked={onCellClicked}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
          />
        </div>
        <div className="btnArea">
          <button
            className="btn"
            onClick={() => {
              openModal('ADD');
              setSelectedHome({});
            }}
          >
            회사정보 생성
          </button>
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
      {modalType.active && <HomeFormModal />}
    </div>
  );
};

export default Home;
