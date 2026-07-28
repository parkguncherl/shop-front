'use client';

import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { PopupLayout } from '@/components/popup/PopupLayout';
import { PopupContent } from '@/components/popup/PopupContent';
import { PopupFooter } from '@/components/popup/PopupFooter';
import PopupFormBox from '@/components/popup/content/PopupFormBox';
import PopupFormGroup from '@/components/popup/content/PopupFormGroup';
import PopupFormType from '@/components/popup/content/PopupFormType';
import FormInput from '@/components/form/FormInput';
import { toastError, toastSuccess } from '@/components/ToastMessage';
import { useVendorStore } from '@/stores';
import { VendorMngResponseVendorPagingInfo } from '@/generated';

interface Props {
  open: boolean;
  item: VendorMngResponseVendorPagingInfo;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormFields {
  vendorNm: string;
  location?: string;
  phoneNo?: string;
  phoneNo2?: string;
  kakaoId?: string;
  kakaoStoryId?: string;
  instaId?: string;
  etcInfo?: string;
}

const VendorMngModPop = ({ open, item, onClose, onSuccess }: Props) => {
  const updateVendor = useVendorStore((s) => s.updateVendor);
  const { control, handleSubmit, reset } = useForm<FormFields>({
    defaultValues: { vendorNm: '', location: '', phoneNo: '', phoneNo2: '', kakaoId: '', kakaoStoryId: '', instaId: '', etcInfo: '' },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      vendorNm: item.vendorNm ?? '',
      location: item.location ?? '',
      phoneNo: item.phoneNo ?? '',
      phoneNo2: item.phoneNo2 ?? '',
      kakaoId: item.kakaoId ?? '',
      kakaoStoryId: (item as any).kakaoStoryId ?? '',
      instaId: (item as any).instaId ?? '',
      etcInfo: item.etcInfo ?? '',
    });
  }, [open, item]);

  const handleClose = () => onClose();

  const onValid: SubmitHandler<FormFields> = async (form) => {
    const { data } = await updateVendor({
      id: item.id as number,
      vendorNm: form.vendorNm,
      location: form.location ?? '',
      phoneNo: form.phoneNo ?? '',
      phoneNo2: form.phoneNo2 ?? '',
      kakaoId: form.kakaoId ?? '',
      kakaoStoryId: form.kakaoStoryId ?? '',
      instaId: form.instaId ?? '',
      etcInfo: form.etcInfo ?? '',
    });
    if (data?.resultCode === 200) {
      toastSuccess('수정되었습니다.');
      onSuccess();
    } else {
      toastError(data?.resultMessage ?? '수정 중 오류가 발생했습니다.');
    }
  };

  return (
    <PopupLayout
      width={600}
      open={open}
      isEscClose={true}
      title="협력업체 수정"
      onClose={handleClose}
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div className="left">
              <button className="btn btn_primary" onClick={handleSubmit(onValid, () => toastError('필수 항목을 확인해주세요.'))}>
                저장
              </button>
            </div>
            <div className="right">
              <button className="btn" onClick={handleClose}>
                닫기
              </button>
            </div>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupFormBox>
          <PopupFormGroup title="협력업체 정보">
            <PopupFormType className="type1">
              <FormInput<FormFields> control={control} name="vendorNm" label="명칭" placeholder="명칭을 입력하세요" required />
            </PopupFormType>
            <PopupFormType className="type1">
              <FormInput<FormFields> control={control} name="location" label="위치" placeholder="위치를 입력하세요" />
            </PopupFormType>
            <PopupFormType className="type1">
              <FormInput<FormFields> control={control} name="phoneNo" label="연락처" placeholder="연락처를 입력하세요" />
            </PopupFormType>
            <PopupFormType className="type1">
              <FormInput<FormFields> control={control} name="phoneNo2" label="연락처2" placeholder="연락처2를 입력하세요" />
            </PopupFormType>
            <PopupFormType className="type1">
              <FormInput<FormFields> control={control} name="kakaoId" label="카톡ID" placeholder="카톡ID를 입력하세요" />
            </PopupFormType>
            <PopupFormType className="type1">
              <FormInput<FormFields> control={control} name="kakaoStoryId" label="카카오스토리ID" placeholder="카카오스토리 ID를 입력하세요" />
            </PopupFormType>
            <PopupFormType className="type1">
              <FormInput<FormFields> control={control} name="instaId" label="인스타그램ID" placeholder="인스타그램 ID를 입력하세요" />
            </PopupFormType>
            <PopupFormType className="type1">
              <FormInput<FormFields> control={control} name="etcInfo" label="기타정보" placeholder="기타정보를 입력하세요" />
            </PopupFormType>
          </PopupFormGroup>
        </PopupFormBox>
      </PopupContent>
    </PopupLayout>
  );
};

export default VendorMngModPop;
