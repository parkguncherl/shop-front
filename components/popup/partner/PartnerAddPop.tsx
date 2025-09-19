import React, { useEffect, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupLayout } from '../PopupLayout';
import { usePartnerStore } from '../../../stores/usePartnerStore';
import { PopupSearchBox, PopupSearchType } from '../content';
import FormInput from '../../FormInput';
import { Placeholder } from '../../../libs/const';
import { SubmitHandler, useForm } from 'react-hook-form';
import { CommonResponseFileDown, PartnerRequestCreate, PartnerResponsePaging } from '../../../generated';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../ToastMessage';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../../libs';
import { FileUploadPop } from '../common';
import { useCommonStore } from '../../../stores';
import { DropDownOption } from '../../../types/DropDownOptions';
import FormDropDown from '../../FormDropDown';
import { useLogisStore } from '../../../stores/wms/useLogisStore';

export type PartnerRequestCreateFields = {
  id: number;
  upperPartnerId: number;
  upperPartnerNm: string;
  fileId?: number;
  logisId: number;
  partnerNm: string;
  shortNm: string;
  partnerEngNm: string;
  partnerTelNo: string;
  repNm: string;
  repTelNo: string;
  compNo: string;
  detailInfo: string;
  partnerEmail: string;
  delYn: string;
  addTime: number;
  misongYn: string;
  sizeInfo: string;
  orderShortNm: string;
};

interface Props {
  data: PartnerResponsePaging;
}

