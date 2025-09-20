import React from 'react';
import { useEffect, useState } from 'react';
import { palette } from '../styles/palette';
import { SouthKoreaSvgMap } from './SouthKoreaSvgMap';

type MapDataType = { [location: string]: number };

const DefaultTooltip = ({ tooltipStyle, children }: any) => {
  return (
    <div
      style={{
        borderRadius: '10px',
        color: `${palette.black}`,
        position: 'fixed',
        minWidth: '80px',
        padding: '10px',
        border: `1px solid ${palette.whiteSmoke}`,
        backgroundColor: `${palette.white}`,
        ...tooltipStyle,
      }}
    >
      {children}
    </div>
  );
};

export const SimpleSouthKoreaMapChart = ({ data, unit = '%', setColorByCount, customTooltip }: any) => {
  const [mapData, setMapData] = useState<MapDataType>({});
  const [tooltipMsg, setTooltipMsg] = useState<string>('');
  const [tooltipStyle, setTooltipStyle] = useState<any>(false);

  useEffect(() => {
    const items = data.reduce((acc: any, item: any) => {
      return {
        ...acc,
        [item.locale]: item.count,
      };
    }, {});

    setMapData(items);
  }, [data]);

  const handleLocationMouseOver = (event: any) => {
    const location = event.target.attributes.name.value;
    const count = mapData[location] ? mapData[location] : 0;
    setTooltipMsg(`${location}: ${count}${unit}`);
  };

  const handleLocationMouseOut = () => {
    setTooltipStyle({ display: 'none' });
  };

  const handleLocationMouseMove = (event: any) => {
    const tooltipStyle = {
      display: 'block',
      top: event.clientY - 50,
      left: event.clientX - 60,
    };
    setTooltipStyle(tooltipStyle);
  };

  const handleLocationClick = (event: MouseEvent) => {
    //
  };

  return (
    <>
      <SouthKoreaSvgMap
        data={mapData}
        setColorByCount={setColorByCount}
        onLocationMouseOver={handleLocationMouseOver}
        onLocationMouseOut={handleLocationMouseOut}
        onLocationMouseMove={handleLocationMouseMove}
        onLocationClick={handleLocationClick}
      />
      {customTooltip ? (
        React.cloneElement(customTooltip, {
          tooltipStyle,
          children: tooltipMsg,
        })
      ) : (
        <DefaultTooltip tooltipStyle={tooltipStyle}>{tooltipMsg}</DefaultTooltip>
      )}
    </>
  );
};
