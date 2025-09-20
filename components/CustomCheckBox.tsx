import React, { forwardRef, RefAttributes } from 'react';
import { Checkbox, CheckboxRef } from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { useController, Control, FieldValues, Path } from 'react-hook-form';

type ICheckBoxProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  rules?: any;
  children?: React.ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void; // 외부에서 상태 변경을 처리할 수 있도록 추가
  onChange?: (checked: boolean) => void; // 외부 onChange 추가
  className?: string;
  disabled?: boolean;
};

const InnerCustomCheckBox = <T extends FieldValues>(
  { control, name, label, rules, checked, onCheckedChange, onChange: externalOnChange, children, className, disabled }: ICheckBoxProps<T>,
  ref: React.Ref<CheckboxRef> | null,
) => {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({ name, control, rules });

  const isChecked = checked !== undefined ? checked : value?.toUpperCase() === 'Y';

  const handleChange = (e: CheckboxChangeEvent) => {
    const newChecked = e.target.checked;
    onChange(newChecked ? 'Y' : 'N');

    if (onCheckedChange) {
      onCheckedChange(newChecked);
    }

    // 외부에서 전달된 onChange 호출
    if (externalOnChange) {
      externalOnChange(newChecked);
    }
  };

  return (
    <div className={className}>
      <Checkbox checked={isChecked} onChange={handleChange} onKeyPress={(e) => e.preventDefault()} disabled={disabled} ref={ref}>
        {label} {children}
      </Checkbox>
      {error && <span>{error.message}</span>}
    </div>
  );
};
function fixedForwardRef<P>(
  render: (props: P, ref: React.Ref<CheckboxRef> | null) => JSX.Element,
): (props: P & React.RefAttributes<CheckboxRef>) => JSX.Element {
  return forwardRef(render) as (props: P & RefAttributes<CheckboxRef>) => JSX.Element;
}

const CustomCheckBox = fixedForwardRef(InnerCustomCheckBox);
export default CustomCheckBox;
