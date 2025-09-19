export function callPreviewPrint(previewRefs) {
  console.log('확인', previewRefs);
  // jQuery와 printThis가 로드되었는지 확인
  if (typeof $ === 'undefined' || !$.fn.printThis) {
    console.error('jQuery or printThis is not loaded yet.');
    return;
  }

  // 인쇄 작업
  if (Array.isArray(previewRefs) && previewRefs.length > 0) {
    console.log('ref : ', previewRefs);
    previewRefs.forEach((ref) => {
      if (ref) {
        $(ref).printThis({
          // debug: true,
          // importCSS: false,
          // importStyle: false,
          loadCSS: '/styles/print.css',
          afterPrint: () => {
            console.log('Printing finished:', ref);
          },
        });
      }
    });
  }
}
