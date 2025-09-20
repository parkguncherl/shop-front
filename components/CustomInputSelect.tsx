import React, { forwardRef } from 'react';
import { Select } from 'antd';
import { Controller, Control, Path, FieldValues } from 'react-hook-form';

interface Props<T extends FieldValues> {
  control: Control<T>; // react-hook-form의 control 타입 정의
  name: Path<T>; // 제네릭으로 필드 이름을 지정
  type: 'single' | 'form'; // 타입
  title?: string; // 제목
  required?: boolean; // 필수 여부
  defaultValue?: string[]; // 기본값
  onChange?: (value: string[]) => void; // 선택값 변경 시 호출되는 함수
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const CustomInputSelect = forwardRef(function CustomInputSelect<T extends FieldValues>(
  { control, name, type, title, required, defaultValue, onChange, className, ...props }: Props<T>,
  ref?: React.ForwardedRef<any>,
) {
  return (
    <>
      {type === 'single' ? (
        <div className={`formBox border ${className}`}>
          <Controller
            control={control}
            name={name}
            // defaultValue={defaultValue || []} // defaultValue가 없으면 빈 배열로 초기화
            render={({ field }) => (
              <Select
                mode="tags"
                {...field}
                onChange={(value: string[]) => {
                  field.onChange(value); // react-hook-form 상태 업데이트
                  if (onChange) onChange(value); // 부모 컴포넌트로 값 전달
                }}
                {...props}
                ref={ref}
              />
            )}
          />
        </div>
      ) : type === 'form' ? (
        <dl>
          <dt>
            {title}
            {required && <span className={'req'}>*</span>}
          </dt>
          <dd>
            <div className={`formBox border ${className}`}>
              <Controller
                control={control}
                name={name}
                // defaultValue={defaultValue || []} // defaultValue가 없으면 빈 배열로 초기화
                render={({ field }) => (
                  <Select
                    mode="tags"
                    {...field}
                    ref={ref}
                    onChange={(value: string[]) => {
                      field.onChange(value); // react-hook-form 상태 업데이트
                      if (onChange) {
                        onChange(value); // 부모 컴포넌트로 값 전달
                      }
                    }}
                    onInputKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.stopPropagation();
                      }
                    }}
                    {...props}
                  />
                )}
              />
            </div>
          </dd>
        </dl>
      ) : null}
    </>
  );
}) as <T extends FieldValues>(props: Props<T> & { ref?: React.ForwardedRef<any> }) => React.ReactElement;

export default CustomInputSelect;
