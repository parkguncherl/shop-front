import React, { useState, useCallback, useEffect } from 'react';
import { Title, toastError, toastSuccess, Table } from '../../components';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../libs';
import FormInput from '../../components/FormInput';
import { useMutation, useQuery } from '@tanstack/react-query';
import useAppStore, { appStoreContext } from '../../stores/useAppStore';
import { ApiResponseBoolean, ApiResponseUserResponseSelectByLoginId, PartnerResponsePaging, UserResponsePaging } from '../../generated';
import ChangePasswordPop from '../../components/popup/mypage/ChangePasswordPop';
import { ConfirmModal } from '../../components/ConfirmModal';
import { signOut } from 'next-auth/react';
import PartnerPrintPop from '../../components/popup/mypage/PartnerPrintPop';
import { AgGridReact } from 'ag-grid-react';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { useAgGridApi } from '../../hooks';
import useFilters from '../../hooks/useFilters';
import { defaultColDef, GridSetting } from '../../libs/ag-grid';
import { PartnerPagingFilter, usePartnerStore } from '../../stores/usePartnerStore';
import CustomGridLoading from '../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../components/CustomNoRowsOverlay';
import PartnerInfoPop from '../../components/popup/mypage/PartnerInfoPop';
import UserAddPop from '../../components/popup/mypage/UserAddPop';
import { useAuthStore, useMypageStore } from '../../stores';
import UserModPop from '../../components/popup/mypage/UserModPop';
import { Utils } from '../../libs/utils';
import { UserAuthsCellRenderer } from '../../components/cellRenderer/mypage/UserAuthsCellRender';
import { UserAuthPop } from '../../components/popup/mypage/UserAuthPop';
import PartnerPrintSetPop from '../../components/popup/mypage/PartnerPrintSetPop';

// MyPage 컴포넌트에서 사용할 필드 타입 정의
export interface MypageSaveFields {
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
  designCntn: string;
  orgPartnerId: number;
}

