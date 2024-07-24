import { QueryClient } from '@tanstack/query-core';
import { cache } from 'react';

export const getQueryClientRsc = cache(() => new QueryClient());
