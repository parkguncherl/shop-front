import FormInput from './FormInput';
import DropDownAtom from './atom/DropDownAtom';
import { Input } from './Input';
import { BaseSelectRef } from 'rc-select';

interface InfoInputSectionProps {
  title: string;
  type: 'compInfo' | 'gubunInfo';
  dropdownName: string;
  placeholder: string;
  inputValue: string;
  dropdownOptions: any[];
  dropdownStatus: {
    checkedForSubmit: boolean;
    dropdownDisabled: boolean;
  };
  buttonState: boolean;
  handleFocus: (type: string) => void;
  handleBlur: (type: string) => void;
  handleChange: (type: string, value: string) => void;
  handleButtonToggle: (type: string) => void;
  handleSave: (type: string, value: string) => void;
  inputRefs: React.MutableRefObject<{
    [key: string]: HTMLInputElement | BaseSelectRef | null;
  }>;
}

const InfoInputSection: React.FC<InfoInputSectionProps> = ({
  title,
  type,
  dropdownName,
  placeholder,
  inputValue,
  dropdownOptions,
  dropdownStatus,
  buttonState,
  handleFocus,
  handleBlur,
  handleChange,
  handleButtonToggle,
  handleSave,
  inputRefs,
}) => {
  return (
    <dl>
      <dt>{title}</dt>
      <dd>
        <div className={`formBox selBtn ${!(dropdownStatus.checkedForSubmit && !dropdownStatus.dropdownDisabled) ? 'disabled' : ''}`}>
          <div className={`${dropdownStatus.checkedForSubmit ? 'focus' : ''}`}>
            <Input
              withDropdown={true}
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key == 'Enter' && !e.nativeEvent.isComposing) {
                  const targetValue = (e.target as HTMLInputElement).value;
                  if (targetValue.length > 0) {
                    handleChange(type, targetValue);
                    inputRefs.current[`${type}DropDown`]?.focus();
                  }
                }
              }}
              onChange={(e) => handleChange(type, e.target.value)}
              onFocus={() => handleFocus(type)}
              onBlur={() => handleBlur(type)}
              value={inputValue}
              ref={(el) => (inputRefs.current[`${type}Input`] = el as HTMLInputElement)}
            />
            <DropDownAtom
              name={dropdownName}
              placeholder={placeholder}
              options={dropdownOptions}
              onChangeOptions={(name, value) => handleChange(type, value.toString())}
              selectorShowAction={['focus']}
              ref={(el) => (inputRefs.current[`${type}DropDown`] = el)}
            />
          </div>
          <button className="btn" onClick={() => handleButtonToggle(type)}>
            +
          </button>
        </div>
        <div className={`formBox inpBtn ${buttonState ? 'on' : ''}`}>
          <FormInput type="text" inputType="textarea" control={control} name={dropdownName} />
          <button className="btn btnBlack" onClick={() => handleSave(type, inputValue)}>
            저장
          </button>
        </div>
      </dd>
    </dl>
  );
};
