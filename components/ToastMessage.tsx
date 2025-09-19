import { Slide, toast, ToastOptions } from 'react-toastify';
import Image from 'next/image';
import SuccessIcon from '../public/ico/ico_success.svg';
import ErrorIcon from '../public/ico/ico_error.svg';

/** Toast Message(정상) */
export const toastSuccess = (message?: string, config?: ToastOptions) => {
  toast.dismiss();

  toast.success(message || '정상 처리되었습니다.', {
    position: 'bottom-center',
    autoClose: 1000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: 'light',
    transition: Slide,
    ...config,
    icon: () => <Image src={SuccessIcon} alt={''} />,
  });
};

/** Toast Message(정보) */
export const toastInfo = (message?: string, config?: ToastOptions) => {
  toast.dismiss();

  toast.info(message || '정상 처리되었습니다.', {
    position: 'bottom-center',
    autoClose: 60000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: 'light',
    transition: Slide,
    ...config,
    icon: () => <Image src={SuccessIcon} alt={''} />,
  });
};

/** Toast Message(정상) */
export const toastSuccessEnableCancel = ({ message, config, cancelFunction }: { message?: string; config?: ToastOptions; cancelFunction: any }) => {
  if (typeof cancelFunction !== 'function') {
    alert('cancelFunction is not a function');
    return;
  }

  // `ESC` 키 이벤트 리스너 등록
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      toast.dismiss(); // 현재 토스트 닫기
      cancelFunction(); // 취소 함수 실행
      document.removeEventListener('keydown', handleKeyDown); // 리스너 제거
    }
  };

  toast.dismiss();

  // 토스트 표시
  const toastId = toast.success(
    <div>
      <p>{message || '정상 처리되었습니다.'}</p>
      <button className="btn cancle" onClick={() => cancelFunction()}>
        실행 취소
      </button>
    </div>,
    {
      position: 'bottom-center',
      autoClose: 10000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: 'light',
      transition: Slide,
      ...config,
    },
  );

  // 토스트 상태 변경 감지
  toast.onChange((payload) => {
    if (payload.id === toastId && payload.status === 'added') {
      // `ESC` 키 이벤트 리스너 추가
      document.addEventListener('keydown', handleKeyDown);
    }
    if (payload.id === toastId && payload.status === 'removed') {
      // `ESC` 키 이벤트 리스너 제거
      document.removeEventListener('keydown', handleKeyDown);
    }
  });
};

/** Toast Message(에러) */
export const toastError = (message?: string, config?: ToastOptions) => {
  toast.dismiss();
  toast.error(message || '오류가 발생했습니다.', {
    position: 'bottom-center',
    autoClose: 5000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: 'light',
    transition: Slide,
    ...config,
    icon: () => <Image src={ErrorIcon} alt={''} />,
  });
};
