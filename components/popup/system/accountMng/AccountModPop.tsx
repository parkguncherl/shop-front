// C:\work\binblur-oms-frontend\components\popup\system\accountMng\AccountModPop.tsx

import {
  PartnerResponseSelect,
  UserRequestCreateUseYn,
  UserRequestDelete,
  UserRequestPasswordInit,
  UserRequestUpdate,
  UserResponseSelectByLoginId,
} from '../../../../generated';
import { useAccountStore, useCommonStore } from '../../../../stores';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { PopupContent } from '../../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../../content';
import { PopupFooter } from '../../PopupFooter';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { DefaultOptions, Placeholder } from '../../../../libs/const';
import { DeleteConfirmModal } from '../../../DeleteConfirmModal';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../../../libs';
import FormInput from '../../../FormInput';
import FormDropDown from '../../../FormDropDown';
import { Input } from '../../../Input';
import Loading from '../../../Loading';
import { PopupLayout } from '../../PopupLayout';
import { useSession } from 'next-auth/react';
import { useLogisStore, LogisDetail } from '../../../../stores/wms/useLogisStore';
import { DropDownOption } from '../../../../types/DropDownOptions';
import { fetchPartners } from '../../../../api/wms-api';
import { TunedReactSelector } from '../../../TunedReactSelector';

export type AccountRequestUpdateFields = {
  id: number;
  loginId: string;
  userNm: string;
  phoneNo: string;
  authCd: string;
  useYn: UserRequestCreateUseYn;
  belongNm: string;
  deptNm?: string;
  positionNm?: string;
  partnerId?: number;
  workLogisId?: number;
  orgPartnerId?: number | undefined;
  orgPartnerNm?: string | null;
};

interface Props {
  data: UserResponseSelectByLoginId;
}

