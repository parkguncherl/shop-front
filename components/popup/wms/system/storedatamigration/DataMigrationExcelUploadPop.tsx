import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PopupContent } from '../../../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../../../content';
import { PopupFooter } from '../../../PopupFooter';
import { authApi } from '../../../../../libs';
import { toastError, toastSuccess } from '../../../../ToastMessage';
import { PopupLayout } from '../../../PopupLayout';
import { MigrationTemplate } from './migrationTemplate';
import MigrationTemplateDownload from '../../../../excel/MigrationTemplateDownload';
import MigrationExcelUpload from '../../../../excel/MigrationExcelUpload';
import Loading from '../../../../Loading';
import DataMigrationPop from '../DataMigrationPop';

interface DataMigrationExcelUploadPop {
  transTp: string | undefined;
  partnerId: number;
  onClose: () => void;
}

export const DataMigrationExcelUploadPop: React.FC<DataMigrationExcelUploadPop> = ({ transTp, partnerId, onClose }) => {
  const [isExcelTemplate, setIsExcelTemplate] = useState<boolean>(false);
  const [excelData, setExcelData] = useState<any>();
  const [migrationType, setMigrationType] = useState<string>();
  const [template, setTemplate] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorPop, setErrorPop] = useState<boolean>(false);

  useEffect(() => {
    const selectedMigrationType = MigrationTemplate.find((item) => item.typeCd === transTp)?.type;
    setMigrationType(selectedMigrationType);

    // 이관 타입에 맞는 템플릿 상태 저장
    if (selectedMigrationType) {
      const template: any = MigrationTemplate.find((item: any) => item.type === selectedMigrationType);

      if (!template) {
        toastError('해당되는 템플릿이 없습니다.');
      } else {
        console.log('템플릿 >>', template);
        setTemplate(template);
      }
    }
  }, []);

  // 엑셀 데이터가 Json으로 파싱되면 콜백으로 받아서 처리
  const handleDataParsed = (excelData: string) => {
    const uploadParam = {
      partnerId: partnerId,
      transTp: transTp,
      transJson: excelData,
    };
    setExcelData(uploadParam);
  };

  // 엑셀 업로드 버튼 이벤트
  const handleUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    // console.log('업로드 데이타', excelData.transJson);
    if (excelData) {
      setIsLoading(true);

      authApi.post('/migration/excel-upload', excelData, {}).then((response) => {
        if (response.data.resultCode === 200) {
          if (response.data.resultMessage) {
            setErrorMessage(response.data.resultMessage);
            setErrorPop(true);
          } else {
            toastSuccess('업로드되었습니다.');
            onClose();
          }
        } else {
          toastError(response.data.resultMessage);
          onClose();
        }
        setIsLoading(false);
      });
    } else {
      toastError('선택된 파일이 없습니다.');
      return;
    }
  };

  return (
    <>
      <PopupLayout
        width={860}
        isEscClose={true}
        open={true}
        title={`${migrationType} 이관 엑셀 업로드`}
        onClose={onClose}
        footer={
          <PopupFooter>
            <div className={'btnArea'}>
              <button className={'btn excelDownload'} onClick={() => setIsExcelTemplate(true)}>
                엑셀 템플릿 다운로드
              </button>
              <button className={`btn excelUpload ${!excelData ? 'btnGray disabled' : ''}`} onClick={handleUpload} disabled={!excelData}>
                엑셀 업로드
              </button>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <PopupSearchBox>
            <PopupSearchType className={'type_1'}>
              <MigrationExcelUpload templateHeaders={template?.column} onDataParsed={handleDataParsed} />
            </PopupSearchType>
          </PopupSearchBox>
          {isExcelTemplate && <MigrationTemplateDownload template={template} initCallState={setIsExcelTemplate} />}
        </PopupContent>
      </PopupLayout>
      {isLoading && <Loading />}
      {errorPop ? <DataMigrationPop message={errorMessage} state={errorPop} setState={setErrorPop} /> : ''}
    </>
  );
};
