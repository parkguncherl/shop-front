import React, { useEffect, useRef, useState } from 'react';
import { PopupContent } from '../../PopupContent';
import { PopupFooter } from '../../PopupFooter';
import { PopupLayout } from '../../PopupLayout';
import { useTodayStore } from '../../../../stores/useTodayStore';
import { AgGridReact } from 'ag-grid-react';
import { Search } from '../../../content';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { useCodeStore, usePartnerCodeStore } from '../../../../stores';
import { GridSetting } from '../../../../libs/ag-grid';
import { ColDef } from 'ag-grid-community';
import { PartnerCodeResponseLowerSelect } from '../../../../generated';
import { ConfirmModal } from '../../../ConfirmModal';
import { PARTNER_CODE, CODE } from '../../../../libs/const';
import useFilters from '../../../../hooks/useFilters';

export const MisongCategorySetPop = () => {
  const [modalType, closeModal] = useTodayStore((s) => [s.modalType, s.closeModal]);
  const [cellColorOpen, setCellColorOpen] = useState<boolean>(false); // 컬러파레트 오픈여부
  const [selectedCell, setSelectedCell] = useState<any>(null); // 컬러 선택 여부
  const [modalPosition, setModalPosition] = useState<{ top: number }>({ top: 0 }); // 컬러파레트 위치
  const [gridRowData, setGridRowData] = useState<PartnerCodeResponseLowerSelect[] | undefined>();
  const [selectLowerCodeByInputCode] = useCodeStore((s) => [s.selectLowerCodeByInputCode]);
  const gridRef = useRef<AgGridReact>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectLowerPartnerCodeByCodeUpper, savePartnerCode, deletePartnerCode] = usePartnerCodeStore((s) => [
    s.selectLowerPartnerCodeByCodeUpper,
    s.savePartnerCode,
    s.deletePartnerCode,
  ]);

  const [filters, onChangeFilters] = useFilters({
    searchKeyword: '',
  });

  /** 하위코드 목록 조회 */
  const {
    data: rowData,
    isSuccess: isPartnerCode,
    refetch: partnerCodesRefetch,
  } = useQuery(['/partnerCode/lowerCodeList/'], () => selectLowerPartnerCodeByCodeUpper(PARTNER_CODE.categories, filters.searchKeyword), {
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (isPartnerCode) {
      if (rowData?.data.body) {
        setGridRowData(rowData?.data.body);
      } else {
        setGridRowData([]);
      }
    }
  }, [isPartnerCode, rowData]);

  const { data: codeData } = useQuery(['/code/lower'], () => selectLowerCodeByInputCode(CODE.todayColor));

  /** 코드 수정 **/
  const { mutate: savePartnerCodeMutate } = useMutation(savePartnerCode, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await partnerCodesRefetch();
        } else {
          toastError(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 코드 수정 */
  const { mutate: deletePartnerCodeMutate } = useMutation(deletePartnerCode, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          await partnerCodesRefetch();
        } else {
          toastError(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  // 그리드데이터
  const columnDefs: ColDef<PartnerCodeResponseLowerSelect>[] = [
    { headerName: '순서', field: 'codeOrder', sortable: true, width: 60, editable: true, cellStyle: GridSetting.CellStyle.CENTER },
    { headerName: '구분', field: 'codeNm', sortable: true, width: 100, editable: true, cellStyle: GridSetting.CellStyle.LEFT },
    { headerName: '색상', field: 'codeCd', sortable: true, width: 80, cellRenderer: 'colorCellRenderer' },
    { headerName: '설명', field: 'codeDesc', sortable: true, width: 140, editable: true, cellStyle: GridSetting.CellStyle.LEFT },
    { headerName: '비고', field: 'codeEtc', sortable: true, width: 140, editable: true, cellStyle: GridSetting.CellStyle.LEFT },
    { headerName: '사용자', field: 'updNm', sortable: true, width: 100, cellStyle: GridSetting.CellStyle.CENTER },
    { headerName: '등록일자', field: 'updTm', sortable: true, width: 150, cellStyle: GridSetting.CellStyle.CENTER },
  ];

  // color 셀 배경색 렌더러
  const ColorCellRenderer: React.FC<{ value: string; data: any }> = ({ value, data }) => {
    return (
      <div
        className="codeCd"
        style={{ backgroundColor: value, padding: '0 5px', margin: '0 -5px', height: '100%' }}
        onClick={() => handleColorCellClick({ data, event: window.event })}
      ></div>
    );
  };
  const frameworkComponents = {
    colorCellRenderer: ColorCellRenderer,
  };

  // 컬러 셀 클릭 시 이벤트
  const handleColorCellClick = (params: any) => {
    if (params && params.colDef && params.colDef.field === 'codeCd') {
      setSelectedCell(params.data);
      const cellRect = params.event.target.getBoundingClientRect();
      console.log(cellRect, '위치');
      setModalPosition({
        top: cellRect.top - 100,
      });
      setCellColorOpen(true);
    }
  };

  // 컬러파레트에서 컬러 선택시 이벤트
  const handleColorOptionClick = (color: string) => {
    if (rowData?.data.body) {
      selectedCell.codeCd = color;
      setCellColorOpen(false);
    }
  };

  /** 저장 이벤트 */
  const onSaveClick = async () => {
    savePartnerCodeMutate({
      partnerCodeLowerSelectList: gridRowData,
    });
  };

  /** 추가 이벤트 */
  const addRowPartnerCode = async () => {
    const newData: PartnerCodeResponseLowerSelect = {
      codeUpper: PARTNER_CODE.categories,
      codeCd: '',
      codeNm: '',
      codeOrder: 0,
    };
    if (gridRowData) {
      setGridRowData([...gridRowData, newData]);
    } else {
      setGridRowData([newData]);
    }
  };

  /** 삭제 이벤트 */
  const deleteRowPartnerCode = async () => {
    const gridApi = gridRef.current?.api;
    const focusedCell = gridApi?.getFocusedCell();
    if (focusedCell && focusedCell.rowIndex && gridRowData) {
      if (gridRowData[focusedCell.rowIndex] && gridRowData[focusedCell.rowIndex].id) {
        // db 에 저장된값 삭제
        deletePartnerCodeMutate({
          id: gridRowData[focusedCell.rowIndex].id as number,
        });
      } else {
        // 그냥 추가된값 삭제
        setGridRowData(() => gridRowData.filter((row, index) => index !== focusedCell.rowIndex));
      }
    }
  };

  return (
    <PopupLayout
      width={820}
      isEscClose={true}
      open={modalType.type === 'CATEGORY_SETTING'}
      title={'카테고리 설정하기'}
      onClose={() => closeModal('CATEGORY_SETTING')}
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div>
              {/*
              <button className="btn add" title="등록">
                등록
              </button>
*/}
              <button className="btn edit" title="수정" onClick={onSaveClick}>
                저장
              </button>
              <button className="btn delete" title="삭제" onClick={() => setConfirmModal(true)}>
                삭제
              </button>
            </div>
            <div>
              <button className="btn" title="닫기" onClick={() => closeModal('CATEGORY_SETTING')}>
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
            title={'카테고리'}
            name={'searchKeyword'}
            placeholder={'명칭입력'}
            value={filters.searchKeyword}
            onChange={onChangeFilters}
            onEnter={() => partnerCodesRefetch}
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
              components={frameworkComponents}
              gridOptions={{ rowHeight: 24 }}
              onCellClicked={handleColorCellClick}
              onGridReady={(params) => {
                params.api.sizeColumnsToFit();
              }}
              onFirstDataRendered={(params) => {
                params.api.sizeColumnsToFit();
              }}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              suppressRowClickSelection={true}
            />
          </div>
          {cellColorOpen && (
            <div
              className="colorPicker"
              style={{
                top: modalPosition.top,
              }}
            >
              {codeData?.data?.body?.map((item, key) => (
                <div className={'colorOption ag-grid-' + item.codeNm} key={'codeList_' + key} onClick={() => handleColorOptionClick(item.codeCd || '')}></div>
              ))}
            </div>
          )}
        </div>
      </PopupContent>
      <ConfirmModal title={'선택된 행을 삭제하시겠습니까?'} open={confirmModal} onConfirm={deleteRowPartnerCode} onClose={() => setConfirmModal(false)} />
    </PopupLayout>
  );
};
