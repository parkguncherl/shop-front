import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Title, toastSuccess } from '../../../components';
import { TableHeader, toastError } from '../../../components';
import { useQuery } from '@tanstack/react-query';
import { CellClickedEvent, CellEditingStoppedEvent, CellKeyDownEvent, ColDef, FullWidthCellKeyDownEvent, RowClassParams } from 'ag-grid-community';
import { AgGridReact, CustomCellRendererProps } from 'ag-grid-react';
import { GridSetting } from '../../../libs/ag-grid';
import { useAgGridApi } from '../../../hooks';
import useFilters from '../../../hooks/useFilters';
import { useCommonStore } from '../../../stores';
import { authApi } from '../../../libs';
import { RetailResponseDetail, VatInoutRequestCreate, VatInoutRequestUpdate, VatResponseInoutResponse, VatResponsePaging } from '../../../generated';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { useRouter } from 'next/router';
import { useVatStore } from '../../../stores/useVatStore';
import { VatAddPop } from '../../../components/popup/orderMng/vat/VatAddPop';
import { Utils } from '../../../libs/utils';
import { VatModPop } from '../../../components/popup/orderMng/vat/VatModPop';
import { VatInoutAddPop } from '../../../components/popup/orderMng/vat/VatInoutAddPop';
import dayjs from 'dayjs';
import PrintLayout from '../../../components/print/PrintLayout';
import { ConfirmModal } from '../../../components/ConfirmModal';
import TunedGrid from '../../../components/grid/TunedGrid';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import CustomNewDatePicker, { CustomNewDatePickerRefInterface } from '../../../components/CustomNewDatePicker';

/**
 * 부가세
 */
