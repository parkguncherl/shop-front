import React, { useState } from 'react';
import styles from '../../styles/delete/etc/print.module.scss';

interface ReceiptData {
  companyName: string;
  number: string;
  date: string;
  qrCode: string;
  topMessage: string;
  items: { name: string; price: number; orderAmt: number }[];
  bottomMessage: string;
  previousBalance: number;
  cashAmount: number;
  currentBalance: number;
}

const ReceiptPreview: React.FC<{ data: ReceiptData }> = ({ data }) => {
  return (
    <div className={styles.receiptPreview}>
      <h3>영수증</h3>
      <div className={styles.header}>
        <span>{data.number}</span>
        <span>{data.date}</span>
      </div>
      <div>────────────────────────</div>
      <div className={styles.qrCode}>{data.qrCode}</div>
      <div className={styles.companyName}>{data.companyName}</div>
      <div className={styles.topMessage} dangerouslySetInnerHTML={{ __html: data.topMessage.replace(/\n/g, '<br>') }} />
      <div className={styles.itemList}>
        <div>────────────────────────</div>
        <div className={styles.itemHeader}>
          <span>품명</span>
          <span>단가</span>
          <span>수량</span>
          <span>금액</span>
        </div>
        <div>────────────────────────</div>
        <div className={styles.divider}></div>
        {data.items.map((item, index) => (
          <div key={index} className={styles.item}>
            <span className={styles.itemName}>{item.name}</span>
            <span className={styles.itemPrice}>{item.price.toLocaleString()}</span>
            <span className={styles.itemQuantity}>{item.orderAmt}</span>
            <span className={styles.itemTotal}>{(item.price * item.orderAmt).toLocaleString()}</span>
          </div>
        ))}
        <div> </div>
        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>전&emsp;&emsp;잔</span>
            <span>{data.previousBalance.toLocaleString()}</span>
          </div>
          <div className={styles.totalRow}>
            <span>당일합계</span>
            <span>{data.items.reduce((sum, item) => sum + item.price * item.orderAmt, 0).toLocaleString()}</span>
          </div>
          <div className={styles.totalRow}>
            <span>현금금액</span>
            <span>{data.cashAmount.toLocaleString()}</span>
          </div>
          <div className={styles.totalRow}>
            <span>당&emsp;&emsp;잔</span>
            <span>{data.currentBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div> </div>
      <div> ==============================================</div>
      <div className={styles.bottomMessage} dangerouslySetInnerHTML={{ __html: data.bottomMessage.replace(/\n/g, '<br>') }} />
    </div>
  );
};

const ReceiptForm: React.FC<{ data: ReceiptData; onUpdate: (data: Partial<ReceiptData>) => void }> = ({ data, onUpdate }) => {
  return (
    <div className={styles.receiptForm}>
      <div className={styles.formHeader}>
        <button className={styles.actionButton}>저장</button>
        <button className={styles.actionButton}>테스트인쇄</button>
      </div>
      <div className={styles.formSection}>
        <label>
          <input type="checkbox" checked />
          이미지 인쇄함
        </label>
        <label>
          <input type="checkbox" />
          이미지 중앙정렬
        </label>
        <div className={styles.qrCodePreview}>{data.qrCode}</div>
      </div>
      <div className={styles.formSection}>
        <label>
          <input type="checkbox" checked />
          전표타이틀 인쇄함
        </label>
        <span className={styles.note}>(관리판매처시)</span>
        <input type="text" value={data.companyName} onChange={(e) => onUpdate({ companyName: e.target.value })} placeholder="전표타이틀 입력" />
      </div>
      <div className={styles.formSection}>
        <label>
          <input type="checkbox" checked />
          상단메세지 인쇄함
        </label>
        <span className={styles.note}>(관리판매처시)</span>
        <textarea value={data.topMessage} onChange={(e) => onUpdate({ topMessage: e.target.value })} placeholder="상단메세지 입력" />
      </div>
      <div className={styles.formSection}>
        <label>
          <input type="checkbox" checked />
          하단메세지 인쇄함
        </label>
        <span className={styles.note}>(관리판매처시)</span>
        <textarea value={data.bottomMessage} onChange={(e) => onUpdate({ bottomMessage: e.target.value })} placeholder="하단메세지 입력" />
      </div>
    </div>
  );
};

const PrintSetting: React.FC = () => {
  const [receiptData, setReceiptData] = useState<ReceiptData>({
    number: '0001',
    date: '2024-07-15(월) 14:52:06',
    qrCode: '[QR 코드 이미지]',
    companyName: 'FRILLMOND 프릴몬드',
    topMessage:
      '디오토 1층 A-24호\n02.2117.4524\n010.2486.5129\nKAKAO TALK ID : FRILLMOND5129\nKAKAO STORY ID : FRILLMOND\n신상마켓 ID : FRRLLMOND\nWECHAT ID : FRILLMOND24\n<카카오스토리 소식받기♡>\n\n▶ 매장오픈 밤12시 이전 카톡주문시\n   일찍 상품을 준비해드릴 수 있어요\n▶ 오늘인 입금 거래시 당일\n   "세금계산서" 발행 해주셔야 합니다',
    items: [
      { name: '단가라롱티/WH/S', price: 13500, orderAmt: 2 },
      { name: '정일자반바지/BK/27', price: 25000, orderAmt: 1 },
    ],
    bottomMessage:
      '*입금주: 신한은행 100-031-217379 (주)몬드\n\n*등장입금시 꼭 세금계산서 발행하여합니다.\n\n*전자세금계산서 매월 10일 마감 (VAT 선입금)\n\n*상기금액은 부가세별도 금액입니다.',
    previousBalance: 60000,
    cashAmount: 52000,
    currentBalance: 112000,
  });

  const handleUpdate = (newData: Partial<ReceiptData>) => {
    setReceiptData({ ...receiptData, ...newData });
  };

  return (
    <div className={styles.printSetting}>
      <ReceiptPreview data={receiptData} />
      <ReceiptForm data={receiptData} onUpdate={handleUpdate} />
    </div>
  );
};

export default PrintSetting;
