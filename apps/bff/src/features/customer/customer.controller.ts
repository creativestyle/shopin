import {
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseInterceptors,
} from '@nestjs/common'
import type { Request } from 'express'
import {
  ApiTags,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { SecureRateLimit } from '../../common/throttler/secure-rate-limit.decorator'
import { CustomerService } from './customer.service'
import {
  ChangeCustomerPasswordRequest,
  ChangeCustomerPasswordRequestSchema,
  CustomerResponse,
  CustomerResponseSchema,
  UpdateCustomerRequest,
  UpdateCustomerRequestSchema,
} from '@core/contracts/customer/customer'
import { TokenRefreshInterceptor } from '../../common/token-management/token-refresh.interceptor'
import { TokenProvider } from '../../common/token-management/token-provider'
import { ZodBody } from '../../common/validation/decorators/zod-body.decorator'
import { UseCsrfGuard } from '../csrf/csrf.decorator'
import { TokenStorageService } from '../../common/token-management/token-storage.service'
import { CartIdService } from '../cart-id/cart-id.service'
import {
  AddAddressRequest,
  AddAddressRequestSchema,
  AddressesResponse,
  AddressesResponseSchema,
  AddressResponse,
  AddressResponseSchema,
  UpdateAddressRequest,
  UpdateAddressRequestSchema,
} from '@core/contracts/customer/address'
import {
  AuthLoggerService,
  authLogContextFromRequest,
} from '../../common/auth-logging'

@Controller('customer')
@ApiTags('customer')
@UseInterceptors(TokenRefreshInterceptor)
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly tokenProvider: TokenProvider,
    private readonly tokenStorageService: TokenStorageService,
    private readonly cartIdService: CartIdService,
    private readonly authLogger: AuthLoggerService
  ) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOkResponse({
    description: 'Current customer data',
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
  })
  async getCurrentCustomer(): Promise<CustomerResponse | null> {
    // Check if user is logged in using auth status
    // getAuthStatus returns true if authenticated, false if guest, undefined if not set
    const authStatus = await this.tokenProvider.getAuthStatus()

    if (authStatus !== true) {
      // User is not logged in (guest or no auth status)
      // Return null without calling the customer service
      return null
    }

    const customer = await this.customerService.getCurrentCustomer()
    return CustomerResponseSchema.strip().parse(customer)
  }

  @Put('me')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOkResponse({
    description: 'Updated customer data',
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
  })
  async updateCustomer(
    @ZodBody(UpdateCustomerRequestSchema)
    updateCustomerRequest: UpdateCustomerRequest
  ): Promise<CustomerResponse> {
    return CustomerResponseSchema.strip().parse(
      await this.customerService.updateCustomer(updateCustomerRequest)
    )
  }

  @Put('me/password')
  @SecureRateLimit()
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOkResponse({
    description: 'Password changed successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
  })
  async changeCustomerPassword(
    @Req() req: Request,
    @ZodBody(ChangeCustomerPasswordRequestSchema)
    changeCustomerPasswordRequest: ChangeCustomerPasswordRequest
  ): Promise<void> {
    try {
      await this.customerService.changeCustomerPassword(
        changeCustomerPasswordRequest
      )
      this.tokenStorageService.clearTokens()
      this.cartIdService.deleteAllCartIds()
      this.authLogger.log({
        action: 'password_change',
        outcome: 'success',
        ...authLogContextFromRequest(req),
      })
    } catch (err) {
      this.authLogger.log({
        action: 'password_change',
        outcome: 'failure',
        reason: 'invalid_credentials',
        ...authLogContextFromRequest(req),
      })
      throw err
    }
  }

  @Get('me/addresses')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOkResponse({
    description: 'Customer addresses',
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
  })
  async getAddresses(): Promise<AddressesResponse> {
    return AddressesResponseSchema.strip().parse(
      await this.customerService.getAddresses()
    )
  }

  @Post('me/addresses')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOkResponse({
    description: 'Address added successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
  })
  async addAddress(
    @ZodBody(AddAddressRequestSchema) addAddressRequest: AddAddressRequest
  ): Promise<AddressResponse> {
    return AddressResponseSchema.strip().parse(
      await this.customerService.addAddress(addAddressRequest)
    )
  }

  @Put('me/addresses/:addressId')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOkResponse({
    description: 'Address updated successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
  })
  async updateAddress(
    @ZodBody(UpdateAddressRequestSchema)
    updateAddressRequest: UpdateAddressRequest
  ): Promise<AddressResponse> {
    return AddressResponseSchema.strip().parse(
      await this.customerService.updateAddress(updateAddressRequest)
    )
  }

  @Delete('me/addresses/:addressId')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOkResponse({
    description: 'Address deleted successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
  })
  async deleteAddress(@Param('addressId') addressId: string): Promise<void> {
    await this.customerService.deleteAddress(addressId)
  }

  @Put('me/addresses/:addressId/shipping')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOkResponse({
    description: 'Shipping address set successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
  })
  async setDefaultShippingAddress(
    @Param('addressId') addressId: string
  ): Promise<{ success: true }> {
    await this.customerService.setDefaultShippingAddress(addressId)
    return { success: true }
  }

  @Put('me/addresses/:addressId/billing')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOkResponse({
    description: 'Billing address set successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
  })
  async setDefaultBillingAddress(
    @Param('addressId') addressId: string
  ): Promise<{ success: true }> {
    await this.customerService.setDefaultBillingAddress(addressId)
    return { success: true }
  }
}
