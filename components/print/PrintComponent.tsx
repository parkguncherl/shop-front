import React, { forwardRef, useEffect, useState } from 'react';
import dayjs from 'dayjs';

interface Props {
  selectedDetail?: any;
  printData?: any;
  fileUrl?: any;
  type?: string;
  children: React.ReactNode;
  sellerInfoData: any;
  ref?: any;
}

const PrintComponent = forwardRef<HTMLDivElement, Props>(({ selectedDetail, printData, fileUrl, type, children, sellerInfoData }, ref) => {
  console.log('PrintComponent Props printData [' + type + '] >>', selectedDetail, printData);
  const [amountAreaHide, setAmountAreaHide] = useState<boolean>(false);
  const [vatAreaHide, setVatAreaHide] = useState<boolean>(false);
  const [headerAreaHide, setHeaderAreaHide] = useState<boolean>(false);

  // 콤마추가
  const formatNumberWithCommas = (number: number) => {
    return number?.toLocaleString();
  };

  useEffect(() => {
    setAmountAreaHide(false);
    setVatAreaHide(false);
    setHeaderAreaHide(false);
    // 전잔,합계,당잔 숨김
    const hiddenTypes = [
      'vatDeposit',
      'vatBilling',
      'orderState',
      'notCollected',
      'collected',
      'sample',
      'status',
      'pay',
      'orderPay',
      'orderReturn',
      'orderRequest',
      'misong',
      'shipped',
      'notShipped',
      'boryu',
      'return',
      'factoryPay',
      'receivingHistoryA',
      'majang', // 2025-09-13 추가
    ];
    if (type && hiddenTypes.includes(type)) {
      setAmountAreaHide(true);
    }

    // 헤더 숨김
    const headerTypes = ['vatDeposit', 'vatBilling', 'orderState', 'pay', 'orderPay', 'orderReturn', 'orderRequest', 'factoryPay', 'receivingHistoryA'];
    if (type && headerTypes.includes(type)) {
      setHeaderAreaHide(true);
    }

    // 부가세 영역 숨김
    const excludedTypes = [
      'notCollected',
      'collected',
      'sample',
      'pay',
      'orderPay',
      'orderReturn',
      'orderRequest',
      'misong',
      'shipped',
      'notShipped',
      'boryu',
      'return',
      'factoryPay',
      'receivingHistoryA',
    ];
    if (type && excludedTypes.includes(type)) {
      setVatAreaHide(true);
    }
  }, [type]);

  // 영수증 제목
  const typeLabels: Record<string, string[]> = {
    sample: ['샘', '플', '전', '표'],
    status: ['샘', '플', '현', '황'],
    collected: ['회', '수', '전', '표'],
    notCollected: ['미', '회', '수', '내', '역'],
    vatDeposit: ['부', '가', '세', '입', '금'],
    vatBilling: ['부', '가', '세', '청', '구'],
    defaultLabel: ['영', '수', '증'],
    orderState: ['상', '품', '내', '역'],
    orderDefault: ['영', '수', '증'],
    orderSample: ['샘', '플', '전', '표'],
    orderRequest: ['매', '장', '분', '요', '청'],
    orderReturn: ['매', '장', '분', '반', '납'],
    misong: ['미', '송', '현', '황'],
    shipped: ['발', '송', '전', '표'],
    notShipped: ['미', '발', '송', '전', '표'],
    boryu: ['보', '류', '내', '역'],
    return: ['매', '장', '분', '반', '납'],
  };

  // 영수증 타입
  const typeLabel = (type: string | undefined, selectedDetail: any) => {
    const labels: Record<string, string> = {
      sample: '샘플',
      status: '현황',
      collected: '회수',
      notCollected: '미회수',
      vatDeposit: '입금',
      vatBilling: '청구',
      pay: '결제',
      orderRequest: '요청',
      orderReturn: '반납',
      boryu: '',
      return: '반납',
      factoryStock: '입고',
      factoryPay: '결제',
      factoryOut: '반출',
      factoryRepair: '수선입고',
      receivingHistoryA: '결제',
      receivingHistoryB: '청구',
      receivingHistoryC: '입고예정',
      receivingHistoryD: '반출',
      receivingHistoryE: '청구',
      receivingHistoryF: '반출',
    };

    return type ? labels[type] ?? selectedDetail?.payType : selectedDetail?.payType;
  };
  // 영업일:입력일 구분
  const referenceDate =
    type === 'vatDeposit'
      ? selectedDetail?.lastWorkYmd
      : type === 'vatBilling' || type === 'orderState'
      ? selectedDetail?.workYmd
      : type === 'return'
      ? selectedDetail?.tranTm
      : selectedDetail?.inputDate;

  //console.log('타입', type);

  // header 콜그룹
  const renderColGroup = () => {
    if (type === 'return') {
      return (
        <>
          <col width="*" />
          <col width="25%" />
          <col width="25%" />
        </>
      );
    }

    const secondColWidth = '15%';
    const thirdColWidth = type === 'misong' || type === 'shipped' ? '15%' : '15%';
    const fourthColWidth =
      type === 'misong' || type === 'shipped'
        ? '30%' // misong일 경우 25%
        : selectedDetail?.sampleItems // sampleInfo가 있을 경우 30%
        ? '30%'
        : '20%'; // 기본 20%

    return (
      <>
        <col width="*" />
        <col width={secondColWidth} />
        <col width={thirdColWidth} />
        <col width={fourthColWidth} />
      </>
    );
  };

  const renderTrGroup = () => {
    if (type === 'return') {
      // type이 'return'인 경우 col 3개만 렌더링
      return (
        <>
          <th>품명</th>
          <th>반납확정</th>
          <th>반납완료</th>
        </>
      );
    }

    const thirdColText = type === 'misong' || type === 'shipped' ? '수량' : '수량';
    const fourthColText =
      type === 'misong' || type === 'shipped'
        ? '미송일자'
        : type === 'sample' || type === 'status' || type === 'collected' || type === 'notCollected'
        ? '샘플일자'
        : '금액';

    return (
      <>
        <th>품명</th>
        <th>단가</th>
        <th>{thirdColText}</th>
        <th style={{ textAlign: 'center' }}>{fourthColText}</th>
      </>
    );
  };

  return (
    <div className="printComponent" ref={ref}>
      <div className="inner">
        <h4>
          {type && typeLabels[type]
            ? typeLabels[type].map((label, index) => <span key={index}>{label}</span>)
            : typeLabels.defaultLabel.map((label, index) => <span key={index}>{label}</span>)}
        </h4>
        <ul className="header">
          {type === 'orderReturn' || type === 'orderRequest' ? (
            ''
          ) : type === 'return' ? (
            <li></li>
          ) : (
            <li>
              <strong>
                {type === 'factoryStock' || type === 'factoryOut' || type === 'factoryRepair' || type === 'factoryPay' ? ( // 생산처결제
                  <>{selectedDetail?.factorySettleList[0].factoryNm}</>
                ) : type === 'receivingHistoryA' ||
                  type === 'receivingHistoryB' ||
                  type === 'receivingHistoryC' ||
                  type === 'receivingHistoryD' ||
                  type === 'receivingHistoryE' ||
                  type === 'receivingHistoryF' ? ( // 입고내역
                  <>{selectedDetail?.factoryNm}</>
                ) : (
                  <>{selectedDetail?.sellerName ? selectedDetail?.sellerName : selectedDetail?.sellerNm}</>
                )}
              </strong>
              귀하
            </li>
          )}
          <li>
            <span>
              {type === 'orderState' || type === 'boryu' ? (
                '확인용'
              ) : (
                <>
                  {selectedDetail?.chitNo} {selectedDetail?.jangGgiCnt > 0 ? '- 재발행' : ''}
                </>
              )}
            </span>
            <span>{dayjs().format('YYYY-MM-DD HH:mm:ss')}</span>
          </li>
        </ul>
        <div className="titleArea">
          <div
            className={`qrCodeArea ${
              printData?.logoLocCd === 'L' ? 'left' : printData?.logoLocCd === 'C' ? 'center' : printData?.logoLocCd === 'R' ? 'right' : ''
            }`}
          >
            {printData?.logoprintyn === 'Y' ? (
              <>
                <img src={fileUrl} alt="이미지" crossOrigin="anonymous" />
              </>
            ) : (
              ''
            )}
          </div>
          <div className="logoArea">{printData?.titleMng}</div>
          <div className="topMessageArea">{printData?.topMng}</div>
        </div>
        <div className="tblArea">
          <table>
            <colgroup>{renderColGroup()}</colgroup>
            {!headerAreaHide ? (
              <thead>
                <tr>
                  <th className="agnL" colSpan={type === 'misong' ? 2 : undefined}>
                    {(() => {
                      if (selectedDetail.jobType === 'D') {
                        // wms 임
                        return dayjs(selectedDetail?.workYmd).format('YYYY-MM-DD(ddd)');
                      } else if (type === 'collected' || type === 'notCollected' || type === 'sample' || type === 'status') {
                        return (
                          dayjs(selectedDetail?.sampleInfo.workYmd).format('YYYY-MM-DD(ddd)') || dayjs(selectedDetail?.inputDate).format('YYYY-MM-DD(ddd)')
                        );
                      } else {
                        return dayjs(selectedDetail?.inputDate).format('YYYY-MM-DD(ddd)');
                      }
                    })()}
                  </th>
                  {type === 'misong' ? (
                    <th className="agnR"></th>
                  ) : type === 'sample' || type === 'status' || type === 'collected' || type === 'notCollected' ? (
                    <th className="agnR" colSpan={2}></th>
                  ) : (
                    <th className="agnR" colSpan={type === 'return' ? undefined : 2}>
                      {type !== 'return' && formatNumberWithCommas(selectedDetail?.dailyTotal)}
                    </th>
                  )}
                  <th>{typeLabel(type, selectedDetail)}</th>
                </tr>
                <tr>{renderTrGroup()}</tr>
              </thead>
            ) : (
              <thead>
                <tr>
                  <th className="agnL">{dayjs(referenceDate).format('YYYY-MM-DD(ddd)')}</th>
                  <th colSpan={2} className="agnR">
                    {formatNumberWithCommas(selectedDetail?.vatTotalDeposit)}
                  </th>
                  <th>{typeLabel(type, selectedDetail)}</th>
                </tr>
              </thead>
            )}
            <tbody>
              {type === 'default' ? (
                <>
                  {
                    // 판매
                    selectedDetail?.orderItemSaleList && selectedDetail?.orderItemSaleList.length > 0 ? (
                      <>
                        {selectedDetail?.orderItemSaleList?.map((item: any, index: number) => (
                          <React.Fragment key={`${index}-orderItemSaleList`}>
                            <tr>
                              <td colSpan={4}>{item.orderDetCd === '99' ? `※ ${item.productName}` : item.productName}</td>
                            </tr>
                            <tr>
                              <td></td>
                              <td className="agnR">{formatNumberWithCommas(item.unitPrice)}</td>
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
                      ''
                    )
                  }
                  {
                    // 반품
                    selectedDetail?.orderItemReturnList && selectedDetail?.orderItemReturnList.length !== 0 ? (
                      <>
                        {selectedDetail?.orderItemReturnList?.map((item: any, index: number) => (
                          <React.Fragment key={`${index}-Return`}>
                            <tr>
                              <td colSpan={4}>{item.productName}</td>
                            </tr>
                            <tr>
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
                </>
              ) : (
                ''
              )}
              {
                // 샘플 현황
                selectedDetail && type === 'status' ? (
                  <>
                    {/* 미회수 */}
                    {selectedDetail?.sampleInfo?.sampleNotReturnCount !== 0 ? (
                      <>
                        {selectedDetail?.sampleInfo?.sampleNotReturnList.map((item: any, index: number) => {
                          return (
                            <React.Fragment key={`${index}-NotReturn`}>
                              <tr className="groupTit">
                                <td colSpan={4}>{item.skuNm}</td>
                              </tr>
                              <tr className="groupRow">
                                <td></td>
                                <td className="agnR">{formatNumberWithCommas(item.baseAmt)}</td>
                                <td className="agnC">{item.sampleCnt}</td>
                                <td>{item.workYmdFormated}</td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                        <tr className="tfoot">
                          <th>== 미회수 소계 ==</th>
                          <th>{selectedDetail?.sampleInfo?.sampleNotReturnList.length}건</th>
                          <th>{selectedDetail?.sampleInfo?.sampleNotReturnCount}</th>
                          <th className="agnR">{formatNumberWithCommas(selectedDetail?.sampleInfo?.sampleNotReturnAmt)}</th>
                        </tr>
                      </>
                    ) : (
                      ''
                    )}
                    {/* 회수 */}
                    {selectedDetail?.sampleInfo?.sampleReturnCount !== 0 ? (
                      <>
                        {selectedDetail?.sampleInfo?.sampleReturnList.map((item: any, index: number) => {
                          return (
                            <React.Fragment key={`${index}-Return`}>
                              <tr className="groupTit">
                                <td colSpan={4}>{item.skuNm}</td>
                              </tr>
                              <tr className="groupRow">
                                <td></td>
                                <td className="agnR">{formatNumberWithCommas(item.baseAmt)}</td>
                                <td className="agnC">{item.sampleCnt}</td>
                                <td>{item.workYmdFormated}</td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                        <tr className="tfoot">
                          <th>== 회수 소계 ==</th>
                          <th>{selectedDetail?.sampleInfo?.sampleReturnList.length}건</th>
                          <th>{selectedDetail?.sampleInfo?.sampleReturnCount}</th>
                          <th className="agnR">{formatNumberWithCommas(selectedDetail?.sampleInfo?.sampleReturnAmt)}</th>
                        </tr>
                      </>
                    ) : (
                      ''
                    )}
                    {/* 샘플결제 */}
                    {selectedDetail?.sampleInfo?.sampleSailCount !== 0 ? (
                      <>
                        <tr>
                          <th>미회수</th>
                          <th>{selectedDetail?.sampleInfo?.sampleSailCount}</th>
                          <th colSpan={2}></th>
                        </tr>
                        {selectedDetail?.sampleInfo?.sampleSailList.map((item: any, index: number) => {
                          return (
                            <React.Fragment key={`${index}-Sail`}>
                              <tr className="groupTit">
                                <td colSpan={4}>{item.skuNm}</td>
                              </tr>
                              <tr className="groupRow">
                                <td></td>
                                <td className="agnR">{formatNumberWithCommas(item.baseAmt)}</td>
                                <td className="agnC">{item.sampleCnt}</td>
                                <td>{item.workYmdFormated}</td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                        <tr className="tfoot">
                          <th>== 샘플결제 소계 ==</th>
                          <th>{selectedDetail?.sampleInfo?.sampleReturnList.length}건</th>
                          <th>{selectedDetail?.sampleInfo?.sampleReturnCount}건</th>
                          <th className="agnR">{formatNumberWithCommas(selectedDetail?.sampleInfo?.sampleReturnAmt)}</th>
                        </tr>
                      </>
                    ) : (
                      ''
                    )}
                  </>
                ) : selectedDetail && type === 'sample' ? (
                  // 샘플
                  <>
                    {selectedDetail?.sampleItems ? (
                      <>
                        {selectedDetail?.sampleItems?.map((item: any, index: number) => (
                          <React.Fragment key={`${index}-sampleItems`}>
                            <tr>
                              <td colSpan={4}>{item.productName}</td>
                            </tr>
                            <tr>
                              <td></td>
                              <td className="agnC">{formatNumberWithCommas(item.unitPrice)}</td>
                              <td className="agnC">{item.quantity}</td>
                              <td className="agnR">
                                {/* {formatNumberWithCommas(item.amount)} */}
                                {dayjs(selectedDetail?.inputDate).format('YY-MM-DD(ddd)')}
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                        <tr className="tfoot">
                          <th>== 샘플 소계 ==</th>
                          <th>{selectedDetail?.sampleItems.length}건</th>
                          <th>{selectedDetail?.totalCount}</th>
                          <th className="agnR">{formatNumberWithCommas(selectedDetail?.dailyTotal)}</th>
                        </tr>
                      </>
                    ) : (
                      ''
                    )}
                  </>
                ) : selectedDetail && type === 'collected' ? (
                  // 회수
                  <>
                    {selectedDetail?.sampleInfo ? (
                      <>
                        {selectedDetail?.sampleInfo?.sampleReturnList?.map((item: any, index: number) => (
                          <React.Fragment key={`${index}-sampleReturnList`}>
                            <tr>
                              <td colSpan={4}>{item.skuNm}</td>
                            </tr>
                            <tr>
                              <td></td>
                              <td className="agnC">{formatNumberWithCommas(item.baseAmt)}</td>
                              <td className="agnC">{item.sampleCnt}</td>
                              <td>{item?.workYmdFormated || ''}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                        <tr className="tfoot">
                          <th>== 회수 소계 =</th>
                          <th>{selectedDetail?.sampleInfo?.sampleReturnCount}건</th>
                          <th>{selectedDetail?.sampleInfo?.sampleReturnList?.length}</th>
                          <th className="agnR">{formatNumberWithCommas(selectedDetail?.sampleInfo?.sampleReturnAmt)}</th>
                        </tr>
                        {selectedDetail?.sampleNotCollected?.sampleNotCollectedList?.map((item: any, index: number) => (
                          <React.Fragment key={`${index}-sampleNotReturnList`}>
                            <tr>
                              <td colSpan={4}>{item.skuNm}</td>
                            </tr>
                            <tr>
                              <td></td>
                              <td className="agnC">{formatNumberWithCommas(item.baseAmt)}</td>
                              <td className="agnC">{item.sampleCnt}</td>
                              <td className="agnR">{item.workYmdFormated}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                        <tr className="tfoot">
                          <th>== 미회수 소계 =</th>
                          <th>{selectedDetail?.sampleNotCollected?.sampleNotCollectedList?.length}건</th>
                          <th>{selectedDetail?.sampleNotCollected?.totSkuCnt}</th>
                          <th className="agnR">{formatNumberWithCommas(selectedDetail?.sampleNotCollected?.totOrderAmt)}</th>
                        </tr>
                      </>
                    ) : (
                      ''
                    )}
                  </>
                ) : selectedDetail && type === 'notCollected' ? (
                  // 미회수
                  <>
                    {selectedDetail?.sampleNotCollected ? (
                      <>
                        {selectedDetail?.sampleNotCollected?.sampleNotCollectedList?.map((item: any, index: number) => (
                          <React.Fragment key={`${index}-sampleNotCollected`}>
                            <tr>
                              <td colSpan={4}>{item.skuNm}</td>
                            </tr>
                            <tr>
                              <td></td>
                              <td className="agnC">{formatNumberWithCommas(item.baseAmt)}</td>
                              <td className="agnC">{item.sampleCnt}</td>
                              <td className="agnR">
                                {/* {formatNumberWithCommas(item.amount)} */}
                                {item.workYmdFormated}
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                        <tr className="tfoot">
                          <th>== 미회수 소계 =</th>
                          <th>{selectedDetail?.sampleNotCollected?.sampleNotCollectedList?.length}건</th>
                          <th>{selectedDetail?.sampleNotCollected?.totSkuCnt}</th>
                          <th className="agnR">{formatNumberWithCommas(selectedDetail?.sampleNotCollected?.totOrderAmt)}</th>
                        </tr>
                      </>
                    ) : (
                      ''
                    )}
                  </>
                ) : (
                  ''
                )
              }
              {
                // 부가세
                selectedDetail && (type === 'vatDeposit' || type === 'vatBilling') ? (
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
                ) : (
                  ''
                )
              }
              {
                // 입금(금일내역)
                (selectedDetail && type === 'pay') || (selectedDetail && type === 'orderPay') ? (
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
                ) : (
                  ''
                )
              }
              {
                // 주문내역
                selectedDetail && type === 'orderState' ? (
                  <>
                    {selectedDetail?.orderItems?.map((item: any, index: number) => (
                      <React.Fragment key={`${index}-orderItems`}>
                        <tr>
                          <td colSpan={4}>{item.skuNm}</td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="agnR">{formatNumberWithCommas(item.sellAmt)}</td>
                          <td className="agnC">{item.skuCnt}</td>
                          <td className="agnR">{formatNumberWithCommas(item.totAmt)}</td>
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
                )
              }
              {
                // 주문등록 샘플
                selectedDetail && type === 'orderSample' ? (
                  <>
                    {selectedDetail?.orderItems?.map((item: any, index: number) => (
                      <React.Fragment key={`${index}-orderItems`}>
                        <tr>
                          <td colSpan={4}>{item.skuNm}</td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="agnR">{formatNumberWithCommas(item.unitPrice)}</td>
                          <td className="agnC">{item.skuCnt}</td>
                          <td className="agnR">{formatNumberWithCommas(item.amount)}</td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </>
                ) : (
                  ''
                )
              }
              {
                // 주문등록 기본
                selectedDetail && type === 'orderDefault' ? (
                  <>
                    {/* 공통 렌더링 함수 */}
                    {['판매', '반품'].map((itemType) => {
                      const isSales = itemType === '판매';
                      const items = selectedDetail.orderItems.filter((item: any) =>
                        isSales ? item.orderDetCd === 90 || item.orderDetCd === 99 : item.orderDetCd === 40,
                      );

                      // 총계 계산
                      const totalCnt = items.reduce((acc: number, curr: any) => acc + (curr.quantity || 0), 0);
                      const totalAmt = items.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

                      return (
                        <React.Fragment key={itemType}>
                          {items.map((item: any, index: number) => (
                            <React.Fragment key={`${index}-orderItems-${itemType}`}>
                              <tr>
                                <td colSpan={4}>
                                  {/* 미송 항목 처리 */}
                                  {isSales && item.orderDetCd === '99' ? `※ ${item.skuNm}` : item.skuNm}
                                </td>
                              </tr>
                              <tr>
                                <td></td>
                                <td className="agnR">
                                  {/* 반품 항목에 '-' 붙이기 */}
                                  {isSales ? formatNumberWithCommas(item.unitPrice) : `-${formatNumberWithCommas(item.unitPrice)}`}
                                </td>
                                <td className="agnC">{isSales ? item.quantity : `-${item.quantity}`}</td>
                                <td className="agnR">{isSales ? formatNumberWithCommas(item.amount) : `-${formatNumberWithCommas(item.amount)}`}</td>
                              </tr>

                              {/* 소계 (마지막 항목 뒤에 추가) */}
                              {index === items.length - 1 && (
                                <tr className="tfoot">
                                  <td className="agnC">--- {itemType}소계 ---</td>
                                  <td className="agnR">{items.length}건</td>
                                  <td className="agnC">{totalCnt}</td>
                                  <td className="agnR">{formatNumberWithCommas(totalAmt)}</td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </>
                ) : (
                  ''
                )
              }
              {
                // 반납/미반납
                (selectedDetail && type === 'orderReturn') || (selectedDetail && type === 'orderRequest') ? (
                  <>
                    {selectedDetail?.orderItems?.map((item: any, index: number) => (
                      <React.Fragment key={`${index}-orderReturn`}>
                        <tr>
                          <td colSpan={4}>{item.skuNm}</td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="agnR">{formatNumberWithCommas(item.baseAmt)}</td>
                          <td className="agnC">{item.skuCnt}</td>
                          <td className="agnR">{formatNumberWithCommas(item.totAmt)}</td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </>
                ) : (
                  ''
                )
              }
              {/* 미송 현황 */}
              {selectedDetail && type === 'misong' ? (
                <>
                  {/* 발송 */}
                  {selectedDetail?.shippedItems?.length !== 0 ? (
                    <>
                      {selectedDetail?.shippedItems?.map((item: any, index: number) => {
                        return (
                          <React.Fragment key={`${index}-shippedItems`}>
                            <tr className="groupTit">
                              <td colSpan={4}>{item.skuNm}</td>
                            </tr>
                            <tr className="groupRow">
                              <td></td>
                              <td className="agnR">{formatNumberWithCommas(item.unitPrice)}</td>
                              <td className="agnC">{item.quantity}</td>
                              <td>{item.shippingDate ? dayjs(item.shippingDate).format('MM-DD(ddd) HH:mm') || '' : ''}</td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                      <tr className="tfoot">
                        <th>== 발송 소계 ==</th>
                        <th className="agnC">{selectedDetail?.shippedItems?.length}건</th>
                        <th className="agnC">{selectedDetail?.shippedCount}</th>
                        <th className="agnC">{formatNumberWithCommas(selectedDetail?.shippedAmt)}</th>
                      </tr>
                    </>
                  ) : (
                    ''
                  )}
                  {/* 미발송 */}
                  {selectedDetail?.notShippedItems?.length !== 0 ? (
                    <>
                      {selectedDetail?.notShippedItems?.map((item: any, index: number) => {
                        return (
                          <React.Fragment key={`${index}-notShippedItems`}>
                            <tr className="groupTit">
                              <td colSpan={4}>{item.skuNm}</td>
                            </tr>
                            <tr className="groupRow">
                              <td></td>
                              <td className="agnR">{formatNumberWithCommas(item.unitPrice)}</td>
                              <td className="agnC">{item.quantity}</td>
                              <td>{item.shippingDate ? dayjs(item.shippingDate).format('MM-DD(ddd) HH:mm') || '' : ''}</td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                      <tr className="tfoot">
                        <th>== 미발송 소계 ==</th>
                        <th className="agnC">{selectedDetail?.notShippedItems?.length}건</th>
                        <th className="agnC">{selectedDetail?.notShippedCount}</th>
                        <th className="agnC">{formatNumberWithCommas(selectedDetail?.notShippedAmt)}</th>
                      </tr>
                    </>
                  ) : (
                    ''
                  )}
                </>
              ) : (
                ''
              )}
              {/* 발송 */}
              {selectedDetail && type === 'shipped' ? (
                <>
                  {(selectedDetail?.shippedItems?.length > 0 || selectedDetail?.notShippedItems?.length > 0) && (
                    <>
                      {/* 발송 아이템 목록 */}
                      {selectedDetail?.shippedItems?.length > 0 && (
                        <>
                          {selectedDetail.shippedItems.map((item: any, index: number) => (
                            <React.Fragment key={`shippedItems-${index}`}>
                              <tr className="groupTit">
                                <td colSpan={4}>{item.skuNm}</td>
                              </tr>
                              <tr className="groupRow">
                                <td></td>
                                <td className="agnR">{formatNumberWithCommas(item.unitPrice)}</td>
                                <td className="agnC">{item.quantity}</td>
                                <td>{dayjs(item.shippingDate).format('YY-MM-DD(ddd)') || ''}</td>
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
              {/* 발송 */}
              {selectedDetail && type === 'notShipped' ? (
                <>
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
                </>
              ) : (
                ''
              )}
              {
                // 보류
                selectedDetail && type === 'boryu' ? (
                  <>
                    {selectedDetail?.orderItems?.map((item: any, index: number) => (
                      <React.Fragment key={`${item.id}-${index}`}>
                        <tr>
                          <td colSpan={4}>{item.orderDetCd === '99' ? `※ ${item.skuNm}` : item.skuNm}</td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="agnR">{formatNumberWithCommas(item.unitPrice)}</td>
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
                )
              }
              {
                // 매장분반납
                selectedDetail && type === 'return' ? (
                  <>
                    {/* 반납확정 */}
                    {selectedDetail?.inboundList?.length !== 0 ? (
                      <>
                        {selectedDetail?.inboundList?.map((item: any, index: number) => (
                          <React.Fragment key={`${item.id}-${index}`}>
                            <tr>
                              <td colSpan={4}>{item.skuNm}</td>
                            </tr>
                            <tr>
                              <td></td>
                              <td className="agnC">{item.skuCnt}</td>
                              <td className="agnC">{item.stockCnt}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                        <tr className="tfoot">
                          <td className="agnC">--- 확정소계 ---</td>
                          <td className="agnC">{selectedDetail?.inboundListFinalCnt}</td>
                          <td className="agnC">{selectedDetail?.inboundListFinishCnt}</td>
                        </tr>
                      </>
                    ) : (
                      ''
                    )}
                    {/* 수정완료 */}
                    {selectedDetail?.editList?.length !== 0 ? (
                      <>
                        {selectedDetail?.editList?.map((item: any, index: number) => (
                          <React.Fragment key={`${item.id}-${index}`}>
                            <tr>
                              <td colSpan={4}>{item.skuNm}</td>
                            </tr>
                            <tr>
                              <td></td>
                              <td className="agnC">{item.skuCnt}</td>
                              <td className="agnC">{item.stockCnt}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                        <tr className="tfoot">
                          <td className="agnC">--- 수정완료 ---</td>
                          <td className="agnC">{selectedDetail?.editListFinalCnt}</td>
                          <td className="agnC">{selectedDetail?.editListFinishCnt}</td>
                        </tr>
                      </>
                    ) : (
                      ''
                    )}
                    {/* 반납완료 */}
                    {selectedDetail?.returnList?.length !== 0 ? (
                      <>
                        {selectedDetail?.returnList?.map((item: any, index: number) => (
                          <React.Fragment key={`${item.id}-${index}`}>
                            <tr>
                              <td colSpan={4}>{item.skuNm}</td>
                            </tr>
                            <tr>
                              <td></td>
                              <td className="agnC">{item.skuCnt}</td>
                              <td className="agnC">{item.stockCnt}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                        <tr className="tfoot">
                          <td className="agnC">--- 반납완료 ---</td>
                          <td className="agnC">{selectedDetail?.returnListFinalCnt}</td>
                          <td className="agnC">{selectedDetail?.returnListFinishCnt}</td>
                        </tr>
                      </>
                    ) : (
                      ''
                    )}
                  </>
                ) : (
                  ''
                )
              }
              {
                // 생산처결제
                type === 'factoryStock' || type === 'factoryOut' || type === 'factoryRepair' ? (
                  <>
                    {selectedDetail?.factorySettleList?.length !== 0 ? (
                      <>
                        {selectedDetail?.factorySettleList?.map((item: any, index: number) => (
                          <React.Fragment key={`${item.no}-${index}`}>
                            <tr>
                              <td colSpan={4}>{item.skuNm}</td>
                            </tr>
                            <tr>
                              <td></td>
                              <td className="agnC">{formatNumberWithCommas(item.gagongAmt)}</td>
                              <td className="agnC">{item.totCnt}</td>
                              <td className="agnC">{formatNumberWithCommas(parseInt(item.totAmt))}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                        <tr className="tfoot">
                          <td className="agnC">--- {selectedDetail?.factorySettleList[0].inOutType}소계 ---</td>
                          <td className="agnC">{selectedDetail?.factorySettleList.length}건</td>
                          <td className="agnC">{selectedDetail?.factorySettleList.at(-1)?.receivingCnt}</td>
                          <td className="agnC">{formatNumberWithCommas(selectedDetail?.factorySettleList.at(-1)?.receivingAmt)}</td>
                        </tr>
                      </>
                    ) : (
                      ''
                    )}
                  </>
                ) : (
                  ''
                )
              }
              {
                // 생산처결제 - 결제
                type === 'factoryPay' ? (
                  <tr>
                    <td colSpan={4} className="vatList">
                      <ul>
                        <li>
                          <strong>지급일자</strong>
                          <span>{selectedDetail?.factorySettleList[0].tranYmd}</span>
                        </li>
                        <li className="lastLi">
                          <strong>대상기간</strong>
                          <span>{selectedDetail?.factorySettleList[0].workYmd}</span>
                        </li>

                        <li>
                          <strong>예정금액</strong>
                          <span>{formatNumberWithCommas(selectedDetail?.factorySettleList[0].onCreditAmt)}</span>
                        </li>
                        <li>
                          <strong>현금지급</strong>
                          <span>{formatNumberWithCommas(selectedDetail?.factorySettleList[0].cashPayAmt)}</span>
                        </li>
                        <li>
                          <strong>통장지급</strong>
                          <span>{formatNumberWithCommas(selectedDetail?.factorySettleList[0].accountPayAmt)}</span>
                        </li>
                        <li>
                          <strong>할인금액</strong>
                          <span>{formatNumberWithCommas(selectedDetail?.factorySettleList[0].settleDcAmt)}</span>
                        </li>
                        <li>
                          <strong>결제잔액</strong>
                          <span>{formatNumberWithCommas(selectedDetail?.factorySettleList[0].currentBalance)}</span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                ) : (
                  ''
                )
              }
              {
                // 입고내역
                type === 'receivingHistoryB' ||
                type === 'receivingHistoryC' ||
                type === 'receivingHistoryD' ||
                type === 'receivingHistoryE' ||
                type === 'receivingHistoryF' ? (
                  <>
                    {selectedDetail?.receivingHistoryList?.length !== 0 ? (
                      <>
                        {selectedDetail?.receivingHistoryList?.map((item: any, index: number) => (
                          <React.Fragment key={`${item.no}-${index}`}>
                            <tr>
                              <td colSpan={4}>{item.skuNm}</td>
                            </tr>
                            <tr>
                              <td></td>
                              <td className="agnC">{formatNumberWithCommas(item.unitPrice)}</td>
                              <td className="agnC">{item.quantity}</td>
                              <td className="agnR">{formatNumberWithCommas(item.amount)}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                        <tr className="tfoot">
                          <td className="agnC">--- {selectedDetail?.inOutTypeNm} 소계 ---</td>
                          <td className="agnC">{selectedDetail?.receivingHistoryList?.length}건</td>
                          <td className="agnC">{selectedDetail?.totCnt}</td>
                          <td className="agnR">{formatNumberWithCommas(selectedDetail?.totAmt)}</td>
                        </tr>
                      </>
                    ) : (
                      ''
                    )}
                  </>
                ) : (
                  ''
                )
              }
              {type === 'majang' && selectedDetail?.maejangList && selectedDetail?.maejangList.length > 0 ? (
                <>
                  {selectedDetail?.maejangList?.map((item: any, index: number) => (
                    <React.Fragment key={`${index}-maejangList`}>
                      <tr>
                        <td colSpan={4}>{item.skuNm}</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td className="agnR">{formatNumberWithCommas(item.sellAmt)}</td>
                        <td className="agnC">{item.orderCnt}</td>
                        <td className="agnR">{formatNumberWithCommas(item.totAmt)}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                  <tr className="tfoot">
                    <td className="agnC">--- 판매소계 ---</td>
                    <td className="agnR">{selectedDetail?.skuCnt}건</td>
                    <td className="agnC">{selectedDetail?.totCount}</td>
                    <td className="agnR">{formatNumberWithCommas(selectedDetail?.totAmt)}</td>
                  </tr>
                </>
              ) : (
                ''
              )}
              {
                // 입고내역 - 결제
                type === 'receivingHistoryA' ? (
                  <tr>
                    <td colSpan={4} className="vatList">
                      <ul>
                        <li>
                          <strong>지급일자</strong>
                          <span>{selectedDetail?.tranYmd}</span>
                        </li>
                        <li className="lastLi">
                          <strong>대상기간</strong>
                          <span>{selectedDetail?.workYmd}</span>
                        </li>

                        <li>
                          <strong>예정금액</strong>
                          <span>{formatNumberWithCommas(selectedDetail?.onCreditAmt)}</span>
                        </li>
                        <li>
                          <strong>현금지급</strong>
                          <span>{formatNumberWithCommas(selectedDetail?.cashPayAmt)}</span>
                        </li>
                        <li>
                          <strong>통장지급</strong>
                          <span>{formatNumberWithCommas(selectedDetail?.accountPayAmt)}</span>
                        </li>
                        <li>
                          <strong>할인금액</strong>
                          <span>{formatNumberWithCommas(selectedDetail?.settleDcAmt)}</span>
                        </li>
                        <li>
                          <strong>결제잔액</strong>
                          <span>{formatNumberWithCommas(selectedDetail?.currentBalance)}</span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                ) : (
                  ''
                )
              }
            </tbody>

            {sellerInfoData?.vatYn === 'Y' && !vatAreaHide ? (
              <tfoot>
                <tr>
                  <td className="agnC">### 부가세 ###</td>
                  <td className="agnC"></td>
                  <td className="agnC"></td>
                  <td className="agnR">{formatNumberWithCommas(selectedDetail?.grandTotalAmount * 0.1)}</td>
                </tr>
              </tfoot>
            ) : (
              ''
            )}
          </table>
        </div>
        {!amountAreaHide ? (
          <>
            {type === 'factoryStock' || type === 'factoryOut' || type === 'factoryRepair' ? (
              <div className="etcArea">
                <dl>
                  <dt>
                    <span>전</span>
                    <span>잔</span>
                  </dt>
                  <dd>{formatNumberWithCommas(selectedDetail?.factorySettleList.at(-1)?.previousBalance)}</dd>
                </dl>
                <dl>
                  <dt>
                    <span>당</span>
                    <span>일</span>
                    <span>합</span>
                    <span>계</span>
                  </dt>
                  <dd>{formatNumberWithCommas(selectedDetail?.factorySettleList.at(-1)?.receivingAmt)}</dd>
                </dl>
                <dl>
                  <dt>
                    <span>당</span>
                    <span>잔</span>
                  </dt>
                  <dd>{formatNumberWithCommas(selectedDetail?.factorySettleList.at(-1)?.currentBalance)}</dd>
                </dl>
              </div>
            ) : (
              <div className="etcArea">
                <dl>
                  <dt>
                    <span>전</span>
                    <span>잔</span>
                  </dt>
                  <dd>{formatNumberWithCommas(selectedDetail?.previousBalance)}</dd>
                </dl>
                <dl>
                  <dt>
                    <span>당</span>
                    <span>일</span>
                    <span>합</span>
                    <span>계</span>
                  </dt>
                  <dd>
                    {formatNumberWithCommas(
                      selectedDetail?.dailyTotal
                        ? selectedDetail?.dailyTotal
                        : selectedDetail?.totOrderAmt
                        ? selectedDetail?.totOrderAmt
                        : selectedDetail?.onCreditAmt,
                    )}
                  </dd>
                </dl>
                {/* 잔액인쇄 */}
                {selectedDetail?.remainYn === 'Y' ? (
                  <dl>
                    <dt>
                      <span>현</span>
                      <span>금</span>
                      <span>금</span>
                      <span>액</span>
                    </dt>
                    <dd></dd>
                  </dl>
                ) : (
                  ''
                )}
                <dl>
                  <dt>
                    <span>당</span>
                    <span>잔</span>
                  </dt>
                  <dd>{formatNumberWithCommas(selectedDetail?.currentBalance)}</dd>
                </dl>
              </div>
            )}
          </>
        ) : (
          ''
        )}
        {children}
        <div className="footer">{printData?.bottomMng}</div>
      </div>
    </div>
  );
});

PrintComponent.displayName = 'PrintComponent';
export default PrintComponent;
