import React, { useState, useCallback, useEffect } from 'react';
import { Title, toastError } from '../../components';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../libs';
import FormInput from '../../components/FormInput';
import { useMutation, useQuery } from '@tanstack/react-query';
import useAppStore from '../../stores/useAppStore';
import { ApiResponseBoolean, ApiResponseUserResponseSelectByLoginId, UserResponsePaging } from '../../generated';
import ChangePasswordPop from '../../components/popup/mypage/ChangePasswordPop';
import { ConfirmModal } from '../../components/ConfirmModal';
import { signOut } from 'next-auth/react';
import PartnerPrintPop from '../../components/popup/mypage/PartnerPrintPop';
import PartnerInfoPop from '../../components/popup/mypage/PartnerInfoPop';
import UserAddPop from '../../components/popup/mypage/UserAddPop';
import { useMypageStore } from '../../stores';
import UserModPop from '../../components/popup/mypage/UserModPop';
import { UserAuthPop } from '../../components/popup/mypage/UserAuthPop';
import PartnerPrintSetPop from '../../components/popup/mypage/PartnerPrintSetPop';
import FormDropDown from '../../components/FormDropDown';

// MyPage 컴포넌트에서 사용할 필드 타입 정의
export interface WmsMypageSaveFields {
  loginId: string;
  password: string;
  password2: string;
  userNm: string;
  deptNm: string;
  positionNm: string;
  belongNm: string;
  phoneNo: string;
  authNm: string;
  languageCode: string;
  authCd: number;
  orgPartnerId?: number;
}

