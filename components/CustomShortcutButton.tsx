// components/CustomShortcutButton.tsx

import React, { useEffect, useCallback, useState, useId, useRef } from 'react';
import { Tooltip } from 'react-tooltip';
import { useOrderStore } from '../stores/useOrderStore';

/**
 * 단축키 설정 타입 정의
 * @interface ShortcutConfig
 * @property {boolean} [alt] - Alt 키 사용 여부
 * @property {boolean} [ctrl] - Ctrl 키 사용 여부
 * @property {boolean} [shift] - Shift 키 사용 여부
 * @property {string} key - 사용할 키 값
 * @property {string} [description] - 단축키 설명
 */
interface ShortcutConfig {
  alt?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  key: string;
  description?: string;
  // 단축키 기능 활성화 여부
  enableShortcut?: boolean;
}

/**
 * 버튼 Props 인터페이스
 * @interface CustomShortcutButtonProps
 * @property {() => void} onClick - 클릭 이벤트 핸들러
 * @property {ShortcutConfig} shortcut - 단축키 설정
 * @property {string} [className] - CSS 클래스명
 * @property {React.ReactNode} children - 자식 요소
 * @property {string} [tooltipId] - 툴팁 ID
 * @property {string} [title] - 버튼 제목
 * @property {boolean} [disableOnInput] - 입력 필드에서 비활성화 여부
 * @property {string} [loadingText] - 로딩 시 표시할 텍스트
 * @property {boolean} [isLoading] - 로딩 상태#@@!@#
 */
interface CustomShortcutButtonProps {
  onClick: (event?: any) => void;
  shortcut: ShortcutConfig;
  className?: string;
  children: React.ReactNode;
  tooltipId?: string;
  title?: string;
  disableOnInput?: boolean;
  isButton?: boolean; // button 또는 li로 렌더링 선택
  as?: keyof JSX.IntrinsicElements; // 렌더링할 HTML 요소 타입
  loadingText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
  tooltipPlace?: 'top' | 'bottom' | 'left' | 'right';
  dataCount?: number;
  isBlueRounded?: boolean;
}

/**
 * 기능키 상수 정의
 * F1-F12까지의 기능키 매핑
 */
export const FUNCTION_KEYS = {
  F1: 'F1',
  F2: 'F2',
  F3: 'F3',
  F4: 'F4',
  F5: 'F5',
  F6: 'F6',
  F7: 'F7',
  F8: 'F8',
  F9: 'F9',
  F10: 'F10',
  F11: 'F11',
  F12: 'F12',
} as const;

/**
 * 브라우저 단축키와 충돌하는 기능키 정의
 */
const BROWSER_FUNCTION_KEYS = {
  F1: true, // 브라우저 도움말
  F3: true, // 브라우저 검색
  F11: true, // 전체화면
  F12: true, // 개발자 도구
};

/**
 * 자주 사용되는 단축키 설정
 * 기본적으로 제공되는 단축키 조합들
 */
export const COMMON_SHORTCUTS = {
  // 왼쪽 주문등록
  f1: { key: FUNCTION_KEYS.F1, description: '판매' },
  f2: { key: FUNCTION_KEYS.F2, description: '반품' },
  f3: { key: FUNCTION_KEYS.F3, description: '미송' },
  f4: { key: FUNCTION_KEYS.F4, description: '샘플' },
  f6: { key: FUNCTION_KEYS.F6, description: '미출' },
  f7: { key: FUNCTION_KEYS.F7, description: '매장' },
  f8: { key: FUNCTION_KEYS.F8, description: '묶음' },
  f10: { key: FUNCTION_KEYS.F10 },
  shift1: { shift: true, key: '1', description: '금일내역' },
  shift2: { shift: true, key: '2', description: '소매처검색' },
  shift3: { shift: true, key: '3', description: '업체내역' },
  shift4: { shift: true, key: '4', description: '미송관리' },
  shift5: { shift: true, key: '5', description: '샘플관리' },
  shift6: { shift: true, key: '6', description: '보류관리' },
  shift7: { shift: true, key: '7', description: '출고보류' },
  /*
  shiftF1: { shift: true, key: 'F1', description: '업체내역' },
  shiftF2: { shift: true, key: 'F2', description: '미송관리' },
  shiftF3: { shift: true, key: 'F3', description: '샘플관리' },
  shiftF4: { shift: true, key: 'F4', description: '보류관리' },
*/
  shiftF1: { shift: true, key: 'F1', description: '금일내역' },
  shiftF5: { shift: true, key: 'F5', description: '새로고침' },

  altF1: { alt: true, key: 'F1', description: '업체내역' },
  altF2: { alt: true, key: 'F2', description: '미송관리' },
  altF3: { alt: true, key: 'F3', description: '샘플관리' },
  //  altF4: { alt: true, key: 'F4', description: '보류관리' },
  altF5: { alt: true, key: 'F5', description: '보류관리' },
  altF6: { alt: true, key: 'F6', description: '영업정산' },
  // 우측 그리드 상단
  save: { alt: true, key: 'Enter', description: '저장' },
  alt1: { alt: true, key: '1', description: '미리보기' },
  alt2: { alt: true, key: '2' }, //커스텀용
  alt3: { alt: true, key: '3' }, //커스텀용
  alt4: { alt: true, key: '4' }, //커스텀용
  alt5: { alt: true, key: '5' }, //커스텀용
  alt6: { alt: true, key: '6' }, //커스텀용
  alt7: { alt: true, key: '7' }, //커스텀용
  alt8: { alt: true, key: '8' }, //커스텀용
  alt9: { alt: true, key: '9' }, //커스텀용
  print: { key: '`', description: '전표인쇄' },
  // 우측 그리드 하단
  gridUnder1: { shift: true, key: 'q' },
  gridUnder2: { shift: true, key: 'w' },
  gridUnder3: { shift: true, key: 'e' },
  gridUnder4: { shift: true, key: 'r' },
  gridUnder5: { shift: true, key: 't' },
  // 우측 그리드 하단2
  gridUnder2_1: { shift: true, key: 'a' },
  gridUnder2_2: { shift: true, key: 's' },
  gridUnder2_3: { shift: true, key: 'd' },
  gridUnder2_4: { shift: true, key: 'f' },
  gridUnder2_5: { shift: true, key: 'g' },
  // 기타 공통
  ctrlZ: { ctrl: true, key: 'z' }, // 삭제,취소
  favo: { shift: true, key: 'f', description: '즐겨찾기' },
  logout: { shift: true, key: 'L', description: '로그아웃' },
  mypage: { shift: true, key: 'M', description: '내정보' },
  logo: { shift: true, key: ' ', description: '확장/축소' },
  partner: { shift: true, key: 'p', description: '파트너변경' },
  f5: { key: FUNCTION_KEYS.F5, description: '새로고침' },
  NONE: { key: '', description: '' },
} as const;

