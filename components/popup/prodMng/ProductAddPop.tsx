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
import { CommonResponseFileDown, ProductRequestCreate, RetailResponseDetail, RetailResponsePaging, SkuFactory } from '../../../generated';
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
import { usePartnerStore } from '../../../stores/usePartnerStore';
import dayjs from 'dayjs';
import { Tooltip } from 'react-tooltip';
import FilesShowPop from '../common/FilesShowPop';
import Loading from '../../Loading';
import CustomDebounceSelect, { DebounceSelectRefInterface } from '../../CustomDebounceSelect';
import CustomDoubleSelect from '../../CustomDoubleSelect';
import CustomInputSelect from '../../CustomInputSelect';
import PopupFormBox from '../content/PopupFormBox';
import PopupFormGroup from '../content/PopupFormGroup';
import PopupFormType from '../content/PopupFormType';
import CustomNewDatePicker from '../../CustomNewDatePicker';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRetailStore } from '../../../stores/useRetailStore';

type FactoryRowData = SkuFactory & { key: string };

type CustomCheckBoxGroupRef = {
  focusOnInput: () => void;
};

/** 상품관리 등록 팝업 */
const ProductAddPop = () => {
  const session = useSession();
  /** 스토어 - State */
  const [commonModalType, commonOpenModal, getFileUrl] = useCommonStore((s) => [s.modalType, s.openModal, s.getFileUrl]);
  const [modals, openModal, closeModal, insertProduct] = useProductMngStore((s) => [s.modals, s.openModal, s.closeModal, s.insertProduct]);
  const [getRetailDetail2] = useRetailStore((s) => [s.getRetailDetail2]);
  const [factoryOptions, setFactoryOptions] = useState<DropDownOption[]>([]);

  const [sizeData, setSizeData] = useState([]);
  const [seasonData, setSeasonData] = useState([]);

  const [selectedFileType, setSelectedFileType] = useState<string | null>(null);
  const [file, setFile] = useState<any>([]);
  const [imgFile, setImgFile] = useState<any>([]);
  const [prodAttrOpen, setProdAttrOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 판매처 데이터 관련
  const [respondedRetailList, setRespondedRetailList] = useState<RetailResponsePaging[]>([]);
  const pSearchAreaRef = useRef<InputRef>(null);
  const pSelectorRef = useRef<BaseSelectRef>(null);
  const prodNmRef = useRef<HTMLInputElement>(null);
  const skuColorsRef = useRef<HTMLInputElement>(null);
  const skuSizeRef = useRef<HTMLInputElement>(null);
  const compInfoRef = useRef<DebounceSelectRefInterface>(null);
  const seasonCdsRef = useRef<CustomCheckBoxGroupRef>(null);
  const funcDetCdRef = useRef<BaseSelectRef>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const orgAmtRef = useRef<HTMLInputElement>(null);
  const skuFactoryId0Ref = useRef<BaseSelectRef>(null);
  const sellAmtRef = useRef<HTMLInputElement>(null);

  const [InputValue, setInputValue] = useState<string>('');
  const [selectedRetail, setSelectedRetail] = useState<RetailResponsePaging | undefined>(undefined);
  /** 거래처 조회를 위한 필터 */
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters({
    sellerNm: '',
  });

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
  } = useForm<ProductRequestCreate>({
    resolver: yupResolver(YupSchema.ProductRequest(prodAttrOpen)), // 완료
    defaultValues: {
      sellerId: undefined, // 추가
      partnerId: session.data?.user.partnerId, // 파트너 아이디 설정
      funcCd: '',
      fabric: '',
      prodAttrCd: 'N',
      seasonCds: [],
      releaseYmd: dayjs().format('YYYY-MM-DD'),
      minAsnCnt: 0,
      formYn: 'N',
      skuColors: [],
      skuList: [],
      skuFactoryList: [],
      prodNm: '',
    },
    mode: 'onSubmit',
  });

  /** 데이터 조회 : 공장, 제작약어, 사이즈코드 */
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
      setFactoryOptions(options);
    } else {
      toastError(resultMessage);
    }
  };
  // size 사이즈
  const fetchSizeData = async () => {
    const { data: dataList } = await authApi.get(`/partner/detail`);
    const { resultCode, body, resultMessage } = dataList;
    if (resultCode === 200) {
      const sizeArray = body.sizeInfo.split(',');
      const sizeData = sizeArray.map((item: any, index: number) => ({
        key: index,
        value: item,
        label: item,
      }));
      setSizeData(sizeData);
      reset((prev: any) => ({
        ...prev,
        orderShortNm: body.orderShortNm,
      }));
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
    fetchSizeData();
    fetchSeasonData();
    if (prodNmRef.current) {
      setTimeout(() => prodNmRef.current?.focus(), 100);
    }
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
    {},
  );
  useEffect(() => {
    if (retail) {
      const { resultCode, body, resultMessage } = retail.data;
      if (resultCode == 200) {
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
  const search = () => {
    const searchValue = pSearchAreaRef.current?.input?.value;
    if (searchValue == undefined) {
      toastError('검색조건을 1개 이상 입력하세요.');
      return;
    }
    onChangeFilters('sellerNm', searchValue);
    setTimeout(() => {
      onSearch();
    }, 100);
  };

  /** 스큐공장 */
  // 상태 정의
  const [skuFactoryList, setskuFactoryList] = useState<FactoryRowData[]>([{ key: '0', factoryId: undefined, gagongAmt: undefined, etcCntn: '', mainYn: 'N' }]);
  // 새로운 행을 추가하는 함수
  const addRow = () => {
    setskuFactoryList((prevList) => [
      ...prevList,
      { key: skuFactoryList ? skuFactoryList.length + '' : '0', factoryId: undefined, gagongAmt: undefined, etcCntn: '', mainYn: 'N' },
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
  useEffect(() => {
    // 첫 번째 줄 mainYn을 'Y'로 초기화
    if (skuFactoryList.length > 0 && !skuFactoryList.some((item) => item.mainYn === 'Y')) {
      const updatedskuFactoryList = skuFactoryList.map((item, index) => ({
        ...item,
        mainYn: index === 0 ? 'Y' : 'N', // 첫 번째 항목만 'Y'
      }));
      setskuFactoryList(updatedskuFactoryList);
    }
  }, [skuFactoryList]);
  // 스큐공장 list 업데이트
  useEffect(() => {
    reset((prev) => ({
      ...prev,
      skuFactoryList: skuFactoryList,
    }));
  }, [skuFactoryList]);
  // 상품공장 내용 검증
  const validateFactoryRow = (row: FactoryRowData) => {
    console.log('validateFactoryRow===>', row);

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
    SSXX: 'SS__', // 봄, 여름
    XXFW: '__FW', // 가을, 겨울
    SSFW: 'SSFW', // 봄, 여름, 가을, 겨울
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

  // 가격 필드 입력 처리 함수
  const handleCommaFormattedInput = (fieldName: 'sellAmt' | 'orgAmt') => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;

      // 숫자만 추출
      const numericValue = Utils.removeComma(rawValue);

      // 상태 업데이트: 저장할 값은 숫자로
      setValue(fieldName, numericValue);

      // 표시용 값: 포맷팅 적용
      const formattedValue = Utils.setComma(numericValue);
      setValue(`${fieldName}` as const, formattedValue); // 별도 display 필드가 있으면 이렇게 관리 가능

      // 현재 sellAmt, orgAmt 가져오기 (string -> number 처리)
      const sellAmtRaw = getValues('sellAmt');
      const orgAmtRaw = getValues('orgAmt');

      const sellAmt = typeof sellAmtRaw === 'string' ? Utils.removeComma(sellAmtRaw) : sellAmtRaw ?? 0;
      const orgAmt = typeof orgAmtRaw === 'string' ? Utils.removeComma(orgAmtRaw) : orgAmtRaw ?? 0;

      // 값이 모두 존재할 때만 마진율 계산
      if (sellAmt && orgAmt) {
        calculateMarRate(sellAmt, orgAmt);
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

  /** 상품구분 */
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
      funcDetCdRef.current?.focus();
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
    sizeInfo: [],
  });
  const handleSelectChange = (name: string, value: string) => {
    setSelectedValues((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    if (name === 'sizeInfo') {
      setValue('skuSizes', value as unknown as string[]);
    } else if (name === 'compInfo') {
      setValue('compCntn', value as string);
    } else if (name === 'gubunInfo') {
      setValue('gubunCntn', value as string);
    } else {
      console.log('디자인cntn');
      setValue('designNm', value as string);
    }
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

  /** 상품등록 */
  const queryClient = useQueryClient();
  const { mutate: insertProductMutate, isLoading } = useMutation(insertProduct, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.' || '');
          await queryClient.invalidateQueries(['/product/paging']);
          closeModal('ADD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    },
  });

  /** 탭 관련 */
  const [activeTabKey, setActiveTabKey] = useState<string>('1');
  const onChange = (key: string) => {
    console.log(getValues('prodNm'));
    setActiveTabKey(key);
  };
  const items: TabsProps['items'] = [
    { key: '1', label: '상품정보' },
    { key: '2', label: '생산정보' },
    { key: '3', label: '임가공' },
  ];

  // 데이터 insert
  const [loading, setLoading] = useState(false);
  const onInvalid = (errors: any) => {
    console.log('onInvalid 실행됨 ===>', errors);
    const allValues = watch();
    console.log('실시간 모든 값 ===>', allValues);
    // 첫 번째 에러만 토스트로 띄우기
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toastError(firstError.message);
    }
  };

  const onValid: SubmitHandler<ProductRequestCreate> = (data) => {
    // if (loading) return; // 중복 클릭 방지

    console.log('prod data =====>', data);
    setLoading(true); // 클릭 시 로딩 시작

    // skuColors가 undefined일 경우 빈 배열로 초기화
    const skuColors: string[] = data.skuColors || [];
    const skuSizes: string[] = selectedValues.sizeInfo || [];

    // skuList 만들기
    let idx = 0;
    data.skuList = [];
    skuColors.forEach((color: string) => {
      skuSizes.forEach((size: string) => {
        data.skuList.push({
          no: ++idx,
          skuNm: data.prodNm + '.' + color + '.' + size,
          skuColor: color,
          skuSize: size,
          sellAmt: parseInt(Utils.removeComma(String(data.sellAmt || '0'))),
          orgAmt: parseInt(Utils.removeComma(String(data.orgAmt || '0'))),
          sleepYn: 'N',
          sellerId: data.sellerId,
          seasonCd: data.seasonCd,
          designId: data.designId,
          fileId: data.fileId,
          imgFileId: data.imgFileId,
          funcCd: data.funcCd,
          funcDetCd: data.funcDetCd,
          gubunCntn: selectedValues.gubunInfo,
          designNm: selectedValues.designCntn,
          compCntn: selectedValues.compInfo,
          minAsnCnt: data.minAsnCnt,
          prodAttrCd: data.prodAttrCd,
          releaseYmd: data.releaseYmd,
          extBarCode: data.extBarCode,
        });
      });
    });

    const skuFactoryValidationErrors = validateAllRows();
    if (prodAttrOpen) {
      if (!data.sellerId) {
        toastError('판매처를 선택해주세요.' + selectedRetail?.id);
        setActiveTabKey('1');
        return;
      }
    }
    if (skuColors.length === 0) {
      // 스큐컬러가 없을경우
      toastError('스큐 칼라를 입력해주세요.');
      setActiveTabKey('1');
      return;
    }
    if (skuSizes.length === 0) {
      // 스큐사이즈가 없을경우
      toastError('스큐 사이즈를 선택해주세요.');
      setActiveTabKey('1');
      return;
    }
    if (data.skuList.length === 0) {
      // 스큐리스트가 없을경우
      toastError('스큐 칼라와 사이즈가 없습니다.');
      setActiveTabKey('1');
      return;
    }
    if (!selectedValues.compInfo) {
      // 혼용율이 없을경우
      toastError('혼용율을 선택해주세요.');
      setActiveTabKey('1');
      return;
    }
    if (!data.seasonCd) {
      // 시즌코드가 없을경우
      toastError('시즌을 선택해주세요.');
      setActiveTabKey('1');
      return;
    }
    if (!data.funcCd || !data.funcDetCd) {
      // 복종이 없을경우
      toastError('스타일을 선택해주세요.');
      setActiveTabKey('1');
      return;
    }
    if (!data.orgAmt) {
      // 생산원가가 없을경우
      toastError('생산원가를 입력해주세요.');
      setActiveTabKey('2');
      return;
    }
    if (!data.sellAmt) {
      // 도매가가 없을경우
      toastError('도매가를 입력해주세요.');
      setActiveTabKey('2');
      return;
    }
    if (skuFactoryValidationErrors.length > 0) {
      // 스큐공장 정보 있을시 데이터 검증
      toastError(skuFactoryValidationErrors.join('\n'));
      setActiveTabKey('3');
      return;
    }

    // 제출 처리
    console.log('인서트 데이터 ==>', data);
    // setLoading(false);
    insertProductMutate(data);
  };

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

  /* 검색 버튼 혹은 엔터 키 사용 시 */
  const onKeyDownAtInputOfPDataList = (e: React.KeyboardEvent<HTMLInputElement>) => {
    //const eventTarget = e.target as EventTarget & HTMLInputElement;
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

  const onSelectRetailInRetailSearchBar = (retailInfo: RetailResponseDetail | undefined) => {
    setSelectedRetail(retailInfo); // commonStore 내부 전역 소매처 상태 업데이트
    if (retailInfo?.id) {
      getRetailDetail2(retailInfo.id).then((result) => {
        const { resultCode, body, resultMessage } = result.data;
        if (resultCode === 200) {
          const retailInfo = body as RetailResponseDetail;
          setSelectedRetail(retailInfo);
          console.log('retailAmt ===>', body);
          setValue('sellerId', retailInfo.id);
          if (retailInfo.orderNm) {
            setValue('prodNm', retailInfo.orderNm + '_');
          }
          prodNmRef.current?.focus();
        } else {
          toastError('소매처별 금전정보 조회 도중 문제가 발생하였습니다.');
          console.error(resultMessage);
        }
      });
    }
  };

  return (
    <PopupLayout
      width={700}
      open={modals.ADD.active}
      title={'상품 등록'}
      isEscClose={false}
      onClose={() => {
        closeModal('ADD');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button
              className="btn btnBlue"
              type="button"
              title="저장"
              onClick={(e) => {
                console.log('e ===>', e);
                handleSubmit(onValid, onInvalid)(e);
              }}
              ref={saveButtonRef}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') {
                  cancelButtonRef.current?.focus();
                }
              }}
            >
              저장
            </button>
            <button
              className="btn"
              title="닫기"
              onClick={() => closeModal('ADD')}
              ref={cancelButtonRef}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') {
                  saveButtonRef.current?.focus();
                }
              }}
            >
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent className="popInpWidth100">
        {/*<FormDatePicker<ProductRequestCreateFields> control={control} name={'releaseYmd'} title={'등록일자'} className={'popTopRight'} />*/}
        <CustomNewDatePicker
          name={'releaseYmd'}
          type={'date'}
          title={'등록일자'}
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
                    <CustomCheckBox<ProductRequestCreate> control={control} name={'prodAttrCd'} onChange={handleProdAttrCd}>
                      제작상품
                    </CustomCheckBox>
                  </div>
                  {prodAttrOpen ? (
                    <>
                      <div className="formBox selInp">
                        <Search.RetailBar
                          name={'sellerNm'}
                          onRetailSelected={onSelectRetailInRetailSearchBar}
                          onRetailInserted={(response) => {
                            setSelectedRetail(response);
                          }}
                          selectedRetail={selectedRetail}
                          allowNewRetail={false}
                          onRetailDeleted={() => setSelectedRetail(undefined)}
                        />
                      </div>
                    </>
                  ) : (
                    ''
                  )}
                </div>
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormInput<ProductRequestCreate>
                  control={control}
                  name={'prodNm'}
                  label={'상품명'}
                  placeholder={Placeholder.Input || ''}
                  required={true}
                  ref={prodNmRef}
                  onKeyDown={(event: React.KeyboardEvent<Element>) => {
                    const keyboardEvent = event.key;
                    if (event.shiftKey && keyboardEvent === 'Tab') {
                      event.preventDefault();
                    } else if (keyboardEvent === 'Tab') {
                      event.preventDefault();
                      skuColorsRef.current?.focus();
                    }
                  }}
                />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormInput<ProductRequestCreate> control={control} name={'userProdCd'} label={'품번'} placeholder={Placeholder.Input || ''} />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <CustomInputSelect<ProductRequestCreate>
                  name={'skuColors'}
                  control={control}
                  type={'form'}
                  title={'칼라'}
                  required={true}
                  ref={skuColorsRef}
                  onKeyDown={(event: React.KeyboardEvent<Element>) => {
                    const keyboardEvent = event.key;
                    if (event.shiftKey && keyboardEvent === 'Tab') {
                      event.preventDefault();
                      prodNmRef.current?.focus();
                    } else if (keyboardEvent === 'Tab') {
                      event.preventDefault();
                      skuSizeRef.current?.focus();
                    }
                  }}
                />
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
                  defaultValue={getValues('skuSizes')}
                  ref={skuSizeRef}
                  onKeyDown={(event: React.KeyboardEvent<Element>) => {
                    const keyboardEvent = event.key;
                    if (event.shiftKey && keyboardEvent === 'Tab') {
                      event.preventDefault();
                      skuColorsRef.current?.focus();
                    } else if (keyboardEvent === 'Tab') {
                      event.preventDefault();
                      compInfoRef.current?.focusOnInput();
                    }
                  }}
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
                  defaultValue={getValues('compCntn')}
                  ref={compInfoRef}
                  onKeyDown={(event: React.KeyboardEvent<Element>) => {
                    const keyboardEvent = event.key;
                    if (event.shiftKey && keyboardEvent === 'Tab') {
                      event.preventDefault();
                      skuSizeRef.current?.focus();
                    } else if (keyboardEvent === 'Tab') {
                      event.preventDefault();
                      seasonCdsRef.current?.focusOnInput();
                    }
                  }}
                />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <CustomCheckBoxGroup<ProductRequestCreate>
                  control={control}
                  title={'시즌'}
                  name={'seasonCds'}
                  values={seasonData}
                  checkedValues={getValues('seasonCds') || []}
                  onCheckedChange={handleSeasonCd}
                  className={'btnChk'}
                  required={true}
                  ref={seasonCdsRef}
                />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <dl>
                  <dt>
                    스타일<span className={'req'}>*</span>
                  </dt>
                  <dd>
                    <div className="formBox sel2">
                      <FormDropDown<ProductRequestCreate>
                        type={'single'}
                        control={control}
                        name={'funcCd'}
                        defaultOptions={[...DefaultOptions.Select]}
                        codeUpper={'90060'}
                        onChange={handleFuncCd}
                        required={false}
                      />
                      <FormDropDown<ProductRequestCreate>
                        type={'single'}
                        control={control}
                        name={'funcDetCd'}
                        defaultOptions={[defaultOption]}
                        options={funcDetCdOptions}
                        required={false}
                        refOfDropDown={funcDetCdRef}
                        onChange={() => {
                          setActiveTabKey('2');
                          setTimeout(() => {
                            orgAmtRef.current?.focus();
                            orgAmtRef.current?.select();
                          }, 500);
                        }}
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
                  defaultValue={getValues('gubunCntn')}
                />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormInput<ProductRequestCreate>
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
                  defaultValue={getValues('designNm')}
                />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormInput<ProductRequestCreate>
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
                <FormInput<ProductRequestCreate>
                  control={control}
                  name={'minAsnCnt'}
                  label={'최소발주수량'}
                  placeholder={Placeholder.Input || ''}
                  priceTxt={'장'}
                />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormInput<ProductRequestCreate>
                  control={control}
                  name={'orgAmt'}
                  label={'생산원가'}
                  placeholder={Placeholder.Input || ''}
                  required={true}
                  onChange={handleOrgAmtChange}
                  price={true}
                  priceTxt={'원'}
                  ref={orgAmtRef}
                  onKeyDown={(event) => {
                    const keyboardEvent = event.key;
                    if (event.shiftKey && keyboardEvent === 'Tab') {
                      event.preventDefault();
                      setActiveTabKey('1');
                      setTimeout(() => {
                        funcDetCdRef.current?.focus();
                      }, 100);
                    }
                  }}
                />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormInput<ProductRequestCreate>
                  control={control}
                  name={'sellAmt'}
                  label={'도매가'}
                  placeholder={Placeholder.Input || ''}
                  required={true}
                  onChange={handleSellAmtChange}
                  price={true}
                  priceTxt={'원'}
                  ref={sellAmtRef}
                  onKeyDown={(event) => {
                    const keyboardEvent = event.key;
                    if (event.shiftKey && keyboardEvent === 'Tab') {
                      event.preventDefault();
                      orgAmtRef.current?.focus();
                    } else if (event.key === 'Tab') {
                      event.preventDefault();
                      setActiveTabKey('3');
                      setTimeout(() => {
                        skuFactoryId0Ref.current?.focus();
                      }, 500);
                    }
                  }}
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
                <FormInput<ProductRequestCreate>
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
                    <tr key={'skuFactoryList_' + index}>
                      <td>
                        <CustomRadio<ProductRequestCreate>
                          control={control}
                          name={'mainYn'}
                          value={row.factoryId !== undefined ? row.factoryId : ''} // 현재 항목의 값
                          onChange={() => handleRadioChange(row.factoryId ?? 0)}
                          checked={row.mainYn === 'Y'} // mainYn 값에 따라 체크 여부 결정
                          className={'solo'}
                        />
                      </td>
                      <td>
                        <FormDropDown<ProductRequestCreate>
                          control={control}
                          name={`skuFactoryId${index}` as keyof ProductRequestCreate}
                          options={factoryOptions}
                          required={false}
                          onChange={(e, value) => {
                            handleDropDownChangeWrapper(index.toString(), 'factoryId', value);
                          }}
                          virtual={false}
                          refOfDropDown={index === 0 ? skuFactoryId0Ref : undefined}
                          onKeyDown={(event) => {
                            const keyboardEvent = event.key;
                            if (event.shiftKey && keyboardEvent === 'Tab') {
                              event.preventDefault();
                              setActiveTabKey('2');
                              setTimeout(() => {
                                sellAmtRef.current?.focus();
                              }, 100);
                            }
                          }}
                        />
                      </td>
                      <td>
                        <FormInput<ProductRequestCreate>
                          control={control}
                          inputType={'single'}
                          name={`gagongAmt${row.key}` as keyof ProductRequestCreate}
                          onChange={(e) => handleInputChange(row.key, 'gagongAmt', e.target.value)}
                          price={true}
                          priceTxt={'원'}
                          onKeyDown={(event: React.KeyboardEvent<Element>) => {
                            const keyboardEvent = event.key;
                            if (event.shiftKey && keyboardEvent === 'Tab') {
                              console.log('shift Tab is done'); // 여기서 아무것도 안해야 기본 shift tab 키가 먹는다.
                            } else if (keyboardEvent === 'Tab') {
                              event.preventDefault();
                              saveButtonRef.current?.focus();
                            }
                          }}
                        />
                      </td>
                      <td>
                        <FormInput<ProductRequestCreate>
                          control={control}
                          inputType={'single'}
                          name={`etcCntn${row.key}` as keyof ProductRequestCreate}
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
                  <span className={parseFloat(Utils.removeComma(watch('orgAmt')?.toString()) || '0') - totalGagongAmt > 0 ? 'blue' : 'red'}>
                    {parseFloat(Utils.removeComma(watch('orgAmt')?.toString()) || '0') - totalGagongAmt}&nbsp;원
                  </span>
                </dd>
              </dl>
            </div>
          </div>
        </PopupFormBox>

        {isLoading ?? <Loading />}
      </PopupContent>
      {/*<Loading />*/}
      {commonModalType.type === 'IMAGES' && commonModalType.active && <ImagePop imgFile={imgFile} initialIndex={currentImageIndex} />}
      {commonModalType.type === 'FILES' && commonModalType.active && file.length > 0 && (
        <FilesShowPop file={file} setFile={setFile} initialIndex={currentImageIndex} />
      )}
    </PopupLayout>
  );
};

export default ProductAddPop;
