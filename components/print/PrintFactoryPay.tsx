import React from 'react';
import dayjs from 'dayjs';

interface Props {
  selectedDetail?: any;
}
const PrintFactoryPay = ({ selectedDetail }: Props) => {
  // 콤마추가
  const formatNumberWithCommas = (number: number) => {
    return number?.toLocaleString();
  };

  return (
    <div className="printData">
      <div className="chitBox">
        <div className="header">
          <h4>{selectedDetail?.factoryNm ? selectedDetail?.factoryNm : selectedDetail?.factorySettleList?.[0].factoryNm}</h4>
          <ul className="info">
            <li>{dayjs(selectedDetail?.workYmd ? selectedDetail?.workYmd : selectedDetail?.factorySettleList?.[0].workYmd).format('YYYY-MM-DD(ddd)')}</li>
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
                      <strong>지급일자</strong>
                      <span>{selectedDetail?.tranYmd ? selectedDetail?.tranYmd : selectedDetail?.factorySettleList?.[0].tranYmd}</span>
                    </li>
                    <li className="lastLi">
                      <strong>대상기간</strong>
                      <span>{selectedDetail?.workYmd ? selectedDetail?.workYmd : selectedDetail?.factorySettleList?.[0].workYmd}</span>
                    </li>

                    <li>
                      <strong>예정금액</strong>
                      <span>
                        {formatNumberWithCommas(selectedDetail?.onCreditAmt ? selectedDetail?.onCreditAmt : selectedDetail?.factorySettleList?.[0].onCreditAmt)}
                      </span>
                    </li>
                    <li>
                      <strong>현금지급</strong>
                      <span>
                        {formatNumberWithCommas(selectedDetail?.cashPayAmt ? selectedDetail?.cashPayAmt : selectedDetail?.factorySettleList?.[0].cashPayAmt)}
                      </span>
                    </li>
                    <li>
                      <strong>통장지급</strong>
                      <span>
                        {formatNumberWithCommas(
                          selectedDetail?.accountPayAmt ? selectedDetail?.accountPayAmt : selectedDetail?.factorySettleList?.[0].accountPayAmt,
                        )}
                      </span>
                    </li>
                    <li>
                      <strong>할인금액</strong>
                      <span>
                        {formatNumberWithCommas(selectedDetail?.settleDcAmt ? selectedDetail?.settleDcAmt : selectedDetail?.factorySettleList?.[0].settleDcAmt)}
                      </span>
                    </li>
                    <li>
                      <strong>결제잔액</strong>
                      <span>
                        {formatNumberWithCommas(
                          selectedDetail?.currentBalance ? selectedDetail?.currentBalance : selectedDetail?.factorySettleList?.[0].currentBalance,
                        )}
                      </span>
                    </li>
                  </ul>
                  {selectedDetail?.etcCntn ? (
                    <span className="etcArea">{selectedDetail?.etcCntn}</span>
                  ) : selectedDetail?.factorySettleList?.[0].etcCntn !== null && selectedDetail?.factorySettleList?.[0].etcCntn !== '' ? (
                    <span className="etcArea">{selectedDetail?.factorySettleList?.[0].etcCntn}</span>
                  ) : (
                    ''
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrintFactoryPay;
