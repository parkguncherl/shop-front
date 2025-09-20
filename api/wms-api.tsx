import { authApi } from '../libs';
import {
  GridRequest,
  InstockHistoryRequestCancelInstock,
  InstockRequestCreate,
  InstockRequestDelete,
  InventoryChangeRequest,
  InventoryMoveRequestCreate,
  PickinginfoRequestHoldJob,
  PickinginfoRequestJob,
} from '../generated';
import { toastError } from '../components';
import { useMutation } from '@tanstack/react-query';

// 화주목록 조회
export const fetchPartners = async (logisId?: number) => {
  if (logisId && logisId > 0) {
    return await authApi.get('/partner/my-partners/' + logisId);
  } else {
    return await authApi.get('/partner/my-partners/0');
  }
};

// filter 를 사용하여 화주목록 조회 todo 백앤드 영역 포함하여 삭제하기
/*export const fetchPartnersWithFilter = async (partnerRequestFilterForList: PartnerRequestFilterForList) => {
  return await authApi.get('/partner/withFilter', { params: partnerRequestFilterForList });
};*/

// 공장목록 조회
export const fetchFactories = async () => {
  return await authApi.get('/factory/list');
};

// 입하등록
export const createStock = async (Instock: (InstockRequestCreate | undefined)[]) => {
  return await authApi.post('/instock/create', Instock);
};

// 입하추가 삭제
export const deleteStock = async (Instock: (InstockRequestDelete | undefined)[]) => {
  return await authApi.post('/instock/delete', Instock);
};

// 입하취소
export const cancelInStock = async (Instock: (InstockHistoryRequestCancelInstock | undefined)[]) => {
  return await authApi.post('/instockHistory/cancel-instock', Instock);
};

// 프린트시 입하상태변경
export const updateStockStatusByPrint = async (Instock: (InstockRequestCreate | undefined)[]) => {
  return await authApi.post('/instock/print/stock-status', Instock);
};

// 적치장소(location) 옵션목록조회
export const fetchLocOptions = async (logisId: number) => {
  return await authApi.get(`/locset/option/list/${logisId}`);
};

// 적치 존(Zone) 옵션목록조회
export const fetchZoneOptions = async (logisId: number) => {
  return await authApi.get(`/zone/zoneList/${logisId}`);
};

// 적치 존에 속하는 Location 옵션목록조회
export const fetchLocationOptions = async (logisId: number) => {
  return await authApi.get(`/zone/locOptList/${logisId}`);
};

// 적치등록
export const createInven = async (Stock: (InstockRequestCreate | undefined)[]) => {
  return await authApi.post('/tostorage/create', Stock);
};

// 적치취소
export const cancelTostorage = async (Stock: (InstockRequestCreate | undefined)[]) => {
  return await authApi.post('/tostorage-history/cancel', Stock);
};

// 하위코드목록 조회
export const fetchLowerCodes = async (codeUpper: string) => {
  return await authApi.get(`/code/lower/${codeUpper}`);
};

// 재고이동
export const createInvenMove = async (InvenList: (InventoryMoveRequestCreate | undefined)[]) => {
  return await authApi.post('/inventorymove', InvenList);
};

// 재고변경 등록
export const changeInven = async (inventoryChangeRequest: InventoryChangeRequest) => {
  return await authApi.post('/inventorymove/changeInven', inventoryChangeRequest);
};

// 작업기준 SKU별 재고목록위치 조회
export const fetchJobSkuInvenLocs = async (jobId: number | undefined) => {
  console.log(`fetchJobSkuInvenLocs(jobId:${jobId})`);
  if (jobId) {
    return await authApi.get(`/wms/pickinginfo/${jobId}/bottom-grid-detail`);
  } else {
    return toastError('재고조회를 할 수 없습니다. Cause: 작업ID 없음.');
  }
};

// 출고요청 정보 상세 데이타 조회
export const fetchJobDetail = async (jobId: number | undefined) => {
  console.log(`fetchJobDetail(${jobId})`);
  if (jobId) {
    return await authApi.get(`/wms/pickinginfo/detail/${jobId}`);
  } else {
    return toastError('출고상세조회를 할 수 없습니다. Cause: 작업ID 없음.');
  }
};

// 출고 보류사유 저장
export const saveHoldJob = async (request: PickinginfoRequestHoldJob) => {
  return await authApi.post(`/wms/pickinginfo/holdjob`, request);
};

// 출고 보류사유 해제
export const releaseHoldJob = async (jobId: number | undefined) => {
  console.log(`releaseHoldJob(${jobId})`);
  if (jobId) {
    return await authApi.post(`/wms/pickinginfo/${jobId}/release-hold`);
  } else {
    return toastError('보류 해제 처리를 할 수 없습니다. Cause: 작업ID 없음.');
  }
};

//출고 처리
export const autoPickingJob = async (jobIds: (number | undefined)[]) => {
  console.log(`processJob(${jobIds})`);
  if (jobIds && jobIds.length > 0) {
    return await authApi.post(`/wms/pickinginfo/auto-picking-job`, jobIds);
  } else {
    return toastError('출고 처리를 할 수 없습니다. Cause: 작업ID 없음.');
  }
};

//부분 출고 처리
export const partialPickingJob = async (jobId: number | undefined) => {
  return await authApi.post(`/wms/pickinginfo/partial-picking-job`, { jobId: jobId });
};

//출고 취소 처리
export const cancelPickingJob = async (jobId: number | undefined) => {
  return await authApi.post(`/wms/pickinginfo/cancel-picking-job`, { jobId: jobId });
};

//출고 프린트 데이타 요청
export const fetchPickingJobForPrint = async (request: PickinginfoRequestJob[]) => {
  if (request && request.length > 0) {
    return await authApi.post(`/wms/pickinginfo/print`, request);
  } else {
    return toastError('프린트 처리를 할 수 없습니다. Cause: 선택된 작업 정보가 없음.');
  }
};

// 상품데이타 삭제
export const removeProduct = async (partnerId: number) => {
  if (partnerId) {
    return await authApi.delete(`/migration/product/remove/${partnerId}`);
  } else {
    return toastError('상품데이터를 삭제할 화주를 먼저 선택해주세요');
  }
};

// 소매처데이타 삭제
export const removeRetail = async (partnerId: number) => {
  if (partnerId) {
    return await authApi.delete(`/migration/retail/remove/${partnerId}`);
  } else {
    return toastError('소매처 정보를 삭제할 화주를 먼저 선택해주세요');
  }
};

// Ag-Grid 컬럼 상태 저장 훅 todo 미사용 시 제거
export const useSetGridColumnState = () => {
  return useMutation(
    async (request: GridRequest) => {
      const response = await authApi.post(`/common/grid-column/update`, request);
      return response.data;
    },
    {
      onSuccess: async (data) => {
        const { resultCode } = data;
        if (resultCode === 200) {
          console.log('gridColumnState Update!');
        } else {
          console.log('gridColumnState Failed!');
        }
      },
      onError: (error) => {
        console.error('gridColumnState Save Error:', error);
      },
    },
  );
};

// Ag-Grid 컬럼 상태 조회 훅 todo 미사용 시 제거
export const useGetGridColumnState = async (uri: string) => {
  if (uri) {
    return await authApi.get(`/common/grid-column`, {
      params: {
        uri: uri,
      },
    });
  } else {
    console.log('gridColumnState cannot search!');
  }
};
