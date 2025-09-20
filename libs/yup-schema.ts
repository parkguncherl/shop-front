// C:\work\shop-frontend\libs\yup-schema.ts

import * as yup from 'yup';
import { LoginVerificationFields } from '../pages/login';
import { DropDownOption } from '../types/DropDownOptions';
import {
  ExpenseRequestCreate,
  FactoryRequestCreate,
  MypagePrintSetUpdateRequest,
  Order,
  PartnerFeeResponse,
  PayRequestCreate,
  PayRequestUpdate,
  ProductRequestCreate,
  RetailRequestCreate,
  RetailRequestUpdate,
  Sku,
  SkuFactory,
  VatInoutRequestCreate,
  VatRequestCreate,
  VatRequestUpdate,
} from '../generated';
import { PartnerRequestCreateFields } from '../components/popup/partner/PartnerAddPop';
import { PartnerRequestUpdateFields } from '../components/popup/partner/PartnerModPop';
import { ProductSkuRequestCreateFields } from '../components/popup/prodMng/ProductSkuAddPop';
import { AccountRequestCreateFields, AccountRequestUnLockFields, AccountRequestUpdateFields } from '../components/popup/system/accountMng';
import { CodeRequestCreateFields, CodeRequestUpdateFields } from '../components/popup/system/codeMng';
import { MenuFormData, MenuRequestCreateFields } from '../components/popup/system/menuMng';
import { MypageSaveFields } from '../pages/mypage/mypage';
import { WmsMypageSaveFields } from '../pages/mypage/mypageForWms';
import { ProductRequestUpdateFields } from '../components/popup/prodMng/ProductModPop';

export interface MenuRequestParams {
  menuCd?: string;
  upMenuCd?: string;
  menuUriTitle?: string;
}

interface ForControlledForm {
  payRequest: PayRequestCreate | PayRequestUpdate;
  order: Order;
}

type RetailRequestCreateFields = RetailRequestCreate & {
  workingDays: DropDownOption[];
};

type RetailRequestUpdateFields = RetailRequestUpdate & {
  workingDays: DropDownOption[];
};

type VatInoutRequestCreates = VatInoutRequestCreate & {
  vatNowAmt: number;
  vatStrYmd: string;
  vatEndYmd: string;
  vatAmt: number;
};

