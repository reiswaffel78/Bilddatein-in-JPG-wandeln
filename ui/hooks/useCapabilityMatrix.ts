'use client';

import { useEffect, useState } from 'react';
import type { Capability } from '../../domain/types';
import { buildCapabilityMatrix } from '../../domain/matrix';

export function useCapabilityMatrix(): { matrix: Capability[] | null; loading: boolean } {
  const [matrix, setMatrix] = useState<Capability[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    buildCapabilityMatrix().then((result) => {
      if (!cancelled) setMatrix(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { matrix, loading: matrix === null };
}
