import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate admin dashboard URL for a specific submission
   */
  private getAdminUrl(submissionId: string): string {
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    return `${baseUrl}/admin?submission=${submissionId}`;
  }

  /**
   * Get the total count of submitted surveys (for calculating submission number)
   */
  private async getSubmissionCount(): Promise<number> {
    return this.prisma.surveyResponse.count({
      where: { status: 'SUBMITTED' },
    });
  }

  /**
   * Construct webhook payload for a survey submission
   *
   * @param submissionId - The ID of the survey submission
   * @param overallRating - The Q1 overall rating (optional)
   * @returns WebhookPayloadDto containing summary information
   */
  async constructPayload(
    submissionId: string,
    overallRating: number | null,
  ): Promise<WebhookPayloadDto> {
    // Get submission count
    const submissionCount = await this.getSubmissionCount();

    // Get submission timestamp
    const submission = await this.prisma.surveyResponse.findUnique({
      where: { id: submissionId },
      select: { createdAt: true },
    });

    if (!submission) {
      throw new Error(`Submission not found: ${submissionId}`);
    }

    // Generate admin URL
    const adminUrl = this.getAdminUrl(submissionId);

    // Construct and return payload
    return new WebhookPayloadDto(
      submissionId,
      submission.createdAt,
      submissionCount,
      overallRating,
      adminUrl,
    );
  }

  /**
   * Dispatch webhook to configured endpoint
   *
   * @param payload - The webhook payload to send
   */
  async dispatchWebhook(payload: WebhookPayloadDto): Promise<void> {
    const webhookUrl = this.configService.get<string>('WEBHOOK_URL');

    if (!webhookUrl) {
      this.logger.warn('WEBHOOK_URL not configured, skipping webhook dispatch');
      return;
    }

    try {
      this.logger.log(`Dispatching webhook to ${webhookUrl}`);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload.toJSON()),
      });

      if (!response.ok) {
        throw new Error(
          `Webhook dispatch failed: ${response.status} ${response.statusText}`,
        );
      }

      this.logger.log(`Webhook dispatched successfully for submission ${payload.submissionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to dispatch webhook for submission ${payload.submissionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      // Don't throw - webhook failures shouldn't block survey submission
    }
  }

  /**
   * Handle survey submission webhook
   * Constructs payload and dispatches webhook
   *
   * @param submissionId - The ID of the survey submission
   * @param overallRating - The Q1 overall rating (optional)
   */
  async handleSurveySubmission(
    submissionId: string,
    overallRating: number | null,
  ): Promise<void> {
    try {
      const payload = await this.constructPayload(submissionId, overallRating);
      await this.dispatchWebhook(payload);
    } catch (error) {
      this.logger.error(
        `Error handling survey submission webhook for ${submissionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      // Don't throw - webhook failures shouldn't block survey submission
    }
  }
}
