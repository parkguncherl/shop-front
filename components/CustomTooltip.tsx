// C:\work\binblur-oms-frontend\components\CustomTooltip.tsx

import { ITooltipParams } from 'ag-grid-community';

type Props = ITooltipParams;

export default function CustomTooltip(props: Props & { color: string }) {
  return (
    <div className="custom_tooltip">
      <span className={'name'}>{props.value}</span>
    </div>
  );
}
