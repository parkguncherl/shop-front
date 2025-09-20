import styles from '../../styles/layout/orderReg.module.scss';
import React from 'react';
import { MainVatList } from '../../generated';
import { Utils } from '../../libs/utils';
import { router } from 'next/client';
import { useRouter } from 'next/router';

export interface AlignedResult {
  key: string;
  label: string;
  value: string;
}

export interface Infos {
  headerInfo: AlignedResult[];
  pay: AlignedResult[];
  today: AlignedResult[];
  vat: (MainVatList & { key: string })[];
}
export interface displayedSummaryInfo {
  SummaryInfo?: Infos;
  handleInfoTabBtnClick: (index: number) => void;
  infoTabBtn: number;
}

export const TotalSummary = (summaryInfo: displayedSummaryInfo) => {
  const router = useRouter();
  const getMonths = () => {
    const months = [];
    const currentDate = new Date();

    for (let i = 4; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i);
      const month = date.getMonth() + 1; // 0~11이므로 1 더함
      months.push({ key: date.toISOString(), month: month });
    }

    return months;
  };
  const monthsList = getMonths();

  //console.log('summary==>', summaryInfo.SummaryInfo);
  return (
    <div className={`${styles.summaryBox}`}>
      <div className={`${styles.payBox}`}>
        <div>
          <h4 className="smallTitle">결제 상세</h4>
          {/*<ul>*/}
          {/*  {summaryInfo.SummaryInfo?.headerInfo.map((value) => {*/}
          {/*    return (*/}
          {/*      <li key={value.key}>*/}
          {/*        {value.label} {value.value}*/}
          {/*      </li>*/}
          {/*    );*/}
          {/*  })}*/}
          {/*</ul>*/}
        </div>
        <ul className={styles.payContentBox}>
          {summaryInfo.SummaryInfo?.pay.map((result) => {
            return (
              <li key={result.key}>
                <strong className="agnL">{result.label}</strong>
                <span className="agnR">{result.value}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className={`${styles.todayBox}`}>
        <div>
          <h4>
            <button
              title={'Shift + F1 키로도 금일내역 이동가능'}
              onClick={() => {
                summaryInfo.handleInfoTabBtnClick(0);
                router.push({ pathname: '/oms/orderInfo/today' });
              }}
              className={`${summaryInfo.infoTabBtn === 0 ? styles.on : ''}`}
            >
              금일내역
            </button>
          </h4>
          <h4>
            {/* 부가세 청구  /  부가세잔 */}
            <button onClick={() => summaryInfo.handleInfoTabBtnClick(1)} className={`${summaryInfo.infoTabBtn === 1 ? styles.on : ''}`}>
              부가세
            </button>
          </h4>
        </div>
        <div className={`${styles.todayBoxDiv}`}>
          <ul className={`${styles.todayContentBox} ${summaryInfo.infoTabBtn === 0 ? styles.on : ''}`}>
            {summaryInfo.SummaryInfo?.today.map((result) => {
              return (
                <li key={result.key}>
                  <strong>{result.label}</strong>
                  <span className="agnR">{result.value}</span>
                </li>
              );
            })}
          </ul>
          <ul className={`${styles.todayContentBox} ${summaryInfo.infoTabBtn === 1 ? styles.on : ''}`}>
            {monthsList.map((monthData, index) => {
              const item =
                (summaryInfo.SummaryInfo?.vat?.find((vatItem: any) => parseInt(vatItem.stndrYm?.slice(5, 7), 10) === monthData.month) as MainVatList & {
                  key: string;
                }) || {};
              const monthLabel = `${String(monthData.month).padStart(2, '0')} 월`;
              return (
                <li key={item.key || `empty-${index}`}>
                  <strong>{monthLabel}</strong>
                  <span className="agnR">{item.requireVatAmt !== undefined ? Utils.setComma(item.requireVatAmt?.toString()) : '-'}</span>
                  <span className="agnR">{item.issuVatAmt !== undefined ? Utils.setComma(item.issuVatAmt?.toString()) : '-'}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};
