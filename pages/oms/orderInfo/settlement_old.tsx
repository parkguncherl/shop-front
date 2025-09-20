import { Search, Title, toastError } from '../../../components';
import React, { useEffect, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { SettlementResponsePerformanceInfoInMainPage, SettlementResponseSerieDataInMainPage } from '../../../generated';
import { useRouter } from 'next/router';
import { Utils } from '../../../libs/utils';
import { useSettlementStore } from '../../../stores/useSattlementStore';
import EnterPricePop from '../../../components/popup/settlement/EnterPricePop';
//import ECharts from 'echarts-for-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { SettlementResponseAsSettlement } from '../../../generated';
import dayjs, { Dayjs } from 'dayjs';
import { chartSeriesAlignFn } from '../../../customFn/chartSeriesAlignFn';
import EChartsReact from 'echarts-for-react';
import { Placeholder } from '../../../libs/const';
import { useSession } from 'next-auth/react';
import { Badge, BadgeProps, Calendar, CalendarProps } from 'antd';
//import { LeftOutlined, RightOutlined } from '@ant-design/icons-svg';

const Settlement = () => {
  const session = useSession();
  const router = useRouter();
  /** Grid Api */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();
  /** 공통 스토어 - State */
  const [upMenuNm, menuNm, selectedRetail] = useCommonStore((s) => [s.upMenuNm, s.menuNm, s.selectedRetail]);
  /** 스토어 */
  const [modalType, openModal] = useSettlementStore((s) => [s.modalType, s.openModal]);
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');
  /** 필터 */
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters({
    workYmd: today,
  });

  const chartRef = useRef<EChartsReact>(null);

  const [settlementData, setSettlementData] = useState<SettlementResponseAsSettlement>({});
  // 차트임시데이터
  const [options, setOptions] = useState({
    legend: {
      data: [],
    },
    grid: {
      left: '15%',
    },
    xAxis: [
      {
        type: 'category',
        axisTick: { show: false },
        data: [],
      },
    ],
    yAxis: [
      {
        type: 'value',
        name: '금액',
        position: 'left',
        alignTicks: true,
        axisLine: {
          show: true,
        },
      },
      {
        type: 'value',
        name: '판매량',
        position: 'right',
        alignTicks: true,
        axisLine: {
          show: true,
        },
      },
      {
        type: 'value',
        name: '업체수',
        position: 'right',
        alignTicks: true,
        offset: 40,
        axisLine: {
          show: true,
        },
      },
    ],
    axisPointer: {
      type: 'cross', // Cross-pointer for better alignment
    },
    series: [],
  });

  /** 검색 */
  const search = async () => {
    await onSearch();
  };
  const onSearch = async () => {
    await fetchSettlement();
    await fetchSalesPerformanceDataForChart();
  };

  const {
    data: settlement,
    isLoading: isSettlementLoading,
    isSuccess: isSettlementSuccess,
    refetch: fetchSettlement,
  } = useQuery(['/orderInfo/settlement/dataForPage', filters.workYmd], () =>
    authApi.get('/orderInfo/settlement/dataForPage', {
      params: {
        ...filters,
      },
    }),
  );

  useEffect(() => {
    if (settlement) {
      const { resultCode, body, resultMessage } = settlement.data;
      if (resultCode == 200) {
        //console.log(body);
        setSettlementData(body);
      } else {
        toastError(resultMessage);
      }
    }
  }, [settlement]);

  const {
    data: salesPerformanceDataForChart,
    isLoading: isSalesPerformanceDataForChartLoading,
    isSuccess: isSalesPerformanceDataForChartSuccess,
    refetch: fetchSalesPerformanceDataForChart,
  } = useQuery(['/orderInfo/settlement/salesPerformanceData', filters.workYmd], () =>
    authApi.get('/orderInfo/settlement/salesPerformanceData', {
      params: {
        workYmd: filters.workYmd,
      },
    }),
  );

  useEffect(() => {
    if (isSalesPerformanceDataForChartSuccess) {
      const { resultCode, body, resultMessage } = salesPerformanceDataForChart.data;
      console.log('body.xAxisData===>', body);
      if (resultCode === 200 && body.series) {
        const response = body as SettlementResponsePerformanceInfoInMainPage;
        setOptions((prevOption: any) => {
          // 타입 인식 문제로 다시 한번 가드를 작성
          const suitedParams = ['금액', '판매량', '업체수'];
          const respondedSeries = chartSeriesAlignFn(
            response.series as SettlementResponseSerieDataInMainPage[],
            suitedParams,
          ) as SettlementResponseSerieDataInMainPage[]; // 본 함수에 타입이 명시되지 않은 관계로 반환 타입 단언
          /** 금액의 최대, 최솟값 기준으로 x축 위치(- 값에 영향 받음), 간격 정도가 정해진다. */
          /** interval(간격)은 높이를 7단으로 나눔, 최댓값(금액의 경우에는 최솟값의 절댓값 더함)을 7로 나눈 값을 올림하여 구하므로 max, min 값에 사용 가능 */

          /** 금액 */
          const maxOfIndexOne = Math.max(...(respondedSeries[0].bigDecimalData as number[])); // 금액의 최댓값 (index 0 -> 금액)
          const absMinOfIndexOne = Math.abs(
            Math.min(...(respondedSeries[0].bigDecimalData as number[])) < 0 ? Math.min(...(respondedSeries[0].bigDecimalData as number[])) : 0,
          ); // 금액의 최솟값의 절댓값(최솟값이 음이 아닐 경우 0) (index 0 -> 금액)
          const maxAsSingleDigitOfIndexOne = Math.ceil(maxOfIndexOne * 10 ** -Number(maxOfIndexOne.toString().length - 1)); // 최댓값의 첫번째 자릿수 (index 0 -> 금액)
          const absMinAsSingleDigitOfIndexOne = Math.ceil(absMinOfIndexOne * 10 ** -Number(maxOfIndexOne.toString().length - 1)) || 1; // 최솟값(절댓값)의 (최댓값 자릿수를 기준으로 한)첫번째 자릿수(최솟값을 최댓값 자릿수만큼 마이너스 제곱한 값을 올림하여 구하며 기본값은 1) (index 0 -> 금액)
          const intervalOfIndexOne =
            Math.ceil((maxAsSingleDigitOfIndexOne + absMinAsSingleDigitOfIndexOne) / 7) * 10 ** Number(maxOfIndexOne.toString().length - 1); // 간격(차트 y축 영역에서 값을 표현하는 갭, 최대, 최솟값을 더한 값을 7로 나누어서 구함) (index 0 -> 금액)
          const ratioForUnderArea = Math.ceil(absMinOfIndexOne / intervalOfIndexOne); // 금액에서 음의 영역이 전체 7등분 영역에서 차지하는 비율(최솟값이 -가 아닐 시 0, 양의 영역 비율은 7 - ratioForUnderArea)

          /** 판매량 */
          const maxOfIndexTwo = Math.max(...(respondedSeries[1].data as number[])); // (index 1 -> 금액)
          const maxAsSingleDigitOfIndexTwo = Math.ceil(maxOfIndexTwo * 10 ** -Number(maxOfIndexTwo.toString().length - 1)); // (index 1 -> 금액)
          const intervalOfIndexTwo = Math.ceil(maxAsSingleDigitOfIndexTwo / 7) * 10 ** Number(maxOfIndexTwo.toString().length - 1); // (index 0 -> 금액)
          console.log(Math.ceil(maxAsSingleDigitOfIndexTwo / 7), maxAsSingleDigitOfIndexTwo);

          /** 업체수 */
          const maxOfIndexThree = Math.max(...(respondedSeries[2].data as number[])); // (index 0 -> 금액)
          const maxAsSingleDigitOfIndexThree = Math.ceil(maxOfIndexThree * 10 ** -Number(maxOfIndexThree.toString().length - 1)); // (index 0 -> 금액)
          const intervalOfIndexThree = Math.ceil(maxAsSingleDigitOfIndexThree / 7) * 10 ** Number(maxOfIndexThree.toString().length - 1); // (index 0 -> 금액)
          console.log(intervalOfIndexThree);
          if (response.series) {
            return {
              ...prevOption,
              legend: {
                ...prevOption.legend,
                data: ['실매출 금액', '실매출 판매량', '실매출 업체수'],
              },

              xAxis: [
                {
                  ...prevOption.xAxis[0],
                  data: response.xaxisData,
                },
              ],
              yAxis: [
                {
                  ...prevOption.yAxis[0],
                  // 변화가 필요한 yAxis 값은 이곳에 작성(금액)
                  max: intervalOfIndexOne * (7 - ratioForUnderArea),
                  min: -intervalOfIndexOne * ratioForUnderArea,
                  interval: intervalOfIndexOne,
                },
                {
                  ...prevOption.yAxis[1],
                  // 변화가 필요한 yAxis 값은 이곳에 작성(판매량)
                  max: intervalOfIndexTwo * (7 - ratioForUnderArea),
                  min: -intervalOfIndexTwo * ratioForUnderArea,
                  interval: intervalOfIndexTwo,
                },
                {
                  ...prevOption.yAxis[2],
                  // 변화가 필요한 yAxis 값은 이곳에 작성(업체수)
                  max: intervalOfIndexThree * (7 - ratioForUnderArea),
                  min: -intervalOfIndexThree * ratioForUnderArea,
                  interval: intervalOfIndexThree,
                },
              ],
              series:
                respondedSeries.length == 3
                  ? [
                      {
                        name: '실매출 금액',
                        type: 'bar',
                        emphasis: null,
                        yAxisIndex: 0,
                        data: respondedSeries[0].bigDecimalData,
                        //stack: 'Total',
                      },
                      {
                        /** 판매와 연관된 회사 건수(업체(판매)) */
                        name: '실매출 판매량',
                        type: 'bar',
                        emphasis: null,
                        yAxisIndex: 1,
                        data: respondedSeries[1].data,
                        //stack: 'Total',
                      },
                      {
                        name: '실매출 업체수',
                        type: 'bar',
                        emphasis: null,
                        yAxisIndex: 2,
                        data: respondedSeries[2].data,
                        //stack: 'Total',
                      },
                    ]
                  : prevOption.series,
            };
          }
        });
      }
    }
    console.log(salesPerformanceDataForChart);
  }, [salesPerformanceDataForChart]);

  /** 팝업오픈 */
  /*const handleOnFocus = () => {
    openModal('ENTERPRICE');
  };*/
  const onPanelChange = (value: Dayjs, mode: CalendarProps<Dayjs>['mode']) => {
    console.log(value.format('YYYY-MM-DD'), mode);
  };
  const getListData = (value: Dayjs) => {
    let listData: { type: string; content: string }[] = []; // Specify the type of listData
    switch (value.date()) {
      case 8:
        listData = [
          { type: 'warning', content: 'This is warning event.' },
          { type: 'success', content: 'This is usual event.' },
        ];
        break;
      case 10:
        listData = [
          { type: 'warning', content: 'This is warning event.' },
          { type: 'success', content: 'This is usual event.' },
          { type: 'error', content: 'This is error event.' },
        ];
        break;
      case 15:
        listData = [
          { type: 'warning', content: 'This is warning event' },
          { type: 'success', content: 'This is very long usual event......' },
          { type: 'error', content: 'This is error event 1.' },
          { type: 'error', content: 'This is error event 2.' },
          { type: 'error', content: 'This is error event 3.' },
          { type: 'error', content: 'This is error event 4.' },
        ];
        break;
      default:
    }
    return listData || [];
  };
  const getMonthData = (value: Dayjs) => {
    if (value.month() === 8) {
      return 1394;
    }
  };
  const monthCellRender = (value: Dayjs) => {
    const num = getMonthData(value);
    return num ? (
      <div className="notes-month">
        <section>{num}</section>
        <span>Backlog number</span>
      </div>
    ) : null;
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item) => (
          <li key={item.content}>
            <Badge status={item.type as BadgeProps['status']} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };
  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') return dateCellRender(current);
    if (info.type === 'month') return monthCellRender(current);
    return info.originNode;
  };
  const customHeaderRender = ({ value, onChange }: { value: Dayjs; onChange: (newValue: Dayjs) => void }) => {
    const prevMonth = () => onChange(value.clone().subtract(1, 'month'));
    const nextMonth = () => onChange(value.clone().add(1, 'month'));

    return (
      <div className="header">
        <div className="left">
          <span>{value.format('YYYY') + '년 ' + value.format('MM') + '월'}</span>
          <div className="btnArea">
            <button onClick={prevMonth}>이전</button>
            <button onClick={nextMonth}>다음</button>
          </div>
        </div>
        <div className="right">
          <span>총 매출금액 0원</span>
        </div>
      </div>
    );
  };
  const [activeIndexes, setActiveIndexes] = useState<number[]>([0, 1, 3]);
  const handleToggle = (index: number) => {
    setActiveIndexes(
      (prevIndexes) =>
        prevIndexes.includes(index)
          ? prevIndexes.filter((item) => item !== index) // 열린 항목이면 제거
          : [...prevIndexes, index], // 닫혀 있으면 추가
    );
  };
  const settlementDataList = [
    {
      title: '실매출 (20)',
      amount: 23456000,
      details: [
        { title: '판매금액 (18)', amount: 33456000 },
        { title: '반품금액 (1)', amount: 5000000 },
        { title: '할인금액 (1)', amount: 5000000 },
      ],
    },
    {
      title: '판매 결제',
      details: [
        { title: '판매금액 (18)', amount: 33456000 },
        { title: '반품금액 (1)', amount: 5000000 },
        { title: '할인금액 (1)', amount: 5000000 },
      ],
    },
    {
      title: '부가세 정보',
      details: [
        { title: '판매금액 (18)', amount: 33456000 },
        { title: '반품금액 (1)', amount: 5000000 },
        { title: '할인금액 (1)', amount: 5000000 },
      ],
    },
    {
      title: '정산요약',
      details: [
        { title: '전기시재', amount: 33456000 },
        { title: '현금입금', amount: 5000000 },
        { title: '계정입금', amount: 5000000 },
        { title: '계정출금', amount: 5000000 },
        { title: '전산현금', amount: 5000000 },
        { title: '돈통금액', amount: 5000000 },
        { title: '현금차액', amount: 5000000 },
        { title: '돈빼기', amount: 5000000 },
        { title: '차기시재', amount: 5000000 },
      ],
    },
  ];
  return (
    <>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} filters={filters} />
      <Search className="type_2">
        <Search.DatePicker
          title={'영업일자'}
          name={'workYmd'}
          placeholder={Placeholder.Default}
          value={filters.workYmd}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
          defaultValue={today}
        />
      </Search>
      <div className="layoutBox settlement">
        <div className="layout30">
          <div className="btnArea">
            <button className="btn plus">돈통금액</button>
            <button className="btn minus">돈빼기</button>
          </div>
          <div className="settlementContent">
            <ul>
              {settlementDataList.map((item: any, index: number) => (
                <li key={index} className={activeIndexes.includes(index) ? 'on' : ''}>
                  <button onClick={() => handleToggle(index)}>
                    <strong>{item.title}</strong>
                    {item.amount && <span>{Utils.setComma(item.amount)}원</span>}
                  </button>
                  {item.details && (
                    <ul>
                      {item.details.map((detail: any, detailIndex: number) => (
                        <li key={detailIndex}>
                          <strong>{detail.title}</strong>
                          <span>{Utils.setComma(detail.amount)}원</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="layout70">
          <div className="calendar">
            <Calendar onPanelChange={onPanelChange} headerRender={customHeaderRender} />
          </div>
        </div>
      </div>
      <div>
        {/*<div className="layoutBox">*/}
        {/*  <div className="layout50 row">*/}
        {/*    <div className="left">*/}
        {/*      <h4 className="smallTitle">매출 정보</h4>*/}
        {/*      <div className="tblBox mt10">*/}
        {/*        <table>*/}
        {/*          <caption></caption>*/}
        {/*          <colgroup>*/}
        {/*            <col width="40%" />*/}
        {/*            <col width="*" />*/}
        {/*          </colgroup>*/}
        {/*          <tbody>*/}
        {/*            <tr>*/}
        {/*              <th className="newWindow">*/}
        {/*                <button>실매출</button>*/}
        {/*              </th>*/}
        {/*              <td className="agnR">*/}
        {/*                <div className="between">*/}
        {/*                  <span className="cnt">{settlementData.sailAmtInfo?.realAmtCnt || 0}</span>*/}
        {/*                  <span>{Utils.setComma(settlementData.sailAmtInfo?.realAmt || 0)}</span>*/}
        {/*                </div>*/}
        {/*              </td>*/}
        {/*            </tr>*/}
        {/*            <tr>*/}
        {/*              <th className="newWindow">*/}
        {/*                <button>판매 금액</button>*/}
        {/*              </th>*/}
        {/*              <td className="agnR">*/}
        {/*                <div className="between">*/}
        {/*                  <span className="cnt">{settlementData.sailAmtInfo?.sellAmtCnt || 0}</span>*/}
        {/*                  <span>{Utils.setComma(settlementData.sailAmtInfo?.sellAmt || 0)}</span>*/}
        {/*                </div>*/}
        {/*              </td>*/}
        {/*            </tr>*/}
        {/*            <tr>*/}
        {/*              <th className="newWindow">*/}
        {/*                <button>반품 금액</button>*/}
        {/*              </th>*/}
        {/*              <td className="agnR">*/}
        {/*                <div className="between">*/}
        {/*                  <span className="cnt">{settlementData.sailAmtInfo?.refundAmtCnt || 0}</span>*/}
        {/*                  <span>{Utils.setComma(settlementData.sailAmtInfo?.refundAmt || 0)}</span>*/}
        {/*                </div>*/}
        {/*              </td>*/}
        {/*            </tr>*/}
        {/*            <tr>*/}
        {/*              <th className="newWindow">*/}
        {/*                <button>할인 금액</button>*/}
        {/*              </th>*/}
        {/*              <td className="agnR">*/}
        {/*                <div className="between">*/}
        {/*                  <span className="cnt">{settlementData.sailAmtInfo?.dcAmtCnt || 0}</span>*/}
        {/*                  <span>{Utils.setComma(settlementData.sailAmtInfo?.dcAmt || 0)}</span>*/}
        {/*                </div>*/}
        {/*              </td>*/}
        {/*            </tr>*/}
        {/*          </tbody>*/}
        {/*        </table>*/}
        {/*      </div>*/}
        {/*      <h4 className="smallTitle mt33">판매 결제</h4>*/}
        {/*      <div className="tblBox mt10">*/}
        {/*        <table>*/}
        {/*          <caption></caption>*/}
        {/*          <colgroup>*/}
        {/*            <col width="40%" />*/}
        {/*            <col width="*" />*/}
        {/*          </colgroup>*/}
        {/*          <tbody>*/}
        {/*            <tr>*/}
        {/*              <th className="newWindow">*/}
        {/*                <button>현금 입금</button>*/}
        {/*              </th>*/}
        {/*              <td className="agnR">*/}
        {/*                <div className="between">*/}
        {/*                  <span className="cnt">{settlementData.payAmtInfoForSell?.cashAmtCnt || 0}</span>*/}
        {/*                  <span>{Utils.setComma(settlementData.payAmtInfoForSell?.cashAmt || 0)}</span>*/}
        {/*                </div>*/}
        {/*              </td>*/}
        {/*            </tr>*/}
        {/*            <tr>*/}
        {/*              <th className="newWindow">*/}
        {/*                <button>통장 입금</button>*/}
        {/*              </th>*/}
        {/*              <td className="agnR">*/}
        {/*                <div className="between">*/}
        {/*                  <span className="cnt">{settlementData.payAmtInfoForSell?.accountAmtCnt || 0}</span>*/}
        {/*                  <span>{Utils.setComma(settlementData.payAmtInfoForSell?.accountAmt || 0)}</span>*/}
        {/*                </div>*/}
        {/*              </td>*/}
        {/*            </tr>*/}
        {/*            <tr>*/}
        {/*              <th className="newWindow">*/}
        {/*                <button>외상</button>*/}
        {/*              </th>*/}
        {/*              <td className="agnR">*/}
        {/*                <div className="between">*/}
        {/*                  <span></span>*/}
        {/*                  <span>{Utils.setComma(settlementData.payAmtInfoForSell?.laterAmt || 0)}</span>*/}
        {/*                </div>*/}
        {/*              </td>*/}
        {/*            </tr>*/}
        {/*          </tbody>*/}
        {/*        </table>*/}
        {/*      </div>*/}
        {/*      <h4 className="smallTitle mt30">부가세 정보</h4>*/}
        {/*      <div className="tblBox mt10">*/}
        {/*        <table>*/}
        {/*          <caption></caption>*/}
        {/*          <colgroup>*/}
        {/*            <col width="40%" />*/}
        {/*            <col width="*" />*/}
        {/*          </colgroup>*/}
        {/*          <tbody>*/}
        {/*            <tr>*/}
        {/*              <th className="newWindow">*/}
        {/*                <button>부가세 현금</button>*/}
        {/*              </th>*/}
        {/*              <td className="agnR">*/}
        {/*                <div className="between">*/}
        {/*                  <span className="cnt">{settlementData.vatAmtInfo?.vatCashAmtCnt || 0}</span>*/}
        {/*                  <span>{Utils.setComma(settlementData.vatAmtInfo?.vatCashAmt || 0)}</span>*/}
        {/*                </div>*/}
        {/*              </td>*/}
        {/*            </tr>*/}
        {/*            <tr>*/}
        {/*              <th className="newWindow">*/}
        {/*                <button>부가세 통장</button>*/}
        {/*              </th>*/}
        {/*              <td className="agnR">*/}
        {/*                <div className="between">*/}
        {/*                  <span className="cnt">{settlementData.vatAmtInfo?.vatAccountAmtCnt || 0}</span>*/}
        {/*                  <span>{Utils.setComma(settlementData.vatAmtInfo?.vatAccountAmt || 0)}</span>*/}
        {/*                </div>*/}
        {/*              </td>*/}
        {/*            </tr>*/}
        {/*            <tr>*/}
        {/*              <th className="newWindow">*/}
        {/*                <button>부가세 청구</button>*/}
        {/*              </th>*/}
        {/*              <td className="agnR">*/}
        {/*                <div className="between">*/}
        {/*                  <span className="cnt">{settlementData.vatAmtInfo?.vatAmtCnt || 0}</span>*/}
        {/*                  <span>{Utils.setComma(settlementData.vatAmtInfo?.vatAmt || 0)}</span>*/}
        {/*                </div>*/}
        {/*              </td>*/}
        {/*            </tr>*/}
        {/*          </tbody>*/}
        {/*        </table>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*    <div className="right">*/}
        {/*      <h4 className="smallTitle between">*/}
        {/*        <div className="left">정산 요약</div>*/}
        {/*        <div className="right">*/}
        {/*          <button className="btn receipt">정산전표</button>*/}
        {/*        </div>*/}
        {/*      </h4>*/}
        {/*      <div className="tblBox mt10">*/}
        {/*        <table>*/}
        {/*          <caption></caption>*/}
        {/*          <colgroup>*/}
        {/*            <col width="40%" />*/}
        {/*            <col width="*" />*/}
        {/*          </colgroup>*/}
        {/*          <tbody>*/}
        {/*            <tr>*/}
        {/*              <th>전기 시재</th>*/}
        {/*              <td className="agnR">{Utils.setComma('100000')}</td>*/}
        {/*            </tr>*/}
        {/*            <tr>*/}
        {/*              <th className="newWindow">*/}
        {/*                <button>현금 입금</button>*/}
        {/*              </th>*/}
        {/*              <td className="agnR">{Utils.setComma('1000000')}</td>*/}
        {/*            </tr>*/}
        {/*            <tr>*/}
        {/*              <th className="newWindow">*/}
        {/*                <button>계정 입금</button>*/}
        {/*              </th>*/}
        {/*              <td className="agnR">{Utils.setComma('10000')}</td>*/}
        {/*            </tr>*/}
        {/*            <tr>*/}
        {/*              <th className="newWindow">*/}
        {/*                <button>계정 출금</button>*/}
        {/*              </th>*/}
        {/*              <td className="agnR">{Utils.setComma('9000')}</td>*/}
        {/*            </tr>*/}
        {/*            <tr>*/}
        {/*              <th>전산 현금</th>*/}
        {/*              <td className="agnR">{Utils.setComma('1441000')}</td>*/}
        {/*            </tr>*/}
        {/*            <tr>*/}
        {/*              <th>돈통 현금</th>*/}
        {/*              <td className="agnR">*/}
        {/*                <div className="formBox">*/}
        {/*                  <input*/}
        {/*                    type="text"*/}
        {/*                    value={Utils.setComma('1000000')}*/}
        {/*                    className="agnR"*/}
        {/*                    onFocus={() => {*/}
        {/*                      openModal('ENTER_PRICE_CASH');*/}
        {/*                    }}*/}
        {/*                  />*/}
        {/*                </div>*/}
        {/*              </td>*/}
        {/*            </tr>*/}
        {/*            <tr>*/}
        {/*              <th>현금 차액</th>*/}
        {/*              <td className="agnR">- {Utils.setComma('441000')}</td>*/}
        {/*            </tr>*/}
        {/*            <tr>*/}
        {/*              <th>정산 마감</th>*/}
        {/*              <td className="agnR">*/}
        {/*                <div className="formBox">*/}
        {/*                  <input*/}
        {/*                    type="text"*/}
        {/*                    value={Utils.setComma('500000')}*/}
        {/*                    className="agnR"*/}
        {/*                    onFocus={() => {*/}
        {/*                      openModal('ENTER_SETT_END');*/}
        {/*                    }}*/}
        {/*                  />*/}
        {/*                </div>*/}
        {/*              </td>*/}
        {/*            </tr>*/}
        {/*            <tr>*/}
        {/*              <th>차기 시재</th>*/}
        {/*              <td className="agnR">{Utils.setComma('500000')}</td>*/}
        {/*            </tr>*/}
        {/*          </tbody>*/}
        {/*        </table>*/}
        {/*      </div>*/}
        {/*      <h4 className="smallTitle mt30">영업 정보</h4>*/}
        {/*      <div className="tblBox mt10">*/}
        {/*        <table>*/}
        {/*          <caption></caption>*/}
        {/*          <colgroup>*/}
        {/*            <col width="40%" />*/}
        {/*            <col width="*" />*/}
        {/*          </colgroup>*/}
        {/*          <tbody>*/}
        {/*            <tr>*/}
        {/*              <th>변경 로그</th>*/}
        {/*              <td className="agnR">*/}
        {/*                <div className="between">*/}
        {/*                  <span className="cnt">4</span>*/}
        {/*                  <span></span>*/}
        {/*                </div>*/}
        {/*              </td>*/}
        {/*            </tr>*/}
        {/*            <tr>*/}
        {/*              <th className="newWindow">*/}
        {/*                <button>취소 전표</button>*/}
        {/*              </th>*/}
        {/*              <td className="agnR">*/}
        {/*                <div className="between">*/}
        {/*                  <span className="cnt">2</span>*/}
        {/*                  <span></span>*/}
        {/*                </div>*/}
        {/*              </td>*/}
        {/*            </tr>*/}
        {/*          </tbody>*/}
        {/*        </table>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*  <div className="layout50">*/}
        {/*    <h4 className="smallTitle between">*/}
        {/*      <div className="left">최근 실적(30일)</div>*/}
        {/*    </h4>*/}

        {/*    /!* 그래프영역 *!/*/}
        {/*    <div className="graphBox settlement mt10">*/}
        {/*      <ECharts ref={chartRef} option={options} opts={{ renderer: 'svg' }} />*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</div>*/}
      </div>
      {(modalType.type === 'ENTER_PRICE_CASH' || modalType.type === 'ENTER_SETT_END') && modalType.active && <EnterPricePop workYmd={filters.workYmd} />}
    </>
  );
};

export default Settlement;
