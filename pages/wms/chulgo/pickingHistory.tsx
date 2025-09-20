import React, { useEffect, useState, useRef } from 'react';
import { Search, TableHeader, Title, toastError } from '../../../components';
import { ColDef, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';
import { useQuery } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import useFilters from '../../../hooks/useFilters';
import { useCommonStore } from '../../../stores';
import { AgGridReact } from 'ag-grid-react';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import PrintLayout from '../../../components/print/PrintLayout';
import { Utils } from '../../../libs/utils';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { authApi } from '../../../libs';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import TunedGrid from '../../../components/grid/TunedGrid';
import { Progress } from 'antd';
import { InstockHistoryResponseFactoryPaging, PartnerResponseSelect, PickingHistoryRequestFilter, PickingHistoryResponseResponse } from '../../../generated';
import { JobType } from '../../../libs/const';
import { fetchJobDetail, fetchPartners, fetchPickingJobForPrint } from '../../../api/wms-api';
import { PickinginfoResponseOrderDetail } from '../../../generated';
import { TunedReactSelector } from '../../../components/TunedReactSelector';
import { PartnerDropDownOption } from '../../../types/PartnerDropDownOption';
import { PickingHistoryDetPop } from '../../../components/wms/chulgo/pickingHistory/PickingHistoryDetPop';
import { PickingBoryuRegPop } from '../../../components/wms/chulgo/pickingHistory/PickingBoryuRegPop';

/**
 * 출고이력 페이지
 * wms/chulgo/pickingHistory
 */

const PickingHistory = () => {
  const onGridReady = (event: GridReadyEvent<PickingHistoryResponseResponse, any>) => {
    event.api.sizeColumnsToFit();
  };
  const session = useSession();
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;

  /** 예솔수정 필터저장 */
  const nowPage = 'wms_pickingHistory'; // filter 저장 예솔수정

  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList, //filter 예솔수정
    s.setFilterDataList, //filter 예솔수정
    s.getFilterData, //filter 예솔수정
  ]);

  /** 예솔수정 하단합계 */
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<PickingHistoryResponseResponse[]>([]); // 합계데이터 객체

  // grid, 선택 데이타 상태
  const [pickingHistoryList, setPickingHistoryList] = useState<PickingHistoryResponseResponse[]>([]);

  const previewRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<AgGridReact>(null);

  // 미리보기, 하단그리드보기 상태
  const [isPreView, setIsPreView] = useState<boolean>(false);
  const [isShowRightSideGrid, setIsShowRightSideGrid] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [previewType, setPreviewType] = useState<string>();
  const [printJobDetails, setPrintJobDetails] = useState<PickinginfoResponseOrderDetail[]>([]);
  const [selectedRowData, setSelectedRowData] = useState<PickingHistoryResponseResponse | undefined>(undefined);
  const [openedPopup, setOpenedPopup] = useState<string | undefined>(undefined);

  /**
   *  Grid 컬럼
   */
  const [columnDefs] = useState<ColDef<PickingHistoryResponseResponse>[]>([
    {
      field: 'no',
      headerName: '#',
      minWidth: 40,
      maxWidth: 40,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'pickingReqDate',
      headerName: '출고요청일',
      minWidth: 80,
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'pickingBeginTm',
      headerName: '출고시작 일시',
      minWidth: 117,
      maxWidth: 117,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'partnerNm',
      headerName: '고객사',
      minWidth: 120,
      maxWidth: 160,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'chitNo',
      headerName: '전표',
      minWidth: 70,
      maxWidth: 70,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
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
      field: 'pickingStatus',
      headerName: '출고상태',
      minWidth: 70,
      maxWidth: 70,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'pickingType',
      headerName: '출고유형',
      minWidth: 70,
      maxWidth: 70,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'sellerNm',
      headerName: '소매처',
      minWidth: 120,
      maxWidth: 160,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'productDistinctCnt',
      headerName: '상품',
      minWidth: 70,
      maxWidth: 70,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'skuDistinctCnt',
      headerName: '스큐',
      minWidth: 70,
      maxWidth: 70,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'jobCnt',
      headerName: '수량',
      minWidth: 70,
      maxWidth: 70,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'waitYn',
      headerName: '출고보류',
      minWidth: 90,
      maxWidth: 90,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
  ]);

  // 필터 상태
  /*const [filters, onChangeFilters, onFiltersReset] = useFilters<PickingHistoryRequestFilter>({
    logisId: session.data?.user.workLogisId, // 물류 계정 창고검색필터
    partnerId: undefined, // 화주id
    startDate: Utils.getStartDayBeforeMonth(1), // 한달전
    endDate: dayjs().format('YYYY-MM-DD'), // 오늘날짜
    skuNm: '', //소매명
    jobStatCd: '', //작업상태
  });*/

  /** 예솔수정 필터저장 */
  const [filters, onChangeFilters, onFilterReset] = useFilters<PickingHistoryRequestFilter>(
    getFilterData(filterDataList, nowPage) || {
      logisId: workLogisId, // 물류 계정 창고검색필터
      partnerId: undefined, // 화주id
      startDate: Utils.getStartDayBeforeMonth(1), // 한달전
      endDate: dayjs().format('YYYY-MM-DD'), // 오늘날짜
      skuNm: '', //소매명
      jobStatCd: '', //작업상태
    },
  );

  /**
   *  API
   */

  // 출고정보 목록 조회
  const {
    data: pickingHistory,
    isLoading: isPickingHistoryLoading,
    isSuccess: isPickingHistorySuccess,
    refetch: refetchPickingHistory,
  } = useQuery(['/wms/pickingHistory/list', filters.logisId, filters.partnerId, filters.jobStatCd, filters.startDate, filters.endDate], (): any =>
    authApi.get('/wms/pickingHistory/list', {
      params: {
        ...filters,
      },
    }),
  );

  useEffect(() => {
    if (isPickingHistorySuccess) {
      const { resultCode, body, resultMessage } = pickingHistory.data;
      if (resultCode === 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 예솔수정
        setPickingHistoryList(body || []);
        /** 예솔수정 재고조사 하단합계 */
        if (body && body.length > 0) {
          const { jobCount } = body.reduce(
            (
              acc: {
                jobCount: number;
              },
              data: PickingHistoryResponseResponse,
            ) => {
              return {
                jobCount: acc.jobCount + (data.jobCnt ? data.jobCnt : 0),
              };
            },
            {
              jobCount: 0,
            },
          );

          setPinnedBottomRowData([
            {
              jobCnt: jobCount,
            },
          ]);
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [pickingHistory, isPickingHistorySuccess]);

  /** 화주 목록 */
  const [partnerList, setPartnerList] = useState<PartnerDropDownOption[]>([]);

  useEffect(() => {
    fetchPartners(workLogisId).then((result) => {
      const { resultCode, body, resultMessage } = result.data;
      if (resultCode === 200) {
        const partnerCodes = body?.map((item: PartnerResponseSelect) => ({
          value: item.id,
          label: item.partnerNm,
        }));
        setPartnerList([...partnerCodes]);
      } else {
        toastError(resultMessage);
      }
    });
  }, []);

  // 미리보기 데이터 (출고정보 상세) 조회
  const { data: jobDetailData, isSuccess: isFetchJobDetailSuccess } = useQuery(
    ['fetchJobDetail', selectedRowData?.jobId],
    () => fetchJobDetail(selectedRowData?.jobId),
    {
      enabled: !!selectedRowData?.jobId,
    },
  );
  useEffect(() => {
    if (isFetchJobDetailSuccess && jobDetailData) {
      const { resultCode, body, resultMessage } = jobDetailData.data;
      if (resultCode === 200) {
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
      }
    }
  }, [jobDetailData, isFetchJobDetailSuccess]);

  const handlePrintClick = async () => {
    // 선택된 행이 없으면 불가
    if (printJobDetails.length === 0) {
      toastError('프린트할 작업을 선택해주세요', { autoClose: 1000 });
      return;
    }
    setIsPrinting(true);
  };

  /**
   * Grid 헨들러
   */

  // 상단그리드 선택된 행 변경
  const onSelectionChanged = async (event: SelectionChangedEvent<PickingHistoryResponseResponse>) => {
    // flatMap 없으면 빈배열을 만든다.
    const selectedData = event.api.getSelectedNodes().flatMap((node) => (node.data ? [node.data] : []));
    selectPrintData(selectedData);
    setSelectedRowData(selectedData[0]); // Trigger : 하단 그리드 및 미리보기 데이터 로드
  };

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

  const selectPrintData = async (selectedRows: PickingHistoryResponseResponse[]) => {
    if (selectedRows.length > 0) {
      // 선택한 작업의 전체를 서버로 보낸 후 서버에서 배열객체를 만들어 내려준다.
      const jobParams: any = selectedRows.map((row: PickingHistoryResponseResponse) => ({
        jobId: row.jobId,
        jobType: row.jobType,
      }));
      const resBody = await getPickingJobDetailsForPrint(jobParams);
      setPrintJobDetails(resBody);
    }
  };

  const onSearch = () => {
    // onFiltersReset();
    refetchPickingHistory();
  };

  const reset = () => {
    onChangeFilters('logisId', session.data?.user.workLogisId);
    onChangeFilters('partnerId', undefined);
    onChangeFilters('startDate', Utils.getStartDayBeforeMonth(1));
    onChangeFilters('endDate', dayjs().format('YYYY-MM-DD'));
    onChangeFilters('skuNm', '');
    onChangeFilters('jobStatCd', '');
  };

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={onSearch} />

      <Search className="type_2">
        <TunedReactSelector
          title={'고객사'}
          name={'partnerId'}
          onChange={(option) => {
            onChangeFilters('partnerId', option.value as number);
          }}
          options={partnerList}
          placeholder="고객사 선택"
        />
        <Search.DropDown
          title={'출고상태'}
          name={'jobStatCd'}
          defaultOptions={[
            { label: '완료', value: '5' },
            { label: '보류중', value: '9' },
            { label: '출고중', value: '3' },
          ]}
          value={filters.jobStatCd}
          onChange={onChangeFilters}
        />
        <Search.Input
          title={'상품'}
          name={'skuNm'}
          placeholder={'상품명 입력'}
          value={filters.skuNm}
          onChange={onChangeFilters}
          onEnter={onSearch}
          filters={filters}
        />
        <Search.TwoDatePicker title={'기간'} startName={'startDate'} endName={'endDate'} filters={filters} onChange={onChangeFilters} />
      </Search>

      <div className="tableDashboard">
        <div className="itemBox instock">
          <dl>
            <dt>
              <strong>완료</strong>
              <Progress
                percent={Number(((pickingHistoryList.filter((data) => data.jobStatCd == '5').length / (pickingHistoryList.length ?? 1)) * 100).toFixed(0))}
                percentPosition={{ align: 'center', type: 'inner' }}
              />
            </dt>
            <dd>
              <ul>
                <li>
                  <strong>소매처</strong>
                  <span>
                    {Utils.setComma(
                      pickingHistoryList
                        .filter((data) => data.jobStatCd == '5')
                        .map(
                          (value, index1) =>
                            value.sellerId && pickingHistoryList.filter((data, index2) => index2 <= index1 && data.sellerId == value.sellerId).length > 0,
                        ).length,
                    )}
                    장
                  </span>
                </li>
                <li>
                  <strong>고객사</strong>
                  <span>
                    {Utils.setComma(
                      pickingHistoryList
                        .filter((data) => data.jobStatCd == '5')
                        .filter(
                          (value, index1) =>
                            value.partnerId && pickingHistoryList.filter((data, index2) => index2 <= index1 && data.partnerId == value.partnerId).length > 0,
                        ).length,
                    )}
                    장
                  </span>
                </li>
              </ul>
            </dd>
          </dl>
          <dl>
            <dt>
              <strong>보류중</strong>
              <Progress
                percent={Number(((pickingHistoryList.filter((data) => data.jobStatCd == '9').length / (pickingHistoryList.length ?? 1)) * 100).toFixed(0))}
                percentPosition={{ align: 'center', type: 'inner' }}
              />
            </dt>
            <dd>
              <ul>
                <li>
                  <strong>소매처</strong>
                  <span>
                    {Utils.setComma(
                      pickingHistoryList
                        .filter((data) => data.jobStatCd == '9')
                        .filter(
                          (value, index1) =>
                            value.sellerId && pickingHistoryList.filter((data, index2) => index2 <= index1 && data.sellerId == value.sellerId).length > 0,
                        ).length,
                    )}
                    장
                  </span>
                </li>
                <li>
                  <strong>고객사</strong>
                  <span>
                    {Utils.setComma(
                      pickingHistoryList
                        .filter((data) => data.jobStatCd == '9')
                        .filter(
                          (value, index1) =>
                            value.partnerId && pickingHistoryList.filter((data, index2) => index2 <= index1 && data.partnerId == value.partnerId).length > 0,
                        ).length,
                    )}
                    장
                  </span>
                </li>
              </ul>
            </dd>
          </dl>
          <dl>
            <dt>
              <strong>출고중</strong>
              <Progress
                percent={Number(((pickingHistoryList.filter((data) => data.jobStatCd == '3').length / (pickingHistoryList.length ?? 1)) * 100).toFixed(0))}
                percentPosition={{ align: 'center', type: 'inner' }}
              />
            </dt>
            <dd>
              <ul>
                <li>
                  <strong>소매처</strong>
                  <span>
                    {Utils.setComma(
                      pickingHistoryList
                        .filter((data) => data.jobStatCd == '3')
                        .filter(
                          (value, index1) =>
                            value.sellerId && pickingHistoryList.filter((data, index2) => index2 <= index1 && data.sellerId == value.sellerId).length > 0,
                        ).length,
                    )}
                    장
                  </span>
                </li>
                <li>
                  <strong>고객사</strong>
                  <span>
                    {Utils.setComma(
                      pickingHistoryList
                        .filter((data) => data.jobStatCd == '3')
                        .filter(
                          (value, index1) =>
                            value.partnerId && pickingHistoryList.filter((data, index2) => index2 <= index1 && data.partnerId == value.partnerId).length > 0,
                        ).length,
                    )}
                    장
                  </span>
                </li>
              </ul>
            </dd>
          </dl>
        </div>
      </div>

      <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
        {/* 테이블 헤더 - 총 건수 및 페이징 정보 표시 */}
        <TableHeader count={pickingHistoryList.length} search={onSearch}>
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
            <TunedGrid<PickingHistoryResponseResponse>
              ref={gridRef}
              rowData={pickingHistoryList}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              rowSelection={'single'}
              onRowClicked={(e) => console.log(e.data)}
              onSelectionChanged={onSelectionChanged}
              suppressRowClickSelection={false}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              className={'wmsDashboard check'}
              pinnedBottomRowData={pinnedBottomRowData}
            />
            <div className="btnArea">
              <CustomShortcutButton
                onClick={() => {
                  if (selectedRowData?.jobId) {
                    setOpenedPopup('det');
                  } else {
                    toastError('이력 특정 후 다시 시도하십시요.');
                  }
                }}
                shortcut={COMMON_SHORTCUTS.save}
                className="btn"
              >
                상세보기
              </CustomShortcutButton>
              <CustomShortcutButton
                onClick={() => {
                  if (selectedRowData?.jobId) {
                    setOpenedPopup('boryuReg');
                  } else {
                    toastError('이력 특정 후 다시 시도하십시요.');
                  }
                }}
                shortcut={COMMON_SHORTCUTS.save}
                className="btn"
              >
                출고보류 등록
              </CustomShortcutButton>
            </div>
          </div>

          {/* 미리보기 & 프린트 */}
          <div>
            {isPreView ? (
              <div className="previewBox" ref={previewRef}>
                {printJobDetails && previewType ? ( // 미리보기
                  <PrintLayout selectedDetail={printJobDetails} type={previewType} isPrinting={isPrinting} setIsPrinting={setIsPrinting} />
                ) : (
                  <div className="noRowsOverlayBox">주문을 선택하면 상세 정보가 표시됩니다.</div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <PickingBoryuRegPop
        active={openedPopup == 'boryuReg'}
        selectedRowData={selectedRowData}
        onClose={(trigger) => {
          setOpenedPopup(undefined);
          if (trigger == 'refetch') {
            refetchPickingHistory();
          }
        }}
      />
      <PickingHistoryDetPop active={openedPopup == 'det'} jobId={selectedRowData?.jobId} onClose={() => setOpenedPopup(undefined)} />
    </div>
  );
};

export default PickingHistory;
