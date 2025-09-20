import React, { useRef, useState } from 'react';
import { Button } from '../../../Button';
import { PopupLayout } from '../../index';
import { PopupContent } from '../../PopupContent';
import { PopupFooter } from '../../PopupFooter';
import { toastError } from '../../../index';
import { useAuthStore } from '../../../../stores';
import { useMutation } from '@tanstack/react-query';
import styles from '../../../../styles/login.module.scss';
import { Utils } from '../../../../libs/utils';

export const FindPassPop = () => {
  const el = useRef<HTMLDivElement | null>(null);
  const [loginId, setLoginId] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [modalType, closeModal, onFindPassword] = useAuthStore((s) => [s.modalType, s.closeModal, s.onFindPassword]);
  const { mutate: onFindPasswordMutate, isLoading: onFindPasswordIsLoading } = useMutation(['auth/passwordInit'], onFindPassword, {
    onSuccess: (e) => {
      const { resultCode, resultMessage } = e.data;
      if (resultCode === 200) {
        alert('임시 패스워드를 발급하였습니다. 문자메시지를 확인하세요.' || '');
        location.href = '/login';
      } else {
        toastError(resultMessage);
      }
    },
  });

  // 서버 연결 아이디 패스워드 체크
  const findPass = async () => {
    if (!Utils.checkEmail(loginId)) {
      //      toastError('이메일형식이 올바르지 않습니다.' || '');
      //      return;
    }
    onFindPasswordMutate({ loginId, phoneNo });
  };

  return (
    <div ref={el}>
      {/** 비밀번호 찾기 모달 */}
      <PopupLayout
        isEscClose={true}
        open={modalType.type === 'FINDPASS' && modalType.active}
        title={'비밀번호 찾기'}
        width={600}
        onClose={() => {
          closeModal('FINDPASS');
        }}
        footer={
          <PopupFooter>
            <div className="btnArea">
              <button className="btn" title="닫기" onClick={() => closeModal('FINDPASS')}>
                닫기
              </button>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <div className={styles.login_sub_inp}>
            <div>
              <div className="formBox">
                <input
                  type={'text'}
                  id={'loginId'}
                  onChange={(e) => {
                    setLoginId(e.target.value);
                  }}
                  placeholder={'이메일로된 ID를 입력하세요' || ''}
                />
              </div>
              <div className={`${styles.formBox_group} ${styles.tel2}`}>
                <div className={`formBox ${styles.formBox}`}>
                  <input
                    type={'text'}
                    id={'phoneNo'}
                    onChange={(e) => {
                      setPhoneNo(e.target.value.replaceAll('-', ''));
                    }}
                    placeholder={'등록된 핸드폰 번호( - 나 띄어쓰기 없이)를 입력하세요'}
                  />
                </div>
              </div>
              <div className={styles.btnArea}>
                <button className="btn blueBtn" onClick={findPass} disabled={onFindPasswordIsLoading}>
                  {'임시 비밀번호 발송'}
                </button>
              </div>
              <div className={styles.txt}>{'비밀번호를 찾으실 아이디(이메일)와 휴대폰번호를 입력하시면 문자로 임시 비밀번호가 발송됩니다.'}</div>
            </div>
          </div>
        </PopupContent>
      </PopupLayout>
    </div>
  );
};
