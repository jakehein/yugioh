import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { User } from '../user/user.schema';
import { Auth, DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseError } from 'firebase-admin';

export interface UserResult {
  decodedToken: DecodedIdToken;
  user: User;
  id: string;
}

function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' &&
    !!error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    @Inject('FIREBASE_ADMIN_AUTH')
    private readonly firebaseAuth: Auth,
  ) {}

  /**
   * Validate a user by their token (idToken).
   *
   * @param token the idToken to validate
   * @returns a UserResult if the token is valid, otherwise an error
   */
  async validateUserByToken(token: string): Promise<UserResult> {
    let decodedToken;
    try {
      decodedToken = await this.firebaseAuth.verifyIdToken(token);
    } catch (err) {
      if (
        isFirebaseError(err) &&
        (err.code === 'auth/argument-error' ||
          err.code === 'auth/id-token-expired')
      ) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    let user = await this.usersService.findByFirebaseUId(decodedToken.uid);

    if (!user) {
      user = await this.usersService.createFromFirebase(
        decodedToken.uid,
        decodedToken.auth_time,
      );
    }

    if (!user.authTime || user.authTime <= decodedToken.auth_time) {
      user.authTime = decodedToken.auth_time;
    } else {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Current user session has timed out.',
      });
    }

    return { decodedToken, user, id: user._id.toHexString() };
  }
}