import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePaymentStore } from '../../../stores/usePaymentStore';
import { toastError, toastSuccess } from '../../ToastMessage';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { FieldError, SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { PayRequestCreate, PayRequestUpdate, RetailResponsePaging } from '../../../generated';
import { Utils } from '../../../libs/utils';
import { PopupLayout } from '../PopupLayout';
import { PopupFooter } from '../PopupFooter';
import { Tooltip } from 'react-tooltip';
import { PopupContent } from '../PopupContent';
import FormInput from '../../FormInput';
import { InputRef, Switch } from 'antd';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { usePartnerStore } from '../../../stores/usePartnerStore';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../libs';
import CustomDebounceSelect from '../../CustomDebounceSelect';
import TunedButtonAtom, { TunedButtonAtomRefInterface } from '../../atom/TunedButtonAtom';
import CustomNewDatePicker, { CustomNewDatePickerRefInterface } from '../../CustomNewDatePicker';

type ModalType = 'PAYMENT_CREATE' | 'PAYMENT_UPDATE';
export interface ModalTypeInterFace {
  type: ModalType;
  active: boolean;
}

interface Props {
  modalType: ModalTypeInterFace;
  OrderPrint?: (id: number) => Promise<void>;
  setPrintType?: Dispatch<SetStateAction<string>>;
  onRequestSuccess: (modalType: ModalTypeInterFace) => Promise<void> | void; // 기본적인 상태 초기화 동작 이외에는 사용자가 정의, 닫힘 동작을 실행하고자 할 시 'close' 를 return 할 것
  onClose: (closedBy?: ModalTypeInterFace) => void; // 요청 이외의 닫힘 동작(onRequestSuccess 이외) 발생 시 호출됨
  selectedRetail: RetailResponsePaging | undefined;
}

/**
 * 입금거래 팝업
 * 본 함수는 전역적 사용을 전제하므로 일부 상호작용은 사용하는 영역에서 콜백 함수를 통하여 처리하여야 한다.
 * */

export const PaymentPop = ({ modalType, OrderPrint, setPrintType, onRequestSuccess, onClose, selectedRetail }: Props) => {
  const session = useSession();
  const targetDay: string = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');
  const queryClient = useQueryClient();
  /** 결제정보 전역상태 */
  const [paymentInfo, setPaymentInfo, createPayment, updatePayment, /*closeModal, modalType,*/ getNowAmtInCondition] = usePaymentStore((s) => [
    s.paymentInfo,
    s.setPaymentInfo,
    s.createPayment,
    s.updatePayment,
    //s.closeModal,
    //s.modalType,
    s.getNowAmtInCondition,
  ]);

  /** 데이터 불러오기 */
  const [selectMyPartner, updatePartnerAll] = usePartnerStore((s) => [s.selectMyPartner, s.updatePartnerAll]);

  const {
    handleSubmit,
    control,
    //formState: { errors, isValid },
    //clearErrors,
    setValue,
    getValues,
  } = useForm<PayRequestCreate | PayRequestUpdate>({
    defaultValues: {
      cashAmt: 0,
      accountAmt: 0,
      discountAmt: 0,
      tranYmd: paymentInfo ? paymentInfo.tranYmd : targetDay, // 입금일자
      workYmd: paymentInfo ? paymentInfo.workYmd : targetDay, // 대상기간
    },
    resolver: yupResolver(YupSchema.PaymentCreateOrUpdateRequest()), // 완료
    mode: 'onSubmit',
  });

  const [etcPrnYn, setEtcPrnYn] = useState<'Y' | 'N'>('N');
  const [balance, setBalance] = useState(0); // 잔액 값을 표시하는 용도 한정
  const [nowAmt, setNowAmt] = useState(0); // 대상기간(workYmd) 기준 현잔

  const [errorMessageList, setErrorMessageList] = useState<{ name: string; message: string }[]>([]);

  const cashInp = useRef<InputRef>(null);
  const accountInp = useRef<InputRef>(null);
  const discountInfo = useRef<InputRef>(null);

  const buttonOkRef = useRef<TunedButtonAtomRefInterface>(null);
  const buttonCancelRef = useRef<HTMLButtonElement>(null);

  const workYmdDatePickerRef = useRef<CustomNewDatePickerRefInterface>(null);
  const tranYmdDatePickerRef = useRef<CustomNewDatePickerRefInterface>(null);

  /** 요청 성공 및 기타 사유로 팝업을 닫길 희망할 경우 본 함수 호출 */
  const onCloseInnerCallback = (closedBy: 'requestSuccess' | 'other') => {
    if (closedBy == 'requestSuccess') {
      // 요청 성공으로 인한 onClose
      if (modalType.type == 'PAYMENT_CREATE') {
        /** 기본 동작(토스트, 상태 초기화 등) */
        toastSuccess('저장되었습니다.');
        setPaymentInfo({});
      } else if (modalType.type == 'PAYMENT_UPDATE') {
        /** 기본 동작(토스트, 상태 초기화 등) */
        toastSuccess('수정되었습니다.');
        setPaymentInfo({});
      }
      queryClient.invalidateQueries(['/orderInfo/today/paging']); // 금일내역 쿼리 무효화(refetch)

      /** onRequestSuccess 인자 주어질 시 Promise 반환 여부에 따라 동기적인 close 동작 수행 */
      if (onRequestSuccess) {
        const returnedBehaviorElement = onRequestSuccess(modalType);
        if (returnedBehaviorElement instanceof Promise) {
          returnedBehaviorElement.then(() => {
            onClose(modalType);
          });
        } else {
          onClose(modalType);
        }
      } else {
        onClose(modalType);
      }
    } else {
      // 그 이외의 닫힘 동작
      onClose();
    }
  };

  /** 랜더링 후 즉시 실행할 동작들(modalType.active 값 변화에 의하여 트리거됨), paymentInfo 전역 상태를 의존 배열에 추가하지 말 것!(생성, 수정 요청시 전역 상태가 변할 가능성 존재 -> 의도치 않은 코드 실행 위험) */
  useEffect(() => {
    if ((modalType.type === 'PAYMENT_CREATE' || modalType.type === 'PAYMENT_UPDATE') && modalType.active) {
      setEtcInfo(); // 비고정보 호출 및 설정
      if (Object.keys(paymentInfo).length != 0) {
        /** paymentInfo 가 주어질 경우 -> 요청 시 사용할 값을 react hook form 영역에 등록 */
        setValue('id', paymentInfo.id);
        setValue('payEtc', paymentInfo.payEtc);

        setValue('etcPrintYn', paymentInfo.etcPrintYn);
        if (paymentInfo.etcPrintYn == 'Y') {
          setEtcPrnYn('Y');
        }

        setValue('discountAmt', Utils.setComma(Number(paymentInfo?.discountAmt || 0)));
        setValue('cashAmt', Utils.setComma(Number(paymentInfo?.cashAmt || 0))); // 전역상태에 값이 부재할 경우 해당합계 값을 할당
        setValue('accountAmt', Utils.setComma(Number(paymentInfo?.accountAmt || 0)));

        setValue('workYmd', paymentInfo.workYmd);
        setValue('tranYmd', paymentInfo.tranYmd);
      } else if (modalType.type === 'PAYMENT_CREATE') {
        // 기존 store 에 있던 값이 있어서 강제로 셑팅해준다.
        setValue('discountAmt', 0);
        setValue('cashAmt', 0); // 전역상태에 값이 부재할 경우 해당합계 값을 할당
        setValue('accountAmt', 0);
        setValue('workYmd', targetDay);
        setValue('tranYmd', targetDay);
      }

      if (selectedRetail) {
        getNowAmtInCondition({ sellerId: selectedRetail.id, workYmd: paymentInfo.workYmd || targetDay }).then((result) => {
          const { resultCode, body, resultMessage } = result.data;
          if (resultCode == 200) {
            const locNowAmt = Number(body || '0');
            console.log('locNowAmt=>', locNowAmt);
            setNowAmt(locNowAmt);
            if (Object.keys(paymentInfo).length === 0) {
              // paymentInfo 가 주어지지 아니한 경우
              setValue('accountAmt', Utils.setComma(Number(locNowAmt))); // 잔액 부재할 시 전역상태 값 사용
              setBalance(-((paymentInfo?.cashAmt || 0) + (paymentInfo?.discountAmt || 0))); // 현잔(예정) - (현금 + 통장입금(현잔) + 할인금액) == -(현금 + 할인)
              setTimeout(() => {
                cashInp.current?.focus();
              }, 500);
            } else {
              // 전역 상태(paymentInfo)가 주어진 경우
              setBalance(locNowAmt - ((paymentInfo?.cashAmt || 0) + (paymentInfo?.accountAmt || 0) + (paymentInfo?.discountAmt || 0))); // 현잔(예정) - (현금 + 통장입금 + 할인금액)
            }
          } else {
            toastError(resultMessage);
          }
        });
      }

      /** 화살표 키 동작을 활성화시키는 영역 */
      const handleArrowKey = (event: KeyboardEvent) => {
        const activeElement = document.activeElement;
        const inputElements = ['INPUT', 'TEXTAREA', 'SELECT'];
        // 현재active 된것들이 input 등이 아닌경우 에만 화살표 키가 먹는다.
        if (event.key === 'F10') {
          buttonOkRef.current?.other()?.click();
        } else if (!inputElements.includes(activeElement?.tagName || '')) {
          if (event.key === 'ArrowLeft') {
            buttonOkRef.current?.other()?.focus();
          }

          if (event.key === 'ArrowRight') {
            buttonCancelRef.current?.focus();
          }
        }
      };

      // F5 키 이벤트 리스너 추가
      window.addEventListener('keydown', handleArrowKey);

      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      return () => {
        window.removeEventListener('keydown', handleArrowKey);
      };
    }
  }, [modalType.active, modalType.type, selectedRetail]);

  const watchedWorkYmd = useWatch({
    name: 'workYmd',
    control,
  });

  useEffect(() => {
    if (selectedRetail?.id != undefined && watchedWorkYmd != (paymentInfo.workYmd || targetDay)) {
      // 소매처 id 타입 가드, 최초 랜더링 시점에 호출되지 않음(기본값 workYmd 와 동일 여부 검사)
      getNowAmtInCondition({ sellerId: selectedRetail.id, workYmd: dayjs(watchedWorkYmd).format('YYYY-MM-DD') }).then((result) => {
        const { resultCode, body, resultMessage } = result.data;
        if (resultCode == 200) {
          setNowAmt(Number(body));
          setBalance(Number(body) - ((paymentInfo?.cashAmt || 0) + (paymentInfo?.accountAmt || 0) + (paymentInfo?.discountAmt || 0))); // 현잔(예정) - (현금 + 통장입금 + 할인금액)
        } else {
          console.log(resultMessage);
          toastError('잔액(예정금액 호출 과정에서 문제가 발생하였습니다.');
        }
      });
    }
  }, [watchedWorkYmd]);

  const commonBehaviorOnFailure = useCallback(() => {
    // 실패할 시 '저장' 버튼 재활성화
    buttonOkRef.current?.enableClickBehavior();
  }, []);

  /** 입금거래 등록 */
  const { mutate: postPaymentRequest, isLoading: postPaymentRequestIsInLoading } = useMutation(createPayment, {
    onSuccess: async (e: any) => {
      const { resultCode, body, resultMessage } = e.data;
      if (resultCode === 200) {
        if (body && body.id && OrderPrint && setPrintType) {
          // 전표인쇄
          OrderPrint(body.id);
          setPrintType('orderPay');
        }
        /** 콜백 호출 */
        onCloseInnerCallback('requestSuccess');
      } else {
        toastError(resultMessage);
        commonBehaviorOnFailure();
      }
    },
    onError: async (e: any) => {
      console.log(e);
      toastError(e.data.resultMessage);
      commonBehaviorOnFailure();
    },
  });

  /** 입금거래 수정 */
  const { mutate: updatePaymentRequest, isLoading: updatePaymentRequestIsInLoading } = useMutation(updatePayment, {
    onSuccess: async (e: any) => {
      const { resultCode, body, resultMessage } = e.data;
      if (resultCode === 200) {
        if (body && body.id && OrderPrint && setPrintType) {
          // 전표인쇄
          OrderPrint(body.id);
          setPrintType('orderPay');
        }
        /** 콜백 호출 */
        onCloseInnerCallback('requestSuccess');
      } else {
        toastError(resultMessage);
        commonBehaviorOnFailure();
      }
    },
    onError: async (e: any) => {
      console.log(e);
      toastError(e.data.resultMessage);
      commonBehaviorOnFailure();
    },
  });

  /** 화주(비고) 수정하기 */
  const { mutate: updatePartnerEtcInfoMutate } = useMutation(updatePartnerAll, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        setEtcInfo();
      } else {
        toastError(e.data.resultMessage);
        commonBehaviorOnFailure();
      }
    },
    onError: async (e: any) => {
      toastError(e.data.resultMessage);
      commonBehaviorOnFailure();
    },
  });

  /** 비고정보 호출 및 설정 */
  const setEtcInfo = async () => {
    const { data: partnerData } = await selectMyPartner();
    const { resultCode, body, resultMessage } = partnerData;
    if (resultCode === 200) {
      if (body) {
        const infoData = (body as any).etcAccCntn || '';
        setTextAreaValues((prev) => ({ ...prev, ['payEtc']: infoData }));
      }
    } else {
      toastError(resultMessage);
    }
  };

  /** payment 를 담당하는 valid 함수의 인자 타입은 다음 유니언 타입으로 고정됨 */
  const onValidForPaymentCreate: SubmitHandler<PayRequestCreate | PayRequestUpdate> = (paymentInfo) => {
    if (selectedRetail) {
      const payRequestCreate: PayRequestCreate = { ...paymentInfo };
      const SelectedSellerId = Number(selectedRetail.id);
      if (!isNaN(SelectedSellerId)) {
        payRequestCreate.sellerId = SelectedSellerId;
      } else {
        console.log('invalid SellerId');
      }
      payRequestCreate.orderId = 0;
      payRequestCreate.inoutCd = 'D';
      payRequestCreate.returnAmt = 0;
      payRequestCreate.accountAmt = Number(Utils.removeComma((payRequestCreate.accountAmt as number).toString()));
      payRequestCreate.cashAmt = Number(Utils.removeComma((payRequestCreate.cashAmt as number).toString()));
      payRequestCreate.discountAmt = Number(Utils.removeComma((payRequestCreate.discountAmt as number).toString()));
      payRequestCreate.totAmt = 0; // 입금거래이므로 totAmt 는 0
      payRequestCreate.etcPrintYn = etcPrnYn; // 비고출력여부

      // 박근철 추가 day.js 형식으 string 이 json 변환과정에서 타임존이 변경되는 현상을 막기위해서 만든 공통함수 이용
      payRequestCreate.tranYmd = Utils.changeDayjsToString(payRequestCreate.tranYmd);
      payRequestCreate.workYmd = Utils.changeDayjsToString(payRequestCreate.workYmd);

      // payAmt 는 다음과 같은 상품을 포함하는 결제거래 시에는 총 상품금액(totAmt) - 할인금액 => 받아야할 금액
      // payAmt 는 백앤드 영역에서 처리

      setPaymentInfo({ ...payRequestCreate }); // 요청 값을 전역 상태에 할당함
      postPaymentRequest(payRequestCreate);
    } else {
      toastError('거래하실 소매처를 입력하세요.');
    }
  };

  const onValidForPaymentUpdate: SubmitHandler<PayRequestCreate | PayRequestUpdate> = (paymentInfo) => {
    if (selectedRetail) {
      if (paymentInfo.id) {
        const payRequestUpdate: PayRequestUpdate = { ...paymentInfo };
        payRequestUpdate.id = paymentInfo.id;
        payRequestUpdate.accountAmt = Number(Utils.removeComma((payRequestUpdate.accountAmt as number).toString()));
        payRequestUpdate.cashAmt = Number(Utils.removeComma((payRequestUpdate.cashAmt as number).toString()));
        payRequestUpdate.discountAmt = Number(Utils.removeComma((payRequestUpdate.discountAmt as number).toString()));
        payRequestUpdate.etcPrintYn = etcPrnYn; // 비고출력여부

        setPaymentInfo({ ...payRequestUpdate }); // 요청 값을 전역 상태에 할당함
        updatePaymentRequest(payRequestUpdate);
      } else {
        toastError('수정할 입금거래 정보를 찾을 수 없습니다.');
      }
    } else {
      toastError('거래하실 소매처를 입력하세요.');
    }
  };

  /** 비고 관련 */
  const [textAreaValues, setTextAreaValues] = useState<{
    payEtc: string;
  }>({
    payEtc: '',
  });
  const [selectedValues, setSelectedValues] = useState<{ [key: string]: any }>({
    payEtc: '',
  });
  const handleSelectChange = (name: string, value: string) => {
    setSelectedValues((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  /** 화주(비고) 수정하기 */
  const { mutate: updatePartnerAllMutate } = useMutation(updatePartnerAll, {
    onSuccess: async (e: any) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        setEtcInfo();
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  /** 본 팝업 입력 영역 에러 목록을 관리하는 함수(OrderPaymentPop 의 콜백과 코드를 상당 부분 공유) */
  const fieldErrorCallBack = useCallback(
    (error: FieldError | undefined, name: string, errorMessageList: { name: string; message: string }[]) => {
      if (error) {
        if (errorMessageList.filter((errorMessage) => errorMessage.name == name).length == 0) {
          // 입력 영역 에러 목록에 해당 에러가 존재하지 않는 경우
          setErrorMessageList((prevState) => {
            prevState.push({ name: name, message: error.message as string });
            return prevState;
          });
        }
        toastError(error.message);
      } else {
        setErrorMessageList((prevState) => prevState.filter((prev) => prev.name != name)); // 에러 목록에서 해당 에러 제거(필터링 값으로 업데이트)
      }
    },
    [setErrorMessageList],
  );

  return (
    <PopupLayout
      width={600}
      isEscClose={false}
      open={(modalType.type === 'PAYMENT_CREATE' || modalType.type === 'PAYMENT_UPDATE') && modalType.active}
      title={modalType.type === 'PAYMENT_CREATE' ? '입금하기' : '입금수정'}
      onClose={() => {
        onCloseInnerCallback('other');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div className="left"></div>
            <div className="right">
              <Tooltip id="my-tooltip" />
              <TunedButtonAtom
                className="btn btnBlue"
                title="저장"
                ref={buttonOkRef}
                data-tooltip-id="my-tooltip"
                data-tooltip-content="단축키는 (F10)입니다."
                data-tooltip-place="top-end"
                onClick={(event) => {
                  handleSubmit((data) => {
                    if (modalType.type == 'PAYMENT_UPDATE') {
                      // 모달 유형에 따라 분기
                      if (data) {
                        onValidForPaymentUpdate(data);
                      } else {
                        toastError('결제 수정과 관련된 정보를 찾을 수 없습니다.');
                      }
                    } else {
                      // 그 이외에는 신규 입금거래 생성
                      if (data) {
                        onValidForPaymentCreate(data);
                      } else {
                        toastError('결제 생성과 관련된 정보를 찾을 수 없습니다.');
                      }
                    }
                  })(event);
                }}
                clickPreventTime={-1} // 음수일 때는 참조의 함수를 호출해야만 버튼이 재활성화됨
              >
                저장
              </TunedButtonAtom>
              <button
                className="btn"
                title="닫기"
                ref={buttonCancelRef}
                onClick={() => {
                  onCloseInnerCallback('other');
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className={'paymentBox pay'}>
          <div className="paymentDiv pay">
            <ul>
              <li>
                <dl>
                  <dt>결제일자</dt>{' '}
                  <dd>
                    <span
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          cashInp.current?.focus();
                        }
                      }}
                    >
                      <CustomNewDatePicker
                        name={'tranYmd'}
                        type={'date'}
                        title={''}
                        ref={tranYmdDatePickerRef}
                        value={getValues('tranYmd')}
                        onChange={(name, value) => {
                          if (name == 'tranYmd') {
                            setValue('tranYmd', value);
                          }
                        }}
                      />
                    </span>
                  </dd>
                </dl>
              </li>
              <li>
                <dl>
                  <dt>대상기간*</dt>
                  <dd>
                    <span
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          tranYmdDatePickerRef.current?.datePickerFocus();
                        }
                      }}
                    >
                      <CustomNewDatePicker
                        name={'workYmd'}
                        type={'date'}
                        title={''}
                        value={getValues('workYmd')}
                        onChange={(name, value) => {
                          if (name == 'workYmd') {
                            setValue('workYmd', value);
                          }
                        }}
                        onEnter={tranYmdDatePickerRef.current?.datePickerFocus}
                        ref={workYmdDatePickerRef}
                      />
                    </span>
                  </dd>
                </dl>
              </li>
            </ul>

            <dl>
              <dt className="balance">예정금액</dt>
              <dd>
                <span>{Utils.setComma(nowAmt)}원</span>
              </dd>
            </dl>
          </div>
          <div className="paymentDiv">
            <dl>
              <dt>현금입금</dt>
              <dd>
                <span>
                  <FormInput
                    type="text"
                    control={control}
                    name={'cashAmt'}
                    inputType={'number'}
                    placeholder={''}
                    ref={cashInp}
                    onChange={(e) => {
                      if (e.target.value == '') {
                        // 값을 완전히 지울 시 기본값 0
                        e.target.value = '0';
                      }
                      setBalance(
                        nowAmt -
                          (Number(Utils.removeComma(e.target.value) || 0) +
                            Number(Utils.removeComma((getValues('accountAmt') || 0).toString())) +
                            Number(Utils.removeComma((getValues('discountAmt') || 0).toString()))),
                      ); // 현잔(예정) - (현금(변경되는 값) + 통장입금 + 할인금액)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'F1') {
                        workYmdDatePickerRef.current?.datePickerFocus(); // open 할 시 '결제일자' 에 포커싱
                      } else if (e.key == 'F5') {
                        // 현금입금 영역 단축키
                        setValue('cashAmt', Utils.setComma(Number(Utils.removeComma(nowAmt.toString()))));
                        setValue('accountAmt', 0);
                      } else if (e.key == 'F6') {
                        // 통장입금 영역 단축키(현금입금에서 진행중인 동작의 흐름을 통장입금 영역으로 이동시킨다)
                        setValue('accountAmt', Utils.setComma(Number(Utils.removeComma(nowAmt.toString()))));
                        setValue('cashAmt', 0);
                        accountInp.current?.focus(); // 통장입금 영역으로 포커싱
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        accountInp.current?.focus(); // 통장입금 영역으로 포커싱
                      }
                    }}
                    onFieldErrorChanged={(error) => {
                      fieldErrorCallBack(error, 'cashAmt', errorMessageList);
                    }}
                    allowClear={false}
                    price={true}
                  />
                  <span>원</span>
                </span>
              </dd>

              <dt>통장입금</dt>
              <dd>
                <span>
                  <FormInput
                    type="text"
                    control={control}
                    name={'accountAmt'}
                    inputType={'number'}
                    placeholder={''}
                    ref={accountInp}
                    onChange={(e) => {
                      if (e.target.value == '') {
                        // 값을 완전히 지울 시 기본값 0
                        e.target.value = '0';
                      }
                      setBalance(
                        nowAmt -
                          (Number(Utils.removeComma((getValues('cashAmt') || 0).toString())) +
                            Number(Utils.removeComma(e.target.value)) +
                            Number(Utils.removeComma((getValues('discountAmt') || 0).toString()))),
                      ); // 현잔(예정) - (현금 + 통장입금(변경되는 값) + 할인금액)
                    }}
                    onKeyDown={(e) => {
                      if (e.key == 'F6') {
                        // 현금입금 영역 단축키
                        setValue('cashAmt', 0);
                        setValue('accountAmt', Utils.setComma(Number(Utils.removeComma(nowAmt.toString()))));
                      } else if (e.key == 'F5') {
                        // 통장입금 영역 단축키(현금입금에서 진행중인 동작의 흐름을 통장입금 영역으로 이동시킨다)
                        setValue('cashAmt', Utils.setComma(Number(Utils.removeComma(nowAmt.toString()))));
                        setValue('accountAmt', 0);
                        cashInp.current?.focus(); // 현금입금 영역으로 포커싱
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        discountInfo.current?.focus(); // 할인 영역으로 포커싱
                      }
                    }}
                    onFieldErrorChanged={(error) => {
                      fieldErrorCallBack(error, 'accountAmt', errorMessageList);
                    }}
                    allowClear={false}
                    price={true}
                  />
                  <span>원</span>
                </span>
              </dd>

              <dt>할인금액</dt>
              <dd>
                <span>
                  <FormInput
                    type="text"
                    control={control}
                    name={'discountAmt'}
                    inputType={'number'}
                    placeholder={''}
                    ref={discountInfo}
                    onFieldErrorChanged={(error) => {
                      fieldErrorCallBack(error, 'discountAmt', errorMessageList);
                    }}
                    onChange={(e) => {
                      if (e.target.value == '') {
                        // 값을 완전히 지울 시 기본값 0
                        e.target.value = '0';
                      }
                      setBalance(
                        nowAmt -
                          (Number(Utils.removeComma((getValues('cashAmt') || 0).toString())) +
                            Number(Utils.removeComma((getValues('accountAmt') || 0).toString())) +
                            Number(Utils.removeComma(e.target.value))),
                      ); // 현잔(예정) - (현금 + 통장입금 + 할인금액(변경되는 값))
                    }}
                    allowClear={false}
                    price={true}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        buttonOkRef.current?.other()?.focus();
                      }
                    }}
                  />
                  <span>원</span>
                </span>
              </dd>

              <dt className="balance">잔액</dt>
              <dd>
                <span>{Utils.setComma(balance)}원</span>
              </dd>
            </dl>
          </div>
          <div className="paymentDiv etc">
            <div className="etcBox">
              <Switch checkedChildren="비고" unCheckedChildren="비고" className="paySwitch" defaultChecked={false} />
              <CustomDebounceSelect
                type={'single'}
                defaultValue={getValues('payEtc')}
                fetchOptions={textAreaValues.payEtc}
                onChange={(value) => setValue('payEtc', value)}
                onEditItem={(item) => {
                  updatePartnerEtcInfoMutate({ ['etcAccCntn']: item });
                }}
                onSearchChange={(newSearchValue: any) => {
                  setSelectedValues((prevSelectedValues) => ({
                    ...prevSelectedValues,
                    payEtc: newSearchValue,
                  }));
                }}
              />
            </div>
          </div>
        </div>
      </PopupContent>
    </PopupLayout>
  );
};