const MyPageForWms = () => {
  const { session } = useAppStore();

  // 폼 초기화 및 유효성 검사 설정
  const form = useForm<WmsMypageSaveFields>({
    resolver: yupResolver(YupSchema.WmsMypageSaveRequest()), // 완료
    defaultValues: { loginId: '', password: '', password2: '', userNm: '', deptNm: '', positionNm: '', belongNm: '', phoneNo: '' },
    mode: 'onChange',
  });

  // 상태 변수들 정의
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [confirmChangeUserNm, setConfirmChangeUserNm] = useState(false);
  const [partnerPrintModal, setPartnerPrintModal] = useState(false);
  const [partnerPrintSetModal, setPartnerPrintSetModal] = useState(false);
  const [partnerList, setPartnerList] = useState([]);
  const [modalType, openModal] = useMypageStore((s) => [s.modalType, s.openModal]);
  // 필터 관련 훅 사용
  const { data: partner, isSuccess: isListSuccess } = useQuery([`/partner/upperPartner`], (): any => authApi.get(`/partner/upperPartner`, {}));
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

  // 유저 데이터 가져오기
  const {
    data: fetchedUserData,
    isSuccess: isFetchUserDataSuccess,
    refetch: refetchedUserData,
  } = useQuery(['/mypage', session?.user?.id], () => authApi.get<ApiResponseUserResponseSelectByLoginId>(`/mypage`), {
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    if (fetchedUserData) {
      const { body, resultCode, resultMessage } = fetchedUserData.data;
      if (resultCode === 200) {
        form.reset({
          loginId: body?.loginId,
          userNm: body?.userNm,
          deptNm: body?.deptNm,
          positionNm: body?.positionNm,
          belongNm: body?.belongNm,
          authNm: body?.authNm,
          phoneNo: body?.phoneNo,
        });
        form.setValue('orgPartnerId', body?.orgPartnerId || 0);
      } else {
        toastError(resultMessage);
      }
    }
  }, [fetchedUserData, isFetchUserDataSuccess]);

  // 개인정보 수정 뮤테이션
  const updateMypage = useMutation(
    () =>
      authApi.put<ApiResponseBoolean>('/mypage', {
        ...form.getValues(),
        userNm: form.getValues('userNm').trim(),
        phoneNo: form.getValues('phoneNo').trim(),
      }),
    {
      onSuccess: async (e) => {
        const { resultCode, resultMessage } = e.data;
        if (resultCode === 280) {
          form.resetField('password');
          form.resetField('password2');
          await refetchedUserData(); // 사용자 정보 refetch
        } else {
          toastError(resultMessage);
        }
      },
    },
  );

  // 비밀번호 유효성 검사
  const validatePassword = useCallback(async () => {
    const pass = form.getValues('password');
    const pass2 = form.getValues('password2');
    if (pass !== pass2) {
      form.setError('password', { message: '비밀번호가 일치하지 않습니다.' });
      form.setError('password2', { message: '비밀번호가 일치하지 않습니다.' });
      return false;
    }
    return true;
  }, [form]);

  // 현재 비밀번호 확인 뮤테이션
  const validateCurrentPassword = useMutation(
    () =>
      authApi.post<ApiResponseBoolean>('/mypage/validate/password', {
        id: session?.user?.id,
        loginId: session?.user?.loginId,
        password: form.getValues('password'),
        rePassword: form.getValues('password2'),
      }),
    {
      onSuccess: async (e) => {
        const { resultCode, resultMessage } = e.data;
        if (resultCode === 200) {
          if (await validatePassword()) {
            const userNm = form.getValues('userNm').trim();
            if (session?.user?.userNm !== userNm) {
              setConfirmChangeUserNm(true);
            } else {
              updateMypage.mutate();
            }
          }
        } else {
          toastError(resultMessage);
        }
      },
    },
  );

  // 저장 버튼 클릭 핸들러
  const handleSave = async () => {
    const pass = form.getValues('password');
    const pass2 = form.getValues('password2');
    if (!pass || !pass2 || (await validatePassword())) {
      form.handleSubmit(async (data) => validateCurrentPassword.mutate())();
    }
  };

  return (
    <>
      <Title title="WMS 마이페이지" detail={true} />

      {/* 사용자 정보 표시 섹션 */}
      <div className="mypageBox">
        <div className="img" />
        <div className="info">
          <div>
            <span>화주</span>
            <div>
              <strong>{form.getValues('userNm')}</strong>님 반갑습니다!
            </div>
          </div>
          <ul>
            <li>
              <span>아이디</span>
              {form.getValues('loginId')}
            </li>
            <li>
              <span>소속</span>
              {form.getValues('belongNm')}
            </li>
            <li>
              <button
                className="btn mt10"
                onClick={(e) => {
                  e.preventDefault();
                  setChangePasswordModal(true);
                }}
              >
                비밀번호 변경
              </button>
              {changePasswordModal && <ChangePasswordPop open={changePasswordModal} onClose={() => setChangePasswordModal(false)} />}
            </li>
          </ul>
        </div>

        {/* 파트너 관련 기능 버튼 (권한에 따라 표시) */}
        {session?.user?.authCd === '399' && (
          <div className="partnerDiv">
            <div>
              <span className="ico_receipt"></span>
              <button
                className="btn"
                onClick={() => {
                  setPartnerPrintModal(true);
                }}
              >
                전표양식 설정
              </button>
            </div>
            <div>
              <span className="ico_receipt"></span>
              <button
                className="btn"
                onClick={() => {
                  setPartnerPrintSetModal(true);
                }}
              >
                전표 환경설정
              </button>
            </div>
            <div>
              <span className="ico_store"></span>
              <button
                className="btn"
                onClick={() => {
                  openModal('PARTNER_INFO');
                }}
              >
                도매 정보
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 개인정보 수정 폼 */}
      <div className="tblBox">
        <table>
          <caption>마이페이지 테이블</caption>
          <colgroup>
            <col width="15%" />
            <col width="35%" />
            <col width="15%" />
            <col width="35%" />
          </colgroup>
          <tbody>
            {/* 이름 입력 필드 */}
            <tr>
              <th scope="row">
                <label>이름</label>
                <span className="req">*</span>
              </th>
              <td colSpan={3}>
                <div className="formBox">
                  <FormInput<WmsMypageSaveFields> inputType="single" name="userNm" control={form.control} maxLength={6} />
                </div>
              </td>
            </tr>
            {/* 전화번호 입력 필드 */}
            <tr>
              <th scope="row">
                <label>전화번호</label>
                <span className="req">*</span>
              </th>
              <td colSpan={3}>
                <div className="formBox">
                  <FormInput<WmsMypageSaveFields> inputType="single" name="phoneNo" control={form.control} maxLength={20} />
                </div>
              </td>
            </tr>
            {/* 비밀번호 입력 필드 */}
            <tr>
              <th scope="row">
                <label>비밀번호</label>
                <span className="req">*</span>
              </th>
              <td>
                <div className="formBox pwdBox">
                  <input type={showPassword ? 'text' : 'password'} {...form.register('password')} maxLength={24} />
                  <button
                    type="button"
                    className={`ico_eye ${showPassword ? 'on' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword(!showPassword);
                    }}
                  />
                </div>
                {form.formState.errors.password && (
                  <span className="error_txt" style={{ margin: '5px 0' }}>
                    {form.getFieldState('password').error?.message}
                  </span>
                )}
              </td>
              <th scope="row">
                <label>비밀번호 확인</label>
                <span className="req">*</span>
              </th>
              <td>
                <div className="formBox pwdBox">
                  <input type={showPassword2 ? 'text' : 'password'} {...form.register('password2')} maxLength={24} />
                  <button
                    type="button"
                    className={`ico_eye ${showPassword2 ? 'on' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword2(!showPassword2);
                    }}
                  />
                </div>
                {form.formState.errors.password2 && (
                  <span className="error_txt" style={{ margin: '5px 0 0 0' }}>
                    {form.getFieldState('password2').error?.message}
                  </span>
                )}
              </td>
            </tr>
            {/* 소속, 부서, 직책 입력 필드 */}
            <tr>
              <th scope="row">
                <label>소속</label>
              </th>
              <td colSpan={3}>
                <div className="formBox">
                  <FormInput<WmsMypageSaveFields> inputType="single" name="belongNm" control={form.control} maxLength={20} />
                </div>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <label>부서</label>
              </th>
              <td colSpan={3}>
                <div className="formBox">
                  <FormInput<WmsMypageSaveFields> inputType="single" name="deptNm" control={form.control} maxLength={20} />
                </div>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <label>직책</label>
              </th>
              <td colSpan={3}>
                <div className="formBox">
                  <FormInput<WmsMypageSaveFields> inputType="single" name="positionNm" control={form.control} maxLength={20} />
                </div>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <label>화주로 로그인</label>
              </th>
              <td colSpan={3}>
                <FormDropDown<WmsMypageSaveFields>
                  control={form.control}
                  name={'orgPartnerId'}
                  options={partnerList}
                  required={false}
                  onChange={(name, value) => {
                    const selectedOption: any = partnerList.find((opt: any) => opt.label === value);
                    if (selectedOption) {
                      form.setValue('orgPartnerId', selectedOption.key);
                    }
                  }}
                  style={{ width: '158.8px' }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="btnArea right mt10 mb5">
        {/* 저장 버튼 */}
        <button className="btn btnBlue" onClick={handleSave}>
          저장
        </button>
      </div>
      {/* 파트너 추가/수정 모달 */}
      {partnerPrintModal && <PartnerPrintPop open={partnerPrintModal} onClose={() => setPartnerPrintModal(false)} />}
      {partnerPrintSetModal && <PartnerPrintSetPop open={partnerPrintSetModal} onClose={() => setPartnerPrintSetModal(false)} />}
      {modalType.type === 'PARTNER_INFO' && modalType.active && <PartnerInfoPop />}
      {modalType.type == 'USER_ADD' && modalType.active && <UserAddPop />}
      {modalType.type == 'USER_MOD' && modalType.active && <UserModPop />}
      {modalType.type == 'USER_AUTH_MOD' && modalType.active && <UserAuthPop />}

      {/* 이름 변경 확인 모달 */}
      <ConfirmModal
        open={confirmChangeUserNm}
        title="이름이 변경되어 로그아웃됩니다. 계속하시겠습니까?"
        width={350}
        onConfirm={async () => {
          updateMypage.mutate();
          setConfirmChangeUserNm(false);
          await signOut({ redirect: true, callbackUrl: '/login' });
        }}
        onClose={() => setConfirmChangeUserNm(false)}
      />
    </>
  );
};

export default React.memo(MyPageForWms);
