import html2canvas from 'html2canvas';

export const toJpeg = (ref: React.RefObject<HTMLDivElement | null>, filename: string, setIsLoading: (isLoading: boolean) => void) => {
  if (ref.current) {
    if (typeof window !== 'undefined') {
      html2canvas(ref.current, { scale: 3 })
        .then((canvas) => {
          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.target = '_self';
          link.download = filename + '.png';
          link.click();
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }
};
