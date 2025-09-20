import React, { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { Modal } from 'antd';
import { PopupHeader } from './PopupHeader';

// const cx = classNames.bind(styles);

interface Props {
  children: React.ReactNode;
  open: boolean;
  title: string | React.ReactNode;
  subTitle?: string | React.ReactNode;
  draggable?: boolean;
  style?: React.CSSProperties;
  width: number;
  height?: number;
  onClose?: () => void;
  footer?: React.ReactNode;
  isEscClose: boolean; // esc 키를 사용하여 모달을 닫는 기능을 활성화할지 여부, 변경할 시 'escClosingBehaviorEnabled' 상태 update
  isSubPopUpOpened?: boolean; // 본 컴포넌트를 사용하는 팝업에 하위 팝업 존재할 시, 하위 팝업의 열림 상태 전달하면 열림 혹은 닫힘 동작에 관련된 지원을 받을 수 있다. todo 추후 하위 팝업 오픈 시 필요한 동작을 추가 정의할 수 있음
  className?: string;
  alignRight?: boolean;
}

export const PopupLayout = ({
  children,
  isEscClose,
  isSubPopUpOpened,
  open,
  title,
  subTitle,
  draggable = true,
  style,
  width,
  height,
  onClose,
  className,
  footer = true,
  alignRight = false,
  ...props
}: Props) => {
  const el = useRef<HTMLDivElement | null>(null);
  const draggleRef = useRef<any>();
  const [disabled, setDisabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  });

  /** esc 닫힘 동작 사용 가능 여부 */

  const onStart = (_e: any, uiData: any) => {
    // eslint-disable-next-line no-unsafe-optional-chaining
    const { clientWidth, clientHeight } = window?.document?.documentElement;
    const targetRect = draggleRef?.current?.getBoundingClientRect();
    if (!disabled) {
      setBounds({
        left: -targetRect?.left + uiData?.x,
        right: clientWidth - (targetRect?.right - uiData?.x),
        top: -targetRect?.top + uiData?.y,
        bottom: clientHeight - (targetRect?.bottom - uiData?.y),
      });
    }
  };

  /*useEffect(() => {
    if (title == '기타입하 추가') console.log(open, escClosingBehaviorEnabled);
    if (open && escClosingBehaviorEnabled) {
      // 열림
      if (typeof window != 'undefined') {
        if (title == '기타입하 추가') console.log('useEffect ----------', escClosingBehaviorEnabled);
        document.addEventListener('keydown', (e) => escKeyClose(e, true));
      }
    } else {
      // 닫힘
      return () => {
        if (typeof window !== 'undefined') {
          document.removeEventListener('keydown', (e) => escKeyClose(e, false));
        }
      };
    }
  }, [open, escClosingBehaviorEnabled]);*/

  useEffect(() => {
    if (open && onClose) {
      const escKeyClose = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (isEscClose) {
            onClose();
          }
        }
      };

      document.addEventListener('keydown', escKeyClose);
      return () => {
        // 이벤트 회수 영역
        document.removeEventListener('keydown', escKeyClose);
      };
    }
  }, [open]);

  //==============================
  // confirm 관련
  //==============================
  const [confirmModal, setConfirmModal] = useState(false);

  // 팝업 오픈했을때 스크롤 없애기
  const updateBodyOverflow = () => {
    // 'ant-modal-wrap' 클래스가 있는지 확인
    const isPopupOpen = document.querySelectorAll('.ant-modal-wrap').length > 0;
    if (isPopupOpen) {
      document.body.style.overflow = 'hidden'; // 팝업이 있으면 스크롤 막음
    } else {
      document.body.style.overflow = 'auto'; // 팝업이 없으면 스크롤 허용
    }
  };
  useEffect(() => {
    updateBodyOverflow(); // open 상태가 바뀔 때마다 호출
    return () => {
      updateBodyOverflow(); // 컴포넌트 언마운트 시에도 호출하여 스크롤 복원
    };
  }, [open]);

  return (
    <Modal
      centered={true}
      width={width == 100 ? '100%' : width}
      // height={height}
      className={`${className} popUpGroup`}
      style={{
        ...(alignRight && {
          top: 200,
          position: 'absolute',
          right: 0,
        }),
      }}
      destroyOnClose
      closable={true}
      keyboard={false}
      open={open}
      onCancel={(e) => {
        if (onClose) {
          onClose();
        }
      }}
      maskClosable={false} // 팝업 영역 외 클릭시 닫기 방지
      title={
        <>
          <PopupHeader title={typeof title === 'string' ? title.toString() : <>{title}</>} subTitle={subTitle} />
        </>
      }
      footer={footer}
      modalRender={(modal: any) => (
        <Draggable nodeRef={draggleRef} disabled={disabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)} handle=".ant-modal-header">
          <div ref={draggleRef}>{modal}</div>
        </Draggable>
      )}
    >
      <div ref={el} className="popBody">
        {children}
      </div>
    </Modal>
  );
};
