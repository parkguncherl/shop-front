import React, { useEffect, useState } from 'react';
import { Segmented, Switch } from 'antd';

interface Props {
  title?: string;
  name: string;
  value?: boolean; // Switch 상태 값
  disabled?: boolean;
  onChange?: (name: string, value: boolean) => void;
  onEnter?: () => void;
  required?: boolean;
  filters?: object;
  wrapperClassNames?: string;
  keyDownEvent?: (e: React.KeyboardEvent) => void;
  checkedLabel: string; // checked 상태일 때 텍스트
  uncheckedLabel: string; // unchecked 상태일 때 텍스트
}

const CustomSwitchComponent = ({
  title,
  name,
  value = false,
  disabled,
  onChange,
  onEnter,
  required = false,
  filters,
  wrapperClassNames,
  keyDownEvent,
  checkedLabel,
  uncheckedLabel,
}: Props) => {
  const [checked, setChecked] = useState(value);
  const [activeKey, setActiveKey] = useState(value ? checkedLabel : uncheckedLabel);

  const handleSwitchChange = (nextChecked: boolean) => {
    setChecked(nextChecked);
    onChange?.(name, nextChecked);
  };

  const handleTabChange = (key: string) => {
    setActiveKey(key);
    onChange?.(name, key === checkedLabel);
  };

  // 외부 value 값이 바뀌면 내부 상태 동기화
  useEffect(() => {
    setChecked(value);
    setActiveKey(value ? checkedLabel : uncheckedLabel);
  }, [value, checkedLabel, uncheckedLabel]);

  if (title) {
    return (
      <dl className={wrapperClassNames}>
        <dt>
          <label>{title}</label>
          {required && <span className="req">*</span>}
        </dt>
        <dd>
          <div className="formBox">
            <Segmented value={activeKey} onChange={handleTabChange} options={[checkedLabel, uncheckedLabel]} />
          </div>
        </dd>
      </dl>
    );
  }

  return <Switch checkedChildren={checkedLabel} unCheckedChildren={uncheckedLabel} checked={checked} onChange={handleSwitchChange} disabled={disabled} />;
};

// ✅ React.memo 로 감싸고 displayName 설정
export const CustomSwitch = React.memo(CustomSwitchComponent, (prev, next) => {
  return (
    prev.value === next.value &&
    prev.disabled === next.disabled &&
    prev.checkedLabel === next.checkedLabel &&
    prev.uncheckedLabel === next.uncheckedLabel &&
    prev.title === next.title &&
    prev.wrapperClassNames === next.wrapperClassNames
  );
});
CustomSwitch.displayName = 'CustomSwitch';
