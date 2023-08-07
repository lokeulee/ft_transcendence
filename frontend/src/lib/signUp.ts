import { User } from '@/types/UserTypes';

export default async function signUp(
  username: string,
  refresh_token: string,
  avatar_url: string,
): Promise<User> {
  return await fetch(process.env.NEXT_PUBLIC_HOST_URL + ':4242/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: username,
      refresh_token: refresh_token,
      avatar_url: avatar_url,
    }),
  })
    .then((res) => res.json())
    .catch((error) => console.log(error));
}
