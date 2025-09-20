/**
 * @file pages/oms/pastHistory/payMng.tsx
 * @description  OMS > 입금관리
 * @Feature 개발보류
 * @copyright 2024.12.27
 */

import React, { useCallback, useRef, useState } from 'react';
import { Pagination, Search, Table, Title } from '../../../components';
import { CodePagingFilter, useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { ApiResponseListCodeDropDown, ContactControllerApiSelectContactPagingRequest, ContactResponsePaging, OrderRequestCreate } from '../../../generated';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { useAgGridApi } from '../../../hooks';
import { DatePicker } from 'antd';
import { usePayMngStore } from '../../../stores/usePayMngStore';
import { PayMngAddPop } from '../../../components/popup/payMng/PayMngAddPop';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { AgGridReact } from 'ag-grid-react';
import { authApi } from '../../../libs';
import { DropDownOption } from '../../../types/DropDownOptions';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';

const PayMng = () => {
  /** Grid Api */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();
  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  /** 스토어 */
  const [modalType, openModal, paging, setPaging] = usePayMngStore((s) => [s.modalType, s.openModal, s.paging, s.setPaging]);
  /** 필터 */
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<CodePagingFilter>({});
  const [chkBox, setChkBox] = useState(false);
  const MainGridRef = useRef<AgGridReact>(null);

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
    //await codesRefetch();
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

  /** 드롭다운 변경 시 */
  const onChangeOptions = useCallback(async (name: string, value: string | number) => {
    dispatch({ name: name, value: value });
  }, []);

  /** 드롭다운 옵션 */
  const { data: dropdownOptions } = useQuery(
    ['/code/dropdown/TOP'],
    () =>
      authApi.get<ApiResponseListCodeDropDown>('/code/dropdown', {
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
          return [{ key: 'TOP', value: 'TOP', label: '선택' || '' } as DropDownOption].concat(fetchedOptions);
        }
        return undefined;
      },
    },
  );
  const [tabBtn, setTabBtn] = useState<number>(0); // 탭 버튼

  /** 임시 컬럼 설정  */
  const [columnDefs, setColumnDefs] = useState([
    { headerName: 'ID', field: 'id', cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { headerName: 'Name', field: 'name', cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { headerName: 'Age', field: 'age', cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { headerName: 'Country', field: 'country', cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'nonCnt', headerName: '출고일', minWidth: 60, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ]);
  const rowData = [
    // 임시
    { id: 1, name: 'John Doe', age: 30, country: 'USA' },
    { id: 2, name: 'Jane Smith', age: 25, country: 'Canada' },
    { id: 3, name: 'Michael Brown', age: 40, country: 'UK' },
    { id: 4, name: 'Emily Davis', age: 35, country: 'Australia' },
    { id: 5, name: 'David Lee', age: 28, country: 'Japan' },
  ];

  const handleTabBtnClick = (index: number) => {
    setTabBtn(index);
  };

  return (
    <div>
      <div className="layoutBox line">
        <div className="layout60">
          <Title title={menuNm ? `${menuNm}` : ''} filters={filters} reset={reset} search={search}></Title>
          <Search className="type_2">
            <Search.TwoDatePicker title={'영업일자'} startName={'startDate'} endName={'endDate'} filters={filters} onChange={onChangeFilters} />
            <Search.Input
              title={'검색'}
              name={'userNm'}
              placeholder={'소매처/상품명 검색'}
              // value={filters.userNm}
              onChange={onChangeFilters}
              // onEnter={onEnter}
              filters={filters}
            />
          </Search>
          <Table>
            <div className={'ag-theme-alpine'}>
              <AgGridReact
                headerHeight={35}
                onGridReady={onGridReady}
                loading={false}
                gridOptions={{ rowHeight: 24 }}
                // rowData={/*(response?.data?.body?.rows as ContactResponsePaging[]) || []*/}
                defaultColDef={defaultColDef}
                paginationPageSize={paging.pageRowCount}
                rowSelection={'single'}
                columnDefs={columnDefs}
                rowData={rowData}
                // onRowClicked={onRowClicked}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
              />
            </div>
            <div className="btnArea right">
              <button className="btn" title="결제수정">
                결제수정
              </button>
              <button
                className="btn"
                title="결제추가"
                onClick={() => {
                  openModal('PAYMANAGE');
                }}
              >
                결제추가
              </button>
            </div>
            <Pagination pageObject={paging} setPaging={setPaging} />
          </Table>
        </div>

        <div className="layout40">
          <div className={`tabBox mt50`}>
            <div className="tabHeader">
              <div className={`tabBtnArea`}>
                <h4>
                  <button
                    className={`${tabBtn === 0 ? 'on' : ''}`}
                    onClick={() => {
                      handleTabBtnClick(0);
                    }}
                  >
                    당일 요약
                  </button>
                </h4>
                <h4>
                  <button
                    className={`${tabBtn === 1 ? 'on' : ''}`}
                    onClick={() => {
                      handleTabBtnClick(1);
                    }}
                  >
                    부가세
                  </button>
                </h4>
              </div>
              <div className="formBox">
                <DatePicker />
              </div>
            </div>
            <div className="tabContent">
              <div className={`${tabBtn === 0 ? 'on' : ''} mt10`}>
                <Table>
                  <div className={'ag-theme-alpine'}>
                    <AgGridReact
                      headerHeight={35}
                      onGridReady={onGridReady}
                      loading={false}
                      gridOptions={{ rowHeight: 24 }}
                      // rowData={/*(response?.data?.body?.rows as ContactResponsePaging[]) || []*/}
                      defaultColDef={defaultColDef}
                      paginationPageSize={paging.pageRowCount}
                      rowSelection={'single'}
                      columnDefs={columnDefs}
                      rowData={rowData}
                      // onRowClicked={onRowClicked}
                      loadingOverlayComponent={CustomGridLoading}
                      noRowsOverlayComponent={CustomNoRowsOverlay}
                    />
                  </div>
                  {/*<Pagination pageObject={paging} setPaging={setPaging} />*/}
                </Table>
              </div>
              <div className={`${tabBtn === 1 ? 'on' : ''} mt10`}>
                <div className="previewBox">
                  미리보기영역
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {modalType.type === 'PAYMANAGE' && modalType.active && (
        /** 추가 목적으로 모달 사용시 마지막 비어있는 행을 제거한 배열을 반환, 의존 관계 유의 */
        <PayMngAddPop />
      )}
    </div>
  );
};

export default PayMng;
