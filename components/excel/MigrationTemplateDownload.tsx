import React, { useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toastError, toastSuccess } from '../ToastMessage';
import ExcelDownload from './ExcelDownload';
import data from '@react-google-maps/api/src/components/drawing/Data';
import { bold } from 'next/dist/lib/picocolors';

type ExcelDownloadProps = {
  template: {
    type: string;
    column: Array<{ header: string; width: number; required: boolean; comment: string }>;
  };
  initCallState: React.Dispatch<React.SetStateAction<boolean>>;
};

const MigrationTemplateDownload: React.FC<ExcelDownloadProps> = ({ template, initCallState }) => {
  useEffect(() => {
    console.log('엑셀템플릿 다운로드 Props:', { template: template });
    handleDownload(template);
  }, []);

  // 엑셀 다운로드 함수
  const handleDownload = async (template: any) => {
    try {
      const { type, column } = template;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(template?.type ?? 'sheet1');

      // 헤더 설정
      if (column) {
        console.log('column>>', column);

        // 컬럼 설정
        sheet.columns = column.map(({ header, width }: { header: string; width: number }) => ({
          header, // 헤더 이름
          width: width, // 열 너비 설정
        }));

        // 첫 번째 열에 설명 추가
        column.forEach((item: any, index: number) => {
          sheet.getCell(1, index + 1).value = item.comment; // 첫 번째 행에 추가
        });

        // 컬럼 헤더 추가 (기존 컬럼 정의와 맞춰 2번째 행에 추가)
        sheet.addRow(column.map((item: any) => item.header));

        // 스타일 적용 (첫 번째 행)
        sheet.getRow(1).eachCell((cell) => {
          const text = cell.value?.toString() || '';
          const isRequired = text.includes('필수'); // "필수"가 포함된 경우

          cell.font = { italic: true, size: 14, bold: true, color: { argb: isRequired ? 'FFCC0000' : 'FF0000FF' } }; // 폰트 스타일
          cell.alignment = { vertical: 'middle', horizontal: 'center' }; // 정렬
        });

        // 스타일 적용 (컬럼 헤더)
        sheet.getRow(2).eachCell((cell) => {
          cell.font = { bold: true, size: 12 };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDDDDDD' },
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
      }

      // 엑셀 파일 생성
      const buffer = await workbook.xlsx.writeBuffer();

      // 파일 다운로드
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${type} 이관 템플릿.xlsx`);
      toastSuccess('엑셀 다운로드가 완료되었습니다.');
    } catch (error) {
      toastError('엑셀 파일 생성 중 오류가 발생했습니다.');
    } finally {
      if (initCallState) initCallState(false); //호출상태 초기화
    }
  };

  return null;
};

export default MigrationTemplateDownload;
