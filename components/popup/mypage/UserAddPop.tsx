import React from 'react';
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
import { PopupSearchBox, PopupSearchType } from '../content';
import FormInput from '../../FormInput';
import { PopupContent } from '../PopupContent';

// 새 계정 생성 시 사용할 타입 정의
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

const UserAddPop = () => {
  const [modalType, openModal, closeModal] = useMypageStore((s) => [s.modalType, s.openModal, s.closeModal]);

  // 세션 정보 가져오기
  const session = useSession();
  const authCd = parseInt(session.data?.user.authCd || '');
  const userPartnerId = session.data?.user.partnerId;

  /** useAccountStore */
  const [insertUser] = useAccountStore((s) => [s.insertUser]);

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
    defaultValues: {},
    mode: 'onSubmit',
  });

  // 계정 추가 뮤테이션
  const queryClient = useQueryClient();
  const addAccountMutation = useMutation(insertUser, {
    onSuccess: async (data) => {
      if (data.data.resultCode === 200) {
        toastSuccess('계정이 추가되었습니다.');
        // 폼 초기화
        closeModal('USER_ADD');
        await queryClient.invalidateQueries(['/user/paging']);
      } else {
        toastError(data.data.resultMessage);
      }
    },
    onError: (error) => {
      toastError('계정 추가에 실패했습니다: ' + (error as Error).message);
    },
  });

  /** 계정 insert */
  const onSubmit = (data: any) => {
    if (authCd <= 399) {
      data.partnerId = userPartnerId;
    }
    addAccountMutation.mutate(data);
  };

  return (
    <PopupLayout
      title="직원 계정 추가"
      isEscClose={true}
      open={modalType.type == 'USER_ADD'}
      onClose={() => {
        closeModal('USER_ADD');
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

export default UserAddPop;
