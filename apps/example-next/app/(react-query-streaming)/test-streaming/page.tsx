import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { tsr } from '../../react-query-utils/tsr';
import { ClientComponentSuspense } from './client-component-suspense';
import { getQueryClient } from '../../react-query-utils/get-query-client';

export const dynamic = 'force-dynamic';

export default function Test() {
  const queryClient = getQueryClient(true);
  const tsrQueryClient = tsr.initRscQueryClient(queryClient);

  // no await here, so this will stream
  tsrQueryClient.test.prefetchQuery({
    queryKey: ['TEST_SUSPENSE'],
    queryData: {
      params: { id: 1 },
      query: { foo: 'test', bar: 123 },
    },
  });

  return (
    <main>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <h1>Streaming Test</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <ClientComponentSuspense />
        </Suspense>
      </HydrationBoundary>
    </main>
  );
}
