// 영수증의 주요 타입을 정의합니다.
import { ProductResponsePaging } from '../generated';

export type ReceiptMainType =
  | '영수증'
  | '상품정보'
  | '발송전표'
  | '보류내역'
  | '상품내역'
  | '샘플전표'
  | '미회수내역'
  | '회수전표'
  | '기간거래내역'
  | '부가세입금'
  | '부가세청구'
  | '영업정산'
  | '테스트출력';

// 영수증의 하위 타입을 정의합니다.
export type ReceiptSubType = '영수' | '청구' | '반품' | '결제' | '매입' | '입금' | '회수' | '미송분 발송';

// 영수증 항목의 구조를 정의합니다.
export interface ReceiptItem {
  Retailer: string; // 소매처
  name: string; // 상품명
  price: number; // 단가
  orderAmt: number; // 수량
}

// 영수증 데이터의 전체 구조를 정의합니다.
export interface ReceiptData {
  retailer: string; // 소매처
  mainType: ReceiptMainType; // 영수증 주요 타입
  subType: ReceiptSubType; // 영수증 하위 타입
  isReissue: boolean; // 재발행 여부
  orderNumber: number; // 주문 번호
  date: string; // 영수증 발행 날짜
  storeInfo: string; // 상점 정보
  topMessage: string; // 상단 메시지
  items: ProductResponsePaging[]; // 구매 항목 목록
  total: number; // 총 금액
  bottomMessage: string; // 하단 메시지
  qrCodeData: string; // QR 코드에 포함될 데이터
}

// 프린터 정보의 구조를 정의합니다.
export interface PrinterInfo {
  path: string; // 프린터 포트 경로
  manufacturer?: string; // 제조사
  serialNumber?: string; // 시리얼 번호
  pnpId?: string; // PnP ID
  locationId?: string; // 위치 ID
  productId?: string; // 제품 ID
  vendorId?: string; // 벤더 ID
}
