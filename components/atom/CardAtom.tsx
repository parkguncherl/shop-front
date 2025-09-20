import React from 'react';
import { Card } from 'antd';
import styled from 'styled-components';

interface Props {
  title?: string;
  style?: React.CSSProperties;
  bordered?: boolean;
  children?: React.ReactNode;
}

const CardAtom = ({ title, style, bordered = true, children }: Props) => {
  return (
    <ExtendedCard title={title} style={style} bordered={bordered}>
      {children}
    </ExtendedCard>
  );
};

const ExtendedCard = styled(Card)`
  text-align: center;
  justify-content: center;
  align-items: center;
  margin: 5px;
  .ant-card-body {
    padding: 5px;
    height: 100%;
    display: grid;
    justify-content: center;
    align-items: center;
  }
  .first-content {
    font-size: 20px;
    font-weight: 500;
  }
  .first-content.small {
    font-size: 13px;
    font-weight: 500;
  }
  .second-content {
    font-size: 20px;
    font-weight: 500;
  }
  .second-content.small {
    font-size: 15px;
    font-weight: 500;
  }
  .second-type {
    font-size: 13px;
    font-weight: 300;
  }
  .second-type.small {
    font-size: 10px;
    font-weight: 300;
  }
  .third-content {
    font-size: 5px;
    font-weight: 300;
  }
`;

export default CardAtom;
