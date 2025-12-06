import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSurveyResponseDto } from './dto/create-survey-response.dto';
import { SurveyResponseDto } from './dto/survey-response.dto';
import { Role, Status } from '@prisma/client';
import { WebhookService } from '../webhook/webhook.service';

@Injectable()
export class SurveyService {
  private readonly logger = new Logger(SurveyService.name);
  private readonly ANONYMOUS_EMAIL = 'anonymous@survey.local';

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
  ) {}

  /**
   * Get or create the anonymous user for survey submissions
   */
  private async getOrCreateAnonymousUser() {
    let user = await this.prisma.user.findUnique({
      where: { email: this.ANONYMOUS_EMAIL },
    });

    if (!user) {
      this.logger.log('Creating anonymous user');
      user = await this.prisma.user.create({
        data: {
          email: this.ANONYMOUS_EMAIL,
          name: 'Anonymous Survey User',
          role: Role.PARTICIPANT,
        },
      });
    }

    return user;
  }

  /**
   * Check if the submission has at least one field filled
   */
  private hasAnyFieldFilled(dto: CreateSurveyResponseDto): boolean {
    const values = Object.values(dto);
    return values.some((value) => {
      if (value === null || value === undefined) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.keys(value).length > 0;
      return true;
    });
  }

  /**
   * Submit anonymous survey response
   */
  async submitSurvey(dto: CreateSurveyResponseDto): Promise<SurveyResponseDto> {
    // Validate that at least one field is filled
    if (!this.hasAnyFieldFilled(dto)) {
      throw new BadRequestException(
        'Cannot submit empty survey. Please answer at least one question.',
      );
    }

    // Get or create anonymous user and create response in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Get or create anonymous user
      let user = await tx.user.findUnique({
        where: { email: this.ANONYMOUS_EMAIL },
      });

      if (!user) {
        this.logger.log('Creating anonymous user in transaction');
        user = await tx.user.create({
          data: {
            email: this.ANONYMOUS_EMAIL,
            name: 'Anonymous Survey User',
            role: Role.PARTICIPANT,
          },
        });
      }

      // Create survey response with default empty arrays for multi-select fields
      const response = await tx.surveyResponse.create({
        data: {
          userId: user.id,
          status: Status.SUBMITTED,

          // Likert scale questions
          q1OverallRating: dto.q1OverallRating ?? null,
          q1Comment: dto.q1Comment ?? null,
          q2ReturnIntent: dto.q2ReturnIntent ?? null,
          q2Comment: dto.q2Comment ?? null,
          q3CoworkingEffectiveness: dto.q3CoworkingEffectiveness ?? null,
          q3Comment: dto.q3Comment ?? null,
          q5ConnectionDepth: dto.q5ConnectionDepth ?? null,
          q5Comment: dto.q5Comment ?? null,
          q6LearningValue: dto.q6LearningValue ?? null,
          q6Comment: dto.q6Comment ?? null,
          q8SaturdayWorth: dto.q8SaturdayWorth ?? null,
          q8Comment: dto.q8Comment ?? null,
          q9PreConferenceCommunication:
            dto.q9PreConferenceCommunication ?? null,
          q10AccommodationsVenue: dto.q10AccommodationsVenue ?? null,
          q13ComparisonToPD: dto.q13ComparisonToPD ?? null,

          // Multiple select questions (default to empty arrays)
          q4ConnectionTypes: dto.q4ConnectionTypes ?? [],
          q4ConnectionOther: dto.q4ConnectionOther ?? null,
          q17FeedbackConfidence: dto.q17FeedbackConfidence ?? [],

          // Ranking question
          q11SessionRankings: dto.q11SessionRankings || undefined,

          // Single choice questions
          q12ConferenceLength: dto.q12ConferenceLength ?? null,
          q16Improvements: dto.q16Improvements ?? null,
          q16Comment: dto.q16Comment ?? null,

          // Open-ended questions
          q7FutureTopics: dto.q7FutureTopics ?? null,
          q14LikedMost: dto.q14LikedMost ?? null,
          q15AdditionalFeedback: dto.q15AdditionalFeedback ?? null,

          // Demographics
          q18EmploymentStatus: dto.q18EmploymentStatus ?? null,
          q19Name: dto.q19Name ?? null,
          q19Location: dto.q19Location ?? null,
        },
      });

      return response;
    });

    // Log submission (without PII)
    this.logger.log(`Survey submitted: ${result.id}`);

    // Dispatch webhook asynchronously (don't block response)
    this.webhookService
      .handleSurveySubmission(result.id, dto.q1OverallRating ?? null)
      .catch((error) => {
        this.logger.error(
          `Webhook dispatch failed for submission ${result.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      });

    // Return response DTO
    return new SurveyResponseDto(
      result.id,
      result.userId,
      result.status,
      result.createdAt,
    );
  }
}
