import {
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpException,
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
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger'
import { SecureRateLimit } from '../../common/throttler/secure-rate-limit.decorator'
import { CustomerService } from './customer.service'
import {
  ChangeCustomerEmailRequest,
  ChangeCustomerEmailRequestSchema,
  ChangeCustomerEmailResponse,
  ChangeCustomerEmailResponseSchema,
  ChangeCustomerPasswordRequest,
  ChangeCustomerPasswordRequestSchema,
  CustomerResponse,
  CustomerResponseSchema,
  UpdateCustomerRequest,
  UpdateCustomerRequestSchema,
  EMAIL_IN_USE_CODE,
  EMAIL_UNCHANGED_CODE,
  INVALID_CURRENT_PASSWORD_CODE,
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
  type AuthFailureReason,
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
  @ApiBadRequestResponse({
    description: `Invalid request body, or wrong current password (code: ${INVALID_CURRENT_PASSWORD_CODE})`,
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
        reason: isInvalidCurrentPasswordException(err)
          ? 'invalid_credentials'
          : 'error',
        ...authLogContextFromRequest(req),
      })
      throw err
    }
  }

  @Put('me/email')
  @SecureRateLimit()
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOkResponse({
    description:
      'Email changed; the new address must be verified before the next sign-in',
  })
  @ApiBadRequestResponse({
    description: `Invalid request body, wrong current password (code: ${INVALID_CURRENT_PASSWORD_CODE}), or email unchanged (code: ${EMAIL_UNCHANGED_CODE})`,
  })
  @ApiConflictResponse({
    description: `Email already in use (code: ${EMAIL_IN_USE_CODE})`,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
  })
  async changeCustomerEmail(
    @Req() req: Request,
    @ZodBody(ChangeCustomerEmailRequestSchema)
    changeCustomerEmailRequest: ChangeCustomerEmailRequest
  ): Promise<ChangeCustomerEmailResponse> {
    try {
      const result = await this.customerService.changeCustomerEmail(
        changeCustomerEmailRequest
      )
      this.authLogger.log({
        action: 'email_change',
        outcome: 'success',
        userId: result.customer.id,
        ...authLogContextFromRequest(req),
      })
      return ChangeCustomerEmailResponseSchema.strip().parse(result)
    } catch (err) {
      this.authLogger.log({
        action: 'email_change',
        outcome: 'failure',
        reason: getEmailChangeFailureReason(err),
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

function isInvalidCurrentPasswordException(err: unknown): boolean {
  return hasErrorCode(err, INVALID_CURRENT_PASSWORD_CODE)
}

function getEmailChangeFailureReason(err: unknown): AuthFailureReason {
  if (hasErrorCode(err, INVALID_CURRENT_PASSWORD_CODE)) {
    return 'invalid_credentials'
  }
  if (hasErrorCode(err, EMAIL_IN_USE_CODE)) {
    return 'user_exists'
  }
  if (hasErrorCode(err, EMAIL_UNCHANGED_CODE)) {
    return 'validation_failed'
  }
  return 'error'
}

function hasErrorCode(err: unknown, code: string): boolean {
  return (
    err instanceof HttpException &&
    (err.getResponse() as { code?: unknown })?.code === code
  )
}
