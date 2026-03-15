import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [PlansModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
