import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PopupContent } from '../../../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../../../content';
import { Button } from '../../../../Button';
import { PopupFooter } from '../../../PopupFooter';
import { authApi } from '../../../../../libs';
import { toastError, toastSuccess } from '../../../../ToastMessage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiResponseListCodeDropDown, LogisResponsePaging } from '../../../../../generated';
import ExcelDownload from '../../../../excel/ExcelDownload';
import { CODE } from '../../../../../libs/const';
import ExcelUpload from '../../../../excel/ExcelUpload';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, GridSetting } from '../../../../../libs/ag-grid';
import CustomGridLoading from '../../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../../CustomNoRowsOverlay';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import { Table } from '../../../../content';
import { PopupLayout } from '../../../PopupLayout';

interface LocsetExcelUploadPopProps {
  onClose: () => void;
  logisData?: LogisResponsePaging[];
}

export const LocsetExcelUploadPop: React.FC<LocsetExcelUploadPopProps> = ({ logisData, onClose }) => {
  const queryClient = useQueryClient();
  const [zoneCodes, setZoneCodes] = useState<(string | undefined)[]>([]);
  const [codes, setCodes] = useState({
    logisCodes: [] as (string | undefined)[],
    zoneCodes: [] as (string | undefined)[],
  });
  const [isExcelTemplate, setIsExcelTemplate] = useState<boolean>(false);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [invalidData, setInvalidData] = useState<any[]>([]);

  const excelTemplateHeaders = [
    { header: '창고명', key: 'logisNm', width: 30 },
    { header: 'ZONE 코드명', key: 'zoneCdNm', width: 30 },
    { header: '위치', key: 'location', width: 50 },
    { header: '위치 설명', key: 'locCntn', width: 70 },
  ];

  const onGridReady = (params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  };

  const locsetColumns = useMemo<ColDef<any>[]>(
    () => [
      {
        field: 'no',
        headerName: 'No',
        editable: false,
        minWidth: 50,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'logisNm',
        headerName: '창고명',
        editable: false,
        minWidth: 100,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'zoneCdNm',
        headerName: 'ZONE 코드명',
        editable: false,
        minWidth: 150,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'location',
        headerName: '위치',
        editable: false,
        minWidth: 150,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'locCntn',
        headerName: '위치 설명',
        editable: false,
        minWidth: 150,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
    ],
    [zoneCodes],
  );

  // Zone코드 목록조회
  const {
    data: zoneCodesData,
    isLoading: isZoneCodeLoading,
    isSuccess: isZoneCodeSuccess,
  } = useQuery(
    ['zoneCodes'],
    () =>
      authApi.get<ApiResponseListCodeDropDown>('/code/dropdown', {
        params: {
          codeUpper: CODE.logis,
        },
      }),
    {},
  );

  useEffect(() => {
    if (isZoneCodeSuccess && zoneCodesData && logisData) {
      const { resultCode, body, resultMessage } = zoneCodesData.data;
      if (resultCode === 200) {
        const zoneCodeNames = body?.map((item) => item.codeNm);
        if (zoneCodeNames) setZoneCodes(zoneCodeNames);
        console.log('Excel Upload codes', { logisData: logisData, zoneData: body });
      }
    }
  }, [isZoneCodeSuccess, zoneCodesData]);

  //엑셀데이타가 들어올 경우 데이타검증 처리
  useEffect(() => {
    if (excelData?.length) {
      const validData: any[] = [];
      const invalidData: any[] = [];
      console.log('excelData:', excelData);

      //창고, Zone코드값 검증
      const logisDatas = logisData?.map((logis) => logis.logisNm);
      excelData.forEach((row) => {
        if (!logisDatas?.includes(row['logisNm']) || !zoneCodes?.includes(row['zoneCdNm'])) {
          invalidData.push(row);
        } else {
          validData.push(row);
        }
      });

      //데이타 중복 검증 (3가지 key값)
      const duplicates = findDuplicates(excelData, 'logisNm', 'zoneCdNm', 'location');
      console.log('duplicatedData:', duplicates);
      if (duplicates) {
        duplicates.forEach((row: any) => {
          invalidData.push(row);
        });
      }
      setInvalidData(invalidData);
      console.log('invalidData', invalidData);
    }
  }, [excelData]);

  // 두 개의 속성과 중복되는 객체 찾기
  const findDuplicates = (excelData: any, key1: string, key2: string, key3: string) => {
    return excelData.filter((item: any, index: number, self: any) =>
      self.some(
        (otherItem: any, otherIndex: number) =>
          otherIndex !== index && item[key1] === otherItem[key1] && item[key2] === otherItem[key2] && item[key3] === otherItem[key3],
      ),
    );
  };

  //엑셀 템플릿 다운로드
  const handleExcelTemplate = () => {
    if (logisData && zoneCodes) {
      setCodes({
        logisCodes: logisData.map((logis) => logis.logisNm),
        zoneCodes: zoneCodes,
      });
    }
    setIsExcelTemplate(true);
  };

  // 엑셀 데이터가 Json으로 파싱되면 콜백으로 받아서 처리
  const handleDataParsed = (data: any[]) => {
    setExcelData(data);
    console.log('Parsed Excel Data:', data); // 콘솔에 데이터 출력
  };

  const handleUpload = (e: React.MouseEvent) => {
    e.preventDefault();

    if (excelData.length > 0 && invalidData.length === 0) {
      authApi.post('/locset/excel-upload', excelData, {}).then((response) => {
        if (response.data.resultCode === 200) {
          toastSuccess('업로드되었습니다.');
          queryClient.invalidateQueries(['/locset/paging']);
          onClose();
        } else {
          toastError(response.data.resultMessage);
          onClose();
        }
      });
    } else {
      toastError('선택된 파일이 없습니다.');
      return;
    }
  };

  return (
    <PopupLayout
      width={600}
      isEscClose={true}
      open={true}
      title={'적치위치 엑셀 파일 업로드'}
      onClose={onClose}
      footer={
        <PopupFooter>
          <div className={'btnArea'}>
            <button className={'btn excelDownload'} onClick={handleExcelTemplate}>
              엑셀 템플릿 다운로드
            </button>
            <button
              className={`btn excelUpload ${invalidData.length > 0 || excelData.length === 0 ? 'btnGray disabled' : ''}`}
              onClick={handleUpload}
              disabled={invalidData.length > 0 || excelData.length === 0}
            >
              엑셀 업로드
            </button>
            <button className={'btn'} onClick={onClose}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          <PopupSearchType className={'type_1'}>
            <ExcelUpload onDataParsed={handleDataParsed} templateHeaders={excelTemplateHeaders} />
          </PopupSearchType>
          {excelData.length > 0 && (
            <PopupSearchType className={'type_1'}>
              <dl>
                <>
                  <dt>
                    <label>데이타 검증 오류 (창고,ZONE코드 입력오류 및 중복오류)</label>
                  </dt>
                  <dd>
                    {invalidData.length > 0 ? (
                      <Table>
                        <div className="ag-theme-alpine" style={{ width: '100%', height: '400px' }}>
                          <AgGridReact
                            rowData={invalidData}
                            columnDefs={locsetColumns}
                            defaultColDef={defaultColDef}
                            onGridReady={onGridReady}
                            gridOptions={{ rowHeight: 24, headerHeight: 35 }}
                            loadingOverlayComponent={CustomGridLoading}
                            noRowsOverlayComponent={CustomNoRowsOverlay}
                          />
                        </div>
                      </Table>
                    ) : (
                      <div>검증이 완료되었습니다.</div>
                    )}
                  </dd>
                </>
              </dl>
            </PopupSearchType>
          )}
        </PopupSearchBox>
        {isExcelTemplate && <ExcelDownload columns={excelTemplateHeaders} fileName="적치위치설정템플릿" codes={codes} initCallState={setIsExcelTemplate} />}
      </PopupContent>
    </PopupLayout>
  );
};
