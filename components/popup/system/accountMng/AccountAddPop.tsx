import { useAccountStore } from '@/stores';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { PopupContent } from '@/components/popup/PopupContent';
import { PopupFooter } from '@/components/popup/PopupFooter';
import { toastError, toastSuccess } from '@/components/ToastMessage';
import { UserRequestCreate, UserRequestCreateUseYn } from '@/generated';
import { DefaultOptions, Placeholder } from '@/libs/const';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '@/libs';
import FormInput from '@/components/form/FormInput';
import FormDropDown from '@/components/form/FormDropDown';
import Loading from '@/components/Loading';
import { PopupLayout } from '@/components/popup/PopupLayout';
import { useSession } from 'next-auth/react';
import PopupFormGroup from '@/components/popup/content/PopupFormGroup';
import PopupFormBox from '@/components/popup/content/PopupFormBox';
import PopupFormType from '@/components/popup/content/PopupFormType';

interface AccountAddPopProps {
  open: boolean;
  onClose: () => void;
}

/** 시스템 - 계정관리 - 신규 팝업 */
export const AccountAddPop = ({ open, onClose }: AccountAddPopProps) => {
  const session = useSession();
  const el = useRef<HTMLDListElement | null>(null);

  const {
    //watch,
    handleSubmit,
    //getValues,
    setValue,
    control,
    //formState: { errors, isValid },
    //clearErrors,
  } = useForm<UserRequestCreate>({
    resolver: yupResolver<UserRequestCreate>(YupSchema.AccountRequest()), // 완료
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
  //const modalType = useAccountStore((s) => s.modalType);
const closeModal = useAccountStore((s) => s.closeModal);

  /** 계정관리 양식 관리 스토어 - API */
  const insertUser = useAccountStore((s) => s.insertUser);
  const sendMailUser = useAccountStore((s) => s.sendMailUser);
  const queryClient = useQueryClient();

  const [partnerList, setPartnerList] = useState([]);

  /** 화주리스트 조회하기 */
  const { data: partner, isSuccess: isListSuccess } = useQuery({
    queryKey: [`/partner/list`],
    queryFn: () => authApi.get(`/partner/list`, {}),
  });
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
  const { mutate: insertUserMutate, isPending } = useMutation({
    mutationFn: insertUser,
    onSuccess: async (e) => {
      try {
        const { resultCode, body, resultMessage } = e.data;
        if (resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries({
            queryKey: ['/user/paging'],
          });
          //closeModal('ADD');
          onClose();

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
      setValue('partnerId', 0);
    }
    if (authCd <= 399) {
      setValue('partnerId', 0);
    }
  }, []);

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
          //open={modalType.type === 'ADD' && modalType.active}
          open={open}
          title={'신규 계정 생성'}
          //onClose={() => closeModal('ADD')}
          onClose={onClose}
          footer={
            <PopupFooter>
              <div className={'btnArea between'}>
                <div className="left"></div>
                <div className="right">
                  <button className={'btn btn_primary'} onClick={handleSubmit(onValid)}>
                    저장
                  </button>
                  <button className={'btn '} onClick={onClose}>
                    닫기
                  </button>
                </div>
              </div>
            </PopupFooter>
          }
        >
          <PopupContent>
            <PopupFormBox>
              <PopupFormGroup>
                <PopupFormType className={'type2'}>
                  <FormInput<UserRequestCreate>
                    control={control}
                    name={'loginId'}
                    label={'ID(e-mail)'}
                    placeholder={Placeholder.Input}
                    required={true}
                  />
                  <FormInput<UserRequestCreate> control={control} name={'userNm'} label={'이름'} placeholder={Placeholder.Input} required={true} />
                </PopupFormType>
                <PopupFormType className={'type2'}>
                  <FormInput<UserRequestCreate>
                    control={control}
                    onChange={(e) => {
                      // e.target.value = e.target.value.replace(/[^0-9]/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`);
                      // setValue('phoneNo', e.target.value.replace(/[^0-9]/g, '')); // 문자열에서 숫자만을 추출(하이픈 제외)하여 요청시 보낼 데이터로 설정, 유효성 검증 통과
                    }}
                    name={'phoneNo'}
                    label={'전화번호'}
                    placeholder={Placeholder.PhoneNo}
                    required={true}
                  />
                  <FormDropDown<UserRequestCreate>
                    control={control}
                    title={'권한'}
                    name={'authCd'}
                    defaultOptions={[...DefaultOptions.Select]}
                    codeUpper={'10020'}
                    required={true}
                  />
                </PopupFormType>
                <PopupFormType className={'type2'}>
                  <FormDropDown<UserRequestCreate> control={control} title={'상태'} name={'useYn'} codeUpper={'10280'} required={true} />
                  <FormInput<UserRequestCreate> control={control} name={'belongNm'} label={'소속'} placeholder={Placeholder.Input} required={true} />
                </PopupFormType>
                <PopupFormType className={'type2'}>
                  <FormInput<UserRequestCreate> control={control} name={'deptNm'} label={'부서'} placeholder={Placeholder.Input} />
                  <FormInput<UserRequestCreate> control={control} name={'positionNm'} label={'직책'} placeholder={Placeholder.Input} />
                </PopupFormType>
                <PopupFormType className={'type1'}>
                  <FormDropDown<UserRequestCreate>
                    control={control}
                    title={'테마'}
                    name={'tema'}
                    options={[
                      { key: 'white', value: 'white', label: 'White' },
                      { key: 'dark', value: 'dark', label: 'Dark' },
                    ]}
                    required={false}
                  />
                </PopupFormType>
              </PopupFormGroup>
            </PopupFormBox>
          </PopupContent>
          {isPending && <Loading />}
        </PopupLayout>
      </form>
    </dl>
  );
};
