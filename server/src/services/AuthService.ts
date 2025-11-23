import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { UserRepository } from '../repositories/UserRepository';
import { ValidationException } from '../exceptions/ValidationException';

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async register(userData: Partial<User>): Promise<Omit<User, 'password'>> {
    const { email, password, name } = userData;

    if (!email || !password || !name) {
      throw new ValidationException('Email, password, and name are required');
    }

    const existingUser = this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ValidationException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: Omit<User, 'id'> = {
      ...userData,
      password: hashedPassword,
      email,
      name,
      // Defaults for other fields
      photoUrl: '',
      contact: '',
      role: userData.role || 'guest',
      isVerified: false,
    };
    
    const savedUser = await this.userRepository.save(newUser);
    const { password: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async login(credentials: Pick<User, 'email' | 'password'>): Promise<{ token: string; user: Omit<User, 'password'> }> {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new ValidationException('Email and password are required');
    }

    const user = this.userRepository.findByEmail(email);
    if (!user || !user.password) {
      throw new ValidationException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ValidationException('Invalid credentials');
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    return { token, user: userWithoutPassword };
  }
}
