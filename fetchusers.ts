import fetch from 'node-fetch';
import fs from 'fs/promises'; 
import dotenv from 'dotenv';

dotenv.config();

const user_List_Url='https://challenge.sunvoy.com/api/users';

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
}


async function fetchUsers(): Promise<User[]> {
  const response = await fetch(user_List_Url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Origin': 'https://challenge.sunvoy.com',
      'Referer': 'https://challenge.sunvoy.com/list',
      'Cookie':'user_preferences=eyJ0aGVtZSI6ImxpZ2h0IiwibGFuZ3VhZ2UiOiJlbiIsInRpbWV6b25lIjoiVVRDIiwibm90aWZpY2F0aW9ucyI6dHJ1ZX0%3D; feature_flags=eyJuZXdEYXNoYm9hcmQiOnRydWUsImJldGFGZWF0dXJlcyI6ZmFsc2UsImFkdmFuY2VkU2V0dGluZ3MiOnRydWUsImV4cGVyaW1lbnRhbFVJIjpmYWxzZX0%3D; tracking_consent=accepted; JSESSIONID=88163bc3-88f0-40b2-93d1-92c986853aab; _csrf_token=25450a83a265a54a63d59df5e201c5fe750c19859271bd13a36473dfe62763ac; analytics_id=analytics_66641bdf1981c69a14e32eca069dbb21; session_fingerprint=38801328bf70ecab0837e8198d26c0d5ca18a685090e5627df52061f8c30568a; device_id=device_91a6c4ef06284aca3dd2e68c' , 
    },
  });

  if (!response.ok) {
    console.error('ERROR',response.status);
    throw new Error('Failed to fetch users');
  }

  const users = (await response.json()) as User[];
  return users;
}

async function main() {
  try {
    const users = await fetchUsers();
    console.log('Users fetched:', users.length);
    await fs.writeFile('output.json', JSON.stringify(users, null, 2), 'utf-8');
    console.log('Users written to output.json');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
