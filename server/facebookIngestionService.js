// import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Exchanges a short-lived token for a permanent (never-expiring) Page Access Token.
 */
export async function exchangeForPermanentPageToken(inputToken) {
  const appId = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  const pageId = process.env.FB_PAGE_ID;

  if (!appId || !appSecret || !pageId || !inputToken) {
    return inputToken;
  }

  try {
    console.log('🔄 [FB Token Exchange] Exchanging token for permanent Page Access Token...');
    // Step 1: Exchange for long-lived user token (valid for 60 days)
    const exchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${inputToken}`;
    const res1 = await fetch(exchangeUrl);
    const data1 = await res1.json();

    if (data1.access_token) {
      const longLivedUserToken = data1.access_token;
      // Step 2: Use long-lived user token to obtain the Page Access Token (which NEVER expires)
      const pageUrl = `https://graph.facebook.com/v19.0/${pageId}?fields=access_token&access_token=${longLivedUserToken}`;
      const res2 = await fetch(pageUrl);
      const data2 = await res2.json();

      if (data2.access_token) {
        console.log('💎 [FB Token Exchange] Success! Acquired permanent Page Access Token that never expires.');
        // Update current process env
        process.env.FB_PAGE_ACCESS_TOKEN = data2.access_token;

        // Persist to .env file automatically
        try {
          const envPath = path.resolve(process.cwd(), '.env');
          if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            envContent = envContent.replace(
              /FB_PAGE_ACCESS_TOKEN=.*/,
              `FB_PAGE_ACCESS_TOKEN=${data2.access_token}`
            );
            fs.writeFileSync(envPath, envContent, 'utf8');
            console.log('💾 [FB Token Exchange] Permanent token saved to .env file.');
          }
        } catch (fileErr) {
          console.warn('Could not auto-write to .env:', fileErr.message);
        }

        return data2.access_token;
      }
    } else {
      console.warn('⚠️ [FB Token Exchange] Warning from Meta:', data1.error?.message || data1);
    }
  } catch (err) {
    console.error('❌ [FB Token Exchange] Error during exchange:', err.message);
  }

  return inputToken;
}

/**
 * Transforms and cleans raw Facebook post data into an Official CLIMA Advisory
 * - Normalizes Unicode bold/styled characters to clean plain text
 * - Strips target hashtag
 * - Extracts a clean Title
 * - Detects Category for CLIMA's Live Feed filter tabs
 * - Sets issuing agency (default: Palayan City ICT Division)
 * - Embeds image via CLIMA's native [IMAGE_URL: url] tag
 */