/** 시스템 - 계정관리 - 수정 팝업 */
export const AccountModPop = ({ data }: Props) => {
  console.log('AccountModPop data: ==>', data);
  const session = useSession();
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;
  const authCd = parseInt(session.data?.user.authCd || '');
  const defaultOption = { value: '0', label: '전체' };
  const [partnerOption, setPartnerOption] = useState<any>([defaultOption]);
  const el = useRef<HTMLDListElement | null>(null);
  const {
    watch,
    getValues,
    setValue,
    handleSubmit,
    control,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<AccountRequestUpdateFields>({
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
      orgPartnerId: data.orgPartnerId ?? 0,
      orgPartnerNm: data.orgPartnerNm ?? '선택',
      workLogisId: data.workLogisId ?? 0,
    },
    mode: 'onSubmit',
  });

  /** 계정관리 스토어 - State */
  const [modalType, closeModal, selectedUser] = useAccountStore((s) => [s.modalType, s.closeModal, s.selectedUser]);

  /** 계정관리 양식 관리 스토어 - API */
  const [updateUser, deleteUser, sendMailUser, updatePasswordInit, createAuthForPartner] = useAccountStore((s) => [
    s.updateUser,
    s.deleteUser,
    s.sendMailUser,
    s.updatePasswordInit,
    s.createAuthForPartner,
  ]);

  /** 공통 스토어 - State */
  const [menuUpdYn, menuExcelYn] = useCommonStore((s) => [s.menuUpdYn, s.menuExcelYn]);

  const [confirmModal, setConfirmModal] = useState(false);
  const [userAuthCd, setUserAuthCd] = useState<number>(data.authCd ? Number(data.authCd) : 0);
  const [partnerList, setPartnerList] = useState([]);

  const queryClient = useQueryClient();

  /** 화주리스트 조회하기 */
  const { data: partners, isSuccess: isFetchPartnerSuccess } = useQuery(['fetchPartners'], () => fetchPartners(workLogisId));

  useEffect(() => {
    if (isFetchPartnerSuccess && partners) {
      const { resultCode, body, resultMessage } = partners.data;
      if (resultCode === 200) {
        const partnerCodes = body?.map((item: PartnerResponseSelect) => ({
          value: item.id,
          label: item.partnerNm,
        }));
        setPartnerOption([defaultOption, ...partnerCodes]);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchPartnerSuccess, partners]);

  // 창고 스토어에서 필요한 함수 가져오기
  const { fetchLogis } = useLogisStore();
  // 창고 목록 조회
  const { data: logisData } = useQuery(['logisList'], () => fetchLogis({}), {
    select: (response) => {
      if (response.data.resultCode === 200 && response.data.body) {
        const fetchedOptions = response.data.body.rows.map((item: LogisDetail) => ({
          key: item.id.toString(),
          value: item.id,
          label: `${item.logisKey} - ${item.logisNm}`,
          //label: item.logisNm,
        }));
        return [{ key: '', value: '', label: '선택' } as DropDownOption].concat(fetchedOptions);
      }
      return [{ key: '', value: '', label: '선택' } as DropDownOption];
    },
    onError: (error) => {
      console.error('창고 목록 조회 오류:', error);
      toastError('창고 목록 조회 중 오류가 발생했습니다.');
    },
  });
  /** 계정 수정 */
  const { mutate: updateUserMutate, isLoading: updateIsLoading } = useMutation(updateUser, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries({ queryKey: ['/user/paging'] });
          closeModal('MOD');
          // if (getCookie('smartLoginId') == data.loginId) {
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
  const { mutate: deleteUserMutate, isLoading: deleteIsLoading } = useMutation(deleteUser, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          await queryClient.invalidateQueries(['/user/paging']);
          closeModal('MOD');

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
  const { mutate: updatePasswordInitMutate, isLoading: updatePasswordInitIsLoading } = useMutation(updatePasswordInit, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('비밀번호가 초기화되었습니다.' || '');
          await queryClient.invalidateQueries({ queryKey: ['/user/paging'] });
          closeModal('MOD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 계정 비밀번호 초기화 */
  const { mutate: createAuthForPartnerMutate } = useMutation(createAuthForPartner, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('권한이 생성되었습니다.' || '');
          await queryClient.invalidateQueries({ queryKey: ['/user/paging'] });
          closeModal('MOD');
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

  /** 계정관리 수정, 비밀번호초기화 버튼 클릭 시 */
  const createAuthForPartnerFn = () => {
    const authCd = watch('authCd');
    if (authCd >= '400') {
      toastError('oms 사용자에게만 권한을 줄수 있습니다.');
    } else {
      createAuthForPartnerMutate(watch('id'));
    }
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
  const initialPartnerList = [
    { key: 0, label: '선택', value: '선택' }, // 기본값 추가
    ...partnerList, // 실제 파트너 리스트
  ];

  // 세션

  return (
    <dl ref={el}>
      <form>
        <PopupLayout
          width={820}
          isEscClose={false}
          open={modalType.type === 'MOD' && modalType.active}
          title={menuUpdYn ? '계정 수정' : '계정 조회'}
          onClose={() => closeModal('MOD')}
          footer={
            menuUpdYn && (
              <PopupFooter>
                <div className={'btnArea between'}>
                  <div className="left">
                    <button className={'btn'} onClick={updatePasswordFn}>
                      비밀번호 초기화
                    </button>
                    <button className={'btn'} onClick={createAuthForPartnerFn} disabled={watch('authCd') !== '399'}>
                      oms 권한 모두 주기
                    </button>
                  </div>
                  <div className="right">
                    <button className={'btn'} onClick={(e) => setConfirmModal(true)} disabled={deleteIsLoading}>
                      삭제
                    </button>
                    <button className={'btn btnBlue'} onClick={handleSubmit(onValid)}>
                      저장
                    </button>
                    <button className={'btn '} onClick={() => closeModal('MOD')}>
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
            <PopupSearchBox>
              <PopupSearchType className={'type_2'}>
                <Input title={'ID(e-mail)'} value={data.loginId} disable={true} />
                <FormInput<AccountRequestUpdateFields> control={control} name={'userNm'} label={'이름'} placeholder={Placeholder.Input || ''} required={true} />
              </PopupSearchType>
              <PopupSearchType className={'type_2'}>
                <FormInput<AccountRequestUpdateFields>
                  control={control}
                  name={'phoneNo'}
                  label={'휴대전화 번호'}
                  placeholder={Placeholder.PhoneNo || ''}
                  required={true}
                />
                <FormDropDown<AccountRequestUpdateFields>
                  control={control}
                  title={'연결창고'}
                  name={'workLogisId'}
                  options={logisData || []}
                  required={false}
                  onChange={(name, value) => {
                    const selectedOption = logisData?.find((opt: DropDownOption) => opt.label === value);
                    if (selectedOption && selectedOption.key) {
                      const parsedKey = parseInt(selectedOption.key.toString());
                      if (!isNaN(parsedKey)) {
                        console.log('Setting workLogisId to:', parsedKey);
                        setValue('workLogisId', parsedKey);
                      } else {
                        console.error('Invalid workLogisId:', selectedOption.key);
                      }
                    }
                  }}
                />
              </PopupSearchType>
              <PopupSearchType className={'type_2'}>
                <FormDropDown<AccountRequestUpdateFields>
                  control={control}
                  title={'권한'}
                  name={'authCd'}
                  defaultOptions={[...DefaultOptions.Select]}
                  codeUpper={'10020'}
                  required={true}
                  onChange={(name, value) => {
                    setUserAuthCd(value ? Number(value) : 0);
                  }}
                />
                <FormDropDown<AccountRequestUpdateFields> control={control} title={'상태' || ''} name={'useYn'} codeUpper={'10280'} required={true} />
              </PopupSearchType>
              <PopupSearchType className={'type_2'}>
                <FormInput<AccountRequestUpdateFields>
                  control={control}
                  name={'belongNm'}
                  label={'소속'}
                  placeholder={Placeholder.Input || ''}
                  required={true}
                />
                <FormInput<AccountRequestUpdateFields> control={control} name={'deptNm'} label={'부서'} placeholder={Placeholder.Input || ''} />
              </PopupSearchType>
              <PopupSearchType className={'type_2'}>
                <FormInput<AccountRequestUpdateFields> control={control} name={'positionNm'} label={'직책'} placeholder={Placeholder.Input || ''} />
                {authCd > 399 ? (
                  <TunedReactSelector
                    title={'연결화주'}
                    name={'orgPartnerId'}
                    onChange={(option) => {
                      setValue('orgPartnerId', option.value ? Number(option.value) : undefined);
                    }}
                    options={partnerOption}
                    placeholder="연결화주"
                    values={getValues('orgPartnerId')}
                  />
                ) : (
                  ''
                )}
              </PopupSearchType>
              <PopupSearchType className={'type_2'}>
                <dl>
                  <dt>등록자</dt>
                  <dd>{selectedUser?.creUserNm ? selectedUser?.creUserNm : 'system'}</dd>
                </dl>
                <dl>
                  <dt>등록시간</dt>
                  <dd>{selectedUser?.creTm}</dd>
                </dl>
              </PopupSearchType>
              <PopupSearchType className={'type_2'}>
                <dl>
                  <dt>수정자</dt>
                  <dd>{selectedUser?.updUserNm ? selectedUser?.updUserNm : 'system'}</dd>
                </dl>
                <dl>
                  <dt>수정시간</dt>
                  <dd>{selectedUser?.updTm}</dd>
                </dl>
              </PopupSearchType>
            </PopupSearchBox>
          </PopupContent>
          {(updateIsLoading || deleteIsLoading || updatePasswordInitIsLoading) && <Loading />}
        </PopupLayout>
      </form>
    </dl>
  );
};
