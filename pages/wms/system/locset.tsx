import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Search, Table, TableHeader, Title } from '../../../components';
import { Button, Pagination, toastError, toastSuccess } from '../../../components';
import { useLocsetStore, RowData } from '../../../stores/wms/useLocsetStore';
import { useLogisStore } from '../../../stores/wms/useLogisStore';
import { ColDef, GridReadyEvent, CellValueChangedEvent } from 'ag-grid-community';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import useFilters from '../../../hooks/useFilters';
import { CODE, Placeholder } from '../../../libs/const';
import { useCommonStore } from '../../../stores';
import { AgGridReact } from 'ag-grid-react';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { DropDownOption } from '../../../types/DropDownOptions';
import { LocsetExcelUploadPop } from '../../../components/popup/wms/system/locset/LocsetExcelUploadPop';
import { authApi } from '../../../libs';
import { useSession } from 'next-auth/react';
import {
  ApiResponseListCodeDropDown,
  ApiResponseListLocsetResponseExcel,
  LocsetRequestPagingFilter,
  LocsetResponseExcel,
  LocsetResponsePaging,
  LogisResponsePaging,
} from '../../../generated';
import ExcelDownload from '../../../components/excel/ExcelDownload';
import { DataListDropDown } from '../../../components/DataListDropDown';

/**
 * 적치설정 페이지
 */

