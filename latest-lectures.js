// /api/latest-lectures — returns the channel's 10 latest YouTube uploads as JSON.
// No YouTube API key needed: we resolve the @handle to its channel ID once, then
// read the channel's public RSS feed (YouTube publishes one for every channel).
// Vercel edge-caches the response for an hour, so this rarely re-hits YouTube.

const CHANNEL_HANDLE = 'AMBITIOUSPROFESSIONALS';

export default async function handler(req, res) {
  try {
    // 1. Resolve @handle -> UC... channel ID by reading the channel page.
    const channelPageResp = await fetch(`https://www.youtube.com/@${CHANNEL_HANDLE}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const channelHtml = await channelPageResp.text();
    const idMatch = channelHtml.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/);

    if (!idMatch) {
      res.status(502).json({ error: 'Could not resolve channel ID from handle.' });
      return;
    }
    const channelId = idMatch[1];

    // 2. Fetch the channel's public uploads RSS feed (always the latest uploads, no key required).
    const feedResp = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
    const feedXml = await feedResp.text();

    // 3. Pull out each <entry> block and extract what we need with lightweight regex
    //    (avoids pulling in a full XML parser dependency for such a simple, fixed feed format).
    const entries = [...feedXml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 10);
    const videos = entries.map(([, entry]) => {
      const videoId = (entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1];
      const title = (entry.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
      return {
        id: videoId,
        title: title.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      };
    }).filter(v => v.id);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ videos });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load latest lectures.' });
  }
}
