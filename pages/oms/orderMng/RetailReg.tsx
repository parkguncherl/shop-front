import React, { useEffect, useState } from 'react';
import { useCommonStore } from '../../../stores';
import { Title, toastError, toastSuccess } from '../../../components';
import FormInput from '../../../components/FormInput';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../../libs';
import { RetailRequestCreate } from '../../../generated';
import FormDropDown from '../../../components/FormDropDown';
import { useMutation } from '@tanstack/react-query';
import { useRetailStore } from '../../../stores/useRetailStore';
import { useRouter } from 'next/router';

const RetailReg = () => {
  const router = useRouter();

  /** 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  const [insertRetail] = useRetailStore((s) => [s.insertRetail]);

  const {
    control,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<RetailRequestCreate>({
    resolver: yupResolver(YupSchema.RetailInsertRequest()), // 완료
    defaultValues: {},
    mode: 'onSubmit',
  });

  /** 소매처(seller) 추가 */
  const { mutate: postSellerRequestForInsert, isLoading: postSellerRequestForInsertIsInLoading } = useMutation(insertRetail, {
    onSuccess: async (e) => {
      try {
        const { resultCode, body, resultMessage } = e.data;
        if (resultCode === 200) {
          toastSuccess('소매처 등록에 성공하였습니다.');
          reset(undefined);
        } else {
          console.log(e);
          toastError('문제 발생, 소매처 이름 중복 여부를 확인하십시요.');
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  return (
    <>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} detail={true} />

      <h4 className="smallTitle">소매처 신규 등록</h4>
      <div className="tblBox mt10">
        <table>
          <caption></caption>
          <colgroup>
            <col width="15%" />
            <col width="35%" />
            <col width="15%" />
            <col width="35%" />
          </colgroup>
          <tbody>
            <tr>
              <th className="agnL">업체명</th>
              <td>
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'sellerNm'} />
              </td>
              <th className="agnL">비고(계좌)</th>
              <td className="agnR">
                <FormInput<RetailRequestCreate> control={control} inputType={'textarea'} name={'etcAccCntn'} />
              </td>
            </tr>
            <tr>
              <th className="agnL">판매처 구분</th>
              <td className="agnR">
                {/*                <FormDropDown<RetailRequestCreate> control={control} codeUpper={'10200'} type={'single'} name={'sellerTp'} />*/}
              </td>
              <th className="agnL">업태</th>
              <td>
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'busiTypeNm'} />
              </td>
            </tr>
            <tr>
              <th className="agnL">판매처 유형 코드</th>
              <td className="agnR">{/*<FormDropDown<RetailRequestCreate> control={control} codeUpper={'10330'} type={'single'} name={'sellerCd'} />*/}</td>
              <th className="agnL">종목</th>
              <td>
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'busiSectNm'} />
              </td>
            </tr>
            <tr>
              <th className="agnL">회사 이메일</th>
              <td>
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'compEmail'} />
              </td>
              <th className="agnL">휴면여부</th>
              <td>
                <FormDropDown<RetailRequestCreate> control={control} codeUpper={'10330'} type={'single'} name={'sleepYn'} />
              </td>
            </tr>
            <tr>
              <th className="agnL">결제대행업체</th>
              <td>
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'payAgency'} />
              </td>
              <th className="agnL">혼용율 인쇄코드</th>
              <td>
                <FormDropDown<RetailRequestCreate> control={control} codeUpper={'10320'} type={'single'} name={'compPrnCd'} />
              </td>
            </tr>
            <tr>
              <th className="agnL">판매처 팩스 번호</th>
              <td className="agnR">
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'sellerFaxNo'} placeholder={'- 없이 숫자만 입력'} />
              </td>
              <th className="agnL">잔액인쇄 YN</th>
              <td>
                <FormDropDown<RetailRequestCreate> control={control} codeUpper={'10330'} type={'single'} name={'remainYn'} />
              </td>
            </tr>
            <tr>
              <th className="agnL">판매처 주소</th>
              <td className="agnR">
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'sellerAddr'} />
              </td>
              <th className="agnL">처리확인 YN</th>
              <td>
                <FormDropDown<RetailRequestCreate> control={control} codeUpper={'10330'} type={'single'} name={'treatYn'} />
              </td>
            </tr>
            <tr>
              <th className="agnL">회사 전화번호</th>
              <td className="agnR">
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'sellerTelNo'} placeholder={'- 없이 숫자만 입력'} />
              </td>
              <th className="agnL">계산서 YN</th>
              <td>
                <FormDropDown<RetailRequestCreate> control={control} codeUpper={'10330'} type={'single'} name={'billYn'} />
              </td>
            </tr>
            <tr>
              <th className="agnL">대표</th>
              <td className="agnR">
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'ceoNm'} />
              </td>
              <th className="agnL">부가세 YN</th>
              <td>
                <FormDropDown<RetailRequestCreate> control={control} codeUpper={'10330'} type={'single'} name={'vatYn'} />
              </td>
            </tr>
            <tr>
              <th className="agnL">담당자</th>
              <td className="agnR">
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'personNm'} />
              </td>
              <th className="agnL">금액상한</th>
              <td>
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'limitAmt'} />
              </td>
            </tr>
            <tr>
              <th className="agnL">담당자 연락처</th>
              <td className="agnR">
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'personTelNo'} placeholder={'- 없이 숫자만 입력'} />
              </td>
              <th className="agnL">현매입액</th>
              <td>
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'purchaseAmt'} />
              </td>
            </tr>
            <tr>
              <th className="agnL">대표 연락처</th>
              <td className="agnR">
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'ceoTelNo'} placeholder={'- 없이 숫자만 입력'} />
              </td>
              <th className="agnL">VAT 잔</th>
              <td>
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'vatNowAmt'} />
              </td>
            </tr>
            <tr>
              <th className="agnL">사업자 번호</th>
              <td className="agnR">
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'compNo'} />
              </td>
              <th className="agnL">현잔</th>
              <td>
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'nowAmt'} />
              </td>
            </tr>
            <tr>
              <th className="agnL">비고(화면)</th>
              <td className="agnR">
                <FormInput<RetailRequestCreate> control={control} inputType={'textarea'} name={'etcScrCntn'} />
              </td>
              <th className="agnL">파일 ID</th>
              <td>
                <FormInput<RetailRequestCreate> control={control} inputType={'single'} name={'fileId'} />
              </td>
            </tr>
            <tr>
              <th className="agnL">비고(전표)</th>
              <td className="agnR">
                <FormInput<RetailRequestCreate> control={control} inputType={'textarea'} name={'etcChitCntn'} />
              </td>
              <th className="agnL"></th>
              <td className="agnR" />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="btnArea right mt20 big">
        <button
          className="btn"
          onClick={() => {
            router.push('/orderMng/retail');
          }}
        >
          목록
        </button>
        <button
          className="btn"
          onClick={() => {
            reset(undefined);
          }}
        >
          취소
        </button>
        <button
          onClick={(event) => {
            handleSubmit((data) => {
              postSellerRequestForInsert(data);
            })(event);
          }}
          className="btn btnBlue"
        >
          {'저장'}
        </button>
      </div>
    </>
  );
};

export default RetailReg;
