//C:\work\binblur-oms-frontend\pages\system\accountMng.tsx

import React, { useEffect, useState } from 'react';
import { Search, Table, Title } from '../../components';
import { Button, Pagination, TableHeader, toastError } from '../../components';
import { AccountPagingFilter, useAccountStore } from '../../stores';
import { UserResponsePaging } from '../../generated';
import { CellDoubleClickedEvent, ColDef } from 'ag-grid-community';
import { useQuery } from '@tanstack/react-query';
import { useAgGridApi } from '../../hooks';
import { defaultColDef, GridSetting } from '../../libs/ag-grid';
import useFilters from '../../hooks/useFilters';
import { authApi } from '../../libs';
import { Placeholder } from '../../libs/const';
import { AccountAddPop, AccountModPop, AccountUnLockPop } from '../../components/popup/system/accountMng';
import { LockCellRender } from '../../components/cellRenderer/account/LockCellRender';
import { useCommonStore } from '../../stores';
import CustomGridLoading from '../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../components/CustomNoRowsOverlay';
import TunedGrid from '../../components/grid/TunedGrid';

/** 시스템 - 계정관리 페이지 */
const AccountMng = () => {
  /** Grid Api */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  /** 공통 스토어 - State */
  const [menuUpdYn, menuExcelYn] = useCommonStore((s) => [s.menuUpdYn, s.menuExcelYn]);

  /** 계정관리 스토어 - State */
  const [paging, setPaging, selectedUser, setSelectedUser, modalType, openModal] = useAccountStore((s) => [
    s.paging,
    s.setPaging,
    s.selectedUser,
    s.setSelectedUser,
    s.modalType,
    s.openModal,
  ]);

  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<AccountPagingFilter>({});

  const [loginId, setLoginId] = useState<string | undefined>(undefined);

  /** 계정관리 필드별 설정 */
  const [columnDefs] = useState<ColDef[]>([
    { field: 'no', headerName: 'NO', minWidth: 60, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'loginId', headerName: 'ID(e-mail)', minWidth: 200, suppressHeaderMenuButton: true },
    { field: 'userNm', headerName: '이름', minWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'authNm', headerName: '권한[화주]', minWidth: 100, suppressHeaderMenuButton: true },
    {
      field: 'belongNm',
      headerName: '소속',
      minWidth: 100,
      valueFormatter: (params) => {
        return params.value == '' ? '-' : params.value;
      },
      suppressHeaderMenuButton: true,
    },
    { field: 'workLogisNm', headerName: '연결창고', minWidth: 100, maxWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'useYn', headerName: '사용여부', minWidth: 90, maxWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'userAuthCnt', headerName: 'OMS권한건수', minWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'lastLoginDateTime', headerName: '최근접속기록', minWidth: 150, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'unLock',
      headerName: '잠금해제',
      cellRenderer: LockCellRender,
      minWidth: 100,
      maxWidth: 110,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
  ]);

  /** 검색 */
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    await accountsRefetch();
  };

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    await onFiltersReset();
    await onSearch();
  };

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    /*if (Utils.isEmptyValues(filters)) {
      toastError('검색조건을 1개 이상 입력하세요.');
      return;
    }*/
    await onSearch();
  };

  /** 계정관리 페이징 목록 조회 */
  const {
    data: accounts,
    isSuccess: isAccountListSuccess,
    isLoading: accountListIsInLoading,
    refetch: accountsRefetch,
  } = useQuery(['/user/paging', paging.curPage], (): any =>
    authApi.get('/user/paging', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      },
    }),
  );

  useEffect(() => {
    if (isAccountListSuccess) {
      const { resultCode, body, resultMessage } = accounts.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
      } else {
        toastError(resultMessage);
      }
    }
  }, [accounts, isAccountListSuccess, setPaging]);

  useEffect(() => {
    search();
  }, [filters]);

  /** 선택된 사용자 정보 조회 */
  const {
    data: gridUser,
    isLoading: gridUserIsLoading,
    isFetching: gridUserIsFetching,
    refetch: gridUserRefetch,
  } = useQuery(['/user/' + loginId], () => authApi.get(`/user/${loginId}`), {
    enabled: !!loginId,
    cacheTime: 0,
    onSuccess: (e) => {
      const { resultCode, body, resultMessage } = e.data;
      if (resultCode === 200) {
        setSelectedUser(body);
      } else {
        toastError(resultMessage);
      }
    },
  });

  /** 계정관리, 셀 클릭 이벤트 */
  const onCellDoubleClicked = async (cellDoubleClickedEvent: CellDoubleClickedEvent) => {
    if (cellDoubleClickedEvent.column.getColId() !== 'unLock') {
      openModal('MOD');
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
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={search} />
      <Search className="type_2">
        <Search.Input
          title={'이름'}
          name={'userNm'}
          placeholder={Placeholder.Default}
          value={filters.userNm}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />
        <Search.Input
          title={'전화번호'}
          name={'phoneNo'}
          placeholder={Placeholder.Default}
          value={filters.phoneNo}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />
        <Search.Input
          title={'화주'}
          name={'partnerNm'}
          placeholder={Placeholder.Default}
          value={filters.partnerNm}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />
        <Search.DropDown
          title={'권한'}
          name={'authCd'}
          //defaultOptions={[...DefaultOptions.Select]}
          codeUpper={'10020'}
          value={filters.authCd || ''}
          onChange={onChangeFilters}
        />
        <Search.DropDown
          title={'상태'}
          name={'useYn'}
          //defaultOptions={[...DefaultOptions.Select]}
          codeUpper={'10280'}
          value={filters.useYn || ''}
          onChange={onChangeFilters}
        />
        <Search.DropDown
          title={'사용자구분'}
          name={'omsWmsTp'}
          defaultOptions={[
            { value: 'O', label: 'OMS 사용자' },
            { value: 'W', label: 'WMS 사용자' },
          ]}
          value={filters.omsWmsTp || ''}
          onChange={onChangeFilters}
        />
        {/*        <Search.Input
          title={'소속'}
          name={'belongNm'}
          placeholder={Placeholder.Default}
          value={filters.belongNm}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />
        <Search.Input
          title={'부서'}
          name={'deptNm'}
          placeholder={Placeholder.Default}
          value={filters.deptNm}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />
        <Search.Input
          title={'직책'}
          name={'positionNm'}
          placeholder={Placeholder.Default}
          value={filters.positionNm}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />*/}
      </Search>
      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}></TableHeader>
        <TunedGrid
          headerHeight={35}
          onGridReady={onGridReady}
          loading={accountListIsInLoading}
          rowData={(accounts?.data?.body?.rows as UserResponsePaging[]) || []}
          gridOptions={{ rowHeight: 28 }}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          paginationPageSize={paging.pageRowCount}
          rowSelection={'single'}
          onRowClicked={(e) => {
            setLoginId(e.data.loginId);
            gridUserRefetch();
          }}
          onCellDoubleClicked={onCellDoubleClicked}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
        />
        <div className={'btnArea'}>
          {menuUpdYn && (
            <div className="btnArea">
              <button className="btn" onClick={() => openModal('ADD')}>
                등록
              </button>
            </div>
          )}
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
      {menuUpdYn && modalType.type === 'ADD' && modalType.active && <AccountAddPop />}
      {!gridUserIsFetching && !gridUserIsLoading && modalType.type === 'MOD' && modalType.active && <AccountModPop data={selectedUser || {}} />}
      {menuUpdYn && !gridUserIsFetching && !gridUserIsLoading && modalType.type === 'UNLOCK' && modalType.active && (
        <AccountUnLockPop data={selectedUser || {}} />
      )}
    </div>
  );
};

export default AccountMng;
