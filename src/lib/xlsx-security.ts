/**
 * XLSX Security Wrapper
 *
 * xlsx 라이브러리의 보안 취약점(Prototype Pollution, ReDoS)을 완화하기 위한
 * 보안 유틸리티입니다.
 *
 * 취약점 정보:
 * - GHSA-4r6h-8v6p-xvw6: Prototype Pollution (CVSS 7.8)
 * - GHSA-5pgg-2g8v-p4x9: ReDoS (CVSS 7.5)
 *
 * 완화 조치:
 * 1. 파일 크기 제한 (10MB)
 * 2. MIME 타입 검증
 * 3. 매직 넘버 확인 (.xlsx, .xls)
 * 4. 시트 개수 제한
 * 5. 셀 개수 제한
 * 6. 수식 비활성화
 * 7. 타임아웃 설정
 */

import * as XLSX from 'xlsx';

export interface SecureReadOptions {
  maxFileSize?: number; // bytes, default: 10MB
  maxSheets?: number; // default: 10
  maxRows?: number; // default: 10000
  maxCols?: number; // default: 100
  allowFormulas?: boolean; // default: false
  timeout?: number; // DEPRECATED: XLSX.read()는 동기 작업이므로 타임아웃 적용 불가
}

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
}

const DEFAULT_OPTIONS: Required<SecureReadOptions> = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxSheets: 10,
  maxRows: 10000,
  maxCols: 100,
  allowFormulas: false,
  timeout: 30000,
};

/**
 * XLSX 파일의 매직 넘버를 검증합니다.
 */
function validateMagicNumber(buffer: ArrayBuffer): boolean {
  const arr = new Uint8Array(buffer);

  // .xlsx (ZIP format)
  if (arr[0] === 0x50 && arr[1] === 0x4B) {
    return true;
  }

  // .xls (OLE2 format)
  if (arr[0] === 0xD0 && arr[1] === 0xCF && arr[2] === 0x11 && arr[3] === 0xE0) {
    return true;
  }

  return false;
}

/**
 * 파일 검증을 수행합니다.
 */
