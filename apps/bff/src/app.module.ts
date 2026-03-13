import { join } from 'path'
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { LoggerModule } from 'nestjs-pino'
import { ProductModule } from './features/product/product.module'
import { ProductCollectionModule } from './features/product-collection/product-collection.module'
import { NavigationModule } from './features/navigation/navigation.module'
import { DataSourceModule } from './data-source/data-source.module'
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
import { TokenManagementModule } from './common/token-management/token-management.module'
import { StoreConfigModule } from './features/store-config/store-config.module'
import { WishlistModule } from './features/wishlist/wishlist.module'
import { createThrottlerOptions } from './common/throttler/throttler.config'
import { OptionalThrottlerGuard } from './common/throttler/throttler'
import { createLoggerConfig } from './common'
import { AuthLoggingModule } from './common/auth-logging'
import { ContentModule } from './features/content/content.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '../../../.env'),
    }),
    LoggerModule.forRoot(createLoggerConfig()),
    AuthLoggingModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createThrottlerOptions,
    }),
    StorageModule,
    DataSourceModule,
    ProductModule,
    ProductCollectionModule,
    NavigationModule,
    I18nModule,
    LanguageModule,
    CsrfModule,
    TokenManagementModule,
    AuthModule,
    CustomerModule,
    CartModule,
    PaymentModule,
    OrderModule,
    StoreConfigModule,
    WishlistModule,
    ContentModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: OptionalThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LanguageHeaderMiddleware).forRoutes('*')
  }
}
