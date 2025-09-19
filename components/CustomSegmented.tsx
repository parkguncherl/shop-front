import React, { useEffect, useState } from 'react';
import { Segmented } from 'antd';

interface Props {
  title?: string;
  name: string;
  value?: boolean; // Segmented 상태 값
  onChange?: (name: any, value: boolean) => void; // checked 상태일 시 value == true
  required?: boolean;
  wrapperClassNames?: string;
  checkedLabel: string; // checked 상태일 때 텍스트
  uncheckedLabel: string; // unchecked 상태일 때 텍스트
}

export const CustomSegmented = ({ title, name, value = false, onChange, required = false, wrapperClassNames, checkedLabel, uncheckedLabel }: Props) => {
  const [segmentedValue, setSegmentedValue] = useState<string | undefined>(undefined);
  useEffect(() => {
    setSegmentedValue(value ? checkedLabel : uncheckedLabel);
  }, [checkedLabel, uncheckedLabel, value]);

  const handleTabChange = (value: string) => {
    setSegmentedValue(value);
    if (onChange) {
      onChange(name, value === checkedLabel);
    }
  };

  return (
    <>
      {title ? (
        <dl className={`${wrapperClassNames}`}>
          <dt>
            <label>{title}</label>
            {required && <span className={'req'}>*</span>}
          </dt>
          <dd>
            <div className="formBox">
              <Segmented value={segmentedValue} onChange={handleTabChange} options={[checkedLabel, uncheckedLabel]} />
            </div>
          </dd>
        </dl>
      ) : (
        <Segmented value={segmentedValue} onChange={handleTabChange} options={[checkedLabel, uncheckedLabel]} />
      )}
    </>
  );
};
