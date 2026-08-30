import React, { useEffect, useState } from 'react';
import { PopupFooter } from '@/components/popup/PopupFooter';
import { PopupContent } from '@/components/popup/PopupContent';
import { PopupLayout } from '@/components/popup/PopupLayout';
import PopupFormBox from '@/components/popup/content/PopupFormBox';
import PopupFormGroup from '@/components/popup/content/PopupFormGroup';
import PopupFormType from '@/components/popup/content/PopupFormType';
import FormInput from '@/components/form/FormInput';
import { Controller, SubmitErrorHandler, SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { useCode } from '@/hooks/useCode';
import { TunedReactSelector } from '@/components/TunedReactSelector';
import { useMutation, useQuery } from '@tanstack/react-query';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '@/libs';
import { toastError, toastSuccess } from '@/components/ToastMessage';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ProductMngRequestUpdateProduct, ProductMngResponseProductInfo } from '@/generated';
import { useProductMngStore } from '@/stores/product/useProductMngStore';
import { usePartnerCodeStore } from '@/stores/usePartnerCodeStore';
import { PARTNER_CODE } from '@/libs/const';
import FormDropDown from '@/components/form/FormDropDown';
import FormDatePicker from '@/components/form/FormDatePicker';
import dayjs from 'dayjs';
import { useVendorList } from '@/customHook/useVendorList';

/** form 영역 입력 인터페이스 */
export interface ProductModFields extends ProductMngRequestUpdateProduct {
  weather: ('spring' | 'summer' | 'autumn' | 'winter')[];
  /** 연결할 카테고리 id 목록 (멱등적 추가) */
  categoryIds?: number[];
  /** 대분류(90010) 선택값 - 소분류 필터용(저장 대상 아님) */
  majorCd?: string;
  /** 소분류(90011) 선택값 = prod_type_code */
  prodTypeCode?: string;
  /** 세탁 기타 설명 (세탁 타입이 기타(90070/9) 인 경우 필수) */
  laundryDesc?: string;
}

interface ProductContentShowPopProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  productInfo?: ProductMngResponseProductInfo;
}

/**
 * components/popup/product/productMng/ProductModPop.tsx
 * desc: 품목정보 수정 팝업
 * Date: 2026/03/18
 * Author: park junsung
 * */
