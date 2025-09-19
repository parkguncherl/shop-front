import React from 'react';

// 스타일 정의
const containerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '0 20px 0 20px',
  width: '100%',
  height: '100%',
  backgroundColor: '#f0f8ff',
  borderRadius: '10px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
};

const titleStyle = {
  fontSize: '24px',
  marginBottom: '20px',
  color: '#2c3e50',
};

const statItemStyle = {
  paddingBottom: '10px',
  fontSize: '18px',
};

const highlightStyle = {
  fontWeight: 'bold',
  color: '#2980b9',
};

// ProductStatsPanel 컴포넌트 정의
const ProductStatsPanel = () => {
  return (
    <div style={containerStyle}>
      <div></div>
      <div style={titleStyle}>상품 통계</div>
      <div style={statItemStyle}>
        총 상품 수: <span style={highlightStyle}>3342개</span>
      </div>
      <div style={statItemStyle}>
        재고 있는 상품: <span style={highlightStyle}>3342개</span>
      </div>
      <div style={statItemStyle}>
        품절된 상품: <span style={highlightStyle}>3342개</span>
      </div>

      <span style={highlightStyle}>커스텀 해서 사용</span>
    </div>
  );
};

export default ProductStatsPanel;
