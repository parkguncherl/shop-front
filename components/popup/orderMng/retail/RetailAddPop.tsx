import { useRetailStore } from '../../../../stores/useRetailStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { PopupContent } from '../../PopupContent';
import { PopupFooter } from '../../PopupFooter';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { CommonResponseFileDown, RetailRequestCreate } from '../../../../generated';
import { DefaultOptions, Placeholder } from '../../../../libs/const';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../../../libs';
import FormInput from '../../../FormInput';
import FormDropDown from '../../../FormDropDown';
import Loading from '../../../Loading';
import { PopupLayout } from '../../PopupLayout';
import { useCommonStore } from '../../../../stores';
import { FileUploadPop } from '../../common';
import { DropDownOption } from '../../../../types/DropDownOptions';
import PopupFormBox from '../../content/PopupFormBox';
import PopupFormGroup from '../../content/PopupFormGroup';
import PopupFormType from '../../content/PopupFormType';
import { useSession } from 'next-auth/react';
import { Utils } from '../../../../libs/utils';
import CustomDebounceSelect from '../../../CustomDebounceSelect';
import { usePartnerStore } from '../../../../stores/usePartnerStore';
import dayjs from 'dayjs';
import CustomNewDatePicker from '../../../CustomNewDatePicker';

type RetailRequestCreateFields = RetailRequestCreate & {
  workingDays: DropDownOption[];
};

