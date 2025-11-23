import { ReservationRepository } from '../src/repositories/ReservationRepository';
import { InMemoryRepository } from '../src/repositories/InMemoryRepository';
import { User } from '../src/models/User';
import { Cavan } from '../src/models/Cavan';
import { ReservationValidator, ReservationRequest } from '../src/validators/ReservationValidator';
import { ValidationException } from '../src/exceptions/ValidationException';
import { NotFoundException } from '../src/exceptions/NotFoundException';

// Mock the repositories using jest.mock
jest.mock('../src/repositories/ReservationRepository');
jest.mock('../src/repositories/InMemoryRepository');

describe('ReservationValidator', () => {
  let validator: ReservationValidator;
  // Declare mocks with Jest's mock types
  let mockReservationRepo: jest.Mocked<ReservationRepository>;
  let mockUserRepo: jest.Mocked<InMemoryRepository<User>>;
  let mockCavanRepo: jest.Mocked<InMemoryRepository<Cavan>>;

  beforeEach(() => {
    // Instantiate the mocked classes
    mockReservationRepo = new ReservationRepository() as jest.Mocked<ReservationRepository>;
    mockUserRepo = new InMemoryRepository<User>() as jest.Mocked<InMemoryRepository<User>>;
    mockCavanRepo = new InMemoryRepository<Cavan>() as jest.Mocked<InMemoryRepository<Cavan>>;

    // Create a new validator instance for each test with the fresh mocks
    validator = new ReservationValidator(mockReservationRepo, mockUserRepo, mockCavanRepo);
  });

  const baseTime = new Date();
  baseTime.setDate(baseTime.getDate() + 1); // Start tomorrow to avoid "in the past" error
  const validRequest: ReservationRequest = {
    guestId: 'user-1',
    cavanId: 'cavan-1',
    startDate: baseTime,
    endDate: new Date(baseTime.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days later
  };

  it('should not throw an error for a valid request', async () => {
    mockUserRepo.findById.mockResolvedValue({ id: 'user-1' } as User);
    mockCavanRepo.findById.mockResolvedValue({ id: 'cavan-1' } as Cavan);
    mockReservationRepo.findConflictsByCavanId.mockResolvedValue([]);

    await expect(validator.validate(validRequest)).resolves.not.toThrow();
  });

  it('should throw ValidationException if start date is after end date', async () => {
    // Arrange: Mock dependencies to let the test pass the entity validation step
    mockUserRepo.findById.mockResolvedValue({ id: 'user-1' } as User);
    mockCavanRepo.findById.mockResolvedValue({ id: 'cavan-1' } as Cavan);

    const invalidRequest = { ...validRequest, startDate: validRequest.endDate, endDate: validRequest.startDate };
    
    // Act & Assert
    await expect(validator.validate(invalidRequest)).rejects.toThrow(new ValidationException('Start date must be before end date.'));
  });
  
  it('should throw ValidationException if start date is in the past', async () => {
    // Arrange: Mock dependencies to let the test pass the entity validation step
    mockUserRepo.findById.mockResolvedValue({ id: 'user-1' } as User);
    mockCavanRepo.findById.mockResolvedValue({ id: 'cavan-1' } as Cavan);

    const invalidRequest = { ...validRequest, startDate: new Date('2000-01-01') };
    
    // Act & Assert
    await expect(validator.validate(invalidRequest)).rejects.toThrow(new ValidationException('Start date cannot be in the past.'));
  });

  it('should throw NotFoundException if user does not exist', async () => {
    mockUserRepo.findById.mockRejectedValue(new NotFoundException('User', 'user-1'));
    mockCavanRepo.findById.mockResolvedValue({ id: 'cavan-1' } as Cavan);
    
    await expect(validator.validate(validRequest)).rejects.toThrow(new NotFoundException('User', 'user-1'));
  });

  it('should throw NotFoundException if cavan does not exist', async () => {
    mockUserRepo.findById.mockResolvedValue({ id: 'user-1' } as User);
    mockCavanRepo.findById.mockRejectedValue(new NotFoundException('Cavan', 'cavan-1'));

    await expect(validator.validate(validRequest)).rejects.toThrow(new NotFoundException('Cavan', 'cavan-1'));
  });

  it('should throw ValidationException if there are conflicting reservations', async () => {
    mockUserRepo.findById.mockResolvedValue({ id: 'user-1' } as User);
    mockCavanRepo.findById.mockResolvedValue({ id: 'cavan-1' } as Cavan);
    mockReservationRepo.findConflictsByCavanId.mockResolvedValue([{ id: 'res-2' } as any]);

    await expect(validator.validate(validRequest)).rejects.toThrow(new ValidationException('The cavan is already reserved for the selected dates.'));
  });
});
