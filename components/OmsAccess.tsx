import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { authApi } from '../libs';
import { toast } from 'react-toastify';
import { signIn } from 'next-auth/react';

// Partner 정보 인터페이스
interface PartnerInfo {
  id: number;
  partnerNm: string;
  logisId: number;
  shortNm: string;
  orderShortNm: string;
  upperPartnerId: number;
}

// API 응답 타입 정의
interface ApiResponse {
  resultCode: number;
  resultMessage: string;
  body: PartnerInfo[] | null;
}

const OmsAccessCombo = () => {
  const { data: session, update: updateSession } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [partners, setPartners] = useState<PartnerInfo[]>([]);
  const comboRef = useRef<HTMLDivElement>(null);

  // API 호출
  const { data: partnerResponse, isError } = useQuery<ApiResponse>(['partner-list'], () => authApi.get('/partner'), {
    enabled: !!session?.user,
    onError: (error) => {
      console.error('파트너 목록 조회 실패:', error);
      toast.error('화주사 목록을 불러오는데 실패했습니다.');
    },
  });

  // 파트너 데이터 로드
  useEffect(() => {
    const loadPartners = async () => {
      try {
        if (partnerResponse?.resultCode === 200) {
          // 먼저 파트너 데이터 API 호출
          const response = await authApi.get<ApiResponse>('/partner/list');
          if (response.data.resultCode === 200 && response.data.body) {
            setPartners(response.data.body);
          }
        }
      } catch (error) {
        console.error('Failed to load partners:', error);
        toast.error('화주사 목록을 불러오는데 실패했습니다.');
      }
    };

    loadPartners();
  }, [partnerResponse]);

  // OMS 로그인 처리
  const handleOmsLogin = async (partner: PartnerInfo) => {
    try {
      const result = await signIn('credentials', {
        loginId: 'OMS_MASTER',
        partnerId: partner.id,
        redirect: false,
      });

      if (result?.error) {
        return toast.error(result.error);
      }

      if (result?.ok) {
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            partner_id: partner.id,
            work_logis_id: partner.logisId,
          },
        });

        toast.success(`${partner.partnerNm} OMS 시스템으로 전환되었습니다.`);
        window.location.href = '/oms/dashboard';
      }
    } catch (error) {
      toast.error('OMS 전환 중 오류가 발생했습니다.');
    }
  };

  const handlePartnerSelect = (partner: PartnerInfo) => {
    setIsOpen(false);
    handleOmsLogin(partner);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPartners = searchTerm ? partners.filter((partner) => partner.partnerNm.toLowerCase().includes(searchTerm.toLowerCase())) : partners;

  return (
    <div ref={comboRef} className="relative">
      <div className="flex flex-col">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={() => setIsOpen(true)}
          placeholder="화주사 검색..."
          className="p-2 border rounded"
        />

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded shadow-lg">
            {filteredPartners.length > 0 ? (
              filteredPartners.map((partner) => (
                <div key={partner.id} onClick={() => handlePartnerSelect(partner)} className="p-2 hover:bg-gray-100 cursor-pointer">
                  <div className="font-medium">{partner.partnerNm}</div>
                  {partner.shortNm && <div className="text-sm text-gray-500">{partner.shortNm}</div>}
                </div>
              ))
            ) : (
              <div className="p-2 text-center text-gray-500">{isError ? '오류가 발생했습니다' : '접근 가능한 화주사가 없습니다'}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OmsAccessCombo;
