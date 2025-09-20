import TunedGrid from '../../grid/TunedGrid';
import CustomGridLoading from '../../CustomGridLoading';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import { toastError, toastSuccess } from '../../ToastMessage';
import React, { useEffect, useRef, useState } from 'react';
import { useDeliveryStore } from '../../../stores/useDeliveryStore';
import { CellKeyDownEvent, CellPosition, ColDef, FullWidthCellKeyDownEvent, RowClassParams } from 'ag-grid-community';
import { defaultColDef, GridSetting, suppressDeleteKey } from '../../../libs/ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupLayout } from '../PopupLayout';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { Job, WrongDetBefInfo, WrongInfo } from '../../../generated';
import { Utils } from '../../../libs/utils';
import { SkuSearchPop } from '../common/SkuSearchPop';
import { WrongDetAftInfo } from '../../../generated';
import { purpose } from '../../layout';
import { useWrongStore } from '../../../stores/useWrongStore';
import { ProductStatus } from '../../../libs/const';

export const WrongDeliveryReqPop = () => {
  /** 출고 관련 전역 상태 */
  const [modalType, closeModal, selectedPagingElement] = useDeliveryStore((s) => [s.modalType, s.closeModal, s.selectedPagingElement]);

  const [registerWrongInfo] = useWrongStore((s) => [s.registerWrongInfo]);

  const [jobStatus, setJobStatus] = useState<Job | undefined>(undefined);
  const [wrongDetBefInfos, setWrongDetBefInfos] = useState<WrongDetBefInfo[]>([]);
  const [wrongDetAftInfos, setWrongDetAftInfos] = useState<WrongDetAftInfo[]>([]);

  /*const [skuSearchPurpose, setSkuSearchPurpose] = useState({
    purpose: '', // 다음과 같이 빈 문자열일 시 팝업이 출력되지 않음
    searchWord: '',
    index: -1,
  });*/
  const [skuSearchPopEnabled, setSkuSearchPopEnabled] = useState(false);

  /** Component 참조 */
  const WrongDetBefGrid = useRef<AgGridReact>(null);
  const WrongDetAftGrid = useRef<AgGridReact>(null);

  const openPurpose = useRef<purpose>({
    purpose: 'add',
  });

  /** 좌측 그리드 컬럼 정의 */
  const [OriginDataCols] = useState<ColDef[]>([
    {
      headerName: '선택',
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
      sortable: false,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (value) => {
        if (value.node) {
          return ((value.node.rowIndex || 0) + 1).toString();
        } else {
          return '';
        }
      },
    },
    {
      field: 'typeNm',
      headerName: '유형',
      sortable: false,
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      sortable: false,
      minWidth: 200,
      maxWidth: 200,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'baseAmt',
      headerName: '단가',
      sortable: false,
      maxWidth: 70,
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'jobCnt',
      headerName: '수량',
      sortable: false,
      maxWidth: 50,
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'totAmt',
      headerName: '금액',
      sortable: false,
      maxWidth: 70,
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return Utils.setComma(params.data.baseAmt * params.data.jobCnt);
      },
    },
  ]);

  /** 우측 그리드 컬럼 정의 */
  const [BeingRegisteredDataCols, setBeingRegisteredDataCols] = useState<ColDef[]>([]);

  const {
    data: wrongInfo,
    isLoading: isWrongInfoLoading,
    isSuccess: isLoadingSuccess,
    refetch: fetchWrongInfo,
  } = useQuery({ queryKey: [selectedPagingElement.jobId], queryFn: () => authApi.get(`/orderInfo/wrong/${selectedPagingElement.jobId}`) });

  useEffect(() => {
    if (isLoadingSuccess) {
      const { resultCode, body, resultMessage } = wrongInfo.data;
      if (resultCode == 200) {
        const responded: WrongInfo = body;
        const respondedWrongBefInfos = responded.wrongBefInfo?.filter((prev) => prev.skuNm != undefined) || [];
        const respondedWrongAftInfos = responded.wrongAftInfo?.filter((prev) => prev.skuNm != undefined) || [];
        setJobStatus(responded.job);
        setWrongDetBefInfos(
          respondedWrongBefInfos.map((befInfo) => {
            if (responded.job?.jobType == 'C') {
              /** 작업구분 (10180) '매장' 일 시 */
              return { ...befInfo, typeNm: '매장' };
            } else {
              return befInfo;
            }
          }) || [],
        );
        setWrongDetAftInfos(
          respondedWrongAftInfos.map((aftInfo) => {
            if (responded.job?.jobType == 'C') {
              /** 작업구분 (10180) '매장' 일 시 */
              return { ...aftInfo, typeNm: '매장' };
            } else {
              return aftInfo;
            }
          }) || [],
        );

        /** 새로운 값을 반환받을 시 cellStyle 메서드, 메서드 내의 참조 상수를 재설정함으로서 반환받은 값을 기준으로 수량, 스큐 변환 감지, 스타일링 */
        setBeingRegisteredDataCols([
          {
            headerName: '선택',
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
            sortable: false,
            cellStyle: GridSetting.CellStyle.CENTER,
            suppressHeaderMenuButton: true,
            suppressKeyboardEvent: suppressDeleteKey,
            valueFormatter: (value) => {
              if (value.node) {
                return ((value.node.rowIndex || 0) + 1).toString();
              } else {
                return '';
              }
            },
          },
          {
            field: 'typeNm',
            headerName: '변경구분',
            maxWidth: 70,
            minWidth: 70,
            sortable: false,
            suppressHeaderMenuButton: true,
            suppressKeyboardEvent: suppressDeleteKey,
            cellStyle: (params) => {
              if (params.data && params.data.jobDetId && params.data.displayedJobCnt === params.data.jobCnt) {
                return { ...GridSetting.CellStyle.CENTER };
              } else {
                return { ...GridSetting.CellStyle.CENTER, color: 'red' };
              }
            },
            valueFormatter: (params) => {
              console.log('params.data', params.data);
              if (!params.data.jobDetId) {
                return '추가상품';
              } else if (params.data && params.data.displayedJobCnt > params.data.jobCnt) {
                return '수량추가';
              } else if (params.data && params.data.displayedJobCnt < params.data.jobCnt) {
                return '수랑감소';
              } else {
                return '수량동일';
              }
            },
          },
          {
            field: 'skuNm',
            headerName: '상품명',
            minWidth: 200,
            maxWidth: 200,
            sortable: false,
            suppressHeaderMenuButton: true,
            suppressKeyboardEvent: suppressDeleteKey,
            editable: (params) => {
              return params.node.rowIndex != null && params.data.skuNm == undefined;
            },
            cellStyle: GridSetting.CellStyle.LEFT,
          },
          {
            field: 'baseAmt',
            headerName: '단가',
            maxWidth: 60,
            minWidth: 60,
            sortable: false,
            suppressHeaderMenuButton: true,
            suppressKeyboardEvent: suppressDeleteKey,
            valueFormatter: (params) => {
              return Utils.setComma(params.value);
            },
            cellStyle: GridSetting.CellStyle.RIGHT,
          },
          {
            /** 응답값 타입에는 존재하지 않는 필드이나 jobCnt, chgCnt 를 조합한 값을 출력하고자 만든 column */
            field: 'displayedJobCnt',
            headerName: '수량',
            maxWidth: 60,
            minWidth: 60,
            sortable: false,
            suppressHeaderMenuButton: true,
            suppressKeyboardEvent: suppressDeleteKey,
            editable: true,
            cellStyle: (params) => {
              const nowValue = params.value;
              const filterData = wrongDetBefInfos.filter((leftData) => leftData.skuNm === params.data.skuNm);
              if (filterData && filterData.length > 0) {
                if (filterData[0].jobCnt !== nowValue) {
                  return { ...GridSetting.CellStyle.RIGHT, color: 'red' };
                } else {
                  return GridSetting.CellStyle.RIGHT;
                }
              } else {
                return GridSetting.CellStyle.RIGHT;
              }
            },
          },
          {
            field: 'totAmt',
            headerName: '금액',
            maxWidth: 70,
            minWidth: 70,
            sortable: false,
            cellStyle: GridSetting.CellStyle.RIGHT,
            suppressHeaderMenuButton: true,
            suppressKeyboardEvent: suppressDeleteKey,
            valueFormatter: (params) => {
              return Utils.setComma(params.value);
            },
          },
        ]);
      } else {
        toastError('오출고 정보 조회 도중 문제가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [wrongInfo, isWrongInfoLoading]);

  useEffect(() => {
    setTimeout(() => {
      if (!wrongDetAftInfos || wrongDetAftInfos.length == 0) {
        // after data 가 있을때는 복사하면 안된다.
        moveRightAll();
      }
    }, 500);
  }, [wrongDetBefInfos]);

  const onCellKeyDownOfAft = (event: CellKeyDownEvent | FullWidthCellKeyDownEvent) => {
    const keyBoardEvent = event.event as KeyboardEvent;
    const eventTriggeredRowIndex = event.rowIndex || 0;
    if ((event as CellKeyDownEvent).column.getColId() == 'skuNm') {
      if (keyBoardEvent.key == 'Backspace' || keyBoardEvent.key == 'Delete') {
        setWrongDetAftInfos((prevWrongDetAftInfo) => {
          return prevWrongDetAftInfo.filter((value, index) => {
            return index != eventTriggeredRowIndex;
          });
        });
      } else if (keyBoardEvent.key == 'ArrowDown') {
        if (eventTriggeredRowIndex == wrongDetAftInfos.length - 1 && wrongDetAftInfos[eventTriggeredRowIndex].skuNm != undefined) {
          setWrongDetAftInfos((prevWrongDetAftInfo) => {
            return [...prevWrongDetAftInfo, { jobCnt: 0, chgCnt: 0 }];
          });
          if (event.api.getFocusedCell()) {
            event.api.setFocusedCell(eventTriggeredRowIndex + 1, (event.api.getFocusedCell() as CellPosition).column);
          }
        }
      }
    }
  };

  const getRowClass = (params: RowClassParams) => {
    if (params.data.orderDetCd == ProductStatus.refund[0]) {
      return ProductStatus.refund[2];
    } else if (params.data.orderDetCd == ProductStatus.beforeDelivery[0]) {
      return ProductStatus.beforeDelivery[2];
    } else if (params.data.orderDetCd == ProductStatus.sample[0]) {
      return ProductStatus.sample[2];
    } else if (params.data.orderDetCd == ProductStatus.notDelivered[0]) {
      return ProductStatus.notDelivered[2];
    } else {
      return '';
    }
  };

  const getRightRowClass = (params: RowClassParams) => {
    const rightRow = params.data;
    if (!rightRow || !rightRow.skuId) return '';

    const isSameSkuNm = wrongDetBefInfos.some((leftData) => leftData.skuNm === rightRow.skuNm);
    if (isSameSkuNm) {
      return '';
    } else {
      return 'ag-grid-peach';
    }
  };

  const moveRight = () => {
    if (WrongDetBefGrid.current && WrongDetBefGrid.current.api.getSelectedNodes().length != 0) {
      /** 작업구분이 매장요청 인 경우 모든 상세 데이터를 이동할수 있다. */
      const aftInfos = [...wrongDetAftInfos.filter((prev) => prev.skuNm != undefined)];
      for (let i = 0; i < WrongDetBefGrid.current.api.getSelectedNodes().length; i++) {
        const wrongDet = WrongDetBefGrid.current.api.getSelectedNodes()[i].data as WrongDetBefInfo;
        if (wrongDet.orderDetCd == '90' || wrongDet.orderDetCd == '99' || wrongDet.orderDetCd == '50' || (jobStatus && jobStatus.jobType == 'C')) {
          /** 주문상태가 '판매', '미송', '샘플' 이거나 작업구분이 매장요청(매장분요청) 인 경우 우측으로 이동 가능 */
          aftInfos[aftInfos.length] = { ...wrongDet, chgCnt: 0 };
        } else {
          if (wrongDet.jobType !== 'C') {
            toastError('주문상태가 판매, 미송, 샘플에 해당하지 않을 시 본 동작을 행할 수 없습니다.[' + wrongDet.jobType + ']');
          }
          return;
        }
      }
      setWrongDetAftInfos(aftInfos);
      /*setWrongDetAftInfos(
        aftInfos.map((value, index) => {
          return { ...value, chgCnt: 0 };
        }),
      );*/
    } else {
      toastError('옮길 데이터를 선택하십시요.');
    }
  };

  const moveRightAll = () => {
    if (WrongDetBefGrid.current && wrongDetAftInfos.length == 0) {
      const aftInfos = [...wrongDetAftInfos];
      WrongDetBefGrid.current.api.forEachNode((node: any) => {
        const wrongDet = node.data as WrongDetBefInfo;
        if (wrongDet.orderDetCd == '90' || wrongDet.orderDetCd == '99' || wrongDet.orderDetCd == '50' || (jobStatus && jobStatus.jobType == 'C')) {
          // 주문상태가 '판매', '미송', '샘플' 이거나 작업구분이 매장요청인 경우
          aftInfos.push({ ...wrongDet, chgCnt: 0, wrongTranCd: 'N' });
        } else {
          if (wrongDet.jobType !== 'C') {
            toastError('주문상태가 판매, 미송, 샘플에 해당하지 않을 시 본 동작을 행할 수 없습니다.[' + wrongDet.jobType + ']');
          }
          return;
        }
      });
      setWrongDetAftInfos(aftInfos);
    }
  };

  return (
    <PopupLayout
      width={1160}
      isEscClose={true}
      open={modalType.type === 'REG_WRONG' && modalType.active}
      title={'오출고 등록'}
      onClose={() => {
        closeModal('REG_WRONG');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button
              className="btn"
              title="등록"
              onClick={() => {
                if (selectedPagingElement && selectedPagingElement.jobId) {
                  /** 기존 데이터와 비교하여 변경 여부 확인 후 동작 */
                  let changed = false;
                  const fetchedAftInfos: WrongDetAftInfo[] = wrongInfo?.data.body.wrongAftInfo || [];
                  const usedAftInfos = wrongDetAftInfos.filter((detAft) => !!detAft.skuNm);
                  if (fetchedAftInfos.length == usedAftInfos.length) {
                    for (let i = 0; i < fetchedAftInfos.length; i++) {
                      if (jobStatus && jobStatus.jobType != 'C' && fetchedAftInfos[i].orderDetCd != usedAftInfos[i].orderDetCd) {
                        // 작업구분이 '매장요청' 이 아닌 경우 주문상세코드 비교
                        changed = true;
                        console.log('orderDetCd');
                      } else if (fetchedAftInfos[i].skuId != usedAftInfos[i].skuId) {
                        // 스큐 변경 여부
                        changed = true;
                        console.log('skuId');
                      } else if (fetchedAftInfos[i].chgCnt != usedAftInfos[i].chgCnt) {
                        // 수량 변경 여부
                        changed = true;
                        console.log('chgCnt');
                      } else if (fetchedAftInfos[i].wrongTranCd != usedAftInfos[i].wrongTranCd) {
                        // 처리구분 변경 여부
                        changed = true;
                        console.log('wrongTranCd');
                      }
                    }
                  } else {
                    // 요소가 추가 혹은 삭제됨
                    changed = true;
                  }
                  console.log(usedAftInfos);
                  if (changed) {
                    registerWrongInfo({
                      wrong: { jobId: selectedPagingElement.jobId as number },
                      wrongDetList: usedAftInfos,
                    }).then((result) => {
                      const { resultCode, resultMessage } = result.data;
                      if (resultCode == 200) {
                        toastSuccess('등록되었습니다.');
                        fetchWrongInfo();
                        setTimeout(() => {
                          closeModal('REG_WRONG');
                        }, 1500); // 1.5초
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
              }}
            >
              등록
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('REG_WRONG')}>
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
          {/* 왼쪽 */}
          <div className="layout50">
            <div className="gridBox">
              <div style={{ height: '30px' }}>
                <h3>
                  {(selectedPagingElement.sellerNm || '소매처 정보 없음') +
                    ' (' +
                    (selectedPagingElement.jobTypeNm || '작업유형 정보 없음') +
                    ') - ' +
                    (selectedPagingElement.tranYmd || '예정일 정보 없음') +
                    ' ' +
                    ('#' + selectedPagingElement.no)}
                </h3>
              </div>
              <TunedGrid
                headerHeight={35}
                onGridReady={(e) => {
                  e.api.sizeColumnsToFit();
                }}
                getRowStyle={(params) => {
                  if (params.data.delYn == 'Y') {
                    return { backgroundColor: '#A4A4A4' };
                  }
                }}
                rowData={wrongDetBefInfos}
                columnDefs={OriginDataCols}
                defaultColDef={defaultColDef}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                ref={WrongDetBefGrid}
                className={'pop'}
                getRowClass={getRowClass}
              />
            </div>
          </div>
          {/* 오른쪽 */}
          <div className="layout50">
            <div className="gridBox">
              <div className="btnArea right">
                {/*
                <button className="btn" title="옮기기" onClick={moveRight}>
                  옮기기
                </button>
*/}
                <button
                  className="btn"
                  title="추가"
                  onClick={() => {
                    if (wrongDetAftInfos.length == 0) {
                      setWrongDetAftInfos([{ jobCnt: 0, chgCnt: 0 }]);
                    } else {
                      if (wrongDetAftInfos[wrongDetAftInfos.length - 1].skuNm != undefined) {
                        setWrongDetAftInfos([...wrongDetAftInfos, { jobCnt: 0, chgCnt: 0 }]);
                      }
                    }
                    setSkuSearchPopEnabled(true);
                  }}
                >
                  추가
                </button>
                {/*
                <button
                  className="btn"
                  title="미송"
                  onClick={() => {
                    const selectedNodes = WrongDetAftGrid.current?.api.getSelectedNodes() || [];
                    const aftInfos = [...wrongDetAftInfos]; // 새로운 참조 없이 배열 내부 요소만 수정할 시 상태 변경이 감지되지 않으므로 리 랜더링되지 않음
                    for (let i = 0; i < selectedNodes.length; i++) {
                      if (selectedNodes[i].rowIndex != null) {
                        aftInfos[selectedNodes[i].rowIndex as number] = { ...aftInfos[selectedNodes[i].rowIndex as number], wrongTranCd: 'M', typeNm: '미송' };
                      }
                    }
                    setWrongDetAftInfos(aftInfos);
                  }}
                >
                  미송
                </button>
*/}
              </div>
              <TunedGrid
                rowData={wrongDetAftInfos.map((info: any, index) => {
                  return {
                    ...info,
                    no: index + 1,
                    displayedJobCnt: info.jobCnt + info.chgCnt,
                    totAmt: (info.jobCnt + info.chgCnt) * info.baseAmt,
                  };
                })}
                columnDefs={BeingRegisteredDataCols}
                defaultColDef={defaultColDef}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                getRowStyle={(params) => {
                  if (params.data.orderDetCd == '99' || params.data.orderDetCd == '40') {
                    // 10140 미송 혹은 반품
                    return { backgroundColor: '#BDBDBD' };
                  }
                  return undefined;
                }}
                onCellKeyDown={onCellKeyDownOfAft}
                getRowClass={getRightRowClass}
                /*
                onCellDoubleClicked={(e) => {
                  if (e.column.getColId() == 'skuNm' && e.rowIndex != null && !!wrongDetAftInfos[e.rowIndex].skuNm) {
                    setSkuSearchPopEnabled(true);
                    openPurpose.current.purpose = 'mod';
                    openPurpose.current.index = e.rowIndex;
                  }
                }}
                */
                onCellEditingStopped={(e) => {
                  if (e.column.getColId() == 'skuNm' && e.rowIndex != null) {
                    // 검색 키워드 갱신 todo 스큐 추가도 가능한지 확인, 본 로직 사용하여 구현
                    setSkuSearchPopEnabled(true);
                    openPurpose.current.purpose = 'add';
                    openPurpose.current.searchWord = e.value;
                    openPurpose.current.index = e.rowIndex;
                  } else {
                    if (e.column.getColId() == 'displayedJobCnt') {
                      const infos = JSON.parse(JSON.stringify(wrongDetAftInfos)); // 깊은 복사를 통하여 새로운 배열 리턴, 그리드 데이터 동기화
                      for (let i = 0; i < infos.length; i++) {
                        if (i == e.rowIndex) {
                          infos[i] = {
                            ...infos[i],
                            chgCnt: e.newValue - (infos[i].jobCnt || 0),
                            wrongTranCd: 'C' /* 10450 "수량변경" */,
                          };
                        }
                      }
                      setWrongDetAftInfos(infos);
                    }
                  }
                }}
                ref={WrongDetAftGrid}
                className={'pop'}
              />
            </div>
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
            onSelected={(count, list) => {
              if (openPurpose.current.purpose == 'mod') {
                // 수정 영역
                setWrongDetAftInfos(
                  wrongDetAftInfos.map((info: WrongDetAftInfo, index) => {
                    if (index == openPurpose.current.index) {
                      return {
                        ...info,
                        skuId: list[0].skuId,
                        skuNm: list[0].skuNm,
                        chgCnt: count - (info.jobCnt || 0),
                        displayedJobCnt: count,
                        wrongTranCd: info.wrongTranCd,
                      };
                    } else {
                      return {
                        ...info,
                      };
                    }
                  }),
                );
              } else {
                // 추가
                if (jobStatus) {
                  setWrongDetAftInfos((prevState) => {
                    const modifiedState: any[] = [...prevState.filter((prev) => prev.skuNm != undefined)];
                    for (let i = 0; i < list.length; i++) {
                      modifiedState[modifiedState.length] = {
                        skuId: list[i].skuId,
                        skuNm: list[i].skuNm,
                        jobCnt: count,
                        jobType: jobStatus.jobType, // 기존 jobType 을 영속
                        chgCnt: 0,
                        baseAmt: (list[i].sellAmt || 0) - (list[i].dcAmt || 0) || 0, // 단가(원가에서 소매처별 특가 공재)
                        totAmt: ((list[i].sellAmt || 0) - (list[i].dcAmt || 0)) * count || 0,
                        typeNm: '판매',
                        orderDetCd: jobStatus.jobType == 'D' ? '50' : '90', // 작업구분 샘플 (10180) 일 경우 주문상세 코드에 반영
                        wrongTranCd: jobStatus.jobType == 'D' ? 'S' : 'D', // 작업구분 샘플 (10180) 일 경우 역시 (오출고)처리구분 코드에 반영
                      };
                    }
                    console.log(modifiedState);
                    return modifiedState;
                  });
                } else {
                  console.error('오출고 등록에 필요한 작업 정보를 찾을 수 없음');
                }
              }
            }}
          />
        )}
      </PopupContent>
    </PopupLayout>
  );
};
