import React, { useEffect, useState } from 'react';
import { Search, Table, Title } from '../../components';
import { Pagination, TableHeader, toastError } from '../../components';
import { ContactControllerApiSelectContactPagingRequest, ContactResponsePaging } from '../../generated';
import { ColDef, ColGroupDef, RowClickedEvent } from 'ag-grid-community';
import { useQuery } from '@tanstack/react-query';
import { useCommonStore, useContactState } from '../../stores';
import { useTranslation } from 'react-i18next';
import { defaultColDef, GridSetting } from '../../libs/ag-grid';
import { AccessLogDeatilPop } from '../../components/popup/system/accessLog';
import { useAgGridApi } from '../../hooks';
import useFilters from '../../hooks/useFilters';
import { DefaultOptions, Placeholder } from '../../libs/const';
import { authApi } from '../../libs';
import { AgGridReact } from 'ag-grid-react';

const Today = (props: any) => {
  const { t } = useTranslation();
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
  const onRowClicked = (e: RowClickedEvent) => {
    const selectedNodes = e.api.getSelectedNodes();
    const selectedData = selectedNodes.map((node) => node.data);

    setSelectContact(selectedData[0] as ContactResponsePaging);

    openModal('DETAIL');
    e.api.deselectAll();
  };

  /** 필드별 설정 */
  const [columnDefs] = useState<(ColDef | ColGroupDef)[]>([
    { field: 'no', headerName: '매장', minWidth: 85 },
    { field: 'loginId', headerName: '출고상태', minWidth: 85 },
    { field: 'userNm', headerName: '전표', minWidth: 85 },
    { field: 'authNm', headerName: '소매처', minWidth: 85 },
    {
      field: 'no',
      headerName: '반품금액',
      minWidth: 85,
      valueFormatter: (params) => params.value.toLocaleString() + '',
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    {
      field: 'no',
      headerName: '할인금액',
      minWidth: 85,
      valueFormatter: (params) => params.value.toLocaleString() + '',
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    {
      field: 'no',
      headerName: '단가DC',
      minWidth: 85,
      valueFormatter: (params) => params.value.toLocaleString() + '',
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    {
      field: 'no',
      headerName: '전잔액',
      minWidth: 85,
      valueFormatter: (params) => params.value.toLocaleString() + '',
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    {
      field: 'no',
      headerName: '현금입금',
      minWidth: 85,
      valueFormatter: (params) => params.value.toLocaleString() + '',
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    {
      field: 'no',
      headerName: '통장입금',
      minWidth: 85,
      valueFormatter: (params) => params.value.toLocaleString() + '',
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    {
      field: 'no',
      headerName: '현잔액',
      minWidth: 85,
      valueFormatter: (params) => params.value.toLocaleString() + '',
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    {
      field: 'no',
      headerName: '부가세',
      minWidth: 85,
      valueFormatter: (params) => params.value.toLocaleString() + '',
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    { field: 'userNm', headerName: '사용자', minWidth: 85 },
    { field: 'authNm', headerName: '비고', minWidth: 100 },
  ]);

  /** 서버접속로그 페이징 목록 조회 */
  const {
    data: response,
    isLoading,
    refetch,
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
      onSuccess: (e) => {
        const { resultCode, body, resultMessage } = e.data;
        if (resultCode === 200) {
          setPaging(body?.paging);
        } else {
          toastError(resultMessage);
        }
      },
    },
  );

  const onEnter = async () => {
    setPaging({
      curPage: 1,
    });
    await refetch();
  };

  useEffect(() => {
    return () => {
      setPaging({
        curPage: 1,
        totalRowCount: 0,
      });
    };
  }, []);

  const handlePreviewBtn = (e: any) => {
    const preBtn = e.target;
    preBtn.parentNode.parentNode.parentNode.parentNode.parentNode.classList.toggle('preview');
    preBtn.classList.toggle('on');
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
          await refetch();
        }}
        search={async () => {
          setPaging({
            curPage: 1,
          });
          await refetch();
        }}
        filters={filters}
      />
      <Search className="type_2">
        <Search.DatePicker
          title={'영업일자'}
          name={'loginId'}
          placeholder={t(Placeholder.Default) || ''}
          value={filters.loginId}
          onChange={onChangeFilters}
          onEnter={onEnter}
          filters={filters}
        />
        <Search.Input
          title={t('검색') || ''}
          name={'userNm'}
          placeholder={'소매처/상품명 검색'}
          value={filters.userNm}
          onChange={onChangeFilters}
          onEnter={onEnter}
          filters={filters}
        />
      </Search>

      <div className="makePreviewArea">
        <div className="tblPreview">
          <Table>
            <TableHeader count={paging.totalRowCount || 0}>
              <button className="btn" title="미리보기" onClick={handlePreviewBtn}>
                미리보기
              </button>
              <button className="btn icoPrint" title="프린트">
                프린트
              </button>
            </TableHeader>
            <div className={'ag-theme-alpine'}>
              <AgGridReact
                headerHeight={35}
                onGridReady={onGridReady}
                loading={isLoading}
                rowData={(response?.data?.body?.rows as ContactResponsePaging[]) || []}
                gridOptions={{ rowHeight: 24 }}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                paginationPageSize={paging.pageRowCount}
                rowSelection={'single'}
                onRowClicked={onRowClicked}
              />
            </div>
            <div className="btnArea right">
              <button className="btn" title="주문수정">
                주문수정
              </button>
              <button className="btn" title="주문취소">
                주문취소
              </button>
              <button className="btn" title="보류처리">
                보류처리
              </button>
              <button className="btn" title="출고수정">
                출고수정
              </button>
              <button className="btn" title="상품집계">
                상품집계
              </button>
              <button className="btn" title="카테고리">
                카테고리
              </button>
            </div>
            <Pagination pageObject={paging} setPaging={setPaging} />
          </Table>
          <div className="titleBox">
            <h4 className="smallTitle">금일내역 요약</h4>
          </div>
          <div className="tblBox">
            <table>
              <caption></caption>
              <tbody>
                <tr>
                  <th rowSpan={2}>출고</th>
                  <th className="hidden">건수</th>
                  <td colSpan={2} className="agnR">
                    123,456,789
                  </td>
                  <th rowSpan={2}>준비중</th>
                  <th className="hidden">건수</th>
                  <td colSpan={2} className="agnR">
                    123,456,789
                  </td>
                  <th rowSpan={2}>주문취소</th>
                  <th className="hidden">건수</th>
                  <td colSpan={2} className="agnR">
                    123,456,789
                  </td>
                  <th rowSpan={2}>출고보류</th>
                  <th className="hidden">건수</th>
                  <td colSpan={2} className="agnR">
                    <span className="txtRed">123,456,789</span>
                  </td>
                </tr>
                <tr>
                  <th className="hidden">금액</th>
                  <td colSpan={2} className="agnR">
                    123,456,789
                  </td>
                  <th className="hidden">금액</th>
                  <td colSpan={2} className="agnR">
                    123,456,789
                  </td>
                  <th className="hidden">금액</th>
                  <td colSpan={2} className="agnR">
                    123,456,789
                  </td>
                  <th className="hidden">금액</th>
                  <td colSpan={2} className="agnR">
                    123,456,789
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="tblBox preview">
            <table>
              <caption></caption>
              <tbody>
                <tr>
                  <th colSpan={2}>출고</th>
                  <th colSpan={2}>출고보류</th>
                  <th colSpan={2}>준비중</th>
                  <th colSpan={2}>주문취소</th>
                </tr>
                <tr>
                  <td className="agnR">123</td>
                  <td className="agnR">123,456</td>
                  <td className="agnR">123</td>
                  <td className="agnR">123,456</td>
                  <td className="agnR">123</td>
                  <td className="agnR">123,456</td>
                  <td className="agnR">123</td>
                  <td className="agnR">123,456</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="previewBox">미리보기</div>
      </div>
      {modalType.type === 'DETAIL' && modalType.active && <AccessLogDeatilPop />}
    </div>
  );
};

export default Today;