const Locset = () => {
  /**
   * State & Store
   */
  const session = useSession();
  const queryClient = useQueryClient();
  const gridRef = useRef<AgGridReact>(null);

  const { upMenuNm, menuNm, menuExcelYn } = useCommonStore();
  const { fetchLogis } = useLogisStore();
  const { paging, setPaging, fetchLosets, createLocset, updateLocset, deleteLocsets } = useLocsetStore();

  // const [logisOptions, setLogisOptions] = useState<DropDownOption[]>([]);
  const [zoneCodeOptions, setZoneCodeOptions] = useState<any>([]);

  const [rowDatas, setRowDatas] = useState<RowData[]>([]);
  const [orgRowDatas, setOrgRowDatas] = useState<RowData[]>([]);
  const [selectedRows, setSelectedRows] = useState<LocsetResponsePaging[]>([]);
  const [excelDatas, setExcelDatas] = useState<LocsetResponseExcel[]>([]);

  const [showExcelUploadPopup, setShowExcelUploadPopup] = useState(false);

  // 필터 상태 및 관련 함수 정의
  const [filters, onChangeFilters] = useFilters<LocsetRequestPagingFilter>({
    logisId: session.data?.user.workLogisId,
    location: '',
    zoneCd: '',
  });

  const excelHeaders = [
    { header: 'ID', key: 'id', width: 10 },
    { header: '창고명', key: 'logisNm', width: 30 },
    { header: 'ZONE 코드명', key: 'zoneCdNm', width: 30 },
    { header: '위치', key: 'location', width: 50 },
    { header: '위치 설명', key: 'locCntn', width: 70 },
    { header: '생성자', key: 'creUser', width: 30 },
    { header: '생성일시', key: 'creTm', width: 50 },
  ];

  /**
   *  API
   */

  useEffect(() => {
    if (session) {
      onChangeFilters('logisId', Number(session.data?.user.workLogisId) || 1);
      setSelectedOption({ value: '', label: '전체' });
    }
  }, [session]);

  // 창고옵션 목록조회
  const { data: logisData, isLoading: isLogisLoading, isSuccess: isLogisSuccess, refetch: logisRefetch } = useQuery(['logisList'], () => fetchLogis({}), {});

  useEffect(() => {
    if (isLogisSuccess && logisData) {
      const { resultCode, body, resultMessage } = logisData.data;
      if (resultCode === 200) {
        const logisOptions: DropDownOption[] = body.rows.map((item: LogisResponsePaging) => ({
          key: item.id,
          value: item.id,
          label: item.logisNm,
        }));
        // setLogisOptions(logisOptions);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isLogisSuccess, logisData]);

  // Zone코드 목록조회
  const {
    data: zoneCodesData,
    isLoading: isZoneCodeLoading,
    isSuccess: isZoneCodeSuccess,
  } = useQuery(
    ['zoneCodes', filters.logisId],
    () =>
      authApi.get<ApiResponseListCodeDropDown>('/code/dropdown', {
        params: {
          codeUpper: CODE.logis,
          logisId: filters.logisId,
        },
      }),
    {
      enabled: !!filters.logisId, // 창고 변경할때마다 refetch 한다.
    },
  );

  useEffect(() => {
    if (isZoneCodeSuccess && zoneCodesData) {
      const { resultCode, body, resultMessage } = zoneCodesData.data;
      if (resultCode === 200 && body) {
        const defaultOption = { value: '', label: '전체' };
        const formattedData = body.map((item) => ({
          value: item.codeCd,
          label: item.codeNm,
        }));

        setZoneCodeOptions([defaultOption, ...formattedData]);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isZoneCodeSuccess, zoneCodesData]);

  // 적치위치 목록조회
  const {
    data: losets,
    isLoading: isLosetsLoading,
    isSuccess: isLosetsSuccess,
    refetch: refetchLosets,
  } = useQuery(['/locset/paging', paging.curPage], () => fetchLosets(filters), {
    keepPreviousData: true,
  });

  // 적치위치 데이터 로딩 완료 시 실행되는 효과
  useEffect(() => {
    if (isLosetsSuccess && losets?.data) {
      const { resultCode, body, resultMessage } = losets.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
        setRowDatas(body.rows);
        setOrgRowDatas(JSON.parse(JSON.stringify(body.rows))); // 최초 데이타 보관 (깊은 복사로 참조 문제 해결)
      } else {
        toastError(resultMessage);
      }
    }
  }, [losets, isLosetsSuccess, setPaging]);

  // 등록
  const { mutate: createLocsetMutate } = useMutation(createLocset, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        await queryClient.invalidateQueries(['/locset/paging']);
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error(err);
      toastError('등록 중 오류가 발생하였습니다.');
    },
  });

  // 수정
  const { mutate: updateLocsetMutate } = useMutation(updateLocset, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('수정되었습니다.');
        await queryClient.invalidateQueries(['/locset/paging']);
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error(err);
      toastError('수정 중 오류가 발생하였습니다.');
    },
  });

  // 삭제
  const { mutate: deleteLocsetsMutate } = useMutation(deleteLocsets, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('삭제되었습니다.');
        await queryClient.invalidateQueries(['/locset/paging']);
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error(err);
      toastError('삭제 중 오류가 발생하였습니다.');
    },
  });

  // 엑셀다운로드
  const fetchExcelData = async () => {
    const { data: excelData } = await authApi.get<ApiResponseListLocsetResponseExcel>('/locset/excel-down', {
      params: {
        ...filters,
      },
    });

    const { resultCode, body, resultMessage } = excelData;
    if (resultCode === 200 && body) {
      console.log('excelData:', body);
      setExcelDatas(body);
    } else {
      toastError(resultMessage);
    }
  };

  /**
   * Event Handler
   */
  // 선택 변경 핸들러
  const [selectedOption, setSelectedOption] = useState<any>();
  const handleChange = (option: any) => {
    console.log('handleChange:', option);
    setSelectedOption(option);

    onChangeFilters('zoneCd', option.value);
  };

  const search = async () => {
    await onSearch();
  };

  const onSearch = () => {
    // setPaging({ ...paging, curPage: 1 });
    setPaging({
      curPage: 1,
    });
    refetchLosets();
  };

  // 초기화 함수
  const reset = async () => {
    await defaultFilters();
    onSearch();
  };

  const defaultFilters = async () => {
    onChangeFilters('logisId', Number(session.data?.user.workLogisId) || 1);
    // onChangeFilters('logisNm', session.data?.user.workLogisNm || '');
    onChangeFilters('zoneCd', '');
    onChangeFilters('location', '');
    setSelectedOption({ value: '', label: '전체' });
  };

  // 그리드 준비 완료 시 실행되는 함수
  const onGridReady = (params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  };

  const onRowAdded = (): void => {
    const newRow: RowData = {
      id: undefined,
      logisId: Number(session.data?.user.workLogisId) || 0,
      logisNm: session.data?.user.workLogisNm || '',
      zoneCd: '',
      location: '',
      locCntn: '',
    };
    setRowDatas((prev: RowData[]) => [...prev, newRow]); //rowData 상태 업데이트
  };

  // 선택된 행 삭제
  const handleDeleteSelected = async () => {
    if (!selectedRows.length) {
      toastError('삭제할 항목을 선택해주세요.');
      return;
    }

    // const deleteIds: (number | undefined)[] = selectedRows.filter((row) => row.id !== undefined).map((row) => row.id as number);
    const deleteIds = selectedRows.map((row) => row.id).filter((id) => id !== undefined);

    if (deleteIds.length > 0) {
      await deleteLocsetsMutate(deleteIds);
    }
    // grid에서만 삭제
    setRowDatas((prev) => prev?.filter((row) => !selectedRows.includes(row)));

    console.log('삭제이벤트 :', {
      selectedRows: selectedRows,
      deleteIds: deleteIds,
    });
  };

  // 행 선택 변경 시 실행되는 함수
  const onSelectionChanged = () => {
    if (gridRef.current && gridRef.current.api) {
      const selectedNodes = gridRef.current.api.getSelectedNodes();
      console.log('selectedNodes', selectedNodes);
      const selectedData = selectedNodes.map((node) => node.data);
      setSelectedRows(selectedData);
    }
  };

  const findModifiedObjects = (originalList: RowData[], updatedList: RowData[]) => {
    return updatedList.filter((updatedObj: RowData): boolean => {
      const originalObj: RowData | undefined = originalList.find((obj: RowData): boolean => obj.id === updatedObj.id);

      // 원본 객체가 없으면 새로 추가된 객체로 간주
      if (!originalObj) {
        return true;
      }

      // 원본 객체와 업데이트된 객체의 속성 값이 다른지 확인
      return (Object.keys(updatedObj) as (keyof RowData)[]).some((key): boolean => {
        const originalValue = originalObj[key];
        const updatedValue = updatedObj[key];

        // 값이 객체나 배열일 경우, 깊은 비교가 필요할 수 있음 (JSON.stringify로 간단히 처리)
        if (typeof originalValue === 'object' && typeof updatedValue === 'object') {
          return JSON.stringify(originalValue) !== JSON.stringify(updatedValue);
        }
        // 기본적인 값 비교 (null, undefined 포함)
        return originalValue !== updatedValue;
      });
    });
  };

  const handleSave = async () => {
    gridRef.current?.api.stopEditing(false);
    const modifiedRowDatas = findModifiedObjects(orgRowDatas, rowDatas);

    console.log('저장', {
      orgRowDatas: orgRowDatas,
      rowDatas: rowDatas,
      modifiedRowDatas: modifiedRowDatas,
    });

    const addedRows = modifiedRowDatas.filter((modifiedObj: RowData) => !modifiedObj.id); //추가된 행
    const updatedRows = modifiedRowDatas.filter((modifiedObj: RowData) => modifiedObj.id); //수정된 행

    console.log({ addedRows: addedRows, updatedRows: updatedRows });
    if (!addedRows.length && !updatedRows.length) {
      toastError('추가 및 수정 사항이 없습니다.');
    }
    // validation
    const invalidRows = modifiedRowDatas.filter((row: RowData) => {
      return !row.logisId || !row.zoneCd || !row.location || row.location.trim() === '';
    });

    if (invalidRows.length > 0) {
      toastError('필수 입력 항목이 비어있는 행이 있습니다.');

      // 필수값이 없는 셀의 배경색을 변경하여 사용자에게 알려준다
      gridRef.current?.api.forEachNode((node) => {
        const row = node.data;
        if (!row.zoneCd || row.zoneCd.trim() === '') {
          node.setDataValue('zoneCd', row.zoneCd); // 셀 다시 렌더링
          gridRef.current?.api.refreshCells({ rowNodes: [node] });
        }
        if (!row.location || row.location.trim() === '') {
          node.setDataValue('location', row.location); // 셀 다시 렌더링
          gridRef.current?.api.refreshCells({ rowNodes: [node] });
        }
      });

      return;
    }
    // 새로 추가된 행 저장
    for (const addRow of addedRows) {
      // console.log('addRow: ', addRow);
      await createLocsetMutate(addRow);
    }

    // 변경된 행 업데이트
    for (const updateRow of updatedRows) {
      // console.log('changedRow: ', updateRow);
      await updateLocsetMutate(updateRow);
    }
  };

  // 엑셀 업로드 팝업 열기
  const openExcelUploadPopup = () => {
    setShowExcelUploadPopup(true);
  };

  // 엑셀 업로드 팝업 닫기
  const closeExcelUploadPopup = () => {
    setShowExcelUploadPopup(false);
    refetchLosets(); // 데이터 새로고침
  };

  // 엑셀 다운로드
  const handleExcelDownload = async () => {
    fetchExcelData();

    /*  프론트 엑셀라이브러리 처리하는 방식으로 변경하여 주석처리함 (2024.10.24)
      try {
      // 서버에 엑셀 다운로드 요청
      const response = await authApi.get('/locset/excel-down', {
        responseType: 'blob',
        params: filters,
      });
      // Blob URL 생성
      const url = window.URL.createObjectURL(new Blob([response.data]));
      // 다운로드 링크 생성 및 클릭
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `적치위치_${new Date().toISOString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toastError('엑셀 다운로드 중 오류가 발생했습니다.');
      console.error('엑셀 다운로드 오류:', error);
    }*/
  };

  // 셀 수정 시 변경된 행 추적
  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent<RowData>): void => {
      const { colDef, node, newValue, oldValue } = event;

      // Zone코드명이 변경되면 해당하는 코드를 찾아서 Grid에 업데이트합니다.
      if (colDef.field === 'zoneCdNm') {
        console.log('newValue', newValue);
        const selectedZone: DropDownOption = zoneCodeOptions.find((code: DropDownOption) => code.label === newValue);

        if (selectedZone) {
          console.log('selectedZone', selectedZone);
          const updatedZoneCd = selectedZone.value;
          node.setDataValue('zoneCd', updatedZoneCd);
        }
      }
      // 셀 값이 변경된 경우 체크박스를 선택하고, 그렇지 않으면 선택 해제
      if (oldValue !== newValue) {
        node.setSelected(true);
      } else {
        node.setSelected(false);
      }
    },
    [rowDatas],
  );

  /**
   *   Grid 컬럼
   */
  const locsetColumns = useMemo<ColDef<LocsetResponsePaging>[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        minWidth: 90,
        maxWidth: 100,
        checkboxSelection: true, // 개별 행에 체크박스 활성화
        headerCheckboxSelection: true, // 전체 체크박스 선택 기능 활성화
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'logisNm',
        headerName: '창고명',
        editable: false,
        minWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'zoneCdNm',
        headerName: 'ZONE 코드명',
        minWidth: 150,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: zoneCodeOptions?.filter((code: DropDownOption) => code.value !== '').map((code: DropDownOption) => code.label) || [],
        },
        // valueFormatter: (params) => {
        //   const zoneCode = zoneCodes.find((code) => code.value === params.value);
        //   return zoneCode ? zoneCode.label : params.value;
        // },
      },
      {
        field: 'zoneId',
        headerName: 'ZONE 코드',
        minWidth: 150,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
        editable: false,
      },
      {
        field: 'locAlias',
        headerName: '위치',
        editable: true,
        minWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'locDesc',
        headerName: '위치 설명',
        editable: true,
        minWidth: 100,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'creUser',
        headerName: '생성자',
        minWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'creTm',
        headerName: '생성일시',
        minWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
    ],
    [zoneCodeOptions],
  );

  // 필수 값이 비어있을 때 행 배경색 변경
  const rowStyle = (params: any) => {
    const { logisId, zoneCd, location } = params.data;
    const isEmpty = !logisId || !zoneCd?.trim() || !location?.trim();
    return isEmpty ? { backgroundColor: 'lightpink' } : undefined; // 조건을 충족하면 배경색, 아니면 기본
  };

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={search} />

      <Search className="type_3">
        <DataListDropDown
          title={'ZONE 코드명'}
          name={'zoneCd'}
          value={selectedOption}
          onChange={handleChange}
          options={zoneCodeOptions}
          placeholder="Zone 코드명"
          // onKeyDown={handleKeyDown} // keydown 이벤트 핸들러 추가
        />
        <Search.Input
          title={'위치'}
          name={'location'}
          placeholder={Placeholder.Default}
          value={filters.location || ''}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />
      </Search>

      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}></TableHeader>
        <div className="ag-theme-alpine wmsDefault">
          <AgGridReact
            ref={gridRef}
            rowData={rowDatas}
            columnDefs={locsetColumns}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            gridOptions={{ rowHeight: 28, headerHeight: 35 }}
            rowSelection={'multiple'}
            onSelectionChanged={onSelectionChanged}
            suppressRowClickSelection={true}
            paginationPageSize={paging.pageRowCount}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            enableRangeSelection={true}
            //suppressMultiRangeSelection={false}
            onCellValueChanged={onCellValueChanged}
            getRowStyle={rowStyle}
          />
        </div>
        <div className="btnArea">
          <button className={filters.logisId ? 'btn btnBlue' : 'btn'} onClick={onRowAdded} disabled={!filters.logisId}>
            추가
          </button>
          <button className="btn" onClick={handleDeleteSelected}>
            삭제
          </button>
          <button className="btn btnGreen" onClick={handleSave}>
            저장
          </button>
          {/* 엑셀 관련 버튼: 권한이 있는 경우에만 표시 */}
          {menuExcelYn && (
            <>
              <button className="btn btnGreen" onClick={openExcelUploadPopup}>
                엑셀업로드
              </button>
              <button className="btn btnGreen" onClick={handleExcelDownload}>
                엑셀다운로드
              </button>
            </>
          )}
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
      {showExcelUploadPopup && <LocsetExcelUploadPop logisData={logisData?.data.body.rows} onClose={closeExcelUploadPopup} />}
      {excelDatas?.length > 0 && <ExcelDownload data={excelDatas} columns={excelHeaders} fileName="적치위치설정" initData={setExcelDatas} />}
    </div>
  );
};

// 성능 최적화를 위한 메모이제이션
export default Locset;
