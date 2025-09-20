import React, { useEffect, useState, useRef, useMemo } from 'react';
import { DropDown, Search, TableHeader, Title, Pagination, toastError, toastSuccess } from '../../../components';
import { usePickinginfoStore } from '../../../stores/wms/usePickinginfoStore';
import { ColDef, CellClickedEvent, CellKeyDownEvent, FullWidthCellKeyDownEvent, CellValueChangedEvent, SelectionChangedEvent } from 'ag-grid-community';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import useFilters from '../../../hooks/useFilters';
import { useCommonStore } from '../../../stores';
import { AgGridReact } from 'ag-grid-react';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import PrintLayout from '../../../components/print/PrintLayout';
import { useAgGridApi } from '../../../hooks';
import { CodeResponseLowerSelect, PickinginfoRequestPagingFilter, PickinginfoResponseBottomGridDetail, PickinginfoResponsePaging } from '../../../generated';
import { Utils } from '../../../libs/utils';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { authApi } from '../../../libs';
import {
  autoPickingJob,
  fetchJobDetail,
  fetchJobSkuInvenLocs,
  fetchLowerCodes,
  fetchPickingJobForPrint,
  releaseHoldJob,
  saveHoldJob,
} from '../../../api/wms-api';
import { JobType } from '../../../libs/const';
import Loading from '../../../components/Loading';

/**
 * 출고정보 페이지 2025-01-14 이전 출고 작업했던것 비즈니스 변경이유로 change
 * wms/chulgo/pickinginfo
 */

