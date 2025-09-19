import { ApiResponseDetail, CommonResponseFileDown, RetailRequestUpdate } from '../../../../generated';
import { useRetailStore } from '../../../../stores/useRetailStore';
import { useCommonStore } from '../../../../stores';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Button } from '../../../Button';
import { PopupContent } from '../../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../../content';
import { PopupFooter } from '../../PopupFooter';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { DefaultOptions, Placeholder } from '../../../../libs/const';
import { DeleteConfirmModal } from '../../../DeleteConfirmModal';
import { SubmitHandler, useForm } from 'react-hook-form';
import FormInput from '../../../FormInput';
import FormDropDown from '../../../FormDropDown';
import Loading from '../../../Loading';
import { PopupLayout } from '../../PopupLayout';
import { FileUploadPop } from '../../common';
import { authApi, YupSchema } from '../../../../libs';
import { Utils } from '../../../../libs/utils';
import { DropDownOption } from '../../../../types/DropDownOptions';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSession } from 'next-auth/react';
import { usePartnerStore } from '../../../../stores/usePartnerStore';
import FormDatePicker from '../../../FormDatePicker';
import PopupFormBox from '../../content/PopupFormBox';
import PopupFormGroup from '../../content/PopupFormGroup';
import PopupFormType from '../../content/PopupFormType';
import CustomDebounceSelect from '../../../CustomDebounceSelect';
import CustomNewDatePicker from '../../../CustomNewDatePicker';

type RetailRequestUpdateFields = RetailRequestUpdate & {
  workingDays: DropDownOption[];
};

