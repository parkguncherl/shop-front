import React, { useEffect, useRef, useState } from 'react';
import { MenuRequestUpdate, MenuResponsePaging } from '../../../../generated';
import { PopupContent, PopupFooter, PopupLayout } from '../../index';
import { PopupSearchBox, PopupSearchType } from '../../content';
import { DeleteConfirmModal, Input, toastError, toastSuccess } from '../../../index';
import { useCommonStore, useMenuStore } from '../../../../stores';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../../libs';
import FormInput from '../../../FormInput';
import Loading from '../../../Loading';

interface Props {
  data: MenuResponsePaging;
  callback?: () => void;
}

export type MenuFormData = Pick<MenuRequestUpdate, 'menuCd' | 'menuNm' | 'menuEngNm' | 'menuUri' | 'menuOrder' | 'upMenuNm'>;

export const MenuModPop = ({ data, callback }: Props) => {
  const menuUriTitle = data.menuCd?.trim().length === 2 ? 'ICO' : 'URI';
  const isUpMenu = data.upMenuCd == data.menuCd;
  const upMenuCd = data.upMenuCd;
  const id = data.id;
  const lowerMenuCnt = data.lowerMenuCnt || 0;
  const beforeMenuCd = data.menuCd;
  const el = useRef<HTMLDListElement | null>(null);
  const {
    watch,
    handleSubmit,
    control,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<MenuFormData>({
    resolver: yupResolver(YupSchema.MenuRequestForUpdate({ menuCd: data.menuCd, upMenuCd: data.upMenuCd, menuUriTitle })), // 완료
    defaultValues: {
      menuCd: data.menuCd,
      menuNm: data.menuNm,
      menuEngNm: data.menuEngNm,
      menuUri: data.menuUri,
      menuOrder: data.menuOrder,
    },
    mode: 'onSubmit',
  });

  const queryClient = useQueryClient();
  const [modalType, closeModal] = useMenuStore((s) => [s.modalType, s.closeModal]);
  const [updateMenu, deleteMenu] = useMenuStore((s) => [s.updateMenu, s.deleteMenu]);
  const [menuUpdYn, menuExcelYn] = useCommonStore((s) => [s.menuUpdYn, s.menuExcelYn]);
  const [confirmModal, setConfirmModal] = useState(false);

  /** 변경  */
  const { mutate: updateMenuMutate, isLoading: updateIsLoading } = useMutation(updateMenu, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['/menu/leftMenu'] }),
            queryClient.invalidateQueries({ queryKey: ['/auth/check/menu'] }),
            queryClient.invalidateQueries({ queryKey: ['/menu/paging'] }),
            queryClient.invalidateQueries({ queryKey: ['/menu/top'] }),
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
  const { mutate: deleteMenuMutate, isLoading: deleteIsLoading } = useMutation(deleteMenu, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
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
  });

  const onValid: SubmitHandler<MenuRequestUpdate> = (data) => {
    if (isUpMenu) {
      if (beforeMenuCd != data.menuCd) {
        if (lowerMenuCnt > 0) {
          toastError('하위메뉴가 있어 메뉴코드는 수정할 수 없습니다.');
          return;
        }
      }
      data.upMenuCd = data.menuCd;
    }
    console.log('data ==>', data);
    updateMenuMutate({ ...data, upMenuCd: upMenuCd, id: id });
  };

  useEffect(() => {
    console.log('수정데이터', data);
  }, []);

  return (
    <dl ref={el}>
      <form>
        <PopupLayout
          width={500}
          isEscClose={false}
          open={modalType.type === 'MOD' && modalType.active}
          title={menuUpdYn ? '메뉴 수정' : '메뉴 조회'}
          onClose={() => closeModal('MOD')}
          footer={
            menuUpdYn && (
              <PopupFooter>
                <div className={'btnArea'}>
                  <button className={'btn'} onClick={(e) => setConfirmModal(true)}>
                    {'삭제'}
                  </button>
                  <button className={'btn btnBlue'} onClick={handleSubmit(onValid)}>
                    {'저장'}
                  </button>
                  <button
                    className={'btn'}
                    onClick={(e) => {
                      closeModal('MOD');
                    }}
                  >
                    {'닫기'}
                  </button>
                </div>
                <DeleteConfirmModal
                  open={confirmModal}
                  onConfirm={() => {
                    if (lowerMenuCnt > 0) {
                      toastError('하위메뉴가 있어 삭제할 수 없습니다.');
                      return;
                    }
                    deleteMenuMutate(data);
                  }}
                  onClose={() => setConfirmModal(false)}
                />
              </PopupFooter>
            )
          }
        >
          <PopupContent>
            <PopupSearchBox>
              <PopupSearchType className={'type_1'}>
                <Input title={'상위코드'} disable={true} value={data.upMenuCd} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <Input title={'상위코드명'} disable={true} value={data.menuUpperNm} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<MenuRequestUpdate> control={control} name={'menuCd'} label={'코드'} required={true} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<MenuRequestUpdate> control={control} name={'menuNm'} label={'이름'} required={true} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<MenuRequestUpdate> control={control} name={'menuEngNm'} label={'영문명'} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<MenuRequestUpdate> control={control} name={'menuUri'} label={menuUriTitle} required={true} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<MenuRequestUpdate> control={control} name={'menuOrder'} label={'순서'} required={true} />
              </PopupSearchType>
            </PopupSearchBox>
          </PopupContent>
          {(updateIsLoading || deleteIsLoading) && <Loading />}
        </PopupLayout>
      </form>
    </dl>
  );
};
