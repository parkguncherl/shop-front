import React from 'react';
import { Radio } from 'antd';
import { useController, Control, FieldValues, Path } from 'react-hook-form';
import { RadioChangeEvent } from 'antd/es/radio';

type IRadioProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  value: number | string;
  label?: React.ReactNode;
  className?: string;
  onChange?: (e: RadioChangeEvent) => void;
  checked?: boolean;
  disabled?: boolean;
};

const CustomRadio = <T extends FieldValues>({ control, name, value, label, className, checked, disabled, onChange: customOnChange }: IRadioProps<T>) => {
  const {
    field: { value: fieldValue, onChange },
    fieldState: { error },
  } = useController({ name, control });

  const handleChange = (e: RadioChangeEvent) => {
    onChange(e.target.value);
    if (customOnChange) {
      customOnChange(e);
    }
  };

  return (
    <Radio value={value} className={className} checked={fieldValue === value || checked} onChange={handleChange} disabled={disabled}>
      {label}
      {error && <span>{error.message}</span>}
    </Radio>
  );
};

export default CustomRadio;
