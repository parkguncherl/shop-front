import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { Search, Table, Title } from '../../../components';
import { Button, Pagination, TableHeader } from '../../../components';
import { useQuery } from '@tanstack/react-query';
import { toastError } from '../../../components';
import { CodePagingFilter, usePartnerCodeStore, useCommonStore } from '../../../stores';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { ApiResponseListPartnerCodeDropDown, PartnerCodeResponsePaging } from '../../../generated';
import { CodeAddPop, CodeExcelUploadPop, CodeMngDetailPop, CodeModPop } from '../../../components/popup/system/codeMng';
import { useAgGridApi, useDidMountEffect } from '../../../hooks';
import { authApi } from '../../../libs';
import { DropDownOption } from '../../../types/DropDownOptions';
import useFilters from '../../../hooks/useFilters';
import { Placeholder } from '../../../libs/const';
import { LowerCellRender } from '../../../components/cellRenderer/code/LowerCellRender';
import { AgGridReact } from 'ag-grid-react';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import CustomGridLoading from '../../../components/CustomGridLoading';

/** 시스템 - 코드관리 페이지 */
const CodeMng = () => {
  /** Grid Api */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();
  const MainGridRef = useRef<AgGridReact>(null);

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  /** 공통 스토어 - State */
  const [menuUpdYn] = useCommonStore((s) => [s.menuUpdYn]);

  /** 코드관리 스토어 - State */
  const [paging, setPaging, selectedPartnerCode, setSelectedPartnerCode, modalType, openModal] = usePartnerCodeStore((s) => [
    s.paging,
    s.setPaging,
    s.selectedPartnerCode,
    s.setSelectedPartnerCode,
    s.modalType,
    s.openModal,
  ]);

  /** 코드관리 스토어 - API */
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<CodePagingFilter>({});

  /** 코드관리 필드별 설정 */
  const [columnDefs] = useState<ColDef[]>([
    { field: 'no', headerName: 'NO', minWidth: 70, maxWidth: 80, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'codeCd', headerName: '코드', minWidth: 100, maxWidth: 100 },
    { field: 'codeNm', headerName: '이름', minWidth: 150 },
    {
      field: 'lowerCodeCnt',
      headerName: '하위코드 수',
      minWidth: 100,
      maxWidth: 110,
      cellStyle: GridSetting.CellStyle.CENTER,
      cellRenderer: LowerCellRender,
    },
    { field: 'codeDesc', headerName: '설명', minWidth: 150, tooltipField: 'codeDesc' },
    { field: 'codeEtc1', headerName: '기타정보1', minWidth: 150, tooltipField: 'codeEtc1' },
    { field: 'codeEtc2', headerName: '기타정보2', minWidth: 150, tooltipField: 'codeEtc2' },
    { field: 'codeOrder', headerName: '순서', minWidth: 70, maxWidth: 80, cellStyle: GridSetting.CellStyle.CENTER },
    {
      field: 'delYn',
      headerName: '사용여부',
      minWidth: 90,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        return params.value == 'Y' ? '사용' : '미사용';
      },
    },
    { field: 'creTm', headerName: '등록일시', minWidth: 150, cellStyle: GridSetting.CellStyle.CENTER },
  ]);

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
    await onFiltersReset();
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
    isLoading,
    isSuccess: isListSuccess,
    refetch: codesRefetch,
  } = useQuery(['/code/paging', paging.curPage], () =>
    authApi.get('/code/paging', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      },
    }),
  );

  useEffect(() => {
    if (isListSuccess) {
      const { resultCode, body, resultMessage } = codes.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
      } else {
        toastError(resultMessage);
      }
    }
  }, [codes, isListSuccess, setPaging]);

  /** 드롭다운 옵션 */
  const { data: dropdownOptions } = useQuery(
    ['/code/dropdown/TOP'],
    () =>
      authApi.get<ApiResponseListPartnerCodeDropDown>('/partnerCode/dropdown', {
        params: { codeUpper: 'TOP' },
      }),
    {
      select: (e) => {
        const { body, resultCode } = e.data;
        if (resultCode === 200) {
          const fetchedOptions = body?.map((d) => {
            return {
              key: d.codeCd,
              value: d.codeCd,
              label: d.codeNm,
            };
          }) as DropDownOption[];
          return [{ key: 'TOP', value: 'TOP', label: '선택' } as DropDownOption].concat(fetchedOptions);
        }
        return undefined;
      },
    },
  );

  /** 코드관리, 셀 클릭 이벤트 */
  const onCellClicked = async (cellClickedEvent: CellClickedEvent) => {
    if (cellClickedEvent.column.getColId() != 'lowerCodeCnt') {
      openModal('MOD');
    }
  };

  /** 엑셀업로드 버튼 클릭 시 */
  const excelUploadFn = () => {
    openModal('EXCEL');
  };

  /** 드롭다운 변경 시 */
  const onChangeOptions = useCallback(async (name: string, value: string | number) => {
    dispatch({ name: name, value: value });
    console.log('코드 드롭다운 변경시', name, value);
  }, []);

  /** 상위코드 값 변경 시 */
  useDidMountEffect(() => {
    onSearch();
  }, [filters.codeUpper]);

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

  useEffect(() => {
    return () => {
      setPaging({
        curPage: 1,
        totalRowCount: 0,
      });
    };
  }, []);

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={search}>
        <Title.Category name={'codeUpper'} value={filters.codeUpper} options={dropdownOptions} onChangeOptions={onChangeOptions} onReset={reset} />
      </Title>
      <Search className={'type_3'}>
        {/*<DropDownAtom*/}

        {/*/>*/}
        <Search.DropDown
          name="codeUpper"
          title="코드대분류"
          placeholder="코드대분류"
          defaultOptions={dropdownOptions}
          onChange={onChangeOptions}
          // placement={placement}
          // readonly={readonly}
        />
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
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}>
          <div className={'btnArea'}>
            <button className={'btn btnBlue'} onClick={() => openModal('ADD')}>
              신규
            </button>
          </div>
        </TableHeader>
        <div className={'ag-theme-alpine'}>
          <AgGridReact
            headerHeight={35}
            onGridReady={onGridReady}
            loading={isLoading}
            rowData={(codes?.data?.body?.rows as PartnerCodeResponsePaging[]) || []}
            gridOptions={{ rowHeight: 24 }}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            paginationPageSize={paging.pageRowCount}
            rowSelection={'single'}
            onRowClicked={(e) => {
              setSelectedPartnerCode(e.data);
              e.api.deselectAll();
            }}
            onCellClicked={onCellClicked}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
          />
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
      {menuUpdYn && modalType.type === 'ADD' && modalType.active && <CodeAddPop data={getCodeUpper() || {}} />}
      {/*
      {modalType.type === 'MOD' && modalType.active && <CodeModPop data={selectedPartnerCode || {}} />}
      {modalType.type === 'LOWER' && modalType.active && <CodeMngDetailPop data={selectedPartnerCode || {}} />}
*/}
      {menuUpdYn && modalType.type === 'EXCEL' && modalType.active && <CodeExcelUploadPop />}
    </div>
  );
};

export default CodeMng;
