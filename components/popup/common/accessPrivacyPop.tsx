import React, { useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import Loading from '../../Loading';
import { PopupLayout } from '../PopupLayout';
import { useCommonStore } from '../../../stores';
import { Tabs, Typography } from 'antd';
import styled from 'styled-components';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

// 스타일드 컴포넌트 정의
const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  .ant-typography {
    font-family: 'NotoSansKR', sans-serif;
    font-weight: 300;
    color: #333;
  }
`;

const StyledContainer2 = styled.div`
  padding: 30px;
  margin-top: 1px;
`;

const StyledTitle = styled(Title)`
  text-align: center;
  margin: 30px; !important;
`;

const StyledTabs = styled(Tabs)`
  padding-top: 20px;
  width: 100%;
  .ant-tabs-nav {
    &::before {
      border-bottom: none;
    }
    justify-content: center;
    transform: translate(-30px, 0px);
    .ant-tabs-nav-wrap {
      justify-content: center;
    }
  }
  .ant-tabs-ink-bar {
    background: var(--main-color);
  }
  .ant-tabs-tab {
    margin: 0 10px 0 32px;
    font-size: 26px;
    .ant-tabs-tab-btn {
      font-family: 'NotoSansKR', sans-serif;
      font-weight: 300;
      color: #333;
    }
    &.ant-tabs-tab-active {
      .ant-tabs-tab-btn {
        text-shadow: none;
        color: var(--main-color);
      }
    }
  }
  .ant-tabs-tab:hover {
    color: var(--main-color);
  }
  .ant-tabs-tab-active {
    font-weight: bold;
  }
  .ant-tabs-content {
    height: 400px;
    box-sizing: border-box;
    padding: 0 40px 40px 40px;
    border: 1px solid #ddd;
    border-radius: 5px;
    overflow: auto;
  }
`;
const ContentSection = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled(Title)`
  font-size: 18px !important;
  margin: 40px 0 25px 0 !important;
`;

const SubSectionTitle = styled(Title)`
  font-size: 16px !important;
  margin: 15px 0 8px 10px !important;
`;

const StyledList = styled.ul`
  padding-left: 20px;
`;

const StyledListItem = styled.li`
  margin-bottom: 5px;
`;
const StyledListItem2 = styled.li`
  margin-bottom: 3px;
  padding-left: 10px !important;
`;
const StyledListItem3 = styled.li`
  margin-bottom: 3px;
  padding-left: 15px !important;
`;
const AccessPrivacyPop = ({ privacyType }: { privacyType: string | null }) => {
  const [modalType, closeModal] = useCommonStore((s) => [s.modalType, s.closeModal]);
  const [activeTab, setActiveTab] = useState(privacyType);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };
  return (
    <PopupLayout
      width={100}
      isEscClose={true}
      open={modalType.type === 'PRIVACY' && modalType.active}
      title={'약관 및 정책'}
      onClose={() => {
        closeModal('PRIVACY');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn" title="닫기" onClick={() => closeModal('PRIVACY')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <StyledContainer>
          <StyledContainer2>
            <StyledTitle level={2}>약관 및 정책</StyledTitle>
            <Paragraph style={{ textAlign: 'center' }}>빈블러 서비스의 이용과 관련하여 필요한 사항을 규정합니다.</Paragraph>
            <StyledTabs activeKey={activeTab || ''} onChange={handleTabChange}>
              {/****개인정보 처리방침*****/}

              <TabPane tab="개인정보 처리방침" key="1">
                <ContentSection>
                  <SectionTitle level={3}>제1조. 개인정보</SectionTitle>
                  <Paragraph>
                    본 개인정보처리방침에서 "개인정보"는 개인정보 보호법 제2조 제1항에 따라 정의된 개인정보, 즉 살아 있는 개인에 관한 정보로서 성명,
                    주민등록번호 등을 통하여 개인을 식별할 수 있는 정보(해당 정보만으로는 특정 개인을 식별할 수 없더라도 다른 정보와 용이하게 결합하여 식별할 수
                    있는 것을 포함)를
                    <br />
                    말합니다. 회사는 개인 정보의 취급에 관한 법령, 국가가 정하는 지침 규범을 준수합니다.
                  </Paragraph>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제2조. 개인정보 수집</SectionTitle>
                  <Paragraph>
                    회사는 홈페이지, 전화, 이메일, 상담 등의 방법으로 수집 및 이용목적에 따라 필요한 최소한의 사용자 정보를 수집하고 이용합니다.
                    <br />
                    수집하는 개인정보 항목과 수집 및 이용목적은 다음과 같습니다:
                  </Paragraph>
                  <SubSectionTitle level={4}>1. 개인정보 수집내용</SubSectionTitle>
                  <StyledList>
                    <StyledListItem>
                      <Text strong>1. 문의(문의 상담 시 수집항목): </Text>
                      이름, 연락처, 이메일, 회사명 등 질문 및 요청의 접수와 답변을 위한 정보들
                    </StyledListItem>
                    <StyledListItem>
                      <Text strong>2. 회원가입과 운영(회원가입시 수집항목): </Text>
                      이름, 연락처, 이메일 외 회사명과 사업자 번호 등 법인을 판별 가능케 하는 정보들
                    </StyledListItem>
                    <StyledListItem>
                      <Text strong>3. SIMS 시스템(Smart Integrated Management Solution): </Text>
                      사용자 정보(이름, 휴대폰 번호, 회사명 등), 배송지 정보(받는 분 이름, 전화번호, 배송 주소 등), 상품 주문/반품/교환 관련 정보 등
                    </StyledListItem>
                  </StyledList>
                  <SubSectionTitle level={4}>2. 개인정보 수집 방법</SubSectionTitle>
                  <Paragraph>
                    개인정보를 수집하는 경우에는 반드시 사전에 사용자에게 해당 사실을 알리고 동의를 구하고 있으며, 아래와 같은 방법을 통해 개인정보를
                    수집합니다:
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>1. 회원가입 및 서비스 이용 과정에서 사용자가 개인정보 수집에 대해 동의를 하고 직접 정보를 입력하는 경우</StyledListItem>
                    <StyledListItem>2. 제휴 서비스 또는 단체 등으로부터 개인정보를 제공받은 경우</StyledListItem>
                    <StyledListItem>3. 홈페이지, 메일, 팩스, 전화 등 명시적 절차와 고객센터를 통한 상담 과정에서 인입, 처리한 경우</StyledListItem>
                    <StyledListItem>4. 온오프라인에서 진행되는 이벤트/행사 등 참여하셔서 수집, 처리받은 경우</StyledListItem>
                  </StyledList>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제3조. 개인정보 이용의 목적</SectionTitle>
                  <Paragraph>
                    회사는 사용자 정보의 아래 이용 목적을 명확하게 파악하고 이용 목적 이외에는 개인정보를 활용하지 않으며 이용목적에 포함되지 않는 개인정보
                    활용이 이루어지지 않도록 적절한 조치를 취합니다.
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>1. 계정 및 비밀번호 관리</StyledListItem>
                    <StyledListItem>2. 사용자 등록 메일을 보내기 위해</StyledListItem>
                    <StyledListItem>3. 회사 서비스의 제공을 위해</StyledListItem>
                    <StyledListItem>4. 회사 서비스에 대한 안내, 문의 등에 대한 대응을 위해</StyledListItem>
                    <StyledListItem>5. 회사의 상품, 서비스 등의 안내 및 마케팅 측면을 위해</StyledListItem>
                    <StyledListItem>6. 회사의 서비스에 대한 약관, 정책 등에 위반하는 행위에 대한 대응을 위해</StyledListItem>
                    <StyledListItem>7. 회사 서비스 약관 등의 변경을 알리기 위해</StyledListItem>
                    <StyledListItem>8. 회사 서비스 개선, 새로운 서비스 개발 등을 지원하기 위해</StyledListItem>
                    <StyledListItem>9. 회사 서비스에 관련하여 통계 데이터를 얻기 위해</StyledListItem>
                    <StyledListItem>10. 기타 위 이용 목적에 부수하는 목적</StyledListItem>
                  </StyledList>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제4조. 개인정보의 보유 및 이용 기간</SectionTitle>
                  <Paragraph>
                    회사가 제공하는 서비스를 사용자가 이용하는 동안 회사는 사용자의 개인정보를 계속 보유하며 서비스 제공 등을 위해 이용하며, 이용목적이 달성된
                    때에는 이용목적이 달성된 때에는 당해 개인정보를 즉시 파기합니다. 다만, 아래 제 6조 사용자의 요구에 의한 (열람, 정정, 삭제 등) 사항에서
                    설명한 절차와 방법에 따라 사용자 본인이 직접 삭제하거나 수정한 정보, 가입해지를 요청한 경우에는 재생할 수 없는 방법에 따라 디스크나
                    개인정보가 보관된 데이터상에서 완전히 삭제하며 추후 열람이나 이용할 수 없는 상태로 처리됩니다. 단, 관련 법령의 규정에 따라 보존할 필요가
                    있는 경우 관계 법령에서 정한 일정 기간 동안 사용자 정보를 보관합니다. 당해 정보는 그 보관의 목적으로만 이용하며 보존 기간은 아래와 같습니다.
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>1. 서비스 사용자 가입정보</StyledListItem>
                    <StyledListItem>2. 서비스 제공 및 거래기록: 국세기본법에 따른 거래 사실 보존: 5년</StyledListItem>
                    <StyledListItem>3. 서비스 이용 계약에 관한 기록: 전자상거래 등에서의 소비자 보호에 관한 법률에 따른 보존: 5년</StyledListItem>
                    <StyledListItem>4. 대금결제 및 재화 등의 공급에 관한 기록: 전자상거래 등에서의 소비자 보호에 관한 법률에 따른 보존: 5년</StyledListItem>
                    <StyledListItem>5. 소비자의 불만 또는 분쟁 처리에 관한 기록: 전자상거래 등에서의 소비자 보호에 관한 법률에 따른 보존: 3년</StyledListItem>
                  </StyledList>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제5조. 개인정보의 제3자 제공</SectionTitle>
                  <Paragraph>
                    회사는 사용자의 동의 없이 개인정보를 제3자에 제공하고 있지 않습니다. 다만 관련 법령에 따라 제공하는 경우는 사용자의 별도 동의 없이
                    개인정보를 제공할 수 있습니다.
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>1. 법령의 규정, 수사목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</StyledListItem>
                    <StyledListItem>2. 통계작성, 학술연구, 시장조사 정보제공의 경우로서 특정 개인을 식별할 수 없는 형태로 제공되는 경우</StyledListItem>
                    <StyledListItem>
                      3. 회사가 제공하는 서비스의 사용자와 타인의 권리나 이익 등을 보호하기 위해 회사가 정보공개가 필요하다고 판단하는 경우
                    </StyledListItem>
                  </StyledList>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제6조. 쿠키(Cookie)에 의한 개인정보 수집</SectionTitle>
                  <Paragraph>
                    회사는 홈페이지 접속자의 편의를 위하여 '쿠키(Cookie)'를 사용합니다. 쿠키란, 웹사이트가 사용자의 웹브라우저에 보내는 작은 텍스트 파일로서
                    사용자의 PC에 저장됩니다.
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>1. 사용자가 웹사이트 또는 부가정보를 이용할 때 세션을 유지하기 위해 쿠키를 사용합니다.</StyledListItem>
                    <StyledListItem>2. 서비스의 보안 강화를 위하여 쿠키를 사용합니다.</StyledListItem>
                    <StyledListItem>
                      3. 사용자의 접속빈도나 방문시간 등을 분석하여 서비스 개편, 차별화된 정보를 제공하기 위한 분석자료로 이용됩니다.
                    </StyledListItem>
                    <StyledListItem>4. 팝업 정보제공에 대하여 사용자가 '보지 않기'를 요청하였는지를 파악하기 위하여 쿠키를 사용합니다.</StyledListItem>
                  </StyledList>
                  <Paragraph>
                    사용자는 쿠키 설치에 대한 선택권을 가지고 있으며, 웹브라우저 옵션 설정을 통해 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나,
                    또는 또는 모든 쿠키의 저장을 거부할 수도 있습니다. 다만, 사용자가 쿠키 설치를 거부하셨을 경우 서비스 제공에 제한이 있을 수 있습니다.
                  </Paragraph>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제7조. 개인정보 관련 기술적 관리적 대책</SectionTitle>
                  <Paragraph>
                    회사는 사용자의 개인정보를 취급하면서 개인정보가 분실, 도난, 누출, 변조 또는 훼손되지 않도록 개인정보에 대한 접근 권한을 최소한의 인원으로
                    제한하고 있으며, 안전성 확보를 위하여 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보 보호법 등 관련 법령에 따라 다음과 같은 기술적
                    대책을 마련하고 있습니다. 회사는 해킹이나 컴퓨터 바이러스 등에 의해 회원의 개인정보가 유출되거나 훼손되는 것을 막기 위해 최선을 다하고
                    있습니다. 안전한 암호 알고리즘 등을 통하여 개인정보의 암호화 저장 및 네트워크상에서 개인정보를 안전하게 전송할 수 있도록 하고 있습니다.
                    그리고 침입 차단 시스템을 이용하여 외부로부터의 무단 접근을 통제하고 있으며, 기타 시스템적으로 안정성을 확보하기 위한 가능한 모든 기술적
                    장치를 갖추려 노력하고 있습니다.
                  </Paragraph>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제8조. 면책</SectionTitle>
                  <Paragraph>
                    만일 회사에 의한 보호 대책에도 불구하고 해커 등에 의한 부당한 행위로 인하여 사용자와 제3자에게 손해가 발생한 경우 회사는 책임지지 않으므로
                    양해 바랍니다. 또한, 사용자 본인확인을 위한 정보가 분실 또는 제3자에게 알려지지 않도록 엄중한 관리 부탁드립니다. 사용자 자신의 책임으로
                    인하여 발생한 손해의 경우, 회사는 책임지지 않습니다.
                    <br />
                    제11조. 개인정보보호 책임자와 담당자
                    <br /> 회사는 개인정보에 대한 민원처리를 담당하는 개인정보 보호 책임자와 담당자를 다음과 같이 지정하고 있습니다. <br />
                    개인정보 관리 책임 담당자
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>• 이 름: 송아름</StyledListItem>
                    <StyledListItem>• 전 화: 02-2232-5129</StyledListItem>
                    <StyledListItem>• E-Mail: contact@shop.com</StyledListItem>
                  </StyledList>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제9조. 만 19세 미만 아동의 사용자 가입제한</SectionTitle>
                  <Paragraph>
                    회사는 신용카드 발급이 불가능한 만 19세 미만의 미성년자인 경우 회원가입이 제한됩니다. 단, 법정 대리인의 동의를 구한 경우 회사의 확인 후
                    회원가입을 할 수 있습니다.
                  </Paragraph>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제10조. 정책 변경에 따른 공지 의무</SectionTitle>
                  <Paragraph>
                    본 개인정보처리방침은 2022년 12월 1일 최초 제정되었으며 정부의 법령ㆍ정책 또는 보안기술의 변경, 기타 사유에 따라 내용의 추가ㆍ삭제ㆍ변경이
                    발생할 수 있습니다. 이 경우 변경되는 개인정보처리방침 개정 최소 7일 이전에 홈페이지를 통해 변경 이유와 내용을 공지하도록 하겠습니다.
                  </Paragraph>
                </ContentSection>

                <ContentSection>
                  <Paragraph>
                    <br />
                    <br />본 약관은 2022년 12월 1일부터 적용됩니다. (가입일자에 따라 적용시점 상이)
                  </Paragraph>
                </ContentSection>
              </TabPane>

              {/****회원가입 이용약관*****/}

              <TabPane tab="회원가입 이용약관" key="2">
                <ContentSection>
                  <SectionTitle level={3}>제1장 총칙</SectionTitle>
                  <SubSectionTitle level={4}>제1조 목적</SubSectionTitle>
                  <Paragraph>
                    본 약관은 「주식회사 빈블러」(이하 "회사")와 회사의 의류 도매업 관련 통합관리솔루션(Smart Integrated Management Solution)
                    서비스(이하”서비스)를 이용하는 자(이하 "사용자")간의 관계와 권리 의무 및 책임 사항, 기타 서비스 이용에 관한 제반 사항을 정함을 목적으로
                    합니다.
                  </Paragraph>
                  <SubSectionTitle level={4}>제2조 용어의 정의</SubSectionTitle>
                  <Paragraph>
                    본 약관에서 사용하는 용어의 의미는 다음 각 호와 같으며, 여기에서 정의되지 않은 약관상 용어의 의미는 일반적인 거래관행에 따릅니다.
                  </Paragraph>
                  <StyledListItem>1. '서비스' : 회사가 사이트를 통해 사용자에게 제공하는 업무와 이에 수반되는 제반 작업을 의미합니다.</StyledListItem>
                  <StyledListItem>2. '사용자' : 빈블러의 서비스를 이용하는 고객을 의미합니다.</StyledListItem>
                  <StyledListItem>3. ‘가입신청자’ : 회원가입을 통해 회사의 사용자가 되고자 하는 자</StyledListItem>
                  <StyledListItem>4. '계정' : 사용자가 회사의 사이트에 회원가입하여 부여 받은 계정을 의미합니다.</StyledListItem>
                  <StyledListItem>5. '사이트' : 회사가 사용자에게 서비스를 제공하기 위해 운영하는 웹사이트를 의미합니다.</StyledListItem>
                  <Paragraph>
                    본 약관에서 사용하는 용어의 의미는 다음 각 호와 같으며, 여기에서 정의되지 않은 약관상 용어의 의미는 일반적인 거래관행에 따릅니다.
                  </Paragraph>
                  <SubSectionTitle level={4}>제3조 약관의 명시와 설명 및 개정</SubSectionTitle>
                  <StyledListItem>
                    1. 회사는 약관의 내용과 상호, 영업소 소재지, 대표자의 성명, 사업자 등록번호 등을 사용자가 알 수 있도록 사이트에 게시합니다.
                  </StyledListItem>
                  <StyledListItem>
                    2. 약관의 효력은 사이트를 통해 온라인으로 공시하고 사용자는 본 약관의 내용을 충분히 이해한 후 그 내용을 준수하는 것에 동의하고 서비스를
                    이용하는 것으로, 서비스 이용을 시작한 사용자는 당연히 본 약관을 준수함에 동의한 것으로 간주합니다. 또한 본 약관의 용어는 본 약관에서 다른
                    정의가 있는 경우를 제외하고 정의된 의미를 가지는 것으로 합니다.
                  </StyledListItem>
                  <StyledListItem>
                    3. 약관의 변경이 필요하다고 회사에서 판단할 경우 아래 괄호에 해당하는 법률을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다. 회사가
                    약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행 약관과 함께 사이트의 화면에 그 적용일자 7일(다만, 사용자에게 불리한 내용으로
                    변경하는 경우에는 30일) 이전부터 적용일자 전일까지 공지합니다.
                  </StyledListItem>
                  <StyledListItem>
                    4. 제3항에 따라 공지된 적용일자 이후에 사용자가 서면으로 명시적 거부의사를 표명하지 않을 경우에는 개정된 약관에 동의하는 것으로 간주하며,
                    변경된 약관에 동의하지 않는 사용자는 사이트의 회원 탈퇴를 통해 서비스 이용을 해지할 수 있습니다. 제3항의 조치에도 불구하고 약관의 개정
                    사실을 알지 못함으로써 발생하는 사용자의 피해에 대하여 회사는 책임을 지지 않습니다.
                  </StyledListItem>
                </ContentSection>
                <ContentSection>
                  <SectionTitle level={3}>제2장 회원 가입</SectionTitle>
                  <SubSectionTitle level={4}>제4조 회원가입 신청</SubSectionTitle>
                  <Paragraph>1. 사용자는 회사가 제공하는 다음 각호의 절차에 따라 회원가입을 진행합니다.</Paragraph>
                  <StyledList>
                    <StyledListItem>1. 본 약관에 대한 동의</StyledListItem>
                    <StyledListItem>2. 회원가입 완료 확인</StyledListItem>
                  </StyledList>
                  <Paragraph>
                    2. 회사는 본 약관에 동의하고 회원 정보를 사실대로 기재한 가입신청자의 가입 신청을 승낙함을 원칙으로 합니다. 가입신청자는 회사에서 제공한
                    필요사항을 기재해야 합니다. 단, 다음 각 호에 해당하는 신청에 대해서는 회사가 회원가입을 거부하거나 회원에게 탈퇴 요청을 할 수 있습니다.
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>
                      1. 가입신청자가 본 약관에 의하여 이전에 사용자 자격을 상실한 적이 있는 경우 (단, 회사의 사용자 재가입 승낙을 얻은 경우에는 예외로 합니다.)
                    </StyledListItem>
                    <StyledListItem>2. 실명이 아니거나 타인의 명의를 이용한 경우</StyledListItem>
                    <StyledListItem>3. 허위 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우</StyledListItem>
                    <StyledListItem>4. 사용자가 서비스의 정상적인 제공을 저해하거나 다른 사용자의 서비스 이용에 지장을 줄 것으로 예상되는 경우</StyledListItem>
                    <StyledListItem>5. 사용자의 귀책사유로 인하여 승인이 불가하거나 기타 규정한 제반 사항을 위반하여 신청하는 경우</StyledListItem>
                    <StyledListItem>6. 기타 회사가 관련법령 등을 기준으로 하여 명백하게 사회질서 및 미풍양속에 반할 우려가 있다고 판단하는 경우</StyledListItem>
                  </StyledList>
                  <Paragraph>3. 회사는 다음에 해당하는 상황에서 회원가입심사가 지연될 수 있습니다.</Paragraph>
                  <StyledList>
                    <StyledListItem>1. 회사의 설비에 여유가 없거나 기술적 장애가 있는 경우</StyledListItem>
                    <StyledListItem>2. 서비스 상의 장애 또는 서비스 이용요금 결제수단의 장애가 발생한 경우</StyledListItem>
                    <StyledListItem>3. 기타 회사가 재정적, 기술적으로 필요하다고 인정하는 경우</StyledListItem>
                    <StyledListItem>
                      4. 회사는 사용자의 종류에 따라 전문기관을 통한 실명확인 및 본인인증을 요청하거나 증빙자료를 추가로 요청할 수 있습니다.
                    </StyledListItem>
                    <StyledListItem>
                      5. 사용자가 제공한 정보는 본인의 실제 정보로 간주되며 정보가 허위이거나 현재의 사실과 일치하지 않을 경우에 발생하는 모든 문제에 대해
                      회사는 책임지지 않습니다.
                    </StyledListItem>
                  </StyledList>
                  <SubSectionTitle level={4}>제5조 개인정보 수집 및 보호</SubSectionTitle>
                  <Paragraph>
                    1. 회사는 “정보통신망 이용촉진 및 정보보호 등에 관한 법률” 등 관계 법령이 정하는 바에 따라 사용자의 개인정보를 보호하기 위해 노력합니다.
                    사용자의 사용자의 개인정보 보호 및 사용에 대해서는 회사의 개인정보처리방침이 적용됩니다.
                  </Paragraph>
                  <Paragraph>
                    2. 회사는 법령상 요구되는 경우를 제외하고는 상대방으로부터 취득한 제1항의 사용자 개인정보, 기술정보, 경영 정보 등 비밀로 관리되는 정보를
                    제3자에게 누설하여서는 안되며 그 정보를 이용계약의 이행 이외의 목적으로 이용하지 않습니다.
                  </Paragraph>
                  <Paragraph>
                    3. 회사는 이용계약의 이행 과정에서 회사의 서비스 및 상품 홍보를 위하여 회사의 개인정보 취급방침에 따라 제2항의 정보를 이용할 수 있습니다.
                    단, 사용자가 이메일 등을 통해 반대 의사를 표시하는 경우 회사는 이를 즉시 중단합니다.
                  </Paragraph>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제3장 회원 및 계정 관리</SectionTitle>
                  <SubSectionTitle level={4}>제6조 회원 계정</SubSectionTitle>
                  <Paragraph>1. 회원 계정은 ‘대표계정’과 ‘부계정’으로 구분됩니다.</Paragraph>
                  <Paragraph>
                    2. 대표계정의 경우, 본 약관 4조에서 정한 절차에 따라 사용자가 회원가입을 완료함으로써 생성되며 회사에서 제공하는 시스템 상의 사용자의 권한에
                    해당하는 모든 기능에 접근할 수 있습니다. 단, 동일한 사업자등록번호를 가진 사용자는 하나의 대표계정만을 생성할 수 있습니다.
                  </Paragraph>
                  <Paragraph>
                    3. 대표계정은 부계정을 초대하여 회사에서 제공하는 시스템 상의 기능에 접근하게 할 수 있습니다. 단, 회사가 정한 내규에 따라 한 대표계정 당
                    초대 가능한 부계정의 개수는 최대 3개로 제한되며 추가로 부계정을 초대하고자 하는 경우, 추가 비용이 발생합니다.
                  </Paragraph>
                  <Paragraph>
                    4. 대표계정은 부계정의 권한을 관리합니다. 부계정이 본 약관을 위배하여 회사에 손해를 입힌 경우의 책임은 전적으로 대표계정에 있습니다.
                  </Paragraph>
                  <Paragraph>5. 부계정의 경우, 대표계정의 초대에 의해 사용자가 이메일 인증 등 절차를 완료함으로써 생성됩니다.</Paragraph>
                  <SubSectionTitle level={4}>제7조 회원 정보의 변경</SubSectionTitle>
                  <Paragraph>
                    사용자는 회원가입 시 기재한 사항이나 서비스 이용 과정에서 회사에 제공한 정보가 변경되었을 경우 즉시 사용자 정보를 변경하여야 하며,
                    변경사항을 수정하지 않아 발생한 모든 불이익에 대하여 회사는 책임지지 않습니다.
                  </Paragraph>
                  <SubSectionTitle level={4}>제8조 휴면계정</SubSectionTitle>
                  <Paragraph>
                    1. 회사는 1년 이상 장시간 로그인 하지 아니하는 사용자의 개인정보를 보호하기 위해 사용자의 계정을 휴면계정으로 분류하고 서비스 이용 계약을
                    해지할 수 있습니다. 회사는 휴면계정으로 분류되기 30일 전까지 개인정보가 파기되거나 분리되어 저장된다는 사실과 기간 만료일 및 해당 개인정보의
                    항목을 이메일, 서면, 전화 또는 유사한 방법 중 하나의 방법으로 사용자에게 알리도록 합니다.
                  </Paragraph>
                  <Paragraph>
                    2. 휴면계정으로 분류된 사용자의 계정에 미납요금이 존재하는 경우, 회사는 사용자에게 14일의 기간을 정하여 통화, 서면, 이메일 등의 방법으로
                    이행을 최고하여 계약을 해지하고 미납요금에 대한 손해배상을 청구할 수 있습니다.
                  </Paragraph>
                  <Paragraph>
                    3. 서비스 이용 계약 해지 전 휴면 계정을 이용하여 로그인을 시도할 경우, 회원가입 당시 요청한 제반 정보 확인 후 바로 사용자 ID로 전환됩니다.
                  </Paragraph>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제4장 계약당사자의 의무 및 책임</SectionTitle>
                  <SubSectionTitle level={4}>제9조 사용자 의무 및 책임</SubSectionTitle>
                  <Paragraph>1. 회원으로 가입된 모든 사용자는 본 약관의 규정, 이용 안내와 관련하여 회사가 공지한 사항을 준수할 의무가 있습니다.</Paragraph>
                  <Paragraph>2. 사용자는 회사가 정한 서비스 이용요금을 지정된 날짜에 납입할 의무가 있습니다. </Paragraph>
                  <Paragraph>3. 사이트 또는 시스템 상에 등록된 정보에 변경이 있는 경우, 사용자는 해당 정보를 바로 업데이트해야 합니다.</Paragraph>
                  <Paragraph>
                    4. 사용자는 회사의 사전 서면 동의 없이 본 계약과 관련하여 취득한 기술상, 업무상 및 영업상의 비밀 및 제반 정보를 제3자에게 누설하거나 본
                    계약의 이행을 위한 목적 이외의 용도로 사용하여서는 안 됩니다.
                  </Paragraph>
                  <Paragraph>
                    5. 사용자는 본 서비스의 이용에 있어서 본 약관 등 회사가 제공하는 각종 정보 및 주의 사항 등을 확인하고 본 서비스의 내용 및 구조를 충분히
                    이해한 후 자신의 판단과 책임으로 이용해야 합니다.
                  </Paragraph>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제5장 회원 탈퇴 및 이용계약 해지</SectionTitle>
                  <SubSectionTitle level={4}>제10조 회원 탈퇴 및 퇴점 절차</SubSectionTitle>
                  <Paragraph>
                    1. 사용자가 서비스 이용 기간 중 이용 계약을 해지하고자 하는 경우 본인이 직접 사이트를 통하여 탈퇴 신청을 하거나 서면으로 회사에 계약 해지
                    의사를 밝혀야 합니다.
                  </Paragraph>
                  <Paragraph>2. 회사는 사용자의 탈퇴 신청을 승인하고 개인 정보 처리 방침에 따라 사용자가입정보를 6개월 후 말소합니다.</Paragraph>
                </ContentSection>

                <ContentSection>
                  <Paragraph>
                    <br />
                    <br />본 약관은 2022년 12월 01일부터 적용됩니다. (가입일자에 따라 적용시점 상이)
                  </Paragraph>
                </ContentSection>
              </TabPane>

              {/****서비스 이용약관*****/}
              <TabPane tab="서비스 이용약관" key="3">
                <ContentSection>
                  <SectionTitle level={3}>제1장 총칙</SectionTitle>
                  <SubSectionTitle level={4}>제1조 목적</SubSectionTitle>
                  <Paragraph>
                    본 약관은 「주식회사 빈블러」(이하 "회사")와 회사가 제공하는 의류 도매업 관련 통합관리솔루션(Smart Integrated Management Solution) 서비스
                    (이하 (이하 "서비스")를 이용하는 자(이하 "사용자")간의 관계와 권리 의무 및 책임 사항, 기타 서비스 이용에 관한 제반 사항을 정함을 목적으로
                    합니다.
                  </Paragraph>
                  <SubSectionTitle level={4}>제2조 용어의 정의</SubSectionTitle>
                  <Paragraph>
                    본 약관에서 사용하는 용어의 의미는 다음 각 호와 같으며, 여기에서 정의되지 않은 약관상 용어의 의미는 일반적인 거래관행에 따릅니다.
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>
                      • '서비스' : 회사가 사용자에게 제공하는 서비스로 상품 입고, 보관, 재고관리, 유통가공, 출고 및 반품 등의 업무와 이에 수반되는 제반 작업을
                      의미합니다.
                    </StyledListItem>
                    <StyledListItem>• '사용자' : 빈블러의 서비스를 이용하는 고객을 의미합니다.</StyledListItem>
                    <StyledListItem>• ‘가입신청자’ : 회원가입을 통해 회사의 사용자가 되고자 하는 자를 말합니다.</StyledListItem>
                    <StyledListItem>• '계정' : 사용자가 회사의 사이트에 회원가입하여 부여 받은 계정을 의미합니다.</StyledListItem>
                    <StyledListItem>• 'SIMS' : 사용자에게 서비스를 제공하기 위해 회사가 구축한 소프트웨어를 의미합니다.</StyledListItem>
                    <StyledListItem>
                      • '스마트센터' : 회사가 사용자에게 서비스를 제공하기 위해 임차하여 운영하는 재고 입/출고 및 제반 작업을 수행하는 센터를 의미합니다.
                    </StyledListItem>
                    <StyledListItem>
                      • ‘입고’ : 사용자가 SIMS 시스템에서 상품을 ‘발주’ 및 ‘입고등록’하여 약속된 날짜에 정해진 절차에 따라 스마트센터 안으로 상품을 들이는 것을
                      말합니다.
                    </StyledListItem>
                    <StyledListItem>
                      • ‘가용재고’ : 입고가 완료된 상품을 센터 내 상품 보관장소에 옮겨 보관하고 출고가능한 수량으로 반영하는 것을 의미합니다.
                    </StyledListItem>
                    <StyledListItem>
                      • ‘유통가공’ : 라벨 부착, 조립, 해체, 세트포장, 재포장, 재가공 등 상품유통 과정에서 상품을 가공하는 작업을 의미합니다.
                    </StyledListItem>
                    <StyledListItem>
                      • ‘출고’ : 소비자의 주문이 접수되어 센터 내에 보관 중인 상품을 배송하는 데에 까지의 과정을 의미하며 출고요청, 피킹, 패킹, 배송의 순으로
                      이뤄집니다.
                    </StyledListItem>
                    <StyledListItem>
                      • ‘SKU’ : Stock Keeping Unit, 상품의 관리를 위한 최소 단위로 같은 색상의 옷이라도 사이즈가 다를 경우 별개의 SKU로 취급합니다.
                    </StyledListItem>
                    <StyledListItem>• ‘피킹’ : 보관 상품 중 주문된 상품에 대해 선별하는 과정을 의미합니다.</StyledListItem>
                    <StyledListItem>• ‘패킹’ : 피킹된 상품을 배송이 가능한 상태로 포장하는 과정을 의미합니다.</StyledListItem>
                    <StyledListItem>• ‘합포장’ : 동일 주문에 대하여 2개 이상의 상품을 피킹하는 경우를 말합니다.</StyledListItem>
                    <StyledListItem>
                      • ‘반품’ : 사용자로부터 상품을 구매한 소매업체가 단순변심, 상품의 훼손, 오배송 등의 사유로 상품을 매장 혹은 스마트센터로 보내는 경우를
                      의미합니다.
                    </StyledListItem>
                    <StyledListItem>• ‘반출’ : 불량 상품을 공장으로 보내는 경우를 의미합니다.</StyledListItem>
                    <StyledListItem>• ‘사이트’ : 빈블러(sims.shop.co.kr)의 홈페이지를 의미합니다.</StyledListItem>
                  </StyledList>
                  <SubSectionTitle level={4}>제3조 약관의 명시와 설명 및 개정</SubSectionTitle>
                  <Paragraph>
                    1. 회사는 약관의 내용과 상호, 대표자의 성명, 영업소 소재지, 사업자 등록번호, 전화번호, 전자우편주소 등을 사용자가 알 수 있도록 사이트에
                    게시합니다. 다만, 약관의 구체적 내용은 이용자가 연결화면을 통하여 볼 수 있도록 합니다.
                  </Paragraph>
                  <Paragraph>
                    2. 약관의 효력은 사이트를 통해 온라인으로 공시하고 사용자는 본 약관의 내용을 충분히 이해한 후 그 내용을 준수 하는 것에 동의하고 서비스를
                    이용하는 것으로, 서비스 이용을 시작한 사용자는 당연히 본 약관을 준수함에 동의 한 것으로 간주합니다. 또한 본 약관의 용어는 본 약관에서 다른
                    정의가 있는 경우를 제외하고 정의된 의미를 가지는 것으로 합니다.
                  </Paragraph>
                  <Paragraph>
                    3. 약관의 변경이 필요하다고 회사에서 판단할 경우 아래 괄호에 해당하는 법률을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다. 회사가
                    약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행 약관과 함께 사이트의 화면에 그 적용일자 7일(다만, 사용자에게 불리한 내용으로
                    변경하는 경우에는 30일) 이전부터 적용일자 전일까지 공지합니다.
                  </Paragraph>
                  <Paragraph>
                    4. 제3항에 따라 공지된 적용일자 이후에 사용자가 서면으로 명시적 거부의사를 표명하지 않을 경우에는 개정된 약관에 동의하는 것으로 간주하며,
                    변경된 약관에 동의하지 않는 사용자는 회사와 정산을 마치고 센터에서 퇴점한 이후, 사이트의 회원 탈퇴를 통해 서비스 이용을 해지할 수 있습니다.
                    제3항의 조치에도 불구하고 약관의 개정 사실을 알지 못함으로써 발생하는 사용자의 피해에 대하여 회사는 책임을 지지 않습니다.
                  </Paragraph>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제2장 이용계약의 성립 및 철회</SectionTitle>
                  <SubSectionTitle level={4}>제4조 이용계약의 성립</SubSectionTitle>
                  <Paragraph>1. 사용자는 회사가 제공하는 다음 각호의 절차에 따라 서비스 신청을 합니다.</Paragraph>
                  <StyledList>
                    <StyledListItem>1. 본 약관에 대한 동의</StyledListItem>
                    <StyledListItem>2. 회원가입 완료 확인</StyledListItem>
                    <StyledListItem>3. 서비스 신청 완료 확인</StyledListItem>
                  </StyledList>
                  <Paragraph>
                    2. 회사는 본 약관에 동의하고 회원 정보를 사실대로 기재한 가입신청자의 가입 신청을 승낙함을 원칙으로 합니다. 가입신청자는 회사에서 제공한
                    필요사항을 기재해야 합니다. 단, 다음 각 호에 해당하는 신청에 대해서는 회사가 회원가입을 거부하거나 회원에게 탈퇴 요청을 할 수 있습니다.
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>
                      1. 가입신청자가 본 약관에 의하여 이전에 사용자 자격을 상실한 적이 있는 경우 (단, 회사의 사용자 재가입 승낙을 얻은 경우에는 예외로 합니다.)
                    </StyledListItem>
                    <StyledListItem>2. 실명이 아니거나 타인의 명의를 이용한 경우</StyledListItem>
                    <StyledListItem>3. 허위 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우</StyledListItem>
                    <StyledListItem>4. 사용자가 서비스의 정상적인 제공을 저해하거나 다른 사용자의 서비스 이용에 지장을 줄 것으로 예상되는 경우</StyledListItem>
                    <StyledListItem>5. 사용자의 귀책사유로 인하여 승인이 불가하거나 기타 규정한 제반 사항을 위반하여 신청하는 경우</StyledListItem>
                    <StyledListItem>6. 기타 회사가 관련법령 등을 기준으로 하여 명백하게 사회질서 및 미풍양속에 반할 우려가 있다고 판단하는 경우</StyledListItem>
                  </StyledList>
                  <Paragraph>3. 회사는 다음에 해당하는 상황에서 회원가입심사가 지연될 수 있습니다.</Paragraph>
                  <StyledList>
                    <StyledListItem>1. 회사의 설비에 여유가 없거나 기술적 장애가 있는 경우</StyledListItem>
                    <StyledListItem>2. 서비스 상의 장애 또는 서비스 이용요금 결제수단의 장애가 발생한 경우</StyledListItem>
                    <StyledListItem>3. 기타 회사가 재정적, 기술적으로 필요하다고 인정하는 경우</StyledListItem>
                  </StyledList>
                  <Paragraph>
                    4. 사용자는 본 약관 동의 및 회원가입 완료 후 다음 각 호의 신청 양식에 따라 필요 사항을 기재하여 서비스 신청을 완료합니다. 서비스 신청은
                    반드시 본인 명의의 계정으로 이루어져야 하며 회사가 요구하는 사항을 사실대로 정확하게 기재하여야 합니다.
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>1. 개인의 경우 이메일, 사용자 실명 인증 절차 이행</StyledListItem>
                    <StyledListItem>2. 사업자의 경우, 사업자 정보 기입 및 필수 서류 제출을 통한 인증 절차 이행</StyledListItem>
                    <StyledListItem>3. 서비스 신청 접수</StyledListItem>
                    <StyledListItem>4. 서비스 심사 절차 이행 후 서비스 신청 완료</StyledListItem>
                  </StyledList>
                  <Paragraph>5. 회사는 사용자의 종류에 따라 전문기관을 통한 실명확인 및 본인인증을 요청하거나 증빙자료를 추가로 요청할 수 있습니다.</Paragraph>
                  <Paragraph>
                    6. 사용자가 제공한 정보는 본인의 실제 정보로 간주되며 정보가 허위이거나 현재의 사실과 일치하지 않을 경우에 발생하는 모든 문제에 대해 회사는
                    책임지지 않습니다.
                  </Paragraph>
                  <Paragraph>7. 회사와 이용자가 서비스 이용에 관하여 별도의 계약을 체결한 경우, 해당 계약이 본 약관에 우선하여 적용됩니다.</Paragraph>
                  <Paragraph>
                    8. 서비스 신청이 완료된 회원은 회사의 서비스를 이용할 수 있습니다. 단, 다음 각호에 해당하는 경우 서비스 신청이 거부될 수 있습니다.
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>1. 제1항의 필수 서류를 제출하지 않거나 기재 내용이 허위, 오기, 기재누락이 있는 경우</StyledListItem>
                    <StyledListItem>2. 제2항, 제5항, 제6항의 회사의 요청사항에 응하지 않는 경우</StyledListItem>
                    <StyledListItem>3. 회사로부터 이용정지 당한 사용자가 그 이용정지 기간 중에 이용계약을 임의 해지하고 재이용신청을 하는 경우</StyledListItem>
                    <StyledListItem>4. 결제수단으로 타인명의, 도난 및 분실, 한도초과, 거래정지 등 결제가 불가능한 신용카드를 등록하는 경우</StyledListItem>
                    <StyledListItem>5. 기타 본 약관에 위배되거나 위법 또는 부당한 이용 신청임이 확인된 경우</StyledListItem>
                    <StyledListItem>6. 기타 회사에서 필요한 것으로 판단되는 경우</StyledListItem>
                  </StyledList>

                  <SubSectionTitle level={4}>제5조 이용계약의 철회</SubSectionTitle>
                  <Paragraph>
                    1. 회사와 서비스 이용 계약을 체결한 사용자는 『전자상거래 등에서의 소비자보호에 관한 법률』 제13조 제2항에 따른 계약내용에 관한 서면을 받은
                    날(그 서면을 받은 때보다 서비스 공급이 늦게 이루어진 경우에는 서비스 등을 공급받거나 서비스 등의 공급이 시작된 날을 말함)부터 7일 이내에는
                    청약을 철회할 수 있습니다. 다만, 청약철회에 관하여 『전자상거래 등에서의 소비자보호에 관한 법률』에 달리 정함이 있는 경우에는 동법 규정에
                    따릅니다.
                  </Paragraph>
                  <Paragraph>2. 물건입고 또는 입고 전이라도 회사의 현저한 서비스 제공 준비가 이루어진 경우 청약철회가 불가합니다.</Paragraph>
                  <Paragraph>
                    3. 회사는 『전자상거래 등에서의 소비자보호에 관한 법률』 제18조 제8항에 따라 서비스 등이 일부 제공된 경우 그 서비스 등의 공급에 든 비용에
                    상당하는 금액으로서 본 약관 제8장 제21조 제1항에 따라 서비스 준비과정에 대한 비용을 사용자에게 청구할 수 있습니다.
                  </Paragraph>

                  <SubSectionTitle level={4}>제6조 개인정보 수집 및 보호</SubSectionTitle>
                  <Paragraph>
                    1. 회사는 “정보통신망 이용촉진 및 정보보호 등에 관한 법률” 등 관계 법령이 정하는 바에 따라 사용자의 개인정보를 보호하기 위해 노력합니다.
                    사용자의 개인정보 보호 및 사용에 대해서는 회사의 개인정보처리방침이 적용됩니다.
                  </Paragraph>
                  <Paragraph>
                    2. 회사는 법령상 요구되는 경우를 제외하고는 상대방으로부터 취득한 제1항의 사용자 개인정보, 기술정보, 경영 정보 등 비밀로 관리되는 정보를
                    제3자에게 누설하여서는 안되며 그 정보를 이용계약의 이행 이외의 목적으로 이용하지 않습니다.
                  </Paragraph>
                  <Paragraph>
                    3. 회사는 이용계약의 이행 과정에서 회사의 서비스 및 상품 홍보를 위하여 회사의 개인정보 취급방침에 따라 제2항의 정보를 이용할 수 있습니다.
                    단, 사용자가 이메일 등을 통해 반대 의사를 표시하는 경우 회사는 이를 즉시 중단합니다.
                  </Paragraph>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제3장 회원 및 계정 관리</SectionTitle>

                  <SubSectionTitle level={4}>제7조 회원 계정</SubSectionTitle>
                  <Paragraph>1. 회원 계정은 ‘대표계정’과 ‘부계정’으로 구분됩니다.</Paragraph>
                  <Paragraph>
                    2. 대표계정의 경우, 본 약관 4조에서 정한 절차에 따라 사용자가 회원가입을 완료함으로써 생성되며 회사에서 제공하는 시스템 상의 사용자의 권한에
                    해당하는 모든 기능에 접근할 수 있습니다. 단, 동일한 사업자등록번호를 가진 사용자는 하나의 대표계정만을 생성할 수 있습니다.
                  </Paragraph>
                  <Paragraph>
                    3. 대표계정은 부계정을 초대하여 회사에서 제공하는 시스템 상의 기능에 접근하게 할 수 있습니다. 단, 회사가 정한 내규에 따라 한 대표계정 당
                    초대 가능한 부계정의 개수는 최대 3개로 제한되며 추가로 부계정을 초대하고자 하는 경우, 추가 비용이 발생합니다.
                  </Paragraph>
                  <Paragraph>
                    4. 대표계정은 부계정의 권한을 관리합니다. 부계정이 본 약관을 위배하여 회사에 손해를 입힌 경우의 책임은 전적으로 대표계정에 있습니다.
                  </Paragraph>
                  <Paragraph>5. 부계정의 경우, 대표계정의 초대에 의해 사용자가 인증 절차를 완료함으로써 생성됩니다.</Paragraph>

                  <SubSectionTitle level={4}>제8조 회원 정보의 변경</SubSectionTitle>
                  <Paragraph>
                    사용자는 회원가입 시 기재한 사항이나 서비스 이용 과정에서 회사에 제공한 정보가 변경되었을 경우 즉시 사용자 정보를 변경하여야 하며,
                    변경사항을 수정하지 않아 발생한 모든 불이익에 대하여 회사는 책임지지 않습니다.
                  </Paragraph>
                  <SubSectionTitle level={4}>제9조 휴면계정</SubSectionTitle>
                  <Paragraph>
                    1. 회사는 1년 이상 장시간 로그인 하지 아니하는 사용자의 개인정보를 보호하기 위해 사용자의 계정을 휴면계정으로 분류하고 서비스 이용 계약을
                    해지할 수 있습니다. 회사는 휴면계정으로 분류되기 30일 전까지 개인정보가 파기되거나 분리되어 저장된다는 사실과 기간 만료일 및 해당 개인정보의
                    항목을 이메일, 서면 또는 유사한 방법 중 하나의 방법으로 사용자에게 알리도록 합니다.
                  </Paragraph>
                  <Paragraph>
                    2. 휴면계정으로 분류된 사용자의 계정에 미납요금이 존재하는 경우, 회사는 사용자에게 통화, 서면, 이메일 등의 방법으로 이행을 최고하여 계약을
                    해지하고 미납요금에 대한 손해배상을 청구할 수 있습니다.
                  </Paragraph>
                  <Paragraph>
                    3. 서비스 이용 계약 해지 전 휴면 계정을 이용하여 로그인을 시도할 경우, 회원가입 당시 요청한 제반 정보 확인 후 바로 사용자 ID로 전환됩니다.
                  </Paragraph>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제1장 총칙</SectionTitle>
                  <SubSectionTitle level={4}>제1조 목적</SubSectionTitle>
                  <Paragraph>
                    본 약관은 「주식회사 빈블러」(이하 "회사")와 회사가 제공하는 의류 도매업 관련 통합관리솔루션(Smart Integrated Management Solution) 서비스
                    (이하 (이하 "서비스")를 이용하는 자(이하 "사용자")간의 관계와 권리 의무 및 책임 사항, 기타 서비스 이용에 관한 제반 사항을 정함을 목적으로
                    합니다.
                  </Paragraph>
                  <SubSectionTitle level={4}>제2조 용어의 정의</SubSectionTitle>
                  <Paragraph>
                    본 약관에서 사용하는 용어의 의미는 다음 각 호와 같으며, 여기에서 정의되지 않은 약관상 용어의 의미는 일반적인 거래관행에 따릅니다.
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>
                      • '서비스' : 회사가 사용자에게 제공하는 서비스로 상품 입고, 보관, 재고관리, 유통가공, 출고 및 반품 등의 업무와 이에 수반되는 제반 작업을
                      의미합니다.
                    </StyledListItem>
                    <StyledListItem>• '사용자' : 빈블러의 서비스를 이용하는 고객을 의미합니다.</StyledListItem>
                    <StyledListItem>• ‘가입신청자’ : 회원가입을 통해 회사의 사용자가 되고자 하는 자를 말합니다.</StyledListItem>
                    <StyledListItem>• '계정' : 사용자가 회사의 사이트에 회원가입하여 부여 받은 계정을 의미합니다.</StyledListItem>
                    <StyledListItem>• 'SIMS' : 사용자에게 서비스를 제공하기 위해 회사가 구축한 소프트웨어를 의미합니다.</StyledListItem>
                    <StyledListItem>
                      • '스마트센터' : 회사가 사용자에게 서비스를 제공하기 위해 임차하여 운영하는 재고 입/출고 및 제반 작업을 수행하는 센터를 의미합니다.
                    </StyledListItem>
                    <StyledListItem>
                      • ‘입고’ : 사용자가 SIMS 시스템에서 상품을 ‘발주’ 및 ‘입고등록’하여 약속된 날짜에 정해진 절차에 따라 스마트센터 안으로 상품을 들이는 것을
                      말합니다.
                    </StyledListItem>
                    <StyledListItem>
                      • ‘가용재고’ : 입고가 완료된 상품을 센터 내 상품 보관장소에 옮겨 보관하고 출고가능한 수량으로 반영하는 것을 의미합니다.
                    </StyledListItem>
                    <StyledListItem>
                      • ‘유통가공’ : 라벨 부착, 조립, 해체, 세트포장, 재포장, 재가공 등 상품유통 과정에서 상품을 가공하는 작업을 의미합니다.
                    </StyledListItem>
                    <StyledListItem>
                      • ‘출고’ : 소비자의 주문이 접수되어 센터 내에 보관 중인 상품을 배송하는 데에 까지의 과정을 의미하며 출고요청, 피킹, 패킹, 배송의 순으로
                      이뤄집니다.
                    </StyledListItem>
                    <StyledListItem>
                      • ‘SKU’ : Stock Keeping Unit, 상품의 관리를 위한 최소 단위로 같은 색상의 옷이라도 사이즈가 다를 경우 별개의 SKU로 취급합니다.
                    </StyledListItem>
                    <StyledListItem>• ‘피킹’ : 보관 상품 중 주문된 상품에 대해 선별하는 과정을 의미합니다.</StyledListItem>
                    <StyledListItem>• ‘패킹’ : 피킹된 상품을 배송이 가능한 상태로 포장하는 과정을 의미합니다.</StyledListItem>
                    <StyledListItem>• ‘합포장’ : 동일 주문에 대하여 2개 이상의 상품을 피킹하는 경우를 말합니다.</StyledListItem>
                    <StyledListItem>
                      • ‘반품’ : 사용자로부터 상품을 구매한 소매업체가 단순변심, 상품의 훼손, 오배송 등의 사유로 상품을 매장 혹은 스마트센터로 보내는 경우를
                      의미합니다.
                    </StyledListItem>
                    <StyledListItem>• ‘반출’ : 불량 상품을 공장으로 보내는 경우를 의미합니다.</StyledListItem>
                    <StyledListItem>• ‘사이트’ : 빈블러(sims.shop.co.kr)의 홈페이지를 의미합니다.</StyledListItem>
                  </StyledList>
                  <SubSectionTitle level={4}>제3조 약관의 명시와 설명 및 개정</SubSectionTitle>
                  <Paragraph>
                    1. 회사는 약관의 내용과 상호, 대표자의 성명, 영업소 소재지, 사업자 등록번호, 전화번호, 전자우편주소 등을 사용자가 알 수 있도록 사이트에
                    게시합니다. 다만, 약관의 구체적 내용은 이용자가 연결화면을 통하여 볼 수 있도록 합니다.
                  </Paragraph>
                  <Paragraph>
                    2. 약관의 효력은 사이트를 통해 온라인으로 공시하고 사용자는 본 약관의 내용을 충분히 이해한 후 그 내용을 준수 하는 것에 동의하고 서비스를
                    이용하는 것으로, 서비스 이용을 시작한 사용자는 당연히 본 약관을 준수함에 동의 한 것으로 간주합니다. 또한 본 약관의 용어는 본 약관에서 다른
                    정의가 있는 경우를 제외하고 정의된 의미를 가지는 것으로 합니다.
                  </Paragraph>
                  <Paragraph>
                    3. 약관의 변경이 필요하다고 회사에서 판단할 경우 아래 괄호에 해당하는 법률을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다. 회사가
                    약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행 약관과 함께 사이트의 화면에 그 적용일자 7일(다만, 사용자에게 불리한 내용으로
                    변경하는 경우에는 30일) 이전부터 적용일자 전일까지 공지합니다.
                  </Paragraph>
                  <Paragraph>
                    4. 제3항에 따라 공지된 적용일자 이후에 사용자가 서면으로 명시적 거부의사를 표명하지 않을 경우에는 개정된 약관에 동의하는 것으로 간주하며,
                    변경된 약관에 동의하지 않는 사용자는 회사와 정산을 마치고 센터에서 퇴점한 이후, 사이트의 회원 탈퇴를 통해 서비스 이용을 해지할 수 있습니다.
                    제3항의 조치에도 불구하고 약관의 개정 사실을 알지 못함으로써 발생하는 사용자의 피해에 대하여 회사는 책임을 지지 않습니다.
                  </Paragraph>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제4장 서비스 이용</SectionTitle>
                  <SubSectionTitle level={4}>제10조 서비스 제공 주체</SubSectionTitle>
                  <Paragraph>회사는 사용자에게 제11조에 규정한 서비스를 제공하는 주체로서 해당 서비스를 제공할 의무를 부담합니다.</Paragraph>
                  <SubSectionTitle level={4}>제11조 서비스 내용</SubSectionTitle>
                  <Paragraph>서비스신청 심사를 마친 사용자를 대상으로 회사는 아래와 같은 서비스를 제공합니다.</Paragraph>
                  <Paragraph>1. 입고</Paragraph>
                  <Paragraph>입고 서비스는 신규 상품 발주 → 입고 등록 → 적치 순 등으로 이루어지며 각 단계별 세부사항은 아래와 같습니다.</Paragraph>
                  <StyledList>
                    <StyledListItem>1) 신규 상품 등록</StyledListItem>
                    <StyledListItem2>
                      1. 사용자는 최초 입점 시 반드시 SIMS 시스템을 통해 신규 상품 및 부자재를 등록해야 합니다. 신규 상품등록 정보의 불일치로 발생한 입고 문제는
                      사용자의 과실로 인정되며 그에 따른 비용처리는 사용자가 부담해야 합니다.
                    </StyledListItem2>
                    <StyledListItem2>
                      2. SIMS 시스템에 등록되지 않은 상품 및 부자재가 입고되는 경우 추가 요금이 실비로 부과되거나 반송처리가 될 수 있습니다.
                    </StyledListItem2>
                    <StyledListItem2>3. 신규 상품 등록 시 상품명, 사용자 상품 품번을 반드시 등록해야 합니다.</StyledListItem2>
                    <StyledListItem>2) 입고 요청</StyledListItem>
                    <StyledListItem2>
                      1. 입고 요청은 SIMS 시스템에 신규 상품 등록이 된 건에 한하여 가능하며 사용자는 사이트에서 지정한 입고 요청 기준일자에 맞춰 SIMS 시스템에
                      등록하는 것을 원칙으로 합니다. 입고 요청 건의 수정 및 취소도 SIMS 시스템에서 지정한 입고 수정 및 취소 기준일자 내에서 가능합니다.
                    </StyledListItem2>
                    <StyledListItem2>
                      2. 이벤트/행사 등으로 인해 입고 물량이 평소대비 급증하는 경우 반드시 회사와 사전 협의를 권장합니다. 사전 협의되지 않은 입고요청 건은 입고
                      처리가 지연될 수 있습니다. 대량 입고 시 회사는 평소 대비 추가 인력 배치를 할 수 있으며 이에 대한 실비를 사용자에게 청구할 수 있습니다.
                    </StyledListItem2>
                    <StyledListItem2>
                      3. 위 (1), (2)에 위반되는 입고 요청 및 수정, 취소 건에 대해서 입고처리가 지연 또는 회송 처리가 될 수 있습니다.
                    </StyledListItem2>
                    <StyledListItem>3) 입고 과정</StyledListItem>
                    <StyledListItem2>
                      1. 입출고 과정에서 문제가 발생하여 사용자에게 문의를 했음에도 사용자가 이에 응하지 않아 발생하는 문제에 대해서 회사는 책임지지 않습니다.
                    </StyledListItem2>
                    <StyledListItem2>2. 회사는 다음 중 하나라도 해당하는 경우 입고 보류 또는 회송 처리할 수 있습니다.</StyledListItem2>
                    <StyledListItem3>1. 입고 요청등록 없이 입고된 상품</StyledListItem3>
                    <StyledListItem3>2. 입고 예정 정보와 실제 입고 내역이 다른 경우</StyledListItem3>
                    <StyledListItem3>3. 입고 요청 내용에 포함되지 않은 상품이 입고된 경우</StyledListItem3>
                    <StyledListItem3>4. 육안으로 확인되는 명백한 손상 또는 훼손 및 기타 결함이 인정되는 상품</StyledListItem3>
                    <StyledListItem3>5. 취급불가 상품</StyledListItem3>
                    <StyledListItem3>6. 기타 부득이한 이유로 회사가 입고가 불가능하다고 판단하는 경우</StyledListItem3>
                    <StyledListItem2>
                      3. “오류 및 불량상품”이 발견될 경우 회사는 사용자에게 이를 알려야 하며, 사용자는 최대한 빨리 폐기요청 또는 회수해야 합니다 “오류 및
                      불량상품”의 폐기 또는 처분을 요청하는 경우 별도의 비용이 부과될 수 있습니다.
                    </StyledListItem2>
                    <StyledListItem2>4. 입고가 완료된 경우 SIMS시스템을 통하여 사용자는 가용재고를 확인 할 수 있습니다.</StyledListItem2>
                  </StyledList>
                  <Paragraph>2. 보관</Paragraph>
                  <Paragraph>보관이란 입고 검수가 완료된 상품이 센터 내 상품 보관장소에 옮겨져 보관하는 단계입니다.</Paragraph>
                  <Paragraph>3. 출고</Paragraph>
                  <Paragraph>
                    출고의 단계는 출고 요청(택배/차량 기타) → 작업 지시 → 피킹 → 패킹 → 배송 순 등으로 이루어지며 각 단계별 세부사항은 아래와 같습니다.
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>1) 출고 요청</StyledListItem>
                    <StyledListItem2>1. 출고 요청은 기존의 입고된 상품만 가능하며 시스템을 통해 확인된 재고량에 맞춰 출고요청이 가능합니다.</StyledListItem2>
                    <StyledListItem2>
                      2. 출고 요청은 센터, 요청일자, 사용자, 주문번호, 소비자 성명, 배송수단 등 필수 입력정보를 모두 입력해야 가능하며 출고 주문의 취소는
                      출고지시 전까지 가능합니다.
                    </StyledListItem2>
                    <StyledListItem2>
                      3. 출고 요청 시 수량, 소비자 주소 등의 필수 입력정보의 불일치 등으로 인한 문제 발생 시 회사는 책임 지지 않습니다. 단, 회사는 사용자에게
                      이를 통보해야 하며, 사용자에 의해 해당 문제를 해결할 수 없을 경우 회사는 출고 전량 또는 일부를 유보하거나 취소할 수 있습니다.
                    </StyledListItem2>
                    <StyledListItem2>
                      4. 지정된 시간 후 출고등록된 건은 익일 출고되며, 만약 사용자의 요청으로 긴급히 출고가 필요한 경우에는 지정된 시간까지만 긴급 출고 요청이
                      가능합니다.
                    </StyledListItem2>
                    <StyledListItem2>5. 지정된 시간 내에만 사용자의 당일 출고 요청이 가능합니다.</StyledListItem2>
                    <StyledListItem2>
                      6. 회사는 사용자가 당일 출고 의뢰한 내용 및 수량과 소요 인원 상황, 타사용자의 의뢰내용 등을 고려하여 당일출고 의뢰 수량을 제한 할 수
                      있습니다.
                    </StyledListItem2>
                  </StyledList>
                  <StyledList>
                    <StyledListItem>2) 작업 지시</StyledListItem>
                    <StyledListItem>사용자의 출고 요청에 대해 센터가 출고 작업을 시작하는 것을 의미합니다.</StyledListItem>
                    <StyledListItem2>3) 피킹</StyledListItem2>
                    <StyledListItem2>
                      피킹 작업은 상품을 소비자에게 배송하기 위해 보관장소에 보관 중인 상품을 포장 작업대로 이동하는 작업을 의미합니다.
                    </StyledListItem2>
                    <StyledListItem3>1. 피킹 작업 중 회사의 귀책으로 손상되는 상품에 대해서는 상품의 원가를 기준으로 보상합니다.</StyledListItem3>
                    <StyledListItem3>2. 회사는 피킹 작업 중 불량상품에 대해서는 책임지지 않습니다.</StyledListItem3>
                    <StyledListItem2>5. 지정된 시간 내에만 사용자의 당일 출고 요청이 가능합니다.</StyledListItem2>
                    <StyledListItem2>4) 패킹</StyledListItem2>
                    <StyledListItem2>패킹작업은 피킹된 상품을 배송이 가능한 상태로 포장하는 과정을 의미합니다.</StyledListItem2>
                    <StyledListItem3>
                      1. 패킹 작업은 피킹 업무 다음으로 피킹한 상품이 주문된 수량, 품목, 상품 등이 정확하게 일치하는지 확인하는 검수작업과 사용자의 요청에 의한
                      포장 작업으로 이루어집니다.
                    </StyledListItem3>
                    <StyledListItem3>
                      2. 패킹 작업 시 수량검사는 바코드를 활용하여 DAS 시스템을 활용하여 소비자 주문과 피킹 상품의 일치 여부를 확인하는 작업을 진행할 수
                      있습니다.
                    </StyledListItem3>
                    <StyledListItem3>
                      3. 회사는 패킹 작업 과정의 영상 촬영 서비스를 지원하며, 사용자는 문의를 통해 원하는 주문 건의 촬영 영상을 확인할 수 있습니다. 이 때
                      추가적인 비용이 발생할 수 있습니다.
                    </StyledListItem3>
                    <StyledListItem3>
                      4. 패킹 업무 시 포장작업은 사용자의 요청에 따라 다양한 작업이 가능하며 사용자가 별도의 패킹방법을 요청한 경우 사용자는 패킹과 관련된
                      내용을 회사 측에 전달한 후 실시하는 것으로 합니다. 출고비용은 회사에서 정한 규칙에 따라 합리적인 기준으로 정해집니다. 사용자의 별도 요청이
                      없는 경우 통상적인 포장 방법으로 상품이 출고되며 회사는 이에 대한 책임을 지지 않습니다.
                    </StyledListItem3>
                    <StyledListItem2>5) 배송</StyledListItem2>
                    <StyledListItem3>
                      1. 패킹까지 완료된 상품은 출고 집하장에서 택배사 등을 통해 소비자 사용자에게 배송되며 사용자는 배송에 대한 현황을 SIMS 시스템을 통해
                      확인할 수 있습니다.
                    </StyledListItem3>
                    <StyledListItem3>
                      2. 회사는 배송 중에 발생한 문제(상품 훼손, 분실 등)에 대해 택배사 등에 의한 고의 또는 과실 여부를 사용자에게 통보하여야 합니다.
                    </StyledListItem3>
                    <StyledListItem3>
                      3. 배송지 주소 오류 및 상품수령 거부로 택배 반송되는 경우 반송된 상품에 대한 운송비용이 청구될 수 있습니다.
                    </StyledListItem3>
                    <StyledListItem3>
                      4. 회사는 배송 과정 중 운송업체(택배사 등)의 고의 또는 과실로 발생한 문제에 대하여 사용자를 위하여 운송업체와 일체의 문제해결을 협의하며
                      사용자는 회사가 지정하는 방법에 따라 회사에만 문의 또는 연락을 합니다.
                    </StyledListItem3>
                  </StyledList>
                  <Paragraph>4. 반품</Paragraph>
                  <Paragraph>
                    '반품'은 사용자가 SIMS 시스템을 통해 반품을 요청한 경우(소매업체 반품 요청)와 사용자가 FMS 시스템에 등록하지 않고 센터로 직접 상품이 도착한
                    경우(미등록 반품) 로 구분됩니다.
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>1) 반품업무의 순서는 소매업체 반품 요청 → 반품 검수 → 반품 처리 순으로 진행됩니다.</StyledListItem>
                    <StyledListItem2>1. 소매업체의 반품 요청</StyledListItem2>
                    <StyledListItem2>
                      소매업체의 반품 요청은 기존의 주문된 상품을 SIMS 시스템에서 찾아 반품요청을 하는 작업으로 사용자가 직접 SIMS 시스템을 통해 요청해야
                      합니다.
                    </StyledListItem2>
                    <StyledListItem2>2. 미등록 반품</StyledListItem2>
                    <StyledListItem2>미등록 반품의 경우 배송비, 반품입고 및 착불요금 등이 부과됩니다.</StyledListItem2>
                    <StyledListItem2>3. 반품검수</StyledListItem2>
                    <StyledListItem3>
                      1. 센터로 재입고된 반품 상품에 대해 공장 수선 가능 여부 확인을 위하여 사용자(디자이너)와 함께 반품처리를 진행합니다.
                    </StyledListItem3>
                    <StyledListItem3>
                      2. 수량 및 품질 등의 문제로 양품화가 불가능한 상품에 대해서는 사용자의 요청에 따라 반송, 폐기 등과 같은 절차를 거치며 각각의 비용이 부과될
                      수 있습니다.
                    </StyledListItem3>
                    <StyledListItem2>4. 반품처리</StyledListItem2>
                    <StyledListItem3>1. 반품처리가 완료된 상품은 시스템에 가용재고로 등록 및 보관됩니다.</StyledListItem3>
                    <StyledListItem3>2. 자재 및 품질 이슈 등 회사 귀책으로 인한 회수가 필요한 경우 회사는 반품을 요청할 수 있습니다.</StyledListItem3>
                  </StyledList>
                  <Paragraph>5. 부가 서비스</Paragraph>
                  <StyledList>
                    <StyledListItem>1) 재고조사</StyledListItem>
                    <StyledListItem2>
                      1. 재고조사란 보관 중인 상품의 실수량, 유통기한, 훼손여부 등을 확인하는 작업으로 사용자의 요청이 있는 경우 진행하며 이때 별도의 비용이
                      발생합니다.
                    </StyledListItem2>
                    <StyledListItem2>
                      2. 위의 (1)목 이외 사용자의 자체 재고조사는 회계법인의 실사 목적의 경우에만 허용하며 이때 별도의 비용이 발생합니다.
                    </StyledListItem2>
                    <StyledListItem2>3. 회사는 제1항의 각 호의 서비스 이외에도 추가적인 서비스를 개발하여 사용자에게 제공할 수 있습니다.</StyledListItem2>
                  </StyledList>
                  <SubSectionTitle level={4}>제12조 서비스 이용의 제한 및 정지</SubSectionTitle>
                  <Paragraph>
                    1. 회사는 다음 각 호에 해당하는 경우에 사용자의 서비스 이용을 제한할 수 있으며 이로 인해 발생한 사용자 및 제3자에게 발생한 손해에 대해서
                    책임지지 않습니다.
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>1. 결제 기한 내에 이용한 서비스에 대한 요금을 납부하지 않은 경우</StyledListItem>
                    <StyledListItem>2. 사용자의 등록 내용에 허위, 기재누락, 오기 등이 있는 경우</StyledListItem>
                    <StyledListItem>3. 사용자가 서비스의 정상적인 제공을 저해하거나 다른 사용자의 서비스 이용에 지장을 줄 것으로 예상되는 경우</StyledListItem>
                    <StyledListItem>4. 본 약관에 위배되거나 위법 또는 부당한 이용신청임이 확인된 경우</StyledListItem>
                    <StyledListItem>5. 기타 회사가 사용자의 서비스 이용이 부적당하다고 판단한 경우</StyledListItem>
                    <StyledListItem>6. 관련법령에 위배되거나 공공질서 및 미풍양속에 반할 우려가 있음을 인정하는 경우</StyledListItem>
                  </StyledList>
                  <Paragraph>2. 본 조 1항 1호에 의해 서비스 이용이 제한된 경우, 서비스 이용요금을 납부하여 이용 제한을 해지할 수 있습니다.</Paragraph>
                  <Paragraph>
                    3. 회사가 본 조 1항에 의하여 서비스를 제한 또는 정지하고자 하는 경우, 그 사실을 사용자에게 메일 또는 알림톡 등의 방법으로 사전 통보합니다.
                    단, 사전에 통보하는 것이 곤란할 경우 이용제한 조치 후 통보할 수 있습니다.
                  </Paragraph>
                  <SectionTitle level={3}>제5장 요금 및 결제</SectionTitle>
                  <SubSectionTitle level={4}>제13조 요금</SubSectionTitle>
                  <Paragraph>1. 서비스 이용요금에 해당하는 항목은 매출 대비 솔루션 비용으로만 구성됩니다.</Paragraph>
                  <StyledList>
                    <StyledListItem>1. 서비스 이용요금은 전월 기준 매출액의 8% 이며, 익월 10일까지 완납되어야 합니다.</StyledListItem>
                    <StyledListItem>
                      2. 매출액 기준 5천만원 미만인 경우에는 매출액 5천만원의 8%에 해당하는 SIMS 최소 이용요금 400만원이 부과됩니다.
                    </StyledListItem>
                  </StyledList>
                  <SubSectionTitle level={4}>제14조 이용요금 및 이용단가 변경의 고지</SubSectionTitle>
                  <Paragraph>
                    1. 서비스 요금 변경은 30일 전 이메일, 전화, 사이트, SIMS 시스템 상 안내 등의 방법으로 고지되며, 변경된 서비스 요금은 매월 1일자 기준 일할
                    적용됩니다.
                  </Paragraph>
                  <Paragraph>
                    2. 서비스 요금 변경 이후 사용자가 회사의 서비스를 계속 이용하는 경우 또는 사용자가 고지 후 30일 이내에 명시적으로 변경된 요금에 거부 의사를
                    표시하지 않는 경우 변경된 요금에 동의하는 것으로 봅니다. 변경된 요금에 동의하지 아니하는 사용자는 회사와 정산을 마치고 센터에서 퇴점한 이후
                    서비스 이용은 중단됩니다.
                  </Paragraph>
                  <SubSectionTitle level={4}>제15조 결제</SubSectionTitle>
                  <Paragraph>사용자는 이용요금을 서비스 이용 익월 10일까지 후불결제 납부할 수 있습니다.</Paragraph>
                  <Paragraph>1. 후불결제</Paragraph>
                  <Paragraph>
                    후불결제를 이용하는 사용자에 대해 회사는 매월 1일부터 말일까지의 서비스 이용요금을 정산하여 익월 5일에 청구합니다. 이용요금 결제금액에
                    대하여 회사가 필요하다고 판단된 경우에는 회사가 지정한 통장으로 계좌이체를 요청할 수 있습니다. 사용자는 청구된 금액을 결제 마감일(매월
                    10일이며, 10일이 주말/공휴일인 경우 다음 영업일)까지 결제해야 합니다.
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>1. 이용요금의 결제가 완료 되지 않았을 시 사용자는 상품을 출고하지 못할 수 있습니다.</StyledListItem>
                    <StyledListItem>
                      2. 채무 불이행 시 회사는 사용자에게 14일의 기간을 두고 메일, 서면 등의 방법으로 이행을 최고한 뒤 계약해지 통보 및 퇴점 조치를 취할 수
                      있습니다. 월 이용한 물류 서비스의 결제 당월의 말일까지 이용요금이 미납일 경우 채무 불이행으로 보고, 절차에 따라 채무 불이행 처리를 위한
                      업무를 진행 합니다. (6월 이용요금의 경우 7월 10일이 결제 마감일이며, 7월 말일까지 이용요금이 미납일 경우 채무 불이행에 따른 업무 진행)
                    </StyledListItem>
                    <StyledListItem>
                      3. 이행 최고 후 14일 후에도 사용자가 채무를 불이행 하거나 연락 두절 등으로 회사와 채무 변제에 대한 협의가 되지 않았을 시, 회사는 사용자가
                      적치한 상품을 채무 변제를 위해 공탁, 경매, 임의매각 등의 처분을 진행할 수 있습니다. 계약해지 시점부터 상품의 관리, 보관의 의무는
                      사용자에게로 이전됩니다.
                    </StyledListItem>
                    <StyledListItem>
                      4. 회사는 계약해지 통보 이후 사용자의 미퇴점으로 인한 회사의 업무상 손실 및 사용자의 부당이득에 대해 손해배상을 청구할 수 있습니다.
                    </StyledListItem>
                    <StyledListItem>5. 회사는 사용자의 채무 불이행에 대한 압류/가압류 신청, 소송제기 등의 법적인 조치를 취할 수 있습니다.</StyledListItem>
                  </StyledList>
                  <SubSectionTitle level={4}>제17조 이의제기 및 결제수단 변경</SubSectionTitle>
                  <Paragraph>
                    1. 회사와 서비스 이용 계약을 체결한 사용자는 『전자상거래 등에서의 소비자보호에 관한 법률』 제13조 제2항에 따른 계약내용에 관한 서면을 받은
                    날(그 서면을 받은 때보다 서비스 공급이 늦게 이루어진 경우에는 서비스 등을 공급받거나 서비스 등의 공급이 시작된 날을 말함)부터 7일 이내에는
                    청약을 철회할 수 있습니다. 다만, 청약철회에 관하여 『전자상거래 등에서의 소비자보호에 관한 법률』에 달리 정함이 있는 경우에는 동법 규정에
                    따릅니다.
                  </Paragraph>
                  <Paragraph>2. 물건입고 또는 입고 전이라도 회사의 현저한 서비스 제공 준비가 이루어진 경우 청약철회가 불가합니다.</Paragraph>
                  <Paragraph>1. 사용자는 회사가 청구한 정산금액에 이의가 있을 경우 이의제기신청을 하여야 합니다.</Paragraph>
                  <Paragraph>
                    2. 정산된 이용요금에 오류가 있음이 확인된 경우, 결제 마감일 이전에는 당월 기타비용으로 반영하여 요금을 정정 합니다. 그 이후 확인된 경우에는
                    차기 정산에 반영하여 요금을 청구합니다.
                  </Paragraph>
                  <Paragraph>
                    3. 이용요금은 전월 서비스에 대한 후불 정산으로 원칙적으로 환불 및 결제취소가 불가합니다. 단, 결제한 이용요금은 아래 각 호에 해당하는
                    경우에만 취소가 가능하며, 이를 위해 사용자는 결제 완료일로 부터 14일 이내 요청 해야 합니다.
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>1. 결제 완료된 결제수단이 아닌 계좌이체 혹은 가상계좌 등의 타 결제 수단으로 변경</StyledListItem>
                    <StyledListItem>2. 결제금액을 분리하여 2개 이상의 결제수단으로 재결제</StyledListItem>
                  </StyledList>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제5장 요금 및 결제</SectionTitle>
                  <Text strong>제23조 이용계약의 해지, 종료</Text>
                  <Paragraph>
                    1. 회사와 서비스를 이용 중인 사용자는 언제든지 서비스 이용계약을 해지하고 퇴점이 가능합니다. 단, 미납된 서비스 이용요금이 있는 경우 해지 및
                    퇴점 절차가 유보될 수 있고, 그로 인한 사용자의 손해에 대해 회사는 책임지지 않습니다.
                  </Paragraph>
                  <Paragraph>
                    2. 회사 또는 사용자는 상대방에게 다음 각 호의 사유가 발생하였을 경우 본 계약의 전부 또는 일부를 해지할 수 있습니다. 회사 또는 사용자는
                    자신의 귀책사유로 인해 계약을 해지 당한 경우, 상대방의 손해를 배상하여야 합니다.
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>1. 행정기관 또는 감독 관청으로부터 영업취소, 영업정지처분을 받았을 경우</StyledListItem>
                    <StyledListItem>2. 금융기관으로부터 거래정지 처분을 받았을 경우</StyledListItem>
                    <StyledListItem>
                      3. 어음, 수표의 부도, 제3자에 의한 강제집행(가압류 및 가처분 포함) 또는 파산 선고의 신청, 회사정리의 신청 등 경영상의 중대한 사유가
                      발생하여 계약이 이행될 수 없다고 인정되는 경우
                    </StyledListItem>
                    <StyledListItem>4. 재해 및 기타사유로 인하여 본 계약의 내용을 이행하기 곤란하다고 쌍방이 인정하는 경우</StyledListItem>
                    <StyledListItem>5. 본 약관 및 서비스 이용과 관련된 제반 사항의 이행을 특별한 이유 없이 지연하거나 불이행한 경우</StyledListItem>
                    <StyledListItem>6. 사용자가 회사에게 정당한 사유 없이 서비스 이용료를 지급하지 않을 경우</StyledListItem>
                    <StyledListItem>7. 최초 계약 이후, 서비스 범위 및 구간을 확대 시행함에 있어 당사자간에 합의에 이르지 못한 경우</StyledListItem>
                  </StyledList>
                  <Paragraph>3. 제1, 2항의 해지 의사표시는 상대방에게 서면, 이메일, 전화, SIMS 시스템, 기타의 방법으로 할 수 있습니다.</Paragraph>
                  <Paragraph>4. 이용계약이 종료되기 전 사용자는 다음 각호의 조치를 모두 처리해야 합니다.</Paragraph>
                  <StyledList>
                    <StyledListItem>1. 퇴점일 기준으로 센터에 보관중인 상품(반품 재고 포함)을 전량 반출해야 합니다.</StyledListItem>
                    <StyledListItem>
                      2. 미납된 서비스 이용요금은 계좌이체를 통해 퇴점일 전까지 결제해야 합니다. 결제가 이뤄지지 않은 경우 14일간 서면, 전화, 이메일 등의
                      방법으로 이행을 최고하고 이후 미납 요금이 있더라도 계약 해지
                    </StyledListItem>
                    <StyledListItem>3. 사용자는 이용계약에 따라 모든 의무의 이행을 완료해야 합니다.</StyledListItem>
                  </StyledList>
                  <Paragraph>
                    5. 계약 종료 시 회사는 사용자의 요청에 따라 상품 반출 및 인수인계에 필요한 인력 및 장비를 사용자에게 제공할 수 있고 이로 인해 발생한 비용은
                    사용자가 부담합니다.
                  </Paragraph>
                  <Paragraph>
                    6. 회사가 제공하는 이벤트/프로모션 등의 행사로 이용요금의 할인을 제공받은 경우, 1년이상 서비스를 이용하지 아니하고 계약 종료 시 할인 금액에
                    대한 위약금이 발생합니다.
                  </Paragraph>
                </ContentSection>

                <ContentSection>
                  <SectionTitle level={3}>제5장 요금 및 결제</SectionTitle>
                  <Text strong>제23조 이용계약의 해지, 종료</Text>
                  <Paragraph>
                    1. 회사와 서비스를 이용 중인 사용자는 언제든지 서비스 이용계약을 해지하고 퇴점이 가능합니다. 단, 미납된 서비스 이용요금이 있는 경우 해지 및
                    퇴점 절차가 유보될 수 있고, 그로 인한 사용자의 손해에 대해 회사는 책임지지 않습니다.
                  </Paragraph>
                  <Paragraph>
                    2. 회사 또는 사용자는 상대방에게 다음 각 호의 사유가 발생하였을 경우 본 계약의 전부 또는 일부를 해지할 수 있습니다. 회사 또는 사용자는
                    자신의 귀책사유로 인해 계약을 해지 당한 경우, 상대방의 손해를 배상하여야 합니다.
                  </Paragraph>
                  <StyledList>
                    <StyledListItem>1. 행정기관 또는 감독 관청으로부터 영업취소, 영업정지처분을 받았을 경우</StyledListItem>
                    <StyledListItem>2. 금융기관으로부터 거래정지 처분을 받았을 경우</StyledListItem>
                    <StyledListItem>
                      3. 어음, 수표의 부도, 제3자에 의한 강제집행(가압류 및 가처분 포함) 또는 파산 선고의 신청, 회사정리의 신청 등 경영상의 중대한 사유가
                      발생하여 계약이 이행될 수 없다고 인정되는 경우
                    </StyledListItem>
                    <StyledListItem>4. 재해 및 기타사유로 인하여 본 계약의 내용을 이행하기 곤란하다고 쌍방이 인정하는 경우</StyledListItem>
                    <StyledListItem>5. 본 약관 및 서비스 이용과 관련된 제반 사항의 이행을 특별한 이유 없이 지연하거나 불이행한 경우</StyledListItem>
                    <StyledListItem>6. 사용자가 회사에게 정당한 사유 없이 서비스 이용료를 지급하지 않을 경우</StyledListItem>
                    <StyledListItem>7. 최초 계약 이후, 서비스 범위 및 구간을 확대 시행함에 있어 당사자간에 합의에 이르지 못한 경우</StyledListItem>
                  </StyledList>
                  <Paragraph>3. 제1, 2항의 해지 의사표시는 상대방에게 서면, 이메일, 전화, SIMS 시스템, 기타의 방법으로 할 수 있습니다.</Paragraph>
                  <Paragraph>4. 이용계약이 종료되기 전 사용자는 다음 각호의 조치를 모두 처리해야 합니다.</Paragraph>
                  <StyledList>
                    <StyledListItem>1. 퇴점일 기준으로 센터에 보관중인 상품(반품 재고 포함)을 전량 반출해야 합니다.</StyledListItem>
                    <StyledListItem>
                      2. 미납된 서비스 이용요금은 계좌이체를 통해 퇴점일 전까지 결제해야 합니다. 결제가 이뤄지지 않은 경우 14일간 서면, 전화, 이메일 등의
                      방법으로 이행을 최고하고 이후 미납 요금이 있더라도 계약 해지
                    </StyledListItem>
                    <StyledListItem>3. 사용자는 이용계약에 따라 모든 의무의 이행을 완료해야 합니다.</StyledListItem>
                  </StyledList>
                  <Paragraph>
                    5. 계약 종료 시 회사는 사용자의 요청에 따라 상품 반출 및 인수인계에 필요한 인력 및 장비를 사용자에게 제공할 수 있고 이로 인해 발생한 비용은
                    사용자가 부담합니다.
                  </Paragraph>
                  <Paragraph>
                    6. 회사가 제공하는 이벤트/프로모션 등의 행사로 이용요금의 할인을 제공받은 경우, 1년이상 서비스를 이용하지 아니하고 계약 종료 시 할인 금액에
                    대한 위약금이 발생합니다.
                  </Paragraph>

                  <Text strong>제24조 준거법 및 관할법원</Text>
                  <Paragraph>본 계약의 체결, 효력, 해석 및 이행과 관련한 준거법은 대한민국의 법률로 합니다.</Paragraph>
                  <Paragraph>
                    본 계약과 관련하여 회사와 사용자 사이에 분쟁에 관한 소송은 제소 당시의 사용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방
                    법원의 전속 관할로 합니다. 다만 제소 당시의 사용자의 주소 또는 거소가 분명하지 않거나 외국 거주자의 경우에는 민사 소송법상의 관할 법원에
                    제기합니다.
                  </Paragraph>
                </ContentSection>
                <ContentSection>
                  <Paragraph>
                    <br />
                    <br />
                    <br />이 약관은 2022년 12월 1일부터 시행합니다.
                  </Paragraph>
                </ContentSection>
              </TabPane>
            </StyledTabs>
          </StyledContainer2>
        </StyledContainer>
      </PopupContent>
      {/*{isLoading && <Loading />}*/}
    </PopupLayout>
  );
};

export default AccessPrivacyPop;
