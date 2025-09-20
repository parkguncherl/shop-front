import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Table, Title } from '../../../components';
import { Button, Pagination, TableHeader, toastError, toastSuccess } from '../../../components';
import { useLogisStore, LogisRequestPagingFilter, LogisDetail } from '../../../stores/wms/useLogisStore';
import { ColDef, GridReadyEvent, CellEditingStoppedEvent } from 'ag-grid-community';
import { useQuery } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import useFilters from '../../../hooks/useFilters';
import { Placeholder } from '../../../libs/const';
import { useCommonStore } from '../../../stores';
import { AgGridReact } from 'ag-grid-react';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { LogisResponsePaging } from '../../../generated';
import { LocRegPop } from '../../../components/wms/system/LocRegPop';
import TunedGrid from '../../../components/grid/TunedGrid';

// 창고 관리 컴포넌트
const Logis: React.FC = () => {
  // AG Grid에 대한 참조
  const gridRef = useRef<AgGridReact>(null);

  // 공통 스토어에서 메뉴 정보 가져오기
  const { upMenuNm, menuNm } = useCommonStore();

  // 창고 스토어에서 필요한 상태와 함수 가져오기
  const { paging, setPaging, fetchLogis, createLogis, updateLogis, deleteLogis, modalType, openModal } = useLogisStore();

  // 로컬 상태 관리
  const [localRowData, setLocalRowData] = useState<LogisDetail[]>([]); // 그리드 데이터
  const [selectedRows, setSelectedRows] = useState<LogisDetail[]>([]); // 선택된 행
  const [selectedRow, setSelectedRow] = useState<LogisDetail>(); // 선택된 행

  // 필터 상태 및 관련 함수 정의
  const [filters, onChangeFilters, onFiltersReset] = useFilters<LogisRequestPagingFilter>({
    logisKey: '',
    logisNm: '',
    startDate: '',
    endDate: '',
  });

  // 데이터 조회를 위한 쿼리 정의
  const {
    data: logis,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery(['/logis/paging', paging.curPage, filters], () => fetchLogis(filters), { keepPreviousData: true });

  // 검색 함수
  const onSearch = useCallback(async () => {
    setPaging({ ...paging, curPage: 1 });
    await refetch();
  }, [setPaging, paging, refetch]);

  // 초기화 함수
  const reset = useCallback(async () => {
    await onFiltersReset();
    await onSearch();
  }, [onFiltersReset, onSearch]);

  // 그리드 준비 완료 시 실행되는 함수
  const onGridReady = (params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  };

  // 창고 컬럼 정의
  const logisColumns: ColDef<LogisResponsePaging>[] = [
    { field: 'no', headerName: 'No.', minWidth: 50, maxWidth: 50, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'logisKey', headerName: '창고 KEY', editable: true, minWidth: 100, cellStyle: GridSetting.CellStyle.LEFT, suppressHeaderMenuButton: true },
    { field: 'logisNm', headerName: '창고명', editable: true, minWidth: 100, cellStyle: GridSetting.CellStyle.LEFT, suppressHeaderMenuButton: true },
    { field: 'logisAddr', headerName: '창고 위치', editable: true, minWidth: 150, cellStyle: GridSetting.CellStyle.LEFT, suppressHeaderMenuButton: true },
    { field: 'logisDesc', headerName: '설명', editable: true, minWidth: 150, cellStyle: GridSetting.CellStyle.LEFT, suppressHeaderMenuButton: true },
    {
      field: 'logisTelNo',
      headerName: '전화번호',
      editable: true,
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        const value = params.value;
        if (value && typeof value === 'string') {
          return value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        }
        return value;
      },
    },
    { field: 'personNm', headerName: '담당자', editable: true, minWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'personTelNo',
      headerName: '담당자 전화번호',
      editable: true,
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        const value = params.value;
        if (value && typeof value === 'string') {
          return value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        }
        return value;
      },
    },
    { field: 'centerInfo', headerName: '상세 정보', editable: true, minWidth: 150, cellStyle: GridSetting.CellStyle.LEFT, suppressHeaderMenuButton: true },
    { field: 'creUser', headerName: '생성자', minWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'creTm', headerName: '생성일시', minWidth: 150, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'updUser', headerName: '수정자', minWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'updTm', headerName: '수정일시', minWidth: 150, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ];

  // 데이터 로딩 완료 시 실행되는 효과
  useEffect(() => {
    if (isSuccess && logis?.data) {
      const { resultCode, body, resultMessage } = logis.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
        setLocalRowData(body.rows);
      } else {
        toastError(resultMessage);
      }
    }
  }, [logis, isSuccess, setPaging]);

  // 셀 편집 완료 시 실행되는 함수
  const handleCellEditingStopped = async (event: CellEditingStoppedEvent) => {
    if (event.newValue !== event.oldValue) {
      try {
        await updateLogis(event.data);
        toastSuccess('창고 정보가 업데이트되었습니다.');
        await refetch();
      } catch (error) {
        toastError('창고 정보 업데이트 중 오류가 발생했습니다.');
      }
    }
  };

  // 새 행 추가 함수
  const handleAddRow = async () => {
    const newRow: Partial<LogisDetail> = {
      logisKey: '',
      logisNm: '',
      logisAddr: '',
      logisDesc: '',
      logisTelNo: '',
      personNm: '',
      personTelNo: '',
      centerInfo: '',
    };
    try {
      await createLogis(newRow);
      toastSuccess('새 창고가 추가되었습니다.');
      await refetch();
    } catch (error) {
      toastError('창고 추가 중 오류가 발생했습니다.');
    }
  };

  // 선택된 행 삭제 함수
  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) {
      toastError('삭제할 항목을 선택해주세요.');
      return;
    }
    try {
      const ids = selectedRows.map((row) => row.id);
      await deleteLogis(ids);
      toastSuccess('선택한 창고가 삭제되었습니다.');
      await refetch();
    } catch (error) {
      toastError('창고 삭제 중 오류가 발생했습니다.');
    }
  };

  // 행 선택 변경 시 실행되는 함수
  const onSelectionChanged = () => {
    const selectedNodes = gridRef.current!.api.getSelectedNodes();
    const selectedData = selectedNodes.map((node) => node.data);
    setSelectedRows(selectedData);
  };

  // 렌더링
  return (
    <div>
      {/* 타이틀 컴포넌트 */}
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={onSearch} />
      {/* 검색 컴포넌트 */}
      <Search className="type_2">
        <Search.Input
          title={'창고 KEY'}
          name={'logisKey'}
          placeholder={Placeholder.Default}
          value={filters.logisKey || ''}
          onChange={onChangeFilters}
          onEnter={onSearch}
        />
        <Search.Input
          title={'창고명'}
          name={'logisNm'}
          placeholder={Placeholder.Default}
          value={filters.logisNm || ''}
          onChange={onChangeFilters}
          onEnter={onSearch}
        />
        <Search.TwoDatePicker title={'생성일자'} startName={'startDate'} endName={'endDate'} filters={filters} onChange={onChangeFilters} />
      </Search>
      {/* 테이블 컴포넌트 */}
      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={onSearch}></TableHeader>
        <TunedGrid
          ref={gridRef}
          rowData={localRowData}
          columnDefs={logisColumns}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          gridOptions={{ rowHeight: 28, headerHeight: 35 }}
          rowSelection={'single'}
          //onSelectionChanged={onSelectionChanged}
          onCellEditingStopped={handleCellEditingStopped}
          suppressRowClickSelection={true}
          paginationPageSize={paging.pageRowCount}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          className={'wmsDefault'}
          loading={isLoading}
        />
        <div className="btnArea">
          {/* 임시적으로 창고 추가와 삭제 버튼을 숨김 (예솔)
          <button className="btn" onClick={handleAddRow}>
            추가
          </button>
          <button className="btn" onClick={handleDeleteSelected}>
            삭제
          </button> */}
          <button
            className="btn"
            onClick={() => {
              if (gridRef.current && gridRef.current.api) {
                const focusedCell = gridRef.current.api.getFocusedCell(); // 현재 포커스된 셀 정보 가져오기
                if (focusedCell) {
                  const focusedRowIndex = focusedCell.rowIndex; // 포커스된 셀의 rowIndex 가져오기
                  const focusedNode = gridRef.current.api.getDisplayedRowAtIndex(focusedRowIndex); // 포커스된 RowNode 가져오기
                  if (focusedNode) {
                    const selectedNode: LogisDetail = {
                      id: parseInt(focusedNode.data.id),
                      logisNm: focusedNode.data.logisNm,
                    };
                    setSelectedRow(selectedNode);
                    setTimeout(() => openModal('LOCATION_REG'), 500);
                  }
                } else {
                  toastError('등록하기위한 센터를 선택하세요');
                }
              }
            }}
          >
            LOCATION
          </button>
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
      {modalType.type === 'LOCATION_REG' && modalType.active && selectedRow && <LocRegPop logisId={selectedRow.id} logisNm={selectedRow.logisNm} />}
    </div>
  );
};

export default Logis;
