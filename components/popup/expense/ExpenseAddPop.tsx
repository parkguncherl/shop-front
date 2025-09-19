/**
 * 매장입출금 등록 팝업
 */
import { useExpenseStore } from '../../../stores/useExpenseStore';
import { SubmitHandler, useForm } from 'react-hook-form';
import { ExpenseRequestCreate, ExpenseResponseDetail } from '../../../generated';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../../libs';
import { PopupLayout } from '../PopupLayout';
import { PopupFooter } from '../PopupFooter';
import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../ToastMessage';
import { PopupContent } from '../PopupContent';
import { PARTNER_CODE, Placeholder } from '../../../libs/const';
import FormInput from '../../FormInput';
import { DropDownOption } from '../../../types/DropDownOptions';
import { useSession } from 'next-auth/react';
import { Utils } from '../../../libs/utils';
import PopupFormBox from '../content/PopupFormBox';
import PopupFormGroup from '../content/PopupFormGroup';
import PopupFormType from '../content/PopupFormType';
import CustomDebounceSelect, { DebounceSelectRefInterface } from '../../CustomDebounceSelect';
import { usePartnerCodeStore } from '../../../stores';
import { InputRef } from 'antd';

interface Props {
  children?: React.ReactNode;
  selectedExpenseId?: number;
  selectedFrequency?: number;
  setSelectedFrequency?: React.Dispatch<React.SetStateAction<number | undefined>>;
}

