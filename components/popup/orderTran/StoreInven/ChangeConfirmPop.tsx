import { PopupFooter } from '../../PopupFooter';
import React from 'react';
import { PopupLayout } from '../../PopupLayout';
import { PopupContent } from '../../PopupContent';
import FormInput from '../../../FormInput';
import { Placeholder } from '../../../../libs/const';
import PopupFormType from '../../content/PopupFormType';
import PopupFormBox from '../../content/PopupFormBox';
import { SubmitHandler, useForm } from 'react-hook-form';

interface ChangeConfirmPopProps {
  active?: boolean;
  onClose: () => void;
  onConfirm?: (fields: confirmFields) => void;
}

interface confirmFields {
  etcCntn: string;
}
export const ChangeConfirmPop = (props: ChangeConfirmPopProps) => {
  const { handleSubmit, control } = useForm<confirmFields>({
    mode: 'onSubmit',
  });

  const onValid: SubmitHandler<confirmFields> = (data) => {
    if (props.onConfirm) {
      props.onConfirm(data);
    }
    if (props.onClose) {
      props.onClose();
    }
  };

  return (
    <PopupLayout
      width={500}
      isEscClose={true}
      open={props.active || false}
      title={'선택된 상품의 정보를 변경하시겠습니까?'}
      onClose={() => {
        // todo close
      }}
      footer={
        <PopupFooter>
          <div className={'btnArea'}>
            <button className={'btn btnBlue'} onClick={handleSubmit(onValid)}>
              확인
            </button>
            <button className={'btn'} onClick={props.onClose}>
              취소
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupFormBox>
          <PopupFormType className={'type1'}>
            <FormInput control={control} name={'etcCntn'} label={'비고'} placeholder={Placeholder.Input} required={false} />
          </PopupFormType>
        </PopupFormBox>
      </PopupContent>
    </PopupLayout>
  );
};
