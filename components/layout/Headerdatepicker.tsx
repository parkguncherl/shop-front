import React from 'react';
import DatePicker from 'react-datepicker';
import { format as dateFormat } from 'date-fns';
import styles from '../../styles/layout/header.module.scss';

interface CustomDatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  delayTime: number;
  isBlinking: boolean;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ selectedDate, onDateChange, delayTime, isBlinking }) => {
  return (
    <DatePicker
      selected={selectedDate}
      onChange={onDateChange}
      dateFormat="MM/dd"
      customInput={<button className={`${styles.customButton} ${isBlinking ? styles.blinking : ''}`}>{dateFormat(selectedDate, 'MM/dd')}</button>}
    />
  );
};

export default CustomDatePicker;
