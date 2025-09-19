import React from 'react';
import dayjs from 'dayjs';

interface Props {
  selectedDetail?: any;
}
const PrintPay = ({ selectedDetail }: Props) => {
  // 콤마추가
  const formatNumberWithCommas = (number: number) => {
    return number?.toLocaleString();
  };

  return (
    <div className="printData">
      <div className="chitBox">
        <div className="header">
          <h4>{selectedDetail?.sellerNm}</h4>
          <ul className="info">
            <li>{'전표번호: ' + selectedDetail?.chitNo}</li>
            <li>{dayjs(selectedDetail?.workYmd).format('YYYY-MM-DD(ddd)')}</li>
            <li>결제</li>
          </ul>
        </div>
        <div className="container">
          <table>
            <colgroup>
              <col width="35%" />
              <col width="*" />
            </colgroup>
            <tbody>
              <tr>
                <td colSpan={4} className="vatList">
                  <ul>
                    <li>
                      <strong>언제까지</strong>
                      <span>{selectedDetail?.tranYmd}</span>
                    </li>
                    <li>
                      <strong>예정금액</strong>
                      <span>{formatNumberWithCommas(selectedDetail?.totAmt)}</span>
                    </li>
                    <li>
                      <strong>입금금액</strong>
                      <span>{formatNumberWithCommas(selectedDetail?.cashAmt + selectedDetail?.accountAmt)}</span>
                    </li>
                    <li>
                      <strong>할인금액</strong>
                      <span>{formatNumberWithCommas(selectedDetail?.discountAmt)}</span>
                    </li>
                    <li className="lastLi">
                      <strong>결제잔액</strong>
                      <span>{formatNumberWithCommas(selectedDetail?.payAmt)}</span>
                    </li>

                    <li>
                      <strong>현잔액</strong>
                      <span>{formatNumberWithCommas(selectedDetail?.currentBalance)}</span>
                    </li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrintPay;
