import { Title, toastError } from '../../../components';
import React, { useEffect, useState } from 'react';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { Utils } from '../../../libs/utils';
import { useSettlementStore } from '../../../stores/useSattlementStore';
import EnterPricePop from '../../../components/popup/settlement/EnterPricePop';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { SettlementResponseAsSettlement, SettlementResponseSettlementBriefInfoPerDay } from '../../../generated';
import dayjs, { Dayjs } from 'dayjs';
import { useSession } from 'next-auth/react';
import { Calendar, CalendarProps } from 'antd';
import { SelectInfo } from 'antd/es/calendar/generateCalendar';
import type { CellRenderInfo } from 'rc-picker/lib/interface';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

interface SettlementDetElement {
  title?: string;
  amount?: string | number;
  details?: SettlementDetElement[];
}

const Settlement = () => {
  const session = useSession();
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');
  const nowPage = 'oms_Settlement'; // filter 저장 예솔수정

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList, // filter 저장 예솔수정
    s.setFilterDataList, // filter 저장 예솔수정
    s.getFilterData, // filter 저장 예솔수정
    s.selectedRetail,
  ]);

  /** 스토어 */
  const [modalType, openModal] = useSettlementStore((s) => [s.modalType, s.openModal]);

  /** from 의 초깃값: 이전 달 1일, to 의 초깃값: 이번 달 마지막 날짜 + (42 - 이번 달 마지막 날짜) */
  const initialFilters = {
    workYmd: today,
    from: dayjs(today)
      .subtract(1, 'month')
      .startOf('month')
      //.subtract(42 - Number(dayjs(today).endOf('month').format('DD')), 'days')
      .format('YYYY-MM-DD'),
    to: dayjs(today)
      .endOf('month')
      .add(42 - Number(dayjs(today).endOf('month').format('DD')), 'days')
      .format('YYYY-MM-DD'),
  };

  const [filters, onChangeFilters, onFiltersReset] = useFilters(getFilterData(filterDataList, nowPage) || initialFilters); // filter 저장 예솔수정
  /** 예솔체크 여기에서 onFilterReset이 사용되지 않음 그리고 영업정산 초기화버튼 눌러도 검색일자 초기화 안됨 */

  const [briefInfos, setBriefInfos] = useState<SettlementResponseSettlementBriefInfoPerDay[]>([]);

  const [settlementDet, setSettlementDet] = useState<SettlementDetElement[]>([
    {
      title: '실매출 (0)',
      amount: 0,
      details: [
        { title: '판매금액 (0)', amount: 0 },
        { title: '반품금액 (0)', amount: 0 },
        { title: '할인금액 (0)', amount: 0 },
      ],
    },
    {
      title: '판매 결제',
      details: [
        { title: '현금입금 (0)', amount: 0 },
        { title: '통장입금 (0)', amount: 0 },
        { title: '외상', amount: 0 },
      ],
    },
    {
      title: '부가세 정보',
      details: [
        { title: '현금 (0)', amount: 0 },
        { title: '통장 (0)', amount: 0 },
        { title: '청구 (0)', amount: 0 },
      ],
    },
    {
      title: '정산요약',
      details: [
        { title: '전기시재', amount: 0 },
        { title: '현금입금', amount: 0 },
        { title: '계정입금', amount: 0 },
        { title: '계정출금', amount: 0 },
        { title: '전산현금', amount: 0 },
        { title: '돈통금액', amount: 0 },
        { title: '현금차액', amount: 0 },
        { title: '돈빼기', amount: 0 },
        { title: '차기시재', amount: 0 },
      ],
    },
  ]);

  /** 검색 */
  const search = async () => {
    await onSearch();
  };
  const onSearch = async () => {
    await fetchSettlement();
    //await fetchSalesPerformanceDataForChart();
  };

  const {
    data: settlement,
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
    if (isSettlementSuccess) {
      const { resultCode, body, resultMessage } = settlement.data;
      if (resultCode == 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 예솔수정
        const settlement = body as SettlementResponseAsSettlement;
        console.log(settlement);
        setSettlementDet([
          {
            title: `실매출 (${settlement.sailAmtInfo?.realAmtCnt || 0})`,
            amount: settlement.sailAmtInfo?.realAmt || 0,
            details: [
              { title: `판매금액 (${settlement.sailAmtInfo?.sellAmtCnt || 0})`, amount: settlement.sailAmtInfo?.sellAmt || 0 },
              { title: `반품금액 (${settlement.sailAmtInfo?.refundAmtCnt || 0})`, amount: settlement.sailAmtInfo?.refundAmt || 0 },
              { title: `할인금액 (${settlement.sailAmtInfo?.dcAmtCnt || 0})`, amount: settlement.sailAmtInfo?.dcAmt || 0 },
            ],
          },
          {
            title: '판매 결제',
            details: [
              {
                title: `현금입금 (${settlement.payAmtInfoForSell?.cashAmtCnt || 0})`,
                amount: settlement.payAmtInfoForSell?.cashAmt || 0,
              },
              {
                title: `통장입금 (${settlement.payAmtInfoForSell?.accountAmtCnt || 0})`,
                amount: settlement.payAmtInfoForSell?.accountAmt || 0,
              },
              { title: '외상', amount: settlement.payAmtInfoForSell?.laterAmt || 0 },
            ],
          },
          {
            title: '부가세 정보',
            details: [
              { title: `현금 (${settlement.vatAmtInfo?.vatCashAmtCnt || 0})`, amount: settlement.vatAmtInfo?.vatCashAmt || 0 },
              { title: `통장 (${settlement.vatAmtInfo?.vatAccountAmtCnt || 0})`, amount: settlement.vatAmtInfo?.vatAccountAmt || 0 },
              { title: `청구 (${settlement.vatAmtInfo?.vatAmtCnt || 0})`, amount: settlement.vatAmtInfo?.vatAmt || 0 },
            ],
          },
          {
            title: '정산요약',
            details: [
              { title: '전기시재', amount: settlement.settlementSummary?.prevTense || 0 },
              { title: '현금입금', amount: settlement.settlementSummary?.cashIncome || 0 },
              { title: '계정입금', amount: settlement.settlementSummary?.accountDeposit || 0 },
              { title: '계정출금', amount: settlement.settlementSummary?.accountWithdrawal || 0 },
              { title: '전산현금', amount: settlement.settlementSummary?.cashInComputer || 0 },
              { title: '돈통금액', amount: settlement.settlementSummary?.cashInRealBank || 0 },
              { title: '현금차액', amount: settlement.settlementSummary?.differenceInCash || 0 },
              { title: '돈빼기', amount: settlement.settlementSummary?.endSettlement || 0 },
              { title: '차기시재', amount: settlement.settlementSummary?.futureTense || 0 },
            ],
          },
        ]);
      } else {
        toastError(resultMessage);
      }
    }
  }, [settlement]);

  const {
    data: briefInfoList,
    isLoading: isbriefInfoListLoading,
    isSuccess: isBriefInfoListSuccess,
    refetch: fetchBriefInfoList,
  } = useQuery(['/orderInfo/settlement/briefInfoList', filters.from, filters.to], () =>
    authApi.get('/orderInfo/settlement/briefInfoList', {
      params: {
        from: filters.from,
        to: filters.to,
      },
    }),
  );

  useEffect(() => {
    if (isBriefInfoListSuccess) {
      const { resultCode, body, resultMessage } = briefInfoList.data;
      if (resultCode == 200) {
        setBriefInfos(body);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isBriefInfoListSuccess, briefInfoList]);

  /** 달력관련 */
  // 셀 렌더
  const dateCellRender = (value: Dayjs, info: CellRenderInfo<dayjs.Dayjs>) => {
    const currentMonth = value.format('YYYY-MM'); // 현재 날짜의 연-월

    let minAmt = Infinity;
    let maxAmt = -Infinity;

    // 해당 달의 데이터 필터링
    const currentMonthInfos = briefInfos?.filter((item) => item.workYmd?.startsWith(currentMonth) && item.realAmt);

    // 최소값 및 최대값 계산
    currentMonthInfos.forEach((item) => {
      const realAmt = item.realAmt as number;
      if (realAmt < minAmt) minAmt = realAmt;
      if (realAmt > maxAmt) maxAmt = realAmt;
    });

    // 현재 날짜(`value`)에 해당하는 데이터 필터링
    const dailyInfos = currentMonthInfos.filter((item) => item.workYmd === value.format('YYYY-MM-DD'));

    // 렌더링
    return (
      <div>
        {dailyInfos.map((item, index) => {
          let className = '';

          // 최소값, 최대값 여부에 따라 className 설정
          if (item.realAmt === minAmt) className = 'blue';
          if (item.realAmt === maxAmt) className = 'red';

          return (
            <span key={index} className={className}>
              {Utils.setComma(item.realAmt as number)}
            </span>
          );
        })}
      </div>
    );
  };
  const cellRender: CalendarProps<Dayjs>['cellRender'] = (date: dayjs.Dayjs, info: CellRenderInfo<dayjs.Dayjs>) => {
    if (info.type === 'date') return dateCellRender(date, info);
    return info.originNode;
  };

  const onSelect = (date: dayjs.Dayjs, selectInfo: SelectInfo) => {
    const days = Number(dayjs(filters.workYmd).endOf('month').format('DD'));
    if (dayjs(filters.workYmd).format('MM') != date.format('MM')) {
      onChangeFilters('from', date.subtract(1, 'month').startOf('month').format('YYYY-MM-DD'));
      onChangeFilters(
        'to',
        date
          .endOf('month')
          .add(42 - days, 'days')
          .format('YYYY-MM-DD'),
      );
    }
    onChangeFilters('workYmd', date.format('YYYY-MM-DD'));
  };

  // 셀 헤더렌더
  const customHeaderRender = ({ value, onChange }: { value: Dayjs; onChange: (newValue: Dayjs) => void }) => {
    const prevMonth = () => {
      onChange(value.clone().subtract(1, 'month'));
    };
    const nextMonth = () => {
      onChange(value.clone().add(1, 'month'));
    };

    let prevRealAmt = 0; // 지난달 실매출
    let currentRealAmt = 0; // 이번달 실매출
    for (let i = 0; i < briefInfos.length; i++) {
      if (value.subtract(1, 'month').format('MM') == dayjs(briefInfos[i].workYmd).format('MM')) {
        // 이전 달 실매출에 합산
        prevRealAmt += briefInfos[i].realAmt || 0;
      }
      if (value.format('MM') == dayjs(briefInfos[i].workYmd).format('MM')) {
        // 이번 달 실매출에 합산
        currentRealAmt += briefInfos[i].realAmt || 0;
      }
    }

    return (
      <>
        <div className="header">
          <div className="left">
            <span>{value.format('YYYY') + '년 ' + value.format('MM') + '월'}</span>
            <div className="btnArea">
              <button onClick={prevMonth}>이전</button>
              <button onClick={nextMonth}>다음</button>
            </div>
          </div>
          <div className="right">
            <span className={currentRealAmt - prevRealAmt > 0 ? 'red' : currentRealAmt - prevRealAmt < 0 ? 'blue' : ''}>
              {currentRealAmt - prevRealAmt > 0
                ? '지난달 같은 기간보다 + '
                : currentRealAmt - prevRealAmt < 0
                ? '지난달 같은 기간보다 - '
                : '지난달 같은 기간보다 '}
              {Utils.setComma(currentRealAmt - prevRealAmt)}원
            </span>
            <span>총 실매출 {Utils.setComma(currentRealAmt)}원</span>
          </div>
        </div>
        <div className="headerBottom">
          <div className="left">
            <span className="blue">최저</span>
            <span className="red">최고</span>
          </div>
          <div className="right">날짜를 누르면 해당일의 상세내역을 볼 수 있어요</div>
        </div>
      </>
    );
  };

  /** 왼쪽 컨텐츠 */
  const [activeIndexes, setActiveIndexes] = useState<number[]>([0, 1, 3]);
  const handleToggle = (index: number) => {
    setActiveIndexes(
      (prevIndexes) =>
        prevIndexes.includes(index)
          ? prevIndexes.filter((item) => item !== index) // 열린 항목이면 제거
          : [...prevIndexes, index], // 닫혀 있으면 추가
    );
  };

  return (
    <>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} filters={filters} />
      <div className="layoutBox settlement">
        <div className="layout30">
          <div className="btnArea">
            <button className="btn plus" onClick={() => openModal('ENTER_PRICE_CASH')}>
              돈통금액
            </button>
            <button className="btn minus" onClick={() => openModal('ENTER_SETT_END')}>
              돈빼기
            </button>
          </div>
          <div className="settlementContent">
            <div className="date">
              <CustomNewDatePicker name={'workYmd'} type={'date'} value={filters.workYmd} onChange={onChangeFilters} filters={filters} />
            </div>
            <div className="list">
              <ul>
                {settlementDet.map((item: any, index: number) => (
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
        </div>
        <div className="layout70">
          <div className="calendar">
            <Calendar headerRender={customHeaderRender} onSelect={onSelect} cellRender={cellRender} />
          </div>
        </div>
      </div>
      {(modalType.type === 'ENTER_PRICE_CASH' || modalType.type === 'ENTER_SETT_END') && modalType.active && <EnterPricePop workYmd={filters.workYmd} />}
    </>
  );
};

export default Settlement;