const Vat = () => {
  const nowPage = 'oms_vat'; // filter 저장 2025-01-21
  const router = useRouter();
  const { onGridReady } = useAgGridApi();
  const [gridKey, setGridKey] = useState(0);

  const [
    paging,
    setPaging,
    setVatResponsePagingInfo,
    modalType,
    openModal,
    closeModal,
    setVatResponsePaging,
    insertVatInouts,
    updateVatInout,
    deleteVatInout,
    updateVatIssuYn,
    getVatDetail,
    deleteVat,
    setRetail,
  ] = useVatStore((s) => [
    s.paging,
    s.setPaging,
    s.setVatResponsePagingInfo,
    s.modalType,
    s.openModal,
    s.closeModal,
    s.setVatResponsePaging,
    s.insertVatInouts,
    s.updateVatInout,
    s.deleteVatInout,
    s.updateVatIssuYn,
    s.getVatDetail,
    s.deleteVat,
    s.setRetail,
  ]);

  const mainGridRef = useRef<AgGridReact>(null);
  const subGridRef = useRef<AgGridReact>(null);
  const datePickerRef = useRef<CustomNewDatePickerRefInterface>(null);

  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<VatResponsePaging[]>([]); // 합계데이터 만들기
  const [pinnedBottomInoutRowData, setPinnedBottomInoutRowData] = useState<VatResponseInoutResponse[]>([]); // 합계데이터 만들기
  const [upMenuNm, menuNm, selectedRetailInCommon, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.selectedRetail,
    s.filterDataList, // filter 저장 2025-01-21
    s.setFilterDataList, // filter 저장 2025-01-21
    s.getFilterData, // filter 저장 2025-01-21
  ]);
  const [isPreView, setIsPreView] = useState<boolean>(false);
  const [selectedDetail, setSelectedDetail] = useState<any>(); // 전표 조회 데이터
  const previewRef = useRef<HTMLInputElement>(null);
  const [selectedRetail, setSelectedRetail] = useState<RetailResponseDetail | undefined>(
    router.asPath.split('?').length == 2 ? selectedRetailInCommon : undefined,
  ); // 소매처 검색 영역에서 소매처를 선택할 경우 설정되는 상태(그 이외의 경우는 setState 사용 지양)

  const [inoutFilters, onChangeInoutFilters] = useFilters({
    vatId: undefined,
  });

  const [filters, onChangeFilters] = useFilters(
    getFilterData(filterDataList, nowPage) || {
      // filter 저장 2025-01-21
      startDate: dayjs().startOf('year').format('YYYY-MM-DD'), // 당해년도 1월 1일자로 조회한다.
      endDate: dayjs().endOf('month').format('YYYY-MM-DD'), // 이달 말일구하기
      searchKeyword: '',
      sellerNm: '',
      sellerId: selectedRetail?.id,
    },
  );

  const [vatPagingResponse, setVatPagingResponse] = useState<VatResponsePaging[]>([]);
  const [vatInoutList, setVatInoutList] = useState<VatResponseInoutResponse[]>([]);

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    // 소매처 정보를 제외한 필터 초기화
    onChangeFilters('startDate', dayjs().startOf('year').format('YYYY-MM-DD')); // 당해년도 1월 1일자로 조회한다.
    onChangeFilters('endDate', dayjs().endOf('month').format('YYYY-MM-DD')); // 당해년도 1월 1일자로 조회한다.
    onChangeFilters('searchKeyword', '');
    onChangeFilters('sellerNm', '');
    onChangeFilters('sellerId', 0);
    setSelectedRetail(undefined);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await onSearch();
  };

  const [columnDefs] = useState<ColDef<VatResponsePaging>[]>([
    {
      field: 'workYmd',
      headerName: '청구일자',
      maxWidth: 80,
      minWidth: 80,
      cellStyle: (params): { textAlign: string; marginLeft?: string } => {
        // pinned bottom row에서만 left로 정렬
        if (params.node?.rowPinned === 'bottom') {
          return { textAlign: 'left', marginLeft: '10px' }; // 왼쪽 정렬
        }
        return { textAlign: 'center' }; // 기본값: 중앙 정렬
      },
      suppressHeaderMenuButton: true,
      cellClassRules: {
        // 조건이 true일 때 'red-cell' 클래스를 적용
        'ag-grid-peach': (params) => params.value === '입금',
      },
      colSpan: (params) => {
        // pinned bottom row에서만 sellerNm 필드를 병합하도록 조건 추가
        if (params.node?.rowPinned === 'bottom') {
          return 2; // 두 개의 열을 병합
        }
        return 1; // 병합하지 않음
      },
    },
    {
      field: 'sellerNm',
      headerName: '소매처',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'totSailAmt',
      headerName: '실매출액',
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'cashSailAmt',
      headerName: '현금거래',
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'accountSailAmt',
      headerName: '통장거래',
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'vatAmt',
      headerName: 'VAT 청구',
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'vatCashAmt',
      headerName: '현급입금',
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'vatAccountAmt',
      headerName: '통장입금',
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'vatDcAmt',
      headerName: '할인금액',
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'vatNowAmt',
      headerName: 'VAT 잔',
      filter: true,
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'issuYn',
      headerName: '발행',
      filter: true,
      minWidth: 60,
      maxWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      onCellClicked: (e) => {
        if (e.data && e.data.id && e.data.issuYn) {
          if (e.data.issuYn == 'Y') {
            updateVatIssuYn({
              id: e.data.id,
              issuYn: 'N',
            }).then(() => {
              fetchVats();
            });
          } else {
            updateVatIssuYn({
              id: e.data.id,
              issuYn: 'Y',
            }).then(() => {
              fetchVats();
            });
          }
        }
      },
      cellRenderer: (params: CustomCellRendererProps) => {
        if (params.value == 'Y') {
          return '▣';
        } else if (params.value == 'N') {
          return '□';
        }
      },
      valueFormatter: (params) => {
        if (params.value == 'Y') {
          return '▣';
        } else {
          return '□';
        }
      },
    },
    {
      field: 'vatStrYmd',
      headerName: '기간시작',
      minWidth: 75,
      maxWidth: 75,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'vatEndYmd',
      headerName: '기간종료',
      minWidth: 75,
      maxWidth: 75,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'etcCntn',
      headerName: '비고',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
      //checkboxSelection: true,
    },
    {
      field: 'etcPrnYn',
      headerName: '비고발행',
      minWidth: 75,
      maxWidth: 75,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      hide: true,
    },
  ]);

  const [inoutColDefs] = useState<ColDef<VatResponseInoutResponse>[]>([
    {
      field: 'workYmd',
      headerName: '영업일자',
      maxWidth: 80,
      minWidth: 80,
      editable: (params) => !(params.node?.rowPinned === 'bottom'),
      cellClass: (params) => {
        return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
      },
      valueParser: (params) => {
        /** 그리드 자체 검증으로 인하여 날짜 형식(yyyy-mm-dd) 이외의 값을 입력 시 값이 반환되지 않음, 해당 정의를 통하여 기본 검증 동작 무력화 */
        return params.newValue;
      },
      cellEditor: 'agTextCellEditor', // 문자열 편집을 명시적으로 활성화하여야
      suppressHeaderMenuButton: true,
    },
    {
      field: 'vatCashAmt',
      headerName: '현금',
      minWidth: 70,
      maxWidth: 70,
      editable: (params) => !(params.node?.rowPinned === 'bottom'),
      cellClass: (params) => {
        return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'vatAccountAmt',
      headerName: '입금',
      minWidth: 70,
      maxWidth: 70,
      editable: (params) => !(params.node?.rowPinned === 'bottom'),
      cellClass: (params) => {
        return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'vatDcAmt',
      headerName: '할인금액',
      minWidth: 70,
      maxWidth: 70,
      editable: (params) => !(params.node?.rowPinned === 'bottom'),
      cellClass: (params) => {
        return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'vatTotAmt',
      headerName: '총금액',
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      hide: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'etcPrnYn',
      headerName: '비고출력',
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      hide: true,
      valueFormatter: (params) => {
        if (params.value == 'Y') {
          return '출력';
        } else {
          return '미출력';
        }
      },
    },
    {
      field: 'etcCntn',
      headerName: '비고',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
  ]);

  const {
    data: vats,
    isSuccess: isPagingSuccess,
    refetch: fetchVats,
  } = useQuery({
    queryKey: ['/vat/paging', paging.curPage],
    queryFn: () =>
      authApi.get('/vat/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
  });

  const {
    //data: vatInouts,
    //isSuccess: isInoutListSuccess,
    refetch: fetchVatInouts,
  } = useQuery({
    queryKey: ['/vat/inout', inoutFilters.vatId],
    queryFn: () =>
      authApi.get('/vat/inout', {
        params: {
          ...inoutFilters,
        },
      }),
    enabled: false,
  });

  useEffect(() => {
    if (isPagingSuccess) {
      const { resultCode, body, resultMessage } = vats.data;
      if (resultCode === 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
        setPaging(body?.paging);
        setVatPagingResponse(body.rows);
        if (body.rows && body.rows.length > 0) {
          const { sailAmtTotal, sailAccountAmtTotal, sailCashAmtTotal, vatTotal, vatCashAmtTotal, vatAccountAmtTotal, vatDcTotal, vatNowAmtTotal } =
            body.rows.reduce(
              (
                acc: {
                  sailAmtTotal: number;
                  sailAccountAmtTotal: number;
                  sailCashAmtTotal: number;
                  vatTotal: number;
                  vatCashAmtTotal: number;
                  vatAccountAmtTotal: number;
                  vatDcTotal: number;
                  vatNowAmtTotal: number;
                },
                data: VatResponsePaging,
              ) => {
                //console.log('data==>', data);
                return {
                  // 청구합계
                  sailAmtTotal: acc.sailAmtTotal + (data.totSailAmt ? data.totSailAmt : 0),
                  sailAccountAmtTotal: acc.sailAccountAmtTotal + (data.accountSailAmt ? data.accountSailAmt : 0),
                  sailCashAmtTotal: acc.sailCashAmtTotal + (data.cashSailAmt ? data.cashSailAmt : 0),
                  vatTotal: acc.vatTotal + (data.vatAmt ? data.vatAmt : 0),
                  vatCashAmtTotal: acc.vatCashAmtTotal + (data.vatCashAmt ? data.vatCashAmt : 0),
                  vatAccountAmtTotal: acc.vatAccountAmtTotal + (data.vatAccountAmt ? data.vatAccountAmt : 0),
                  vatDcTotal: acc.vatDcTotal + (data.vatDcAmt ? data.vatDcAmt : 0),
                  vatNowAmtTotal: acc.vatNowAmtTotal + (data.vatNowAmt ? data.vatNowAmt : 0),
                };
              },
              {
                sailAmtTotal: 0,
                sailAccountAmtTotal: 0,
                sailCashAmtTotal: 0,
                vatTotal: 0,
                vatCashAmtTotal: 0,
                vatAccountAmtTotal: 0,
                vatDcTotal: 0,
                vatNowAmtTotal: 0,
              }, // 초기값 설정
            );

          setPinnedBottomRowData([
            {
              totSailAmt: sailAmtTotal,
              accountSailAmt: sailAccountAmtTotal,
              cashSailAmt: sailCashAmtTotal,
              vatAmt: vatTotal,
              vatCashAmt: vatCashAmtTotal,
              vatAccountAmt: vatAccountAmtTotal,
              vatDcAmt: vatDcTotal,
              vatNowAmt: vatNowAmtTotal,
            },
          ]);
        } else {
          setVatPagingResponse([]);
        }

        setTimeout(() => {
          mainGridRef.current?.api.ensureIndexVisible(body.rows ? body.rows.length - 1 : 0);
          mainGridRef.current?.api.setFocusedCell(body.rows ? body.rows.length - 1 : 0, 'sellerNm');
        }, 0); // 하단 포커스
      } else {
        toastError(resultMessage);
      }
    }
  }, [vats, isPagingSuccess, setPaging]);

  useEffect(() => {
    fetchVatInouts().then((result) => {
      if (result.data && result.status == 'success') {
        console.log(result.data, 'fetchVatInouts');
        const { resultCode, body, resultMessage } = result.data.data;
        if (resultCode === 200) {
          /*const inoutList = vatInoutList;
          const response = body as VatResponseInoutResponse[];
          //VatResponseInoutResponse
          inoutList.length = response.length;
          for (let i = 0; i < response.length; i++) {
            inoutList[i] = response[i];
          }
          console.log(inoutList, response);*/
          //setVatInoutList(body);
          setVatInoutList(body);
        } else {
          toastError(resultMessage);
        }
      }
    });
  }, [inoutFilters.vatId]);

  useEffect(() => {
    // 모달을 닫을 시 refetch
    if (!modalType.active) {
      fetchVats().then((result) => {
        if (result.data && result.status == 'success') {
          console.log(result.data);
          const { resultCode, body, resultMessage } = result.data.data;
          if (resultCode === 200) {
            /** 부가세 정보 refetch 성공 시 입출금 정보 refetch*/
            fetchVatInouts().then((result) => {
              if (result.data && result.status == 'success') {
                console.log(result.data);
                const { resultCode, body, resultMessage } = result.data.data;
                if (resultCode === 200) {
                  setVatInoutList(body);
                } else {
                  toastError(resultMessage);
                }
              }
            });
          } else {
            toastError(resultMessage);
          }
        }
      });
    }
    console.log(!modalType.active);
  }, [modalType.active]);

  // 서브그리드 footer
  useEffect(() => {
    /** vatInout 정보 변경 시 전역적으로 실행하고자 하는 동작은 본 영역 내에 작성 */
    const { vatCashAmtTotal, vatAccountAmtTotal, vatDcTotal, vatNowAmtTotal } = vatInoutList.reduce(
      (
        acc: {
          vatCashAmtTotal: number;
          vatAccountAmtTotal: number;
          vatDcTotal: number;
          vatNowAmtTotal: number;
        },
        data: VatResponsePaging,
      ) => {
        //console.log('data==>', data);
        return {
          vatCashAmtTotal: acc.vatCashAmtTotal + (data.vatCashAmt ? data.vatCashAmt : 0),
          vatAccountAmtTotal: acc.vatAccountAmtTotal + (data.vatAccountAmt ? data.vatAccountAmt : 0),
          vatDcTotal: acc.vatDcTotal + (data.vatDcAmt ? data.vatDcAmt : 0),
          vatNowAmtTotal: acc.vatNowAmtTotal + (data.vatNowAmt ? data.vatNowAmt : 0),
        };
      },
      {
        vatCashAmtTotal: 0,
        vatAccountAmtTotal: 0,
        vatDcTotal: 0,
        vatNowAmtTotal: 0,
      }, // 초기값 설정
    );

    setPinnedBottomInoutRowData([
      {
        vatCashAmt: vatCashAmtTotal,
        vatAccountAmt: vatAccountAmtTotal,
        vatDcAmt: vatDcTotal,
        vatTotAmt: vatNowAmtTotal,
      },
    ]);
  }, [vatInoutList]);

  useEffect(() => {
    // 필터 값 변경시 혹은 본 경로로 이동할떄 마다 refetch
    fetchVats();
  }, [filters.startDate, router.pathname]);

  const onSearch = async () => {
    setPaging({
      ...paging,
      curPage: 1,
    });
    await fetchVats();
  };

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      flex: 1,
      minWidth: 150,
    };
  }, []);
  const autoGroupColumnDef = useMemo<ColDef>(() => {
    return {
      minWidth: 300,
    };
  }, []);

  const onCellKeyDownAtMainGrid = (event: CellKeyDownEvent | FullWidthCellKeyDownEvent) => {
    //console.log(event.data.id);
  };

  /** 메인그리드 클릭 함수 */
  const onCellClickedAtMainGrid = (event: CellClickedEvent) => {
    if (event.data.id && inoutFilters.vatId != event.data.id) {
      onChangeInoutFilters('vatId', event.data.id);
    }
  };
  // 서브그리드 데이터 있을시
  useEffect(() => {
    fetchVatDetail();
  }, [vatInoutList]);

  const onCellEditingStoppedAtSubGrid = (event: CellEditingStoppedEvent) => {
    const eventRowIndex = event.rowIndex as number;
    if (event.data.id == undefined) {
      /** 추가 */
      const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/; // YYYY-MM-DD 형식 여부 확인
      const regexAsNative = /^\d{4}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/; // 연월일 값이 하이픈(-) 없이 입력되었는지 검사
      const inoutList = JSON.parse(JSON.stringify(vatInoutList));
      switch (event.column.getColId()) {
        case 'workYmd': {
          if (regex.test(event.newValue) || regexAsNative.test(event.newValue)) {
            inoutList[eventRowIndex] = {
              ...inoutList[eventRowIndex],
              workYmd: regex.test(event.newValue) ? event.newValue : event.newValue.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
            };
          } else {
            toastError('유효한 날짜 형식[' + event.newValue + '](4자리 연도 월 일) 입력 후 다시 시도하십시요.');
          }
          break;
        }
        case 'vatCashAmt': {
          if (!isNaN(Number(event.newValue))) {
            inoutList[eventRowIndex] = {
              ...inoutList[eventRowIndex],
              vatCashAmt: Number(event.newValue),
              vatTotAmt: Number(event.newValue) + (inoutList[eventRowIndex].vatAccountAmt || 0) - (inoutList[eventRowIndex].vatDcAmt || 0),
            };
          } else {
            toastError('숫자 이외의 값을 넣을 수 없습니다.');
          }
          break;
        }
        case 'vatAccountAmt': {
          if (!isNaN(Number(event.newValue))) {
            inoutList[eventRowIndex] = {
              ...inoutList[eventRowIndex],
              vatAccountAmt: Number(event.newValue),
              vatTotAmt: Number(event.newValue) + (inoutList[eventRowIndex].vatCashAmt || 0) - (inoutList[eventRowIndex].vatDcAmt || 0),
            };
          } else {
            toastError('숫자 이외의 값을 넣을 수 없습니다.');
          }
          break;
        }
        case 'vatDcAmt': {
          if (!isNaN(Number(event.newValue))) {
            inoutList[eventRowIndex] = {
              ...inoutList[eventRowIndex],
              vatDcAmt: Number(event.newValue),
              vatTotAmt: (inoutList[eventRowIndex].vatCashAmt || 0) + (inoutList[eventRowIndex].vatAccountAmt || 0) - Number(event.newValue),
            };
          } else {
            toastError('숫자 이외의 값을 넣을 수 없습니다.');
          }
          break;
        }
      }
      setVatInoutList(inoutList);
    } else {
      if (event.newValue != event.oldValue) {
        const InoutUpdateData: VatInoutRequestUpdate = { ...(event.data as VatResponseInoutResponse) };
        switch (event.column.getColId()) {
          case 'vatCashAmt': {
            InoutUpdateData.vatCashAmt = { ...(event.data as VatResponseInoutResponse) }.vatCashAmt;
            break;
          }
          case 'vatAccountAmt': {
            InoutUpdateData.vatAccountAmt = { ...(event.data as VatResponseInoutResponse) }.vatAccountAmt;
            break;
          }
          case 'vatDcAmt': {
            InoutUpdateData.vatDcAmt = { ...(event.data as VatResponseInoutResponse) }.vatDcAmt;
            break;
          }
          default:
            return;
        }
        console.log(InoutUpdateData);
        updateVatInout(InoutUpdateData)
          .then((result) => {
            if (result.data) {
              const { resultCode, resultMessage } = result.data;
              if (resultCode === 200) {
                subGridRef.current?.api.clearFocusedCell();
                toastSuccess('수정되었습니다.');
              } else {
                toastError(resultMessage);
              }
            }
          })
          .then(() => {
            fetchVatInouts().then((result) => {
              if (result.data && result.status == 'success') {
                const { resultCode, body, resultMessage } = result.data.data;
                if (resultCode === 200) {
                  setVatInoutList(body);
                } else {
                  toastError(resultMessage);
                }
              }
            });
            fetchVats().then((result) => {
              if (result.data && result.status == 'success') {
                const { resultCode, body, resultMessage } = result.data.data;
                if (resultCode === 200) {
                  setVatResponsePaging(body);
                } else {
                  toastError(resultMessage);
                }
              }
            });
          });
      }
    }
  };

  const onCellKeyDownAtSubGrid = (event: CellKeyDownEvent | FullWidthCellKeyDownEvent) => {
    const keyBoardEvent = event.event as KeyboardEvent;
    const eventRowIndex = event.rowIndex as number;
    const editingCells = subGridRef.current?.api.getEditingCells() || [];
    if (event.data.id == undefined) {
      /** 추가 후 저장되지 않은 행 */
      if ((keyBoardEvent.key == 'Backspace' || keyBoardEvent.key == 'Delete') && editingCells.length == 0) {
        setVatInoutList(vatInoutList.filter((_, i) => i !== eventRowIndex));
      }
    } else {
      /** 백앤드 응답으로 인하여 생성된 행 */
    }
  };

  /** 프린트관련 */
  // 프린트 버튼
  const [isPrinting, setIsPrinting] = useState(false);
  const handlePrintClick = async () => {
    if (!isPreView) {
      // 미리보기 off되어있으면 실행X
      return;
    }
    setIsPrinting(true);
  };

  /** VAT 전표 (미리보기) */
  const fetchVatDetail = async () => {
    const gridApi = mainGridRef.current?.api;
    const focusedCell = gridApi?.getFocusedCell();
    const gridRowData = vats?.data?.body?.rows;
    if (focusedCell && focusedCell.rowIndex !== undefined && gridRowData) {
      if (gridRowData[focusedCell.rowIndex] && gridRowData[focusedCell.rowIndex].id) {
        const response = await getVatDetail(gridRowData[focusedCell.rowIndex].id);
        if (response.data.body) {
          setSelectedDetail((prev: any) => [
            {
              ...response.data.body, // fetchVatDetail 데이터
              sub: prev?.sub || {}, // 이전에 저장된 sub 데이터
            },
          ]);
        }
      }
    }
  };
  /** 서브그리드 클릭 함수 */
  const onCellClickedAtSubGrid = (event: CellClickedEvent) => {
    if (isPreView) {
      if (event.data.id && inoutFilters.vatId != event.data.id) {
        setSelectedDetail((prev: any) => [
          {
            ...prev?.[0], // fetchVatDetail에서 설정한 VAT 데이터 유지
            sub: event.data, // 새로운 sub 데이터 설정
          },
        ]);
      }
    }
  };

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

  useEffect(() => {
    if (filters.sellerId != 0) {
      fetchVats();
    }
  }, [filters.sellerId, filters.startDate, filters.endDate, fetchVats]);

  useEffect(() => {
    setGridKey((prev) => prev + 1);
  }, [pinnedBottomRowData]);

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} search={fetchVats} filters={filters} reset={reset} />
      <Search className="type_2">
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
          ref={datePickerRef}
        />
        <Search.RetailBar
          title={'소매처'}
          name={'retailNm'}
          placeholder={'소매처 검색'}
          allowNewRetail={false}
          selectedRetail={selectedRetail} // 경로변수로 소매처 id 가 주어질 시 소매처 전역 상태를 참조함
          onRetailSelected={(retailInfo) => {
            /** 본 영역에서만 소매처 상태 및 sellerId 필터 값이 변경됨 */
            setSelectedRetail(retailInfo);
            setRetail(retailInfo); // 스토에 정보에 저장
            if (retailInfo?.id) {
              onChangeFilters('sellerId', retailInfo.id);
              onChangeFilters('sellerNm', retailInfo.sellerNm || '');
            }
          }}
        />
        <Search.Input
          title={'검색'}
          name={'searchKeyword'}
          placeholder={'자료 검색'}
          value={filters.searchKeyword}
          onChange={onChangeFilters}
          onEnter={() => fetchVats()}
          filters={filters}
        />
      </Search>

      <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={fetchVats} isPaging={false}>
          <CustomShortcutButton
            className={`btn ${isPreView ? 'on' : ''}`}
            title="미리보기"
            onClick={() => setIsPreView(!isPreView)}
            shortcut={COMMON_SHORTCUTS.alt1}
          >
            미리보기
          </CustomShortcutButton>
          <CustomShortcutButton className="btn icoPrint" title="프린트" onClick={handlePrintClick} shortcut={COMMON_SHORTCUTS.print}>
            프린트
          </CustomShortcutButton>
        </TableHeader>
        <div className="layoutPrivewBox">
          <div className="layoutBox">
            <div className="layout70">
              <div className="gridBox">
                <div className="tblPreview">
                  <TunedGrid
                    ref={mainGridRef}
                    key={gridKey} // 👈 key 추가
                    onGridReady={onGridReady}
                    rowData={vatPagingResponse}
                    defaultColDef={defaultColDef}
                    autoGroupColumnDef={autoGroupColumnDef}
                    columnDefs={columnDefs}
                    paginationPageSize={paging.pageRowCount}
                    onCellKeyDown={onCellKeyDownAtMainGrid}
                    onCellClicked={onCellClickedAtMainGrid}
                    loadingOverlayComponent={CustomGridLoading}
                    noRowsOverlayComponent={CustomNoRowsOverlay}
                    onCellEditingStopped={undefined}
                    rowSelection={'single'}
                    getRowClass={getRowClass}
                    pinnedBottomRowData={pinnedBottomRowData} // 하단에 고정된 합계 행
                    suppressRowClickSelection={false}
                    className={'default noCheck'}
                  />
                  <div className="btnArea">
                    <CustomShortcutButton
                      className="btn"
                      title="내역등록"
                      shortcut={COMMON_SHORTCUTS.gridUnder1}
                      onClick={() => {
                        openModal('ADD');
                      }}
                    >
                      내역등록
                    </CustomShortcutButton>
                    <CustomShortcutButton
                      className="btn"
                      title="수정하기"
                      shortcut={COMMON_SHORTCUTS.gridUnder2}
                      onClick={() => {
                        const targetVatNodes = mainGridRef.current?.api.getSelectedNodes() || [];
                        if (targetVatNodes.length == 0) {
                          toastError('변경하고자 하는 행을 하나 선택하십시요');
                        } else if (targetVatNodes.length > 1) {
                          toastError('단일 행 수정만 가능합니다');
                        } else {
                          if (targetVatNodes[0].data && targetVatNodes[0].data.id) {
                            console.log(targetVatNodes[0].data);
                            setVatResponsePagingInfo(targetVatNodes[0].data);
                            openModal('MOD');
                          }
                        }
                      }}
                    >
                      수정하기
                    </CustomShortcutButton>
                    <CustomShortcutButton
                      className="btn"
                      title="삭제하기"
                      shortcut={COMMON_SHORTCUTS.gridUnder3}
                      onClick={() => {
                        const targetVatNodes = mainGridRef.current?.api.getSelectedNodes() || [];
                        if (targetVatNodes.length == 0) {
                          toastError('삭제하고자 하는 행을 하나 선택하십시요');
                        } else if (targetVatNodes.length > 1) {
                          toastError('단일 행 삭제만 가능합니다');
                        } else {
                          if (targetVatNodes[0].data && targetVatNodes[0].data.id) {
                            console.log(targetVatNodes[0].data);
                            setVatResponsePagingInfo(targetVatNodes[0].data);
                            openModal('DELETE');
                          }
                        }
                      }}
                    >
                      삭제하기
                    </CustomShortcutButton>
                    <CustomShortcutButton
                      className="btn"
                      title="입금처리"
                      shortcut={COMMON_SHORTCUTS.gridUnder4}
                      onClick={() => {
                        const targetVatNodes = mainGridRef.current?.api.getSelectedNodes() || [];
                        if (targetVatNodes.length == 0) {
                          toastError('입금내역을 추가하고자 하는 거래를 하나 선택하십시요');
                        } else if (targetVatNodes.length > 1) {
                          toastError('단일 거래 수정만 가능합니다');
                        } else {
                          if (targetVatNodes[0].data.id) {
                            setVatResponsePagingInfo(targetVatNodes[0].data);
                            openModal('INOUT_ADD');
                          } else {
                            toastError('선택된 행의 데이터가 유효하지 않음');
                          }
                        }
                      }}
                    >
                      입금처리
                    </CustomShortcutButton>
                  </div>
                </div>
              </div>
            </div>
            <div className="layout30">
              <div className="gridBox">
                <div className="tblPreview">
                  <TunedGrid
                    ref={subGridRef}
                    onGridReady={onGridReady}
                    rowData={vatInoutList}
                    defaultColDef={defaultColDef}
                    autoGroupColumnDef={autoGroupColumnDef}
                    onCellEditingStopped={onCellEditingStoppedAtSubGrid}
                    columnDefs={inoutColDefs}
                    paginationPageSize={paging.pageRowCount}
                    onCellKeyDown={onCellKeyDownAtSubGrid}
                    loadingOverlayComponent={CustomGridLoading}
                    noRowsOverlayComponent={CustomNoRowsOverlay}
                    onCellClicked={onCellClickedAtSubGrid}
                    getRowClass={getRowClassSub}
                    rowSelection={'single'}
                    pinnedBottomRowData={pinnedBottomInoutRowData} // 하단에 고정된 합계 행
                    suppressRowClickSelection={false}
                    singleClickEdit={true}
                    className={'default noCheck'}
                  />
                  <div className="btnArea">
                    <CustomShortcutButton
                      className="btn btnBlue"
                      shortcut={COMMON_SHORTCUTS.gridUnder2_1}
                      onClick={() => {
                        const focusedCell = mainGridRef.current?.api.getFocusedCell();
                        if (focusedCell) {
                          const rowCount = vatInoutList.length;
                          setVatInoutList([...vatInoutList, {}]);
                          setTimeout(() => {
                            if (rowCount && rowCount > 0) {
                              subGridRef.current?.api.setFocusedCell(rowCount, 'workYmd');
                            }
                          }, 10);
                        } else {
                          toastError('메인그리드의 결제건을 선택해야 추가 가능합니다.');
                        }
                      }}
                    >
                      추가
                    </CustomShortcutButton>
                    <CustomShortcutButton
                      className="btn"
                      shortcut={COMMON_SHORTCUTS.gridUnder2_2}
                      onClick={() => {
                        const subGridApi = subGridRef.current?.api;
                        if (subGridApi && subGridApi.getSelectedNodes()?.length === 1) {
                          if (subGridApi.getSelectedNodes()[0].data && subGridApi.getSelectedNodes()[0].data.id > 0) {
                            openModal('INOUT_DEL');
                          } else {
                            if (subGridApi.getSelectedNodes()[0].id) {
                              const targetId = subGridApi.getSelectedNodes()[0].rowIndex;
                              setVatInoutList(vatInoutList.filter((_, i) => i !== targetId));
                            }
                          }
                        } else {
                          toastError('SUB 그리드의 결제건 1건을 선택해야 삭제 가능합니다.');
                        }
                      }}
                    >
                      삭제
                    </CustomShortcutButton>
                    <CustomShortcutButton
                      className="btn btnBlue"
                      shortcut={COMMON_SHORTCUTS.gridUnder2_3}
                      onClick={() => {
                        subGridRef.current?.api.stopEditing(false);
                        const notBeingStoredData: VatInoutRequestCreate[] = [];
                        for (let i = 0; i < vatInoutList.length; i++) {
                          if (vatInoutList[i].id == undefined) {
                            /** 새로 추가되는 입출금 */
                            //console.log(i, vatInoutList[i].vatCashAmt, notBeingStoredData.length);
                            if (vatInoutList[i].workYmd != undefined) {
                              if (vatInoutList[i].vatCashAmt || vatInoutList[i].vatAccountAmt || vatInoutList[i].vatDcAmt) {
                                notBeingStoredData[notBeingStoredData.length] = {
                                  ...vatInoutList[i],
                                  vatCashAmt: vatInoutList[i].vatCashAmt ? vatInoutList[i].vatCashAmt : 0,
                                  vatAccountAmt: vatInoutList[i].vatAccountAmt ? vatInoutList[i].vatAccountAmt : 0,
                                  vatDcAmt: vatInoutList[i].vatDcAmt ? vatInoutList[i].vatDcAmt : 0,
                                  vatTotAmt: undefined,
                                  vatId: inoutFilters.vatId,
                                };
                              } else {
                                toastError('입출금 내역 추가 시 현금, 통장, 할인 금액 중 하나도 존재하지 않는 경우 저장할 수 없습니다.');
                                return;
                              }
                            } else {
                              toastError('영업일자가 특정되지 않은 경우 저장할 수 없습니다.');
                              return;
                            }
                          }
                        }
                        if (notBeingStoredData.length != 0) {
                          /** 입출금 추가 존재하는 경우 */
                          insertVatInouts(notBeingStoredData).then((result) => {
                            const { resultCode, body, resultMessage } = result.data;
                            if (resultCode == 200) {
                              toastSuccess('저장되었습니다.');
                              fetchVatInouts().then((result) => {
                                if (result.data && result.status == 'success') {
                                  const { resultCode, body, resultMessage } = result.data.data;
                                  if (resultCode === 200) {
                                    setVatInoutList(body);
                                    fetchVats().then((r) => console.log('fetchVats 완료'));
                                  } else {
                                    toastError(resultMessage);
                                  }
                                }
                              });
                            } else {
                              toastError(resultMessage);
                            }
                          });
                        }
                      }}
                    >
                      저장
                    </CustomShortcutButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="previewBox" ref={previewRef}>
            {selectedDetail ? (
              <PrintLayout
                selectedDetail={selectedDetail}
                isPrinting={isPrinting}
                setIsPrinting={setIsPrinting}
                type={vatInoutList.length !== 0 ? 'vatDeposit' : 'vatBilling'}
              />
            ) : (
              <div className="noRowsOverlayBox">주문을 선택하면 상세 정보가 표시됩니다.</div>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        title={
          '<div class="confirmMsg"><span class="small">발행된 부가세전표를</span><span class="big"><strong>삭제</strong>&nbsp;처리하시겠어요?</span><span class="notice">삭제시 입금거래 내역도 함께 삭제됩니다</span></div>'
        }
        open={modalType.type === 'INOUT_DEL' && modalType.active}
        onConfirm={() => {
          /** 서브그리드에 JSON 직렬화 역직렬화 사용할 시 selected 가 풀릴 가능성 */
          if (subGridRef.current && subGridRef.current.api.getSelectedNodes()[0].data.id) {
            deleteVatInout({
              id: subGridRef.current.api.getSelectedNodes()[0].data.id,
            }).then((result) => {
              const { resultCode, body, resultMessage } = result.data;
              if (resultCode == 200) {
                toastSuccess('삭제되었습니다.');
                const inoutList = [...vatInoutList];
                inoutList.splice((subGridRef.current as AgGridReact).api.getSelectedNodes()[0].rowIndex as number, 1);
                setVatInoutList(inoutList);
              } else {
                toastError(resultMessage);
              }
            });
          }
        }}
        onClose={() => {
          closeModal('INOUT_DEL');
        }}
      />
      <ConfirmModal
        title={'해당 결제거래를 삭제하시겠습니까?'}
        open={modalType.type === 'DELETE' && modalType.active}
        onConfirm={() => {
          /** 서브그리드에 JSON 직렬화 역직렬화 사용할 시 selected 가 풀릴 가능성 */
          if (mainGridRef.current && mainGridRef.current.api.getSelectedNodes()[0].data.id) {
            deleteVat({
              id: mainGridRef.current.api.getSelectedNodes()[0].data.id,
            }).then((result) => {
              const { resultCode, body, resultMessage } = result.data;
              if (resultCode == 200) {
                toastSuccess('삭제되었습니다.');
                fetchVats();
              } else {
                toastError(resultMessage);
              }
            });
          }
        }}
        onClose={() => {
          closeModal('DELETE');
        }}
      />
      {modalType.type === 'ADD' && modalType.active && <VatAddPop />}
      {modalType.type === 'MOD' && modalType.active && <VatModPop />}
      {modalType.type === 'INOUT_ADD' && modalType.active && <VatInoutAddPop />}
    </div>
  );
};

export default Vat;
