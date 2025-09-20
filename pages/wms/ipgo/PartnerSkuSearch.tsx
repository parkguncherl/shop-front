import React, { useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { CellKeyDownEvent, ColDef } from 'ag-grid-community';
import { toastError } from '../../../components';
import { Search } from '../../../components';
import { PopupLayout, PopupContent, PopupFooter } from '../../../components/popup';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { authApi } from '../../../libs';
import { DataListDropDown } from '../../../components/DataListDropDown';
import useFilters from '../../../hooks/useFilters';

// 팝업 컴포넌트 props 인터페이스
interface PartnerSkuSearchProps {
  isOpen: boolean; // 팝업 열림/닫힘 상태
  onClose: () => void; // 팝업 닫기 핸들러
  onSelect: (selectedData: any[]) => void; // 선택 완료 핸들러
}

// 드롭다운 옵션 인터페이스
interface PartnerOption {
  value: number; // ID 값
  label: string; // 표시될 텍스트
}

interface DataListDropDownProps {
  placeholder: string;
  onChange: (selected: PartnerOption | null) => void;
  options: PartnerOption[];
  value?: PartnerOption | null;
  isDisabled?: boolean;
}

/**
 * 화주/SKU 검색 팝업 컴포넌트
 */
const PartnerSkuSearch: React.FC<PartnerSkuSearchProps> = ({ isOpen, onClose, onSelect }) => {
  // 상태 관리
  const [selectedPartner, setSelectedPartner] = useState<PartnerOption | null>(null); // 선택된 화주
  const [selectedFactory, setSelectedFactory] = useState<PartnerOption | null>(null); // 선택된 공장
  const [searchedSkus, setSearchedSkus] = useState<any[]>([]); // 검색된 SKU 목록

  // refs
  const gridRef = useRef<AgGridReact>(null); // ag-grid ref
  const partnerRef = useRef<HTMLDivElement | null>(null);

  // 필터 상태 관리
  const [filters, onChangeFilters] = useFilters<{
    partnerId: string; // partnerId를 string으로 정의
    skuNm: string;
  }>({
    partnerId: '',
    skuNm: '',
  });
  // ag-grid 컬럼 정의
  const columnDefs: ColDef[] = [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      maxWidth: 30,
      minWidth: 30,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'prodAttrAndProdNm',
      headerName: '상품명',
      maxWidth: 200,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: (params: any) => {
        const value = params.value;
        const parts = value.split(' '); // 공백으로 나누기
        const prodAttrPart = parts[0]; // 첫 번째 부분 (예: 'TC')
        const prodNamePart = parts.slice(1).join(' '); // 나머지 부분 (예: '상품명')

        return (
          <span>
            <span style={{ color: '#1890ff' }}>{prodAttrPart}</span> {/* 'TC' 파란색 */} {prodNamePart} {/* 나머지 부분 기본 색상 */}
          </span>
        );
      },
    },
    {
      field: 'skuSize',
      headerName: '사이즈',
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuColor',
      headerName: '컬러',
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'currentStock',
      headerName: '물류재고',
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'hasAsn',
      headerName: '화주ASN확정여부',
      maxWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: 'agCheckboxCellRenderer',
      valueGetter: (params) => {
        return params.data.hasAsn === 'Y'; // 'Y'일 때 체크, 'N'일 때 체크 해제
      },
      editable: false, // 수정 불가
    },
    {
      field: 'totalAsnCnt',
      headerName: '화주발주수량',
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
  ];

  /**
   * 화주 목록 조회 API 호출
   */
  const { data: partnersData } = useQuery(
    ['partnerList'],
    async () => {
      const response = await authApi.get('/wms/manualinstock/partners');
      return response.data;
    },
    {
      select: (data) => {
        if (data.resultCode === 200) {
          return data.body.map((partner: any) => ({
            value: partner.id,
            label: partner.partnerNm,
          }));
        }
        return [];
      },
    },
  );

  /**
   * 공장 목록 조회 API 호출
   * - API 응답 데이터에 '기타' 옵션 추가
   */
  const { data: factoriesData } = useQuery(
    ['factoryList', selectedPartner?.value],
    async () => {
      if (!selectedPartner?.value) return null;
      const response = await authApi.get('/wms/manualinstock/factory', {
        params: { partnerId: selectedPartner.value },
      });
      return response.data;
    },
    {
      select: (data) => {
        if (data?.resultCode === 200) {
          // API 응답 데이터를 변환하고 '기타' 옵션 추가
          const factoryOptions = data.body.map((factory: any) => ({
            value: factory.id,
            label: factory.compNm,
          }));

          /*          // '기타' 옵션 추가 (value를 -1로 설정하여 실제 공장 ID와 구분)
          const etcOption: PartnerOption = {
            value: -1,
            label: '기타',
          };*/

          return [...factoryOptions /*, etcOption*/];
        }
        return [];
      },
      enabled: !!selectedPartner?.value,
    },
  );

  /**
   * 화주 선택 변경 핸들러
   */
  const handlePartnerChange = async (option: PartnerOption | null) => {
    setSelectedPartner(option);
    setSelectedFactory(null); // 화주가 변경되면 공장 선택 초기화
    setSearchedSkus([]); // SKU 목록 초기화
    onChangeFilters('skuNm', ''); // SKU 검색어 초기화
    console.log('handlePartnerChange', selectedPartner?.value, option?.value);

    if (option?.value) {
      onChangeFilters('partnerId', String(option.value));
      await searchSkus(option.value, null);
    }
  };

  /**
   * 공장 선택 변경 핸들러
   */
  const handleFactoryChange = async (option: PartnerOption | null) => {
    setSelectedFactory(option);
    setSearchedSkus([]); // SKU 목록 초기화
    onChangeFilters('skuNm', ''); // SKU 검색어 초기화
    console.log('handleFactoryChange', selectedPartner?.value, option?.value);

    if (option?.value && selectedPartner?.value) {
      await searchSkus(selectedPartner.value, option.value);
    }
  };

  /**
   * SKU 검색 함수
   */
  const searchSkus = async (partnerId: number, factoryId: number | null) => {
    try {
      const response = await authApi.get('/wms/manualinstock/skus', {
        params: {
          partnerId,
          factoryId,
          ...(filters.skuNm && {
            skuNm: filters.skuNm,
            prodNm: filters.skuNm, // 입력된 검색어로 SKU명과 상품명 모두 검색
          }),
        },
      });

      if (response.data.resultCode === 200) {
        const formattedData =
          response.data.body
            ?.filter(
              (item: any) => item.skuNm.toLowerCase().includes(filters.skuNm.toLowerCase()) || item.prodNm.toLowerCase().includes(filters.skuNm.toLowerCase()),
            )
            .map((item: any) => ({
              ...item,
              currentStock: item.currentStock ?? 0,
            })) || [];

        console.log('response>>', response.data.body);
        setSearchedSkus(formattedData);

        setTimeout(() => {
          if (formattedData.length > 0) {
            gridRef.current?.api.setFocusedCell(0, 'prodNm');
          }
        }, 100);
      } else {
        toastError(response.data.resultMessage || '검색 중 오류가 발생했습니다');
        setSearchedSkus([]);
      }
    } catch (error) {
      console.error('SKU 검색 오류:', error);
      toastError('SKU 검색 중 오류가 발생했습니다');
      setSearchedSkus([]);
    }
  };

  /**
   * 선택 완료 핸들러
   */
  const handleSelect = () => {
    if (!gridRef.current) return;

    const selectedNodes = gridRef.current.api.getSelectedNodes();
    if (!selectedNodes.length) {
      toastError('선택된 상품이 없습니다');
      return;
    }

    console.log(selectedNodes);
    // 선택된 데이터에 화주 정보 추가
    const selectedData = selectedNodes.map((node) => ({
      ...node.data,
      partnerId: selectedPartner?.value,
      partnerNm: selectedPartner?.label,
      // factoryId: selectedFactory?.value,
      // factoryNm: selectedFactory?.label,
    }));

    onSelect(selectedData);
    onClose();
  };

  return (
    <PopupLayout width={1000} height={600} isEscClose={true} open={isOpen} title="화주/상품 검색" onClose={onClose}>
      <PopupContent>
        <div className="tblBox">
          <table>
            <colgroup>
              <col width="10%" />
              <col width="23%" />
              <col width="10%" />
              <col width="23%" />
              <col width="10%" />
              <col width="23%" />
            </colgroup>
            <tbody>
              <tr>
                <th>화주</th>
                <td>
                  <DataListDropDown
                    placeholder="화주 검색..."
                    onChange={(value) => {
                      handlePartnerChange(value); // 화주 변경 처리
                      if (value) {
                        // 화주가 변경되었을 때 상품 조회
                        searchSkus(value.value, selectedFactory ? selectedFactory.value : null);
                      }
                    }}
                    options={partnersData || []}
                    value={selectedPartner}
                  />
                </td>
                <th>공장</th>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <DataListDropDown
                      placeholder="공장 검색..."
                      onChange={(value) => {
                        handleFactoryChange(value); // 공장 변경 처리
                        if (selectedPartner) {
                          // 공장이 변경되었을 때 상품 조회
                          searchSkus(selectedPartner.value, value ? value.value : null);
                        }
                      }}
                      options={factoriesData || []}
                      value={selectedFactory}
                      isDisabled={!selectedPartner}
                    />
                    {selectedFactory && (
                      <button
                        style={{
                          marginLeft: '8px',
                          padding: '3px 8px',
                          background: 'red',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          handleFactoryChange(null); // 공장 선택 초기화
                          if (selectedPartner) {
                            // 화주만으로 상품 조회
                            searchSkus(selectedPartner.value, null);
                          }
                        }}
                      >
                        X
                      </button>
                    )}
                  </div>
                </td>
                <th>상품명</th>
                <td>
                  <Search.Input
                    name="skuNm"
                    placeholder="상품명을 입력하세요"
                    value={filters.skuNm || ''}
                    onChange={onChangeFilters}
                    onEnter={() => {
                      if (selectedPartner) {
                        searchSkus(selectedPartner.value, selectedFactory ? selectedFactory.value : null);
                      }
                    }}
                    filters={filters}
                    disable={!selectedPartner}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ag-theme-alpine" style={{ height: 400, marginTop: '1rem' }}>
          <AgGridReact
            ref={gridRef}
            rowData={searchedSkus}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            onGridReady={(params) => {
              params.api.sizeColumnsToFit();
            }}
            rowHeight={24}
            headerHeight={35}
            onCellKeyDown={(event: CellKeyDownEvent) => {
              const keyBoardEvent = event.event as KeyboardEvent;
              if (keyBoardEvent.key === 'Enter') {
                handleSelect();
              }

              // Shift + 방향키 처리
              if (
                keyBoardEvent.shiftKey &&
                (keyBoardEvent.key === 'ArrowUp' ||
                  keyBoardEvent.key === 'ArrowDown' ||
                  keyBoardEvent.key === 'ArrowLeft' ||
                  keyBoardEvent.key === 'ArrowRight')
              ) {
                const node = event.node;
                if (node) {
                  node.setSelected(!node.isSelected());
                }
              }
            }}
          />
        </div>
      </PopupContent>
      <PopupFooter>
        <div className="btnArea">
          <button className="btn" onClick={handleSelect}>
            선택
          </button>
          <button className="btn" onClick={onClose}>
            닫기
          </button>
        </div>
      </PopupFooter>
    </PopupLayout>
  );
};

export default PartnerSkuSearch;
