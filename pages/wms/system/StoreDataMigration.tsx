import React, { useEffect, useState } from 'react';
import { Table, Title } from '../../../components';
import { toastError, toastSuccess } from '../../../components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCommonStore } from '../../../stores';
import { PartnerResponseSelect } from '../../../generated';
import { DataListDropDown } from '../../../components/DataListDropDown';
import { fetchPartners, removeProduct, removeRetail } from '../../../api/wms-api';
import { useRouter } from 'next/router';
import { DataMigrationExcelUploadPop } from '../../../components/popup/wms/system/storedatamigration/DataMigrationExcelUploadPop';
import { MigrationTemplate } from '../../../components/popup/wms/system/storedatamigration/migrationTemplate';
import DataMigrationComponent from '../../../components/wms/system/DataMigrationComponent';
import { useStoreDataMigrationStore } from '../../../stores/wms/useStoreDataMigrationStore';
import { useSession } from 'next-auth/react';

/**
 * 데이터 이관 컴포넌트
 * @description 엑셀 업로드/다운로드 기능을 통해 데이터 이관을 처리하는 컴포넌트입니다.
 */
const StoreDataMigration = () => {
  /**
   * Hooks & States
   */
  const { upMenuNm, menuNm } = useCommonStore();
  const [getMigInfo, removeFactory] = useStoreDataMigrationStore((s) => [s.getMigInfo, s.removeFactory]);
  const [transTp, setTransTp] = useState<string>();
  const [showExcelUploadPopup, setShowExcelUploadPopup] = useState(false);
  const [selectPartnerId, setSelectPartnerId] = useState<number>();
  const [sellerMigInfo, setSellerMigInfo] = useState<string>('');
  const [factoryMigInfo, setFactoryMigInfo] = useState<string>('');
  const [prodMigInfo, setProdMigInfo] = useState<string>('');

  /**
   * Event Handlers
   */
  // 엑셀 업로드 팝업 제어
  const openExcelUploadPopup = (type: string) => {
    if (!selectedPartner) {
      toastError('화주를 먼저 선택해주세요');
      return;
    }
    setTransTp(type);
    setShowExcelUploadPopup(true);
  };

  const getMigInfoFn = () => {
    if (selectPartnerId && selectPartnerId > 0) {
      getMigInfo(selectPartnerId).then((migration: any) => {
        setSellerMigInfo(migration.data.body.sellerInfo || '');
        setFactoryMigInfo(migration.data.body.factoryInfo || '');
        setProdMigInfo(migration.data.body.prodInfo || '');
        console.log('migration ====>', migration);
      });
    }
  };

  const handleChangePartner = (option: any) => {
    setSelectedPartner(option);
    setSelectPartnerId(option.value);
  };

  useEffect(() => {
    if (selectPartnerId && selectPartnerId > 0) {
      getMigInfoFn();
    }
  }, [selectPartnerId]);

  const router = useRouter();

  const deleteData = (type: string) => {
    if (!selectPartnerId) {
      toastError('삭제하기전 먼저 화주를 선택해주세요');
      return;
    }

    if (confirm('등록한 생산처 데이타를 전부 삭제하시겠습니까?')) {
      if (type === '상품') {
        deleteProdMutate(selectPartnerId);
      } else if (type === '판매처') {
        removeRetailMutate(selectPartnerId);
      } else if (type === '생산처') {
        removeFactoryMutate(selectPartnerId);
      }
    }
  };
  /**
   *  API
   */
  // 화주옵션 조회
  const [partnerOption, setPartnerOption] = useState<any>([]);
  const [selectedPartner, setSelectedPartner] = useState(0);
  const session = useSession();
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;
  const { data: partners, isSuccess: isFetchPartnerSuccess } = useQuery(['fetchPartners'], () => fetchPartners(workLogisId));
  useEffect(() => {
    if (isFetchPartnerSuccess && partners) {
      const { resultCode, body, resultMessage } = partners.data;
      if (resultCode === 200) {
        const partnerCodes = body?.map((item: PartnerResponseSelect) => ({
          value: item.id,
          label: item.partnerNm,
        }));
        setPartnerOption(partnerCodes);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchPartnerSuccess, partners]);

  /** 상품 삭제 */
  const { mutate: deleteProdMutate } = useMutation(removeProduct, {
    onSuccess: async (e) => {
      if (e?.data.resultCode === 200) {
        toastSuccess('등록한 상품 및 스큐를 모두 삭제 하였습니다.');
        getMigInfoFn();
      } else {
        toastError(e?.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error('상품삭제 처리 중 오류:', err);
      toastError('상품삭제 중 오류가 발생하였습니다.');
    },
  });

  /** 상품 삭제 */
  const { mutate: removeRetailMutate } = useMutation(removeRetail, {
    onSuccess: async (e) => {
      if (e?.data.resultCode === 200) {
        toastSuccess('등록한 소매처를 모두 삭제 하였습니다.');
        getMigInfoFn();
      } else {
        toastError(e?.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error('소매처 삭제 처리 중 오류:', err);
      toastError('소매처 삭제 중 오류가 발생하였습니다.');
    },
  });

  /** 생산처 삭제 */
  const { mutate: removeFactoryMutate } = useMutation(removeFactory, {
    onSuccess: async (e) => {
      if (e?.data.resultCode === 200) {
        toastSuccess('등록한 생산처를 모두 삭제 하였습니다.');
        getMigInfoFn();
      } else {
        toastError(e?.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error('소매처 삭제 처리 중 오류:', err);
      toastError('소매처 삭제 중 오류가 발생하였습니다.');
    },
  });

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} detail={true} />
      {/* 상단 부분 */}
      <div className="searchBox">
        <div className="searchArea">
          <table>
            <colgroup>
              <col width="20%" />
              <col width="30%" />
              <col width="20%" />
              <col width="30%" />
            </colgroup>
            <tbody>
              <tr>
                <th scope="row">
                  <label>1. 화주생성 및 설정</label>
                </th>
                <td>
                  <div className="formBox">
                    <button className="btn" onClick={() => router.push('/wms/system/partnerMng')}>
                      바로가기
                    </button>
                  </div>
                </td>
                <th scope="row">
                  <label>2. 화주계정생성</label>
                </th>
                <td>
                  <div className="formBox">
                    <button className="btn" onClick={() => router.push('/system/accountMng')}>
                      바로가기
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="smallTitle mt10">대상화주</div>
      {/* 화주 검색 필드 */}
      <Table>
        <div className="tblBox mt5">
          <table>
            <colgroup>
              <col width="10%" />
              <col width="15%" />
              <col width="10%" />
              <col width="15%" />
              <col width="10%" />
              <col width="15%" />
              <col width="10%" />
              <col width="15%" />
            </colgroup>
            <tbody>
              <tr>
                <th scope="row">
                  <label>대상 화주 선택</label>
                  <span className="req">*</span>
                </th>
                <td>
                  <div className="formBox">
                    <DataListDropDown
                      name={'partnerId'}
                      value={selectedPartner}
                      onChange={handleChangePartner}
                      options={partnerOption}
                      placeholder="화주 선택"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Table>

      <div className="smallTitle mt10">기초데이타</div>
      <Table>
        <div className="tblBox mt5">
          <table>
            <colgroup>
              <col width="10%" />
              <col width="20%" />
              <col width="10%" />
              <col width="20%" />
              <col width="10%" />
              <col width="20%" />
            </colgroup>
            <tbody>
              <tr>
                {/*기초데이타 항목*/}
                {MigrationTemplate?.map((item, index) => {
                  if (item.type === '생산처' || item.type === '판매처' || item.type === '상품') {
                    return (
                      <>
                        <th scope="row">
                          <label>{item.type}</label>
                          {item.type === '판매처' && sellerMigInfo}
                          {item.type === '생산처' && factoryMigInfo}
                          {item.type === '상품' && prodMigInfo}
                        </th>
                        <td>
                          <div className="formBox">
                            <div className="btnArea right">
                              <button className="btn btnGreen" onClick={() => openExcelUploadPopup(item.typeCd as string)}>
                                엑셀업로드
                              </button>
                              {item.type === '생산처' && (
                                <button className="btn btnGreen" onClick={() => deleteData('생산처')}>
                                  삭제
                                </button>
                              )}
                              {item.type === '상품' && (
                                <button className="btn btnGreen" onClick={() => deleteData('상품')}>
                                  삭제
                                </button>
                              )}
                              {item.type === '판매처' && (
                                <button className="btn btnGreen" onClick={() => deleteData('판매처')}>
                                  삭제
                                </button>
                              )}
                              {/*<Button className="btn btnGray disabled" onClick={fetchExcelData} disabled={true}>*/}
                              {/*  엑셀다운로드*/}
                              {/*</Button>*/}
                            </div>
                          </div>
                        </td>
                      </>
                    );
                  }
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </Table>

      <div className="smallTitle mt10">작업데이타</div>
      <Table>
        <div className="tblBox mt5">
          <table>
            <colgroup>
              <col width="10%" />
              <col width="20%" />
              <col width="10%" />
              <col width="20%" />
              <col width="10%" />
              <col width="20%" />
            </colgroup>
            <tbody>
              <tr>
                {/*작업데이타 항목*/}
                {MigrationTemplate?.map((item, index) => {
                  if (item.type === '샘플미회수' || item.type === '미송' || item.type === '부가세미입금') {
                    return (
                      <>
                        <th scope="row">
                          <label>{item.type}</label>
                        </th>
                        <td>
                          <div className="formBox">
                            <div className="btnArea right">
                              <button className="btn btnGreen" onClick={() => openExcelUploadPopup(item.typeCd as string)}>
                                엑셀업로드
                              </button>
                              {/*<Button className="btn btnGray disabled" onClick={fetchExcelData} disabled={true}>*/}
                              {/*  엑셀다운로드*/}
                              {/*</Button>*/}
                            </div>
                          </div>
                        </td>
                      </>
                    );
                  }
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </Table>

      <div className="smallTitle mt10">과거이력 데이타</div>
      <Table>
        <div className="tblBox mt5">
          <table>
            <colgroup>
              <col width="10%" />
              <col width="10%" />
              <col width="10%" />
              <col width="10%" />
              <col width="10%" />
              <col width="10%" />
              <col width="10%" />
              <col width="10%" />
            </colgroup>
            <tbody>
              <tr>
                {/*작업데이타 항목*/}
                {MigrationTemplate?.map((item, index) => {
                  if (item.type === '판매원장' || item.type === '샘플회수' || item.type === '미송발송' || item.type === '입고원장') {
                    return (
                      <>
                        <th scope="row">
                          <label>{item.type}</label>
                        </th>
                        <td>
                          <div className="formBox">
                            <div className="btnArea right">
                              <button className="btn btnGreen" onClick={() => openExcelUploadPopup(item.typeCd as string)}>
                                엑셀업로드
                              </button>
                              {/*<Button className="btn btnGray disabled" onClick={fetchExcelData} disabled={true}>*/}
                              {/*  엑셀다운로드*/}
                              {/*</Button>*/}
                            </div>
                          </div>
                        </td>
                      </>
                    );
                  }
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </Table>

      {/* 엑셀 업로드 팝업 컴포넌트 */}
      {showExcelUploadPopup && (
        <DataMigrationExcelUploadPop transTp={transTp} partnerId={selectPartnerId as number} onClose={() => setShowExcelUploadPopup(false)} />
      )}
      {/*{excelDatas?.length > 0 && <ExcelDownload data={excelDatas} fileName="적치위치설정" initData={setExcelDatas} />}*/}

      {/* Ag Grid 목록 컴포넌트 */}
      <div style={{ marginTop: '50px' }}>
        <DataMigrationComponent />
      </div>
    </div>
  );
};

export default StoreDataMigration;
