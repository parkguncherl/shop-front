import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Table, Title, toastSuccess } from '../../components';
import { AttributeRequestUpdate, AttributeResponsePaging, CodeResponsePaging } from '../../generated';
import {
  CellEditingStartedEvent,
  CellEditingStoppedEvent,
  CellKeyDownEvent,
  CellValueChangedEvent,
  ColDef,
  FullWidthCellKeyDownEvent,
  ISelectCellEditorParams,
  ITextCellEditorParams,
  RowClickedEvent,
} from 'ag-grid-community';
import { Button, Pagination, TableHeader, toastError } from '../../components';
import { useCommonStore, useAttributeStore, AttributePagingFilter } from '../../stores';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../libs/ag-grid';
import { useAgGridApi } from '../../hooks';
import { authApi } from '../../libs';
import { DefaultOptions, Placeholder } from '../../libs/const';
import { Utils } from '../../libs/utils';
import { ConfirmModal } from '../../components/ConfirmModal';
import { AgGridReact } from 'ag-grid-react';
import useAppStore from '../../stores/useAppStore';

/** 시스템 - 메뉴접근 속성관리 페이지 */
const AttributeMng = () => {
  const gridRef = useRef<AgGridReact>(null);
  const combinationStatus = useRef<'unknown' | 'copy'>('unknown');
  const isEditing = useRef<boolean>(false);
  const modificationIsRequested = useRef<boolean>(false);
  const { session } = useAppStore();

  /** Grid Api */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  /** 공통 스토어 - State */
  const [menuUpdYn, menuExcelYn] = useCommonStore((s) => [s.menuUpdYn, s.menuExcelYn]);

  /** 코드관리 스토어 - State */
  const [
    modalType,
    openModal,
    paging,
    codePaging,
    filter,
    codeFilter,
    updateAttribute,
    selectedAttribute,
    setSelectedAttribute,
    setCodePaging,
    setPaging,
    setFilter,
    setCodeFilter,
    onClear,
  ] = useAttributeStore((s) => [
    s.modalType,
    s.openModal,
    s.paging,
    s.codePaging,
    s.filter,
    s.codeFilter,
    s.updateAttribute,
    s.selectedAttribute,
    s.setSelectedAttribute,
    s.setCodePaging,
    s.setPaging,
    s.setFilter,
    s.setCodeFilter,
    //s.excelDown,
    s.onClear,
  ]);

  /** 속성관리 페이징 목록 조회 */
  const { data: attribute, isLoading } = useQuery(
    ['/attribute/paging', paging.curPage, filter],
    () =>
      authApi.get('/attribute/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filter,
        },
      }),
    {
      refetchOnMount: 'always',
      onSuccess: (e) => {
        const { resultCode, body, resultMessage } = e.data;
        if (resultCode === 200) {
          setPaging(body.paging);
        } else {
          toastError(resultMessage);
        }
      },
    },
  );

  /** 연관 코드 페이징 목록 조회 */
  const { data: TbCode } = useQuery(
    ['/code/related', codePaging.curPage, codeFilter],
    () =>
      authApi.get('/code/related', {
        params: {
          curPage: codePaging.curPage,
          pageRowCount: codePaging.pageRowCount,
          ...codeFilter,
        },
      }),
    {
      refetchOnMount: 'always',
      onSuccess: (e) => {
        const { resultCode, body, resultMessage } = e.data;
        if (resultCode === 200) {
          setCodePaging(body.paging);
        } else {
          toastError(resultMessage);
        }
      },
    },
  );

  /** 드롭다운 옵션 */
  /* const { data: dropdownOptions } = useQuery(['/menu/top'], () => authApi.get<ApiResponseListMenu>('/menu/top'), {
    select: (e) => {
      const { body, resultCode } = e.data;
      if (resultCode === 200) {
        const fetchedOptions = body?.map((d) => {
          return {
            key: d.menuCd,
            value: d.menuCd,
            label: d.menuNm,
          };
        }) as DropDownOption[];
        return [{ key: 'TOP', value: 'TOP', label: t('선택') || '' } as DropDownOption].concat(fetchedOptions);
      }
      return undefined;
    },
  }); */

  /** 컬럼 정의 */
  const AttributeCols: ColDef<AttributeResponsePaging>[] = [
    { field: 'no', headerName: 'NO', width: 80, cellStyle: GridSetting.CellStyle.CENTER },
    {
      field: 'attrNm',
      headerName: '속성명',
      minWidth: 150,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellEditorParams: {
        maxLength: 20,
      } as ITextCellEditorParams,
      suppressKeyboardEvent: (params) => {
        const key = params.event.key;
        return key === 'Backspace' || key === 'Delete';
      },
    },
    {
      field: 'attrEngNm',
      headerName: '속성영문명',
      minWidth: 150,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellEditorParams: {
        maxLength: 25,
      } as ITextCellEditorParams,
    },
    {
      field: 'attrType',
      headerName: '속성타입',
      minWidth: 150,
      valueFormatter: (params) => {
        return params.value == 'T' ? '문자' : params.value == 'N' ? '숫자' : 'json';
      },
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [...DefaultOptions.Total].map((x) => x.value),
      } as ISelectCellEditorParams,
    },
    {
      field: 'attrCat',
      headerName: '속성유형',
      minWidth: 150,
      valueFormatter: (params) => {
        return params.value == 'S' ? '단일' : '복수';
      },
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [...DefaultOptions.AttributeCatalog].map((x) => x.value),
      } as ISelectCellEditorParams,
    },
    {
      field: 'attrDesc',
      headerName: '속성설명',
      minWidth: 180,
    },
    {
      field: 'codeUpper',
      headerName: '상위코드',
      width: 120,
    },
    {
      field: 'deleteYn',
      headerName: '삭제여부',
      width: 120,
      valueFormatter: (params) => {
        return params.value == 'Y' ? '삭제' : '유지';
      },
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [...DefaultOptions.DeleteYn].map((x) => x.value),
      } as ISelectCellEditorParams,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'creUser',
      headerName: '생성_id',
      minWidth: 150,
    },
    {
      field: 'updUser',
      headerName: '수정_id',
      minWidth: 150,
    },
    {
      field: 'updTm',
      headerName: '수정시간',
      minWidth: 150,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'totalRowCount',
      headerName: '멀티등록건수',
      width: 140,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
  ];
  const CodeCols: ColDef<CodeResponsePaging>[] = [
    { field: 'id', headerName: 'NO', minWidth: 70, maxWidth: 80, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'codeNm', headerName: '코드명', minWidth: 150 },
    { field: 'codeCd', headerName: '코드값', minWidth: 150 },
    { field: 'codeDesc', headerName: '코드내용', minWidth: 150 },
    {
      field: 'deleteYn',
      headerName: '삭제여부',
      width: 120,
      valueFormatter: (params) => {
        return params.value == 'Y' ? '삭제' : '유지';
      },
    },
    { field: 'codeEtc1', headerName: '코드기타', minWidth: 150 },
    { field: 'codeEtc2', headerName: '코드기타', minWidth: 150 },
  ];

  /** 컬럼 설정  */
  const [columnDefs, setColumnDefs] = useState<ColDef[]>(AttributeCols);

  /** 본문 요소 설정 */
  const [displayedElement, setDisplayedElement] = useState<number>(0);

  /**
   * 초기 상태(백앤드 응답 데이터) 보전을 통한 변경 여부 확인을 위해 초기, 현 상태 분리
   * current 의 경우 기존에 응답받은 요소가 수정되었는지 여부를 확인하기 위해 사용한다.
   * 그리드에 직접 전달할 시 직접 상태 변경이 발생하는 문제를 피하기 위해 rowData 속성에 상태 전달 시 깊은 복사(Deep Copy) 를 통해 전달할 필요
   * */
  const [attributeData, setAttributeData] = useState<{ init: AttributeResponsePaging[] | []; current: AttributeResponsePaging[] | [] }>({
    init: [],
    current: [],
  });
  const [codeData, setCodeData] = useState<{ init: CodeResponsePaging[] | []; current: CodeResponsePaging[] | [] }>({
    init: [],
    current: [],
  });
  /** 확인 모달 출력 상태 */
  const [confirmModal, setConfirmModal] = useState(false);

  useEffect(() => {
    // 초기 설정 이후 수정 요청 제외한 어떠한 경우에도 해당 영역에서 더 이상 상태 변경 없음(셀 내부 값 변경시 리랜더링으로 인한 오동작 방지)
    if (attributeData.init.length == 0 || modificationIsRequested.current) {
      setAttributeData({
        init: (attribute?.data?.body?.rows as AttributeResponsePaging[]) || [],
        current: (attribute?.data?.body?.rows as AttributeResponsePaging[]) || [],
      });
      modificationIsRequested.current = false;
    }
  }, [attribute]);
  useEffect(() => {
    // 초기 설정 이후 수정 요청 제외한 어떠한 경우에도 해당 영역에서 더 이상 상태 변경 없음(셀 내부 값 변경시 리랜더링으로 인한 오동작 방지)
    if (codeData.init.length == 0 || modificationIsRequested.current) {
      setCodeData({
        init: (TbCode?.data?.body?.rows as AttributeResponsePaging[]) || [],
        current: (TbCode?.data?.body?.rows as AttributeResponsePaging[]) || [],
      });
      modificationIsRequested.current = false;
    }
  }, [TbCode]);

  function onCellEditingStarted() {
    isEditing.current = true;
  }
  function onCellEditingStopped() {
    isEditing.current = false;
  }

  /** grid row 가 클릭되었을 경우의 이벤트 */
  const onRowClicked = useCallback(
    (e: RowClickedEvent) => {
      if (e.api.getFocusedCell()?.column.getColId() == 'totalRowCount') {
        if (e.data.totalRowCount != 0) {
          setColumnDefs(CodeCols);
          setDisplayedElement(1);
          setCodeFilter({ ...codeFilter, codeNm: e.data.attrNm }); // 속성 이름에 해당하는 코드만을 출력하도록 하는 필터
        }
      } else if (e.api.getFocusedCell()?.column.getColId() == 'codeEtc2') {
        setColumnDefs(AttributeCols);
        setDisplayedElement(0);
      }
    },
    [codeFilter],
  );

  const initialCondition = {
    attrNm: undefined,
    attrEngNm: undefined,
    attrType: undefined,
    attrCat: undefined,
  };
  /** 검색 조건 */
  const [conditionForSearch, setConditionForSearch] = useState<AttributePagingFilter>(initialCondition);

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    setConditionForSearch(initialCondition);
    setFilter(initialCondition);
  };

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    if (
      Utils.isEmptyValues({
        attrNm: conditionForSearch.attrNm,
        attrEngNm: conditionForSearch.attrEngNm,
        attrType: conditionForSearch.attrType,
        attrCat: conditionForSearch.attrCat,
      })
    ) {
      toastError('검색조건을 1개 이상 입력하세요.');
      return;
    }
    setFilter({
      ...filter,
      attrNm: conditionForSearch.attrNm,
      attrEngNm: conditionForSearch.attrEngNm,
      attrType: conditionForSearch.attrType,
      attrCat: conditionForSearch.attrCat,
    });
    // await onSearch();
  };

  /** 검색 */
  /*const onSearch = async () => {
    setFilter({
      ...filter,
      attrNm: conditionForSearch.attrNm,
      attrEngNm: conditionForSearch.attrEngNm,
      attrType: conditionForSearch.attrType,
    });
  };*/

  useEffect(() => {
    onClear();
  }, []);

  /**
   * cell value 변화를 다루는 함수
   * 초기 랜더링된 row 의 값 수정에 대응
   */
  const onCellValueChanged = (cellValueChangeEvent: CellValueChangedEvent) => {
    if (displayedElement == 0) {
      const lastRowIndex = attributeData.current.length - 1;
      const modified = [...attributeData.current];
      if (cellValueChangeEvent.node.rowIndex && cellValueChangeEvent.node.rowIndex <= lastRowIndex + 1) {
        // 기존 데이터 업데이트
        modified[cellValueChangeEvent.node.rowIndex as number] = cellValueChangeEvent.data; // 업데이트 시 rowIndex 값은 반드시 발생하므로 타입 단언 as 사용
        modified[cellValueChangeEvent.node.rowIndex as number].updUser = session?.user.loginId;
        setAttributeData({ ...attributeData, current: modified });
      }
    } else {
      const lastRowIndex = codeData.current ? codeData.current.length - 1 : codeData.init.length - 1;
      const modified = [...codeData.current];
      if (cellValueChangeEvent.node.rowIndex && cellValueChangeEvent.node.rowIndex <= lastRowIndex + 1) {
        // 기존 데이터 업데이트
        modified[cellValueChangeEvent.node.rowIndex as number] = cellValueChangeEvent.data; // 업데이트 시 rowIndex 값은 반드시 발생하므로 타입 단언 as 사용
        modified[cellValueChangeEvent.node.rowIndex as number].updUser = session?.user.loginId;
        setCodeData({ ...codeData, current: modified });
      }
    }
  };

  const onRowElementAdded = () => {
    const modified = [...attributeData.current];
    if (displayedElement == 0 && attributeData.current.length) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const addedElementNo = modified[attributeData.current.length - 1].no + 1;
      modified[attributeData.current.length] = {
        id: addedElementNo,
        no: addedElementNo,
        attrType: 'T',
        attrCat: 'S',
        createUser: session?.user.loginId,
        totalRowCount: 0,
      } as AttributeResponsePaging;
      setAttributeData({ ...attributeData, current: modified });
    } else {
      // todo 추후에 code 행에 추가할 기본 요소 지정
    }
  };

  /**
   * 추가된 컬럼은 제거, 기존 컬럼은 deleteYn == 'Y'
   * 컬럼 삭제 시 상단 행으로 자동 포커싱 처리
   * no의 경우 id를 기반으로 하는 오름차순 정렬이므로 의존성 감수하고 사용
   * ctrl + v 에 대응하고자 랜더링에 불필요한 값을 참조하는 useRef 사용(파일 상단 combinationStatus)
   * */
  const onCellKeyDown = (event: CellKeyDownEvent | FullWidthCellKeyDownEvent) => {
    const currents = JSON.parse(JSON.stringify([...attributeData.current])); // 참조로 인하여 init 값이 영향을 받을 일이 없도록 깊은 복사 (deep copy) 사용
    const keyBoardEvent = event.event as KeyboardEvent;
    if (keyBoardEvent.key === 'Backspace' || keyBoardEvent.key === 'Delete') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (event.data.no <= attributeData.init[attributeData.init.length - 1].no && !isEditing.current) {
        // 기존 데이터 삭제 처리
        currents[event.rowIndex as number].deleteYn = 'Y';
        setAttributeData({ ...attributeData, current: currents });
        setTimeout(() => {
          if (gridRef.current && event.rowIndex)
            gridRef.current.api.setFocusedCell(event.rowIndex - 1, event.api.getFocusedCell()?.column.getColId() || 'attrNm');
        }, 10);
      } else {
        if (!isEditing.current) {
          // 추가된 행을 제거
          const modified = currents.filter((attribute: AttributeResponsePaging) => attribute.no != event.data.no);
          setAttributeData({ ...attributeData, current: modified });
          setTimeout(() => {
            if (gridRef.current && event.rowIndex)
              gridRef.current.api.setFocusedCell(event.rowIndex - 1, event.api.getFocusedCell()?.column.getColId() || 'attrNm');
          }, 10);
        }
      }
    } else {
      // mac 에서 사용되는 cmd(Meta) 키에 대응하기 위함
      if (keyBoardEvent.key === 'Control' || keyBoardEvent.key === 'Meta') {
        combinationStatus.current = 'copy';
        // 2초 내로 v 키를 마저 클릭하지 않을 경우 무효화
        setTimeout(() => {
          combinationStatus.current = 'unknown';
        }, 2000);
      } else if (keyBoardEvent.key === 'v' && combinationStatus.current == 'copy') {
        // 해당 영역은 추가된 행의 경우에만 값 붙여넣기를 시행한다
        navigator.clipboard.readText().then((e) => {
          pasteAtElementOfColumn(e, event);
        });
      }
    }
  };

  function pasteAtElementOfColumn(text: string, event: CellKeyDownEvent | FullWidthCellKeyDownEvent) {
    if (text.length != 0 && event.rowIndex && event.rowIndex > attributeData.init.length - 1) {
      const modified = [...attributeData.current];
      const splitedByEachLine: string[] = text.split('\n'); // 줄바꿈 기준으로 분할됨(구글 스프래드시트 기준)
      for (let i = 0; i < splitedByEachLine.length; i++) {
        const splitedAtEachElement: string[] = splitedByEachLine[i].split('\t');
        modified[event.rowIndex + i] = {
          ...modified[event.rowIndex + i],
          no: event.rowIndex + i + 1,
        };
        modified[event.rowIndex + i] = {
          ...modified[event.rowIndex + i],
          creUser: session?.user.loginId,
        };
        for (let j = 0; j < splitedAtEachElement.length; j++) {
          switch (j) {
            case 0:
              modified[event.rowIndex + i] = {
                ...modified[event.rowIndex + i],
                attrNm: splitedAtEachElement[0],
              };
              break;
            case 1:
              modified[event.rowIndex + i] = {
                ...modified[event.rowIndex + i],
                attrEngNm: splitedAtEachElement[1],
              };
              break;
            case 2:
              modified[event.rowIndex + i] = {
                ...modified[event.rowIndex + i],
                attrType: splitedAtEachElement[2] == '문자' ? 'T' : splitedAtEachElement[2] == '숫자' ? 'N' : 'J',
              };
              break;
            case 3:
              if (splitedAtEachElement[3] == 'S' || splitedAtEachElement[3].includes('단일')) {
                modified[event.rowIndex + i] = {
                  ...modified[event.rowIndex + i],
                  attrCat: 'S',
                };
              } else {
                modified[event.rowIndex + i] = {
                  ...modified[event.rowIndex + i],
                  attrCat: 'M',
                }; // 값이 'S' 가 아닌 경우 전부 'M' 으로 간주
              }
              break;
            case 4:
              modified[event.rowIndex + i] = {
                ...modified[event.rowIndex + i],
                attrDesc: splitedAtEachElement[4],
              };
              break;
            case 5:
              modified[event.rowIndex + i] = {
                ...modified[event.rowIndex + i],
                codeUpper: splitedAtEachElement[5],
              };
              break;
            case 6:
              if (splitedAtEachElement[6] == 'Y') {
                modified[event.rowIndex + i] = {
                  ...modified[event.rowIndex + i],
                  deleteYn: 'Y',
                };
              } else {
                modified[event.rowIndex + i] = {
                  ...modified[event.rowIndex + i],
                  deleteYn: 'N',
                }; // 값이 'Y' 가 아닌 경우 전부 'N' 으로 간주
              }
              break;
            case 7:
              modified[event.rowIndex + i] = {
                ...modified[event.rowIndex + i],
                updUser: session?.user.loginId,
              };
              break;
          }
        }
      }
      setAttributeData({ ...attributeData, current: modified });
    }
  }
  /**
   * 여기서부터 리턴 영역까지 수정, 삭제 요청 로직
   * */
  const queryClient = useQueryClient();

  /** 수정된 요소만 추출 */
  interface Map {
    [key: string]: string;
  }
  /** 초기, 현재 값 각각의 row 에 대하여 비교를 수행함 */
  function IsModified(init: Map, current: Map) {
    // 요소 개수 및 일치 여부 비교
    const keysOfCurrent = Object.keys(current);

    for (const key of keysOfCurrent) {
      if (init[key] !== current[key]) {
        return true;
      }
    }
    return false; // 수정되지 아니한 경우
  }
  /** 각각 수정, 추가된 행 반환 */
  function extractModified(initList: AttributeResponsePaging[], currentList: AttributeResponsePaging[]) {
    const modifiedList: AttributeResponsePaging[] = [];
    let index = 0;
    let modifiedListIndex = 0;
    for (let i = 0; i < currentList.length; i++) {
      // id에 따라 오름차순 정렬되지 않은 경우 또한 대응
      if (initList[index] && initList[index].id == currentList[i].id) {
        // currentList 각각의 요소에 관해 확인
        if (IsModified(initList[index] as Map, currentList[i] as Map)) {
          modifiedList[modifiedListIndex] = currentList[i];
          modifiedListIndex++;
        }
        index++;
      }
    }
    return modifiedList;
  }
  // createUser 속성은 onRowElementAdded, pasteAtElementOfColumn 에서 행 추가할 시 초기화됨
  function extractAdded(initList: AttributeResponsePaging[], currentList: AttributeResponsePaging[]) {
    const addedElementList: AttributeResponsePaging[] = [];
    let index = 0;
    for (let i = 0; i < currentList.length; i++) {
      for (let i = 0; i < initList.length; i++) {
        // id에 따라 오름차순 정렬되지 않은 경우 또한 대응
        if (currentList[index].id == initList[i].id) {
          // 하나의 currentList 요소에 관하여 모든 initList 요소를 대조한다
          // 같은 id를 가진 초기 요소 식별 시 다음 인덱스의 currentList 요소 조회
          index++;
          break;
        } else if (i == initList.length - 1) {
          // initList 에서 같은 id를 가진 요소를 찾을수 없는 경우(추가된 요소)
          addedElementList.push(currentList[index]);
          index++;
        }
      }
    }
    return addedElementList;
  }
  /** 목록 업데이트 요청 영역 */
  function validated(attributeResponsePagingElements: AttributeResponsePaging[]): boolean {
    if (attributeResponsePagingElements.length > 0) {
      // 데이터가 존재하지 않을 경우 애초에 검증 대상이 아니므로 검증 로직 비활성화 (true)
      for (let i = 0; i < attributeResponsePagingElements.length; i++) {
        if (!attributeResponsePagingElements[i].attrNm || !attributeResponsePagingElements[i].attrEngNm) {
          return false;
        }
      }
      return true;
    } else return true;
  }
  const updateList = () => {
    const updatedAttribute = extractModified(attributeData.init, attributeData.current); // current 영역에서 추가된 행이 아닌 기존에 존재하던 행 중 수정된 행을 반환
    const addedAttribute = extractAdded(attributeData.init, attributeData.current);
    if (updatedAttribute.length == 0 && addedAttribute.length == 0) {
      toastError('조회, 수정할 데이터가 존재하지 않음');
    } else if (!validated(addedAttribute)) {
      toastError('데이터 생성시 속성명, 영문명 필수 입력');
    } else if (!validated(updatedAttribute)) {
      toastError('기존 데이터 업데이트 시 속성명, 영문명 누락 확인');
    } else {
      modificationIsRequested.current = true;
      updateAttributeMutate({
        updated: updatedAttribute as AttributeRequestUpdate[],
        inserted: addedAttribute as AttributeRequestUpdate[],
      });
    }
  };

  /** 변경  */
  const { mutate: updateAttributeMutate, isLoading: updateIsLoading } = useMutation(updateAttribute, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await Promise.all([
            // 업데이트에 성공할 시 invalidateQueries 메서드로 특정 경로(해당하는 queryKey)의 cache를 무효화
            queryClient.invalidateQueries(['/attribute/paging']),
          ]);
        } else {
          console.log(e);
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${upMenuNm} > ${menuNm}` : ''} reset={reset} search={search}></Title>
      {displayedElement == 0 ? (
        <Search className={'type_4'}>
          <Search.Input
            title={'속성명'}
            name={'attrNm'}
            placeholder={Placeholder.Default}
            value={conditionForSearch.attrNm || ''}
            onChange={(name, value) => {
              setConditionForSearch({ ...conditionForSearch, attrNm: value });
            }}
            onEnter={search}
          />
          <Search.Input
            title={'속성영문명'}
            name={'attrEngNm'}
            placeholder={Placeholder.Default}
            value={conditionForSearch.attrEngNm || ''}
            onChange={(name, value) => {
              setConditionForSearch({ ...conditionForSearch, attrEngNm: value });
            }}
            onEnter={search}
          />
          <Search.DropDown
            title={'속성타입'}
            name={'attrType'}
            placeholder={undefined}
            defaultOptions={[...DefaultOptions.Total]}
            value={conditionForSearch.attrType || ''}
            onChange={(name, value) => {
              setConditionForSearch({ ...conditionForSearch, attrType: value });
            }}
          />
          <Search.DropDown
            title={'속성유형'}
            name={'attrCat'}
            placeholder={undefined}
            defaultOptions={[...DefaultOptions.AttributeCatalog]}
            value={conditionForSearch.attrCat || ''}
            onChange={(name, value) => {
              setConditionForSearch({ ...conditionForSearch, attrCat: value });
            }}
          />
        </Search>
      ) : (
        <Search className={'type_4'}>
          <p>추후 검색을 통한 조회가 요구될 시 요소 추가</p>
        </Search>
      )}
      <Table>
        <TableHeader count={displayedElement == 0 ? paging.totalRowCount || 0 : codePaging.totalRowCount || 0}>
          <div className={'btnArea'}>
            <button
              className={'btn'}
              onClick={() => {
                onRowElementAdded();
              }}
            >
              {'행 추가'}
            </button>
          </div>
          <div className={'btnArea'}>
            <button
              className={'btn'}
              onClick={() => {
                setConfirmModal(true);
              }}
            >
              {'최신화'}
            </button>
          </div>
        </TableHeader>
        <div className={'ag-theme-alpine'}>
          <AgGridReact
            onGridReady={onGridReady}
            loading={isLoading}
            rowData={(attribute?.data?.body?.rows as AttributeResponsePaging[]) || []}
            gridOptions={{ rowHeight: 24 }}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            paginationPageSize={displayedElement == 0 ? paging.pageRowCount : codePaging.pageRowCount}
            rowSelection={'single'}
            onCellValueChanged={onCellValueChanged}
            onRowClicked={onRowClicked}
            onCellKeyDown={onCellKeyDown}
            onCellEditingStarted={onCellEditingStarted}
            onCellEditingStopped={onCellEditingStopped}
          />
        </div>
        <Pagination pageObject={displayedElement == 0 ? paging : codePaging} setPaging={displayedElement == 0 ? setPaging : setCodePaging} />
      </Table>
      <ConfirmModal title={'목록을 업데이트하시겠습니까?'} open={confirmModal} onConfirm={updateList} onClose={() => setConfirmModal(false)} />
    </div>
  );
};
export default AttributeMng;
