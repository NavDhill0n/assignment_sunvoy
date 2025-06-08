import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import axios from 'axios';

async function getGeneratedCheckcode() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  let interceptedRequestBody = '';
  let interceptedHeaders: any = {};
  let credentialsCaptured = false;

  const waitForIntercept = new Promise<void>((resolve) => {
    page.on('request', async (request) => {
      if (
        request.url().includes('/api/settings') &&
        request.method() === 'POST' &&
        !credentialsCaptured
      ) {
        interceptedRequestBody = request.postData() || '';
        interceptedHeaders = request.headers();

        const params = new URLSearchParams(interceptedRequestBody);
        const checkcode = params.get('checkcode') || '';
        const accessToken = params.get('access_token') || '';

        console.log('Request Body:', interceptedRequestBody);
        console.log('Extracted checkcode:', checkcode);
        console.log('Extracted access_token:', accessToken);

        credentialsCaptured = true;
        resolve();
      }
      request.continue();
    });
  });

  await page.goto('https://challenge.sunvoy.com/login', { waitUntil: 'networkidle2' });
  await page.type('input[name="username"]', 'demo@example.org');
  await page.type('input[name="password"]', 'test');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });


  await Promise.race([
    waitForIntercept,
    new Promise((_, reject) => setTimeout(() => reject('Timeout waiting for intercepted request'), 15000))
  ]);

  await browser.close();

  try {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': '*/*',
      'Origin': 'https://challenge.sunvoy.com',
      'Referer': 'https://challenge.sunvoy.com/',
    };

    const response = await axios.post(
      'https://api.challenge.sunvoy.com/api/settings',
      interceptedRequestBody,
      { headers }
    );

    console.log('Response:', response.data);
    await fs.writeFile('settings.json', JSON.stringify(response.data, null, 2));
    console.log('Saved response to settings.json');
  } catch (err: any) {
    console.error('Request failed:', err.response?.data || err.message);
  }
}

getGeneratedCheckcode().catch((err) => {
  console.error('Error:', err);
});