export const YupSchema = {
  LoginVerificationRequest: (params: LoginVerificationFields) =>
    yup.object().shape({
      loginId: yup.string().required('아이디를 입력하세요.').min(2, '아이디를 올바르게 입력하세요.'),
      //.matches(/^[A-Za-z0-9_.-]+@[A-Za-z0-9-]+\.[A-Za-z0-9-]+/, '이메일 형식이 올바르지 않습니다.'),
      password: yup.string().required('비밀번호를 입력하세요.'),
      //        .matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,24}$/, t('올바르지 않은 비밀번호입니다.'),
      isMobileLogin: yup.string().required('모바일 여부.'),
    }),
  MenuRequest: (params: MenuRequestParams): yup.ObjectSchema<MenuRequestCreateFields> =>
    yup.object({
      menuCd: yup
        .string()
        .required('코드를 입력하세요.')
        .test('type', params.upMenuCd === 'TOP' ? '코드는 2자리의 대문자로 입력하세요.' : '코드는 2~4자리의 대문자와 숫자로 입력하세요.', (v) =>
          /^[A-Z0-9]*$/.test(v),
        )
        .min(2, params.upMenuCd === 'TOP' ? '코드는 2자리의 대문자로 입력하세요.' : '코드는 2~4자리로 입력하세요.')
        .max(params.upMenuCd === 'TOP' ? 2 : 4, params.upMenuCd === 'TOP' ? '코드는 2자리의 대문자로 입력하세요.' : '코드는 2~4자리로 입력하세요.')
        .strict(true)
        .uppercase('영문은 대문자만 입력 가능합니다.'),
      menuNm: yup.string().required('이름을 입력하세요.').min(2, '2~30자리로 입력하세요.').max(30, '2~30자리로 입력하세요.'),
      menuUri:
        params.upMenuCd === 'TOP' || params.menuCd === params.upMenuCd
          ? yup.string().required('ICO를 입력하세요.').max(100, '100자 이내로 입력하세요.')
          : yup.string().required('URI를 입력하세요.').max(100, '100자 이내로 입력하세요.'),
    }) as yup.ObjectSchema<MenuRequestCreateFields>,
  MenuRequestForUpdate: (params: MenuRequestParams): yup.ObjectSchema<MenuFormData> =>
    yup.object({
      menuCd: yup
        .string()
        .required('코드를 입력하세요.')
        .test('type', params.upMenuCd === 'TOP' ? '코드는 2자리의 대문자로 입력하세요.' : '코드는 2~4자리의 대문자와 숫자로 입력하세요.', (v) =>
          /^[A-Z0-9]*$/.test(v),
        )
        .min(2, params.upMenuCd === 'TOP' ? '코드는 2자리의 대문자로 입력하세요.' : '코드는 2~4자리로 입력하세요.')
        .max(params.upMenuCd === 'TOP' ? 2 : 4, params.upMenuCd === 'TOP' ? '코드는 2자리의 대문자로 입력하세요.' : '코드는 2~4자리로 입력하세요.')
        .strict(true)
        .uppercase('영문은 대문자만 입력 가능합니다.'),
      menuNm: yup.string().required('이름을 입력하세요.').min(2, '2~30자리로 입력하세요.').max(30, '2~30자리로 입력하세요.'),
      menuUri:
        params.upMenuCd === 'TOP' || params.menuCd === params.upMenuCd
          ? yup.string().required('ICO를 입력하세요.').max(100, '100자 이내로 입력하세요.')
          : yup.string().required('URI를 입력하세요.').max(100, '100자 이내로 입력하세요.'),
    }) as yup.ObjectSchema<MenuFormData>,
  AccountRequest: (): yup.ObjectSchema<AccountRequestCreateFields> =>
    yup.object({
      loginId: yup
        .string()
        .required('ID(e-mail 또는 ID)을 입력하세요.' || '')
        .max(100, '100자 이내로 입력하세요.' || ''),
      //.matches(/^[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i, '유효한 이메일 양식이 아닙니다.' || ''),
      userNm: yup
        .string()
        .required('이름을 입력하세요.' || '')
        .max(30, '30자 이내로 입력하세요.' || ''),
      phoneNo: yup
        .string()
        .required('휴대전화 번호를 입력하세요.' || '')
        .min(10, '10~11자리로 - 없이 입력하세요.' || '')
        .max(11, '10~11자리로 - 없이 입력하세요.' || '')
        .matches(/^[0-9*]+$/, '휴대전화 번호 양식에 맞게 입력하세요.' || ''),
      authCd: yup.string().required('권한을 선택하세요.' || ''),
      useYn: yup.string().required('상태를 선택하세요.' || ''),
      belongNm: yup
        .string()
        .notRequired()
        .max(30, '30자 이내로 입력하세요.' || ''),
      deptNm: yup
        .string()
        .notRequired()
        .max(30, '30자 이내로 입력하세요.' || ''),
      positionNm: yup
        .string()
        .notRequired()
        .max(30, '30자 이내로 입력하세요.' || ''),
    }) as yup.ObjectSchema<AccountRequestCreateFields>,
  AccountRequestForUpdate: (): yup.ObjectSchema<AccountRequestUpdateFields> =>
    yup.object({
      loginId: yup
        .string()
        .required('ID(e-mail 또는 ID)을 입력하세요.' || '')
        .max(100, '100자 이내로 입력하세요.' || ''),
      //.matches(/^[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i, '유효한 이메일 양식이 아닙니다.' || ''),
      userNm: yup
        .string()
        .required('이름을 입력하세요.' || '')
        .max(30, '30자 이내로 입력하세요.' || ''),
      phoneNo: yup
        .string()
        .required('휴대전화 번호를 입력하세요.' || '')
        .min(10, '10~11자리로 - 없이 입력하세요.' || '')
        .max(11, '10~11자리로 - 없이 입력하세요.' || '')
        .matches(/^[0-9*]+$/, '휴대전화 번호 양식에 맞게 입력하세요.' || ''),
      authCd: yup.string().required('권한을 선택하세요.' || ''),
      useYn: yup.string().required('상태를 선택하세요.' || ''),
      belongNm: yup
        .string()
        .notRequired()
        .max(30, '30자 이내로 입력하세요.' || ''),
      deptNm: yup
        .string()
        .notRequired()
        .max(30, '30자 이내로 입력하세요.' || ''),
      positionNm: yup
        .string()
        .notRequired()
        .max(30, '30자 이내로 입력하세요.' || ''),
    }) as yup.ObjectSchema<AccountRequestUpdateFields>,

  AccountUnLockRequest: (): yup.ObjectSchema<AccountRequestUnLockFields> =>
    yup.object({
      loginPass: yup.string().required('비밀번호를 입력하세요.'),
    }) as yup.ObjectSchema<AccountRequestUnLockFields>,

  CodeRequest: (): yup.ObjectSchema<CodeRequestCreateFields> =>
    yup.object({
      codeUpper: yup.string().required('상위코드명을 입력하세요.').max(25, '25자 이내로 입력하세요.'),
      codeCd: yup.string().required('코드를 입력하세요.').max(20, '20자 이내로 입력하세요.'),
      codeNm: yup.string().required('이름을 입력하세요.').max(300, '300자 이내로 입력하세요.'),
      codeDesc: yup.string().notRequired().max(300, '300자 이내로 입력하세요.'),
      codeEtc1: yup.string().notRequired().max(300, '300자 이내로 입력하세요.'),
      codeEtc2: yup.string().notRequired().max(300, '300자 이내로 입력하세요.'),
      codeOrder: yup
        .number()
        .transform((_, originalValue) => {
          if (typeof originalValue === 'string') {
            const cleaned = originalValue.replace(/,/g, '');
            return cleaned === '' ? undefined : Number(cleaned);
          }
          return originalValue;
        })
        .typeError('순서를 입력하세요.')
        .test('type', '순서는 숫자로 입력하세요.', (v) => v === undefined || !isNaN(Number(v)))
        .notRequired(), // required() → notRequired()로 변경
      delYn: yup.string().required('필수값(사용여부)'),
      codeEngNm: yup.string().nullable(), // 추가
      codeEtcInfo: yup.string().nullable(), // 추가
      codeEtcEngInfo: yup.string().nullable(), // 추가
    }) as yup.ObjectSchema<CodeRequestCreateFields>,

  CodeRequestForUpdate: (): yup.ObjectSchema<CodeRequestUpdateFields> =>
    yup.object({
      id: yup.number().required('아이디는 필수 key 입니다. '),
      codeUpper: yup.string().required('상위코드명을 입력하세요.').max(25, '25자 이내로 입력하세요.'),
      codeCd: yup.string().required('코드를 입력하세요.').max(20, '20자 이내로 입력하세요.'),
      codeNm: yup.string().required('이름을 입력하세요.').max(300, '300자 이내로 입력하세요.'),
      codeDesc: yup.string().notRequired().max(300, '300자 이내로 입력하세요.'),
      codeEtc1: yup.string().notRequired().max(300, '300자 이내로 입력하세요.'),
      codeEtc2: yup.string().notRequired().max(300, '300자 이내로 입력하세요.'),
      codeOrder: yup
        .number()
        .transform((_, originalValue) => {
          if (typeof originalValue === 'string') {
            const cleaned = originalValue.replace(/,/g, '');
            return cleaned === '' ? undefined : Number(cleaned);
          }
          return originalValue;
        })
        .typeError('순서를 입력하세요.')
        .test('type', '순서는 숫자로 입력하세요.', (v) => v === undefined || !isNaN(Number(v)))
        .notRequired(), // required() → notRequired()로 변경
      delYn: yup.string().required('필수값(사용여부)'),
      codeEngNm: yup.string().nullable(), // 추가
      codeEtcInfo: yup.string().nullable(), // 추가
      codeEtcEngInfo: yup.string().nullable(), // 추가
    }) as yup.ObjectSchema<CodeRequestUpdateFields>,
  MypageSaveRequest: (): yup.ObjectSchema<MypageSaveFields> =>
    yup.object().shape({
      password: yup.string().required('비밀번호를 입력하세요.'),
      //.matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,24}$/,'올바르지 않은 비밀번호입니다.'),
      password2: yup.string().required('비밀번호 확인을 입력하세요.'),
      //.matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,24}$/,'올바르지 않은 비밀번호입니다.'),
      userNm: yup.string().required('이름을 입력하세요.'),
      phoneNo: yup
        .string()
        .required('휴대전화 번호를 입력하세요.')
        .test('type', '휴대전화 번호는 숫자로 입력하세요.', (v) => !isNaN(Number(v))),
      orgPartnerId: yup.number().required('파트너id 는 필수 입니다.'),
    }) as yup.ObjectSchema<MypageSaveFields>,
  WmsMypageSaveRequest: (): yup.ObjectSchema<WmsMypageSaveFields> =>
    yup.object().shape({
      password: yup.string().required('비밀번호를 입력하세요.'),
      //.matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,24}$/,'올바르지 않은 비밀번호입니다.'),
      password2: yup.string().required('비밀번호 확인을 입력하세요.'),
      //.matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,24}$/,'올바르지 않은 비밀번호입니다.'),
      userNm: yup.string().required('이름을 입력하세요.'),
      phoneNo: yup
        .string()
        .required('휴대전화 번호를 입력하세요.')
        .test('type', '휴대전화 번호는 숫자로 입력하세요.', (v) => !isNaN(Number(v))),
    }) as yup.ObjectSchema<WmsMypageSaveFields>,
  MypageChangePasswordRequest: () =>
    yup.object().shape({
      rePassword: yup.string().required('현재 비밀번호를 입력하세요.'),
      modPassword: yup.string().required('변경 비밀번호를 입력하세요.'),
      //.matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,24}$/, '올바르지 않은 비밀번호입니다.'),
      reModpassword: yup.string().required('변경 비밀번호 확인을 입력하세요.'),
      //.matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,24}$/, '올바르지 않은 비밀번호입니다.'),
    }),
  PartnerRequest: (): yup.ObjectSchema<PartnerRequestCreateFields> =>
    yup.object({
      partnerNm: yup.string().required('회사명을 입력하세요.').max(30, '30자 이내로 입력하세요.'),
      repNm: yup.string().required('대표자명을 입력하세요.').max(30, '30자 이내로 입력하세요.'),
      shortNm: yup.string().required('약어를 입력하세요.').max(30, '30자 이내로 입력하세요.'),
    }) as yup.ObjectSchema<PartnerRequestCreateFields>,
  PartnerRequestForUpdate: (): yup.ObjectSchema<PartnerRequestUpdateFields> =>
    yup.object({
      partnerNm: yup.string().required('회사명을 입력하세요.').max(30, '30자 이내로 입력하세요.'),
      repNm: yup.string().required('대표자명을 입력하세요.').max(30, '30자 이내로 입력하세요.'),
      shortNm: yup.string().required('약어를 입력하세요.').max(30, '30자 이내로 입력하세요.'),
    }) as yup.ObjectSchema<PartnerRequestUpdateFields>,
  MypagePartnerPrintRequest: (): yup.ObjectSchema<MypagePrintSetUpdateRequest> =>
    yup.object({
      logoprintyn: yup.string().notRequired().max(30, '30자 이내로 입력하세요.'),
      titleMng: yup.string().notRequired().max(1333, '1333자 이내로 입력하세요.'),
      titleNor: yup.string().notRequired().max(1333, '1333자 이내로 입력하세요.'),
      topMng: yup.string().notRequired().max(1333, '1333자 이내로 입력하세요.'),
      topNor: yup.string().notRequired().max(1333, '1333자 이내로 입력하세요.'),
      bottomNor: yup.string().notRequired().max(1333, '1333자 이내로 입력하세요.'),
      id: yup.number().notRequired(),
      partnerId: yup.number().notRequired(),
      fileId: yup.number().notRequired(),
      logoLocCd: yup.string().notRequired(),
      titleYn: yup.string().notRequired(),
      topYn: yup.string().notRequired(),
      bottomYn: yup.string().notRequired(),
      bottomMng: yup.string().notRequired(),
    }) as yup.ObjectSchema<MypagePrintSetUpdateRequest>,
  FactoryRequest: () =>
    yup.object().shape({
      compNm: yup.string().required('공장명을 입력하세요.').max(1333, '30자 이내로 입력하세요.'),
      /*factoryCd: yup.string().required('공장코드를 선택하세요.'),
      compTelNo: yup.string().required('회사 전화번호를 입력하세요.').max(1333, '30자 이내로 입력하세요.'),
      compNo: yup.string().required('사업자 번호를 입력하세요.').max(1333, '30자 이내로 입력하세요.'),
      personNm: yup.string().required('담당자를 입력하세요.').max(1333, '30자 이내로 입력하세요.'),
      personTelNo: yup.string().required('담당자 전화번호를 입력하세요.').max(1333, '30자 이내로 입력하세요.'),*/
    }),
  RetailInsertRequest: () => {
    return yup.object().shape({
      sellerNm: yup.string().required('업체명은 필수 요구사항입니다.').max(30, '30자 이내로 입력하세요.'),
      /*compEmail: yup.string().email('올바르지 않은 이메일 형식입니다.'),
      sellerFaxNo: yup.string().test(
        'is-11-digits',
        '값이 없거나 11자리 숫자여야 합니다',
        (value) => !value || /^\d{11}$/.test(value), // 값이 없거나 11자리 숫자인지 확인
      ),
      sellerTelNo: yup.string().test(
        'is-11-digits',
        '값이 없거나 11자리 숫자여야 합니다',
        (value) => !value || /^\d{11}$/.test(value), // 값이 없거나 11자리 숫자인지 확인
      ),
      personTelNo: yup.string().test(
        'is-11-digits',
        '값이 없거나 11자리 숫자여야 합니다',
        (value) => !value || /^\d{11}$/.test(value), // 값이 없거나 11자리 숫자인지 확인
      ),
      ceoTelNo: yup.string().test(
        'is-11-digits',
        '값이 없거나 11자리 숫자여야 합니다',
        (value) => !value || /^\d{11}$/.test(value), // 값이 없거나 11자리 숫자인지 확인
      ),*/
    });
  },
  ProductSkuAddRequest: (): yup.ObjectSchema<ProductSkuRequestCreateFields> =>
    yup.object({
      skuSizes: yup.array().min(1, '사이즈를 하나 이상 선택하세요.').required('사이즈를 하나 이상 선택하세요.'),
      //skuColors: yup.string().required('컬러를 입력하세요.').max(1333, '30자 이내로 입력하세요.'),
      skuColors: yup
        .array()
        .of(yup.string().required('컬러를 입력하세요.')) // 배열 항목 검증
        .min(1, '최소한 하나 이상의 컬러를 입력하세요.') // 배열 길이 검증
        .required('컬러를 입력하세요.'),
      orgAmt: yup.string().required('원가를 입력하세요.').max(1333, '30자 이내로 입력하세요.'),
      stdSellAmt: yup.string().required('기준가를 입력하세요.').max(1333, '30자 이내로 입력하세요.'),
      sellAmt: yup.string().required('판매가를 입력하세요.').max(1333, '30자 이내로 입력하세요.'),
    }) as yup.ObjectSchema<ProductSkuRequestCreateFields>,
  ProductRequest: (prodAttrOpen: boolean): yup.ObjectSchema<ProductRequestCreate> =>
    yup.object({
      prodNm: yup.string().required('상품명을 입력하세요.').max(30, '30자 이내로 입력하세요.'),
      orderShortNm: yup
        .string()
        .nullable()
        .notRequired()
        .test('orderShortNm', '제작약어를 입력해주세요.', function (value) {
          if (prodAttrOpen) {
            if (!value) return this.createError({ message: '제작약어를 입력해주세요.' });
            if (value.length > 4) return this.createError({ message: '제작약어는 4글자 이내로 입력해주세요.' });
          }
          return true;
        }),
      // 선택적 배열 필드: 기본값만 설정
      skuColors: yup.array().of(yup.string()).default([]),
      skuSizes: yup.array().of(yup.string()).default([]),
      skuFactoryList: yup
        .array()
        .of(
          yup.object({
            factoryId: yup.number(),
            gagongAmt: yup.number(),
            etcCntn: yup.string(),
          }),
        )
        .default([]),
      prodFactoryList: yup
        .array()
        .of(
          yup.object({
            factoryId: yup.string(),
            baseAmt: yup.string(),
            etcCntn: yup.string(),
          }),
        )
        .default([]),
      fileList: yup.array().of(yup.string()).default([]),
      imgFileList: yup.array().of(yup.string()).default([]),
    }) as unknown as yup.ObjectSchema<ProductRequestCreate>,
  ProductRequestForUpdate: (prodAttrOpen: boolean): yup.ObjectSchema<ProductRequestUpdateFields> =>
    yup.object({
      prodNm: yup.string().required('상품명을 입력하세요.').max(30, '30자 이내로 입력하세요.'),
      orderShortNm: yup
        .string()
        .nullable()
        .notRequired()
        .test('orderShortNm', '제작약어를 입력해주세요.', function (value) {
          if (prodAttrOpen) {
            if (!value) return this.createError({ message: '제작약어를 입력해주세요.' });
            if (value.length > 4) return this.createError({ message: '제작약어는 4글자 이내로 입력해주세요.' });
          }
          return true;
        }),
      // 선택적 배열 필드: 기본값만 설정
      skuColors: yup.array().of(yup.string()).default([]),
      skuSizes: yup.array().of(yup.string()).default([]),
      skuFactoryList: yup
        .array()
        .of(
          yup.object({
            factoryId: yup.number(),
            gagongAmt: yup.number(),
            etcCntn: yup.string(),
          }),
        )
        .default([]),
      prodFactoryList: yup
        .array()
        .of(
          yup.object({
            factoryId: yup.string(),
            baseAmt: yup.string(),
            etcCntn: yup.string(),
          }),
        )
        .default([]),
      fileList: yup.array().of(yup.string()).default([]),
      imgFileList: yup.array().of(yup.string()).default([]),
      deleteYn: yup.string().notRequired(),
    }) as unknown as yup.ObjectSchema<ProductRequestUpdateFields>,
  UserAddPopupForm: () =>
    yup.object().shape({
      loginId: yup
        .string()
        .required('ID(e-mail)을 입력하세요.' || '')
        .max(100, '100자 이내로 입력하세요.' || '')
        .matches(/^[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i, '유효한 이메일 양식이 아닙니다.' || ''),
      userNm: yup
        .string()
        .required('이름을 입력하세요.' || '')
        .max(30, '30자 이내로 입력하세요.' || ''),
      phoneNo: yup
        .string()
        .required('휴대전화 번호를 입력하세요.' || '')
        .min(10, '10~11자리로 - 없이 입력하세요.' || '')
        .max(11, '10~11자리로 - 없이 입력하세요.' || '')
        .matches(/^[0-9*]+$/, '휴대전화 번호 양식에 맞게 입력하세요.' || ''),
      authCd: yup.string().required('권한을 선택하세요.' || ''),
      belongNm: yup
        .string()
        .required('소속을 입력하세요.' || '')
        .max(30, '30자 이내로 입력하세요.' || ''),
      deptNm: yup.string().max(30, '30자 이내로 입력하세요.' || ''),
      positionNm: yup.string().max(30, '30자 이내로 입력하세요.' || ''),
      partnerId: yup.number(),
    }),
  VatInfoInsertRequest: (): yup.ObjectSchema<VatRequestCreate> =>
    yup.object({
      vatCashAmt: yup
        .number()
        .transform((_, originalValue) => {
          if (typeof originalValue === 'string') {
            const cleaned = originalValue.replace(/,/g, '');
            return cleaned === '' ? undefined : Number(cleaned);
          }
          return originalValue;
        })
        .typeError('숫자만 입력 가능합니다.')
        .notRequired(),
      vatAccountAmt: yup
        .number()
        .transform((_, originalValue) => {
          if (typeof originalValue === 'string') {
            const cleaned = originalValue.replace(/,/g, '');
            return cleaned === '' ? undefined : Number(cleaned);
          }
          return originalValue;
        })
        .typeError('숫자만 입력 가능합니다.')
        .notRequired(),
      vatAmt: yup
        .number()
        .transform((_, originalValue) => {
          if (typeof originalValue === 'string') {
            const cleaned = originalValue.replace(/,/g, '');
            return cleaned === '' ? undefined : Number(cleaned);
          }
          return originalValue;
        })
        .typeError('숫자만 입력 가능합니다.')
        .required('청구된 액수를 입력하세요.'),
      vatDcAmt: yup
        .number()
        .transform((_, originalValue) => {
          if (typeof originalValue === 'string') {
            const cleaned = originalValue.replace(/,/g, '');
            return cleaned === '' ? undefined : Number(cleaned);
          }
          return originalValue;
        })
        .typeError('숫자만 입력 가능합니다.')
        .notRequired(),
      etcCntn: yup.string().max(1333, '1333자 이내로 입력하세요.'),
    }) as yup.ObjectSchema<VatRequestCreate>,

  VatInoutInsertRequest: (): yup.ObjectSchema<VatInoutRequestCreates> =>
    yup.object({
      //workYmd: yup.string().required('청구일자를 선택하세요.'),
      //vatStrYmd: yup.string().required('대상기간을 선택하세요.'),
      //vatEndYmd: yup.string().required('대상기간을 선택하세요.'),
      vatCashAmt: yup
        .number()
        .transform((_, originalValue) => {
          if (typeof originalValue === 'string') {
            const cleaned = originalValue.replace(/,/g, '');
            return cleaned === '' ? undefined : Number(cleaned);
          }
          return originalValue;
        })
        .typeError('숫자만 입력 가능합니다.')
        .notRequired(),
      vatAccountAmt: yup
        .number()
        .transform((_, originalValue) => {
          if (typeof originalValue === 'string') {
            const cleaned = originalValue.replace(/,/g, '');
            return cleaned === '' ? undefined : Number(cleaned);
          }
          return originalValue;
        })
        .typeError('숫자만 입력 가능합니다.')
        .notRequired(),
      vatDcAmt: yup
        .number()
        .transform((_, originalValue) => {
          if (typeof originalValue === 'string') {
            const cleaned = originalValue.replace(/,/g, '');
            return cleaned === '' ? undefined : Number(cleaned);
          }
          return originalValue;
        })
        .typeError('숫자만 입력 가능합니다.')
        .notRequired(),
      etcCntn: yup.string().max(1333, '1333자 이내로 입력하세요.'),
    }) as yup.ObjectSchema<VatInoutRequestCreates>,

  VatInfoUpdateRequest: (): yup.ObjectSchema<VatRequestUpdate> =>
    yup.object({
      vatAmt: yup
        .number()
        .transform((_, originalValue) => {
          if (typeof originalValue === 'string') {
            const cleaned = originalValue.replace(/,/g, '');
            return cleaned === '' ? undefined : Number(cleaned);
          }
          return originalValue;
        })
        .typeError('숫자만 입력 가능합니다.')
        .required('청구된 액수를 입력하세요.'),
      etcCntn: yup.string().max(1333, '1333자 이내로 입력하세요.').nullable(),
    }) as yup.ObjectSchema<VatRequestUpdate>,
  ExpenseRequest: (): yup.ObjectSchema<ExpenseRequestCreate> =>
    yup.object({
      inAmt: yup
        .number()
        .transform((_, originalValue) => {
          if (typeof originalValue === 'string') {
            const cleaned = originalValue.replace(/,/g, '');
            return cleaned === '' ? undefined : Number(cleaned);
          }
          return originalValue;
        })
        .typeError('숫자만 가능합니다.')
        .notRequired(),
      outAmt: yup
        .number()
        .transform((_, originalValue) => {
          if (typeof originalValue === 'string') {
            const cleaned = originalValue.replace(/,/g, '');
            return cleaned === '' ? undefined : Number(cleaned);
          }
          return originalValue;
        })
        .typeError('숫자만 가능합니다.')
        .notRequired(),
      noteCntn: yup.string().max(1000, '1000자 이내로 입력하세요.').nullable(),
      creTm: yup.string().notRequired(),
      creUser: yup.string().notRequired(),
      updTm: yup.string().notRequired(),
      updUser: yup.string().notRequired(),
      deleteYn: yup.string().notRequired(),
      totalRowCount: yup.number().notRequired(),
      no: yup.number().notRequired(),
      delYn: yup.string().notRequired(),
      partnerId: yup.number().notRequired(),
      accountCd: yup.string().notRequired(),
      workYmd: yup.string().notRequired(),
    }) as yup.ObjectSchema<ExpenseRequestCreate>,
  //적치위치저장용
  LocsetSaveRequest: () =>
    yup.object().shape({
      logisId: yup.number().required('창고 ID를 입력하세요.'),
      zoneCd: yup.string().nullable(),
      location: yup
        .string()
        .matches(/^[A-Z0-9]+$/, '위치는 영문 대문자와 숫자만 입력 가능합니다.')
        .min(1, '최소 1자 이상 입력하세요.')
        .max(50, '50자 이내로 입력하세요.'),
      locCntn: yup.string().max(100, '위치 설명은 100자 이내로 입력하세요.'),
    }),

  RetailRegRequest: (): yup.ObjectSchema<RetailRequestCreateFields> =>
    yup
      .object({
        sellerNm: yup.string().required('판매처명을 입력하세요').max(30, '30자 이내'),
        compNm: yup.string().notRequired(),
        compNo: yup.string().notRequired(),
        ceoNm: yup.string().notRequired(),
        ceoTelNo: yup.string().notRequired(),
        personNm: yup.string().notRequired(),
        personTelNo: yup.string().notRequired(),
        sellerAddr: yup.string().notRequired(),
        snsId: yup.string().notRequired(),
        gubun1: yup.string().notRequired(),
        gubun2: yup.string().notRequired(),
        etcScrCntn: yup.string().notRequired(),
        etcChitCntn: yup.string().notRequired(),
        compPrnCd: yup.string().notRequired(),
        remainYn: yup.string().notRequired(),
        vatYn: yup.string().notRequired(),
        regYmd: yup.string().notRequired(),
        workingDays: yup
          .array()
          .of(
            yup.object({
              key: yup.number().required(),
              value: yup.string().required(),
              label: yup.string().required(),
            }),
          )
          .notRequired(),
      })
      .noUnknown(false) as yup.ObjectSchema<RetailRequestCreateFields>,

  RetailModRequest: (): yup.ObjectSchema<RetailRequestUpdateFields> =>
    yup
      .object({
        sellerNm: yup.string().required('판매처명을 입력하세요').max(30, '30자 이내'),
        compNm: yup.string().notRequired(),
        compNo: yup.string().notRequired(),
        ceoNm: yup.string().notRequired(),
        ceoTelNo: yup.string().notRequired(),
        personNm: yup.string().notRequired(),
        personTelNo: yup.string().notRequired(),
        sellerAddr: yup.string().notRequired(),
        snsId: yup.string().notRequired(),
        gubun1: yup.string().notRequired(),
        gubun2: yup.string().notRequired(),
        etcScrCntn: yup.string().notRequired(),
        etcChitCntn: yup.string().notRequired(),
        compPrnCd: yup.string().notRequired(),
        remainYn: yup.string().notRequired(),
        vatYn: yup.string().notRequired(),
        regYmd: yup.string().notRequired(),
        workingDays: yup
          .array()
          .of(
            yup.object({
              key: yup.number().required(),
              value: yup.string().required(),
              label: yup.string().required(),
            }),
          )
          .notRequired(),
      })
      .noUnknown(false) as yup.ObjectSchema<RetailRequestUpdateFields>,
  FactoryRegRequest: (): yup.ObjectSchema<FactoryRequestCreate> =>
    yup.object({
      compNm: yup.string().required('생산처명을 입력하세요.').max(30, '30자 이내로 입력하세요.'),
      compAddr: yup.string().nullable().max(33, '33자 이내로 입력하세요.'),
      compEmail: yup
        .string()
        .nullable() // 필수값이 아님
        .test('is-valid-email', '유효한 이메일 형식이 아닙니다.', function (value) {
          // 값이 존재하는 경우에만 이메일 형식 검증
          if (value) {
            return yup.string().email().isValidSync(value);
          }
          return true; // 값이 없으면 유효한 것으로 간주
        }),
      creTm: yup.string().notRequired(),
      creUser: yup.string().notRequired(),
      updTm: yup.string().notRequired(),
      updUser: yup.string().notRequired(),
      deleteYn: yup.string().notRequired(),
      totalRowCount: yup.number().notRequired(),
      no: yup.number().notRequired(),
      delYn: yup.string().notRequired(),
      id: yup.number().notRequired(),
      partnerId: yup.number().notRequired(),
      partnerNm: yup.string().notRequired(),
      busiNm: yup.string().notRequired(),
      factoryCd: yup.string().notRequired(),
      compTelNo: yup.string().notRequired(),
      personNm: yup.string().notRequired(),
      personTelNo: yup.string().notRequired(),
      senderNm: yup.string().notRequired(),
      senderTelNo: yup.string().notRequired(),
      compNo: yup.string().notRequired(),
      detailInfo: yup.string().notRequired(),
      compFaxNo: yup.string().notRequired(),
      fileId: yup.number().notRequired(),
      snsType: yup.string().notRequired(),
      snsId: yup.string().notRequired(),
      tranYn: yup.string().notRequired(),
      remPrnYn: yup.string().notRequired(),
      etcScrCntn: yup.string().notRequired(),
      etcChitCntn: yup.string().notRequired(),
      nowAmt: yup.number().notRequired(),
      gubun1: yup.string().notRequired(),
      gubun2: yup.string().notRequired(),
      ceoNm: yup.string().notRequired(),
      ceoTelNo: yup.string().notRequired(),
      sleepYn: yup.string().notRequired(),
      remainYn: yup.string().notRequired(),
      regYmd: yup.string().notRequired(),
    }) as yup.ObjectSchema<FactoryRequestCreate>,
  OrderCreateOrUpdateRequest: (): yup.ObjectSchema<ForControlledForm> =>
    yup.object({
      order: yup.object({
        logisAmt: yup
          .number()
          .transform((_, originalValue) => {
            if (typeof originalValue === 'string') {
              const cleaned = originalValue.replace(/,/g, '');
              return cleaned === '' ? undefined : Number(cleaned);
            }
            return originalValue;
          })
          .typeError('물류비 값은 숫자만 가능합니다.')
          .notRequired(),
      }),
      payRequest: yup.object({
        discountAmt: yup
          .number()
          .transform((_, originalValue) => {
            if (typeof originalValue === 'string') {
              const cleaned = originalValue.replace(/,/g, '');
              return cleaned === '' ? undefined : Number(cleaned);
            }
            return originalValue;
          })
          .typeError('할인금액은 숫자만 가능합니다.')
          .notRequired(),
        cashAmt: yup
          .number()
          .transform((_, originalValue) => {
            if (typeof originalValue === 'string') {
              const cleaned = originalValue.replace(/,/g, '');
              return cleaned === '' ? undefined : Number(cleaned);
            }
            return originalValue;
          })
          .typeError('현금입금은 숫자만 가능합니다.')
          .notRequired(),
        accountAmt: yup
          .number()
          .transform((_, originalValue) => {
            if (typeof originalValue === 'string') {
              const cleaned = originalValue.replace(/,/g, '');
              return cleaned === '' ? undefined : Number(cleaned);
            }
            return originalValue;
          })
          .typeError('통장입금은 숫자만 가능합니다.')
          .notRequired(),
      }),
    }) as yup.ObjectSchema<ForControlledForm>,
  PaymentCreateOrUpdateRequest: (): yup.ObjectSchema<PayRequestCreate | PayRequestUpdate> =>
    yup.object({
      discountAmt: yup
        .number()
        .transform((_, originalValue) => {
          if (typeof originalValue === 'string') {
            const cleaned = originalValue.replace(/,/g, '');
            return cleaned === '' ? undefined : Number(cleaned);
          }
          return originalValue;
        })
        .typeError('할인금액은 숫자만 가능합니다.')
        .notRequired(),
      cashAmt: yup
        .number()
        .transform((_, originalValue) => {
          if (typeof originalValue === 'string') {
            const cleaned = originalValue.replace(/,/g, '');
            return cleaned === '' ? undefined : Number(cleaned);
          }
          return originalValue;
        })
        .typeError('현금입금은 숫자만 가능합니다.')
        .notRequired(),
      accountAmt: yup
        .number()
        .transform((_, originalValue) => {
          if (typeof originalValue === 'string') {
            const cleaned = originalValue.replace(/,/g, '');
            return cleaned === '' ? undefined : Number(cleaned);
          }
          return originalValue;
        })
        .typeError('통장입금은 숫자만 가능합니다.')
        .notRequired(),
      creTm: yup.string().notRequired(),
      creUser: yup.string().notRequired(),
      updTm: yup.string().notRequired(),
      updUser: yup.string().notRequired(),
      deleteYn: yup.string().notRequired(),
      totalRowCount: yup.number().notRequired(),
      no: yup.number().notRequired(),
      delYn: yup.string().notRequired(),
      id: yup.number().notRequired(),
      partnerId: yup.number().notRequired(),
      sellerId: yup.number().notRequired(),
      sellerNm: yup.string().notRequired(),
      orderId: yup.number().notRequired(),
      chitNo: yup.number().notRequired(),
      inoutCd: yup.string().notRequired(),
      payMethodCd: yup.string().notRequired(),
      custStatCd: yup.string().notRequired(),
      tranYmd: yup.string().notRequired(),
      workYmd: yup.string().notRequired(),
      payAmt: yup.number().notRequired(),
      returnAmt: yup.number().notRequired(),
      totAmt: yup.number().notRequired(),
      firstBefAmt: yup.number().notRequired(),
      befAmt: yup.number().notRequired(),
      payEtc: yup.string().notRequired(),
      etcPrintYn: yup.string().notRequired(),
      orgWorkYmd: yup.string().notRequired(),
      befId: yup.number().notRequired(),
      modCd: yup.string().notRequired(),
      etcAccCntn: yup.string().notRequired(),
      receiptIsDone: yup.string().notRequired(),
    }) as yup.ObjectSchema<PayRequestCreate | PayRequestUpdate>,

  FeeRequest: (): yup.ObjectSchema<PartnerFeeResponse> =>
    yup.object({
      partnerId: yup.number().required('화주는 반드시 입력하셔야 합니다.'),
      startDay: yup.string().required('일자는 반드시 입력하셔야 합니다.'),
      feeType: yup.string().required('수수료유형은 반드시 입력하셔야 합니다.'),
      stockFee: yup.number().required('입고 수수료는 반드시 입력하셔야 합니다.'),
      jobFee: yup.number().required('작업 수수료는 반드시 입력하셔야 합니다.'),
      serviceFee: yup.number().required('서비스 수수료는 반드시 입력하셔야 합니다.'),
      maintFee: yup.number().required('관리 수수료는 반드시 입력하셔야 합니다.'),
      orderFee: yup.number().required('주문 수수료는 반드시 입력하셔야 합니다.'),
      hangerFee: yup.number().required('행거 수수료는 반드시 입력하셔야 합니다.'),
    }) as yup.ObjectSchema<PartnerFeeResponse>,
};
