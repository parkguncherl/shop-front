import ModalLayout from './ModalLayout';
import React, { PropsWithChildren, ReactNode, useEffect, useRef } from 'react';
import { PopupFooter } from './popup';
import styled from 'styled-components';
import { FieldValues, Path, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../libs';
import dayjs from 'dayjs';

interface Props<FT extends FieldValues> {
  open: boolean;
  title?: string;
  title2?: ReactNode;
  warningMessage?: string;
  width?: number;
  //style?: React.CSSProperties;
  onConfirm?: () => void | Promise<void>;
  onClose?: (reason: string) => void; // 어떠한 동작으로 인해(이를 태면 컨펌 동작으로 인하여) 본 콜백이 동작하였는지 여부를 암시하는 reason 인자를 포함, 확인 버튼 클릭으로 인한 동작의 경우 인자는 confirm'
  //  onKeyUp?: (event: KeyboardEvent) => void | string;
  //  onKeyDown?: (event: KeyboardEvent) => void | string;
  className?: string;
  confirmText?: string;
  innerFormPropList?: {
    name: Path<FT>;
    label: string;
    placeholder?: string | undefined;
    required?: boolean;
  }[];
  leftBtn?: string;
  leftBtnFn?: () => void | Promise<void>;
  //active?: boolean;
}
/**
 * 컨펌 모달 공통 컴포넌트
 * --- onClose 의 인자 ---
 * confirm: 확인
 * outside: 모달 이외 영역 클릭
 * cancel: 취소
 * close: 그 이외 닫힘 동작
 * */
export function ConfirmModal<FT extends FieldValues>({
  open,
  title,
  title2,
  warningMessage,
  width,
  //style,
  onConfirm,
  onClose,
  //onKeyUp,
  //onKeyDown,
  className,
  confirmText,
  innerFormPropList,
  leftBtn,
  leftBtnFn,
}: PropsWithChildren<Props<FT>>) {
  // 외부 클릭 시 모달 닫기
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonConfConfirmRef = useRef<HTMLButtonElement>(null);
  const buttonConfCancelRef = useRef<HTMLButtonElement>(null);

  const isConfirmSaveRef = useRef(false);

  const {
    formState: { errors, isValid },
  } = useForm<any>({
    resolver: yupResolver(YupSchema.RetailRegRequest()), // 완료
    defaultValues: {
      compPrnCd: 'B',
      remainYn: 'Y',
      vatYn: 'N',
      regYmd: dayjs().format('YYYY-MM-DD'),
    },
    mode: 'onSubmit',
  });

  /*const handleRef = (node: HTMLButtonElement | null) => {
    if (node && open) {
      setTimeout(() => {
        //        console.log('==========================================================');
        node.focus(); // 최초에 focus
      }, 100);

      const handleArrowKey = (event: KeyboardEvent) => {
        console.log('event.key=======>', event.key);
        if (event.key === 'Escape') {
          if (onClose) {
            onClose('close');
          }
        } else if (event.key === 'ArrowLeft') {
          node.focus();
        } else if (event.key === 'ArrowRight') {
          buttonConfCancelRef.current?.focus();
        }
      };

      // 키 이벤트 리스너 추가
      window.addEventListener('keydown', handleArrowKey);

      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      return () => {
        window.removeEventListener('keydown', handleArrowKey);
      };
      // Ref가 연결된 이후 실행할 로직
    }
  };*/

  const handleArrowKey = (event: KeyboardEvent) => {
    console.log('event.key=======>', event.key);
    if (event.key === 'Escape') {
      if (onClose) {
        onClose('close');
      }
    } else if (event.key === 'ArrowLeft') {
      buttonConfConfirmRef.current?.focus();
    } else if (event.key === 'ArrowRight') {
      buttonConfCancelRef.current?.focus();
    }
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        buttonConfConfirmRef.current?.focus();
      }, 100);

      // 키 이벤트 리스너 추가
      window.addEventListener('keydown', handleArrowKey);
      return () => {
        // 컴포넌트 언마운트 시 이벤트 리스너 제거, 중복 클릭 방지를 위한 ref 를 초기화
        window.removeEventListener('keydown', handleArrowKey);
        isConfirmSaveRef.current = false;
      };
    }
  }, [open]);

  /** 영역 외 클릭시 닫기 ( 컨펌창만 적용 ) */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const confirmRef = document.querySelector('.confirm');

      if (confirmRef && !confirmRef.contains(target)) {
        if (onClose) {
          onClose('close');
        }
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <ModalLayout
      open={open}
      title={''}
      width={width ?? 400}
      className={`${className} confirm`}
      footer={
        <PopupFooter>
          <div className="left">
            {leftBtn ? (
              <button
                className={'btn'}
                onClick={() => {
                  if (leftBtnFn) {
                    const returned = leftBtnFn();
                    if (returned instanceof Promise) {
                      // promise 값 반환할 시 체이닝을 통한 onClose 비동기 처리
                      returned
                        .then(() => {
                          // 성공 반환 시 onClose 호출
                          if (onClose) {
                            onClose('confirm');
                          }
                        })
                        .catch((error) => {
                          // 에러 발생 시 동작은 에러를 반환하는 영역에서 별도로 구현할 것(본 컴포넌트는 onClose 호출을 제한하는 정도만 관할)
                          console.error(error);
                        });
                    } else {
                      // void 일 시 비동기 처리 미적용, 별도 검증 절차 없이 onClose 호출
                      if (onClose) {
                        onClose('confirm');
                      }
                    }
                  }
                }}
              >
                {leftBtn ? leftBtn : ''}
              </button>
            ) : (
              ''
            )}
          </div>
          <div className="right">
            <button
              className={'btn btnBlue'}
              ref={buttonConfConfirmRef}
              tabIndex={0}
              onClick={() => {
                if (!isConfirmSaveRef.current) {
                  isConfirmSaveRef.current = true;
                  if (onConfirm) {
                    const returned = onConfirm();
                    if (returned instanceof Promise) {
                      // promise 값 반환할 시 체이닝을 통한 onClose 비동기 처리
                      returned
                        .then(() => {
                          // 성공 반환 시 onClose 호출
                          if (onClose) {
                            onClose('confirm');
                          }
                        })
                        .catch((error) => {
                          // 에러 발생 시 동작은 에러를 반환하는 영역에서 별도로 구현할 것(본 컴포넌트는 onClose 호출을 제한하는 정도만 관할)
                          console.error(error);
                        });
                    } else {
                      // void 일 시 비동기 처리 미적용, 별도 검증 절차 없이 onClose 호출
                      if (onClose) {
                        onClose('confirm');
                      }
                    }
                  }
                } else {
                  setTimeout(() => {
                    isConfirmSaveRef.current = false;
                  }, 5000); // 5초후 복원
                }
              }}
            >
              {confirmText ? confirmText : '확인'}
            </button>
            <button
              className={'btn'}
              ref={buttonConfCancelRef}
              tabIndex={1}
              onClick={() => {
                if (onClose) {
                  onClose('cancel');
                }
              }}
            >
              취소
            </button>
          </div>
        </PopupFooter>
      }
      onClose={() => {
        if (onClose) {
          onClose('close');
        }
      }}
    >
      <Container /* ref={modalRef} */>
        {/*<Image src={ConfirmIcon} alt={''} style={{ width: 50, height: 50 }} />*/}
        {title2 ? title2 : <div dangerouslySetInnerHTML={{ __html: title || '' }} />}
        {warningMessage ? <div className={'warn_txt'}>{warningMessage}</div> : null}
      </Container>
    </ModalLayout>
  );
}
const Container = styled.div.attrs({})<React.HTMLAttributes<HTMLDivElement>>`
  display: flex;
  align-items: center;
  height: 100px;
  justify-content: space-around;
  flex-direction: column;

  .warn_txt {
    color: rgb(206, 58, 58);
  }
`;