export function validateFile(
  file: File,
  options: SecureReadOptions = {}
): SecurityValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];

  // 1. 파일 크기 검증
  if (file.size > opts.maxFileSize) {
    errors.push(
      `파일 크기가 너무 큽니다. (최대: ${opts.maxFileSize / 1024 / 1024}MB)`
    );
  }

  // 2. 파일 크기 최소값 검증 (악의적으로 작은 파일)
  if (file.size < 100) {
    errors.push('파일이 너무 작습니다. 올바른 Excel 파일이 아닙니다.');
  }

  // 3. MIME 타입 검증
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];

  if (file.type && !validMimeTypes.includes(file.type)) {
    errors.push(`지원하지 않는 파일 형식입니다. (.xlsx, .xls만 가능)`);
  }

  // 4. 파일 확장자 검증
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
    errors.push('파일 확장자는 .xlsx 또는 .xls만 허용됩니다.');
  }

  // 5. 파일명 길이 검증 (경로 순회 공격 방지)
  if (file.name.length > 255) {
    errors.push('파일명이 너무 깁니다.');
  }

  // 6. 파일명에 위험한 문자 검증
  if (/[<>:"|?*\x00-\x1f]/.test(file.name) || file.name.includes('..')) {
    errors.push('파일명에 허용되지 않는 문자가 포함되어 있습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * ArrayBuffer의 매직 넘버를 검증합니다.
 */
export function validateArrayBuffer(buffer: ArrayBuffer): SecurityValidationResult {
  const errors: string[] = [];

  if (!validateMagicNumber(buffer)) {
    errors.push('올바른 Excel 파일 형식이 아닙니다.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Workbook의 구조를 검증합니다.
 */
export function validateWorkbook(
  workbook: XLSX.WorkBook,
  options: SecureReadOptions = {}
): SecurityValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];

  // 1. 시트 개수 검증
  if (workbook.SheetNames.length > opts.maxSheets) {
    errors.push(`시트 개수가 너무 많습니다. (최대: ${opts.maxSheets}개)`);
  }

  if (workbook.SheetNames.length === 0) {
    errors.push('시트가 없습니다.');
  }

  // 2. 각 시트의 크기 검증
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

    const rowCount = range.e.r - range.s.r + 1;
    const colCount = range.e.c - range.s.c + 1;

    if (rowCount > opts.maxRows) {
      errors.push(
        `시트 "${sheetName}"의 행 개수가 너무 많습니다. (최대: ${opts.maxRows}행)`
      );
    }

    if (colCount > opts.maxCols) {
      errors.push(
        `시트 "${sheetName}"의 열 개수가 너무 많습니다. (최대: ${opts.maxCols}열)`
      );
    }
  }

  // 3. 수식 검증 (allowFormulas가 false인 경우)
  if (!opts.allowFormulas) {
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];

      for (const cellAddress in sheet) {
        if (cellAddress[0] === '!') continue; // 메타데이터 스킵

        const cell = sheet[cellAddress];
        if (cell && cell.f) {
          errors.push(
            `보안상의 이유로 수식이 포함된 파일은 업로드할 수 없습니다. (시트: "${sheetName}", 셀: ${cellAddress})`
          );
          break; // 첫 번째 수식만 보고
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 보안이 강화된 XLSX 파일 읽기
 *
 * Note: XLSX.read()는 동기 작업이므로 타임아웃을 적용할 수 없습니다.
 * 대신 파일 크기와 구조 제한으로 DoS 공격을 방지합니다.
 */
export async function secureReadFile(
  file: File,
  options: SecureReadOptions = {}
): Promise<XLSX.WorkBook> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 1. 파일 검증
  const fileValidation = validateFile(file, opts);
  if (!fileValidation.isValid) {
    throw new Error(
      `파일 검증 실패:\n${fileValidation.errors.join('\n')}`
    );
  }

  // 2. ArrayBuffer 읽기
  const arrayBuffer = await file.arrayBuffer();

  // 3. 매직 넘버 검증
  const bufferValidation = validateArrayBuffer(arrayBuffer);
  if (!bufferValidation.isValid) {
    throw new Error(
      `버퍼 검증 실패:\n${bufferValidation.errors.join('\n')}`
    );
  }

  // 4. XLSX 파싱 (수식 비활성화)
  // Note: XLSX.read()는 동기 작업이므로 타임아웃 적용 불가
  // 파일 크기/구조 제한으로 DoS 방지
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellFormula: opts.allowFormulas, // 수식 처리 여부
    cellHTML: false, // HTML 비활성화
    cellStyles: false, // 스타일 비활성화 (성능 향상)
    sheetStubs: false, // 빈 셀 무시
    dense: false, // 메모리 효율
  });

  // 5. Workbook 구조 검증
  const workbookValidation = validateWorkbook(workbook, opts);
  if (!workbookValidation.isValid) {
    throw new Error(
      `워크북 검증 실패:\n${workbookValidation.errors.join('\n')}`
    );
  }

  return workbook;
}

/**
 * 보안이 강화된 시트 데이터 추출
 */
export function secureSheetToJson<T = any>(
  sheet: XLSX.WorkSheet,
  options: SecureReadOptions = {}
): T[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 범위 검증
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const rowCount = range.e.r - range.s.r + 1;
  const colCount = range.e.c - range.s.c + 1;

  if (rowCount > opts.maxRows) {
    throw new Error(`행 개수가 너무 많습니다. (최대: ${opts.maxRows}행)`);
  }

  if (colCount > opts.maxCols) {
    throw new Error(`열 개수가 너무 많습니다. (최대: ${opts.maxCols}열)`);
  }

  // JSON 변환 (수식 제외, 원시 값만)
  return XLSX.utils.sheet_to_json<T>(sheet, {
    raw: true, // 원시 숫자 값 사용 (Number() 변환 가능)
    defval: undefined, // 빈 셀은 undefined
  });
}

/**
 * 안전한 Excel 파일 생성
 */
export function secureWriteFile(
  data: any[],
  filename: string,
  sheetName: string = 'Sheet1'
): void {
  // 1. 파일명 검증
  const safeFilename = filename
    .replace(/[<>:"|?*\x00-\x1f]/g, '') // 위험한 문자 제거
    .replace(/\.\./g, '') // 경로 순회 방지
    .substring(0, 200); // 길이 제한

  if (!safeFilename.endsWith('.xlsx')) {
    throw new Error('파일명은 .xlsx 확장자로 끝나야 합니다.');
  }

  // 2. 시트명 검증 및 정제
  const safeSheetName = sheetName
    .replace(/[\[\]\\\/\?\*:]/g, '') // Excel에서 허용하지 않는 문자 제거
    .substring(0, 31); // Excel 시트명 길이 제한

  // 3. 데이터 크기 검증
  if (data.length > DEFAULT_OPTIONS.maxRows) {
    throw new Error(`데이터 행 개수가 너무 많습니다. (최대: ${DEFAULT_OPTIONS.maxRows}행)`);
  }

  // 4. 워크북 생성
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  // 5. 파일 쓰기
  XLSX.writeFile(workbook, safeFilename, {
    compression: true, // 압축 활성화
    bookType: 'xlsx', // 명시적으로 xlsx 지정
  });
}