/** 화주관리 신규 추가 팝업 */
const PartnerAddPop = ({ data }: Props) => {
  /** 스토어 */
  const [modalType, closeModal] = usePartnerStore((s) => [s.modalType, s.closeModal]);
  const [commonModalType, commonOpenModal, getFileUrl] = useCommonStore((s) => [s.modalType, s.openModal, s.getFileUrl]);
  const [fileUrl, setFileUrl] = useState('');
  const [logisOptions, setLogisOptions] = useState<DropDownOption[]>([]);
  const { fetchLogis } = useLogisStore();

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

  /** 창고 조회하기 (by 변수) */
  const fetchLogisOptions = async () => {
    try {
      const response = await fetchLogis({});
      console.log('API 응답:', response);

      const { data } = response;

      if (data?.resultCode === 200 && data.body && Array.isArray(data.body.rows)) {
        const logisList = data.body.rows;
        console.log('창고 목록:', logisList);

        if (logisList.length > 0) {
          const options: DropDownOption[] = logisList.map((item: any) => ({
            key: item.id.toString(),
            value: item.id.toString(),
            label: `${item.logisNm} (${item.logisKey})`,
          }));

          // '선택' 옵션 추가
          const defaultOption: DropDownOption = {
            key: '',
            value: '',
            label: '선택',
          };

          setLogisOptions([defaultOption, ...options]);
        } else {
          console.warn('창고 목록이 비어 있습니다.');
          setLogisOptions([{ key: '', value: '', label: '선택' }]);
        }
      } else {
        console.error('API 응답 오류 또는 예상치 못한 데이터 구조:', data);
        toastError('창고 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('창고 목록 조회 중 오류 발생:', error);
      toastError('창고 목록을 불러오는데 실패했습니다. 네트워크 연결을 확인해 주세요.');
    }
  };

  useEffect(() => {
    fetchLogisOptions();
    setValue('misongYn', 'Y');
  }, []);

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<PartnerRequestCreateFields>({
    resolver: yupResolver(YupSchema.PartnerRequest()), // 완료
    defaultValues: {},
    mode: 'onSubmit',
  });
  // 초기화
  useEffect(() => {
    reset({
      upperPartnerId: data.id || 0,
      upperPartnerNm: data.partnerNm || '',
      addTime: 6, // default 로 6시간
    });
  }, [data, reset]);

  /** 화주관리 스토어 - API */
  const [insertPartner] = usePartnerStore((s) => [s.insertPartner]);

  const queryClient = useQueryClient();

  /** 화주 등록 */
  const { mutate: insertPartnerMutate, isLoading } = useMutation(insertPartner, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.' || '');
          await queryClient.invalidateQueries(['/partner/paging']);
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
  const onValid: SubmitHandler<PartnerRequestCreate> = (data) => {
    // 번호 리플레이스
    data.repTelNo = (data.repTelNo || '').replace(/[^0-9]/g, '');
    data.partnerTelNo = (data.partnerTelNo || '').replace(/[^0-9]/g, '');
    data.compNo = (data.compNo || '').replace(/[^0-9]/g, '');

    insertPartnerMutate(data);
  };

  // 공통적으로 사용할 onChange 함수
  const handleInputChange = (regexPattern: RegExp, formatPattern: string) => (e: any) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 남기기
    const formattedValue = rawValue.replace(regexPattern, formatPattern); // 포맷에 맞게 변환
    // 입력 필드에 표시할 값은 하이픈 포함된 포맷된 값으로 설정
    e.target.value = formattedValue;
  };

  // 파일업로드
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
      title={!(data.upperPartnerId === undefined) ? '도매 추가하기' : '화주 추가하기'}
      onClose={() => {
        closeModal('ADD');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" title="저장" onClick={handleSubmit(onValid)}>
              저장
            </button>
            <button
              className="btn"
              title="닫기"
              onClick={() => {
                closeModal('ADD');
              }}
            >
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          {!(data.upperPartnerId === undefined) ? (
            <PopupSearchType className={'type_2'}>
              <FormInput<PartnerRequestCreateFields> control={control} name={'upperPartnerNm'} label={'상위파트너'} required={false} disable={true} />
              <div style={{ display: 'none' }}>
                <FormInput<PartnerRequestCreateFields> control={control} name={'upperPartnerId'} />
              </div>
            </PopupSearchType>
          ) : (
            ''
          )}
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestCreateFields>
              control={control}
              name={'partnerNm'}
              label={'회사명'}
              placeholder={Placeholder.Input || ''}
              required={true}
            />
            <FormInput<PartnerRequestCreateFields>
              control={control}
              name={'partnerEngNm'}
              label={'회사영문명'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestCreateFields> control={control} name={'shortNm'} label={'약어'} placeholder={Placeholder.Input || ''} required={true} />
            <FormInput<PartnerRequestCreateFields>
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
            <FormDropDown<PartnerRequestCreateFields> control={control} name={'logisId'} title={'창고'} options={logisOptions} required={false} />
            <FormInput<PartnerRequestCreateFields>
              control={control}
              onChange={handleInputChange(/^(\d{3})(\d{2})(\d{5})$/, '$1-$2-$3')}
              name={'compNo'}
              label={'사업자번호'}
              placeholder={Placeholder.Input || ''}
              required={true}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestCreateFields> control={control} name={'repNm'} label={'대표자명'} placeholder={Placeholder.Input || ''} required={true} />
            <FormInput<PartnerRequestCreateFields>
              control={control}
              onChange={handleInputChange(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3')}
              name={'repTelNo'}
              label={'대표자전화번호'}
              placeholder={Placeholder.Input || ''}
              required={true}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestCreateFields>
              control={control}
              onChange={handleInputChange(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3')}
              name={'partnerTelNo'}
              label={'회사전화번호'}
              placeholder={Placeholder.Input || ''}
              required={true}
            />
            <FormInput<PartnerRequestCreateFields>
              control={control}
              name={'addTime'}
              label={'시스템 설정시간'}
              placeholder={'시간 단위로 입력하세요.'}
              required={false}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestCreateFields>
              control={control}
              name={'orderShortNm'}
              label={'제작상품 약어'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
            <FormDropDown<PartnerRequestCreateFields>
              control={control}
              title={'화주확인후미송'}
              name={'misongYn'}
              codeUpper={'10280'}
              required={true}
              multiple={false}
              defaultValue={'Y'}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <FormInput<PartnerRequestCreateFields>
              inputType={'textarea'}
              control={control}
              name={'sizeInfo'}
              label={'사이즈정보'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestCreateFields>
              control={control}
              name={'detailInfo'}
              label={'상세정보'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
            <FormInput<PartnerRequestCreateFields>
              control={control}
              name={'partnerEmail'}
              label={'회사이메일'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
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
      {commonModalType.type === 'UPLOAD' && commonModalType.active && <FileUploadPop onValueChange={handleChildValueChange} />}
    </PopupLayout>
  );
};

export default PartnerAddPop;
