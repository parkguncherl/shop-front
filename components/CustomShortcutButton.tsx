// components/CustomShortcutButton.tsx

import React, { useId } from 'react';
import { Tooltip } from 'react-tooltip';

interface CustomShortcutButtonProps {
  onClick: (event?: any) => void;
  className?: string;
  children: React.ReactNode;
  tooltipId?: string;
  shotCutCntn?: string;
  title?: string;
  disableOnInput?: boolean;
  isButton?: boolean; // button 또는 li로 렌더링 선택
  as?: keyof JSX.IntrinsicElements; // 렌더링할 HTML 요소 타입
  loadingText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  tooltipPlace?: 'top' | 'bottom' | 'left' | 'right';
  dataCount?: number;
  isBlueRounded?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * 커스텀 단축키 버튼 컴포넌트
 * @component CustomShortcutButton
 */
const CustomShortcutButton = ({
  onClick,
  className = '',
  children,
  tooltipId,
  shotCutCntn,
  title,
  disableOnInput = true,
  loadingText,
  isLoading = false,
  disabled = false,
  tooltipPlace,
  isButton = true,
  as = 'button',
  dataCount = 0,
  isBlueRounded = false,
  ref,
}: CustomShortcutButtonProps) => {
  const uniqueId = useId(); // 고유 ID 생성
  tooltipId = `tooltip-${uniqueId}`; // 고유 Tooltip ID

  /**
   * 클릭 이벤트 핸들러
   */
  const handleClick = async () => {
    if (isLoading) return;
    try {
      await onClick();
    } catch (error) {
      console.error('Button click error:', error);
    }
  };

  if (isButton) {
    return (
      <>
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          className={`shortcut-button ${className} ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''} ${isBlueRounded ? 'border-blue-thick' : ''}`}
          onClick={handleClick}
          disabled={isLoading || disabled}
          data-tooltip-id={tooltipId}
          type="button"
          data-count={dataCount ? dataCount : 0}
        >
          {isLoading ? loadingText || 'Loading...' : children}
        </button>
        <Tooltip id={tooltipId} place={tooltipPlace || 'top'} />
      </>
    );
  }

  return (
    <>
      <li
        ref={ref as React.Ref<HTMLLIElement>}
        className={`shortcut-item ${className} ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleClick}
        aria-disabled={isLoading || disabled}
        data-tooltip-id={tooltipId}
        data-tooltip-content={`Tip : ${title || shotCutCntn || ''} ${title ? ' ' : ''}`}
      >
        {isLoading ? loadingText || 'Loading...' : children}
      </li>
      <Tooltip id={tooltipId} place={tooltipPlace || 'top'} />
    </>
  );
};

/**
 * 사용 예시:
 *
 * // 기본 단축키 기능키 사용   (공통키 )
 * <CustomShortcutButton
 *   onClick={save}
 *   shortcut={COMMON_SHORTCUTS.save}
 * >
 *   저장
 * </CustomShortcutButton>
 *
 * // 커스텀 단축키 기능키 조합
 * <CustomShortcutButton   (커스텀키 )
 *   shortcut={{ shift: true, key: 3 }}
 *   title="커스텀 기능"
 * >
 *   커스텀버튼
 * </CustomShortcutButton>
 */
export default CustomShortcutButton;
