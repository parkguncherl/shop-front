import React, { useEffect, useRef, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import FormInput from '../../FormInput';
import { DefaultOptions, Placeholder } from '../../../libs/const';
import FormDropDown from '../../FormDropDown';
import { PopupLayout } from '../PopupLayout';
import { SubmitHandler, useForm } from 'react-hook-form';
import { authApi, YupSchema } from '../../../libs';
import { useCommonStore } from '../../../stores';
import {
  CommonResponseFileDown,
  ProductRequestCreate,
  RetailResponsePaging,
  SelectProductSkuItem,
  Sku,
  SkuFactory,
  SkuFactoryResponseSelect,
} from '../../../generated';
import { toastError, toastSuccess } from '../../ToastMessage';
import { useProductMngStore } from '../../../stores/useProductMngStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileUploadsPop } from '../common';
import { useSession } from 'next-auth/react';
import { DropDownOption } from '../../../types/DropDownOptions';
import { InputRef, Tabs, TabsProps } from 'antd';
import { BaseSelectRef } from 'rc-select';
import useFilters from '../../../hooks/useFilters';
import { DataListOption } from '../../../types/DataListOptions';
import { Utils } from '../../../libs/utils';
import CustomCheckBox from '../../CustomCheckBox';
import CustomCheckBoxGroup from '../../CustomCheckBoxGroup';
import { Search } from '../../content';
import CustomRadio from '../../CustomRadio';
import ImagePop from '../common/ImagePop';
import { DeleteConfirmModal } from '../../DeleteConfirmModal';
import { usePartnerStore } from '../../../stores/usePartnerStore';
import { Tooltip } from 'react-tooltip';
import FilesShowPop from '../common/FilesShowPop';
import CustomDoubleSelect from '../../CustomDoubleSelect';
import CustomDebounceSelect from '../../CustomDebounceSelect';
import CustomInputSelect from '../../CustomInputSelect';
import PopupFormBox from '../content/PopupFormBox';
import PopupFormGroup from '../content/PopupFormGroup';
import PopupFormType from '../content/PopupFormType';
import CustomNewDatePicker from '../../CustomNewDatePicker';
import { yupResolver } from '@hookform/resolvers/yup';

export type ProductRequestUpdateFields = Sku &
  ProductRequestCreate &
  SkuFactoryResponseSelect &
  SelectProductSkuItem & {
    seasonCds: string[];
    sellerId: string | number | undefined;
    fileId: number | undefined;
    fileNm: string;
    imgFileId: number | undefined;
    skuFactoryList: FactoryRowData[];
    skuList: SkuRowData[];
    skuSizes: string[];
    skuColors: string[];
    skuColor: string[];
    compInfo: string;
    gubunInfo: string;
  };

type FactoryRowData = SkuFactory & { key: string };
type SkuRowData = Sku;

/** 상품관리 등록 팝업 */
const ProductModPop = () => {
  const session = useSession();
  const queryClient = useQueryClient();
  /** 스토어 - State */
  const [commonModalType, commonOpenModal, getFileUrl] = useCommonStore((s) => [s.modalType, s.openModal, s.getFileUrl]);
  const [modals, openModal, closeModal, updateProduct, deleteProduct, selectedProduct, setSelectedProduct] = useProductMngStore((s) => [
    s.modals,
    s.openModal,
    s.closeModal,
    s.updateProduct,
    s.deleteProduct,
    s.selectedProduct,
    s.setSelectedProduct,
  ]);

  const [designerOptions, setDesignerOptions] = useState<DropDownOption[]>([]);
  const [factoryOptions, setFactoryOptions] = useState<DropDownOption[]>([]);

  const [seasonData, setSeasonData] = useState([]);

  const [selectedFileType, setSelectedFileType] = useState<string | null>(null);
  const [file, setFile] = useState<any>([]);
  const [imgFile, setImgFile] = useState<any>([]);
  const [prodAttrOpen, setProdAttrOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 판매처 데이터 관련
  const [respondedRetailList, setRespondedRetailList] = useState<RetailResponsePaging[]>([]);
  const [InputValue, setInputValue] = useState<string>('');
  const [selectedRetail, setSelectedRetail] = useState<RetailResponsePaging | undefined>(undefined);
  const pSearchAreaRef = useRef<InputRef>(null);
  const pSelectorRef = useRef<BaseSelectRef>(null);
  /** 거래처 조회를 위한 필터 */
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters({
    sellerNm: undefined,
  });

  useEffect(() => {
    console.log('sku선택된 상품', selectedProduct);
    setProdAttrOpen(selectedProduct?.prodAttrCd === 'Y');
    setInputValue(selectedProduct?.sellerNm || '');
  }, [selectedProduct]);

  /** useForm */
  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    reset,
    watch,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<ProductRequestUpdateFields>({
    //resolver: yupResolver(YupSchema.ProductRequestForUpdate(prodAttrOpen)),
    defaultValues: {
      id: selectedProduct?.id,
      prodId: selectedProduct?.prodId,
      userProdCd: selectedProduct?.userProdCd,
      prodAttrCd: selectedProduct?.prodAttrCd === 'Y' ? 'Y' : 'N',
      partnerId: session.data?.user.partnerId,
      sellerId: selectedProduct?.sellerId,
      prodNm: selectedProduct?.skuNm?.split('.')[0] || '',
      sellerNm: selectedProduct?.sellerNm || '',
      skuFactoryList: selectedProduct?.skuFactoryList || [],
      fileId: selectedProduct?.fileId,
      imgFileId: selectedProduct?.imgFileId,
      funcCd: selectedProduct?.funcCd || '',
      funcDetCd: selectedProduct?.funcDetCd || '',
      releaseYmd: selectedProduct?.releaseYmd || '',
      minAsnCnt: selectedProduct?.minAsnCnt || 0,
      extBarCode: selectedProduct?.extBarCode || '',
      seasonCd: selectedProduct?.seasonCd || '',
      orderShortNm: selectedProduct?.orderShortNm || '',
      skuColors: selectedProduct?.skuColor || [],
      skuSize: selectedProduct?.skuSize || [],
    },
    mode: 'onSubmit',
  });

  /** 데이터 조회 : 제작약어, 시즌 */
  // '선택' 옵션 추가
  const defaultOption: DropDownOption = {
    key: '',
    value: '',
    label: '선택',
  };
  // factory 공장
  const fetchFactoryData = async () => {
    const { data: factoryDataList } = await authApi.get('/factory/omsPartnerId');
    const { resultCode, body, resultMessage } = factoryDataList;
    if (resultCode === 200) {
      const options: DropDownOption[] = body.map((item: any) => ({
        key: item.id,
        value: item.id,
        label: item.compNm,
      }));
      setFactoryOptions([defaultOption, ...options]);
    } else {
      toastError(resultMessage);
    }
  };
  // season 시즌
  const fetchSeasonData = async () => {
    const codeUpper = '90050';
    const { data: dataList } = await authApi.get(`/code/lower/${codeUpper}`);
    const { resultCode, body, resultMessage } = dataList;
    if (resultCode === 200) {
      const seasonData = body.map((item: any) => ({
        key: item.id,
        value: item.codeCd,
        label: item.codeNm,
      }));
      setSeasonData(seasonData);
    } else {
      toastError(resultMessage);
    }
  };
  useEffect(() => {
    fetchFactoryData();
    fetchSeasonData();
  }, []);

  /** 판매처 */
  // 제작상품 체크
  const handleProdAttrCd = (e: any) => setProdAttrOpen(e);
  useEffect(() => {
    // 제작상품 체크 false면 sellerId값도 빈값으로 변함
    if (!prodAttrOpen) {
      setValue('sellerId', undefined);
    }
  }, [prodAttrOpen]);
  // 인자의 상태가 변경될 시 소매처 관련 데이터를 적절한 형식으로 수정하여 반환
  const displayedClientList = (respondedRetailList: RetailResponsePaging[]) => {
    const displayedClients: DataListOption[] = [];
    if (respondedRetailList.length) {
      for (let i = 0; i < respondedRetailList.length; i++) {
        if (respondedRetailList[i].sellerNm && respondedRetailList[i].id) {
          const idAsIdentifier = respondedRetailList[i].id as string | number;
          displayedClients.push({
            key: i,
            value: respondedRetailList[i].sellerNm as string,
            label: respondedRetailList[i].sellerNm as string,
            identifier: idAsIdentifier.toString(),
          });
        }
      }
    }
    return displayedClients;
  };
  // 모든 거래처 조회
  const {
    data: retail,
    refetch: retailsRefetch, // 키 무효화 대신 본 요소 호출하여 refetch
    isSuccess,
  } = useQuery(
    ['/retail/listForPage'],
    () =>
      authApi.get('/retail/listForPage', {
        params: {
          ...filters,
        },
      }),
    {
      enabled: false,
    },
  );
  useEffect(() => {
    if (retail) {
      const { resultCode, body, resultMessage } = retail.data;
      if (body.length != 0) {
        setRespondedRetailList(body);
        pSelectorRef.current?.focus();
      } else {
        setRespondedRetailList([]);
      }
    } else {
      // 최초 랜더링 직후
    }
  }, [retail, isSuccess]);

  // 판매처 검색
  const onSearch = async () => {
    await retailsRefetch();
  };

  /** 스큐공장 */
  // 상태 정의
  const [skuFactoryList, setskuFactoryList] = useState<FactoryRowData[]>([
    { key: Math.random().toString(36).substr(2, 9), factoryId: undefined, gagongAmt: undefined, etcCntn: '', mainYn: 'N' },
  ]);
  const fetchskuFactoryData = async () => {
    let processedData = undefined;
    // console.log('겟벨류', getValues('skuFactoryList'));
    // console.log('프로덕트', selectedProduct?.skuFactoryList);
    // processedData = getValues('skuFactoryList');
    processedData = selectedProduct?.skuFactoryList;

    // processedData가 없거나 빈 배열이면 기본값 설정
    if (!processedData || processedData.length === 0) {
      processedData = [{ key: Math.random().toString(36).substr(2, 9), factoryId: undefined, gagongAmt: undefined, etcCntn: '', mainYn: 'Y' }];
    }

    // key 설정
    processedData = processedData.map((item: any) => ({
      ...item,
      key: Math.random().toString(36).substr(2, 9), // key 유지 또는 새로 생성
    }));

    // 필드 값 설정
    processedData.forEach((item: any, index: number) => {
      setValue(`mainYn`, item.mainYn);
      setValue(`skuFactoryId${item.key}` as keyof ProductRequestUpdateFields, item.factoryId);
      setValue(`gagongAmt${item.key}` as keyof ProductRequestUpdateFields, Utils.setComma(item.gagongAmt || 0));
      setValue(`etcCntn${item.key}` as keyof ProductRequestUpdateFields, item.etcCntn);
      setValue(`duplicateCount`, item.duplicateCount);
    });

    // gagongAmt 전체 합계 업데이트
    const totalGagongAmt = processedData.reduce((sum: any, item: any) => sum + (item.gagongAmt || 0), 0);
    setTotalGagongAmt(totalGagongAmt);

    // 상태 업데이트
    setskuFactoryList(processedData);
  };
  useEffect(() => {
    if (selectedProduct) {
      fetchskuFactoryData();
    }
  }, [selectedProduct]);
  // 새로운 행을 추가하는 함수
  const addRow = () => {
    setskuFactoryList((prevList) => [
      ...prevList,
      { key: Math.random().toString(36).substr(2, 9), factoryId: undefined, gagongAmt: undefined, etcCntn: '', mainYn: 'N' },
    ]);
  };
  // 행 데이터 변경 처리 함수
  const [totalGagongAmt, setTotalGagongAmt] = useState(0); // 총액
  const handleInputChange = (key: string, field: keyof FactoryRowData, value: number | string) => {
    const updatedskuFactoryList = [...skuFactoryList];

    if (field === 'gagongAmt') {
      if (value === '') {
        // 입력 내용이 지워졌을 때 undefined 처리
        updatedskuFactoryList.forEach((row) => {
          if (row.key === key) {
            row[field] = undefined;
          }
        });

        // 상태 리셋
        reset((prev) => ({
          ...prev,
          [`${field}${key}`]: '',
        }));
      } else {
        // 숫자와 소수점만 허용
        const sanitizedValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
        if (!isNaN(sanitizedValue)) {
          // 상태 업데이트: 콤마를 제거한 숫자 값을 저장
          updatedskuFactoryList.forEach((row) => {
            if (row.key === key) {
              row[field] = sanitizedValue;
            }
          });

          // 콤마가 포함된 값으로 표시될 값 업데이트
          reset((prev) => ({
            ...prev,
            [`${field}${key}`]: new Intl.NumberFormat().format(sanitizedValue),
          }));
        }
      }
    } else {
      // 다른 필드 처리
      updatedskuFactoryList.forEach((row: FactoryRowData) => {
        if (row.key === key) {
          (row[field] as string | number) = value;
        }
      });
    }

    // 상태 업데이트
    setskuFactoryList(updatedskuFactoryList);
    // gagongAmt 전체 합계 업데이트
    const total = updatedskuFactoryList.reduce((sum, row) => sum + (row.gagongAmt || 0), 0);
    setTotalGagongAmt(total);
  };
  // 행 삭제 처리 함수
  const handleRowDelete = (key: string) => {
    // 최소 1개의 행은 유지하도록 설정
    if (skuFactoryList.length > 1) {
      setskuFactoryList((prevList) => {
        const updatedList = prevList.filter((row) => row.key !== key);

        // 삭제 후 gagongAmt 전체 합계 업데이트
        const total = updatedList.reduce((sum, row) => sum + (row.gagongAmt || 0), 0);
        setTotalGagongAmt(total);

        return updatedList;
      });
    }
  };
  // 콤보박스 함수
  const handleDropDownChangeWrapper = (key: string, field: keyof FactoryRowData, value: number | string) => {
    // 선택 값과 인덱스를 기반으로 행 데이터 업데이트
    handleInputChange(key, field, value);
  };
  // 라디오버튼 함수
  const handleRadioChange = (selectedFactoryId: number) => {
    const updatedskuFactoryList = skuFactoryList.map((item) => ({
      ...item,
      mainYn: item.factoryId === selectedFactoryId ? 'Y' : 'N', // 선택된 항목만 'Y', 나머지는 'N'
    }));

    setskuFactoryList(updatedskuFactoryList);
  };
  // 스큐공장 list 업데이트
  useEffect(() => {
    reset((prev) => ({
      ...prev,
      skuFactoryList: skuFactoryList,
    }));
  }, [skuFactoryList]);
  // 상품공장 내용 검증
  const validateFactoryRow = (row: FactoryRowData) => {
    const errors: { [key in keyof FactoryRowData]?: string } = {};
    // factoryId 검증
    if (!row.factoryId) {
      errors.factoryId = '공장을 선택해주세요.';
    }
    // gagongAmt 검증
    if (!row.gagongAmt) {
      errors.gagongAmt = '단가를 입력해주세요.';
    }
    return errors;
  };
  // 모든 상품공장 행 검증
  const validateAllRows = () => {
    const newErrors: { [key: string]: { [key in keyof FactoryRowData]?: string } } = {}; // key를 string으로 설정
    let hasErrors = false;

    // 행별 검증
    skuFactoryList.forEach((row, index) => {
      const rowErrors = validateFactoryRow(row);
      if (Object.keys(rowErrors).length > 0) {
        newErrors[index.toString()] = rowErrors; // index를 문자열로 변환하여 키로 사용
        hasErrors = true;
      }
    });

    // 메인 공장(mainYn === 'Y') 여부 검증
    const hasMainYn = skuFactoryList.some((row) => row.mainYn === 'Y');
    if (!hasMainYn) {
      hasErrors = true;
      // 메인 공장 관련 오류 메시지 추가
      newErrors['mainYn'] = { mainYn: '메인 공장을 반드시 선택해야 합니다.' }; // 문자열 키 사용
    }

    // 오류 메시지 문자열로 결합
    const errorMessages = Object.entries(newErrors).flatMap(([index, rowErrors]) => {
      if (index === 'mainYn') {
        // 메인 공장 관련 메시지는 공통 메시지로 처리
        return Object.values(rowErrors);
      }
      return Object.values(rowErrors).map((error) => `${parseInt(index) + 1}번째 행 : ${error}`);
    });

    return errorMessages;
  };

  /** 이미지(파일첨부)업로드 드래그앤드롭 */
  const fetchFileData = async () => {
    const fileId = selectedProduct?.fileId;
    if (!fileId) {
      setFile([]); // 파일 없을 때 초기화
      return;
    }

    const { data: fileDataList } = await authApi.get(`/common/file/${fileId}`);
    const { resultCode, body, resultMessage } = fileDataList;
    if (resultCode === 200) {
      setFile([...body]);
    } else {
      toastError(resultMessage);
    }
  };
  const fetchImgFileData = async () => {
    const imgFileId = selectedProduct?.imgFileId;
    if (!imgFileId) {
      setImgFile([]); // 이미지 파일 없을 때 초기화
      return;
    }

    const { data: imgFileDataList } = await authApi.get(`/common/file/${imgFileId}`);
    const { resultCode, body, resultMessage } = imgFileDataList;
    if (resultCode === 200) {
      setImgFile([...body]);
    } else {
      toastError(resultMessage);
    }
  };
  useEffect(() => {
    if (selectedProduct) {
      fetchFileData();
      fetchImgFileData();
    }
  }, [selectedProduct]);
  // 파일 URL 가져오기 함수
  const fetchFileUrls = async () => {
    const updatedImgFiles = await Promise.all(
      imgFile.map(async (file: any) => {
        const fileUrl = await getFileUrl(file.sysFileNm);
        return { ...file, url: fileUrl };
      }),
    );
    const updatedFiles = await Promise.all(
      file.map(async (file: any) => {
        const fileUrl = await getFileUrl(file.sysFileNm);
        return { ...file, url: fileUrl };
      }),
    );
    if (JSON.stringify(updatedImgFiles) !== JSON.stringify(imgFile)) {
      setImgFile(updatedImgFiles);
    }
    if (JSON.stringify(updatedFiles) !== JSON.stringify(file)) {
      setFile(updatedFiles);
    }
  };
  // useEffect로 파일 상태 변경 시 URL 가져오기
  useEffect(() => {
    if (imgFile.length > 0 || file.length > 0) {
      fetchFileUrls();
    }
    reset((prev) => ({
      ...prev,
      imgFileList: imgFile,
      fileList: file,
    }));
  }, [imgFile, file]);
  // 자식 컴포넌트로부터 파일 정보 수신
  const handleChildValueChange = (fileInfo: any) => {
    setImgFile((prev: any[]) => {
      // prev가 배열인지 확인 후 상태 업데이트
      if (!Array.isArray(prev)) {
        // prev가 배열이 아닌 경우 빈 배열로 초기화
        return [...fileInfo];
      }
      return [...prev, ...fileInfo];
    });
    reset((prev) => ({
      ...prev,
      imgFileId: fileInfo.length > 0 ? fileInfo[0].fileId : undefined,
    }));
  };
  const handleFileValueChange = (fileInfo: any) => {
    setFile((prev: any[]) => {
      // prev가 배열인지 확인 후 상태 업데이트
      if (!Array.isArray(prev)) {
        // prev가 배열이 아닌 경우 빈 배열로 초기화
        return [...fileInfo];
      }
      return [...prev, ...fileInfo];
    });
    reset((prev) => ({
      ...prev,
      fileId: fileInfo.length > 0 ? fileInfo[0].fileId : undefined,
    }));
  };
  // 드래그 앤 드롭
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
  };
  const handleDrop = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // 이미지 순서 변경
    const updatedImgFile = [...imgFile];
    const draggedItem = updatedImgFile.splice(draggedIndex, 1)[0];
    updatedImgFile.splice(index, 0, draggedItem);

    // 순서대로 fillSeq 업데이트
    updatedImgFile.forEach((item, i) => {
      item.fileSeq = i + 1;
    });

    setImgFile(updatedImgFile);
    setDraggedIndex(null);
  };
  // 이미지 삭제
  const deleteFileMutation = useMutation(
    async ({ fileId, sysFileNm }: { fileId: string; sysFileNm: string }) => {
      // API 호출
      await authApi.delete(`/common/fileDeleteByKey`, {
        params: {
          fileId: fileId,
          key: sysFileNm,
        },
      });
    },
    {
      onSuccess: () => {
        // 성공시 호출
      },
      onError: (error) => {
        console.error(error);
      },
    },
  );
  // 파일 삭제 처리 함수
  const handleFileDeleteCommon = (index: number, fileList: any[], setFileList: (updatedList: any[]) => void, deleteFileMutation: any, errorMessage: string) => {
    const deleteFile = fileList[index];

    // API 호출
    deleteFileMutation.mutate(
      {
        fileId: deleteFile.fileId,
        sysFileNm: deleteFile.sysFileNm,
      },
      {
        onSuccess: () => {
          // 성공 시 로컬 상태 업데이트
          const updatedFileList = fileList.filter((_: any, i: number) => i !== index);

          // 삭제 후 순서대로 fillSeq 업데이트
          updatedFileList.forEach((item: any, i: number) => {
            item.fillSeq = i + 1;
          });

          // 상태 업데이트
          setFileList(updatedFileList);
        },
        onError: (error: any) => {
          console.error(errorMessage, error);
        },
      },
    );
  };

  // handleImgFileDelete
  const handleImgFileDelete = (index: number) => {
    handleFileDeleteCommon(index, imgFile, setImgFile, deleteFileMutation, '이미지 파일 삭제 실패');
  };

  const handleDelete = (index: number) => {
    const deleteFile = imgFile[index];
    // API 호출
    deleteFileMutation.mutate({
      fileId: deleteFile.fileId,
      sysFileNm: deleteFile.sysFileNm,
    });
    // 로컬 상태 업데이트
    const updatedImgFile = imgFile.filter((_: any, i: any) => i !== index);
    // 삭제 후 순서대로 fillSeq 업데이트
    updatedImgFile.forEach((item: any, i: any) => {
      item.fillSeq = i + 1;
    });

    setImgFile(updatedImgFile);
  };

  /** 시즌 */
  const handleSeasonCd = () => {
    const seasons = getValues('seasonCds');
    const seasonCd = getSeasonCode(seasons);
    reset((prev) => ({
      ...prev,
      seasonCd: seasonCd,
    }));
  };
  const seasonMapping: any = {
    SXXX: 'S___', // 봄
    XSXX: '_S__', // 여름
    XXFX: '__F_', // 가을
    XXXW: '___W', // 겨울
  };
  const reverseSeasonMapping: Record<string, string[]> = {
    S___: ['SXXX'],
    _S__: ['XSXX'],
    __F_: ['XXFX'],
    ___W: ['XXXW'],
  };
  // 선택된 코드로부터 계절 자리를 생성합니다.
  const getSeasonCode = (selectedCodes: any) => {
    // 기본 형식
    let result = '____';

    // 선택된 코드에서 계절 정보를 추출하여 자리 값을 업데이트합니다.
    selectedCodes.forEach((code: any) => {
      const mappedValue = seasonMapping[code];
      if (mappedValue) {
        // 자리 값을 업데이트합니다.
        for (let i = 0; i < mappedValue.length; i++) {
          // 중복된 자리 값을 피하기 위해, 이미 값이 있는 자리는 업데이트하지 않음
          if (result[i] === '_') {
            result = result.substring(0, i) + mappedValue[i] + result.substring(i + 1);
          }
        }
      }
    });

    return result;
  };
  // 시즌코드 넣으면 배열로 변환
  const getSelectedCodes = (seasonCd: string): string[] => {
    const selectedCodes: string[] = [];
    // seasonCd가 빈 문자열일 경우 처리
    if (seasonCd === '') {
      return [];
    }
    // 형식이 매핑에 있는 경우 선택된 코드 배열 생성
    for (const [pattern, codes] of Object.entries(reverseSeasonMapping)) {
      if (pattern.split('').every((char, index) => seasonCd[index] === char || char === '_')) {
        selectedCodes.push(...codes);
      }
    }

    return selectedCodes;
  };
  useEffect(() => {
    // 시즌데이터 설정
    let selectedCodes: string[] = [];
    selectedCodes = getSelectedCodes(selectedProduct?.seasonCd || '');

    reset((prev) => ({
      ...prev,
      seasonCds: selectedCodes, // 선택된 코드 배열을 폼 상태로 업데이트
    }));
  }, [selectedProduct]);

  // 마진율/배수 계산
  const [marRate, setMarRate] = useState<{ rate: number; multiplier: number } | null>(null);
  const calculateMarRate = (sellAmt: string | number, orgAmt: string | number): void => {
    // 숫자로 변환
    const parseValue = (value: string | number): number => {
      if (typeof value === 'string') {
        return parseFloat(value); // string 상태라면 그냥 숫자로 변환
      }
      return value; // 이미 숫자일 경우 그대로 반환
    };

    const sellAmtNum = parseValue(sellAmt);
    const orgAmtNum = parseValue(orgAmt);

    // NaN 값 처리
    if (isNaN(sellAmtNum) || isNaN(orgAmtNum)) {
      setMarRate({ rate: 0.0, multiplier: 0 });
      return;
    }

    if (orgAmtNum === 0) {
      setMarRate({ rate: 0.0, multiplier: 0 }); // 기준 가격이 0인 경우 상태 업데이트
      return;
    }

    // 마진율 계산
    const marginRate = ((sellAmtNum - orgAmtNum) / sellAmtNum) * 100;
    const roundedRate = Math.round(marginRate * 100) / 100; // 소수점 2자리까지 반올림
    const multiplier = (sellAmtNum - orgAmtNum) / orgAmtNum; // 배수 계산
    const result = {
      rate: roundedRate,
      multiplier: Math.round(multiplier * 100) / 100,
    };
    setMarRate(result); // 상태 업데이트
  };
  useEffect(() => {
    calculateMarRate(selectedProduct?.sellAmt, selectedProduct?.orgAmt);
  }, [selectedProduct]);

  /** 스큐데이터 */
  const sellAmt = selectedProduct?.sellAmt;
  const orgAmt = selectedProduct?.orgAmt;
  useEffect(() => {
    setValue('sellAmt', Utils.setComma(sellAmt));
    setValue('orgAmt', Utils.setComma(orgAmt));
  }, [selectedProduct]);
  // 스큐 컬러 데이터분리
  const handleSkuColorsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const colorsArray = value.split(',').map((color) => color.trim()); // 쉼표로 분리하고 공백 제거
    // 배열로 변환
    reset((prev) => ({
      ...prev,
      skuColors: colorsArray,
    }));
  };
  // 가격 , 표시 함수
  const handleCommaFormattedInput = (fieldName: 'sellAmt' | 'orgAmt') => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;

      // 쉼표를 제거한 숫자 값 (저장할 값)
      const numericValue = parseInt(rawValue.replace(/,/g, ''));

      // 상태 업데이트: 저장할 값은 숫자, 표시할 값은 포맷팅된 값
      //setValue(fieldName, numericValue); // 저장할 값은 숫자로 저장
      if (numericValue) {
        setValue(fieldName, numericValue.toString() as any);
      }

      // 포맷팅된 값 (입력 필드에 표시할 값)
      event.target.value = isNaN(numericValue) ? '' : Utils.setComma(numericValue);

      // sellAmt와 orgAmt가 string인 경우에만 removeComma 호출, 숫자일 경우 그대로 사용
      const sellAmt = getValues('sellAmt');
      const orgAmt = getValues('orgAmt');
      const formattedSellAmt = typeof sellAmt === 'string' ? Utils.removeComma(sellAmt) : sellAmt ?? 0;
      const formattedOrgAmt = typeof orgAmt === 'string' ? Utils.removeComma(orgAmt) : orgAmt ?? 0;

      // 값이 있을 때만 calculateMarRate 실행
      if (formattedSellAmt && formattedOrgAmt) {
        calculateMarRate(formattedSellAmt, formattedOrgAmt);
      }
    };
  };
  const handleOrgAmtChange = handleCommaFormattedInput('orgAmt');
  const handleSellAmtChange = handleCommaFormattedInput('sellAmt');

  /** 이미지 슬라이드 */
  const [translateXValue, setTranslateXValue] = useState<number>(0);
  const [maxTranslateX, setMaxTranslateX] = useState<number>(0);
  const [divWidth, setDivWidth] = useState<number>(0);
  const [isScrollable, setIsScrollable] = useState<boolean>(false);
  const listRef = useRef<HTMLDivElement>(null);
  const listDivRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const calculateWidths = () => {
      if (listRef.current) {
        setMaxTranslateX(listRef.current.scrollWidth);
      }
      if (listDivRef.current) {
        setDivWidth(listDivRef.current.clientWidth);
      }
    };
    // 초기 렌더링 후 크기 계산
    setTimeout(() => {
      calculateWidths();
    }, 100);
  }, [imgFile]);
  useEffect(() => {
    // 이미지 리스트의 크기가 부모 컨테이너를 초과하는지 확인
    setIsScrollable(maxTranslateX > divWidth);
  }, [maxTranslateX, divWidth]);
  const moveLeft = () => {
    if (!isScrollable || translateXValue === 0) return;

    const newValue = translateXValue + 112;
    setTranslateXValue(Math.min(0, newValue));
  };
  const moveRight = () => {
    if (!isScrollable || translateXValue === -maxTranslateX + divWidth) return;

    const newValue = translateXValue - 112;
    setTranslateXValue(Math.max(-maxTranslateX + divWidth, newValue));
  };

  /** 상품구분(복종) */
  const [funcDetCdOptions, setFuncDetCdOptions] = useState<DropDownOption[]>([]);
  const fetchFuncCdData = async (codeUpper: string) => {
    const { data: funcCdDataList } = await authApi.get(`/code/funcCd/${codeUpper}`);
    const { resultCode, body, resultMessage } = funcCdDataList;
    if (resultCode === 200) {
      const options: DropDownOption[] = body.map((item: any) => ({
        key: item.codeCd,
        value: item.codeCd,
        label: item.codeNm,
      }));
      setFuncDetCdOptions(options);
    } else {
      toastError(resultMessage);
    }
  };
  const handleFuncCd = (e: any) => {
    const codeUpper = getValues(e);
    if (codeUpper) {
      fetchFuncCdData(codeUpper);
    }
  };
  // 페이지 로드 시 selectedProduct.funcCd에 따라 데이터 로드
  useEffect(() => {
    const funcCd = getValues('funcCd') || '';
    if (funcCd.trim() !== '') {
      // funcCd가 빈 문자열이 아닐 때만 실행
      fetchFuncCdData(funcCd);
    }
  }, [selectedProduct]);

  /** 혼용율, 구분, 디자이너 관련 */
  /** 데이터 불러오기 */
  const [updatePartnerAll] = usePartnerStore((s) => [s.updatePartnerAll]);
  const [textAreaValues, setTextAreaValues] = useState<{
    compInfo: string;
    gubunInfo: string;
    designCntn: string;
    sizeInfo: string;
  }>({
    compInfo: '',
    gubunInfo: '',
    designCntn: '',
    sizeInfo: '',
  });
  const fetchInfoData = async (type: 'compInfo' | 'gubunInfo' | 'designCntn' | 'sizeInfo') => {
    const { data: partnerData } = await authApi.get(`/partner/detail`);
    const { resultCode, body, resultMessage } = partnerData;
    if (resultCode === 200) {
      let infoData = body[type] || ''; // compInfo 또는 gubunInfo를 가져옴

      // sizeInfo는 쉼표를 \n으로 바꾸어 처리
      if (type === 'sizeInfo' && typeof infoData === 'string') {
        infoData = infoData.replace(/,/g, '\n'); // 쉼표를 \n으로 바꿈
      }

      setTextAreaValues((prev) => ({ ...prev, [type]: infoData }));
    } else {
      toastError(resultMessage);
    }
  };

  const [selectedValues, setSelectedValues] = useState<{ [key: string]: any }>({
    compInfo: '', // 혼용율
    gubunInfo: '', // 구분1
    designCntn: '',
    sizeInfo: '',
  });
  const handleSelectChange = (name: string, value: string) => {
    setSelectedValues((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  /** 혼용율 저장 */
  const { mutate: updatePartnerCompInfoMutate } = useMutation(updatePartnerAll, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('혼용율이 저장되었습니다.');
        fetchInfoData('compInfo');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });
  /** 구분1 저장 */
  const { mutate: updatePartnergubunInfoMutate } = useMutation(updatePartnerAll, {
    onSuccess: async (e: any) => {
      if (e.data.resultCode === 200) {
        toastSuccess('구분1이 저장되었습니다.');
        fetchInfoData('gubunInfo');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });
  /** 디자이너 저장 */
  const { mutate: updatePartnerdesignCntnMutate } = useMutation(updatePartnerAll, {
    onSuccess: async (e: any) => {
      if (e.data.resultCode === 200) {
        toastSuccess('디자이너명이 저장되었습니다.');
        fetchInfoData('designCntn');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });
  /** 사이즈 저장 */
  const { mutate: updatePartnerSkuSizeMutate } = useMutation(updatePartnerAll, {
    onSuccess: async (e: any) => {
      if (e.data.resultCode === 200) {
        toastSuccess('사이즈가 저장되었습니다.');
        fetchInfoData('sizeInfo');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  //
  useEffect(() => {
    fetchInfoData('compInfo');
    fetchInfoData('gubunInfo');
    fetchInfoData('designCntn');
    fetchInfoData('sizeInfo');
  }, []);
  useEffect(() => {
    // 데이터 업데이트
    const intialData = {
      compInfo: selectedProduct?.compCntn || '',
      gubunInfo: selectedProduct?.gubunCntn || '',
      designCntn: selectedProduct?.designNm || '',
      sizeInfo: selectedProduct?.skuSize || [],
    };
    console.log(intialData);
    setSelectedValues(intialData);
  }, [selectedProduct]);

  // 상품명 검증
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      if (errors.prodNm) {
        setActiveTabKey('1');
        setTimeout(() => {
          const inputElement = document.querySelector("input[name='prodNm']");
          if (inputElement) {
            (inputElement as HTMLInputElement).focus();
          }
        }, 100);
      }
    }
  }, [errors]);

  /** 스큐수정 */
  const { mutate: updateProductSkuMutate } = useMutation(updateProduct, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.' || '');
          await queryClient.invalidateQueries(['/product/paging']);
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

  /** 탭 관련 */
  const [activeTabKey, setActiveTabKey] = useState<string>('1');
  const onChange = (key: string) => {
    setActiveTabKey(key);
  };
  const items: TabsProps['items'] = [
    { key: '1', label: '상품정보' },
    { key: '2', label: '생산정보' },
    { key: '3', label: '임가공' },
  ];

  // 데이터 update
  const onValid: SubmitHandler<ProductRequestUpdateFields> = (data: any) => {
    // 스큐수정
    data.skuNm = data.prodNm;
    data.skuSize = Array.isArray(selectedValues.sizeInfo) ? selectedValues.sizeInfo : [selectedValues.sizeInfo];
    data.skuColor = Array.isArray(data.skuColors) ? data.skuColors : [data.skuColors];
    data.sellAmt = parseInt(Utils.removeComma(data.sellAmt));
    data.orgAmt = parseInt(Utils.removeComma(data.orgAmt));
    data.sleepYn = 'N';
    data.releaseYmd = getValues('releaseYmd');

    // 스큐 리스트 생성
    let idx = 0;
    data.skuList = [];
    data.skuColor.forEach((color: any, colorIndex: number) => {
      data.skuSize.forEach((size: any, sizeIndex: number) => {
        const skuItem = {
          no: ++idx,
          id: null,
          prodId: null,
          prodNm: data.prodNm,
          skuNm: `${data.prodNm}.${color}.${size}`,
          skuColor: color,
          skuSize: size,
          sellAmt: data.sellAmt,
          orgAmt: data.orgAmt,
          sleepYn: 'N',
          sellerId: data.sellerId,
          seasonCd: data.seasonCd,
          designId: data.designId,
          funcCd: data.funcCd,
          funcDetCd: data.funcDetCd,
          gubunCntn: selectedValues.gubunInfo,
          designNm: selectedValues.designCntn,
          compCntn: selectedValues.compInfo,
          minAsnCnt: data.minAsnCnt,
          prodAttrCd: data.prodAttrCd,
          releaseYmd: data.releaseYmd,
          extBarCode: data.extBarCode,
          fileId: data.fileId,
          imgFileId: data.imgFileId,
        };

        // 첫 번째 항목에만 prodId 추가
        if (colorIndex === 0 && sizeIndex === 0) {
          skuItem.id = data.id;
          skuItem.prodId = data.prodId;
        }

        data.skuList.push(skuItem);
      });
    });

    // 스큐공장 검증
    const skuFactoryValidationErrors = validateAllRows();
    if (prodAttrOpen) {
      if (!data.sellerNm) {
        toastError('판매처를 선택해주세요.');
        return;
      }
    }
    if (data.skuColor.length === 0) {
      // 스큐컬러가 없을경우
      toastError('스큐 칼라를 입력해주세요.');
      return;
    }
    if (data.skuSize.length === 0) {
      // 스큐사이즈가 없을경우
      toastError('스큐 사이즈를 선택해주세요.');
      return;
    }
    if (data.skuList.length === 0) {
      // 스큐리스트가 없을경우
      toastError('스큐 칼라와 사이즈가 없습니다.');
      return;
    }
    if (!selectedValues.compInfo) {
      // 혼용율이 없을경우
      toastError('혼용율을 선택해주세요.');
      return;
    }
    if (!data.seasonCd) {
      // 시즌코드가 없을경우
      toastError('시즌을 선택해주세요.');
      return;
    }
    if (!data.funcCd || !data.funcDetCd) {
      // 복종이 없을경우
      toastError('복종을 선택해주세요.');
      return;
    }
    if (!data.orgAmt) {
      // 생산원가가 없을경우
      toastError('생산원가를 입력해주세요.');
      return;
    }
    if (!data.sellAmt) {
      // 도매가가 없을경우
      toastError('도매가를 입력해주세요.');
      return;
    }
    if (skuFactoryValidationErrors.length > 0) {
      // 상품공장 정보 있을시 데이터 검증
      toastError(skuFactoryValidationErrors.join('\n'));
      return;
    }
    // 제출 처리
    console.log('스큐업데이트데이터', data);
    updateProductSkuMutate(data);
  };

  /** 상품삭제 */
  const [confirmModal, setConfirmModal] = useState<boolean>(false); // 삭제 모달
  const { mutate: deleteProductMutate, isLoading: isDeleteLoading } = useMutation(deleteProduct, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.' || '');
          await queryClient.invalidateQueries(['/product/paging']);
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
  // 데이터 delete
  const handleDeleteFn = async () => {
    setConfirmModal(false);
    deleteProductMutate(selectedProduct?.skuId);
  };

  /* 검색 버튼 혹은 엔터 키 사용 시 */
  const onKeyDownAtInputOfPDataList = (e: React.KeyboardEvent<HTMLInputElement>) => {
    //const eventTarget = e.target as EventTarget & HTMLInputElement;
    console.log(e.key);
    if (e.key === 'Enter') {
      if (InputValue == '') {
        toastError('검색조건을 1개 이상 입력하세요.');
      } else if (InputValue == filters.sellerNm) {
        /** 필터값과 입력된 키워드가 같은 경우 filter 변경으로 인한 useEffect 내부 영역을 실행할 수 없으므로 다음과 같이 처리 */
        onSearch();
      } else {
        onChangeFilters('sellerNm', InputValue);
      }
    } else if (e.key === 'Backspace') {
      if (selectedRetail != undefined) {
        setSelectedRetail(undefined);
        setInputValue('');
      }
    } else if (e.key == 'Escape') {
      console.log(e.target);
    }
  };

  return (
    <PopupLayout
      width={700}
      open={modals.MOD.active}
      isEscClose={false}
      title={'스큐 수정'}
      onClose={() => {
        setSelectedProduct('');
        closeModal('MOD');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div className="left">
              <button className="btn" title="삭제" onClick={() => setConfirmModal(true)}>
                삭제
              </button>
            </div>
            <div className="right">
              <button className="btn btnBlue" title="수정" onClick={handleSubmit(onValid)}>
                수정
              </button>
              <button className="btn" title="닫기" onClick={() => closeModal('MOD')}>
                닫기
              </button>
            </div>
          </div>
          <DeleteConfirmModal
            dispTitle={'정말 삭제하시겠습니까?\n재고 정보가 남아있으면 삭제가 불가능합니다.'}
            width={500}
            open={confirmModal}
            onConfirm={handleDeleteFn}
            onClose={() => setConfirmModal(false)}
          />
        </PopupFooter>
      }
    >
      <PopupContent className="popInpWidth100">
        {/*<FormDatePicker<ProductRequestUpdateFields> control={control} name={'releaseYmd'} title={'등록일자'} className={'popTopRight'} />*/}
        <CustomNewDatePicker
          name={'releaseYmd'}
          type={'date'}
          title={'등록일자'}
          value={getValues('releaseYmd')}
          onChange={(name, value) => {
            setValue(name, value);
          }}
          className={'popTopRight'}
        />
        <Tabs activeKey={activeTabKey} items={items} onChange={onChange} className={'antTabBox'} />
        <PopupFormBox className={'productMng'}>
          <div className={`${activeTabKey === '1' ? 'on' : ''} tab`}>
            <PopupFormGroup>
              <PopupFormType className={'type1'}>
                <div className="productTxtChk">
                  <div className="formBox txtChk">
                    <CustomCheckBox<ProductRequestUpdateFields> control={control} name={'prodAttrCd'} onChange={handleProdAttrCd}>
                      제작상품
                    </CustomCheckBox>
                  </div>
                  {prodAttrOpen ? (
                    <>
                      <div className="formBox selInp">
                        <Search.DataList
                          name={'sellerNm'}
                          options={displayedClientList(respondedRetailList)}
                          placeholder={'소매처 검색'}
                          onChangeInputElement={(name, value) => {
                            setInputValue(value.toString());
                          }}
                          onChangeOptions={(name, value) => {
                            // 드롭다운에서 값을 선택할 시 작동
                            setInputValue(value.toString());
                            /** 전역 상태 selectedClient 에 선택된 client 저장 */
                            for (let i = 0; i < respondedRetailList.length; i++) {
                              if (respondedRetailList[i].sellerNm == value) {
                                // sellerId 설정
                                reset((prev) => ({
                                  ...prev,
                                  sellerId: respondedRetailList[i].id !== undefined ? respondedRetailList[i].id : prev.sellerId,
                                }));
                              }
                            }
                          }}
                          onKeyDownAtInput={onKeyDownAtInputOfPDataList}
                          refOfInput={pSearchAreaRef}
                          refOfSelect={pSelectorRef}
                          selectorShowAction={['focus']}
                          value={InputValue}
                        />
                        <FormInput<ProductRequestUpdateFields>
                          control={control}
                          inputType={'single'}
                          name={'orderShortNm'}
                          placeholder={'제작약어'}
                          required={true}
                        />
                      </div>
                    </>
                  ) : (
                    ''
                  )}
                </div>
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormInput<ProductRequestUpdateFields>
                  control={control}
                  name={'prodNm'}
                  label={'상품명'}
                  placeholder={Placeholder.Input || ''}
                  required={true}
                />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormInput<ProductRequestUpdateFields> control={control} name={'userProdCd'} label={'품번'} placeholder={Placeholder.Input || ''} />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <CustomInputSelect<ProductRequestUpdateFields> name={'skuColors'} control={control} type={'form'} title={'칼라'} required={true} />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <CustomDoubleSelect
                  title="사이즈"
                  type={'form'}
                  fetchOptions={textAreaValues.sizeInfo}
                  onChange={(value) => handleSelectChange('sizeInfo', value)}
                  onEditItem={(item) => {
                    updatePartnerSkuSizeMutate({ ['sizeInfo']: item });
                  }}
                  required={true}
                  defaultValue={selectedProduct?.skuSize}
                />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <CustomDebounceSelect
                  title="혼용율"
                  type={'form'}
                  fetchOptions={textAreaValues.compInfo}
                  onChange={(value) => handleSelectChange('compInfo', value)}
                  onEditItem={(item) => {
                    updatePartnerCompInfoMutate({ ['compInfo']: item });
                  }}
                  onSearchChange={(newSearchValue: any) => {
                    setSelectedValues((prevSelectedValues) => ({
                      ...prevSelectedValues,
                      compInfo: newSearchValue,
                    }));
                  }}
                  required={true}
                  defaultValue={selectedProduct?.compCntn}
                />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <CustomCheckBoxGroup<ProductRequestUpdateFields>
                  control={control}
                  title={'시즌'}
                  name={'seasonCds'}
                  values={seasonData}
                  checkedValues={getValues('seasonCds') || []}
                  onCheckedChange={handleSeasonCd}
                  className={'btnChk'}
                  required={true}
                />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <dl>
                  <dt>
                    스타일<span className={'req'}>*</span>
                  </dt>
                  <dd>
                    <div className="formBox sel2">
                      <FormDropDown<ProductRequestUpdateFields>
                        type={'single'}
                        control={control}
                        name={'funcCd'}
                        defaultOptions={[...DefaultOptions.Select]}
                        codeUpper={'90060'}
                        onChange={handleFuncCd}
                        required={false}
                      />
                      <FormDropDown<ProductRequestUpdateFields>
                        type={'single'}
                        control={control}
                        name={'funcDetCd'}
                        defaultOptions={[defaultOption]}
                        options={funcDetCdOptions}
                        required={false}
                      />
                    </div>
                  </dd>
                </dl>
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <CustomDebounceSelect
                  title={Utils.getGubun('sku1', '구분1')}
                  gbCode={'sku1'}
                  type={'form'}
                  fetchOptions={textAreaValues.gubunInfo}
                  onChange={(value) => handleSelectChange('gubunInfo', value)}
                  onEditItem={(item) => {
                    updatePartnergubunInfoMutate({ ['gubunInfo']: item });
                  }}
                  onSearchChange={(newSearchValue: any) => {
                    setSelectedValues((prevSelectedValues) => ({
                      ...prevSelectedValues,
                      gubunInfo: newSearchValue,
                    }));
                  }}
                  defaultValue={selectedProduct?.gubunCntn}
                />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormInput<ProductRequestUpdateFields>
                  control={control}
                  name={'extBarCode'}
                  label={'외부바코드'}
                  placeholder={Placeholder.Input || ''}
                  required={false}
                />
              </PopupFormType>
            </PopupFormGroup>
          </div>
          <div className={`${activeTabKey === '2' ? 'on' : ''} tab`}>
            <PopupFormGroup>
              <PopupFormType className={'type1'}>
                <CustomDebounceSelect
                  title="디자이너"
                  type={'form'}
                  fetchOptions={textAreaValues.designCntn}
                  onChange={(value) => handleSelectChange('designCntn', value)}
                  onEditItem={(item) => {
                    updatePartnerdesignCntnMutate({ ['designCntn']: item });
                  }}
                  onSearchChange={(newSearchValue: any) => {
                    setSelectedValues((prevSelectedValues) => ({
                      ...prevSelectedValues,
                      designCntn: newSearchValue,
                    }));
                  }}
                  defaultValue={selectedValues?.designCntn || ''}
                />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormInput<ProductRequestUpdateFields>
                  inputType={'file'}
                  label={'작업지시서'}
                  control={control}
                  name={'fileId'}
                  fileInpHidden={true}
                  required={false} // 인풋히든
                  onClick={() => {
                    setSelectedFileType('file');
                    commonOpenModal('UPLOAD');
                  }}
                >
                  <div className="fileBoxArea">
                    <div className="etcTxt">jpg, gif, pdf</div>
                    {file.length > 0 ? (
                      <button
                        className="btn"
                        onClick={() => {
                          commonOpenModal('FILES');
                        }}
                      >
                        목록보기
                      </button>
                    ) : (
                      ''
                    )}
                  </div>
                </FormInput>
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormInput<ProductRequestUpdateFields>
                  control={control}
                  name={'minAsnCnt'}
                  label={'최소발주수량'}
                  placeholder={Placeholder.Input || ''}
                  required={true}
                />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormInput<ProductRequestUpdateFields>
                  control={control}
                  name={'orgAmt'}
                  label={'생산원가'}
                  placeholder={Placeholder.Input || ''}
                  required={true}
                  onChange={handleOrgAmtChange}
                  price={true}
                />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormInput<ProductRequestUpdateFields>
                  control={control}
                  name={'sellAmt'}
                  label={'도매가'}
                  placeholder={Placeholder.Input || ''}
                  required={true}
                  onChange={handleSellAmtChange}
                  price={true}
                />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <dl>
                  <dt>배수(마진)</dt>
                  <dd>
                    {marRate && (
                      <>
                        {marRate?.multiplier}배&nbsp;( {marRate?.rate}% )
                      </>
                    )}
                  </dd>
                </dl>
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormInput<ProductRequestUpdateFields>
                  inputType={'file'}
                  label={'상품이미지'}
                  control={control}
                  name={'imgFileId'}
                  required={false}
                  fileInpHidden={true}
                  onClick={() => {
                    setSelectedFileType('image');
                    commonOpenModal('UPLOAD');
                  }}
                >
                  <div className="etcTxt">10장까지 등록 가능해요</div>
                </FormInput>
                {Array.isArray(imgFile) && imgFile.length > 0 ? (
                  <div className="imgArea">
                    <div className="img" ref={listDivRef}>
                      <div style={{ transform: `translateX(${translateXValue}px)` }} ref={listRef}>
                        {imgFile.map((f: any, index: number) => {
                          return (
                            <div
                              key={f.sysFileNm}
                              draggable
                              onDragStart={() => handleDragStart(index)}
                              onDragOver={(event) => handleDragOver(event, index)}
                              onDrop={(event) => handleDrop(event, index)}
                            >
                              <img
                                src={f.url}
                                alt={f.fileNm}
                                onClick={() => {
                                  setCurrentImageIndex(index);
                                  commonOpenModal('IMAGES', index);
                                }}
                              />
                              <span className="num">{index + 1}</span>
                              <span
                                onClick={() => {
                                  setCurrentImageIndex(index);
                                  commonOpenModal('IMAGES', index);
                                }}
                              >
                                {f.fileNm}
                              </span>
                              <button className="deleteBtn" onClick={() => handleDelete(index)}>
                                삭제
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <button className="prevBtn" onClick={moveLeft}>
                      왼쪽으로 이동
                    </button>
                    <button className="nextBtn" onClick={moveRight}>
                      오른쪽으로 이동
                    </button>
                  </div>
                ) : (
                  ''
                )}
                {commonModalType.type === 'UPLOAD' && commonModalType.active && (
                  <FileUploadsPop
                    fileId={selectedFileType === 'image' ? getValues('imgFileId')?.toString() : getValues('fileId')?.toString()}
                    onValueChange={(fileInfo: CommonResponseFileDown) => {
                      if (selectedFileType === 'image') {
                        handleChildValueChange(fileInfo);
                      } else if (selectedFileType === 'file') {
                        handleFileValueChange(fileInfo);
                      }
                    }}
                  />
                )}
              </PopupFormType>
            </PopupFormGroup>
          </div>
          <div className={`${activeTabKey === '3' ? 'on' : ''} tab`}>
            <span className="txtNotice red">‘생산처결제’ 메뉴에서 결제대금 관리가 가능해요</span>
            <div className="tblBox noLine mt10">
              <table>
                <caption></caption>
                <colgroup>
                  <col width="60px" />
                  <col width="28%" />
                  <col width="28%" />
                  <col width="*" />
                  <col width="40px" />
                </colgroup>
                <thead>
                  <tr>
                    <th>
                      메인 <span className="req">*</span>
                    </th>
                    <th>
                      공장명<span className="req">*</span>
                    </th>
                    <th data-tooltip-id="my-tooltip" data-tooltip-content="공장 결제관리에 사용됩니다.">
                      임가공<span className="req">*</span>
                    </th>
                    <th>비고</th>
                    <th className="agnC">
                      <button className="btn rowAdd" onClick={addRow}></button>
                      <Tooltip id="my-tooltip" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {skuFactoryList?.map((row, index) => (
                    <tr key={row.key}>
                      <td>
                        <CustomRadio<ProductRequestUpdateFields>
                          control={control}
                          name={'mainYn'}
                          value={row.factoryId !== undefined ? row.factoryId : ''} // 현재 항목의 값
                          onChange={() => handleRadioChange(row.factoryId ?? 0)}
                          checked={row.mainYn === 'Y'} // mainYn 값에 따라 체크 여부 결정
                          className={'solo'}
                        />
                      </td>
                      <td>
                        <FormDropDown<ProductRequestUpdateFields>
                          control={control}
                          name={`skuFactoryId${row.key}` as keyof ProductRequestUpdateFields}
                          options={factoryOptions}
                          required={false}
                          onChange={(e, value) => {
                            handleDropDownChangeWrapper(row.key, 'factoryId', value);
                          }}
                          virtual={false}
                        />
                      </td>
                      <td>
                        <FormInput<ProductRequestUpdateFields>
                          control={control}
                          inputType={'single'}
                          name={`gagongAmt${row.key}` as keyof ProductRequestUpdateFields}
                          onChange={(e) => handleInputChange(row.key, 'gagongAmt', e.target.value)}
                          price={true}
                        />
                      </td>
                      <td>
                        <FormInput<ProductRequestUpdateFields>
                          control={control}
                          inputType={'single'}
                          name={`etcCntn${row.key}` as keyof ProductRequestUpdateFields}
                          onChange={(e) => handleInputChange(row.key, 'etcCntn', e.target.value)}
                        />
                      </td>
                      <td>
                        <button className="btn rowRemove" onClick={() => handleRowDelete(row.key)}></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="result">
              <dl className="total">
                <dt>총액</dt>
                <dd>
                  <span>{Utils.setComma(totalGagongAmt)}&nbsp;원</span>
                </dd>
              </dl>
              <dl>
                <dt>생산원가</dt>
                <dd>
                  <span>{watch('orgAmt')}&nbsp;원</span>
                </dd>
              </dl>
              <dl className="deviationAmt">
                <dt>오차금액</dt>
                <dd>
                  <span className={parseFloat(Utils.removeComma(watch('orgAmt')) || '0') - totalGagongAmt > 0 ? 'blue' : 'red'}>
                    {parseFloat(Utils.removeComma(watch('orgAmt')) || '0') - totalGagongAmt}&nbsp;원
                  </span>
                </dd>
              </dl>
            </div>
          </div>
        </PopupFormBox>
      </PopupContent>
      {/*<Loading />*/}
      {commonModalType.type === 'IMAGES' && commonModalType.active && <ImagePop imgFile={imgFile} initialIndex={currentImageIndex} />}
      {commonModalType.type === 'FILES' && commonModalType.active && file.length > 0 && (
        <FilesShowPop file={file} setFile={setFile} initialIndex={currentImageIndex} />
      )}
    </PopupLayout>
  );
};

export default ProductModPop;
