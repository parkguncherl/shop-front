'use client';

import React, { useEffect, useState } from 'react';
import { PopupFooter } from '@/components/popup/PopupFooter';
import { PopupContent } from '@/components/popup/PopupContent';
import { PopupLayout } from '@/components/popup/PopupLayout';
import { useCommonStore } from '@/stores';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { PopupSearchBox, PopupSearchType } from '@/components/popup/content';
import FormInput from '@/components/form/FormInput';
import FormDropDown from '@/components/form/FormDropDown';
import { Placeholder } from '@/libs/const';
import { PartnerRequestDelete, PartnerRequestUpdate } from '@/generated';

type PartnerRequestUpdateExtended = PartnerRequestUpdate & {
  reviewPointRate?: number;
  sizeInfo?: string;
  aiStudyText?: string;
  aiStudyProdDetailText?: string;
  partnerImage?: string;
  location?: string;
  etcInfo?: string;
  subDomain?: string;
  kakaoStoryId?: string;
  kakaoId?: string;
  instaId?: string;
};

import { authApi } from '@/libs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '@/components/ToastMessage';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { DropDownOption } from '@/types/DropDownOptions';
import useAppStore from '@/stores/useAppStore';
import { SubmitHandler, useForm } from 'react-hook-form';

interface Props {
  datas: PartnerRequestUpdate;
}

