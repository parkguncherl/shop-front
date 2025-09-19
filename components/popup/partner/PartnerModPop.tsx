import React, { useEffect, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupLayout } from '../PopupLayout';
import { useCommonStore } from '../../../stores';
import { usePartnerStore } from '../../../stores/usePartnerStore';
import { PopupSearchBox, PopupSearchType } from '../content';
import FormInput from '../../FormInput';
import { Placeholder } from '../../../libs/const';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FileUploadPop } from '../common';
import {
  CommonResponseFileDown,
  PartnerRequestCreate,
  PartnerRequestDelete,
  PartnerResponsePaging,
  ApiResponseListLogisCodeDropDown,
} from '../../../generated';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../../libs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../ToastMessage';
import { DeleteConfirmModal } from '../../DeleteConfirmModal';
import FormDropDown from '../../FormDropDown';
import { DropDownOption } from '../../../types/DropDownOptions';
import useAppStore from '../../../stores/useAppStore';

export type PartnerRequestUpdateFields = {
  id?: number;
  partnerNm: string;
  shortNm: string;
  repNm: string;
  upperPartnerId?: number;
  upperPartnerNm?: string;
  fileId?: number;
  logisId?: number;
  partnerEngNm?: string;
  partnerTelNo?: string;
  repTelNo?: string;
  compNo?: string;
  detailInfo?: string;
  partnerEmail?: string;
  delYn?: string;
  addTime?: number;
  misongYn?: string;
  orderShortNm?: string;
  sizeInfo?: string;
  creUser?: string;
  updUser?: string;
};

interface Props {
  datas: PartnerResponsePaging;
}

