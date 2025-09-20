import { PopupLayout } from '../../PopupLayout';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { useForm } from 'react-hook-form';
import FormInput from '../../../FormInput';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useVatStore } from '../../../../stores/useVatStore';
import { RetailResponseDetail, RetailResponsePaging, VatInoutRequestCreate } from '../../../../generated';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../../../libs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { Utils } from '../../../../libs/utils';
import { Input } from '../../../Input';
import { usePartnerStore } from '../../../../stores/usePartnerStore';
import CustomNewDatePicker from '../../../CustomNewDatePicker';
import DropDownAtom from '../../../atom/DropDownAtom';
import { Switch } from 'antd';
import CustomDebounceSelect from '../../../CustomDebounceSelect';
import useFilters from '../../../../hooks/useFilters';
import { BaseSelectRef } from 'rc-select';
import { DataListOption } from '../../../../types/DataListOptions';
type VatInoutRequestCreates = VatInoutRequestCreate & {
  vatNowAmt: number;
  vatStrYmd: string;
  vatEndYmd: string;
  vatAmt: number;
};
export const VatInoutAddPop = () => {
  const session = useSession();
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [modalType, closeModal, vatResponsePagingInfo, insertVatInouts, updateVatInfo, selectedRetail, setSelectedRetail] = useVatStore((s) => [
    s.modalType,
    s.closeModal,
    s.vatResponsePagingInfo,
    s.insertVatInouts,
    s.updateVatInfo,
    s.retail,
    s.setRetail,
  ]);

  const [respondedRetailList, setRespondedRetailList] = useState<RetailResponsePaging[]>([]);
  const [retailSearchKeyWord, setRetailSearchKeyWord] = useState<string>('');
  const [etcPrnYnCheckbox, setEtcPrnYnCheckBox] = useState(false);
  const [lastAmt, setLastAmt] = useState('0');

  useEffect(() => {
    if (vatResponsePagingInfo && vatResponsePagingInfo.vatNowAmt) {
      setLastAmt(vatResponsePagingInfo.vatNowAmt.toString());
      setValue('vatAmt', Utils.setComma(vatResponsePagingInfo.vatNowAmt));
    }

    if (vatResponsePagingInfo) {
      vatCashAmtRef.current?.focus();
    }
  }, [vatResponsePagingInfo]);

  const { handleSubmit, control, setValue, getValues, watch } = useForm<VatInoutRequestCreates>({
    resolver: yupResolver(YupSchema.VatInoutInsertRequest()), // 완료
    defaultValues: {
      vatId: vatResponsePagingInfo?.id,
      workYmd: today,
      etcPrnYn: vatResponsePagingInfo?.etcPrnYn,
    },
    mode: 'onSubmit',
  });

  /** 거래처 조회를 위한 필터 */
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<{ id: number | undefined; sellerNm: string | undefined }>({
    id: undefined, // 소매처 id
    sellerNm: undefined,
  });

  const SearchAreaRef = useRef<HTMLInputElement>(null);
  const SelectorRef = useRef<BaseSelectRef>(null);
  const vatAmtRef = useRef<HTMLInputElement>(null);
  const vatCashAmtRef = useRef<HTMLInputElement>(null);
  const vatAccountAmtRef = useRef<HTMLInputElement>(null);
  const vatDcAmtRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  /** 검색 */
  const onSearch = async () => {
    await retailsRefetch().then((result) => {
      if (result.data) {
        const { resultCode, body, resultMessage } = result.data.data;
        // 소매처 검색결과가 1건이면 그것을 바로 선택한걸로 한다
        // console.log('바디', body);
        if (body.length == 1) {
          const retailInfoResponse: RetailResponseDetail = body[0];
          console.log(retailInfoResponse);
          setRespondedRetailList([]);
          setRetailSearchKeyWord(retailInfoResponse.sellerNm as string);
          setSelectedRetail(retailInfoResponse);
        } else if (body.length > 1) {
          setRespondedRetailList(body);
          SelectorRef.current?.focus();
        }
      }
    });
  };

  /** 검색 버튼 혹은 엔터 키 사용 시 */
  const search = () => {
    console.log(retailSearchKeyWord);
    if (retailSearchKeyWord.length == 0) {
      toastError('검색조건을 1개 이상 입력하세요.');
      return;
    }
    onFiltersReset();
    onChangeFilters('sellerNm', retailSearchKeyWord);
    setTimeout(() => {
      onSearch();
    }, 100);
  };

  /** 인자의 상태가 변경될 시 소매처 관련 데이터를 적절한 형식으로 수정하여 반환 */
  const displayedClientList = (respondedRetailList: RetailResponsePaging[]) => {
    const displayedClients: DataListOption[] = [];
    if (respondedRetailList.length) {
      for (let i = 0; i < respondedRetailList.length; i++) {
        if (respondedRetailList[i].sellerNm && respondedRetailList[i].id) {
          const idAsIdentifier = respondedRetailList[i].id as string | number;
          displayedClients.push({
            key: i,
            value: respondedRetailList[i].sellerNm as string,
            label: respondedRetailList[i].sellerNm as string,
            identifier: idAsIdentifier.toString(),
          });
        }
      }
    }
    return displayedClients;
  };

  /** 모든 거래처 조회 */
  const {
    refetch: retailsRefetch, // 키 무효화 대신 본 요소 호출하여 refetch
    isSuccess: isRetailListSearchSuccess,
  } = useQuery(
    ['/retail/listForReg', 'vatModPop'],
    () =>
      authApi.get('/retail/listForReg', {
        params: {
          ...filters,
        },
      }),
    {
      enabled: false,
    },
  );

  /** 주문 등록 */
  const queryClient = useQueryClient();
  const { mutate: postVatInoutRequest, isLoading: postOrderRequestIsInLoading } = useMutation(insertVatInouts, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          queryClient.invalidateQueries(['/vat/paging']);
          toastSuccess('저장되었습니다.');
          closeModal('INOUT_ADD');
        } else {
          console.log(e);

          toastError(e.data.resultMessage);

          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  useEffect(() => {
    if (vatResponsePagingInfo) {
      if (vatResponsePagingInfo.sellerId != undefined) {
        onFiltersReset();
        onChangeFilters('id', vatResponsePagingInfo.sellerId);
        setTimeout(() => {
          onSearch();
        }, 100);
      }
      setLastAmt(
        Utils.setComma(
          Number(Utils.removeComma((vatResponsePagingInfo.vatAmt || 0).toString())) -
            Number(Utils.removeComma((vatResponsePagingInfo.vatCashAmt || 0).toString())) -
            Number(Utils.removeComma((vatResponsePagingInfo.vatAccountAmt || 0).toString())) -
            Number(Utils.removeComma((vatResponsePagingInfo.vatDcAmt || 0).toString())),
        ),
      );
      setEtcPrnYnCheckBox(vatResponsePagingInfo.etcPrnYn == 'Y');
    }
  }, [vatResponsePagingInfo]);

  /** 비고 관련 */
  const [textAreaValues, setTextAreaValues] = useState<{
    orderEtc: string;
  }>({
    orderEtc: '',
  });
  /** 화주(비고) 수정하기 */
  const [selectMyPartner, updatePartnerAll] = usePartnerStore((s) => [s.selectMyPartner, s.updatePartnerAll]);
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
  /** 비고정보 호출 및 설정 */
  const setEtcInfo = useCallback(async () => {
    const { data: partnerData } = await selectMyPartner();
    const { resultCode, body, resultMessage } = partnerData;
    if (resultCode === 200) {
      if (body) {
        const infoData = (body as any).etcAccCntn || '';
        setTextAreaValues((prev) => ({ ...prev, ['orderEtc']: infoData }));
      }
    } else {
      toastError(resultMessage);
    }
  }, [selectMyPartner]);
  useEffect(() => {
    setEtcInfo();
    console.log('데이터', vatResponsePagingInfo);
  }, []);

  // 실시간 계산 함수
  const vatAmt = watch('vatAmt') || '0';
  const vatCashAmt = watch('vatCashAmt') || '0';
  const vatAccountAmt = watch('vatAccountAmt') || '0';
  const vatDcAmt = watch('vatDcAmt') || '0';
  const calculateLastAmt = () => {
    return Utils.setComma(
      Number(Utils.removeComma(vatAmt.toString())) -
        Number(Utils.removeComma(vatCashAmt.toString())) -
        Number(Utils.removeComma(vatAccountAmt.toString())) -
        Number(Utils.removeComma(vatDcAmt.toString())),
    );
  };

  useEffect(() => {
    setLastAmt(calculateLastAmt());
  }, [vatAmt, vatCashAmt, vatAccountAmt, vatDcAmt]);

  return (
    <PopupLayout
      width={630}
      isEscClose={false}
      open={modalType.type === 'INOUT_ADD'}
      title={'부가세 입금하기'}
      onClose={() => {
        closeModal('INOUT_ADD');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button
              className="btn btnBlue"
              title="저장"
              ref={saveButtonRef}
              onKeyDown={(e) => {
                if (e.key == 'ArrowRight') {
                  cancelButtonRef.current?.focus();
                }
              }}
              onClick={(event) => {
                if (!getValues('workYmd')) {
                  toastError('청구일자를 특정한 뒤 다시 시도하십시요.');
                  return;
                } else if (!getValues('vatCashAmt') && !getValues('vatAccountAmt') && !getValues('vatDcAmt')) {
                  vatCashAmtRef.current?.focus();
                  toastError('현금, 입금, 할인 금액이 하나라도 입력되어야 합니다.');
                } else {
                  handleSubmit((data) => {
                    data.vatDcAmt = Number(Utils.removeComma(data.vatDcAmt?.toString() || '0'));
                    data.vatCashAmt = Number(Utils.removeComma(data.vatCashAmt?.toString() || '0'));
                    data.vatAccountAmt = Number(Utils.removeComma(data.vatAccountAmt?.toString() || '0'));
                    if (etcPrnYnCheckbox) {
                      data.etcPrnYn = 'Y';
                    } else {
                      data.etcPrnYn = 'N';
                    }
                    console.log('데이터', data);
                    postVatInoutRequest([data]);
                  })(event);
                }
              }}
            >
              저장
            </button>
            <button
              className="btn"
              title="닫기"
              ref={cancelButtonRef}
              onClick={() => {
                closeModal('INOUT_ADD');
              }}
              onKeyDown={(e) => {
                if (e.key == 'ArrowLeft') {
                  saveButtonRef.current?.focus();
                }
              }}
            >
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="paymentBox vat">
          <div className="paymentDiv disabled">
            <dl>
              <dt className="datePicker date"></dt>
              <dd>
                <CustomNewDatePicker
                  title={'청구일자'}
                  type={'date'}
                  name={'workYmd'}
                  defaultValue={getValues('workYmd')}
                  onChange={(name, value: any) => {
                    const formattedDate = value.$d ? dayjs(value.$d).format('YYYY-MM-DD') : dayjs(value).format('YYYY-MM-DD');
                    setValue(name as 'workYmd', formattedDate);
                  }}
                />
              </dd>
              <dt>소매처</dt>
              <dd>
                <div className="formBox selBtn">
                  <Input
                    title={''}
                    placeholder="소매처 검색"
                    onKeyDown={(e) => {
                      if (e.key == 'Enter' && !e.nativeEvent.isComposing) {
                        // 중복 실행 방지를 위해 e.nativeEvent.isComposing 검증(엔터 사용시 이벤트가 중복 실행되는 상황에 대응)
                        search();
                      }
                    }}
                    onChange={(e) => {
                      if (selectedRetail) {
                        setSelectedRetail(undefined);
                      }
                      setRetailSearchKeyWord(e.target.value);
                    }}
                    style={{ width: '100%', zIndex: 1 }}
                    value={retailSearchKeyWord}
                    ref={SearchAreaRef}
                  />
                  <DropDownAtom
                    name={'retail'}
                    options={displayedClientList(respondedRetailList)}
                    onChangeOptions={(name, value) => {
                      // 드롭다운에서 값을 선택할 시 작동
                      for (let i = 0; i < respondedRetailList.length; i++) {
                        if (respondedRetailList[i].sellerNm == value) {
                          console.log(respondedRetailList[i]);
                          setSelectedRetail(respondedRetailList[i]);
                        }
                      }
                      setRetailSearchKeyWord(value.toString());
                    }}
                    //readonly={orderEtcDropDownDisabled}
                    style={{ position: 'absolute', zIndex: 0, width: '100%' }}
                    selectorShowAction={['focus']}
                    ref={SelectorRef}
                  />
                </div>
              </dd>
              <dt className="datePicker"></dt>
              <dd>
                <CustomNewDatePicker
                  title={'대상기간'}
                  type={'range'}
                  startName={'vatStrYmd'}
                  endName={'vatEndYmd'}
                  value={[getValues('vatStrYmd') as string, getValues('vatEndYmd') as string]}
                />
              </dd>
              <dt className="balance">청구금액</dt>
              <dd>
                <FormInput
                  control={control}
                  name={'vatAmt'}
                  onChange={(e) => {
                    setLastAmt(
                      Utils.setComma(
                        Number(Utils.removeComma((e.target.value || 0).toString())) -
                          Number(Utils.removeComma((vatResponsePagingInfo?.vatCashAmt || 0).toString())) -
                          Number(Utils.removeComma((vatResponsePagingInfo?.vatAccountAmt || 0).toString())) -
                          Number(Utils.removeComma((vatResponsePagingInfo?.vatDcAmt || 0).toString())),
                      ),
                    );
                  }}
                  price={true}
                  priceTxt={'원'}
                  allowClear={false}
                  ref={vatAmtRef}
                />
              </dd>
            </dl>
          </div>

          <div className="paymentDiv">
            <dl>
              <dt className="datePicker date"></dt>
              <dd>
                <CustomNewDatePicker title={'입금일자'} type={'date'} />
              </dd>
              <dt>현금입금</dt>
              <dd>
                <span>
                  <FormInput
                    inputType={'number'}
                    // disable={}
                    allowClear={false}
                    price={true}
                    type="text"
                    control={control}
                    name={'vatCashAmt'}
                    ref={vatCashAmtRef}
                    onKeyDown={(e) => {
                      if (e.key === 'F6') {
                        vatAccountAmtRef.current?.focus();
                        setValue('vatAccountAmt', Utils.setComma(Number(Utils.removeComma(vatAmt.toString()))));
                        setValue('vatCashAmt', 0);
                      } else if (e.key === 'Enter') {
                        vatAccountAmtRef.current?.focus();
                      }
                    }}
                  />
                  <span>원</span>
                </span>
              </dd>
              <dt>통장입금</dt>
              <dd>
                <span>
                  <FormInput
                    allowClear={false}
                    price={true}
                    type="text"
                    control={control}
                    name={'vatAccountAmt'}
                    inputType={'number'}
                    ref={vatAccountAmtRef}
                    onKeyDown={(e) => {
                      if (e.key === 'F5') {
                        vatCashAmtRef.current?.focus();
                        setValue('vatCashAmt', Utils.setComma(Number(Utils.removeComma(vatAmt.toString()))));
                        setValue('vatAccountAmt', 0);
                      } else if (e.key === 'Enter') {
                        vatDcAmtRef.current?.focus();
                      }
                    }}
                  />
                  <span>원</span>
                </span>
              </dd>
              <dt>할인금액</dt>
              <dd>
                <span>
                  <FormInput
                    allowClear={false}
                    price={true}
                    type="text"
                    control={control}
                    name={'vatDcAmt'}
                    inputType={'number'}
                    ref={vatDcAmtRef}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveButtonRef.current?.focus();
                      }
                    }}
                  />
                  <span>원</span>
                </span>
              </dd>
              <dt className="balance">결제잔액</dt>
              <dd>
                <span>{lastAmt}원</span>
              </dd>
            </dl>
          </div>
          <div className="paymentDiv etc">
            <div className="etcBox">
              <Switch
                checkedChildren="비고"
                unCheckedChildren="비고"
                className="paySwitch"
                defaultChecked={getValues('etcPrnYn') === 'Y'}
                onChange={(e) => {
                  setEtcPrnYnCheckBox(e);
                  setValue('etcPrnYn', e ? 'Y' : 'N');
                }}
              />
              <CustomDebounceSelect
                type={'single'}
                defaultValue={''}
                fetchOptions={textAreaValues.orderEtc}
                onChange={(value) => setValue('etcCntn', value)}
                onEditItem={(item) => {
                  updatePartnerAllMutate({ ['etcAccCntn']: item });
                }}
              />
            </div>
          </div>
        </div>
      </PopupContent>
    </PopupLayout>
  );
};
