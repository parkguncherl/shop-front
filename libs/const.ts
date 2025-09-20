export const Placeholder = {
  Default: '검색어를 입력하세요.',
  Select: '선택하세요.',
  Input: '입력하세요.',
  File: '파일을 선택하세요.',
  PhoneNo: '-를 제외한 숫자만 입력하세요.',
};

/* 판매상태 코드 / 코드명 / grid className / 단축키( alt + ), 본 상수를 사용하는 코드들이 각 배열 요소의 순서에 의존적이므로 이점에 유의 */
export const ProductStatus = {
  sell: ['90', '판매', '', '1'], // 판매
  refund: ['40', '반품', 'ag-grid-refund', '2'],
  beforeDelivery: ['99', '미송', 'ag-grid-beforeDelivery', '3'],
  sample: ['50', '샘플', 'ag-grid-sample', '4'],
  notDelivered: ['80', '미출', 'ag-grid-notDelivered', '5'],
};

// 작업구분코드
export const JobType = {
  jumun: 'A',
  misong: 'B',
  majang: 'C',
  sample: 'D',
  order: 'E',
};

// 발주구분
export const AsnType = {
  정상발주: '1',
  매장반납: '2',
  기타입하: '3',
  수선분발주: '9',
};

// 발주상태코드
export const AsnStatCd = {
  발주예정: '1',
  발주확정: '2',
  입하예정: '3',
  입하완료: '9',
};

export const AlertMessage = { RequiredParams: '검색조건을 1개 이상 입력하세요.' };
export const DomainKeyWord = { main: 'evblueplug', local: 'localhost' };

/** 인증번호 입력 대기 시간 (ms) */
export const Otp = { duration: 180000 };

export const DEFAULT_ADD_HOURE = 6;

const telRegionNos = ['010', '02', '031', '032', '033', '041', '042', '043', '044', '051', '052', '053', '054', '055', '061', '062', '063', '064'];

export const LOCAL_STORAGE_HISTORY = 'shopMenuHistoryList';
export const LOCAL_STORAGE_GUBUN = 'shopGubun';
export const LOCAL_STORAGE_WMS_HISTORY = 'binblurWmsMenuHistoryList';

export const PARTNER_CODE = { expense: 'P0001', categories: 'P0002', boryuCategories: 'P0003' };
export const CODE = { todayColor: '10310', logis: '10090', asnStatCd: '10370' };
export const DEFAULT_SELLER = '소매처를 선택해주세요';

export const DefaultOptions = {
  // 전체
  Total: [
    {
      key: 'T',
      value: 'T',
      label: '문자',
    },
    {
      key: 'N',
      value: 'N',
      label: '숫자',
    },
    {
      key: 'J',
      value: 'J',
      label: 'json',
    },
  ],
  // TOP
  Top: [
    {
      key: 'TOP',
      value: 'TOP',
      label: 'TOP',
    },
  ],
  // 선택
  Select: [
    {
      key: '',
      value: '',
      label: '선택',
    },
  ],
  // 선택, 사용, 미사용
  UseYn: [
    {
      key: '',
      value: '',
      label: '선택',
    },
    {
      key: 'Y',
      value: 'Y',
      label: '사용',
    },
    {
      key: 'N',
      value: 'N',
      label: '미사용',
    },
  ],
  // 사용, 미사용
  BaseUseYn: [
    {
      key: 'Y',
      value: 'Y',
      label: '사용',
    },
    {
      key: 'N',
      value: 'N',
      label: '미사용',
    },
  ],
  // 연결, 미연결
  RelationYn: [
    {
      key: 'Y',
      value: 'Y',
      label: '연결',
    },
    {
      key: 'N',
      value: 'N',
      label: '미연결',
    },
  ],
  // 지역번호
  TelRegionNo: telRegionNos.map((v) => ({
    key: v,
    value: v,
    label: v,
  })),
  BankRelationCnt: [
    {
      key: '0',
      value: '0',
      label: '미연결',
    },
    {
      key: '1',
      value: '1',
      label: '1개',
    },
    {
      key: '2',
      value: '2',
      label: '2개',
    },
    {
      key: '3',
      value: '3',
      label: '3개 이상',
    },
  ],
  DashboardRefreshInterval: [
    {
      key: 0,
      value: 0,
      label: '자동업데이트',
    },
  ],
  // 전국
  TotalRegion: [
    {
      key: '',
      value: '',
      label: '전국',
    },
  ],
  AttributeType: [
    {
      key: 1,
      value: 'N',
      label: '숫자',
    },
    {
      key: 2,
      value: 'T',
      label: '문자',
    },
    {
      key: 3,
      value: 'D',
      label: '날짜',
    },
    {
      key: 4,
      value: 'J',
      label: 'json',
    },
  ],
  AttributeCatalog: [
    {
      key: 1,
      value: 'S',
      label: '단일',
    },
    {
      key: 2,
      value: 'M',
      label: '다중',
    },
  ],
  DeleteYn: [
    {
      key: 1,
      value: 'N',
      label: '유지',
    },
    {
      key: 2,
      value: 'Y',
      label: '삭제',
    },
  ],
};
