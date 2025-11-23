import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { AuthService } from '../src/services/AuthService';
import { UserRepository } from '../src/repositories/UserRepository';
import { createAuthRouter } from '../src/controllers/AuthController';
import { User } from '../src/models/User';
import jwt from 'jsonwebtoken';
import { ApplicationException } from '../src/exceptions/ApplicationException'; // Import ApplicationException
import { authMiddleware } from '../src/middleware/authMiddleware'; // Import authMiddleware
import { NotFoundException } from '../src/exceptions/NotFoundException'; // Import NotFoundException

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';

describe('Auth API', () => {
  let app: express.Application;
  let authService: AuthService;
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
    authService = new AuthService(userRepository);
    
    // Create a full mock Express app similar to index.ts
    app = express();
    app.use(express.json());

    // Initialize authMiddleware with userRepository
    const authenticate = authMiddleware(userRepository);

    // Mount auth routes, passing userRepository as well
    app.use('/api/auth', createAuthRouter(authService, userRepository));

    // Mount other routes that might use authMiddleware if needed (for /me specifically)
    // For /me, the middleware is applied within createAuthRouter
    
    // Global Error Handler Middleware (mimic index.ts)
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      if (err instanceof ApplicationException) {
        res.status(err.status).json({ name: err.name, message: err.message });
      } else {
        res.status(500).json({ name: 'InternalServerError', message: err.message || 'An unexpected error occurred.' });
      }
    });

    // Mock the in-memory store to be empty before each test
    (userRepository as any).users = []; 
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', newUser.name);
      expect(res.body).toHaveProperty('email', newUser.email);
      expect(res.body).not.toHaveProperty('password'); // Password should be excluded
    });

    it('should prevent registration with a duplicate email', async () => {
      const newUser = { name: 'Test User', email: 'duplicate@example.com', password: 'password123' };
      
      // Register once
      await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      // Try to register again with the same email
      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(400); // Expect bad request due to validation exception

      expect(res.body).toHaveProperty('name', 'ValidationException');
      expect(res.body).toHaveProperty('message', 'User with this email already exists');
    });

    it('should return 400 if required fields are missing', async () => {
      const incompleteUser = { email: 'incomplete@example.com', password: 'password123' };
      const res = await request(app)
        .post('/api/auth/register')
        .send(incompleteUser)
        .expect(400);

      expect(res.body).toHaveProperty('name', 'ValidationException');
      expect(res.body).toHaveProperty('message', 'Email, password, and name are required');
    });
  });

  describe('POST /api/auth/login', () => {
    const registeredUser = { name: 'Login User', email: 'login@example.com', password: 'password123' };

    beforeEach(async () => {
      // Register the user first
      await request(app).post('/api/auth/register').send(registeredUser);
    });

    it('should log in a registered user successfully and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: registeredUser.email, password: registeredUser.password })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', registeredUser.email);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should return 400 for incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: registeredUser.email, password: 'wrongpassword' })
        .expect(400);

      expect(res.body).toHaveProperty('name', 'ValidationException');
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 400 for unregistered email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })
        .expect(400);

      expect(res.body).toHaveProperty('name', 'ValidationException');
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    const testUser = { id: 'user123', name: 'Auth Me', email: 'me@example.com', password: 'password123', role: 'guest' };
    let authToken: string;

    beforeEach(async () => {
      // Manually add a user to the repository and generate a token
      // We need to ensure the user is saved via the service or mock the findById in the repo
      await authService.register(testUser as Partial<User>); // Explicitly cast to Partial<User>
      const loginRes = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password });
      authToken = loginRes.body.token;
    });

    it('should return the authenticated user\'s details', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id'); // ID is auto-generated by InMemRepo
      expect(res.body).toHaveProperty('name', testUser.name);
      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Authentication token missing or invalid');
    });

    it('should return 401 if an invalid token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Invalid or expired token');
    });

    it('should return 401 if token is valid but user not found (e.g., deleted user)', async () => {
      const tempUser = { name: 'Temp User', email: 'temp@user.com', password: 'password123' };
      await authService.register(tempUser as Partial<User>);
      const loginRes = await request(app).post('/api/auth/login').send({ email: tempUser.email, password: tempUser.password });
      const tokenForDeletedUser = loginRes.body.token;

      // Mock findById to return null for the specific user ID in the token
      jest.spyOn(userRepository, 'findById').mockRejectedValueOnce(new NotFoundException('users', 'some-id'));

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenForDeletedUser}`)
        .expect(401);

      expect(res.body).toHaveProperty('message', 'User not found');

      // Restore original implementation after this test
      jest.restoreAllMocks();
    });
  });
});
