import { ReservationService } from '../src/services/ReservationService';
import { ReservationRepository } from '../src/repositories/ReservationRepository';
import { InMemoryRepository } from '../src/repositories/InMemoryRepository';
import { Caravan } from '../src/models/Caravan';
import { ReservationValidator, ReservationRequest } from '../src/validators/ReservationValidator';
import { NotFoundException } from '../src/exceptions/NotFoundException';
import { Reservation } from '../src/models/Reservation';

jest.mock('../src/repositories/ReservationRepository');
jest.mock('../src/repositories/InMemoryRepository');
jest.mock('../src/validators/ReservationValidator');

describe('ReservationService', () => {
  let service: ReservationService;
  let mockReservationRepo: jest.Mocked<ReservationRepository>;
  let mockCaravanRepo: jest.Mocked<InMemoryRepository<Caravan>>;
  let mockValidator: jest.Mocked<ReservationValidator>;

  beforeEach(() => {
    mockReservationRepo = new ReservationRepository() as jest.Mocked<ReservationRepository>;
    mockCaravanRepo = new InMemoryRepository<Caravan>() as jest.Mocked<InMemoryRepository<Caravan>>;
    // We mock the entire validator, so we don't need its real dependencies
    mockValidator = new (ReservationValidator as any)() as jest.Mocked<ReservationValidator>;

    service = new ReservationService(mockReservationRepo, mockCaravanRepo, mockValidator);
    
    jest.clearAllMocks();
  });

  const request: ReservationRequest = {
    guestId: 'user-1',
    caravanId: 'caravan-1',
    startDate: new Date('2025-10-10T12:00:00Z'),
    endDate: new Date('2025-10-15T12:00:00Z'), // 5 days
  };

  const caravan: Caravan = {
    id: 'caravan-1',
    dailyRate: 100,
    hostId: 'host-1',
    capacity: 4,
    amenities: [],
    photos: [],
    location: 'Campsite A',
    status: 'available'
  };

  it('should create a reservation successfully', async () => {
    // Arrange
    mockValidator.validate.mockResolvedValue(undefined); // Validation passes
    mockCaravanRepo.findById.mockResolvedValue(caravan);
    
    const expectedReservation: Reservation = {
      ...request,
      id: 'new-res-id',
      totalPrice: 500, // 5 days * 100
      status: 'pending',
      createdAt: new Date(),
    };
    mockReservationRepo.save.mockResolvedValue(expectedReservation);

    // Act
    const result = await service.createReservation(request);

    // Assert
    expect(mockValidator.validate).toHaveBeenCalledWith(request);
    expect(mockCaravanRepo.findById).toHaveBeenCalledWith(request.caravanId);
    expect(mockReservationRepo.save).toHaveBeenCalled();
    expect(result.totalPrice).toBe(500);
    expect(result.id).toBe('new-res-id');
  });

  it('should throw the error from the validator if validation fails', async () => {
    // Arrange
    const validationError = new NotFoundException('User', 'user-1');
    mockValidator.validate.mockRejectedValue(validationError);

    // Act & Assert
    await expect(service.createReservation(request)).rejects.toThrow(validationError);
    expect(mockReservationRepo.save).not.toHaveBeenCalled();
  });

  it('should calculate price for a single day correctly', async () => {
    // Arrange
    const singleDayRequest: ReservationRequest = {
        ...request,
        endDate: new Date('2025-10-11T12:00:00Z') // 1 day
    };
    mockValidator.validate.mockResolvedValue(undefined);
    mockCaravanRepo.findById.mockResolvedValue(caravan);
    
    // Have the mock return the object it was called with, but with a calculated price
    mockReservationRepo.save.mockImplementation(async (res) => {
        return { ...(res as Reservation), id: 'some-id' };
    });

    // Act
    const result = await service.createReservation(singleDayRequest);

    // Assert
    expect(result.totalPrice).toBe(100);
  });

  it('should calculate price correctly, rounding up days', async () => {
    // Arrange
    const partialDayRequest: ReservationRequest = {
        ...request,
        endDate: new Date('2025-10-11T18:00:00Z') // 1 day and 6 hours -> should be 2 days
    };
    mockValidator.validate.mockResolvedValue(undefined);
    mockCaravanRepo.findById.mockResolvedValue(caravan);
    mockReservationRepo.save.mockImplementation(async (res) => res as Reservation);

    // Act
    const result = await service.createReservation(partialDayRequest);

    // Assert
    expect(result.totalPrice).toBe(200);
  });
});
