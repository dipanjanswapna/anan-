import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { CreateCustomerAddressDto } from "./dto/create-customer-address.dto";
import { UpdateCustomerAddressDto } from "./dto/update-customer-address.dto";
import { UpdateCustomerProfileDto } from "./dto/update-customer-profile.dto";
import { CustomersService } from "./customers.service";

@Controller("customers/me")
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  profile(@Headers("authorization") authorization?: string) {
    return this.customers.profile(authorization);
  }

  @Patch()
  updateProfile(
    @Headers("authorization") authorization: string | undefined,
    @Body() input: UpdateCustomerProfileDto,
  ) {
    return this.customers.updateProfile(authorization, input);
  }

  @Get("addresses")
  listAddresses(@Headers("authorization") authorization?: string) {
    return this.customers.listAddresses(authorization);
  }

  @Post("addresses")
  createAddress(
    @Headers("authorization") authorization: string | undefined,
    @Body() input: CreateCustomerAddressDto,
  ) {
    return this.customers.createAddress(authorization, input);
  }

  @Patch("addresses/:id")
  updateAddress(
    @Headers("authorization") authorization: string | undefined,
    @Param("id") id: string,
    @Body() input: UpdateCustomerAddressDto,
  ) {
    return this.customers.updateAddress(authorization, id, input);
  }

  @Delete("addresses/:id")
  deleteAddress(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    return this.customers.deleteAddress(authorization, id);
  }
}
