import { PopupLayout } from '../../PopupLayout';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import FormInput from '../../../FormInput';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useVatStore } from '../../../../stores/useVatStore';
import { RetailResponsePaging, VatRequestCreate } from '../../../../generated';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../../../libs';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { Utils } from '../../../../libs/utils';
import { BaseSelectRef } from 'rc-select';
import { DataListOption } from '../../../../types/DataListOptions';
import useFilters from '../../../../hooks/useFilters';
import { Input } from '../../../Input';
import DropDownAtom from '../../../atom/DropDownAtom';
import { Switch } from 'antd';
import CustomDebounceSelect from '../../../CustomDebounceSelect';
import CustomNewDatePicker from '../../../CustomNewDatePicker';
import { usePartnerStore } from '../../../../stores/usePartnerStore';
import { useForm } from 'react-hook-form';

interface vatProps {
  sellerNm?: string;
  sellerId?: number;
  totVatAmt?: number;
}

export const VatAddPop = (props: vatProps) => {
  const session = useSession();
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');
  const vatAmtRef = useRef<HTMLInputElement>(null);
  const vatCashAmtRef = useRef<HTMLInputElement>(null);
  const vatAccountAmtRef = useRef<HTMLInputElement>(null);
  const vatDcAmtRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [
    modalType,
    closeModal,
    insertVatInfo,
    selectedRetail,
    setSelectedRetail,
    vatStndrYmd,
    vatStrYmd,
    vatEndYmd,
    setVatStndrYmd,
    setVatStrYmd,
    setVatEndYmd,
  ] = useVatStore((s) => [
    s.modalType,
    s.closeModal,
    s.insertVatInfo,
    s.retail,
    s.setRetail,
    s.vatStndrYmd,
    s.vatStrYmd,
    s.vatEndYmd,
    s.setVatStndrYmd,
    s.setVatStrYmd,
    s.setVatEndYmd,
  ]);
  const { handleSubmit, control, setValue, getValues } = useForm<VatRequestCreate>({
    resolver: yupResolver(YupSchema.VatInfoInsertRequest()), // 완료
    defaultValues: {
      vatStrYmd: vatStrYmd ? vatStrYmd : dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD').toString(),
      vatEndYmd: vatEndYmd ? vatEndYmd : dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD').toString(),
      workYmd: vatStndrYmd ? vatStndrYmd : today,
    },
    mode: 'onSubmit',
  });

  const [respondedRetailList, setRespondedRetailList] = useState<RetailResponsePaging[]>([]);
  const [retailSearchKeyWord, setRetailSearchKeyWord] = useState<string>('');
  const [etcPrnYnCheckbox, setEtcPrnYnCheckBox] = useState(false);
  const [lastAmt, setLastAmt] = useState('0');

  /** 거래처 조회를 위한 필터 */
  const [filters, onChangeFilters] = useFilters({
    sellerNm: undefined,
  });

  const SearchAreaRef = useRef<HTMLInputElement>(null);
  const SelectorRef = useRef<BaseSelectRef>(null);

  /** 검색 */
  const onSearch = async () => {
    await retailsRefetch().then((result) => {
      if (result.data) {
        const { resultCode, body, resultMessage } = result.data.data;
        // 소매처 검색결과가 1건이면 그것을 바로 선택한걸로 한다.
        if (body.length == 1) {
          setRespondedRetailList(body);
          setSelectedRetail(respondedRetailList[0]);
          SelectorRef.current?.focus();
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
    ['/retail/listForReg', 'vatAddPop'],
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

  /** vat 등록 */
  const { mutate: postVatRequest } = useMutation(insertVatInfo, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          setVatStndrYmd(getValues('workYmd'));
          setVatStrYmd(getValues('vatStrYmd'));
          setVatEndYmd(getValues('vatEndYmd'));
          toastSuccess('저장되었습니다.');
          closeModal('ADD');
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
    console.log('selectedRetail ==>', selectedRetail);
    console.log('selectedRetail ==>', props);

    if (selectedRetail) {
      if (props.totVatAmt) {
        setValue('vatAmt', props.totVatAmt);
      }

      if (selectedRetail.sellerNm) {
        setRetailSearchKeyWord(selectedRetail.sellerNm);
        vatAmtRef.current?.focus();
      }
    } else {
      if (SearchAreaRef.current) {
        SearchAreaRef.current.focus();
      }
    }
    setEtcInfo();
  }, []);

  return (
    <PopupLayout
      width={600}
      isEscClose={false}
      open={modalType.type === 'ADD'}
      title={'부가세 발행하기'}
      alignRight={true}
      onClose={() => {
        closeModal('ADD');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button
              className="btn btnBlue"
              title="저장"
              onClick={(event) => {
                if (!selectedRetail) {
                  toastError('소매처를 특정한 뒤 다시 시도하십시요.');
                  return;
                } else if (!getValues('workYmd')) {
                  toastError('청구일자를 특정한 뒤 다시 시도하십시요.');
                  return;
                } else if (!getValues('vatStrYmd') || !getValues('vatEndYmd')) {
                  toastError('대상기간을 특정한 뒤 다시 시도하십시요.');
                  return;
                } else {
                  handleSubmit((data) => {
                    data.vatAmt = Number(Utils.removeComma(data.vatAmt?.toString() || '0'));
                    data.vatDcAmt = Number(Utils.removeComma(data.vatDcAmt?.toString() || '0'));
                    data.vatCashAmt = Number(Utils.removeComma(data.vatCashAmt?.toString() || '0'));
                    data.vatAccountAmt = Number(Utils.removeComma(data.vatAccountAmt?.toString() || '0'));
                    if (etcPrnYnCheckbox) {
                      data.etcPrnYn = 'Y';
                    } else {
                      data.etcPrnYn = 'N';
                    }
                    data.sellerId = selectedRetail.id;
                    console.log(data);
                    postVatRequest(data);
                  })(event);
                }
              }}
              ref={saveButtonRef}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') {
                  closeButtonRef.current?.focus();
                }
              }}
            >
              저장
            </button>
            <button
              className="btn"
              title="닫기"
              onClick={() => {
                closeModal('ADD');
              }}
              ref={closeButtonRef}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') {
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
          <div className="paymentDiv">
            <dl>
              <dt className="datePicker date"></dt>
              <dd>
                <CustomNewDatePicker
                  title={'청구일자'}
                  type={'date'}
                  name={'workYmd'}
                  defaultValue={vatStndrYmd}
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
                          if (vatAmtRef.current) {
                            vatAmtRef.current.focus();
                          }
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
                  defaultType={'type'}
                  startName={'vatStrYmd'}
                  endName={'vatEndYmd'}
                  onChange={(name, value) => {
                    setValue(name as 'vatStrYmd' | 'vatEndYmd', value.toString());
                    console.log(value);
                  }}
                  value={[vatStrYmd as string, vatEndYmd as string]}
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
                          Number(Utils.removeComma((getValues('vatCashAmt') || 0).toString())) -
                          Number(Utils.removeComma((getValues('vatAccountAmt') || 0).toString())) -
                          Number(Utils.removeComma((getValues('vatDcAmt') || 0).toString())),
                      ),
                    );
                  }}
                  price={true}
                  priceTxt={'원'}
                  allowClear={false}
                  ref={vatAmtRef}
                  onKeyDown={(event) => {
                    if (event.key == 'Enter' && vatCashAmtRef.current) {
                      event.preventDefault(); // Enter 키 기본 동작 방지
                      vatCashAmtRef.current.focus();
                    } else if (event.key == 'F6') {
                      event.preventDefault(); // Enter 키 기본 동작 방지
                      vatAccountAmtRef.current?.focus();
                    } else if (event.key == 'F5') {
                      event.preventDefault(); // Enter 키 기본 동작 방지
                      vatCashAmtRef.current?.focus();
                    }
                  }}
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
                    onChange={(e) => {
                      setLastAmt(
                        Utils.setComma(
                          Number(Utils.removeComma((getValues('vatAmt') || 0).toString())) -
                            Number(Utils.removeComma((e.target.value || 0).toString())) -
                            Number(Utils.removeComma((getValues('vatAccountAmt') || 0).toString())) -
                            Number(Utils.removeComma((getValues('vatDcAmt') || 0).toString())),
                        ),
                      );
                    }}
                    ref={vatCashAmtRef}
                    onKeyDown={(event) => {
                      if (event.key == 'Enter' && vatAccountAmtRef.current) {
                        event.preventDefault(); // Enter 키 기본 동작 방지
                        vatAccountAmtRef.current.focus();
                      } else if (event.key == 'F6') {
                        event.preventDefault(); // Enter 키 기본 동작 방지
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
                    onChange={(e) => {
                      console.log(getValues('vatAccountAmt'));
                      setLastAmt(
                        Utils.setComma(
                          Number(Utils.removeComma((getValues('vatAmt') || 0).toString())) -
                            Number(Utils.removeComma((getValues('vatCashAmt') || 0).toString())) -
                            Number(Utils.removeComma((e.target.value || 0).toString())) -
                            Number(Utils.removeComma((getValues('vatDcAmt') || 0).toString())),
                        ),
                      );
                    }}
                    inputType={'number'}
                    ref={vatAccountAmtRef}
                    onKeyDown={(event) => {
                      if (event.key == 'Enter' && vatDcAmtRef.current) {
                        event.preventDefault(); // Enter 키 기본 동작 방지
                        vatDcAmtRef.current.focus();
                      } else if (event.key == 'F5') {
                        event.preventDefault(); // Enter 키 기본 동작 방지
                        vatCashAmtRef.current?.focus();
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
                    onKeyDown={(event) => {
                      if (event.key == 'Enter' && saveButtonRef.current) {
                        event.preventDefault(); // Enter 키 기본 동작 방지
                        saveButtonRef.current.focus();
                      }
                    }}
                    onChange={(e) => {
                      setLastAmt(
                        Utils.setComma(
                          Number(Utils.removeComma((getValues('vatAmt') || 0).toString())) -
                            Number(Utils.removeComma((getValues('vatCashAmt') || 0).toString())) -
                            Number(Utils.removeComma((getValues('vatAccountAmt') || 0).toString())) -
                            Number(Utils.removeComma((e.target.value || 0).toString())),
                        ),
                      );
                    }}
                    inputType={'number'}
                    ref={vatDcAmtRef}
                  />
                  <span>원</span>
                </span>
              </dd>
              <dt className="balance">결제잔액</dt>
              <dd>
                <span>{Utils.setComma(lastAmt)}원</span>
              </dd>
            </dl>
          </div>
          <div className="paymentDiv etc">
            <div className="etcBox">
              <Switch
                checkedChildren="비고"
                unCheckedChildren="비고"
                className="paySwitch"
                defaultChecked={etcPrnYnCheckbox}
                onChange={() => {
                  setEtcPrnYnCheckBox(!etcPrnYnCheckbox);
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
        {/*<div className="tblBox vat">*/}
        {/*  <table>*/}
        {/*    <caption></caption>*/}
        {/*    <colgroup>*/}
        {/*      <col width="25%" />*/}
        {/*      <col width="*%" />*/}
        {/*    </colgroup>*/}
        {/*    <tbody>*/}
        {/*      <tr>*/}
        {/*        <th className="agnL">청구일자</th>*/}
        {/*        <td>*/}
        {/*          <div className="formBox">*/}
        {/*            <CustomDatePicker*/}
        {/*              name={'workYmd'}*/}
        {/*              defaultValue={vatStndrYmd}*/}
        {/*              onChange={(name, value: any) => {*/}
        {/*                const formattedDate = value.$d ? dayjs(value.$d).format('YYYY-MM-DD') : dayjs(value).format('YYYY-MM-DD');*/}
        {/*                setValue(name as 'workYmd', formattedDate);*/}
        {/*              }}*/}
        {/*            />*/}
        {/*          </div>*/}
        {/*        </td>*/}
        {/*      </tr>*/}
        {/*      <tr>*/}
        {/*        <th className="agnL">소매처</th>*/}
        {/*        <td>*/}
        {/*          <div className="formBox selBtn">*/}
        {/*            <Input*/}
        {/*              title={''}*/}
        {/*              placeholder="소매처 검색"*/}
        {/*              onKeyDown={(e) => {*/}
        {/*                if (e.key == 'Enter' && !e.nativeEvent.isComposing) {*/}
        {/*                  // 중복 실행 방지를 위해 e.nativeEvent.isComposing 검증(엔터 사용시 이벤트가 중복 실행되는 상황에 대응)*/}
        {/*                  search();*/}
        {/*                }*/}
        {/*              }}*/}
        {/*              onChange={(e) => {*/}
        {/*                if (selectedRetail) {*/}
        {/*                  setSelectedRetail(undefined);*/}
        {/*                }*/}
        {/*                setRetailSearchKeyWord(e.target.value);*/}
        {/*              }}*/}
        {/*              style={{ width: '100%', zIndex: 1 }}*/}
        {/*              value={retailSearchKeyWord}*/}
        {/*              ref={SearchAreaRef}*/}
        {/*            />*/}
        {/*            <DropDownAtom*/}
        {/*              name={'retail'}*/}
        {/*              options={displayedClientList(respondedRetailList)}*/}
        {/*              onChangeOptions={(name, value) => {*/}
        {/*                // 드롭다운에서 값을 선택할 시 작동*/}
        {/*                for (let i = 0; i < respondedRetailList.length; i++) {*/}
        {/*                  if (respondedRetailList[i].sellerNm == value) {*/}
        {/*                    console.log(respondedRetailList[i]);*/}
        {/*                    setSelectedRetail(respondedRetailList[i]);*/}
        {/*                  }*/}
        {/*                }*/}
        {/*                setRetailSearchKeyWord(value.toString());*/}
        {/*              }}*/}
        {/*              //readonly={orderEtcDropDownDisabled}*/}
        {/*              style={{ position: 'absolute', zIndex: 0, width: '100%' }}*/}
        {/*              selectorShowAction={['focus']}*/}
        {/*              ref={SelectorRef}*/}
        {/*            />*/}
        {/*          </div>*/}
        {/*        </td>*/}
        {/*      </tr>*/}
        {/*      <tr>*/}
        {/*        <th className="agnL">대상기간</th>*/}
        {/*        <td>*/}
        {/*          <div className="formBox">*/}
        {/*            <CustomTwoDatePicker*/}
        {/*              startName={'vatStrYmd'}*/}
        {/*              endName={'vatEndYmd'}*/}
        {/*              onChange={(name, value) => {*/}
        {/*                setValue(name as 'vatStrYmd' | 'vatEndYmd', value.toString());*/}
        {/*                console.log(value);*/}
        {/*              }}*/}
        {/*              value={[vatStrYmd as string, vatEndYmd as string]}*/}
        {/*            />*/}
        {/*          </div>*/}
        {/*        </td>*/}
        {/*      </tr>*/}
        {/*      <tr>*/}
        {/*        <th className="agnL">청구금액</th>*/}
        {/*        <td>*/}
        {/*          <div className="formBox">*/}
        {/*            <FormInput*/}
        {/*              type="text"*/}
        {/*              control={control}*/}
        {/*              name={'vatAmt'}*/}
        {/*              onChange={(e) => {*/}
        {/*                setLastAmt(*/}
        {/*                  Utils.setComma(*/}
        {/*                    Number(Utils.removeComma((e.target.value || 0).toString())) -*/}
        {/*                      Number(Utils.removeComma((getValues('vatCashAmt') || 0).toString())) -*/}
        {/*                      Number(Utils.removeComma((getValues('vatAccountAmt') || 0).toString())) -*/}
        {/*                      Number(Utils.removeComma((getValues('vatDcAmt') || 0).toString())),*/}
        {/*                  ),*/}
        {/*                );*/}
        {/*              }}*/}
        {/*              inputType={'number'}*/}
        {/*            />*/}
        {/*          </div>*/}
        {/*        </td>*/}
        {/*      </tr>*/}
        {/*      <tr>*/}
        {/*        <th className="agnL">할인금액</th>*/}
        {/*        <td>*/}
        {/*          <div className="formBox">*/}
        {/*            <FormInput*/}
        {/*              type="text"*/}
        {/*              control={control}*/}
        {/*              name={'vatDcAmt'}*/}
        {/*              onChange={(e) => {*/}
        {/*                setLastAmt(*/}
        {/*                  Utils.setComma(*/}
        {/*                    Number(Utils.removeComma((getValues('vatAmt') || 0).toString())) -*/}
        {/*                      Number(Utils.removeComma((getValues('vatCashAmt') || 0).toString())) -*/}
        {/*                      Number(Utils.removeComma((getValues('vatAccountAmt') || 0).toString())) -*/}
        {/*                      Number(Utils.removeComma((e.target.value || 0).toString())),*/}
        {/*                  ),*/}
        {/*                );*/}
        {/*              }}*/}
        {/*              inputType={'number'}*/}
        {/*            />*/}
        {/*          </div>*/}
        {/*        </td>*/}
        {/*      </tr>*/}
        {/*      <tr>*/}
        {/*        <th className="agnL">현금(F5)</th>*/}
        {/*        <td>*/}
        {/*          <div className="formBox">*/}
        {/*            <FormInput*/}
        {/*              type="text"*/}
        {/*              control={control}*/}
        {/*              name={'vatCashAmt'}*/}
        {/*              onChange={(e) => {*/}
        {/*                setLastAmt(*/}
        {/*                  Utils.setComma(*/}
        {/*                    Number(Utils.removeComma((getValues('vatAmt') || 0).toString())) -*/}
        {/*                      Number(Utils.removeComma((e.target.value || 0).toString())) -*/}
        {/*                      Number(Utils.removeComma((getValues('vatAccountAmt') || 0).toString())) -*/}
        {/*                      Number(Utils.removeComma((getValues('vatDcAmt') || 0).toString())),*/}
        {/*                  ),*/}
        {/*                );*/}
        {/*              }}*/}
        {/*              inputType={'number'}*/}
        {/*            />*/}
        {/*          </div>*/}
        {/*        </td>*/}
        {/*      </tr>*/}
        {/*      <tr>*/}
        {/*        <th className="agnL">통장(F6)</th>*/}
        {/*        <td>*/}
        {/*          <div className="formBox">*/}
        {/*            <FormInput*/}
        {/*              type="text"*/}
        {/*              control={control}*/}
        {/*              name={'vatAccountAmt'}*/}
        {/*              onChange={(e) => {*/}
        {/*                setLastAmt(*/}
        {/*                  Utils.setComma(*/}
        {/*                    Number(Utils.removeComma((getValues('vatAmt') || 0).toString())) -*/}
        {/*                      Number(Utils.removeComma((getValues('vatCashAmt') || 0).toString())) -*/}
        {/*                      Number(Utils.removeComma((e.target.value || 0).toString())) -*/}
        {/*                      Number(Utils.removeComma((getValues('vatDcAmt') || 0).toString())),*/}
        {/*                  ),*/}
        {/*                );*/}
        {/*              }}*/}
        {/*              inputType={'number'}*/}
        {/*            />*/}
        {/*          </div>*/}
        {/*        </td>*/}
        {/*      </tr>*/}
        {/*      <tr>*/}
        {/*        <th className="agnL">잔액</th>*/}
        {/*        <td>*/}
        {/*          <div className="formBox">*/}
        {/*            <Input type="text" value={lastAmt} disable={true} />*/}
        {/*          </div>*/}
        {/*        </td>*/}
        {/*      </tr>*/}
        {/*      <tr>*/}
        {/*        <th className="agnL">*/}
        {/*          <div className="formBox txtChk">*/}
        {/*            비고출력여부*/}
        {/*            <div className="chkBox solo">*/}
        {/*              <span>*/}
        {/*                <input*/}
        {/*                  id="chk3"*/}
        {/*                  type="checkbox"*/}
        {/*                  onClick={() => {*/}
        {/*                    setEtcPrnYnCheckBox(!etcPrnYnCheckbox);*/}
        {/*                  }}*/}
        {/*                  checked={etcPrnYnCheckbox}*/}
        {/*                />*/}
        {/*                <label htmlFor="chk3"></label>*/}
        {/*              </span>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*        </th>*/}
        {/*        <td>*/}
        {/*          <div className="formBox">*/}
        {/*            <FormInput type="text" control={control} name={'etcCntn'} />*/}
        {/*          </div>*/}
        {/*        </td>*/}
        {/*      </tr>*/}
        {/*    </tbody>*/}
        {/*  </table>*/}
        {/*</div>*/}
      </PopupContent>
      {/*<Loading />*/}
    </PopupLayout>
  );
};