/** 화주관리 수정 팝업 */
const PartnerModPop = ({ datas }: Props) => {
  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  /** 스토어 */
  const [modalType, closeModal] = usePartnerStore((s) => [s.modalType, s.closeModal]);
  const [commonModalType, commonOpenModal, getFileUrl] = useCommonStore((s) => [s.modalType, s.openModal, s.getFileUrl]);
  /** 화주관리 스토어 - API */
  const [updatePartner, deletePartner, openModal] = usePartnerStore((s) => [s.updatePartner, s.deletePartner, s.openModal]);
  const [confirmModal, setConfirmModal] = useState<boolean>(false); // 삭제 모달
  const queryClient = useQueryClient();
  const [fileUrl, setFileUrl] = useState('');
  const [logisOptions, setLogisOptions] = useState<DropDownOption[]>([]);

  /** 화주 조회하기 */
  const { data: partner, isSuccess: isListSuccess } = useQuery({
    queryKey: ['/partner/detail', datas.id],
    queryFn: () => authApi.get(`/partner/detail/${datas.id}`),
    refetchOnMount: true, // 'always' 대신 true
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
  useEffect(() => {
    fetchData(datas?.fileId);
  }, [datas?.fileId]);

  const { data: response, isSuccess } = useQuery({
    queryKey: ['/logis/dropdown'],
    queryFn: () => authApi.get<ApiResponseListLogisCodeDropDown>('/logis/dropdown'),
    enabled: true,
  });

  useEffect(() => {
    if (response && response.data.body && response.data.body.length > 0) {
      const options: DropDownOption[] = response.data.body.map((item: any) => ({
        key: item.codeCd.toString(),
        value: Number(item.codeCd),
        label: item.codeNm,
      }));
      setLogisOptions(options);
    } else {
      console.warn('창고 목록이 비어 있습니다.');
      setLogisOptions([{ key: '', value: '', label: '선택' }]);
    }
  }, [isSuccess]);

  // 공통적으로 사용할 onChange 함수
  const handleInputChange = (regexPattern: RegExp, formatPattern: string) => (e: any) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 남기기
    const formattedValue = rawValue.replace(regexPattern, formatPattern); // 포맷에 맞게 변환
    // 입력 필드에 표시할 값은 하이픈 포함된 포맷된 값으로 설정
    e.target.value = formattedValue;
  };

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<PartnerRequestUpdateFields>({
    resolver: yupResolver(YupSchema.PartnerRequestForUpdate()), // 완료
    defaultValues: {},
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (partner?.data) {
      const { body } = partner.data;
      reset({
        id: body.id,
        upperPartnerId: body.upperPartnerId,
        upperPartnerNm: body.upperPartnerNm,
        fileId: body.fileId,
        logisId: body.logisId,
        partnerNm: body.partnerNm,
        shortNm: body.shortNm,
        partnerEngNm: body.partnerEngNm,
        partnerTelNo: body.partnerTelNo.replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3'),
        repNm: body.repNm,
        repTelNo: body.repTelNo.replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3'),
        compNo: body.compNo.replace(/^(\d{3})(\d{2})(\d{5})$/, '$1-$2-$3'),
        detailInfo: body.detailInfo,
        partnerEmail: body.partnerEmail,
        addTime: body.addTime,
        misongYn: body.misongYn,
        orderShortNm: body.orderShortNm,
        sizeInfo: body.sizeInfo,
        creUser: body.creUser,
        updUser: body.updUser,
      });
    }
  }, [partner, reset]);

  /** 화주 수정하기 */
  const { mutate: updatePartnerMutate } = useMutation(updatePartner, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries(['/partner/paging']);
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
  const { mutate: deletePartnerMutate, isLoading: deleteCodeIsLoading } = useMutation(deletePartner, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          await queryClient.invalidateQueries(['/partner/paging']);
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

  const onValid: SubmitHandler<PartnerRequestCreate> = (data) => {
    // 번호 리플레이스
    data.repTelNo = (data.repTelNo || '').replace(/[^0-9]/g, '');
    data.partnerTelNo = (data.partnerTelNo || '').replace(/[^0-9]/g, '');
    data.compNo = (data.compNo || '').replace(/[^0-9]/g, '');

    updatePartnerMutate(data);
  };
  const deleteCodeFn = async () => {
    deletePartnerMutate({ id: partner?.data.body.id, upperPartnerId: partner?.data.body.upperPartnerId } as PartnerRequestDelete);
  };

  // 파일업로드
  const handleChildValueChange = (fileInfo: CommonResponseFileDown) => {
    reset({
      ...partner?.data.body,
      fileId: fileInfo.fileId,
    });
    fetchData(fileInfo.fileId);
  };
  const { session } = useAppStore();

  return (
    <PopupLayout
      width={820}
      isEscClose={false}
      open={modalType.type === 'MOD'}
      title={'화주 수정하기'}
      onClose={() => {
        closeModal('MOD');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            {session?.user?.authCd === '399' && (
              <button className="btn" title="삭제" onClick={(e) => setConfirmModal(true)}>
                삭제
              </button>
            )}
            <button className="btn btnBlue" title="저장" onClick={handleSubmit(onValid)}>
              저장
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('MOD')}>
              닫기
            </button>
          </div>
          {partner?.data.upperPartnerNm ? (
            <DeleteConfirmModal
              dispTitle={'정말 삭제하시겠습니까?'}
              width={500}
              open={confirmModal}
              onConfirm={deleteCodeFn}
              onClose={() => setConfirmModal(false)}
            />
          ) : (
            <DeleteConfirmModal
              dispTitle={'소속된 도매가 전부 삭제됩니다. 정말 삭제하시겠습니까?'}
              width={500}
              open={confirmModal}
              onConfirm={deleteCodeFn}
              onClose={() => setConfirmModal(false)}
            />
          )}
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          {partner?.data.upperPartnerNm && (
            <PopupSearchType className={'type_2'}>
              <FormInput<PartnerRequestUpdateFields>
                control={control}
                name={'upperPartnerNm'}
                label={'상위파트너'}
                placeholder={Placeholder.Input || ''}
                required={false}
                disable={true}
              />
              <div style={{ display: 'none' }}>
                <FormInput<PartnerRequestUpdateFields> control={control} name={'upperPartnerId'} />
              </div>
            </PopupSearchType>
          )}
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdateFields>
              control={control}
              name={'partnerNm'}
              label={'회사명'}
              placeholder={Placeholder.Input || ''}
              required={true}
            />
            <FormInput<PartnerRequestUpdateFields>
              control={control}
              name={'partnerEngNm'}
              label={'회사영문명'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormDropDown<PartnerRequestUpdateFields> control={control} name={'logisId'} title={'창고'} options={logisOptions} required={false} />
            <FormInput<PartnerRequestUpdateFields>
              control={control}
              name={'compNo'}
              label={'사업자번호'}
              onChange={handleInputChange(/^(\d{3})(\d{2})(\d{5})$/, '$1-$2-$3')}
              placeholder={Placeholder.Input || ''}
              required={true}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdateFields> control={control} name={'shortNm'} label={'약어'} placeholder={Placeholder.Input || ''} />
            <FormInput<PartnerRequestUpdateFields>
              inputType={'file'}
              control={control}
              name={'fileId'}
              label={'파일 ID'}
              placeholder={Placeholder.Input || ''}
              required={false}
              onClick={() => commonOpenModal('UPLOAD')}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdateFields>
              control={control}
              name={'partnerTelNo'}
              label={'회사전화번호'}
              onChange={handleInputChange(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3')}
              placeholder={Placeholder.Input || ''}
              required={true}
            />
            <FormInput<PartnerRequestUpdateFields>
              control={control}
              name={'addTime'}
              label={'시스템 설정시간'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdateFields> control={control} name={'repNm'} label={'대표자명'} placeholder={Placeholder.Input || ''} required={true} />
            <FormInput<PartnerRequestUpdateFields>
              control={control}
              name={'repTelNo'}
              label={'대표자전화번호'}
              onChange={handleInputChange(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3')}
              placeholder={Placeholder.Input || ''}
              required={true}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdateFields>
              control={control}
              name={'orderShortNm'}
              label={'제작상품 약어'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
            <FormDropDown<PartnerRequestUpdateFields> control={control} title={'화주확인후미송'} name={'misongYn'} codeUpper={'10280'} required={true} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <FormInput<PartnerRequestUpdateFields>
              inputType={'textarea'}
              control={control}
              name={'sizeInfo'}
              label={'사이즈정보'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdateFields>
              control={control}
              name={'detailInfo'}
              label={'상세정보'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
            <FormInput<PartnerRequestUpdateFields>
              control={control}
              name={'partnerEmail'}
              label={'회사이메일'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <dl>
              <dt>등록자</dt>
              <dd>{getValues('creUser')}</dd>
            </dl>
            <dl>
              <dt>등록시간</dt>
              <dd>{partner?.data?.body?.creTm}</dd>
            </dl>
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <dl>
              <dt>수정자</dt>
              <dd>{getValues('updUser')}</dd>
            </dl>
            <dl>
              <dt>수정시간</dt>
              <dd>{partner?.data?.body?.updTm}</dd>
            </dl>
          </PopupSearchType>
          {fileUrl ? (
            <PopupSearchType className={'type_1'}>
              <div className="imageView">
                <dl>
                  <dt>이미지 미리보기</dt>
                  <dd>
                    <img src={fileUrl} alt="이미지" />
                  </dd>
                </dl>
              </div>
            </PopupSearchType>
          ) : (
            ''
          )}
        </PopupSearchBox>
      </PopupContent>
      {/*<Loading />*/}
      {commonModalType.type === 'UPLOAD' && commonModalType.active && <FileUploadPop onValueChange={handleChildValueChange} fileId={datas.fileId} />}
    </PopupLayout>
  );
};

export default PartnerModPop;
