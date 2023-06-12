import { initContract } from '@ts-rest/core';
import type { APIGatewayProxyEvent, APIGatewayProxyEventV2 } from 'aws-lambda';
import { parse as parseMultipart, getBoundary } from 'parse-multipart-data';
import merge from 'ts-deepmerge';
import { PartialDeep } from 'type-fest';
import { createLambdaHandler } from './ts-rest-lambda';
import { z } from 'zod';
import * as apiGatewayEventV1 from './mappers/aws/test-data/api-gateway-event-v1.json';
import * as apiGatewayEventV2 from './mappers/aws/test-data/api-gateway-event-v2.json';

const c = initContract();

const contract = c.router({
  test: {
    method: 'GET',
    path: '/test',
    query: z.object({
      foo: z.string(),
    }),
    responses: {
      200: z.object({
        foo: z.string(),
      }),
    },
  },
  ping: {
    method: 'POST',
    path: '/ping/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    body: z.object({
      ping: z.string(),
    }),
    responses: {
      200: z.object({
        id: z.string(),
        pong: z.string(),
      }),
    },
  },
  returnsTheWrongData: {
    method: 'GET',
    path: '/wrong',
    responses: {
      200: z.object({
        foo: z.string(),
      }),
    },
  },
  styles: {
    method: 'GET',
    path: '/styles.css',
    responses: {
      200: c.otherResponse({
        contentType: 'text/css',
        body: z.string(),
      }),
    },
  },
  image: {
    method: 'GET',
    path: '/image',
    query: z.object({
      type: z.union([z.literal('gif'), z.literal('jpeg')]),
    }),
    responses: {
      200: c.otherResponse({
        contentType: 'image/jpeg',
        body: c.type<Blob>(),
      }),
    },
  },
  upload: {
    method: 'POST',
    path: '/upload',
    contentType: 'multipart/form-data',
    body: c.type<{ file: File }>(),
    responses: {
      200: c.otherResponse({
        contentType: 'application/octet-stream',
        body: c.type<Blob | string>(),
      }),
    },
  },
});

const createV1LambdaRequest = (request: PartialDeep<APIGatewayProxyEvent>) => {
  return merge(apiGatewayEventV1, request);
};

const createV2LambdaRequest = (
  request: PartialDeep<APIGatewayProxyEventV2>
) => {
  return merge(apiGatewayEventV2, request);
};

