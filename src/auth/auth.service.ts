import { ForbiddenException, Injectable } from '@nestjs/common';

import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    try {
      //generate password hash
      const hash = await argon.hash(dto.password);
      //save user to db
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });
      return this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('User already exists');
        }
      } else {
        throw error;
      }
    }
  }

  async signin(dto: AuthDto) {
    // find the user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    //excpetion if user not found
    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }
    //compare password hash
    const valid = await argon.verify(user.hash, dto.password);
    //exception if password is wrong
    if (!valid) {
      throw new ForbiddenException('Invalid credentials');
    }
    //return user
    return this.signToken(user.id, user.email);
  }
  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const data = {
      sub: userId,
      email,
    };
    const secret = this.config.get('JWT_SECRET');
    const token = await this.jwt.signAsync(data, {
      expiresIn: '15min',
      secret,
    });
    return { access_token: token };
  }
}
