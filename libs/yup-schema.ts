// C:\work\shop-frontend\libs\yup-schema.ts

import * as yup from 'yup';
import {
  UserRequestCreate,
  UserRequestUpdate,
  UserRequestUnLock,
  UserRequestCreateUseYn,
  MenuRequestCreate,
  CodeRequestUpdate,
  ProductMngRequestInsertProductDet,
} from '@/generated';
import { CodeRequestCreateFields } from '@/components/popup/system/codeMng';
import { MenuFormData } from '@/components/popup/system/menuMng';
import { LoginVerificationFields } from '@/app/(auth)/login/LoginClient';
import { ProductInfoCreateFields } from '@/components/popup/product/productMng/ProductInfoAddPop';
import { ProductModFields } from '@/components/popup/product/productMng/ProductModPop';
import { ProductContentFields } from '@/components/popup/product/contentList/ProductContentPop';

export interface MenuRequestParams {
  menuCd?: string;
  upMenuCd?: string;
  menuUriTitle?: string;
}

export const YupSchema = {
  LoginVerificationRequest: (params: LoginVerificationFields) =>
    yup.object().shape({
      loginId: yup.string().required('아이디를 입력하세요.').min(2, '아이디를 올바르게 입력하세요.'),
      //.matches(/^[A-Za-z0-9_.-]+@[A-Za-z0-9-]+\.[A-Za-z0-9-]+/, '이메일 형식이 올바르지 않습니다.'),
      password: yup.string().required('비밀번호를 입력하세요.'),
      //        .matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,24}$/, t('올바르지 않은 비밀번호입니다.'),
      isMobileLogin: yup.string().required('모바일 여부.'),
    }),
  MenuRequest: (params: MenuRequestParams): yup.ObjectSchema<MenuRequestCreate> =>
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
    }) as unknown as yup.ObjectSchema<MenuRequestCreate>,
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
    }) as unknown as yup.ObjectSchema<MenuFormData>,
  AccountRequest: (): yup.ObjectSchema<UserRequestCreate> =>
    yup.object({
      loginId: yup.string().required('ID(e-mail 또는 ID)을 입력하세요.').max(100, '100자 이내로 입력하세요.'),
      //.matches(/^[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i, '유효한 이메일 양식이 아닙니다.'),
      userNm: yup.string().required('이름을 입력하세요.').max(30, '30자 이내로 입력하세요.'),
      phoneNo: yup
        .string()
        .required('휴대전화 번호를 입력하세요.')
        .min(10, '10~11자리로 - 없이 입력하세요.')
        .max(11, '10~11자리로 - 없이 입력하세요.')
        .matches(/^[0-9*]+$/, '휴대전화 번호 양식에 맞게 입력하세요.'),
      authCd: yup.string().required('권한을 선택하세요.'),
      useYn: yup
        .mixed<UserRequestCreateUseYn>()
        .oneOf(Object.values(UserRequestCreateUseYn) as UserRequestCreateUseYn[])
        .required('상태를 선택하세요.'),
      belongNm: yup.string().notRequired().max(30, '30자 이내로 입력하세요.'),
      deptNm: yup.string().notRequired().max(30, '30자 이내로 입력하세요.'),
      positionNm: yup.string().notRequired().max(30, '30자 이내로 입력하세요.'),
    }) as unknown as yup.ObjectSchema<UserRequestCreate>,
  AccountRequestForUpdate: (): yup.ObjectSchema<UserRequestUpdate> =>
    yup.object({
      loginId: yup.string().required('ID(e-mail 또는 ID)을 입력하세요.').max(100, '100자 이내로 입력하세요.'),
      //.matches(/^[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i, '유효한 이메일 양식이 아닙니다.'),
      userNm: yup.string().required('이름을 입력하세요.').max(30, '30자 이내로 입력하세요.'),
      phoneNo: yup
        .string()
        .required('휴대전화 번호를 입력하세요.')
        .min(10, '10~11자리로 - 없이 입력하세요.')
        .max(11, '10~11자리로 - 없이 입력하세요.')
        .matches(/^[0-9*]+$/, '휴대전화 번호 양식에 맞게 입력하세요.'),
      authCd: yup.string().required('권한을 선택하세요.'),
      useYn: yup.string().required('상태를 선택하세요.'),
      belongNm: yup.string().notRequired().max(30, '30자 이내로 입력하세요.'),
      deptNm: yup.string().notRequired().max(30, '30자 이내로 입력하세요.'),
      positionNm: yup.string().notRequired().max(30, '30자 이내로 입력하세요.'),
    }) as unknown as yup.ObjectSchema<UserRequestUpdate>,

  AccountUnLockRequest: (): yup.ObjectSchema<UserRequestUnLock> =>
    yup.object({
      loginPass: yup.string().required('비밀번호를 입력하세요.'),
    }) as unknown as yup.ObjectSchema<UserRequestUnLock>,

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

  CodeRequestForUpdate: (): yup.ObjectSchema<CodeRequestUpdate> =>
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
    }) as unknown as yup.ObjectSchema<CodeRequestUpdate>,
  MypageChangePasswordRequest: () =>
    yup.object().shape({
      rePassword: yup.string().required('현재 비밀번호를 입력하세요.'),
      modPassword: yup.string().required('변경 비밀번호를 입력하세요.'),
      //.matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,24}$/, '올바르지 않은 비밀번호입니다.'),
      reModpassword: yup.string().required('변경 비밀번호 확인을 입력하세요.'),
      //.matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,24}$/, '올바르지 않은 비밀번호입니다.'),
    }),

  ProductContentsRequest: (): yup.ObjectSchema<ProductContentFields> =>
    yup.object({
      title: yup.string().required('제목은 반드시 입력하셔야 합니다.'),
      content: yup
        .array()
        .of(
          yup
            .object({
              id: yup.number().required(),
              partialContent: yup.string().notRequired(),
              fileInfo: yup.lazy((value) => {
                // 스키마 생성 시점에 optional 속성이 반영되지 못하여 에러가 출력되는 현상을 정정하고자 lazy 사용
                if (!value || Object.keys(value).length === 0) {
                  return yup.mixed().notRequired();
                }
                return yup.object({
                  // fileTitle: yup
                  //   .string()
                  //   .required('파일(이미지) 제목은 필수값입니다.')
                  //   .matches(new RegExp('[A-Za-z0-9._-]+'))
                  //   .required('영문 숫자 및 최소한의 기호(점 혹은 언더바)만 허용됩니다.'),
                  fileSrcUrl: yup.string().required('파일 리소스를 찾을 수 없습니다.'),
                });
              }),
            })
            .required(),
        )
        .test('unique-fileTitle', '파일(이미지) 제목은 중복될 수 없습니다.', (items) => {
          if (!items) return true;

          const fileTitles = items
            .map((item) =>
              (item.fileInfo as { fileTitle: string; fileSrcUrl: string })?.fileTitle
                ? (item.fileInfo as { fileTitle: string; fileSrcUrl: string }).fileTitle
                : null,
            )
            .filter((item) => item != null);
          return fileTitles.length === new Set(fileTitles).size;
        }),
    }) as yup.ObjectSchema<ProductContentFields>,

  //InsertProductInfoRequest: (productId?: number): yup.ObjectSchema<ProductInfoCreateFields> =>
  // fabricOptional=true 이면 옷감정보(두께/신축성/비침/안감/세탁/세탁방법)를 옵셔널로 처리 (대분류 code_desc='etc' 인 경우)
  InsertProductInfoRequest: (fabricOptional = false): yup.ObjectSchema<ProductInfoCreateFields> =>
    yup.object({
      // todo 마이그레이션 이후 이하가 무의미하다 여길 시 삭제
      // product: yup.lazy(() => {
      //   // 1. id가 있으면 (수정 모드): 모든 필드를 선택사항으로 변경
      //   if (productId) {
      //     return yup.object().notRequired().nullable();
      //   }
      //
      //   // 2. id가 없으면 (신규 등록): 기존의 엄격한 필수 스키마 적용
      //   return yup.object({
      //     prodNm: yup.string().required('상품명은 필수값입니다!'),
      //     composition: yup.string().required('혼용율은 필수값입니다!'),
      //     // repFileId: yup.number().notRequired(),
      //     // detailFileId: yup.number().notRequired(),
      //     // sizeFileId: yup.number().notRequired(),
      //     // etcFileId: yup.number().notRequired(),
      //     makeYmd: yup.string().required('제조일자는 필수값입니다!'),
      //     orgAmt: yup.number().typeError('원가는 숫자만 입력 가능합니다.').notRequired(),
      //     sellAmt: yup.number().typeError('판매가는 숫자만 입력 가능합니다.').notRequired(),
      //     discountRate: yup.number().typeError('할인율은 숫자만 입력 가능합니다.').notRequired(),
      //     weather: yup.array().of(yup.string()).min(1, '최소 하나의 계절 유형을 선택하십시요.').required('계절 유형은 필수값입니다!'),
      //     // isSpring: yup.string().notRequired(),
      //     // isSummer: yup.string().notRequired(),
      //     // isAutumn: yup.string().notRequired(),
      //     // isWinter: yup.string().notRequired(),
      //   });
      // }),

      product: yup.object({
        prodNm: yup.string().required('상품명은 필수값입니다!'),
        composition: yup.string().required('혼용율은 필수값입니다!'),
        vendorId: yup.number().typeError('협력업체는 필수값입니다!').required('협력업체는 필수값입니다!'),
        makeYmd: yup.string().required('등록일자는  필수값입니다!'),
        orgAmt: yup.number().typeError('원가는 숫자만 입력 가능합니다.').notRequired(),
        sellAmt: yup.number().typeError('판매가는 숫자만 입력 가능합니다.').notRequired(),
        discountRate: yup.number().typeError('할인율은 숫자만 입력 가능합니다.').notRequired(),
        weather: yup.array().of(yup.string()).min(1, '최소 하나의 계절 유형을 선택하십시요.').required('계절 유형은 필수값입니다!'),
        thickTp: fabricOptional ? yup.string().notRequired() : yup.string().required('두께는 필수값입니다!'),
        spanTp: fabricOptional ? yup.string().notRequired() : yup.string().required('신축성은 필수값입니다!'),
        showTp: fabricOptional ? yup.string().notRequired() : yup.string().required('비침은 필수값입니다!'),
        transTp: fabricOptional ? yup.string().notRequired() : yup.string().required('안감은 필수값입니다!'),
        laundryTp: fabricOptional ? yup.string().notRequired() : yup.string().required('세탁은 필수값입니다!'),
        laundryDesc: fabricOptional
          ? yup.string().notRequired()
          : yup.string().when('laundryTp', {
              is: '9',
              then: (s) => s.required('세탁 기타 설명은 필수값입니다!'),
              otherwise: (s) => s.notRequired(),
            }),
        detInfo: yup.string().notRequired(),
        showYn: yup.string().notRequired(),
      }),

      categoryIds: yup.array().of(yup.number().required()).notRequired(),

      productDet: yup
        .object({
          //productDetSeq: yup.number().required(),
          productDetSize: yup.string().required('(상품상세)사이즈는 필수값입니다!'),
          productDetColor: yup.string().required('(상품상세)컬러는 필수값입니다!'),
          skuDiscountRate: yup.number().typeError('스큐 단위 할인율은 숫자만 입력 가능합니다.').required('스큐 단위 할인율은 필수값입니다!'),
          //fileId: yup.number().notRequired(),
          sleepYn: yup.string().required('휴면 여부는 필수값입니다!'),
        })
        .required('상품상세 정보는 필수값입니다!'),
    }) as yup.ObjectSchema<ProductInfoCreateFields>,

  // fabricOptional=true 이면 옷감정보(두께/신축성/비침/안감/세탁/세탁방법)를 옵셔널로 처리 (대분류 code_desc='etc' 인 경우)
  UpdateProductRequest: (fabricOptional = false): yup.ObjectSchema<ProductModFields> =>
    yup.object({
      prodNm: yup.string().required('상품명은 필수값입니다!'),
      composition: yup.string().required('혼용율은 필수값입니다!'),
      // repFileId: yup.number().notRequired(),
      // detailFileId: yup.number().notRequired(),
      // sizeFileId: yup.number().notRequired(),
      // etcFileId: yup.number().notRequired(),
      vendorId: yup.number().typeError('협력업체는 필수값입니다!').required('협력업체는 필수값입니다!'),
      makeYmd: yup.string().required('등록일자는 필수값입니다!'),
      orgAmt: yup.number().typeError('원가는 숫자만 입력 가능합니다.').notRequired(),
      sellAmt: yup.number().typeError('판매가는 숫자만 입력 가능합니다.').notRequired(),
      discountRate: yup.number().typeError('할인율은 숫자만 입력 가능합니다.').notRequired(),
      weather: yup.array().of(yup.string()).min(1, '최소 하나의 계절 유형을 선택하십시요.').required('계절 유형은 필수값입니다!'),
      // isSpring: yup.string().notRequired(),
      // isSummer: yup.string().notRequired(),
      // isAutumn: yup.string().notRequired(),
      // isWinter: yup.string().notRequired(),
      thickTp: fabricOptional ? yup.string().notRequired() : yup.string().required('두께는 필수값입니다!'),
      spanTp: fabricOptional ? yup.string().notRequired() : yup.string().required('신축성은 필수값입니다!'),
      showTp: fabricOptional ? yup.string().notRequired() : yup.string().required('비침은 필수값입니다!'),
      transTp: fabricOptional ? yup.string().notRequired() : yup.string().required('안감은 필수값입니다!'),
      laundryTp: fabricOptional ? yup.string().notRequired() : yup.string().required('세탁은 필수값입니다!'),
      laundryDesc: fabricOptional
        ? yup.string().notRequired()
        : yup.string().when('laundryTp', {
            is: '9',
            then: (s) => s.required('세탁 기타 설명은 필수값입니다!'),
            otherwise: (s) => s.notRequired(),
          }),
      detInfo: yup.string().notRequired(),
      showYn: yup.string().notRequired(),
      categoryIds: yup.array().of(yup.number().required()).notRequired(),
    }) as yup.ObjectSchema<ProductModFields>,

  InsertProductDetRequest: (): yup.ObjectSchema<ProductMngRequestInsertProductDet> =>
    yup.object({
      //productDetSeq: yup.number().required(),
      productDetSize: yup.string().required('(상품상세)사이즈는 필수값입니다!'),
      productDetColor: yup.string().required('(상품상세)컬러는 필수값입니다!'),
      skuDiscountRate: yup.number().typeError('스큐 단위 할인율은 숫자만 입력 가능합니다.').required('스큐 단위 할인율은 필수값입니다!'),
      //fileId: yup.number().notRequired(),
      sleepYn: yup.string().required('휴면 여부는 필수값입니다!'),
      productDetCntn: yup.string(),
    }) as yup.ObjectSchema<ProductMngRequestInsertProductDet>,
};
