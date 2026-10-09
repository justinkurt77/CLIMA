# Facebook Webhook Integration Guide

## Overview
This guide explains how to set up Facebook Graph API webhooks to monitor posts and comments for keyword detection.

## Prerequisites
1. Facebook Developer Account
2. Facebook App created
3. Facebook Page access token
4. Public webhook endpoint (use ngrok for local development)

## Setup Steps

### 1. Create Facebook App
1. Go to https://developers.facebook.com/apps/
2. Create a new app (Type: Business)
3. Add "Webhooks" product
4. Add "Facebook Login" product

### 2. Configure Webhooks
1. In Webhooks settings, click "Edit Subscription"
2. Set Callback URL: `https://yourdomain.com/api/facebook/webhook`
3. Set Verify Token: (generate a random string and store in `.env`)
4. Subscribe to: `feed`, `comments`, `mentions`

### 3. Environment Variables
Add to `.env`:
```
VITE_FB_APP_ID=your_app_id
VITE_FB_APP_SECRET=your_app_secret
VITE_FB_PAGE_ID=your_page_id
VITE_FB_PAGE_ACCESS_TOKEN=your_page_access_token
VITE_FB_VERIFY_TOKEN=your_random_verify_token
```

### 4. Database Setup
Run the migration:
```sql
psql -h your-supabase-host -U postgres -d postgres -f supabase_phase4.sql
```

### 5. Webhook Endpoint (Backend Implementation)

**Note:** This requires a backend server. Below is a Node.js/Express example:

```javascript
// webhook-server.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Webhook verification (GET)
app.get('/api/facebook/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VITE_FB_VERIFY_TOKEN) {
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook events (POST)
app.post('/api/facebook/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.field === 'feed') {
          await processFeedChange(change.value);
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

async function processFeedChange(value) {
  const message = value.message || value.comment_text || '';
  
  // Detect keywords
  const { data: detection } = await supabase.rpc(
    'detect_category_from_keywords',
    { message_text: message }
  );

  if (detection && detection.length > 0) {
    const { category, keywords } = detection[0];

    // Insert into facebook_posts
    await supabase.from('facebook_posts').insert({
      fb_post_id: value.post_id || value.comment_id,
      fb_comment_id: value.comment_id,
      author_id: value.from?.id,
      author_name: value.from?.name,
      message: message,
      post_type: value.comment_id ? 'comment' : 'post',
      detected_keywords: keywords,
      detected_category: category,
      fb_created_at: value.created_time,
      status: 'pending',
    });

    console.log(`Detected ${category} incident: ${message.substring(0, 50)}`);
  }
}

app.listen(3000, () => console.log('Webhook server running on port 3000'));
```

### 6. Auto-Publishing to Facebook

When an advisory is created with `publish_to_facebook: true`, create an entry in `facebook_autopublish`:

```javascript
// Example: Publish advisory to Facebook
async function publishAdvisoryToFacebook(advisory) {
  const { data: config } = await supabase
    .from('facebook_config')
    .select('*')
    .eq('is_active', true)
    .single();

  if (!config) throw new Error('Facebook not configured');

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${config.page_id}/feed`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: advisory.content,
        access_token: config.page_access_token,
      }),
    }
  );

  const result = await response.json();

  // Update autopublish record
  await supabase
    .from('facebook_autopublish')
    .update({
      fb_post_id: result.id,
      published_at: new Date().toISOString(),
      status: 'published',
    })
    .eq('advisory_id', advisory.id);
}
```

### 7. Testing with ngrok

For local development:
```bash
ngrok http 3000
# Use the ngrok URL as your webhook callback
# Example: https://abc123.ngrok.io/api/facebook/webhook
```

### 8. Keyword Management

Admins can add/edit keywords in the `facebook_keywords` table via SQL or build an admin UI.

## Security Notes

1. **Never commit** access tokens or app secrets
2. Validate webhook signatures in production
3. Use HTTPS for webhook endpoints
4. Implement rate limiting
5. Store sensitive data in Supabase secrets or environment variables

## Monitoring

Check the `facebook_posts` table for incoming posts:
```sql
SELECT * FROM facebook_posts WHERE status = 'pending' ORDER BY created_at DESC;
```

## Troubleshooting

1. **Webhook not receiving events**: Check App Dashboard > Webhooks, verify subscription
2. **Verification fails**: Ensure verify token matches exactly
3. **No posts detected**: Check keyword configuration and test with sample posts
4. **Token expired**: Regenerate page access token (they expire every 60 days)

## Next Steps

1. Build admin UI for keyword management
2. Implement sentiment analysis
3. Add location extraction from posts
4. Create moderation workflow
5. Set up automated responses
