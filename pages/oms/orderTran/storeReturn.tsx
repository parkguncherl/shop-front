import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { ReqComplete, ReqCompleteDetail, StoreRequestReqUpdate, StoreResponseReqPaging } from '../../../generated';
import { Search, Table, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { ColDef, SelectionChangedEvent } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import PrintLayout from '../../../components/print/PrintLayout';
import ReturnConfirmCanclePop from '../../../components/popup/orderTran/Return/ReturnConfirmCanclePop';
import { useStoreReturnStore } from '../../../stores/useStoreReturnStore';
import 'dayjs/locale/ko';
import TunedGrid from '../../../components/grid/TunedGrid';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import { Utils } from '../../../libs/utils';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

// 로케일 설정
dayjs.locale('ko'); // 한국어 로케일 추가
const initialResponse: AxiosResponse = {
  data: { body: [] },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: { headers: {} } as InternalAxiosRequestConfig,
};
/** 매장분 반납 */
const StoreReturn = () => {
  const nowPage = 'oms_storeReturn'; // filter 저장 2025-01-21
  const session = useSession();
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const gridRef = useRef<AgGridReact>(null);
  const subGridRef = useRef<AgGridReact>(null);
  /** Grid Api */
  const { onGridReady } = useAgGridApi();
  /** 공통 스토어 - State */
  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList, // filter 저장 2025-01-21
    s.setFilterDataList, // filter 저장 2025-01-21
    s.getFilterData, // filter 저장 2025-01-21
  ]);
  /** 매장 전역 상태 저장(store)  */
  const [paging, setPaging, subPaging, setSubPaging, modalType, openModal, closeModal, printReturnDetail, updateReturn, updateConfirmCntn] =
    useStoreReturnStore((s) => [
      s.paging,
      s.setPaging,
      s.subPaging,
      s.setSubPaging,
      s.modalType,
      s.openModal,
      s.closeModal,
      s.printReturnDetail,
      s.updateReturn,
      s.updateConfirmCntn,
    ]);
  /** 필터 */
  const [filters, onChangeFilters] = useFilters(
    getFilterData(filterDataList, nowPage) || {
      // filter 저장 2025-01-21
      startDate: dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'), // 1개월전 1일자로 조회한다.
      endDate: today,
      skuNm: '',
      storeReqCd: '2',
      isChecked: false,
      status: '전체', //예솔수정 0825
      /** 예솔체크 초기필터 전체로 설정하였으나 프론트에 공란으로 노출됨 */
    },
  );

  // console.log('getFilterData(filterDataList, nowPage) ==>', getFilterData(filterDataList, nowPage));
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<StoreResponseReqPaging[]>([]); // 합계데이터 만들기
  const [subPinnedBottomRowData, setSubPinnedBottomRowData] = useState<any[]>([]); // 합계데이터 만들기
  /** 그리드 컬럼 */
  const [columnDefs] = useState<ColDef[]>([
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      filter: false,
      sortable: false,
      maxWidth: 30,
      minWidth: 40,
      suppressHeaderMenuButton: true,
      hide: true,
    },
    {
      field: 'no',
      headerName: 'No.',
      minWidth: 40,
      maxWidth: 40,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'creTm',
      headerName: '등록일시',
      maxWidth: 100,
      minWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        return params.value ? dayjs(params.value).format('MM/DD (ddd) HH:mm') : '';
      },
    },
    { field: 'partnerNm', headerName: '요청자', minWidth: 100, maxWidth: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    {
      field: 'skuNm',
      headerName: '상품명',
      minWidth: 120,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
      valueGetter: (params) => {
        if (!params.node?.rowPinned) {
          return params.data.skuNm?.split('.')[0] || params.data.skuNm;
        } else {
          return params.data.skuNm;
        }
      },
    },
    { field: 'skuColor', headerName: '컬러', minWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'skuSize', headerName: '사이즈', minWidth: 60, maxWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'skuCnt', headerName: '반납예정', minWidth: 60, maxWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    {
      field: 'partnerInventoryAmt',
      headerName: '매장재고',
      filter: true,
      minWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'inventoryAmt',
      headerName: '빈블러',
      minWidth: 60,
      maxWidth: 60,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'etcCntn',
      headerName: '비고',
      filter: true,
      minWidth: 120,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
  ]);
  /** 서브그리드 컬럼 */
  const [subcolumnDefs] = useState<ColDef[]>([
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      filter: false,
      sortable: false,
      maxWidth: 30,
      minWidth: 30,
      suppressHeaderMenuButton: true,
      hide: true,
    },
    {
      field: 'no',
      headerName: 'No.',
      minWidth: 40,
      maxWidth: 40,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'tranTm',
      headerName: '등록일시',
      minWidth: 120,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueFormatter: (params) => {
        return params.value ? dayjs(params.value).format('MM/DD (ddd) HH:mm:ss') : '';
      },
    },
    {
      field: 'asnStatCd',
      headerName: '반납상태',
      minWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      valueGetter: (params) => {
        const asnStatCd = params.data?.asnStatCd;
        const reqStatCd = params.data?.reqStatCd;
        let result = '';
        if (asnStatCd === 3) {
          if (reqStatCd === 'E') {
            result = '수정완료';
          } else {
            result = '처리중';
          }
        } else {
          if (reqStatCd === 'E') {
            result = '수정완료';
          } else {
            result = '완료';
          }
        }
        return result;
      },
    },
    { field: 'asnCnt', headerName: '수량', minWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    {
      field: 'lastEditor',
      headerName: '사용자',
      minWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'conCntn',
      headerName: '비고',
      minWidth: 100,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      editable: (params) => !(params.node?.rowPinned === 'bottom'),
      cellClass: (params) => {
        return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
      },
    },
  ]);
  const [subDetailcolumnDefs] = useState<ColDef[]>([
    {
      field: 'no',
      headerName: 'No.',
      minWidth: 40,
      maxWidth: 40,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    { field: 'id', headerName: '아이디', suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.LEFT, hide: true },
    { field: 'skuNm', headerName: '상품', minWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.LEFT },
    { field: 'asnCnt', headerName: '수량', minWidth: 40, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'stockCnt', headerName: '입하완료', minWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'reqStatCd', headerName: '입하 상태코드', minWidth: 60, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER, hide: true },
    {
      field: 'diff',
      headerName: '매장재고변동',
      filter: true,
      minWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      cellRenderer: (params: any) => {
        // 합계 행인지 확인
        if (params.node.rowPinned === 'bottom' && params.data?.reqStatCd === 'E') {
          return <span style={{ fontWeight: 400 }}>{params.value}</span>;
        }
        const asnCnt = params.data?.asnCnt ?? 0;
        const stockCnt = params.data?.stockCnt ?? 0;
        const diff = asnCnt - stockCnt;

        if (params.data?.reqStatCd === 'E') {
          // '수정'인것들만
          if (diff > 0) {
            return <span style={{ color: 'blue' }}>+ {diff}</span>;
          } else if (diff < 0) {
            return <span style={{ color: 'red' }}>{diff}</span>;
          } else {
            return <span>{diff}</span>; // 0이면 그냥 출력
          }
        }

        return null;
      },
    },
  ]);

  /** 검색 */
  const onSearch = async () => {
    if (!filters.isChecked) {
      // 메인
      await mainRefetch();
    } else {
      //서브
      await subRefetch();
    }
  };
  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    onChangeFilters('startDate', dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'));
    onChangeFilters('endDate', today);
    onChangeFilters('skuNm', '');
    onChangeFilters('storeReqCd', '2');
    handleSwitchChange(false);
    await onSearch();
  };

  /** 상위(예정) row 데이터 */
  const [rowData, setRowData] = useState<StoreResponseReqPaging[]>([]);
  /** 하위(확정) row 데이터 */
  const [subRowData, setSubRowData] = useState<StoreResponseReqPaging[]>([]);
  const [subDetailRowData, setSubDetailRowData] = useState<ReqCompleteDetail[]>([]);

  /** 메인그리드 페이징 목록 조회 */
  const {
    data: mainData,
    isLoading: mainIsLoading,
    isSuccess: mainIsSuccess,
    refetch: mainRefetch,
  } = useQuery(['/store/stock/paging', paging.curPage], (): any =>
    authApi.get('/store/stock/paging', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      },
    }),
  );
  useEffect(() => {
    if (mainIsSuccess) {
      const { resultCode, body, resultMessage } = mainData.data;
      if (resultCode === 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
        setPaging(body?.paging);
        setRowData(body.rows || []);
        mainCalculateTotals(body.rows);

        setTimeout(() => {
          gridRef.current?.api.ensureIndexVisible(body.rows ? body.rows.length - 1 : 0);
          gridRef.current?.api.setFocusedCell(body.rows ? body.rows.length - 1 : 0, 'skuNm');
        }, 0); // 하단 포커스
      } else {
        toastError(resultMessage);
      }
    }
  }, [mainData, mainIsSuccess, setPaging]);

  /** 서브그리드 페이징 목록 조회 */
  const {
    data: subData,
    isLoading: subIsLoading,
    isSuccess: subIsSuccess,
    refetch: subRefetch,
  } = useQuery(
    ['/store/confirm/list', filters],
    () =>
      authApi.get(`/store/confirm/list`, { params: { startDate: filters.startDate, endDate: filters.endDate, skuNm: filters.skuNm, status: filters.status } }),
    {
      enabled: filters.isChecked,
    },
  );
  useEffect(() => {
    if (subIsSuccess) {
      const { resultCode, body, resultMessage } = subData.data;
      if (resultCode === 200 && body) {
        setSubRowData(body);
        setTimeout(() => {
          subGridRef.current?.api.ensureIndexVisible(body.rows ? body.rows.length - 1 : 0);
          subGridRef.current?.api.setFocusedCell(body.rows ? body.rows.length - 1 : 0, 'skuNm');
        }, 0); // 하단 포커스
      }
    }
  }, [subData, subIsSuccess, setSubPaging]);

  const [subSelectedData, setSubSelectedData] = useState<ReqComplete>({});
  const [subDetailSelectedData, setSubDetailSelectedData] = useState<StoreRequestReqUpdate[]>([]);
  /** 서브그리드2 페이징 목록 조회 */
  const {
    data: subData2,
    isLoading: subIsLoading2,
    isSuccess: subIsSuccess2,
    refetch: subRefetch2,
  } = useQuery(
    ['/store/confirm/detail', subSelectedData?.tranTm],
    () =>
      authApi.get('/store/confirm/detail', {
        params: {
          tranTm: subSelectedData?.tranTm,
        },
      }),
    {
      enabled: !!subSelectedData?.tranTm && filters.isChecked,
      initialData: initialResponse,
    },
  );
  useEffect(() => {
    if (subIsSuccess2) {
      const { resultCode, body, resultMessage } = subData2.data;
      if (resultCode === 200) {
        setSubDetailRowData(body);
        subCalculateTotals(body);
      }
    }
  }, [subData2, subIsSuccess2]);

  const handleSwitchChange = (checked: boolean) => {
    onChangeFilters('isChecked', checked);
    if (!checked) {
      setTimeout(() => {
        gridRef.current?.api.ensureIndexVisible(rowData.length != 0 ? rowData.length - 1 : 0);
        gridRef.current?.api.setFocusedCell(rowData.length != 0 ? rowData.length - 1 : 0, 'skuNm');
      }, 0); // 하단 포커스
    } else {
      setTimeout(() => {
        subGridRef.current?.api.ensureIndexVisible(subRowData.length != 0 ? subRowData.length - 1 : 0);
        subGridRef.current?.api.setFocusedCell(subRowData.length != 0 ? subRowData.length - 1 : 0, 'skuNm');
      }, 0); // 하단 포커스
    }
  };

  // 선택row 초기화
  useEffect(() => {
    if (!filters.isChecked) {
      setMainSelectedData([]);
    } else {
      setSubSelectedData({});
    }
  }, [filters.isChecked]);

  // 메인그리드 합계 계산
  const mainCalculateTotals = useCallback((rowData: StoreResponseReqPaging[] | undefined) => {
    // `skuNm`의 유니크한 값을 추적하기 위한 Set
    const uniqueSkuNames = new Set<string>();

    // 합계 계산과 동시에 `skuNm`의 유니크 값 추적
    if (rowData && rowData.length > 0) {
      const totals = rowData.reduce(
        (acc, curr) => {
          if (curr.skuNm) uniqueSkuNames.add(curr.skuNm.split('.')[0]); // `skuNm` 값이 있으면 Set에 추가
          return {
            skuCnt: (acc.skuCnt || 0) + (curr.skuCnt || 0),
            partnerInventoryAmt: (acc.partnerInventoryAmt || 0) + (curr.partnerInventoryAmt || 0),
            inventoryAmt: (acc.inventoryAmt || 0) + (curr.inventoryAmt || 0),
          };
        },
        { skuCnt: 0, partnerInventoryAmt: 0, inventoryAmt: 0 },
      );
      // 소계 데이터에 유니크 개수 추가
      setPinnedBottomRowData([
        {
          skuCnt: totals.skuCnt,
          partnerInventoryAmt: totals.partnerInventoryAmt,
          inventoryAmt: totals.inventoryAmt,
          partnerNm: '소계',
          skuNm: uniqueSkuNames.size.toString(),
        },
      ]);
    }
  }, []);

  // 서브그리드 합계 계산
  const subCalculateTotals = useCallback((rowData: any[] | undefined) => {
    if (!rowData || rowData.length === 0) {
      return [];
    }

    // 첫 번째 행의 속성을 복사하여 합계 row를 생성
    const totalRow = { ...rowData[0] };

    // 속성을 유지한 채로 총합 계산
    totalRow.no = null;
    totalRow.skuNm = '';
    totalRow.asnCnt = rowData.reduce((acc, row) => acc + (row.asnCnt || 0), 0);
    totalRow.stockCnt = rowData.reduce((acc, row) => acc + (row.stockCnt || 0), 0);
    totalRow.diff = totalRow.asnCnt - totalRow.stockCnt;
    setSubPinnedBottomRowData([totalRow]);
  }, []);

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };
  useEffect(() => {
    // 검색 조건 또는 페이지가 변경될 때마다 검색 수행
    onSearch();
  }, []);
  /** 프린트 관련 */
  const [isPreView, setIsPreView] = useState<boolean>(false);
  const [selectedDetail, setSelectedDetail] = useState<any[]>([]);
  // 프린트 버튼 클릭 이벤트
  const [isPrinting, setIsPrinting] = useState(false);
  const handlePrintBtnClick = () => {
    if (!isPreView) {
      // 미리보기 off 또는 선택된 ID 없을 경우
      return;
    }
    setIsPrinting(true);
  };

  /** 메인그리드 선택 시 */
  const [mainSelectedData, setMainSelectedData] = useState<StoreResponseReqPaging[]>([]);
  const onMainGridSelectionChanged = async (event: SelectionChangedEvent) => {
    // 선택된 노드 가져오기
    const selectedNodes = event.api.getSelectedNodes().map((node) => node.data);
    setMainSelectedData(selectedNodes);
  };

  /** 서브그리드 선택 시 */
  const onSubGridSelectionChanged = async (event: SelectionChangedEvent) => {
    // 선택된 노드 가져오기
    const selectedNodes = event.api.getSelectedNodes().map((node) => node.data);
    setSubSelectedData(selectedNodes[0] || null);
    // 전표 출력
    const printDetail = await printReturnDetail(selectedNodes[0]?.tranTm);
    const { resultCode, body, resultMessage } = printDetail.data;
    setSelectedDetail([body]);
  };

  /** 서브디테일그리드 선택시 */
  const onSubDetailGridSelectionChanged = (event: SelectionChangedEvent) => {
    // 선택된 노드 가져오기
    const selectedNodes = event.api.getSelectedNodes().map((node) => node.data);
    setSubDetailSelectedData(selectedNodes);
  };

  /** 확정취소비고 저장 */
  const onCellValueChanged = async (params: any) => {
    console.log('변경된 데이터:', params.data);

    try {
      const result = await updateConfirmCntn(params.data);
      toastSuccess('저장되었습니다.');
    } catch (error) {
      // 저장 실패 시
      toastError('저장 중 오류가 발생했습니다.');
    }
  };

  /** 삭제하기 */
  const handleReturnCancle = () => {
    if (mainSelectedData.length > 0) {
      openModal('RETURNCANCLE');
    } else {
      toastError('상품을 선택해 주세요.');
    }
  };
  /** 삭제하기 확인 */
  const { mutate: updateReturnCancleMutate } = useMutation(updateReturn, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('반납 취소되었습니다.');
        mainRefetch();
        closeModal('RETURNCANCLE');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });
  const handleUpdateReturnCancleSubmit = () => {
    const allRowData = mainSelectedData.map((node: any) => {
      const rowData = node;
      return {
        ...rowData,
        updateSkuCnt: rowData.skuCnt,
        updateType: 1, // 반납취소
      };
    });
    updateReturnCancleMutate(allRowData as StoreRequestReqUpdate[]);
  };

  /** 반납처리 */
  const handleReturnConfirm = () => {
    if (mainSelectedData.length > 0) {
      console.log('메인그리드 데이터', mainSelectedData);

      // 데이터 필터링: 재고 부족 상품과 충분한 상품으로 나누기
      const [insufficientStock, sufficientStock] = mainSelectedData.reduce(
        ([insufficient, sufficient], item: any) => {
          if (item.skuCnt > item.partnerInventoryAmt) {
            insufficient.push(item);
          } else {
            sufficient.push(item);
          }
          return [insufficient, sufficient];
        },
        [[], []] as [any[], any[]],
      );
      if (insufficientStock.length > 0) {
        toastError('매장재고가 충분하지 않은 상품이 있습니다.');
        if (sufficientStock.length === 0) {
          // 재고0인 상품만 있을시
          return;
        }
      }
      setMainSelectedData(sufficientStock);
      console.log('필터링된 데이터', sufficientStock);

      openModal('RETURNCONFIRM');
    } else {
      toastError('상품을 선택해 주세요.');
    }
  };
  /** 반납처리 확인 */
  const { mutate: updateReturnConfirmMutate } = useMutation(updateReturn, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('반납 확정되었습니다.');
        mainRefetch();
        closeModal('RETURNCANCLE');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });
  const handleUpdateReturnConfirmSubmit = () => {
    const allRowData = mainSelectedData.map((node: any) => {
      const rowData = node;
      return {
        ...rowData,
        updateType: 2, // 반납확정
      };
    });
    updateReturnConfirmMutate(allRowData as StoreRequestReqUpdate[]);
  };

  /** 확정취소 */
  const handleConfirmCancle = () => {
    if (subDetailSelectedData) {
      if (subDetailSelectedData.length > 0) {
        toastError('확정 취소하실 항목을 선택해주세요.');
        return;
      }
      // 입하 완료된 상품이 있는지 확인
      const hasCompletedItem = subDetailSelectedData.some((item: any) => {
        if (item.asnStatCd === 9) {
          toastError('입하 완료된 상품은 취소하실 수 없습니다.');
          return true;
        }
        return false;
      });

      if (hasCompletedItem) {
        return; // 함수 종료
      }
      openModal('CONFIRMCANCLE');
    } else {
      toastError('상품을 선택해 주세요.');
    }
  };

  return (
    <>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} search={search} reset={reset} />
      <Search className="type_2">
        {filters.isChecked ? (
          <>
            {/*<Search.TwoDatePicker*/}
            {/*  title={'검색기간'}*/}
            {/*  startName={'startDate'}*/}
            {/*  endName={'endDate'}*/}
            {/*  value={[filters.startDate, filters.endDate]}*/}
            {/*  onEnter={search}*/}
            {/*  filters={filters}*/}
            {/*  onChange={onChangeFilters}*/}
            {/*/>*/}
            <CustomNewDatePicker
              type={'range'}
              title={'기간'}
              startName={'startDate'}
              endName={'endDate'}
              value={[filters.startDate, filters.endDate]}
              onChange={onChangeFilters}
              filters={filters}
              defaultType={'type'}
              //selectType={'type'} //defaultType 과 selectType 이 동일하면 동일한 한가지면 펼침메뉴에 나타난다.
            />
            <Search.Input
              title={'상품명'}
              name={'skuNm'}
              placeholder={'상품명을 입력하세요.'}
              value={filters.skuNm}
              onEnter={onSearch}
              onChange={onChangeFilters}
              filters={filters}
            />
            <Search.DropDown
              title={'구분'}
              name={'status'}
              value={filters.status}
              onChange={(name, value) => {
                onChangeFilters(name, value);
                search();
              }}
              defaultOptions={[
                { value: '수정완료', label: '수정완료' },
                { value: '처리중', label: '처리중' },
                { value: '완료', label: '완료' },
              ]}
            />
          </>
        ) : (
          <Search.Input
            title={'상품명'}
            name={'skuNm'}
            placeholder={'상품명을 입력하세요.'}
            value={filters.skuNm}
            onEnter={search}
            onChange={onChangeFilters}
            filters={filters}
          />
        )}
        <Search.Switch
          title={'상태'}
          name={'temp'}
          value={filters.isChecked}
          onChange={(e, value) => {
            handleSwitchChange(value);
          }}
          checkedLabel={'확정'}
          uncheckedLabel={'예정'}
          filters={filters}
        />
      </Search>
      {!filters.isChecked ? (
        <Table>
          <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search} gridRef={gridRef} isPaging={false} />
          <TunedGrid
            ref={gridRef}
            headerHeight={35}
            onGridReady={onGridReady}
            loading={mainIsLoading}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            paginationPageSize={paging.pageRowCount}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            onSelectionChanged={onMainGridSelectionChanged}
            suppressRowClickSelection={false}
            pinnedBottomRowData={pinnedBottomRowData} // 하단에 고정된 합계 행
            className={'default check'}
          />
          <div className="btnArea">
            <CustomShortcutButton className="btn" title="반납처리" onClick={handleReturnConfirm} shortcut={COMMON_SHORTCUTS.gridUnder2}>
              반납처리
            </CustomShortcutButton>
            <CustomShortcutButton className="btn" title="삭제하기" onClick={handleReturnCancle} shortcut={COMMON_SHORTCUTS.gridUnder1}>
              삭제하기
            </CustomShortcutButton>
          </div>
        </Table>
      ) : (
        <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
          <TableHeader count={subPaging.totalRowCount || 0} paging={subPaging} setPaging={setSubPaging} search={search} gridRef={subGridRef} isPaging={false}>
            <button className={`btn ${isPreView ? 'on' : ''}`} title="미리보기" onClick={() => setIsPreView(!isPreView)}>
              미리보기
            </button>
            <button className="btn icoPrint" title="프린트" onClick={handlePrintBtnClick}>
              프린트
            </button>
          </TableHeader>
          <div className="layoutPrivewBox">
            <div className="layoutBox">
              <div className="layout50 show">
                <div className="gridBox">
                  <div className="tblPreview">
                    <TunedGrid
                      ref={subGridRef}
                      onGridReady={onGridReady}
                      loading={subIsLoading}
                      rowData={subRowData || []}
                      columnDefs={subcolumnDefs}
                      defaultColDef={defaultColDef}
                      loadingOverlayComponent={CustomGridLoading}
                      noRowsOverlayComponent={CustomNoRowsOverlay}
                      onSelectionChanged={onSubGridSelectionChanged}
                      suppressRowClickSelection={false}
                      onCellValueChanged={onCellValueChanged}
                      rowSelection={'single'}
                      className={'default check'}
                    />
                  </div>
                </div>
              </div>
              <div className="layout50 hide">
                <div className="gridBox">
                  <div className="tblPreview">
                    <TunedGrid
                      ref={subGridRef}
                      onGridReady={onGridReady}
                      loading={subIsLoading2}
                      rowData={subDetailRowData || []}
                      columnDefs={subDetailcolumnDefs}
                      defaultColDef={defaultColDef}
                      loadingOverlayComponent={CustomGridLoading}
                      noRowsOverlayComponent={CustomNoRowsOverlay}
                      pinnedBottomRowData={subPinnedBottomRowData} // 하단에 고정된 합계 행
                      onSelectionChanged={onSubDetailGridSelectionChanged}
                      suppressRowClickSelection={false}
                      className={'default check'}
                    />
                  </div>
                </div>

                <div className="btnArea mt5">
                  <button
                    className="btn"
                    title="확정 취소"
                    onClick={handleConfirmCancle}
                    disabled={subSelectedData?.asnStatCd === 9 || subSelectedData?.reqStatCd === 'E'}
                  >
                    확정 취소
                  </button>
                </div>
              </div>
            </div>

            <div className="previewBox">
              {isPreView ? (
                selectedDetail?.length > 0 ? (
                  <PrintLayout selectedDetail={selectedDetail} isPrinting={isPrinting} setIsPrinting={setIsPrinting} type="return" />
                ) : (
                  <div className="noRowsOverlayBox">주문을 선택하면 상세 정보가 표시됩니다.</div>
                )
              ) : null}
            </div>
          </div>
        </div>
      )}
      {/*{modalType?.type === 'RETURNCANCLE' && modalType.active && <ReturnCanclePop selectedData={mainSelectedData} />} /!* 반납 취소 *!/*/}
      <ConfirmModal
        title={
          '<div class="confirmMsg"><span class="small">선택된 반납예정 상품을</span><span class="big"><strong>삭제 </strong>&nbsp;처리하시겠어요?</span></div>'
        }
        open={modalType.type === 'RETURNCANCLE' && modalType.active}
        onConfirm={() => {
          handleUpdateReturnCancleSubmit();
        }}
        onClose={() => {
          closeModal('RETURNCANCLE');
        }}
      />
      {/*{modalType?.type === 'RETURNCONFIRM' && modalType.active && <ReturnConfirmPop selectedData={mainSelectedData} />} /!* 반납 확정 *!/*/}
      <ConfirmModal
        title={
          '<div class="confirmMsg"><span class="small">선택된 상품을 빈블러로</span><span class="big"><strong>반납</strong>&nbsp;처리하시겠어요?</span></div>'
        }
        open={modalType.type === 'RETURNCONFIRM' && modalType.active}
        onConfirm={() => {
          handleUpdateReturnConfirmSubmit();
        }}
        onClose={() => {
          closeModal('RETURNCANCLE');
        }}
      />
      {modalType?.type === 'CONFIRMCANCLE' && modalType.active && <ReturnConfirmCanclePop selectedData={subDetailSelectedData} />} {/* 확정취소 */}
      {/*{modalType?.type === 'EDITCONFIRM' && modalType.active && <ReturnEditConfirmPop selectedData={subSelectedData} />} /!* 수정확인 *!/*/}
    </>
  );
};

export default StoreReturn;
