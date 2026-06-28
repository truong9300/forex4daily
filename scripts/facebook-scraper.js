import { chromium } from 'playwright';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const FB_EMAIL = process.env.FB_EMAIL;
const FB_PASSWORD = process.env.FB_PASSWORD;
const POST_COUNT = parseInt(process.env.FB_POST_COUNT || '10', 10);

if (!FB_EMAIL || !FB_PASSWORD) {
  console.error('Missing FB_EMAIL or FB_PASSWORD in .env');
  process.exit(1);
}

async function scrapeFacebookFeed() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'vi-VN',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    console.log('Logging into Facebook...');
    await page.goto('https://www.facebook.com/login', { waitUntil: 'domcontentloaded' });

    await page.fill('#email', FB_EMAIL);
    await page.fill('#pass', FB_PASSWORD);
    await page.click('[name="login"]');

    await page.waitForURL((url) => !url.includes('/login'), { timeout: 15000 });
    console.log('Logged in successfully.');

    // Handle "Save login info" or checkpoint dialogs
    const skipBtn = page.locator('text=Not now, text=Skip, text=Bỏ qua').first();
    if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipBtn.click();
    }

    console.log('Loading newsfeed...');
    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const posts = [];

    while (posts.length < POST_COUNT) {
      const newPosts = await page.evaluate(() => {
        const results = [];
        // Facebook feed posts are inside role="feed" > article elements
        const articles = document.querySelectorAll('[role="feed"] > div');
        for (const article of articles) {
          const textEl = article.querySelector('[data-ad-comet-preview="message"], [dir="auto"]');
          const text = textEl ? textEl.innerText.trim() : '';

          const timeEl = article.querySelector('a[href*="/posts/"] abbr, a[href*="/permalink/"] abbr, abbr[data-utime]');
          const timestamp = timeEl ? (timeEl.getAttribute('data-utime') || timeEl.title || timeEl.innerText) : '';

          const authorEl = article.querySelector('h2 a, h3 a, strong a');
          const author = authorEl ? authorEl.innerText.trim() : '';

          const postLinkEl = article.querySelector('a[href*="/posts/"], a[href*="/permalink/"]');
          const link = postLinkEl ? postLinkEl.href : '';

          if (text || author) {
            results.push({ author, text, timestamp, link });
          }
        }
        return results;
      });

      // Merge deduplicating by link or text snippet
      for (const post of newPosts) {
        const isDuplicate = posts.some(
          (p) => (post.link && p.link === post.link) || (post.text && p.text === post.text)
        );
        if (!isDuplicate) {
          posts.push(post);
        }
        if (posts.length >= POST_COUNT) break;
      }

      if (posts.length < POST_COUNT) {
        await page.evaluate(() => window.scrollBy(0, 1500));
        await page.waitForTimeout(2000);
      }
    }

    const result = posts.slice(0, POST_COUNT);
    console.log(`\nScraped ${result.length} posts:\n`);

    result.forEach((post, i) => {
      console.log(`--- Post ${i + 1} ---`);
      if (post.author) console.log(`Author   : ${post.author}`);
      if (post.timestamp) console.log(`Time     : ${post.timestamp}`);
      if (post.text) console.log(`Content  : ${post.text.substring(0, 200)}${post.text.length > 200 ? '...' : ''}`);
      if (post.link) console.log(`Link     : ${post.link}`);
      console.log();
    });

    const outFile = join(__dirname, '..', 'facebook-posts.json');
    writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`Results saved to facebook-posts.json`);

    return result;
  } finally {
    await browser.close();
  }
}

scrapeFacebookFeed().catch((err) => {
  console.error('Scraper error:', err.message);
  process.exit(1);
});
