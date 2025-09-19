import React, { useRef, useEffect } from 'react';

interface CopyableImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

const CopyableImage: React.FC<CopyableImageProps> = ({ src, alt, width, height }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;

    if (img && canvas) {
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0, img.width, img.height);
      };

      const handleCopy = (e: ClipboardEvent) => {
        if (typeof window !== 'undefined') {
          const selection = window.getSelection();
          if (selection?.containsNode(img, true)) {
            e.preventDefault();
            e.clipboardData?.setData('text/html', canvas.toDataURL('image/png'));
          }
        }
      };
      if (typeof window !== 'undefined') {
        document.addEventListener('copy', handleCopy);
      }

      return () => {
        if (typeof window !== 'undefined') {
          document.removeEventListener('copy', handleCopy);
        }
      };
    }
  }, [src]);

  return (
    <div>
      <img ref={imgRef} src={src} alt={alt} width={width} height={height} style={{ border: '2px solid #333', margin: '20px' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default CopyableImage;
