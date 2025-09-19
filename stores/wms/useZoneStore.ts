import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { authApi } from '../../libs';
import { AxiosPromise } from 'axios';
import { ApiResponse, ZoneRequestLocationInfo, ZoneRequestLocSkuInfo, ZoneRequestZoneInfo } from '../../generated';

/**
 * 물류센터 ZONE 정보 관련 전역 상태
 * */

interface ZoneApiState {
  selectLocationSkuListByLocId: (zoneRequestLocSkuInfo: ZoneRequestLocSkuInfo) => AxiosPromise<ApiResponse>;
  updateLocation: (zoneRequestLocationInfo: ZoneRequestLocationInfo) => AxiosPromise<ApiResponse>;
  updateZone: (zoneRequesZoneInfo: ZoneRequestZoneInfo) => AxiosPromise<ApiResponse>;
  deleteZone: (zoneRequesZoneInfo: ZoneRequestZoneInfo) => AxiosPromise<ApiResponse>;
  deleteLocation: (zoneRequesLocationInfo: ZoneRequestLocationInfo) => AxiosPromise<ApiResponse>;
  insertZone: (zoneRequestZoneInfo: ZoneRequestZoneInfo) => AxiosPromise<ApiResponse>;
  insertLocation: (zoneRequestLocationInfo: ZoneRequestLocationInfo) => AxiosPromise<ApiResponse>;
  insertLocationList: (zoneRequestLocationInfoList: ZoneRequestLocationInfo[]) => AxiosPromise<ApiResponse>;
}

type ZoneInZoneStore = ZoneApiState;

const initialStateCreator: StateCreator<ZoneInZoneStore, any> = (set, get, api) => {
  return {
    selectLocationSkuListByLocId: (zoneRequestLocSkuInfo) => {
      return authApi.get('/zone/locSkuList', {
        params: zoneRequestLocSkuInfo,
      });
    },
    updateLocation: (zoneRequestLocationInfo) => {
      return authApi.patch('/zone/updateLocation', zoneRequestLocationInfo);
    },
    updateZone: (zoneRequesZoneInfo) => {
      return authApi.patch('/zone/updateZone', zoneRequesZoneInfo);
    },
    deleteZone: (zoneRequesZoneInfo) => {
      console.log('zoneRequesZoneInfo ==>', zoneRequesZoneInfo);
      return authApi.patch('/zone/deleteZone', zoneRequesZoneInfo);
    },
    deleteLocation: (zoneRequesLocationInfo) => {
      console.log('zoneRequesLocationInfo ==>', zoneRequesLocationInfo);
      return authApi.patch('/zone/deleteLocation', zoneRequesLocationInfo);
    },
    insertZone: (zoneRequestZoneInfo) => {
      return authApi.post('/zone/insertZone', zoneRequestZoneInfo);
    },
    insertLocation: (zoneRequestLocationInfo) => {
      return authApi.post('/zone/insertLocation', zoneRequestLocationInfo);
    },
    insertLocationList: (zoneRequestLocationInfoList) => {
      return authApi.post('/zone/insertLocationList', zoneRequestLocationInfoList);
    },
  };
};

export const useZoneStore = create<ZoneInZoneStore>()(devtools(immer(initialStateCreator)));
