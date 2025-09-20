import FormInput from './FormInput';
import DropDownAtom from './atom/DropDownAtom';
import { Input } from './Input';
import { BaseSelectRef } from 'rc-select';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';

interface FormInputDropDownProps {
  title?: string;
  type: 'compInfo' | 'gubunInfo' | 'designCntn' | 'payEtc' | 'orderEtc';
  dropdownName: string;
  placeholder?: string;
  inputValue: string;
  textareaValue: string;
  dropdownOptions: any[];
  dropdownStatus: {
    checkedForSubmit: boolean;
    dropdownDisabled: boolean;
  };
  buttonState: boolean;
  focusState: boolean;
  handleFocus: (type: string) => void;
  handleBlur: (type: string) => void;
  handleChange: (type: string, value: string) => void;
  handleButtonToggle: (type: string) => void;
  handleSave: (type: string, value: string) => void;
  inputRefs: React.MutableRefObject<{
    [key: string]: HTMLInputElement | BaseSelectRef | null;
  }>;
}

export const FormInputDropDown: React.FC<FormInputDropDownProps> = ({
  title,
  type,
  dropdownName,
  placeholder,
  inputValue,
  textareaValue,
  dropdownOptions,
  dropdownStatus,
  buttonState,
  focusState,
  handleFocus,
  handleBlur,
  handleChange,
  handleButtonToggle,
  handleSave,
  inputRefs,
}) => {
  const { control, getValues, setValue } = useForm();

  useEffect(() => {
    setValue(type, textareaValue);
  }, [textareaValue]);

  return (
    <dl>
      <dt>{title}</dt>
      <dd>
        <div className={`formBox selBtn ${!(dropdownStatus.checkedForSubmit && !dropdownStatus.dropdownDisabled) ? 'disabled' : ''}`}>
          <div className={`${focusState ? 'focus' : ''}`}>
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
              onChange={(e) => {
                handleChange(type, e.target.value);
              }}
              onFocus={() => handleFocus(type)}
              onBlur={() => handleBlur(type)}
              value={inputValue}
              ref={(el) => (inputRefs.current[`${type}Input`] = el as HTMLInputElement)}
            />
            <DropDownAtom
              name={dropdownName}
              placeholder={placeholder}
              options={dropdownOptions}
              onChangeOptions={(name, value) => {
                handleChange(type, value.toString());
              }}
              onFocus={() => handleFocus(type)}
              onBlur={() => handleBlur(type)}
              selectorShowAction={['focus']}
              ref={(el) => (inputRefs.current[`${type}DropDown`] = el)}
            />
          </div>
          <button className="btn" onClick={() => handleButtonToggle(type)}>
            +
          </button>
        </div>
        <div className={`formBox inpBtn ${buttonState ? 'on' : ''}`}>
          <FormInput type="text" inputType="textarea" control={control} name={type} />
          <button
            className="btn btnBlack"
            onClick={() => {
              const value = getValues(type);
              handleSave(type, value); //
            }}
          >
            저장
          </button>
        </div>
      </dd>
    </dl>
  );
};
