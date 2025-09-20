import Postcode, { Address } from 'react-daum-postcode';
import ModalLayout from './ModalLayout';
import { useTranslation } from 'react-i18next';

interface Props {
  onClose: () => void;
  onComplete: (data: Address) => void;
}

export default function DaumPostCode({ onClose, onComplete }: Props) {
  const { t } = useTranslation();

  return (
    <ModalLayout open={true} title={t('주소찾기') || ''} width={600} onClose={onClose} footer={null}>
      <Postcode onComplete={onComplete} onClose={onClose} style={{ height: 450 }} />
    </ModalLayout>
  );
}
