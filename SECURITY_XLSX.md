# XLSX 라이브러리 보안 완화 조치

## 📋 개요

이 문서는 `xlsx` 라이브러리(v0.18.5)의 알려진 보안 취약점과 완화 조치를 설명합니다.

## ⚠️ 식별된 취약점

### 1. Prototype Pollution (GHSA-4r6h-8v6p-xvw6)
- **심각도**: HIGH (CVSS 7.8)
- **영향 범위**: xlsx < 0.19.3
- **설명**: 악의적으로 조작된 Excel 파일을 통해 JavaScript 객체의 프로토타입을 오염시킬 수 있음
- **잠재적 영향**:
  - 애플리케이션 로직 변조
  - 권한 상승
  - 데이터 무결성 손상

### 2. Regular Expression Denial of Service (ReDoS) (GHSA-5pgg-2g8v-p4x9)
- **심각도**: HIGH (CVSS 7.5)
- **영향 범위**: xlsx < 0.20.2
- **설명**: 특정 패턴의 입력으로 정규식 처리 시간이 기하급수적으로 증가
- **잠재적 영향**:
  - 서비스 거부 (DoS)
  - 서버 리소스 고갈
  - 응답 시간 지연

## 🛡️ 구현된 완화 조치

### 1. 파일 업로드 검증 (`src/lib/xlsx-security.ts`)

#### 파일 크기 제한
```typescript
maxFileSize: 10MB (기본값)
```
- 대용량 파일을 통한 메모리 고갈 공격 방지
- 처리 시간 제한

#### MIME 타입 검증
```typescript
허용된 타입:
- application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (.xlsx)
- application/vnd.ms-excel (.xls)
```

#### 매직 넘버 검증
```typescript
.xlsx: 0x50 0x4B (ZIP format)
.xls:  0xD0 0xCF 0x11 0xE0 (OLE2 format)
```
- MIME 타입 스푸핑 방지
- 실제 파일 형식 검증

#### 파일명 검증
```typescript
- 최대 길이: 255자
- 금지 문자: < > : " | ? * \x00-\x1f
- 경로 순회 차단: ".." 패턴 차단
- 확장자 제한: .xlsx, .xls만 허용
```

### 2. 워크북 구조 검증

#### 시트 개수 제한
```typescript
maxSheets: 10 (기본값)
```
- 과도한 메모리 사용 방지

#### 행/열 개수 제한
```typescript
maxRows: 10,000 (기본값)
maxCols: 100 (기본값)
```
- 처리 시간 및 메모리 제한
- ReDoS 공격 완화

#### 수식 차단
```typescript
allowFormulas: false (기본값)
```
- **중요**: 악의적인 수식 실행 방지
- Prototype Pollution 공격 벡터 차단
- 프로젝트 특성상 수식이 필요 없음

### 3. 파싱 옵션 강화

```typescript
XLSX.read(arrayBuffer, {
  type: 'array',
  cellFormula: false,      // 수식 비활성화
  cellHTML: false,         // HTML 비활성화
  cellStyles: false,       // 스타일 비활성화
  sheetStubs: false,       // 빈 셀 무시
  dense: false,            // 메모리 효율
})
```

### 4. 타임아웃 설정

```typescript
timeout: 30,000ms (기본값)
```
- ReDoS 공격으로 인한 무한 처리 방지
- 파일 읽기 및 파싱 시간 제한

### 5. 에러 처리 강화

- 모든 검증 단계에서 명확한 에러 메시지 제공
- 사용자에게 구체적인 실패 원인 전달
- 민감한 시스템 정보 노출 방지

## 📁 적용된 파일

### 보안 유틸리티
- `src/lib/xlsx-security.ts`: 보안 래퍼 함수

### 업데이트된 컴포넌트
- `src/features/dashboard/components/ExcelUploader.tsx`: Excel 업로드/다운로드

## 🔍 사용 예시

### 안전한 파일 읽기
```typescript
import { secureReadFile } from '@/lib/xlsx-security';

const workbook = await secureReadFile(file, {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxSheets: 5,
  maxRows: 10000,
  maxCols: 50,
  allowFormulas: false,
  timeout: 30000,
});
```

### 안전한 데이터 추출
```typescript
import { secureSheetToJson } from '@/lib/xlsx-security';

const data = secureSheetToJson(sheet, {
  maxRows: 10000,
  maxCols: 50,
});
```

## ⚡ 추가 보안 권장사항

### 1. 신뢰할 수 없는 출처의 파일 처리
- ✅ 구현됨: 파일 검증 레이어
- ✅ 구현됨: 수식 차단
- ✅ 구현됨: 크기/구조 제한

### 2. 사용자 교육
- 신뢰할 수 있는 출처의 파일만 업로드
- 의심스러운 파일 업로드 시 관리자에게 보고
- 템플릿 파일 사용 권장

### 3. 모니터링
다음 항목을 모니터링하여 잠재적 공격 탐지:
- 파일 업로드 실패율
- 파일 크기 분포
- 파싱 타임아웃 발생 빈도
- 검증 실패 패턴

### 4. 정기 검토
- xlsx 라이브러리 업데이트 확인 (월 1회)
- 보안 권고사항 모니터링
- 완화 조치 효과성 검토

## 🚨 알려진 제한사항

### xlsx 라이브러리 업데이트 불가
현재 xlsx 0.18.5는 보안 패치가 제공되지 않습니다:
- 공식 수정 버전 없음
- 완화 조치로 위험 최소화
- 필요시 대체 라이브러리 검토 필요

### 대체 라이브러리 옵션
향후 고려 가능한 대안:
1. **exceljs** - 활발한 유지보수, 현대적 API
2. **sheetjs-ce** - SheetJS 커뮤니티 에디션
3. **xlsx-js-style** - SheetJS 포크, 스타일 지원

## 📝 변경 이력

### 2025-12-06
- 초기 보안 완화 조치 구현
- xlsx-security.ts 유틸리티 생성
- ExcelUploader.tsx 보안 강화
- 보안 문서 작성

## 📞 보고

보안 문제 발견 시:
1. 즉시 파일 업로드 중단
2. 의심 파일 격리
3. 개발팀에 보고
4. 로그 확인 및 영향 범위 분석

## 참고 자료

- [GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6) - Prototype Pollution
- [GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9) - ReDoS
- [OWASP File Upload](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
- [SheetJS Documentation](https://docs.sheetjs.com/)
