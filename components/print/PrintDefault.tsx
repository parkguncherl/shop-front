import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Utils } from '../../libs/utils';

interface Props {
  selectedDetail?: any;
  type: string;
}

const PrintDefault = ({ selectedDetail, type }: Props) => {
  console.log('PrintDefault ===>', type, selectedDetail);
  const [amountAreaHide, setAmountAreaHide] = useState<boolean>(false);
  useEffect(() => {
    // 전잔,당일합계,잔액 숨김
    const hiddenTypes = ['collected', 'notCollected', 'shipped'];
    if (type && hiddenTypes.includes(type)) {
      setAmountAreaHide(true);
    }
  }, [type]);

  // 콤마추가
  const formatNumberWithCommas = (number: number) => {
    return number?.toLocaleString();
  };
  const getTypeLabel = (type: string, selectedDetail: any) => {
    //console.log('getTypeLabel ==>', type, selectedDetail);
    const typeLabels: { [key: string]: string } = {
      sample: '샘플',
      collected: '회수',
      notCollected: '미회수',
      shipped: '미송분 발송',
      notShipped: '미발송',
      boryu: '', // 빈 문자열 그대로 반환
      factoryStock: '입고',
      factoryPay: '결제',
      factoryOut: '반출',
      factoryRepair: '수선입고',
      receivingHistoryB: '청구',
      receivingHistoryC: '예정',
      receivingHistoryD: '반출',
      receivingHistoryE: '청구',
      receivingHistoryF: '반출',
    };

    // type이 typeLabels에 있으면 그 값을 반환하고, 없으면 payType 반환
    return type in typeLabels ? typeLabels[type] : selectedDetail?.payType || '';
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

  const firstLeftDate = selectedDetail?.workYmd
    ? dayjs(selectedDetail?.workYmd).format('YYYY-MM-DD(ddd)')
    : dayjs(selectedDetail?.inputDate).format('YYYY-MM-DD(ddd)');

  const firstLeftDateWrite =
    type === 'collected' && selectedDetail?.sampleInfo.maxReturnFormated
      ? dayjs(selectedDetail?.sampleInfo.maxReturnFormated).format('YYYY-MM-DD(ddd)')
      : type === 'shipped' || type === 'notShipped'
      ? dayjs(selectedDetail?.workYmd).format('YYYY-MM-DD(ddd)')
      : firstLeftDate;

  // 렌더링 부분
  const displayDate = (() => {
    if (type === 'shipped') {
      return Utils.formatFullDate(selectedDetail?.maxSendDate);
    }
    if (type === 'majang') {
      return Utils.formatFullDate(selectedDetail?.workYmd);
    }
    if (type === 'notCollected') {
      return '';
    }
    return Utils.formatFullDate(selectedDetail?.inputDate);
  })();

  const renderBalanceSection = () => {
    if (type === 'factoryStock' || type === 'factoryOut' || type === 'factoryRepair') {
      const lastSettle = selectedDetail?.factorySettleList?.at(-1);
      return (
        <dl>
          <dt>전잔</dt>
          <dd>{formatNumberWithCommas(lastSettle?.beforeBalance || 0)}</dd>
          <dt>당일합계</dt>
          <dd>{formatNumberWithCommas(lastSettle?.receivingAmt)}</dd>
          <dt>잔액</dt>
          <dd>{formatNumberWithCommas(lastSettle?.currentBalance)}</dd>
        </dl>
      );
    } else if (selectedDetail?.payType === '매장' || selectedDetail?.payType === '매장분요청') {
      return '';
    } else {
      return (
        <dl>
          <dt>전잔</dt>
          <dd>{formatNumberWithCommas(selectedDetail?.previousBalance)}</dd>
          <dt>당일합계</dt>
          <dd>
            {plusMinus}
            {formatNumberWithCommas(
              selectedDetail?.dailyTotal ? (selectedDetail?.delYn === 'Y' ? 0 : selectedDetail?.dailyTotal) : selectedDetail?.onCreditAmt,
            )}
          </dd>
          <dt>잔액</dt>
          <dd>{formatNumberWithCommas(selectedDetail?.currentBalance)}</dd>
        </dl>
      );
    }
  };

  return (
    <div className="printData">
      <div className="chitBox">
        <div className="header">
          <h4>
            {/* 생산처결제 */}
            {type === 'factoryStock' || type === 'factoryOut' || type === 'factoryRepair' ? (
              selectedDetail?.factorySettleList[0].factoryNm
            ) : type === 'receivingHistoryB' ||
              type === 'receivingHistoryD' ||
              type === 'receivingHistoryE' ||
              type === 'receivingHistoryF' ||
              type === 'receivingHistoryC' ? ( // 입고내역
              // 입고내역
              selectedDetail?.factoryNm
            ) : (
              <>{selectedDetail?.sellerName ? selectedDetail?.sellerName : selectedDetail?.sellerNm}</>
            )}
          </h4>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr>
                {![
                  'factoryStock',
                  'factoryOut',
                  'factoryRepair',
                  'receivingHistoryB',
                  'receivingHistoryD',
                  'receivingHistoryE',
                  'receivingHistoryF',
                  'receivingHistoryC',
                ].includes(type) && (
                  <td style={{ textAlign: 'left', fontSize: '10pt' }}>{type === 'boryu' ? '확인용' : `전표번호: ${selectedDetail?.chitNo ?? ''}`}</td>
                )}
                <td colSpan={2} style={{ textAlign: 'right', fontSize: '10pt' }}>
                  {displayDate}
                </td>
              </tr>
            </tbody>
          </table>
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
                <th align={'left'}>{firstLeftDateWrite}</th>
                <th colSpan={3} align="right">
                  {formatNumberWithCommas(selectedDetail?.orderItemSaleAmt)} {getTypeLabel(type, selectedDetail)}
                </th>
              </tr>
              <tr>
                <th>품명</th>
                <th>단가</th>
                <th>수량</th>
                <th>{getThTitle()}</th>
              </tr>
            </thead>
            <tbody>
              {selectedDetail?.payType === '매장' ? (
                <>
                  {selectedDetail?.orderItemSaleList.map((item: any, index: number) => (
                    <React.Fragment key={`${item.prodId}-${index}`}>
                      <tr className="groupTit">
                        <td colSpan={4}>{item.orderDetCd === '99' ? `※ ${item.productName}` : item.productName}</td>
                      </tr>
                      <tr className="groupRow">
                        <td></td>
                        <td className="agnC">{formatNumberWithCommas(item.unitPrice)}</td>
                        <td className="agnC">{item.quantity}</td>
                        <td className="agnR">{formatNumberWithCommas(item.amount)}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                  <tr className="tfoot">
                    <td className="agnC">--- 매장소계 ---</td>
                    <td className="agnR">{selectedDetail?.orderItemSaleCnt}건</td>
                    <td className="agnC">{selectedDetail?.orderItemSaleQnt}</td>
                    <td className="agnR">{formatNumberWithCommas(selectedDetail?.orderItemSaleAmt)}</td>
                  </tr>
                </>
              ) : selectedDetail?.payType === '매장분요청' ? (
                <>
                  {selectedDetail?.maejangList.map((item: any, index: number) => (
                    <React.Fragment key={`${item.skuId}-${index}`}>
                      <tr className="groupTit">
                        <td colSpan={4}>{item.skuNm}</td>
                      </tr>
                      <tr className="groupRow">
                        <td></td>
                        <td className="agnC">{formatNumberWithCommas(item.sellAmt)}</td>
                        <td className="agnC">{item.orderCnt}</td>
                        <td className="agnR">{formatNumberWithCommas(item.totAmt)}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                  <tr className="tfoot">
                    <td className="agnC">--- 매장소계 ---</td>
                    <td className="agnR">{selectedDetail?.skuCnt}건</td>
                    <td className="agnC">{selectedDetail?.totCount}</td>
                    <td className="agnR">{formatNumberWithCommas(selectedDetail?.totAmt)}</td>
                  </tr>
                </>
              ) : selectedDetail?.orderItemSaleList?.length > 0 ? (
                <>
                  {selectedDetail?.orderItemSaleList.map((item: any, index: number) => (
                    <React.Fragment key={`${item.prodId}-${index}`}>
                      <tr className="groupTit">
                        <td colSpan={4}>{item.orderDetCd === '99' ? `※ ${item.productName}` : item.productName}</td>
                      </tr>
                      <tr className="groupRow">
                        <td></td>
                        <td className="agnC">{formatNumberWithCommas(item.unitPrice)}</td>
                        <td className="agnC">{item.quantity}</td>
                        <td className="agnR">{formatNumberWithCommas(item.amount)}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                  <tr className="tfoot">
                    <td className="agnC">--- 판매소계 ---</td>
                    <td className="agnR">{selectedDetail?.orderItemSaleCnt}건</td>
                    <td className="agnC">{selectedDetail?.orderItemSaleQnt}</td>
                    <td className="agnR">{formatNumberWithCommas(selectedDetail?.orderItemSaleAmt)}</td>
                  </tr>
                </>
              ) : (
                <></> // 구현할게 없다.
              )}

              {
                // 반품
                selectedDetail?.orderItemReturnList && selectedDetail?.orderItemReturnList.length !== 0 ? (
                  <>
                    {selectedDetail?.orderItemReturnList?.map((item: any, index: number) => (
                      <React.Fragment key={`${item.prodId}-${index}`}>
                        <tr className="groupTit">
                          <td colSpan={4}>{item.productName}</td>
                        </tr>
                        <tr className="groupRow">
                          <td></td>
                          <td className="agnC">-{formatNumberWithCommas(item.unitPrice)}</td>
                          <td className="agnC">-{item.quantity}</td>
                          <td className="agnR">-{formatNumberWithCommas(item.amount)}</td>
                        </tr>
                      </React.Fragment>
                    ))}
                    <tr className="tfoot">
                      <td className="agnC">--- 반품소계 ---</td>
                      <td className="agnR">{selectedDetail?.orderItemReturnCnt}건</td>
                      <td className="agnC">{selectedDetail?.orderItemReturnQnt}</td>
                      <td className="agnR">{formatNumberWithCommas(selectedDetail?.orderItemReturnAmt)}</td>
                    </tr>
                  </>
                ) : (
                  ''
                )
              }
              {/* 샘플 */}
              {type === 'sample' ? (
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
              ) : (
                ''
              )}
              {/* 샘플 회수 */}
              {type === 'collected' ? (
                <>
                  {selectedDetail?.sampleInfo?.sampleReturnCount !== 0 ? (
                    <>
                      {selectedDetail?.sampleInfo?.sampleReturnList?.map((item: any, index: number) => (
                        <React.Fragment key={`${index}-Return`}>
                          <tr className="groupTit">
                            <td colSpan={4}>{item.skuNm}</td>
                          </tr>
                          <tr className="groupRow">
                            <td></td>
                            <td className="agnC">{formatNumberWithCommas(item.baseAmt)}</td>
                            <td className="agnC">{item.sampleCnt}</td>
                            <td className="agnC">{item?.workYmdFormated || ''}</td>
                          </tr>
                        </React.Fragment>
                      ))}
                      <tr className="tfoot">
                        <td className="agnC">--- 회수소계 ---</td>
                        <td className="agnC">{selectedDetail?.sampleInfo.sampleReturnCount || 0}건</td>
                        <td className="agnC"></td>
                        <td className="agnR">{formatNumberWithCommas(selectedDetail?.sampleInfo.sampleReturnAmt)}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan={4} className="agnC">
                        샘플 회수 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                ''
              )}
              {/* 샘플 미회수 */}
              {type === 'notCollected' || type === 'collected' ? (
                <>
                  {selectedDetail?.sampleInfo?.sampleNotReturnList.length !== 0 ? (
                    <>
                      {selectedDetail?.sampleInfo?.sampleNotReturnList?.map((item: any, index: number) => (
                        <React.Fragment key={`${index}-NotCollected`}>
                          <tr className="groupTit">
                            <td colSpan={4}>{item.skuNm}</td>
                          </tr>
                          <tr className="groupRow">
                            <td></td>
                            <td className="agnC">{formatNumberWithCommas(item.baseAmt)}</td>
                            <td className="agnC">{item.sampleNotReturnCnt}</td>
                            <td className="agnC">{item.workYmdFormated}</td>
                          </tr>
                        </React.Fragment>
                      ))}
                      <tr className="tfoot">
                        <td className="agnC">--- 미회수소계 ---</td>
                        <td className="agnC">{selectedDetail?.sampleNotCollected?.sampleNotCollectedList.length}건</td>
                        <td className="agnC">{selectedDetail?.sampleNotCollected?.totSkuCnt}</td>
                        <td className="agnR">{formatNumberWithCommas(selectedDetail?.sampleNotCollected?.totOrderAmt)}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan={4} className="agnC">
                        샘플 회수 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                ''
              )}
              {/* 발송 */}
              {type === 'shipped' ? (
                <>
                  {(selectedDetail?.shippedItems?.length > 0 || selectedDetail?.notShippedItems?.length > 0) && (
                    <>
                      {/* 발송 아이템 목록 */}
                      {selectedDetail?.shippedItems?.length > 0 ? (
                        <>
                          {selectedDetail.shippedItems.map((item: any, index: number) => (
                            <React.Fragment key={`shippedItems-${index}`}>
                              <tr className="groupTit">
                                <td colSpan={4}>{item.skuNm}</td>
                              </tr>
                              <tr className="groupRow">
                                <td></td>
                                <td className="agnC">{formatNumberWithCommas(item.unitPrice)}</td>
                                <td className="agnC">{item.quantity}</td>
                                <td className="agnC">{dayjs(item.shippingDate).format('YY-MM-DD(ddd)') || ''}</td>
                              </tr>
                            </React.Fragment>
                          ))}
                          <tr className="tfoot">
                            <td className="agnC">--- 발송 소계 ---</td>
                            <td className="agnR">{selectedDetail.shippedItems.length}건</td>
                            <td className="agnC">{selectedDetail.shippedCount}</td>
                            <td className="agnR">{formatNumberWithCommas(selectedDetail?.shippedAmt)}</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan={4} className="agnC">
                            발송 내역이 없습니다.
                          </td>
                        </tr>
                      )}
                      {/* 미발송 아이템 목록 */}
                      {selectedDetail?.notShippedItems?.length > 0 && (
                        <>
                          {selectedDetail.notShippedItems.map((item: any, index: number) => (
                            <React.Fragment key={`notShippedItems-${index}`}>
                              <tr className="groupTit">
                                <td colSpan={4}>{item.skuNm}</td>
                              </tr>
                              <tr className="groupRow">
                                <td></td>
                                <td className="agnC">{formatNumberWithCommas(item.unitPrice)}</td>
                                <td className="agnC">{item.quantity}</td>
                                <td className="agnC">{dayjs(selectedDetail?.inputDate).format('YYYY-MM-DD') || ''}</td>
                              </tr>
                            </React.Fragment>
                          ))}
                          <tr className="tfoot">
                            <td className="agnC">--- 미발송 소계 ---</td>
                            <td className="agnR">{selectedDetail.notShippedItems.length}건</td>
                            <td className="agnC">{selectedDetail.notShippedCount}</td>
                            <td className="agnR">{formatNumberWithCommas(selectedDetail?.notShippedAmt)}</td>
                          </tr>
                        </>
                      )}
                    </>
                  )}
                </>
              ) : (
                ''
              )}
              {/* 미발송 */}
              {type === 'notShipped' && selectedDetail?.notShippedItems?.length > 0 && (
                <>
                  {selectedDetail.notShippedItems.map((item: any, index: number) => (
                    <React.Fragment key={`notShippedItems-${index}`}>
                      <tr className="groupTit">
                        <td colSpan={4}>{item.skuNm}</td>
                      </tr>
                      <tr className="groupRow">
                        <td></td>
                        <td className="agnC">{formatNumberWithCommas(item.unitPrice)}</td>
                        <td className="agnC">{item.quantity}</td>
                        <td className="agnC">{formatNumberWithCommas(item.amount)}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                  <tr className="tfoot">
                    <td className="agnC">--- 미발송 소계 ---</td>
                    <td className="agnR">{selectedDetail.notShippedItems.length}건</td>
                    <td className="agnC">{selectedDetail.notShippedCount}</td>
                    <td className="agnR">{formatNumberWithCommas(selectedDetail?.notShippedAmt)}</td>
                  </tr>
                </>
              )}

              {/* 보류 */}
              {type === 'boryu' ? (
                <>
                  {selectedDetail?.orderItems && selectedDetail?.orderItems.length > 0 ? (
                    <>
                      {selectedDetail?.orderItems.map((item: any, index: number) => (
                        <React.Fragment key={`${item.id}-${index}`}>
                          <tr className="groupTit">
                            <td colSpan={4}>{item.orderDetCd === '99' ? `※ ${item.skuNm}` : item.skuNm}</td>
                          </tr>
                          <tr className="groupRow">
                            <td></td>
                            <td className="agnC">{formatNumberWithCommas(item.unitPrice)}</td>
                            <td className="agnC">{item.quantity}</td>
                            <td className="agnR">{formatNumberWithCommas(item.amount)}</td>
                          </tr>
                        </React.Fragment>
                      ))}
                      <tr className="tfoot">
                        <td className="agnC">--- 판매소계 ---</td>
                        <td className="agnR">{selectedDetail?.orderItems.length}건</td>
                        <td className="agnC">{selectedDetail?.totSkuCnt}</td>
                        <td className="agnR">{formatNumberWithCommas(selectedDetail?.totOrderAmt)}</td>
                      </tr>
                    </>
                  ) : (
                    ''
                  )}
                </>
              ) : (
                ''
              )}
              {/* 생산처결제 */}
              {type === 'factoryStock' || type === 'factoryOut' || type === 'factoryRepair' ? (
                <>
                  {selectedDetail?.factorySettleList.map((item: any, index: number) => (
                    <React.Fragment key={`${index}-factory`}>
                      <tr className="groupTit">
                        <td colSpan={4}>{item.skuNm}</td>
                      </tr>
                      <tr className="groupRow">
                        <td></td>
                        <td className="agnC">{formatNumberWithCommas(item.gagongAmt)}</td>
                        <td className="agnC">{item.totCnt}</td>
                        <td className="agnR">{formatNumberWithCommas(parseInt(item.totAmt))}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                  <tr className="tfoot">
                    <td className="agnC">--- {selectedDetail?.factorySettleList[0].inOutType} 소계 ---</td>
                    <td className="agnC">{selectedDetail?.factorySettleList.length}건</td>
                    <td className="agnC">{selectedDetail?.factorySettleList.at(-1)?.receivingCnt}</td>
                    <td className="agnR">{formatNumberWithCommas(selectedDetail?.factorySettleList.at(-1)?.receivingAmt)}</td>
                  </tr>
                </>
              ) : (
                ''
              )}
              {/* 입고내역 */}
              {type === 'receivingHistoryB' ||
              type === 'receivingHistoryD' ||
              type === 'receivingHistoryE' ||
              type === 'receivingHistoryF' ||
              type === 'receivingHistoryC' ? (
                <>
                  {selectedDetail?.receivingHistoryList?.map((item: any, index: number) => (
                    <React.Fragment key={`${index}-factory`}>
                      <tr className="groupTit">
                        <td colSpan={4}>{item.skuNm}</td>
                      </tr>
                      <tr className="groupRow">
                        <td></td>
                        <td className="agnC">{formatNumberWithCommas(item.unitPrice)}</td>
                        <td className="agnC">
                          {plusMinus}
                          {item.quantity}
                        </td>
                        <td className="agnR">
                          {plusMinus}
                          {formatNumberWithCommas(item.amount)}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                  <tr className="tfoot">
                    <td className="agnC">--- {selectedDetail?.inOutTypeNm} 소계 ---</td>
                    <td className="agnC">{selectedDetail?.receivingHistoryList?.length}건</td>
                    <td className="agnC">
                      {plusMinus}
                      {selectedDetail?.totCnt}
                    </td>
                    <td className="agnR">
                      {plusMinus}
                      {formatNumberWithCommas(selectedDetail?.totAmt)}
                    </td>
                  </tr>
                </>
              ) : (
                ''
              )}
            </tbody>
          </table>
          {!amountAreaHide ? renderBalanceSection() : ''}
        </div>
      </div>
    </div>
  );
};

export default PrintDefault;
