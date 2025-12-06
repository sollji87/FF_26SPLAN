'use client';

import { useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2,
  X 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  SalesInputRow,
  CHANNELS,
  SEASONS,
  ITEM_CATEGORIES,
  getChannelCode,
  getSeasonCode,
  getCategoryCode,
  formatThousandWon,
} from '../types/plan26s';
import {
  secureReadFile,
  secureSheetToJson,
  secureWriteFile,
} from '@/lib/xlsx-security';

interface ExcelUploaderProps {
  onUpload: (inputs: SalesInputRow[]) => void;
  currentInputs: SalesInputRow[];
}

interface ParsedRow {
  채널: string;
  시즌: string;
  카테고리: string;
  '판매TAG(천원)': number;
  '할인율(%)': number;
  '실판매출액(천원)': number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  parsedData: SalesInputRow[];
}

export const ExcelUploader = ({ onUpload, currentInputs }: ExcelUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadedData, setUploadedData] = useState<SalesInputRow[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateAndParse = useCallback((rawData: ParsedRow[]): ValidationResult => {
    const errors: string[] = [];
    const parsedData: SalesInputRow[] = [];
    let rowNum = 2; // 엑셀은 1부터, 헤더 다음이 2행

    for (const row of rawData) {
      // 유연한 컬럼 매핑
      const seasonRaw =
        (row as any)['시즌'] ??
        (row as any)['시즌구분'] ??
        (row as any)['시즌 코드'] ??
        (row as any)['시즌코드'] ??
        (row as any)['Season'] ??
        (row as any)['season'];
      const channelRaw = (row as any)['채널'] ?? (row as any)['Channel'] ?? (row as any)['channel'];
      const categoryRaw =
        (row as any)['카테고리'] ??
        (row as any)['Category'] ??
        (row as any)['category'];

      // 빈 행은 건너뛴다
      const numericSum =
        Number(row['판매TAG(천원)'] || 0) +
        Number(row['할인율(%)'] || 0) +
        Number(row['실판매출액(천원)'] || 0);
      if (!channelRaw && !seasonRaw && !categoryRaw && numericSum === 0) {
        rowNum++;
        continue;
      }

      const channelCode = getChannelCode(channelRaw);
      const seasonCode = getSeasonCode(seasonRaw);
      const categoryCode = getCategoryCode(categoryRaw);

      if (!channelCode) {
        errors.push(`${rowNum}행: 유효하지 않은 채널명 "${channelRaw ?? ''}"`);
      }
      if (!seasonCode) {
        errors.push(`${rowNum}행: 유효하지 않은 시즌 "${seasonRaw ?? ''}"`);
      }
      if (!categoryCode) {
        errors.push(`${rowNum}행: 유효하지 않은 카테고리 "${categoryRaw ?? ''}"`);
      }

      const salesTagAmt = Number(row['판매TAG(천원)']) || 0;
      const discountRate = Number(row['할인율(%)']) || 0;
      let actualSalesAmt = Number(row['실판매출액(천원)']);

      // 실판매출액이 없으면 자동 계산
      if (isNaN(actualSalesAmt) || actualSalesAmt === 0) {
        actualSalesAmt = Math.round(salesTagAmt * (1 - discountRate / 100));
      }

      if (channelCode && seasonCode && categoryCode) {
        // 기존 입력에서 해당 조합 찾기
        const existingInput = currentInputs.find(
          (input) =>
            input.channelCode === channelCode &&
            input.seasonCode === seasonCode &&
            input.categoryCode === categoryCode
        );

        parsedData.push({
          id: existingInput?.id || `row-${Date.now()}-${rowNum}`,
          channelCode,
          seasonCode,
          categoryCode,
          salesTagAmt,
          discountRate,
          actualSalesAmt,
        });
      }

      rowNum++;
    }

    return {
      isValid: errors.length === 0,
      errors,
      parsedData,
    };
  }, [currentInputs]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);

      try {
        // 보안이 강화된 파일 읽기
        const workbook = await secureReadFile(file, {
          maxFileSize: 10 * 1024 * 1024, // 10MB
          maxSheets: 5,
          maxRows: 10000,
          maxCols: 50,
          allowFormulas: false, // 수식 차단
          timeout: 30000, // 30초
        });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        // 보안이 강화된 JSON 변환
        const rawData = secureSheetToJson<ParsedRow>(firstSheet, {
          maxRows: 10000,
          maxCols: 50,
        });

        const result = validateAndParse(rawData);
        setValidationResult(result);
        setUploadedData(result.parsedData);
        setIsDialogOpen(true);
      } catch (error) {
        console.error('Excel parsing error:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
        setValidationResult({
          isValid: false,
          errors: [errorMessage],
          parsedData: [],
        });
        setIsDialogOpen(true);
      } finally {
        setIsLoading(false);
        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [validateAndParse]
  );

  const handleConfirmUpload = useCallback(() => {
    if (uploadedData.length > 0) {
      // 업로드 데이터로 완전히 대체
      onUpload(uploadedData);
      setIsDialogOpen(false);
      setUploadedData([]);
      setValidationResult(null);
      alert('엑셀 업로드 데이터를 적용했습니다.');
    }
  }, [uploadedData, onUpload]);

  const handleDownloadTemplate = useCallback(() => {
    const templateData: ParsedRow[] = [];

    for (const channel of CHANNELS) {
      for (const season of SEASONS) {
        for (const category of ITEM_CATEGORIES) {
          templateData.push({
            채널: channel.name,
            시즌: season,
            카테고리: category.name,
            '판매TAG(천원)': 0,
            '할인율(%)': 0,
            '실판매출액(천원)': 0,
          });
        }
      }
    }

    try {
      // 보안이 강화된 파일 쓰기
      const worksheet = XLSX.utils.json_to_sheet(templateData);

      // 컬럼 너비 설정
      worksheet['!cols'] = [
        { wch: 12 }, // 채널
        { wch: 12 }, // 시즌구분
        { wch: 12 }, // 카테고리
        { wch: 18 }, // 판매TAG
        { wch: 12 }, // 할인율
        { wch: 18 }, // 실판매출액
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '26S 매출계획');

      XLSX.writeFile(workbook, '26S_매출계획_템플릿.xlsx', {
        compression: true,
        bookType: 'xlsx',
      });
    } catch (error) {
      console.error('Template download error:', error);
      alert('템플릿 다운로드 중 오류가 발생했습니다.');
    }
  }, []);

  const handleDownloadCurrentData = useCallback(() => {
    const exportData = currentInputs.map((input) => ({
      채널: CHANNELS.find((ch) => ch.code === input.channelCode)?.name || '',
      시즌: input.seasonCode,
      카테고리: ITEM_CATEGORIES.find((c) => c.code === input.categoryCode)?.name || '',
      '판매TAG(천원)': input.salesTagAmt,
      '할인율(%)': input.discountRate,
      '실판매출액(천원)': input.actualSalesAmt,
    }));

    try {
      // 보안이 강화된 파일 쓰기
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      worksheet['!cols'] = [
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 18 },
        { wch: 12 },
        { wch: 18 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '26S 매출계획');

      const filename = `26S_매출계획_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, filename, {
        compression: true,
        bookType: 'xlsx',
      });
    } catch (error) {
      console.error('Data export error:', error);
      alert('데이터 내보내기 중 오류가 발생했습니다.');
    }
  }, [currentInputs]);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            엑셀 업로드 / 다운로드
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isLoading ? '업로드 중...' : '엑셀 업로드'}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              템플릿 다운로드
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadCurrentData}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              현재 데이터 다운로드
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            * 엑셀 파일에는 채널, 시즌구분, 카테고리, 판매TAG(천원), 할인율(%), 실판매출액(천원) 컬럼이 필요합니다.
          </p>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {validationResult?.isValid ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              엑셀 업로드 확인
            </DialogTitle>
            <DialogDescription>
              업로드된 데이터를 확인하고 적용해주세요.
            </DialogDescription>
          </DialogHeader>

          {validationResult?.errors && validationResult.errors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-amber-800 mb-2">
                ⚠️ 다음 오류가 발견되었습니다:
              </p>
              <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                {validationResult.errors.slice(0, 5).map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
                {validationResult.errors.length > 5 && (
                  <li>...외 {validationResult.errors.length - 5}개 오류</li>
                )}
              </ul>
            </div>
          )}

          {uploadedData.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>채널</TableHead>
                    <TableHead>시즌</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead className="text-right">판매TAG (천원)</TableHead>
                    <TableHead className="text-right">할인율 (%)</TableHead>
                    <TableHead className="text-right">실판매출액 (천원)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadedData.slice(0, 20).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {CHANNELS.find((ch) => ch.code === row.channelCode)?.name}
                      </TableCell>
                    <TableCell>{row.seasonCode}</TableCell>
                      <TableCell>
                        {ITEM_CATEGORIES.find((c) => c.code === row.categoryCode)?.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatThousandWon(row.salesTagAmt)}
                      </TableCell>
                      <TableCell className="text-right">{row.discountRate}%</TableCell>
                      <TableCell className="text-right text-blue-600 font-medium">
                        {formatThousandWon(row.actualSalesAmt)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {uploadedData.length > 20 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-500">
                        ...외 {uploadedData.length - 20}개 행
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="text-sm text-slate-600 mt-2">
            총 {uploadedData.length}개 행이 업로드됩니다.
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleConfirmUpload}
              disabled={uploadedData.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              적용하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

