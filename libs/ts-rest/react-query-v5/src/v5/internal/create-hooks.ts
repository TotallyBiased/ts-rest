import {
  QueryFunctionContext,
  QueryKey,
  useInfiniteQuery,
  useQueries,
  useQuery,
  QueryClient,
  useSuspenseQuery,
  useSuspenseQueries,
  useSuspenseInfiniteQuery,
  useMutation,
  usePrefetchQuery,
  usePrefetchInfiniteQuery,
  QueryOptions,
} from '@tanstack/react-query';
import {
  AppRoute,
  AppRouter,
  ClientArgs,
  evaluateFetchApiArgs,
  fetchApi,
  getRouteQuery,
  isAppRoute,
  isAppRouteQuery,
} from '@ts-rest/core';
import {
  MutationHooks,
  QueryHooks,
  TsRestInfiniteQueryOptions,
  TsRestQueryOptions,
  TsRestQueryClient,
  TsRestReactQueryHooksContainer,
  TsRestReactQueryClient,
  RequestData,
  DataResponse,
  untypedQueryClientMethods,
  UntypedQueryClientMethods,
  TsRestReactQueryClientRecursive,
} from '../types';

const apiFetcher = <TAppRoute extends AppRoute, TClientArgs extends ClientArgs>(
  route: TAppRoute,
  clientArgs: TClientArgs,
  abortSignal?: AbortSignal,
) => {
  return async (requestData?: RequestData<TAppRoute, TClientArgs>) => {
    const fetchApiArgs = evaluateFetchApiArgs(
      route,
      clientArgs,
      requestData as any,
    );
    const result = await fetchApi({
      ...fetchApiArgs,
      fetchOptions: {
        ...(abortSignal && { signal: abortSignal }),
        ...fetchApiArgs.fetchOptions,
      },
    });

    // If the response is not a 2XX, throw an error to be handled by react-query
    if (!String(result.status).startsWith('2')) {
      throw result;
    }

    return result as DataResponse<TAppRoute>;
  };
};

function createBaseQueryOptions<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TOptions extends QueryOptions<any, any>,
>(route: TAppRoute, clientArgs: TClientArgs, options: TOptions): TOptions {
  const { queryData, ...rqOptions } = options as unknown as TOptions &
    (
      | TsRestQueryOptions<TAppRoute, TClientArgs>
      | TsRestInfiniteQueryOptions<TAppRoute, TClientArgs>
    );
  return {
    ...rqOptions,
    queryFn: (context?: QueryFunctionContext<QueryKey, unknown>) => {
      return apiFetcher(
        route,
        clientArgs,
        context?.signal,
      )(typeof queryData === 'function' ? queryData(context!) : queryData);
    },
  } as unknown as TOptions;
}

export const initHooksContainer = <
  TContract extends AppRouter,
  TClientArgs extends ClientArgs,
