import React, { forwardRef } from 'react';
import dayjs from 'dayjs';
import QRCode from '../../pages/system/components/QRCode';

interface Props {
  children?: React.ReactNode;
  selectedDetail?: any;
  isPrinting?: boolean;
  setIsPrinting?: any;
  type?: string;
  className?: string;
  ref?: any;
}

const PrintWmsDefault = forwardRef<HTMLDivElement, Props>(({ selectedDetail, type, children, className }, ref) => {
  return (
    <div className={`printComponent ${className}`} ref={ref}>
      <div className="inner">
        <h4>
          <strong>
            {selectedDetail?.partnerNm} <span>(고객사)</span>
          </strong>
          <strong>
            {selectedDetail?.factoryNm ? (
              <>
                {selectedDetail?.factoryNm}
                <span>(생산처)</span>
              </>
            ) : (
              ''
            )}
          </strong>
        </h4>
        <ul className="header">
          <li>
            <span>{selectedDetail?.printUser}</span>
            <span>{dayjs().format('M/DD (ddd) HH:mm:ss')}</span>
          </li>
        </ul>
        <div className="tblArea">
          <table>
            <colgroup>
              <col width="25%" />
              <col width="25%" />
              <col width="25%" />
              <col width="25%" />
            </colgroup>
            <thead>
              <tr>
                <th colSpan={4} className="agnL">
                  <div className="theadDiv">
                    <span>{selectedDetail?.jobStat}</span>
                    <span>
                      {/* creTm (매장분반납 전용) */}
                      {selectedDetail?.creTm ? dayjs(selectedDetail?.creTm).format('M/DD (ddd) HH:mm:ss') : dayjs(selectedDetail?.workYmd).format('M/DD (ddd)')}
                    </span>
                    <span>{selectedDetail?.asnType}</span>
                  </div>
                </th>
              </tr>
              <tr>
                <th className="agnC" colSpan={2}>
                  상품명
                </th>
                <th>수량</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              {selectedDetail?.detailItems?.length !== 0 ? (
                <>
                  {selectedDetail?.detailItems?.map((item: any, index: number) => {
                    return (
                      <React.Fragment key={`${index}-notShippedItems`}>
                        <tr>
                          <td colSpan={4}>{item.skuNm}</td>
                        </tr>
                        <tr>
                          <td></td>
                          <td></td>
                          <td className="agnC">{item.quantity}</td>
                          <td className="agnC"></td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  <tr className="tfoot">
                    <td className="agnC">품목: {selectedDetail?.prodCnt}</td>
                    <td className="agnR"></td>
                    <td className="agnC">수량: {selectedDetail?.totCnt}</td>
                    <td className="agnR"></td>
                  </tr>
                </>
              ) : (
                ''
              )}
            </tbody>
          </table>
        </div>
        <div className="Qrfooter">
          <ul>
            <li>
              <span>입하 QR</span>
              <QRCode value="111" />
            </li>
            {/*<li>*/}
            {/*  <span>적치 QR</span>*/}
            {/*  <QRCode value="222" />*/}
            {/*</li>*/}
            {/*<li>*/}
            {/*  <span>랙 QR</span>*/}
            {/*  <QRCode value="333" />*/}
            {/*</li>*/}
          </ul>
        </div>
      </div>
    </div>
  );
});
PrintWmsDefault.displayName = 'PrintWmsDefault';
export default PrintWmsDefault;
