import React from 'react';
import dayjs from 'dayjs';

interface Props {
  selectedDetail?: any; // 선택된 입고내역 데이터
}

const ReceivingHistoryLayout = ({ selectedDetail }: Props) => {
  // 숫자 포맷팅 (콤마 추가)
  const formatNumberWithCommas = (number: number) => {
    return number?.toLocaleString();
  };

  return (
    <div className="printData">
      <div className="chitBox">
        {/* 헤더 영역 */}
        <div className="header">
          <h4>{selectedDetail?.compNm}</h4>
          <ul className="info">
            {/*<li>전표번호: {selectedDetail?.no}</li>*/}
            <li></li>
            <li>{dayjs(selectedDetail?.workYmd).format('YYYY-MM-DD(ddd)')}</li>
          </ul>
        </div>

        {/* 내용 영역 */}
        <div className="container">
          <table>
            <colgroup>
              <col width="*" />
              <col width="20%" />
              <col width="15%" />
              <col width="20%" />
            </colgroup>
            <thead>
              <tr>
                <th>품명</th>
                <th>단가</th>
                <th>수량</th>
                <th>금액</th>
              </tr>
            </thead>
            <tbody>
              {/* 입고 내역 */}
              {selectedDetail?.items
                ?.filter((item: any) => item && item.prodNm !== '없음' && item.unitPrice !== null && item.quantity !== null && item.amount !== null)
                ?.map((item: any, index: number) => (
                  <React.Fragment key={index}>
                    <tr className="groupTit">
                      <td colSpan={4}>{item.prodNm}</td>
                    </tr>
                    <tr className="groupRow">
                      <td></td>
                      <td className="agnC">{formatNumberWithCommas(item.unitPrice)}</td>
                      <td className="agnC">{item.quantity}</td>
                      <td className="agnR">{formatNumberWithCommas(item.amount)}</td>
                    </tr>
                  </React.Fragment>
                ))}

              {/* 합계 영역 */}
              <tr className="tfoot">
                <td className="agnC">--- 입고소계 ---</td>
                <td className="agnR">{selectedDetail?.items?.length}건</td>
                <td className="agnC">{selectedDetail?.totCnt}</td>
                <td className="agnR">{formatNumberWithCommas(selectedDetail?.totAmt)}</td>
              </tr>
            </tbody>
          </table>

          {/* 금액 정보 */}
          <dl>
            <dt>현금지급</dt>
            <dd>{formatNumberWithCommas(selectedDetail?.cashAmt || 0)}</dd>
            <dt>통장지급</dt>
            <dd>{formatNumberWithCommas(selectedDetail?.accountAmt || 0)}</dd>
            <dt>외상금액</dt>
            <dd>{formatNumberWithCommas(selectedDetail?.onCreditAmt || 0)}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default ReceivingHistoryLayout;
