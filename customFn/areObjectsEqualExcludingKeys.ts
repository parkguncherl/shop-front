/** 키 배열에 해당하는 키를 제외한 모든 키를 기준으로 객체의 동일성 여부 검사 */
export const areObjectsEqualExcludingKeys = (obj1: any, obj2: any, keysToIgnore: string[]) => {
  const keys1 = keysToIgnore.length != 0 ? Object.keys(obj1).filter((key) => !keysToIgnore.includes(key)) : Object.keys(obj1);
  const keys2 = keysToIgnore.length != 0 ? Object.keys(obj2).filter((key) => !keysToIgnore.includes(key)) : Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every((key) => obj1[key] === obj2[key]);
};
