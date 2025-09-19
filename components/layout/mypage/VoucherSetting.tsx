import React, { useEffect, useState } from 'react';
import { PopupFooter, PopupLayout } from '../../popup';
import { Button } from '../../Button';
import CustomCheckBox from '../../CustomCheckBox';
import DropDownAtom from '../../atom/DropDownAtom';
import FormInput from '../../FormInput';
import TextArea from '../../TextArea';
import { FileUploadPop } from '../../popup/common';
import { ApiResponseSelectPartnerPrint, CommonResponseFileDown, MypagePrintSetUpdateRequest, RetailRequestCreate } from '../../../generated';
import { toastError, toastSuccess } from '../../ToastMessage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, YupSchema } from '../../../libs';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import useAppStore from '../../../stores/useAppStore';
import { useCommonStore } from '../../../stores';
import FormDropDown from '../../FormDropDown';

/**
 * 전표양식설정 팝업
 * */

interface Props {
  open: boolean;
  onClose: () => void;
}

type ReceiptDataFields = MypagePrintSetUpdateRequest;

const VoucherSetting = ({ open = false, onClose }: Props) => {
  /** 스토어 */
  const { session } = useAppStore();
  const [commonModalType, commonOpenModal, getFileUrl] = useCommonStore((s) => [s.modalType, s.openModal, s.getFileUrl]);
  const [fileUrl, setFileUrl] = useState('');

  const {
    control,
    handleSubmit,
    getValues,
    reset,
    setValue,
    formState: { errors, isValid },
  } = useForm<ReceiptDataFields>({
    resolver: yupResolver(YupSchema.MypagePartnerPrintRequest()), // 완료
    defaultValues: {
      id: 0,
      partnerId: 0,
      fileId: 0,
      logoprintyn: '',
      logoLocCd: '',
      titleYn: '',
      titleMng: '',
      titleNor: '',
      topYn: '',
      topMng: '',
      topNor: '',
      bottomYn: '',
      bottomMng: '',
      bottomNor: '',
    },
    mode: 'onChange',
  });

  // 체크박스, 내용
  const [imageChecked, setImageChecked] = useState<'Y' | 'N'>('N');
  const [imageLocationChecked, setImageLocationChecked] = useState('');
  const [titleChecked, setTitleChecked] = useState<'Y' | 'N'>('N');
  const [topMngChecked, setTopMngChecked] = useState<'Y' | 'N'>('N');
  const [bottomMngChecked, setBottomMngChecked] = useState<'Y' | 'N'>('N');

  const [titleMngInp, setTitleMngInp] = useState('');
  const [topMngInp, setTopMngInp] = useState('');
  const [bottomMngInp, setBottomMngInp] = useState('');

  // 유저데이터 가져오기
  const fetchUserPartnerPrintData = useQuery(
    ['/mypage/partner/print', session?.user?.partnerId],
    () =>
      authApi.get(`/mypage/partner/print`, {
        params: { partnerId: session?.user?.partnerId },
      }),
    {
      enabled: !!session?.user?.partnerId, // partnerId가 있어야 쿼리 실행
      onSuccess: (e) => {
        const { body, resultCode, resultMessage } = e.data;
        if (resultCode === 200) {
          reset({
            ...body,
          });
          // 체크박스
          const normalizeYnValue = (value: string | undefined) => (value?.toUpperCase() === 'Y' ? 'Y' : 'N');
          setTitleChecked(normalizeYnValue(body?.titleYn));
          setTopMngChecked(normalizeYnValue(body?.topYn));
          setBottomMngChecked(normalizeYnValue(body?.bottomYn));
          setImageChecked(normalizeYnValue(body?.logoprintyn));
          setImageLocationChecked(body?.logoLocCd || '');
          // 내용
          setTitleMngInp(body?.titleMng || '');
          setTopMngInp(body?.topMng || '');
          setBottomMngInp(body?.bottomMng || '');

          // fileId 조회
          fetchData(body?.fileId);
        } else {
          toastError(resultMessage);
        }
      },
      onError: (error) => {
        toastError('데이터를 가져오는 중 오류가 발생했습니다.');
      },
    },
  );
  // partner데이터 가져오기
  const {
    data: fetchPartnerData,
    isSuccess: isFetchPartnerDataSuccess,
    refetch: printRefetch,
  } = useQuery(
    ['/mypage/partner/printInfo', session?.user?.partnerId],
    () =>
      authApi.get(`/mypage/partner/printInfo`, {
        params: { partnerId: session?.user?.partnerId },
      }),
    {
      enabled: !!session?.user?.partnerId, // partnerId가 있어야 쿼리 실행
    },
  );
  useEffect(() => {
    if (fetchPartnerData) {
      const { body, resultCode, resultMessage } = fetchPartnerData.data;
      if (resultCode === 200) {
        setValue('compPrnCd', body.compPrnCd);
        setValue('samplePrnYn', body.samplePrnYn);
      } else {
        toastError(resultMessage);
      }
    }
  }, [fetchPartnerData]);

  /** 파일 조회하기 (by 변수) */
  const fetchData = async (fileId: number | undefined) => {
    if (!fileId) {
      console.warn('fileId가 유효하지 않음. 함수 종료.');
      return;
    }

    try {
      const { data: selectFile } = await authApi.get(`/common/file/${fileId}`, {});
      const { resultCode, body, resultMessage } = selectFile;

      if (resultCode === 200) {
        const url = await getFileUrl(body[0].sysFileNm);
        setFileUrl(url);
      } else {
        toastError(resultMessage);
      }
    } catch (error) {
      console.error('API 요청 중 에러 발생:', error);
    }
  };

  // 파일업로드
  const handleChildValueChange = (fileInfo: CommonResponseFileDown) => {
    const values = getValues();
    reset({
      ...values,
      fileId: fileInfo.fileId,
    });
    fetchData(fileInfo.fileId);
  };

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
        toastSuccess('이미지가 삭제되었습니다.');
        reset({ ...getValues(), fileId: undefined }); // fileId 초기화
        setFileUrl(''); // 파일 미리보기 삭제
      },
      onError: (error) => {
        console.error('파일 삭제 실패:', error);
      },
    },
  );

  /** 전표 수정 */
  const updatePartnerPrint = async (data: ReceiptDataFields) => {
    const response = await authApi.put('/mypage/partner/print', data);
    return response.data;
  };
  const { mutate: updatePartnerPrintMutate, isLoading } = useMutation(updatePartnerPrint, {
    onSuccess: async (data) => {
      try {
        if (data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
        } else {
          toastError(data.resultMessage);
          throw new Error(data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
    onError: () => {
      toastError('저장 중 오류가 발생했습니다.');
    },
  });

  const onValid = (data: ReceiptDataFields) => {
    console.log('저장데이터', data);
    updatePartnerPrintMutate(data);
  };

  return (
    <PopupLayout
      width={800}
      isEscClose={true}
      open={open}
      title={'전표만들기'}
      onClose={onClose}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" onClick={handleSubmit(onValid)}>
              {'저장'}
            </button>
            <button className="btn" onClick={onClose}>
              {'닫기'}
            </button>
          </div>
        </PopupFooter>
      }
    >
      <div className="partnerPrintDiv">
        <div className="receiptPreview">
          <h4>
            <span>영</span>
            <span>수</span>
            <span>증</span>
          </h4>
          <ul className="header">
            <li>
              <strong>판매처</strong>귀하
            </li>
            <li>
              <span>0001</span>
              <span>2024-08-01(목) 13:18:37</span>
            </li>
          </ul>
          <div className="titleArea">
            {imageChecked === 'Y' ? (
              <div className={`qrCodeArea center`}>
                <img src={fileUrl} alt="이미지" />
              </div>
            ) : (
              ''
            )}
            <div className="logoArea">{titleChecked === 'Y' ? <>{titleMngInp}</> : ''}</div>
            <div className="topMessageArea">{topMngChecked === 'Y' ? <>{topMngInp}</> : ''}</div>
          </div>
          <div className="tblArea">
            <table>
              <colgroup>
                <col width="*" />
                <col width="15%" />
                <col width="10%" />
                <col width="20%" />
              </colgroup>
              <thead>
                <tr>
                  <th className="agnL">24-08-01(목)</th>
                  <th colSpan={2} className="agnR">
                    112,000
                  </th>
                  <th>청구</th>
                </tr>
                <tr>
                  <th>품명</th>
                  <th>단가</th>
                  <th>수량</th>
                  <th>금액</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4}>단가라롱티/WH/S</td>
                </tr>
                <tr>
                  <td></td>
                  <td className="agnC">13,500</td>
                  <td className="agnC">2</td>
                  <td className="agnR">27,000</td>
                </tr>
                <tr>
                  <td colSpan={4}>정일자반바지/BK/27</td>
                </tr>
                <tr>
                  <td></td>
                  <td className="agnC">25,000</td>
                  <td className="agnC">1</td>
                  <td className="agnR">25,000</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="etcArea">
            <dl>
              <dt>
                <span>전</span>
                <span>잔</span>
              </dt>
              <dd>112,000</dd>
            </dl>
            <dl>
              <dt>
                <span>당</span>
                <span>일</span>
                <span>합</span>
                <span>계</span>
              </dt>
              <dd>112,000</dd>
            </dl>
            <dl>
              <dt>
                <span>현</span>
                <span>금</span>
                <span>금</span>
                <span>액</span>
              </dt>
              <dd>112,000</dd>
            </dl>
            <dl>
              <dt>
                <span>당</span>
                <span>잔</span>
              </dt>
              <dd>112,000</dd>
            </dl>
          </div>
          <div className="footer">{bottomMngChecked === 'Y' ? <>{bottomMngInp}</> : ''}</div>
        </div>
        <div className="setting">
          <section>
            <dl>
              <dt>
                <span>이미지</span>
                <CustomCheckBox<ReceiptDataFields>
                  control={control}
                  name="logoprintyn"
                  checked={imageChecked === 'Y'}
                  onCheckedChange={(checked) => {
                    const value = checked ? 'Y' : 'N';
                    setImageChecked(value);
                  }}
                  label="인쇄"
                ></CustomCheckBox>
              </dt>
              <dd>
                <div className="imageGroup">
                  <div className="imgBox">
                    <span className={`img ${fileUrl ? 'on' : ''}`} onClick={() => commonOpenModal('UPLOAD')}>
                      <img src={fileUrl} />
                    </span>
                    <button
                      onClick={() => {
                        deleteFileMutation.mutate({
                          fileId: String(getValues('fileId')),
                          sysFileNm: fileUrl,
                        });
                      }}
                    >
                      닫기
                    </button>
                  </div>
                  <div className="message">* 이미지등록 시 250 * 120을 권장합니다</div>
                </div>
              </dd>
            </dl>
          </section>
          <section>
            <dl>
              <dt>
                <span>전표 타이틀</span>
                <CustomCheckBox<ReceiptDataFields>
                  control={control}
                  checked={titleChecked === 'Y'}
                  onCheckedChange={(checked) => {
                    const value = checked ? 'Y' : 'N';
                    setTitleChecked(value);
                  }}
                  name="titleYn"
                  label="인쇄"
                ></CustomCheckBox>
              </dt>
              <dd>
                <FormInput<ReceiptDataFields>
                  control={control}
                  name={'titleMng'}
                  placeholder={'상호를 적어주세요 (1줄 인쇄)'}
                  onChange={(e) => {
                    setTitleMngInp(e.target.value);
                  }}
                />
              </dd>
            </dl>
          </section>
          <section>
            <dl>
              <dt>
                <span>상단 메세지</span>
                <CustomCheckBox<ReceiptDataFields>
                  control={control}
                  name="topYn"
                  checked={topMngChecked === 'Y'}
                  onCheckedChange={(checked) => {
                    const value = checked ? 'Y' : 'N';
                    setTopMngChecked(value);
                  }}
                  label="인쇄"
                ></CustomCheckBox>
              </dt>
              <dd>
                <TextArea<ReceiptDataFields>
                  control={control}
                  name={'topMng'}
                  placeholder={'예) KAKAO TALK ID : bkmond\n' + '       KAKAO STORY ID : bkmond\n' + '       WECHAT ID : FRILLMOND24\n'}
                  onChange={(e) => {
                    setTopMngInp(e.target.value);
                  }}
                />
              </dd>
            </dl>
          </section>
          <section>
            <dl>
              <dt>
                <span>하단 메세지</span>
                <CustomCheckBox<ReceiptDataFields>
                  control={control}
                  name="bottomYn"
                  checked={bottomMngChecked === 'Y'}
                  onCheckedChange={(checked) => {
                    const value = checked ? 'Y' : 'N';
                    setBottomMngChecked(value);
                  }}
                  label="인쇄"
                ></CustomCheckBox>
              </dt>
              <dd>
                <TextArea<ReceiptDataFields>
                  control={control}
                  name={'bottomMng'}
                  placeholder={
                    '예) 입금처 : 신한은행 백병근 110-426-127814\n' +
                    '        통장입금시 꼭 자료를 발행 받아야 합니다\n' +
                    '        자료발행은 매달10일날 마감합니다.'
                  }
                  onChange={(e) => {
                    setBottomMngInp(e.target.value);
                  }}
                />
              </dd>
            </dl>
          </section>
          <section className="info">
            <ul>
              <li>
                <FormDropDown<ReceiptDataFields>
                  control={control}
                  title={'동일상품 SKU 정보'}
                  name={'samplePrnYn'}
                  options={[
                    { value: 'Y', label: '인쇄함' },
                    { value: 'N', label: '인쇄안함' },
                  ]}
                />
              </li>
              <li>
                <FormDropDown<ReceiptDataFields>
                  control={control}
                  title={'혼용율 정보'}
                  name={'compPrnCd'}
                  options={[
                    { value: 'A', label: '신규거래상품만 인쇄' },
                    { value: 'B', label: '샘플전표만 인쇄' },
                    { value: 'C', label: '인쇄안함' },
                  ]}
                />
              </li>
            </ul>
          </section>
        </div>
      </div>
      {commonModalType.type === 'UPLOAD' && commonModalType.active && (
        <FileUploadPop key={commonModalType.type + 'voucher'} imageFileHeight={150} imageFileWidth={250} onValueChange={handleChildValueChange} />
      )}
    </PopupLayout>
  );
};

export default VoucherSetting;
