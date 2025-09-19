import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { PlacesType } from 'react-tooltip';

export interface TunedButtonAtomRefInterface {
  enableClickBehavior: () => void;
  other: () => HTMLButtonElement | null;
}

interface Props {
  className?: string;
  title?: string;
  dataTooltipId?: string;
  dataTooltipContent?: string;
  dataTooltipPlace?: PlacesType;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children?: string;
  clickPreventTime?: number; // 미정의시 이중클릭 억제 비활성화, 0 미만 값 정의할 시 enableClickBehavior 를 통한 수동 제어
}

const TunedButtonAtom = forwardRef<TunedButtonAtomRefInterface, Props>(
  (
    { className, title, dataTooltipId, dataTooltipContent, dataTooltipPlace, onClick, children, clickPreventTime }: Props,
    ref: React.ForwardedRef<TunedButtonAtomRefInterface>,
  ) => {
    const btnRef = useRef<HTMLButtonElement>(null);
    const [clickPreventionStatus, setClickPreventionStatus] = useState(false);

    useImperativeHandle(ref, () => ({
      enableClickBehavior: () => {
        setClickPreventionStatus(false); // 클릭 동작 재활성화
      },
      other: () => {
        return btnRef.current; // 버튼의 기본 참조
      },
    }));

    const clickEventHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (clickPreventTime != undefined) {
        // 시간 기준으로
        if (clickPreventTime >= 0) {
          // setTimeout 사용한 기본적인 이중클릭 억제
          if (!clickPreventionStatus) {
            onClick(event);
            setClickPreventionStatus(true);
            new Promise((resolve) => {
              setTimeout(() => {
                resolve('success');
              }, clickPreventTime as number);
            }).then(() => {
              setClickPreventionStatus(false);
            });
          }
        } else {
          // 0 미만 값 정의할 시 수동 제어
          if (!clickPreventionStatus) {
            onClick(event);
            setClickPreventionStatus(true);
          }
        }
      } else {
        // 이중클릭 억제 비활성화
        onClick(event);
      }
    };

    return (
      <button
        className={className || 'btn'}
        title={title}
        ref={btnRef}
        data-tooltip-id={dataTooltipId}
        data-tooltip-content={dataTooltipContent}
        data-tooltip-place={dataTooltipPlace}
        onClick={clickEventHandler}
      >
        {children}
      </button>
    );
  },
);

TunedButtonAtom.displayName = 'TunedButtonAtom';
export default TunedButtonAtom;
