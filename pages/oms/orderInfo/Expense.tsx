/**
 *  매장입출금
 */
import { useAgGridApi } from '../../../hooks';
import { useCommonStore, usePartnerCodeStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ColDef, RowClassParams, SelectionChangedEvent } from 'ag-grid-community';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { PARTNER_CODE } from '../../../libs/const';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { AgGridReact } from 'ag-grid-react';
import { ExpenseResponsePaging } from '../../../generated';
import { useExpenseStore } from '../../../stores/useExpenseStore';
import { authApi } from '../../../libs';
import { Search, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import dayjs from 'dayjs';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { Utils } from '../../../libs/utils';
import { ExpenseAcctSetPop } from '../../../components/popup/expense/ExpenseAcctSetPop';
import ExpenseAddPop from '../../../components/popup/expense/ExpenseAddPop';
import { ConfirmModal } from '../../../components/ConfirmModal';
import ECharts from 'echarts-for-react';
import ExpenseSubDetailPop from '../../../components/popup/expense/ExpenseSubDetailPop';
import { EChartsOption } from 'echarts';
import TunedGrid from '../../../components/grid/TunedGrid';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';
import { useSession } from 'next-auth/react';

const Expense = () => {
  const nowPage = 'oms_expense'; // filter 저장 2025-01-21
  const router = useRouter();
  const session = useSession();
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');
  const yesterday = dayjs(new Date()).add(-1, 'day').format('YYYY-MM-DD');
  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList, // filter 저장 2025-01-21
    s.setFilterDataList, // filter 저장 2025-01-21
    s.getFilterData, // filter 저장 2025-01-21
  ]);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseResponsePaging[]>([]);
  const [selectedSubData, setSelectedSubData] = useState<ExpenseResponsePaging[]>([]);
  const gridRef = useRef<AgGridReact>(null);
  const subGridRef = useRef<AgGridReact>(null);
  const { onGridReady } = useAgGridApi();
  const [filters, onChangeFilters, onFiltersReset] = useFilters(
    getFilterData(filterDataList, nowPage) || {
      // filter 저장 2025-01-21
      workYmd: today,
      startDate: yesterday,
      endDate: today,
      accountNm: '',
      noteCntn: '',
      creUser: '',
      isChecked: false,
    },
  );

  // 매장입출금 스토어
  const [
    paging,
    setPaging,
    subPaging,
    subSetPaging,
    modalType,
    openModal,
    closeModal,
    deleteExpense,
    getExpenseSubDetail,
    selectedDetail,
    setSelectedDetail,
    updateExpense,
    getAccountFrequency,
  ] = useExpenseStore((s) => [
    s.paging,
    s.setPaging,
    s.subPaging,
    s.subSetPaging,
    s.modalType,
    s.openModal,
    s.closeModal,
    s.deleteExpense,
    s.getExpenseSubDetail,
    s.selectedDetail,
    s.setSelectedDetail,
    s.updateExpense,
    s.getAccountFrequency,
  ]);

  /** 하위코드 목록 조회 */
  const [selectPartnerCodeDropdown] = usePartnerCodeStore((s) => [s.selectPartnerCodeDropdown]);
  const [partnerCodeList, setPartnerCodeList] = useState<any>([]);
  const { data: CustStateList, isSuccess: isCustStateSuccess } = useQuery(['/partnerCode/dropdown'], () => selectPartnerCodeDropdown(PARTNER_CODE.expense));

  useEffect(() => {
    const codeList = CustStateList?.data?.body?.map((item) => ({
      codeCd: item.codeCd,
      codeNm: item.codeNm,
    }));
    // console.log('코드', codeList);
    setPartnerCodeList(codeList);
  }, [isCustStateSuccess]);

  // 메인 그리드
  const [columnDefs, setColumnDefs] = useState<ColDef<ExpenseResponsePaging>[]>([]);

  useEffect(() => {
    if (isCustStateSuccess) {
      setColumnDefs([
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
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'workYmd',
          headerName: '영업일자',
          minWidth: 100,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'creTm',
          headerName: '입력시간',
          minWidth: 100,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          valueFormatter: (params) => {
            if (params.node?.rowPinned === 'bottom') {
              return '';
            } else {
              return dayjs(params.value).format('MM/DD(ddd) HH:mm');
            }
          },
        },
        {
          field: 'accountCd',
          headerName: '유형',
          minWidth: 100,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          hide: true,
        },
        {
          field: 'accountNm',
          headerName: '유형',
          filter: true,
          minWidth: 100,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          editable: (params) => !(params.node?.rowPinned === 'bottom'),
          cellEditor: 'agRichSelectCellEditor',
          cellEditorParams: {
            values: partnerCodeList.map((item: any) => item.codeNm), // codeNm만 보여주기
            allowTyping: true,
            filterList: true,
            highlightMatch: true,
          },
          onCellValueChanged: (params) => {
            const selectedCodeNm = params.newValue; // 사용자가 선택한 newValue (label)
            // 선택된 codeNm을 기반으로 codeCd 찾기
            const selectedCode = partnerCodeList.find((item: any) => item.codeNm === selectedCodeNm);
            if (selectedCode) {
              const rowNode = params.node;
              if (rowNode) {
                // 선택된 codeCd를 accountCd로 반영
                rowNode.setDataValue('accountCd', selectedCode.codeCd); // codeCd를 accountCd에 설정
              }
            }
          },
          cellClass: (params) => {
            return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
          },
        },
        {
          field: 'inAmt',
          headerName: '입금금액',
          minWidth: 100,
          cellStyle: GridSetting.CellStyle.RIGHT,
          suppressHeaderMenuButton: true,
          valueFormatter: (params) => {
            return Utils.setComma(params.value);
          },
          editable: (params) => !(params.node?.rowPinned === 'bottom'),
          cellClass: (params) => {
            return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
          },
        },
        {
          field: 'outAmt',
          headerName: '출금금액',
          minWidth: 100,
          cellStyle: GridSetting.CellStyle.RIGHT,
          suppressHeaderMenuButton: true,
          valueFormatter: (params) => {
            return Utils.setComma(params.value);
          },
          editable: (params) => !(params.node?.rowPinned === 'bottom'),
          cellClass: (params) => {
            return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
          },
        },
        {
          field: 'creUser',
          headerName: '사용자',
          minWidth: 100,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'noteCntn',
          headerName: '비고',
          minWidth: 260,
          cellStyle: GridSetting.CellStyle.LEFT,
          suppressHeaderMenuButton: true,
          editable: (params) => !(params.node?.rowPinned === 'bottom'),
          cellClass: (params) => {
            return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
          },
        },
      ]);
    }
  }, [partnerCodeList]);

  // 서브 그리드
  const [subColumnDefs] = useState<ColDef[]>([
    {
      field: 'no',
      headerName: 'No.',
      minWidth: 40,
      maxWidth: 40,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'accountNm',
      headerName: '유형',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'depositCount',
      headerName: '입금건',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'totalInAmt',
      headerName: '입금금액',
      minWidth: 150,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'withdrawalCount',
      headerName: '출금건',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'totalOutAmt',
      headerName: '출금금액',
      minWidth: 150,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
  ]);

  // 매장입출금 목록 조회
  const {
    data: expenseData,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery(
    ['/orderInfo/expense/paging', paging.curPage, filters.workYmd, filters.startDate, filters.endDate],
    () => {
      const params = {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      };
      return authApi.get('/orderInfo/expense/paging', { params });
    },
    { enabled: true },
  );

  // 매장입출금 서브목록 조회
  const {
    data: expenseSubData,
    isLoading: subIsLoading,
    isSuccess: subIsSuccess,
    refetch: subRefetch,
  } = useQuery(
    ['/orderInfo/expense/sub', subPaging.curPage, filters.startDate, filters.endDate],
    () => {
      const params = {
        curPage: subPaging.curPage,
        pageRowCount: subPaging.pageRowCount,
        ...filters,
      };
      return authApi.get('/orderInfo/expense/sub', { params });
    },
    {
      enabled: !!filters.isChecked,
    },
  );
  // pinnedBottomRowData 계산 함수
  const calculatePinnedBottomRowData = () => {
    const dataArray = expenseSubData?.data.body.rows || []; // expenseSubData에서 데이터를 가져옴
    const totalDepositCount = dataArray?.reduce((acc: any, curr: any) => acc + (curr.depositCount || 0), 0);
    const totalInAmt = dataArray?.reduce((acc: any, curr: any) => acc + Number(curr.totalInAmt || 0), 0);
    const totalWithdrawalCount = dataArray?.reduce((acc: any, curr: any) => acc + (curr.withdrawalCount || 0), 0);
    const totalOutAmt = dataArray?.reduce((acc: any, curr: any) => acc + Number(curr.totalOutAmt || 0), 0);

    return [
      {
        no: null,
        depositCount: totalDepositCount,
        totalInAmt: totalInAmt,
        withdrawalCount: totalWithdrawalCount,
        totalOutAmt: totalOutAmt,
      },
    ];
  };

  const calculatePinnedBottomMainRowData = () => {
    const dataArray = expenseData?.data.body.rows || []; // expenseSubData에서 데이터를 가져옴
    const inAmtTotal = dataArray?.reduce((acc: any, curr: any) => acc + (curr.inAmt || 0), 0);
    const outAmtTotal = dataArray?.reduce((acc: any, curr: any) => acc + Number(curr.outAmt || 0), 0);

    return [
      {
        creTm: '',
        inAmt: inAmtTotal,
        outAmt: outAmtTotal,
      },
    ];
  };

  // pinnedBottomRowData 업데이트
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any[]>([]);
  const [pinnedBottomRowDataSub, setPinnedBottomRowDataSub] = useState<any[]>([]);
  useEffect(() => {
    if (subIsSuccess) {
      setPinnedBottomRowDataSub(calculatePinnedBottomRowData()); // 총합을 포함한 바닥 행 데이터 설정
    }
  }, [expenseSubData, subIsSuccess]); // 데이터가 로딩되었을 때 footer 업데이트

  useEffect(() => {
    if (isSuccess) {
      setPinnedBottomRowData(calculatePinnedBottomMainRowData()); // 총합을 포함한 바닥 행 데이터 설정
    }
  }, [expenseData, isSuccess]); // 데이터가 로딩되었을 때 footer 업데이트

  // 매장입출금 삭제
  const { mutate: deleteExpenseMutate } = useMutation(deleteExpense, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('삭제되었습니다.');
        await refetch();
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err) => {
      toastError('삭제 중 오류가 발생했습니다.');
      console.error(err);
    },
  });

  // 그리드 페이징 설정
  // useEffect 수정
  useEffect(() => {
    if (isSuccess) {
      const { resultCode, body, resultMessage } = expenseData.data;
      if (resultCode === 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
        if (body?.rows) {
          setPaging(body.paging);
          console.log('Loaded data: ==>', body.rows); // 데이터 확인용 로그
          setTimeout(() => {
            gridRef.current?.api.ensureIndexVisible(body.rows ? body.rows.length - 1 : 0);
            gridRef.current?.api.setFocusedCell(body.rows ? body.rows.length - 1 : 0, 'accountNm');
          }, 0); // 하단 포커스
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [expenseData, isSuccess, setPaging]);

  useEffect(() => {
    if (subIsSuccess) {
      const { resultCode, body, resultMessage } = expenseSubData.data;
      if (resultCode === 200) {
        subSetPaging(body.paging);
        setSelectedSubData(body.rows);

        setTimeout(() => {
          subGridRef.current?.api.ensureIndexVisible(body.rows ? body.rows.length - 1 : 0);
          subGridRef.current?.api.setFocusedCell(body.rows ? body.rows.length - 1 : 0, 'accountNm');
        }, 0); // 하단 포커스
      } else {
        toastError(resultMessage);
      }
    }
  }, [expenseSubData, subIsSuccess, subSetPaging]);

  useEffect(() => {
    refetch();
  }, [router.pathname]);

  //검색
  const search = async () => {
    if (filters.isChecked) {
      subSetPaging({ curPage: 1 });
      await subRefetch();
    } else {
      setPaging({ curPage: 1 });
      await refetch();
    }
  };

  // 검색버튼 이벤트
  const onSearch = async () => {
    await search();
  };

  // 초기화버튼 이벤트
  const onReset = async () => {
    onChangeFilters('isChecked', false);
    onChangeFilters('startDate', yesterday);
    onChangeFilters('endDate', today);
    onChangeFilters('workYmd', today);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await search();
  };

  // 삭제
  const onDeleteExpense = async () => {
    if (selectedExpense?.length > 0) {
      selectedExpense.forEach((item) => {
        deleteExpenseMutate(item.id as number);
      });
    }
  };

  // row 클릭 이벤트
  // const [isCellClicked, setIsCellClicked] = useState(false);
  // const handleGridCellClick = async (e: RowDoubleClickedEvent) => {
  //   e.api.deselectAll();
  //   setSelectedExpense({ id: e.data.id });
  //   setIsCellClicked(true);
  // };
  // useEffect(() => {
  //   if (isCellClicked && selectedExpense !== null) {
  //     openModal('MOD');
  //     setIsCellClicked(false); // 모달을 연 후 다시 false로 설정
  //   }
  // }, [selectedExpense, isCellClicked]);

  const handleSwitchChange = (checked: boolean) => {
    onChangeFilters('isChecked', checked);
    if (!checked) {
      setTimeout(() => {
        gridRef.current?.api.ensureIndexVisible(expenseData?.data.body.rows ? expenseData.data.body.rows.length - 1 : 0);
        gridRef.current?.api.setFocusedCell(expenseData?.data.body.rows ? expenseData.data.body.rows.length - 1 : 0, 'accountNm');
      }, 0); // 하단 포커스
    } else {
      setTimeout(() => {
        if (selectedSubData?.length) {
          const rowIndex = selectedSubData.length - 1;
          subGridRef.current?.api.ensureIndexVisible(rowIndex);
          subGridRef.current?.api.setFocusedCell(rowIndex, 'accountNm');
        } else {
          subGridRef.current?.api.ensureIndexVisible(0);
          subGridRef.current?.api.setFocusedCell(0, 'accountNm');
        }
      }, 0); // 하단 포커스
    }
    //search();
  };

  // 메인그리드 선택 함수
  const handleSelectionChange = (e: SelectionChangedEvent) => {
    const selectedRows = e.api.getSelectedRows(); // 현재 선택된 행들을 배열로 가져옴
    setSelectedExpense(selectedRows);
  };

  // 서브그리드 선택 함수
  const [subSelectedExpense, setSeubSelectedExpense] = useState();
  const handleSelectionChangeSub = (e: SelectionChangedEvent) => {
    const selectedRows = e.api.getSelectedRows()[0];
    setSeubSelectedExpense(selectedRows);
  };
  // 기간(서브) 그리드 더블클릭 이벤트
  const handleSubGridDoubleClick = (e: any) => {
    handleSelectedRow(e);
  };
  // 내역보기 버튼 클릭 이벤트
  const handleSelectBtn = () => {
    handleSelectedRow({ api: { getSelectedRows: () => [subSelectedExpense] } } as SelectionChangedEvent);
  };
  // 선택된 행을 처리하는 공통 함수
  const handleSelectedRow = async (e: SelectionChangedEvent) => {
    const selectedRows = e.api.getSelectedRows()[0]; // 선택된 첫 번째 행 가져오기
    setSeubSelectedExpense(selectedRows); // 선택된 행 상태 업데이트

    if (selectedRows) {
      try {
        const result = await getExpenseSubDetail({
          accountCd: selectedRows.accountCd,
          startDate: filters.startDate,
          endDate: filters.endDate,
        });

        if (result.data.resultCode === 200) {
          setSelectedDetail(result.data.body as ExpenseResponsePaging[]);
          openModal('SUBDETAIL');
        }
      } catch (error) {
        console.error('상세 정보를 가져오는 중 오류 발생:', error);
      }
    }
  };

  // 매장입출금 수정
  const { mutate: updateExpenseMutate } = useMutation(updateExpense, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('수정되었습니다.');
        refetch();
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err) => {
      console.error(err);
      toastError('수정 중 오류가 발생하였습니다.');
    },
  });

  // 셀 수정
  const onCellEditCommit = (event: any) => {
    const updatedRow = event.node.data;
    const updatedField = event.colDef.field;
    const newValue = event.newValue;

    // 이전 값과 새 값이 같으면 수정 처리 없이 리턴
    if (newValue === event.oldValue) return;

    const isValid = validateCellValue(updatedField, newValue);
    if (!isValid) {
      // 벨리데이션 실패 시 원래 값으로 되돌리거나 알림 표시
      event.node.setDataValue(updatedField, event.oldValue); // 이전 값으로 되돌리기
      toastError('유효하지 않은 값입니다.');
    } else {
      // 업데이트
      updateExpenseMutate(updatedRow);
    }
  };
  // 벨리데이션 함수 예시
  const validateCellValue = (field: string, value: any) => {
    switch (field) {
      case 'inAmt':
      case 'outAmt':
        return !isNaN(value) && value >= 0;
      case 'noteCntn':
        if (typeof value === 'string' && value.length > 1000) {
          return false;
        } else {
          return true;
        }
        break;
      default:
        return true; // 기본적으로는 유효한 값으로 처리
    }
  };

  // 차트데이터
  const [chartData, setChartData] = useState<EChartsOption>();
  useEffect(() => {
    const accountCdData = selectedSubData?.map((item) => item.accountCd).filter((item): item is string => item !== undefined);
    const newCodeNmArray = partnerCodeList.filter((partner: any) => accountCdData?.includes(partner.codeCd)).map((partner: any) => partner.codeNm);

    const totalOutAmtData = selectedSubData?.map((item) => item.totalOutAmt).filter((item): item is number => item !== undefined);
    // 차트 옵션 설정
    setChartData({
      title: {
        text: '',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {},
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        boundaryGap: [0, 0.01],
      },
      yAxis: {
        type: 'category',
        data: newCodeNmArray,
      },
      series: [
        {
          name: '총 출금금액',
          type: 'bar',
          data: totalOutAmtData,
          itemStyle: {
            color: '#0070C0',
          },
          barWidth: 20,
        },
      ],
    });
  }, [selectedSubData]);

  // 즐겨찾기
  const [frequencyList, setFrequencyList] = useState<any>([]);
  const [selectedFrequency, setSelectedFrequency] = useState<number>();
  useEffect(() => {
    const fetchAccountFrequency = async () => {
      const list = await getAccountFrequency();
      console.log('어카운트', list.data.body);
      setFrequencyList(list.data.body);
    };
    fetchAccountFrequency();
  }, []);
  const handleFrequencyClick = (accountCd: number) => {
    setSelectedFrequency(accountCd);
  };
  useEffect(() => {
    if (selectedFrequency) {
      openModal('ADD');
    }
  }, [selectedFrequency]);

  // (params: RowClassParams<any, any>) => ("ag-grid-pinned-row" | undefined)
  // 메모이제이션 하지 않을 경우 깜빡임 현상 발생
  const getRowClass = useCallback((params: RowClassParams) => {
    if (params.node.rowPinned === 'bottom') {
      return 'ag-grid-pinned-row';
    }
    return '';
  }, []);

  const getRowClassSub = useCallback((params: RowClassParams) => {
    if (params.node.rowPinned === 'bottom') {
      return 'ag-grid-pinned-row';
    }
    return '';
  }, []);

  return (
    <>
      <Title title={menuNm ? `${menuNm}` : ''} reset={onReset} filters={filters} search={onSearch} />
      <Search className="type_2">
        {filters.isChecked ? (
          <CustomNewDatePicker
            type={'range'}
            title={'기간'}
            startName={'startDate'}
            endName={'endDate'}
            value={[filters.startDate, filters.endDate]}
            onChange={onChangeFilters}
            filters={filters}
            defaultType={'type'}
          />
        ) : (
          <CustomNewDatePicker name={'workYmd'} type={'date'} title={'일자'} value={filters.workYmd} onChange={onChangeFilters} filters={filters} />
        )}
        <Search.Switch
          title={'기간선택'}
          name={'temp'}
          checkedLabel={'기간'}
          uncheckedLabel={'당일'}
          onChange={(e, value) => {
            handleSwitchChange(value);
          }}
          filters={filters}
          value={filters.isChecked ?? false}
        />
      </Search>
      {filters && !filters.isChecked ? (
        <>
          <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search} isPaging={false}>
            <div className="favoriteBtn">
              {frequencyList && frequencyList.length > 0
                ? frequencyList.map((item: any) => {
                    return (
                      <button
                        key={item.accountCd}
                        onClick={() => {
                          handleFrequencyClick(item.accountCd);
                        }}
                      >
                        {item.accountNm}
                      </button>
                    );
                  })
                : ''}
            </div>
          </TableHeader>
          <div className="gridBox">
            <TunedGrid
              ref={gridRef}
              onGridReady={onGridReady}
              loading={isLoading}
              rowData={(expenseData?.data?.body?.rows as ExpenseResponsePaging[]) || []}
              gridOptions={{ suppressLoadingOverlay: false, suppressNoRowsOverlay: false }}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              paginationPageSize={paging.pageRowCount}
              rowSelection={'multiple'}
              onSelectionChanged={handleSelectionChange}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              onCellEditingStopped={onCellEditCommit}
              className={'default'}
              singleClickEdit={true}
              pinnedBottomRowData={pinnedBottomRowData}
              getRowClass={getRowClass}
            />
            <div className="btnArea">
              <CustomShortcutButton
                className="btn"
                title="등록하기"
                shortcut={COMMON_SHORTCUTS.gridUnder1}
                onClick={() => {
                  openModal('ADD');
                }}
              >
                등록하기
              </CustomShortcutButton>
              <CustomShortcutButton
                className="btn"
                title="삭제하기"
                shortcut={COMMON_SHORTCUTS.gridUnder2}
                onClick={() => {
                  if (selectedExpense) {
                    openModal('DELETE');
                  } else {
                    toastError('삭제하실 행을 선택하세요.');
                  }
                }}
              >
                삭제하기
              </CustomShortcutButton>
              {/* 20250227 등록하기에 추가기능으로 인한 삭제 */}
              {/*<CustomShortcutButton className="btn" shortcut={COMMON_SHORTCUTS.gridUnder3} title="계정과목관리" onClick={() => openModal('CATEGORYSETTING')}>*/}
              {/*  설정*/}
              {/*</CustomShortcutButton>*/}
            </div>
          </div>
        </>
      ) : (
        <div className="layoutBox">
          <div className="layout50">
            <TableHeader count={subPaging.totalRowCount || 0} paging={subPaging} setPaging={subSetPaging} search={search} isPaging={false} />
            <div className="gridBox">
              <TunedGrid
                ref={subGridRef}
                onGridReady={onGridReady}
                loading={subIsLoading}
                rowData={selectedSubData || []}
                columnDefs={subColumnDefs}
                defaultColDef={defaultColDef}
                paginationPageSize={paging.pageRowCount}
                rowSelection={'single'}
                onRowDoubleClicked={handleSubGridDoubleClick}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                onSelectionChanged={handleSelectionChangeSub}
                className={'expense'}
                pinnedBottomRowData={pinnedBottomRowDataSub}
                getRowClass={getRowClassSub}
              />
              <div className="btnArea">
                <button className="btn" title="내역보기" onClick={handleSelectBtn}>
                  내역보기
                </button>
              </div>
            </div>
          </div>
          <div className="layout50">
            <div className="graphBox expense mt40">{chartData && <ECharts option={chartData} opts={{ renderer: 'svg' }} />}</div>
          </div>
        </div>
      )}

      {/*Modal Popup*/}
      {modalType?.type === 'CATEGORYSETTING' && modalType.active && <ExpenseAcctSetPop />}
      {modalType?.type === 'ADD' && modalType.active && <ExpenseAddPop selectedFrequency={selectedFrequency} setSelectedFrequency={setSelectedFrequency} />}
      {/*{modalType?.type === 'MOD' && selectedExpense && modalType.active && <ExpenseAddPop selectedExpenseId={selectedExpense.id} />}*/}
      {modalType?.type === 'SUBDETAIL' && modalType.active && <ExpenseSubDetailPop />}
      <ConfirmModal
        open={modalType.type === 'DELETE' && modalType.active}
        onClose={() => closeModal('DELETE')}
        onConfirm={onDeleteExpense}
        title={`<div class="confirmMsg"><span class="small">선택하신 매장입출금 내역을 </span><span class="big"><strong>삭제처리 </strong>&nbsp;하시겠어요?</spanclass></div> `}
        width={400}
      />
    </>
  );
};

export default Expense;
