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
const cookie =process.env.COOKIE;

async function fetchUsers(): Promise<User[]> {
  const response = await fetch(user_List_Url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Origin': 'https://challenge.sunvoy.com',
      'Referer': 'https://challenge.sunvoy.com/list',
      'Cookie': cookie!, 
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
