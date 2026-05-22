export default async function handler(req, res) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const userId = process.env.DISCORD_USER_ID || '587056027464105994';

  if (!token) {
    return res.status(200).json({ error: 'no token configured' });
  }

  try {
    const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: { Authorization: `Bot ${token}` },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'discord api error' });
    }

    const data = await response.json();

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

    return res.status(200).json({
      avatar: data.avatar || null,
      banner: data.banner || null,
      accent_color: data.accent_color || null,
      global_name: data.global_name || null,
      username: data.username || null,
    });
  } catch {
    return res.status(200).json({ error: 'fetch failed' });
  }
}
