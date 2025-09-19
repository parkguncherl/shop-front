import React, { useCallback, useRef, useState } from 'react';
import { Button } from '../../../Button';
import { PopupContent, PopupFooter } from '../../index';
import { PopupSearchBox, PopupSearchType } from '../../content';
import { DeleteConfirmModal, Input, toastError, toastSuccess } from '../../../index';
import { useCommonStore, useAttributeStore } from '../../../../stores';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../../libs';
import FormInput from '../../../FormInput';
import ModalLayout from '../../../ModalLayout';
import Loading from '../../../Loading';
import FormDropDown from '../../../FormDropDown';
import { AttributeResponsePaging, AttributeRequestUpdate } from '../../../../generated';
import useAppStore from '../../../../stores/useAppStore'; // openapi generator 에 의하여 생성된 본 인터페이스를 사용

interface Attribute {
  data: AttributeResponsePaging;
  callback?: () => void;
}

type AttributeRequestUpdateFields = {
  attrNm: string;
  attrEngNm: string;
  attrType: string;
  attrCat: string;
  attrDesc: string;
};

export const AttributeModPop = ({ data, callback }: Attribute) => {
  const { t } = useTranslation();
  const el = useRef<HTMLDListElement | null>(null);
  const { handleSubmit, control } = useForm<AttributeRequestUpdateFields>({
    // resolver: yupResolver(YupSchema.AttributeRequest(t)), todo 유효성 검증은 추후 필요할 시 활성화
    defaultValues: data, // 속성 수정 폼의 기본값은 기존의 값으로 함
    mode: 'onSubmit',
  });

  const { session } = useAppStore();

  const queryClient = useQueryClient();
  // 삭제 기능은 구현하지 않음, todo 필요할 시 추가
  const [modalType, closeModal, updateAttribute] = useAttributeStore((s) => [s.modalType, s.closeModal, s.updateAttribute]);
  //const [menuUpdYn, menuExcelYn] = useCommonStore((s) => [s.menuUpdYn, s.menuExcelYn]);
  //const [confirmModal, setConfirmModal] = useState(false);

  /** 변경  */
  const { mutate: updateAttributeMutate, isLoading: updateIsLoading } = useMutation(updateAttribute, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess(t('저장되었습니다.') || '');
          await Promise.all([
            // 업데이트에 성공할 시 invalidateQueries 메서드로 특정 경로(해당하는 queryKey)의 cache를 무효화
            queryClient.invalidateQueries(['/attribute/paging']),
          ]);
          closeModal('MOD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 삭제 */
  /* const { mutate: deleteMenuMutate, isLoading: deleteIsLoading } = useMutation(deleteMenu, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess(t('삭제되었습니다.') || '');
          await Promise.all([
            queryClient.invalidateQueries(['/menu/leftMenu']),
            queryClient.invalidateQueries(['/auth/check/menu']),
            queryClient.invalidateQueries(['/menu/paging']),
            queryClient.invalidateQueries(['/menu/top']),
          ]);
          closeModal('MOD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  }); */

  const onValid: SubmitHandler<AttributeRequestUpdateFields> = (data) => {
    // 별도 검증 로직이 필요할 시 본 영역에 작성
    //updateAttributeMutate(data);
  };

  return (
    <dl ref={el}>
      <form>
        <ModalLayout
          width={800}
          open={modalType.type === 'MOD' && modalType.active}
          title={'속성수정'}
          onClose={() => closeModal('MOD')}
          footer={
            <PopupFooter>
              <div className={'btnArea'}>
                <button className={'btn btnBlue'} onClick={handleSubmit(onValid)}>
                  {t('저장') || ''}
                </button>
              </div>
              <div className={'btnArea'}>
                <button className={'btn'}>{t('삭제') || ''}</button>
              </div>
            </PopupFooter>
          }
        >
          <PopupContent>
            <PopupSearchBox>
              <PopupSearchType className={'type_1'}>
                <FormInput<AttributeRequestUpdateFields> control={control} name={'attrNm'} label={t('속성명') || ''} required={true} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<AttributeRequestUpdateFields> control={control} name={'attrEngNm'} label={t('속성영문명') || ''} required={true} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormDropDown<AttributeRequestUpdateFields>
                  control={control}
                  name={'attrType'}
                  title={t('속성타입') || ''}
                  options={[
                    {
                      key: 1,
                      value: 'N',
                      label: '숫자',
                    },
                    {
                      key: 2,
                      value: 'T',
                      label: '문자',
                    },
                    {
                      key: 3,
                      value: 'D',
                      label: '날짜',
                    },
                    {
                      key: 4,
                      value: 'J',
                      label: 'json',
                    },
                  ]}
                />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormDropDown<AttributeRequestUpdateFields>
                  control={control}
                  name={'attrCat'}
                  title={t('속성유형') || ''}
                  options={[
                    {
                      key: 1,
                      value: 'S',
                      label: '단일',
                    },
                    {
                      key: 2,
                      value: 'M',
                      label: '복수',
                    },
                    {
                      key: 3,
                      value: 'A',
                      label: '범위',
                    },
                  ]}
                />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <Input title={t('수정 id') || ''} disable={true} value={session?.user?.loginId} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<AttributeRequestUpdateFields> control={control} name={'attrDesc'} label={t('속성설명') || ''} required={true} />
              </PopupSearchType>
            </PopupSearchBox>
          </PopupContent>
          {updateIsLoading && <Loading />}
        </ModalLayout>
      </form>
    </dl>
  );
};
