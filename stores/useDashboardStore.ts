import { create, StateCreator } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface DashboardState {
  refreshDuration?: string | number;
  onChangeRefreshDuration: (duration: string | number) => void;
  duration: number;
  onChangeDuration: (duration: number) => void;
  claimCounts?: boolean; // 클레임조치 모니터링 - 발생 구분 현황
  onChangeClaimCounts: (visible: boolean) => void; // 클레임조치 모니터링 - 발생 구분 현황
  claimTreatCounts?: boolean; // 클레임조치 모니터링 - 조치 구분 현황
  onChangeClaimTreatCounts: (visible: boolean) => void; // 클레임조치 모니터링 - 조치 구분 현황
  claimPostEvents?: boolean; // 클레임조치 모니터링 - 충전기 이벤트(고장) TOP 10
  onChangeClaimPostEvents: (visible: boolean) => void; // 클레임조치 모니터링 - 충전기 이벤트(고장) TOP 10
  claimServerEvents?: boolean; // 클레임조치 모니터링 - 알람 이벤트(알람) TOP 10
  onChangeClaimServerEvents: (visible: boolean) => void; // 클레임조치 모니터링 - 알람 이벤트(알람) TOP 10
  claimTreatTimes?: boolean; // 클레임조치 모니터링 - 조치시간 TOP 10
  onChangeClaimTreatTimes: (visible: boolean) => void; // 클레임조치 모니터링 - 조치시간 TOP 10
  claimCosts?: boolean; // 클레임조치 모니터링 - 조치비용 TOP 10
  onChangeClaimCosts: (visible: boolean) => void; // 클레임조치 모니터링 - 조치비용 TOP 10
  claimBreakVsObstacles?: boolean; // 클레임조치 모니터링 - 고장율 / 장애율
  onChangeClaimBreakVsObstacles: (visible: boolean) => void; // 클레임조치 모니터링 - 고장율 / 장애율
  claimBreakVsObstacleCosts?: boolean; // 클레임조치 모니터링 - 고장조치비용 / 장애조치비용
  onChangeClaimBreakVsObstacleCosts: (visible: boolean) => void; // 클레임조치 모니터링 - 고장조치비용 / 장애조치비용
  claimBreakVsObstacleTimes?: boolean; // 클레임조치 모니터링 - 고장조치시간 / 장애조치시간
  onChangeClaimBreakVsObstacleTimes: (visible: boolean) => void; // 클레임조치 모니터링 - 고장조치시간 / 장애조치시간
  unitBreakPosts?: boolean; // 부품 모니터링 - 부품교환 TOP 10 (포스트)
  onChangeUnitBreakPosts: (visible: boolean) => void; // 부품 모니터링 - 부품교환 TOP 10 (포스트)
  unitBreakBanks?: boolean; // 부품 모니터링 - 부품교환 TOP 10 (뱅크)
  onChangeUnitBreakBanks: (visible: boolean) => void; // 부품 모니터링 - 부품교환 TOP 10 (뱅크)
  unitEfficiencyPosts?: boolean; // 부품 모니터링 - 사용효율낮은부품 TOP 10 (포스트)
  onChangeUnitEfficiencyPosts: (visible: boolean) => void; // 부품 모니터링 - 사용효율낮은부품 TOP 10 (포스트)
  unitEfficiencyBanks?: boolean; // 부품 모니터링 - 사용효율낮은부품 TOP 10 (뱅크)
  onChangeUnitEfficiencyBanks: (visible: boolean) => void; // 부품 모니터링 - 사용효율낮은부품 TOP 10 (뱅크)
  unitBreakStations?: boolean; // 부품 모니터링 - 충전소부품교환 TOP 10
  onChangeUnitBreakStations: (visible: boolean) => void; // 부품 모니터링 - 충전소부품교환 TOP 10
  unitChangeRates?: boolean; // 부품 모니터링 - 부품 교환 목적 비율(%)
  onChangeUnitChangeRates: (visible: boolean) => void; // 부품 모니터링 - 부품 교환 목적 비율(%)
}

const initialStateCreator: StateCreator<DashboardState, any> = (set, get, api) => {
  return {
    refreshDuration: 0,
    onChangeRefreshDuration: (duration: string | number) => {
      set((state) => ({
        ...state,
        refreshDuration: duration,
      }));
    },
    duration: 0,
    onChangeDuration: (duration: number) => {
      set((state) => ({
        ...state,
        duration: duration,
      }));
    },
    claimCounts: true,
    onChangeClaimCounts: (visible: boolean) => {
      set((state) => ({
        ...state,
        claimCounts: visible,
      }));
    },
    claimTreatCounts: true,
    onChangeClaimTreatCounts: (visible: boolean) => {
      set((state) => ({
        ...state,
        claimTreatCounts: visible,
      }));
    },
    claimPostEvents: true,
    onChangeClaimPostEvents: (visible: boolean) => {
      set((state) => ({
        ...state,
        claimPostEvents: visible,
      }));
    },
    claimServerEvents: true,
    onChangeClaimServerEvents: (visible: boolean) => {
      set((state) => ({
        ...state,
        claimServerEvents: visible,
      }));
    },
    claimTreatTimes: true,
    onChangeClaimTreatTimes: (visible: boolean) => {
      set((state) => ({
        ...state,
        claimTreatTimes: visible,
      }));
    },
    claimCosts: true,
    onChangeClaimCosts: (visible: boolean) => {
      set((state) => ({
        ...state,
        claimCosts: visible,
      }));
    },
    claimBreakVsObstacles: true,
    onChangeClaimBreakVsObstacles: (visible: boolean) => {
      set((state) => ({
        ...state,
        claimBreakVsObstacles: visible,
      }));
    },
    claimBreakVsObstacleCosts: true,
    onChangeClaimBreakVsObstacleCosts: (visible: boolean) => {
      set((state) => ({
        ...state,
        claimBreakVsObstacleCosts: visible,
      }));
    },
    claimBreakVsObstacleTimes: true,
    onChangeClaimBreakVsObstacleTimes: (visible: boolean) => {
      set((state) => ({
        ...state,
        claimBreakVsObstacleTimes: visible,
      }));
    },
    unitBreakPosts: true,
    onChangeUnitBreakPosts: (visible: boolean) => {
      set((state) => ({
        ...state,
        unitBreakPosts: visible,
      }));
    },
    unitBreakBanks: true,
    onChangeUnitBreakBanks: (visible: boolean) => {
      set((state) => ({
        ...state,
        unitBreakBanks: visible,
      }));
    },
    unitEfficiencyPosts: true,
    onChangeUnitEfficiencyPosts: (visible: boolean) => {
      set((state) => ({
        ...state,
        unitEfficiencyPosts: visible,
      }));
    },
    unitEfficiencyBanks: true,
    onChangeUnitEfficiencyBanks: (visible: boolean) => {
      set((state) => ({
        ...state,
        unitEfficiencyBanks: visible,
      }));
    },
    unitBreakStations: true,
    onChangeUnitBreakStations: (visible: boolean) => {
      set((state) => ({
        ...state,
        unitBreakStations: visible,
      }));
    },
    unitChangeRates: true,
    onChangeUnitChangeRates: (visible: boolean) => {
      set((state) => ({
        ...state,
        unitChangeRates: visible,
      }));
    },
  };
};

export const useDashboardStore = create<DashboardState>()(
  devtools(
    persist(initialStateCreator, {
      name: 'dashboard',
      storage: createJSONStorage(() => localStorage),
    }),
  ),
);
