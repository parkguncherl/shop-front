import React from 'react';
import { useController, Control, FieldValues, Path } from 'react-hook-form';

type ITextAreaProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  placeholder?: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

const TextArea = <T extends FieldValues>({ control, name, placeholder, onChange }: ITextAreaProps<T>) => {
  const {
    field: { value, onChange: onFieldChange, onBlur, ref },
    fieldState: { error },
  } = useController({ name, control });

  // Handle internal changes and pass them to the onChange prop if provided
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onFieldChange(e.target.value); // Update the form state
    if (onChange) {
      onChange(e); // Call the custom onChange handler
    }
  };

  return (
    <div className="formBox border">
      <textarea value={value || ''} onChange={handleChange} onBlur={onBlur} ref={ref} placeholder={placeholder} />
      {error && <span className="error_txt">{error.message}</span>}
    </div>
  );
};

export default TextArea;
