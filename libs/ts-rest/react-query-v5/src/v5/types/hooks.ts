import { AppRoute, AppRouteFunction, ClientArgs } from '@ts-rest/core';
import {
  TsRestQueryOptions,
  UseInfiniteQueryOptions,
  UseInfiniteQueryOptionsWithInitialData,
  UseInfiniteQueryOptionsWithoutInitialData,
  UseMutationOptions,
  UseQueriesOptions,
  UseQueryOptions,
  UseQueryOptionsWithInitialData,
  UseQueryOptionsWithoutInitialData,
  UseSuspenseInfiniteQueryOptions,
  UseSuspenseQueriesOptions,
  UseSuspenseQueryOptions,
} from './hooks-options';
import {
  DefinedUseInfiniteQueryResult,
  DefinedUseQueryResult,
  FetchInfiniteQueryOptions,
  FetchQueryOptions,
  InfiniteData,
  QueryKey,
  UseInfiniteQueryResult as TanStackUseInfiniteQueryResult,
  UseMutationResult as TanStackUseMutationResult,
  UseSuspenseQueryResult as TanStackUseSuspenseQueryResult,
} from '@tanstack/react-query';
import { QueriesResults } from './use-queries-options';
import { SuspenseQueriesResults } from './use-suspense-queries-options';
import { DataResponse, ErrorResponse, RequestData } from './common';

export interface QueryHooks<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TQueryFnData = DataResponse<TAppRoute>,
  TError = ErrorResponse<TAppRoute>,
> {
  query: AppRouteFunction<TAppRoute, TClientArgs>;

  useQuery<TData = TQueryFnData>(
    options: UseQueryOptionsWithInitialData<TAppRoute, TClientArgs, TData>,
  ): DefinedUseQueryResult<TData, TError>;

  useQuery<TData = TQueryFnData>(
    options: UseQueryOptionsWithoutInitialData<TAppRoute, TClientArgs, TData>,
  ): TanStackUseSuspenseQueryResult<TData, TError>;

  useQuery<TData = TQueryFnData>(
    options: UseQueryOptions<TAppRoute, TClientArgs, TData>,
  ): TanStackUseSuspenseQueryResult<TData, TError>;

  useSuspenseQuery<TData = TQueryFnData>(
    options: UseSuspenseQueryOptions<TAppRoute, TClientArgs, TData>,
  ): TanStackUseSuspenseQueryResult<TData, TError>;

  useQueries<
    T extends Array<any>,
    TCombinedResult = QueriesResults<TAppRoute, T>,
  >(
    options: UseQueriesOptions<TAppRoute, TClientArgs, T, TCombinedResult>,
  ): TCombinedResult;

  useSuspenseQueries<
    T extends Array<any>,
    TCombinedResult = SuspenseQueriesResults<TAppRoute, T>,
  >(
    options: UseSuspenseQueriesOptions<
      TAppRoute,
      TClientArgs,
      T,
      TCombinedResult
    >,
  ): TCombinedResult;

  useInfiniteQuery<TData = InfiniteData<TQueryFnData>, TPageParam = unknown>(
    options: UseInfiniteQueryOptionsWithInitialData<
      TAppRoute,
      TClientArgs,
      TData,
      TPageParam
    >,
  ): DefinedUseInfiniteQueryResult<TData, TError>;

  useInfiniteQuery<TData = InfiniteData<TQueryFnData>, TPageParam = unknown>(
    options: UseInfiniteQueryOptionsWithoutInitialData<
      TAppRoute,
      TClientArgs,
      TData,
      TPageParam
    >,
  ): TanStackUseInfiniteQueryResult<TData, TError>;

  useInfiniteQuery<TData = InfiniteData<TQueryFnData>, TPageParam = unknown>(
    options: UseInfiniteQueryOptions<TAppRoute, TClientArgs, TData, TPageParam>,
  ): TanStackUseInfiniteQueryResult<TData, TError>;

  useSuspenseInfiniteQuery<
    TData = InfiniteData<TQueryFnData>,
    TPageParam = unknown,
  >(
    options: UseSuspenseInfiniteQueryOptions<
      TAppRoute,
      TClientArgs,
      TData,
      TPageParam
    >,
  ): TanStackUseInfiniteQueryResult<TData, TError>;

  usePrefetchQuery<TData = TQueryFnData>(
    options: FetchQueryOptions<TQueryFnData, TError, TData> &
      TsRestQueryOptions<TAppRoute, TClientArgs>,
  ): void;

  usePrefetchInfiniteQuery<TData = TQueryFnData, TPageParam = unknown>(
    options: FetchInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      QueryKey,
      TPageParam
    > &
      TsRestQueryOptions<TAppRoute, TClientArgs>,
  ): void;
}

export interface MutationHooks<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TData = DataResponse<TAppRoute>,
  TError = ErrorResponse<TAppRoute>,
  TVariables = RequestData<TAppRoute, TClientArgs>,
> {
  mutate: AppRouteFunction<TAppRoute, TClientArgs>;

  useMutation<TContext = unknown>(
    options?: UseMutationOptions<TAppRoute, TClientArgs, TContext>,
  ): TanStackUseMutationResult<TData, TError, TVariables, TContext>;
}
