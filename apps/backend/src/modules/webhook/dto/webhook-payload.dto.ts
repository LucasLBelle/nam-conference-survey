/**
 * Webhook Payload DTO
 *
 * Summary-only payload sent to webhook endpoints when a survey is submitted.
 * Privacy-preserving design: does NOT include full survey responses.
 *
 * Based on STORY-053: Summary Payload Schema
 */
export class WebhookPayloadDto {
  /**
   * Unique identifier for the survey submission
   */
  submissionId: string;

  /**
   * Timestamp when the survey was submitted (ISO 8601 format)
   */
  timestamp: string;

  /**
   * The sequential number of this submission (e.g., "3rd response")
   */
  submissionCount: number;

  /**
   * Overall rating (Q1) if provided - optional summary field
   * Value between 1-5, or null if not provided
   */
  overallRating: number | null;

  /**
   * URL to view full submission details in the admin dashboard
   */
  adminUrl: string;

  constructor(
    submissionId: string,
    timestamp: Date,
    submissionCount: number,
    overallRating: number | null,
    adminUrl: string,
  ) {
    this.submissionId = submissionId;
    this.timestamp = timestamp.toISOString();
    this.submissionCount = submissionCount;
    this.overallRating = overallRating;
    this.adminUrl = adminUrl;
  }

  /**
   * Convert to plain JSON object for webhook transmission
   */
  toJSON(): Record<string, unknown> {
    return {
      submissionId: this.submissionId,
      timestamp: this.timestamp,
      submissionCount: this.submissionCount,
      overallRating: this.overallRating,
      adminUrl: this.adminUrl,
    };
  }
}
