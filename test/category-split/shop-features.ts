/**
 * Fixture shop features for the scenarios: BFF feature modules in the shape a shop writes them (docs/extending.md),
 * independent of the demo (a shop that deletes the demo keeps these tests).
 *
 * - `LoyaltyModule`: a module that only imports others, the way a larger shop groups its features: its write route
 *   (`POST /bff/loyalty/enrol`) sits in an imported module, one more in a dynamic module, and a route reading a
 *   kind the config does not serve in `UnservedModule`.
 */
import {
  BadRequestException,
  Controller,
  Get,
  Injectable,
  Module,
  Post,
  Query,
} from "@nestjs/common";
import { Reads, ServingPorts } from "@core/integration-kit";

@Reads()
@Controller("loyalty")
export class LoyaltyWriteController {
  @Post("enrol")
  enrol() {
    return { enrolled: true };
  }
}

@Module({ controllers: [LoyaltyWriteController] })
class LoyaltyWritesModule {}

@Reads()
@Controller("loyalty-points")
export class LoyaltyPointsController {
  @Post()
  add() {
    return { added: true };
  }
}

class LoyaltyPointsModule {}

@Module({
  imports: [
    LoyaltyWritesModule,
    { module: LoyaltyPointsModule, controllers: [LoyaltyPointsController] },
  ],
})
export class LoyaltyModule {}

@Reads("nothingServed")
@Controller("unserved")
export class UnservedController {
  @Get()
  get() {
    return {};
  }
}

@Module({ controllers: [UnservedController] })
class UnservedInnerModule {}

@Module({ imports: [UnservedInnerModule] })
export class UnservedModule {}
