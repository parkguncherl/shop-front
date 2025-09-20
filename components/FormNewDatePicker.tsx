import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { DatePicker, Select } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ko'; // 한국어 로케일 추가
import weekday from 'dayjs/plugin/weekday'; // week 시작일 설정
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Control, FieldError, FieldValues, Path, useController } from 'react-hook-form';
// 플러그인 등록
dayjs.extend(utc);
dayjs.extend(timezone);
// 기본 타임존을 한국(KST)으로 설정
dayjs.tz.setDefault('Asia/Seoul');

dayjs.extend(weekday); // weekday 플러그인 확장
dayjs.locale('ko'); // 기본 한국어 로케일 사용

type ICustomNewDatePickerProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  title?: string;
  type?: 'date' | 'range';
  value?: string;
  disabled?: boolean;
  onChange?: (name: any, value: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  required?: boolean;
  filters?: object;
  format?: string;
  defaultValue?: string;
  onClick?: () => void;
  className?: string;
  onFieldErrorChanged?: (error: FieldError | undefined) => void; // 유효한 에러가 발생하거나 다른 에러가 발생하여 errorStatus 의 값이 변할 시 호출
  selectType?: 'today' | 'week' | 'month' | 'year' | 'type';
};

const FormNewDatePicker = function CustomNewDatePicker<T extends FieldValues>({
  control,
  name,
  title,
  type,
  placeholder,
  required,
  filters,
  format = 'YYYY-MM-DD (ddd)',
  defaultValue,
  onClick,
  className,
  onFieldErrorChanged,
  selectType,
  ...props
}: ICustomNewDatePickerProps<T>) {
  const {
    field: { value, onChange, ref: fieldRef },
    fieldState: { error },
  } = useController({ name, control });

  const [dropDownValue, setDropDownValue] = useState('today');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [rangeDate, setRangeDate] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [open, setOpen] = useState(false);

  // value 설정
  useEffect(() => {
    if (type === 'date') {
      // value가 유효한 날짜 형식인지 체크하고 dayjs로 변환
      const parsedDate = dayjs(value);
      if (parsedDate.isValid()) {
        setSelectedDate(parsedDate);
      } else {
        setSelectedDate(null); // 유효하지 않으면 null로 설정
      }
    } else {
      // 'range' 타입일 때는 value가 배열 형태인지 확인
      if (Array.isArray(value) && value.length === 2) {
        console.log('벨류', value);
        const startDate = dayjs(value[0]);
        const endDate = dayjs(value[1]);
        if (startDate.isValid() && endDate.isValid()) {
          setRangeDate([startDate, endDate]);
        } else {
          setRangeDate([null, null]); // 유효하지 않으면 [null, null]
        }
      } else {
        setRangeDate([null, null]); // value가 배열이 아니면 초기화
      }
      // range 타입일때 selectType가 있으면
      if (selectType) {
        setDropDownValue(selectType);
      }
    }
  }, [type]);

  // 날짜 변경 핸들러
  const handleOnChange = (date: Dayjs | null) => {
    if (!date) {
      setSelectedDate(null);
      return;
    }

    const formattedValue = date.format(format);
    setSelectedDate(date); // 선택된 날짜 설정

    console.log(formattedValue);
    onChange && onChange(dropDownValue, formattedValue);
  };

  // 날짜 범위 계산 (주, 월, 연)
  const handleRangeChange = (date: Dayjs | null, rangeType: string) => {
    if (!date) {
      setRangeDate([null, null]);
      return;
    }

    let startDate: Dayjs;
    let endDate: Dayjs;

    if (rangeType === 'week') {
      startDate = date.startOf('week').add(1, 'day'); // 월요일
      endDate = startDate.endOf('week').add(1, 'day'); // 일요일
    } else if (rangeType === 'month') {
      startDate = date.startOf('month');
      endDate = date.endOf('month');
    } else if (rangeType === 'year') {
      startDate = date.startOf('year');
      endDate = date.endOf('year');
    } else if (rangeType === 'today') {
      // "오늘"일 때는 오늘 ~ 오늘로 처리
      startDate = date;
      endDate = date;
    } else {
      // rangeType이 유효하지 않으면 리턴
      return;
    }

    const formattedStart = startDate.format(format);
    const formattedEnd = endDate.format(format);

    setSelectedDate(startDate); // 시작일 설정
    setRangeDate([startDate, endDate]); // [startDate, endDate] 형식으로 설정

    console.log({ startDate: formattedStart, endDate: formattedEnd });
    onChange && onChange(rangeType, `${formattedStart} ~ ${formattedEnd}`);
  };

  const rangeRef = useRef<any>(null);
  // 날짜 포맷팅 함수
  const handleRangeChanged = (dates: [Dayjs | null, Dayjs | null] | null, dateStrings: [string, string]) => {
    if (dates) {
      setRangeDate(dates); // 상태 업데이트
      const formattedStart = dates[0]?.format(format); // 시작일 포맷팅
      const formattedEnd = dates[1]?.format(format); // 종료일 포맷팅
      onChange && onChange('range', `${formattedStart} ~ ${formattedEnd}`); // 변경된 날짜를 부모로 전달
    }
  };

  // 키 이벤트 처리
  const handleKeyDown = (e: any) => {
    const target = e.target;

    const selectionStart = target.selectionStart;
    if (selectionStart === null) return;

    const inputs = e.target.closest('.ant-picker')?.querySelectorAll('.ant-picker-input input');
    if (!inputs || inputs.length < 2) return;

    const firstInput = inputs[0]; // 시작 날짜 input
    const secondInput = inputs[1]; // 종료 날짜 input

    const moveCursor = (input: HTMLInputElement, start: number, end: number) => {
      e.preventDefault();
      input.focus();
      setTimeout(() => {
        input.setSelectionRange(start, end);
      }, 0);
    };
    if (e.key === 'ArrowRight') {
      if (target instanceof HTMLInputElement) {
        if (target === firstInput) {
          if (selectionStart >= 8 && selectionStart <= 10) {
            moveCursor(secondInput, 0, 4);
          }
        }
      }
    }
    if (e.key === 'ArrowLeft') {
      if (target instanceof HTMLInputElement) {
        if (target === secondInput) {
          if (selectionStart >= 0 && selectionStart <= 4) {
            moveCursor(firstInput, 8, 10);
          }
        }
      }
    }
  };

  // 이전, 다음 버튼
  const handleClickPrevNext = (type: string, direction: string) => {
    let newDate = selectedDate;
    let startDate: Dayjs;
    let endDate: Dayjs;

    switch (type) {
      case 'date': {
        if (!selectedDate) return;
        // 하루 이동
        newDate = direction === 'prev' ? selectedDate.subtract(1, 'day') : selectedDate.add(1, 'day');
        setSelectedDate(newDate);
        onChange && onChange('date', newDate.format(format));
        return;
      }

      case 'today': {
        if (!rangeDate[0] || !rangeDate[1]) return;
        // 오늘
        startDate = direction === 'prev' ? rangeDate[0].subtract(1, 'day') : rangeDate[0].add(1, 'day');
        endDate = direction === 'prev' ? rangeDate[1].subtract(1, 'day') : rangeDate[1].add(1, 'day');
        break;
      }

      case 'week': {
        if (!rangeDate[0] || !rangeDate[1]) return;
        // 주간 이동
        startDate =
          direction === 'prev' ? rangeDate[0].subtract(1, 'week').startOf('week').add(1, 'day') : rangeDate[0].add(1, 'week').startOf('week').add(1, 'day');
        endDate = startDate.endOf('week').add(1, 'day');
        break;
      }

      case 'month': {
        if (!rangeDate[0] || !rangeDate[1]) return;
        // 월간 이동
        startDate = direction === 'prev' ? rangeDate[0].subtract(1, 'month').startOf('month') : rangeDate[0].add(1, 'month').startOf('month');
        endDate = startDate.endOf('month');
        break;
      }

      case 'year': {
        if (!rangeDate[0] || !rangeDate[1]) return;
        // 연간 이동
        startDate = direction === 'prev' ? rangeDate[0].subtract(1, 'year').startOf('year') : rangeDate[0].add(1, 'year').startOf('year');
        endDate = startDate.endOf('year');
        break;
      }

      case 'type': {
        if (!rangeDate[0] || !rangeDate[1]) return;
        // 사용자가 선택한 기간만큼 이동
        const rangeDiff = rangeDate[1].diff(rangeDate[0], 'day'); // 기간 차이 계산
        startDate =
          direction === 'prev'
            ? rangeDate[0].subtract(rangeDiff + 1, 'day') // 기존 기간만큼 이동
            : rangeDate[0].add(rangeDiff + 1, 'day');
        endDate = startDate.add(rangeDiff, 'day');
        break;
      }

      default:
        return;
    }

    // 주/월/년 이동 시 범위 상태 업데이트
    setRangeDate([startDate, endDate]);
    setSelectedDate(startDate); // 시작일을 기준으로 저장

    const formattedStart = startDate.format(format);
    const formattedEnd = endDate.format(format);

    onChange && onChange(type, `${formattedStart} ~ ${formattedEnd}`);
  };

  // 결과날짜 클릭시 달력띄우기
  const [focusClassName, setFocusClassName] = useState<boolean>(false);
  const handleResultClick = () => {
    setOpen(true);
    setFocusClassName(true);
  };
  useEffect(() => {
    if (!open) {
      setFocusClassName(false);
    }
  }, [open]);

  return (
    <div className={`datePickerBox ${!(type === 'date') ? 'range' : ''}`}>
      {type === 'date' ? (
        <>
          {title ? (
            <dl className={className}>
              <dt>
                <label>{title}</label>
                {required && <span className="req">*</span>}
              </dt>
              <dd>
                <div className="formBox">
                  <DatePicker value={selectedDate} onChange={handleOnChange} format={format} placeholder={placeholder} needConfirm name={name} />
                  <button
                    className={'left'}
                    onClick={() => {
                      handleClickPrevNext('date', 'prev');
                    }}
                  >
                    왼쪽
                  </button>
                  <button
                    className={'right'}
                    onClick={() => {
                      handleClickPrevNext('date', 'next');
                    }}
                  >
                    오른쪽
                  </button>
                </div>
              </dd>
            </dl>
          ) : (
            <div className={`formBox ${className}`}>
              <DatePicker value={selectedDate} onChange={handleOnChange} format={format} placeholder={placeholder} needConfirm name={name} />
              <button
                className={'left'}
                onClick={() => {
                  handleClickPrevNext('date', 'prev');
                }}
              >
                왼쪽
              </button>
              <button
                className={'right'}
                onClick={() => {
                  handleClickPrevNext('date', 'next');
                }}
              >
                오른쪽
              </button>
            </div>
          )}
        </>
      ) : (
        <dl className={className}>
          <dt>
            <Select
              value={dropDownValue}
              onChange={(value) => {
                setDropDownValue(value); // 드롭다운 값 변경
                // 드롭다운 값 변경 시, startDate와 endDate를 초기화
                setRangeDate([null, null]);
                setSelectedDate(null);
              }}
              popupClassName={'dateDropDown'}
            >
              <Select.Option value="today">오늘</Select.Option>
              <Select.Option value="week">주간</Select.Option>
              <Select.Option value="month">월간</Select.Option>
              <Select.Option value="year">1년</Select.Option>
              <Select.Option value="type">직접입력</Select.Option>
            </Select>
          </dt>
          <dd>
            <div className={`formBox ${dropDownValue === 'type' ? 'type' : ''} ${focusClassName ? 'focus' : ''}`}>
              {dropDownValue === 'type' ? (
                // "직접입력" 선택 시 범위 선택기 사용
                <>
                  <DatePicker.RangePicker
                    ref={rangeRef}
                    name={name}
                    value={rangeDate} // [startDate, endDate] 배열로 전달
                    onChange={handleRangeChanged}
                    format={{ format: 'YYYY-MM-DD', type: 'mask' }}
                    onKeyDown={handleKeyDown}
                    open={open}
                    onOpenChange={(isOpen) => {
                      setTimeout(() => {
                        setOpen(true); // 달력이 닫히려는 기본 동작을 방지
                      }, 0);
                    }} // 달력 열리고 닫히는 상태 관리
                    renderExtraFooter={() => (
                      <div className={'typeBox'}>
                        <button
                          onClick={() => {
                            setOpen(false);
                            // handleConfirm('type');
                          }}
                        >
                          확인
                        </button>
                      </div>
                    )}
                  />
                  <button
                    className={'left'}
                    onClick={() => {
                      handleClickPrevNext('type', 'prev');
                    }}
                  >
                    왼쪽
                  </button>
                  <button
                    className={'right'}
                    onClick={() => {
                      handleClickPrevNext('type', 'next');
                    }}
                  >
                    오른쪽
                  </button>
                </>
              ) : (
                <>
                  <DatePicker
                    value={selectedDate}
                    onChange={(date) => handleRangeChange(date, dropDownValue)}
                    name={name}
                    format={format}
                    picker={dropDownValue === 'week' ? 'week' : dropDownValue === 'month' ? 'month' : dropDownValue === 'year' ? 'year' : 'date'}
                    inputReadOnly
                    open={open}
                    onOpenChange={(isOpen) => setOpen(isOpen)}
                    needConfirm
                  />
                  {rangeDate[0] && rangeDate[1] && (
                    <span className={'resultDate'} onClick={handleResultClick}>
                      <span>{rangeDate[0].format(format)}</span> <em>~</em> <span>{rangeDate[1].format(format)}</span>
                    </span>
                  )}
                  <button
                    className={'left'}
                    onClick={() => {
                      handleClickPrevNext(dropDownValue, 'prev');
                    }}
                  >
                    왼쪽
                  </button>
                  <button
                    className={'right'}
                    onClick={() => {
                      handleClickPrevNext(dropDownValue, 'next');
                    }}
                  >
                    오른쪽
                  </button>
                </>
              )}
            </div>
          </dd>
        </dl>
      )}
    </div>
  );
};
export default FormNewDatePicker;
