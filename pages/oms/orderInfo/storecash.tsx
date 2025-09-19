import React from 'react';
import styled from 'styled-components';
import { Placeholder } from '../../../libs/const';
import { Search, Title } from '../../../components';
import { useCommonStore } from '../../../stores';

// 스타일 임시용~~
const TableWrapper = styled.div`
  font-size: 14px;
  display: flex;
  border-radius: 10px;
  overflow: hidden;
  background-color: #fff;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
`;

const Section = styled.div`
  padding: 15px;
  background-color: #fff;
`;

const LeftSection = styled(Section)`
  width: 30%;
  border-right: 2px solid #555555;
`;

const MiddleSection = styled(Section)`
  width: 30%;
  border-right: 2px solid #555555;
`;

const RightSection = styled(Section)`
  width: 40%;
`;

const Row = styled.div`
  display: flex;
  border-bottom: 1px solid #bdc3c7;
  min-height: 40px;
  align-items: center;
  &:last-child {
    border-bottom: none;
  }
`;

const Cell = styled.div`
  padding: 10px;
  display: flex;
  align-items: center;
`;

const Label = styled(Cell)`
  width: 35%;
  color: #2c3e50;
`;

const Value = styled(Cell)`
  width: 30%;
  justify-content: flex-end;
  color: #34495e;
`;

const Amount = styled(Cell)`
  width: 35%;
  justify-content: flex-end;
  color: #000000;
`;

const RedText = styled.span`
  color: #e74c3c;
`;

const BlueText = styled.span`
  color: #3498db;
`;

const RightTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const RightTableHeader = styled.th`
  background-color: #3498db;
  color: white;
  padding: 12px;
  text-align: left;
`;

const RightTableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #bdc3c7;
  text-align: ${(props) => props.align || 'left'};
`;

const HighlightedRow = styled.tr`
  background-color: #fff9c4;
`;

const SectionTitle = styled.h3`
  color: #3498db;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
  margin-top: 0;
  margin-bottom: 15px;
`;

const Line = styled.h3`
  border-bottom: 2px solid #000000;
