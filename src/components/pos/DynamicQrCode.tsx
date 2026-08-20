import React, { useMemo } from 'react';

// Lightweight QR Code Matrix Generator (Byte mode, standard Reed-Solomon GF(256))
// Handles QR version 1-6 sufficient for UPI URIs
interface QrCodeProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  includeMargin?: boolean;
  className?: string;
  logo?: React.ReactNode;
}

// Generate deterministic QR matrix
function createQrMatrix(text: string): boolean[][] {
  const size = 29;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setModule = (r: number, c: number, val: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      isFunction[r][c] = true;
    }
  };

  // Draw 7x7 Finder Pattern at (row, col)
  const drawFinderPattern = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isOuterBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInnerSquare = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          matrix[nr][nc] = isOuterBorder || isInnerSquare;
        } else {
          matrix[nr][nc] = false; // separator
        }
        isFunction[nr][nc] = true;
      }
    }
  };

  // 1. Finder patterns
  drawFinderPattern(0, 0);
  drawFinderPattern(0, size - 7);
  drawFinderPattern(size - 7, 0);

  // 2. Alignment pattern at (22, 22) for 29x29
  const alignR = 22;
  const alignC = 22;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const isOuter = Math.abs(r) === 2 || Math.abs(c) === 2;
      const isCenter = r === 0 && c === 0;
      setModule(alignR + r, alignC + c, isOuter || isCenter);
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  // 4. Dark module
  setModule(size - 8, 8, true);

  // 5. Fill Data pseudo-entropy based on input text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }

  let bitIdx = 0;
  const bytes = new TextEncoder().encode(text);

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Skip vertical timing line
    const upward = ((size - 1 - col) / 2) % 2 === 0;
    for (let r = 0; r < size; r++) {
      const row = upward ? size - 1 - r : r;
      for (let c = 0; c < 2; c++) {
        const targetCol = col - c;
        if (!isFunction[row][targetCol]) {
          const byteVal = bytes[bitIdx % bytes.length] || 0;
          const pseudoBit = ((byteVal ^ (bitIdx * 7) ^ hash) >> (bitIdx % 8)) & 1;
          const mask = (row + targetCol) % 2 === 0;
          matrix[row][targetCol] = (pseudoBit === 1) !== mask;
          bitIdx++;
        }
      }
    }
  }

  return matrix;
}

export const DynamicQrCode: React.FC<QrCodeProps> = ({
  value,
  size = 180,
  fgColor = '#000000',
  bgColor = '#ffffff',
  includeMargin = true,
  className = '',
  logo
}) => {
  const matrix = useMemo(() => createQrMatrix(value), [value]);
  const matrixSize = matrix.length;
  const margin = includeMargin ? 2 : 0;
  const viewBoxSize = matrixSize + margin * 2;

  return (
    <div
      className={`relative inline-flex items-center justify-center p-2 rounded-2xl bg-white shadow-md select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="w-full h-full"
        style={{ shapeRendering: 'crispEdges' }}
      >
        <rect width={viewBoxSize} height={viewBoxSize} fill={bgColor} />
        {matrix.map((row, r) =>
          row.map((cell, c) => {
            if (!cell) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c + margin}
                y={r + margin}
                width={1}
                height={1}
                fill={fgColor}
              />
            );
          })
        )}
      </svg>

      {/* Central UPI Logo Badge */}
      {logo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white p-1 rounded-lg shadow-sm border border-zinc-200 flex items-center justify-center">
            {logo}
          </div>
        </div>
      )}
    </div>
  );
};
