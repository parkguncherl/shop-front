import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { toastError, toastSuccess } from '../ToastMessage';
import { callPreviewPrint } from './print';
import PrintWmsDefault from './PrintWmsDefault';

interface Props {
  children?: React.ReactNode;
  selectedDetail?: any;
  isPrinting?: boolean;
  setIsPrinting?: any;
  type?: string;
}

const PrintWmsLayout = ({ children, selectedDetail, isPrinting, setIsPrinting, type }: Props) => {
  const [detail, setDetail] = useState<any>(null);
  console.log('selectedDetail [' + type + '] ========>', selectedDetail);

  useEffect(() => {
    console.log('isPrinting', isPrinting);
    if (Array.isArray(selectedDetail) && selectedDetail.length > 0) {
      setDetail(selectedDetail[0]);
    }
  }, [selectedDetail]);

  /** 프린트 관련 */
  const previewRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    if (isPrinting && selectedDetail) {
      callPreviewPrint(previewRefs.current); // printThis 함수
      setIsPrinting(false);
    }
  }, [isPrinting, selectedDetail]);

  /** 오른쪽클릭 */
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY });
  };
  // 다른 곳 클릭시 전체탭 닫기 사라지게하기
  const contextMenuRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        closeContextMenu();
      }
    };
    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, []);

  const divRef = previewRefs.current[0];
  // 이미지 다운로드
  const handleImageDownload = async () => {
    console.log('디아브', divRef);
    try {
      const div = divRef;
      if (!div) {
        return;
      }
      const canvas = await html2canvas(div, { scale: 2, useCORS: true });
      canvas.toBlob((blob) => {
        if (blob !== null) {
          saveAs(blob, `전표.png`);
          toastSuccess('이미지가 다운로드 되었습니다.');
        }
      });
    } catch (error) {
      toastError('다운로드 실패');
    }
    closeContextMenu();
  };
  // 이미지 카피
  const handleImageCopy = async () => {
    try {
      const div = divRef;
      if (!div) {
        return;
      }
      const canvas = await html2canvas(div, { scale: 2, useCORS: true });
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            // 클립보드에 이미지 복사
            await navigator.clipboard.write([
              new ClipboardItem({
                [blob.type]: blob,
              }),
            ]);
            toastSuccess('이미지가 클립보드에 복사되었습니다.');
          } catch (error) {
            console.log('클립보드에 복사 실패 ==> but 복사 되었을수 있다.');
          }
        } else {
          console.error('Blob 생성 실패');
        }
      });
    } catch (error) {
      console.error('Error converting div to image:', error);
    }
    closeContextMenu();
  };

  return (
    <>
      {/* ---------------------------------------------------------
       오른쪽클릭 Div
       ------------------------------------------------------------ */}
      {contextMenu.visible && (
        <ul
          className={`rightClickMenu ${contextMenu.visible ? 'on' : ''}`}
          ref={contextMenuRef}
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
        >
          <li>
            <button onClick={handleImageCopy}>· 이미지 복사</button>
            <button onClick={handleImageDownload}>· 이미지 다운로드</button>
          </li>
        </ul>
      )}
      <div className={`printDiv ${isPrinting ? 'on' : ''}`} onContextMenu={handleContextMenu}>
        <PrintWmsDefault className={'wms'} selectedDetail={detail} />
      </div>
      {/* ---------------------------------------------------------
       프린트 영수증 Div
       ------------------------------------------------------------ */}
      {selectedDetail?.map((item: any, index: number) => (
        <PrintWmsDefault key={`item-${index}`} selectedDetail={item} ref={(el) => (previewRefs.current[index] = el)} className={'print wms'} />
      ))}
    </>
  );
};

export default PrintWmsLayout;