const ProductModPop = ({ open, onClose, onSuccess, productInfo }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  const vendorList = useVendorList();
  const updateProduct = useProductMngStore((s) => s.updateProduct);
  const deleteProduct = useProductMngStore((s) => s.deleteProduct);
  const { selectLowerPartnerCodeByCodeUpper } = usePartnerCodeStore();

  /** 카테고리 목록 */
  const { data: categoriesData } = useQuery({
    queryKey: ['partnerCode', PARTNER_CODE.categories.code],
    queryFn: () => selectLowerPartnerCodeByCodeUpper(PARTNER_CODE.categories.code, ''),
    enabled: open,
    staleTime: 60_000,
  });

  const categoryOptions = (categoriesData?.data?.body ?? []).map((c: any) => ({
    key: String(c.id),
    value: c.id,
    label: c.codeNm,
  }));

  /** 팝업 내부 local state */
  const [openModConf, setOpenAddConf] = useState<{ open: boolean; stored?: ProductMngRequestUpdateProduct }>({ open: false });
  const [openDelConf, setOpenDelConf] = useState(false);

  /** 품목 내용 입력 서식 */
  const {
    handleSubmit,
    control,
    setValue,
    reset,
    //formState: { errors, isValid },
  } = useForm<ProductModFields>({
    resolver: yupResolver(YupSchema.UpdateProductRequest()),
    mode: 'onChange',
  });

  /** 대분류(90010) / 소분류(90011) 공통코드 - 소분류는 선택한 대분류 코드로 시작하는 항목만 노출 */
  const { data: majorCodes } = useCode('90010');
  const { data: minorCodes } = useCode('90011');
  const majorCd = useWatch({ control, name: 'majorCd' });
  const prodTypeCode = useWatch({ control, name: 'prodTypeCode' });
  /** 세탁 타입이 기타(90070 / code_cd = 9) 인 경우에만 세탁 기타 설명 필수 노출 */
  const laundryTp = useWatch({ control, name: 'laundryTp' });
  const majorOptions = (majorCodes ?? []).map((c: any, i: number) => ({ key: i, value: c.codeCd, label: c.codeNm }));
  const minorOptions = (minorCodes ?? [])
    .filter((c: any) => !majorCd || String(c.codeCd).startsWith(String(majorCd)))
    .map((c: any, i: number) => ({ key: i, value: c.codeCd, label: c.codeNm }));

  const { mutate: updateProductMutate } = useMutation({
    mutationFn: updateProduct,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('수정되었습니다.');
          reset();
          if (onSuccess) onSuccess();
        } else {
          toastError(`컨텐츠 저장 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const { mutate: deleteProductMutate } = useMutation({
    mutationFn: deleteProduct,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          setOpenDelConf(false);
          reset();
          if (onSuccess) onSuccess();
        } else {
          toastError(`삭제 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  useEffect(() => {
    if (productInfo) {
      const includedWeathers: ('spring' | 'summer' | 'autumn' | 'winter')[] = [];
      Object.entries(productInfo).forEach(([key, value]) => {
        if (['isSpring', 'isSummer', 'isAutumn', 'isWinter'].includes(key)) {
          if (value == 'Y') {
            if (!includedWeathers.includes(key as 'spring' | 'summer' | 'autumn' | 'winter')) {
              includedWeathers.push(key == 'isSpring' ? 'spring' : key == 'isSummer' ? 'summer' : key == 'isAutumn' ? 'autumn' : 'winter');
            }
          }
        } else {
          setValue(key as keyof ProductModFields, value, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      });
      setValue('weather', includedWeathers, {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      reset(); // 초기화
    }
  }, [productInfo]);

  /** 프리필: 기존 prod_type_code(소분류)의 접두에서 대분류를 역산하여 대분류 콤보 채움 */
  useEffect(() => {
    if (!prodTypeCode || !majorCodes || majorCodes.length === 0) return;
    if (majorCd) return; // 이미 채워졌으면 skip
    const match = (majorCodes as any[])
      .filter((m) => String(prodTypeCode).startsWith(String(m.codeCd)))
      .sort((a, b) => String(b.codeCd).length - String(a.codeCd).length)[0];
    if (match) setValue('majorCd', match.codeCd);
  }, [prodTypeCode, majorCodes]);

  /** 대분류 변경 시 소분류 선택값이 더 이상 하위가 아니면 초기화 */
  useEffect(() => {
    if (prodTypeCode && majorCd && !String(prodTypeCode).startsWith(String(majorCd))) {
      setValue('prodTypeCode', undefined);
    }
  }, [majorCd]);

  // 입력이 유효한 경우
  const onValid: SubmitHandler<ProductModFields> = (data, event) => {
    if (productInfo && !productInfo.id) {
      console.error('품목정보는 전달되었으나 유효한 식별자를 찾을 수 없음');
      return;
    }
    let updateProductInfoReqObj: ProductMngRequestUpdateProduct = {
      ...data,
      makeYmd: dayjs(data?.makeYmd).format('YYYY-MM-DD'), // localDate 형식에 적합하도록 변환
    };
    if ((data as ProductModFields).weather.includes('spring')) {
      updateProductInfoReqObj = {
        ...updateProductInfoReqObj,
        isSpring: 'Y',
      };
    }
    if ((data as ProductModFields).weather.includes('summer')) {
      updateProductInfoReqObj = {
        ...updateProductInfoReqObj,
        isSummer: 'Y',
      };
    }
    if ((data as ProductModFields).weather.includes('autumn')) {
      updateProductInfoReqObj = {
        ...updateProductInfoReqObj,
        isAutumn: 'Y',
      };
    }
    if ((data as ProductModFields).weather.includes('winter')) {
      updateProductInfoReqObj = {
        ...updateProductInfoReqObj,
        isWinter: 'Y',
      };
    }
    setOpenAddConf({
      open: true,
      stored: updateProductInfoReqObj,
    });
  };

  // 유효하지 않은 경우
  const onInvalid: SubmitErrorHandler<ProductModFields> = (errors, event) => {
    //console.error(errors, getValues('id'));
    if (errors) {
      toastError('문제가 되는 영역 혹은 누락된 영역을 수정 및 추가한 후 재시도하십시요.');
    }
  };

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={900}
        open={open}
        isEscClose={true}
        title={'[' + productInfo?.prodNm + ' / ' + productInfo?.id + '] 의 정보를 수정'}
        onClose={onClose}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left">
                <button
                  className="btn btn_primary"
                  onClick={() => {
                    handleSubmit(onValid, onInvalid)(); // 함수를 반환하므로 다음과 같이, 호출하여야
                  }}
                >
                  저장
                </button>
                {productInfo?.id && (
                  <button className="btn" style={{ color: '#e24b4a', borderColor: '#e24b4a' }} onClick={() => setOpenDelConf(true)}>
                    삭제
                  </button>
                )}
              </div>
              <div className="right">
                <button
                  className="btn"
                  onClick={() => {
                    onClose();
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
          <PopupFormBox className={''}>
            <PopupFormGroup title={'품목정보'}>
              <PopupFormType className={'type2'}>
                <FormInput<ProductModFields> control={control} name={'prodNm'} label={'품목명'} placeholder={'제목'} />
                <FormInput<ProductModFields> control={control} name={'orgProdNm'} label={'원품목명'} />
              </PopupFormType>
              <PopupFormType className={'type2'}>
                <FormInput<ProductModFields> control={control} name={'orgAmt'} label={'원가'} />
                <FormInput<ProductModFields> control={control} name={'sellAmt'} label={'판매가'} />
              </PopupFormType>
              <PopupFormType className={'type2'}>
                <FormDropDown<ProductModFields>
                  control={control}
                  name={'weather'}
                  title={'계절'}
                  multiple={true}
                  options={[
                    { key: 0, value: 'spring', label: '봄' },
                    { key: 1, value: 'summer', label: '여름' },
                    { key: 2, value: 'autumn', label: '가을' },
                    { key: 3, value: 'winter', label: '겨울' },
                  ]}
                />
                <FormInput<ProductModFields> control={control} name={'discountRate'} label={'할인율'} />
              </PopupFormType>
              <PopupFormType className={'type2'}>
                <Controller
                  control={control}
                  name={'vendorId'}
                  render={({ field }) => (
                    <TunedReactSelector
                      title={'협력업체'}
                      placeholder={'협력업체 검색'}
                      required
                      values={field.value ?? undefined}
                      options={vendorList.data ?? []}
                      onChange={(option) => field.onChange(option?.value ?? undefined)}
                      onErased={() => field.onChange(undefined)}
                    />
                  )}
                />
                <FormDropDown<ProductModFields>
                  control={control}
                  name={'showYn'}
                  title={'전시여부'}
                  options={[
                    { key: 0, value: 'Y', label: '전시' },
                    { key: 1, value: 'N', label: '미전시' },
                  ]}
                  placeholder={'선택'}
                />
              </PopupFormType>
              <PopupFormType className={'type2'}>
                <FormInput<ProductModFields> control={control} name={'composition'} label={'혼용율'} />
                <Controller
                  control={control}
                  name={'categoryIds'}
                  render={({ field }) => (
                    <TunedReactSelector
                      title={'카테고리 추가'}
                      isMulti
                      placeholder={'선택 (복수 가능)'}
                      options={categoryOptions}
                      multiValues={field.value ?? []}
                      onChangeMulti={(vals) => field.onChange(vals.map((v) => Number(v)))}
                    />
                  )}
                />
              </PopupFormType>
              {/* 대분류(90010) / 소분류(90011) — 소분류 = prod_type_code */}
              <PopupFormType className={'type2'}>
                <FormDropDown<ProductModFields>
                  control={control}
                  name={'majorCd'}
                  title={'대분류'}
                  options={majorOptions}
                  placeholder={'대분류 선택'}
                />
                <FormDropDown<ProductModFields>
                  control={control}
                  name={'prodTypeCode'}
                  title={'소분류'}
                  options={minorOptions}
                  placeholder={majorCd ? '소분류 선택' : '대분류 먼저 선택'}
                />
              </PopupFormType>
              {/* 신상번호 + 등록일자 — 두 칸(type2) 배치 */}
              <PopupFormType className={'type2'}>
                <FormInput<ProductModFields> control={control} name={'sinsangNo'} label={'신상번호'} />
                <FormDatePicker<ProductModFields> control={control} name={'makeYmd'} title={'등록일자'} />
              </PopupFormType>
              <PopupFormType className={'type_1'}>
                <FormInput<ProductModFields> control={control} name={'detInfo'} label={'상품설명'} inputType={'textarea'} style={{ height: 120 }} />
              </PopupFormType>
              {/* 원단 정보(두께/신축성/비침/안감/세탁) — 모두 필수 코드 선택 */}
              <PopupFormType className={'type2'}>
                <FormDropDown<ProductModFields> control={control} name={'thickTp'} title={'두께'} codeUpper={'90030'} placeholder={'선택'} required />
                <FormDropDown<ProductModFields> control={control} name={'spanTp'} title={'신축성'} codeUpper={'90040'} placeholder={'선택'} required />
              </PopupFormType>
              <PopupFormType className={'type2'}>
                <FormDropDown<ProductModFields> control={control} name={'showTp'} title={'비침'} codeUpper={'90050'} placeholder={'선택'} required />
                <FormDropDown<ProductModFields> control={control} name={'transTp'} title={'안감'} codeUpper={'90060'} placeholder={'선택'} required />
              </PopupFormType>
              <PopupFormType className={'type2'}>
                <FormDropDown<ProductModFields> control={control} name={'laundryTp'} title={'세탁'} codeUpper={'90070'} placeholder={'선택'} required />
                <FormInput<ProductModFields>
                  control={control}
                  name={'laundryDesc'}
                  label={'세탁방법설명'}
                  placeholder={'세탁방법설명 입력'}
                  required={laundryTp === '9'}
                />
              </PopupFormType>
            </PopupFormGroup>
          </PopupFormBox>
        </PopupContent>
      </PopupLayout>
      <ConfirmModal
        open={openModConf.open}
        title={`${openModConf.stored?.prodNm} 을(를) 작성하신 값으로 수정 하시겠습니까?`}
        confirmText={'저장'}
        onConfirm={() => {
          if (openModConf.stored) {
            updateProductMutate(openModConf.stored);
          } else {
            toastError('저장하고자 하는 입력 결과를 찾을 수 없습니다.');
            console.error('저장하고자 하는 입력 결과를 찾을 수 없습니다.');
          }
        }}
        onClose={() => {
          setOpenAddConf({
            open: false,
          });
        }}
      />
      <ConfirmModal
        open={openDelConf}
        title={`[${productInfo?.prodNm}] 품목을 삭제 하시겠습니까?`}
        warningMessage={'삭제 후 복구할 수 없습니다.'}
        confirmText={'삭제'}
        onConfirm={() => {
          if (productInfo?.id) {
            deleteProductMutate({ id: productInfo.id });
          } else {
            toastError('삭제할 품목의 식별자를 찾을 수 없습니다.');
          }
        }}
        onClose={() => setOpenDelConf(false)}
      />
    </div>
  );
};

export default ProductModPop;
