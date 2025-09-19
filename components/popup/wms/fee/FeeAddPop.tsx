import { PartnerOption, useCommonStore } from '../../../../stores';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { PopupContent } from '../../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../../content';
import { PopupFooter } from '../../PopupFooter';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { PartnerFeeResponse } from '../../../../generated';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../../libs';
import FormDropDown from '../../../FormDropDown';
import Loading from '../../../Loading';
import { PopupLayout } from '../../PopupLayout';
import { useSession } from 'next-auth/react';
import { useFeeStore } from '../../../../stores/wms/useFeeStore';
import CustomNewDatePicker from '../../../CustomNewDatePicker';
import dayjs from 'dayjs';
import FormInput from '../../../FormInput';

/** 시스템 - 계정관리 - 신규 팝업 */
export const FeeAddPop = (props: PartnerFeeResponse) => {
  const session = useSession();
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;
  const el = useRef<HTMLDListElement | null>(null);
  const now = new Date();

  const {
    watch,
    handleSubmit,
    getValues,
    setValue,
    control,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<PartnerFeeResponse>({
    resolver: yupResolver<PartnerFeeResponse>(YupSchema.FeeRequest()), // 완료
    defaultValues: {
      partnerId: 0,
    },
    mode: 'onSubmit',
  });

  /** 계정관리 스토어 - State */
  const [modalType, closeModal, createFee] = useFeeStore((s) => [s.modalType, s.closeModal, s.createFee]);
  const { partnerOptions, fetchPartnerOptions } = useCommonStore();
  const [selectedPartner, setSelectedPartner] = useState<PartnerOption[]>([]);
  /** 계정관리 양식 관리 스토어 - API */
  const queryClient = useQueryClient();

  useEffect(() => {
    if (props.feeType !== undefined) setValue('feeType', props.feeType);
    if (props.stockFee !== undefined) setValue('stockFee', props.stockFee);
    if (props.jobFee !== undefined) setValue('jobFee', props.jobFee);
    if (props.serviceFee !== undefined) setValue('serviceFee', props.serviceFee);
    if (props.orderFee !== undefined) setValue('orderFee', props.orderFee);
    if (props.maintFee !== undefined) setValue('maintFee', props.maintFee);
    if (props.hangerFee !== undefined) setValue('hangerFee', props.hangerFee);

    if (props.partnerId !== undefined && props.partnerNm !== undefined) {
      setSelectedPartner([{ value: props.partnerId, label: props.partnerNm }]);
    } else {
      setSelectedPartner(partnerOptions);
    }
  }, [props]);

  useEffect(() => {
    fetchPartnerOptions(workLogisId, undefined);
  }, []);

  /** 계정 등록 */
  const { mutate: createFeeMutate, isLoading } = useMutation(createFee, {
    onSuccess: async (e) => {
      try {
        const { resultCode, body, resultMessage } = e.data;
        if (resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries({
            queryKey: ['/wms/fee/partnerFeeList'],
            exact: false, // 첫 번째 요소만 보고 모든 관련 쿼리 invalidate
          });
          closeModal('ADD_FEE');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const onValid: SubmitHandler<PartnerFeeResponse> = (data) => {
    console.log('데이터확인', data);
    createFeeMutate(data);
  };

  return (
    <dl ref={el}>
      <form>
        <PopupLayout
          width={820}
          isEscClose={false}
          open={(modalType.type === 'ADD_FEE' || modalType.type === 'MOD_FEE') && modalType.active}
          title={'신규 화주별 수수료 생성'}
          onClose={() => closeModal('ADD_FEE')}
          footer={
            <PopupFooter>
              <div className={'btnArea between'}>
                <div className="left"></div>
                <div className="right">
                  <button className={'btn btnBlue'} onClick={handleSubmit(onValid)}>
                    저장
                  </button>
                  <button className={'btn '} onClick={() => closeModal('ADD_FEE')}>
                    닫기
                  </button>
                </div>
              </div>
            </PopupFooter>
          }
        >
          <PopupContent>
            <PopupSearchBox>
              <PopupSearchType className={'type_1'}>
                <FormDropDown<PartnerFeeResponse>
                  control={control}
                  title={'화주설정'}
                  name={'partnerId'}
                  options={selectedPartner}
                  required={false}
                  defaultValue={props.partnerId + ''}
                />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <CustomNewDatePicker
                  title={'시작일자'}
                  type={'date'}
                  name={'startDay'}
                  defaultValue={props.startDay}
                  onChange={(name, value: any) => {
                    const formattedDate = value.$d ? dayjs(value.$d).format('YYYY-MM-DD') : dayjs(value).format('YYYY-MM-DD');
                    setValue('startDay', formattedDate);
                  }}
                  required={true}
                  value={props.startDay}
                />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormDropDown<PartnerFeeResponse> control={control} name={'feeType'} title={'수수료유형'} codeUpper={'10560'} required={true} />
              </PopupSearchType>
              <PopupSearchType className={'type_2'}>
                <FormInput<PartnerFeeResponse> control={control} name={'stockFee'} label={'입고비'} placeholder={'입고비 건당'} required={true} />
                <FormInput<PartnerFeeResponse> control={control} name={'jobFee'} label={'출고비'} placeholder={'출고비 건당'} required={true} />
              </PopupSearchType>
              <PopupSearchType className={'type_2'}>
                <FormInput<PartnerFeeResponse> control={control} name={'maintFee'} label={'보관비'} placeholder={'보관비 건당'} required={true} />
                <FormInput<PartnerFeeResponse> control={control} name={'hangerFee'} label={'행거보관비'} placeholder={'행거 보관비 건당'} required={true} />
              </PopupSearchType>
              <PopupSearchType className={'type_2'}>
                <FormInput<PartnerFeeResponse> control={control} name={'serviceFee'} label={'서비스요율(%)'} placeholder={'% 로 입력'} required={true} />
                <FormInput<PartnerFeeResponse> control={control} name={'orderFee'} label={'제작요율(%)'} placeholder={'% 로 입력'} required={true} />
              </PopupSearchType>
            </PopupSearchBox>
          </PopupContent>
        </PopupLayout>
      </form>
    </dl>
  );
};