export function modifyFacebookPost(
  rawText,
  imageUrl = null,
  targetHashtag = '#PalayanAdvisoryElNino',
  agencyName = 'Palayan City ICT Division'
) {
  if (!rawText) return null;

  // 1. Normalize Unicode mathematical alphanumeric/bold characters (e.g. 𝗠𝗮𝗸𝗮𝗸𝗮𝗿𝗮𝗻𝗮𝘀 -> Makakaranas)
  const normalizedText = rawText.normalize('NFKD');

  // 2. Remove the trigger hashtags (case-insensitive) and clean formatting
  const hashtagRegex = new RegExp(targetHashtag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  let cleanContent = normalizedText
    .replace(hashtagRegex, '')
    .replace(/#SuperElNino/gi, '')
    .trim();

  // 3. Extract a clean Title from the first line or headline
  const lines = cleanContent.split('\n').map(l => l.trim()).filter(Boolean);
  let title = lines[0] || 'Official Community Advisory';
  title = title.replace(/^[#*•\-\s]+/, '').replace(/#[a-zA-Z0-9_]+/g, '').trim();
  if (title.length > 80) {
    title = title.substring(0, 77).trim() + '...';
  }

  // 4. Auto-detect CLIMA Category
  const lower = normalizedText.toLowerCase();
  let category = 'Extreme Heat'; // Default

  if (
    lower.includes('heat index') ||
    lower.includes('matinding init') ||
    lower.includes('el nino') ||
    lower.includes('el niño') ||
    lower.includes('pagasa') ||
    lower.includes('suspensyon') ||
    lower.includes('walang pasok') ||
    lower.includes('init') ||
    lower.includes('heat') ||
    lower.includes('panahon') ||
    lower.includes('maulap')
  ) {
    category = 'Extreme Heat';
  } else if (
    lower.includes('water supply') ||
    lower.includes('suplay ng tubig') ||
    lower.includes('water district') ||
    lower.includes('water interruption') ||
    lower.includes('kawalan ng tubig') ||
    lower.includes('nawalan ng tubig')
  ) {
    category = 'Water Supply';
  } else if (
    lower.includes('power interruption') ||
    lower.includes('power outage') ||
    lower.includes('kuryente') ||
    lower.includes('neeco') ||
    lower.includes('brownout') ||
    lower.includes('blackout')
  ) {
    category = 'Power Interruption';
  } else if (
    lower.includes('sunog') ||
    lower.includes('fire safety') ||
    lower.includes('fire alert') ||
    lower.includes('bfp')
  ) {
    category = 'Fire Safety';
  } else if (
    lower.includes('kalusugan') ||
    lower.includes('public health') ||
    lower.includes('hospital') ||
    lower.includes('clinic') ||
    lower.includes('doh') ||
    lower.includes('dengue') ||
    lower.includes('heat stroke')
  ) {
    category = 'Public Health';
  }

  // 5. Embed Agency tag (so CLIMA feed specifically shows "Palayan City ICT Division")
  let formattedContent = cleanContent;
  if (agencyName && !formattedContent.includes('[AGENCY:')) {
    formattedContent = `[AGENCY: ${agencyName}]\n\n${formattedContent}`;
  }

  // 6. Attach image in CLIMA feed format (native without iframes)
  if (imageUrl && !formattedContent.includes('[IMAGE_URL:')) {
    formattedContent = `${formattedContent}\n\n[IMAGE_URL: ${imageUrl}]`;
  }

  return {
    title,
    content: formattedContent,
    category,
    cleanText: cleanContent
  };
}

/**
 * Inserts a modified Facebook post into Supabase 'advisories' as 'Published'
 */
export async function saveModifiedAdvisory({
  rawText,
  imageUrl = null,
  publishedAt = null,
  targetHashtag = '#PalayanAdvisoryElNino',
  agencyName = 'Palayan City ICT Division'
}) {
  if (!rawText) {
    return { success: false, reason: 'Empty text' };
  }

  // Normalize before checking hashtag
  const normalized = rawText.normalize('NFKD');

  // Verify that the post actually includes the required hashtag
  if (!normalized.toLowerCase().includes(targetHashtag.toLowerCase())) {
    return { success: false, action: 'ignored', reason: 'Missing target hashtag' };
  }

  const modified = modifyFacebookPost(rawText, imageUrl, targetHashtag, agencyName);
  if (!modified || !modified.title) {
    return { success: false, reason: 'Failed to parse post' };
  }

  // Duplicate check by title
  const { data: existing, error: selectError } = await supabaseAdmin
    .from('advisories')
    .select('id, title')
    .ilike('title', `%${modified.title.slice(0, 40)}%`)
    .limit(1);

  if (selectError) {
    console.error('Check duplicate advisory error:', selectError.message);
  }

  if (existing && existing.length > 0) {
    // If it exists, update it to ensure high-res image and agency tag are present!
    await supabaseAdmin
      .from('advisories')
      .update({
        content: modified.content,
        category: modified.category,
        published_at: publishedAt || new Date().toISOString()
      })
      .eq('id', existing[0].id);

    return { success: true, action: 'updated', title: modified.title, existingId: existing[0].id };
  }

  // Insert directly into 'advisories' as 'Published'
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('advisories')
    .insert({
      title: modified.title,
      content: modified.content,
      category: modified.category,
      status: 'Published',
      published_at: publishedAt || new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    console.error('Failed to insert advisory:', insertError.message);
    return { success: false, error: insertError.message };
  }

  console.log(`📢 [FB Ingest] Published advisory: "${modified.title}" under [${modified.category}]`);
  return { success: true, action: 'inserted', advisory: inserted };
}

/**
 * Syncs Facebook Page posts directly via the official Meta Graph API.
 */
export async function syncFacebookPageViaGraphApi({
  pageId = process.env.FB_PAGE_ID,
  accessToken = process.env.FB_PAGE_ACCESS_TOKEN,
  targetHashtag = process.env.FB_TARGET_HASHTAG || '#PalayanAdvisoryElNino',
  limit = 25
} = {}) {
  let activeToken = accessToken;

  if (!pageId || !activeToken) {
    console.warn('⚠️ [FB Graph API] Missing FB_PAGE_ID or FB_PAGE_ACCESS_TOKEN in env.');
    return { success: false, reason: 'Missing credentials' };
  }

  console.log(`📡 [FB Graph API] Syncing posts for Page ID ${pageId} with hashtag "${targetHashtag}"...`);

  try {
    let url = `https://graph.facebook.com/v19.0/${pageId}/posts?fields=id,message,created_time,full_picture,permalink_url&limit=${limit}&access_token=${activeToken}`;
    let res = await fetch(url);
    let data = await res.json();

    // If token expired, attempt exchange for permanent token
    if (!res.ok || data.error) {
      if (data.error?.code === 190) {
        console.warn('⚠️ [FB Graph API] Token expired! Attempting exchange...');
        activeToken = await exchangeForPermanentPageToken(activeToken);
        url = `https://graph.facebook.com/v19.0/${pageId}/posts?fields=id,message,created_time,full_picture,permalink_url&limit=${limit}&access_token=${activeToken}`;
        res = await fetch(url);
        data = await res.json();
      }

      if (!res.ok || data.error) {
        console.error('❌ [FB Graph API Error]:', data.error?.message || data.error);
        return { success: false, error: data.error };
      }
    }

    const posts = data.data || [];
    console.log(`🔍 [FB Graph API] Found ${posts.length} latest posts from Facebook.`);

    let inserted = 0;
    let updated = 0;
    let matching = 0;

    for (const post of posts) {
      if (!post.message) continue;

      const normText = post.message.normalize('NFKD');
      if (normText.toLowerCase().includes(targetHashtag.toLowerCase())) {
        matching++;
        const saveRes = await saveModifiedAdvisory({
          rawText: post.message,
          imageUrl: post.full_picture || null,
          publishedAt: post.created_time || new Date().toISOString(),
          targetHashtag,
          agencyName: 'Palayan City ICT Division'
        });

        if (saveRes.action === 'inserted') {
          inserted++;
          console.log(`✅ [FB Graph API] Successfully published: "${saveRes.advisory?.title}"`);
        } else if (saveRes.action === 'updated') {
          updated++;
          console.log(`🔄 [FB Graph API] Updated existing advisory with fresh media: "${saveRes.title}"`);
        }
      }
    }

    console.log(`🏁 [FB Graph API] Sync finished: ${matching} matching posts found (${inserted} inserted, ${updated} updated).`);
    return {
      success: true,
      totalChecked: posts.length,
      matchingPosts: matching,
      newlyPublished: inserted,
      updated
    };
  } catch (err) {
    console.error('❌ [FB Graph API Exception]:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fallback: Scrapes a public Facebook page using Playwright without any iframe or widget.
 */
export async function scrapeFacebookPage({
  pageUrl = 'https://www.facebook.com/PalayanCityOfficial',
  targetHashtag = '#PalayanAdvisoryElNino'
} = {}) {
  console.log(`🤖 [FB Scraper] Starting fallback headless scrape on ${pageUrl} for ${targetHashtag}...`);
  let browser = null;

  try {
    let pw;
    try {
      pw = await import('playwright');
    } catch {
      console.warn('⚠️ [FB Scraper] Playwright not installed; skipping headless scrape.');
      return { success: false, error: 'Playwright not installed in environment' };
    }
    const chromium = pw.chromium;
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'en-US'
    });

    const page = await context.newPage();
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForTimeout(4000);

    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(2500);

    const extractedPosts = await page.evaluate((hashtag) => {
      const results = [];
      const containers = document.querySelectorAll('div[dir="auto"]');

      containers.forEach(c => {
        const text = c.innerText || '';
        if (text.toLowerCase().includes(hashtag.toLowerCase())) {
          const parent = c.closest('div[role="article"]') || c.parentElement?.parentElement;
          const img = parent?.querySelector('img[src*="fbcdn"], img[src*="scontent"]');
          const imageUrl = img ? img.src : null;

          results.push({
            text,
            imageUrl
          });
        }
      });
      return results;
    }, targetHashtag);

    console.log(`🔍 [FB Scraper] Extracted ${extractedPosts.length} matching candidate posts.`);

    let inserted = 0;
    for (const p of extractedPosts) {
      const res = await saveModifiedAdvisory({
        rawText: p.text,
        imageUrl: p.imageUrl,
        targetHashtag,
        agencyName: 'Palayan City ICT Division'
      });
      if (res.action === 'inserted') inserted++;
    }

    return { success: true, count: inserted, candidates: extractedPosts.length };
  } catch (err) {
    console.error('❌ [FB Scraper Error]:', err.message);
    return { success: false, error: err.message };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
