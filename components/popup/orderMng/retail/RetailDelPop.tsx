import React, { useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { ColDef } from 'ag-grid-community';
import { PopupLayout } from '../../PopupLayout';
import { PopupFooter } from '../../PopupFooter';
import { ConfirmModal } from '../../../ConfirmModal';
import { useRetailStore } from '../../../../stores/useRetailStore';
import { RetailResponseDeleteRecommandPaging } from '../../../../generated';
import { GridSetting } from '../../../../libs/ag-grid';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';
import { PopupContent } from '../../PopupContent';
import { authApi } from '../../../../libs';
import Loading from '../../../Loading';
import TunedGrid from '../../../grid/TunedGrid';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { Pagination } from '../../../Pagination';
import useFilters from '../../../../hooks/useFilters';

export const RetailDelPop = () => {
  const [modalType, closeModal, delPaging, setDelPaging, deleteRetails] = useRetailStore((s) => [
    s.modalType,
    s.closeModal,
    s.delPaging,
    s.setDelPaging,
    s.deleteRetails,
  ]);
  const gridRef = useRef<AgGridReact>(null);
  const [confirmModal, setConfirmModal] = useState(false);

  const [filters, onChangeFilters] = useFilters<{ searchKeyword: string }>({
    searchKeyword: '',
  });

  const columnDefs: ColDef<RetailResponseDeleteRecommandPaging>[] = [
    {
      headerName: 'No',
      field: 'no',
      width: 60,
      editable: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      headerCheckboxSelection: true,
      checkboxSelection: true,
    },
    {
      headerName: '소매처',
      field: 'sellerNm',
      sortable: true,
      minWidth: 150,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      headerName: '등록일',
      field: 'regYmd',
      sortable: true,
      width: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      headerName: '경과기간',
      field: 'elapsedPeriod',
      sortable: true,
      width: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      headerName: '비고(화면)',
      field: 'etcScrCntn',
      sortable: true,
      minWidth: 200,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
  ];

  /** 삭제 페이징 목록 조회 */
  const {
    data: rowData,
    isLoading,
    refetch,
  } = useQuery(['/retail/delete/recommand-list', delPaging.curPage], () =>
    authApi.get('/retail/delete/recommand-list', {
      params: {
        curPage: delPaging.curPage,
        pageRowCount: delPaging.pageRowCount,
        ...filters,
      },
    }),
  );

  const handleDelBtn = () => {
    if (gridRef.current && gridRef.current.api.getSelectedNodes().length == 0) {
      toastError('삭제할 소매처를 선택해주세요.');
      return;
    }
    setConfirmModal(true);
  };

  // 삭제 처리
  const deleteRetail = async () => {
    if (gridRef.current && gridRef.current.api.getSelectedNodes().length != 0) {
      const idList = [];
      for (let i = 0; i < gridRef.current.api.getSelectedNodes().length; i++) {
        idList[idList.length] = gridRef.current.api.getSelectedNodes()[i].data.id;
      }

      // console.log('삭제 리스트 >>', idList);

      deleteRetails({ idList: idList }).then((result: any) => {
        const { resultCode, resultMessage } = result.data;
        if (resultCode === 200) {
          toastSuccess('소매처가 삭제되었습니다.');
          refetch();
        } else {
          toastError(resultMessage);
        }
      });
    } else {
      toastError('삭제할 소매처를 선택하십시요');
    }
  };

  return (
    <PopupLayout
      width={892}
      isEscClose={true}
      open={modalType.type === 'DELETE_RECOMMAND'}
      title={'소매처 삭제 추천 리스트'}
      onClose={() => closeModal('DELETE_RECOMMAND')}
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div>
              <button className="btn delete" title="삭제" onClick={handleDelBtn}>
                삭제
              </button>
            </div>
            <div>
              <button className="btn" title="닫기" onClick={() => closeModal('DELETE_RECOMMAND')}>
                닫기
              </button>
            </div>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        {/*<Search className="type_1">*/}
        {/*  <Search.Input*/}
        {/*    title={'소매처명'}*/}
        {/*    name={'searchKeyword'}*/}
        {/*    placeholder={'명칭입력'}*/}
        {/*    value={filters.searchKeyword}*/}
        {/*    onChange={onChangeFilters}*/}
        {/*    onEnter={refetch}*/}
        {/*  />*/}
        {/*</Search>*/}
        <div style={{ margin: '10px', padding: '5px', fontWeight: 'bolder', fontSize: '16px' }}>
          최초 등록 후 거래이력이 3개월 이상 없는 소매처 리스트를 보여드릴게요. <br />
          확인해 보시고 필요 없는 소매처는 삭제해주세요.
          <br />
        </div>
        <div className="gridBox">
          <div className="ag-theme-alpine pop">
            <TunedGrid
              ref={gridRef}
              columnDefs={columnDefs}
              rowData={rowData?.data?.body?.rows || []}
              gridOptions={{ rowHeight: 24, headerHeight: 35 }}
              onGridReady={(params) => {
                params.api.sizeColumnsToFit();
              }}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              suppressRowClickSelection={true}
            />
          </div>
        </div>
      </PopupContent>
      <Pagination pageObject={delPaging} setPaging={setDelPaging} />
      {isLoading && <Loading />}
      <ConfirmModal title={'선택한 소매처를 삭제하시겠습니까?'} open={confirmModal} onConfirm={deleteRetail} onClose={() => setConfirmModal(false)} />
    </PopupLayout>
  );
};
