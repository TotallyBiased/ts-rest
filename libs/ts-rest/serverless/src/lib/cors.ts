import { TsRestRequest } from './request';
import { TsRestResponse } from './response';

type OriginType = string | RegExp;

export interface CorsConfig {
  origins?: OriginType[] | '*';
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const isAllowedOrigin = (origin: string, origins: OriginType[]) => {
  return origins.some((allowedOrigin) => {
    if (allowedOrigin instanceof RegExp) {
      return allowedOrigin.test(origin);
    }
    return allowedOrigin === origin;
  });
};

const createCorsHeaders = (
  req: TsRestRequest,
  {
    origins = '*',
    methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders,
    exposedHeaders,
    credentials,
    maxAge,
  }: CorsConfig,
  corsHeaders: {
    origin?: boolean;
    methods?: boolean;
    allowedHeaders?: boolean;
    exposedHeaders?: boolean;
    credentials?: boolean;
    maxAge?: boolean;
  }
) => {
  const headers = {} as Record<string, string | string[]>;

  if (corsHeaders.credentials && credentials === true) {
    headers['access-control-allow-credentials'] = 'true';
  }

  if (corsHeaders.allowedHeaders) {
    let allowedHeadersValue = allowedHeaders?.join(',');
    if (allowedHeadersValue === undefined) {
      allowedHeadersValue =
        req.headers.get('access-control-request-headers') ?? undefined;

      if (headers['vary'] && Array.isArray(headers['vary'])) {
        headers['vary'].push('access-control-request-headers');
      } else {
        headers['vary'] = ['access-control-request-headers'];
      }
    }

    if (allowedHeadersValue?.length) {
      headers['access-control-allow-headers'] = allowedHeadersValue;
    }
  }

  if (corsHeaders.methods) {
    headers['access-control-allow-methods'] = methods.join(',');
  }

  if (corsHeaders.origin) {
    if (origins === '*') {
      headers['access-control-allow-origin'] = '*';
    } else {
      const origin = req.headers.get('origin') ?? '';

      if (isAllowedOrigin(origin, origins)) {
        headers['access-control-allow-origin'] = origin;
      }

      if (headers['vary'] && Array.isArray(headers['vary'])) {
        headers['vary'].push('origin');
      } else {
        headers['vary'] = ['origin'];
      }
    }
  }

  if (corsHeaders.exposedHeaders && exposedHeaders?.length) {
    headers['access-control-expose-headers'] = exposedHeaders.join(',');
  }

  if (corsHeaders.maxAge && maxAge) {
    headers['access-control-max-age'] = maxAge.toString();
  }

  return headers;
};

export const createCors = (corsConfig: CorsConfig) => {
  const preflight = (req: TsRestRequest) => {
    if (req.method === 'OPTIONS') {
      const headers = createCorsHeaders(req, corsConfig, {
        origin: true,
        methods: true,
        allowedHeaders: true,
        exposedHeaders: true,
        credentials: true,
        maxAge: true,
      });

      return new TsRestResponse({
        statusCode: 200,
        body: null,
        headers,
      });
    }

    return;
  };

  const corsify = (request: TsRestRequest, response: TsRestResponse) => {
    const headers = createCorsHeaders(request, corsConfig, {
      origin: true,
      credentials: true,
      exposedHeaders: true,
    });

    response.headers = {
      ...response.headers,
      ...headers,
    };

    return response;
  };

  return { preflight, corsify };
};
