import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { Logger } from 'nestjs-pino'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { HttpErrorFilter } from './common/filters/http-exception.filter'
import { DEFAULT_CORS_METHODS, DEFAULT_CORS_HEADERS } from '@config/constants'
import cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useLogger(app.get(Logger))
  app.useGlobalFilters(new HttpErrorFilter())

  // Enable cookie parser middleware - required to parse cookies from requests
  app.use(cookieParser())

  const corsOrigin = process.env.FRONTEND_URL

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: DEFAULT_CORS_METHODS,
    allowedHeaders: DEFAULT_CORS_HEADERS,
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
  await app.listen(4000)
}
bootstrap()
