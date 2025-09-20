import React, { useRef, useState } from 'react';
import { useCodeStore } from '../../../../stores';
import { useTranslation } from 'react-i18next';
import { PopupContent } from '../../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../../content';
import { Button } from '../../../Button';
import { PopupFooter } from '../../PopupFooter';
import { authApi } from '../../../../libs';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { useQueryClient } from '@tanstack/react-query';
import ModalLayout from '../../../ModalLayout';
import { Utils } from '../../../../libs/utils';
import { PopupLayout } from '../../PopupLayout';

export const CodeExcelUploadPop = () => {
  /** 코드관리 스토어 - State */
  const [modalType, closeModal] = useCodeStore((s) => [s.modalType, s.closeModal]);

  /** 코드관리 스토어 - API */
  const [excelTemplate] = useCodeStore((s) => [s.excelTemplate]);

  const { t } = useTranslation();

  const queryClient = useQueryClient();

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
        .post('/code/excel-upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then((response) => {
          if (response.data.resultCode === 200) {
            toastSuccess(t('업로드되었습니다.') || '');
            queryClient.invalidateQueries(['/code/paging']);
            queryClient.invalidateQueries(['/code/dropdown/TOP']);
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

  /** 엑셀 템플릿 다운로드 버튼 클릭 시 */
  const excelTemplateFn = () => {
    excelTemplate();
  };

  return (
    <PopupLayout
      width={600}
      isEscClose={true}
      open={modalType.type === 'EXCEL' && modalType.active}
      title={t('엑셀 파일 업로드') || ''}
      onClose={() => closeModal('EXCEL')}
      footer={
        <PopupFooter>
          <div className={'btnArea'}>
            <button className={'btn'} onClick={excelTemplateFn}>
              {t('엑셀 템플릿 다운로드') || ''}
            </button>
            <button className={'btn'} onClick={handleUpload}>
              {t('엑셀 업로드') || ''}
            </button>
            <button className={'btn'} onClick={() => closeModal('EXCEL')}>
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
    </PopupLayout>
  );
};
