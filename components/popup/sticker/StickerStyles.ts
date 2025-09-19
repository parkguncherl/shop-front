import styled from 'styled-components';

// 스티커 창 전체를 감싸는 컨테이너
export const StickerWindow = styled.div`
  position: fixed;
  width: 450px;
  height: 350px;
  background-color: #444;
  border: 1px solid #555;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  min-width: 450px;
  min-height: 350px;
  resize: none;
`;

// 스티커 상단 타이틀 바
export const TitleBar = styled.div`
  background-color: #333;
  color: #fff;
  padding: 10px;
  cursor: grab;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  user-select: none;
`;

// 닫기 버튼
export const CloseButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  &:hover {
    color: #ff6b6b;
  }
`;

// 텍스트 입력 영역
export const TextArea = styled.textarea`
  width: 100%;
  flex-grow: 1;
  border: none;
  resize: none;
  padding: 10px;
  background-color: #555;
  color: #fff;
  font-family: Arial, sans-serif;
  font-size: 14px;
  &:focus {
    outline: none;
  }
  &::placeholder {
    color: #aaa;
  }
`;

// 버튼 컨테이너
export const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 10px;
  background-color: #333;
`;

// 기본 버튼 스타일
const Button = styled.button`
  margin-left: 10px;
  padding: 5px 15px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// 지우기 버튼
export const ClearButton = styled(Button)`
  background-color: #555;
  color: #fff;
  &:hover {
    background-color: #444;
  }
`;

// 저장 버튼
export const SaveButton = styled(Button)`
  background-color: #555;
  color: #fff;
  &:hover {
    background-color: #444;
  }
`;

// 크기 조절 핸들
export const ResizeHandle = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  cursor: nwse-resize;
  background-color: #666;
`;
