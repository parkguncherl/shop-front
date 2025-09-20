import { PopupLayout } from '../PopupLayout';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import TunedGrid from '../../grid/TunedGrid';
import { RetailResponseDetail, SkuResponsePaging, WrongDetAftInfo, WrongDetInfo, WrongResponsePaging } from '../../../generated';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import CustomGridLoading from '../../CustomGridLoading';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWrongStore } from '../../../stores/useWrongStore';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { toastError, toastSuccess } from '../../ToastMessage';
import { ColDef } from 'ag-grid-community';
import { Utils } from '../../../libs/utils';
import { purpose } from '../../layout';
import { SkuSearchPop } from '../common/SkuSearchPop';
import { AgGridReact } from 'ag-grid-react';
import { useRetailStore } from '../../../stores/useRetailStore';
import { selectRowIndexBeforeFilterAndSort } from '../../../customFn/selectRowIndexBeforeFilterAndSortFn';

interface wrongDeliveryModPopProps {
  selectedWrongDelivery: WrongResponsePaging | undefined;
}

/*
 * 현재 미사용
 * */
export const WrongDeliveryModPop = ({ selectedWrongDelivery }: wrongDeliveryModPopProps) => {
  const [modalType, closeModal, registerWrongInfo] = useWrongStore((s) => [s.modalType, s.closeModal, s.registerWrongInfo]);
  const [getRetailDetail] = useRetailStore((s) => [s.getRetailDetail]);

  const [wrongDetInfoList, setWrongDetInfoList] = useState<WrongDetInfo[]>([]);
  const [wrongDetInfoCols, setWrongDetInfoCols] = useState<ColDef<WrongDetInfo>[]>([]);

  const [skuSearchPopEnabled, setSkuSearchPopEnabled] = useState(false);

  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any[]>([
    {
      no: '판매소계',
      baseAmt: 0,
      displayedCnt: 0,
      totAmt: 0,
    },
    {
      no: '전잔',
      baseAmt: 0,
    },
    {
      no: '당일합계',
      baseAmt: 0,
    },
    {
      no: '잔액',
      baseAmt: 0,
    },
  ]); // 합계데이터 만들기

  const RefForGrid = useRef<AgGridReact>(null);
  const openPurpose = useRef<purpose>({
    purpose: 'add',
  });

  const {
    data: wrongDetInfoListData,
    isLoading: isWrongDetInfoListLoading,
    isSuccess: isLoadingSuccess,
    refetch: fetchWrongDetInfo,
  } = useQuery(['/orderInfo/wrong/det'], (): any => authApi.get(`/orderInfo/wrong/det/${selectedWrongDelivery?.jobId}`));

  useEffect(() => {
    if (isLoadingSuccess) {
      const { resultCode, body, resultMessage } = wrongDetInfoListData.data;
      if (resultCode === 200) {
        const respondedWrongDetInfoList = ([...body] as WrongDetInfo[]) || []; // 깊은 복사 미사용 시 wrongDetInfoList 상태와 값이 동기화 되어 의도치 않은 동작(수정 여부 확인 관련 문제) 발생 가능성
        setWrongDetInfoList(respondedWrongDetInfoList);

        let totalThisSum = 0; // 해당합계(당일합계로서 사용됨)
        for (let i = 0; i < respondedWrongDetInfoList.length; i++) {
          totalThisSum += respondedWrongDetInfoList[i].totAmt as number;
        }

        getRetailDetail(selectedWrongDelivery?.id as number).then((result) => {
          const { resultCode, body, resultMessage } = result.data;
          if (resultCode == 200) {
            const retailInfo = body as RetailResponseDetail;
            setPinnedBottomRowData((pinnedBottomRowData) => {
              pinnedBottomRowData[1].baseAmt = retailInfo.nowAmt || 0; // 전잔액
              pinnedBottomRowData[2].baseAmt = totalThisSum; // 당일합계
              pinnedBottomRowData[3].baseAmt = (retailInfo.nowAmt || 0) + totalThisSum; // 잔액(전잔액 + 당일합계)
              return [...pinnedBottomRowData];
            });
            // 전잔액 nowAmt
            // 당일합계 inThisSum
            // 잔액 전잔액 + 당일합계
            setWrongDetInfoCols([
              {
                headerCheckboxSelection: false,
                headerName: '선택',
                checkboxSelection: true,
                filter: false,
                sortable: false,
                cellClass: 'stringType',
                minWidth: 60,
                maxWidth: 60,
                cellStyle: GridSetting.CellStyle.CENTER,
                suppressHeaderMenuButton: true,
                hide: true,
              },
              {
                field: 'no',
                headerName: '#',
                minWidth: 40,
                maxWidth: 40,
                cellStyle: GridSetting.CellStyle.CENTER,
                suppressHeaderMenuButton: true,
                colSpan: (params) => (params.node?.rowPinned ? 3 : 1),
                valueFormatter: (params) => {
                  // 하단 고정 row 인 경우
                  if (params.node?.rowPinned == 'bottom') {
                    return params.value.toString();
                  } else {
                    return params.value;
                  }
                },
              },
              {
                field: 'typeNm',
                headerName: '유형',
                maxWidth: 70,
                minWidth: 70,
                cellStyle: GridSetting.CellStyle.CENTER,
                suppressHeaderMenuButton: true,
              },
              {
                field: 'skuNm',
                headerName: '상품명',
                minWidth: 110,
                suppressHeaderMenuButton: true,
                cellStyle: GridSetting.CellStyle.LEFT,
                editable: (params) => {
                  if (params.data == undefined || params.data.skuNm == undefined) {
                    return true;
                  }
                  return false;
                },
                onCellValueChanged: (event) => {
                  if (event.node?.rowIndex) {
                    setSkuSearchPopEnabled(true);
                    openPurpose.current.purpose = 'add';
                    openPurpose.current.searchWord = event.newValue;
                    openPurpose.current.index = event.node?.rowIndex;
                  }
                },
              },
              {
                field: 'baseAmt',
                headerName: '단가',
                maxWidth: 80,
                minWidth: 80,
                suppressHeaderMenuButton: true,
                cellStyle: GridSetting.CellStyle.RIGHT,
                valueFormatter: (params) => {
                  if (params.node?.rowPinned && params.node.rowIndex == 0) {
                    return params.value + '건';
                  } else {
                    if (params.value) {
                      return Utils.setComma(params.value);
                    } else {
                      return null;
                    }
                  }
                },
                colSpan: (params) => {
                  if (params.node?.rowPinned == 'bottom') {
                    if (params.node.rowIndex && params.node.rowIndex > 0) {
                      // 전잔 이하 영역
                      return 2;
                    }
                  }
                  return 1;
                },
              },
              {
                field: 'displayedCnt',
                headerName: '수량',
                maxWidth: 60,
                minWidth: 60,
                suppressHeaderMenuButton: true,
                editable: true,
                cellStyle: GridSetting.CellStyle.RIGHT,
                onCellValueChanged: (event) => {
                  /** 컬럼 정의의 본 콜백은 컬럼 상태 재정의가 일어나지 않는 이상 다시 인스턴스화 되지 않으므로 최신 외부 데이터를 참조할 수 없으므로 setState 내부 함수를 사용하여 최신 state 참조 */
                  setWrongDetInfoList((infoList) => {
                    const rowIndexBeforeFilterAndSort = selectRowIndexBeforeFilterAndSort(event.data, infoList);
                    if (rowIndexBeforeFilterAndSort != null) {
                      infoList[rowIndexBeforeFilterAndSort] = {
                        ...infoList[rowIndexBeforeFilterAndSort],
                        chgCnt: event.newValue - (infoList[rowIndexBeforeFilterAndSort].jobCnt || 0), // 변경수량은 입력된 값 - (원)작업수량
                        displayedCnt: event.newValue,
                        totAmt: (infoList[rowIndexBeforeFilterAndSort].baseAmt || 0) * event.newValue,
                      };
                    }
                    return [...infoList];
                  });
                },
              },
              {
                field: 'totAmt',
                headerName: '금액',
                maxWidth: 100,
                minWidth: 100,
                cellStyle: GridSetting.CellStyle.RIGHT,
                suppressHeaderMenuButton: true,
                valueFormatter: (params) => {
                  if (params.value) {
                    return Utils.setComma(params.value);
                  } else {
                    return null;
                  }
                },
              },
            ]);
          } else {
            toastError(resultMessage);
          }
        });
      } else {
        toastError(resultMessage);
      }
    }
  }, [wrongDetInfoListData, isLoadingSuccess]);

  useEffect(() => {
    if (wrongDetInfoList.length > 0) {
      const { sumOfWrongCnt, sumOfDisplayedCnt, sumOfTotAmt } = wrongDetInfoList.reduce(
        (
          acc: {
            sumOfWrongCnt: number;
            sumOfDisplayedCnt: number;
            sumOfTotAmt: number;
          },
          data: any,
        ) => {
          return {
            sumOfWrongCnt: acc.sumOfWrongCnt + (data.no ? 1 : 0),
            sumOfDisplayedCnt: acc.sumOfDisplayedCnt + (data.displayedCnt ? data.displayedCnt : 0),
            sumOfTotAmt: acc.sumOfTotAmt + (data.totAmt ? data.totAmt : 0),
          };
        },
        {
          sumOfWrongCnt: 0,
          sumOfDisplayedCnt: 0,
          sumOfTotAmt: 0,
        }, // 초기값 설정
      );
      setPinnedBottomRowData((pinnedBottomRowData) => {
        pinnedBottomRowData[0].baseAmt = sumOfWrongCnt;
        pinnedBottomRowData[0].displayedCnt = sumOfDisplayedCnt;
        pinnedBottomRowData[0].totAmt = sumOfTotAmt;

        return [...pinnedBottomRowData];
      });
    }
  }, [wrongDetInfoList]);

  /** 등록버튼 클릭 시 */
  const onClickOnRegister = useCallback(
    (
      fetchedInfos: WrongDetInfo[], // 최초 fetch 된 이후 useQuery 를 통하여 저장되어 있는 데이터
      wrongDetInfoList: WrongDetInfo[],
    ) => {
      if (selectedWrongDelivery && selectedWrongDelivery.jobId) {
        /** 기존 데이터와 비교하여 변경 여부 확인 후 동작 */
        let changed = false;
        const usedInfos = wrongDetInfoList.filter((detAft) => !!detAft.skuNm);
        if (fetchedInfos.length == usedInfos.length) {
          for (let i = 0; i < fetchedInfos.length; i++) {
            if (selectedWrongDelivery && selectedWrongDelivery.jobType != 'C' && fetchedInfos[i].wrongTranCd != usedInfos[i].wrongTranCd) {
              // 작업구분이 '매장요청' 이 아닌 경우 주문상세코드 비교
              changed = true;
              console.log('orderDetCd');
            } else if (fetchedInfos[i].skuId != usedInfos[i].skuId) {
              // 스큐 변경 여부
              changed = true;
              console.log('skuId');
            } else if (fetchedInfos[i].chgCnt != usedInfos[i].chgCnt) {
              // 수량 변경 여부
              changed = true;
              console.log('chgCnt');
            } else if (fetchedInfos[i].wrongTranCd != usedInfos[i].wrongTranCd) {
              // 처리구분 변경 여부
              changed = true;
              console.log('wrongTranCd');
            }
          }
        } else {
          // 요소가 추가 혹은 삭제됨
          changed = true;
        }
        if (changed) {
          registerWrongInfo({
            wrong: { jobId: selectedWrongDelivery.jobId as number },
            wrongDetList: usedInfos,
          }).then((result) => {
            const { resultCode, body, resultMessage } = result.data;
            if (resultCode == 200) {
              toastSuccess('등록되었습니다.');
              fetchWrongDetInfo();
            } else {
              toastError(resultMessage);
            }
          });
        } else {
          toastError('수정되지 않은 오출고 내역은 등록할 수 없습니다.');
        }
      } else {
        console.error('jobId 를 찾을 수 없음');
      }
    },
    [fetchWrongDetInfo, registerWrongInfo, selectedWrongDelivery],
  );

  /** 미송버튼 클릭 시 */
  const onClickOnMisong = useCallback(() => {
    const selectedNodes = RefForGrid.current?.api.getSelectedNodes() || [];
    for (let i = 0; i < selectedNodes.length; i++) {
      if (selectedNodes[i].rowIndex != null) {
        setWrongDetInfoList((infoList) => {
          const rowIndexBeforeFilterAndSort = selectRowIndexBeforeFilterAndSort(selectedNodes[i].data, infoList);
          if (rowIndexBeforeFilterAndSort != null) {
            infoList[rowIndexBeforeFilterAndSort] = {
              ...infoList[rowIndexBeforeFilterAndSort],
              wrongTranCd: 'M', // 미송, 오출고처리구분(10450)
              typeNm: '미송',
            };
          }
          return [...infoList];
        });
      }
    }
  }, []);

  /** 스큐 검색 팝업에서 스큐 선택할 시 */
  const onSomeSkuSelected = useCallback((count: number, list: SkuResponsePaging[]) => {
    if (openPurpose.current.purpose == 'mod') {
      // 수정 영역
      setWrongDetInfoList((prevState) => {
        return prevState.map((info: WrongDetAftInfo, index) => {
          if (index == openPurpose.current.index) {
            return {
              ...info,
              skuId: list[0].skuId,
              skuNm: list[0].skuNm,
            };
          } else {
            return info;
          }
        });
      });
    } else {
      // 추가
      setWrongDetInfoList((prevState) => {
        const modifiedState: WrongDetInfo[] = [...prevState.filter((prev) => prev.skuId != undefined)];
        for (let i = 0; i < list.length; i++) {
          modifiedState[modifiedState.length] = {
            no: modifiedState.length + 1,
            skuId: list[i].skuId,
            skuNm: list[i].skuNm,
            baseAmt: (list[i].sellAmt || 0) - (list[i].dcAmt || 0) || 0, // 원가에서 소매처별 특가 공재
            totAmt: ((list[i].sellAmt || 0) - (list[i].dcAmt || 0)) * count || 0,
            displayedCnt: count,
            jobCnt: 0,
            chgCnt: count, // 오출고로 인하여 생성되는 데이터이므로 최초 작업수량은 0, 변경 수량은 상품수량과 같다.
            wrongTranCd: 'D', // 판매, 오출고처리구분(10450)
            typeNm: '판매',
          };
        }
        return modifiedState;
      });
    }
  }, []);

  return (
    <PopupLayout
      width={642}
      isEscClose={true}
      height={500}
      open={modalType.active && modalType.type == 'WRONG_MOD'}
      title={'오출고 수정'}
      className={'wrongDeliveryModPop'}
      /*onClose={() => {
        closeModal(modalType.type);
      }}*/
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button
              className="btn btnBlue"
              title="등록"
              onClick={() => {
                onClickOnRegister(wrongDetInfoListData?.data.body || [], wrongDetInfoList);
              }}
            >
              등록
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal(modalType.type)}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="tblBox">
          <table></table>
        </div>
        <div className="layoutBox">
          <div className="gridBox">
            <div className="btnArea between">
              <div className="left">
                <h3>
                  {(selectedWrongDelivery?.sellerNm || '소매처 정보 없음') +
                    ' (' +
                    (selectedWrongDelivery?.jobTypeNm || '거래유형 정보 없음') +
                    ') - ' +
                    (selectedWrongDelivery?.workYmd || '영업일자 정보 없음') +
                    ' ' +
                    ('#' + selectedWrongDelivery?.no)}
                </h3>
              </div>
              <div className="right">
                <button
                  className="btn"
                  title="추가"
                  onClick={() => {
                    setWrongDetInfoList([...wrongDetInfoList, {}]);
                  }}
                >
                  추가
                </button>
                <button className="btn" title="미송" onClick={onClickOnMisong}>
                  미송
                </button>
              </div>
            </div>
            <TunedGrid
              headerHeight={35}
              onGridReady={(e) => {
                e.api.sizeColumnsToFit();
              }}
              rowData={wrongDetInfoList}
              columnDefs={wrongDetInfoCols}
              defaultColDef={defaultColDef}
              ref={RefForGrid}
              gridOptions={{ rowHeight: 24 }}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              pinnedBottomRowData={pinnedBottomRowData}
              className={'pop2'}
            />
          </div>
        </div>
        {skuSearchPopEnabled && (
          <SkuSearchPop
            active={skuSearchPopEnabled}
            onClose={() => {
              setSkuSearchPopEnabled(false);
            }}
            filter={{
              skuNm: openPurpose.current.searchWord,
            }}
            //skuNm={openPurpose.current.searchWord}
            limit={openPurpose.current.purpose == 'mod' ? 1 : undefined}
            onSelected={onSomeSkuSelected}
          />
        )}
      </PopupContent>
    </PopupLayout>
  );
};