const Pickinginfo: React.FC = () => {
  const { onGridReady } = useAgGridApi();
  const session = useSession();
  const { upMenuNm, menuNm } = useCommonStore();
  const { paging, setPaging } = usePickinginfoStore();

  // grid, 선택 데이타 상태
  const [topGridData, setTopGridData] = useState<PickinginfoResponsePaging[]>([]);
  const [bottomGridData, setBottomGridData] = useState<PickinginfoResponseBottomGridDetail['skuInvenLocList']>([]);
  const [jobSkuCountData, setJobSkuCountData] = useState<PickinginfoResponseBottomGridDetail['jobSkuCountList']>([]);
  const [selectedRows, setSelectedRows] = useState<PickinginfoResponsePaging[]>([]);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any>(null);
  const [selectedJobId, setSelectedJobId] = useState<number>();
  const [previewType, setPreviewType] = useState<string>();
  const [printJobList, setPrintJobList] = useState([]);
  const [printJobDetails, setPrintJobDetails] = useState<any>([]);
  const [sampleJobDetails, setSampleJobDetails] = useState([]);

  // 미리보기, 하단그리드보기 상태
  const [isPreView, setIsPreView] = useState<boolean>(false);
  const [isShowSubGrid, setIsShowSubGrid] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const previewRef = useRef<HTMLInputElement>(null);
  const topGridRef = useRef<AgGridReact>(null);
  const bottomGridRef = useRef<AgGridReact>(null);

  // 필터 상태
  const [filters, onChangeFilters, onFiltersReset] = useFilters<PickinginfoRequestPagingFilter>({
    logisId: session.data?.user.workLogisId,
    startDate: Utils.getStartDayBeforeMonth(1), // 한달전
    endDate: dayjs().format('YYYY-MM-DD'), // 오늘날짜
    sellerNm: '', //소매명
    compNo: '', //소매처 사업자번호
    jobStatCd: '1', //작업상태
    partnerNm: '', //화주명
    jobType: '', //작업타입
  });

  /**
   *  API
   */

  // 출고정보 목록 조회
  const {
    data: pickingInfos,
    isLoading: ispickingInfosLoading,
    isSuccess: ispickingInfosSuccess,
    refetch: refetchPickingInfos,
  } = useQuery(['/wms/pickinginfo/paging', paging.curPage], () =>
    authApi.get('/wms/pickinginfo/paging', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      },
    }),
  );
  useEffect(() => {
    if (ispickingInfosSuccess && pickingInfos?.data) {
      const { resultCode, body, resultMessage } = pickingInfos.data;
      if (resultCode === 200) {
        console.log('[API] 출고정보 목록 조회 >> ', body?.rows);
        setPaging(body?.paging);
        setTopGridData(body.rows || []);
      } else {
        toastError(resultMessage || '출고 목록 조회 정보가 없습니다.');
      }
    }
  }, [pickingInfos, ispickingInfosSuccess, setPaging]);

  // 하단그리드 데이타 (JOB기준 SKU별 재고위치목록) 조회
  const { data: jobSkuInvenLocData, isSuccess: isFetchJobSkuInvenLocsSuccess } = useQuery(
    ['fetchJobSkuInvenLocs', selectedJobId],
    () => fetchJobSkuInvenLocs(selectedJobId),
    {
      enabled: !!selectedJobId,
    },
  );
  useEffect(() => {
    if (isFetchJobSkuInvenLocsSuccess && jobSkuInvenLocData) {
      const { resultCode, body, resultMessage } = jobSkuInvenLocData.data;
      if (resultCode === 200) {
        // console.log('[API] fetchJobSkuInvenLocs :', {
        //   skuInvenLocList: body.skuInvenLocList,
        //   jobSkuCountData: body.jobSkuCountList,
        // });
        setBottomGridData(body.skuInvenLocList || []);
        setJobSkuCountData(body.jobSkuCountList || []);
      } else {
        toastError(resultMessage || '해당 작업의 상세 재고정보를 불러오는데 실패했습니다.');
        setBottomGridData([]);
        setJobSkuCountData([]);
      }
    }
  }, [jobSkuInvenLocData, isFetchJobSkuInvenLocsSuccess]);

  // 미리보기 데이터 (출고정보 상세) 조회
  const { data: jobDetailData, isSuccess: isFetchJobDetailSuccess } = useQuery(['fetchJobDetail', selectedJobId], () => fetchJobDetail(selectedJobId), {
    enabled: !!selectedJobId,
  });
  useEffect(() => {
    if (isFetchJobDetailSuccess && jobDetailData) {
      const { resultCode, body, resultMessage } = jobDetailData.data;
      if (resultCode === 200) {
        //console.log('[API] 미리보기 데이타 :', body);
        setSelectedOrderDetail(body);
        //console.log('작업타입 :', body.jobType);

        switch (body[0].jobType) {
          case JobType.jumun:
            setPreviewType('default');
            break;
          case JobType.misong:
            setPreviewType('misong');
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
        }
      } else {
        toastError(resultMessage || '해당 작업의 상세 정보를 불러오는데 실패했습니다.');
        setSelectedOrderDetail(null);
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
        await queryClient.invalidateQueries(['/wms/pickinginfo/paging']);
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
        await queryClient.invalidateQueries(['/wms/pickinginfo/paging']);
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
        await queryClient.invalidateQueries(['/wms/pickinginfo/paging']);
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
    //선택된 것중 처리가능한 것만 처리
    const processableRows = selectedRows.filter((row) => row.processable);
    console.log('출고처리목록: ', processableRows);

    if (processableRows.length === 0) {
      toastError('선택된 주문 중 처리 가능한 주문이 없습니다.');
      return;
    }

    const jobIds = processableRows.map((row) => row.jobId);
    // console.log('자동출고 작업 ID:', jobIds);
    autoPickingJobMutate(jobIds);
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
  const processBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const topGridElement = topGridDivRef.current;
      const bottomGridElement = bottomGridDivRef.current;
      const processBtnElement = processBtnRef.current;

      // 클릭이 topGridDivRef 또는 bottomGridDivRef의 DOM 영역 외부에서 발생하고,
      // 클릭한 영역이 스크롤바가 아닌지 확인
      if (
        topGridElement &&
        bottomGridElement &&
        processBtnElement &&
        !topGridElement.contains(event.target as Node) &&
        !bottomGridElement.contains(event.target as Node) &&
        !processBtnElement.contains(event.target as Node) &&
        !isElementInsideScrollbar(event.target as Node)
      ) {
        setIsShowSubGrid(false);
      }
    };

    // 클릭 이벤트 리스너 등록
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // 컴포넌트 언마운트 시 클릭 이벤트 리스너 제거
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // 스크롤바 영역 내부인지 확인하는 함수
  const isElementInsideScrollbar = (target: Node): boolean => {
    const targetElement = target instanceof HTMLElement ? target : null;

    // 스크롤바가 있는 경우, 해당 영역을 클릭한 경우는 제외
    return targetElement ? targetElement.scrollHeight > targetElement.clientHeight : false;
  };

  const onSearch = () => {
    // onFiltersReset();
    setPaging({
      curPage: 1,
    });
    refetchPickingInfos();
  };

  const reset = () => {
    onFiltersReset();
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

    const nonProcessable = selectedData.find((data): boolean => !data.processable);
    if (nonProcessable) {
      toastError('처리가 불가능한 작업이 선택되었습니다.');
      return;
    }
    //console.log('셀렉티드데이터', selectedData);
    selectPrintData(selectedData);

    setSelectedJobId(selectedData[0]?.jobId); // Trigger : 하단 그리드 및 미리보기 데이터 로드
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

      console.log('프린트 응답 전문 >>>', resBody);
      setPrintJobDetails(resBody);
    }
  };

  // 상단 그리드 셀 클릭
  const handleTopGridCellClick = async (event: CellClickedEvent) => {
    console.log('handleTopGridCellClick >> jobId:', event.data.jobId);
    if (event.data && event.data.jobId) {
      setSelectedJobId(event.data.jobId); // Trigger : 하단 그리드 및 미리보기 데이터 로드
      setIsShowSubGrid(true); // 서브그리드 보여주기
    }
  };

  // 상단 그리드 셀 방향키 전환
  const handleTopGridCellKeyDown = (event: CellKeyDownEvent | FullWidthCellKeyDownEvent) => {
    const keyEvent = event.event as KeyboardEvent;
    const rowIndex = event.rowIndex;
    if (keyEvent.key === 'ArrowDown' || keyEvent.key === 'ArrowUp') {
      if (rowIndex != null) {
        const calcIndex = keyEvent.key === 'ArrowDown' ? rowIndex + 1 : rowIndex - 1; // 인덱스 재계산 (아래일경우 + 1을 해준다)
        const selectedData = topGridData[calcIndex];
        console.log('handleTopGridCellKeyDown >> jobId:', selectedData?.jobId);
        if (selectedData?.jobId) {
          setSelectedJobId(selectedData.jobId); // Trigger : 하단 그리드 및 미리보기 데이터 로드
          setIsShowSubGrid(true); // 서브그리드 보여주기
        }
      }
    }
  };

  // 하단그리드 출고수량 변경 입력
  const bottomGridCellValueChanged = (event: CellValueChangedEvent<PickinginfoResponseBottomGridDetail['skuInvenLocList']>): void => {
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
  const topGridColumns = useMemo<ColDef<PickinginfoResponsePaging>[]>(
    () => [
      {
        field: 'no',
        headerName: '번호',
        minWidth: 70,
        maxWidth: 70,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'partnerNm',
        headerName: '매장',
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'jobStatNm',
        headerName: '출고상태',
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        cellRenderer: (params: any) => {
          let color;
          if (params.value === '요청') {
            color = '#1890ff';
          } else if (params.value === '완료') {
            color = '#ff4d4f';
          } else {
            color = 'black';
          }
          return <SafeHtml html={`<span style="color: ${color};">${params.value}</span>`} />;
        },
      },
      {
        field: 'jobTypeNm',
        headerName: '작업구분',
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        cellRenderer: (params: any) => {
          let color;
          if (params.value === '요청') {
            color = '#1890ff'; // 파란색
          } else if (params.value === '완료') {
            color = '#ff4d4f'; // 빨간색
          } else {
            color = 'black'; // 기본 색상
          }
          return <SafeHtml html={`<span style="color: ${color};">${params.value}</span>`} />;
        },
      },
      {
        field: 'orderCdNm',
        headerName: '주문분류',
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'sellerNm',
        headerName: '소매처',
        maxWidth: 200,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'compNo',
        headerName: '사업자번호',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'jobChitNo',
        headerName: '전표',
        maxWidth: 50,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'tranCnt',
        headerName: '작업대상수량',
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'tranYmd',
        headerName: '주문일',
        maxWidth: 130,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'updUser',
        headerName: '주문자',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'processable',
        headerName: '처리가능',
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        cellRenderer: (params: any) => {
          const value = params.value ? '가능' : '불가능';
          const color = params.value ? '#1890ff' : '#ff4d4f'; // 파란색 또는 빨간색
          return <SafeHtml html={`<span style="color: ${color};">${value}</span>`} />;
        },
      },
      {
        field: 'reason',
        headerName: '사유',
        minWidth: 150,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'jobEtc',
        headerName: '보류 사유',
        minWidth: 140,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        editable: true,
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

  // 하단 그리드 컬럼
  const bottomGridColumns = useMemo<ColDef[]>(
    () => [
      {
        field: 'skuNm',
        headerName: 'SKU명',
        maxWidth: 150,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        rowGroup: true, // 그룹 기준으로 사용할 필드 설정
      },
      {
        field: 'zoneCdNm',
        headerName: '구역(Zone)',
        maxWidth: 150,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        rowGroup: true,
      },
      {
        field: 'location',
        headerName: '위치(Loc)',
        maxWidth: 200,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        checkboxSelection: true, // 체크박스 표시
      },
      {
        field: 'locCntn',
        headerName: '위치설명',
        maxWidth: 200,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'invenStatCdNm',
        headerName: '재고 상태',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        cellRenderer: (params: any) => {
          let color;
          if (params.value === '적치') {
            color = '#1890ff'; // 파란색
          } else if (params.value === '출고') {
            color = '#ff4d4f'; // 빨간색
          } else {
            color = 'black'; // 기본 색상
          }
          return <SafeHtml html={`<span style="color: ${color};">${params.value || ''}</span>`} />;
        },
      },
      {
        field: 'invenCnt',
        headerName: '재고수량',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        aggFunc: 'sum',
      },
      // {
      //   field: 'pickingCnt',
      //   headerName: '출고수량(입력)',
      //   editable: true,
      //   maxWidth: 100,
      //   cellStyle: {
      //     textAlign: 'center',
      //     fontSize: '13px',
      //     fontWeight: 'bold',
      //   },
      //   suppressHeaderMenuButton: true,
      //   headerClass: 'custom-header-class',
      //   valueParser: (params) => {
      //     const newValue = Number(params.newValue);
      //     if (isNaN(newValue) || newValue <= 0) {
      //       toastError('숫자(양수)만 입력가능합니다.', { autoClose: 1000 });
      //       return params.oldValue;
      //     }
      //     if (params.data.invenCnt < newValue) {
      //       toastError('출고수량은 재고수량 보다 클수 없습니다.', { autoClose: 1000 });
      //       return params.oldValue;
      //     }
      //     return isNaN(newValue) ? 0 : newValue;
      //   },
      // },
      // {
      //   field: 'updUser',
      //   headerName: '사용자',
      //   width: 85,
      //   suppressHeaderMenuButton: true,
      //   cellStyle: GridSetting.CellStyle.CENTER,
      // },
      // {
      //   field: 'updTm',
      //   headerName: '시간',
      //   width: 100,
      //   suppressHeaderMenuButton: true,
      //   cellStyle: GridSetting.CellStyle.CENTER,
      // },
      //{ field: 'locId', headerName: '위치 ID', maxWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    ],
    [],
  );

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={onSearch} />

      <Search className="type_2">
        <DropDown
          title={'출고상태'}
          name={'jobStatCd'}
          codeUpper={'10190'}
          value={filters.jobStatCd}
          onChange={(name, value) => {
            value === '선택' ? onChangeFilters('jobStatus', '') : onChangeFilters(name, value);
          }}
        />
        <DropDown
          title={'작업구분'}
          name={'jobType'}
          codeUpper={'10180'}
          value={filters.jobType}
          onChange={(name, value) => {
            value === '선택' ? onChangeFilters('jobType', '') : onChangeFilters(name, value);
          }}
        />
        <Search.TwoDatePicker
          title={'검색기간'}
          startName={'startDate'}
          endName={'endDate'}
          //value={[filters.startDate, filters.endDate]}
          onEnter={onSearch}
          filters={filters}
          onChange={onChangeFilters}
        />
        <Search.Input
          title={'화주'}
          name={'partnerNm'}
          placeholder={'화주/도매 검색'}
          value={filters.partnerNm}
          onChange={onChangeFilters}
          onEnter={onSearch}
        />
        {/*<Search.Input title={'상품명'} name={'skuName'} placeholder={'상품명'} value={filters.skuName} onChange={onChangeFilters} onEnter={onSearch} />*/}
        <Search.Input
          title={'소매처'}
          name={'sellerNm'}
          placeholder={'소매처 검색'}
          value={filters.sellerNm}
          onChange={onChangeFilters}
          onEnter={onSearch}
          filters={filters}
        />
        <Search.Input
          title={'사업자번호'}
          name={'compNo'}
          placeholder={'사업자번호 검색'}
          value={filters.compNo}
          onChange={onChangeFilters}
          onEnter={onSearch}
          filters={filters}
        />
      </Search>

      <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={onSearch}>
          <button className={`btn ${isShowSubGrid ? 'on' : ''}`} onClick={() => setIsShowSubGrid(!isShowSubGrid)} title="하단그리드">
            LOC 지정
          </button>
          {/*<button className={`btn ${isPreView ? 'on' : ''}`} title="미리보기" onClick={handlePreviewClick}>*/}
          <button className={`btn ${isPreView ? 'on' : ''}`} title="미리보기" onClick={() => setIsPreView(!isPreView)}>
            미리보기
          </button>
          <button className="btn btnBlue" onClick={handleAutoPickingJob} ref={processBtnRef}>
            출고처리 ({selectedRows.length})
          </button>
          <button className="btn icoPrint" title="프린트" onClick={handlePrintClick}>
            프린트
          </button>
        </TableHeader>
        <div className="gridBox">
          <div className={`tblPreview columnGridArea ${isShowSubGrid ? 'show' : ''}`}>
            {/* 상단 그리드 */}
            <div className="InfoGrid" ref={topGridDivRef}>
              <div className="ag-theme-alpine">
                {ispickingInfosLoading ? (
                  <Loading />
                ) : (
                  <AgGridReact
                    ref={topGridRef}
                    rowData={topGridData}
                    columnDefs={topGridColumns}
                    defaultColDef={defaultColDef}
                    onGridReady={onGridReady}
                    gridOptions={{ rowHeight: 24, headerHeight: 35 }}
                    rowSelection={'multiple'}
                    onSelectionChanged={onSelectionChanged}
                    suppressRowClickSelection={false}
                    paginationPageSize={paging.pageRowCount}
                    loadingOverlayComponent={CustomGridLoading}
                    noRowsOverlayComponent={CustomNoRowsOverlay}
                    // onCellClicked={handleTopGridCellClick}
                    // onCellKeyDown={handleTopGridCellKeyDown}
                  />
                )}
              </div>
            </div>

            {/* 하단 그리드 */}
            <div className="DetailGrid" ref={bottomGridDivRef}>
              <div className="ag-theme-alpine">
                <AgGridReact
                  ref={bottomGridRef}
                  rowData={bottomGridData}
                  columnDefs={bottomGridColumns}
                  defaultColDef={defaultColDef}
                  onGridReady={onGridReady}
                  gridOptions={{ rowHeight: 24, headerHeight: 35 }}
                  loadingOverlayComponent={CustomGridLoading}
                  noRowsOverlayComponent={CustomNoRowsOverlay}
                  domLayout="normal"
                  suppressRowHoverHighlight={false}
                  suppressRowClickSelection={true} // ROW를 클릭만으로는 선택되지 않도록 설정
                  groupDefaultExpanded={-1} // 그룹핑된 목록을 확장 (0: 안함, 1: 첫번째그룹기준, -1: 전체확장)
                  groupDisplayType={'multipleColumns'} //그룹핑된 목록의 타이틀을 표시
                  rowSelection={'multiple'}
                  groupSelectsChildren={true} // 그룹 선택 시 자식들도 선택
                  onCellValueChanged={bottomGridCellValueChanged}
                />
              </div>
            </div>
            <Pagination pageObject={paging} setPaging={setPaging} />
          </div>

          {/* 미리보기 & 프린트 */}
          <div>
            {isPreView ? (
              <div className="previewBox" ref={previewRef}>
                {selectedOrderDetail && previewType ? ( // 미리보기
                  <PrintLayout selectedDetail={printJobDetails} type={previewType} isPrinting={isPrinting} setIsPrinting={setIsPrinting} />
                ) : (
                  <div className="noRowsOverlayBox">주문을 선택하면 상세 정보가 표시됩니다.</div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {!ispickingInfosSuccess && <div className="error-message">데이터 로딩 중 오류가 발생했습니다. 페이지를 새로고침하거나 관리자에게 문의해주세요.</div>}
    </div>
  );
};

export default React.memo(Pickinginfo);
