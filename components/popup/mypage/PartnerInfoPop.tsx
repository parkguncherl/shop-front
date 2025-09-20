import React, { useEffect, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupLayout } from '../PopupLayout';
import { useCommonStore, useMypageStore } from '../../../stores';
import { usePartnerStore } from '../../../stores/usePartnerStore';
import { PopupSearchBox, PopupSearchType } from '../content';
import FormInput from '../../FormInput';
import { Placeholder } from '../../../libs/const';
import { SubmitHandler, useForm } from 'react-hook-form';
import { PartnerRequestUpdate } from '../../../generated';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../../libs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../ToastMessage';
import FormDropDown from '../../FormDropDown';
import { DropDownOption } from '../../../types/DropDownOptions';
import useAppStore from '../../../stores/useAppStore';
import { ConfirmModal } from '../../ConfirmModal';

type PartnerRequestUpdateFields = {
  partnerNm: string;
  shortNm: string;
  repNm: string;
  id?: number;
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
/** 화주 정보 출력 팝업 */
const PartnerInfoPop = () => {
  /** 스토어 */
  const [modalType, closeModal] = useMypageStore((s) => [s.modalType, s.closeModal]);
  const [commonModalType, commonOpenModal, getFileUrl] = useCommonStore((s) => [s.modalType, s.openModal, s.getFileUrl]);
  /** 화주관리 스토어 - API */
  const [selectedPartner, updatePartner] = usePartnerStore((s) => [s.selectedPartner, s.updatePartner]);

  const [fileUrl, setFileUrl] = useState('');
  const [logisOptions, setLogisOptions] = useState<DropDownOption[]>([]);
  const [confirmModalIsOpened, setConfirmModalIsOpened] = useState<{ active: boolean; type: 'MODIFY' }>({
    active: false,
    type: 'MODIFY',
  }); // todo type 의 경우 추후 confirm 모달이 추가될 시 대응되는 문자 형식 타입을 추가
  const queryClient = useQueryClient();

  const { session } = useAppStore();

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<PartnerRequestUpdateFields>({
    resolver: yupResolver(YupSchema.PartnerRequest()), // 완료
    defaultValues: {},
    mode: 'onSubmit',
  });

  /** 화주 조회하기 로그인정보로 조회한다. 입력변수 없이 */
  const { data: partner, isSuccess: isListSuccess } = useQuery([`/partner/my-partner`], () => authApi.get(`/partner/my-partner`), {
    refetchOnMount: 'always',
  });

  /** 화주 수정하기 */
  const { mutate: updatePartnerMutate } = useMutation(updatePartner, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('수정되었습니다.');
          await queryClient.invalidateQueries(['/partner/paging']);
          closeModal('PARTNER_INFO');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const onValid: SubmitHandler<PartnerRequestUpdate> = (data) => {
    /** 수정 가능한 영역 데이터 한정으로 발췌 */
    console.log(data);
    updatePartnerMutate(data);
  };

  useEffect(() => {
    if (isListSuccess) {
      const { resultCode, body, resultMessage } = partner.data;
      if (resultCode == 200) {
        reset({
          id: body.id,
          upperPartnerId: body.upperPartnerId,
          upperPartnerNm: body.upperPartnerNm,
          fileId: body.fileId,
          logisId: body.logisId,
          partnerNm: body.partnerNm,
          shortNm: body.shortNm,
          partnerEngNm: body.partnerEngNm,
          partnerTelNo: body.partnerTelNo,
          repNm: body.repNm,
          repTelNo: body.repTelNo,
          compNo: body.compNo,
          detailInfo: body.detailInfo,
          partnerEmail: body.partnerEmail,
          addTime: body.addTime,
          misongYn: body.misongYn,
          orderShortNm: body.orderShortNm,
          sizeInfo: body.sizeInfo,
          creUser: body.creUser,
          updUser: body.updUser,
        });
        if (body.fileId && body.fileId > 0) {
          fetchData(body.fileId);
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [partner, isListSuccess]);

  /** 파일 조회하기 (by 변수) */
  const fetchData = async (fileId: number | undefined) => {
    if (!fileId) return;
    const { data: selectFile } = await authApi.get(`/common/file/${fileId}`);
    const { resultCode, body, resultMessage } = selectFile;
    if (resultCode === 200) {
      const url = await getFileUrl(body[0].sysFileNm);
      setFileUrl(url);
    } else {
      toastError(resultMessage);
    }
  };

  /** 창고 조회하기 (by 변수) */
  const logishData = async () => {
    const { data: selectFile } = await authApi.get('/logis');
    const { resultCode, body, resultMessage } = selectFile;
    if (resultCode === 200) {
      const options: DropDownOption[] = body.map((item: any) => ({
        key: item.id,
        value: item.id,
        label: item.logisKey,
      }));
      // '선택' 옵션 추가
      const defaultOption: DropDownOption = {
        key: '',
        value: '',
        label: '선택', // or 'select' if the language is not Korean
      };
      setLogisOptions([defaultOption, ...options]);
    } else {
      toastError(resultMessage);
    }
  };
  useEffect(() => {
    //logishData();
  }, []);
  //openModal
  //handleSubmit(onValid)

  return (
    <PopupLayout
      width={900}
      isEscClose={true}
      open={modalType.type === 'PARTNER_INFO'}
      title={'도매 정보'}
      onClose={() => {
        closeModal('PARTNER_INFO');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button
              className="btn btnBlue"
              title="저장"
              onClick={() =>
                setConfirmModalIsOpened({
                  active: true,
                  type: 'MODIFY',
                })
              }
            >
              저장
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('PARTNER_INFO')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="storeInfoDiv mt15 mb5">
          <div className="left">{fileUrl ? <img src={fileUrl} alt="이미지" /> : ''}</div>
          <div className="right">
            <div className="smallTitle">도매 기본정보</div>
            {partner?.data.upperPartnerNm && (
              <dl>
                <dt>상위파트너</dt>
                <dd>몬드</dd>
              </dl>
            )}
            <dl>
              <dt>회사명</dt>
              <dd>{getValues('partnerNm')}</dd>
            </dl>
            <dl>
              <dt>회사영문명</dt>
              <dd>{getValues('partnerEngNm')}</dd>
            </dl>
            <dl>
              <dt>대표자명</dt>
              <dd>{getValues('repNm')}</dd>
            </dl>
            <dl>
              <dt>사업자번호</dt>
              <dd>{getValues('compNo')}</dd>
            </dl>
            <dl>
              <dt>대표자전화번호</dt>
              <dd>{getValues('repTelNo')}</dd>
            </dl>
            <dl>
              <dt>회사전화번호</dt>
              <dd>{getValues('partnerTelNo')}</dd>
            </dl>
          </div>
        </div>
        <div className="smallTitle mt15 mb5">도매 세부정보</div>
        <PopupSearchBox>
          {session?.user?.authCd === '999' && (
            <PopupSearchType className={'type_2'}>
              <FormInput<PartnerRequestUpdateFields> control={control} name={'shortNm'} label={'약어'} placeholder={Placeholder.Input || ''} />
              <FormInput<PartnerRequestUpdateFields>
                inputType={'file'}
                control={control}
                name={'fileId'}
                label={'파일 ID'}
                placeholder={Placeholder.Input || ''}
                required={false}
              />
              <FormDropDown<PartnerRequestUpdateFields> control={control} name={'logisId'} title={'창고'} options={logisOptions} required={false} />
            </PopupSearchType>
          )}

          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdateFields>
              control={control}
              name={'addTime'}
              label={'시스템 설정시간'}
              placeholder={Placeholder.Input || ''}
              required={false}
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
          {/*<PopupSearchType className={'type_1'}>*/}
          {/*  <FormInput<PartnerRequestUpdateFields>*/}
          {/*    inputType={'textarea'}*/}
          {/*    control={control}*/}
          {/*    name={'sizeInfo'}*/}
          {/*    label={'사이즈정보'}*/}
          {/*    placeholder={Placeholder.Input || ''}*/}
          {/*    required={false}*/}
          {/*  />*/}
          {/*</PopupSearchType>*/}
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
          {session?.user?.authCd === '999' && (
            <>
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
            </>
          )}
        </PopupSearchBox>
      </PopupContent>
      <ConfirmModal
        open={confirmModalIsOpened.active && confirmModalIsOpened.type == 'MODIFY'}
        title="도매 세부정보를 수정하시겠습니까?"
        width={350}
        onConfirm={handleSubmit(onValid)}
        onClose={() =>
          setConfirmModalIsOpened({
            ...confirmModalIsOpened,
            active: false,
          })
        }
      />
    </PopupLayout>
  );
};

export default PartnerInfoPop;