`;

// Storecash 컴포넌트 정의
const Storecash = () => {
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  return (
    <>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} />
      <span style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>(참고:EOS 영업정산내역 )</span>
      <Search className="type_2">
        <Search.DatePicker title={'영업일자'} name={'startDate'} placeholder={Placeholder.Default} />
      </Search>
      <TableWrapper>
        <LeftSection>
          <Row>
            <Label>매출합계</Label>
            <Value>104</Value>
            <Amount>9,615,200</Amount>
          </Row>
          <Line></Line>
          <Row>
            <Label>
              <BlueText>판매계</BlueText>
            </Label>
            <Value>82</Value>
            <Amount>10,264,600</Amount>
          </Row>
          <Row>
            <Label>
              <RedText>반품계</RedText>
            </Label>
            <Value>
              <RedText>19</RedText>
            </Value>
            <Amount>649,400</Amount>
          </Row>
          <Row>
            <Label>
              <RedText>매입</RedText>
            </Label>
            <Value></Value>
            <Amount>1,649,400</Amount>
          </Row>
          <Row>
            <Label>
              <RedText>현금입금</RedText>
            </Label>
            <Value>
              <RedText>23</RedText>
            </Value>
            <Amount>11,826,000</Amount>
          </Row>
          <Row>
            <Label>
              <RedText>통장입금</RedText>
            </Label>
            <Value>
              <RedText>3</RedText>
            </Value>
            <Amount>
              <RedText>147,600</RedText>
            </Amount>
          </Row>
          <Row>
            <Label>
              <RedText>할인</RedText>
            </Label>
            <Value></Value>
            <Amount>826,000</Amount>
          </Row>
          <Row>
            <Label>
              <RedText>통장입금</RedText>
            </Label>
            <Value>
              <RedText>3</RedText>
            </Value>
            <Amount>
              <RedText>147,600</RedText>
            </Amount>
          </Row>
          <Row>
            <Label>
              <RedText>외상</RedText>
            </Label>
            <Value>
              <RedText>35</RedText>
            </Value>
            <Amount>
              <RedText>147,600</RedText>
            </Amount>
          </Row>
          <Line></Line>
          <Row>
            <Label>
              <BlueText>입고계</BlueText>
            </Label>
            <Value>82</Value>
            <Amount>10,264,600</Amount>
          </Row>
          <Row>
            <Label>
              <RedText>반출계</RedText>
            </Label>
            <Value>
              <RedText>35</RedText>
            </Value>
            <Amount>
              <RedText>147,600</RedText>
            </Amount>
          </Row>
          <Line></Line>
          <Row>
            <Label>
              <RedText>부가세</RedText>
            </Label>
            <Value>
              <RedText>35</RedText>
            </Value>
            <Amount>
              <RedText>147,600</RedText>
            </Amount>
          </Row>

          <Row>
            <Label>물류비</Label>
            <Value></Value>
            <Amount>418,600</Amount>
          </Row>
        </LeftSection>

        <MiddleSection>
          <Row>
            <Label>
              <BlueText>전기시재</BlueText>
            </Label>
            <Value></Value>
            <Amount>574,700</Amount>
          </Row>
          <Row>
            <Label>
              <BlueText>현금입금계</BlueText>
            </Label>
            <Value></Value>
            <Amount>574,700</Amount>
          </Row>
          <Row>
            <Label>
              <BlueText>별도입금</BlueText>
            </Label>
            <Value></Value>
            <Amount>574,700</Amount>
          </Row>
          <Row>
            <Label>
              <RedText>별도출금</RedText>
            </Label>
            <Value>12</Value>
            <Amount>574,700</Amount>
          </Row>
          <Row>
            <Label>
              <RedText>차기시재</RedText>
            </Label>
            <Value>12</Value>
            <Amount>574,700</Amount>
          </Row>
          <Line></Line>
          <Row>
            <Label>
              <BlueText>전산현금</BlueText>
            </Label>
            <Value></Value>
            <Amount>574,700</Amount>
          </Row>
          <Row>
            <Label>
              <RedText>돈통현금</RedText>
            </Label>
            <Value></Value>
            <Amount>1,000,700</Amount>
          </Row>
          <Row>
            <Label>
              <BlueText>현금과부족</BlueText>
            </Label>
            <Value></Value>
            <Amount></Amount>
          </Row>
          <Line></Line>
          <Row>
            <Label>
              <BlueText>이고입고</BlueText>
            </Label>
            <Value></Value>
            <Amount></Amount>
          </Row>
          <Row>
            <Label>
              <RedText>이고출고</RedText>
            </Label>
            <Value></Value>
            <Amount></Amount>
          </Row>
          <Line></Line>
          <Row>
            <Label>
              <RedText>부가세현금</RedText>
            </Label>
            <Value></Value>
            <Amount></Amount>
          </Row>
          <Row>
            <Label>
              <RedText>부가세통장</RedText>
            </Label>
            <Value></Value>
            <Amount></Amount>
          </Row>
        </MiddleSection>

        <RightSection>
          <SectionTitle>판매 상세</SectionTitle>
          <RightTable>
            <thead>
              <tr>
                <RightTableHeader>판매처</RightTableHeader>
                <RightTableHeader>전표#</RightTableHeader>
                <RightTableHeader>판매금액</RightTableHeader>
              </tr>
            </thead>
            <tbody>
              <tr>
                <RightTableCell>인터넷 독특질조 7</RightTableCell>
                <RightTableCell align="right">1</RightTableCell>
                <RightTableCell align="right">124,800</RightTableCell>
              </tr>
              <tr>
                <RightTableCell>인터넷 크린치즈미</RightTableCell>
                <RightTableCell align="right">2</RightTableCell>
                <RightTableCell align="right">3,379,400</RightTableCell>
              </tr>
              <HighlightedRow>
                <RightTableCell>싱귀홀 코스모(미2</RightTableCell>
                <RightTableCell align="right">6</RightTableCell>
                <RightTableCell align="right">108,000</RightTableCell>
              </HighlightedRow>
            </tbody>
          </RightTable>
        </RightSection>
      </TableWrapper>
    </>
  );
};

export default Storecash;
