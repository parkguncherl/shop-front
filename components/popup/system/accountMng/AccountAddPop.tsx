import { useAccountStore } from '../../../../stores';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { PopupContent } from '../../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../../content';
import { PopupFooter } from '../../PopupFooter';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { UserRequestCreate, UserRequestCreateUseYn } from '../../../../generated';
import { DefaultOptions, Placeholder } from '../../../../libs/const';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../../../libs';
import FormInput from '../../../FormInput';
import FormDropDown from '../../../FormDropDown';
import Loading from '../../../Loading';
import { PopupLayout } from '../../PopupLayout';
import { useSession } from 'next-auth/react';
import { DropDownOption } from '../../../../types/DropDownOptions';
import { LogisDetail, useLogisStore } from '../../../../stores/wms/useLogisStore';

export type AccountRequestCreateFields = {
  loginId: string;
  userNm: string;
  phoneNo: string;
  authCd: string;
  useYn: UserRequestCreateUseYn;
  belongNm: string;
  deptNm?: string;
  positionNm?: string;
  partnerId?: number;
  workLogisId?: number;
  orgPartnerId?: number | undefined;
  orgPartnerNm?: string | null;
};

/** 시스템 - 계정관리 - 신규 팝업 */
export const AccountAddPop = () => {
  const session = useSession();
  const el = useRef<HTMLDListElement | null>(null);
  const { t } = useTranslation();

  const {
    watch,
    handleSubmit,
    getValues,
    setValue,
    control,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<AccountRequestCreateFields>({
    resolver: yupResolver<AccountRequestCreateFields>(YupSchema.AccountRequest()), // 완료
    defaultValues: {
      loginId: session.data?.user.loginId || '',
      userNm: session.data?.user.userNm || '',
      phoneNo: '',
      authCd: '',
      useYn: 'Y' as UserRequestCreateUseYn,
      belongNm: '',
    },
    mode: 'onSubmit',
  });

  /** 계정관리 스토어 - State */
  const [modalType, closeModal] = useAccountStore((s) => [s.modalType, s.closeModal]);

  /** 계정관리 양식 관리 스토어 - API */
  const [insertUser, sendMailUser] = useAccountStore((s) => [s.insertUser, s.sendMailUser]);
  const queryClient = useQueryClient();

  const [partnerList, setPartnerList] = useState([]);

  /** 화주리스트 조회하기 */
  const { data: partner, isSuccess: isListSuccess } = useQuery([`/partner/upperPartner`], () => authApi.get(`/partner/upperPartner`, {}));
  useEffect(() => {
    if (isListSuccess) {
      const { resultCode, body, resultMessage } = partner.data;
      if (resultCode === 200) {
        // 데이터 변환
        const transDataPartnerList = body.map((item: any) => ({
          key: item.id,
          value: item.partnerNm,
          label: item.partnerNm,
        }));
        setPartnerList(transDataPartnerList);
      } else {
        toastError(resultMessage);
      }
    }
  }, [partner, isListSuccess]);

  /** 계정 등록 */
  const { mutate: insertUserMutate, isLoading } = useMutation(insertUser, {
    onSuccess: async (e) => {
      try {
        const { resultCode, body, resultMessage } = e.data;
        if (resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries(['/user/paging']);
          closeModal('ADD');

          // if (body) {
          //   sendMailUserMutate({
          //     loginId: body.loginId,
          //     loginPass: body.loginPass,
          //     mailType: UserRequestEmailMailType.CreateId,
          //   } as UserRequestEmail);
          // }
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 계정 메일 보내기 */
  // const { mutate: sendMailUserMutate, isLoading: sendMailUserIsLoading } = useMutation(sendMailUser, {
  //   onSuccess: async (e) => {
  //     try {
  //       if (e.data.resultCode === 200) {
  //         //
  //       } else {
  //         toastError(e.data.resultMessage);
  //         throw new Error(e.data.resultMessage);
  //       }
  //     } catch (e) {
  //       console.log(e);
  //     }
  //   },
  // });

  // 세션
  const authCd = parseInt(session.data?.user.authCd || '');
  // const partnerId = session.data?.user.partnerId || 1;

  // 기본값 설정
  const initialPartnerList = [
    { key: 0, label: '선택', value: '선택' }, // 기본값 추가
    ...partnerList, // 실제 파트너 리스트
  ];
  useEffect(() => {
    if (initialPartnerList.length > 0) {
      const defaultOption = initialPartnerList[0]; // 첫 번째 옵션을 기본값으로 사용 (선택)
      setValue('partnerId', 0);
      setValue('orgPartnerNm', defaultOption.label);
      setValue('orgPartnerId', defaultOption.key);
    }
    if (authCd <= 399) {
      setValue('partnerId', 0);
      setValue('orgPartnerNm', null);
      setValue('orgPartnerId', undefined);
    }
  }, []);

  const { fetchLogis } = useLogisStore();

  const { data: logisData } = useQuery(['logisList'], () => fetchLogis({}), {
    select: (response) => {
      if (response.data.resultCode === 200 && response.data.body) {
        const fetchedOptions = response.data.body.rows.map((item: LogisDetail) => ({
          key: item.id.toString(),
          value: item.id,
          label: `${item.logisKey} - ${item.logisNm}`,
          //label: item.logisNm,
        }));
        return [{ key: '', value: '', label: '선택' } as DropDownOption].concat(fetchedOptions);
      }
      return [{ key: '', value: '', label: '선택' } as DropDownOption];
    },
    onError: (error) => {
      console.error('창고 목록 조회 오류:', error);
      toastError('창고 목록 조회 중 오류가 발생했습니다.');
    },
  });

  const onValid: SubmitHandler<UserRequestCreate> = (data) => {
    console.log('데이터확인', data);
    insertUserMutate(data);
  };

  return (
    <dl ref={el}>
      <form>
        <PopupLayout
          width={820}
          isEscClose={false}
          open={modalType.type === 'ADD' && modalType.active}
          title={'신규 계정 생성'}
          onClose={() => closeModal('ADD')}
          footer={
            <PopupFooter>
              <div className={'btnArea between'}>
                <div className="left"></div>
                <div className="right">
                  <button className={'btn btnBlue'} onClick={handleSubmit(onValid)}>
                    저장
                  </button>
                  <button className={'btn '} onClick={() => closeModal('ADD')}>
                    닫기
                  </button>
                </div>
              </div>
            </PopupFooter>
          }
        >
          <PopupContent>
            <PopupSearchBox>
              <PopupSearchType className={'type_2'}>
                <FormInput<AccountRequestCreateFields>
                  control={control}
                  name={'loginId'}
                  label={'ID(e-mail)'}
                  placeholder={t(Placeholder.Input) || ''}
                  required={true}
                />
                <FormInput<AccountRequestCreateFields>
                  control={control}
                  name={'userNm'}
                  label={'이름'}
                  placeholder={t(Placeholder.Input) || ''}
                  required={true}
                />
              </PopupSearchType>
              <PopupSearchType className={'type_2'}>
                <FormInput<AccountRequestCreateFields>
                  control={control}
                  onChange={(e) => {
                    // e.target.value = e.target.value.replace(/[^0-9]/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`);
                    // setValue('phoneNo', e.target.value.replace(/[^0-9]/g, '')); // 문자열에서 숫자만을 추출(하이픈 제외)하여 요청시 보낼 데이터로 설정, 유효성 검증 통과
                  }}
                  name={'phoneNo'}
                  label={'전화번호'}
                  placeholder={t(Placeholder.PhoneNo) || ''}
                  required={true}
                />
                <FormDropDown<AccountRequestCreateFields>
                  control={control}
                  title={'권한'}
                  name={'authCd'}
                  defaultOptions={[...DefaultOptions.Select]}
                  codeUpper={'10020'}
                  required={true}
                />
              </PopupSearchType>
              <PopupSearchType className={'type_2'}>
                <FormDropDown<AccountRequestCreateFields> control={control} title={'상태'} name={'useYn'} codeUpper={'10280'} required={true} />
                <FormInput<AccountRequestCreateFields>
                  control={control}
                  name={'belongNm'}
                  label={'소속'}
                  placeholder={t(Placeholder.Input) || ''}
                  required={true}
                />
              </PopupSearchType>
              <PopupSearchType className={'type_2'}>
                <FormInput<AccountRequestCreateFields> control={control} name={'deptNm'} label={'부서'} placeholder={t(Placeholder.Input) || ''} />
                <FormInput<AccountRequestCreateFields> control={control} name={'positionNm'} label={'직책'} placeholder={t(Placeholder.Input) || ''} />
              </PopupSearchType>
              {authCd > 399 ? ( // 화주 이상만(관리자만) 보이게 처리
                <PopupSearchType className={'type_2'}>
                  <FormDropDown<AccountRequestCreateFields>
                    control={control}
                    title={'화주설정'}
                    name={'orgPartnerNm'}
                    options={initialPartnerList}
                    required={false}
                    onChange={(name, value) => {
                      // 선택된 label을 사용하여 partnerList에서 key 값을 찾기
                      const selectedOption: any = partnerList.find((opt: any) => {
                        return opt.label === value;
                      });
                      if (selectedOption) {
                        // orgPartnerId 업데이트
                        setValue('orgPartnerId', selectedOption.key);
                      } else {
                        setValue('orgPartnerId', 0);
                      }
                    }}
                  />
                  <FormDropDown<AccountRequestCreateFields>
                    control={control}
                    title={'연결창고'}
                    name={'workLogisId'}
                    options={logisData || []}
                    required={false}
                    onChange={(name, value) => {
                      const selectedOption = logisData?.find((opt: DropDownOption) => opt.label === value);
                      if (selectedOption && selectedOption.key) {
                        const parsedKey = parseInt(selectedOption.key.toString());
                        if (!isNaN(parsedKey)) {
                          console.log('Setting workLogisId to:', parsedKey);
                          setValue('workLogisId', parsedKey);
                        } else {
                          console.error('Invalid workLogisId:', selectedOption.key);
                        }
                      }
                    }}
                  />
                </PopupSearchType>
              ) : (
                ''
              )}
            </PopupSearchBox>
          </PopupContent>
          {isLoading && <Loading />}
        </PopupLayout>
      </form>
    </dl>
  );
};
