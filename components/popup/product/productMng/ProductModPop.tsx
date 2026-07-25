import React, { useEffect, useState } from 'react';
import { PopupFooter } from '@/components/popup/PopupFooter';
import { PopupContent } from '@/components/popup/PopupContent';
import { PopupLayout } from '@/components/popup/PopupLayout';
import PopupFormBox from '@/components/popup/content/PopupFormBox';
import PopupFormGroup from '@/components/popup/content/PopupFormGroup';
import PopupFormType from '@/components/popup/content/PopupFormType';
import FormInput from '@/components/form/FormInput';
import { SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '@/libs';
import { toastError, toastSuccess } from '@/components/ToastMessage';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ProductMngRequestUpdateProduct, ProductMngResponseProductInfo } from '@/generated';
import { useProductMngStore } from '@/stores/product/useProductMngStore';
import FormDropDown from '@/components/form/FormDropDown';
import FormDatePicker from '@/components/form/FormDatePicker';
import dayjs from 'dayjs';
import { useVendorList } from '@/customHook/useVendorList';

/** form 영역 입력 인터페이스 */
export interface ProductModFields extends ProductMngRequestUpdateProduct {
  weather: ('spring' | 'summer' | 'autumn' | 'winter')[];
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
                <FormInput<ProductModFields> control={control} name={'orgProdNm'} label={'원상품명'} />
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
                <FormDropDown<ProductModFields> control={control} name={'vendorId'} title={'협력업체'} multiple={false} options={vendorList.data} required />
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
              {/* 두께/신축성/비침/세탁/안감 — 임시 숨김 */}
              <PopupFormType className={'type_2'}>
                <FormInput<ProductModFields> control={control} name={'composition'} label={'혼용율'} />
              </PopupFormType>
              {/* 신상번호 + 등록일자 — 두 칸(type2) 배치 */}
              <PopupFormType className={'type2'}>
                <FormInput<ProductModFields> control={control} name={'sinsangNo'} label={'신상번호'} />
                <FormDatePicker<ProductModFields> control={control} name={'makeYmd'} title={'등록일자'} />
              </PopupFormType>
              <PopupFormType className={'type_1'}>
                <FormInput<ProductModFields> control={control} name={'detInfo'} label={'상품설명'} inputType={'textarea'} style={{ height: 120 }} />
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
