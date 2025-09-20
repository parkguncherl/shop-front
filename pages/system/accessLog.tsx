import React, { useEffect, useState } from 'react';
import { Search, Table, Title } from '../../components';
import { Pagination, TableHeader, toastError } from '../../components';
import { ContactControllerApiSelectContactPagingRequest, ContactResponsePaging } from '../../generated';
import { ColDef, ColGroupDef, RowDoubleClickedEvent } from 'ag-grid-community';
import { useQuery } from '@tanstack/react-query';
import { useCommonStore, useContactState } from '../../stores';
import { defaultColDef, GridSetting } from '../../libs/ag-grid';
import { AccessLogDeatilPop } from '../../components/popup/system/accessLog';
import { useAgGridApi } from '../../hooks';
import useFilters from '../../hooks/useFilters';
import { DefaultOptions, Placeholder } from '../../libs/const';
import { authApi } from '../../libs';
import { AgGridReact } from 'ag-grid-react';

const AccessLog = () => {
  /** Grid Api */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  /** 스토어 */
  const [modalType, openModal, paging, setSelectContact, setPaging] = useContactState((s) => [
    s.modalType,
    s.openModal,
    s.paging,
    s.setSelectContact,
    s.setPaging,
  ]);

  /** 필터 */
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<ContactControllerApiSelectContactPagingRequest>({});

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    await onFiltersReset();
    await setPaging({
      curPage: 1,
    });
  };

  /** 행 클릭 이벤트 */
  const onRowClicked = (e: RowDoubleClickedEvent) => {
    const selectedNodes = e.api.getSelectedNodes();
    const selectedData = selectedNodes.map((node) => node.data);

    setSelectContact(selectedData[0] as ContactResponsePaging);

    openModal('DETAIL');
    e.api.deselectAll();
  };

  /** 필드별 설정 */
  const [columnDefs] = useState<(ColDef | ColGroupDef)[]>([
    { field: 'no', headerName: 'NO', minWidth: 90, maxWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'loginId', headerName: 'ID(e-mail)', minWidth: 200, suppressHeaderMenuButton: true },
    { field: 'userNm', headerName: '이름' || '', minWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'authNm', headerName: '권한' || '', minWidth: 150, suppressHeaderMenuButton: true },
    {
      field: 'belongNm',
      headerName: '소속',
      minWidth: 100,
      valueFormatter: (params) => {
        return params.value == '' ? '-' : params.value;
      },
      suppressHeaderMenuButton: true,
    },
    {
      field: 'deptNm',
      headerName: '부서',
      minWidth: 100,
      valueFormatter: (params) => {
        return params.value == '' ? '-' : params.value;
      },
      suppressHeaderMenuButton: true,
    },
    { field: 'uri', headerName: 'URI', minWidth: 100, suppressHeaderMenuButton: true },
    {
      headerName: '거래',
      children: [
        { field: 'tranTypeNm', headerName: '종류', minWidth: 90, maxWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
        { field: 'uriNm', headerName: '내용', minWidth: 100, suppressHeaderMenuButton: true },
      ],
      suppressHeaderMenuButton: true,
    },
    { field: 'creTm', headerName: '거래일시', minWidth: 150, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ]);

  /** 서버접속로그 페이징 목록 조회 */
  const {
    data: response,
    isSuccess: isAccessLogSuccess,
    isLoading,
    refetch: accessLogRefetch,
  } = useQuery(
    ['/contact/paging', paging.curPage],
    () =>
      authApi.get('/contact/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
    {
      refetchOnMount: 'always',
    },
  );

  useEffect(() => {
    if (isAccessLogSuccess) {
      const { resultCode, body, resultMessage } = response.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
      } else {
        toastError(resultMessage);
      }
    }
  }, [response, isAccessLogSuccess, setPaging]);

  const onEnter = async () => {
    setPaging({
      curPage: 1,
    });
    await onSearch();
  };

  useEffect(() => {
    return () => {
      setPaging({
        curPage: 1,
        totalRowCount: 0,
      });
    };
  }, []);

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };

  const onSearch = async () => {
    await accessLogRefetch();
  };

  return (
    <div>
      <Title
        title={upMenuNm && menuNm ? `${menuNm}` : ''}
        reset={async () => {
          await reset();
          setPaging({
            curPage: 1,
          });
          //await refetch();
          await onSearch();
        }}
        search={async () => {
          setPaging({
            curPage: 1,
          });
          //await refetch();
          await onSearch();
        }}
        filters={filters}
      />
      <Search className={'type_4'}>
        <Search.Input
          title={'ID(e-mail)'}
          name={'loginId'}
          placeholder={Placeholder.Default}
          value={filters.loginId}
          onChange={onChangeFilters}
          onEnter={onEnter}
          filters={filters}
        />
        <Search.Input
          title={'이름'}
          name={'userNm'}
          placeholder={Placeholder.Default}
          value={filters.userNm}
          onChange={onChangeFilters}
          onEnter={onEnter}
          filters={filters}
        />
        <Search.DropDown
          title={'종류'}
          name={'tranType'}
          defaultOptions={[...DefaultOptions.Select]}
          enumName={'TranType'}
          value={filters.tranType || ''}
          onChange={onChangeFilters}
        />
        <Search.Input
          title={'내용'}
          name={'uriNm'}
          placeholder={Placeholder.Default}
          value={filters.uriNm}
          onChange={onChangeFilters}
          onEnter={onEnter}
          filters={filters}
        />
      </Search>
      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}></TableHeader>
        <div className={'ag-theme-alpine wmsDefault'}>
          <AgGridReact
            headerHeight={24}
            onGridReady={onGridReady}
            loading={isLoading}
            rowData={(response?.data?.body?.rows as ContactResponsePaging[]) || []}
            gridOptions={{ rowHeight: 28 }}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            paginationPageSize={paging.pageRowCount}
            rowSelection={'single'}
            onRowDoubleClicked={onRowClicked}
          />
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
      {modalType.type === 'DETAIL' && modalType.active && <AccessLogDeatilPop />}
    </div>
  );
};

export default AccessLog;
