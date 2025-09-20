import { useExpenseStore } from '../../../stores/useExpenseStore';
import { PartnerCodeResponseLowerSelect } from '../../../generated';
import { useEffect, useRef, useState } from 'react';
import { useCodeStore, usePartnerCodeStore } from '../../../stores';
import { AgGridReact } from 'ag-grid-react';
import useFilters from '../../../hooks/useFilters';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PARTNER_CODE } from '../../../libs/const';
import data from '@react-google-maps/api/src/components/drawing/Data';
import { toastError, toastSuccess } from '../../ToastMessage';
import { ColDef } from 'ag-grid-community';
import { GridSetting } from '../../../libs/ag-grid';
import { PopupLayout } from '../PopupLayout';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { Search } from '../../content';
import CustomGridLoading from '../../CustomGridLoading';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import { ConfirmModal } from '../../ConfirmModal';

export const ExpenseAcctSetPop = () => {
  const [modalType, closeModal] = useExpenseStore((s) => [s.modalType, s.closeModal]);
  const [gridRowData, setGridRowData] = useState<PartnerCodeResponseLowerSelect[] | undefined>();
  const gridRef = useRef<AgGridReact>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectLowerPartnerCodeByCodeUpper, savePartnerCode, updatePartnerCodeToDeletedStatus] = usePartnerCodeStore((s) => [
    s.selectLowerPartnerCodeByCodeUpper,
    s.savePartnerCode,
    s.updatePartnerCodeToDeletedStatus,
  ]);

  const [filters, onChangeFilters] = useFilters<{ searchKeyword: string }>({
    searchKeyword: '',
  });

  const columnDefs: ColDef<PartnerCodeResponseLowerSelect>[] = [
    {
      headerName: 'No',
      field: 'no',
      sortable: true,
      width: 60,
      editable: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      headerName: '계정명',
      field: 'codeNm',
      sortable: true,
      width: 100,
      editable: true,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
      cellClass: (params) => {
        return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
      },
    },
    {
      headerName: '계정코드',
      field: 'codeCd',
      sortable: true,
      width: 100,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
      hide: true,
    },
    {
      headerName: '설명',
      field: 'codeDesc',
      sortable: true,
      width: 140,
      editable: true,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
      cellClass: (params) => {
        return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
      },
    },
    {
      headerName: '비고',
      field: 'codeEtc',
      sortable: true,
      width: 240,
      editable: true,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
      cellClass: (params) => {
        return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
      },
    },
    {
      headerName: '순서',
      field: 'codeOrder',
      width: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      // hide: true,
    },
    {
      headerName: '사용자',
      field: 'creNm',
      sortable: true,
      width: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      headerName: '등록일자',
      field: 'creTm',
      sortable: true,
      width: 150,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
  ];

  const {
    data: rowData,
    isSuccess,
    refetch,
  } = useQuery(['/partnerCode/lowerCodeList/'], () => selectLowerPartnerCodeByCodeUpper(PARTNER_CODE.expense, filters.searchKeyword), {
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (isSuccess) {
      setGridRowData(rowData?.data.body || []);
    }
  }, [isSuccess, rowData]);

  // 계정과목 저장(수정)
  const queryClient = useQueryClient();
  const { mutate: savePartnerCodeMutate } = useMutation(savePartnerCode, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        await queryClient.invalidateQueries(['/orderInfo/expense/paging']);
        refetch();
      } else {
        toastError(e.data.resultMessage);
      }
      await refetch();
    },
    onError: (err) => {
      toastError('저장 중 오류가 발생했습니다.');
      console.error(err);
    },
  });

  // 계정과목 삭제
  const { mutate: updatePartnerCodeToDeletedStatusMutate } = useMutation(updatePartnerCodeToDeletedStatus, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('삭제되었습니다.');
        await queryClient.invalidateQueries(['/orderInfo/expense/paging']);
        await refetch();
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err) => {
      toastError('삭제 중 오류가 발생했습니다.');
      console.error(err);
    },
  });

  // 저장 이벤트
  const onSaveClick = async () => {
    gridRef.current?.api.stopEditing(false);
    console.log(gridRowData, '그리드데이터');
    //savePartnerCodeMutate({ partnerCodeLowerSelectList: gridRowData });
  };

  // 추가 이벤트
  const addRowPartnerCode = async () => {
    const [newCodeCd, newCodeOrder] = (() => {
      // codeCd가 숫자로 변환 가능한 경우 처리
      const numericCodeCds = gridRowData?.map((row) => parseInt(row.codeCd || '0', 10)).filter((num) => !isNaN(num));
      // codeOrder가 숫자로 변환 가능한 경우 처리
      const numericCodeOrders = gridRowData?.map((row) => parseInt(row.codeOrder?.toString() || '0', 10)).filter((num) => !isNaN(num));

      // 가장 높은 숫자 +1
      const nextCodeCd = numericCodeCds && numericCodeCds.length > 0 ? Math.max(...numericCodeCds) + 1 : 1;
      const nextCodeOrder = numericCodeOrders && numericCodeOrders.length > 0 ? Math.max(...numericCodeOrders) + 1 : 1;
      return [nextCodeCd, nextCodeOrder];
    })();

    const newData: PartnerCodeResponseLowerSelect = {
      codeUpper: PARTNER_CODE.expense,
      codeCd: newCodeCd.toString(),
      codeNm: '',
      codeOrder: newCodeOrder,
    };
    setGridRowData((prev) => [...(prev || []), newData]);
  };

  // 삭제 이벤트
  const deleteRowPartnerCode = async () => {
    const gridApi = gridRef.current?.api;
    const focusedCell = gridApi?.getFocusedCell();
    if (focusedCell && gridRowData) {
      const rowToDelete = gridRowData[focusedCell.rowIndex];
      if (rowToDelete?.id) {
        // id 존재시 db에 저장된값 삭제
        updatePartnerCodeToDeletedStatusMutate({ id: rowToDelete.id });
      } else {
        // grid에서만 제거
        setGridRowData((prev) => prev?.filter((_, index) => index !== focusedCell.rowIndex));
      }
    }
  };

  return (
    <PopupLayout
      width={892}
      isEscClose={true}
      open={modalType.type === 'CATEGORYSETTING'}
      title={'계정과목 설정하기'}
      onClose={() => closeModal('CATEGORYSETTING')}
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div>
              <button className="btn edit" title="수정" onClick={onSaveClick}>
                저장
              </button>
              <button className="btn delete" title="삭제" onClick={() => setConfirmModal(true)}>
                삭제
              </button>
            </div>
            <div>
              <button className="btn" title="닫기" onClick={() => closeModal('CATEGORYSETTING')}>
                닫기
              </button>
            </div>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <Search className="type_1">
          <Search.Input
            title={'계정명'}
            name={'searchKeyword'}
            placeholder={'명칭입력'}
            value={filters.searchKeyword}
            onChange={onChangeFilters}
            onEnter={() => refetch}
          />
        </Search>
        <div className="gridBox">
          <div className="btnArea right">
            <button className="btn btnWhite" title="행추가" data-tooltip-id="my-tooltip" onClick={addRowPartnerCode}>
              행추가
            </button>
            <button className="btn btnWhite" title="행삭제" data-tooltip-id="my-tooltip" onClick={() => setConfirmModal(true)}>
              행삭제
            </button>
          </div>
          <div className="ag-theme-alpine pop">
            <AgGridReact
              ref={gridRef}
              columnDefs={columnDefs}
              rowData={gridRowData}
              gridOptions={{ rowHeight: 24, headerHeight: 35 }}
              onGridReady={(params) => {
                params.api.sizeColumnsToFit();
              }}
              onFirstDataRendered={(params) => {
                params.api.sizeColumnsToFit();
              }}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              suppressRowClickSelection={true}
              // onCellEditingStopped={onCellEditCommit}
            />
          </div>
        </div>
      </PopupContent>

      <ConfirmModal title={'선택한 행을 삭제하시겠습니까?'} open={confirmModal} onConfirm={deleteRowPartnerCode} onClose={() => setConfirmModal(false)} />
    </PopupLayout>
  );
};
