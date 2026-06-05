import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SessionRepository } from './session.repository';

@Module({
  providers: [AuthService, SessionRepository],
  exports: [AuthService],
})
export class AuthModule {}
