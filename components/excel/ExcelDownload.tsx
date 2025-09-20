import React, { useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toastError, toastSuccess } from '../ToastMessage';

type ExcelDownloadProps = {
  data?: Array<{ [key: string]: any }>; // 엑셀에 넣을 데이터
  columns?: Array<{ header: string; key: string; width: number }>; // 헤더 이름 및 키 목록
  codes?: { logisCodes: string[]; zoneCodes: string[] } | any; // 코드 시트에 넣을 코드 목록
  fileName?: string; // 다운로드할 파일명
  sheetName?: string; // 시트명 (옵션)
  initData?: React.Dispatch<React.SetStateAction<Array<{ [key: string]: any }>>>; // 엑셀데이타 초기화함수
  initCallState?: React.Dispatch<React.SetStateAction<boolean>>; //호출State 초기화함수
};

const ExcelDownload: React.FC<ExcelDownloadProps> = ({ data, columns, codes, fileName, sheetName = 'Sheet1', initData, initCallState }) => {
  useEffect(() => {
    console.log('엑셀다운로드 Props:', { data: data, columns: columns, codes: codes });
    handleDownload();
  }, []);

  // 엑셀 다운로드 함수
  const handleDownload = async () => {
    if (data?.length === 0) {
      toastError('엑셀로 변환할 데이터가 없습니다.');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const mainSheet = workbook.addWorksheet(sheetName);

      // 헤더 설정
      // { header: 'ID', key: 'id' }와 같이 key 값을 데이터에서 사용하는 키와 일치하게 설정해야 합니다.
      if (columns) {
        mainSheet.columns = columns.map(({ header, key, width }) => ({
          header, // 헤더 이름
          key, // 데이터 객체에서 참조할 key 값
          width: width, // 열 너비 설정
        }));
      }

      // 데이타 설정
      if (data) {
        data.forEach((item) => {
          mainSheet.addRow(item);
        });
      }

      // 헤더 스타일 (첫 번째 행 bold 처리)
      mainSheet.getRow(1).font = { bold: true };

      // 코드 시트 생성 (옵션)
      if (codes) {
        const codesKeys = Object.keys(codes);
        const sheets: any = {};

        for (const index in codesKeys) {
          const codeKey = codesKeys[index];
          const sheetName = `${codeKey} 목록`;

          sheets[`code${index}`] = workbook.addWorksheet(sheetName);

          const codeValues = codes[codeKey]; // 현재 코드의 값 가져오기
          codeValues.forEach((code: any, rowIndex: number) => {
            sheets[`code${index}`].getCell(`A${rowIndex + 1}`).value = code;
          });
          // codes.logisCodes?.forEach((code, index) => {
          //   code1Sheet.getCell(`A${index + 1}`).value = code; // 코드 목록을 A열에 추가
          // });
        }
        // 코드 시트 숨김 처리 (사용자 편의성을 위해 숨김)
        // codeSheet.state = 'hidden';
      }

      // 데이터 유효성 검사 추가 (코드 시트의 값을 참조)
      // 검사할 데이타가 있는 경우만 가능하다.
      // if (codes && codes.length > 0) {
      //   mainSheet.getColumn(1).eachCell((cell, rowNumber) => {
      //     if (rowNumber === 1) return; // 첫 번째 행은 헤더이므로 제외
      //
      //     cell.dataValidation = {
      //       type: 'list', // 드롭다운 목록으로 설정
      //       allowBlank: false, // 빈 값 허용 안함
      //       showDropDown: true, // 드롭다운 표시
      //       formulae: [`'코드 목록'!$A$1:$A$${codes.length}`], // 코드 시트의 값을 참조
      //       showErrorMessage: true,
      //       errorTitle: '잘못된 입력',
      //       error: '코드 목록에 있는 값만 선택할 수 있습니다.',
      //     };
      //   });
      // }

      // 엑셀 파일 생성
      const buffer = await workbook.xlsx.writeBuffer();

      // 파일 다운로드
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${fileName}.xlsx`);
      toastSuccess('엑셀 다운로드가 완료되었습니다.');
    } catch (error) {
      toastError('엑셀 파일 생성 중 오류가 발생했습니다.');
    } finally {
      if (initData) initData([]); // 데이터 초기화
      if (initCallState) initCallState(false); //호출상태 초기화
    }
  };

  return null;
};

export default ExcelDownload;