/**
 * 커스텀 단축키 버튼 컴포넌트
 * @component CustomShortcutButton
 */
const CustomShortcutButton = React.forwardRef<HTMLButtonElement, CustomShortcutButtonProps>(
  (
    {
      onClick,
      shortcut,
      className = '',
      children,
      tooltipId,
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
    },
    ref,
  ) => {
    const [orderModalType] = useOrderStore((s) => [s.modalType]);
    const uniqueId = useId(); // 고유 ID 생성
    tooltipId = `tooltip-${uniqueId}`; // 고유 Tooltip ID
    /**
     * 단축키 텍스트 생성
     * @returns {string} 포맷팅된 단축키 텍스트
     */
    const getShortcutText = () => {
      const keys = [];
      if (shortcut.ctrl) keys.push('Ctrl');
      if (shortcut.alt) keys.push('Alt');
      if (shortcut.shift) keys.push('Shift');
      const key = shortcut.key === ' ' ? 'Spacebar' : shortcut.key;

      // 기능키는 그대로 사용, 일반 키는 대문자로 변환
      /*const isFunctionKey = Object.values(FUNCTION_KEYS).includes(shortcut.key as any);
    keys.push(isFunctionKey ? shortcut.key : shortcut.key.toUpperCase());*/
      keys.push(key);

      return keys.join(' + ');
    };

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

    /**
     * 키보드 이벤트 핸들러
     * 단축키 감지 및 처리
     */
    const handleKeyPress = useCallback(
      (e: KeyboardEvent) => {
        if (shortcut.enableShortcut === false) return;
        if (isLoading || disabled) return;
        // if (shortcut.key === 'F5') return;

        if (disableOnInput && (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) {
          return;
        }

        let keyMatch = false;

        // 숫자키 매칭
        if (/^[0-9]$/.test(shortcut.key)) {
          keyMatch = e.key === shortcut.key || e.code === `Digit${shortcut.key}`;
        }
        // 기능키 매칭
        else if (Object.values(FUNCTION_KEYS).includes(shortcut.key as any)) {
          keyMatch = e.key === shortcut.key;
        }
        // 일반 키 매칭
        else {
          keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        }

        // 보조키 매칭
        const modifierMatch =
          (!shortcut.alt || e.altKey) &&
          (!e.altKey || shortcut.alt) &&
          (!shortcut.ctrl || e.ctrlKey) &&
          (!e.ctrlKey || shortcut.ctrl) &&
          (!shortcut.shift || e.shiftKey) &&
          (!e.shiftKey || shortcut.shift);

        if (keyMatch && modifierMatch) {
          if (BROWSER_FUNCTION_KEYS[shortcut.key as keyof typeof BROWSER_FUNCTION_KEYS]) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
          onClick();
        }
      },
      [onClick, shortcut, isLoading, disabled, disableOnInput],
    );

    useEffect(() => {
      // 전역 이벤트 리스너 등록 (캡처 페이즈)
      if (!orderModalType.active) {
        window.addEventListener('keydown', handleKeyPress, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyPress, { capture: true });
      }
    }, [handleKeyPress]);

    if (isButton) {
      return (
        <>
          <button
            ref={ref as React.Ref<HTMLButtonElement>}
            className={`shortcut-button ${className} ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
              isBlueRounded ? 'border-blue-thick' : ''
            }`}
            onClick={handleClick}
            disabled={isLoading || disabled}
            data-tooltip-id={tooltipId}
            data-tooltip-content={`${getShortcutText()}`}
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
          data-tooltip-content={`Tip : ${title || shortcut.description || ''} ${title ? ' ' : ''}단축키는 ( ${getShortcutText()} ) 이에요`}
        >
          {isLoading ? loadingText || 'Loading...' : children}
        </li>
        <Tooltip id={tooltipId} place={tooltipPlace || 'top'} />
      </>
    );
  },
);

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
CustomShortcutButton.displayName = 'CustomShortcutButton';
export default CustomShortcutButton;
