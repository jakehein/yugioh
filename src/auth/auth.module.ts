import { initializeApp, App, cert, AppOptions } from 'firebase-admin/app';
import { FactoryProvider, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { BearerStrategy } from './bearer.strategy';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Auth, getAuth } from 'firebase-admin/auth';
import { UserEmailRetrieverService } from './user-email-retriever.service';

const firebaseFactory: FactoryProvider<App> = {
  provide: 'FIREBASE_ADMIN',
  useFactory: (configService: ConfigService) => {
    const serviceAccountJsonPath = configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_JSON_PATH',
    );

    let credential: NonNullable<AppOptions['credential']>;
    if (serviceAccountJsonPath) {
      credential = cert(serviceAccountJsonPath);
    } else {
      const serviceAccountJsonString = configService.get<string>(
        'FIREBASE_SERVICE_ACCOUNT_JSON',
      );

      if (!serviceAccountJsonString) {
        throw new Error(
          'Neither FIREBASE_SERVICE_ACCOUNT_JSON_PATH nor FIREBASE_SERVICE_ACCOUNT_JSON config has been specified - at least one must be specified',
        );
      }

      credential = cert(JSON.parse(serviceAccountJsonString));
    }

    return initializeApp({
      credential,
    });
  },
  inject: [ConfigService],
};

const firebaseAuthFactory: FactoryProvider<Auth> = {
  provide: 'FIREBASE_ADMIN_AUTH',
  useFactory: (firebaseApp: App) => getAuth(firebaseApp),
  inject: ['FIREBASE_ADMIN'],
};

@Module({
  imports: [ConfigModule, UserModule, PassportModule],
  providers: [
    AuthService,
    BearerStrategy,
    firebaseFactory,
    firebaseAuthFactory,
    UserEmailRetrieverService,
  ],
  exports: [AuthService, 'FIREBASE_ADMIN_AUTH', UserEmailRetrieverService],
  controllers: [AuthController],
})
export class AuthModule {}
