import React, { useCallback, useEffect, useState } from 'react';
import ModalLayout from '../components/ModalLayout';

interface Props {
  width: number;
  footer?: React.ReactNode;
}
const useModal = ({ width, footer }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(() => true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(() => false);
  }, []);

  useEffect(() => {
    console.log(isOpen);
  }, [isOpen]);
  return {
    Modal: isOpen
      ? ({ children }: any) => (
          <ModalLayout title={''} open={isOpen} width={width} footer={footer}>
            {children}
          </ModalLayout>
        )
      : () => null,
    open,
    close,
    isOpen,
  };
};

export default useModal;
