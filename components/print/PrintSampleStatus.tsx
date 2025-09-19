import React from 'react';
import dayjs from 'dayjs';

interface Props {
  selectedDetail?: any;
}

const PrintSampleStatus = ({ selectedDetail }: Props) => {
  console.log('PrintSampleStatus Props ===>>', selectedDetail);
  return (
    <div className="chitBox state">
      <div className="header">
        <h4>
          <span>샘플 현황</span>
          {selectedDetail?.sellerNm}
        </h4>
        <ul className="info">
          <li>{'전표번호:' + selectedDetail?.chitNo}</li>
          <li>
            샘플일자
            <br />
            {selectedDetail?.workYmdFormated}
          </li>
          <li>{dayjs(selectedDetail?.tranDate).format('YY-MM-DD(ddd) HH:mm:ss')}</li>
        </ul>
      </div>
      <div className="container">
        <table>
          <colgroup>
            <col width="*" />
            <col width="10%" />
            <col width="30%" />
            <col width="30%" />
          </colgroup>
          <thead>
            <tr>
              <th>상품명</th>
              <th>수량</th>
              <th>영업일자</th>
              <th>회수일시</th>
            </tr>
          </thead>
          <tbody>
            {/* 미회수 */}
            {selectedDetail?.sampleNotReturnCount !== 0 ? (
              <>
                {selectedDetail?.sampleNotReturnList.map((item: any, index: number) => {
                  return (
                    <React.Fragment key={`${index}-NotReturn`}>
                      <tr className="groupTit">
                        <td colSpan={4}>{item.skuNm}</td>
                      </tr>
                      <tr className="groupRow">
                        <td></td>
                        <td className="agnC">{item.sampleCnt}</td>
                        <td>{item.workYmdFormated}</td>
                        <td></td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr>
                  <th>미회수</th>
                  <th>{selectedDetail?.sampleNotReturnCount}</th>
                  <th colSpan={2}></th>
                </tr>
              </>
            ) : (
              ''
            )}
            {/* 회수 */}
            {selectedDetail?.sampleReturnCount !== 0 ? (
              <>
                {selectedDetail?.sampleReturnList.map((item: any, index: number) => {
                  return (
                    <React.Fragment key={`${index}-Return`}>
                      <tr className="groupTit">
                        <td colSpan={3}>{item.skuNm}</td>
                        <td>{dayjs(item?.tranDate).format('YY-MM-DD(ddd)') || ''}</td>
                      </tr>
                      <tr className="groupRow">
                        <td></td>
                        <td className="agnC">{item.sampleCnt}</td>
                        <td>{item.workYmdFormated}</td>
                        <td style={{ paddingLeft: '10pt' }}>{dayjs(item?.tranTm).format('HH:mm:ss') || ''}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr>
                  <th>회수</th>
                  <th>{selectedDetail?.sampleReturnCount}</th>
                  <th colSpan={2}></th>
                </tr>
              </>
            ) : (
              ''
            )}
            {/* 샘플결제 */}
            {selectedDetail?.sampleSailCount !== 0 ? (
              <>
                <tr>
                  <th>샘플결제</th>
                  <th>{selectedDetail?.sampleSailCount}</th>
                  <th colSpan={2}></th>
                </tr>
                {selectedDetail?.sampleSailList.map((item: any, index: number) => {
                  return (
                    <React.Fragment key={`${index}-Sail`}>
                      <tr className="groupTit">
                        <td colSpan={4}>{item.skuNm}</td>
                      </tr>
                      <tr className="groupRow">
                        <td></td>
                        <td className="agnC">{item.sampleCnt}</td>
                        <td>{item.workYmdFormated}</td>
                        <td>{dayjs(selectedDetail?.tranDate).format('YYYY-MM-DD') || ''}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </>
            ) : (
              ''
            )}
          </tbody>
          <tfoot>
            <tr>
              <th className="agnC">합계</th>
              <th>{selectedDetail?.sampleNotReturnCount + selectedDetail?.sampleReturnCount}</th>
              <th colSpan={2}></th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PrintSampleStatus;