/** 주문관리 - 판매처관리 - 신규 팝업 */
export const RetailAddPop = () => {
  const [fileUrl, setFileUrl] = useState('');
  const session = useSession();
  // 요일선택
  const dayOptions: DropDownOption[] = [
    { key: 1, value: 'mon', label: '월' },
    { key: 2, value: 'tue', label: '화' },
    { key: 3, value: 'wed', label: '수' },
    { key: 4, value: 'thu', label: '목' },
    { key: 5, value: 'fri', label: '금' },
    { key: 6, value: 'sat', label: '토' },
    { key: 7, value: 'sun', label: '일' },
  ];

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm<RetailRequestCreateFields>({
    resolver: yupResolver(YupSchema.RetailRegRequest()), // 완료
    defaultValues: { compPrnCd: 'B', remainYn: 'Y', vatYn: 'N', regYmd: dayjs().format('YYYY-MM-DD') },
    mode: 'onSubmit',
  });

  /** 판매처관리 스토어 - State */
  const [modalType, closeModal] = useRetailStore((s) => [s.modalType, s.closeModal]);

  /** 판매처관리 양식 관리 스토어 - API */
  const [insertRetail] = useRetailStore((s) => [s.insertRetail]);

  const [commonModalType, commonOpenModal, getFileUrl] = useCommonStore((s) => [s.modalType, s.openModal, s.getFileUrl]);
  const queryClient = useQueryClient();

  /** 판매처 등록 */
  const { mutate: createRetailMutate, isLoading } = useMutation(insertRetail, {
    onSuccess: async (e) => {
      try {
        const { resultCode, resultMessage } = e.data;
        if (resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries({ queryKey: ['/retail/paging'] });
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

  // 영업일 처리
  const handleWorkingDayChange = (e: any, value: any) => {
    setValue('workingDays', value);
    const workingDay = dayOptions.map((option) => (value.includes(option.value) ? 'Y' : 'N')).join('');
    setValue('workingDay', workingDay);
  };

  /** 구분1,2 관련 */
  const [updatePartnerAll] = usePartnerStore((s) => [s.updatePartnerAll]);
  const [textAreaValues, setTextAreaValues] = useState<{
    selGb1Cntn: string;
    selGb2Cntn: string;
  }>({
    selGb1Cntn: '',
    selGb2Cntn: '',
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

  useEffect(() => {
    console.log('selectedValues ==>', selectedValues);
  }, [selectedValues]);

  const fetchInfoData = async (type: 'selGb1Cntn' | 'selGb2Cntn') => {
    const { data: partnerData } = await authApi.get(`/partner/detail`);
    const { resultCode, body, resultMessage } = partnerData;
    if (resultCode === 200) {
      let infoData = type === 'selGb1Cntn' ? body.selGb1Cntn : body.selGb2Cntn;
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
    fetchInfoData('selGb1Cntn');
    fetchInfoData('selGb2Cntn');
  }, []);
  useEffect(() => {
    console.log('');
  }, []);
  /** 구분1 저장 */
  const { mutate: updatePartnerSelGb1CntnMutate } = useMutation(updatePartnerAll, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess(Utils.getGubun('seller1', '구분1') + '이 저장되었습니다.');
        fetchInfoData('selGb1Cntn');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });
  /** 구분2 저장 */
  const { mutate: updatePartnerSelGb2CntnMutate } = useMutation(updatePartnerAll, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess(Utils.getGubun('seller2', '구분2') + '이 저장되었습니다.');
        fetchInfoData('selGb2Cntn');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  // RetailAddPop.tsx의 onValid 함수 수정
  const onValid: SubmitHandler<RetailRequestCreateFields> = (data: any) => {
    const formData = {
      ...data,
      gubun1: selectedValues.gubun1,
      gubun2: selectedValues.gubun2,
      limitAmt: data.limitAmt ? Number(String(data.limitAmt).replace(/,/g, '')) : undefined,
      purchaseAmt: data.purchaseAmt ? Number(String(data.purchaseAmt).replace(/,/g, '')) : undefined,
      nowAmt: data.nowAmt ? Number(String(data.nowAmt).replace(/,/g, '')) : undefined,
    };

    console.log('저장 데이터:', formData);
    createRetailMutate(formData);
  };

  return (
    <PopupLayout
      width={700}
      isEscClose={false}
      open={modalType.type === 'ADD' && modalType.active}
      title={'소매처 등록하기'}
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
              <FormInput<RetailRequestCreateFields> inputType={'file'} control={control} name={'fileId'} />
            </div>
            <div className="right">
              <FormInput<RetailRequestCreateFields>
                control={control}
                name={'sellerNm'}
                label={'소매처명'}
                placeholder={'전표에 출력되는 상호예요'}
                required={true}
              />
              <FormInput<RetailRequestCreateFields> control={control} name={'compNm'} label={'사업자명'} placeholder={Placeholder.Input} required={false} />
              <FormInput<RetailRequestCreateFields> control={control} name={'compNo'} label={'사업자번호'} placeholder={Placeholder.Input} required={false} />
              <FormInput<RetailRequestCreateFields> control={control} name={'ceoNm'} label={'대표자'} placeholder={Placeholder.Input} required={false} />
              <FormInput<RetailRequestCreateFields> control={control} name={'ceoTelNo'} label={'연락처'} placeholder={Placeholder.PhoneNo} required={false} />
            </div>
          </div>
          <PopupFormGroup title={'추가정보'}>
            <PopupFormType className={'type1'}>
              <FormInput<RetailRequestCreateFields> control={control} name={'personNm'} label={'담당자'} placeholder={Placeholder.Input} required={false} />
            </PopupFormType>
            <PopupFormType className={'type1'}>
              <FormInput<RetailRequestCreateFields>
                control={control}
                name={'personTelNo'}
                label={'담당자연락처'}
                placeholder={Placeholder.PhoneNo}
                required={false}
              />
            </PopupFormType>
            <PopupFormType className={'type1'}>
              <FormInput<RetailRequestCreateFields> control={control} name={'sellerAddr'} label={'주소'} placeholder={Placeholder.Input} required={false} />
            </PopupFormType>
            <PopupFormType className={'type1'}>
              <FormInput<RetailRequestCreateFields> control={control} name={'snsId'} label={'SNS'} placeholder={Placeholder.Input} required={false} />
            </PopupFormType>
            <PopupFormType className={'type2'}>
              <CustomDebounceSelect
                title={Utils.getGubun('seller1', '구분1')}
                gbCode={'seller1'}
                type={'form'}
                fetchOptions={textAreaValues.selGb1Cntn}
                onChange={(value) => handleSelectChange('gubun1', value)}
                onEditItem={(item) => {
                  updatePartnerSelGb1CntnMutate({ ['selGb1Cntn']: item });
                }}
                onSearchChange={(newSearchValue: any) => {
                  setSelectedValues((prevSelectedValues) => ({
                    ...prevSelectedValues,
                    gubun1: newSearchValue,
                  }));
                }}
                defaultValue={selectedValues.gubun1 || ''}
              />
              <CustomDebounceSelect
                title={Utils.getGubun('seller2', '구분2')}
                gbCode={'seller2'}
                type={'form'}
                fetchOptions={textAreaValues.selGb2Cntn}
                onChange={(value) => handleSelectChange('gubun2', value)}
                onEditItem={(item) => {
                  updatePartnerSelGb2CntnMutate({ ['selGb2Cntn']: item });
                }}
                onSearchChange={(newSearchValue: any) => {
                  setSelectedValues((prevSelectedValues) => ({
                    ...prevSelectedValues,
                    gubun2: newSearchValue,
                  }));
                }}
                defaultValue={selectedValues.gubun2 || ''}
              />
            </PopupFormType>
            <PopupFormType className={'type1'}>
              <FormInput<RetailRequestCreateFields>
                control={control}
                name={'etcScrCntn'}
                label={'비고(화면)'}
                placeholder={Placeholder.Input}
                required={false}
              />
            </PopupFormType>
            <PopupFormType className={'type1'}>
              <FormInput<RetailRequestCreateFields>
                control={control}
                name={'etcChitCntn'}
                label={'비고(전표)'}
                placeholder={Placeholder.Input}
                required={false}
              />
            </PopupFormType>
          </PopupFormGroup>
          <PopupFormGroup title={'인쇄'}>
            <PopupFormType className={'type3 retail'}>
              <FormDropDown<RetailRequestCreateFields>
                control={control}
                title={'혼용율'}
                name={'compPrnCd'}
                defaultOptions={DefaultOptions.Select}
                codeUpper={'10320'}
                required={false}
                // style={{ width: '215px' }}
              />
              <FormDropDown<RetailRequestCreateFields>
                control={control}
                title={'잔액'}
                name={'remainYn'}
                options={[
                  {
                    key: 'Y',
                    value: 'Y',
                    label: '인쇄',
                  },
                  {
                    key: 'N',
                    value: 'N',
                    label: '미인쇄',
                  },
                ]}
                required={false}
              />
              <FormDropDown<RetailRequestCreateFields>
                control={control}
                title={'부가세'}
                name={'vatYn'}
                options={[
                  {
                    key: 'Y',
                    value: 'Y',
                    label: '인쇄',
                  },
                  {
                    key: 'N',
                    value: 'N',
                    label: '미인쇄',
                  },
                ]}
                required={false}
              />
            </PopupFormType>
          </PopupFormGroup>
        </PopupFormBox>
      </PopupContent>
      {isLoading && <Loading />}
      {commonModalType.type === 'UPLOAD' && commonModalType.active && <FileUploadPop onValueChange={handleChildValueChange} fileId={getValues('fileId')} />}
    </PopupLayout>
  );
};
