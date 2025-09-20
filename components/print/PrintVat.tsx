import React from 'react';
import dayjs from 'dayjs';

interface Props {
  selectedDetail?: any;
}
const PrintVat = ({ selectedDetail }: Props) => {
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
            <li>{dayjs(selectedDetail?.workYmd).format('YYYY-MM-DD(ddd)')}</li>
            <li>{selectedDetail?.lastWorkYmd ? '입금' : '청구'}</li>
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
                      <strong>대상기간</strong>
                      <span>{`${selectedDetail?.vatStrYmd} ~ ${selectedDetail?.vatEndYmd}`}</span>
                    </li>
                    <li>
                      <strong>청구일자</strong>
                      <span>{selectedDetail?.workYmd}</span>
                    </li>
                    <li className="lastLi">
                      <strong>청구금액</strong>
                      <span>{formatNumberWithCommas(selectedDetail?.vatAmt)}</span>
                    </li>
                    {selectedDetail?.lastWorkYmd ? (
                      <>
                        <li>
                          <strong>입금일자</strong>
                          <span>{selectedDetail?.lastWorkYmd}</span>
                        </li>
                        <li>
                          <strong>통장입금</strong>
                          <span>{formatNumberWithCommas(selectedDetail?.vatAccountAmt)}</span>
                        </li>
                        <li>
                          <strong>현금입금</strong>
                          <span>{formatNumberWithCommas(selectedDetail?.vatCashAmt)}</span>
                        </li>
                        <li>
                          <strong>할인금액</strong>
                          <span>{formatNumberWithCommas(selectedDetail?.vatDcAmt)}</span>
                        </li>
                      </>
                    ) : (
                      ''
                    )}
                    <li>
                      <strong>입금잔액</strong>
                      <span>{formatNumberWithCommas(selectedDetail?.vatNowAmt)}</span>
                    </li>
                  </ul>
                  {selectedDetail?.etcPrnYn === 'Y' && selectedDetail?.etcCntn !== null && selectedDetail?.etcCntn !== '' ? (
                    <span className="etcArea">{selectedDetail?.etcCntn}</span>
                  ) : (
                    ''
                  )}
                  {selectedDetail?.sub?.etcPrnYn === 'Y' && selectedDetail?.sub?.etcCntn !== null && selectedDetail?.sub?.etcCntn !== '' ? (
                    <span className="etcArea">{selectedDetail?.sub?.etcCntn}</span>
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

export default PrintVat;
