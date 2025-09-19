import React, { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores';
import { signIn, useSession } from 'next-auth/react';
import { toastError, toastSuccess } from '../components';
import styles from '../styles/login.module.scss';
import { useRouter } from 'next/router';
import { FindPassPop, FirstPassChangePop } from '../components/popup/system/login';
import FormInput from '../components/FormInput';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, Timer, YupSchema } from '../libs';
import { ApiResponseListSelectFavorites, LoginRequest, LoginResponse, SelectFavorites } from '../generated';
import { SubmitErrorHandler } from 'react-hook-form/dist/types/form';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';
import { CheckBox } from '../components/CheckBox';
import { LOCAL_STORAGE_GUBUN, LOCAL_STORAGE_HISTORY, LOCAL_STORAGE_WMS_HISTORY, Otp } from '../libs/const';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';
import { UAParser } from 'ua-parser-js';

export interface LoginVerificationFields {
  loginId: string;
  password: string;
  isMobileLogin: string;
  otpNo?: string;
  countryCode?: string;
}

const Login = () => {
  const [onVerification, modalType, onSendOtp, openModal] = useAuthStore((s) => [s.onVerification, s.modalType, s.onSendOtp, s.openModal, s.closeModal]);
  const session = useSession();
  const [otpNo, setOtpNo] = useState<string>('000000');
  const [changeType, setChangeType] = useState('F');
  const [validAccount, setVerification] = useState<boolean>(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [isWatingOtp, setIsWatingOtp] = useState(false);
  const [isLoginPassVisible, setIsLoginPassVisible] = useState(true);
  const [isLoginComplete, setIsLoginComplete] = useState(false);
  const [checkedSaveId, setCheckedSaveId] = useState(!!getCookie('smartLoginId'));
  const [time, setTime] = useState(Otp.duration);
  const router = useRouter();

  // 모바일 체크
  const [isMobileLogin, setIsMobileLogin] = useState<string>('N');
  const [deviceInfo, setDeviceInfo] = useState<{
    deviceType: string;
    os: string;
    browser: string;
  } | null>(null);

  useEffect(() => {
    const parser = new UAParser();
    const result = parser.getResult();

    setDeviceInfo({
      deviceType: result.device.type || 'desktop',
      os: result.os.name || 'Unknown',
      browser: result.browser.name || 'Unknown',
    });
  }, []);

  useEffect(() => {
    if (deviceInfo && deviceInfo.deviceType === 'desktop') {
      setIsMobileLogin('N');
    } else {
      setIsMobileLogin('Y');
    }
  }, [deviceInfo]);

  const defaultValues: LoginVerificationFields = {
    loginId: (getCookie('smartLoginId') as string) || '',
    password: '1230',
    isMobileLogin: isMobileLogin,
  };

  /*
  console.log('login session ===>', session);
  if (session && session.status == 'authenticated') {
    location.
  }
*/

  const {
    handleSubmit,
    control,
    getValues,
    formState: { errors, isValid },
  } = useForm<LoginVerificationFields>({
    resolver: yupResolver(YupSchema.LoginVerificationRequest(defaultValues)), // 완료
    defaultValues,
    mode: 'onSubmit',
  });

  const { mutate: verificationMutate, isLoading: verificationIsLoading } = useMutation(['auth/verification'], onVerification, {
    onSuccess: async (e) => {
      const { resultCode, body, resultMessage } = e.data;
      if (resultCode === 200) {
        if ((body as LoginResponse)?.user?.firstLoginYn == 'Y') {
          setChangeType('F');
          openModal('FIRST');
        } else {
          await loginFinal(isMobileLogin);
        }
      } else if (resultCode === 919) {
        setVerification(false);
        setIsWatingOtp(false);
        toastError('OTP 실패 횟수를 초과하였습니다.\n다시 로그인 해주세요.');
      } else {
        toastError(resultMessage);
      }
    },
  });

  const { mutate: sendOtpNoMutate, isLoading: sendOtpNoIsLoading } = useMutation(['auth/makeOtpNo'], onSendOtp, {
    onSuccess: (e) => {
      const { resultCode, resultMessage } = e.data;
      if (resultCode === 200) {
        console.log('success opt send==');
      } else {
        toastError(resultMessage);
      }
    },
  });

  useEffect(() => {
    if (isWatingOtp) {
      const timer = new Timer(Otp.duration);
      timer.on('progress', (elapsed: number) => {
        setTime(Otp.duration - elapsed);
      });
      timer.on('finish', () => setIsWatingOtp(false));
      timer.start();
      return () => {
        timer.stop();
      };
    }
  }, [isWatingOtp]);

  // 세션이 생겼을때 즐겨찾기 목록 가져오기
  const { refetch: favRefetch } = useQuery([], () => authApi.get<ApiResponseListSelectFavorites>('/mypage/favorites', {}), {
    enabled: false, // 쿼리가 자동으로 실행되지 않도록 설정
  });

  useEffect(() => {
    if (session && session.status === 'authenticated') {
      const authGroupCd = session.data?.user?.authCd ? session.data?.user.authCd?.substring(0, 1) : '';
      const myLocalStorage = authGroupCd === '3' ? LOCAL_STORAGE_HISTORY : LOCAL_STORAGE_WMS_HISTORY;
      const mygubunSetting = {
        seller1: session.data.user.seller1 || '구분1',
        seller2: session.data.user.seller2 || '구분2',
        factory1: session.data.user.factory1 || '구분1',
        factory2: session.data.user.factory2 || '구분2',
        sku1: session.data.user.sku1 || '구분1',
        sku2: session.data.user.sku2 || '구분2',
      };
      // oms 사용자인경우만 만들어준다.
      if (authGroupCd === '3') {
        localStorage.setItem(LOCAL_STORAGE_GUBUN, JSON.stringify(mygubunSetting));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_GUBUN);
      }

      const reFetch = async () => {
        const { data: favorites } = await favRefetch(); // 데이터가 로드될 때까지 기다림
        const favHistoryList = favorites?.data?.body?.map((menu: SelectFavorites) => ({
          histMenuNm: menu.menuNm,
          histMenuUri: menu.menuUri,
          histParamList: [],
        }));
        const landingPage = authGroupCd === '3' ? (session.data.user.isMobileLogin === 'Y' ? '/mobile/asn/MobileAsn' : '/oms/orderInfo/today') : '/';
        if (favHistoryList && favHistoryList.length > 0) {
          localStorage.setItem(myLocalStorage, JSON.stringify(favHistoryList));
        }

        setTimeout(() => {
          router.push(landingPage, undefined, { shallow: true });
        }, 1000);
      };
      reFetch();
    }
  }, [isLoginComplete]);

  // otp 번호 재전송
  const handleOtp = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
    }
    const { loginId, password } = getValues();
    sendOtpNoMutate({ loginId, password });
    toastSuccess('OTP 번호를 발송하였습니다.');
    setIsWatingOtp(true);
  };

  const handleLogin = async () => {
    if (validAccount) {
      if (isWatingOtp) {
        const { loginId, password } = getValues();
        if (otpNo) {
          verificationMutate({ loginId, password, otpNo });
        } else {
          toastError('인증번호를 입력하세요.');
        }
      } else {
        toastError('인증시간이 초과하였습니다.\n인증번호 다시받기 버튼을 클릭하여 인증번호를 받으시기 바랍니다.');
      }
    }
  };

  // 비번찾기
  const findPassFn = () => {
    openModal('FINDPASS');
  };

  // 서버 연결 로그인
  const loginFinal = async (isMobileLogin: string) => {
    const { loginId, password } = getValues();
    const date = new Date();
    date.setDate(date.getDate() + 7); // 일

    // id 저장하기 버튼 체크
    if (checkedSaveId) {
      setCookie('smartLoginId', loginId, { expires: date });
    } else {
      deleteCookie('smartLoginId');
    }

    const result = await signIn('credentials', {
      loginId,
      password,
      otpNo,
      isMobileLogin,
      redirect: false,
    });

    if (result?.error) {
      return toastError(result.error);
    }

    if (result?.ok) {
      toast.dismiss();
      setIsLoginComplete(true);
    }
  };

  // 아이디, 비밀번호 정상 입력시
  const onValid: SubmitHandler<LoginRequest> = (data) => {
    const { loginId, password, isMobileLogin } = data;
    verificationMutate({ loginId, password, isMobileLogin });
  };

  // 아이디, 비밀번호 비정상 입력시
  const onInvalid: SubmitErrorHandler<LoginRequest> = (data) => {
    // console.log('===> onInvalid data : ', data);
  };

  /** 엔터키 이벤트 */
  const onKeyDownEnter = async (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // 1단계
      if (!validAccount) {
        await handleSubmit(onValid, onInvalid)();
      } else {
        // 2단계
        await handleLogin();
      }
    }
  };

  if (session?.data) {
    return <Loading />;
  } else {
    // 세션이 없을때만 로컬 스토리지를 삭제한다.
    localStorage.removeItem(LOCAL_STORAGE_HISTORY);
    localStorage.removeItem(LOCAL_STORAGE_WMS_HISTORY);
    return (
      <div className={styles.login_box_group}>
        <div className={styles.login_box}>
          <form>
            <div className={styles.content}>
              <div className={styles.logo}>
                <span className={styles.img}></span>
              </div>
              <div className={`${styles.login_inp} ${validAccount ? styles.id_pw_close : styles.id_pw_open}`}>
                <div className={styles.inp_id}>
                  <FormInput<LoginVerificationFields>
                    control={control}
                    name={'loginId'}
                    onKeyDown={(e) => {
                      setIsCapsLockOn(e.getModifierState('CapsLock'));
                      onKeyDownEnter(e as unknown as KeyboardEvent);
                    }}
                    inputType={'login'}
                  />
                </div>
                <div className={styles.inp_pw}>
                  <FormInput<LoginVerificationFields>
                    control={control}
                    name={'password'}
                    type={isLoginPassVisible ? 'password' : 'text'}
                    onKeyDown={(e) => {
                      setIsCapsLockOn(e.getModifierState('CapsLock'));
                      onKeyDownEnter(e as unknown as KeyboardEvent);
                    }}
                    inputType={'login'}
                  />
                  <button
                    type={'button'}
                    className={`${styles.ico_eye} ${!isLoginPassVisible ? styles.on : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsLoginPassVisible(!isLoginPassVisible);
                    }}
                  />
                </div>
                {isCapsLockOn && (
                  <div className={styles.inp_txt}>
                    <span>{`CapsLock이 켜져 있습니다!`}</span>
                  </div>
                )}
                <div className={styles.inp_certification}>
                  <div className={styles.result_box}>
                    <label htmlFor={'inp_certification'}>{'인증번호 입력'}</label>
                    <input
                      type={'text'}
                      id={'inp_certification'}
                      value={otpNo || ''}
                      onChange={(e) => {
                        setOtpNo(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        onKeyDownEnter(e as unknown as KeyboardEvent);
                      }}
                      placeholder={'인증번호를 입력하세요.'}
                    />
                  </div>
                  {!isWatingOtp && (
                    <button onClick={handleOtp}>
                      {'인증번호'}
                      <br />
                      {'다시받기'}
                    </button>
                  )}
                </div>
              </div>
              {isWatingOtp && (
                <div className={styles.inp_txt}>
                  <span>
                    {'입력까지 남은시간'}[{Math.round(time / 1000)} {'초]입니다.'}
                  </span>
                </div>
              )}
              <div className={`${styles.login_btn} login_btn`}>
                {!validAccount && (
                  <div className={`${styles.chk_box}`}>
                    <span style={{ minWidth: 120 }}>
                      <CheckBox
                        checked={checkedSaveId}
                        onChange={(e) => {
                          setCheckedSaveId(e.target.checked);
                        }}
                      >
                        {'아이디 저장하기'}
                      </CheckBox>
                    </span>
                  </div>
                )}
                <button className={styles.clickbtn} onClick={validAccount ? handleLogin : handleSubmit(onValid, onInvalid)} disabled={verificationIsLoading}>
                  {'로그인'}
                </button>
                {!validAccount && (
                  <div className={styles.etc_btn}>
                    <Link href={'#'} onClick={findPassFn}>
                      {'비밀번호 찾기'}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </form>
          <div className={styles.login_footer}>COPYRIGHT 2024 © WISE NETWORK. ALL RIGHTS RESERVED.</div>
        </div>
        {modalType.type === 'FIRST' && modalType.active && <FirstPassChangePop loginId={getValues().loginId} country={'ko'} changeType={changeType} />}
        {modalType.type === 'FINDPASS' && modalType.active && <FindPassPop />}
      </div>
    );
  }
};

export default Login;
