import { PopupLayout } from '../../PopupLayout';
import { PopupFooter } from '../../PopupFooter';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { Utils } from '../../../../libs/utils';
import { PopupContent } from '../../PopupContent';
import { RetailResponseDetail, RetailResponsePaging, VatRequestUpdate, VatResponsePaging } from '../../../../generated';
import { Input } from '../../../Input';
import DropDownAtom from '../../../atom/DropDownAtom';
import { useForm } from 'react-hook-form';
import FormInput from '../../../FormInput';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../../../libs';
import { useVatStore } from '../../../../stores/useVatStore';
import useFilters from '../../../../hooks/useFilters';
import { BaseSelectRef } from 'rc-select';
import { DataListOption } from '../../../../types/DataListOptions';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import CustomNewDatePicker from '../../../CustomNewDatePicker';
import { Switch } from 'antd';
import CustomDebounceSelect from '../../../CustomDebounceSelect';
import { usePartnerStore } from '../../../../stores/usePartnerStore';

export const VatModPop = () => {
  const session = useSession();
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [modalType, closeModal, updateVatInfo, selectedRetail, setSelectedRetail, vatResponsePagingInfo] = useVatStore((s) => [
    s.modalType,
    s.closeModal,
    s.updateVatInfo,
    s.retail,
    s.setRetail,
    s.vatResponsePagingInfo,
  ]);

  const { handleSubmit, control, setValue, getValues } = useForm<VatRequestUpdate>({
    resolver: yupResolver(YupSchema.VatInfoUpdateRequest()), // 완료
    defaultValues: {
      vatStrYmd: (vatResponsePagingInfo as VatResponsePaging).vatStrYmd,
      vatEndYmd: (vatResponsePagingInfo as VatResponsePaging).vatEndYmd,
      workYmd: (vatResponsePagingInfo as VatResponsePaging).workYmd,
      id: (vatResponsePagingInfo as VatResponsePaging).id,
      vatAmt: Utils.setComma((vatResponsePagingInfo as VatResponsePaging).vatAmt || '0'),
      etcPrnYn: (vatResponsePagingInfo as VatResponsePaging).etcPrnYn,
      etcCntn: (vatResponsePagingInfo as VatResponsePaging).etcCntn,
      vatCashAmt: Utils.setComma((vatResponsePagingInfo as VatResponsePaging).vatCashAmt || '0'),
      vatAccountAmt: Utils.setComma((vatResponsePagingInfo as VatResponsePaging).vatAccountAmt || '0'),
      vatDcAmt: Utils.setComma((vatResponsePagingInfo as VatResponsePaging).vatDcAmt || '0'),
    },
    mode: 'onSubmit',
  });

  const [respondedRetailList, setRespondedRetailList] = useState<RetailResponsePaging[]>([]);
  const [retailSearchKeyWord, setRetailSearchKeyWord] = useState<string>('');
  const [etcPrnYnCheckbox, setEtcPrnYnCheckBox] = useState(false);
  const [lastAmt, setLastAmt] = useState('0');

  /** 거래처 조회를 위한 필터 */
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<{ id: number | undefined; sellerNm: string | undefined }>({
    id: undefined, // 소매처 id
    sellerNm: undefined,
  });

  const SearchAreaRef = useRef<HTMLInputElement>(null);
  const SelectorRef = useRef<BaseSelectRef>(null);

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
  const { mutate: patchVatRequest, isLoading: postOrderRequestIsInLoading } = useMutation(updateVatInfo, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('수정되었습니다.');
          closeModal('MOD');
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
  }, []);

  return (
    <PopupLayout
      width={650}
      isEscClose={false}
      open={modalType.type === 'MOD'}
      title={'부가세 수정하기'}
      onClose={() => {
        closeModal('MOD');
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
                } else {
                  handleSubmit((data: VatRequestUpdate) => {
                    data.vatAmt = Number(Utils.removeComma(data.vatAmt?.toString() || '0'));
                    data.vatCashAmt = Number(Utils.removeComma(data.vatCashAmt?.toString() || '0'));
                    data.vatAccountAmt = Number(Utils.removeComma(data.vatAccountAmt?.toString() || '0'));
                    data.vatDcAmt = Number(Utils.removeComma(data.vatDcAmt?.toString() || '0'));
                    data.sellerId = selectedRetail.id;
                    if (etcPrnYnCheckbox) {
                      data.etcPrnYn = 'Y';
                    } else {
                      data.etcPrnYn = 'N';
                    }
                    patchVatRequest(data);
                  })(event);
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
                  defaultType={'type'}
                  startName={'vatStrYmd'}
                  endName={'vatEndYmd'}
                  onChange={(name, value) => {
                    setValue(name as 'vatStrYmd' | 'vatEndYmd', value.toString());
                  }}
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
                />
              </dd>
            </dl>
          </div>

          <div className="paymentDiv disabled">
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
        {/*            <Controller*/}
        {/*              control={control}*/}
        {/*              name={'workYmd'}*/}
        {/*              render={({ field: { onChange, value, ref } }) => (*/}
        {/*                <CustomDatePicker*/}
        {/*                  name={'workYmd'}*/}
        {/*                  onChange={(name, value) => {*/}
        {/*                    onChange(value);*/}
        {/*                  }}*/}
        {/*                  value={value}*/}
        {/*                />*/}
        {/*              )}*/}
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
        {/*              }}*/}
        {/*              value={[getValues('vatStrYmd') as string, getValues('vatEndYmd') as string]}*/}
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
        {/*                      Number(Utils.removeComma(((vatResponsePagingInfo as VatResponsePaging).vatCashAmt || 0).toString())) -*/}
        {/*                      Number(Utils.removeComma(((vatResponsePagingInfo as VatResponsePaging).vatAccountAmt || 0).toString())) -*/}
        {/*                      Number(Utils.removeComma(((vatResponsePagingInfo as VatResponsePaging).vatDcAmt || 0).toString())),*/}
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
