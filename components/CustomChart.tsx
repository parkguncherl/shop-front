import React, { useRef, useState } from 'react';
import ECharts from 'echarts-for-react';
import { useDidMountEffect } from '../hooks';

export type SeriesProp = {
  name?: string;
  data: any[];
};

interface Props {
  type: 'pie' | 'bar' | 'line';
  axis?: 'horizontal' | 'vertical' | 'multi-horizontal' | 'multi-vertical';
  title?: string;
  xAxisData?: string[] | number[];
  yAxisData?: string[] | number[];
  legendData?: string[] | number[];
  series: SeriesProp[];
  width?: number;
  formatter?: string;
  containerStyle?: React.CSSProperties;
}

export const CustomChart = ({ type, axis = 'horizontal', title, xAxisData, yAxisData, legendData, series, width, formatter, containerStyle }: Props) => {
  const chartRef = useRef<ECharts>(null);

  const [option, setOption] = useState({
    title: type !== 'line' && {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 13,
      },
    },
    xAxis: type !== 'pie' && {
      type: axis === 'horizontal' || axis === 'multi-horizontal' ? 'category' : 'value',
      data: !xAxisData ? [''] : xAxisData,
    },
    yAxis: type !== 'pie' && {
      type: axis === 'horizontal' || axis === 'multi-horizontal' ? 'value' : 'category',
      data: !yAxisData ? [''] : yAxisData,
    },
    tooltip:
      axis !== 'vertical'
        ? {
            trigger: 'item',
            formatter: type === 'pie' ? '{b} : {d}% ({c}건)' : type === 'line' ? formatter : '{a} : {c}',
          }
        : {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow',
            },
          },
    legend: legendData
      ? {
          data: legendData,
          orient: 'horizontal',
          bottom: 'bottom',
        }
      : {
          bottom: 'bottom',
        },
    series: series.map((v) => {
      return {
        name: v.name || '',
        type: type,
        radius: type === 'pie' && '50%',
        label: type === 'pie' && {
          show: true,
          formatter(param: any) {
            return param.name + ' (' + param.percent + '%)';
          },
        },
        showSymbol: type === 'line' ? false : true,
        stack: (axis === 'multi-horizontal' || axis === 'multi-vertical') && 'Ad',
        data: v.data,
      };
    }),
    textStyle: {
      fontWeight: 10,
      fontSize: 8,
    },
    grid: type === 'line' && {
      tooltip: {
        show: true,
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          label: {
            show: true,
          },
        },
      },
    },
  });

  useDidMountEffect(() => {
    const updatedOption = {
      ...option, // 이전 옵션을 복사
      xAxis: type !== 'pie' && {
        type: axis === 'horizontal' || axis === 'multi-horizontal' ? 'category' : 'value',
        data: !xAxisData ? [''] : xAxisData,
      },
      yAxis: type !== 'pie' && {
        type: axis === 'horizontal' || axis === 'multi-horizontal' ? 'value' : 'category',
        data: !yAxisData ? [''] : yAxisData,
      },
      series: series.map((v) => {
        return {
          name: v.name || '',
          type: type,
          radius: type === 'pie' && '50%',
          label: type === 'pie' && {
            show: true,
            formatter(param: any) {
              return param.name + ' (' + param.percent + '%)';
            },
          },
          showSymbol: type === 'line' ? false : true,
          stack: (axis === 'multi-horizontal' || axis === 'multi-vertical') && 'Ad',
          data: v.data,
        };
      }),
    };
    setOption(updatedOption);

    if (chartRef.current) {
      chartRef.current.getEchartsInstance().clear();
    }
  }, [series, xAxisData, yAxisData]);

  return (
    <div style={{ border: '1px solid #d4d4d4', margin: '2px', ...containerStyle }}>
      <ECharts ref={chartRef} option={option} opts={{ renderer: 'svg', width: width ? width : undefined, height: 300 }} />
    </div>
  );
};
