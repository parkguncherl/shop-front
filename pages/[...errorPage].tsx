import styles from '../styles/error.module.scss';
import { Button } from '../components';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

const Error = () => {
  const { t } = useTranslation();

  const router = useRouter();
  return (
    <div className={styles.wrap}>
      <div className={styles.error_box}>
        <div className={styles.img}></div>
        <dl>
          <dt>
            {t('페이지를') || ''} <span>{t('찾을 수 없습니다.') || ''}</span>
          </dt>
          <dd>{t('요청하신 페이지가 제거되었거나, 이름이 변경되었거나, 일시적으로 사용이 중단되었습니다.') || ''}</dd>
        </dl>
        <div className={'btnBoxGroup center'}>
          <div className={'btnArea'}>
            <button className={'btn'} onClick={() => router.back()}>
              {t('이전 페이지로 이동') || ''}
            </button>
          </div>
          <div className={'btnArea'}>
            <button className={'btn'} onClick={() => router.push('/', undefined, { shallow: true })}>
              {t('홈 바로가기') || ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Error;
