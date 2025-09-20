import { CodeRequestCreate, CodeResponsePaging } from '../../../../generated';
import React, { useRef } from 'react';
import { PopupContent } from '../../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../../content';
import { Input } from '../../../Input';
import { PopupFooter } from '../../PopupFooter';
import { useCodeStore } from '../../../../stores';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { Placeholder } from '../../../../libs/const';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../../libs';
import FormInput from '../../../FormInput';
import Loading from '../../../Loading';
import { PopupLayout } from '../../PopupLayout';

export type CodeRequestCreateFields = {
  codeUpper: string;
  codeCd: string;
  codeNm: string;
  codeEngNm?: string;
  codeDesc?: string;
  codeEtcInfo?: string;
  codeEtcEngInfo?: string;
  codeOrder: number;
  delYn: string;
};

interface Props {
  data: CodeResponsePaging;
}

/** 시스템 - 코드관리 - 신규 팝업 */
export const CodeAddPop = ({ data }: Props) => {
  const el = useRef<HTMLDListElement | null>(null);
  const {
    watch,
    handleSubmit,
    control,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<CodeRequestCreateFields>({
    resolver: yupResolver(YupSchema.CodeRequest()), // 완료
    defaultValues: {
      codeUpper: data.codeUpper,
      delYn: 'N',
    },
    mode: 'onSubmit',
  });

  /** 코드관리 스토어 - State */
  const [modalType, closeModal] = useCodeStore((s) => [s.modalType, s.closeModal]);

  /** 코드관리 스토어 - API */
  const [insertCode] = useCodeStore((s) => [s.insertCode]);

  const queryClient = useQueryClient();

  /** 코드 등록 */
  const { mutate: insertCodeMutate, isLoading } = useMutation(insertCode, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries(['/code/paging']);
          await queryClient.invalidateQueries(['/code/dropdown/TOP']);
          closeModal('ADD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const onValid: SubmitHandler<CodeRequestCreate> = (data) => {
    insertCodeMutate(data);
  };

  const onInvalid = (errors: any) => {
    console.log('onInvalid 실행됨 ===>', errors);
    const allValues = watch();
    console.log('실시간 모든 값 ===>', allValues);
    // 첫 번째 에러만 토스트로 띄우기
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toastError(firstError.message);
    }
  };

  return (
    <dl ref={el}>
      <form>
        <PopupLayout
          width={600}
          isEscClose={false}
          open={modalType.type === 'ADD' && modalType.active}
          title={'신규 코드 생성'}
          onClose={() => closeModal('ADD')}
          footer={
            <PopupFooter>
              <div className={'btnArea'}>
                <button
                  className={'btn btnBlue'}
                  onClick={(e) => {
                    handleSubmit(onValid, onInvalid)(e);
                  }}
                >
                  {'저장'}
                </button>
                <button className={'btn '} onClick={() => closeModal('ADD')}>
                  {'닫기'}
                </button>
              </div>
            </PopupFooter>
          }
        >
          <PopupContent>
            <PopupSearchBox>
              <PopupSearchType className={'type_1'}>
                <Input title={'상위코드명'} disable={true} value={data.codeUpperNm} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<CodeRequestCreateFields> control={control} name={'codeCd'} label={'코드'} placeholder={Placeholder.Input} required={true} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<CodeRequestCreateFields> control={control} name={'codeNm'} label={'이름'} placeholder={Placeholder.Input} required={true} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<CodeRequestCreateFields> control={control} name={'codeEngNm'} label={'영문명'} placeholder={Placeholder.Input} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<CodeRequestCreateFields> control={control} name={'codeDesc'} label={'설명'} placeholder={Placeholder.Input} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<CodeRequestCreateFields> control={control} name={'codeEtcInfo'} label={'기타정보1'} placeholder={Placeholder.Input} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<CodeRequestCreateFields> control={control} name={'codeEtcEngInfo'} label={'기타정보2'} placeholder={Placeholder.Input} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<CodeRequestCreateFields> control={control} name={'codeOrder'} label={'순서'} placeholder={Placeholder.Input} required={true} />
              </PopupSearchType>
            </PopupSearchBox>
          </PopupContent>
          {isLoading && <Loading />}
        </PopupLayout>
      </form>
    </dl>
  );
};
