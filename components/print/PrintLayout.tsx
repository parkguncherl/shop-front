import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../libs';
import { ApiResponseSelectPartnerPrint, ApiResponseSelectPartnerPrintInfo, PrintCompoInfo, SelectPartnerPrint, SelectPartnerPrintInfo } from '../../generated';
import { toastError, toastSuccess } from '../ToastMessage';
import { useCommonStore } from '../../stores';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import PrintSampleStatus from './PrintSampleStatus';
import PrintDefault from './PrintDefault';
import PrintComponent from './PrintComponent';
import PrintVat from './PrintVat';
import { callPreviewPrint } from './print';
import { useOrderStore } from '../../stores/useOrderStore';
import PrintPay from './PrintPay';
import PrintMisongStatus from './PrintMisongStatus';
import { JobType } from '../../libs/const';
import PrintReturn from './PrintReturn';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import PrintFactoryPay from './PrintFactoryPay';
import PrintSample from './PrintSample';

interface Props {
  children?: React.ReactNode;
  selectedDetail?: any;
  isPrinting?: boolean;
  setIsPrinting?: any;
  type: string;
}

interface CompoInfoAndProd {
  compoInfos?: PrintCompoInfo[];
  // prodPrintInfos?: PrintProd[];
}

const PrintLayout = ({ children, selectedDetail, isPrinting, setIsPrinting, type }: Props) => {
  dayjs.locale('ko');
  const [fileUrl, setFileUrl] = useState('');
  const [getFileUrl] = useCommonStore((s) => [s.getFileUrl]);
  const [jangGgiCount] = useOrderStore((s) => [s.jangGgiCount]);

  const [detail, setDetail] = useState<any>(null);
  const [printData, setPrintData] = useState<SelectPartnerPrint>(); // 유저 프린트 데이터
  const [printDataInfo, setPrintDataInfo] = useState<SelectPartnerPrintInfo>(); // 화주 프린트 데이터
  const [sellerInfoData, setSellerInfoData] = useState<any>(null); // 소매처 데이터
  const [printCompInfo, setPrintCompInfo] = useState<CompoInfoAndProd>(); // 혼용율 데이터

  useEffect(() => {
    console.log('printLayout Props ===>>', selectedDetail);
    if (Array.isArray(selectedDetail) && selectedDetail.length > 0) {
      // selectedDetail이 배열이고 값이 있을 경우 첫 번째 값으로 selectedDetail을 재설정
      //      console.log('프린트 디테일 ==>', '타입:', type, selectedDetail);
      setDetail(selectedDetail[0]);
    }
  }, [selectedDetail]);

  // 타입
  const getType = (item: any) => {
    if (item && item.jobType) {
      switch (item.jobType) {
        case JobType.jumun:
          type = 'default';
          break;
        case JobType.misong:
          type = 'misong';
          break;
        case JobType.majang:
          type = 'majang';
          break;
        case JobType.sample:
          type = 'sample';
          break;
        case JobType.order:
          type = 'order';
          break;
      }
    }
    if (type === 'pay' || type === 'default') {
      return item.payId ? 'pay' : item.orderId ? 'default' : type;
    }
    return type;
  };

  /** 유저 프린트 데이터 가져오기 */
  const {
    refetch: userPrintRefetch,
    isSuccess: userInfoSuccess,
    data: userData,
  } = useQuery({
    queryKey: ['/mypage/partner/print', selectedDetail?.[0]?.partnerId],
    queryFn: () =>
      authApi.get<ApiResponseSelectPartnerPrint>('/mypage/partner/print', {
        params: {
          partnerId: selectedDetail?.[0]?.partnerId,
        },
      }),
    enabled: !!selectedDetail?.[0]?.partnerId,
  });

  useEffect(() => {
    if (userInfoSuccess && userData) {
      const { body, resultCode, resultMessage } = userData.data;
      if (resultCode === 200 && body) {
        //console.log('유저 프린트데이터 ===>', body);
        setPrintData(body);
      }
    }
  }, [userInfoSuccess, userData]);

  /** 화주 프린트 데이터 가져오기 */
  const {
    refetch: userPrintInfoRefetch,
    isSuccess: partnerInfoSuccess,
    data: partnerData,
  } = useQuery({
    queryKey: ['/mypage/partner/printInfo', selectedDetail?.[0]?.partnerId],
    queryFn: () => {
      if (!selectedDetail?.[0]?.partnerId) {
        return Promise.reject(new Error('partnerId is missing'));
      }
      return authApi.get<ApiResponseSelectPartnerPrintInfo>(`/mypage/partner/printInfo`, {
        params: { partnerId: selectedDetail[0].partnerId },
      });
    },
    enabled: !!selectedDetail?.[0] && !!selectedDetail?.[0]?.partnerId,
  });

  useEffect(() => {
    if (partnerInfoSuccess) {
      const { body, resultCode, resultMessage } = partnerData.data;
      if (resultCode === 200 && body) {
        //console.log('화주 프린트 데이터 =>', body);
        setPrintDataInfo(body);
      }
    }
  }, [partnerInfoSuccess, partnerData]);

  /** 소매처 데이터 가져오기 */
  const {
    refetch: sellerRefetch,
    isSuccess: sellerIsSuccess,
    data: sellerData,
  } = useQuery({
    queryKey: ['/retail/detail', detail?.sellerId],
    queryFn: () =>
      authApi.get<ApiResponseSelectPartnerPrint>(`/retail/detail/${detail?.sellerId}`, {
        params: {
          sellerId: detail?.sellerId,
        },
      }),
    enabled: !!detail?.sellerId,
  });
  useEffect(() => {
    if (sellerIsSuccess) {
      const { body, resultCode, resultMessage } = sellerData.data;
      if (resultCode === 200 && body) {
        // console.log('소매처 프린트 데이터 =>', body);
        setSellerInfoData(body);
      }
    }
  }, [sellerIsSuccess, sellerData]);

  /** 파일 조회하기 (by 변수) */
  const fetchFileData = async (fileId: number | undefined) => {
    if (!fileId) return;
    const { data: selectFile } = await authApi.get(`/common/file/${fileId}`, {});
    const { resultCode, body, resultMessage } = selectFile;
    if (resultCode === 200) {
      //console.log('파일조회 데이타 =>', body[0].sysFileNm);
      const url = await getFileUrl(body[0].sysFileNm);
      setFileUrl(url);
    } else {
      toastError(resultMessage);
    }
  };

  useEffect(() => {
    if (printData) {
      //console.log('파일 조회 >>', printData?.fileId);
      fetchFileData(printData?.fileId);
    }
  }, [printData]);

  /** 혼용율 데이터 가져오기 */
  const {
    data: compPrnData,
    refetch: compRefetch,
    isSuccess: isCompDataSuccess,
  } = useQuery({
    queryKey: ['/common/printCompInfo', detail?.orderId],
    queryFn: () =>
      authApi.get('/common/printCompInfo', {
        params: {
          orderId: detail?.orderId,
          sellerId: sellerInfoData?.id,
        },
      }),
    enabled: !!sellerInfoData?.id && !!detail?.orderId,
  });

  // ✅ useEffect로 분리
  useEffect(() => {
    if (!isCompDataSuccess || !compPrnData) return;

    const { body, resultCode } = compPrnData.data;
    if (resultCode === 200 && body) {
      setPrintCompInfo(body);
    }
  }, [isCompDataSuccess, compPrnData]);

  /** 혼용율 */
  const memoizedCompoInfo = useMemo(() => {
    /*
    console.log(
      '소매처프린트정보 ====>',
      sellerInfoData?.compPrnCd,
      sellerInfoData?.id,
      '화주 프린트정보',
      printDataInfo?.compPrnCd,
      '화주',
      detail?.partnerId,
      detail?.sellerName,
    );
*/

    // 혼용율 정보가 포함되어 있는지 확인: printCompInfo가 존재하고, compoInfos가 배열이며, 요소가 하나 이상 있는 경우
    const hasCompoInfos = printCompInfo && Array.isArray(printCompInfo.compoInfos) && printCompInfo.compoInfos.length > 0;

    // 중복된 productId를 가진 항목을 제거하여 고유한 혼용율 정보 배열 생성
    const uniqueCompoInfos = Array.from(
      (printCompInfo?.compoInfos || []).filter((item, index, self) => self.findIndex((i) => i.productId === item.productId) === index),
    );
    // 화주 프린트정보 검사 :: A: 신규거래상품만 인쇄, B: 샘플전표만 인쇄, C: 인쇄안함
    const shouldRenderFromPrintDataInfo = printDataInfo?.compPrnCd === 'A' || printDataInfo?.compPrnCd === 'B';
    // 소매처 프린트정보 검사 :: A: 신규거래상품만 인쇄, B: 샘플전표만 인쇄, C: 인쇄안함 (printDataInfo 기준이 아닐 때)
    const shouldRenderFromSellerInfoData = sellerInfoData?.compPrnCd === 'A' || sellerInfoData?.compPrnCd === 'B';
    // 최종 렌더링 여부 결정
    const shouldRender =
      (shouldRenderFromPrintDataInfo && sellerInfoData?.compPrnCd !== 'C') || (shouldRenderFromSellerInfoData && printDataInfo?.compPrnCd !== 'C');

    // type 체크: 'status', 'collected', 'notCollected'일 때 렌더링하지 않음
    const isTypeRestricted = type === 'status' || type === 'collected' || type === 'notCollected';
    //    console.log('hasCompoInfos ====>', hasCompoInfos);
    //    console.log('uniqueCompoInfos ====>', uniqueCompoInfos);
    //    console.log('isTypeRestricted ====>', isTypeRestricted);
    //    console.log('shouldRenderFromSellerInfoData ====>', shouldRenderFromSellerInfoData);
    //    console.log('shouldRender ====>', shouldRender);

    // 조건에 따라 렌더링할 내용 반환
    if (shouldRender && hasCompoInfos && !isTypeRestricted) {
      return (
        <li className="sampleColorSizeInfo">
          <strong>혼용율 정보</strong>
          <ul>
            {uniqueCompoInfos.map((compoInfoItem) => (
              <li key={compoInfoItem.productId}>
                <strong>
                  {compoInfoItem.productName} {compoInfoItem.compDetail}
                </strong>
                <span>{compoInfoItem.productColors}</span>
                <span>{compoInfoItem.productSizes}</span>
              </li>
            ))}
          </ul>
        </li>
      );
    }
  }, [sellerInfoData?.compPrnCd, printDataInfo?.compPrnCd, detail?.partnerId, detail?.sellerName, printCompInfo, type]); // 의존성 배열

  useEffect(() => {
    if (!printData) {
      userPrintRefetch();
    }
    if (detail?.partnerId) {
      userPrintInfoRefetch();
    }
    if (detail?.sellerName) {
      sellerRefetch();
    }
    fetchFileData(printData?.fileId);
    //console.log('프린트에 넘어온 배열데이터 ==>', selectedDetail, type);
  }, [selectedDetail, detail]);

  /** 혼용율 */
  useEffect(() => {
    if (sellerInfoData?.id && detail?.orderId) {
      compRefetch();
    }
  }, [compRefetch, detail?.orderId, sellerInfoData]);

  /** 프린트 관련 */
  const previewRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    //console.log('로그', isPrinting, selectedDetail, printData, printDataInfo, isPrinting && selectedDetail && printData && printDataInfo);
    if (isPrinting && selectedDetail && printData && printDataInfo) {
      callPreviewPrint(previewRefs.current); // printThis 함수
      setIsPrinting(false);
      // 장끼 카운트 업데이트
      if (selectedDetail?.length > 0) {
        selectedDetail?.map((item: any) => {
          if (item.orderId) {
            jangGgiCount(item.orderId);
          }
        });
      }
    }
  }, [isPrinting, selectedDetail, printData, printDataInfo, fileUrl]);

  /** 오른쪽클릭 */
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY });
  };
  // 다른 곳 클릭시 전체탭 닫기 사라지게하기
  const contextMenuRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        closeContextMenu();
      }
    };
    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, []);

  const divRef = previewRefs.current[0];
  // 이미지 다운로드
  const handleImageDownload = async () => {
    try {
      const div = divRef;
      if (!div) {
        return;
      }
      const canvas = await html2canvas(div, { scale: 2, useCORS: true });
      canvas.toBlob((blob) => {
        if (blob !== null) {
          saveAs(blob, `${detail?.sellerName ? detail.sellerName : detail.sellerNm}.png`);
          toastSuccess('이미지가 다운로드 되었습니다.');
        }
      });
    } catch (error) {
      toastError('다운로드 실패');
    }
    closeContextMenu();
  };
  // 이미지 카피
  /*
   const handleImageCopy = async () => {
    try {
      const div = divRef;
      if (!div) {
        return;
      }
      const canvas = await html2canvas(div, { scale: 2, useCORS: true });
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            // 클립보드에 이미지 복사
            await navigator.clipboard.write([
              new ClipboardItem({
                [blob.type]: blob,
              }),
            ]);
            toastSuccess('이미지가 클립보드에 복사되었습니다.');
          } catch (error) {
            console.log('클립보드에 복사 실패 ==> but 복사 되었을수 있다.');
          }
        } else {
          console.error('Blob 생성 실패');
        }
      });
    } catch (error) {
      console.error('Error converting div to image:', error);
    }
    closeContextMenu();
  };*/

  // 이미지 다운로드후 카피
  const handleImageCopy = async () => {
    try {
      if (printData) {
        //console.log('파일 조회 >>', printData?.fileId);
        fetchFileData(printData?.fileId);
      }

      const div = divRef;
      if (!div) return;

      const canvas = await html2canvas(div, { scale: 2, useCORS: true });
      const dataUrl = canvas.toDataURL('image/png');

      // 임시 img 태그 생성
      const img = document.createElement('img');
      img.src = dataUrl;
      img.style.position = 'fixed';
      img.style.left = '-9999px'; // 화면에 보이지 않게
      document.body.appendChild(img);

      // 이미지 선택
      const range = document.createRange();
      range.selectNode(img);
      const selection = window.getSelection();
      if (!selection) return;
      selection.removeAllRanges();
      selection.addRange(range);

      // 복사 시도
      const successful = document.execCommand('copy');
      if (successful) {
        toastSuccess('이미지가 클립보드에 복사되었습니다. (우회)');
      } else {
        toastError('클립보드 복사 실패. 이미지를 선택한 후 Ctrl+C 해주세요.');
      }

      // 정리
      selection.removeAllRanges();
      document.body.removeChild(img);
    } catch (error) {
      console.error('IP 환경 복사 실패:', error);
      toastError('클립보드 복사 실패');
    }

    closeContextMenu();
  };

  return (
    <>
      {/* ---------------------------------------------------------
       오른쪽클릭 Div
       ------------------------------------------------------------ */}

      {contextMenu.visible && (
        <ul
          className={`rightClickMenu ${contextMenu.visible ? 'on' : ''}`}
          ref={contextMenuRef}
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
        >
          <li>
            <button onClick={handleImageCopy}>· 이미지 복사</button>
            <button onClick={handleImageDownload}>· 이미지 다운로드</button>
          </li>
        </ul>
      )}
      <div className={`printDiv ${isPrinting ? 'on' : ''}`} onContextMenu={handleContextMenu}>
        {/* ---------------------------------------------------------
       미리보기 전표 Div
       ------------------------------------------------------------ */}
        {detail && type === 'status' ? ( // 샘플 현황
          <PrintSampleStatus selectedDetail={detail.sampleInfo} />
        ) : detail && type === 'sample' ? (
          <PrintSample selectedDetail={detail} />
        ) : detail && (type === 'vatDeposit' || type === 'vatBilling') ? (
          <PrintVat selectedDetail={detail} />
        ) : detail && type === 'pay' ? ( // 입금전표
          <PrintPay selectedDetail={detail} />
        ) : detail && (type === 'factoryPay' || type === 'receivingHistoryA') ? ( // 생산처결제, 입고내역 전표
          <PrintFactoryPay selectedDetail={detail} />
        ) : detail && type === 'misong' ? ( // 미송현황
          <PrintMisongStatus selectedDetail={detail} />
        ) : detail && type === 'return' ? ( // 매장분반납
          <PrintReturn selectedDetail={detail} />
        ) : (
          <PrintDefault selectedDetail={detail} type={type} />
        )}
        {/* ---------------------------------------------------------
       프린트 영수증 Div
       ------------------------------------------------------------ */}
        {selectedDetail?.map((item: any, index: number) => (
          <PrintComponent
            key={`item-${index}`}
            selectedDetail={item}
            printData={printData}
            fileUrl={fileUrl}
            type={getType(item)}
            sellerInfoData={sellerInfoData}
            ref={(el) => (previewRefs.current[index] = el)}
          >
            <ul className="compInfoDiv">
              {/* 주문 비고 */}
              {item?.etcPrintYn === 'Y' && (
                <li className="etc">
                  <span>{item?.orderEtc}</span>
                </li>
              )}

              {/* 소매처 비고(전표) */}
              {sellerInfoData?.etcChitCntn && (
                <li className="etc">
                  <span>{sellerInfoData?.etcChitCntn}</span>
                </li>
              )}
              {/* 생산처 비고(전표) */}
              {item?.etcCntn && (
                <li className="etc">
                  <span>{item?.etcCntn}</span>
                </li>
              )}

              {/* 혼용율 정보 ( printCompInfo: 화주프린트정보,  */}
              {memoizedCompoInfo}

              {/* 샘플일시 동일상품 칼라/사이즈 정보 */}
              {/*{type === 'sample' && printDataInfo?.samplePrnYn === 'Y' && (*/}
              {/*  <li className="sampleColorSizeInfo">*/}
              {/*    <strong>동일상품 칼라/사이즈 정보</strong>*/}
              {/*    <ul>*/}
              {/*      {Array.from(*/}
              {/*        (printCompInfo?.prodPrintInfos || []).filter(*/}
              {/*          (printInfoItem, index, self) => self.findIndex((i) => i.productId === printInfoItem.productId) === index,*/}
              {/*        ),*/}
              {/*      ).map((printInfoItem) => (*/}
              {/*        <li key={printInfoItem.productId}>*/}
              {/*          <strong>{printInfoItem.productName}</strong>*/}
              {/*          <span>칼라 - {printInfoItem.productColors}</span>*/}
              {/*          <span>사이즈 - {printInfoItem.productSizes}</span>*/}
              {/*        </li>*/}
              {/*      ))}*/}
              {/*    </ul>*/}
              {/*  </li>*/}
              {/*)}*/}
            </ul>
          </PrintComponent>
        ))}
      </div>
    </>
  );
};

export default PrintLayout;
