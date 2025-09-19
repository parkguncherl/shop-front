/**
 * @No.10
 * @file pages/oms/data/invenPeriod.tsx
 * @description  OMS > 데이터 > 기간별 재고 추이
 * @status 기초생성
 * @copyright 2024
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { Search, Table, TableHeader, Title, toastError } from '../../../components';
import { GridSetting } from '../../../libs/ag-grid';
import { ColDef } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import TunedGrid from '../../../components/grid/TunedGrid';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';
import { InvenPeriodResponseInvenSituation } from '../../../generated';
import { Utils } from '../../../libs/utils';
import { log } from 'node:util';

const InvenPeriod = () => {
  const nowPage = 'oms_InvenPeriod'; // filter 저장 2025-01-21
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any[]>([]); // 합계데이터 만들기 예솔수정

  // 날짜 초기값 설정 (1개월)
  const startDt = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [menuNm, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.menuNm,
    s.filterDataList, // filter 저장 2025-01-21
    s.setFilterDataList, // filter 저장 2025-01-21
    s.getFilterData, // filter 저장 2025-01-21
  ]);

  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters(
    getFilterData(filterDataList, nowPage) || {
      // filter 저장 2025-01-21
      startDate: startDt,
      endDate: today,
      period: 'day', // 일별
      prodAttrCd: '', // 전체 (제작상품 'Y', 일반상품 'N')
      countYn: 'Y', // 수량
    },
  );

  const [prodStockSituationList, setProdStockSituationList] = useState<any[]>([]);

  const numberCellRenderer = useCallback((params: any) => {
    if (params.value == null || params.value === '') return '';
    if (isNaN(params.value)) return params.value;
    return Utils.setComma(params.value);
  }, []); // 의존성 배열이 비어있으므로 컴포넌트 생명주기 동안 함수가 동일하게 유지

  // AG-Grid 컬럼 정의
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: 'workYmd',
        headerName: '영업일자',
        minWidth: 140,
        maxWidth: 140,
        valueFormatter: (params) => params.value,
        cellStyle: (params) => {
          if (params.rowIndex % 2 === 1 && filters.countYn === 'A') {
            return { ...GridSetting.CellStyle.CENTER, color: 'white' };
          } else {
            return { ...GridSetting.CellStyle.CENTER };
          }
        },
        suppressHeaderMenuButton: true,
      },
      {
        field: 'beginningOfPeriodStock',
        headerName: '기초재고',
        minWidth: 100,
        maxWidth: 100,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'receiving',
        headerName: '입고',
        minWidth: 100,
        maxWidth: 100,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'outGoing',
        headerName: '반출',
        minWidth: 100,
        maxWidth: 100,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'outGoingRate',
        headerName: '반출율',
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'totalReceiving',
        headerName: '순수입고',
        minWidth: 100,
        maxWidth: 100,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'totalReceivingRate',
        headerName: '순입고율',
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'sale',
        headerName: '판매',
        minWidth: 100,
        maxWidth: 100,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'returnSku',
        headerName: '반품',
        minWidth: 100,
        maxWidth: 100,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'returnSkuRate',
        headerName: '반품율',
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'totalSale',
        headerName: '순수판매',
        minWidth: 100,
        maxWidth: 100,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'totalSaleRate',
        headerName: '순판매율',
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'sample',
        headerName: '샘플',
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'sampleRtn',
        headerName: '회수',
        minWidth: 100,
        maxWidth: 100,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'loss',
        headerName: '로스',
        minWidth: 100,
        maxWidth: 100,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'endOfPeriodStock',
        headerName: '기말재고',
        minWidth: 100,
        maxWidth: 100,
        cellRenderer: 'NUMBER_COMMA',
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'upDownRate',
        headerName: '증감률',
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
    ],
    [filters.countYn],
  ); // filters.countYn이 변경될 때만 재생성

  // 데이터 조회 API 호출
  const {
    data: prodStockSituationData,
    isLoading: isProdStockSituationDataLoading,
    isSuccess: isProdStockSituationDataSuccess,
    refetch: prodStockSituationDataFetch,
  } = useQuery(['/invenPeriod/prodStockSituationInPeriod', filters.period, filters.prodAttrCd, filters.startDate, filters.endDate], (): any =>
    authApi.get('/invenPeriod/prodStockSituationInPeriod', {
      params: {
        ...filters,
      },
    }),
  );

  // API 응답 처리
  useEffect(() => {
    if (isProdStockSituationDataSuccess) {
      const { resultCode, body, resultMessage } = prodStockSituationData.data;
      if (resultCode === 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
        // 하나의 행을 상, 하 순으로 건수, 금액을 가진 두개의 행으로 분할
        const respondedList = (body as InvenPeriodResponseInvenSituation[]) || [];
        const appliedToStatus: any[] = [];
        for (let i = 0; i < respondedList.length; i++) {
          const commonlyUsedWorkYmd = (
            filters.period == 'week' ? respondedList[i].weekEnd : filters.period == 'month' ? respondedList[i].workYm : respondedList[i].workYmd
          )?.toString();
          /** 첫번째 행 */
          if (filters.countYn == 'A' || filters.countYn == 'Y') {
            const countIndex = filters.countYn == 'Y' ? i : i * 2;
            appliedToStatus[countIndex] = {
              workYmd: commonlyUsedWorkYmd,
              beginningOfPeriodStock: respondedList[i].beginningOfPeriodStockCnt || 0, // 기초재고 수량
              receiving: respondedList[i].receivingCnt || 0, // 입고수량
              outGoing: respondedList[i].outGoingCnt || 0, // 반출수량
              totalReceiving: (respondedList[i].receivingCnt || 0) - (respondedList[i].outGoingCnt || 0), // 순수입고 == 입고 - 반출
              sale: respondedList[i].totSaleCnt || 0, // 판매량
              returnSku: respondedList[i].totReturnCnt || 0, // 반품량
              totalSale: (respondedList[i].totSaleCnt || 0) - (respondedList[i].totReturnCnt || 0), // 순수판매 == 판매 - 반품
              sample: respondedList[i].sampleCnt || 0, // 샘플 개수
              sampleRtn: respondedList[i].sampleRtnCnt || 0, // 회수 수량
              loss: respondedList[i].lossCnt || 0, // 로스 수량 (+,- 가능)
            };
            appliedToStatus[countIndex] = {
              ...appliedToStatus[countIndex],
              /** 코드 간소화 차원에서 기말재고를 본 영역에 위치 */
              endOfPeriodStock:
                appliedToStatus[countIndex].beginningOfPeriodStock + // 기초재고
                appliedToStatus[countIndex].totalReceiving - // 순수입고
                appliedToStatus[countIndex].totalSale - // 순수판매
                (appliedToStatus[countIndex].sample - appliedToStatus[countIndex].sampleRtn) + // 샘플 - 회수
                appliedToStatus[countIndex].loss, // 기말재고 == 기초재고 + 순수입고 - 순수판매 - (샘플 - 회수) + 로스

              /** 이하 비율 관련 값 (분모에 대입되는 값이 0이 아닌지 검증)     Utils.calcPercentage(10, 100); ==> 10%       */
              outGoingRate:
                appliedToStatus[countIndex].receiving !== 0
                  ? Utils.calcPercentage(appliedToStatus[countIndex].outGoing, appliedToStatus[countIndex].receiving * 100 * 100) / 100
                  : 0,
              totalReceivingRate:
                appliedToStatus[countIndex].beginningOfPeriodStock !== 0
                  ? Utils.calcPercentage(appliedToStatus[countIndex].totalReceiving, appliedToStatus[countIndex].beginningOfPeriodStock * 100 * 100) / 100
                  : 0,
              returnSkuRate:
                appliedToStatus[countIndex].sale !== 0
                  ? Math.round((appliedToStatus[countIndex].returnSku / appliedToStatus[countIndex].sale) * 100 * 100) / 100
                  : 0,
              totalSaleRate:
                appliedToStatus[countIndex].beginningOfPeriodStock !== 0
                  ? Utils.calcPercentage(appliedToStatus[countIndex].totalSale, appliedToStatus[countIndex].beginningOfPeriodStock * 100 * 100) / 100
                  : 0,
            };
            appliedToStatus[countIndex] = {
              ...appliedToStatus[countIndex],
              upDownRate:
                appliedToStatus[countIndex].beginningOfPeriodStock != 0
                  ? Utils.calcPercentage(
                      appliedToStatus[countIndex].endOfPeriodStock - appliedToStatus[countIndex].beginningOfPeriodStock,
                      appliedToStatus[countIndex].beginningOfPeriodStock,
                    )
                  : 0, // 증감률 == (기말재고 - 기초재고) / 기초재고 (+,- 가능)
            };
          }

          if (filters.countYn == 'A' || filters.countYn == 'N') {
            const amtIndex = filters.countYn == 'N' ? i : i * 2 + 1;
            /** 두번째 행 */
            appliedToStatus[amtIndex] = {
              workYmd: commonlyUsedWorkYmd,
              beginningOfPeriodStock: respondedList[i].beginningOfPeriodStockAmt || 0, // 기초재고 금액
              receiving: respondedList[i].receivingAmt || 0, // 입고금액
              outGoing: respondedList[i].outGoingAmt || 0, // 반출금액
              totalReceiving: (respondedList[i].receivingAmt || 0) - (respondedList[i].outGoingAmt || 0), // 순수입고 금액 == 입고금액 - 반출금액
              sale: respondedList[i].totSaleAmt || 0, // 판매금액
              returnSku: respondedList[i].totReturnAmt || 0, // 반품금액
              totalSale: (respondedList[i].totSaleAmt || 0) - (respondedList[i].totReturnAmt || 0), // 순수판매 금액 == 판매금액 - 반품금액
              sample: respondedList[i].sampleAmt || 0, // 샘플금액
              sampleRtn: respondedList[i].sampleRtnAmt || 0, // 회수금액
              loss: respondedList[i].lossAmt || 0, // 로스금액 (+,- 가능)
            };
            appliedToStatus[amtIndex] = {
              ...appliedToStatus[amtIndex],
              /** 코드 간소화 차원에서 기말재고를 본 영역에 위치 */
              endOfPeriodStock:
                appliedToStatus[amtIndex].beginningOfPeriodStock + // 기초재고
                appliedToStatus[amtIndex].totalReceiving - // 순수입고
                appliedToStatus[amtIndex].totalSale - // 순수판매
                (appliedToStatus[amtIndex].sample - appliedToStatus[amtIndex].sampleRtn) + // 샘플 - 회수
                appliedToStatus[amtIndex].loss, // 기말재고 == 기초재고 + 순수입고 - 순수판매 - (샘플 - 회수) + 로스

              /** 이하 비율 관련 값 (분모에 대입되는 값이 0이 아닌지 검증) */
              outGoingRate:
                appliedToStatus[amtIndex].receiving != 0
                  ? Utils.calcPercentage(appliedToStatus[amtIndex].outGoing, appliedToStatus[amtIndex].receiving * 100)
                  : 0, // 반출율 == 반출금액 / 입고금액 * 100
              totalReceivingRate:
                appliedToStatus[amtIndex].beginningOfPeriodStock != 0
                  ? Utils.calcPercentage(appliedToStatus[amtIndex].totalReceiving, appliedToStatus[amtIndex].beginningOfPeriodStock * 100)
                  : 0, // 순입고율 == 순수입고 / 기초재고 *100
              returnSkuRate:
                appliedToStatus[amtIndex].sale != 0 ? Utils.calcPercentage(appliedToStatus[amtIndex].returnSku, appliedToStatus[amtIndex].sale * 100) : 0, // 반품률 == 반품 / 판매
              totalSaleRate:
                appliedToStatus[amtIndex].beginningOfPeriodStock != 0
                  ? Utils.calcPercentage(appliedToStatus[amtIndex].totalSale, appliedToStatus[amtIndex].beginningOfPeriodStock * 100)
                  : 0, // 순판매율 == 순수판매 / 기초재고 *100
            };
            appliedToStatus[amtIndex] = {
              ...appliedToStatus[amtIndex],
              upDownRate:
                appliedToStatus[amtIndex].beginningOfPeriodStock != 0
                  ? Utils.calcPercentage(
                      appliedToStatus[amtIndex].endOfPeriodStock - appliedToStatus[amtIndex].beginningOfPeriodStock,
                      appliedToStatus[amtIndex].beginningOfPeriodStock,
                    )
                  : 0, // 증감률 == (기말재고 - 기초재고) / 기초재고 (+,- 가능)
            };
          }
        }
        setProdStockSituationList(appliedToStatus);
        /** 예솔체크 하단합계 하나로 통일 수정*/
        if (body && body.length > 0) {
          const {
            beginningOfPeriodStockCnt,
            beginningOfPeriodStockAmt,
            receivingCnt,
            receivingAmt,
            outGoingCnt,
            outGoingAmt,
            totalReceivingCnt,
            totalReceivingAmt,
            totReturnCnt,
            totReturnAmt,
            totSaleCnt,
            totSaleAmt,
            sampleCnt,
            sampleAmt,
            sampleRtnCnt,
            sampleRtnAmt,
            lossCnt,
            lossAmt,
            endOfPeriodStockCnt,
            endOfPeriodStockAmt,
          } = body.reduce(
            (
              acc: {
                beginningOfPeriodStockCnt: number;
                beginningOfPeriodStockAmt: number;
                receivingCnt: number;
                receivingAmt: number;
                outGoingCnt: number;
                outGoingAmt: number;
                totalReceivingCnt: number;
                totalReceivingAmt: number;
                saleCnt: number;
                saleAmt: number;
                totReturnCnt: number;
                totReturnAmt: number;
                totSaleCnt: number;
                totSaleAmt: number;
                sampleCnt: number;
                sampleAmt: number;
                sampleRtnCnt: number;
                sampleRtnAmt: number;
                lossCnt: number;
                lossAmt: number;
                endOfPeriodStockCnt: number;
                endOfPeriodStockAmt: number;
              },
              data: any,
            ) => {
              return {
                beginningOfPeriodStockCnt: acc.beginningOfPeriodStockCnt + (data.beginningOfPeriodStockCnt || 0),
                beginningOfPeriodStockAmt: acc.beginningOfPeriodStockAmt + (data.beginningOfPeriodStockAmt || 0),

                receivingCnt: acc.receivingCnt + (data.receivingCnt || 0),
                receivingAmt: acc.receivingAmt + (data.receivingAmt || 0),

                outGoingCnt: acc.outGoingCnt + (data.outGoingCnt || 0),
                outGoingAmt: acc.outGoingAmt + (data.outGoingAmt || 0),

                totalReceivingCnt: acc.totalReceivingCnt + (data.totalReceivingCnt || 0),
                totalReceivingAmt: acc.totalReceivingAmt + (data.totalReceivingAmt || 0),

                totReturnCnt: acc.totReturnCnt + (data.totReturnCnt || 0),
                totReturnAmt: acc.totReturnAmt + (data.totReturnAmt || 0),

                totSaleCnt: acc.totSaleCnt + (data.totSaleCnt || 0),
                totSaleAmt: acc.totSaleAmt + (data.totSaleAmt || 0),

                sampleCnt: acc.sampleCnt + (data.sampleCnt || 0),
                sampleAmt: acc.sampleAmt + (data.sampleAmt || 0),

                sampleRtnCnt: acc.sampleRtnCnt + (data.sampleRtnCnt || 0),
                sampleRtnAmt: acc.sampleRtnAmt + (data.sampleRtnAmt || 0),

                lossCnt: acc.lossCnt + (data.lossCnt || 0),
                lossAmt: acc.lossAmt + (data.lossAmt || 0),

                endOfPeriodStockCnt: acc.endOfPeriodStockCnt + (data.endOfPeriodStockCnt || 0),
                endOfPeriodStockAmt: acc.endOfPeriodStockAmt + (data.endOfPeriodStockAmt || 0),
              };
            },
            {
              // 초기값
              beginningOfPeriodStockCnt: 0,
              beginningOfPeriodStockAmt: 0,
              receivingCnt: 0,
              receivingAmt: 0,
              outGoingCnt: 0,
              outGoingAmt: 0,
              totalReceivingCnt: 0,
              totalReceivingAmt: 0,
              totReturnCnt: 0,
              totReturnAmt: 0,
              totSaleCnt: 0,
              totSaleAmt: 0,
              sampleCnt: 0,
              sampleAmt: 0,
              sampleRtnCnt: 0,
              sampleRtnAmt: 0,
              lossCnt: 0,
              lossAmt: 0,
              endOfPeriodStockCnt: 0,
              endOfPeriodStockAmt: 0,
            },
          );

          // 하단 합계 행 데이터 (Cnt)
          // 하단 합계 행 데이터 (Cnt)
          const countSummaryRow = {
            beginningOfPeriodStock: beginningOfPeriodStockCnt,
            receiving: receivingCnt,
            outGoing: outGoingCnt,
            totalReceiving: totalReceivingCnt,
            sale: totSaleCnt,
            returnSku: totReturnCnt,
            sample: sampleCnt,
            sampleRtn: sampleRtnCnt,
            loss: lossCnt,
            endOfPeriodStock: endOfPeriodStockCnt,
          };

          // 하단 합계 행 데이터 (Amt)
          const amountSummaryRow = {
            beginningOfPeriodStock: beginningOfPeriodStockAmt,
            receiving: receivingAmt,
            outGoing: outGoingAmt,
            totalReceiving: totalReceivingAmt,
            sale: totSaleAmt,
            returnSku: totReturnAmt,
            sample: sampleAmt,
            sampleRtn: sampleRtnAmt,
            loss: lossAmt,
            endOfPeriodStock: endOfPeriodStockAmt,
          };

          // 조건에 따라 하단 합계 행 설정
          if (filters.countYn === 'Y') {
            // 수량만 합계
            setPinnedBottomRowData([countSummaryRow]);
          } else if (filters.countYn === 'N') {
            // 금액만 합계
            setPinnedBottomRowData([amountSummaryRow]);
          } else if (filters.countYn === 'A') {
            setPinnedBottomRowData([countSummaryRow, amountSummaryRow]);
          }
        } else {
          toastError(resultMessage);
        }
      }
    }
  }, [prodStockSituationData, isProdStockSituationDataLoading, isProdStockSituationDataSuccess, filters.countYn]);

  /**
   * 검색 버튼 클릭 핸들러
   */
  const onSearch = async () => {
    await prodStockSituationDataFetch();
  };

  /**
   * 초기화 버튼 클릭 핸들러
   */
  const onReset = async () => {
    onFiltersReset();
    onChangeFilters('startDate', startDt);
    onChangeFilters('endDate', today);
    onChangeFilters('period', 'week'); // 주별
    onChangeFilters('prodAttrCd', ''); // 전체 (제작상품 'Y', 일반상품 'N')*/
    onChangeFilters('countYn', 'Y'); // 전체
  };

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} reset={onReset} search={onSearch} />
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
        />

        <Search.DropDown
          title={'주기'}
          name={'period'}
          defaultOptions={[
            { label: '일별', value: 'day' },
            { label: '주별', value: 'week' },
            { label: '월별', value: 'month' },
          ]}
          value={filters.period}
          onChange={onChangeFilters}
          showAll={false}
        />

        <Search.DropDown
          title={'상품유형'}
          name={'prodAttrCd'}
          defaultOptions={[
            { label: '일반상품', value: 'N' },
            { label: '제작상품', value: 'Y' },
            { label: '전체', value: '' },
          ]}
          value={filters.prodAttrCd}
          onChange={onChangeFilters}
          showAll={false}
        />

        <Search.DropDown
          title={'금액/수량'}
          name={'countYn'}
          defaultOptions={[
            { label: '전체', value: 'A' },
            { label: '수량', value: 'Y' },
            { label: '금액', value: 'N' },
          ]}
          value={filters.countYn}
          onChange={onChangeFilters}
          showAll={false}
        />
      </Search>
      <Table>
        <TableHeader count={prodStockSituationList.length} search={onSearch} />
        <TunedGrid<InvenPeriodResponseInvenSituation>
          ref={gridRef}
          rowData={prodStockSituationList}
          loading={isProdStockSituationDataLoading}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          suppressRowClickSelection={true}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          className={'nothingDefault'}
          pinnedBottomRowData={pinnedBottomRowData} // 하단에 고정된 합계 행 예솔수정
        />
      </Table>
    </div>
  );
};

export default InvenPeriod;
