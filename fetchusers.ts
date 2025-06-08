import fetch from 'node-fetch';
import fs from 'fs/promises';
import puppeteer from 'puppeteer';
import axios from 'axios';

const user_List_Url = 'https://challenge.sunvoy.com/api/users';

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
}

interface CheckcodeData {
  settings: any;
  access_token: string;
  checkcode: string;
  userId: string;
}

async function getGeneratedCheckcode(): Promise<CheckcodeData> {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  let interceptedRequestBody = '';
  let access_token = '';
  let checkcode = '';
  let userId = '';

  const waitForIntercept = new Promise<void>((resolve) => {
    page.on('request', async (request) => {
      if (
        request.url().includes('/api/settings') &&
        request.method() === 'POST'
      ) {
        interceptedRequestBody = request.postData() || '';
        const params = new URLSearchParams(interceptedRequestBody);
        access_token = params.get('access_token') || '';
        checkcode = params.get('checkcode') || '';
        userId = params.get('userId') || '';

    
        console.log('access_token:', access_token);
        console.log('checkcode:', checkcode);

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
    new Promise((_, reject) => setTimeout(() => reject('Timeout waiting for intercepted request'), 15000)),
  ]);

  await browser.close();

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': '*/*',
    'Origin': 'https://challenge.sunvoy.com',
    'Referer': 'https://challenge.sunvoy.com/',
  };

  const settingsResponse = await axios.post(
    'https://api.challenge.sunvoy.com/api/settings',
    interceptedRequestBody,
    { headers }
  );

  return {
    settings: settingsResponse.data,
    access_token,
    checkcode,
    userId,
  };
}

async function fetchUsers(access_token: string, checkcode: string, userId: string): Promise<User[]> {
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const response = await fetch(user_List_Url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': '*/*',
      'Origin': 'https://challenge.sunvoy.com',
      'Referer': 'https://challenge.sunvoy.com/list',
      'Cookie':'user_preferences=eyJ0aGVtZSI6ImxpZ2h0IiwibGFuZ3VhZ2UiOiJlbiIsInRpbWV6b25lIjoiVVRDIiwibm90aWZpY2F0aW9ucyI6dHJ1ZX0%3D; feature_flags=eyJuZXdEYXNoYm9hcmQiOnRydWUsImJldGFGZWF0dXJlcyI6ZmFsc2UsImFkdmFuY2VkU2V0dGluZ3MiOnRydWUsImV4cGVyaW1lbnRhbFVJIjpmYWxzZX0%3D; tracking_consent=accepted; JSESSIONID=dc069a70-e86f-4ca2-b72e-e0eb09d78583; _csrf_token=cb90763ac7923869de9e178493eed4a6846df37be9a11713cfcc98232efc1bee; analytics_id=analytics_7a5f500588d3cdadc80aaf0bc456cd10; session_fingerprint=f052aef4f7b56e4585b2c0bee6238a793d79969fc0ce8bdf5fe19a1047296c4a; device_id=device_3cd040dfeae3c7cf187f421a' , 

    },
   
  });

  if (!response.ok) {
    console.error('ERROR', response.status);
    throw new Error('Failed to fetch users');
  }

  return (await response.json()) as User[];
}

async function main() {
  try {
    const { settings, access_token, checkcode, userId } = await getGeneratedCheckcode();
    const users = await fetchUsers(access_token, checkcode, userId);

    const combinedData = {
      settings,
      users,
    };

    await fs.writeFile('user.json', JSON.stringify(combinedData, null, 2), 'utf-8');
    console.log('Combined data saved to user.json');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
