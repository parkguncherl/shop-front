import React from 'react';
import { useSession } from 'next-auth/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import styles from '../../../styles/mobile.module.scss'; // 경로 및 파일명 변경

/**
 * 재고정보 메인 페이지 컴포넌트
 * SKU단위와 LOC단위 보기를 전환할 수 있는 메인 컴포넌트
 */
const MobileAsn: React.FC = () => {
  // 세션 정보
  const session = useSession();
  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <button className={styles.navButton}>프필트</button>
        <button className={styles.navButton}>김예솔</button>
        <button className={styles.navButton}>경번사</button>
      </nav>

      <div className={styles.search}>
        <input type="text" placeholder="김예솔" className={styles.searchInput} />
      </div>

      <main className={styles.main}>
        <button className={styles.mainButtonActive}>경번사</button>
        <button className={styles.mainButton}>생산처 2</button>
        <button className={styles.mainButton}>생산처 3</button>
        <button className={styles.mainButton}>생산처 4</button>
        <button className={styles.mainButton}>생산처 5</button>
        <button className={styles.mainButton}>생산처 6</button>
        <button className={styles.mainButton}>생산처 7</button>
        <button className={styles.mainButton}>생산처 8</button>
        <button className={styles.mainButton}>생산처 9</button>
        <button className={styles.mainButton}>생산처 10</button>
        <div className={styles.dots}>...</div>
        <button className={styles.loadMore}>생물보기 </button>
      </main>

      <footer className={styles.footer}>
        <button className={styles.footerButton}>일반 발주</button>
        <button className={styles.footerButton}>수산 발주</button>
      </footer>
    </div>
  );
};

export default React.memo(MobileAsn);