const MyPage = () => {
  const { session } = useAppStore();
  const [logout] = useAuthStore((s) => [s.logout]);

  // 폼 초기화 및 유효성 검사 설정
  const form = useForm<MypageSaveFields>({
    resolver: yupResolver(YupSchema.MypageSaveRequest()), // 완료
    defaultValues: {
      loginId: '',
      password: '',
      password2: '',
      userNm: '',
      deptNm: '',
      positionNm: '',
      belongNm: '',
      phoneNo: '',
      orgPartnerId: session?.user.orgPartnerId || 0,
    },
    mode: 'onChange',
  });

  const [rowData, setRowData] = useState<UserResponsePaging[]>([]);

  // 상태 변수들 정의
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [confirmChangeUserNm, setConfirmChangeUserNm] = useState(false);
  const [partnerPrintModal, setPartnerPrintModal] = useState(false);
  const [partnerPrintSetModal, setPartnerPrintSetModal] = useState(false);

  // ag-Grid API 초기화
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();

  const [paging, setPaging, modalType, openModal, setSelectedUser] = useMypageStore((s) => [
    s.paging,
    s.setPaging,
    s.modalType,
    s.openModal,
    s.setSelectedUser,
  ]);
  // 파트너 관리 관련 상태 및 함수들
  const [selectedPartner, setSelectedPartner] = usePartnerStore((s) => [s.selectedPartner, s.setSelectedPartner]);

  // 필터 관련 훅 사용
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<PartnerPagingFilter>({});

  // 유저 데이터 가져오기
  const {
    data: fetchedUserData,
    isSuccess: isFetchUserDataSuccess,
    isLoading: isUserDataLoading,
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
          // languageCode: body?.languageCode,
        });
      } else {
        toastError(resultMessage);
      }
    }
  }, [fetchedUserData, isFetchUserDataSuccess]);

  // 계정 목록 조회
  const {
    data: users,
    isSuccess: isFetchUsersSuccess,
    isLoading: isUserPagingLoading,
    refetch: accountsRefetch,
  } = useQuery(['/user/paging', paging.curPage], (): any =>
    authApi.get('/user/paging', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
      },
    }),
  );

  useEffect(() => {
    if (users) {
      const { resultCode, body, resultMessage } = users.data;
      if (resultCode === 200 && body?.rows) {
        setRowData(body.rows);
        setPaging(body.paging);
        const filteredRows = body.rows.filter((account: UserResponsePaging) => {
          const authCd = account.authCd;
          return authCd !== undefined && !isNaN(parseInt(authCd)) && parseInt(authCd) <= 399;
        });
        console.log(filteredRows);
        if (gridApi) {
          gridApi.applyTransaction({ add: filteredRows });
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [users, isFetchUsersSuccess]);

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
          toastSuccess('저장되었습니다.');
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

  // 저장 버튼 클릭 핸들러
  const revertToWmsAuth = async () => {
    authApi
      .get('/auth/revertToWmsAuth')
      .then(async (response) => {
        console.log('data ==>', response.data);
        if (response.data.resultCode === 200) {
          await logout(session?.user?.loginId ? session?.user?.loginId : '');
          await signOut({ redirect: true, callbackUrl: '/login' });
          appStoreContext.setState({
            session: undefined,
          });
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  // 파트너 관리 그리드 컬럼 정의
  const [columnDefs] = useState<ColDef[]>([
    { field: 'no', headerName: 'NO', minWidth: 40, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'loginId', headerName: 'ID', minWidth: 200, suppressHeaderMenuButton: true },
    { field: 'userNm', headerName: '이름', minWidth: 90, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'authNm', headerName: '권한명', minWidth: 60, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'belongNm', headerName: '소속', minWidth: 60, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'deptNm', headerName: '부서', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'positionNm', headerName: '직책', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'phoneNo',
      headerName: '전화번호',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => Utils.getPhoneNumFormat(params.value),
    },
    { field: 'useYn', headerName: '사용여부', minWidth: 60, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'auths',
      headerName: '권한 수정',
      tooltipField: 'auths',
      minWidth: 100,
      cellRenderer: UserAuthsCellRenderer,
      cellRendererParams: {
        title: '권한 수정',
      },
      hide: parseInt(session?.user?.authCd || '0') < 399,
    },
    { field: 'lastLoginDateTime', headerName: '최근접속기록', minWidth: 150, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ]);

  // 자기 파트너 정보 조회
  const {
    data: partners,
    isLoading,
    isSuccess: isListSuccess,
    refetch: partnersRefetch,
  } = useQuery(['/partner/my-partner', paging.curPage], (): any =>
    authApi.get('/partner/my-partner', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
      },
    }),
  );

  // 자기 파트너 정보 조회 성공 시 처리
  useEffect(() => {
    if (isListSuccess) {
      const { resultCode, body, resultMessage } = partners.data;
      if (resultCode === 200) {
        // 데이터가 배열이 아니면 배열로 변환
        setPaging(body?.paging); // 페이징 처리
        /** 자기 파트너 정보를 전역 상태로 설정 */
        setSelectedPartner(body as PartnerResponsePaging);
      } else {
        toastError(resultMessage);
      }
    }
  }, [partners, isListSuccess, setPaging]);

  // 셀 클릭 이벤트 핸들러
  const onCellClicked = async (cellClickedEvent: CellClickedEvent) => {
    const { colDef, data } = cellClickedEvent;
    if (colDef.field !== 'action') {
      openModal('USER_ADD');
    }
  };

  return (
    <>
      <Title title="마이페이지" detail={true} />

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
                className="btn mt10 white"
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
                  <FormInput<MypageSaveFields> inputType="single" name="userNm" control={form.control} maxLength={6} />
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
                  <FormInput<MypageSaveFields> inputType="single" name="phoneNo" control={form.control} maxLength={20} />
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
                <FormInput<MypageSaveFields> inputType="password" name="password" control={form.control} maxLength={24} />
                {/*<div className="formBox border pwdBox">*/}
                {/*  <input type={showPassword ? 'text' : 'password'} {...form.register('password')} maxLength={24} />*/}
                {/*  <button*/}
                {/*    type="button"*/}
                {/*    className={`ico_eye ${showPassword ? 'on' : ''}`}*/}
                {/*    onClick={(e) => {*/}
                {/*      e.preventDefault();*/}
                {/*      setShowPassword(!showPassword);*/}
                {/*    }}*/}
                {/*  />*/}
                {/*</div>*/}
                {/*{form.formState.errors.password && (*/}
                {/*  <span className="error_txt" style={{ margin: '5px 0' }}>*/}
                {/*    {form.getFieldState('password').error?.message}*/}
                {/*  </span>*/}
                {/*)}*/}
              </td>
              <th scope="row">
                <label>비밀번호 확인</label>
                <span className="req">*</span>
              </th>
              <td>
                <FormInput<MypageSaveFields> inputType="password" name="password2" control={form.control} maxLength={24} />
                {/*<div className="formBox border pwdBox">*/}
                {/*  <input type={showPassword2 ? 'text' : 'password'} {...form.register('password2')} maxLength={24} />*/}
                {/*  <button*/}
                {/*    type="button"*/}
                {/*    className={`ico_eye ${showPassword2 ? 'on' : ''}`}*/}
                {/*    onClick={(e) => {*/}
                {/*      e.preventDefault();*/}
                {/*      setShowPassword2(!showPassword2);*/}
                {/*    }}*/}
                {/*  />*/}
                {/*</div>*/}
                {/*{form.formState.errors.password2 && (*/}
                {/*  <span className="error_txt" style={{ margin: '5px 0 0 0' }}>*/}
                {/*    {form.getFieldState('password2').error?.message}*/}
                {/*  </span>*/}
                {/*)}*/}
              </td>
            </tr>
            {/* 소속, 부서, 직책 입력 필드 */}
            <tr>
              <th scope="row">
                <label>소속</label>
              </th>
              <td colSpan={3}>
                <div className="formBox">
                  <FormInput<MypageSaveFields> inputType="single" name="belongNm" control={form.control} maxLength={20} />
                </div>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <label>부서</label>
              </th>
              <td colSpan={3}>
                <div className="formBox">
                  <FormInput<MypageSaveFields> inputType="single" name="deptNm" control={form.control} maxLength={20} />
                </div>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <label>직책</label>
              </th>
              <td colSpan={3}>
                <div className="formBox">
                  <FormInput<MypageSaveFields> inputType="single" name="positionNm" control={form.control} maxLength={20} />
                </div>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <label>디자이너</label>
              </th>
              <td colSpan={3}>
                <div className="formBox">
                  <FormInput<MypageSaveFields> inputType="single" name="designCntn" control={form.control} maxLength={100} />
                </div>
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
        {session?.user.userType === '5' && (
          <button className="btn btnBlue" onClick={revertToWmsAuth}>
            물류권한으로 돌아가기
          </button>
        )}
      </div>

      <div className="smallTitle between mt20 mb10">
        <div className="left">직원관리</div>
        <div className="right">
          <button
            className="btn"
            onClick={() => {
              openModal('USER_ADD');
            }}
          >
            직원 추가
          </button>
        </div>
      </div>

      {/* 파트너 목록 테이블 */}
      <Table>
        <div className={'ag-theme-alpine'} style={{ height: '250px' }}>
          <AgGridReact
            headerHeight={35}
            onGridReady={onGridReady}
            loading={isLoading}
            rowData={rowData}
            gridOptions={{ rowHeight: 24 }}
            columnDefs={columnDefs}
            onCellClicked={(e) => {
              if (e.column.getColId() != 'auths') {
                openModal('USER_MOD');
              } else {
                openModal('USER_AUTH_MOD');
              }
              console.log(rowData[e.rowIndex as number]);
              setSelectedUser(rowData[e.rowIndex as number]);
            }}
            defaultColDef={defaultColDef}
            paginationPageSize={paging.pageRowCount}
            rowSelection={'single'}
            animateRows={true}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
          />
        </div>
        {/*<Pagination pageObject={paging} setPaging={setPaging} />*/}
      </Table>

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

export default React.memo(MyPage);
