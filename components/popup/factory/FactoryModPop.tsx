/**
 * @file components/popup/factory/FactoryModPop.tsx
 * @description OMS > 관리 > 생산처 수정팝업
 * @copyright 2024
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { PopupContent } from '../PopupContent';
import { PopupFooter } from '../PopupFooter';
import { Button } from '../../Button';
import { toastError, toastSuccess } from '../../ToastMessage';
import { CommonResponseFileDown, FactoryRequestCreate, FactoryRequestDelete, RetailRequestUpdate } from '../../../generated';
import { DefaultOptions, Placeholder } from '../../../libs/const';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../../libs';
import FormInput from '../../FormInput';
import Loading from '../../Loading';
import { PopupLayout } from '../PopupLayout';
import { useFactoryListStore } from '../../../stores/useFactoryListStore';
import { Utils } from '../../../libs/utils';
import FormDatePicker from '../../FormDatePicker';
import PopupFormBox from '../content/PopupFormBox';
import PopupFormGroup from '../content/PopupFormGroup';
import PopupFormType from '../content/PopupFormType';
import CustomDebounceSelect from '../../CustomDebounceSelect';
import { usePartnerStore } from '../../../stores/usePartnerStore';
import { useCommonStore } from '../../../stores';
import { FileUploadPop } from '../common';
import dayjs from 'dayjs';
import { DeleteConfirmModal } from '../../DeleteConfirmModal';
import CustomNewDatePicker from '../../CustomNewDatePicker';

interface FactoryModPopProps {
  data: any; // 수정할 생산처 데이터
}

/** 주문관리 - 생산처관리 - 수정 팝업 */
export const FactoryModPop = ({ data }: FactoryModPopProps) => {
  const [fileUrl, setFileUrl] = useState('');
  const queryClient = useQueryClient();
  console.log('data===>', data);
  const [commonModalType, commonOpenModal, getFileUrl] = useCommonStore((s) => [s.modalType, s.openModal, s.getFileUrl]);
  const [confirmModal, setConfirmModal] = useState(false);

  const { handleSubmit, control, setValue, getValues } = useForm<FactoryRequestCreate>({
    resolver: yupResolver(YupSchema.FactoryRegRequest()), // 완료
    defaultValues: {
      ...data, // 기존 데이터를 defaultValues로 설정
      sleepYn: data.sleepYn || 'N',
    },
    mode: 'onSubmit',
  });

  /** 생산처관리 스토어 - State */
  const [modalType, closeModal, updateFactory, deleteFactory] = useFactoryListStore((s) => [s.modalType, s.closeModal, s.updateFactory, s.deleteFactory]);

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
  useEffect(() => {
    fetchData(getValues('fileId'));
  }, []);

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

  /** 생산처 수정 */
  const { mutate: updateFactoryMutate, isLoading } = useMutation(updateFactory, {
    onSuccess: async (e) => {
      try {
        const { resultCode, resultMessage } = e.data;
        if (resultCode === 200) {
          toastSuccess('수정되었습니다.');
          await queryClient.invalidateQueries(['/factory/defInfo/paging']);
          await queryClient.invalidateQueries(['/factory/settStat/paging']);
          closeModal('MOD');
        } else {
          toastError(resultMessage);
          throw new Error(resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 폼 제출 핸들러 */
  const onValid: SubmitHandler<FactoryRequestCreate> = (formData) => {
    // id 추가하여 수정 요청
    const updateData = {
      ...formData,
      gubun1: selectedValues.gubun1,
      gubun2: selectedValues.gubun2,
      regYmd: dayjs(formData.regYmd).format('YYYY-MM-DD'),
      id: data.id,
    };
    console.log(updateData, 'ㄹㄹ');
    updateFactoryMutate(updateData);
  };

  /** 삭제 */

  /** 생산처 삭제 */
  const { mutate: deleteFactoryMutate } = useMutation(deleteFactory, {
    onSuccess: async (e) => {
      try {
        const { resultCode, resultMessage } = e.data;
        if (resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          await queryClient.invalidateQueries(['/factory/defInfo/paging']);
          await queryClient.invalidateQueries(['/factory/settStat/paging']);
          closeModal('MOD');
        } else {
          toastError(resultMessage);
          throw new Error(resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const deleteFn = () => {
    deleteFactoryMutate({ id: data.id } as FactoryRequestDelete);
    setConfirmModal(false);
  };

  return (
    <PopupLayout
      width={700}
      isEscClose={false}
      open={modalType.type === 'MOD' && modalType.active}
      title={'생산처 수정하기'}
      onClose={() => closeModal('MOD')}
      footer={
        <PopupFooter>
          <div className={'btnArea between'}>
            <div className="left">
              <button className={'btn'} onClick={(e) => setConfirmModal(true)}>
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
            <DeleteConfirmModal open={confirmModal} onConfirm={deleteFn} onClose={() => setConfirmModal(false)} />
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
              <FormInput<FactoryRequestCreate> control={control} name={'busiNm'} label={'사업자명'} placeholder={Placeholder.PhoneNo} required={false} />
              <FormInput<FactoryRequestCreate> control={control} name={'compNo'} label={'사업자번호'} placeholder={Placeholder.Input} required={false} />
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
                defaultValue={getValues('gubun1')}
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
                defaultValue={getValues('gubun2')}
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
        {/*<PopupSearchBox>*/}
        {/*  <PopupSearchType className={'type_2'}>*/}
        {/*    <FormInput<FactoryRequestCreate> control={control} name={'compNm'} label={'생산처'} placeholder={Placeholder.Input} required={true} />*/}
        {/*    <FormInput<FactoryRequestCreate> control={control} name={'compAddr'} label={'생산처주소'} placeholder={Placeholder.Input} required={false} />*/}
        {/*  </PopupSearchType>*/}
        {/*  <PopupSearchType className={'type_2'}>*/}
        {/*    <FormDropDown<FactoryRequestCreate>*/}
        {/*      control={control}*/}
        {/*      title={Utils.getGubun('factory1', '구분1')}*/}
        {/*      gbCode={'factory1'}*/}
        {/*      name={'gubun1'}*/}
        {/*      defaultOptions={[...DefaultOptions.Select]}*/}
        {/*      codeUpper={'P0006'}*/}
        {/*      required={false}*/}
        {/*      isPartnerCode={true}*/}
        {/*    />*/}
        {/*    <FormDropDown<FactoryRequestCreate>*/}
        {/*      control={control}*/}
        {/*      title={Utils.getGubun('factory2', '구분2')}*/}
        {/*      gbCode={'factory2'}*/}
        {/*      name={'gubun2'}*/}
        {/*      defaultOptions={[...DefaultOptions.Select]}*/}
        {/*      codeUpper={'P0007'}*/}
        {/*      required={false}*/}
        {/*      isPartnerCode={true}*/}
        {/*    />*/}
        {/*  </PopupSearchType>*/}
        {/*  <PopupSearchType className={'type_2'}>*/}
        {/*    <FormInput<FactoryRequestCreate> control={control} name={'ceoNm'} label={'대표자'} placeholder={Placeholder.Input} required={false} />*/}
        {/*    <FormInput<FactoryRequestCreate> control={control} name={'ceoTelNo'} label={'대표자연락처'} placeholder={Placeholder.Input} required={false} />*/}
        {/*  </PopupSearchType>*/}
        {/*  <PopupSearchType className={'type_2'}>*/}
        {/*    <FormInput<FactoryRequestCreate> control={control} name={'personNm'} label={'담당자'} placeholder={Placeholder.Input} required={false} />*/}
        {/*    <FormInput<FactoryRequestCreate> control={control} name={'personTelNo'} label={'담당자연락처'} placeholder={Placeholder.Input} required={false} />*/}
        {/*  </PopupSearchType>*/}
        {/*  <PopupSearchType className={'type_2'}>*/}
        {/*    <FormInput<FactoryRequestCreate> control={control} name={'compEmail'} label={'생산처이메일'} placeholder={Placeholder.Input} required={false} />*/}
        {/*    <FormInput<FactoryRequestCreate> control={control} name={'compTelNo'} label={'생산처전화번호'} placeholder={Placeholder.Input} required={false} />*/}
        {/*  </PopupSearchType>*/}
        {/*  <PopupSearchType className={'type_2'}>*/}
        {/*    <FormInput<FactoryRequestCreate> control={control} name={'compFaxNo'} label={'생산처FAX'} placeholder={Placeholder.Input} required={false} />*/}
        {/*    <FormInput<FactoryRequestCreate> control={control} name={'compNo'} label={'사업자번호'} placeholder={Placeholder.Input} required={false} />*/}
        {/*  </PopupSearchType>*/}
        {/*  <PopupSearchType className={'type_2'}>*/}
        {/*    <FormInput<FactoryRequestCreate> control={control} name={'senderNm'} label={'화물'} placeholder={Placeholder.Input} required={false} />*/}
        {/*    <FormInput<FactoryRequestCreate> control={control} name={'senderTelNo'} label={'화물연락처'} placeholder={Placeholder.Input} required={false} />*/}
        {/*  </PopupSearchType>*/}
        {/*  <PopupSearchType className={'type_2'}>*/}
        {/*    <FormDropDown<FactoryRequestCreate>*/}
        {/*      control={control}*/}
        {/*      name={'snsType'}*/}
        {/*      title={'sns유형'}*/}
        {/*      required={false}*/}
        {/*      defaultOptions={[...DefaultOptions.Select]}*/}
        {/*      codeUpper={'10490'}*/}
        {/*    />*/}
        {/*    <FormInput<FactoryRequestCreate> control={control} name={'snsId'} label={'snsID'} placeholder={Placeholder.Input} required={false} />*/}
        {/*  </PopupSearchType>*/}
        {/*  <PopupSearchType className={'type_2'}>*/}
        {/*    <FormDropDown<FactoryRequestCreate>*/}
        {/*      control={control}*/}
        {/*      name={'factoryCd'}*/}
        {/*      title={'공장유형'}*/}
        {/*      required={false}*/}
        {/*      defaultOptions={[...DefaultOptions.Select]}*/}
        {/*      codeUpper={'10060'}*/}
        {/*    />*/}
        {/*    <FormDropDown<FactoryRequestCreate>*/}
        {/*      control={control}*/}
        {/*      name={'sleepYn'}*/}
        {/*      title={'휴면여부'}*/}
        {/*      required={false}*/}
        {/*      options={[*/}
        {/*        {*/}
        {/*          key: 0,*/}
        {/*          value: 'N',*/}
        {/*          label: '사용',*/}
        {/*        },*/}
        {/*        {*/}
        {/*          key: 1,*/}
        {/*          value: 'Y',*/}
        {/*          label: '휴면',*/}
        {/*        },*/}
        {/*      ]}*/}
        {/*    />*/}
        {/*  </PopupSearchType>*/}
        {/*  <PopupSearchType className={'type_2'}>*/}
        {/*    <FormDropDown<FactoryRequestCreate>*/}
        {/*      control={control}*/}
        {/*      title={'잔액인쇄YN'}*/}
        {/*      name={'remPrnYn'}*/}
        {/*      options={[*/}
        {/*        {*/}
        {/*          key: '',*/}
        {/*          value: '',*/}
        {/*          label: '선택',*/}
        {/*        },*/}
        {/*        {*/}
        {/*          key: 'Y',*/}
        {/*          value: 'Y',*/}
        {/*          label: '인쇄',*/}
        {/*        },*/}
        {/*        {*/}
        {/*          key: 'N',*/}
        {/*          value: 'N',*/}
        {/*          label: '미인쇄',*/}
        {/*        },*/}
        {/*      ]}*/}
        {/*      required={false}*/}
        {/*    />*/}
        {/*    <FormDropDown<FactoryRequestCreate>*/}
        {/*      control={control}*/}
        {/*      title={'처리확인YN'}*/}
        {/*      name={'tranYn'}*/}
        {/*      options={[*/}
        {/*        {*/}
        {/*          key: '',*/}
        {/*          value: '',*/}
        {/*          label: '선택',*/}
        {/*        },*/}
        {/*        {*/}
        {/*          key: 'Y',*/}
        {/*          value: 'Y',*/}
        {/*          label: '확인',*/}
        {/*        },*/}
        {/*        {*/}
        {/*          key: 'N',*/}
        {/*          value: 'N',*/}
        {/*          label: '미확인',*/}
        {/*        },*/}
        {/*      ]}*/}
        {/*      required={false}*/}
        {/*    />*/}
        {/*  </PopupSearchType>*/}
        {/*  <PopupSearchType className={'type_2'}>*/}
        {/*    <FormInput<FactoryRequestCreate> control={control} name={'etcScrCntn'} label={'정보비고'} placeholder={Placeholder.Input} required={false} />*/}
        {/*    <FormInput<FactoryRequestCreate> control={control} name={'etcChitCntn'} label={'전표비고'} placeholder={Placeholder.Input} required={false} />*/}
        {/*  </PopupSearchType>*/}
        {/*  <PopupSearchType className={'type_1'}>*/}
        {/*    <FormInput<FactoryRequestCreate> control={control} name={'detailInfo'} label={'상세정보'} placeholder={Placeholder.Input} required={false} />*/}
        {/*  </PopupSearchType>*/}
        {/*</PopupSearchBox>*/}
      </PopupContent>
      {isLoading && <Loading />}
      {commonModalType.type === 'UPLOAD' && commonModalType.active && <FileUploadPop onValueChange={handleChildValueChange} fileId={getValues('fileId')} />}
    </PopupLayout>
  );
};
