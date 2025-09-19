import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import { Input } from 'antd';
type ExcelUploadProps = {
  onDataParsed: (data: string) => void; // 데이터를 파싱 후 전달할 콜백
  templateHeaders?: Array<any>; //엑셀 헤더 정보
  onFileNameChange?: (fileName: string | null) => void; // 새로운 prop 추가
  uploadType?: string;
};

const MigrationExcelUpload: React.FC<ExcelUploadProps> = ({ onDataParsed, templateHeaders, onFileNameChange, uploadType }) => {
  const [fileName, setFileName] = useState<string | null>(null); // 업로드한 파일명 표시
  const fileInputRef = React.useRef<HTMLInputElement | null>(null); // 파일 input에 접근하기 위한 ref

  // 엑셀 파일 업로드 핸들러
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name); // 업로드한 파일명 설정
    onFileNameChange?.(file.name); // 부모 컴포넌트로 fileName 전달
    console.log('templateHeaders [' + uploadType + '][' + file.name + '] ==>', templateHeaders);
    const reader = new FileReader();

    // json data 를 엑셀로 만들때 가끔 에러가 나서 time out 을 줌
    setTimeout(() => {
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        const worksheet = workbook.worksheets[0];
        const jsonData: any[] = [];

        // 첫 번째 행(헤더)을 배열로 추출
        let headers: any[] = [];

        if (templateHeaders) {
          // 첫 번째 행은 헤더로 사용하지 않고, 미리 정의된 excelTemplateHeaders를 사용
          headers = templateHeaders.map((col: any) => col.header); // 'key' 값으로 배열 생성
        } else {
          // template이 없으면 두번째 행(제목)에서 헤더 가져오기
          worksheet?.getRow(2).eachCell((cell, colNumber) => {
            headers.push(cell.value);
          });
        }
        worksheet?.eachRow((row, rowNumber) => {
          if (uploadType !== 'INVEN') {
            // 셀러의 판매량은 첫줄부터 읽는다.
            if (rowNumber === 1 || rowNumber === 2) return; // 첫번째, 두번째 행(주석, 제목)은 스킵
          }

          const rowData: { [key: string]: any } = {};
          const rowValues = row.values as any[];

          //순번 No 추가
          rowData['no'] = rowNumber - 2;

          headers.forEach((key, index) => {
            // 각 key에 해당하는 값을 rowValues에서 가져옴
            const cellValue = rowValues[index + 1]; // 첫번째 컬럼 생략

            // 하이퍼링크가 있는 경우 처리
            if (cellValue && typeof cellValue === 'object' && cellValue.hyperlink) {
              rowData[key] = cellValue.text; // 하이퍼링크가 있는 셀에서 텍스트만 저장
            } else {
              rowData[key] = cellValue; // 일반 텍스트 처리
            }
          });

          jsonData.push(rowData);
        });

        const parsedJsonData = JSON.stringify(jsonData, (key, value) => {
          return value === undefined ? null : value;
        });

        // JSON 데이터를 콜백을 통해 부모 컴포넌트에 전달
        onDataParsed(parsedJsonData);
      };

      reader.readAsArrayBuffer(file);
    }, 1000);
  };

  // 업로드 취소 핸들러
  const handleCancelUpload = () => {
    setFileName(null); // 파일명 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // input 초기화
    }
  };

  return (
    <>
      <dl>
        <dt>
          <label>파일업로드</label>
        </dt>
        <dd>
          <div className="formBox fileBox">
            <Input type="text" disabled={true} autoComplete={'off'} value={fileName ? fileName : ''} />
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="fileInp" id="fileInp" ref={fileInputRef} />
            {fileName && (
              <button className={'btn cancle'} onClick={handleCancelUpload}>
                선택취소
              </button>
            )}
            <label htmlFor="fileInp" className="btn">
              파일 업로드
            </label>
          </div>
        </dd>
      </dl>
    </>
  );
};

export default MigrationExcelUpload;
