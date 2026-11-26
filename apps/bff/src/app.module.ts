import {
  Module,
  MiddlewareConsumer,
  NestModule,
  type Type,
} from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { LoggerModule } from 'nestjs-pino'
import { ProductModule } from './features/product/product.module'
import { ProductCollectionModule } from './features/product-collection/product-collection.module'
import { ProductSearchModule } from './features/product-search/product-search.module'
import { NavigationModule } from './features/navigation/navigation.module'
import {
  mountable,
  PortsModule,
  shopFeatures,
} from './data-source/ports.module'
import { requestStoreMiddleware } from './common/request-store/request-store'
import { I18nModule } from './features/i18n/i18n.module'
import { LanguageModule } from './common/language/language.module'
import { LanguageHeaderMiddleware } from './common/language/language-header.middleware'
import { AuthModule } from './features/auth/auth.module'
import { CustomerModule } from './features/customer/customer.module'
import { CsrfModule } from './features/csrf/csrf.module'
import { CartModule } from './features/cart/cart.module'
import { PaymentModule } from './features/payment/payment.module'
import { OrderModule } from './features/order/order.module'
import { StorageModule } from './common/storage/storage.module'
import { VaultModule } from './common/vault/vault.module'
import { SessionModule } from './common/session/session.module'
import { SessionCheckMiddleware } from './common/session/session-check.middleware'
import { revocations } from './common/session/session.service'
import { TokenManagementModule } from './common/token-management/token-management.module'
import { StoreConfigModule } from './features/store-config/store-config.module'
import { WishlistModule } from './features/wishlist/wishlist.module'
import { createThrottlerOptions } from './common/throttler/throttler.config'
import { OptionalThrottlerGuard } from './common/throttler/throttler'
import { createLoggerConfig } from './common'
import { AuthLoggingModule } from './common/auth-logging'
import { ContentModule } from './features/content/content.module'
import { CapabilitiesModule } from './features/capabilities/capabilities.module'
import { bootable, loadEnvFile } from './common/env/env-file'
import { configModule } from './common/env/config-module'

// before any port module is required: core secrets into a core-only map, every port variable out of
// process.env (handed to its port as PortOptions)
loadEnvFile()
// the ports read their variables; every problem of the core's and the integrations' variables stops the boot at once
const ports = bootable(() => PortsModule.forRoot())
revocations.load()

/** Mounted only when the categories their controllers read (`@Reads`) are served. */
const FEATURES: Type[] = [
  ProductModule,
  ProductCollectionModule,
  ProductSearchModule,
  NavigationModule,
  I18nModule,
  CsrfModule,
  AuthModule,
  CustomerModule,
  CartModule,
  PaymentModule,
  OrderModule,
  StoreConfigModule,
  WishlistModule,
  ContentModule,
  CapabilitiesModule,
]

@Module({
  imports: [
    configModule(),
    // the chosen ports of the configured integrations; the BFF never names one
    ports,
    LoggerModule.forRoot(createLoggerConfig()),
    AuthLoggingModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createThrottlerOptions,
    }),
    StorageModule,
    VaultModule,
    SessionModule,
    LanguageModule,
    TokenManagementModule,
    // SHOPin's features, then the shop's own (shopin.config.ts `features`)
    ...mountable([...FEATURES, ...shopFeatures()]),
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: OptionalThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        requestStoreMiddleware,
        LanguageHeaderMiddleware,
        SessionCheckMiddleware
      )
      .forRoutes('*')
  }
}
