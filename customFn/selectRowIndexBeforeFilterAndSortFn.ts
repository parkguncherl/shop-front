import { areObjectsEqualExcludingKeys } from './areObjectsEqualExcludingKeys';

/** 첫번째 인자로 받은 데이터가 대응되는 두번째 인자(오리지널 데이터 집합) 의 인덱스 값을 반환(재정렬된 배열의 특정 데이터에 대응하는 오리지널 배열의 인덱스)  */
export const selectRowIndexBeforeFilterAndSort = (data: any, rowData: any[], colId?: string) => {
  if (rowData) {
    for (let i = 0; i < rowData.length; i++) {
      if (areObjectsEqualExcludingKeys(data, rowData[i], colId ? [colId] : [])) {
        // i 인덱스에 대응하는 rowData 가 특정 컬럼(colId)을 제외한 대조에서 event.data 와 같다고 판단될 시 해당 인덱스 i를 반환
        return i;
      }
    }
  }
  return null;
};
