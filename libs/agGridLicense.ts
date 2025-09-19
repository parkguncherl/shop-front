// libs/agGridLicense.ts

import { LicenseManager } from 'ag-grid-enterprise';

export function initAgGridLicense() {
  const licenseKey = process.env.NEXT_PUBLIC_AG_GRID_LICENSE_KEY;

  if (licenseKey) {
    console.log('licenseKdy ==>', licenseKey);
    //LicenseManager.setLicenseKey(licenseKey);
  } else {
    console.warn('AG Grid 라이센스 키가 설정되지 않았습니다.');
  }
}
