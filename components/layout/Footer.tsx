import React, { useState } from 'react';
import styles from '../../styles/layout/footer.module.scss';
import Link from 'next/link';
import { useCommonStore } from '../../stores';
import AccessPrivacyPop from '../popup/common/accessPrivacyPop';

export const Footer = () => {
  const [modalType, closeModal, openModal] = useCommonStore((s) => [s.modalType, s.closeModal, s.openModal]);
  const [privacyType, setPrivacyType] = useState<string | null>(null);

  const handleOpenModal = (e: React.MouseEvent, number: string) => {
    e.preventDefault();
    setPrivacyType(number);
    openModal('PRIVACY'); // openModal 호출
  };

  return (
    <footer className={`${styles.footer}`}>
      <div className={`${styles.logo}`}></div>
      <div>
        <ul>
          {/*<li>*/}
          {/*  <Link href="/oms/policy/accessPrivacy">*/}
          {/*    이용약관 <span style={{ margin: '0 10px' }}>|</span> 개인정보처리방침*/}
          {/*  </Link>*/}
          {/*</li>*/}
          <li>
            <Link href={''} onClick={(e) => handleOpenModal(e, '1')}>
              개인정보 처리방침
            </Link>
          </li>
          <li>
            <Link href={''} onClick={(e) => handleOpenModal(e, '2')}>
              회원가입 이용약관
            </Link>
          </li>
          <li>
            <Link href={''} onClick={(e) => handleOpenModal(e, '3')}>
              서비스 이용약관
            </Link>
          </li>
        </ul>
        <p>COPYRIGHT 2024 © WISE NETWORK. ALL RIGHTS RESERVED.</p>
      </div>
      {modalType.type === 'PRIVACY' && modalType.active && <AccessPrivacyPop privacyType={privacyType} />}
    </footer>
  );
};
