import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { Modal } from 'antd';
import Image from 'next/image';
import CloseIcon from '../public/ico/ico_close.svg';

interface Props {
  open: boolean;
  title: string;
  draggable?: boolean;
  style?: React.CSSProperties;
  width: number;
  onClose?: () => void;
  footer?: React.ReactNode;
  //isEscClose?: boolean;
  className?: string;
}
export default function ModalLayout({
  open,
  title,
  draggable = true,
  style,
  className,
  width,
  onClose,
  footer,
  //isEscClose = true,
  ...props
}: PropsWithChildren<Props>) {
  const [confirmModal, setConfirmModal] = useState(false);
  const draggleRef = useRef<any>();
  const [disabled, setDisabled] = useState<boolean>(true);
  const [bounds, setBounds] = useState({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  });

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

  /*const escKeyClose = (e: KeyboardEvent) => {
    console.log(e.key);
    if (e.key === 'Escape') {
      if (isEscClose == false) {
        return;
      }
      if (onClose) {
        onClose();
      }
    }
  };*/

  /*useEffect(() => {
    if (typeof window !== 'undefined') {
      document.addEventListener('keydown', escKeyClose);
    }

    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('keydown', escKeyClose);
      }
    };
  });*/

  return (
    <Modal
      {...props}
      width={width}
      destroyOnClose
      closable={true}
      keyboard={false}
      maskClosable={false}
      className={className}
      centered
      title={
        <div
          style={{
            width: '100%',
            cursor: draggable ? 'move' : 'default',
            fontWeight: 500,
            fontSize: 20,
            color: '#333',
          }}
          onMouseOver={() => {
            if (draggable) {
              setDisabled(false);
            }
          }}
          onMouseOut={() => {
            setDisabled(true);
          }}
        >
          {title}
        </div>
      }
      open={open}
      onCancel={(e) => {
        if (onClose) {
          onClose();
        }
      }}
      footer={footer}
      closeIcon={<Image alt={''} src={CloseIcon} style={{ width: 13, height: 13 }} />}
      modalRender={(modal: any) => (
        <Draggable nodeRef={draggleRef} disabled={disabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
          <div ref={draggleRef}>{modal}</div>
        </Draggable>
      )}
    >
      {props.children}
    </Modal>
  );
}
