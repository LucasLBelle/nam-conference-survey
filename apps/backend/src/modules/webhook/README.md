# Webhook Module

## Overview

The Webhook module dispatches HTTP webhooks when survey submissions occur. It sends privacy-preserving summary payloads that do NOT include full survey response data.

**Implemented in**: STORY-053 (Summary Payload Schema)

## Webhook Payload Schema

When a survey is submitted, the following JSON payload is sent to the configured webhook endpoint:

```json
{
  "submissionId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-12-06T19:30:45.123Z",
  "submissionCount": 42,
  "overallRating": 4,
  "adminUrl": "http://localhost:3000/admin?submission=550e8400-e29b-41d4-a716-446655440000"
}
```

### Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `submissionId` | `string` (UUID) | Unique identifier for this survey submission | `"550e8400-e29b-41d4-a716-446655440000"` |
| `timestamp` | `string` (ISO 8601) | When the survey was submitted | `"2025-12-06T19:30:45.123Z"` |
| `submissionCount` | `number` | Total number of submissions received (sequential) | `42` |
| `overallRating` | `number` or `null` | Q1 overall rating (1-5) if provided, else `null` | `4` or `null` |
| `adminUrl` | `string` (URL) | Link to view full submission in admin dashboard | `"http://localhost:3000/admin?submission=..."` |

### Privacy Design

**✅ Included:**
- Submission metadata (ID, timestamp, count)
- Overall rating (Q1) as optional summary metric
- Admin dashboard link for authorized access

**❌ NOT Included:**
- Full survey responses (Q2-Q19)
- User PII (name, location, email)
- Any open-ended text responses
- Demographics data

This ensures webhook payloads are informative without exposing sensitive data.

## Configuration

### Environment Variables

Add to `.env` file:

```bash
# Webhook endpoint (optional - if not set, webhooks are skipped)
WEBHOOK_URL=https://your-webhook-endpoint.com/webhook

# Frontend URL for generating admin links (defaults to http://localhost:3000)
FRONTEND_URL=http://localhost:3000
```

### Webhook Endpoint Requirements

Your webhook endpoint should:

1. **Accept POST requests** with `Content-Type: application/json`
2. **Respond with 2xx status** to indicate successful receipt
3. **Respond quickly** (< 5 seconds) - dispatch is asynchronous but should not block
4. **Handle duplicate submissions** - webhooks may retry on transient failures

Example webhook handler (Node.js/Express):

```javascript
app.post('/webhook', express.json(), (req, res) => {
  const { submissionId, timestamp, submissionCount, overallRating, adminUrl } = req.body;

  console.log(`New survey submission: #${submissionCount}`);
  console.log(`Submission ID: ${submissionId}`);
  console.log(`Overall rating: ${overallRating ?? 'Not provided'}`);
  console.log(`View details: ${adminUrl}`);

  // Process webhook (e.g., send Slack notification, update metrics, etc.)

  res.status(200).json({ received: true });
});
```

## Usage

### Automatic Dispatch

Webhooks are dispatched automatically when a survey is submitted via `POST /api/survey/submit`. No additional code is required.

### Manual Dispatch

To manually trigger a webhook (e.g., for testing):

```typescript
import { WebhookService } from './modules/webhook/webhook.service';

// In your service/controller
async testWebhook(submissionId: string) {
  await this.webhookService.handleSurveySubmission(submissionId, 4);
}
```

## Error Handling

- **Webhook failures do NOT block survey submission** - submissions succeed even if webhook dispatch fails
- Failed webhooks are logged but do not throw errors
- No automatic retry mechanism (implement in your webhook endpoint if needed)
- Missing `WEBHOOK_URL` config results in skipped dispatch (logged as warning)

## Testing

Run webhook service tests:

```bash
pnpm test webhook.service.spec.ts
```

### Test Webhook Endpoint

Use a service like [webhook.site](https://webhook.site) or [RequestBin](https://requestbin.com) to test webhooks:

1. Get a test webhook URL from webhook.site
2. Set `WEBHOOK_URL` in your `.env` file
3. Submit a survey
4. View the payload in webhook.site

Example `.env`:

```bash
WEBHOOK_URL=https://webhook.site/unique-id-here
```

## Integration Examples

### Slack Notification

```javascript
// Slack webhook endpoint
app.post('/slack-webhook', async (req, res) => {
  const { submissionCount, overallRating, adminUrl } = req.body;

  const message = {
    text: `📋 New survey submission (#${submissionCount})`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*New Survey Submission*\n\n*Number:* ${submissionCount}\n*Rating:* ${overallRating ? `⭐ ${overallRating}/5` : 'Not provided'}\n\n<${adminUrl}|View in Dashboard>`,
        },
      },
    ],
  };

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });

  res.sendStatus(200);
});
```

### Metrics Dashboard

```javascript
// Update real-time metrics
app.post('/metrics-webhook', async (req, res) => {
  const { submissionCount, overallRating } = req.body;

  // Update dashboard
  await metricsService.updateCount(submissionCount);
  if (overallRating) {
    await metricsService.addRating(overallRating);
  }

  res.sendStatus(200);
});
```

## Security Considerations

1. **Use HTTPS** for webhook URLs in production
2. **Validate webhook signatures** if your endpoint requires authentication (not implemented in v1)
3. **Rate limit** your webhook endpoint to prevent abuse
4. **Log webhook attempts** for auditing
5. **Do NOT expose admin URLs** publicly - they are for internal use only

## Future Enhancements

Potential improvements for future iterations:

- [ ] Webhook signature/authentication (HMAC)
- [ ] Automatic retry with exponential backoff
- [ ] Multiple webhook endpoints
- [ ] Webhook delivery history/logs
- [ ] Admin UI for webhook configuration
- [ ] Webhook payload versioning

## Related Stories

- **STORY-052**: Webhook Dispatch on Submission (dependency)
- **STORY-053**: Summary Payload Schema (this implementation)
- **STORY-054**: Webhook Configuration UI (future)