const ExpenseAddPop = ({ children, selectedExpenseId: id, selectedFrequency, setSelectedFrequency }: Props) => {
  const defaultOption: DropDownOption = { key: '', value: '', label: '선택' };
  const [partnerCodeOptions, setPartnerCodeOptions] = useState<DropDownOption[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseResponseDetail>();
  const comboRef = useRef<DebounceSelectRefInterface>(null); // ✅ 올바른 타입
  const inAmtRef = useRef<InputRef>(null);
  const outAmtRef = useRef<InputRef>(null);
  const noteCntnRef = useRef<InputRef>(null);
  const buttonConfConfirmRef = useRef<HTMLButtonElement>(null);
  const buttonConfCancelRef = useRef<HTMLButtonElement>(null);

  const session = useSession();
  const [modalType, closeModal, createExpense] = useExpenseStore((s) => [s.modalType, s.closeModal, s.createExpense]);

  const {
    control,
    handleSubmit,
    setValue,
    // formState: { errors, isValid },
  } = useForm<ExpenseRequestCreate>({
    resolver: yupResolver(YupSchema.ExpenseRequest()), // 수정완료
    defaultValues: {
      accountCd: selectedFrequency ? selectedFrequency.toString() : undefined,
      inAmt: 0,
      outAmt: 0,
    },
    mode: 'onSubmit',
  });

  // 계정목록 드롭다운 데이터 조회
  const [partnerCodeList, setPartnerCodeList] = useState([]);
  const [textAreaValues, setTextAreaValues] = useState<{
    partnerCode: string;
  }>({
    partnerCode: '',
  });
  const [selectedValues, setSelectedValues] = useState<{ [key: string]: any }>({
    partnerCode: '',
  });
  const fetchPartnerCode = async () => {
    const { data: partnerCodeList } = await authApi.get(`/partnerCode/${PARTNER_CODE.expense}`, {});

    const { resultCode, body, resultMessage } = partnerCodeList;
    if (resultCode === 200) {
      const options: DropDownOption[] = body.map((item: any) => ({
        key: item.codeCd,
        value: item.codeCd,
        label: item.codeNm,
      }));
      setPartnerCodeOptions([defaultOption, ...options]);
      setPartnerCodeList(body);
    } else {
      toastError(resultMessage);
    }
  };
  useEffect(() => {
    if (partnerCodeList) {
      const list = partnerCodeList.map((item: any) => item.codeNm);
      // 각 codeNm을 \n으로 연결하여 문자열로 만듬
      const codeList = list.join('\n');
      setTextAreaValues((prev) => ({ ...prev, ['partnerCode']: codeList }));
      if (selectedFrequency) {
        const codeCd: any = partnerCodeList.find((item: any) => item.codeCd === selectedFrequency) || '';
        setSelectedValues({ ['partnerCode']: codeCd.codeNm });
      }
    }
  }, [partnerCodeList]);

  // 계정과목 저장(수정)
  const [savePartnerCode, updatePartnerCodeToDeletedStatus] = usePartnerCodeStore((s) => [s.savePartnerCode, s.updatePartnerCodeToDeletedStatus]);
  const { mutate: savePartnerCodeMutate } = useMutation(savePartnerCode, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        await queryClient.invalidateQueries(['/orderInfo/expense/paging']);
        fetchPartnerCode();
      } else {
        toastError(e.data.resultMessage);
      }
      await fetchPartnerCode();
    },
    onError: (err) => {
      toastError('저장 중 오류가 발생했습니다.');
      console.error(err);
    },
  });

  // 저장 이벤트
  const onSaveClick = async (item: any) => {
    // partnerCode를 \n 기준으로 나눔
    const newCodes = item.partnerCode.split('\n');

    // 현재 partnerCodeList에서 가장 높은 codeOrder 찾기
    const maxOrder = partnerCodeList.length > 0 ? Math.max(...partnerCodeList.map((item: any) => item.codeOrder || 0)) : 0;

    // partnerCodeList의 각 항목과 비교해서 처리
    const updatedList = partnerCodeList.map((item: any) => {
      // 해당 partnerCode가 newCodes에 있으면 그대로 두고, 없으면 deleteYn: "Y"로 처리
      if (newCodes.includes(item.codeNm)) {
        return { ...item, delYn: item.deleteYn || 'N' }; // 기존 항목은 deleteYn을 유지, 없으면 'N' 설정
      } else {
        return { ...item, delYn: 'Y' }; // 없으면 deleteYn: 'Y'로 설정
      }
    });

    // 새로운 항목 추가 (partnerCodeList에 존재하지 않는 항목들)
    let newOrder = maxOrder + 1;
    newCodes.forEach((newCode: string) => {
      if (!partnerCodeList.some((item: any) => item.codeNm === newCode)) {
        updatedList.push({ codeNm: newCode, delYn: 'N', codeUpper: 'P0001', codeOrder: newOrder++, codeCd: newOrder++ }); // 새로운 항목은 delYn: "N"
      }
    });
    savePartnerCodeMutate({ partnerCodeLowerSelectList: updatedList });
  };

  /** 계정과목 관련 */
  const handleSelectChange = (name: string, value: string) => {
    setSelectedValues((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    const matchedOption = partnerCodeOptions.find((option) => option.label === value);
    const matchedValue = matchedOption ? matchedOption.value : null;
    console.log(value, matchedValue);
    setValue('accountCd', matchedValue as string | undefined);
    inAmtRef.current?.focus();
  };

  // 상세데이타 조회
  const fetchExpenseDetail = async () => {
    const { data: expenseDetail } = await authApi.get(`/orderInfo/expense/detail/${id}`);
    const { resultCode, body, resultMessage } = expenseDetail;
    if (resultCode === 200) {
      setExpenseData(body);
    } else {
      toastError(resultMessage);
    }
  };
  useEffect(() => {
    fetchPartnerCode();
    if (id) {
      fetchExpenseDetail();
    }

    comboRef.current?.focusOnInput();
  }, []);

  // 매장입출금 등록
  const queryClient = useQueryClient();
  const { mutate: createExpenseMutate } = useMutation(createExpense, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        await queryClient.invalidateQueries({ queryKey: ['/orderInfo/expense/paging'] });
        closeModal('ADD');
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err) => {
      console.error(err);
      toastError('등록 중 오류가 발생하였습니다.');
    },
  });

  const [isAccountCd, setIsAccountCd] = useState<boolean>(false);
  const onValid: SubmitHandler<ExpenseRequestCreate> = (data) => {
    setIsAccountCd(false);
    // data.accountCd = selectedValues.partnerCode;
    console.log('submit data:', data);
    if (Number(data.inAmt) === 0 && Number(data.outAmt) === 0) {
      toastError('입금금액과 출금금액 중 하나는 입력해야 합니다.');
      return;
    }
    if (!data.accountCd) {
      toastError('과목을 선택해주세요.');
      setIsAccountCd(true);
      return;
    }

    if (modalType.type === 'ADD') {
      createExpenseMutate({
        ...data,
        inAmt: Number(Utils.removeComma(data.inAmt?.toString() || '0')),
        outAmt: Number(Utils.removeComma(data.outAmt?.toString() || '0')),
      });
    } else {
      toastError('저장 중 오류가 발생하였습니다.');
    }
  };

  const handleArrowKey = (event: KeyboardEvent) => {
    console.log('event.key=======>', event.key);
    if (event.key === 'Escape') {
      if (closeModal) {
        closeModal('ADD');
      }
    } else if (event.key === 'ArrowLeft') {
      buttonConfConfirmRef.current?.focus();
    } else if (event.key === 'ArrowRight') {
      buttonConfCancelRef.current?.focus();
    }
  };

  useEffect(() => {
    if (modalType.active) {
      // 키 이벤트 리스너 추가
      window.addEventListener('keydown', handleArrowKey);
      return () => {
        // 컴포넌트 언마운트 시 이벤트 리스너 제거, 중복 클릭 방지를 위한 ref 를 초기화
        window.removeEventListener('keydown', handleArrowKey);
      };
    }
  }, [open]);

  return (
    <PopupLayout
      width={650}
      isEscClose={true}
      open={modalType.type === 'ADD'}
      title={'매장입출금 등록'}
      onClose={() => closeModal('ADD')}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" title="저장" onClick={handleSubmit(onValid)} ref={buttonConfConfirmRef}>
              저장
            </button>
            <button
              className="btn"
              title="닫기"
              onClick={() => {
                if (setSelectedFrequency) {
                  setSelectedFrequency(0);
                }
                closeModal('ADD');
              }}
              ref={buttonConfCancelRef}
            >
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className={'popTopRight sel'}>
          {/*<FormDropDown<ExpenseRequestCreate>*/}
          {/*  control={control}*/}
          {/*  name={'accountCd'}*/}
          {/*  defaultOptions={[...DefaultOptions.Select]}*/}
          {/*  options={partnerCodeOptions}*/}
          {/*  required={true}*/}
          {/*/>*/}
          <CustomDebounceSelect
            type={'form'}
            fetchOptions={textAreaValues.partnerCode}
            onChange={(value) => handleSelectChange('partnerCode', value)}
            onEditItem={(item) => {
              onSaveClick({ ['partnerCode']: item });
            }}
            onSearchChange={(newSearchValue: any) => {
              setSelectedValues((prevSelectedValues) => ({
                ...prevSelectedValues,
                partnerCode: newSearchValue,
              }));
            }}
            defaultValue={selectedValues.partnerCode}
            placeholder={'유형선택1'}
            className={`${isAccountCd ? 'error' : ''}`}
            ref={comboRef}
          />
        </div>
        <PopupFormBox>
          <PopupFormGroup>
            <PopupFormType className={'type2'}>
              <FormInput<ExpenseRequestCreate>
                control={control}
                name={'inAmt'}
                label={'입금'}
                placeholder={''}
                inputType={'number'}
                price={true}
                priceTxt={'원'}
                ref={inAmtRef}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    outAmtRef.current?.focus();
                  }
                }}
              />
              <FormInput<ExpenseRequestCreate>
                control={control}
                name={'outAmt'}
                label={'출금'}
                placeholder={''}
                inputType={'number'}
                price={true}
                priceTxt={'원'}
                ref={outAmtRef}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    noteCntnRef.current?.focus();
                  }
                }}
              />
            </PopupFormType>
            <PopupFormType className={'type1'}>
              <FormInput<ExpenseRequestCreate>
                control={control}
                name={'noteCntn'}
                label={'비고'}
                placeholder={Placeholder.Input || ''}
                maxLength={1000}
                ref={noteCntnRef}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // ✅ 기본 동작(버튼 클릭) 막기
                    buttonConfConfirmRef.current?.focus();
                  }
                }}
              />
            </PopupFormType>
          </PopupFormGroup>
        </PopupFormBox>
      </PopupContent>
    </PopupLayout>
  );
};

export default ExpenseAddPop;
