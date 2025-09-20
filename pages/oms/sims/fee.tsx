/**
 * @file pages/oms/sims/fee.tsx
 * @description OMS > 빈블러 > 수수료 정산서
 * @copyright 2024
 */

import React from 'react';
import styled from 'styled-components';
import { Placeholder } from '../../../libs/const';
import { Search } from '../../../components';

interface Props {
  title?: string;
  name: string;
  type?: React.HTMLInputTypeAttribute;
  value?: string;
  disable?: boolean;
  onChange?: (name: any, value: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  required?: boolean;
  filters?: object;
  wrapperClassNames?: string;
  format?: string;
  dtWidth?: string;
}

// 임시 스타일 입니다~
const StatementWrapper = styled.div`
  font-family: Arial, sans-serif;
  min-width: 800px;
  margin: 0 auto;
  margin-top: 20px;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
`;

const Title = styled.h1`
  text-align: center;
  color: #333;
  margin-bottom: 5px;
`;

const Subtitle = styled.h2`
  text-align: center;
  color: #666;
  margin-top: 0;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  color: #333;
  border-bottom: 2px solid #333;
  padding-bottom: 5px;
`;

const Table = styled.table`
  table-layout: fixed;
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
`;

const TableCell = styled.td`
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
`;

const HighlightedCell = styled(TableCell)`
  background-color: #f0f0f0;
  text-align: center;
  color: #005491;
`;

const Footer = styled.footer`
  text-align: center;
  margin-top: 30px;
`;

const Logo = styled.img`
  max-width: 150px;
  margin-top: 10px;
`;

const fee: React.FC = () => {
  return (
    <>
      <Search className="type_2">
        <Search.DatePicker title={'영업일자'} name={'startDate'} placeholder={Placeholder.Default} />
      </Search>
      <StatementWrapper>
        <Title>팔로우비 FOLLOW.B</Title>
        <Subtitle>2월 정산서</Subtitle>

        <section>
          <SectionTitle>정산 요약</SectionTitle>
          <Table>
            <tbody>
              <tr>
                <HighlightedCell>대표자</HighlightedCell>
                <TableCell>변인섭</TableCell>
                <HighlightedCell>수수료율</HighlightedCell>
                <TableCell>6%</TableCell>
              </tr>
              <tr>
                <HighlightedCell>시작일</HighlightedCell>
                <TableCell>24. 2. 05(월)</TableCell>
                <HighlightedCell>종료일</HighlightedCell>
                <TableCell>24. 2. 29(목)</TableCell>
              </tr>
              <tr>
                <HighlightedCell>매출액</HighlightedCell>
                <TableCell>96,504,100</TableCell>
                <HighlightedCell>반품액</HighlightedCell>
                <TableCell>11,694,800</TableCell>
              </tr>
              <tr>
                <HighlightedCell>할인금액</HighlightedCell>
                <TableCell>8,000</TableCell>
                <HighlightedCell>실매출액</HighlightedCell>
                <TableCell>84,801,300</TableCell>
              </tr>
              <tr>
                <HighlightedCell>수수료</HighlightedCell>
                <TableCell>5,088,078</TableCell>
                <HighlightedCell>부가세</HighlightedCell>
                <TableCell>458,808</TableCell>
              </tr>
              <tr>
                <HighlightedCell>창고 임대료 지원</HighlightedCell>
                <TableCell>500,000</TableCell>
                <HighlightedCell>청구액</HighlightedCell>
                <TableCell>5,046,886</TableCell>
              </tr>
              <tr>
                <HighlightedCell>입금처</HighlightedCell>
                <TableCell>하나은행 (주)빈블러코퍼레이션</TableCell>
                <HighlightedCell>계좌번호</HighlightedCell>
                <TableCell>182-910026-57804</TableCell>
              </tr>
            </tbody>
          </Table>
        </section>

        <section>
          <SectionTitle>물류대행 요약</SectionTitle>
          <Table>
            <tbody>
              <tr>
                <HighlightedCell>전기재고</HighlightedCell>
                <TableCell>30,313</TableCell>
                <HighlightedCell>당기재고</HighlightedCell>
                <TableCell>27,066</TableCell>
              </tr>
              <tr>
                <HighlightedCell>순수입고</HighlightedCell>
                <TableCell>8,093</TableCell>
                <HighlightedCell>순수판매</HighlightedCell>
                <TableCell>10,452</TableCell>
              </tr>
              <tr>
                <HighlightedCell>샘플</HighlightedCell>
                <TableCell>2,152</TableCell>
                <HighlightedCell>샘플회수</HighlightedCell>
                <TableCell>1,863</TableCell>
              </tr>
            </tbody>
          </Table>
        </section>

        <Footer>
          <p>2024년 03월 04일</p>
        </Footer>
      </StatementWrapper>
    </>
  );
};

export default fee;
