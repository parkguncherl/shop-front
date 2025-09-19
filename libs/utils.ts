import { CookieValueTypes } from 'cookies-next';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ko';
import { CodeDropDown } from '../generated';
import React from 'react';
import { LOCAL_STORAGE_GUBUN } from './const';

export const Utils = {
  /** 객체의 값이 모두 비어 있는지 확인 */
  isEmptyValues: (v?: object) => {
    return v && !Object.values(v).filter((v) => v).length;
  },

  /** 공백 제거 문자열 반환 */
  getReplaceAllSpace: (value?: string) => {
    return value ? value.replaceAll(' ', '') : '';
  },

  /** 사업자등록번호 포맷 */
  getBizNoFormat: (bizNo?: string) => {
    if (!bizNo) {
      return '';
    }
    bizNo = bizNo.replace(/[^0-9]/g, '');
    let tempNum = '';

    if (bizNo.length < 4) {
      return bizNo;
    } else if (bizNo.length < 6) {
      tempNum += bizNo.substr(0, 3);
      tempNum += '-';
      tempNum += bizNo.substr(3, 2);
      return tempNum;
    } else if (bizNo.length < 11) {
      tempNum += bizNo.substr(0, 3);
      tempNum += '-';
      tempNum += bizNo.substr(3, 2);
      tempNum += '-';
      tempNum += bizNo.substr(5);
      return tempNum;
    } else {
      tempNum += bizNo.substr(0, 3);
      tempNum += '-';
      tempNum += bizNo.substr(3, 2);
      tempNum += '-';
      tempNum += bizNo.substr(5);
      return tempNum;
    }
  },

  /// 휴대폰번호 포맷
  getPhoneNumFormat(phoneNum?: string) {
    if (!phoneNum) {
      return '';
    }
    phoneNum = phoneNum.replace(/[^0-9]/g, '');
    return phoneNum.replace(/(^02.{0}|^01.{1}|[0-9]{3})([0-9]+)([0-9]{4})/, '$1-$2-$3');
  },

  // 날짜 포멧 변경 추가 YYYY-MM-DD HH:mm:ss  =>  YYYY-MM-DD HH:mm
  getFormattedDate(date?: string | Date): string {
    // date 파라미터가 없으면 현재 시간 사용
    if (!date) {
      return dayjs().format('YYYY-MM-DD HH:mm');
    }
    // date가 있으면 해당 날짜를 변환
    return dayjs(date).format('YYYY-MM-DD HH:mm');
  },

  getStartDayDefault() {
    return dayjs('2024-01-01').format('YYYY-MM-DD');
  },

  getStartDayBefore3Month() {
    return dayjs().subtract(3, 'month').format('YYYY-MM-DD');
  },

  getStartDayBeforeMonth(month: number) {
    return dayjs().subtract(month, 'month').format('YYYY-MM-DD');
  },

  getStartDayBeforeYear() {
    return dayjs().subtract(1, 'year').format('YYYY-MM-DD');
  },

  formatFullDate(date?: string) {
    return date ? dayjs(date).format('YYYY-MM-DD(ddd) HH:mm:ss') : '';
  },
  /// 이름 마스킹
  maskingName(name: string) {
    if (name.length <= 2) {
      return name.replace(name.substring(0, 1), '*');
    }

    return name[0] + '*'.repeat(name.substring(1, name.length - 1).length) + name[name.length - 1];
  },

  // 전화번호 마스킹
  maskingPhoneNumber(phoneNumber: string) {
    if (phoneNumber.indexOf('*') > -1) {
      return phoneNumber;
    } else {
      phoneNumber = this.getPhoneNumFormat(phoneNumber);
      const values = phoneNumber.split('-');

      values[1] = '*'.repeat(values[1].length);

      return values.join('-');
    }
  },

  // 전화번호 마스킹
  maskingPhoneNumber2(phoneNumber: string) {
    if (phoneNumber.indexOf('*') > -1) {
      return phoneNumber;
    } else {
      phoneNumber = this.getPhoneNumFormat(phoneNumber);
      const values = phoneNumber.split('-');

      values[1] = '*'.repeat(values[1].length);

      return values.join('');
    }
  },

  /** 소수점 값 구하기 */
  getDecimal(v: string | number, length: number): number {
    let result;
    result = Number(v) % 1;
    result = Number(result.toFixed(length));
    return result;
  },

  /// 숫자 콤마 넣기
  setComma(num: string | number): any {
    num = num + '';

    if (isNaN(Number(num))) {
      return '0';
    }
    const reg = /(^[+-]?\d+)(\d{3})/;
    num += '';
    while (reg.test(num)) {
      num = num.toString().replace(reg, '$1' + ',' + '$2');
    }
    return num;

    // if (!num) return '';
    // return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },
  setCommaSimple(value: any): string {
    if (value === null || value === undefined || isNaN(value)) return '';
    return Number(value).toLocaleString();
  },

  isNotAllowedFileMaxSize(file: File) {
    if (file) {
      if (file?.size <= 1024 * 1024 * 50) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  },
  isNullOrUndefined(inVal: string | number | undefined | object | CookieValueTypes) {
    if (inVal === null || inVal === undefined || inVal === '') {
      return true;
    } else {
      return false;
    }
  },
  checkEmail(inVal: string): boolean {
    const exptext = /^[A-Za-z0-9_.-]+@[A-Za-z0-9-]+\.[A-Za-z0-9-]+/;
    return exptext.test(inVal);
  },
  //// 숫자 콤마(천단위 등) 제거
  removeComma(target?: string): string {
    try {
      if (target === undefined || target === null) {
        return ''; // undefined나 null이 들어오는 경우를 처리
      }
      return target.replace(/,/g, '');
    } catch (e) {
      return '';
    }
  },
  leftPad(value: number) {
    if (value >= 10) {
      return value;
    }
    return `0${value}`;
  },
  toStringByFormatting(source: Date, delimiter = '-') {
    const year = source.getFullYear();
    const month = this.leftPad(source.getMonth() + 1);
    const day = this.leftPad(source.getDate());
    return [year, month, day].join(delimiter);
  },
  isEqualDay(day1: Date, day2: Date) {
    return this.toStringByFormatting(day1) === this.toStringByFormatting(day2);
  },
  removeMatch(targetVal: string, indexOfVal: string): string {
    const arrayVal = indexOfVal.split(',');
    for (let i = 0; i < arrayVal.length; i++) {
      if (targetVal.indexOf(arrayVal[i]) > -1) {
        return targetVal.replace(arrayVal[i], '').trim();
      }
    }
    return targetVal;
  },

  valueFormattedForCommonCode(codeList: Array<CodeDropDown>, code: string) {
    for (const codeDet of codeList) {
      if (codeDet.codeCd === code) {
        return codeDet.codeNm;
      }
    }
    return code;
  },

  comparator(valueA: any, valueB: any, nodeA: any, nodeB: any) {
    if (!valueA || valueA == '') {
      return 0;
    }
    if (nodeA.data.exclude && !nodeB.data.exclude) {
      return 1; // nodeA가 뒤로 가도록 설정
    }
    if (!nodeA.data.exclude && nodeB.data.exclude) {
      return -1; // nodeB가 뒤로 가도록 설정
    }
    if (nodeA.data.exclude && nodeB.data.exclude) {
      return 0; // 둘 다 제외되면 위치 고정
    }

    // 값이 undefined인 경우 기본값 처리
    if (valueA == null) valueA = '';
    if (valueB == null) valueB = '';

    // 문자열 비교
    if (typeof valueA === 'string') {
      return valueA.localeCompare(valueB); // 문자열 정렬
    }

    // 숫자 비교
    if (typeof valueA === 'number') {
      return valueA - valueB; // 숫자 정렬
    }

    return 0;
  },
  formatDate(value: string) {
    if (value.length == 9) {
      const [year, month, day] = value.split('-');
      const formattedMonth = month.padStart(2, '0');
      const formattedDay = day.padStart(2, '0');
      return `${year}-${formattedMonth}-${formattedDay}`;
    } else {
      return value;
    }
  },
  formatDateTwo(value: string) {
    if (value.length == 7) {
      const [year, month, day] = value.split('-');
      const formattedMonth = month.padStart(2, '0');
      const formattedDay = day.padStart(2, '0');
      return `${year}-${formattedMonth}-${formattedDay}`;
    } else {
      return value;
    }
  },
  datePickerOnClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target instanceof HTMLElement) {
      const input = (e.target.querySelector('input') as HTMLInputElement) || (e.target as HTMLInputElement);
      if (input?.value) {
        const clickPosition = input.selectionStart || 0;

        // YYYY-MM-DD 형식의 각 부분 위치 찾기
        const firstDash = input.value.indexOf('-');
        const secondDash = input.value.indexOf('-', firstDash + 1);
        // 연도 범위: 0 ~ firstDash
        // 월 범위: firstDash+1 ~ secondDash
        // 일 범위: secondDash+1 ~ space (또는 끝까지)

        if (clickPosition > secondDash && clickPosition <= 11) {
          // 일(DD) 부분 선택
          input.setSelectionRange(secondDash + 1, secondDash + 3);
        } else if (clickPosition > firstDash && clickPosition <= secondDash) {
          // 월(MM) 부분 선택
          input.setSelectionRange(firstDash + 1, firstDash + 3);
        } else if (clickPosition <= firstDash) {
          // 년(YYYY) 부분 선택
          input.setSelectionRange(0, 4);
        }
      }
    }
  },
  datePickerTwoOnClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target instanceof HTMLElement) {
      const input = (e.target.querySelector('input') as HTMLInputElement) || (e.target as HTMLInputElement);
      if (input?.value) {
        const clickPosition = input.selectionStart || 0;

        // YYYY-MM-DD 형식의 각 부분 위치 찾기
        const firstDash = input.value.indexOf('-');
        const secondDash = input.value.indexOf('-', firstDash + 1);
        // 연도 범위: 0 ~ firstDash
        // 월 범위: firstDash+1 ~ secondDash
        // 일 범위: secondDash+1 ~ space (또는 끝까지)

        if (clickPosition > secondDash && clickPosition <= 9) {
          // 일(DD) 부분 선택
          input.setSelectionRange(secondDash + 1, secondDash + 3);
        } else if (clickPosition > firstDash && clickPosition <= secondDash) {
          // 월(MM) 부분 선택
          input.setSelectionRange(firstDash + 1, firstDash + 3);
        } else if (clickPosition <= firstDash) {
          // 년(YYYY) 부분 선택
          input.setSelectionRange(0, 2);
        }
      }
    }
  },
  max3Rotation(inValue: number) {
    return ++inValue % 3;
  },
  getGubun(gbCode: string, defaul: string) {
    const gubunData: any = JSON.parse(localStorage.getItem(LOCAL_STORAGE_GUBUN) || '{}');
    // gbCode가 유효한 키인지 확인 (예: 'seller1', 'factory2' 등)
    if (gubunData && gbCode in gubunData) {
      return gubunData[gbCode as keyof any];
    }
    return defaul;
  },
  updateGubun(gbCode: string, gbName: string) {
    // 로컬 스토리지에서 데이터 가져오기
    const gubunData: Record<string, string> = JSON.parse(localStorage.getItem(LOCAL_STORAGE_GUBUN) || '{}');

    // 데이터 업데이트
    gubunData[gbCode] = gbName;

    // 업데이트된 데이터를 다시 로컬 스토리지에 저장
    localStorage.setItem(LOCAL_STORAGE_GUBUN, JSON.stringify(gubunData));
  },
  /**박근철 추가 day.js 형식으 string 이 json 변환과정에서 타임존이 변경되는 현상을 막기위해서 만든 공통함수 */
  changeDayjsToString(day?: string) {
    if (day) {
      return (day = dayjs(day).format('YYYY-MM-DD'));
    }
    return day;
  },

  isSameDay(firstDay: Dayjs, secondDay: Dayjs) {
    if (firstDay && secondDay) {
      return dayjs(firstDay).isSame(dayjs(secondDay), 'day');
    }
    return false;
  },

  isSameFromTo(firstDays: [Dayjs | null, Dayjs | null], secondDays: [Dayjs | null, Dayjs | null]) {
    if (firstDays && firstDays[0] && firstDays[1] && secondDays && secondDays[0] && secondDays[1]) {
      if (this.isSameDay(firstDays[0], secondDays[0]) && this.isSameDay(firstDays[1], secondDays[1])) {
        return true;
      }
    }
    return false;
  },

  isBeforeDay(firstDay: Dayjs, secondDay: Dayjs) {
    if (firstDay && secondDay) {
      return dayjs(firstDay).isBefore(dayjs(secondDay), 'day');
    }
    return false;
  },

  isAfterDay(firstDay: Dayjs, secondDay: Dayjs) {
    if (firstDay && secondDay) {
      return dayjs(firstDay).isAfter(dayjs(secondDay), 'day');
    }
    return false;
  },
  isDiffDay(firstDay: Dayjs, secondDay: Dayjs) {
    if (firstDay && secondDay) {
      return !dayjs(firstDay).isSame(dayjs(secondDay), 'day');
    }
    return false;
  },

  // 빠른일자를 먼저 배치해 리턴한다.
  firstMinDay(firstDay: Dayjs, secondDay: Dayjs): [Dayjs | null, Dayjs | null] {
    return dayjs(firstDay).isBefore(dayjs(secondDay), 'day') ? [firstDay, secondDay] : [secondDay, firstDay];
  },
  // 문자가 날짜 타입인지 체크
  isValidDate(dateString: string | null) {
    // 날짜 문자열이 유효한지 확인
    if (dateString) {
      if (dateString.length == 8) {
        const tempDate = dateString.substring(0, 4) + '-' + dateString.substring(4, 6) + '-' + dateString.substring(6, 8);
        const date = new Date(tempDate);
        // 유효하지 않은 날짜는 'Invalid Date' 객체가 됨
        // date.getTime()을 사용하여 Date 객체를 숫자로 변환
        return date instanceof Date && !isNaN(date.getTime());
      } else {
        const date = new Date(dateString);

        // 유효하지 않은 날짜는 'Invalid Date' 객체가 됨
        // date.getTime()을 사용하여 Date 객체를 숫자로 변환
        return date instanceof Date && !isNaN(date.getTime());
      }
    }
    return false;
  },
  // 숫자인지 확인
  isNumber(value: any) {
    return !isNaN(value) && typeof value === 'number';
  },
  calcPercentage(numerator: number, denominator: number) {
    return denominator !== 0 ? Math.round((numerator / denominator) * 100 * 100) / 100 : 0;
  },
  formatDateWithDay(dateStr?: string): string {
    // dateStr: "2025-04-29"
    if (!dateStr) return '일자없음';
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) return ''; // 유효하지 않은 날짜 처리

    const month = date.getMonth() + 1; // 월은 0부터 시작
    const day = date.getDate();

    const weekdays: string[] = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];

    return `${month}/${day} (${weekday})`;
  },
};
