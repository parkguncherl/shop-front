import { UserRequestCreateUseYn, UserRequestDelete, UserRequestPasswordInit, UserRequestUpdate, UserResponseSelectByLoginId } from '@/generated';
import { useAccountStore, useCommonStore } from '@/stores';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { PopupContent } from '@/components/popup/PopupContent';
import { PopupFooter } from '@/components/popup/PopupFooter';
import { toastError, toastSuccess } from '@/components/ToastMessage';
import { DefaultOptions, Placeholder } from '@/libs/const';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '@/libs';
import FormInput from '@/components/form/FormInput';
import FormDropDown from '@/components/form/FormDropDown';
import Loading from '@/components/Loading';
import { PopupLayout } from '@/components/popup/PopupLayout';
import PopupFormBox from '@/components/popup/content/PopupFormBox';
import PopupFormType from '@/components/popup/content/PopupFormType';
import PopupFormGroup from '@/components/popup/content/PopupFormGroup';

interface AccountModPopProps {
  open: boolean;
  onClose: () => void;
  data: UserResponseSelectByLoginId;
}

/** 시스템 - 계정관리 - 수정 팝업 */
export const AccountModPop = ({ data, open, onClose }: AccountModPopProps) => {
  //const session = useSession();
  //const authCd = parseInt(session.data?.user.authCd || '');
  //const defaultOption = { value: '0', label: '전체' };
  //const [partnerOption, setPartnerOption] = useState<any>([defaultOption]);

  const el = useRef<HTMLDListElement | null>(null);
  const {
    watch,
    // getValues,
    // setValue,
    handleSubmit,
    control,
    reset,
    // formState: { errors, isValid },
    // clearErrors,
  } = useForm<UserRequestUpdate>({
    resolver: yupResolver(YupSchema.AccountRequestForUpdate()), // 완료
    defaultValues: {
      id: data.id,
      loginId: data.loginId,
      userNm: data.userNm,
      phoneNo: data?.phoneNo,
      authCd: data.authCd,
      useYn: data.useYn,
      belongNm: data.belongNm,
      deptNm: data.deptNm || '',
      positionNm: data.positionNm || '',
    },
    mode: 'onSubmit',
  });

  /** 계정관리 스토어 - State */
  //const modalType = useAccountStore((s) => s.modalType);
const closeModal = useAccountStore((s) => s.closeModal);
const selectedUser = useAccountStore((s) => s.selectedUser);

  /** 계정관리 양식 관리 스토어 - API */
  const updateUser = useAccountStore((s) => s.updateUser);
  const deleteUser = useAccountStore((s) => s.deleteUser);
  const sendMailUser = useAccountStore((s) => s.sendMailUser);
  const updatePasswordInit = useAccountStore((s) => s.updatePasswordInit);

  /** 공통 스토어 - State */
  const menuUpdYn = useCommonStore((s) => s.menuUpdYn);
  const menuExcelYn = useCommonStore((s) => s.menuExcelYn);

  const [confirmModal, setConfirmModal] = useState(false);
  // const [userAuthCd, setUserAuthCd] = useState<number>(data.authCd ? Number(data.authCd) : 0);
  // const [partnerList, setPartnerList] = useState([]);

  const queryClient = useQueryClient();

  /** 계정 수정 */
  const { mutate: updateUserMutate, isPending: updateIsLoading } = useMutation({
    mutationFn: updateUser,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries({ queryKey: ['/user/paging'] });
          //closeModal('MOD');
          onClose();
          // if (getCookie('gguangggLocalStoriageId') == data.loginId) {
          //   window.location.reload();
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

  /** 계정 삭제 */
  const { mutate: deleteUserMutate, isPending: deleteIsLoading } = useMutation({
    mutationFn: deleteUser,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          await queryClient.invalidateQueries({ queryKey: ['/user/paging'] }); // 즐겨찾기 영역 cached fetch 무효화
          //closeModal('MOD');
          onClose();

          // sendMailUserMutate({
          //   loginId: data.loginId,
          //   mailType: UserRequestEmailMailType.DelId,
          // } as UserRequestEmail);
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

  /** 계정 비밀번호 초기화 */
  const { mutate: updatePasswordInitMutate, isPending: updatePasswordInitIsLoading } = useMutation({
    mutationFn: updatePasswordInit,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('비밀번호가 초기화되었습니다.');
          await queryClient.invalidateQueries({ queryKey: ['/user/paging'] });
          //closeModal('MOD');
          onClose();
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 계정관리 수정, 비밀번호초기화 버튼 클릭 시 */
  const updatePasswordFn = () => {
    updatePasswordInitMutate({
      id: watch('id'),
      loginId: watch('loginId'),
      phoneNo: watch('phoneNo'),
    } as UserRequestPasswordInit);
  };

  /** 삭제 버튼 클릭 시 */
  const deleteAccountFn = () => {
    deleteUserMutate({ id: watch('id'), loginId: watch('loginId') } as UserRequestDelete);
  };

  /** 저장 버튼 클릭 시 */
  const onValid: SubmitHandler<UserRequestUpdate> = (data) => {
    console.log('Form submitted with data:', data);
    updateUserMutate(data);
  };

  // 기본값 설정
  // const initialPartnerList = [
  //   { key: 0, label: '선택', value: '선택' }, // 기본값 추가
  //   ...partnerList, // 실제 파트너 리스트
  // ];

  // 세션

  /** 전달되는 data 인자에 따른 rhf 동기화 */
  const temaOptions = [
    { key: 'white', value: 'white', label: 'White' },
    { key: 'dark', value: 'dark', label: 'Dark' },
  ];

  useEffect(() => {
    reset({
      id: data.id,
      loginId: data.loginId,
      userNm: data.userNm,
      phoneNo: data?.phoneNo,
      authCd: data.authCd,
      useYn: data.useYn,
      belongNm: data.belongNm,
      deptNm: data.deptNm || '',
      positionNm: data.positionNm || '',
      tema: data.tema || 'white',
    });
  }, [data]);

  return (
    <dl ref={el}>
      <form>
        <PopupLayout
          width={820}
          isEscClose={false}
          open={open}
          title={menuUpdYn ? '계정 수정' : '계정 조회'}
          //onClose={() => closeModal('MOD')}
          onClose={onClose}
          footer={
            menuUpdYn && (
              <PopupFooter>
                <div className={'btnArea between'}>
                  <div className="left">
                    <button className={'btn'} onClick={updatePasswordFn}>
                      비밀번호 초기화
                    </button>
                  </div>
                  <div className="right">
                    <button className={'btn'} onClick={(e) => setConfirmModal(true)} disabled={deleteIsLoading}>
                      삭제
                    </button>
                    <button className={'btn btn_primary'} onClick={handleSubmit(onValid)}>
                      저장
                    </button>
                    <button
                      className={'btn '}
                      //onClick={() => closeModal('MOD')}
                      onClick={onClose}
                    >
                      닫기
                    </button>
                  </div>
                  <DeleteConfirmModal open={confirmModal} onConfirm={deleteAccountFn} onClose={() => setConfirmModal(false)} />
                </div>
              </PopupFooter>
            )
          }
        >
          <PopupContent>
            <PopupFormBox>
              <PopupFormGroup>
                <PopupFormType className={'type1'}>
                  <FormInput label={'ID(e-mail)'} name={'loginId'} control={control} disable={true} />
                  <FormInput<UserRequestUpdate>
                    control={control}
                    name={'userNm'}
                    label={'이름'}
                    placeholder={Placeholder.Input || ''}
                    required={true}
                  />
                </PopupFormType>
                <PopupFormType className={'type1'}>
                  <FormInput<UserRequestUpdate>
                    control={control}
                    name={'phoneNo'}
                    label={'휴대전화 번호'}
                    placeholder={Placeholder.PhoneNo || ''}
                    required={true}
                  />
                </PopupFormType>
                <PopupFormType className={'type2'}>
                  <FormDropDown<UserRequestUpdate>
                    control={control}
                    title={'권한'}
                    name={'authCd'}
                    defaultOptions={[...DefaultOptions.Select]}
                    codeUpper={'10020'}
                    required={true}
                    // onChange={(name, value) => {
                    //   setUserAuthCd(value ? Number(value) : 0);
                    // }}
                  />
                  <FormDropDown<UserRequestUpdate> control={control} title={'상태'} name={'useYn'} codeUpper={'10030'} required={true} />
                </PopupFormType>
                <PopupFormType className={'type2'}>
                  <FormInput<UserRequestUpdate>
                    control={control}
                    name={'belongNm'}
                    label={'소속'}
                    placeholder={Placeholder.Input || ''}
                    required={true}
                  />
                  <FormInput<UserRequestUpdate> control={control} name={'deptNm'} label={'부서'} placeholder={Placeholder.Input || ''} />
                </PopupFormType>
                <PopupFormType className={'type2'}>
                  <FormInput<UserRequestUpdate> control={control} name={'positionNm'} label={'직책'} placeholder={Placeholder.Input || ''} />
                  <FormDropDown<UserRequestUpdate> control={control} title={'테마'} name={'tema'} options={temaOptions} required={false} />
                </PopupFormType>
                <PopupFormType className={'type2'}>
                  <dl>
                    <dt>등록자</dt>
                    <dd>{data?.creUserNm ? data?.creUserNm : 'system'}</dd>
                  </dl>
                  <dl>
                    <dt>등록시간</dt>
                    <dd>{data?.creTm}</dd>
                  </dl>
                </PopupFormType>
                <PopupFormType className={'type2'}>
                  <dl>
                    <dt>수정자</dt>
                    <dd>{data?.updUserNm ? data?.updUserNm : 'system'}</dd>
                  </dl>
                  <dl>
                    <dt>수정시간</dt>
                    <dd>{data?.updTm}</dd>
                  </dl>
                </PopupFormType>
              </PopupFormGroup>
            </PopupFormBox>
          </PopupContent>
          {(updateIsLoading || deleteIsLoading || updatePasswordInitIsLoading) && <Loading />}
        </PopupLayout>
      </form>
    </dl>
  );
};
