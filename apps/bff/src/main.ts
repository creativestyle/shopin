import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Logger } from 'nestjs-pino'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { HttpErrorFilter } from './common/filters/http-exception.filter'
import {
  CORRELATION_ID_HEADER,
  DEFAULT_CORS_METHODS,
  DEFAULT_CORS_HEADERS,
} from '@config/constants'
import cookieParser from 'cookie-parser'
import { trustProxy } from './common/throttler/trust-proxy'
import { plainBootError } from './common/env/env-file'

/** True until Nest has built every module and port: an error then is a boot problem (main's catch). */
let building = true

async function bootstrap() {
  // loaded here, not imported above: a configuration problem while it loads is reported plainly (below)
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { AppModule } = require('./app.module') as typeof import('./app.module')
  const { variantHeaders } =
    require('./data-source/providers') as typeof import('./data-source/providers')
  /* eslint-enable @typescript-eslint/no-require-imports */
  // a failing boot throws to the catch below; Nest's own log of it stays in the buffer (no stack for a config
  // problem), the buffer reaches the logger once the BFF runs
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: false,
    bufferLogs: true,
    autoFlushLogs: false,
  })
  building = false
  // behind a proxy: the client's address for the rate limiter (BFF_TRUST_PROXY, off by default)
  const trust = trustProxy()
  if (trust !== undefined) {
    app.set('trust proxy', trust)
  }

  app.useLogger(app.get(Logger))
  app.flushLogs()
  app.useGlobalFilters(new HttpErrorFilter())

  // Enable cookie parser middleware - required to parse cookies from requests
  app.use(cookieParser())

  const corsOrigin = process.env.FRONTEND_URL

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: [...DEFAULT_CORS_METHODS],
    // the storefront variants' headers (none unless an integration declares variants)
    allowedHeaders: [...DEFAULT_CORS_HEADERS, ...variantHeaders()],
    exposedHeaders: [CORRELATION_ID_HEADER],
  })
  const config = new DocumentBuilder()
    .setTitle('Shopin BFF')
    .setDescription('The API description')
    .setVersion('1.0')
    .addTag('bff')
    .build()
  app.setGlobalPrefix('bff')
  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, documentFactory)
  await app.listen(process.env.PORT ?? 4000)
}
bootstrap().catch((error: unknown) => {
  const plain = plainBootError(error, building)
  if (plain === undefined) {
    throw error
  }
  console.error(plain)
  process.exit(1)
})
