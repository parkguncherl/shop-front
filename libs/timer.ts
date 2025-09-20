import EventEmitter from 'events';

export class Timer extends EventEmitter {
  // 최초 시작시간
  private time = -1;
  // requestAnimationFrame의 ID
  private timerId = -1;

  // Timer를 생성할 때 몇초를 셀지 받는다.
  constructor(private duration: number) {
    super();
  }

  // 타이머가 시작하면, requestAnimationFrame와 함께 step함수를 호출한다.
  start() {
    this.timerId = requestAnimationFrame(this.step);
    return this.timerId;
  }

  // 타이머가 끝나면, cancelAnimationFrame를 호출하여 repaint를 막고
  // 타이머를 다시 초기화 시킨다.
  stop() {
    cancelAnimationFrame(this.timerId);
    this.timerId = -1;
  }

  // 현재 시간을 받는다.
  private step = (timestamp: number) => {
    // time이 -1이라면 === 맨처음 생성되었다면
    // 받은 시간을 timer의 시간으로 갱신하한다.
    if (this.time === -1) {
      this.time = timestamp;
    }

    // 현재시간과 타이머 내장시간의 차이
    const progress = timestamp - this.time;

    // progress의 차이가 처음에 받는 시간의 차이보다 크다면
    if (progress < this.duration) {
      // progress를 인자로 하는 progress 이벤트를 시작한다.
      this.emit('progress', progress);
      // 그리고 이는 브라우저의 리페인팅 (== 카운트 다운 갱신)이 필요하므로,
      // requestAnimationFrame를 호출한다.
      this.timerId = requestAnimationFrame(this.step);
    } else {
      // 카운트 다운이 종료되었다면 stop을 호출하고 이벤트를 끝낸다.
      this.stop();
      this.emit('finish');
    }
  };
}
