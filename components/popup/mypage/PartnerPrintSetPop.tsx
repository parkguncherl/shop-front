import React, { useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { Button } from '../../Button';
import { PopupLayout } from '../PopupLayout';
import { PopupContent } from '../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../content';
import { ExpenseRequestCreate, PartnerRequestUpdate } from '../../../generated';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../../libs';
import CustomRadio from '../../CustomRadio';
import { RadioChangeEvent } from 'antd/es/radio';
import { toastError, toastSuccess } from '../../ToastMessage';
import useAppStore from '../../../stores/useAppStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PartnerPrintSetPop = ({ open = false, onClose }: Props) => {
  /** 스토어 */
  const { session } = useAppStore();

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    // formState: { errors, isValid },
  } = useForm<PartnerRequestUpdate>({
    //resolver: yupResolver(YupSchema.ExpenseRequest()),
    defaultValues: {},
    mode: 'onSubmit',
  });

  // 유저데이터 가져오기
  const { data: fetchData, refetch } = useQuery(
    ['/mypage/partner/printInfo', session?.user?.partnerId],
    () =>
      authApi.get(`/mypage/partner/printInfo`, {
        params: { partnerId: session?.user?.partnerId },
      }),
    {
      enabled: !!session?.user?.partnerId, // partnerId가 있어야 쿼리 실행
      onSuccess: (e) => {
        const { body, resultCode, resultMessage } = e.data;
        if (resultCode === 200) {
          reset({
            id: session?.user?.partnerId,
            compPrnCd: body.compPrnCd,
            samplePrnYn: body.samplePrnYn,
          });
        } else {
          toastError(resultMessage);
        }
      },
      onError: (error) => {
        toastError('데이터를 가져오는 중 오류가 발생했습니다.');
      },
    },
  );

  /** 전표 수정 */
  const updatePartnerPrintInfo = async (data: any) => {
    const response = await authApi.put('/mypage/partner/printInfo', data);
    return response.data;
  };
  const { mutate: updatePartmerMutate, isLoading } = useMutation(updatePartnerPrintInfo, {
    onSuccess: async (data) => {
      try {
        if (data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          refetch();
          onClose();
        } else {
          toastError(data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
    onError: () => {
      toastError('저장 중 오류가 발생했습니다.');
    },
  });

  const onValid = (data: any) => {
    console.log(data, '데이터');
    updatePartmerMutate(data);
  };

  return (
    <PopupLayout
      width={820}
      isEscClose={true}
      open={open}
      title={'전표양식 설정'}
      onClose={onClose}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" onClick={handleSubmit(onValid)}>
              {'저장'}
            </button>
            <button className="btn" onClick={onClose}>
              {'닫기'}
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          <PopupSearchType className={'type_1'}>
            <dl>
              <dt>동일상품 스큐 정보</dt>
              <dd>
                <CustomRadio control={control} name={'samplePrnYn'} value={'Y'} label={'인쇄함'} />
                <CustomRadio control={control} name={'samplePrnYn'} value={'N'} label={'인쇄안함'} />
              </dd>
            </dl>
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <dl>
              <dt>혼용율 정보</dt>
              <dd>
                <CustomRadio control={control} name={'compPrnCd'} value={'A'} label={'신규거래상품만 인쇄'} />
                <CustomRadio control={control} name={'compPrnCd'} value={'B'} label={'샘플전표만 인쇄'} />
                <CustomRadio control={control} name={'compPrnCd'} value={'C'} label={'인쇄안함'} />
              </dd>
            </dl>
          </PopupSearchType>
        </PopupSearchBox>
      </PopupContent>
    </PopupLayout>
  );
};

export default PartnerPrintSetPop;
