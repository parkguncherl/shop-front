import React from 'react';
import styles from '../styles/loading.module.scss';

interface Props {
  isLoading: boolean;
}

const CustomGridLoading = (props: Props) => {
  return props.isLoading ? (
    <div className={styles.grid_loading_box}>
      <div className={styles.loading}></div>
      <div className={styles.text}>loading</div>
    </div>
  ) : (
    <div></div>
  );
};

export default CustomGridLoading;
