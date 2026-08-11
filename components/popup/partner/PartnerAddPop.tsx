'use client';

import React, { useState } from 'react';
import { PopupFooter } from '@/components/popup/PopupFooter';
import { PopupContent } from '@/components/popup/PopupContent';
import { PopupLayout } from '@/components/popup/PopupLayout';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { PopupSearchBox, PopupSearchType } from '@/components/popup/content';
import FormInput from '@/components/form/FormInput';
import { Placeholder } from '@/libs/const';
import { SubmitHandler, useForm } from 'react-hook-form';
import { CommonResponseFileDown, PartnerRequestCreate, PartnerResponsePaging } from '@/generated';

type PartnerRequestCreateExtended = PartnerRequestCreate & {
  reviewPointRate?: number;
  sizeInfo?: string;
  partnerImage?: string;
  location?: string;
  etcInfo?: string;
  subDomain?: string;
  kakaoStoryId?: string;
  kakaoId?: string;
  instaId?: string;
};

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '@/components/ToastMessage';
import { authApi } from '@/libs';
import { useCommonStore } from '@/stores';
import FormDropDown from '@/components/form/FormDropDown';

interface Props {
  data: PartnerResponsePaging;
}

/** 화주관리 신규 추가 팝업 */
const PartnerAddPop = ({ data }: Props) => {
  /** 스토어 */
  const modalType = usePartnerStore((s) => s.modalType);
  const closeModal = usePartnerStore((s) => s.closeModal);
  const commonModalType = useCommonStore((s) => s.modalType);
  const commonOpenModal = useCommonStore((s) => s.openModal);
  const getFileUrl = useCommonStore((s) => s.getFileUrl);
  const [fileUrl, setFileUrl] = useState('');

  /** 파일 조회하기 (by 변수) */
  const fetchData = async (fileId: number | undefined) => {
    if (!fileId) return;
    const { data: selectFile } = await authApi.get(`/common/file/${fileId}`, {});
    const { resultCode, body, resultMessage } = selectFile;
    if (resultCode === 200) {
      const url = await getFileUrl(body[0].sysFileNm);
      setFileUrl(url);
    } else {
      toastError(resultMessage);
    }
  };

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<PartnerRequestCreateExtended>({
    defaultValues: {},
    mode: 'onSubmit',
  });
  /** 화주관리 스토어 - API */
  const insertPartner = usePartnerStore((s) => s.insertPartner);

  const queryClient = useQueryClient();

  /** 화주 등록 */
  const { mutate: insertPartnerMutate, isPending } = useMutation({
    mutationFn: insertPartner,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries({ queryKey: ['/partner/paging'] });
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

  const onValid: SubmitHandler<PartnerRequestCreateExtended> = (data) => {
    data.phoneNo = (data.phoneNo || '').replace(/[^0-9]/g, '');
    insertPartnerMutate(data as PartnerRequestCreate);
  };

  const handleInputChange = (regexPattern: RegExp, formatPattern: string) => (e: any) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const formattedValue = rawValue.replace(regexPattern, formatPattern);
    e.target.value = formattedValue;
  };

  const handleChildValueChange = (fileInfo: CommonResponseFileDown) => {
    reset((prev) => ({
      ...prev,
      fileId: fileInfo.fileId,
    }));
    fetchData(fileInfo.fileId);
  };

  return (
    <PopupLayout
      width={820}
      isEscClose={false}
      open={modalType.type === 'ADD'}
      title={'화주 추가하기'}
      onClose={() => {
        closeModal('ADD');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btn_primary" title="저장" onClick={handleSubmit(onValid)}>
              저장
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('ADD')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestCreate> control={control} name={'partnerNm'} label={'회사명'} placeholder={Placeholder.Input || ''} required={true} />
            <FormInput<PartnerRequestCreate>
              control={control}
              name={'partnerTicker'}
              label={'회사티커'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestCreateExtended>
              control={control}
              name={'location'}
              label={'위치'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
            <FormInput<PartnerRequestCreateExtended> control={control} name={'subDomain'} label={'서브도메인'} placeholder={Placeholder.Input || ''} required={false} />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestCreate>
              control={control}
              onChange={handleInputChange(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3')}
              name={'phoneNo'}
              label={'회사전화번호'}
              placeholder={Placeholder.Input || ''}
              required={true}
            />
            <FormDropDown<PartnerRequestCreate>
              control={control}
              name={'partnerType'}
              title={'파트너유형'}
              codeUpper={'10060'}
              required={false}
              style={{ width: 173 }}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestCreate> control={control} name={'repNm'} label={'대표자명'} placeholder={Placeholder.Input || ''} required={false} />
            <FormInput<PartnerRequestCreate> control={control} name={'email'} label={'이메일'} placeholder={Placeholder.Input || ''} required={false} />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestCreateExtended>
              control={control}
              name={'sizeInfo'}
              label={'사이즈'}
              placeholder={'예: 66,77 (콤마로 구분)'}
              required={false}
            />
            <FormInput<PartnerRequestCreateExtended>
              control={control}
              name={'reviewPointRate'}
              label={'리뷰포인트 적립률'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestCreateExtended>
              control={control}
              name={'partnerImage'}
              label={'파트너 이미지(폴더명)'}
              placeholder={'파일 저장소 폴더 프리픽스 (예: mapsiggun)'}
              required={false}
            />
            <FormInput<PartnerRequestCreateExtended>
              control={control}
              name={'etcInfo'}
              label={'기타정보'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestCreateExtended>
              control={control}
              name={'kakaoStoryId'}
              label={'카카오 스토리 ID'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
            <FormInput<PartnerRequestCreateExtended>
              control={control}
              name={'kakaoId'}
              label={'카카오 ID'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestCreateExtended>
              control={control}
              name={'instaId'}
              label={'인스타 ID'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
            <FormInput<PartnerRequestCreate> control={control} name={'partnerSubNm'} label={'도메인명'} placeholder={'화주 웹사이트'} required={true} />
          </PopupSearchType>
        </PopupSearchBox>
      </PopupContent>
    </PopupLayout>
  );
};

export default PartnerAddPop;
