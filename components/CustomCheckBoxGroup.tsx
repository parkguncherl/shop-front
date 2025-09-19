import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Checkbox } from 'antd';
import { useController, Control, FieldValues, Path } from 'react-hook-form';

type CustomCheckBoxGroupProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  values: { key: string; value: string; label: string }[]; // 새로운 데이터 구조
  checkedValues: string[];
  onCheckedChange?: (checkedValues: string[]) => void;
  title?: string;
  required?: boolean;
  className?: string;
};

const CustomCheckBoxGroup = forwardRef(function CustomCheckBoxGroup<T extends FieldValues>(
  { control, name, values, checkedValues, onCheckedChange, title, required, className }: CustomCheckBoxGroupProps<T>,
  ref?: React.ForwardedRef<any>,
) {
  const {
    field,
    fieldState: { error },
  } = useController({ name, control });
  const [localCheckedValues, setLocalCheckedValues] = useState<string[]>(checkedValues);
  const [disabledGroups, setDisabledGroups] = useState<string[]>([]);

  useImperativeHandle(ref, () => ({
    focusOnInput: () => {
      const firstInput = document.querySelector('.custom-checkbox-group input[type="checkbox"]') as HTMLInputElement | null;
      firstInput?.focus();
    },
  }));

  useEffect(() => {
    setLocalCheckedValues(checkedValues);
  }, [checkedValues]);

  const handleChange = (value: string) => {
    // 선택된 체크박스의 ID를 업데이트
    const updatedValues = localCheckedValues.includes(value) ? localCheckedValues.filter((v) => v !== value) : [...localCheckedValues, value];

    setLocalCheckedValues(updatedValues);
    field.onChange(updatedValues);
    if (onCheckedChange) {
      onCheckedChange(updatedValues);
    }
  };

  return (
    <>
      {title ? (
        <dl>
          <dt>
            <label>{title}</label>
            {required && <span className={'req'}>*</span>}
          </dt>
          <dd>
            <div className={`formBox wrap custom-checkbox-group ${className}`}>
              {values.map((val, index) => {
                return (
                  <React.Fragment key={val.key}>
                    <Checkbox
                      checked={localCheckedValues.includes(val.value)}
                      onChange={() => handleChange(val.value)}
                      disabled={disabledGroups.includes(val.value) && !localCheckedValues.includes(val.value)}
                      name={name}
                    >
                      {val.label}
                    </Checkbox>
                  </React.Fragment>
                );
              })}
            </div>
            {error && (
              <span className={'error_txt'} style={{ marginTop: '5px' }}>
                {error?.message}
              </span>
            )}
          </dd>
        </dl>
      ) : (
        <>
          <div className="formBox wrap">
            {values.map((val, index) => {
              return (
                <React.Fragment key={val.key}>
                  <Checkbox
                    checked={localCheckedValues.includes(val.value)}
                    onChange={() => handleChange(val.value)}
                    disabled={disabledGroups.includes(val.value) && !localCheckedValues.includes(val.value)}
                    name={name}
                  >
                    {val.label}
                  </Checkbox>
                </React.Fragment>
              );
            })}
          </div>
          {error && (
            <span className={'error_txt'} style={{ marginTop: '5px' }}>
              {error?.message}
            </span>
          )}
        </>
      )}
    </>
  );
}) as <T extends FieldValues>(props: CustomCheckBoxGroupProps<T> & { ref?: React.ForwardedRef<any> }) => React.ReactElement;

export default CustomCheckBoxGroup;
