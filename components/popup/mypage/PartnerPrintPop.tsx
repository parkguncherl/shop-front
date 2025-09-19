import React, { useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { Button } from '../../Button';
import { PopupLayout } from '../PopupLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAppStore from '../../../stores/useAppStore';
import { authApi, YupSchema } from '../../../libs';
import { toastError, toastSuccess } from '../../ToastMessage';
import { ApiResponseSelectPartnerPrint, CommonResponseFileDown, MypagePrintSetUpdateRequest } from '../../../generated';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import FormInput from '../../FormInput';
import TextArea from '../../TextArea';
import CustomCheckBox from '../../CustomCheckBox';
import DropDownAtom from '../../atom/DropDownAtom';
import { useCommonStore } from '../../../stores';
import { FileUploadPop } from '../common';
import PrintLayout from '../../print/PrintLayout';
import * as yup from 'yup';

interface Props {
  open: boolean;
  onClose: () => void;
}

type ReceiptDataFields = MypagePrintSetUpdateRequest;

const PartnerPrintPop = ({ open = false, onClose }: Props) => {
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
      authApi.get<ApiResponseSelectPartnerPrint>(`/mypage/partner/print`, {
        params: { partnerId: session?.user?.partnerId },
      }),
    {
      enabled: !!session?.user?.partnerId, // partnerId가 있어야 쿼리 실행
      onSuccess: (e) => {
        const { body, resultCode, resultMessage } = e.data;
        if (resultCode === 200) {
          reset({
            id: body?.id,
            partnerId: body?.partnerId,
            fileId: body?.fileId,
            logoprintyn: body?.logoprintyn,
            logoLocCd: body?.logoLocCd,
            titleYn: body?.titleYn,
            titleMng: body?.titleMng,
            titleNor: body?.titleNor,
            topYn: body?.topYn,
            topMng: body?.topMng,
            topNor: body?.topNor,
            bottomYn: body?.bottomYn,
            bottomMng: body?.bottomMng,
            bottomNor: body?.bottomNor,
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

  /** 파일 조회하기 (by 변수) */
  const fetchData = async (fileId: number | undefined) => {
    if (!fileId) {
      console.warn('fileId가 유효하지 않음. 함수 종료.');
      return;
    }

    try {
      console.log('API 요청 시작: /common/file/' + fileId);
      const { data: selectFile } = await authApi.get(`/common/file/${fileId}`, {});
      console.log('API 응답 데이터:', selectFile);

      const { resultCode, body, resultMessage } = selectFile;

      if (resultCode === 200) {
        console.log('resultCode 200 확인, 파일 URL 가져오는 중...');
        const url = await getFileUrl(body[0].sysFileNm);
        console.log('가져온 파일 URL:', url);
        setFileUrl(url);
      } else {
        console.error('API 응답 실패:', resultMessage);
        toastError(resultMessage);
      }
    } catch (error) {
      console.error('API 요청 중 에러 발생:', error);
    }
  };

  // 이미지 정렬 드롭다운
  const dropdownOptions = [
    { key: 'L', value: 'L', label: '왼쪽' },
    { key: 'C', value: 'C', label: '가운데' },
    { key: 'R', value: 'R', label: '오른쪽' },
  ];

  /** 전표 수정 */
  const queryClient = useQueryClient();
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
    console.log(data);
    //updatePartnerPrintMutate(data);
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

  return (
    <PopupLayout
      width={1000}
      isEscClose={true}
      open={open}
      title={'전표양식 설정'}
      onClose={onClose}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" onClick={handleSubmit(onValid)}>
              {'저장'}
            </button>
            <button className="btn">{'테스트 인쇄'}</button>
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
            <div
              className={`qrCodeArea ${
                imageLocationChecked === 'L' ? 'left' : imageLocationChecked === 'C' ? 'center' : imageLocationChecked === 'R' ? 'right' : ''
              }`}
            >
              {imageChecked === 'Y' ? (
                <>
                  <img src={fileUrl} alt="이미지" />
                </>
              ) : (
                ''
              )}
            </div>
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
          <div className="section">
            <div className="chkArea">
              <div>
                <span>
                  <CustomCheckBox<ReceiptDataFields>
                    control={control}
                    name="logoprintyn"
                    checked={imageChecked === 'Y'}
                    onCheckedChange={(checked) => {
                      const value = checked ? 'Y' : 'N';
                      setImageChecked(value);
                    }}
                    label="이미지 인쇄"
                  ></CustomCheckBox>
                </span>
                <span>
                  <span className="formBox border">
                    <DropDownAtom
                      name="logoLocCd"
                      placeholder="이미지 정렬"
                      options={dropdownOptions}
                      defaultValue={imageLocationChecked}
                      onChangeControl={(value) => {
                        setImageLocationChecked(value);
                        setValue('logoLocCd', value);
                      }}
                    />
                  </span>
                </span>
              </div>
              <button className="btn" onClick={() => commonOpenModal('UPLOAD')}>
                파일 업로드
              </button>
            </div>
            <div
              className={`content imgArea ${
                imageLocationChecked === 'L' ? 'left' : imageLocationChecked === 'C' ? 'center' : imageLocationChecked === 'R' ? 'right' : ''
              }`}
            >
              <div className="imageArea">
                <img src={fileUrl} alt="이미지" />
              </div>
            </div>
          </div>

          <div className="section">
            <div className="chkArea">
              <span>
                <CustomCheckBox<ReceiptDataFields>
                  control={control}
                  checked={titleChecked === 'Y'}
                  onCheckedChange={(checked) => {
                    const value = checked ? 'Y' : 'N';
                    setTitleChecked(value);
                  }}
                  name="titleYn"
                  label="전표타이틀 인쇄"
                ></CustomCheckBox>
              </span>
            </div>
            <div className="content">
              <div className="formBox">
                <span className="spanTitle">관리판매처시</span>
                <FormInput<ReceiptDataFields>
                  control={control}
                  name={'titleMng'}
                  onChange={(e) => {
                    setTitleMngInp(e.target.value);
                  }}
                />
              </div>
              <div className="formBox">
                <span className="spanTitle">일반판매처시</span>
                <FormInput<ReceiptDataFields> control={control} name={'titleNor'} />
              </div>
            </div>
          </div>

          <div className="section">
            <div className="chkArea">
              <span>
                <CustomCheckBox<ReceiptDataFields>
                  control={control}
                  checked={topMngChecked === 'Y'}
                  onCheckedChange={(checked) => {
                    const value = checked ? 'Y' : 'N';
                    setTopMngChecked(value);
                  }}
                  name="topYn"
                  label="상단메세지 인쇄"
                ></CustomCheckBox>
              </span>
            </div>
            <div className="content">
              <div className="formBox">
                <span className="spanTitle">관리판매처시</span>
                <TextArea<ReceiptDataFields>
                  control={control}
                  name={'topMng'}
                  onChange={(e) => {
                    setTopMngInp(e.target.value);
                  }}
                />
              </div>
              <div className="formBox">
                <span className="spanTitle">일반판매처시</span>
                <TextArea<ReceiptDataFields> control={control} name={'topNor'} />
              </div>
            </div>
          </div>

          <div className="section">
            <div className="chkArea">
              <span>
                <CustomCheckBox<ReceiptDataFields>
                  control={control}
                  checked={bottomMngChecked === 'Y'}
                  onCheckedChange={(checked) => {
                    const value = checked ? 'Y' : 'N';
                    setBottomMngChecked(value);
                  }}
                  name="bottomYn"
                  label="하단메세지 인쇄"
                ></CustomCheckBox>
              </span>
            </div>
            <div className="content">
              <div className="formBox">
                <span className="spanTitle">관리판매처시</span>
                <TextArea<ReceiptDataFields>
                  control={control}
                  name={'bottomMng'}
                  onChange={(e) => {
                    setBottomMngInp(e.target.value);
                  }}
                />
              </div>
              <div className="formBox border">
                <span className="spanTitle">일반판매처시</span>
                <TextArea<ReceiptDataFields> control={control} name={'bottomNor'} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {commonModalType.type === 'UPLOAD' && commonModalType.active && <FileUploadPop onValueChange={handleChildValueChange} />}
    </PopupLayout>
  );
};

export default PartnerPrintPop;
