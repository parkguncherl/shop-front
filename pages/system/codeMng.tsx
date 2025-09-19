import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CellClickedEvent, CellDoubleClickedEvent, ColDef } from 'ag-grid-community';
import { Search, Table, Title } from '../../components';
import { Button, Pagination, TableHeader } from '../../components';
import { useQuery } from '@tanstack/react-query';
import { toastError } from '../../components';
import { CodePagingFilter, useCodeStore, useCommonStore } from '../../stores';
import { defaultColDef, GridSetting } from '../../libs/ag-grid';
import { ApiResponseListCodeDropDown, CodeResponsePaging } from '../../generated';
import { CodeAddPop, CodeExcelUploadPop, CodeMngDetailPop, CodeModPop } from '../../components/popup/system/codeMng';
import { useAgGridApi } from '../../hooks';
import { authApi } from '../../libs';
import { DropDownOption } from '../../types/DropDownOptions';
import useFilters from '../../hooks/useFilters';
import { Placeholder } from '../../libs/const';
import { LowerCellRender } from '../../components/cellRenderer/code/LowerCellRender';
import { AgGridReact } from 'ag-grid-react';
import CustomNoRowsOverlay from '../../components/CustomNoRowsOverlay';
import CustomGridLoading from '../../components/CustomGridLoading';
import { TunedReactSelector } from '../../components/TunedReactSelector';
import TunedGrid from '../../components/grid/TunedGrid';

