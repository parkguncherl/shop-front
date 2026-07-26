import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CirclePicker, ColorResult } from 'react-color';
import { PopupFooter } from '@/components/popup/PopupFooter';
import { PopupContent } from '@/components/popup/PopupContent';
import { PopupLayout } from '@/components/popup/PopupLayout';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi, YupSchema } from '@/libs';
import { toastError, toastSuccess } from '@/components/ToastMessage';
import { ConfirmModal } from '@/components/ConfirmModal';
import {
  ProductMngRequestDeleteProductDet,
  ProductMngRequestInsertProductDet,
  ProductMngResponseProductDetInfo,
  ProductMngResponseProductInfo,
} from '@/generated';
import { useProductMngStore } from '@/stores/product/useProductMngStore';
import TunedGrid, { TunedGridRef } from '@/components/grid/TunedGrid';
import { PopupSearchBox, PopupSearchType } from '@/components/popup/content';
import CustomGridLoading from '@/components/CustomGridLoading';
import CustomNoRowsOverlay from '@/components/CustomNoRowsOverlay';
import { GridSetting } from '@/libs/ag-grid';
import { ColDef } from 'ag-grid-community';
import { GlobalError, SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { STNDR_COLOR_PALETTE } from '@/libs/const';
import { useSession } from 'next-auth/react';

interface ProductContentShowPopProps {
  open: boolean;
  onClose: (modHasBeenDone: boolean) => void; // 인자로 삭제, 수정, 추가가 일어난 상태인지를 전달
  productInfo?: ProductMngResponseProductInfo;
}

/**
 * 표준색상(stndr_color) 그리드 셀 렌더러.
 * 스와치 클릭 → ChromePicker(portal) → 6자리 hex 선택 시 params.onColorChange 호출.
 */
// 3자리 hex(#제외) → 6자리로 확장 (표시/피커용). 6자리는 그대로 반환.
const expandHex = (hex?: string) => {
  if (!hex) return '';
  return hex.length === 3
    ? hex
        .split('')
        .map((c) => c + c)
        .join('')
    : hex;
};

const StndrColorCell = (params: any) => {
  const value: string | undefined = params.value; // '#' 없는 3자리 hex
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);

  const openPicker = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.bottom + window.scrollY + 2, left: rect.left + window.scrollX });
    setOpen(true);
  };

  const onComplete = (c: ColorResult) => {
    const hex6 = c.hex.replace('#', '').toLowerCase();
    // 각 채널(0~255)을 가장 가까운 3자리 표현값(0~15)으로 반올림해 축약 (예: ff00aa → f0a)
    const toNibble = (pair: string) => Math.round(parseInt(pair, 16) / 17).toString(16);
    const hex3 = toNibble(hex6.slice(0, 2)) + toNibble(hex6.slice(2, 4)) + toNibble(hex6.slice(4, 6));
    params.onColorChange?.(params, hex3);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: '100%' }}>
      <div
        ref={anchorRef}
        onClick={openPicker}
        title="색상 선택"
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          border: '1px solid #999',
          cursor: 'pointer',
          flexShrink: 0,
          background: value ? `#${value}` : 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px',
        }}
      />
      {open &&
        createPortal(
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }} onClick={() => setOpen(false)} />
            <div
              style={{
                position: 'absolute',
                top: coords.top,
                left: coords.left,
                zIndex: 10001,
                background: '#f2f2f2',
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: 12,
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <CirclePicker
                color={value ? `#${expandHex(value)}` : '#ffffff'}
                colors={STNDR_COLOR_PALETTE}
                circleSize={22}
                circleSpacing={10}
                width="352px"
                onChangeComplete={onComplete}
              />
            </div>
          </>,
          document.body,
        )}
    </div>
  );
};

/**
 * components/popup/product/productMng/ProductModPop.tsx
 * desc: 상품정보 수정 팝업
 * Date: 2026/03/30
 * Author: park junsung
 * */
