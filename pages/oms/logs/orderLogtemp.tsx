/**
 * @file pages/oms/pastHistory/orderLog.tsx
 * @description  OMS > 변경로그 > 판매거래 변경로그
 * @copyright 2024
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { Pagination, Search, Table, TableHeader, Title, toastError } from '../../../components';
import { GridSetting } from '../../../libs/ag-grid';
import { ColDef, ICellRendererParams, RowClassParams } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { usePastHistoryStore } from '../../../stores/usePastHistoryStore';
import { CompareValueRenderer } from './components/CompareValueRenderer';
import { ChangeDetail, ModalData } from './components/ChangeDetail';
import { Utils } from '../../../libs/utils';
import TunedGrid from '../../../components/grid/TunedGrid';
import PrintLayout from '../../../components/print/PrintLayout';

// 변경 필드 매핑 정의
export const changeFieldMappings = {} as const;

/**
 * 판매거래 변경로그 컴포넌트
 * @component
 * @returns {JSX.Element} 렌더링된 컴포넌트
 */
const ExpenseLog = () => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  // 날짜 초기값 설정 (3개월)
  const startDt = dayjs().subtract(3, 'month').startOf('month').format('YYYY-MM-DD');
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [menuNm] = useCommonStore((s) => [s.menuNm]);
  const { logPaging: paging, setLogPaging: setPaging } = usePastHistoryStore();

  // 미리보기 상태
  const [isPreView, setIsPreView] = useState<boolean>(false);
  // 금일내역 상세 가져오기
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any>(null);
  // 모달 상태 관리
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 안전하게 렌더링하는 컴포넌트를 정의
  const SafeHtml: React.FC<{ html: string }> = ({ html }) => <div dangerouslySetInnerHTML={{ __html: html }} />;

  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: startDt,
    endDate: today,
    prodNm: '',
    sellerNm: '',
    partnerId: session.data?.user.partnerId,
    updUser: '',
    status: '',
    diffYmd: '',
  });

  // AG-Grid 컬럼 정의
  const [columnDefs] = useState<ColDef[]>([
    {
      field: 'no',
      headerName: 'No',
      maxWidth: 40,
      minWidth: 40,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      // 같은번호 안나오게 셀렌더
      cellRenderer: (props: ICellRendererParams) => {
        const currentNo = props.value;
        const rowIndex = props.node.rowIndex;
        if (rowIndex === null || rowIndex === 0) return currentNo;

        const prevRow = props.api.getDisplayedRowAtIndex(rowIndex - 1);
        const prevNo = prevRow?.data?.no;
        // 이전 행의 no와 현재 행의 no가 같으면 빈 값 반환
        return currentNo === prevNo ? '' : currentNo;
      },
    },
    {
      field: 'status',
      headerName: '상태',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      resizable: true,
    },
    {
      headerName: '영업일자',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (params) => {
        const workYmd = params.data.workYmd;
        const diffYmd = params.data.diffYmd;

        // 영업일자와 변경건을 합쳐서 반환
        return `${workYmd} ${diffYmd ? '(★)' : ''}`;
      },
    },
    {
      field: 'updTm',
      headerName: '수정일자',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: ({ value }) => {
        return Utils.getFormattedDate(value);
      },
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
      headerName: '소매처명',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'orderCdNm',
      headerName: '구분',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'chitNo',
      headerName: '전표',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'previousBalance',
      headerName: '전작액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'currentBalance',
      headerName: '현작액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: '',
      headerName: '판매량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: '',
      headerName: '반품량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'payAmount',
      headerName: '판매금액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'returnAmount',
      headerName: '반품금액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'discountAmount',
      headerName: '할인금액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'cashDeposit',
      headerName: '현금입금',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'accountDeposit',
      headerName: '통장입금',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'payByCredit',
      headerName: '외상금액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    {
      field: 'noteCntn',
      headerName: '비고',
      minWidth: 140,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: CompareValueRenderer,
    },
    /*{
      field: '',
      headerName: '그외',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: NumberofOthers,
      cellRendererParams: {
        setModalData: setModalData,
        setModalOpen: setModalOpen,
      },
    },*/
  ]);
  // 데이터 조회 API 호출
  const {
    data: loadData,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery([paging.curPage], () =>
    authApi.get('/past/saleLog/paging', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      },
    }),
  );

  // API 응답 처리
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
   * 검색 버튼 클릭 핸들러
   */
  const onSearch = async () => {
    setPaging({ curPage: 1 });
    await refetch();
  };

  /**
   * 초기화 버튼 클릭 핸들러
   */
  const onReset = async () => {
    onFiltersReset();
    onChangeFilters('startDate', startDt);
    onChangeFilters('endDate', today);
    onChangeFilters('partnerId', session.data?.user.partnerId as number);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await onSearch();
  };

  /**
   * 배경행 no숫자별 색상 정렬 홀수일때만 ag-grid-changeSale적용
   */
  const addClass = (currentClass: string, newClass: string) => (currentClass ? `${currentClass} ${newClass}` : newClass);

  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params && params.data.no) {
      const rowNumber = parseInt(params.data.no);
      if (!isNaN(rowNumber) && rowNumber % 2 === 1) {
        // 홀수일 때만 스타일 적용
        rtnValue = addClass(rtnValue, 'ag-grid-changeOrder');
      }
    }
    return rtnValue;
  }, []);

  /**
   * 메인 그리드 데이터 호출 이벤트 핸들러
   */
  const handleSelectionChanged = async () => {
    if (!isPreView) return;

    // 선택된 모든 행을 가져옴
    const selectedNodes = gridRef.current?.api.getSelectedNodes();
    // 각 항목을 객체 형태로 저장하여 orderId와 payId 구분
    const items = selectedNodes?.map((node) => (node.data.orderId ? { orderId: node.data.orderId } : { payId: node.data.payId })) || [];

    try {
      const orderIds = items.filter((item) => item.orderId).map((item) => item.orderId);
      const payIds = items.filter((item) => item.payId).map((item) => item.payId);

      // 각 ID와 payId에 대해 API 호출
      const orderIdResponse = orderIds.length > 0 ? await authApi.get(`/past/log/orderDetail`, { params: { orderIds } }) : { data: { body: [] as any[] } };

      const payIdResponse = payIds.length > 0 ? await authApi.get(`/past/log/payDetail`, { params: { payIds } }) : { data: { body: [] as any[] } };

      // 응답 데이터를 원래 순서에 맞춰 매핑
      const combinedResponse = items.map((item) => {
        if (item.orderId && (orderIdResponse?.data?.body as any[])) {
          const matchedOrder = (orderIdResponse.data.body as any[]).find((detail: { orderId: number }) => detail.orderId === item.orderId);
          return (
            matchedOrder || {
              orderId: item.orderId,
              error: 'No details found',
            }
          );
        } else if (payIdResponse?.data?.body) {
          const matchedPay = (payIdResponse.data.body as any[]).find((detail: { payId: number }) => detail.payId === item.payId);
          return (
            matchedPay || {
              payId: item.payId,
              error: 'No details found',
            }
          );
        } else {
          return {
            error: 'No details found',
          };
        }
      });

      setSelectedOrderDetail(combinedResponse); // 순서에 맞는 상세 정보 저장
    } catch (error) {
      console.error('API 호출 중 오류 발생: ', error);
      toastError('상세정보를 불러오는데 실패했습니다.');
    }
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
        <Search.Radio
          title={'전체'}
          name={'diffYmd'}
          options={[
            { label: '영업일변견경', value: '' },
            { label: '', value: 'Y' },
          ]}
          value={filters.diffYmd}
          onChange={(e, value) => {
            setPaging({ ...paging, curPage: 1 });
            onChangeFilters(e, value);
          }}
        />
      </Search>
      <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={onSearch}>
          <button className={`btn ${isPreView ? 'on' : ''}`} title="미리보기" onClick={() => setIsPreView(!isPreView)}>
            미리보기
          </button>
        </TableHeader>
        <Table>
          <div className="gridBox">
            <div className="tblPreview">
              <div className={'ag-theme-alpine'}>
                <TunedGrid
                  ref={gridRef}
                  rowData={loadData?.data?.body?.rows || []}
                  loading={isLoading}
                  columnDefs={columnDefs}
                  onGridReady={onGridReady}
                  suppressRowClickSelection={true}
                  paginationPageSize={paging.pageRowCount}
                  loadingOverlayComponent={CustomGridLoading}
                  noRowsOverlayComponent={CustomNoRowsOverlay}
                  getRowClass={getRowClass}
                  onSelectionChanged={handleSelectionChanged}
                />
              </div>
            </div>
            <div>
              {isPreView ? (
                <div className="previewBox">
                  {selectedOrderDetail ? (
                    <PrintLayout selectedDetail={selectedOrderDetail} type={selectedOrderDetail[0]?.payId ? 'pay' : 'default'} />
                  ) : (
                    <div className="noRowsOverlayBox">주문을 선택하면 상세 정보가 표시됩니다.</div>
                  )}
                </div>
              ) : (
                ''
              )}
            </div>
          </div>
        </Table>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </div>

      {modalOpen && modalData && <ChangeDetail open={modalOpen} onClose={() => setModalOpen(false)} data={modalData} fieldMappings={changeFieldMappings} />}
    </div>
  );
};

export default ExpenseLog;
