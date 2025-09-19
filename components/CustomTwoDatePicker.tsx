import React, { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { DatePicker } from 'antd';
import { toastError } from './ToastMessage';
import { Utils } from '../libs/utils';

interface DisabledRange {
  before?: dayjs.Dayjs;
  after?: dayjs.Dayjs;
}

interface Props {
  title?: string;
  startName: string;
  endName: string;
  placeholder?: [string, string];
  value?: [string, string];
  required?: boolean;
  wrapperClassNames?: string;
  format?: string;
  filters?: object;
  disabledRange?: DisabledRange;
  onChange?: (name: string, value: string | number) => void;
  onEnter?: () => void;
  children?: React.ReactNode;
  labelDrowDown?: boolean;
}

export const CustomTwoDatePicker = ({
  title,
  startName,
  endName,
  placeholder,
  value,
  onChange,
  filters,
  required = false,
  wrapperClassNames,
  format = 'YY-MM-DD (ddd)',
  disabledRange,
  onEnter,
  children,
  labelDrowDown,
}: Props) => {
  const pickerValue = useRef<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const { RangePicker } = DatePicker;
  const [open, setOpen] = useState(false);

  const [isModifying, setModificationStatus] = useState(false);

  // focus 관련
  const [focusStates, setFocusStates] = useState<{ [key: string]: boolean }>({});
  const handleFocus = (name: string) => {
    setFocusStates((prev) => ({ ...prev, [name]: true }));
  };
  const handleBlur = (name: string) => {
    setFocusStates((prev) => ({ ...prev, [name]: false }));
  };

  useEffect(() => {
    if (value) {
      pickerValue.current = [dayjs(value[0]), dayjs(value[1])];
    }
  }, [value]);

  useEffect(() => {
    setModificationStatus(false);
  }, [pickerValue]);

  /* 금일, 금주, 금월, 금년 선택 */
  const handleToday = () => {
    const today = dayjs();
    const startDate = today.startOf('day');
    const endDate = today.endOf('day');
    pickerValue.current = [startDate, endDate];
    if (onChange) {
      onChange(startName, startDate.format('YYYY-MM-DD'));
      onChange(endName, endDate.format('YYYY-MM-DD'));
    }
  };
  const handleThisWeek = () => {
    const today = dayjs();
    const startDate = today.startOf('week');
    const endDate = today.endOf('week');
    pickerValue.current = [startDate, endDate];
    if (onChange) {
      onChange(startName, startDate.format('YYYY-MM-DD'));
      onChange(endName, endDate.format('YYYY-MM-DD'));
    }
  };
  const handleThisMonth = () => {
    const today = dayjs();
    const startDate = today.startOf('month');
    const endDate = today.endOf('month');
    pickerValue.current = [startDate, endDate];
    if (onChange) {
      onChange(startName, startDate.format('YYYY-MM-DD'));
      onChange(endName, endDate.format('YYYY-MM-DD'));
    }
  };
  const handleThisYear = () => {
    const today = dayjs();
    const startDate = today.startOf('year');
    const endDate = today.endOf('year');
    pickerValue.current = [startDate, endDate];
    if (onChange) {
      onChange(startName, startDate.format('YYYY-MM-DD'));
      onChange(endName, endDate.format('YYYY-MM-DD'));
    }
  };

  /* next, prev 이벤트 */
  const handlePrev = (unit: any) => {
    if (pickerValue.current) {
      const startDate = pickerValue.current[0]?.subtract(1, unit) || dayjs().subtract(1, unit).startOf(unit);
      const endDate = startDate.endOf(unit);
      pickerValue.current = [startDate, endDate];
      if (onChange) {
        onChange(startName, startDate.format('YYYY-MM-DD'));
        onChange(endName, endDate.format('YYYY-MM-DD'));
      }
    }
  };

  const handleNext = (unit: any) => {
    if (pickerValue.current) {
      const startDate = pickerValue.current[0]?.add(1, unit) || dayjs().add(1, unit).startOf(unit);
      const endDate = startDate.endOf(unit);
      pickerValue.current = [startDate, endDate];
      if (onChange) {
        onChange(startName, startDate.format('YYYY-MM-DD'));
        onChange(endName, endDate.format('YYYY-MM-DD'));
      }
    }
  };

  // 분기선택
  const handleQuarter = (quarter: number) => {
    const startDate = dayjs()
      .startOf('year')
      .add((quarter - 1) * 3, 'months');
    const endDate = startDate.add(2, 'months').endOf('month');
    pickerValue.current = [startDate, endDate];
    if (onChange) {
      onChange(startName, startDate.format('YYYY-MM-DD'));
      onChange(endName, endDate.format('YYYY-MM-DD'));
    }
  };

  const extraFooterRender = () => {
    return (
      <div className="datepickerBtn">
        <div className="date">
          <strong>날짜선택</strong>
          <div>
            <div className="day">
              <button onClick={() => handlePrev('day')}>이전</button>
              <button onClick={handleToday}>금일</button>
              <button onClick={() => handleNext('day')}>다음</button>
            </div>
            <div className="week">
              <button onClick={() => handlePrev('week')}>이전</button>
              <button onClick={handleThisWeek}>금주</button>
              <button onClick={() => handleNext('week')}>다음</button>
            </div>
            <div className="month">
              <button onClick={() => handlePrev('month')}>이전</button>
              <button onClick={handleThisMonth}>금월</button>
              <button onClick={() => handleNext('month')}>다음</button>
            </div>
            <div className="year">
              <button onClick={() => handlePrev('year')}>이전</button>
              <button onClick={handleThisYear}>금년</button>
              <button onClick={() => handleNext('year')}>다음</button>
            </div>
          </div>
        </div>
        <div className="quarter">
          <strong>분기선택</strong>
          <div>
            <button onClick={() => handleQuarter(1)}>1분기</button>
            <button onClick={() => handleQuarter(2)}>2분기</button>
            <button onClick={() => handleQuarter(3)}>3분기</button>
            <button onClick={() => handleQuarter(4)}>4분기</button>
          </div>
        </div>
      </div>
    );
  };

  const handleDatePickerChange = (dates: any) => {
    if (dates) {
      pickerValue.current = dates; // dates가 null이 아닐 때 pickerValue 업데이트
    } else {
      pickerValue.current = [null, null]; // dates가 null일 때 pickerValue 초기화
    }
  };

  const handleChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    handleDatePickerChange(dates);
    const startDate = dates?.[0] ? dayjs(dates[0]).format('YYYY-MM-DD') : null;
    const endDate = dates?.[1] ? dayjs(dates[1]).format('YYYY-MM-DD') : null;

    if (onChange) {
      if (startDate && endDate) {
        // 두 날짜를 문자열로 결합하여 전달 (ex: 'startDate=startDate, endDate=endDate')
        onChange(startName, startDate);
        onChange(endName, endDate);
      } else {
        // null인 경우 처리 (여기서는 startDate와 endDate를 별도로 전달)
        if (startDate !== null) onChange(startName, startDate);
        if (endDate !== null) onChange(endName, endDate);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    setTimeout(() => {
      const targetElement = event.target as HTMLInputElement;
      const positionSpace = (event.target as HTMLInputElement).value.replaceAll(' ', '').indexOf('(');
      const value = (event.target as HTMLInputElement).value.substring(0, positionSpace);
      if (event.key === 'Enter') {
        if (onEnter) {
          /** 반영된 날짜가 존재할 시(타이핑 후 엔터키를 사용하여 날짜를 반영한 이후) 작동 */
          if (onChange) {
            handleChange(pickerValue.current);
          }
          onEnter();
        } else {
          console.log('exe');
          if (value.includes('-')) {
            /** '-' 기호를 사용하여 날짜를 작성한 경우 */
            if (value.length == 8) {
              if (dayjs(value, 'YY-MM-DD').toDate().toString() == 'Invalid Date') {
                toastError('유효한 날짜 형식이 아닙니다.');
              } else {
                console.log('value=========>', value); //dayjs(value, 'YY-MM-DD')
                if (targetElement.getAttribute('date-range') == 'start') {
                  pickerValue.current = [dayjs(value, 'YY-MM-DD'), pickerValue.current ? pickerValue.current[0] : null];
                } else if (targetElement.getAttribute('date-range') == 'end') {
                  pickerValue.current = [pickerValue.current ? pickerValue.current[0] : null, dayjs(value, 'YY-MM-DD')];
                  setOpen(false);
                }
              }
            } else if (value.length == 10) {
              if (dayjs(value, 'YYYY-MM-DD').toDate().toString() == 'Invalid Date') {
                toastError('유효한 날짜 형식이 아닙니다.');
              } else {
                console.log(value);
                if (targetElement.getAttribute('date-range') == 'start') {
                  pickerValue.current = [dayjs(value, 'YYYY-MM-DD'), pickerValue.current ? pickerValue.current[0] : null];
                } else if (targetElement.getAttribute('date-range') == 'end') {
                  pickerValue.current = [pickerValue.current ? pickerValue.current[0] : null, dayjs(value, 'YYYY-MM-DD')];
                  setOpen(false);
                }
              }
            } else {
              toastError('2자리 혹은 4자리 연도를 가지는 완전한 날짜 형식을 입력하십시요.');
            }
          } else {
            /** 순수 숫자로만 날짜를 작성한 경우 */
            if (value.length == 6) {
              const suggested = value.slice(0, 2) + '-' + value.slice(2, 4) + '-' + value.slice(4, 6);
              if (dayjs(suggested, 'YY-MM-DD').toDate().toString() == 'Invalid Date') {
                toastError('유효한 날짜 형식이 아닙니다.');
              } else {
                console.log(suggested);
                if (targetElement.getAttribute('date-range') == 'start') {
                  pickerValue.current = [dayjs(suggested, 'YY-MM-DD'), pickerValue.current ? pickerValue.current[0] : null];
                } else if (targetElement.getAttribute('date-range') == 'end') {
                  pickerValue.current = [pickerValue.current ? pickerValue.current[0] : null, dayjs(suggested, 'YY-MM-DD')];
                  setOpen(false);
                }
              }
            } else if (value.length == 8) {
              const suggested = value.slice(0, 4) + '-' + value.slice(4, 6) + '-' + value.slice(6, 8);
              if (dayjs(suggested, 'YYYY-MM-DD').toDate().toString() == 'Invalid Date') {
                toastError('유효한 날짜 형식이 아닙니다.');
              } else {
                console.log(suggested);
                if (targetElement.getAttribute('date-range') == 'start') {
                  pickerValue.current = [dayjs(suggested, 'YYYY-MM-DD'), pickerValue.current ? pickerValue.current[0] : null];
                } else if (targetElement.getAttribute('date-range') == 'end') {
                  pickerValue.current = [pickerValue.current ? pickerValue.current[0] : null, dayjs(suggested, 'YYYY-MM-DD')];
                  setOpen(false);
                }
              }
            }
          }
          /** 시작 날짜 선택 영역에서 종료 날짜 영역으로의 포커싱을 지원하는 영역 */
          if (typeof window !== 'undefined') {
            const allDatePickerNodes = document.querySelectorAll('input[date-range]');
            for (let i = 0; i < allDatePickerNodes.length; i++) {
              if (allDatePickerNodes[i].getAttribute('date-range') != targetElement.getAttribute('date-range')) {
                (allDatePickerNodes[i] as HTMLInputElement).focus();
              }
            }
          }
        }
      } else {
        //setModificationStatus(true);
        console.log('pickerValue.current===>', pickerValue.current);
        if (targetElement.getAttribute('date-range') == 'start' && pickerValue.current) {
          if (value.length === 8) {
            const replaced: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [dayjs(value, 'YY-MM-DD'), pickerValue.current[1]];
            console.log('replaced start===>', replaced);
            pickerValue.current = replaced;
          }
        } else if (targetElement.getAttribute('date-range') == 'end' && pickerValue.current) {
          if (value.length === 8) {
            const replaced: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [pickerValue.current[0], dayjs(value, 'YY-MM-DD')];
            console.log('replaced end ===>', replaced);
            pickerValue.current = replaced;
            setTimeout(() => {
              setOpen(false);
            }, 1000);
            //setOpen(false);
          }
        }
      }
    }, 0);
  };

  return (
    <dl className={wrapperClassNames}>
      <dt>
        {labelDrowDown ? children : <label>{title}</label>}
        {required && <span className="req">*</span>}
      </dt>
      <dd>
        <div className={`formBox ${focusStates[startName] ? 'focus' : ''} border`}>
          <RangePicker
            format={format}
            value={pickerValue.current}
            placeholder={placeholder}
            renderExtraFooter={extraFooterRender}
            open={open}
            onOpenChange={(isOpen) => setOpen(isOpen)}
            //onChange={handleDatePickerChange}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              handleFocus(startName);
            }}
            onBlur={() => {
              handleBlur(startName);
            }}
            onClick={Utils.datePickerTwoOnClick}
          />
        </div>
      </dd>
    </dl>
  );
};

export default CustomTwoDatePicker;
