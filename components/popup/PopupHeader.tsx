import React from 'react';
import styles from '../../styles/delete/popup.module.scss';

interface Props {
  title?: string | React.ReactNode;
  subTitle?: string | React.ReactNode;
  onClick?: () => void;
  type?: 'success' | 'error' | 'confirm' | 'normal' | 'findpass';
  style?: React.CSSProperties;
}

export const PopupHeader = ({ title, subTitle, onClick, type = 'normal', style }: Props) => {
  //const { t } = useTranslation();
  return (
    <div className="popupHeader">
      {type == 'success' && <div className={`${styles.img} ${styles.success}`}></div>}
      {type == 'error' && <div className={`${styles.img} ${styles.error}`}></div>}
      {type == 'confirm' && <div className={`${styles.img} ${styles.confirm}`}></div>}
      {type == 'normal' && <h3>{title}</h3>}
      {type == 'normal' && subTitle && <h4>{subTitle}</h4>}
      {type == 'findpass' && (
        <div className={'login_sub_header'}>
          <h3>{title}</h3>
        </div>
      )}
      {/*<div className={styles.close}>*/}
      {/*  <div>*/}
      {/*    <Button onClick={onClick}>{t('닫기') || ''}</Button>*/}
      {/*  </div>*/}
      {/*</div>*/}
    </div>
  );
};