/** 화주관리 수정 팝업 */
const PartnerModPop = ({ datas }: Props) => {
  /** 공통 스토어 - State */
  const upMenuNm = useCommonStore((s) => s.upMenuNm);
  const menuNm = useCommonStore((s) => s.menuNm);
  /** 스토어 */
  const modalType = usePartnerStore((s) => s.modalType);
  const closeModal = usePartnerStore((s) => s.closeModal);
  const commonModalType = useCommonStore((s) => s.modalType);
  const commonOpenModal = useCommonStore((s) => s.openModal);
  const getFileUrl = useCommonStore((s) => s.getFileUrl);
  /** 화주관리 스토어 - API */
  const updatePartner = usePartnerStore((s) => s.updatePartner);
  const deletePartner = usePartnerStore((s) => s.deletePartner);
  const openModal = usePartnerStore((s) => s.openModal);
  const [confirmModal, setConfirmModal] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const [fileUrl, setFileUrl] = useState('');
  const [logisOptions, setLogisOptions] = useState<DropDownOption[]>([]);

  /** 화주 조회하기 */
  const { data: partner, isSuccess: isListSuccess } = useQuery({
    queryKey: ['/partner/detail', datas.id],
    queryFn: () => authApi.get(`/partner/detail/${datas.id}`),
    refetchOnMount: true,
    enabled: !!datas.id,
  });

  useEffect(() => {
    if (isListSuccess) {
      const { resultCode, body, resultMessage } = partner.data;
      console.log('partner.data==> ', partner.data);
      if (resultCode !== 200) {
        toastError(resultMessage);
      }
    }
  }, [partner, isListSuccess]);

  const handleInputChange = (regexPattern: RegExp, formatPattern: string) => (e: any) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const formattedValue = rawValue.replace(regexPattern, formatPattern);
    e.target.value = formattedValue;
  };

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<PartnerRequestUpdateExtended>({
    defaultValues: {},
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (partner?.data) {
      const { body } = partner.data;
      reset({
        id: body.id,
        partnerNm: body.partnerNm,
        partnerSubNm: body.partnerSubNm,
        partnerTicker: body.partnerTicker,
        phoneNo: (body.phoneNo || '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3'),
        location: body.location ?? '',
        partnerType: body.partnerType,
        repNm: body.repNm,
        email: body.email,
        reviewPointRate: body.reviewPointRate,
        sizeInfo: body.sizeInfo ?? '',
        partnerImage: body.partnerImage ?? '',
        etcInfo: body.etcInfo ?? '',
        subDomain: body.subDomain ?? '',
        kakaoStoryId: body.kakaoStoryId ?? '',
        kakaoId: body.kakaoId ?? '',
        instaId: body.instaId ?? '',
        aiStudyText: body.aiStudyText ?? '',
        aiStudyProdDetailText: body.aiStudyProdDetailText ?? '',
        creUser: body.creUser,
        updUser: body.updUser,
      });
    }
  }, [partner, reset]);

  /** 화주 수정하기 */
  const { mutate: updatePartnerMutate } = useMutation({
    mutationFn: updatePartner,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries({ queryKey: ['/partner/paging'] });
          closeModal('MOD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 화주 삭제하기 */
  const { mutate: deletePartnerMutate, isPending: deleteCodeIsLoading } = useMutation({
    mutationFn: deletePartner,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          await queryClient.invalidateQueries({ queryKey: ['/partner/paging'] });
          closeModal('MOD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const onValid: SubmitHandler<PartnerRequestUpdateExtended> = (data) => {
    data.phoneNo = (data.phoneNo || '').replace(/[^0-9]/g, '');
    updatePartnerMutate(data as unknown as PartnerRequestUpdate);
  };

  const deleteCodeFn = async () => {
    deletePartnerMutate({ id: partner?.data.body.id, upperPartnerId: partner?.data.body.upperPartnerId } as PartnerRequestDelete);
  };

  const { session } = useAppStore();

  return (
    <PopupLayout
      width={820}
      className={'wideInputPop'}
      isEscClose={false}
      open={modalType.type === 'MOD'}
      title={'화주 수정하기'}
      onClose={() => {
        closeModal('MOD');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn" title="삭제" onClick={(e) => setConfirmModal(true)}>
              삭제
            </button>
            <button className="btn btn_primary" title="저장" onClick={handleSubmit(onValid)}>
              저장
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('MOD')}>
              닫기
            </button>
          </div>
          <DeleteConfirmModal
            dispTitle={'정말 삭제하시겠습니까?'}
            width={500}
            open={confirmModal}
            onConfirm={deleteCodeFn}
            onClose={() => setConfirmModal(false)}
          />
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdate> control={control} name={'partnerNm'} label={'회사명'} placeholder={Placeholder.Input || ''} required={true} />
            <FormInput<PartnerRequestUpdate>
              control={control}
              name={'partnerTicker'}
              label={'회사티커'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdateExtended> control={control} name={'location'} label={'위치'} placeholder={Placeholder.Input || ''} required={false} />
            <FormInput<PartnerRequestUpdateExtended> control={control} name={'subDomain'} label={'서브도메인'} placeholder={Placeholder.Input || ''} required={false} />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdate>
              control={control}
              onChange={handleInputChange(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3')}
              name={'phoneNo'}
              label={'회사전화번호'}
              placeholder={Placeholder.Input || ''}
              required={true}
            />
            <FormDropDown<PartnerRequestUpdate>
              control={control}
              name={'partnerType'}
              title={'파트너유형'}
              codeUpper={'10060'}
              required={true}
              style={{ width: 173 }}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdate> control={control} name={'repNm'} label={'대표자명'} placeholder={Placeholder.Input || ''} required={false} />
            <FormInput<PartnerRequestUpdate> control={control} name={'email'} label={'이메일'} placeholder={Placeholder.Input || ''} required={false} />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdateExtended>
              control={control}
              name={'sizeInfo'}
              label={'사이즈'}
              placeholder={'예: 66,77 (콤마로 구분)'}
              required={false}
            />
            <FormInput<PartnerRequestUpdateExtended>
              control={control}
              name={'reviewPointRate'}
              label={'리뷰포인트 적립률'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdateExtended>
              control={control}
              name={'partnerImage'}
              label={'파트너 이미지(폴더명)'}
              placeholder={'파일 저장소 폴더 프리픽스 (예: mapsiggun)'}
              required={false}
            />
            <FormInput<PartnerRequestUpdateExtended> control={control} name={'etcInfo'} label={'기타정보'} placeholder={Placeholder.Input || ''} required={false} />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdateExtended> control={control} name={'kakaoStoryId'} label={'카카오 스토리 ID'} placeholder={Placeholder.Input || ''} required={false} />
            <FormInput<PartnerRequestUpdateExtended> control={control} name={'kakaoId'} label={'카카오 ID'} placeholder={Placeholder.Input || ''} required={false} />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdateExtended> control={control} name={'instaId'} label={'인스타 ID'} placeholder={Placeholder.Input || ''} required={false} />
            <FormInput<PartnerRequestUpdate> control={control} name={'partnerSubNm'} label={'도메인명'} placeholder={Placeholder.Input || ''} required={true} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <dl>
              <dt>AI 기본 학습 텍스트</dt>
              <dd>
                <textarea
                  {...control.register('aiStudyText')}
                  rows={4}
                  placeholder="AI에게 학습시킬 기본 안내 내용을 입력하세요. (예: 넌 이 쇼핑몰의 친절한 안내원이야)"
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 13, resize: 'vertical' }}
                />
              </dd>
            </dl>
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <dl>
              <dt>AI 상품 상세 학습 텍스트</dt>
              <dd>
                <textarea
                  {...control.register('aiStudyProdDetailText')}
                  rows={4}
                  placeholder="상품 상담 시 AI가 먼저 학습해야 할 내용을 입력하세요."
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 13, resize: 'vertical' }}
                />
              </dd>
            </dl>
          </PopupSearchType>
        </PopupSearchBox>
      </PopupContent>
    </PopupLayout>
  );
};

export default PartnerModPop;
