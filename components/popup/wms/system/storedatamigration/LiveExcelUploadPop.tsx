import React, { useEffect, useState } from 'react';
import { PopupContent } from '../../../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../../../content';
import { PopupFooter } from '../../../PopupFooter';
import { authApi } from '../../../../../libs';
import { toastError, toastInfo, toastSuccess } from '../../../../ToastMessage';
import { PopupLayout } from '../../../PopupLayout';
import MigrationExcelUpload from '../../../../excel/MigrationExcelUpload';
import Loading from '../../../../Loading';
import { QueryObserverResult } from '@tanstack/query-core';
import { useQueryClient } from '@tanstack/react-query';

interface LiveExcelUploadPop {
  lbVersion: string;
  uploadType: string;
  lbVersionSellerId: number;
  sellerName: string;
  onClose: () => void;
  refetch: () => Promise<QueryObserverResult>; // refetch 함수 타입
}

export const LiveExcelUploadPop: React.FC<LiveExcelUploadPop> = ({ lbVersion, uploadType, lbVersionSellerId, sellerName, onClose, refetch }) => {
  const [excelData, setExcelData] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null); // 업로드한 파일명 표시
  const queryClient = useQueryClient();
  const excelTemplateHeaders =
    uploadType === 'INVEN'
      ? [
          { header: 'data1', key: 'data1', width: 50 },
          { header: 'data2', key: 'data2', width: 50 },
          { header: 'data3', key: 'data3', width: 50 },
          { header: 'data4', key: 'data4', width: 50 },
          { header: 'data5', key: 'data5', width: 50 },
          { header: 'data6', key: 'data6', width: 50 },
          { header: 'data7', key: 'data7', width: 50 },
          { header: 'data8', key: 'data8', width: 50 },
          { header: 'data9', key: 'data9', width: 50 },
          { header: 'data10', key: 'data10', width: 50 },
          { header: 'data11', key: 'data11', width: 50 },
          { header: 'data12', key: 'data12', width: 50 },
          { header: 'data13', key: 'data13', width: 50 },
          { header: 'data14', key: 'data14', width: 50 },
        ]
      : uploadType === 'VERSION'
      ? [
          { header: 'lbType', key: '몬드/빈블러', width: 25 },
          { header: 'lbPartnerNm', key: '매장명', width: 30 },
          { header: 'lbGubun', key: '구분', width: 20 },
          { header: 'skuNm', key: '원본스큐명', width: 30 },
          { header: 'prodNm', key: '상품명', width: 40 },
          { header: 'color', key: '컬러', width: 20 },
          { header: 'size', key: '사이즈', width: 15 },
          { header: 'domaeAmt', key: '도매가', width: 20 },
          { header: 'sellAmt', key: '입금가', width: 20 },
          { header: 'minSellAmt', key: '최소판매가격', width: 20 },
          { header: 'engColor', key: 'COLOR', width: 20 },
          { header: 'skuCnt', key: '현재고', width: 15 },
          { header: 'sellerSellCnt', key: '셀러판매량', width: 15 },
        ]
      : [
          { header: 'prodId', key: '상품NO', width: 30 }, // 추가 2025-06-09
          { header: 'lbPartnerNm', key: '매장명', width: 30 },
          { header: 'lbGubun', key: '구분', width: 20 },
          { header: 'prodNm', key: '상품명', width: 40 },
          { header: 'color', key: '컬러', width: 20 },
          { header: 'size', key: '사이즈', width: 15 },
          { header: 'skuCnt', key: '재고량', width: 15 }, // 추가 2025-06-09
          { header: 'sellAmt', key: '입금가', width: 20 },
          { header: 'sellerSellCnt', key: '(셀러판매량)주문량', width: 15 },
        ];
  // 엑셀 데이터가 Json으로 파싱되면 콜백으로 받아서 처리
  const handleDataParsed = (excelData: string) => {
    const uploadParam = {
      lbVersion: lbVersion,
      uploadType: uploadType,
      lbVersionSellerId: lbVersionSellerId,
      fileName: fileName,
      transJson: excelData,
    };
    setExcelData(uploadParam);
  };

  // 엑셀 업로드 버튼 이벤트
  const handleUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('업로드 데이타 ==>', excelData);

    if (fileName) {
      if (uploadType == 'INVEN') {
        if (fileName.indexOf('라방재고') === -1) {
          toastError('판매상품 데이터 업데이트는 파일명에 [라방재고] 이라는 키워드가 포함되어 있는 파일이어야 합니다.');
          return;
        }
      } else if (uploadType == 'SELLER') {
        if (fileName.indexOf('라방판매') === -1) {
          toastError('판매상품 데이터 업데이트는 파일명에 [라방판매] 이라는 키워드가 포함되어 있는 파일이어야 합니다.');
          return;
        } else if (fileName.indexOf(sellerName) === -1) {
          toastError('판매상품 데이터 업데이트는 파일명에 셀러명[' + sellerName + ']이  포함되어 있는 파일이어야 합니다.');
          return;
        }
      } else if (uploadType == 'VERSION') {
        if (fileName.indexOf('라방상품') === -1) {
          toastError('판매상품 데이터 업데이트는 파일명에 [라방상품] 이라는 키워드가 포함되어 있는 파일이어야 합니다.');
          return;
        }
      }
    }

    if (excelData) {
      setIsLoading(true);
      authApi.post('/wms/lbProd/prod-excel-upload', excelData, {}).then((response) => {
        if (response.data.resultCode === 200) {
          toastInfo(response.data.body);
          queryClient.invalidateQueries(['/wms/lbProd/paging']).then(() => console.log('/wms/lbProd/paging 실행'));
          onClose();
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

  const handleFileNameChange = (fileName: string | null) => {
    console.log('Uploaded file name:', fileName);
    setFileName(fileName);
  };

  return (
    <>
      <PopupLayout
        width={860}
        open={true}
        isEscClose={true}
        title={
          uploadType == 'VERSION'
            ? `판매상품 데이터 업로드(몬드/빈블러 , 총 13개컬럼)`
            : uploadType == 'INVEN'
            ? '재고정보 업데이트( 상품, 재고건수)'
            : '셀러별 판매데이터 업데이트 ( 매장명, 구분, 상품명, 컬러, 사이즈, 입금가, 주문량 )'
        }
        onClose={onClose}
        footer={
          <PopupFooter>
            <div className={'btnArea'}>
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
              <MigrationExcelUpload
                templateHeaders={excelTemplateHeaders}
                onDataParsed={handleDataParsed}
                onFileNameChange={handleFileNameChange}
                uploadType={uploadType}
              />
            </PopupSearchType>
          </PopupSearchBox>
        </PopupContent>
      </PopupLayout>
      {isLoading && <Loading />}
    </>
  );
};
