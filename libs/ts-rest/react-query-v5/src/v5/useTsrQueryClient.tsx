'use client';

import { createContext } from 'react';
import * as React from 'react';
import { AppRouter, ClientArgs } from '@ts-rest/core';
import type { TsRestReactQueryClient } from './types';

export const TsrQueryClientContext = createContext<
  TsRestReactQueryClient<any, any> | undefined
>(undefined);

export const useTsrQueryClient = <
  TContract extends AppRouter,
  TClientArgs extends ClientArgs,
>() => {
  const tsrQueryClient = React.useContext<
    TsRestReactQueryClient<TContract, TClientArgs> | undefined
  >(TsrQueryClientContext);

  if (!tsrQueryClient) {
    throw new Error(
      'No tsrQueryClient created. Use TsRestReactQueryProvider to create one.',
    );
  }

  return tsrQueryClient;
};
