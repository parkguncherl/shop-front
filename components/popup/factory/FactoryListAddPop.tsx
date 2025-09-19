import React from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../content';
import FormInput from '../../FormInput';
import { DefaultOptions, Placeholder } from '../../../libs/const';
import { PopupLayout } from '../PopupLayout';
import { useFactoryListStore } from '../../../stores/useFactoryListStore';
import { useCommonStore } from '../../../stores';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../libs';
import { FactoryRequestCreate } from '../../../generated';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../ToastMessage';
import FormDropDown from '../../FormDropDown';

type FactoryRequestCreateFields = {
  id?: number;
  partnerId?: number;
  partnerNm?: string;
  factoryCd?: string;
  compNm: string;
  compTelNo?: string;
  personNm?: string;
  personTelNo?: string;
  compNo?: string;
  detailInfo?: string;
  compEmail?: string;
  creUser?: string;
  updUser?: string;
};

const FactoryListAddPop = () => {
  /** 스토어 */
  const [modalType, closeModal] = useFactoryListStore((s) => [s.modalType, s.closeModal]);
  const [commonModalType, commonOpenModal, getFileUrl] = useCommonStore((s) => [s.modalType, s.openModal, s.getFileUrl]);

  /** 공장관리 스토어 - State */
  const [selectedFactory, setSelectedFactory, insertFactory] = useFactoryListStore((s) => [s.selectedFactory, s.setSelectedFactory, s.insertFactory]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<FactoryRequestCreateFields>({
    resolver: yupResolver(YupSchema.FactoryRequest()), // 완료
    defaultValues: {},
    mode: 'onSubmit',
  });

  const queryClient = useQueryClient();

  /** 공장 등록 */
  const { mutate: insertFactoryMutate, isLoading } = useMutation(insertFactory, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries(['/factory/partnerId/paging']);
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
  const onValid: SubmitHandler<FactoryRequestCreate> = (data) => {
    insertFactoryMutate(data);
  };

  return (
    <div>
      <PopupLayout
        width={820}
        isEscClose={true}
        open={modalType.type === 'ADD'}
        title={'공장 등록하기'}
        onClose={() => {
          closeModal('ADD');
        }}
        footer={
          <PopupFooter>
            <div className="btnArea">
              <button className="btn btnBlue" title="저장" onClick={handleSubmit(onValid)}>
                저장
              </button>
              <button
                className="btn"
                title="닫기"
                onClick={() => {
                  closeModal('ADD');
                }}
              >
                닫기
              </button>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <PopupSearchBox>
            <PopupSearchType className={'type_2'}>
              <FormInput<FactoryRequestCreateFields> control={control} name={'compNm'} label={'회사명'} placeholder={Placeholder.Input || ''} required={true} />
              <FormDropDown<FactoryRequestCreateFields>
                control={control}
                title={'공장종류코드'}
                name={'factoryCd'}
                defaultOptions={[...DefaultOptions.Select]}
                codeUpper={'10060'}
                required={true}
              />
            </PopupSearchType>
            <PopupSearchType className={'type_2'}>
              <FormInput<FactoryRequestCreateFields>
                control={control}
                name={'compTelNo'}
                label={'회사전화번호'}
                placeholder={Placeholder.Input || ''}
                required={true}
              />
              <FormInput<FactoryRequestCreateFields>
                control={control}
                name={'compNo'}
                label={'사업자번호'}
                placeholder={Placeholder.Input || ''}
                required={true}
              />
            </PopupSearchType>
            <PopupSearchType className={'type_2'}>
              <FormInput<FactoryRequestCreateFields>
                control={control}
                name={'personNm'}
                label={'담당자명'}
                placeholder={Placeholder.Input || ''}
                required={true}
              />
              <FormInput<FactoryRequestCreateFields>
                control={control}
                name={'personTelNo'}
                label={'담당자전화번호'}
                placeholder={Placeholder.Input || ''}
                required={true}
              />
            </PopupSearchType>
            <PopupSearchType className={'type_1'}>
              <FormInput<FactoryRequestCreateFields>
                control={control}
                name={'compEmail'}
                label={'회사이메일'}
                placeholder={Placeholder.Input || ''}
                required={false}
              />
            </PopupSearchType>
            <PopupSearchType className={'type_1'}>
              <FormInput<FactoryRequestCreateFields>
                inputType="textarea"
                control={control}
                name={'detailInfo'}
                label={'상세정보'}
                placeholder={Placeholder.Input || ''}
                required={false}
              />
            </PopupSearchType>
          </PopupSearchBox>
        </PopupContent>
        {/*<Loading />*/}
      </PopupLayout>
    </div>
  );
};

export default FactoryListAddPop;
