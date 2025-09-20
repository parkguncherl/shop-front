import React, { useRef, useState } from 'react';
import { Button } from '../../../Button';
import { PopupContent, PopupFooter, PopupLayout } from '../../index';
import { toastError } from '../../../index';
import { useAuthStore } from '../../../../stores';
import { useMutation } from '@tanstack/react-query';
import styles from '../../../../styles/delete/popup.module.scss';

interface Props {
  loginId: string;
  country: string;
  changeType: string;
  callback?: () => void;
}

export const FirstPassChangePop = ({ loginId, changeType }: Props) => {
  const [setChangePassword] = useAuthStore((s) => [s.setChangePassword]);
  const [setStayPassword] = useAuthStore((s) => [s.setStayPassword]);
  const el = useRef<HTMLDListElement | null>(null);
  const [rePassword, setRePassword] = useState('');
  const [modPassword, setModPassword] = useState('');
  const [reModpassword, setReModPassword] = useState('');
  const [modalType, closeModal] = useAuthStore((s) => [s.modalType, s.closeModal]);
  const [isRePasswordVisible, setIsRePasswordVisible] = useState(true);
  const [isModPasswordVisible, setIsModPasswordVisible] = useState(true);
  const [isReModPasswordVisible, setIsReModPasswordVisible] = useState(true);

  const { mutate: changePasswordMutate, isLoading: changePasswordIsLoading } = useMutation(['auth/updatePassword'], setChangePassword, {
    onSuccess: (e) => {
      const { resultCode, resultMessage } = e.data;
      if (resultCode === 200) {
        alert('변경하였습니다. 다시 로그인하세요');
        location.href = '/login';
      } else {
        toastError(resultMessage);
      }
    },
  });

  const { mutate: stayPasswordMutate, isLoading: stayPasswordIsLoading } = useMutation(['auth/stayPassword'], setStayPassword, {
    onSuccess: (e) => {
      const { resultCode, resultMessage } = e.data;
      if (resultCode === 200) {
        alert('6개월(180일) 연장되었습니다. 다시 로그인하세요');
        location.href = '/login';
      } else {
        toastError(resultMessage);
      }
    },
  });

  // 서버 연결 아이디 패스워드 체크
  const changePass = async () => {
    changePasswordMutate({ loginId, rePassword, modPassword, reModpassword, changeType });
  };

  const stayPassword = async () => {
    if (changeType === 'F') {
      closeModal('FIRST');
    } else {
      stayPasswordMutate({ loginId });
    }
  };

  return (
    <dl ref={el}>
      {/** 비밀번호 수정 모달 */}

      <PopupLayout
        width={630}
        isEscClose={true}
        title={'비밀번호 변경'}
        open={modalType.type === 'FIRST' && modalType.active}
        onClose={() => {
          closeModal('FIRST');
        }}
        footer={
          <PopupFooter>
            <div className={'btnArea'}>
              <button className={'btn pop_close'} onClick={stayPassword} disabled={changePasswordIsLoading}>
                {changeType === 'F' ? '취소' : '6개월후변경'}
              </button>
              <button className={'btn btnBlue'} onClick={changePass} disabled={changePasswordIsLoading}>
                변경
              </button>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <p className={styles.etcTxt}>
            {changeType === 'F' ? (
              <span>최초 로그인 시에는 비밀번호 변경이 필요합니다.</span>
            ) : (
              <span>
                6개월(180일) 이상 동일한 비밀번호를 사용하고 계십니다. <br />
                개인 정보보호를 위해 비밀번호를 주기적으로 변경해 주세요.
              </span>
            )}
          </p>
          <div className={styles.pop_search_box}>
            <div className={styles.type_1}>
              <dl>
                <dt>
                  <label htmlFor={'inp_01'}>{'현재 비밀번호'}</label>
                </dt>
                <dd>
                  <div className={`${styles.login_form_box} ${styles.inp_pw}`}>
                    <input
                      type={isRePasswordVisible ? 'password' : 'text'}
                      id={'rePassword'}
                      onChange={(e) => {
                        setRePassword(e.target.value);
                      }}
                      placeholder={'현재 비밀번호를 입력해 주세요.'}
                    />
                    <button
                      type={'button'}
                      className={`${styles.ico_eye} ${!isRePasswordVisible ? styles.on : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setIsRePasswordVisible(!isRePasswordVisible);
                      }}
                    />
                  </div>
                </dd>
              </dl>
            </div>
            <div className={styles.type_1}>
              <dl>
                <dt>
                  <label htmlFor={'inp_02'}>{'새 비밀번호'}</label>
                </dt>
                <dd>
                  <div className={`${styles.login_form_box} ${styles.inp_pw}`}>
                    <input
                      type={isModPasswordVisible ? 'password' : 'text'}
                      id={'modPassword'}
                      onChange={(e) => {
                        setModPassword(e.target.value);
                      }}
                      placeholder={'새 비밀번호를 입력해 주세요.'}
                    />
                    <button
                      type={'button'}
                      className={`${styles.ico_eye} ${!isModPasswordVisible ? styles.on : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setIsModPasswordVisible(!isModPasswordVisible);
                      }}
                    />
                  </div>
                </dd>
              </dl>
            </div>
            <div className={styles.type_1}>
              <dl>
                <dt>
                  <label htmlFor={'inp_03'}>{'비밀번호 확인'}</label>
                </dt>
                <dd>
                  <div className={`${styles.login_form_box} ${styles.inp_pw}`}>
                    <input
                      type={isReModPasswordVisible ? 'password' : 'text'}
                      id={'reModPassword'}
                      onChange={(e) => {
                        setReModPassword(e.target.value);
                      }}
                      placeholder={'새 비밀번호 확인값을 입력해 주세요.'}
                    />
                    <button
                      type={'button'}
                      className={`${styles.ico_eye} ${!isReModPasswordVisible ? styles.on : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setIsReModPasswordVisible(!isReModPasswordVisible);
                      }}
                    />
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </PopupContent>
      </PopupLayout>
    </dl>
  );
};