/** 주문관리 - 판매처관리 - 수정 팝업 */
export const RetailModPop = () => {
  /** 판매처관리 스토어 - State */
  const [modalType, closeModal, retail, setRetail, updateRetail, deleteRetail, getRetailTransInfo] = useRetailStore((s) => [
    s.modalType,
    s.closeModal,
    s.retail,
    s.setRetail,
    s.updateRetail,
    s.deleteRetail,
    s.getRetailTransInfo,
  ]);

  const session = useSession();
  /** 공통 스토어 - State */
  const [commonModalType, commonOpenModal, getFileUrl] = useCommonStore((s) => [s.modalType, s.openModal, s.getFileUrl]);
  const [confirmModal, setConfirmModal] = useState(false);
  const [fileUrl, setFileUrl] = useState('');

  const queryClient = useQueryClient();
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
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm<RetailRequestUpdateFields>({
    resolver: yupResolver(YupSchema.RetailModRequest()), // 완료
    defaultValues: {
      ...retail,
      limitAmt: retail?.limitAmt !== null ? Utils.setComma(retail?.limitAmt || 0) : 0,
      purchaseAmt: retail?.purchaseAmt !== null ? Utils.setComma(retail?.purchaseAmt || 0) : 0,
      nowAmt: retail?.nowAmt !== null ? Utils.setComma(retail?.nowAmt || 0) : 0,
      workingDays: retail?.workingDay
        ? (retail.workingDay
            .split('')
            .map((day, index) => (day === 'Y' ? dayOptions[index] : undefined))
            .filter(Boolean) as DropDownOption[])
        : [],
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    fetchData(getValues('fileId'));
  }, []);
  /** 판매처 수정 */
  const { mutate: updateRetailMutate, isLoading: updateIsLoading } = useMutation(updateRetail, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          setRetail({});
          await queryClient.invalidateQueries(['/retail/paging']);
          closeModal('MOD');
        } else {
          toastError(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 판매처 삭제 */
  const { mutate: deleteRetailMutate, isLoading: deleteIsLoading } = useMutation(deleteRetail, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          await queryClient.invalidateQueries(['/retail/paging']);
          closeModal('MOD');
        } else {
          toastError(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 삭제 버튼 클릭 시 */
  const deleteRetailFn = async () => {
    if (retail && retail.id) {
      // 삭제전 거래기록 확인
      try {
        const response = await getRetailTransInfo(retail.id);
        console.log('response', response);
        if (response.data.resultCode === 200) {
          console.log('소매처 거래기록 응답 ', response.data.body);
          if (Number(response.data.body) > 0) {
            toastError('거래 정보가 있어 삭제가 불가능합니다!');
            return;
          }

          deleteRetailMutate(retail.id);
        } else {
          toastError('거래 정보 조회 중 오류가 발생했습니다.');
        }
      } catch {
        toastError('거래 정보 조회 중 오류가 발생했습니다.');
      }
    } else {
      toastError('선택된 소매처를 찾을 수 없음');
    }
  };

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

  useEffect(() => {
    setSelectedValues((prev) => ({
      ...prev,
      gubun1: retail?.gubun1 || '',
      gubun2: retail?.gubun2 || '',
    }));
  }, [retail]);

  const handleSelectChange = (name: string, value: string) => {
    setSelectedValues((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };
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
  /** 구분1 저장 */
  const { mutate: updatePartnerSelGb1CntnMutate } = useMutation(updatePartnerAll, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess(`${Utils.getGubun('seller1', '구분1')}이(가) 저장되었습니다.`);
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
        toastSuccess(`${Utils.getGubun('seller12', '구분2')}이(가) 저장되었습니다.`);
        fetchInfoData('selGb2Cntn');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  /** 수정하기 */
  const onValid: SubmitHandler<RetailRequestUpdateFields> = (data: any) => {
    const formData = {
      ...data,
      gubun1: selectedValues.gubun1,
      gubun2: selectedValues.gubun2,
      // 금액 데이터에서 콤마 제거 후 숫자로 변환
      limitAmt: data.limitAmt ? Number(String(data.limitAmt).replace(/,/g, '')) : undefined,
      purchaseAmt: data.purchaseAmt ? Number(String(data.purchaseAmt).replace(/,/g, '')) : undefined,
      nowAmt: data.nowAmt ? Number(String(data.nowAmt).replace(/,/g, '')) : undefined,
    };

    console.log('저장 데이터:', formData);
    updateRetailMutate(formData);
  };

  return (
    <PopupLayout
      width={700}
      isEscClose={false}
      open={modalType.type === 'MOD' && modalType.active}
      title={'소매처 수정하기'}
      onClose={() => closeModal('MOD')}
      footer={
        <PopupFooter>
          <div className={'btnArea between'}>
            <div className="left">
              <button className={'btn'} onClick={(e) => setConfirmModal(true)} disabled={deleteIsLoading}>
                삭제
              </button>
            </div>
            <div className="right">
              <button className={'btn btnBlue'} onClick={handleSubmit(onValid)}>
                저장
              </button>
              <button className={'btn'} onClick={() => closeModal('ADD')}>
                닫기
              </button>
            </div>
          </div>
          <DeleteConfirmModal open={confirmModal} onConfirm={deleteRetailFn} onClose={() => setConfirmModal(false)} />
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
              <FormInput<RetailRequestUpdateFields> inputType={'file'} control={control} name={'fileId'} />
            </div>
            <div className="right">
              <FormInput<RetailRequestUpdateFields>
                control={control}
                name={'sellerNm'}
                label={'소매처명'}
                placeholder={'전표에 출력되는 상호예요'}
                required={true}
              />
              <FormInput<RetailRequestUpdateFields> control={control} name={'compNm'} label={'사업자명'} placeholder={Placeholder.Input} required={false} />
              <FormInput<RetailRequestUpdateFields> control={control} name={'compNo'} label={'사업자번호'} placeholder={Placeholder.Input} required={false} />
              <FormInput<RetailRequestUpdateFields> control={control} name={'ceoNm'} label={'대표자'} placeholder={Placeholder.Input} required={false} />
              <FormInput<RetailRequestUpdateFields> control={control} name={'ceoTelNo'} label={'연락처'} placeholder={Placeholder.PhoneNo} required={false} />
            </div>
          </div>
          <PopupFormGroup title={'추가정보'}>
            <PopupFormType className={'type1'}>
              <FormInput<RetailRequestUpdateFields> control={control} name={'personNm'} label={'담당자'} placeholder={Placeholder.Input} required={false} />
            </PopupFormType>
            <PopupFormType className={'type1'}>
              <FormInput<RetailRequestUpdateFields>
                control={control}
                name={'personTelNo'}
                label={'담당자연락처'}
                placeholder={Placeholder.PhoneNo}
                required={false}
              />
            </PopupFormType>
            <PopupFormType className={'type1'}>
              <FormInput<RetailRequestUpdateFields> control={control} name={'sellerAddr'} label={'주소'} placeholder={Placeholder.Input} required={false} />
            </PopupFormType>
            <PopupFormType className={'type1'}>
              <FormInput<RetailRequestUpdateFields> control={control} name={'snsId'} label={'SNS'} placeholder={Placeholder.Input} required={false} />
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
              <FormInput<RetailRequestUpdateFields>
                control={control}
                name={'etcScrCntn'}
                label={'비고(화면)'}
                placeholder={Placeholder.Input}
                required={false}
              />
            </PopupFormType>
            <PopupFormType className={'type1'}>
              <FormInput<RetailRequestUpdateFields>
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
              <FormDropDown<RetailRequestUpdateFields>
                control={control}
                title={'혼용율'}
                name={'compPrnCd'}
                defaultOptions={DefaultOptions.Select}
                codeUpper={'10320'}
                required={false}
                // style={{ width: '215px' }}
              />
              <FormDropDown<RetailRequestUpdateFields>
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
              <FormDropDown<RetailRequestUpdateFields>
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
      {(updateIsLoading || deleteIsLoading) && <Loading />}
      {commonModalType.type === 'UPLOAD' && commonModalType.active && <FileUploadPop onValueChange={handleChildValueChange} fileId={getValues('fileId')} />}
    </PopupLayout>
  );
};
