/**
 * @file components/popup/factory/FactoryAddPop.tsx
 * @description OMS > 관리 > 생산처 수정팝업
 * @copyright 2024
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { PopupContent } from '../PopupContent';
import { PopupFooter } from '../PopupFooter';
import { toastError, toastSuccess } from '../../ToastMessage';
import { CommonResponseFileDown, FactoryRequestCreate } from '../../../generated';
import { Placeholder } from '../../../libs/const';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../../libs';
import FormInput from '../../FormInput';
import Loading from '../../Loading';
import { PopupLayout } from '../PopupLayout';
import { useFactoryListStore } from '../../../stores/useFactoryListStore';
import { Utils } from '../../../libs/utils';
import PopupFormBox from '../content/PopupFormBox';
import PopupFormGroup from '../content/PopupFormGroup';
import PopupFormType from '../content/PopupFormType';
import CustomDebounceSelect from '../../CustomDebounceSelect';
import { useCommonStore } from '../../../stores';
import { FileUploadPop } from '../common';
import { usePartnerStore } from '../../../stores/usePartnerStore';
import dayjs from 'dayjs';
import CustomNewDatePicker from '../../CustomNewDatePicker';

/** 주문관리 - 생산처관리 - 신규 팝업 */
export const FactoryAddPop = () => {
  const [fileUrl, setFileUrl] = useState('');
  const queryClient = useQueryClient();

  const [commonModalType, commonOpenModal, getFileUrl] = useCommonStore((s) => [s.modalType, s.openModal, s.getFileUrl]);

  const {
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors, isValid },
  } = useForm<FactoryRequestCreate>({
    resolver: yupResolver(YupSchema.FactoryRegRequest()), // 완료
    defaultValues: { sleepYn: 'N', regYmd: dayjs().format('YYYY-MM-DD') },
    mode: 'onSubmit',
  });

  /** 생산처관리 스토어 - State */
  const [modalType, closeModal, insertFactory] = useFactoryListStore((s) => [s.modalType, s.closeModal, s.insertFactory]);

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
  // 파일업로드
  const handleChildValueChange = (fileInfo: CommonResponseFileDown) => {
    setValue('fileId', fileInfo.fileId);
    fetchData(fileInfo.fileId);
  };

  /** 구분1,2 관련 */
  const [updatePartnerAll] = usePartnerStore((s) => [s.updatePartnerAll]);
  const [textAreaValues, setTextAreaValues] = useState<{
    facGb1Cntn: string;
    facGb2Cntn: string;
  }>({
    facGb1Cntn: '',
    facGb2Cntn: '',
  });
  const [selectedValues, setSelectedValues] = useState<{ [key: string]: string }>({
    gubun1: '',
    gubun2: '',
  });
  const handleSelectChange = (name: string, value: string) => {
    setSelectedValues((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };
  const fetchInfoData = async (type: 'facGb1Cntn' | 'facGb2Cntn') => {
    const { data: partnerData } = await authApi.get(`/partner/detail`);
    const { resultCode, body, resultMessage } = partnerData;
    if (resultCode === 200) {
      let infoData = type === 'facGb1Cntn' ? body.facGb1Cntn : body.facGb2Cntn;
      if (!infoData) {
        infoData = '';
      }
      setTextAreaValues((prev) => ({ ...prev, [type]: infoData }));
    } else {
      toastError(resultMessage);
    }
  };
  useEffect(() => {
    // 구분 내용 가져오기
    fetchInfoData('facGb1Cntn');
    fetchInfoData('facGb2Cntn');
  }, []);
  /** 구분1 저장 */
  const { mutate: updatePartnerFacGb1CntnMutate } = useMutation(updatePartnerAll, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess(Utils.getGubun('seller1', '구분1') + '이 저장되었습니다.');
        fetchInfoData('facGb1Cntn');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });
  /** 구분2 저장 */
  const { mutate: updatePartnerFacGb2CntnMutate } = useMutation(updatePartnerAll, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess(Utils.getGubun('seller2', '구분2') + '이 저장되었습니다.');
        fetchInfoData('facGb2Cntn');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  /** 판매처 등록 */
  const { mutate: createFactoryMutate, isLoading } = useMutation(insertFactory, {
    onSuccess: async (e) => {
      try {
        const { resultCode, resultMessage } = e.data;
        if (resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries(['/factory/defInfo/paging']);
          await queryClient.invalidateQueries(['/factory/settStat/paging']);
          closeModal('ADD');
        } else {
          toastError(resultMessage);
          throw new Error(resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const onValid: SubmitHandler<FactoryRequestCreate> = (data) => {
    console.log(data);
    data.gubun1 = selectedValues.gubun1;
    data.gubun2 = selectedValues.gubun2;
    //console.log(data, '데이터확인');
    createFactoryMutate(data);
  };

  return (
    <PopupLayout
      width={700}
      isEscClose={false}
      open={modalType.type === 'ADD' && modalType.active}
      title={'생산처 등록하기'}
      onClose={() => closeModal('ADD')}
      footer={
        <PopupFooter>
          <div className={'btnArea'}>
            <button className={'btn btnBlue'} onClick={handleSubmit(onValid)}>
              저장
            </button>
            <button className={'btn'} onClick={() => closeModal('ADD')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent className="popInpWidth100">
        <CustomNewDatePicker
          name={'regYmd'}
          type={'date'}
          title={'등록일자'}
          onChange={(name, value) => {
            setValue(name, value);
          }}
          className={'popTopRight'}
        />
        <PopupFormBox>
          <div className="imgDiv">
            <div className={`left ${fileUrl ? 'view' : ''}`}>
              <div className="imageView" onClick={() => commonOpenModal('UPLOAD')}>
                {fileUrl ? <img src={fileUrl} alt="이미지" /> : ''}
                <span>사업자등록증</span>
              </div>
              <FormInput<FactoryRequestCreate> inputType={'file'} control={control} name={'fileId'} />
            </div>
            <div className="right">
              <FormInput<FactoryRequestCreate> control={control} name={'compNm'} label={'생산처명'} placeholder={'전표에 출력되는 상호예요'} required={true} />
              <FormInput<FactoryRequestCreate> control={control} name={'compNo'} label={'사업자번호'} placeholder={Placeholder.PhoneNo} required={false} />
              <FormInput<FactoryRequestCreate> control={control} name={'busiNm'} label={'사업자명'} placeholder={Placeholder.Input} required={false} />
              <FormInput<FactoryRequestCreate> control={control} name={'ceoNm'} label={'대표자'} placeholder={Placeholder.Input} required={false} />
              <FormInput<FactoryRequestCreate> control={control} name={'ceoTelNo'} label={'연락처'} placeholder={Placeholder.PhoneNo} required={false} />
            </div>
          </div>
          <PopupFormGroup title={'추가정보'}>
            <PopupFormType className={'type1'}>
              <FormInput<FactoryRequestCreate> control={control} name={'compAddr'} label={'주소'} placeholder={Placeholder.Input} required={false} />
            </PopupFormType>
            <PopupFormType className={'type1'}>
              <FormInput<FactoryRequestCreate> control={control} name={'compEmail'} label={'이메일'} placeholder={Placeholder.Input} required={false} />
            </PopupFormType>
            <PopupFormType className={'type1'}>
              <FormInput<FactoryRequestCreate> control={control} name={'personNm'} label={'담당자'} placeholder={Placeholder.Input} required={false} />
            </PopupFormType>
            <PopupFormType className={'type1'}>
              <FormInput<FactoryRequestCreate> control={control} name={'personTelNo'} label={'연락처'} placeholder={Placeholder.Input} required={false} />
            </PopupFormType>
            <PopupFormType className={'type2'}>
              <CustomDebounceSelect
                title={Utils.getGubun('factory1', '구분1')}
                gbCode={'factory1'}
                type={'form'}
                fetchOptions={textAreaValues.facGb1Cntn}
                onChange={(value) => handleSelectChange('gubun1', value)}
                onEditItem={(item) => {
                  updatePartnerFacGb1CntnMutate({ ['facGb1Cntn']: item });
                }}
                onSearchChange={(newSearchValue: any) => {
                  setSelectedValues((prevSelectedValues) => ({
                    ...prevSelectedValues,
                    gubun1: newSearchValue,
                  }));
                }}
              />
              <CustomDebounceSelect
                title={Utils.getGubun('factory2', '구분2')}
                gbCode={'factory2'}
                type={'form'}
                fetchOptions={textAreaValues.facGb2Cntn}
                onChange={(value) => handleSelectChange('gubun2', value)}
                onEditItem={(item) => {
                  updatePartnerFacGb2CntnMutate({ ['facGb2Cntn']: item });
                }}
                onSearchChange={(newSearchValue: any) => {
                  setSelectedValues((prevSelectedValues) => ({
                    ...prevSelectedValues,
                    gubun2: newSearchValue,
                  }));
                }}
              />
            </PopupFormType>
            <PopupFormType className={'type1'}>
              <FormInput<FactoryRequestCreate> control={control} name={'etcScrCntn'} label={'비고(화면)'} placeholder={Placeholder.Input} required={false} />
            </PopupFormType>
            <PopupFormType className={'type1'}>
              <FormInput<FactoryRequestCreate> control={control} name={'etcChitCntn'} label={'비고(전표)'} placeholder={Placeholder.Input} required={false} />
            </PopupFormType>
          </PopupFormGroup>
        </PopupFormBox>
      </PopupContent>
      {isLoading && <Loading />}
      {commonModalType.type === 'UPLOAD' && commonModalType.active && <FileUploadPop onValueChange={handleChildValueChange} fileId={getValues('fileId')} />}
    </PopupLayout>
  );
};
