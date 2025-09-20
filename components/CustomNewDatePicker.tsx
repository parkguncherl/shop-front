import React, { useEffect, useRef, useState, useImperativeHandle } from 'react';
import { DatePicker, Select } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ko'; // 한국어 로케일 추가
import weekday from 'dayjs/plugin/weekday'; // week 시작일 설정
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { toastError } from './ToastMessage';
import { RangePickerProps } from 'antd/es/date-picker';
import { useSession } from 'next-auth/react';
import { Utils } from '../libs/utils';
// 플러그인 등록
dayjs.extend(utc);
dayjs.extend(timezone);
// 기본 타임존을 한국(KST)으로 설정
dayjs.tz.setDefault('Asia/Seoul');
dayjs.extend(weekday); // weekday 플러그인 확장
dayjs.locale('ko'); // 기본 한국어 로케일 사용

export type DatePickerSelectType = 'today' | 'week' | 'month' | 'year' | 'type';

export interface CustomNewDatePickerRefInterface {
  initDatePicker: (type: DatePickerSelectType, startDate: Dayjs, endDate: Dayjs) => void;
  datePickerFocus: () => void;
}

interface Props {
  title?: string;
  type?: 'date' | 'range';
  name?: string;
  startName?: string;
  endName?: string;
  value?: string | string[];
  disable?: boolean;
  onChange?: (name: any, value: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  required?: boolean;
  filters?: object;
  format?: string;
  defaultValue?: string;
  onClick?: () => void;
  className?: string;
  selectType?: DatePickerSelectType;
  maxDays?: number;
  defaultType?: string;
  //autoFocus?: boolean; // 최초 랜더링 혹은 upperComponentIsOpened 속성이 true 로 변할 경우 자동 포커싱
  initDatePicker?: (selectedType: DatePickerSelectType, startDate: Dayjs, endDate: Dayjs) => void;
  disabled?: boolean; // 디스에이블 여부 date타입만 적용 20250326
  //upperComponentIsOpened?: boolean; // 상위 컴포넌트가 열림으로 인하여 CustomNewDatePicker 가 랜더링 될 시 상위 컴포넌트 열림 상태를 인자로 할당하면 초기 랜더링 시 사용 가능한 기능들을 팝업과 같은 영역에서도 사용할 수 있다.
}

const CustomNewDatePicker = React.forwardRef<CustomNewDatePickerRefInterface, Props>((props, ref) => {
  const {
    title,
    startName,
    endName,
    placeholder,
    value,
    name,
    onChange,
    onEnter,
    type,
    required = false,
    filters,
    format = 'YYYY-MM-DD (ddd)',
    defaultValue,
    onClick,
    maxDays,
    selectType,
    className,
    defaultType,
    //autoFocus = false,
    initDatePicker,
    //upperComponentIsOpened,
    disabled,
  } = props;
  CustomNewDatePicker.displayName = 'CustomNewDatePicker';
  const session = useSession();
  const [dropDownValue, setDropDownValue] = useState(defaultType || 'type');
  const [saveDefaultValue, setSaveDefaultValue] = useState(value);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [tempRange, setTempRange] = useState<[Dayjs | null, Dayjs | null]>(type == 'range' ? (value as any) : [null, null]);
  const [rangeDate, setRangeDate] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [open, setOpen] = useState(false);
  const [showTitleOption, setShowTitleOption] = useState(!!title);
  const [panelMode, setPanelMode] = useState(dropDownValue);
  const [isLock, setIsLock] = useState(false);
  const [isOptionOpen, setIsOptionOpen] = useState(false);
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd) : dayjs(new Date());
  const datePickerRef = useRef<React.ComponentRef<typeof DatePicker>>(null);

  useImperativeHandle(ref, () => ({
    initDatePicker: handleInitDatePicker, // useImperativeHandle을 사용하여 외부에서 handleInitDatePicker 호출 가능하게 설정
    datePickerFocus: () => {
      datePickerRef.current?.focus();
    }, // type == 'date' 인 경우 한정으로 사용 가능
  }));

  const daySelectArray = [
    [0, 4],
    [5, 7],
    [8, 10],
  ];

  const options = [
    { value: 'type', label: defaultType == 'type' && !isOptionOpen && title ? title : '입력' },
    { value: 'today', label: '오늘' },
    { value: 'week', label: '주간' },
    { value: 'month', label: '월간' },
    { value: 'year', label: '1년' },
  ].filter((option) => (selectType == defaultType ? defaultType == option.value : true)); // 한가지만 선택해야 되는경우

  const handleInitDatePicker = (type: DatePickerSelectType, startDate: Dayjs, endDate: Dayjs) => {
    console.log('park type ==============1>', type, startDate, endDate);
    setOpen(false);
    setDropDownValue(type);
    setRangeDate([startDate, endDate]);
    setTempRange([startDate, endDate]);
  };

  /* const options = showTitleOption
      ? [{ value: title, label: title }] // showTitle이 true일 때만 추가
      : [
        { value: 'type', label: '입력' },
        { value: 'today', label: '오늘' },
        { value: 'week', label: '주간' },
        { value: 'month', label: '월간' },
        { value: 'year', label: '1년' },
      ].filter((option) => (selectType == defaultType ? defaultType == option.value : true)); // 한가지만 선택해야 되는경우*/

  const moveSelection = (inPositons: number, input: HTMLInputElement) => {
    if (input) {
      input.focus();
      setTimeout(() => {
        input.setSelectionRange(daySelectArray[inPositons][0], daySelectArray[inPositons][1]);
      }, 0);
    }
  };

  const nowPosition = (inPositon: number) => {
    for (let i = 0; i < daySelectArray.length; i++) {
      if (daySelectArray[i][0] <= inPositon && inPositon <= daySelectArray[i][1]) {
        return i;
      }
    }
    return 0;
  };

  useEffect(() => {
    console.log('park useEffect type  === saveDefaultValue ==>>', type, saveDefaultValue);
  }, [saveDefaultValue]);

  useEffect(() => {
    setOpen(false);
    if (defaultType) {
      setDropDownValue(defaultType);
    }
  }, [defaultType]);

  useEffect(() => {
    console.log('park start  range[' + type + ']=====> value', value, ' type : ', type, defaultType, selectType, showTitleOption);
    if (type === 'range') {
      // 'range' 타입일 때는 value가 배열 형태인지 확인
      if (Array.isArray(value) && value.length === 2) {
        const startDate = dayjs(value[0]);
        const endDate = dayjs(value[1]);
        if (startDate.isValid() && endDate.isValid()) {
          setRangeDate([startDate, endDate]);
          setTempRange([startDate, endDate]);
        } else {
          setRangeDate([null, null]); // 유효하지 않으면 [null, null]
        }
      } else {
        setRangeDate([null, null]); // value가 배열이 아니면 초기화
      }
    } else if (type === 'date') {
      // value가 유효한 날짜 형식인지 체크하고 dayjs로 변환
      const parsedDate = dayjs((value as string) || defaultValue);
      if (parsedDate.isValid()) {
        setSelectedDate(parsedDate);
      } else {
        setSelectedDate(null); // 유효하지 않으면 null로 설정
      }
    }

    console.log('park showTitleOption', showTitleOption, ' defaultType:', defaultType, ' dropDownValue:', dropDownValue, ' type:', type);
    /*
      if (isOptionChange && defaultType != dropDownValue) {
        if (type == 'range') {
          if (Array.isArray(value) && value.length === 2) {
            const startDate = dayjs(value[0]);
            const endDate = dayjs(value[1]);
            if (Utils.isSameFromTo([startDate, endDate], tempRange)) {
              if (Utils.isSameFromTo([startDate, endDate], rangeDate)) {
                //alert('change : ' + defaultType);
                setDropDownValue(defaultType || 'type');
              }
            }
          }
        }
      }
*/
  }, [JSON.stringify(value)]);

  /*useEffect(() => {
      if (upperComponentIsOpened != undefined) {
        console.log(autoFocus, upperComponentIsOpened);
        if (autoFocus && upperComponentIsOpened) {
          setTimeout(() => {
            console.log(datePickerRef.current);
            datePickerRef.current?.focus();
          }, 1000);
        }
      } else {
        // upperComponentIsOpened 미정의한 경우의 최초 랜더링 시점 동작
        if (autoFocus) {
          datePickerRef.current?.focus();
        }
      }
    }, [upperComponentIsOpened]);*/

  // 날짜 변경 핸들러
  const handleOnChange = (date: Dayjs | null) => {
    if (!date) {
      //      setSelectedDate(null);
      console.log('park handleOnChange 5555555555555 undefinde');
    } else if (open) {
      console.log('park handleOnChange 666666666', date?.format(format));
      const formattedValue = date.format(format);
      setSelectedDate(date); // 선택된 날짜 설정
      onChange && onChange(dropDownValue, formattedValue);
      if (onChange) {
        onChange(name, date.format('YYYY-MM-DD'));
      }
    }
  };

  const settingDefaultValue = (rangeType: string, day: Dayjs | null): [Dayjs, Dayjs] => {
    const settingDay = day ? day : today;
    if (rangeType === 'week') {
      const startDate = settingDay.startOf('week').add(1, 'day'); // 월요일
      const endDate = settingDay.endOf('week').add(1, 'day'); // 일요일
      return [startDate, endDate];
    } else if (rangeType === 'month') {
      const startDate = settingDay.startOf('month');
      const endDate = settingDay.endOf('month');
      return [startDate, endDate];
    } else if (rangeType === 'year') {
      const startDate = settingDay.startOf('year');
      const endDate = settingDay.endOf('year');
      return [startDate, endDate];
    } else if (rangeType === 'today') {
      // "오늘"일 때는 오늘 ~ 오늘로 처리
      const startDate = settingDay;
      const endDate = settingDay;
      return [startDate, endDate];
    } else {
      const startDate = settingDay;
      const endDate = settingDay;
      return [startDate, endDate];
    }
  };

  // 날짜 범위 계산 (주, 월, 연)
  const handleRangeChange = (date: Dayjs | null, rangeType: string) => {
    console.log('park === handleRangeChange');
    if (!date) {
      setRangeDate([null, null]);
      return;
    }

    const startDate: Dayjs = settingDefaultValue(rangeType, date)[0];
    const endDate: Dayjs = settingDefaultValue(rangeType, date)[1];

    // maxDays 제한 체크
    console.log('max', maxDays, rangeType, endDate.diff(startDate, 'day') + 1);
    if (maxDays && endDate.diff(startDate, 'day') + 1 > maxDays) {
      toastError(`최대 ${maxDays}일까지만 선택할 수 있어요`);
      return;
    }

    setSelectedDate(startDate); // 시작일 설정
    setRangeDate([startDate, endDate]); // [startDate, endDate] 형식으로 설정

    if (onChange) {
      if (type === 'date') {
        onChange(name, startDate.format('YYYY-MM-DD'));
      }
    }
  };

  const onCalendarChange: RangePickerProps['onCalendarChange'] = (dates, _, info) => {
    console.log(
      'park 인포 [' + dayjs().format('HH:mm:ss') + ']★★★★★★★★★★★★★★',
      info,
      info.range,
      'dates',
      dates[0]?.format(format),
      dates[1]?.format(format),
      'temp',
      tempRange[0]?.format(format),
      tempRange[1]?.format(format),
    );

    if (dates && dates[0] && dates[1] && tempRange[0] && tempRange[1]) {
      const newBornDay = findNewDay(info.range || 'start', tempRange[0], tempRange[1], dates);
      if (!newBornDay) {
        console.log('park 인포 out newBornDay ', dayjs(newBornDay).format(format));
        return;
      }

      console.log('park 인포 newBornDay ==>', info.range, '  newBornDay=>', dayjs(newBornDay).format(format));

      if (Utils.isSameDay(tempRange[0], tempRange[1])) {
        const rangeDates = Utils.firstMinDay(newBornDay!, tempRange[1]);
        console.log(
          'park 인포 info.range isSameDay 111111=================>>>',
          dates[0]?.format(format),
          ' rangeDates =>',
          rangeDates[0]?.format(format),
          rangeDates[1]?.format(format),
          Utils.firstMinDay(newBornDay, tempRange[1]),
        );
        setTempRange(rangeDates);
      } else {
        setTempRange([newBornDay, newBornDay]);
        console.log(
          'park 인포 info.range not same 222222===makesame====newBornDay[' + dayjs(newBornDay).format(format) + ']========== dates[0]',
          dates[0]?.format(format),
          Utils.firstMinDay(dates[0], dates[0]),
        );
      }
      //          setIsStartSelected(true);
    }
  };

  const findNewDay = (range: string, targetDay: Dayjs, targetDay2: Dayjs, mainDays: [Dayjs | null, Dayjs | null]) => {
    if (targetDay && targetDay2 && mainDays && mainDays[0] && mainDays[1]) {
      const isDifFirstValue = Utils.isDiffDay(targetDay, mainDays[0]) && Utils.isDiffDay(targetDay2, mainDays[0]);
      const isDifSecoundValue = Utils.isDiffDay(targetDay, mainDays[1]) && Utils.isDiffDay(targetDay2, mainDays[1]);

      if (isDifSecoundValue && isDifFirstValue) {
        if (range == 'end') {
          console.log('park end 111111111===', dayjs(mainDays[1]).format(format));
          return mainDays[1];
        } else {
          return mainDays[0];
        }
      }

      if (Utils.isSameDay(mainDays[0], mainDays[1])) {
        console.log('park findNewDay 1===', dayjs(mainDays[0]).format(format));
        return mainDays[0];
      }

      if (isDifFirstValue) {
        console.log('park findNewDay 2===', dayjs(mainDays[0]).format(format));
        return mainDays[0];
      }

      if (isDifSecoundValue) {
        console.log('park findNewDay 3===', dayjs(mainDays[1]).format(format));

        return mainDays[1];
      }

      if (isDifSecoundValue && isDifFirstValue) {
        if (range == 'end') {
          console.log('park end 111111111===', dayjs(mainDays[1]).format(format));
          return mainDays[1];
        }
      }

      if (Utils.isSameDay(targetDay, targetDay2)) {
        if (range == 'end') {
          console.log('park end 222222222222222222===', dayjs(mainDays[1]).format(format));
          return mainDays[1];
        }
      }
    }

    return null;
  };

  const handleConfirm = () => {
    setIsLock(false);
    setRangeDate(tempRange);
    setOpen(false);

    if (onChange) {
      if (!tempRange) {
        // console.log('Clear 후 값 반영', '');
        onChange(name, '');
      }
    }
  };

  // 키 이벤트 처리
  const handleKeyDownToday = (e: any) => {
    const target = e.target;
    const selectionStart = target.selectionStart;
    if (selectionStart === null) {
      console.log('park return selection start null =============');
      return;
    }

    const inputs = e.target.closest('.ant-picker')?.querySelectorAll('.ant-picker-input input');
    const firstInput = inputs[0].value.substring(0, 10); // 시작 날짜 input
    console.log('park ]★★★★★★★★★★★★★★ handleKeyDownToday  key, selectionStart==>', e.key, selectionStart, 'firstInput==>', firstInput);

    if (e.key == 'Delete') {
      setSelectedDate(null);
      return;
    }

    if (!Utils.isValidDate(firstInput)) {
      console.log('park ★★★★★★★★★★★★★★ handleKeyDown  xxxxxx is not valid firstInput=>', firstInput);
      if (firstInput.length === 8 && !isNaN(firstInput)) {
        const eightDate = firstInput.substring(0, 8);
        setOpen(false);
        console.log('park ★★★★★★★★★★★★★★ =============== handleKeyDowntoday  is eightDate=>', eightDate);
        setTempRange([dayjs(eightDate), dayjs(eightDate)]);
        setRangeDate([dayjs(eightDate), dayjs(eightDate)]);
        setSelectedDate(dayjs(eightDate));
        return;
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setOpen(false);
      if (target instanceof HTMLInputElement) {
        const selectionEnd = target.selectionEnd || 0;
        const strPos = [4, 7, 10].includes(selectionEnd) ? nowPosition(selectionStart) + 1 : nowPosition(selectionStart);
        // 경계에 있을때 한칸 더해준다.
        console.log('park1 target selectionStart11==>', selectionStart, strPos, inputs[0].selectionEnd);
        if (strPos < 3) {
          moveSelection(strPos, target);
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setOpen(false);
      if (target instanceof HTMLInputElement) {
        const selectionEnd = target.selectionEnd || 0;
        const strPos = [4, 7, 10].includes(selectionEnd) ? nowPosition(selectionStart) - 1 : nowPosition(selectionStart);
        // 경계에 있을때 한칸 더해준다.
        console.log('park1 target selectionStart11==>', selectionStart, strPos, inputs[0].selectionEnd);
        if (-1 < strPos && strPos < 3) {
          moveSelection(strPos, target);
        }
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(false);
      const addAndMinus = e.key === 'ArrowUp' ? 1 : -1;
      const strPos = nowPosition(selectionStart);
      const type = strPos == 0 ? 'year' : strPos == 1 ? 'month' : 'day';
      if (target === inputs[0]) {
        setTempRange([dayjs(firstInput).add(addAndMinus, type), dayjs(firstInput).add(addAndMinus, type)]);
        setRangeDate([dayjs(firstInput).add(addAndMinus, type), dayjs(firstInput).add(addAndMinus, type)]);
        setSelectedDate(dayjs(firstInput).add(addAndMinus, type));
      }

      setTimeout(() => {
        moveSelection(strPos, target);
      }, 100);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setOpen(false);
      console.log('park ★★★★★★★★★★★★★★ ok ok good  handleKeyDowntoday  is firstInput=>', firstInput);
      setTempRange([dayjs(firstInput), dayjs(firstInput)]);
      setRangeDate([dayjs(firstInput), dayjs(firstInput)]);
      setSelectedDate(dayjs(firstInput));
    } else {
      console.log('park ★★★★★★★★★★★★★★ ===> ok ok good  handleKeyDowntoday  is firstInput=>', firstInput);
    }
  };

  // 키 이벤트 처리
  const handleKeyDown = (e: any) => {
    setIsLock(true);
    const target = e.target;
    const selectionStart = target.selectionStart;
    if (selectionStart === null) {
      console.log('park return selection start null =============');
      return;
    }

    const inputs = e.target.closest('.ant-picker')?.querySelectorAll('.ant-picker-input input');
    const firstDay = inputs[0].value.substring(0, 10);
    const secoundDay = inputs[1].value.substring(0, 10);

    const positionSpace = (e.target as HTMLInputElement).value.replaceAll(' ', '').indexOf('(');
    const value = Utils.formatDate((e.target as HTMLInputElement).value.substring(0, positionSpace));

    if (Utils.isValidDate(firstDay)) {
      setTempRange([dayjs(firstDay), Utils.isValidDate(secoundDay) ? dayjs(secoundDay) : tempRange[1]]);
    }

    console.log(
      'park ]★★★★★★★★★★★★★★ handleKeyDown  key, selectionStart==>',
      e.key,
      selectionStart,
      'substring==>',
      inputs[0].value.substring(0, 10),
      'substring2==>',
      inputs[1].value.substring(0, 10),
    );

    console.log(
      'park handleKeyDown [' + dayjs().format('HH:mm:ss'),
      ' temp',
      tempRange[0]?.format(format),
      tempRange[1]?.format(format),
      ' rangeDate',
      rangeDate[0]?.format(format),
      rangeDate[1]?.format(format),
    );

    if (!inputs || inputs.length < 2) return;

    const firstInput = inputs[0].value.substring(0, 10); // 시작 날짜 input
    const secondInput = inputs[1].value.substring(0, 10); // 종료 날짜 input

    if (e.key == 'Delete') {
      e.preventDefault();
      if (target === inputs[0]) {
        setTempRange([null, tempRange[1]]);
        setRangeDate([null, rangeDate[1]]);
      } else if (target === inputs[1]) {
        setTempRange([tempRange[0], null]);
        setRangeDate([rangeDate[0], null]);
      }
      setOpen(false);
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setOpen(false);
      if (target instanceof HTMLInputElement) {
        const selectionEnd = target.selectionEnd || 0;
        const strPos = [4, 7, 10].includes(selectionEnd) ? nowPosition(selectionStart) + 1 : nowPosition(selectionStart);
        // 경계에 있을때 한칸 더해준다.
        console.log('park1 target selectionStart11==>', selectionStart, strPos, inputs[0].selectionEnd);
        if (strPos < 3) {
          moveSelection(strPos, target);
        } else {
          if (target === inputs[0]) {
            inputs[1].focus();
            moveSelection(0, inputs[1]);
          }
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setOpen(false);
      if (target instanceof HTMLInputElement) {
        const selectionEnd = target.selectionEnd || 0;
        const strPos = [4, 7, 10].includes(selectionEnd) ? nowPosition(selectionStart) - 1 : nowPosition(selectionStart);
        // 경계에 있을때 한칸 더해준다.
        console.log('park1 target selectionStart11==>', selectionStart, strPos, inputs[0].selectionEnd);
        if (-1 < strPos && strPos < 3) {
          moveSelection(strPos, target);
        } else {
          if (target === inputs[1]) {
            inputs[0].focus();
            moveSelection(2, inputs[0]);
          }
        }
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(false);
      const addAndMinus = e.key === 'ArrowUp' ? 1 : -1;
      const strPos = nowPosition(selectionStart);
      const type = strPos == 0 ? 'year' : strPos == 1 ? 'month' : 'day';
      console.log('park type[' + type + '] addAndMinus', addAndMinus);
      if (target === inputs[0]) {
        setTempRange([dayjs(firstInput).add(addAndMinus, type), dayjs(secondInput)]);
        setRangeDate([dayjs(firstInput).add(addAndMinus, type), dayjs(secondInput)]);
      } else if (target === inputs[1]) {
        setTempRange([dayjs(firstInput), dayjs(secondInput).add(addAndMinus, type)]);
        setRangeDate([dayjs(firstInput), dayjs(secondInput).add(addAndMinus, type)]);
      }
      handleConfirm();

      setTimeout(() => {
        moveSelection(strPos, target);
      }, 100);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (Utils.isValidDate(firstInput) && Utils.isValidDate(secondInput) && firstInput.length > 8 && secondInput.length > 8) {
        console.log('park ★★★★★★★★★★★★★★ handleKeyDown  is firstInput=>', firstInput, 'second Input =>', secondInput);
        setTempRange([dayjs(firstInput), dayjs(secondInput)]);
        setRangeDate([dayjs(firstInput), dayjs(secondInput)]);
      } else if (target === inputs[0] && firstInput.length === 8) {
        const firstDay = firstInput.substring(0, 8);
        if (Utils.isValidDate(firstDay)) {
          setTempRange([dayjs(firstDay), tempRange[1]]);
          setRangeDate([dayjs(firstDay), rangeDate[1]]);
          handleConfirm();

          setTimeout(() => {
            //moveSelection(1, inputs[1]);
            inputs[1].focus();
            setOpen(false);
          }, 0);
        } else {
          toastError('첫번째 [' + firstDay + '] 날짜 입력이 잘못되었습니다.');
        }
      } else if (target === inputs[1] && secondInput.length === 8) {
        const secondDay = secondInput.substring(0, 8);
        if (Utils.isValidDate(secondDay)) {
          setTempRange([tempRange[0], dayjs(secondDay)]);
          setRangeDate([rangeDate[0], dayjs(secondDay)]);
          handleConfirm();

          setOpen(false);
        } else {
          toastError('두번째 [' + secondDay + ']날짜 입력이 잘못되었습니다.');
        }
      }
    }
  };

  // 이전, 다음 버튼
  const handleClickPrevNext = (types: string, direction: string) => {
    console.log('타입', types);
    let newDate = selectedDate;
    let startDate: Dayjs;
    let endDate: Dayjs;

    switch (types) {
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
  };

  // 값 바뀔시 검색조건 업데이트
  useEffect(() => {
    if (!isLock && onChange) {
      setIsLock(false); // 먼저 변경을 초기화 시켜준다.
      if (type === 'date') {
        if (selectedDate) {
          onChange(name, selectedDate?.format('YYYY-MM-DD'));
        }
      }
      if (type === 'range') {
        if (rangeDate && rangeDate[0] && rangeDate[1]) {
          onChange(name, rangeDate[1]?.format('YYYY-MM-DD') || '');
          onChange(startName, rangeDate[0]?.format('YYYY-MM-DD') || '');
          onChange(endName, rangeDate[1]?.format('YYYY-MM-DD') || '');
        }
      }
    }
    if (isLock) {
      setIsLock(false);
    }
  }, [selectedDate, rangeDate]);

  // 결과날짜 클릭시 달력띄우기
  const handleResultClick = () => {
    console.log('park panelMode', panelMode);
    if (dropDownValue === 'range' && rangeDate[0] && rangeDate[1]) {
      setOpen(true);
    } else {
      setSelectedDate(rangeDate[0]);
      if (dropDownValue === 'year') {
        if (rangeDate[0] && rangeDate[1]) {
          setSaveDefaultValue([dayjs(rangeDate[0]).format('YYYY-MM-DD'), dayjs(rangeDate[1]).format('YYYY-MM-DD')]);
        }
        setPanelMode('year');
      } else if (dropDownValue === 'month') {
        setPanelMode('month');
      } else if (dropDownValue === 'week') {
        setPanelMode('week');
      } else if (dropDownValue === 'today') {
        setPanelMode('today');
      } else if (dropDownValue === 'decade') {
        setPanelMode('decade');
      }

      setTimeout(() => {
        setOpen(true);
      }, 100);
    }
  };

  // 마우스엔터시 input값 안보이게
  const [mouseEnterValue, setMouseEnterValue] = useState(false);
  const handleMouseEnter = () => {
    //document.querySelectorAll('.ant-picker-input input').forEach((input: any) => input.blur());
    setMouseEnterValue(true);
  };
  const handleMouseLeave = () => {
    setMouseEnterValue(false);
  };

  let lastExecutionTime = -1;

  // 드롭다운 변경시
  const handleOnChangeSelectedType = (sel: string) => {
    setDropDownValue(sel); // 드롭다운 값 변경
    setShowTitleOption(false); // title 옵션 제거

    //alert('handleOnChangeSelectedType:' + sel);

    // 패널모드를 바꾸면 디폴트 값 초기화
    /*
    if (sel != 'type') {
      // 타입은 이전값 가져간다.
      setSaveDefaultValue(['', '']);
      setRangeDate([null, null]);
      alert(sel);
    }
*/
    // 기본값 설정
    const startDate: Dayjs = settingDefaultValue(sel, null)[0];
    const endDate: Dayjs = settingDefaultValue(sel, null)[1];
    //        setIsLock(true);
    if (startDate && endDate && sel != 'date') {
      setRangeDate([dayjs(startDate), dayjs(endDate)]);
      setTempRange([dayjs(startDate), dayjs(endDate)]);
      setSaveDefaultValue([dayjs(startDate).format('YYYY-MM-DD'), dayjs(endDate).format('YYYY-MM-DD')]);
    }
  };

  useEffect(() => {
    setPanelMode(dropDownValue); // 초기 dropDownValue를 panelMode에 반영
  }, [dropDownValue]);

  /*    useEffect(() => {
      console.log('parkgc tempRange ===>', dayjs(tempRange[0]).format('YYYY-MM-DD') + '~' + dayjs(tempRange[1]).format('YYYY-MM-DD'));
    }, [tempRange]);

    useEffect(() => {
      console.log('parkgc rangeDate ===>', dayjs(rangeDate[0]).format('YYYY-MM-DD') + '~' + dayjs(rangeDate[1]).format('YYYY-MM-DD'));
    }, [rangeDate]);*/

  useEffect(() => {
    if (saveDefaultValue) {
      console.log(
        'parkgc saveDefaultValue ===>',
        dayjs(saveDefaultValue[0] || '2025-01-01').format('YYYY-MM-DD') + '~' + dayjs(saveDefaultValue[1] || '2025-01-01').format('YYYY-MM-DD'),
      );
    } else {
      console.log('parkgc saveDefaultValue ===> null');
    }
  }, [saveDefaultValue]);

  // title 속성을 제거하는 함수
  useEffect(() => {
    const removeTitleAttributes = () => {
      document.querySelectorAll('.ant-picker-cell[title]').forEach((cell) => {
        cell.removeAttribute('title'); // title 속성 제거
      });
    };

    // DatePicker 컴포넌트가 마운트된 후에 title 속성 제거
    removeTitleAttributes();

    // DatePicker가 열릴 때마다 title 속성을 제거 (매번 날짜 셀에 접근)
    //document.addEventListener('mouseover', removeTitleAttributes);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    /*return () => {
        document.removeEventListener('mouseover', removeTitleAttributes);
      };*/
  }, []);

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
                <div className="formBox border">
                  <DatePicker
                    ref={datePickerRef}
                    value={selectedDate}
                    name={name}
                    onChange={handleOnChange}
                    format={format}
                    placeholder={placeholder}
                    suffixIcon={null}
                    allowClear={false}
                    open={open}
                    onOpenChange={(isOpen) => {
                      setOpen(isOpen);
                    }}
                    onKeyDown={handleKeyDownToday}
                    needConfirm
                    panelRender={(panel) => (
                      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                        {panel}
                      </div>
                    )}
                    disabled={disabled}
                  />
                  <span className={'mouseValue date'}>
                    {mouseEnterValue ? (
                      <span className={'resultDate'} onClick={handleResultClick}>
                        <span>{selectedDate?.format('YYYY-MM-DD (ddd)') || <strong>날짜선택</strong>}</span>
                      </span>
                    ) : (
                      ''
                    )}
                  </span>
                  <button
                    className={'left'}
                    onClick={() => {
                      handleClickPrevNext('date', 'prev');
                    }}
                    disabled={disabled}
                  >
                    왼쪽
                  </button>
                  <button
                    className={'right'}
                    onClick={() => {
                      handleClickPrevNext('date', 'next');
                    }}
                    disabled={disabled}
                  >
                    오른쪽
                  </button>
                </div>
              </dd>
            </dl>
          ) : (
            <div className={`formBox ${className}`}>
              <DatePicker
                ref={datePickerRef}
                value={selectedDate}
                name={name}
                onChange={handleOnChange}
                format={format}
                onOpenChange={(isOpen) => {
                  setOpen(isOpen);
                }}
                onKeyDown={handleKeyDownToday}
                placeholder={placeholder}
                needConfirm
                suffixIcon={null}
                allowClear={false}
                open={open}
                disabled={disabled}
              />
              <button
                className={'left'}
                onClick={() => {
                  handleClickPrevNext('date', 'prev');
                }}
                disabled={disabled}
              >
                왼쪽
              </button>
              <button
                className={'right'}
                onClick={() => {
                  handleClickPrevNext('date', 'next');
                }}
                disabled={disabled}
              >
                오른쪽
              </button>
            </div>
          )}
        </>
      ) : (
        <dl className={className}>
          {options.length == 1 ? (
            <dt>
              <label
              /*
                onClick={() => {
                  setShowTitleOption(false);
                }}
*/
              >
                {options[0].label}
              </label>
              {required && <span className="req">*</span>}
            </dt>
          ) : (
            <dt>
              <Select
                value={dropDownValue}
                onChange={handleOnChangeSelectedType}
                popupClassName={'dateDropDown'}
                onDropdownVisibleChange={(visible) => setIsOptionOpen(visible)}
              >
                {options.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>{' '}
            </dt>
          )}
          <dd>
            <div className={`formBox ${dropDownValue === 'type' ? 'type' : ''} border`}>
              {dropDownValue === 'type' ? (
                // "직접입력" 선택 시 범위 선택기 사용
                <>
                  <DatePicker.RangePicker
                    value={rangeDate} // [startDate, endDate] 배열로 전달
                    name={name}
                    format={{ format: 'YYYY-MM-DD (ddd)' }}
                    onKeyDown={handleKeyDown}
                    open={open}
                    onClick={(e) => {
                      if (open) {
                        if (e.target instanceof HTMLInputElement) {
                          const input: HTMLInputElement = e.target;
                          const selectionStart = input.selectionStart || 0;
                          console.log('park input selectionStart', selectionStart, input);
                          if (0 <= selectionStart && selectionStart <= 4) {
                            moveSelection(0, input);
                          } else if (5 <= selectionStart && selectionStart <= 7) {
                            moveSelection(1, input);
                          } else if (8 <= selectionStart) {
                            moveSelection(2, input);
                          }
                        }
                      }
                    }}
                    onOpenChange={(isOpen) => {
                      setOpen(true);
                    }}
                    renderExtraFooter={() => (
                      <div className={'typeBox'}>
                        <button onClick={handleConfirm}>확인</button>
                      </div>
                    )}
                    //dropdownClassName={isStartSelected ? 'selectedOne' : ''}
                    onCalendarChange={(dates, _, info) => {
                      const now = Date.now();
                      // 최종 실행시간이 없거나 0.01초 초과면
                      if (lastExecutionTime < 0 || now - lastExecutionTime > 10) {
                        console.log('park onCalendarChange====================================', lastExecutionTime);
                        lastExecutionTime = now;
                        // 10ms(0.01초) 내 중복 실행 방지
                        onCalendarChange(dates, _, info);
                      } else {
                        console.log('park onCalendarChange lastExecutionTime======ㅃㅃㅃㅃㅃㅃㅃㅃㅃㅃㅃㅃㅃㅃ=', now - lastExecutionTime);
                      }
                    }}
                    suffixIcon={null}
                    allowClear={false}
                    panelRender={(panel) => (
                      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                        {panel}
                      </div>
                    )}
                    dateRender={(currentDate) => {
                      if (!rangeDate || rangeDate.length !== 2) return currentDate.date();
                      const [startDate, endDate] = tempRange;
                      const isStart = startDate?.isSame(currentDate, 'day');
                      const isEnd = endDate?.isSame(currentDate, 'day');
                      const isInRange = currentDate.isAfter(startDate, 'day') && currentDate.isBefore(endDate, 'day');

                      return (
                        <div
                          className={`ant-picker-cell-inner 
                              ${isStart ? 'start-date' : ''} 
                              ${isInRange ? 'in-range-date' : ''} 
                              ${isEnd ? 'end-date' : ''}`}
                        >
                          <span>{currentDate.date()}</span>
                        </div>
                      );
                    }}
                  />
                  <span className={'mouseValue'}>
                    {mouseEnterValue ? (
                      <span className={'resultDate'} onClick={handleResultClick}>
                        <span>{rangeDate[0]?.format('YYYY-MM-DD (ddd)') || <strong>시작일</strong>}</span> <em>~</em>{' '}
                        <span>{rangeDate[1]?.format('YYYY-MM-DD (ddd)') || <strong>종료일</strong>}</span>
                      </span>
                    ) : (
                      ''
                    )}
                  </span>
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
                    name={name}
                    onChange={(date) => handleRangeChange(date, dropDownValue)}
                    format={format}
                    picker={dropDownValue === 'week' ? 'week' : dropDownValue === 'month' ? 'month' : dropDownValue === 'year' ? 'year' : 'date'}
                    inputReadOnly
                    open={open}
                    onOpenChange={(isOpen) => setOpen(isOpen)}
                    needConfirm
                    suffixIcon={null}
                    allowClear={false}
                    onPanelChange={(date, mode) => {
                      setPanelMode(mode); // 현재 패널 모드를 업데이트
                    }}
                    cellRender={(currentValue) => {
                      const current = dayjs(currentValue);
                      const now = dayjs();

                      let isToday = false;
                      let displayText = '';

                      switch (panelMode) {
                        case 'decade': {
                          const startDecade = Math.floor(current.year() / 10) * 10;
                          const endDecade = startDecade + 9;
                          displayText = `${startDecade} - ${endDecade}`;
                          isToday = now.year() >= startDecade && now.year() <= endDecade;
                          break;
                        }
                        case 'year':
                          displayText = current.format('YYYY');
                          isToday = current.isSame(now, 'year');
                          break;
                        case 'month':
                          displayText = current.format('MMM');
                          isToday = current.isSame(now, 'month');
                          break;
                        case 'week':
                          displayText = current.format('D');
                          isToday = current.isSame(now, 'day');
                          break;
                        default:
                          displayText = current.format('D');
                          isToday = current.isSame(now, 'day');
                          break;
                      }

                      return (
                        <div className={`ant-picker-cell-inner ${isToday ? 'ant-picker-cell-today' : ''} ${panelMode === 'decade' ? 'decade' : ''}`}>
                          {displayText}
                        </div>
                      );
                    }}
                  />
                  {rangeDate[0] && rangeDate[1] ? (
                    <>
                      {panelMode === 'today' ? (
                        <span className={'resultDate'} onClick={handleResultClick}>
                          <span>{rangeDate[0].format(format)}</span>
                        </span>
                      ) : (
                        <span className={'resultDate'} onClick={handleResultClick}>
                          <span>{rangeDate[0].format(format)}</span> <em>~</em> <span>{rangeDate[1].format(format)}</span>
                        </span>
                      )}
                    </>
                  ) : (
                    <span className={'resultDate'} onClick={handleResultClick}>
                      <strong>날짜선택</strong>
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
});
export default CustomNewDatePicker;
