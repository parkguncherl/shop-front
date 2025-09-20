// 타입 정의
import data from '@react-google-maps/api/src/components/drawing/Data';

type Labelconst = {
  [key: string]: { [funcName: string]: any[] };
};

interface LabelData {
  id: number;
  functions: Labelconst;
}

// 모듈 변수 선언
const label_data: LabelData = { id: 0, functions: {} };
let label_func: Labelconst = {};
let incLabelNum = 0;

/**`
 * JSON 데이타 구조
 *
 * {
 *   "id":1, //setId function
 *   "functions":{  //printing function
 *     "func1":{"function name":[func1 parameters]},
 *     "func2":{"function name":[func2 parameters]},
 *     ....
 *     "funcN":{"function name":[funcN parameters]},
 *   }
 * }
 */

// 라벨 함수로 생성된 데이타를 가져옴
export const getLabelData = (): string => {
  label_data.functions = label_func;
  label_func = {};
  incLabelNum = 0;
  return JSON.stringify(label_data);
};

// 중복 요청 처리 기능을 사용시 반드시 이 함수를 사용  (Optional)
export const setLabelId = (
  requestId: number, // 인쇄 요청하는 Id 값 (사용자가 지정)
): void => {
  label_data.id = requestId;
};

// 프린터 상태를 체크
export const checkLabelStatus = (): void => {
  label_func[`func${incLabelNum}`] = { checkLabelStatus: [] };
  incLabelNum++;
};

// 프린터 버퍼를 초기화
export const clearBuffer = (): void => {
  label_func[`func${incLabelNum}`] = { clearBuffer: [] };
  incLabelNum++;
};

// 프린터 버퍼에 있는 데이터를 출력
export const printBuffer = (arg?: any): void => {
  const _a = arg !== undefined ? { printBuffer: [arg] } : { printBuffer: [] };
  label_func[`func${incLabelNum}`] = _a;
  incLabelNum++;
};

// 프린터 버퍼에 선, 사선, 사각형 데이터를 입력
export const drawBlock = (
  startHorizontal: number, //수평방향시작 x 좌표 위치
  startVertical: number, //수평방향시작 y 좌표 위치
  endHorizontal: number, //수평방향종료 x 좌표 위치
  endVertical: number, //수평방향종료 y 좌표 위치
  option: string, // O: 겹치는부분 덮어쓰기, E: 겹치는 부분 인쇄안함, D:겹치는부분삭제, S:사선, B:사각형
  thickness: number, // 두께  = (option값이 사선, 사각형 값이어야 합니다)
): void => {
  label_func['func' + incLabelNum] = { drawBlock: [startHorizontal, startVertical, endHorizontal, endVertical, option, thickness] };
  incLabelNum++;
};

// 프린터 버퍼에 원 데이터를 입력
export const drawCircle = (
  startHorizontal: number, // x 좌표
  startVertical: number, // y 좌표
  circleSize: number, // 원의 크기 (1~6)
  muliplier: number, // 원확대(1~4)
): void => {
  label_func['func' + incLabelNum] = { drawBlock: [startHorizontal, startVertical, circleSize, muliplier] };
  incLabelNum++;
};

// 프린터 버퍼에 이미지 데이터를 입력 (base64 인코딩된 이미지데이타)
export const drawBitmap = (
  data: string, // base64로 인코딩한 이미지 데이타
  x: number, // x축 좌표
  y: number, // y축 좌표
  width: number, // 이미지 너비
  dither: boolean, // 디더링 사용유무
) => {
  label_func['func' + incLabelNum] = { drawBitmap: [data, x, y, width, dither] };
  incLabelNum++;
};

// 프린터 버퍼에 이미지 파일을 입력
export const drawBitmapFile = (
  filepath: string, // 이미지파일 경로 (Windows: 전체경로)
  x: number, // x축 좌표
  y: number, // y축 좌표
  width: number, // 이미지 너비
  dither: boolean, // 디더링 사용유무
) => {
  label_func['func' + incLabelNum] = { drawBitmapFile: [filepath, x, y, width, dither] };
  incLabelNum++;
};

// 텍스트 문자열을 프린트로 전송  (라벨 명령어를 직접 사용하는 경우 사용할 수 있습니다)
export const directDrawText = (text: string): void => {
  label_func[`func${incLabelNum}`] = { directDrawText: [text] };
  incLabelNum++;
};

// Device Font를 이용하여 문자열 입력
export const drawDeviceFont = (
  text: string, // 문자열
  x: number,
  y: number,
  fontType: string, //폰트타입 (폰트사이즈: '0' ~ '9', a~f : KOREAN , m~j :etc
  widthEnlarge: number, // 수평확대 (1~4)
  heightEnlarge: number, // 수직 확대 (1~4)
  rotation: number,
  invert: boolean,
  bold: boolean,
  alignment: number,
): void => {
  label_func[`func${incLabelNum}`] = {
    drawDeviceFont: [text, x, y, fontType, widthEnlarge, heightEnlarge, rotation, invert, bold, alignment],
  };
  incLabelNum++;
};

