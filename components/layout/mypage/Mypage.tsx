import React, { useEffect, useRef, useState } from 'react';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { ApiResponseBoolean, ApiResponseUserResponseSelectByLoginId, CommonResponseFileDown, UserRequestUpdate } from '../../../generated';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { toastError, toastSuccess } from '../../ToastMessage';
import useAppStore from '../../../stores/useAppStore';
import FormInput from '../../FormInput';
import { FileUploadPop } from '../../popup/common';
import { useCommonStore } from '../../../stores';
import ChangePasswordPop from '../../popup/mypage/ChangePasswordPop';
import VoucherSetting from './VoucherSetting';
import { useRouter } from 'next/router';

interface Props {
  className?: string;
  setMypageState: React.Dispatch<React.SetStateAction<boolean>>;
}
type MypageUpdateFields = UserRequestUpdate;

const Mypage = ({ className, setMypageState }: Props) => {
  const { session } = useAppStore();
  const router = useRouter();
  /** 스토어 - State */
  const [commonModalType, commonOpenModal, getFileUrl] = useCommonStore((s) => [s.modalType, s.openModal, s.getFileUrl]);

  const [file, setFile] = useState<any>({});
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const mypageRef = useRef<HTMLDivElement | null>(null);

  /** useForm */
  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<MypageUpdateFields>({
    //resolver: yupResolver(YupSchema.ProductRequest(prodAttrOpen)),
    defaultValues: {},
    mode: 'onSubmit',
  });

  /** 데이터 불러오기 */
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
        reset({
          loginId: body?.loginId,
          userNm: body?.userNm,
          deptNm: body?.deptNm,
          positionNm: body?.positionNm,
          belongNm: body?.belongNm,
          phoneNo: body?.phoneNo,
          fileId: body?.fileId,
        });
      } else {
        toastError(resultMessage);
      }
    }
  }, [fetchedUserData, isFetchUserDataSuccess]);

  const fileId = useWatch({ control, name: 'fileId' });
  const fetchFileData = async () => {
    if (!fileId) {
      setFile(null); // 파일 없을 때 초기화
      return;
    }
    try {
      const { data: fileDataList } = await authApi.get(`/common/file/${fileId}`);
      const { resultCode, body, resultMessage } = fileDataList;
      if (resultCode === 200) {
        setFile(body[0]);
      } else {
        toastError(resultMessage);
      }
    } catch (error) {
      console.error('파일 데이터 불러오기 실패:', error);
    }
  };
  useEffect(() => {
    fetchFileData();
  }, [fileId]);

  /** file */
  const handleFileValueChange = (fileInfo: any) => {
    setFile(fileInfo); // 파일을 객체로 저장

    reset((prev) => ({
      ...prev,
      fileId: fileInfo?.fileId, // fileInfo가 있을 경우 fileId 설정
    }));
  };
  // 파일 URL 가져오기 함수 (단일 파일)
  const fetchFileUrls = async () => {
    if (!file || !file.sysFileNm) return; // 파일이 없으면 실행 X

    const fileUrl = await getFileUrl(file.sysFileNm);
    const updatedFile = { ...file, url: fileUrl };

    if (JSON.stringify(updatedFile) !== JSON.stringify(file)) {
      setFile(updatedFile);
    }
  };

  // useEffect로 파일 상태 변경 시 URL 가져오기
  useEffect(() => {
    if (file) {
      fetchFileUrls();
    }
  }, [file]);

  // 이미지 삭제
  const deleteFileMutation = useMutation(
    async ({ fileId, sysFileNm }: { fileId: string; sysFileNm: string }) => {
      // API 호출
      await authApi.delete(`/common/fileDeleteByKey`, {
        params: {
          fileId: fileId,
          key: sysFileNm,
        },
      });
    },
    {
      onSuccess: () => {
        // 성공시 호출
        setFile(null);
        reset((prev) => ({
          ...prev,
          fileId: undefined,
        }));
      },
      onError: (error) => {
        console.error(error);
      },
    },
  );

  /** 영역 외 클릭시 닫기 */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // 만약 클릭한 요소가 다른 팝업(.popup) 내부에 있다면 return
      if (document.querySelector('.ant-modal-root')?.contains(target)) {
        return;
      }

      // mypageRef 바깥 클릭 시 닫기
      if (mypageRef.current && !mypageRef.current.contains(target)) {
        setMypageState(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /** 전표설정 클릭 */
  const [printSet, setPrintSet] = useState<boolean>(false);
  const handlePrintSet = () => {
    setPrintSet(true);
  };

  /** 수정 */
  const updateMypage = useMutation((data: MypageUpdateFields) => authApi.put<ApiResponseBoolean>('/mypage', data), {
    onSuccess: async (e) => {
      const { resultCode, resultMessage } = e.data;
      if (resultCode === 280) {
        toastSuccess('저장되었습니다.');
        await refetchedUserData(); // 사용자 정보 refetch
      } else {
        toastError(resultMessage);
      }
    },
  });

  // 데이터 update
  const onValid: SubmitHandler<MypageUpdateFields> = (data: any) => {
    // 검증

    // 제출 처리
    console.log('업데이트데이터', data);
    updateMypage.mutate(data);
  };

  return (
    <div className={`mypageDiv ${className}`} ref={mypageRef}>
      <ul className="profileBox">
        <li className="id">{getValues('loginId')}</li>
        <li className="pic">
          <span className="imgBox">
            <span
              className={`img ${file ? 'on' : ''}`}
              onClick={() => {
                commonOpenModal('UPLOAD');
              }}
            >
              <img src={file ? file.url : ''} alt="" />
            </span>
            {file ? (
              <button
                onClick={() => {
                  deleteFileMutation.mutate(file.fileId, file.sysFileNm);
                }}
              >
                삭제
              </button>
            ) : (
              ''
            )}
          </span>
        </li>
        <li className="name">안녕하세요 {getValues('userNm')}님</li>
        <li className="etcArea">
          <button
            onClick={() => {
              setChangePasswordModal(true);
            }}
          >
            비밀번호 바꾸기
          </button>
        </li>
      </ul>
      <section className="infoBox">
        <ul>
          <li>
            <span className="personalData">
              <strong>개인정보</strong>
            </span>
            <dl>
              <dt>이름</dt>
              <dd>
                <FormInput<MypageUpdateFields> inputType="single" name="userNm" control={control} />
              </dd>
              <dt>연락처</dt>
              <dd>
                <FormInput<MypageUpdateFields> inputType="single" name="phoneNo" control={control} />
              </dd>
              <dt>빈블러</dt>
              <dd>
                <FormInput<MypageUpdateFields> inputType="single" name="belongNm" control={control} />
              </dd>
              <dt>부서</dt>
              <dd>
                <FormInput<MypageUpdateFields> inputType="single" name="deptNm" control={control} />
              </dd>
              <dt>직급</dt>
              <dd>
                <FormInput<MypageUpdateFields> inputType="single" name="positionNm" control={control} />
              </dd>
            </dl>
          </li>
          <li>
            <span className="setData">
              <strong>설정</strong>
            </span>
            <ul>
              {session?.user?.authCd === '399' && (
                <>
                  <li>
                    <button className="ico_printSet" onClick={handlePrintSet}>
                      전표설정
                    </button>
                  </li>
                  <li>
                    <button className="ico_masterSet" onClick={() => router.push('/mypage/mypage')}>
                      마스터설정
                    </button>
                  </li>
                </>
              )}
            </ul>
          </li>
        </ul>
      </section>
      <div className="btnArea right">
        <button className="btn btnBlue" onClick={handleSubmit(onValid)}>
          저장
        </button>
        <button
          className="btn"
          onClick={() => {
            setMypageState(false);
          }}
        >
          닫기
        </button>
      </div>
      {/* 파일업로드 팝업 */}
      {commonModalType.type === 'UPLOAD' && commonModalType.active && (
        <FileUploadPop
          key={commonModalType.type}
          fileId={getValues('fileId')}
          onValueChange={(fileInfo: CommonResponseFileDown) => {
            handleFileValueChange(fileInfo);
          }}
        />
      )}
      {/* 비밀번호 변경팝업 */}
      {changePasswordModal && <ChangePasswordPop open={changePasswordModal} onClose={() => setChangePasswordModal(false)} />}
      {/* 전표양식 팝업 */}
      {printSet && <VoucherSetting open={printSet} onClose={() => setPrintSet(false)} />}
    </div>
  );
};

export default Mypage;
