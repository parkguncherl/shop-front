import { useTranslation } from 'react-i18next';
import React, { useRef } from 'react';
import ModalLayout from '../../ModalLayout';
import { PopupContent } from '../PopupContent';
import { Button } from '../../Button';
import { PopupFooter } from '../PopupFooter';
import styles from './../../../styles/dashboard/main.module.scss';
import { CheckBox } from '../../CheckBox';
import { useDashboardStore } from '../../../stores/useDashboardStore';

interface Props {
  open: boolean;
  onConfirm?: () => void;
  onClose: () => void;
}

/** 대시보드 메인 - 위젯편집 팝업 */
const EditWidget = ({ open, onClose }: Props) => {
  const { t } = useTranslation();
  const el = useRef<HTMLDListElement | null>(null);

  const [
    claimCounts,
    onChangeClaimCounts,
    claimTreatCounts,
    onChangeClaimTreatCounts,
    claimPostEvents,
    onChangeClaimPostEvents,
    claimServerEvents,
    onChangeClaimServerEvents,
    claimTreatTimes,
    onChangeClaimTreatTimes,
    claimCosts,
    onChangeClaimCosts,
    claimBreakVsObstacles,
    onChangeClaimBreakVsObstacles,
    claimBreakVsObstacleCosts,
    onChangeClaimBreakVsObstacleCosts,
    claimBreakVsObstacleTimes,
    onChangeClaimBreakVsObstacleTimes,
    unitBreakPosts,
    onChangeUnitBreakPosts,
    unitBreakBanks,
    onChangeUnitBreakBanks,
    unitEfficiencyPosts,
    onChangeUnitEfficiencyPosts,
    unitEfficiencyBanks,
    onChangeUnitEfficiencyBanks,
    unitBreakStations,
    onChangeUnitBreakStations,
    unitChangeRates,
    onChangeUnitChangeRates,
  ] = useDashboardStore((s) => [
    s.claimCounts,
    s.onChangeClaimCounts,
    s.claimTreatCounts,
    s.onChangeClaimTreatCounts,
    s.claimPostEvents,
    s.onChangeClaimPostEvents,
    s.claimServerEvents,
    s.onChangeClaimServerEvents,
    s.claimTreatTimes,
    s.onChangeClaimTreatTimes,
    s.claimCosts,
    s.onChangeClaimCosts,
    s.claimBreakVsObstacles,
    s.onChangeClaimBreakVsObstacles,
    s.claimBreakVsObstacleCosts,
    s.onChangeClaimBreakVsObstacleCosts,
    s.claimBreakVsObstacleTimes,
    s.onChangeClaimBreakVsObstacleTimes,
    s.unitBreakPosts,
    s.onChangeUnitBreakPosts,
    s.unitBreakBanks,
    s.onChangeUnitBreakBanks,
    s.unitEfficiencyPosts,
    s.onChangeUnitEfficiencyPosts,
    s.unitEfficiencyBanks,
    s.onChangeUnitEfficiencyBanks,
    s.unitBreakStations,
    s.onChangeUnitBreakStations,
    s.unitChangeRates,
    s.onChangeUnitChangeRates,
  ]);

  return (
    <dl ref={el} style={{ padding: 0 }}>
      <form>
        <ModalLayout
          width={600}
          open={open}
          title={t('위젯편집') || ''}
          onClose={onClose}
          footer={
            <PopupFooter>
              <div className={'btnArea'}>
                <button className={'btn'} onClick={onClose}>
                  {t('닫기') || ''}
                </button>
              </div>
            </PopupFooter>
          }
        >
          <PopupContent>
            <div className={styles.tbl_group}>
              <div className={styles.tbl_box}>
                <table>
                  <caption>{t('위젯 테이블') || ''}</caption>
                  <colgroup>
                    <col width={'45%'} />
                    <col width={'45%'} />
                    <col width={'10%'} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope={'col'}>{t('모니터링') || ''}</th>
                      <th scope={'col'}>{t('모니터링 세부목록') || ''}</th>
                      <th scope={'col'}>DISPLAY</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td rowSpan={9}>{t('클레임조치 현황') || ''}</td>
                      <td className={'agn_l'}>{t('발생 구분 현황') || ''}</td>
                      <td>
                        <CheckBox
                          checked={claimCounts}
                          onChange={(e) => {
                            onChangeClaimCounts(e.target.checked);
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={'agn_l'}>{t('조치 구분 현황') || ''}</td>
                      <td>
                        <CheckBox
                          checked={claimTreatCounts}
                          onChange={(e) => {
                            onChangeClaimTreatCounts(e.target.checked);
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={'agn_l'}>{t('충전기 이벤트(고장) TOP 10') || ''}</td>
                      <td>
                        <CheckBox
                          checked={claimPostEvents}
                          onChange={(e) => {
                            onChangeClaimPostEvents(e.target.checked);
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={'agn_l'}>{t('알람 이벤트(알람) TOP 10') || ''}</td>
                      <td>
                        <CheckBox
                          checked={claimServerEvents}
                          onChange={(e) => {
                            onChangeClaimServerEvents(e.target.checked);
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={'agn_l'}>{t('조치일 TOP 10') || ''}</td>
                      <td>
                        <CheckBox
                          checked={claimTreatTimes}
                          onChange={(e) => {
                            onChangeClaimTreatTimes(e.target.checked);
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={'agn_l'}>{t('조치비용 TOP 10') || ''}</td>
                      <td>
                        <CheckBox
                          checked={claimCosts}
                          onChange={(e) => {
                            onChangeClaimCosts(e.target.checked);
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={'agn_l'}>
                        {t('고장율') || ''} / {t('장애율') || ''}
                      </td>
                      <td>
                        <CheckBox
                          checked={claimBreakVsObstacles}
                          onChange={(e) => {
                            onChangeClaimBreakVsObstacles(e.target.checked);
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={'agn_l'}>
                        {t('고장조치비용') || ''} / {t('장애조치비용') || ''}
                      </td>
                      <td>
                        <CheckBox
                          checked={claimBreakVsObstacleCosts}
                          onChange={(e) => {
                            onChangeClaimBreakVsObstacleCosts(e.target.checked);
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={'agn_l'}>
                        {t('고장조치일') || ''} / {t('장애조치일') || ''}
                      </td>
                      <td>
                        <CheckBox
                          checked={claimBreakVsObstacleTimes}
                          onChange={(e) => {
                            onChangeClaimBreakVsObstacleTimes(e.target.checked);
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td rowSpan={6}>{t('부품 교환 현황') || ''}</td>
                      <td className={'agn_l'}>{t('부품교환 TOP 10 (포스트)') || ''}</td>
                      <td>
                        <CheckBox
                          checked={unitBreakPosts}
                          onChange={(e) => {
                            onChangeUnitBreakPosts(e.target.checked);
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={'agn_l'}>{t('부품교환 TOP 10 (뱅크)') || ''}</td>
                      <td>
                        <CheckBox
                          checked={unitBreakBanks}
                          onChange={(e) => {
                            onChangeUnitBreakBanks(e.target.checked);
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={'agn_l'}>{t('사용효율낮은부품 TOP 10 (포스트)') || ''}</td>
                      <td>
                        <CheckBox
                          checked={unitEfficiencyPosts}
                          onChange={(e) => {
                            onChangeUnitEfficiencyPosts(e.target.checked);
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={'agn_l'}>{t('사용효율낮은부품 TOP 10 (뱅크)') || ''}</td>
                      <td>
                        <CheckBox
                          checked={unitEfficiencyBanks}
                          onChange={(e) => {
                            onChangeUnitEfficiencyBanks(e.target.checked);
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={'agn_l'}>{t('충전소부품교환 TOP 10') || ''}</td>
                      <td>
                        <CheckBox
                          checked={unitBreakStations}
                          onChange={(e) => {
                            onChangeUnitBreakStations(e.target.checked);
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={'agn_l'}>{t('부품 교환 목적 비율(%)') || ''}</td>
                      <td>
                        <CheckBox
                          checked={unitChangeRates}
                          onChange={(e) => {
                            onChangeUnitChangeRates(e.target.checked);
                          }}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </PopupContent>
        </ModalLayout>
      </form>
    </dl>
  );
};

export default React.memo(EditWidget);
