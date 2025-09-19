import styles from '../styles/error.module.scss';
import { Button } from '../components';
import { useRouter } from 'next/router';

const Error = () => {
  const router = useRouter();
  return (
    <div className={styles.wrap}>
      <div className={styles.error_box}>
        <div className={styles.img}></div>
        <dl>
          <dt>
            {'접근 권한이'} <span>{'없습니다.'}</span>
          </dt>
          <dd>{'해당 페이지에 접근할 수 없습니다. 관리자에게 문의하세요.'}</dd>
        </dl>
        <div className={'btn_box_group center'}>
          <div className={'btn_box'}>
            <button className={'btn_grayline'} onClick={() => router.back()}>
              {'이전 페이지로 이동'}
            </button>
          </div>
          <div className={'btn_box'}>
            <button className={'btn_blue'} onClick={() => router.push('/', undefined, { shallow: true })}>
              {'홈 바로가기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Error;
