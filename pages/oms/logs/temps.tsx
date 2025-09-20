/**
 OMS > 변경로그 > 소매처 변경로그
 /oms/pastHistory/retailLog.tsx
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore, useMenuStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { Pagination, Search, Table, TableHeader, Title, toastError } from '../../../components';
import { GridSetting } from '../../../libs/ag-grid';
import { RowSpanParams, ICellRendererParams, ColDef } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { Utils } from '../../../libs/utils';
import { usePastHistoryStore } from '../../../stores/usePastHistoryStore';
import { PopupLayout } from '../../../components/popup';
import { PopupFooter } from '../../../components/popup';
import { PopupContent } from '../../../components/popup';

const RetailLog = () => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  const startDt = dayjs().subtract(3, 'month').startOf('month').format('YYYY-MM-DD'); // 3개월
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [menuNm] = useCommonStore((s) => [s.menuNm]);
  const { misongPaging: paging, setMisongPaging: setPaging } = usePastHistoryStore();

  // 타입 정의 추가
  interface ModalData {
    changedFields: string[];
    currentData: any;
    prevData: any;
  }

  // useState 수정
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [modalOpen, setModalOpen] = useState(false); // 모달 상태 추가

  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: startDt,
    endDate: today,
    prodNm: '',
    sellerNm: '',
    partnerId: session.data?.user.partnerId,
    updUser: '',
    status: '',
  });

  /**
   *  값비교 렌더러
   */
  const CompareValueRenderer = (props: any) => {
    // 다음 행(이력상 현재 데이터)과 비교
    const nextRow =
      props.node.rowIndex < props.api.getDisplayedRowCount() - 1
        ? props.api.getDisplayedRowAtIndex(props.node.rowIndex + 1) // 바로 다음 행
        : null;

    // 같은 이력 그룹인지 확인 (TEMP_ID로 그룹핑)
    const isSameGroup = nextRow && props.data.tempId === nextRow.data.tempId;

    // 이전 값과 현재 값이 다른 경우 색상 변경
    const isChanged = isSameGroup && nextRow && props.value !== nextRow.data[props.column.colId];

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center', // 중앙 정렬
          textAlign: 'center', // 텍스트 중앙 정렬
          color: isChanged ? 'red' : 'inherit',
        }}
      >
        {props.value}
      </div>
    );
  };
  (params: any) => {
    const data = params.data;
    const currentNo = data.no;

    // 같은 'no' 값이 연속해서 있는 행의 개수를 계산
    const rowSpanCount = params.api.getModel().getRowCount();
    let count = 1;

    for (let i = params.rowIndex + 1; i < rowSpanCount; i++) {
      const nextRow = params.api.getDisplayedRowAtIndex(i);
      if (!nextRow || nextRow.data.no !== currentNo) break;
      count++;
    }

    /**
     *  컬럼 병합 컴퍼넌트
     */
    // 첫 번째 행에만 rowSpan을 적용
    return params.node.rowIndex === params.api.getDisplayedRowAtIndex(params.rowIndex).rowIndex ? count : 0;
  };

  // 타입 정의
  interface GridRow {
    no: number;
    [key: string]: any;
  }

  // rowSpan 함수 정의
  const getNoRowSpan = (params: RowSpanParams<GridRow, any>) => {
    const rowIndex = params.node?.rowIndex ?? null;
    if (!params.data || !params.node || rowIndex === null) {
      return 1;
    }

    const currentNo = params.data.no;
    if (!currentNo) return 1;

    try {
      // 그룹의 첫 번째 행인지 확인
      if (rowIndex > 0) {
        const prevRow = params.api.getDisplayedRowAtIndex(rowIndex - 1);
        if (prevRow?.data?.no === currentNo) {
          // 병합될 행의 데이터를 빈 값으로 설정
          params.data.displayValue = '';
          return 0; // 이전 행과 같은 no면 숨김
        }
      }

      // 같은 no를 가진 연속된 행 수 계산
      let count = 1;
      const totalRows = params.api.getModel().getRowCount();

      for (let i = rowIndex + 1; i < totalRows; i++) {
        const nextRow = params.api.getDisplayedRowAtIndex(i);
        if (!nextRow?.data?.no || nextRow.data.no !== currentNo) break;
        count++;
      }

      return count;
    } catch (error) {
      console.error('Row span calculation error:', error);
      return 1;
    }
  };

  const [columnDefs] = useState<ColDef[]>([
    {
      field: 'no',
      headerName: 'No',
      maxWidth: 50,
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      headerCheckboxSelection: false,
      checkboxSelection: false,
      rowSpan: getNoRowSpan,
      valueGetter: (params) => {
        return params.data.displayValue !== '' ? params.data.no : '';
      },
      cellClassRules: {
        'merged-cell': 'value !== undefined',
      },
    },
    {
      field: 'status',
      headerName: '상태',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'updTm',
      headerName: '변경일자',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'updUser',
      headerName: '작업자',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'sellerNm',
      headerName: '업체명',
      minWidth: 140,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'sleepYn',
      headerName: '휴면',
      minWidth: 30,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: 'agCheckboxCellRenderer',
      valueGetter: (params) => {
        return params.data.sleepYn === 'Y'; // 'Y'일 때 체크, 'N'일 때 체크 해제
      },
      editable: false, // 수정 불가
    },
    {
      field: 'gubun1',
      headerName: '구분1',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'gubun2',
      headerName: '구분2',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'ceoNm',
      headerName: '대표자',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'ceoTelNo',
      headerName: '대표연락처',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
      valueFormatter: ({ value }) => Utils.getPhoneNumFormat(value),
    },
    {
      field: '',
      headerName: '기타',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: (props: ICellRendererParams) => {
        const rowIndex = props.node.rowIndex;
        if (rowIndex === null) return '-';

        const nextRow = rowIndex > 0 ? props.api.getDisplayedRowAtIndex(rowIndex - 1) : null;

        // Object.entries를 사용하여 매핑된 필드들을 체크
        const changedFields = Object.entries(changeFieldMappings)
          .filter(([field]) => nextRow?.data && props.data.tempId === nextRow.data.tempId && props.data[field] !== nextRow.data[field])
          .map(([field]) => field);

        const changeCount = changedFields.length;

        const handleClick = () => {
          if (changeCount > 0) {
            setModalData({
              changedFields,
              currentData: props.data,
              prevData: nextRow?.data,
            });
            setModalOpen(true);
          }
        };

        return (
          <div
            onClick={handleClick}
            style={{
              cursor: changeCount > 0 ? 'pointer' : 'default',
              color: changeCount > 0 ? 'blue' : 'inherit',
              fontWeight: changeCount > 0 ? 'bold' : 'normal',
            }}
          >
            {changeCount > 0 ? `${changeCount}건` : '-'}
          </div>
        );
      },
    },
  ]);

  // 컬럼맵핑 객체
  const changeFieldMappings = {
    sellerFaxNo: '팩스번호',
    sellerAddr: '주소',
    sellerAddrEtc: '주소기타',
    personNm: '담당자',
    personTelNo: '담당자연락처',
    compNm: '사업자명',
    compNo: '사업자번호',
    etcScrCntn: '비고(화면)',
    etcChitCntn: '비고(전표)',
    etcAccCntn: '계좌(전표)',
    compEmail: '이메일',
    compPrnCd: '혼용률인쇄YN',
    remainYn: '잔액인쇄YN',
    etcCntn: '기타',
  } as const;

  /**
   *  API
   */

  // 목록 조회
  const {
    data: loadData,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery(
    [paging.curPage],
    () =>
      authApi.get('/past/retail/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
    // {
    //   enabled: false,
    // },
  );
  useEffect(() => {
    if (isSuccess && loadData?.data) {
      const { resultCode, body, resultMessage } = loadData.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
      } else {
        toastError(resultMessage);
      }
    }
  }, [loadData, isSuccess]);

  /**
   * Event Handler
   */

  // 검색
  const onSearch = async () => {
    console.log('search');
    setPaging({
      curPage: 1,
    });
    await refetch();
  };

  // 초기화버튼 이벤트
  const onReset = async () => {
    console.log('reset');
    onFiltersReset();
    onChangeFilters('startDate', startDt);
    onChangeFilters('endDate', today);
    onChangeFilters('partnerId', session.data?.user.partnerId as number);
    // 상태가 변경된 후 검색 실행 보장
    await new Promise((resolve) => setTimeout(resolve, 0));
    await onSearch();
  };

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} reset={onReset} search={onSearch} />
      <Search className="type_2 full">
        <Search.TwoDatePicker
          title={'변경일자'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onEnter={onSearch}
          filters={filters}
          onChange={onChangeFilters}
        />
        <Search.Input
          title={'판매처'}
          name={'sellerNm'}
          placeholder={'판매처명 입력'}
          value={filters.sellerNm}
          onEnter={onSearch}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.Input
          title={'작업자'}
          name={'updUser'}
          placeholder={'변경자명 입력'}
          value={filters.updUser}
          onEnter={onSearch}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.DropDown
          title={'상태'}
          name={'status'}
          value={filters.status}
          onChange={onChangeFilters}
          defaultOptions={[
            { value: '삭제', label: '삭제' },
            { value: '수정', label: '수정' },
          ]}
        />
      </Search>

      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={onSearch}></TableHeader>
        <div className={'ag-theme-alpine'}>
          <AgGridReact
            ref={gridRef}
            rowData={loadData?.data?.body?.rows || []}
            loading={isLoading}
            columnDefs={columnDefs}
            onGridReady={onGridReady}
            gridOptions={{ rowHeight: 24, headerHeight: 35, suppressRowTransform: true }}
            rowSelection={'multiple'}
            suppressRowClickSelection={true}
            paginationPageSize={paging.pageRowCount}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            enableRangeSelection={true}
            //suppressMultiRangeSelection={false}
            groupDisplayType={'multipleColumns'}
            groupSelectsChildren={true}
          />
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>

      {modalOpen && modalData && (
        <PopupLayout
          width={700}
          height={500}
          isEscClose={true}
          open={modalOpen}
          title={'변경 내역 상세'}
          onClose={() => setModalOpen(false)}
          footer={
            <PopupFooter>
              <div className="btnArea">
                <button className="btn" title="닫기" onClick={() => setModalOpen(false)}>
                  닫기
                </button>
              </div>
            </PopupFooter>
          }
        >
          <PopupContent>
            <div className="tblBox">
              <table>
                <caption></caption>
                <colgroup>
                  <col width="20%" />
                  <col width="40%" />
                  <col width="40%" />
                </colgroup>
                <thead>
                  <tr>
                    <th>컬럼</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>변경전</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>변경후</th>
                  </tr>
                </thead>
                <tbody>
                  {modalData.changedFields.map((field) => {
                    const isPhoneNumber = field === 'personTelNo' || field === 'ceoTelNo';
                    const prevValue = isPhoneNumber ? Utils.getPhoneNumFormat(modalData.prevData[field]) : modalData.prevData[field];
                    const currentValue = isPhoneNumber ? Utils.getPhoneNumFormat(modalData.currentData[field]) : modalData.currentData[field];

                    return (
                      <tr key={field}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{(changeFieldMappings as any)[field]}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{prevValue || '-'}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{currentValue || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </PopupContent>
        </PopupLayout>
      )}
    </div>
  );
};

export default RetailLog;
