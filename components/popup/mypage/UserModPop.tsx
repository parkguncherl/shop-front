import React, { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../ToastMessage';
import { useAccountStore, useMypageStore } from '../../../stores';
import { YupSchema } from '../../../libs';
import FormDropDown from '../../../components/FormDropDown';
import { DefaultOptions, Placeholder } from '../../../libs/const';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { PopupLayout } from '../PopupLayout';
import { PopupFooter } from '../PopupFooter';
import { yupResolver } from '@hookform/resolvers/yup';
import { PopupContent } from '../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../content';
import FormInput from '../../FormInput';

type UserRequestCreateFields = {
  id: number;
  loginId: string;
  userNm: string;
  phoneNo: string;
  authCd: string;
  belongNm: string;
  deptNm: string;
  positionNm: string;
  partnerId: number;
  useYn: string;
};
const UserModPop = () => {
  /** useMypageStore */
  const [modalType, openModal, closeModal, selectedUser] = useMypageStore((s) => [s.modalType, s.openModal, s.closeModal, s.selectedUser]);
  /** useAccountStore 의 경우 oms(화주), wms 영역에서 모두 사용됨 */
  const [updateUser] = useAccountStore((s) => [s.updateUser]);

  /** useForm */
  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<UserRequestCreateFields>({
    resolver: yupResolver(YupSchema.AccountRequest()), // 완료
    defaultValues: {
      loginId: '',
      userNm: '',
      phoneNo: '',
      authCd: '',
      belongNm: '',
      deptNm: '',
      positionNm: '',
      partnerId: 0, // authCd <= 399 조건 충족할 시 요청 과정에서 세션으로부터 추출한 partnerId 사용됨
    },
    mode: 'onSubmit',
  });

  // 세션 정보 가져오기
  const session = useSession();
  const userPartnerId = session.data?.user.partnerId;

  useEffect(() => {
    reset({
      id: selectedUser.id,
      loginId: selectedUser.loginId,
      userNm: selectedUser.userNm,
      phoneNo: selectedUser.phoneNo,
      belongNm: selectedUser.belongNm,
      deptNm: selectedUser.deptNm,
      positionNm: selectedUser.positionNm,
      authCd: selectedUser.authCd,
      useYn: selectedUser.useYn,
    });
  }, [selectedUser]);

  // 계정 수정 뮤테이션
  const queryClient = useQueryClient();
  const modAccountMutation = useMutation(updateUser, {
    onSuccess: async (data) => {
      if (data.data.resultCode === 200) {
        toastSuccess('계정이 수정되었습니다.');
        // 폼 초기화
        closeModal('USER_ADD');
        await queryClient.invalidateQueries(['/user/paging']);
      } else {
        toastError(data.data.resultMessage);
      }
    },
    onError: (error) => {
      toastError('계정 수정에 실패했습니다: ' + (error as Error).message);
    },
  });

  // 계정 수정 제출 핸들러
  const onSubmit = (data: any) => {
    data.partnerId = userPartnerId;
    modAccountMutation.mutate(data);
  };

  return (
    <PopupLayout
      title="직원 계정 수정"
      isEscClose={true}
      open={modalType.type == 'USER_MOD'}
      onClose={() => {
        closeModal('USER_MOD');
      }}
      width={820}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" title="저장" onClick={handleSubmit(onSubmit)}>
              저장
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('USER_ADD')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          <PopupSearchType className={'type_2'}>
            <FormInput<UserRequestCreateFields>
              control={control}
              name={'loginId'}
              label={'ID (이메일)'}
              placeholder={Placeholder.Input || ''}
              required={true}
            />
            <FormInput<UserRequestCreateFields> control={control} name={'userNm'} label={'이름'} placeholder={Placeholder.Input || ''} required={true} />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<UserRequestCreateFields> control={control} name={'phoneNo'} label={'전화번호'} placeholder={Placeholder.Input || ''} required={false} />
            <FormInput<UserRequestCreateFields> control={control} name={'belongNm'} label={'소속'} placeholder={Placeholder.Input || ''} required={false} />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<UserRequestCreateFields> control={control} name={'deptNm'} label={'부서'} placeholder={Placeholder.Input || ''} required={false} />
            <FormInput<UserRequestCreateFields> control={control} name={'positionNm'} label={'직책'} placeholder={Placeholder.Input || ''} required={false} />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormDropDown<UserRequestCreateFields>
              control={control}
              title={'권한'}
              name={'authCd'}
              defaultOptions={[...DefaultOptions.Select]}
              codeUpper={'10020'}
              required={true}
            />
            <FormDropDown<UserRequestCreateFields>
              control={control}
              title={'상태'}
              name={'useYn'}
              defaultOptions={[...DefaultOptions.Select]}
              codeUpper={'10280'}
              required={true}
            />
          </PopupSearchType>
        </PopupSearchBox>
      </PopupContent>
    </PopupLayout>
  );
};

export default UserModPop;