>(
  contract: TContract,
  clientOptions: TClientArgs,
): TsRestReactQueryHooksContainer<TContract, TClientArgs> => {
  const recursiveInit = <TInner extends AppRouter>(
    innerRouter: TInner,
  ): TsRestReactQueryHooksContainer<TInner, TClientArgs> => {
    return Object.fromEntries(
      Object.entries(innerRouter).map(([key, subRouter]) => {
        if (isAppRoute(subRouter)) {
          if (isAppRouteQuery(subRouter)) {
            return [
              key,
              {
                query: getRouteQuery(subRouter, clientOptions) as any,
                useQuery: (options) => {
                  return useQuery(
                    createBaseQueryOptions(subRouter, clientOptions, options),
                  );
                },
                useSuspenseQuery: (options) => {
                  return useSuspenseQuery(
                    createBaseQueryOptions(subRouter, clientOptions, options),
                  );
                },
                useQueries: (options) => {
                  return useQueries({
                    ...options,
                    queries: options.queries.map((queryOptions) =>
                      createBaseQueryOptions(
                        subRouter,
                        clientOptions,
                        queryOptions as any,
                      ),
                    ),
                  } as any);
                },
                useSuspenseQueries: (options) => {
                  return useSuspenseQueries({
                    ...options,
                    queries: options.queries.map((queryOptions) =>
                      createBaseQueryOptions(
                        subRouter,
                        clientOptions,
                        queryOptions as any,
                      ),
                    ),
                  } as any);
                },
                useInfiniteQuery: (options) => {
                  return useInfiniteQuery(
                    createBaseQueryOptions(subRouter, clientOptions, options),
                  );
                },
                useSuspenseInfiniteQuery: (options) => {
                  return useSuspenseInfiniteQuery(
                    createBaseQueryOptions(subRouter, clientOptions, options),
                  );
                },
                usePrefetchQuery: (options) => {
                  return usePrefetchQuery(
                    createBaseQueryOptions(subRouter, clientOptions, options),
                  );
                },
                usePrefetchInfiniteQuery: (options) => {
                  return usePrefetchInfiniteQuery(
                    createBaseQueryOptions(subRouter, clientOptions, options),
                  );
                },
              } as QueryHooks<typeof subRouter, TClientArgs>,
            ];
          } else {
            return [
              key,
              {
                mutate: getRouteQuery(subRouter, clientOptions) as any,
                useMutation: (options) => {
                  return useMutation({
                    ...options,
                    mutationFn: apiFetcher(subRouter, clientOptions) as any,
                  });
                },
              } as MutationHooks<typeof subRouter, TClientArgs>,
            ];
          }
        } else {
          return [key, recursiveInit(subRouter)];
        }
      }),
    );
  };

  return recursiveInit(contract);
};

export const initQueryClient = <
  TContract extends AppRouter,
  TClientArgs extends ClientArgs,
>(
  contract: TContract,
  clientOptions: TClientArgs,
  queryClient: QueryClient,
): TsRestReactQueryClient<TContract, TClientArgs> => {
  const recursiveInit = <TInner extends AppRouter>(
    innerRouter: TInner,
  ): TsRestReactQueryClientRecursive<TInner, TClientArgs> => {
    return Object.fromEntries(
      Object.entries(innerRouter).map(([key, subRouter]) => {
        if (isAppRoute(subRouter)) {
          if (isAppRouteQuery(subRouter)) {
            return [
              key,
              {
                getQueryData: (queryKey) => {
                  return queryClient.getQueryData(queryKey);
                },
                ensureQueryData: (options) => {
                  return queryClient.ensureQueryData(
                    createBaseQueryOptions(subRouter, clientOptions, options),
                  );
                },
                getQueriesData: (filters) => {
                  return queryClient.getQueriesData(filters);
                },
                setQueryData: (queryKey, updater, options) => {
                  return queryClient.setQueryData(queryKey, updater, options);
                },
                setQueriesData: (filters, updater, options) => {
                  return queryClient.setQueriesData(filters, updater, options);
                },
                getQueryState: (queryKey) => {
                  return queryClient.getQueryState(queryKey);
                },
                fetchQuery: (options) => {
                  return queryClient.fetchQuery(
                    createBaseQueryOptions(subRouter, clientOptions, options),
                  );
                },
                prefetchQuery: (options) => {
                  return queryClient.prefetchQuery(
                    createBaseQueryOptions(subRouter, clientOptions, options),
                  );
                },
                fetchInfiniteQuery: (options) => {
                  return queryClient.fetchInfiniteQuery(
                    createBaseQueryOptions(subRouter, clientOptions, options),
                  );
                },
                prefetchInfiniteQuery: (options) => {
                  return queryClient.prefetchInfiniteQuery(
                    createBaseQueryOptions(subRouter, clientOptions, options),
                  );
                },
              } as TsRestQueryClient<typeof subRouter, TClientArgs>,
            ];
          } else {
            return [key, undefined];
          }
        } else {
          return [key, recursiveInit(subRouter)];
        }
      }),
    );
  };

  return {
    ...recursiveInit(contract),
    ...untypedQueryClientMethods.reduce(
      (acc, method) => {
        acc[method] = queryClient[method].bind(queryClient) as any;
        return acc;
      },
      {} as Pick<QueryClient, UntypedQueryClientMethods>,
    ),
  };
};
