import { AsnMngResponseSerieDataInExpected } from '../generated';

/**
 * eChart option 영역 response 의 series 요소를 인자 배열에 정렬된 이름(백앤드에서 지정된 각 series 의 실제 이름 속성을 작성) 기준으로 정렬하는 함수
 * response.series 응답이 무질서하게 들어오는 경우에도 이름 순서대로 정렬된 요소를 반환받는 것이 가능
 * */
export const chartSeriesAlignFn = (responseSeries: any[], guessedResponseSeries: string[]) => {
  const respondedSeries: any[] = [];
  if (responseSeries.length == guessedResponseSeries.length) {
    for (let i = 0; i < guessedResponseSeries.length; i++) {
      for (let j = 0; j < responseSeries.length; j++) {
        if (guessedResponseSeries[i] == responseSeries[j].name) {
          respondedSeries[respondedSeries.length] = responseSeries[j];
        }
      }
    }
  }
  return respondedSeries;
};