/** 시스템 - 코드관리 페이지 */
const CodeMng = () => {
  /** Grid Api */
  const { onGridReady } = useAgGridApi();
  const MainGridRef = useRef<AgGridReact>(null);

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  /** 공통 스토어 - State */
  const [menuUpdYn, menuExcelYn] = useCommonStore((s) => [s.menuUpdYn, s.menuExcelYn]);

  /** 코드관리 스토어 - State */
  const [paging, setPaging, selectedCode, setSelectedCode, modalType, openModal] = useCodeStore((s) => [
    s.paging,
    s.setPaging,
    s.selectedCode,
    s.setSelectedCode,
    s.modalType,
    s.openModal,
  ]);

  /** 코드관리 스토어 - API */
  const [excelDown] = useCodeStore((s) => [s.excelDown]);

  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<CodePagingFilter>({
    codeUpper: '',
    codeCd: '',
    codeNm: '',
  });

  /** 코드관리 필드별 설정 */
  const [columnDefs] = useState<ColDef<CodeResponsePaging>[]>([
    { field: 'no', headerName: 'NO', minWidth: 70, maxWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'codeCd', headerName: '코드', minWidth: 100, maxWidth: 100, suppressHeaderMenuButton: true },
    { field: 'codeNm', headerName: '이름', minWidth: 150, suppressHeaderMenuButton: true },
    { field: 'codeUpper', headerName: '상위코드', minWidth: 150, suppressHeaderMenuButton: true },
    {
      field: 'lowerCodeCnt',
      headerName: '하위코드 수',
      minWidth: 100,
      maxWidth: 110,
      cellStyle: GridSetting.CellStyle.CENTER,
      cellRenderer: LowerCellRender,
      suppressHeaderMenuButton: true,
    },
    { field: 'codeDesc', headerName: '설명', minWidth: 150, tooltipField: 'codeDesc', suppressHeaderMenuButton: true },
    { field: 'codeEtc1', headerName: '기타정보1', minWidth: 150, tooltipField: 'codeEtc1', suppressHeaderMenuButton: true },
    { field: 'codeEtc2', headerName: '기타정보2', minWidth: 150, tooltipField: 'codeEtc2', suppressHeaderMenuButton: true },
    { field: 'codeOrder', headerName: '순서', minWidth: 70, maxWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'deleteYn',
      headerName: '사용여부',
      minWidth: 90,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        return params.value === 'N' ? '사용' : '미사용';
      },
      suppressHeaderMenuButton: true,
    },
    { field: 'updTm', headerName: '수정일시', minWidth: 150, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ]);

  const [rowData, setRowData] = useState<CodeResponsePaging[]>([]);

  /** 검색 */
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    if (filters.codeUpper && filters.codeUpper !== 'TOP') {
      MainGridRef.current?.api.applyColumnState({
        state: [{ colId: 'lowerCodeCnt', hide: true }],
      });
    } else {
      MainGridRef.current?.api.applyColumnState({
        state: [{ colId: 'lowerCodeCnt', hide: false }],
      });
    }
    await codesRefetch();
  };

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    onFiltersReset();
    dispatch({ name: 'codeUpper', value: 'TOP' });
    MainGridRef.current?.api.applyColumnState({
      state: [{ colId: 'lowerCodeCnt', hide: false }],
    });
    await onSearch();
  };

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };

  /** 코드관리 페이징 목록 조회 */
  const {
    data: codes,
    isLoading: isCodeListLoading,
    isSuccess: isCodeListSuccess,
    refetch: codesRefetch,
  } = useQuery(['/code/paging', paging.curPage, filters.codeUpper], () =>
    authApi.get('/code/paging', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      },
    }),
  );

  useEffect(() => {
    if (isCodeListSuccess) {
      const { resultCode, body, resultMessage } = codes.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
        setRowData(body.rows || []);
      } else {
        toastError('코드관리 페이징 목록 조회 도중 문제가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [codes, isCodeListSuccess, isCodeListLoading]);

  /** 드롭다운 옵션 */
  const { data: dropdownOptions } = useQuery(
    ['/code/dropdown/TOP'],
    () =>
      authApi.get<ApiResponseListCodeDropDown>('/code/dropdown', {
        params: { codeUpper: 'TOP' }, // 최상위 코드만을 호출
      }),
    {
      select: (e) => {
        const { body, resultCode } = e.data;
        if (resultCode === 200) {
          return body?.map((d) => {
            return {
              key: d.codeCd,
              value: d.codeCd,
              label: d.codeNm,
            };
          }) as DropDownOption[];
          //return [{ key: 'TOP', value: 'TOP', label: '선택' } as DropDownOption].concat(fetchedOptions);
        }
        return undefined;
      },
    },
  );

  /** 코드관리, 셀 클릭 이벤트 */
  const onCellClicked = async (cellClickedEvent: CellDoubleClickedEvent) => {
    if (cellClickedEvent.column.getColId() != 'lowerCodeCnt') {
      openModal('MOD');
    }
  };

  /** 엑셀업로드 버튼 클릭 시 */
  const excelUploadFn = () => {
    openModal('EXCEL');
  };

  /** 엑셀다운로드 버튼 클릭 시 */
  const excelDownFn = () => {
    excelDown(filters);
  };

  /** 드롭다운 변경 시 */
  const onChangeOptions = useCallback(
    (option: DropDownOption) => {
      if (option.value) {
        onChangeFilters('codeUpper', option.value);
      } else {
        console.error('option.value 값을 찾을 수 없음');
      }
    },
    [onChangeFilters],
  );

  /** 백스페이스로 기존 옵션 삭제할 시 */
  const onOptionErased = useCallback(() => {
    onChangeFilters('codeUpper', '');
  }, [onChangeFilters]);

  /*const onChangeOptions = useCallback(async (name: string, value: string | number) => {
    console.log(name, value);
    dispatch({ name: name, value: value });
    console.log('코드 드롭다운 변경시', name, value);
  }, []);*/

  /** 상위코드 값 변경 시 */
  /*useDidMountEffect(() => {
    onSearch();
  }, [filters.codeUpper]);*/

  /** 신규 팝업 데이터 전달 */
  const getCodeUpper = () => {
    if (!filters.codeUpper) {
      return { codeUpper: 'TOP', codeUpperNm: 'TOP' };
    } else {
      return {
        codeUpper: filters.codeUpper,
        codeUpperNm: filters.codeUpper === 'TOP' ? 'TOP' : dropdownOptions?.find((o) => o.key === filters.codeUpper)?.label,
      };
    }
  };

  /*useEffect(() => {
    return () => {
      setPaging({
        curPage: 1,
        totalRowCount: 0,
      });
    };
  }, []);*/

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={search}></Title>
      <Search className={'type_3'}>
        <TunedReactSelector
          name="codeUpper"
          title="코드대분류"
          placeholder="코드대분류"
          onChange={onChangeOptions}
          options={dropdownOptions}
          onErased={onOptionErased}
        />
        {/*<Search.DropDown
          name="codeUpper"
          title="코드대분류"
          placeholder="코드대분류"
          defaultOptions={dropdownOptions}
          onChange={onChangeOptions}
          // placement={placement}
          // readonly={readonly}
        />*/}
        <Search.Input
          title={'코드'}
          name={'codeCd'}
          placeholder={Placeholder.Default}
          value={filters.codeCd || ''}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />
        <Search.Input
          title={'이름'}
          name={'codeNm'}
          placeholder={Placeholder.Default}
          value={filters.codeNm || ''}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />
      </Search>
      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}></TableHeader>
        <TunedGrid
          headerHeight={35}
          onGridReady={onGridReady}
          loading={isCodeListLoading}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          paginationPageSize={paging.pageRowCount}
          rowSelection={'single'}
          onRowClicked={(e) => {
            setSelectedCode(e.data as CodeResponsePaging);
            e.api.deselectAll();
          }}
          onCellDoubleClicked={onCellClicked}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          className={'wmsDefault'}
        />
        <div className={'btnArea'}>
          <button className={'btn btnBlue'} onClick={() => openModal('ADD')}>
            신규
          </button>
          {menuExcelYn && (
            <>
              <button className={'btn btnGreen'} onClick={excelUploadFn}>
                엑셀업로드
              </button>
              <button className={'btn btnGreen'} onClick={excelDownFn}>
                엑셀다운로드
              </button>
            </>
          )}
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
      {menuUpdYn && modalType.type === 'ADD' && modalType.active && <CodeAddPop data={getCodeUpper() || {}} />}
      {modalType.type === 'MOD' && modalType.active && <CodeModPop data={selectedCode || {}} />}
      {modalType.type === 'LOWER' && modalType.active && <CodeMngDetailPop data={selectedCode || {}} />}
      {menuUpdYn && modalType.type === 'EXCEL' && modalType.active && <CodeExcelUploadPop />}
    </div>
  );
};

export default CodeMng;