const ProductDetInfoPop = ({ open, onClose, productInfo }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  const session = useSession();
  const updateProductDet = useProductMngStore((s) => s.updateProductDet);
  const deleteProductDet = useProductMngStore((s) => s.deleteProductDet);
  const insertProductDet = useProductMngStore((s) => s.insertProductDet);

  /** 팝업 내부 local state */
  const [productDetInfoList, setProductDetInfoList] = useState<ProductMngResponseProductDetInfo[]>([]);
  const [selectedRowsData, setSelectedRowsData] = useState<ProductMngResponseProductDetInfo | undefined>(undefined);

  // 컨펌 팝업
  const [openDelConf, setOpenDelConf] = useState<{ open: boolean; stored?: ProductMngRequestDeleteProductDet }>({ open: false });
  const [openAddConf, setOpenAddConf] = useState<{ open: boolean; stored?: ProductMngRequestInsertProductDet }>({ open: false });

  const RefForGrid = useRef<TunedGridRef<ProductMngResponseProductDetInfo>>(null);

  const flagAboutIsOnWritingOrNot = useRef(false); // 신규 작성중 여부
  const flagWhetherModHasBeenDoneOrNot = useRef(false); // 삭제, 수정, 추가 동작이 해당 참조 초기화 이후 일어났는지 여부

  const tunedGridWrapperRef = useRef(null);

  /** 품목 내용 입력 서식 */
  const {
    handleSubmit,
    reset,
    clearErrors,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm<ProductMngRequestInsertProductDet>({
    resolver: yupResolver(YupSchema.InsertProductDetRequest()),
    mode: 'onChange',
    defaultValues: {
      skuDiscountRate: 0,
      sleepYn: 'N',
    },
  });

  /** 입력 시점 적절치 못한 값이 전달된 경우 사용자에게 에러를 출력하는 영역 */
  useEffect(() => {
    const fieldsRelatedWithErr = Object.keys(errors);
    if (fieldsRelatedWithErr.length > 0) {
      // @ts-ignore
      const targetErr = errors[fieldsRelatedWithErr[0]] as GlobalError;
      toastError(targetErr.message);
    }
  }, [errors]);

  const { mutate: updateProductDetMutate } = useMutation({
    mutationFn: updateProductDet,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('수정되었습니다.');
          flagWhetherModHasBeenDoneOrNot.current = true; // 이벤트 발생에 따른 동기화

          await productDetInfosRefetch();
        } else {
          toastError(`수정 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const { mutate: deleteProductDetMutate } = useMutation({
    mutationFn: deleteProductDet,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          flagWhetherModHasBeenDoneOrNot.current = true; // 이벤트 발생에 따른 동기화

          await productDetInfosRefetch();
        } else {
          toastError(`삭제 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const { mutate: insertProductDetMutate } = useMutation({
    mutationFn: insertProductDet,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('신규 데이터가 추가되었습니다.');
          flagWhetherModHasBeenDoneOrNot.current = true; // 이벤트 발생에 따른 동기화

          // 초기화 동작
          flagAboutIsOnWritingOrNot.current = false;
          await productDetInfosRefetch();

          // rhf 초기화
          reset();
          clearErrors();
        } else {
          toastError(`추가 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 표준색상 선택 콜백 (기존행: 서버 수정 / 신규행: rhf setValue) */
  const onColorChange = useCallback(
    (params: any, hex6: string) => {
      params.node?.setDataValue('stndrColor', hex6); // 그리드 즉시 반영
      if (params.data?.id) {
        updateProductDetMutate({ id: params.data.id, stndrColor: hex6 } as any);
      } else {
        setValue('stndrColor' as any, hex6, { shouldValidate: true });
      }
    },
    [updateProductDetMutate, setValue],
  );

  /** 컬럼 설정 */
  const columnDefs = useMemo<ColDef<ProductMngResponseProductDetInfo>[]>(
    () => [
      {
        field: 'no',
        headerName: 'NO',
        minWidth: 70,
        maxWidth: 80,
        valueGetter: (params) => (params.node ? (params.node.rowIndex ?? 0) + 1 : ''),
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'productDetColor',
        headerName: '컬러',
        minWidth: 80,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
        editable: (params) => (flagAboutIsOnWritingOrNot.current ? params.data?.id == undefined : true),
        onCellValueChanged: (event) => {
          if (event.data.id) {
            updateProductDetMutate({
              id: event.data.id,
              productDetColor: event.newValue,
            });
          } else {
            // 신규 작성 영역
            setValue('productDetColor', event.newValue, { shouldValidate: true });
          }
        },
        valueFormatter: (params) => {
          if (!params.data || params.data.id) {
            return params.value;
          } else {
            // 신규 작성 영역
            return getValues('productDetColor');
          }
        },
      },
      {
        field: 'stndrColor',
        headerName: '색상',
        minWidth: 70,
        maxWidth: 70,
        suppressHeaderMenuButton: true,
        editable: false,
        cellRenderer: StndrColorCell,
        cellStyle: GridSetting.CellStyle.CENTER,
        cellRendererParams: { onColorChange },
      },
      {
        field: 'productDetSize',
        headerName: '사이즈',
        minWidth: 80,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
        // 파트너 사이즈 정보(콤마 구분)를 콤보로 제공 (sleepYn 컬럼과 동일 방식)
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: session.data?.user.partner?.sizeInfo?.split(',').map((s) => s.trim()),
        },
        editable: (params) => (flagAboutIsOnWritingOrNot.current ? params.data?.id == undefined : true),
        onCellValueChanged: (event) => {
          if (event.data.id) {
            updateProductDetMutate({
              id: event.data.id,
              productDetSize: event.newValue,
            });
          } else {
            // 신규 작성 영역
            setValue('productDetSize', event.newValue, { shouldValidate: true });
          }
        },
        valueFormatter: (params) => {
          if (!params.data || params.data.id) {
            return params.value;
          } else {
            // 신규 작성 영역
            return getValues('productDetSize');
          }
        },
      },
      {
        field: 'skuDiscountRate',
        headerName: '할인율',
        minWidth: 50,
        maxWidth: 70,
        suppressHeaderMenuButton: true,
        editable: (params) => (flagAboutIsOnWritingOrNot.current ? params.data?.id == undefined : true),
        cellStyle: GridSetting.CellStyle.CENTER,
        onCellValueChanged: (event) => {
          if (isNaN(Number(event.newValue)) || Number(event.newValue) < 0 || Number(event.newValue) > 100) {
            toastError('유효한 값을 입력하십시요.');
            return;
          }
          if (event.data.id) {
            updateProductDetMutate({
              id: event.data.id,
              skuDiscountRate: event.newValue,
            });
          } else {
            // 신규 작성 영역
            setValue('skuDiscountRate', event.newValue, { shouldValidate: true });
          }
        },
        valueFormatter: (params) => {
          if (!params.data || params.data.id) {
            return params.value;
          } else {
            // 신규 작성 영역
            return getValues('skuDiscountRate');
          }
        },
      },
      {
        field: 'productDetCntn',
        headerName: '거래처 사이즈',
        minWidth: 180,
        maxWidth: 200,
        suppressHeaderMenuButton: true,
        editable: (params) => (flagAboutIsOnWritingOrNot.current ? params.data?.id == undefined : true),
        cellStyle: GridSetting.CellStyle.LEFT,
        onCellValueChanged: (event) => {
          if (event.data.id) {
            updateProductDetMutate({
              id: event.data.id,
              productDetCntn: event.newValue,
            });
          } else {
            // 신규 작성 영역
            console.log('productDetCntn', event.newValue);
            setValue('productDetCntn', event.newValue, { shouldValidate: true });
          }
        },
        valueFormatter: (params) => {
          if (!params.data || params.data.id) {
            return params.value;
          } else {
            // 신규 작성 영역
            return getValues('productDetCntn');
          }
        },
      },
      {
        field: 'stock',
        headerName: '재고',
        minWidth: 50,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        editable: false,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'sleepYn',
        headerName: '휴면',
        minWidth: 60,
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        editable: (params) => (flagAboutIsOnWritingOrNot.current ? params.data?.id == undefined : true),
        cellStyle: GridSetting.CellStyle.CENTER,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: ['Y', 'N'],
        },
        onCellValueChanged: (event) => {
          if (event.data.id) {
            updateProductDetMutate({
              id: event.data.id,
              sleepYn: event.newValue,
            });
          } else {
            // 신규 작성 영역
            setValue('sleepYn', event.newValue, { shouldValidate: true });
          }
        },
        valueFormatter: (params) => {
          if (!params.data || params.data.id) {
            return params.value;
          } else {
            // 신규 작성 영역
            return getValues('sleepYn');
          }
        },
      },
    ],
    [updateProductDetMutate, setValue, getValues, onColorChange, session],
  );

  /** 상품상세정보 목록 조회 */
  const {
    data: productDetInfos,
    isSuccess: isProductDetInfosSuccess,
    isLoading: isProductDetInfosLoading,
    refetch: productDetInfosRefetch,
  } = useQuery({
    queryKey: ['/productMng/productDetInfoList'],
    queryFn: () =>
      authApi.get('/productMng/productDetInfoList', {
        params: {
          prodId: productInfo?.id,
        },
      }),
    refetchOnMount: 'always',
    enabled: open && productInfo?.id != undefined,
  });

  useEffect(() => {
    if (isProductDetInfosSuccess) {
      const { resultCode, body, resultMessage } = productDetInfos.data;
      if (resultCode === 200) {
        setProductDetInfoList(body || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [productDetInfos, isProductDetInfosSuccess]);

  const commonOnCloseCallback = () => {
    if (onClose) onClose(flagWhetherModHasBeenDoneOrNot.current);

    // 닫힘 시점 초기화 동작
    RefForGrid.current?.api.deselectAll(); // 셀렉션 초기화
    flagAboutIsOnWritingOrNot.current = false; // 작성 중 여부 플래그 초기화
    flagWhetherModHasBeenDoneOrNot.current = false; // 삭제, 수정, 추가 동작 발생 여부 초기화

    // rhf 초기화
    reset();
    clearErrors();
  };

  // 입력이 유효한 경우
  const onValid: SubmitHandler<ProductMngRequestInsertProductDet> = (data, event) => {
    setOpenAddConf({
      open: true,
      stored: data,
    });
  };

  // 유효하지 않은 경우
  const onInvalid: SubmitErrorHandler<ProductMngRequestInsertProductDet> = (errors, event) => {
    const fieldsRelatedWithErr = Object.keys(errors);
    if (fieldsRelatedWithErr.length > 0) {
      // @ts-ignore
      const targetErr = errors[fieldsRelatedWithErr[0]] as GlobalError;
      toastError(targetErr.message);
    }
  };

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={800}
        open={open}
        isEscClose={!(openAddConf.open || openDelConf.open)}
        title={productInfo?.prodNm + ' 의 상품상세 목록'}
        onClose={commonOnCloseCallback}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left">
                <button
                  className={`btn ${
                    productDetInfoList.filter((productDetInfo) => productDetInfo.id == undefined).length != 0 ? (isValid ? 'btn_primary' : '') : 'btn_primary'
                  }`}
                  disabled={productDetInfoList.filter((productDetInfo) => productDetInfo.id == undefined).length != 0 ? !isValid : false}
                  onClick={() => {
                    if (productDetInfoList.filter((productDetInfo) => productDetInfo.id == undefined).length == 0) {
                      flagAboutIsOnWritingOrNot.current = true; // 플래그 동기화
                      // 마지막 행의 값을 프리필하되, 서버가 부여하는 식별/자산 필드는 반드시 비운다.
                      // 특히 id 가 남으면 editable 판정(id == undefined)에 걸려 신규/기존 행 모두 편집이 막힌다.
                      const lastData =
                        productDetInfoList.length > 0
                          ? {
                              ...productDetInfoList.at(productDetInfoList.length - 1),
                              id: undefined,
                              productDetSeq: undefined,
                              fileId: undefined,
                              productDetColor: undefined,
                              stndrColor: undefined,
                            }
                          : {};
                      setProductDetInfoList((prevState) => [...prevState, lastData ?? {}]); // 신규 행 추가(이후부터는 rhf 관할)
                      setValue('productDetSize', (lastData as ProductMngResponseProductDetInfo).productDetSize ?? '', { shouldValidate: true });
                    } else {
                      // 신규 작성
                      if (isValid) {
                        handleSubmit(onValid, onInvalid)(); // 함수를 반환하므로 다음과 같이, 호출하여야
                      } else {
                        console.error('유효하지 않은 요청');
                      }
                    }
                  }}
                >
                  {productDetInfoList.filter((productDetInfo) => productDetInfo.id == undefined).length == 0 ? '신규 작성' : isValid ? '저장' : '작성중..'}
                </button>
                <button
                  className={`btn ${productInfo != undefined && selectedRowsData != undefined && 'btn_primary'}`}
                  //disabled={productInfo == undefined || selectedRowsData == undefined}
                  onClick={() => {
                    if (selectedRowsData?.id) {
                      setOpenDelConf({
                        open: true,
                        stored: {
                          id: selectedRowsData?.id,
                        },
                      });
                    } else {
                      setProductDetInfoList(productDetInfoList.filter((v) => v.id));
                    }
                  }}
                >
                  삭제
                </button>
              </div>
              <div className="right">
                <button className="btn" onClick={commonOnCloseCallback}>
                  닫기
                </button>
              </div>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <PopupSearchBox>
            <PopupSearchType className={'type_2'}>
              <></>
              {/*<Search.Input*/}
              {/*  title={'상품명'}*/}
              {/*  name={'skuNm'}*/}
              {/*  placeholder={'키워드 입력 후 엔터키 클릭'}*/}
              {/*  value={filters.skuNm}*/}
              {/*  onEnter={search}*/}
              {/*  onChange={onChangeFilters}*/}
              {/*  filters={filters}*/}
              {/*/>*/}
            </PopupSearchType>
          </PopupSearchBox>
          <div
            className="mt10"
            style={{ position: 'relative' }} // relative 설정 필수
            ref={tunedGridWrapperRef}
          >
            <TunedGrid<ProductMngResponseProductDetInfo>
              columnDefs={columnDefs}
              rowData={productDetInfoList}
              popupParent={tunedGridWrapperRef.current}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              ref={RefForGrid}
              loading={isProductDetInfosLoading}
              singleClickEdit={true}
              rowSelection={{
                mode: 'singleRow',
                isRowSelectable: (rowNode) => !flagAboutIsOnWritingOrNot.current, // 신규 작성 시점에는 행 선택 제한
                enableClickSelection: true,
              }}
              onSelectionChanged={(event) => {
                const selectedRows = event.api.getSelectedRows();
                setSelectedRowsData(selectedRows.length > 0 ? selectedRows[0] : undefined);
              }}
            />
          </div>
        </PopupContent>
      </PopupLayout>
      <ConfirmModal
        open={openDelConf.open}
        title={(productInfo?.prodNm || '') + ' ' + selectedRowsData?.productDetColor + ' 을(를) 삭제 하시겠습니까?'}
        confirmText={'삭제'}
        onConfirm={() => {
          if (openDelConf.stored) {
            deleteProductDetMutate({
              id: openDelConf.stored.id,
            });
          } else {
            toastError('삭제하고자 하는 입력 결과를 찾을 수 없습니다.');
            console.error('삭제하고자 하는 입력 결과를 찾을 수 없습니다.');
          }
        }}
        onClose={() => {
          setOpenDelConf({
            open: false,
          });
        }}
      />
      <ConfirmModal
        open={openAddConf.open}
        title={'신규 상품상세 정보로 저장하시겠습니까?'}
        confirmText={'저장'}
        onConfirm={() => {
          if (openAddConf.stored) {
            insertProductDetMutate({
              ...openAddConf.stored,
              productId: productInfo?.id,
            });
          } else {
            toastError('저장하고자 하는 입력 결과를 찾을 수 없습니다.');
            console.error('저장하고자 하는 입력 결과를 찾을 수 없습니다.');
          }
        }}
        onClose={() => {
          setOpenAddConf({
            open: false,
          });
        }}
      />
    </div>
  );
};

export default ProductDetInfoPop;
