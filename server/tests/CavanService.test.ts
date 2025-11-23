import { CavanService, CavanSortBy, CavanWithDistance } from '../src/services/CavanService';
import { CavanRepository } from '../src/repositories/CavanRepository';
import { GoogleMapsService, Location } from '../src/services/GoogleMapsService';
import { Cavan } from '../src/models/Cavan';
import { UserRepository } from '../src/repositories/UserRepository'; // Import UserRepository
import { ReservationRepository } from '../src/repositories/ReservationRepository'; // Import ReservationRepository

// Mock the dependencies
jest.mock('../src/repositories/CavanRepository');
jest.mock('../src/services/GoogleMapsService');
jest.mock('../src/repositories/UserRepository'); // Mock UserRepository
jest.mock('../src/repositories/ReservationRepository'); // Mock ReservationRepository

describe('CavanService', () => {
  let service: CavanService;
  let mockCavanRepo: jest.Mocked<CavanRepository>;
  let mockGoogleMapsService: jest.Mocked<GoogleMapsService>;
  let mockUserRepo: jest.Mocked<UserRepository>; // Declare mockUserRepo
  let mockReservationRepo: jest.Mocked<ReservationRepository>; // Declare mockReservationRepo

  // Sample data to be used across tests
  const mockCavans: Cavan[] = [
    { id: 'c1', name: 'Cheap but unliked', dailyRate: 100, likes: 5, location: { lat: 37.1, lng: 127.1 }, capacity: 2, amenities: [], photos: [], status: 'available', hostId: 'h1' },
    { id: 'c2', name: 'Very popular', dailyRate: 150, likes: 100, location: { lat: 37.2, lng: 127.2 }, capacity: 4, amenities: [], photos: [], status: 'available', hostId: 'h1' },
    { id: 'c3', name: 'Expensive but ok', dailyRate: 200, likes: 20, location: { lat: 37.3, lng: 127.3 }, capacity: 6, amenities: [], photos: [], status: 'available', hostId: 'h2' },
  ];

  beforeEach(() => {
    // Create new mock instances for each test
    mockCavanRepo = new CavanRepository() as jest.Mocked<CavanRepository>;
    mockGoogleMapsService = new GoogleMapsService() as jest.Mocked<GoogleMapsService>;
    mockUserRepo = new UserRepository() as jest.Mocked<UserRepository>; // Initialize mockUserRepo
    mockReservationRepo = new ReservationRepository() as jest.Mocked<ReservationRepository>; // Initialize mockReservationRepo
    
    // Pass all dependencies to the CavanService constructor
    service = new CavanService(mockCavanRepo, mockUserRepo, mockReservationRepo, mockGoogleMapsService);

    // Default mock implementation
    mockCavanRepo.findAll.mockResolvedValue([...mockCavans]);
    jest.clearAllMocks();
  });

  it('should fetch all cavans from the repository', async () => {
    await service.getCavans();
    expect(mockCavanRepo.findAll).toHaveBeenCalledTimes(1);
  });

  describe('Sorting Logic', () => {
    it('should sort by price (dailyRate) in ascending order', async () => {
      const sorted = await service.getCavans('price');
      expect(sorted[0].id).toBe('c1'); // Cheapest
      expect(sorted[1].id).toBe('c2');
      expect(sorted[2].id).toBe('c3'); // Most expensive
    });

    it('should sort by likes in descending order', async () => {
      const sorted = await service.getCavans('likes');
      expect(sorted[0].id).toBe('c2'); // Most liked
      expect(sorted[1].id).toBe('c3');
      expect(sorted[2].id).toBe('c1'); // Least liked
    });

    describe('Distance Sorting', () => {
      const origin: Location = { lat: 37.0, lng: 127.0 };
      
      it('should return unsorted cavans if sortBy is distance but no origin is provided', async () => {
        const result = await service.getCavans('distance', undefined);
        // Should return in original order from repo
        expect(result[0].id).toBe('c1');
        expect(result[1].id).toBe('c2');
        expect(result[2].id).toBe('c3');
        expect(mockGoogleMapsService.calculateDistances).not.toHaveBeenCalled();
      });

      it('should call GoogleMapsService and sort by distance in ascending order', async () => {
        // Arrange: Mock distances to make c3 closest, c1 furthest
        const mockDistances = [30000, 20000, 10000]; // c1 is 30km, c2 is 20km, c3 is 10km
        mockGoogleMapsService.calculateDistances.mockResolvedValue(mockDistances);

        // Act
        const sorted = await service.getCavans('distance', origin);

        // Assert
        expect(mockGoogleMapsService.calculateDistances).toHaveBeenCalledWith(origin, mockCavans);
        
        // Check the order based on the mocked distances
        const sortedWithDistance = sorted as CavanWithDistance[];
        expect(sortedWithDistance[0].id).toBe('c3'); // Closest (10km)
        expect(sortedWithDistance[1].id).toBe('c2'); // Middle (20km)
        expect(sortedWithDistance[2].id).toBe('c1'); // Furthest (30km)
      });

      it('should handle null values from the distance API, pushing them to the end', async () => {
        // Arrange: Mock c2 as having a null distance
        const mockDistances = [30000, null, 10000];
        mockGoogleMapsService.calculateDistances.mockResolvedValue(mockDistances);

        // Act
        const sorted = await service.getCavans('distance', origin);
        
        // Assert
        const sortedWithDistance = sorted as CavanWithDistance[];
        expect(sortedWithDistance[0].id).toBe('c3'); // c3 is closest
        expect(sortedWithDistance[1].id).toBe('c1'); // c1 is next
        expect(sortedWithDistance[2].id).toBe('c2'); // c2 with null distance is last
      });
    });
  });
});