// Vector Font 이용 문자열 입력
export const drawVectorFont = (
  text: string, //문자열
  x: number,
  y: number,
  fontType: string, // U: ASCII, K: KS5601, etc (API 참고)
  fontWidth: number, // dots
  fontHeight: number, // dots
  rightSpacing: number, // 오른쪽 자간 (+, - 옵션 사용가능: 5, +3, -10)
  bold: boolean,
  invert: boolean, // 역상체
  italic: boolean,
  rotation: number,
  alignment: number, // 0: 왼쪽, 1: 오른쪽, 2: 중앙정렬
  rtol: boolean, // 문자열 인쇄 방향 (true: right to left, false: left to right)
): void => {
  label_func[`func${incLabelNum}`] = {
    drawVectorFont: [text, x, y, fontType, fontWidth, fontHeight, rightSpacing, bold, invert, italic, rotation, alignment, rtol],
  };
  incLabelNum++;
};

// TrueType Font를 이용하여 문자열 입력  (윈도우 버전만 지원)
export const drawTrueTypeFont = (
  text: string, // 문자열
  x: number,
  y: number,
  fontname: string, //폰트 이름
  fontsize: number,
  rotation: number,
  italic: boolean,
  bold: boolean,
  underline: boolean,
  compression: boolean, //이미지 압축
): void => {
  label_func[`func${incLabelNum}`] = {
    drawTrueTypeFont: [text, x, y, fontname, fontsize, rotation, italic, bold, underline, compression],
  };
  incLabelNum++;
};

// 1차원 바코드 입력
export const draw1DBarcode = (
  data: string, // 바코드 데이터
  x: number, // x축 좌표
  y: number, // y축 좌표
  symbol: number, // 바코드 타입 (0~16) 타입은 api 문서 참조
  narrowbar: number, // 좁은바의 너비
  widebar: number, // 넓은바의 너비
  height: number, // 바코드 높이
  rotation: number, // 회전  (0~3)
  hri: number, // HRI 폰트 크기 및 위치 (0: 인쇄 없음, 1: 바코드 아래쪽, 2: 바코드 위쪽 기타 : 3 ~ 8)
): void => {
  label_func[`func${incLabelNum}`] = {
    draw1DBarcode: [data, x, y, symbol, narrowbar, widebar, height, rotation, hri],
  };
  incLabelNum++;
};

// QRCode 입력
export const drawQRCode = (
  data: string, // 바코드 데이타
  x: number, // x축 좌표
  y: number, // y축 좌표
  model: number, // 0 : model1 1: model2
  eccLevel: string, // 에러 교정 레벨값 (L: 7%, M: 15%, Q: 25%, H: 30%)
  size: number, // 바코드 크기 (1~9)
  rotation: number, // 회전 (0: 회전안함, 1: 90도회전, 2: 180도, 3: 270도)
): void => {
  label_func[`func${incLabelNum}`] = {
    drawQRCode: [data, x, y, model, eccLevel, size, rotation],
  };
  incLabelNum++;
};

// 용지 너비 설정 (너비를 계산하는 기준점은 가운데입니다)
export const setWidth = (width: number): void => {
  label_func[`func${incLabelNum}`] = { setWidth: [width] };
  incLabelNum++;
};

// 용지 너비 설정 (너비를 계산하는 기준점은 가운데입니다)  연속용지일 경우 이 명령어를 반드시 사용해야 합니다. 나머지 용지는 사용하지 않아도 됩니다.
export const setLength = (
  labelLength: number, // 라벨길이
  gapLength: number, // Gap 또는 Black Mark 길이
  mediaType: string, // 라벨용지종류 (G: 갭, C: 연속용지, B: 블랙마크)
  offset: number, // offset 길이
): void => {
  label_func[`func${incLabelNum}`] = { setLength: [labelLength, gapLength, mediaType, offset] };
  incLabelNum++;
};

// 인쇄 속도 설정 (0~12)
export const setSpeed = (speed: number): void => {
  label_func[`func${incLabelNum}`] = { setSpeed: [speed] };
  incLabelNum++;
};

// 인쇄 농도 설정 (0~20)
export const setDensity = (density: number): void => {
  label_func[`func${incLabelNum}`] = { setDensity: [density] };
  incLabelNum++;
};

// 인쇄 방향 설정 (T: 위에서 아래방향으로 인쇄, B: 아래에서 위로 인쇄)
export const setOrientation = (orientation: number): void => {
  label_func[`func${incLabelNum}`] = { setOrientation: [orientation] };
  incLabelNum++;
};

// 프린터의 코드페이지와 International CharacterSet을 설정
// 프린터 코드페이지와 동일한 값으로 인코딩 된다.
export const setCharacterset = (
  ics: number, // International Character Set 값 (0~15  0: USA, 13: Korea)
  charset: string, // codepage 값 (0~22, 0: 영어)
): void => {
  label_func[`func${incLabelNum}`] = { setCharacterset: [ics, charset] };
  incLabelNum++;
};

// 오토 커터 사용여부 설정
export const setAutoCutter = (
  enable: boolean, // cutter 사용여부
  period: number, // 몇페이지마다 커팅을 할지 결정
): void => {
  label_func[`func${incLabelNum}`] = { setAutoCutter: [enable, period] };
  incLabelNum++;
};
