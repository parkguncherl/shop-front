import React from 'react';
import dayjs from 'dayjs';

interface Props {
  selectedDetail?: any;
}

const PrintMisongStatus = ({ selectedDetail }: Props) => {
  console.log('PrintDefault PrintMisongStatus selectedDetail ===>', selectedDetail);
  return (
    <div className="chitBox state">
      <div className="header">
        <h4>{selectedDetail?.sellerNm}</h4>
        <ul className="info">
          <li>{selectedDetail?.chitNo}</li>
          <li>
            미송일자
            <br />
            {dayjs(selectedDetail?.inputDate).format('YY-MM-DD(ddd)')}
          </li>
          <li>{dayjs(selectedDetail?.inputDate).format('MM-DD HH:mm:ss')}</li>
        </ul>
      </div>
      <div className="container">
        <table>
          <colgroup>
            <col width="*" />
            <col width="10%" />
            <col width="30%" />
            <col width="35%" />
          </colgroup>
          <thead>
            <tr>
              <th>상품명</th>
              <th>수량</th>
              <th>발송일자</th>
              <th>발송일시</th>
            </tr>
          </thead>
          <tbody>
            {/* 발송 */}
            {selectedDetail?.shippedCount && selectedDetail?.shippedCount > 0 ? (
              <>
                {selectedDetail?.shippedItems?.map((item: any, index: number) => {
                  return (
                    <React.Fragment key={`${index}-shippedItems`}>
                      <tr className="groupTit">
                        <td colSpan={4}>{item.skuNm}</td>
                      </tr>
                      <tr className="groupRow">
                        <td></td>
                        <td className="agnC">{item.quantity}</td>
                        <td>{item.tranYmd ? dayjs(item.tranYmd).format('YY-MM-DD(ddd)') || '' : ''}</td>
                        <td>{item.inputDate ? dayjs(item.inputDate).format('MM-DD(ddd) HH:mm') || '' : ''}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr className="groupWrap">
                  <th>발송</th>
                  <th>{selectedDetail?.shippedCount}</th>
                  <th colSpan={2}></th>
                </tr>
              </>
            ) : (
              ''
            )}
            {/* 미발송 */}
            {selectedDetail?.notShippedCount && selectedDetail?.notShippedCount > 0 ? (
              <>
                {selectedDetail?.notShippedItems?.map((item: any, index: number) => {
                  return (
                    <React.Fragment key={`${index}-notShippedItems`}>
                      <tr className="groupTit">
                        <td colSpan={4}>{item.skuNm}</td>
                      </tr>
                      <tr className="groupRow">
                        <td></td>
                        <td className="agnC">{item.quantity}</td>
                        <td></td>
                        <td></td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr className="groupWrap">
                  <th>미발송</th>
                  <th>{selectedDetail?.notShippedCount}</th>
                  <th colSpan={2}></th>
                </tr>
              </>
            ) : (
              ''
            )}
          </tbody>
          <tfoot>
            <tr>
              <th className="agnC">합계</th>
              <th>{selectedDetail?.notShippedCount + selectedDetail?.shippedCount}</th>
              <th colSpan={2}></th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PrintMisongStatus;
