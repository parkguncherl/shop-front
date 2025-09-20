import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Table, Title, toastSuccess } from '../../../components';
import { TableHeader, toastError } from '../../../components';
import { CellValueChangedEvent, ColDef, RowClassParams, RowDoubleClickedEvent } from 'ag-grid-community';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { useAgGridApi } from '../../../hooks';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { ProductMngPagingFilter, useProductMngStore } from '../../../stores/useProductMngStore';
import { useCommonStore } from '../../../stores';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { authApi } from '../../../libs';
import { useQuery } from '@tanstack/react-query';
import { ProductResponsePaging } from '../../../generated';
import ProductAddPop from '../../../components/popup/prodMng/ProductAddPop';
import { Utils } from '../../../libs/utils';
import ProductModPop from '../../../components/popup/prodMng/ProductModPop';
import { useSession } from 'next-auth/react';
import Loading from '../../../components/Loading';
import dayjs from 'dayjs';
import TunedGrid from '../../../components/grid/TunedGrid';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { CustomSwitch } from '../../../components/CustomSwitch';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';

const ProductMng = () => {
  const { onGridReady } = useAgGridApi();
  const session = useSession();
  const nowPage = 'oms_productMng'; // filter 저장 2025-01-21
  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData, getFileUrl] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList,
    s.setFilterDataList,
    s.getFilterData,
    s.getFileUrl,
  ]);
  const gridRef = useRef<AgGridReact>(null);
  const [paging, setPaging, selectedProduct, setSelectedProduct, updateProductGrid, modals, openModal] = useProductMngStore((s) => [
    s.paging,
    s.setPaging,
    s.selectedProduct,
    s.setSelectedProduct,
    s.updateProductGrid,
    s.modals,
    s.openModal,
  ]);
  const [selectSkuId, setSelectSkuId] = useState();
  // const [selectProdId, setSelectProdId] = useState();
  const [selectedSleepValue, setSelectedSleepValue] = useState<string | number>('N'); // 라디오박스 휴면 체크
  const [sleepBtn, setSleepBtn] = useState<boolean>(false); // 휴면선택 버튼
  const [edit, setEdit] = useState<boolean>(false); // 일괄 수정 허용버튼
  const [slide, setSlide] = useState<boolean>(false); // 스와이퍼
  const [productData, setProductData] = useState<ProductResponsePaging[]>([]);
  const [isFirstRender, setIsFirstRender] = useState<boolean>(true);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<ProductResponsePaging[]>([]); // 합계데이터 만들기
  const [filters, onChangeFilters, onFiltersReset, setFilters] = useFilters<ProductMngPagingFilter>(
    getFilterData(filterDataList, nowPage) || {
      searchKeyword: '',
      partnerId: session.data?.user.partnerId,
      sleepYn: 'N',
      prodAttrCd: '',
      isAllData: false,
      seasonCd: [],
      skuSize: [],
    },
  );

  /** 드롭다운 */
  const [dropdownOptions, setDropdownOptions] = useState<{
    gubunInfo: string[];
    compInfo: string[];
    designCntn: string[];
    factoryList: { compNm: string }[];
    seasonData: { code: string; name: string }[];
    funcCd: { code: string; label: string }[];
    funcDetCd: { code: string; label: string }[];
    skuSize: { code: string; label: string }[];
  }>({
    gubunInfo: [],
    compInfo: [],
    designCntn: [],
    factoryList: [],
    seasonData: [],
    funcCd: [],
    funcDetCd: [],
    skuSize: [],
  });

  /** 혼용율, 디자이너, 구분1 */
  const fetchAllData = async () => {
    try {
      // 여러 API 요청을 병렬로 처리
      const [partnerDataResponse] = await Promise.all([authApi.get('/partner/detail')]);

      const { resultCode, body, resultMessage } = partnerDataResponse.data;

      if (resultCode === 200) {
        // sizeData 처리
        const sizeArray = body.sizeInfo.split('\n');
        const sizeData = [
          { code: '', label: '선택' },
          ...sizeArray.map((item: any) => ({
            code: item,
            label: item,
          })),
        ];

        // 드롭다운 옵션 업데이트
        setDropdownOptions((prev) => ({
          ...prev,
          skuSize: sizeData,
          compInfo: ['선택', ...(body.compInfo || '').split('\n')],
          gubunInfo: ['선택', ...(body.gubunInfo || '').split('\n')],
          designCntn: ['선택', ...(body.designCntn || '').split('\n')],
        }));
      } else {
        toastError(resultMessage);
      }
    } catch (error) {
      toastError('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [edit]);

  /** 생산처 조회 및 드롭다운 */
  const { data: factory } = useQuery(['/factory/omsPartnerId'], (): any =>
    authApi.get('/factory/omsPartnerId', {
      params: {
        ...filters,
      },
    }),
  );
  useEffect(() => {
    if (factory) {
      const { resultCode, body, resultMessage } = factory.data;
      // compNm만 추출
      const compNmList = body.map((item: any) => ({ compNm: item.compNm }));
      setDropdownOptions((prev) => ({
        ...prev,
        factoryList: compNmList,
      }));
    }
  }, [factory]);

  /** 시즌데이터 드롭다운 */
  useEffect(() => {
    const seasonData = [
      { code: 'S___', name: '봄' },
      { code: '_S__', name: '여름' },
      { code: '__F_', name: '가을' },
      { code: '___W', name: '겨울' },
      { code: 'SS__', name: '봄 여름' },
      { code: 'S_F_', name: '봄 가을' },
      { code: 'S__W', name: '봄 겨울' },
      { code: '_SF_', name: '여름 가을' },
      { code: '_S_W', name: '여름 겨울' },
      { code: '__FW', name: '가을 겨울' },
      { code: 'S_FW', name: '봄 가을 겨울' },
      { code: 'SS_W', name: '봄 여름 겨울' },
      { code: 'SSFW', name: '사계절' },
    ];

    setDropdownOptions((prev) => ({
      ...prev,
      seasonData,
    }));
  }, []);

  /** 혼용율, 구분1, 디자이너, 사이즈 드롭다운 */
  useEffect(() => {
    const updateColumnDefs = (field: string, values: string[]) => {
      setColumnDefs((prev) =>
        prev?.map((col) => {
          if (col.field === field) {
            // console.log('필드:', col.field, ' 벨류:', values);
            return {
              ...col,
              cellEditorParams: {
                values: values.length > 0 ? values : ['선택'], // 기본값 포함된 배열 전달
              },
            };
          }
          return col;
        }),
      );
    };
    updateColumnDefs('compCntn', dropdownOptions.compInfo);
    updateColumnDefs('gubunCntn', dropdownOptions.gubunInfo);
    updateColumnDefs('designCntn', dropdownOptions.designCntn);
  }, [dropdownOptions.compInfo, dropdownOptions.gubunInfo, dropdownOptions.designCntn]);

  /** 복종 */
  const fetchFuncCdData = async (codeUpper: string, name: string, params?: any) => {
    if (codeUpper === '' || codeUpper === '선택') {
      return;
    }

    const { data: funcCdDataList } = await authApi.get(`/code/funcCd/${codeUpper}`);
    const { resultCode, body, resultMessage } = funcCdDataList;
    if (resultCode === 200) {
      const options: any = [
        { code: '', label: '선택' }, // 빈 코드와 '선택' 레이블 추가
        ...body.map((item: any) => ({
          code: item.codeCd,
          label: item.codeNm,
        })),
      ];

      if (name === 'funcCd') {
        setDropdownOptions((prev) => ({
          ...prev,
          funcCd: options,
        }));
      } else if (name === 'funcDetCd' && params) {
        params.node.data.dropdownOptions.funcDetCd = options; // 그리드의 데이터에 직접 업데이트
        params.api.refreshCells({
          rowNodes: [params.node],
          columns: ['funcDetCd'],
        });
      }
    } else {
      toastError(resultMessage);
    }
  };
  useEffect(() => {
    fetchFuncCdData('90060', 'funcCd');
  }, []);

  /** 그리드 */
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  useEffect(() => {
    if (isFirstRender && dropdownOptions) {
      setColumnDefs([
        {
          field: 'id',
          headerName: 'prodId',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          hide: true,
        },
        {
          field: 'skuId',
          headerName: 'skuId',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          hide: true,
        },
        {
          field: 'no',
          headerName: 'No.',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          cellClass: (params) => {
            return params.data.edit ? 'noEditCell' : '';
          },
        },
        {
          field: 'userProdCd',
          headerName: '품번',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          filter: true,
          suppressHeaderMenuButton: true,
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : '';
          },
          cellEditor: 'agTextCellEditor',
        },
        {
          field: 'prodNm',
          headerName: '상품명',
          minWidth: 160,
          suppressHeaderMenuButton: true,
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : '';
          },
          cellEditor: 'agTextCellEditor',
          valueFormatter: (params) => {
            const orderShortNm = params.data.orderShortNm || ''; // orderShortNm이 없는 경우 빈 문자열 처리
            const prodNm = params.value; // prodNm 값 사용
            const sellerId = params.data.sellerId;
            return sellerId && orderShortNm ? `${orderShortNm}-${prodNm}` : prodNm;
          },

          // 값 변경 시 prodNm에 값 저장
          valueSetter: (params) => {
            params.data.prodNm = params.newValue; // prodNm에 값 저장
            return true; // 변경을 grid에 적용
          },
        },
        {
          field: 'skuColor',
          headerName: '컬러',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : '';
          },
          cellEditor: 'agTextCellEditor',
        },
        {
          field: 'skuSize',
          headerName: '사이즈',
          minWidth: 70,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : '';
          },
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: (params: any) => {
            return {
              values: params.data.dropdownOptions.skuSize.map((option: any) => option.label),
            };
          },
        },
        {
          field: 'sellAmt',
          headerName: '판매가',
          minWidth: 70,
          cellStyle: GridSetting.CellStyle.RIGHT,
          suppressHeaderMenuButton: true,
          valueFormatter: (params: any) => {
            if (params.node?.rowPinned != 'bottom') {
              return Utils.setComma(params.value);
            }
          },
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : '';
          },
          cellEditor: 'agTextCellEditor', // 기본 텍스트 에디터 사용
          valueParser: (params) => {
            const value = params.newValue;

            // value를 숫자로 변환 후, NaN인지 확인
            const numValue = Number(value);

            // 빈 값이거나 숫자로 변환할 수 없는 경우, 원래 값을 그대로 반환
            if (value === '' || isNaN(numValue)) {
              // params.oldValue가 string일 수 있으므로, 이를 숫자로 변환하여 반환
              return isNaN(Number(params.oldValue)) ? 0 : Number(params.oldValue);
            }
            // 유효한 숫자일 경우 숫자로 변환하여 반환
            return numValue;
          },
        },
        {
          field: 'inventoryAmt',
          headerName: '빈블러',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          cellClass: (params) => {
            return params.data.edit ? 'noEditCell' : '';
          },
          valueFormatter: (params: any) => {
            return Utils.setComma(params.value);
          },
        },
        {
          field: 'waitingCnt',
          headerName: '대기',
          minWidth: 40,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          valueFormatter: (params: any) => {
            return Utils.setComma(params.value);
          },
        },
        {
          field: 'partnerInventoryAmt',
          headerName: '매장재고',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          cellClass: (params) => {
            return params.data.edit ? 'noEditCell' : '';
          },
          valueFormatter: (params: any) => {
            return Utils.setComma(params.value);
          },
        },
        {
          field: 'compCntn',
          headerName: '혼용율',
          minWidth: 120,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : '';
          },
          cellEditor: 'agSelectCellEditor', // 드롭다운 에디터 사용
          cellEditorParams: (params: any) => {
            const filtered = params.data.dropdownOptions.compInfo.filter((item: any) => item !== '');
            return {
              values: filtered.length > 0 ? filtered : ['내용없음'],
            };
          },
        },
        {
          field: 'factoryId',
          headerName: 'factoryId',
          minWidth: 50,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          hide: true,
        },
        {
          field: 'factoryNm',
          headerName: '생산처',
          minWidth: 100,
          cellStyle: GridSetting.CellStyle.LEFT,
          filter: true,
          suppressHeaderMenuButton: true,
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : '';
          },
          cellEditor: 'agRichSelectCellEditor', // 드롭다운 에디터 사용
          cellEditorParams: (params: any) => {
            // params.data.factoryList가 있을 때만 values를 설정
            const factoryList = params.data.dropdownOptions.factoryList || [];
            return {
              values: factoryList.map((item: any) => item.compNm),
              formatValue: (value: any) => {
                // factoryList에서 compNm과 매칭
                const match = factoryList.find((item: any) => item.compNm === value);
                return match ? match.compNm : value;
              },
              allowTyping: true,
              filterList: true,
              highlightMatch: true,
            };
          },
        },
        {
          field: 'designCntn',
          headerName: 'designCntn',
          minWidth: 50,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          hide: true,
        },
        {
          field: 'designNm',
          headerName: '디자이너',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          filter: true,
          suppressHeaderMenuButton: true,
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : '';
          },
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: (params: any) => {
            const filteredDesignCntn = params.data.dropdownOptions.designCntn.filter((item: any) => item !== '');
            return {
              values: filteredDesignCntn.length > 0 ? filteredDesignCntn : ['내용없음'],
            };
          },
        },
        {
          field: 'releaseYmd',
          headerName: '등록연도',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          filter: true,
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : ''; // edit 값에 따라 클래스 추가/제거
          },
          cellEditor: 'agTextCellEditor', // 텍스트 입력 에디터 사용
          valueGetter: (params) => {
            const releaseYmd = params.data.releaseYmd;
            if (releaseYmd) {
              return dayjs(releaseYmd).format('YYYY'); // 'YYYY' 형식 반환
            }
            return ''; // 데이터가 없으면 빈 문자열 반환
          },
          valueSetter: (params) => {
            const oldValue = params.oldValue; // 기존 값
            const newValue = params.newValue; // 새 값

            // 새 값이 없으면 기존 값으로 복원
            if (!newValue) {
              params.data.releaseYmd = oldValue; // 기존 값으로 복원
            } else {
              // 4자리 숫자만 허용
              const yearOnly = /^[0-9]{4}$/.test(newValue); // 4자리 숫자만 허용
              if (yearOnly) {
                params.data.releaseYmd = newValue + '-' + dayjs(params.data.releaseYmd).format('MM-DD');
              } else {
                // 연도가 아닌 다른 형식이면 기존 값 사용
                params.data.releaseYmd = oldValue;
              }
            }
            return true; // 변경 적용
          },
        },
        {
          field: 'releaseDate',
          headerName: '등록일자',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          filter: true,
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : '';
          },
          cellEditor: 'agTextCellEditor',
          valueGetter: (params) => {
            const releaseYmd = params.data.releaseYmd;
            if (releaseYmd) {
              return dayjs(releaseYmd).format('MM월 DD일'); // 'MM월 DD일' 형식 반환
            }
            return ''; // 데이터가 없으면 빈 문자열 반환
          },
          valueSetter: (params) => {
            const newValue = params.newValue;
            if (!newValue) return false; // 값이 없으면 변경하지 않음

            // "MM-DD", "M-D", "MM-D", "M-DD", "MMDD", "MD", "MMD", "MDD" 형식도 허용
            const regex = /^(0?[1-9]|1[0-2])[-/]?([0]?[1-9]|[12][0-9]|3[01])$/;
            if (!regex.test(newValue)) {
              return false; // 형식이 잘못되었으면 변경하지 않음
            }

            // 4자리 또는 3자리 또는 2자리 입력값을 처리하는 로직
            let month = '';
            let day = '';
            if (newValue.length === 4) {
              // MMDD 형식일 경우
              month = newValue.slice(0, 2); // 처음 2자리 => 월
              day = newValue.slice(2, 4); // 나머지 2자리 => 일
            } else if (newValue.length === 3) {
              // 3자리 입력값 (MDD 형식)
              month = newValue.slice(0, 1); // 첫 번째 자리는 월
              day = newValue.slice(1, 3); // 나머지 두 자리는 일
            } else if (newValue.length === 2) {
              // 2자리 입력값 (MM 형식)
              month = newValue.slice(0, 1); // 2자리로 월을 처리
              day = newValue.slice(1, 2); // 일은 빈 문자열
            } else {
              // '-'나 '/' 포함된 경우 처리 (MM-DD 혹은 M-D 형식)
              [month, day] = newValue.split(/[-/]/).map((v: any) => v.padStart(2, '0'));
            }

            // 1자리일 때 '00'으로 패딩
            month = month.padStart(2, '0');
            day = day.padStart(2, '0');

            const year = dayjs(params.data.releaseYmd).format('YYYY');
            const formattedValue = dayjs(`${year}-${month}-${day}`).format('YYYY-MM-DD'); // YYYY-MM-DD 형식으로 변환
            // 날짜가 유효한지 확인
            const isValidDate = dayjs(formattedValue, 'YYYY-MM-DD', true).isValid();
            console.log('뉴값3', year, month, day, formattedValue);
            if (!isValidDate) {
              return false; // 날짜가 유효하지 않으면 변경하지 않음
            }
            // 데이터 모델 업데이트
            params.data.releaseYmd = formattedValue;

            return true; // 업데이트가 성공했음을 알림
          },
        },
        {
          field: 'seasonCd',
          headerName: '시즌',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          filter: true,
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : '';
          },
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: (params: any) => {
            return {
              values: params.data.dropdownOptions.seasonData.map((option: any) => option.code),
            };
          },
          valueFormatter: (params) => {
            const seasonCd = params.value;
            // 시즌 코드 매핑
            const seasonMapping = [
              { regex: /^S___$/, name: '봄' },
              { regex: /^_S__$/, name: '여름' },
              { regex: /^__F_$/, name: '가을' },
              { regex: /^___W$/, name: '겨울' },
              { regex: /^SS__$/, name: '봄 여름' },
              { regex: /^S_F_$/, name: '봄 가을' },
              { regex: /^S__W$/, name: '봄 겨울' },
              { regex: /^_SF_$/, name: '여름 가을' },
              { regex: /^_S_W$/, name: '여름 겨울' },
              { regex: /^__FW$/, name: '가을 겨울' },
              { regex: /^S_FW$/, name: '봄 가을 겨울' },
              { regex: /^SS_W$/, name: '봄 여름 겨울' },
              { regex: /^SSFW$/, name: '사계절' },
            ];
            // 시즌 코드 매핑에 맞는 시즌명 반환
            for (let i = 0; i < seasonMapping.length; i++) {
              if (seasonMapping[i].regex.test(seasonCd)) {
                return seasonMapping[i].name;
              }
            }
            // 매핑되지 않는 경우 기본값 반환
            return '시즌미정';
          },
        },
        {
          field: 'funcCd',
          headerName: '스타일1',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          filter: true,
          suppressHeaderMenuButton: true,
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : '';
          },
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: (params: any) => {
            return {
              values: params.data.dropdownOptions.funcCd.map((option: any) => option.label),
            };
          },
          onCellValueChanged: async (params: any) => {
            const selectedLabel = params.newValue;

            const matchedOption = params.data.dropdownOptions.funcCd.find((option: any) => option.label === selectedLabel);

            if (matchedOption) {
              await fetchFuncCdData(matchedOption.code, 'funcDetCd', params); // 복종2 옵션 업데이트
            }
          },
        },
        {
          field: 'funcDetCd',
          headerName: '스타일2',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          filter: true,
          suppressHeaderMenuButton: true,
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : '';
          },
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: (params: any) => {
            const funcDetCdOptions = params.data.dropdownOptions.funcDetCd;
            return {
              values: funcDetCdOptions ? funcDetCdOptions.map((option: any) => option.label) : [],
            };
          },
          valueFormatter: (params) => {
            // 복종2 데이터가 없으면 비어 있는 값을 표시
            const funcDetCdOptions = params.data?.dropdownOptions?.funcDetCd;
            return funcDetCdOptions ? params.value : '';
          },
        },
        {
          field: 'gubunCntn',
          headerName: Utils.getGubun('sku1', '구분1'),
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          filter: true,
          suppressHeaderMenuButton: true,
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : '';
          },
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: (params: any) => {
            const filtered = params.data.dropdownOptions.gubunInfo.filter((item: any) => item !== '');
            return {
              values: filtered.length > 0 ? filtered : ['내용없음'],
            };
          },
        },
        {
          field: 'prodAttrCd',
          headerName: '제작여부',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          filter: true,
          valueFormatter: (params: any) => {
            return params.value === 'Y' ? 'Y' : 'N';
          },
          cellClass: (params) => {
            return params.data.edit ? 'noEditCell' : '';
          },
          hide: true,
        },
        {
          field: 'sellerNm',
          headerName: '제작업체',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          cellClass: (params) => {
            return params.data.edit ? 'noEditCell' : '';
          },
        },
        {
          field: 'minAsnCnt',
          headerName: 'MOQ',
          minWidth: 50,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : '';
          },
          cellEditor: 'agTextCellEditor',
          valueParser: (params) => {
            const value = params.newValue;

            // value를 숫자로 변환 후, NaN인지 확인
            const numValue = Number(value);

            // 빈 값이거나 숫자로 변환할 수 없는 경우, 원래 값을 그대로 반환
            if (value === '' || isNaN(numValue)) {
              // params.oldValue가 string일 수 있으므로, 이를 숫자로 변환하여 반환
              return isNaN(Number(params.oldValue)) ? 0 : Number(params.oldValue);
            }
            // 유효한 숫자일 경우 숫자로 변환하여 반환
            return numValue;
          },
        },
        {
          field: 'extBarCode',
          headerName: '외부바코드',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : '';
          },
          cellEditor: 'agTextCellEditor',
        },
        {
          field: 'sleepYn',
          headerName: '휴면여부',
          minWidth: 80,
          filter: true,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          cellClass: (params) => {
            return params.data.edit ? 'noEditCell' : '';
          },
        },
        {
          field: 'skuFactoryId',
          headerName: 'skuFactoryId',
          minWidth: 50,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          hide: true,
        },
        {
          field: 'gagongAmt',
          headerName: '임가공',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.RIGHT,
          suppressHeaderMenuButton: true,
          valueFormatter: (params: any) => {
            return Utils.setComma(params.value);
          },
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : '';
          },
          cellEditor: 'agTextCellEditor', // 기본 텍스트 에디터 사용
          valueParser: (params) => {
            const value = params.newValue;

            // value를 숫자로 변환 후, NaN인지 확인
            const numValue = Number(value);

            // 빈 값이거나 숫자로 변환할 수 없는 경우, 원래 값을 그대로 반환
            if (value === '' || isNaN(numValue)) {
              // params.oldValue가 string일 수 있으므로, 이를 숫자로 변환하여 반환
              return isNaN(Number(params.oldValue)) ? 0 : Number(params.oldValue);
            }
            // 유효한 숫자일 경우 숫자로 변환하여 반환
            return numValue;
          },
        },
        {
          field: 'orgAmt',
          headerName: '판매원가',
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.RIGHT,
          suppressHeaderMenuButton: true,
          valueFormatter: (params: any) => {
            return Utils.setComma(params.value);
          },
          editable: (params) => params.data.edit,
          cellClass: (params) => {
            return params.data.edit ? 'editCell' : '';
          },
          cellEditor: 'agTextCellEditor', // 기본 텍스트 에디터 사용
          valueParser: (params) => {
            const value = params.newValue;

            // value를 숫자로 변환 후, NaN인지 확인
            const numValue = Number(value);

            // 빈 값이거나 숫자로 변환할 수 없는 경우, 원래 값을 그대로 반환
            if (value === '' || isNaN(numValue)) {
              // params.oldValue가 string일 수 있으므로, 이를 숫자로 변환하여 반환
              return isNaN(Number(params.oldValue)) ? 0 : Number(params.oldValue);
            }
            // 유효한 숫자일 경우 숫자로 변환하여 반환
            return numValue;
          },
        },
        {
          field: 'multiplier',
          headerName: '판가배수',
          minWidth: 70,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          valueFormatter: (params: any) => {
            const sellAmt = params.data.sellAmt; // 판매가
            const orgAmt = params.data.orgAmt; // 제품 원가

            if (isNaN(sellAmt) || isNaN(orgAmt) || orgAmt === 0) {
              return '0.00'; // NaN이거나 원가가 0이면 기본값
            }
            const multiplier = sellAmt / orgAmt; // 배수 계산
            return (Math.round(multiplier * 100) / 100).toFixed(2); // 소수점 2자리까지 반올림 후 표시
          },
          cellClass: (params) => {
            return params.data.edit ? 'noEditCell' : '';
          },
        },
        {
          field: 'imgFileId',
          headerName: '이미지개수',
          minWidth: 70,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          cellRenderer: ImageCountRenderer,
          cellClass: (params) => {
            return params.data.edit ? 'noEditCell' : '';
          },
        },
      ]);
      setIsFirstRender(false);
    }
  }, [dropdownOptions, isFirstRender]);

  // 그리드 로우클릭시
  const handleGridRowClick = (event: RowDoubleClickedEvent) => {
    if (event.data && !edit) {
      setSelectSkuId(event.data.skuId);
      productSelectRefetch();
      openModal('MOD');
    }
  };
  /** 파일 목록 조회 */
  const [files, setFiles] = useState<any[]>([]);
  const getFileList = async (fileId: any, type?: string) => {
    if (fileId && Number(fileId) < 1) {
      console.warn('fileId가 없습니다. API 호출하지 않음.');
      return -1; // fileId가 없으면 함수 종료
    }

    try {
      const { data: fileList } = await authApi.get(`/common/file/${fileId}`);
      const { resultCode, body, resultMessage } = fileList;
      if (resultCode === 200) {
        if (type === 'row') {
          return body;
        }
        return body?.length ?? -1;
      }
      return -1;
    } catch (error) {
      console.error('파일 조회 중 오류 발생:', error);
      return -1;
    }
  };
  const ImageCountRenderer = (props: any) => {
    const [count, setCount] = React.useState<string>('0');

    React.useEffect(() => {
      if (!props.value) return;
      getFileList(props.value).then((length) => {
        setCount(`${length}`);
      });
    }, [props.value]);

    return <span>{count}</span>;
  };

  /** row선택 이벤트 (이미지) */
  const onSelectionChanged = (e: any) => {
    const selectedRows = e.api.getSelectedRows();
    if (selectedRows[0]?.imgFileId) {
      getFileList(selectedRows[0]?.imgFileId, 'row').then(async (fileList) => {
        // 각 파일의 URL
        const updatedFiles = await Promise.all(
          fileList.map(async (file: any) => {
            const fileUrl = await getFileUrl(file.sysFileNm);
            return { ...file, url: fileUrl };
          }),
        );

        setFiles(updatedFiles);
      });
    } else {
      setFiles([]); // 초기화
    }
  };

  /** 상품관리 페이징 목록 조회 */
  const {
    data: products,
    isSuccess,
    refetch: productRefetch,
  } = useQuery(['/product/paging', paging.curPage, filters.sleepYn, filters.isAllData], (): any =>
    authApi.get('/product/paging', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      },
    }),
  );

  useEffect(() => {
    if (isSuccess && products?.data) {
      const { resultCode, body, resultMessage } = products.data;
      if (resultCode === 200 && body) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
        const updatedRowData = products?.data?.body?.rows.map((row: any) => ({ ...row, edit, dropdownOptions }));
        setProductData(updatedRowData);
        setPaging(body.paging);
        /*setTimeout(() => {
          gridRef.current?.api.ensureIndexVisible(0);
          gridRef.current?.api.setFocusedCell(0, 'prodNm');
        }, 0); // 상단 포커스*/

        const { inventoryAmtTotal, partnerInventoryAmtTotal, waitingCnt } = body.rows.reduce(
          (
            acc: {
              inventoryAmtTotal: number;
              partnerInventoryAmtTotal: number;
              waitingCnt: number;
            },
            data: ProductResponsePaging,
          ) => {
            return {
              // 청구합계
              inventoryAmtTotal: acc.inventoryAmtTotal + (data.inventoryAmt ? Number(data.inventoryAmt) : 0),
              waitingCnt: acc.waitingCnt + (data.waitingCnt ? Number(data.waitingCnt) : 0),
              partnerInventoryAmtTotal: acc.partnerInventoryAmtTotal + (data.partnerInventoryAmt ? Number(data.partnerInventoryAmt) : 0),
            };
          },
          {
            inventoryAmtTotal: 0,
            partnerInventoryAmtTotal: 0,
            waitingCnt: 0,
          }, // 초기값 설정
        );

        setPinnedBottomRowData([
          {
            inventoryAmt: inventoryAmtTotal + '',
            partnerInventoryAmt: partnerInventoryAmtTotal,
            waitingCnt: waitingCnt,
          },
        ]);
      } else {
        toastError(resultMessage || '데이터 조회 중 오류가 발생했습니다.');
      }
    }
  }, [products, isSuccess, setPaging, dropdownOptions]);

  /** 상품 조회 */
  const {
    data: product,
    isSuccess: isProductSuccess,
    isLoading,
    refetch: productSelectRefetch,
  } = useQuery(
    [`/productOrSku/detail`, selectSkuId], // queryKey
    () => {
      // SKU ID로 조회
      return authApi.get(`/product/skuDetail`, { params: { id: selectSkuId } });
    },
    {
      enabled: !!selectSkuId, // selectSkuId가 있을 때만 실행
      onSuccess: (data) => {
        const { resultCode, body, resultMessage } = data.data;
        if (resultCode === 200) {
          setSelectedProduct(body);
          setSelectSkuId(undefined);
        }
      },
      onError: (error) => {
        console.error(error);
      },
    },
  );

  /** 휴면처리 */
  const sleepYnData = async (list: any) => {
    const { data: sleepYnData } = await authApi.post(`/sku/sleepYn`, list);
    const { resultCode, body, resultMessage } = sleepYnData;
    if (resultCode === 200) {
      toastSuccess('휴면상태가 변경되었습니다.');
      productRefetch();
    } else {
      toastError(resultMessage);
    }
  };
  const handleSleepYn = (): void => {
    if (gridRef.current) {
      // gridRef 또는 선택된 행이 없을 경우 return
      if (gridRef.current.api.getSelectedRows().length === 0) {
        toastError('휴면상태를 변경할 행을 선택해주세요.');
        return;
      }

      const selectedRows = gridRef.current.api.getSelectedRows();
      const list: { id: string; sleepYn: string }[] = []; // 리스트를 배열로 초기화

      selectedRows.map((item) => {
        list.push({ id: item.skuId, sleepYn: item.sleepYn === 'Y' ? 'N' : 'Y' }); // 항목을 배열에 추가
      });

      sleepYnData(list);
    }
    filters.partnerId = session.data?.user.partnerId;
  };

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    filters.partnerId = session.data?.user.partnerId;
    await onSearch();
  };
  // 검색
  const onSearch = async () => {
    filters.partnerId = session.data?.user.partnerId;
    setPaging({
      curPage: 1,
    });
    await productRefetch();
  };
  /*useEffect(() => {
    // 자동검색
    search();
  }, [filters]);*/

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    // 필터 초기화
    setSelectedSleepValue(''); // 상태 업데이트
    // 여기서 필터 상태를 업데이트하는 로직을 추가하세요
    onChangeFilters('searchKeyword', '');
    onChangeFilters('sleepYn', 'N');
    onChangeFilters('isAllData', false);
    onChangeFilters('prodAttrCd', '');

    //await onSearch(); // 상태가 업데이트된 후에 검색 실행  쿼리키 정보변경으로 인한 자동조회
  };

  /** 상품수정 버튼 이벤트 */
  const handleProductEdit = () => {
    const selectedRows = gridRef.current?.api.getSelectedRows();
    if (selectedRows && selectedRows?.length > 0) {
      // 1개 선택시
      const skuId = selectedRows?.[0]?.skuId;
      setSelectSkuId(skuId);
      productSelectRefetch();
      openModal('MOD');
    } else {
      toastError('상품을 선택해주세요.');
    }
  };

  // 복사
  const processCellForClipboard = (params: any) => {
    console.log('복사', params.value);
    if (params.column.getColId() === 'seasonCd') {
      return params.value;
    }
    if (params.column.getColId() === 'releaseDate') {
      const releaseYmd = params.node?.data.releaseYmd;
      return dayjs(releaseYmd).format('YYYY-MM-DD');
    }
    if (params.column.getColId() === 'prodNm') {
      return ''; // prodNm은 복사하지 않음
    }
    return params.value;
  };
  // 붙여넣기
  const processCellFromClipboard = (params: any) => {
    console.log('붙여넣기', params.value);

    // params.column이 유효한지 체크
    const column = params.column;
    if (!column) {
      return params.value; // column이 없으면 원래 값을 그대로 반환
    }

    if (params.column.getColId() === 'seasonCd') {
      // 시즌 코드 매핑
      const seasonMapping = [
        { regex: /^S___$/, name: '봄' },
        { regex: /^_S__$/, name: '여름' },
        { regex: /^__F_$/, name: '가을' },
        { regex: /^___W$/, name: '겨울' },
        { regex: /^SS__$/, name: '봄 여름' },
        { regex: /^S_F_$/, name: '봄 가을' },
        { regex: /^S__W$/, name: '봄 겨울' },
        { regex: /^_SF_$/, name: '여름 가을' },
        { regex: /^_S_W$/, name: '여름 겨울' },
        { regex: /^__FW$/, name: '가을 겨울' },
        { regex: /^S_FW$/, name: '봄 가을 겨울' },
        { regex: /^SS_W$/, name: '봄 여름 겨울' },
        { regex: /^SSFW$/, name: '사계절' },
      ];

      // 주어진 값이 시즌 코드에 맞는지 확인
      for (let i = 0; i < seasonMapping.length; i++) {
        if (seasonMapping[i].regex.test(params.value)) {
          return params.value; // 형식에 맞으면 그대로 복사
        }
      }
      // 유효하지 않은 시즌 코드면 원래 값으로 되돌리기
      if (params.node && params.node.data) {
        return params.node.data.seasonCd; // 원래 값 유지
      }
      return params.value;
    }
    if (params.column.getColId() === 'releaseDate') {
      // 붙여넣은 값이 유효한 날짜 형식인지 확인
      const parsedDate = dayjs(params.value, 'YYYY-MM-DD', true);
      if (params.node && params.node.data) {
        const releaseYmdYear = dayjs(params.node.data.releaseYmd).format('YYYY');
        if (parsedDate.isValid()) {
          params.node.data.releaseYmd = parsedDate.format(`${releaseYmdYear}-MM-DD`); // releaseYmd에 날짜 값을 저장
          return parsedDate.format('MM월 DD일'); // 그리드에 보여줄 형식
        } else {
          return '';
        }
      } else {
        // params.node 또는 params.node.data가 없는 경우
        return '';
      }
    }
    if (params.column.getColId() === 'prodNm') {
      // prodNm은 원래 값으로 복원
      if (params.node && params.node.data) {
        return params.node.data.prodNm; // 원래 값 복원
      }
      return '';
    }

    // skuSize 붙여넣기 검증
    if (params.column.getColId() === 'skuSize') {
      // 드롭다운 옵션 가져오기
      const dropdownOptions = params.node?.data?.dropdownOptions?.skuSize || [];
      const validOptions = dropdownOptions.map((option: any) => option.label);

      // 값이 드롭다운 옵션에 포함되어 있는지 확인
      if (!validOptions.includes(params.value)) {
        // 값 원복
        if (params.node && params.node.data) {
          const originalValue = params.node.data.skuSize; // 원래 값을 가져옴
          return originalValue;
        }
        return null; // 붙여넣기 취소
      }

      return params.value; // 유효한 값일 경우 그대로 적용
    }

    // 붙여넣기 전 skuColor와 skuSize 값 확인
    const changedField = params.column.getColId();
    if (changedField === 'skuColor' || changedField === 'skuSize') {
      const isDuplicate = checkForDuplicateSku(params, changedField, params.value);

      // 중복이 발견되면 붙여넣기 취소 및 모든 필드 원복
      if (isDuplicate) {
        toastError(`중복된 SKU 조합(칼라: ${params.value}, 사이즈: ${params.value})입니다. 붙여넣기가 실패했습니다.`);
        return params.value;
      }
    }

    return params.value;
  };

  // 셀 값 변경 추적
  const [modifiedRows, setModifiedRows] = useState<any[]>([]);
  const onCellValueChanged = (params: CellValueChangedEvent) => {
    const { data } = params;
    const changedField = params.colDef.field ?? '';
    const newValue = params.newValue;
    const oldValue = params.oldValue;
    const prodId = params.data.id;

    console.log(`값 변경: field=${changedField}, oldValue=${oldValue}, newValue=${newValue}, prodId=${prodId}`);

    // 동일한 값이면 중복 체크 생략
    if (oldValue === newValue) {
      return;
    }

    // 스큐 컬러, 사이즈 중복체크
    if (['skuColor', 'skuSize'].includes(changedField) && prodId) {
      const isDuplicate = checkForDuplicateSku(params, changedField, newValue);

      if (isDuplicate) {
        // 중복된 경우 단 한 번만 경고 메시지 표시
        if (!params.node.data.isDuplicate) {
          toastError(`중복된 SKU 조합( ${data.prodNm} 칼라: ${data.skuColor}, 사이즈: ${data.skuSize})입니다.`);
          params.node.data.isDuplicate = true; // 중복이 발생했다고 표시
        }
        params.node.data[changedField] = oldValue; // 원래 값으로 복원
        params.api.refreshCells({ rowNodes: [params.node] });
        return;
      }
    }

    // 상품명 변경 처리
    if (changedField === 'prodNm' && prodId) {
      const oldValue = params.oldValue;
      // 먼저 newValue가 공백인지 체크
      if (newValue === null || newValue.trim() === '' || newValue === '') {
        // 공백일 경우 기존 값으로 되돌리기
        if (params.rowIndex !== null) {
          const rowNode = params.api.getRowNode(params.rowIndex.toString());
          if (rowNode) {
            rowNode.setDataValue(changedField, oldValue);
            toastError('상품명은 공백일 수 없습니다.');
          }
        }
        return; // 공백일 경우 처리 종료
      }

      // newValue가 유효하다면 변경 적용
      params.api.forEachNode((node) => {
        if (node.data.id === prodId && node.rowIndex !== params.rowIndex) {
          node.setDataValue(changedField, newValue);
        }
      });
    }

    // 메인생산단가 변경 처리
    if (changedField === 'gagongAmt' && prodId) {
      params.api.forEachNode((node) => {
        if (node.data.id === prodId && node.rowIndex !== params.rowIndex) {
          node.setDataValue(changedField, newValue);
        }
      });
    }

    // 수정된 데이터 업데이트
    setModifiedRows((prev) => {
      const existingRowIndex = prev.findIndex((row) => row.skuId === data.skuId);
      if (existingRowIndex >= 0) {
        prev[existingRowIndex] = data;
      } else {
        prev.push(data);
      }
      return [...prev];
    });
  };

  // 중복체크
  const checkForDuplicateSku = (params: any, changedField: string, newValue: string) => {
    const data = params.node?.data;
    const currentColor = changedField === 'skuColor' ? newValue : data.skuColor;
    const currentSize = changedField === 'skuSize' ? newValue : data.skuSize;
    const prodId = data.id; // 현재 상품의 ID

    let isDuplicate = false;

    // 동일 상품(상품 ID) 내에서 중복 값 확인
    params.api.forEachNodeAfterFilter((node: any) => {
      // 현재 행이 아닌 다른 행을 검사하고, 해당 노드의 상품 ID가 동일한지 확인
      if (node.rowIndex !== params.rowIndex && node.data.id === prodId) {
        const nodeColor = node.data.skuColor;
        const nodeSize = node.data.skuSize;
        console.log(`검사 중: 아이디:${node.data.id} skuColor=${currentColor}, skuSize=${currentSize} vs nodeColor=${nodeColor}, nodeSize=${nodeSize}`);
        if (nodeColor === currentColor && nodeSize === currentSize) {
          console.log('중복 발견:', nodeColor, nodeSize);
          isDuplicate = true;
        }
      }
    });

    return isDuplicate;
  };

  // skuList 생성 및 검증 로직 분리
  const generateSkuList = (modifiedRows: any[]) => {
    // console.log('수정할row: ', modifiedRows);
    const skuList = modifiedRows.map((row, index) => {
      // 데이터 변환
      return {
        ...row,
        prodId: row.id,
        id: row.skuId,
        skuNm: `${row.prodNm}.${row.skuColor}.${row.skuSize}`,
        compCntn: row.compCntn === '선택' ? '' : row.compCntn,
        designNm: row.designNm === '선택' ? '' : row.designNm,
        funcCd: row.funcCd === '선택' ? '' : row.funcCd,
        gubunCntn: row.gubunCntn === '선택' ? '' : row.gubunCntn,
        skuFactoryList: [
          {
            id: row.skuFactoryId,
            factoryId: row.factoryId,
            gagongAmt: row.gagongAmt,
            mainYn: 'Y',
          },
        ],
      };
    });

    // null 값이 있을 경우, 전체 함수 종료
    if (skuList.includes(null)) {
      return []; // 유효한 SKU 데이터만 반환
    }

    return skuList; // 유효한 모든 SKU 데이터를 반환
  };

  const handleEdit = async () => {
    setEdit(false);
    setModifiedRows([]);
    // skuList 생성
    const skuList = generateSkuList(modifiedRows);
    console.log('skuList ===>', skuList);
    if (skuList.length === 0) {
      return;
    }

    try {
      const result = await updateProductGrid({ skuList });
      const { resultCode, body, resultMessage } = result.data;

      if (resultCode === 200) {
        toastSuccess('수정되었습니다.');
        productRefetch();
      } else {
        toastError('수정 실패했습니다.');
      }
    } catch (error) {
      console.error('수정 중 오류 발생:', error);
      toastError('오류가 발생했습니다.');
    }
  };

  /** 더블클릭 이벤트 */
  const [imgResize, setImgResize] = useState<boolean>(false);
  const handleImageResize = () => {
    setImgResize(!imgResize);
  };

  const getRowClass = useCallback((params: RowClassParams) => {
    if (params.node.rowPinned === 'bottom') {
      return 'ag-grid-pinned-row';
    }
    return '';
  }, []);

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} search={search} filters={filters} reset={reset} />
      <Search className="type_2">
        <Search.Input
          title={'검색'}
          name={'searchKeyword'}
          placeholder={'상품명 검색'}
          value={filters.searchKeyword}
          onChange={onChangeFilters}
          onEnter={onSearch}
          filters={filters}
        />
        <Search.DropDown
          title={'휴면여부'}
          name={'sleepYn'}
          defaultOptions={[
            { label: '정상', value: 'N' },
            { label: '휴면', value: 'Y' },
          ]}
          value={filters.sleepYn}
          onChange={(e, value) => {
            setSelectedSleepValue(value);
            onChangeFilters(e, value);
          }}
        />
        <CustomSwitch
          title={'이미지보기'}
          name={'imgShow'}
          checkedLabel={'켜기'}
          uncheckedLabel={'끄기'}
          onChange={(e, value) => {
            setSlide(value);
          }}
        />
        <CustomSwitch
          title={'데이터보기'}
          name={'isAllData'}
          checkedLabel={'전체'}
          uncheckedLabel={'최근'}
          onChange={(e, value) => {
            onChangeFilters(e, value);
          }}
          value={filters.isAllData}
        />
      </Search>

      <Table>
        <TableHeader
          count={paging.totalRowCount || 0}
          paging={paging}
          setPaging={setPaging}
          search={productRefetch}
          choiceCount={50}
          gridRef={gridRef}
          isPaging={false}
        ></TableHeader>
        <TunedGrid<ProductResponsePaging>
          ref={gridRef}
          onGridReady={onGridReady}
          rowData={productData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          paginationPageSize={paging.pageRowCount}
          onRowDoubleClicked={handleGridRowClick}
          loadingOverlayComponent={(props: any) => <CustomGridLoading {...props} isLoading={isLoading} isSuccess={isSuccess} />}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          preventPersonalizedColumnSetting={true}
          gridOptions={{
            suppressTouch: true,
          }}
          suppressRowClickSelection={edit}
          enableRangeSelection={edit}
          processCellForClipboard={processCellForClipboard}
          processCellFromClipboard={processCellFromClipboard}
          onCellValueChanged={onCellValueChanged}
          rowSelection={'single'}
          onSelectionChanged={onSelectionChanged}
          pinnedBottomRowData={pinnedBottomRowData}
          getRowClass={getRowClass}
          className={'default'}
        />

        <div className={`productImgBox ${slide ? 'on' : ''} ${imgResize ? 'onSize' : ''}`} onDoubleClick={handleImageResize}>
          <button className={`imgResizeBtn ${imgResize ? 'small' : 'big'}`} onClick={handleImageResize}></button>
          {files.length > 0 ? (
            <>
              <Swiper
                modules={[Navigation, Pagination]}
                navigation={{
                  nextEl: '.imgBoxNext',
                  prevEl: '.imgBoxPrev',
                }}
                pagination={{ clickable: true }}
              >
                <div className={'wrap'}>
                  {files.map((item) => (
                    <SwiperSlide key={item.url}>
                      <img src={item.url} alt="상품 이미지" />
                    </SwiperSlide>
                  ))}
                </div>
              </Swiper>
              <div className={'imgBoxBtn'}>
                <button className={'imgBoxPrev'}></button>
                <button className={'imgBoxNext'}></button>
              </div>
            </>
          ) : (
            <div className="noImage">저장된 이미지가 없습니다</div>
          )}
        </div>

        <div className="btnArea">
          <CustomShortcutButton
            className="btn"
            shortcut={COMMON_SHORTCUTS.alt1}
            title="상품등록"
            onClick={() => {
              openModal('ADD');
            }}
          >
            상품등록
          </CustomShortcutButton>
          <CustomShortcutButton className="btn" shortcut={COMMON_SHORTCUTS.alt2} title="수정하기" onClick={handleProductEdit}>
            수정하기
          </CustomShortcutButton>
          {!edit ? (
            <CustomShortcutButton
              className="btn"
              title="일괄수정"
              shortcut={COMMON_SHORTCUTS.alt3}
              onClick={() => {
                setEdit(true);
              }}
            >
              일괄수정
            </CustomShortcutButton>
          ) : (
            <CustomShortcutButton className="btn" title="수정완료" onClick={handleEdit} shortcut={COMMON_SHORTCUTS.alt4}>
              수정완료
            </CustomShortcutButton>
          )}
          <CustomShortcutButton
            className="btn"
            shortcut={COMMON_SHORTCUTS.alt5}
            title={selectedSleepValue == 'N' ? '휴면처리' : '휴면해제'}
            onClick={() => {
              setSleepBtn(true);
            }}
          >
            {selectedSleepValue == 'N' ? '휴면처리' : '휴면해제'}
          </CustomShortcutButton>
        </div>
        {/*<Pagination pageObject={paging} setPaging={setPaging} />*/}
      </Table>
      {!isSuccess ? <Loading /> : ''}
      {/*{!isSuccess ? <CustomGridLoading /> : ''}*/}
      {modals.ADD.active && <ProductAddPop />}
      {modals.MOD.active && <ProductModPop />}
      <ConfirmModal
        title={
          selectedSleepValue == 'N'
            ? '<div class="confirmMsg"><span class="small">선택된 상품을 </span><span class="big"><strong>휴면</strong>&nbsp;처리하시겠어요?</span></div>'
            : '<div class="confirmMsg"><span class="small">선택된 상품을 </span><span class="big"><strong>휴면해제</strong>&nbsp;처리하시겠어요?</span></div>'
        }
        open={sleepBtn}
        onConfirm={() => {
          handleSleepYn();
          setSleepBtn(false);
        }}
        onClose={() => {
          setSleepBtn(false);
        }}
      />
    </div>
  );
};

export default ProductMng;
