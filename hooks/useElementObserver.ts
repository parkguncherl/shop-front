import { useEffect, useRef, useState } from 'react';

type elementType = {
  current: HTMLDivElement | null;
};

const useElementObserver = (elRef: elementType) => {
  const [size, setSize] = useState(0);
  const observer = useRef(
    new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setSize(width);
    }),
  );

  useEffect(() => {
    if (elRef.current) observer.current.observe(elRef.current);

    return () => {
      if (elRef.current) observer.current.unobserve(elRef.current);
    };
  }, [elRef, observer]);

  return size;
};

export default useElementObserver;
