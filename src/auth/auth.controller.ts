import { Controller, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('signup')
  signup() {
    return 'i am signed up';
  }
  @Post('signin')
  signin() {
    console.log('call');
    ('return i am signed in');
  }
}
