import { useCodeStore } from '../stores/useCodeStore';
import { toastError } from '../components';

interface CodeOption {
  code: string;
  name: string;
  displayValue: string;
}

/**
 * AG-Grid에서 사용할 코드 드롭다운 설정을 생성하는 함수
 * @param upperCode 상위 코드
 * @returns AG-Grid 컬럼에서 사용할 드롭다운 관련 설정들
 */
export const CustomHoldReasonEditor = (upperCode: string) => {
  // 코드 스토어 초기화
  const store = useCodeStore.getState();
  let options: CodeOption[] = [];

  // 초기 데이터 로드
  store
    .selectDropdownByCodeUpper(upperCode)
    .then((response) => {
      if (response.data.resultCode === 200 && response.data.body) {
        options = response.data.body
          .filter((item) => item && item.codeCd && item.codeNm)
          .map((item) => ({
            code: item.codeCd!,
            name: item.codeNm!,
            displayValue: `${item.codeNm!} (${item.codeCd!})`,
          }));
      }
    })
    .catch((error) => {
      console.error('코드 로드 실패:', error);
      toastError('코드를 불러오는데 실패했습니다.');
    });

  return {
    cellEditor: 'agRichSelectCellEditor',
    cellEditorParams: {
      values: () => options.map((opt) => opt.displayValue),
      allowTyping: true,
      cellHeight: 20,
      searchDebounceDelay: 500,
      searchString: true,
    },
    valueGetter: (params: any) => {
      const code = params.data?.stockRsnCd;
      const option = options.find((opt) => opt.code === code);
      return option ? `${option.name} (${option.code})` : code || '';
    },
    valueSetter: (params: any) => {
      const option = options.find((opt) => opt.displayValue === params.newValue);
      if (option) {
        params.data.stockRsnCd = option.code;
        return true;
      }
      return false;
    },
  };
};
