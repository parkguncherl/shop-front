import React, { useRef, useState } from 'react';
import { useMenuStore } from '../../../../stores';
import { useTranslation } from 'react-i18next';
import { PopupContent } from '../../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../../content';
import { Button } from '../../../Button';
import { PopupFooter } from '../../PopupFooter';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { authApi } from '../../../../libs';
import { useQueryClient } from '@tanstack/react-query';
import ModalLayout from '../../../ModalLayout';
import { Utils } from '../../../../libs/utils';

interface Props {
  callback?: () => void;
}

export const MenuExcelUploadPop = ({ callback }: Props) => {
  const queryClient = useQueryClient();

  /** 메뉴접근 권한관리 스토어 - State */
  const [modalType, closeModal, excelUpload] = useMenuStore((s) => [s.modalType, s.closeModal, s.excelUpload]);

  const { t } = useTranslation();

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | undefined>();

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile);
  };

  const handleUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    const formData = new FormData();

    if (file) {
      if (Utils.isNotAllowedFileMaxSize(file)) {
        toastError(t('파일 사이즈가 50MB를 초과하였습니다.') || '');
        return;
      }

      formData.append('uploadFile', file);

      authApi
        .post('/menu/excelUpload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then(async (response) => {
          if (response.data.resultCode === 200) {
            toastSuccess(t('업로드되었습니다.') || '');
            await Promise.all([queryClient.invalidateQueries(['/menu/leftMenu']), queryClient.invalidateQueries(['/menu/paging'])]);
            closeModal('EXCEL');
          } else {
            toastError(response.data.resultMessage);
            closeModal('EXCEL');
            throw new Error(response.data.resultMessage);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      toastError(t('선택된 파일이 없습니다.') || '');
      return;
    }
  };

  return (
    <ModalLayout
      width={800}
      open={modalType.type === 'EXCEL' && modalType.active}
      title={t('엑셀 파일 업로드') || ''}
      onClose={() => closeModal('EXCEL')}
      footer={
        <PopupFooter>
          <div className={'btn_box'}>
            <button className={'btn_grayline'} onClick={handleUpload}>
              {t('엑셀일괄 업로드') || ''}
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
                <label>{t('업로드 파일') || ''}</label>
              </dt>
              <dd>
                <div className={'form_box'}>
                  <input ref={inputRef} type={'file'} onChange={handleFileInputChange} />
                </div>
              </dd>
            </dl>
          </PopupSearchType>
        </PopupSearchBox>
      </PopupContent>
    </ModalLayout>
  );
};
