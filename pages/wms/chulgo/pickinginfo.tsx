import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { DropDown, Search, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import { ColDef, CellValueChangedEvent, SelectionChangedEvent, RowClassParams } from 'ag-grid-community';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import useFilters from '../../../hooks/useFilters';
import { useCommonStore } from '../../../stores';
import { AgGridReact } from 'ag-grid-react';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import PrintLayout from '../../../components/print/PrintLayout';
import {
  CodeResponseLowerSelect,
  PickinginfoRequestFilter,
  PickinginfoResponseDelivery,
  PickinginfoResponseDeliveryInfoSummary,
  PickinginfoResponseJobCompareInven,
} from '../../../generated';
import { Utils } from '../../../libs/utils';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { authApi } from '../../../libs';
import { autoPickingJob, fetchJobDetail, fetchLowerCodes, fetchPickingJobForPrint, partialPickingJob, releaseHoldJob, saveHoldJob } from '../../../api/wms-api';
import Loading from '../../../components/Loading';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import TunedGrid from '../../../components/grid/TunedGrid';
import { Progress } from 'antd';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';
import { JobType } from '../../../libs/const';
import { ReactSelectorInterface, TunedReactSelector } from '../../../components/TunedReactSelector';

/**
 * 출고정보 페이지
 * wms/chulgo/pickinginfo
 */

const Pickinginfo = () => {
  const onGridReady = (params: any) => {
    console.log('Grid API 설정됨', params.api);
    setGridApi(params.api);
  };
  const session = useSession();
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;
  const { upMenuNm, menuNm, partnerOptions, fetchPartnerOptions } = useCommonStore();
  const [gridApi, setGridApi] = useState<any>(null);
  const today = dayjs(new Date()).add(6, 'hour').format('YYYY-MM-DD'); // 6시간 더하기

  // grid, 선택 데이타 상태
  const [topGridData, setTopGridData] = useState<PickinginfoResponseDelivery[]>([]);
  const [summaryData, setSummaryData] = useState<PickinginfoResponseDeliveryInfoSummary>();
  const [rightGridData, setRightGridData] = useState<PickinginfoResponseJobCompareInven[]>([]);
  const [selectedRows, setSelectedRows] = useState<PickinginfoResponseDelivery[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number>();
  const [isDelivery, setIsDelivary] = useState<boolean>(false);
  const [previewType, setPreviewType] = useState<string>();
  const [printJobDetails, setPrintJobDetails] = useState<any>([]);

  // 미리보기, 하단그리드보기 상태
  const [isPreView, setIsPreView] = useState<boolean>(false);
  const [isShowRightSideGrid, setIsShowRightSideGrid] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<PickinginfoResponseDelivery[]>([]); // 합계데이터 만들기
  const [pinnedBottomRowDataRight, setPinnedBottomRowDataRight] = useState<any>([]); // 세부합계데이터 만들기

  const topGridRef = useRef<AgGridReact>(null);
  const bottomGridRef = useRef<AgGridReact>(null);
  const reactSelectRef = useRef<ReactSelectorInterface>(null);
  // 필터 상태
  const [filters, onChangeFilters, onFiltersReset] = useFilters<PickinginfoRequestFilter>({
    logisId: workLogisId, // 물류 계정 창고검색필터
    startDate: Utils.getStartDayBeforeMonth(1), // 한달전
    endDate: today, // 오늘날짜
    skuNm: '', //소매명
    jobStatCd: '', //작업상태
    partnerId: 0, //화주id
    processable: '', //작업가능여부 필터
  });

  useEffect(() => {
    fetchPartnerOptions(workLogisId, undefined);
  }, []);

  /**
   *  API
   */
  // 출고정보 목록 조회
  const {
    data: pickingInfos,
    isLoading: ispickingInfosLoading,
    isSuccess: ispickingInfosSuccess,
    refetch: refetchPickingInfos,
  } = useQuery(['/wms/pickinginfo/topGrid', filters.logisId, filters.startDate, filters.endDate], (): any =>
    authApi.get('/wms/pickinginfo/topGrid', {
      params: {
        ...filters,
      },
    }),
  );

  useEffect(() => {
    if (ispickingInfosSuccess) {
      const { resultCode, body, resultMessage } = pickingInfos.data;
      if (resultCode === 200) {
        console.log('데이터 확인:', body);
        setTopGridData(body.deliveryResultList || []);
        setSummaryData(body.deliveryInfoSummary);

        if (body.deliveryResultList.length > 0) {
          const { prodCnt, skuCnt, tranCnt } = body.deliveryResultList.reduce(
            (
              acc: {
                prodCnt: number;
                skuCnt: number;
                tranCnt: number;
              },
              data: PickinginfoResponseDelivery,
            ) => {
              return {
                prodCnt: acc.prodCnt + (data.prodCnt ? data.prodCnt : 0),
                skuCnt: acc.skuCnt + (data.skuCnt ? data.skuCnt : 0),
                tranCnt: acc.tranCnt + (data.tranCnt ? data.tranCnt : 0),
              };
            },
            {
              prodCnt: 0,
              skuCnt: 0,
              tranCnt: 0,
            }, // 초기값 설정
          );

          setPinnedBottomRowData([
            {
              prodCnt: prodCnt,
              skuCnt: skuCnt,
              tranCnt: tranCnt,
            },
          ]);
        }
      } else {
        toastError(resultMessage || '출고 목록 조회 정보가 없습니다.');
      }
    }
  }, [pickingInfos, ispickingInfosSuccess]);

  // 미리보기 데이터 (출고정보 상세) 조회
  const { data: jobDetailData, isSuccess: isFetchJobDetailSuccess } = useQuery(['fetchJobDetail', selectedJobId], () => fetchJobDetail(selectedJobId), {
    enabled: !!selectedJobId,
  });
  useEffect(() => {
    if (isFetchJobDetailSuccess && jobDetailData) {
      const { resultCode, body, resultMessage } = jobDetailData.data;
      if (resultCode === 200) {
        //console.log('[API] 미리보기 데이타 ==>', body);
        //setSelectedJobDetail(body);
        setRightGridData(body);
        setSummaryData(body);

        console.log('body ==>', body);

        switch (body[0].jobType) {
          case JobType.misong:
            setPreviewType('shipped');
            break;
          case JobType.majang:
            setPreviewType('majang');
            break;
          case JobType.sample:
            setPreviewType('sample');
            break;
          case JobType.order:
            setPreviewType('order');
            break;
          default:
            setPreviewType('default');
            break;
        }

        const { orderCnt, inventoryCnt, shortageCnt, partnerInventoryCnt } = body.reduce(
          (
            acc: {
              orderCnt: number;
              inventoryCnt: number;
              shortageCnt: number;
              partnerInventoryCnt: number;
            },
            data: any,
          ) => {
            return {
              orderCnt: acc.orderCnt + (data.orderCnt ? data.orderCnt : 0),
              inventoryCnt: acc.inventoryCnt + (data.inventoryCnt ? data.inventoryCnt : 0),
              shortageCnt: acc.shortageCnt + (data.shortageCnt ? data.shortageCnt : 0),
              partnerInventoryCnt: acc.partnerInventoryCnt + (data.partnerInventoryCnt ? data.partnerInventoryCnt : 0),
            };
          },
          {
            orderCnt: 0,
            inventoryCnt: 0,
            shortageCnt: 0,
            partnerInventoryCnt: 0,
          }, // 초기값 설정
        );

        setPinnedBottomRowDataRight([
          {
            orderCnt: orderCnt,
            inventoryCnt: inventoryCnt,
            shortageCnt: shortageCnt,
            partnerInventoryCnt: partnerInventoryCnt,
          },
        ]);
      } else {
        toastError(resultMessage || '출고 목록 조회 정보가 없습니다.');
      }
    }
  }, [jobDetailData, isFetchJobDetailSuccess]);

  // 프린트 데이터 (출고정보목록) 조회
  const getPickingJobDetailsForPrint = async (jobParams: any) => {
    try {
      const response = await fetchPickingJobForPrint(jobParams);
      if (response) {
        const { resultCode, body, resultMessage } = response.data;
        if (resultCode === 200) {
          //console.log('[API] 프린트 응답 데이터 >>', body);
          return body;
        } else {
          toastError(resultMessage || '해당 작업의 상세 정보를 불러오는 데 실패했습니다.');
          return [];
        }
      }
    } catch (error) {
      toastError('프린트 API 호출 중 에러가 발생했습니다.');
      console.error(error);
      return [];
    }
  };

  // 보류사유옵션 조회
  const [holdCodeOption, setHoldCodeOption] = useState<CodeResponseLowerSelect[]>([]);
  const { data: holdCodes, isSuccess: isFetchHoldCodesSuccess } = useQuery(['fetchHoldCodes'], () => fetchLowerCodes('10350'));
  useEffect(() => {
    if (isFetchHoldCodesSuccess && holdCodes) {
      const { resultCode, body, resultMessage } = holdCodes.data;
      if (resultCode === 200) {
        setHoldCodeOption(body);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchHoldCodesSuccess, holdCodes]);

  // 보류 사유 저장
  const queryClient = useQueryClient();
  const { mutate: saveHoldJobMutate } = useMutation(saveHoldJob, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('보유사유 등록하였습니다.');
        await queryClient.invalidateQueries(['/wms/pickinginfo/topGrid']);
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err): void => {
      toastError('보유사유 등록 중 오류가 발생하였습니다.');
    },
  });

  // 보류 해제
  const { mutate: releaseHoldJobMutate } = useMutation(releaseHoldJob, {
    onSuccess: async (e) => {
      if (e?.data.resultCode === 200) {
        toastSuccess('보유해제 하였습니다.');
        await queryClient.invalidateQueries(['/wms/pickinginfo/topGrid']);
      } else {
        toastError(e?.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error('보유해제 처리 중 오류:', err);
      toastError('보유해제 중 오류가 발생하였습니다.');
    },
  });

  // 출고 처리
  const { mutate: autoPickingJobMutate } = useMutation(autoPickingJob, {
    onSuccess: async (e) => {
      if (e?.data.resultCode === 200) {
        toastSuccess('출고처리 하였습니다.');
        setSelectedRows([]);
        await queryClient.invalidateQueries({ queryKey: ['/wms/pickinginfo/topGrid'] });
      } else {
        toastError(e?.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error('출고 처리 중 오류:', err);
      toastError('출고처리 중 오류가 발생하였습니다.');
    },
  });

  // 부분 출고 처리
  const { mutate: partialPickingJobMutate } = useMutation(partialPickingJob, {
    onSuccess: async (e) => {
      if (e?.data.resultCode === 200) {
        toastSuccess('출고처리 하였습니다.');
        setSelectedRows([]);
        await queryClient.invalidateQueries(['/wms/pickinginfo/topGrid']);
      } else {
        toastError(e?.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error('출고 처리 중 오류:', err);
      toastError('출고처리 중 오류가 발생하였습니다.');
    },
  });

  /**
   *  이벤트 핸들러
   */

  // 자동 출고 처리
  const handleAutoPickingJob = async () => {
    // 선택된 행이 없을 때
    if (selectedRows.length === 0 && topGridRef.current) {
      const gridApi = topGridRef.current.api;

      // 첫 번째 행 선택 및 포커스
      gridApi.forEachNode((node, index) => {
        if (index === 0) {
          node.setSelected(true);
          // 첫 번째 행으로 포커스 이동
          gridApi.setFocusedCell(0, 'no');
        }
      });
      return;
    }
    //선택된 것중 처리가능한 것만 처리
    const processableRows = selectedRows.filter((row) => row.processableNm === '가능' || row.processableNm === '열어서');
    console.log('출고처리목록: ', processableRows.length);

    if (processableRows.length < 1) {
      toastError('선택된 주문 중 처리 가능한(처리상태:요청, 처리가능 인 주문이 없습니다.');
      return;
    } else {
      const jobIds = processableRows.map((row) => row.jobId);
      // console.log('자동출고 작업 ID:', jobIds);
      autoPickingJobMutate(jobIds);
    }
  };

  // 부분 출고 처리
  const handleParticialPickingJob = async () => {
    // 선택된 행이 없을 때
    if (!selectedJobId) {
      toastError('선택된 작업이 없습니다.');
      return;
    } else if (!isDelivery) {
      toastError('부분출고가 불가능 합니다.');
      return;
    }

    const majangCnt = rightGridData.filter((data) => {
      return data.tranStatus == '매장처리';
    }).length;

    if (rightGridData && majangCnt > 0 && rightGridData.length === majangCnt) {
      toastError('빈블러 출고가 없으니 고객사에 매장판매로 전표수정을 요청하세요');
    } else {
      partialPickingJobMutate(selectedJobId);
    }
  };

  // TODO. 프린트 버튼 이벤트처리
  const handlePrintClick = async () => {
    // 선택된 행이 없으면 불가
    if (selectedRows.length === 0) {
      toastError('프린트할 작업을 선택해주세요', { autoClose: 1000 });
      return;
    }
    setIsPrinting(true);
    console.log('프린트버튼');

    // 결과에서 원하는 데이터를 필터링
    // const filteredJobDetails = Object.values(JobType).reduce((acc, jobType) => {
    //   const filteredJobs = resBody?.filter((data: any) => data.jobType === jobType) || [];
    //
    //   // jobType에 해당하는 데이터가 있는 경우만 추가
    //   if (filteredJobs.length > 0) {
    //     acc[jobType] = filteredJobs;
    //   }
    //   return acc;
    // }, {} as Record<string, any[]>); // key는 string 타입, value는 any[] 배열
    //
    // console.log('프린트 데이터 JobType 기준 필터링 데이터 >>', filteredJobDetails);
    //
    // // 필요한 데이터를 특정 형식으로 가공
    // const filteredAllJobDetails = Object.values(filteredJobDetails);
    // console.log('filteredJobDetails :  ', filteredJobDetails);
  };

  /** 영역 외 클릭시 서브그리드 닫힘 */
  const topGridDivRef = useRef<HTMLDivElement>(null);
  const bottomGridDivRef = useRef<HTMLDivElement>(null);

  // 스크롤바 영역 내부인지 확인하는 함수
  const isElementInsideScrollbar = (target: Node): boolean => {
    const targetElement = target instanceof HTMLElement ? target : null;

    // 스크롤바가 있는 경우, 해당 영역을 클릭한 경우는 제외
    return targetElement ? targetElement.scrollHeight > targetElement.clientHeight : false;
  };

  const onSearch = () => {
    // onFiltersReset();
    refetchPickingInfos;
  };

  const reset = () => {
    onChangeFilters('startDate', Utils.getStartDayBeforeMonth(1));
    onChangeFilters('endDate', dayjs().format('YYYY-MM-DD'));
    onChangeFilters('skuNm', '');
    onChangeFilters('jobStatCd', '');
    onChangeFilters('partnerId', 0);
    onChangeFilters('processable', '');
    refetchPickingInfos();
  };

  /**
   * Grid 헨들러
   */

  // 상단그리드 선택된 행 변경
  const onSelectionChanged = async (event: SelectionChangedEvent) => {
    // setIsShowSubGrid(true); // 서브그리드 보여주기
    const selectedNodes = event.api.getSelectedNodes();
    const selectedData = selectedNodes.map((node) => node.data);
    selectPrintData(selectedData);
    setSelectedJobId(selectedData[0]?.jobId); // Trigger : 하단 그리드 및 미리보기 데이터 로드
    setIsDelivary(selectedData[0]?.processableNm == '열어서');
    setSelectedRows(selectedData); //선택된 데이타
  };

  const selectPrintData = async (selectedRows: any) => {
    if (selectedRows.length > 0) {
      // 선택한 작업의 전체를 서버로 보낸 후 서버에서 배열객체를 만들어 내려준다.
      const jobParams: any = selectedRows.map((row: any) => ({
        jobId: row.jobId,
        jobType: row.jobTypeCd,
      }));
      console.log('프린트버튼 이벤트 요청 파라미터 >>', jobParams);
      const resBody = await getPickingJobDetailsForPrint(jobParams);
      console.log('프린트버튼 이벤트 요청 파라미터 >>', resBody);
      const changedList = resBody.map((data: any) => ({
        ...data,
        payType: data.jobType === 'C' ? '매장' : data.payType,
        sellerName: data.jobType === 'C' ? '매장' : data.sellerName,
      }));
      setPrintJobDetails(changedList);
    }
  };

  // 하단그리드 출고수량 변경 입력
  const bottomGridCellValueChanged = (event: CellValueChangedEvent<PickinginfoResponseJobCompareInven>): void => {
    const { node, newValue, oldValue, data } = event;

    // 값이 실제로 변경되지 않은 경우는 제외
    if (oldValue === newValue) {
      return;
    }
    // 초기 값(originalValue)과 비교하여 상태 설정
    const initialOriginalValue = 0;
    // 입력값변경에 따른 체크박스 자동 체크
    if (initialOriginalValue !== newValue) {
      node.setSelected(true);
    } else {
      node.setSelected(false);
    }
  };

  /**
   *  Grid 컬럼
   */
  // 상단 그리드 컬럼
  // HTML을 안전하게 렌더링하는 컴포넌트를 정의
  const SafeHtml: React.FC<{ html: string }> = ({ html }) => <div dangerouslySetInnerHTML={{ __html: html }} />;
  const topGridColumns = useMemo<ColDef<PickinginfoResponseDelivery>[]>(
    () => [
      {
        field: 'no',
        headerName: '#',
        minWidth: 50,
        maxWidth: 50,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'tranYmd',
        headerName: '출고요청일',
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'partnerNm',
        headerName: '고객사',
        minWidth: 120,
        maxWidth: 120,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'jobChitNo',
        headerName: '출고전표',
        minWidth: 70,
        maxWidth: 70,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'jobTypeNm',
        headerName: '유형',
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        filter: true,
      },
      {
        field: 'sellerNm',
        headerName: '소매처',
        minWidth: 160,
        maxWidth: 160,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      /*{
        field: 'compNo',
        headerName: '사업자번호',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },*/
      {
        field: 'prodCnt',
        headerName: '상품#',
        minWidth: 50,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'skuCnt',
        headerName: '스큐#',
        minWidth: 50,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'tranCnt',
        headerName: '수량',
        minWidth: 50,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'processableNm',
        headerName: '처리가능',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        filter: true,
        cellRenderer: (params: any) => {
          // boolean 값을 직접 처리
          if (params.node?.rowPinned != 'bottom') {
            const value = params.data.processableNm;
            const color = value == '가능' ? '#1890ff' : value == '열어서' ? '#0e655a' : value == '입고시' ? '#38dd09' : '#ff4d4f';
            return <SafeHtml html={`<span style="color: ${color};">${value}</span>`} />;
          }
        },
      },
      {
        field: 'boryuStatNm',
        headerName: '보류상태',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        filter: true,
      },
      {
        field: 'reason',
        headerName: '사유',
        minWidth: 150,
        maxWidth: 150,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        hide: true,
      },
      {
        field: 'jobEtc',
        headerName: '보류 사유',
        minWidth: 140,
        maxWidth: 140,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        editable: true,
        hide: true,
        cellEditorSelector: (params) => {
          // "직접입력"이 선택되면 agTextCellEditor를 사용한다.
          if (params.data.jobEtc === '직접입력') {
            return {
              component: 'agTextCellEditor',
            };
          }

          // 디폴트로 agRichSelectCellEditor를 사용한다.
          return {
            component: 'agRichSelectCellEditor',
            params: {
              // values: holdCodeOption?.map((item) => item.codeNm),
              values: () => {
                if (holdCodeOption) {
                  const codeNmArr = holdCodeOption?.map((item) => item.codeNm);
                  return [...codeNmArr, '직접입력'];
                }
              },
              allowTyping: false,
              filterList: true,
              highlightMatch: true,
            },
          };
        },
        onCellValueChanged: (event: any) => {
          // 편집된 값을 활용한 추가 처리 로직
          if (event.newValue !== '직접입력' && event.data) {
            const params = {
              jobId: event.data.jobId,
              holdReason: event.data.jobEtc,
            };
            console.log('보류사유 파라미터 :', params);

            saveHoldJobMutate(params);
          }
        },
      },
      {
        headerName: '보류해제',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        hide: true,
        cellRenderer: (params: any) => {
          if (params.data.jobStatCd === '9') {
            //보류상태일때 해제버튼 렌더
            return (
              <button
                onClick={() => releaseHoldJobMutate(params.data.jobId)}
                className="btn"
                style={{ height: '100%', fontSize: '12px', width: '100%', fontWeight: '300', margin: '0 auto 10px' }}
              >
                해제
              </button>
            );
          }
        },
      },
    ],
    [holdCodeOption],
  );

  // 우측 그리드 컬럼
  const RightGridColumns = useMemo<ColDef[]>(
    () => [
      { field: 'skuNm', headerName: '상품명', minWidth: 170, maxWidth: 170, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.LEFT },
      {
        field: 'orderCnt',
        headerName: '출고지시',
        minWidth: 60,
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'inventoryCnt',
        headerName: '빈블러',
        minWidth: 60,
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'shortageCnt',
        headerName: '부족수량',
        minWidth: 60,
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: (params) => {
          return {
            ...GridSetting.CellStyle.CENTER,
            color: params.value > 0 ? 'red' : 'black', // Set color based on value
          };
        },
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'partnerInventoryCnt',
        headerName: '매장',
        minWidth: 60,
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'asnCnt',
        headerName: 'ASN',
        minWidth: 60,
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'tranStatus',
        headerName: '처리구분',
        minWidth: 70,
        maxWidth: 70,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'particalTranStatus',
        headerName: '부분처리',
        minWidth: 70,
        maxWidth: 70,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
    ],
    [],
  );

  /**
   * 배경행 no숫자별 색상 정렬 홀수일때만 ag-grid-changeOrder적용
   */
  const addClass = (currentClass: string, newClass: string) => (currentClass ? `${currentClass} ${newClass}` : newClass);
  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    // params와 params.data가 존재하는지 체크
    if (params?.data?.no) {
      const rowNumber = parseInt(params.data.no);
      if (!isNaN(rowNumber) && rowNumber % 2 === 1) {
        rtnValue = addClass(rtnValue, 'ag-grid-changeOrder');
      }
    }
    return rtnValue;
  }, []);

  useEffect(() => {
    refetchPickingInfos().then((r) => console.log('success=>', r.data));
  }, [filters.partnerId, filters.skuNm, filters.jobType]);

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={onSearch} />

      <Search className="type_2">
        <TunedReactSelector
          title={'고객사'}
          name={'partnerId'}
          onChange={(option) => {
            if (option.value) {
              onChangeFilters('partnerId', option.value.toString());
              setTimeout(() => {
                refetchPickingInfos();
              }, 10);
            }
          }}
          options={partnerOptions}
          placeholder="고객사 선택"
          ref={reactSelectRef}
        />
        {/* <DropDown  // 예솔 컬럼필터로 대체함
          title={'출고유형'}
          excludeCode={'C'} // 매장분 제외
          name={'jobType'}
          codeUpper={'10180'}
          value={filters.jobType}
          onChange={(name, value) => {
            value === '선택' ? onChangeFilters('jobType', '') : onChangeFilters(name, value);
          }}
        />*/}
        <CustomNewDatePicker
          type={'range'}
          title={'기간'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate || dayjs().format('YYYY-MM-DD'), filters.endDate || dayjs().format('YYYY-MM-DD')]}
          onChange={onChangeFilters}
          filters={filters}
          defaultType={'type'}
        />
        <Search.Input title={'상품'} name={'skuNm'} placeholder={'상품명 입력'} value={filters.skuNm} onChange={onChangeFilters} filters={filters} />
      </Search>

      <div className="tableDashboard">
        <div className="itemBox instock">
          <dl>
            <dt>
              <strong>출고업무</strong>
            </dt>
            <dd>
              <ul>
                <li>
                  <strong>전표</strong>
                  <span>{Utils.setComma(summaryData?.totCount || 0)}건</span>
                </li>
                <li>
                  <strong>출고량</strong>
                  <span>{Utils.setComma(summaryData?.totSkuCount || 0)}장</span>
                </li>
              </ul>
            </dd>
          </dl>
          <dl>
            <dt>
              <strong>진행율</strong>
              <Progress percent={Number(summaryData?.progressRatio)} percentPosition={{ align: 'center', type: 'inner' }} />
            </dt>
            <dd>
              <ul>
                <li>
                  <strong>전표</strong>
                  <span>{Utils.setComma(summaryData?.compCount || 0)}장</span>
                </li>
                <li>
                  <strong>출고량</strong>
                  <span>{Utils.setComma(summaryData?.readySkuCount || 0)}장</span>
                </li>
              </ul>
            </dd>
          </dl>
          <dl>
            <dt>
              <strong>입하진행</strong>
              <Progress percent={Number(summaryData?.stockRatio)} percentPosition={{ align: 'center', type: 'inner' }} />
            </dt>
            <dd>
              <ul>
                <li>
                  <strong>완료</strong>
                  <span>{Utils.setComma(summaryData?.compStockCount || 0)}장</span>
                </li>
                <li>
                  <strong>예정</strong>
                  <span>{Utils.setComma(summaryData?.estStockCount || 0)}장</span>
                </li>
              </ul>
            </dd>
          </dl>
        </div>
      </div>

      <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
        {/* 테이블 헤더 - 총 건수 및 페이징 정보 표시 */}
        <TableHeader count={topGridData.length} search={onSearch}>
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

        <div className="gridBox">
          <div className="tblPreview">
            <div className="layoutBox pickinginfo">
              <div className={isShowRightSideGrid ? 'layout60' : 'layout100'}>
                <div className="InfoGrid" ref={topGridDivRef}>
                  {ispickingInfosLoading ? (
                    <Loading />
                  ) : (
                    <TunedGrid
                      ref={topGridRef}
                      rowData={topGridData}
                      columnDefs={topGridColumns}
                      defaultColDef={defaultColDef}
                      getRowClass={getRowClass}
                      onGridReady={onGridReady}
                      rowSelection={'multiple'}
                      onSelectionChanged={onSelectionChanged}
                      suppressRowClickSelection={false}
                      loadingOverlayComponent={CustomGridLoading}
                      noRowsOverlayComponent={CustomNoRowsOverlay}
                      className={'wmsDashboard check'}
                      pinnedBottomRowData={pinnedBottomRowData}
                    />
                  )}
                  <div className="btnArea">
                    <CustomShortcutButton
                      className={`btn ${isShowRightSideGrid ? 'on' : ''}`}
                      onClick={() => setIsShowRightSideGrid(!isShowRightSideGrid)}
                      title="상세보기"
                      shortcut={{ alt: true, key: '2' }}
                    >
                      상세보기
                    </CustomShortcutButton>
                    <CustomShortcutButton onClick={handleAutoPickingJob} shortcut={COMMON_SHORTCUTS.save} className="btn btnBlue">
                      출고처리 ({selectedRows.length})
                    </CustomShortcutButton>
                  </div>
                </div>
              </div>
              {isShowRightSideGrid ? (
                <div className="layout40">
                  <div className="DetailGrid" ref={bottomGridDivRef}>
                    <TunedGrid<PickinginfoResponseJobCompareInven>
                      ref={bottomGridRef}
                      rowData={rightGridData}
                      columnDefs={RightGridColumns}
                      defaultColDef={defaultColDef}
                      onGridReady={onGridReady}
                      loadingOverlayComponent={CustomGridLoading}
                      noRowsOverlayComponent={CustomNoRowsOverlay}
                      domLayout="normal"
                      suppressRowClickSelection={true} // ROW를 클릭만으로는 선택되지 않도록 설정
                      groupDefaultExpanded={-1} // 그룹핑된 목록을 확장 (0: 안함, 1: 첫번째그룹기준, -1: 전체확장)
                      groupDisplayType={'multipleColumns'} //그룹핑된 목록의 타이틀을 표시
                      rowSelection={'multiple'}
                      groupSelectsChildren={true} // 그룹 선택 시 자식들도 선택
                      onCellValueChanged={(event) => {
                        bottomGridCellValueChanged(event);
                      }}
                      className={'wmsDashboard'}
                      pinnedBottomRowData={pinnedBottomRowDataRight}
                    />
                    <div className="btnArea">
                      <CustomShortcutButton
                        onClick={handleParticialPickingJob}
                        shortcut={COMMON_SHORTCUTS.gridUnder2_1}
                        className={`btn ${isDelivery ? 'on' : ''}`}
                      >
                        부분출고처리
                      </CustomShortcutButton>
                    </div>
                  </div>
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>

          {/* 미리보기 & 프린트 */}

          <div className="previewBox">
            {isPreView ? (
              printJobDetails?.length > 0 ? (
                <PrintLayout selectedDetail={printJobDetails} isPrinting={isPrinting} type={previewType || 'default'} setIsPrinting={setIsPrinting} />
              ) : (
                <div className="noRowsOverlayBox">항목을 선택하면 상세 정보가 표시됩니다.</div>
              )
            ) : null}
          </div>
        </div>
      </div>

      {!ispickingInfosSuccess && <div className="error-message">데이터 로딩 중 오류가 발생했습니다. 페이지를 새로고침하거나 관리자에게 문의해주세요.</div>}
    </div>
  );
};

export default Pickinginfo;
