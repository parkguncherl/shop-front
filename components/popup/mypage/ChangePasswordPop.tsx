import React, { useRef, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../libs';
import { useMutation } from '@tanstack/react-query';
import useAppStore from '../../../stores/useAppStore';
import { toastError, toastSuccess } from '../../ToastMessage';
import { PopupLayout } from '../PopupLayout';
import { useAuthStore } from '../../../stores';
import { signOut } from 'next-auth/react';
import TunedButtonAtom, { TunedButtonAtomRefInterface } from '../../atom/TunedButtonAtom';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface MypageChangePasswordFields {
  loginId?: string;
  rePassword: string;
  modPassword: string;
  reModpassword: string;
}

function ChangePasswordPop({ open = false, onClose }: Props) {
  const { session } = useAppStore();

  const chgBtnRef = useRef<TunedButtonAtomRefInterface>(null);

  const [setChangePassword, logout] = useAuthStore((s) => [s.setChangePassword, s.logout]);

  const form = useForm<MypageChangePasswordFields>({
    resolver: yupResolver(YupSchema.MypageChangePasswordRequest()), // 완료
    defaultValues: { rePassword: '', modPassword: '', reModpassword: '' },
    mode: 'onChange',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showPassword3, setShowPassword3] = useState(false);

  const onValid = (data: any) => {
    if (validatePassword()) {
      const loginRequest: MypageChangePasswordFields = {
        loginId: session?.user.loginId,
        rePassword: data.rePassword,
        modPassword: data.modPassword,
        reModpassword: data.reModpassword,
      };
      changePasswordMutate(loginRequest);
    }
  };

  // 패스워드 변경
  const { mutate: changePasswordMutate, isLoading: changePasswordIsLoading } = useMutation(['auth/updatePassword'], setChangePassword, {
    onSuccess: async (e) => {
      const { resultCode, resultMessage } = e.data;
      if (resultCode === 200) {
        toastSuccess('변경되었습니다. 다시 로그인하세요');
        await logout(session?.user?.loginId ? session?.user?.loginId : '');
        await signOut({ redirect: true, callbackUrl: '/login' });
      } else {
        toastError(resultMessage);
        chgBtnRef.current?.enableClickBehavior();
      }
    },
  });

  // 패스워드 검증
  const validatePassword = () => {
    const pass = form.getValues('modPassword');
    const pass2 = form.getValues('reModpassword');
    if (pass !== pass2) {
      form.setError('modPassword', { type: 'onChange', message: '변경 비밀번호가 일치하지 않습니다.' || '' });
      form.setError('reModpassword', { type: 'onChange', message: '변경 비밀번호가 일치하지 않습니다.' || '' });
      return false;
    } else if (pass === pass2) {
      return true;
    }
    return false;
  };

  const onEnter = (e: any) => {
    if (e.key === 'Enter') {
      form.handleSubmit(onValid)();
    }
  };

  return (
    <PopupLayout
      width={600}
      open={open}
      isEscClose={true}
      title={'비밀번호 변경'}
      onClose={onClose}
      footer={
        <PopupFooter>
          {/*<div className={'btnBox'} onClick={form.handleSubmit(onValid)}>
            <Button className={'btn btnBlue'}>{'변경'}</Button>
          </div>*/}
          <div className="right">
            <TunedButtonAtom onClick={form.handleSubmit(onValid)} ref={chgBtnRef} clickPreventTime={-1} className={'btn btnBlue'}>
              변경
            </TunedButtonAtom>
            <button className={'btn'} onClick={onClose}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <form>
        <div className="tblBox">
          <table>
            <caption>비밀번호 변경 테이블</caption>
            <colgroup>
              <col width={'30%'} />
              <col width={'70%'} />
            </colgroup>
            <tbody>
              <tr>
                <th scope={'row'}>
                  <label>현재 비밀번호</label>
                  <span className="req">*</span>
                </th>
                <td>
                  <div className="formBox pwdBox">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...form.register('rePassword')}
                      maxLength={24}
                      name={'rePassword'}
                      onKeyDown={(e) => {
                        onEnter(e);
                      }}
                    />
                    <button
                      type={'button'}
                      className={`ico_eye ${showPassword ? 'on' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPassword(!showPassword);
                      }}
                    />
                  </div>
                  {form.formState.errors.rePassword && (
                    <span className={'error_txt'} style={{ margin: '5px 0' }}>
                      {form.getFieldState('rePassword').error?.message}
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <th scope={'row'}>
                  <label>변경 비밀번호</label>
                  <span className="req">*</span>
                </th>
                <td>
                  <div className="formBox pwdBox">
                    <input
                      type={showPassword2 ? 'text' : 'password'}
                      {...form.register('modPassword')}
                      maxLength={24}
                      name={'modPassword'}
                      onKeyDown={(e) => {
                        onEnter(e);
                      }}
                    />
                    <button
                      type={'button'}
                      className={`ico_eye ${showPassword2 ? 'on' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPassword2(!showPassword2);
                      }}
                    />
                  </div>
                  {form.formState.errors.modPassword && (
                    <span className={'error_txt'} style={{ margin: '5px 0' }}>
                      {form.getFieldState('modPassword').error?.message}
                    </span>
                  )}
                  <div className="tblTxt">※ 대문자, 소문자, 특수문자 조합 8자 이상</div>
                </td>
              </tr>
              <tr>
                <th scope={'row'}>
                  <label>변경 비밀번호 확인</label>
                  <span className="req">*</span>
                </th>
                <td>
                  <div className="formBox pwdBox">
                    <input
                      type={showPassword3 ? 'text' : 'password'}
                      {...form.register('reModpassword')}
                      maxLength={24}
                      name={'reModpassword'}
                      onKeyDown={(e) => {
                        onEnter(e);
                      }}
                    />
                    <button
                      type={'button'}
                      className={`ico_eye ${showPassword3 ? 'on' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPassword3(!showPassword3);
                      }}
                    />
                  </div>
                  {form.formState.errors.reModpassword && (
                    <span className={'error_txt'} style={{ margin: '5px 0' }}>
                      {form.getFieldState('reModpassword').error?.message}
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </form>
    </PopupLayout>
  );
}

export default React.memo(ChangePasswordPop);
