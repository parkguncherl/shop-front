import React, { useState } from 'react';
import ECharts from 'echarts-for-react';
import { Footer } from '../components/layout';
import { Utils } from '../libs/utils';

const Index = () => {
  const [options, setOptions] = useState({
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: [150, 230, 224, 218, 135, 147, 260],
        type: 'line',
      },
    ],
  });
  const [options2, setOptions2] = useState({
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: [120, 200, 150, 80, 70, 110, 130],
        type: 'bar',
        showBackground: true,
        backgroundStyle: {
          color: 'rgba(180, 180, 180, 0.2)',
        },
      },
    ],
  });
  const [options3, setOptions3] = useState({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {},
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
    ],
    yAxis: [
      {
        type: 'value',
      },
    ],
    series: [
      {
        name: 'Direct',
        type: 'bar',
        emphasis: {
          focus: 'series',
        },
        data: [320, 332, 301, 334, 390, 330, 320],
      },
      {
        name: 'Email',
        type: 'bar',
        stack: 'Ad',
        emphasis: {
          focus: 'series',
        },
        data: [120, 132, 101, 134, 90, 230, 210],
      },
      {
        name: 'Union Ads',
        type: 'bar',
        stack: 'Ad',
        emphasis: {
          focus: 'series',
        },
        data: [220, 182, 191, 234, 290, 330, 310],
      },
      {
        name: 'Video Ads',
        type: 'bar',
        stack: 'Ad',
        emphasis: {
          focus: 'series',
        },
        data: [150, 232, 201, 154, 190, 330, 410],
      },
      {
        name: 'Search Engine',
        type: 'bar',
        data: [862, 1018, 964, 1026, 1679, 1600, 1570],
        emphasis: {
          focus: 'series',
        },
        markLine: {
          lineStyle: {
            type: 'dashed',
          },
          data: [[{ type: 'min' }, { type: 'max' }]],
        },
      },
      {
        name: 'Baidu',
        type: 'bar',
        barWidth: 5,
        stack: 'Search Engine',
        emphasis: {
          focus: 'series',
        },
        data: [620, 732, 701, 734, 1090, 1130, 1120],
      },
      {
        name: 'Google',
        type: 'bar',
        stack: 'Search Engine',
        emphasis: {
          focus: 'series',
        },
        data: [120, 132, 101, 134, 290, 230, 220],
      },
      {
        name: 'Bing',
        type: 'bar',
        stack: 'Search Engine',
        emphasis: {
          focus: 'series',
        },
        data: [60, 72, 71, 74, 190, 130, 110],
      },
      {
        name: 'Others',
        type: 'bar',
        stack: 'Search Engine',
        emphasis: {
          focus: 'series',
        },
        data: [62, 82, 91, 84, 109, 110, 120],
      },
    ],
  });
  const [options4, setOptions4] = useState({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        // Use axis to trigger tooltip
        type: 'shadow', // 'shadow' as default; can also be 'line' or 'shadow'
      },
    },
    legend: {},
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
    },
    yAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    series: [
      {
        name: 'Direct',
        type: 'bar',
        stack: 'total',
        label: {
          show: true,
        },
        emphasis: {
          focus: 'series',
        },
        data: [320, 302, 301, 334, 390, 330, 320],
      },
      {
        name: 'Mail Ad',
        type: 'bar',
        stack: 'total',
        label: {
          show: true,
        },
        emphasis: {
          focus: 'series',
        },
        data: [120, 132, 101, 134, 90, 230, 210],
      },
      {
        name: 'Affiliate Ad',
        type: 'bar',
        stack: 'total',
        label: {
          show: true,
        },
        emphasis: {
          focus: 'series',
        },
        data: [220, 182, 191, 234, 290, 330, 310],
      },
      {
        name: 'Video Ad',
        type: 'bar',
        stack: 'total',
        label: {
          show: true,
        },
        emphasis: {
          focus: 'series',
        },
        data: [150, 212, 201, 154, 190, 330, 410],
      },
      {
        name: 'Search Engine',
        type: 'bar',
        stack: 'total',
        label: {
          show: true,
        },
        emphasis: {
          focus: 'series',
        },
        data: [820, 832, 901, 934, 1290, 1330, 1320],
      },
    ],
  });
  const [options5, setOptions5] = useState({
    title: {
      text: 'Referer of a Website',
      subtext: 'Fake Data',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: 'Access From',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 1048, name: 'Search Engine' },
          { value: 735, name: 'Direct' },
          { value: 580, name: 'Email' },
          { value: 484, name: 'Union Ads' },
          { value: 300, name: 'Video Ads' },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  });
  const [options6, setOptions6] = useState({
    title: {
      text: 'Stacked Line',
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['Email', 'Union Ads', 'Video Ads', 'Direct', 'Search Engine'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    toolbox: {
      feature: {
        saveAsImage: {},
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: 'Email',
        type: 'line',
        stack: 'Total',
        data: [120, 132, 101, 134, 90, 230, 210],
      },
      {
        name: 'Union Ads',
        type: 'line',
        stack: 'Total',
        data: [220, 182, 191, 234, 290, 330, 310],
      },
      {
        name: 'Video Ads',
        type: 'line',
        stack: 'Total',
        data: [150, 232, 201, 154, 190, 330, 410],
      },
      {
        name: 'Direct',
        type: 'line',
        stack: 'Total',
        data: [320, 332, 301, 334, 390, 330, 320],
      },
      {
        name: 'Search Engine',
        type: 'line',
        stack: 'Total',
        data: [820, 932, 901, 934, 1290, 1330, 1320],
      },
    ],
  });
  const [options7, setOptions7] = useState({
    title: {
      text: 'World Population',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {},
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      boundaryGap: [0, 0.01],
    },
    yAxis: {
      type: 'category',
      data: ['Brazil', 'Indonesia', 'USA', 'India', 'China', 'World'],
    },
    series: [
      {
        name: '2011',
        type: 'bar',
        data: [18203, 23489, 29034, 104970, 131744, 630230],
      },
      {
        name: '2012',
        type: 'bar',
        data: [19325, 23438, 31000, 121594, 134141, 681807],
      },
    ],
  });

  // 차트박스 차트
  const [options8, setOptions8] = useState({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: function (params: any) {
        let tooltipContent = `<div class="echartTooltip chart">`;

        tooltipContent += `<strong>${params[0].axisValue}</strong>`;

        params.forEach((item: any) => {
          tooltipContent += `
            <span class="group">
              <strong>${item.seriesName}</strong>
              <em>${item.value.toLocaleString()}원</em>
            </span>
          `;
        });

        tooltipContent += `</div>`; // div 닫기

        return tooltipContent;
      },
    },
    grid: {
      left: '-20px',
      right: '4%',
      top: '-30px',
      bottom: '0',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: ['2일(목)', '3일(금)', '4일(토)', '5일(일)', '6일(월)', '7일(화)', '8일(수)'],
        axisTick: {
          alignWithLabel: true,
        },
      },
    ],
    yAxis: [
      {
        type: 'value',
        show: false, // y축 숨기기
      },
    ],
    series: [
      {
        name: '판매',
        type: 'bar',
        barWidth: '30%',
        data: [1200000, 1200000, 0, 0, 21520000, 3200000, 9876000], // 첫 번째 시리즈 데이터
        itemStyle: {
          color: '#D9D9D9', // 색상 설정 (첫 번째 막대)
        },
        emphasis: {
          focus: 'series', // 강조할 때 시리즈에 집중
        },
      },
      {
        name: '매출',
        type: 'bar',
        barWidth: '30%',
        data: [1600000, 1600000, 0, 0, 27520000, 3600000, 13520000], // 두 번째 시리즈 데이터
        itemStyle: {
          color: '#0070C0', // 색상 설정 (두 번째 막대)
        },
        emphasis: {
          focus: 'series', // 강조할 때 시리즈에 집중
        },
      },
    ],
  });

  // 세일즈박스 차트
  const [options9, setOptions9] = useState({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: function (params: any) {
        return `<span class="echartTooltip"><strong>${params[0].name}</strong><em>${params[0].value.toLocaleString()}장</em></span>`;
      },
    },
    legend: {},
    grid: {
      left: '0',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      boundaryGap: [0, 0.01],
      axisLabel: { show: false }, // x축 글자 제거
      splitLine: { show: false }, // x축 배경선 제거
      axisLine: { show: false }, // x축 라인 제거
    },
    yAxis: {
      type: 'category',
      data: [
        '병근자켓',
        '상현mtm',
        '효관hd',
        '아름pt',
        '예솔sl',
        '크림치즈#양기모무지hd',
        '모디무드#맨날사고트위드jk',
        '하비언니#긴바진데반바지pt',
        '소녀나라#라쿤페이크목도리',
        '이랜드#강아지패치mtm',
      ],
      axisLabel: {
        fontSize: 12, // 글자 크기 고정
        width: 190, // 글자 최대 너비 설정
        overflow: 'truncate', // 글자가 길면 생략 (...) 처리
      },
    },
    series: [
      {
        name: '',
        type: 'bar',
        data: [14000, 11000, 10985, 10000, 9260, 9001, 6650, 3832, 3500, 3222],
        label: {
          show: true,
          position: 'right', // 라벨이 막대 안에 표시되도록 설정
          formatter: function (params: any) {
            return `${params.value.toLocaleString()}장`; // '장' 추가
          },
        },
        itemStyle: {
          color: '#0070C0',
        },
      },
    ],
  });

  // revenueBox 차트
  const [options10, setOptions10] = useState({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: function (params: any) {
        return `<span class="echartTooltip"><strong>${params[0].name}</strong><em>${params[0].value.toLocaleString()}장</em></span>`;
      },
    },
    legend: {},
    grid: {
      left: '70px',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      boundaryGap: [0, 0.01],
      axisLabel: { show: false }, // x축 글자 제거
      splitLine: { show: false }, // x축 배경선 제거
      axisLine: { show: false }, // x축 라인 제거
    },
    yAxis: {
      type: 'category',
      data: ['원더플레이스', '크림치즈마켓', '모디무드', '하비월드', '이랜드영트랜드', '토마토3', '대구일호', '어베인무드', '트위', '에이블리'],
      axisLabel: {
        fontSize: 12, // 글자 크기 고정
        width: 190, // 글자 최대 너비 설정
        overflow: 'truncate', // 글자가 길면 생략 (...) 처리
      },
    },
    series: [
      {
        name: '',
        type: 'bar',
        data: [105789000, 99898000, 99151000, 98339000, 92694000, 82447000, 62552000, 39000000, 35525000, 32059000],
        label: {
          show: true,
          position: 'right', // 라벨이 막대 안에 표시되도록 설정
          formatter: function (params: any) {
            return `${params.value.toLocaleString()}원`; // '장' 추가
          },
          textBorderWidth: 0,
          textBorderColor: 'transparent',
        },
        itemStyle: {
          color: '#FF8787',
        },
      },
    ],
  });

  return (
    <>
      {/*<ECharts option={options} opts={{ renderer: 'svg', width: 'auto', height: 'auto' }} />*/}
      {/*<ECharts option={options2} opts={{ renderer: 'svg', width: 'auto', height: 'auto' }} />*/}
      {/*<ECharts option={options3} opts={{ renderer: 'svg', width: 'auto', height: 'auto' }} />*/}
      {/*<ECharts option={options4} opts={{ renderer: 'svg', width: 'auto', height: 'auto' }} />*/}
      {/*<ECharts option={options5} opts={{ renderer: 'svg', width: 'auto', height: 'auto' }} />*/}
      {/*<ECharts option={options6} opts={{ renderer: 'svg', width: 'auto', height: 'auto' }} />*/}
      {/*<ECharts option={options7} opts={{ renderer: 'svg', width: 'auto', height: 'auto' }} />*/}
      <div className="mainContent">
        <section className="inventoryBox">
          <dl>
            <dt>재고</dt>
            <dd>
              <button>
                {Utils.setComma(32548)}
                <span>장</span>
              </button>
              <span className={`red`}>어제보다 +2,500장 늘었음</span>
            </dd>
          </dl>
          <dl>
            <dt>미출</dt>
            <dd>
              <button>
                {Utils.setComma(33)}
                <span>장</span>
              </button>
              <span className={`blue`}>어제보다 -2장 줄었음</span>
            </dd>
          </dl>
          <dl>
            <dt>미송</dt>
            <dd>
              <button>
                {Utils.setComma(890)}
                <span>장</span>
              </button>
              <span className={`red`}>어제보다 +2,500장 늘었음</span>
            </dd>
          </dl>
          <dl>
            <dt>샘플</dt>
            <dd>
              <button>
                {Utils.setComma(506)}
                <span>장</span>
              </button>
              <span className={``}>어제 이 시간과 같음</span>
            </dd>
          </dl>
        </section>
        <section className="chartBox">
          <div className="title">
            <strong>주간 실매출이 지난주보다</strong>
            <strong>
              총합 <span className={`blue`}>+ {Utils.setComma(12520000)}원</span>
            </strong>
            <strong>늘었어요</strong>
          </div>
          <ECharts option={options8} />
        </section>
        <section className="salesBox">
          <div className="title">
            <strong>주간 판매 BEST 10 품목이예요</strong>
            <strong className="emphasis">
              <span>효관hd</span>
              <span>하비언니#긴바진데반바지pt</span>
              <span>모디무드#맨날사고트위드jk</span>
            </strong>
            <strong>새롭게 BEST에 진입했어요</strong>
          </div>
          <ECharts option={options9} />
        </section>
        <section className="revenueBox">
          <div className="title">
            <strong>주간 매출 BEST 10 소매처예요</strong>
            <strong className="emphasis">
              <span>백병근, </span>
              <span>트위,</span>
              <span>원더플레이스</span>
            </strong>
            <strong>새롭게 BEST에 진입했어요</strong>
          </div>
          <ECharts option={options10} />
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Index;
