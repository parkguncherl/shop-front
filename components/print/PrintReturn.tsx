import React from 'react';
import dayjs from 'dayjs';

interface Props {
  selectedDetail?: any;
}

const PrintReturn = ({ selectedDetail }: Props) => {
  return (
    <div className="chitBox return">
      <div className="header">
        <h4>
          <span>매장분 반납</span>
          {selectedDetail?.sellerNm}
        </h4>
        <ul className="info">
          <li>
            <strong>반납일자</strong>
            {dayjs(selectedDetail?.tranTm).format('YY-MM-DD(ddd)')}
          </li>
        </ul>
      </div>
      <div className="container">
        <table>
          <colgroup>
            <col width="*" />
            <col width="25%" />
            <col width="25%" />
          </colgroup>
          <thead>
            <tr>
              <th>상품명</th>
              <th>반납확정</th>
              <th>반납완료</th>
            </tr>
          </thead>
          <tbody>
            {/* 반납확정 */}
            {selectedDetail?.inboundList.length !== 0 ? (
              <>
                <tr className="groupWrap">
                  <th colSpan={3} className="agnL">
                    &nbsp;&nbsp;&nbsp;&nbsp;반납확정
                  </th>
                </tr>
                {selectedDetail?.inboundList?.map((item: any, index: number) => {
                  return (
                    <React.Fragment key={`${index}-inboundList`}>
                      <tr className="groupTit">
                        <td colSpan={4}>{item.skuNm}</td>
                      </tr>
                      <tr className="groupRow">
                        <td></td>
                        <td className="agnC">{item.skuCnt}</td>
                        <td className="agnC">{item.stockCnt}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr className="groupFooter">
                  <th>확정 소계</th>
                  <th>{selectedDetail?.inboundListFinalCnt}</th>
                  <th>{selectedDetail?.inboundListFinishCnt}</th>
                </tr>
              </>
            ) : (
              ''
            )}
            {/* 수정완료 */}
            {selectedDetail?.editList.length !== 0 ? (
              <>
                <tr className="groupWrap">
                  <th colSpan={3} className="agnL">
                    &nbsp;&nbsp;&nbsp;&nbsp;수정완료
                  </th>
                </tr>
                {selectedDetail?.editList?.map((item: any, index: number) => {
                  return (
                    <React.Fragment key={`${index}-editList`}>
                      <tr className="groupTit">
                        <td colSpan={4}>{item.skuNm}</td>
                      </tr>
                      <tr className="groupRow">
                        <td></td>
                        <td className="agnC">{item.skuCnt}</td>
                        <td className="agnC">{item.stockCnt}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr className="groupFooter">
                  <th>수정 소계</th>
                  <th>{selectedDetail?.editListFinalCnt}</th>
                  <th>{selectedDetail?.editListFinishCnt}</th>
                </tr>
              </>
            ) : (
              ''
            )}
            {/* 반납완료 */}
            {selectedDetail?.returnList.length !== 0 ? (
              <>
                <tr className="groupWrap">
                  <th colSpan={3} className="agnL">
                    &nbsp;&nbsp;&nbsp;&nbsp;반납완료
                  </th>
                </tr>
                {selectedDetail?.returnList?.map((item: any, index: number) => {
                  return (
                    <React.Fragment key={`${index}-returnList`}>
                      <tr className="groupTit">
                        <td colSpan={4}>{item.skuNm}</td>
                      </tr>
                      <tr className="groupRow">
                        <td></td>
                        <td className="agnC">{item.skuCnt}</td>
                        <td className="agnC">{item.stockCnt}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr className="groupFooter">
                  <th>완료 소계</th>
                  <th>{selectedDetail?.returnListFinalCnt}</th>
                  <th>{selectedDetail?.returnListFinishCnt}</th>
                </tr>
              </>
            ) : (
              ''
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintReturn;
