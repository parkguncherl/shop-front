import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import { Button } from '../Button';
import { Input, InputRef } from 'antd';

type ExcelUploadProps = {
  onDataParsed: (data: any[]) => void; // 데이터를 파싱 후 전달할 콜백
  templateHeaders?: any; //엑셀 헤더 정보
};

const ExcelUpload: React.FC<ExcelUploadProps> = ({ onDataParsed, templateHeaders }) => {
  const [fileName, setFileName] = useState<string | null>(null); // 업로드한 파일명 표시
  const fileInputRef = React.useRef<HTMLInputElement | null>(null); // 파일 input에 접근하기 위한 ref

  // 엑셀 파일 업로드 핸들러
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name); // 업로드한 파일명 설정

    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.getWorksheet(1); // 첫 번째 시트
      const jsonData: any[] = [];

      // 첫 번째 행(헤더)을 배열로 추출
      let headers: string[] = [];

      worksheet?.eachRow((row, rowNumber) => {
        const rowValues = row.values as any[];

        if (rowNumber === 1) {
          // 첫 번째 행은 헤더로 사용하지 않고, 미리 정의된 excelTemplateHeaders를 사용
          headers = templateHeaders.map((col: any) => col.key); // 'key' 값으로 배열 생성

          console.log('headers >>', headers);
        } else {
          const rowData: { [key: string]: any } = {};

          headers.forEach((key, index) => {
            // 각 key에 해당하는 값을 rowValues에서 가져옴
            rowData[key] = rowValues[index + 1]; // 첫번째 컬럼 생략
          });

          //순번 No 추가
          rowData['no'] = rowNumber - 1;
          jsonData.push(rowData);
        }
      });

      // JSON 데이터를 콜백을 통해 부모 컴포넌트에 전달
      onDataParsed(jsonData);
    };

    reader.readAsArrayBuffer(file);
  };

  // 업로드 취소 핸들러
  const handleCancelUpload = () => {
    setFileName(null); // 파일명 초기화
    onDataParsed([]); // 파싱된 데이터 초기화
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

export default ExcelUpload;