describe('tsRestLambda', () => {
  const lambdaHandler = createLambdaHandler(
    contract,
    {
      test: async ({ query: { foo } }) => {
        return {
          status: 200,
          body: {
            foo,
          },
        };
      },
      ping: async ({ body, params }) => {
        return {
          status: 200,
          body: {
            id: params.id,
            pong: body.ping,
          },
        };
      },
      returnsTheWrongData: async () => {
        return {
          status: 200,
          body: {
            foo: 'bar',
            bar: 'foo', // this is extra
          },
        };
      },
      styles: async () => {
        return {
          status: 200,
          body: 'body { color: red; }',
          headers: {
            'cache-control': 'max-age=31536000',
          },
        };
      },
      image: async ({ query: { type } }) => {
        return {
          status: 200,
          body:
            type === 'jpeg'
              ? new Blob([new Uint8Array([0, 1, 2, 3])])
              : new Blob([new Uint8Array([4, 5, 6, 7])], { type: 'image/gif' }),
        };
      },
      upload: async ({ request, headers }) => {
        const boundary = getBoundary(headers.get('content-type') as string);

        const bodyBuffer = await request.arrayBuffer();
        const parts = parseMultipart(Buffer.from(bodyBuffer), boundary);
        const blob = new Blob([parts[0].data], { type: parts[0].type });

        return {
          status: 200,
          body: blob,
        };
      },
    },
    {
      responseValidation: true,
      cors: {
        origins: ['http://localhost'],
        credentials: true,
      },
    }
  );

  it('v1 should handle GET with query', async () => {
    const event = createV1LambdaRequest({
      httpMethod: 'GET',
      path: '/test',
      queryStringParameters: {
        foo: 'bar',
      },
    });

    const response = await lambdaHandler(event as any, {} as any);
    expect(response).toEqual({
      statusCode: 200,
      headers: {
        'access-control-allow-credentials': 'true',
        'access-control-allow-origin': 'http://localhost',
        'content-type': 'application/json',
        vary: 'origin',
      },
      multiValueHeaders: {
        vary: ['origin'],
      },
      body: '{"foo":"bar"}',
      isBase64Encoded: false,
    });
  });

  it('v2 should handle GET with query', async () => {
    const event = createV2LambdaRequest({
      requestContext: {
        http: {
          method: 'GET',
        },
      },
      rawPath: '/test',
      rawQueryString: 'foo=bar',
    });

    const response = await lambdaHandler(event as any, {} as any);
    expect(response).toEqual({
      statusCode: 200,
      headers: {
        'access-control-allow-credentials': 'true',
        'access-control-allow-origin': 'http://localhost',
        'content-type': 'application/json',
        vary: 'origin',
      },
      body: '{"foo":"bar"}',
      isBase64Encoded: false,
    });
  });

  it('v1 should handle POST', async () => {
    const event = createV1LambdaRequest({
      httpMethod: 'POST',
      path: '/ping/222',
      body: '{"ping":"foo"}',
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await lambdaHandler(event as any, {} as any);
    expect(response).toEqual({
      statusCode: 200,
      headers: {
        'access-control-allow-credentials': 'true',
        'access-control-allow-origin': 'http://localhost',
        'content-type': 'application/json',
        vary: 'origin',
      },
      multiValueHeaders: {
        vary: ['origin'],
      },
      body: '{"id":"222","pong":"foo"}',
      isBase64Encoded: false,
    });
  });

  it('v2 should handle POST', async () => {
    const event = createV2LambdaRequest({
      requestContext: {
        http: {
          method: 'POST',
        },
      },
      rawPath: '/ping/123',
      body: '{"ping":"foo"}',
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await lambdaHandler(event as any, {} as any);
    expect(response).toEqual({
      statusCode: 200,
      headers: {
        'access-control-allow-credentials': 'true',
        'access-control-allow-origin': 'http://localhost',
        'content-type': 'application/json',
        vary: 'origin',
      },
      body: '{"id":"123","pong":"foo"}',
      isBase64Encoded: false,
    });
  });

  it('should handle OPTIONS request', async () => {
    const event = createV2LambdaRequest({
      requestContext: {
        http: {
          method: 'OPTIONS',
        },
      },
      rawPath: '/test',
    });

    const response = await lambdaHandler(event as any, {} as any);
    expect(response).toEqual({
      statusCode: 200,
      headers: {
        'access-control-allow-credentials': 'true',
        'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE',
        'access-control-allow-origin': 'http://localhost',
        vary: 'access-control-request-headers, origin',
      },
      body: '',
      isBase64Encoded: true,
    });
  });

  it('should handle OPTIONS request with mismatching origin', async () => {
    const event = createV2LambdaRequest({
      requestContext: {
        http: {
          method: 'OPTIONS',
        },
      },
      rawPath: '/test',
      headers: {
        origin: 'https://example.com',
      },
    });

    const response = await lambdaHandler(event as any, {} as any);
    expect(response).toEqual({
      statusCode: 200,
      headers: {
        'access-control-allow-credentials': 'true',
        'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE',
        vary: 'access-control-request-headers, origin',
      },
      body: '',
      isBase64Encoded: true,
    });
  });

  it('options.responseValidation true should remove extra properties', async () => {
    const event = createV2LambdaRequest({
      requestContext: {
        http: {
          method: 'GET',
        },
      },
      rawPath: '/wrong',
    });

    const response = await lambdaHandler(event as any, {} as any);
    expect(response).toEqual({
      statusCode: 200,
      headers: {
        'access-control-allow-credentials': 'true',
        'access-control-allow-origin': 'http://localhost',
        'content-type': 'application/json',
        vary: 'origin',
      },
      body: '{"foo":"bar"}',
      isBase64Encoded: false,
    });
  });

  it('should handle non-json response', async () => {
    const event = createV2LambdaRequest({
      requestContext: {
        http: {
          method: 'GET',
        },
      },
      rawPath: '/styles.css',
    });

    const response = await lambdaHandler(event as any, {} as any);
    expect(response).toEqual({
      statusCode: 200,
      headers: {
        'access-control-allow-credentials': 'true',
        'access-control-allow-origin': 'http://localhost',
        'cache-control': 'max-age=31536000',
        'content-type': 'text/css',
        vary: 'origin',
      },
      body: 'body { color: red; }',
      isBase64Encoded: false,
    });
  });

  it('should handle jpeg file downloads', async () => {
    const event = createV2LambdaRequest({
      requestContext: {
        http: {
          method: 'GET',
        },
      },
      rawPath: '/image',
      rawQueryString: 'type=jpeg',
    });

    const response = await lambdaHandler(event as any, {} as any);
    expect(response).toEqual({
      statusCode: 200,
      headers: {
        'access-control-allow-credentials': 'true',
        'access-control-allow-origin': 'http://localhost',
        'content-type': 'image/jpeg',
        vary: 'origin',
      },
      body: 'AAECAw==',
      isBase64Encoded: true,
    });
  });

  it('should handle gif file downloads', async () => {
    const event = createV2LambdaRequest({
      requestContext: {
        http: {
          method: 'GET',
        },
      },
      rawPath: '/image',
      rawQueryString: 'type=gif',
    });

    const response = await lambdaHandler(event as any, {} as any);
    expect(response).toEqual({
      statusCode: 200,
      headers: {
        'access-control-allow-credentials': 'true',
        'access-control-allow-origin': 'http://localhost',
        'content-type': 'image/gif',
        vary: 'origin',
      },
      body: 'BAUGBw==',
      isBase64Encoded: true,
    });
  });

  it('should handle file uploads', async () => {
    const event = createV2LambdaRequest({
      requestContext: {
        http: {
          method: 'POST',
        },
      },
      rawPath: '/upload',
      body: Buffer.from(
        '-----WebKitFormBoundary7MA4YWxkTrZu0gW\r\n' +
          'Content-Disposition: form-data; name="file"; filename="a.html"\r\n' +
          'Content-Type: text/html\r\n' +
          '\r\n' +
          '<html><body><h1>Hello ts-rest!</h1></body></html>\r\n' +
          '-----WebKitFormBoundary7MA4YWxkTrZu0gW--'
      ).toString('base64'),
      headers: {
        'content-type':
          'multipart/form-data; boundary=---WebKitFormBoundary7MA4YWxkTrZu0gW',
      },
      isBase64Encoded: true,
    });

    const response = await lambdaHandler(event as any, {} as any);
    expect(response).toEqual({
      statusCode: 200,
      headers: {
        'access-control-allow-credentials': 'true',
        'access-control-allow-origin': 'http://localhost',
        'content-type': 'text/html',
        vary: 'origin',
      },
      body: '<html><body><h1>Hello ts-rest!</h1></body></html>',
      isBase64Encoded: false,
    });
  });

  it('should handle non-existent route', async () => {
    const event = createV2LambdaRequest({
      requestContext: {
        http: {
          method: 'GET',
        },
      },
      rawPath: '/foo',
    });

    const response = await lambdaHandler(event as any, {} as any);
    expect(response).toEqual({
      statusCode: 404,
      headers: {
        'content-type': 'application/json',
      },
      body: '{"message":"Not found"}',
      isBase64Encoded: false,
    });
  });
});
