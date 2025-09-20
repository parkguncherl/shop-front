/**
 * @file pages/oms/pastHistory/retailLog.tsx
 * @description OMS > 구분12설정
 * @copyright 2024
 */

import { useRetailStore } from '../../../../stores/useRetailStore';
import { PartnerCodeResponseLowerSelect } from '../../../../generated';
import React, { useEffect, useRef, useState } from 'react';
import { usePartnerCodeStore } from '../../../../stores';
import { AgGridReact } from 'ag-grid-react';
import useFilters from '../../../../hooks/useFilters';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { ColDef } from 'ag-grid-community';
import { GridSetting } from '../../../../libs/ag-grid';
import { PopupLayout } from '../../PopupLayout';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { Search } from '../../../content';
import CustomGridLoading from '../../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../../components/CustomNoRowsOverlay';
import { ConfirmModal } from '../../../ConfirmModal';
import { Utils } from '../../../../libs/utils';

export const RetailAcctSetPop = () => {
  const [modalType, closeModal] = useRetailStore((s) => [s.modalType, s.closeModal]);
  const [gridRowData, setGridRowData] = useState<PartnerCodeResponseLowerSelect[] | undefined>();
  const gridRef = useRef<AgGridReact>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectLowerPartnerCodeByCodeUpper, savePartnerCode, updatePartnerCodeToDeletedStatus, selectPartnerCodeDropdown] = usePartnerCodeStore((s) => [
    s.selectLowerPartnerCodeByCodeUpper,
    s.savePartnerCode,
    s.updatePartnerCodeToDeletedStatus,
    s.selectPartnerCodeDropdown, // 잘못된함수 추후 사용하게 되면 수정
  ]);

  // 구분 1/2 상태관리 - 초기값을 P0008로 설정
  const [currentPartnerCode, setCurrentPartnerCode] = useState('P0008');

  // 초기 선택 상태관리
  const [switchValue, setSwitchValue] = useState(true); // true = 구분1 초기값

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
      headerName: '항목',
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
      hide: true,
    },
    {
      headerName: '등록자',
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
      valueFormatter: ({ value }) => {
        return Utils.getFormattedDate(value);
      },
    },
  ];
  //타이틀 조회쿼리
  const { data: titleData } = useQuery(['/partnerCode/upperCodeList/', currentPartnerCode], () => selectPartnerCodeDropdown(currentPartnerCode));

  // 타이틀 동적 변경
  const pageTitle = titleData?.data.body?.[0]?.codeNm || '구분 1·2 설정하기';

  // 구분 1/2 목록 조회 쿼리
  const {
    data: rowData,
    isSuccess,
    refetch,
  } = useQuery(['/partnerCode/lowerCodeList/', currentPartnerCode], () => selectLowerPartnerCodeByCodeUpper(currentPartnerCode, filters.searchKeyword), {
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (isSuccess) {
      setGridRowData(rowData?.data.body || []);
    }
  }, [isSuccess, rowData]);

  // 구분1/2 저장(수정)
  const { mutate: savePartnerCodeMutate } = useMutation(savePartnerCode, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        // 수정된 데이터가 있는지 확인
        const hasModifiedData = gridRowData?.some((row) => row.id);
        if (hasModifiedData) {
          toastSuccess('기존에 저장한 항목에도 적용 됩니다.');
        } else {
          toastSuccess('저장되었습니다.');
        }
        await refetch();
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err) => {
      toastError('저장 중 오류가 발생했습니다.');
      console.error(err);
    },
  });

  // 구분1/2 삭제
  const { mutate: updatePartnerCodeToDeletedStatusMutate } = useMutation(updatePartnerCodeToDeletedStatus, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('삭제되었습니다.');
        await refetch(); // expense/paging 쿼리 무효화 제거
        setConfirmModal(false); // 모달 닫기 추가
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
    if (!gridRowData || gridRowData.length === 0) {
      toastError('저장할 데이터가 없습니다.');
      return;
    }
    gridRef.current?.api.stopEditing(false);
    savePartnerCodeMutate({
      partnerCodeLowerSelectList: gridRowData.map((row) => ({
        ...row,
        codeUpper: currentPartnerCode,
      })),
    });
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
      codeUpper: currentPartnerCode,
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

  // Switch 컴포넌트 onChange 핸들러
  const handleSwitchChange = (e: any, value: boolean) => {
    const code = value ? 'P0008' : 'P0009';
    setCurrentPartnerCode(code);
    setSwitchValue(value);
    onChangeFilters('changeRetailAcctSet', value ? 'M' : 'N');
  };

  return (
    <PopupLayout
      width={892}
      isEscClose={true}
      open={modalType.type === 'CATEGORYSETTING'}
      title={pageTitle}
      onClose={() => closeModal('CATEGORYSETTING')}
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div>
              <button className="btn btnWhite" title="행을추가합니다" data-tooltip-id="my-tooltip" onClick={addRowPartnerCode}>
                추가
              </button>
              <button className="btn edit" title="기존에 저장한 항목에도 적용 됩니다." onClick={onSaveClick}>
                저장
              </button>
              <button className="btn delete" title="현재 사용중인 항목은 삭제할수 없어요" onClick={() => setConfirmModal(true)}>
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
        <Search className="type_2">
          <Search.Switch
            title={'선택'}
            name={'isModify'}
            checkedLabel={'구분 1'}
            uncheckedLabel={'구분 2'}
            value={switchValue} // value prop 사용
            onChange={handleSwitchChange}
            filters={filters}
          />{' '}
          <Search.Input title={'구분검색'} name={'searchKeyword'} placeholder={'명칭입력'} value={filters.searchKeyword} onChange={onChangeFilters} />
        </Search>
        <div className="gridBox">
          <div className="btnArea right"></div>
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
