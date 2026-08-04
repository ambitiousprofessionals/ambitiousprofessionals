// /api/latest-lectures — returns the channel's 10 latest YouTube uploads as JSON.
// No YouTube API key needed: we resolve the @handle to its channel ID once, then
// read the channel's public RSS feed (YouTube publishes one for every channel).
// Vercel edge-caches the response for an hour, so this rarely re-hits YouTube.

var CHANNEL_HANDLE = 'AMBITIOUSPROFESSIONALS';

module.exports = async function handler(req, res) {
  try {
    var channelId = await resolveChannelId(CHANNEL_HANDLE);
    if (!channelId) {
      res.status(502).json({ error: 'Could not resolve channel ID from handle.' });
      return;
    }

    var videos = await fetchVideos(channelId);
    // Retry once more if the first attempt came back empty — YouTube's feed
    // endpoint is occasionally flaky, and an empty result is cheap to retry.
    if (videos.length === 0) {
      videos = await fetchVideos(channelId);
    }

    if (videos.length > 0) {
      // Only cache a GOOD result — never cache an empty/failed one, so a
      // temporary hiccup can't get stuck being served for an hour.
      res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
    res.status(200).json({ videos: videos });
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(500).json({ error: 'Failed to load latest lectures.', detail: String(err) });
  }
};

async function fetchVideos(channelId) {
  var feedResp = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=' + channelId);
  var feedXml = await feedResp.text();

  var entries = Array.from(feedXml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)).slice(0, 10);
  return entries.map(function (m) {
    var entry = m[1];
    var idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    var titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    var videoId = idMatch ? idMatch[1] : null;
    var title = titleMatch ? titleMatch[1] : '';
    return {
      id: videoId,
      title: title.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
      url: 'https://www.youtube.com/watch?v=' + videoId,
      thumbnail: 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg'
    };
  }).filter(function (v) { return v.id; });
}

async function resolveChannelId(handle) {
  var resp = await fetch('https://www.youtube.com/@' + handle, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });
  var html = await resp.text();

  // Try a few different patterns — YouTube's page markup shifts over time.
  var patterns = [
    /"channelId":"(UC[a-zA-Z0-9_-]{22})"/,
    /"externalId":"(UC[a-zA-Z0-9_-]{22})"/,
    /<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})">/,
    /channel\/(UC[a-zA-Z0-9_-]{22})/
  ];
  for (var i = 0; i < patterns.length; i++) {
    var match = html.match(patterns[i]);
    if (match) return match[1];
  }
  return null;
}
