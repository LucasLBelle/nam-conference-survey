import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from './webhook.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

describe('WebhookService', () => {
  let service: WebhookService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockPrismaService = {
    surveyResponse: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructPayload', () => {
    it('should construct valid webhook payload with all fields', async () => {
      // Arrange
      const submissionId = 'test-submission-id-123';
      const overallRating = 4;
      const submissionCount = 42;
      const createdAt = new Date('2025-12-06T19:00:00Z');

      mockPrismaService.surveyResponse.count.mockResolvedValue(submissionCount);
      mockPrismaService.surveyResponse.findUnique.mockResolvedValue({
        id: submissionId,
        createdAt,
      });
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      // Act
      const payload = await service.constructPayload(submissionId, overallRating);

      // Assert
      expect(payload).toBeInstanceOf(WebhookPayloadDto);
      expect(payload.submissionId).toBe(submissionId);
      expect(payload.timestamp).toBe(createdAt.toISOString());
      expect(payload.submissionCount).toBe(submissionCount);
      expect(payload.overallRating).toBe(overallRating);
      expect(payload.adminUrl).toBe(`http://localhost:3000/admin?submission=${submissionId}`);
    });

    it('should construct payload with null overallRating when not provided', async () => {
      // Arrange
      const submissionId = 'test-submission-id-456';
      const submissionCount = 10;
      const createdAt = new Date('2025-12-06T20:00:00Z');

      mockPrismaService.surveyResponse.count.mockResolvedValue(submissionCount);
      mockPrismaService.surveyResponse.findUnique.mockResolvedValue({
        id: submissionId,
        createdAt,
      });
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      // Act
      const payload = await service.constructPayload(submissionId, null);

      // Assert
      expect(payload.overallRating).toBeNull();
      expect(payload.submissionId).toBe(submissionId);
    });

    it('should use custom FRONTEND_URL from config', async () => {
      // Arrange
      const submissionId = 'test-submission-id-789';
      const customUrl = 'https://survey.example.com';
      const createdAt = new Date('2025-12-06T21:00:00Z');

      mockPrismaService.surveyResponse.count.mockResolvedValue(1);
      mockPrismaService.surveyResponse.findUnique.mockResolvedValue({
        id: submissionId,
        createdAt,
      });
      mockConfigService.get.mockReturnValue(customUrl);

      // Act
      const payload = await service.constructPayload(submissionId, null);

      // Assert
      expect(payload.adminUrl).toBe(`${customUrl}/admin?submission=${submissionId}`);
    });

    it('should throw error when submission not found', async () => {
      // Arrange
      const submissionId = 'non-existent-id';

      mockPrismaService.surveyResponse.count.mockResolvedValue(1);
      mockPrismaService.surveyResponse.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.constructPayload(submissionId, null)).rejects.toThrow(
        'Submission not found: non-existent-id',
      );
    });
  });

  describe('WebhookPayloadDto.toJSON', () => {
    it('should serialize to valid JSON structure', () => {
      // Arrange
      const submissionId = 'test-id';
      const timestamp = new Date('2025-12-06T19:00:00Z');
      const submissionCount = 5;
      const overallRating = 5;
      const adminUrl = 'http://localhost:3000/admin?submission=test-id';

      const payload = new WebhookPayloadDto(
        submissionId,
        timestamp,
        submissionCount,
        overallRating,
        adminUrl,
      );

      // Act
      const json = payload.toJSON();

      // Assert
      expect(json).toEqual({
        submissionId: 'test-id',
        timestamp: '2025-12-06T19:00:00.000Z',
        submissionCount: 5,
        overallRating: 5,
        adminUrl: 'http://localhost:3000/admin?submission=test-id',
      });
    });

    it('should include null overallRating in JSON', () => {
      // Arrange
      const payload = new WebhookPayloadDto(
        'test-id',
        new Date('2025-12-06T19:00:00Z'),
        1,
        null,
        'http://localhost:3000/admin?submission=test-id',
      );

      // Act
      const json = payload.toJSON();

      // Assert
      expect(json.overallRating).toBeNull();
      expect(json).toHaveProperty('overallRating');
    });
  });

  describe('Privacy and Security', () => {
    it('should NOT include any survey response data in payload', async () => {
      // Arrange
      const submissionId = 'privacy-test-id';
      const createdAt = new Date('2025-12-06T19:00:00Z');

      mockPrismaService.surveyResponse.count.mockResolvedValue(1);
      mockPrismaService.surveyResponse.findUnique.mockResolvedValue({
        id: submissionId,
        createdAt,
      });
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      // Act
      const payload = await service.constructPayload(submissionId, 4);
      const json = payload.toJSON();

      // Assert - ensure only allowed fields are present
      const allowedFields = ['submissionId', 'timestamp', 'submissionCount', 'overallRating', 'adminUrl'];
      const actualFields = Object.keys(json);

      expect(actualFields).toEqual(expect.arrayContaining(allowedFields));
      expect(actualFields.length).toBe(allowedFields.length);

      // Ensure no sensitive data fields
      expect(json).not.toHaveProperty('q2ReturnIntent');
      expect(json).not.toHaveProperty('q14LikedMost');
      expect(json).not.toHaveProperty('q19Name');
      expect(json).not.toHaveProperty('userId');
    });
  });
});
