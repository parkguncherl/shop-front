import React from 'react';
import dayjs from 'dayjs';

interface Props {
  selectedDetail?: any;
}

const PrintSample = ({ selectedDetail }: Props) => {
  console.log('PrintSample ===>', selectedDetail);
  // 콤마추가
  const formatNumberWithCommas = (number: number) => {
    return number?.toLocaleString();
  };

  const plusMinus: string = selectedDetail?.inOutTypeNm ? (selectedDetail?.inOutTypeNm.indexOf('반출') > -1 ? '-' : '') : '';

  // th 마지막 글자
  const getThTitle = () => {
    const conditions = [
      { check: selectedDetail?.sampleItems, label: '샘플일자' },
      { check: selectedDetail?.shippedItems, label: '미송일자' },
    ];

    // 조건에 맞는 첫 번째 값을 반환
    const foundCondition = conditions.find((condition) => condition.check);
    return foundCondition ? foundCondition.label : '금액'; // 조건에 맞는 값을 찾지 못하면 '금액'을 반환
  };

  // 마지막 col width값
  const getColWidth = (selectedDetail: any) => {
    if (selectedDetail?.sampleItems) {
      return '30%'; // 샘플일 경우
    } else if (selectedDetail?.shippedItems) {
      return '30%'; // 발송일 경우
    } else {
      return '20%'; // 기본값
    }
  };

  const renderBalanceSection = () => {
    return (
      <dl>
        <dt>전잔</dt>
        <dd>{formatNumberWithCommas(selectedDetail?.previousBalance)}</dd>
        <dt>당일합계</dt>
        <dd>
          {plusMinus}
          {formatNumberWithCommas(selectedDetail?.dailyTotal ? (selectedDetail?.delYn === 'Y' ? 0 : selectedDetail?.dailyTotal) : selectedDetail?.onCreditAmt)}
        </dd>
        <dt>잔액</dt>
        <dd>{formatNumberWithCommas(selectedDetail?.currentBalance)}</dd>
      </dl>
    );
  };

  return (
    <div className="printData">
      <div className="chitBox">
        <div className="header">
          <h4>
            <>{selectedDetail?.sellerName ? selectedDetail?.sellerName : selectedDetail?.sellerNm}</>
          </h4>
          <h5 style={{ textAlign: 'right' }}>{dayjs(selectedDetail?.inputDate).format('YYYY-MM-DD(ddd) HH:mm:ss')}</h5>
          <ul className="info">
            <li>{dayjs(selectedDetail?.sampleInfo?.workYmd).format('YYYY-MM-DD(ddd)')}</li>
            <li>샘플</li>
          </ul>
        </div>
        <div className="container">
          <table>
            <colgroup>
              <col width="*" />
              <col width="15%" />
              <col width="10%" />
              <col width={getColWidth(selectedDetail)} />
            </colgroup>
            <thead>
              <tr>
                <th>품명</th>
                <th>단가</th>
                <th>수량</th>
                <th>{getThTitle()}</th>
              </tr>
            </thead>
            <tbody>
              {/* 샘플 */}
              {
                <>
                  {selectedDetail?.sampleItems ? (
                    <>
                      {selectedDetail?.sampleItems?.map((item: any, index: number) => (
                        <React.Fragment key={`${item.prodId}-${index}`}>
                          <tr className="groupTit">
                            <td colSpan={4}>{item.productName}</td>
                          </tr>
                          <tr className="groupRow">
                            <td></td>
                            <td className="agnC">{formatNumberWithCommas(item.unitPrice)}</td>
                            <td className="agnC">{item.quantity}</td>
                            <td className="agnC">{dayjs(selectedDetail?.inputDate).format('YYYY-MM-DD')}</td>
                          </tr>
                        </React.Fragment>
                      ))}
                      <tr className="tfoot">
                        <td className="agnC">--- 샘플소계 ---</td>
                        <td className="agnR">{selectedDetail?.sampleItems.length}건</td>
                        <td className="agnC">{selectedDetail?.totalCount}</td>
                        <td className="agnR">{formatNumberWithCommas(selectedDetail?.grandTotalAmount)}</td>
                      </tr>
                    </>
                  ) : (
                    ''
                  )}
                </>
              }
            </tbody>
          </table>
          {/*renderBalanceSection()*/}
        </div>
      </div>
    </div>
  );
};

export default PrintSample;
