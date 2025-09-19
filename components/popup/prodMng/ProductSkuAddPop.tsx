import React from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../content';
import FormInput from '../../FormInput';
import { PopupLayout } from '../PopupLayout';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../libs';
import { useProductMngStore } from '../../../stores/useProductMngStore';
import CustomCheckBoxGroup from '../../CustomCheckBoxGroup';
import { Utils } from '../../../libs/utils';

export type ProductSkuRequestCreateFields = {
  skuSizes: string[];
  skuColors: string[];
  orgAmt: string;
  stdSellAmt: string;
  sellAmt: string;
  marRate: string;
};

type Props = {
  handleSkuInfo: (data: ProductSkuRequestCreateFields) => void;
  sizeData: any[];
};

/** Sku 한번에넣기 팝업 */
const ProductAddPop = ({ handleSkuInfo, sizeData }: Props) => {
  /** 스토어 */
  const [modals, closeModal] = useProductMngStore((s) => [s.modals, s.closeModal]);

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<ProductSkuRequestCreateFields>({
    resolver: yupResolver(YupSchema.ProductSkuAddRequest()), // 완료
    defaultValues: {},
    mode: 'onSubmit',
  });

  const onValid: SubmitHandler<ProductSkuRequestCreateFields> = (data) => {
    //insertProductMutate(data);
    handleSkuInfo(data);
    closeModal('SKUADD');
  };

  // 스큐 컬러 데이터분리
  const handleSkuColorsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const colorsArray = value.split(',').map((color) => color.trim()); // 쉼표로 분리하고 공백 제거
    // 배열로 변환
    reset((prev) => ({
      ...prev,
      skuColors: colorsArray,
    }));
  };

  // 가격 , 표시 함수
  const handleCommaFormattedInput = (fieldName: 'sellAmt' | 'stdSellAmt' | 'orgAmt') => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const numericValue = Utils.removeComma(rawValue); // 쉼표 제거

      // 상태 업데이트
      setValue(fieldName, numericValue);

      // 포맷팅된 값을 입력 필드에 표시
      event.target.value = Utils.setComma(numericValue);
    };
  };

  const handleStdSellAmtChange = handleCommaFormattedInput('stdSellAmt');
  const handleSellAmtChange = handleCommaFormattedInput('sellAmt');

  // 마진율 계산 함수
  const calculateMarginRate = (stdSellAmt: string, sellAmt: string): string => {
    const stdSellAmtNum = parseFloat(Utils.removeComma(stdSellAmt)) || 0;
    const sellAmtNum = parseFloat(Utils.removeComma(sellAmt)) || 0;

    if (stdSellAmtNum === 0 || sellAmtNum === 0) return '';
    const marginRate = ((sellAmtNum - stdSellAmtNum) / stdSellAmtNum) * 100;
    return marginRate.toFixed(2); // 소수점 2자리까지 표시
  };

  // 원가, 판매가가 변경될 때마다 마진율을 계산하고 업데이트하는 함수
  const updateMarginRate = () => {
    const stdSellAmtStr = getValues('stdSellAmt'); // 상태에서 원가 가져오기
    const sellAmtStr = getValues('sellAmt'); // 상태에서 판매가 가져오기

    const newMarRate = calculateMarginRate(stdSellAmtStr, sellAmtStr); // 마진율 계산
    setValue('marRate', newMarRate); // 마진율 업데이트
  };

  // 원가 변경 시 마진율도 함께 업데이트하는 함수
  const handleStdSellAmtChangeMarRate = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleStdSellAmtChange(event); // 원가 변경 처리
    updateMarginRate(); // 마진율 업데이트
  };

  // 판매가 변경 시 마진율도 함께 업데이트하는 함수
  const handleSellAmtChangeMarRate = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleSellAmtChange(event); // 판매가 변경 처리
    updateMarginRate(); // 마진율 업데이트
  };

  return (
    <PopupLayout
      width={620}
      isEscClose={true}
      open={modals.SKUADD.active}
      title={'스큐 등록'}
      onClose={() => {
        closeModal('SKUADD');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" title="저장" onClick={handleSubmit(onValid)}>
              저장
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('SKUADD')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          <PopupSearchType className={'type_1'}>
            <dl>
              <dt>
                사이즈<span className={'req'}>*</span>
              </dt>
              <dd>
                <CustomCheckBoxGroup<ProductSkuRequestCreateFields>
                  control={control}
                  name={'skuSizes'}
                  values={sizeData}
                  checkedValues={getValues('skuSizes') || []}
                />
              </dd>
            </dl>
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <FormInput<ProductSkuRequestCreateFields>
              control={control}
              name={'skuColors'}
              label={'컬러'}
              placeholder={'콤마로 구분,'}
              required={true}
              onChange={handleSkuColorsChange}
            />
          </PopupSearchType>

          <PopupSearchType className={'type_1'}>
            <FormInput<ProductSkuRequestCreateFields>
              control={control}
              name={'orgAmt'}
              label={'원가'}
              placeholder={''}
              required={true}
              onChange={handleCommaFormattedInput('orgAmt')}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <FormInput<ProductSkuRequestCreateFields>
              control={control}
              name={'stdSellAmt'}
              label={'기준가'}
              placeholder={''}
              required={true}
              onChange={handleStdSellAmtChangeMarRate}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <FormInput<ProductSkuRequestCreateFields>
              control={control}
              name={'sellAmt'}
              label={'판매가'}
              placeholder={''}
              required={true}
              onChange={handleSellAmtChangeMarRate}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <FormInput<ProductSkuRequestCreateFields> control={control} name={'marRate'} label={'마진율'} placeholder={''} required={false} disable={true} />
          </PopupSearchType>
        </PopupSearchBox>
      </PopupContent>
      {/*<Loading />*/}
    </PopupLayout>
  );
};

export default ProductAddPop;
