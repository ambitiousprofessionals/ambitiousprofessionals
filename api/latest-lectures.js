// /api/latest-lectures — returns the channel's 10 latest YouTube uploads as JSON.
// No YouTube API key needed: we read the channel's public RSS feed (YouTube publishes one for every channel).
//
// WHY THIS WAS SHOWING "No videos available" AT SOME HOURS:
// there is no time-of-day rule anywhere. When Vercel's saved copy of the answer ran out (and nobody had
// visited for a while), the very next visitor made this function ask YouTube live — and YouTube's servers
// sometimes refuse or time out on those requests. This version:
//   1. can skip the "find the channel" step completely if you paste the channel ID below (most reliable),
//   2. otherwise finds it with several tries and remembers it,
//   3. retries the video feed, with a time limit on every request,
//   4. keeps the last good list in memory and serves it if YouTube fails,
//   5. lets Vercel keep a good answer for a week (refreshing it quietly in the background every hour).

// OPTIONAL BUT BEST: paste your channel ID here (it starts with "UC"). Find it in YouTube Studio ->
// Settings -> Channel -> Advanced settings -> "Channel ID". Leave '' to look it up automatically.
var CHANNEL_ID = '';
var CHANNEL_HANDLE = 'AMBITIOUSPROFESSIONALS';

var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
var cachedChannelId = null;   // remembered while this server instance stays warm
var lastGoodVideos = null;

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function fetchWithTimeout(url, options, ms) {
  var ctl = new AbortController();
  var timer = setTimeout(function () { ctl.abort(); }, ms || 8000);
  return fetch(url, Object.assign({ signal: ctl.signal }, options || {})).finally(function () { clearTimeout(timer); });
}

module.exports = async function handler(req, res) {
  var videos = [];
  try {
    var channelId = await getChannelId();
    if (channelId) {
      for (var i = 0; i < 3 && videos.length === 0; i++) {
        try { videos = await fetchVideos(channelId); } catch (e) { videos = []; }
        if (videos.length === 0) await sleep(500 * (i + 1));
      }
    }
  } catch (err) {
    videos = [];
  }

  if (videos.length > 0) {
    lastGoodVideos = videos;
    // keep a good answer for a week; Vercel refreshes it quietly in the background once it is an hour old
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=604800');
  } else if (lastGoodVideos) {
    videos = lastGoodVideos;                       // YouTube hiccup: serve the last good list for a moment
    res.setHeader('Cache-Control', 's-maxage=60');
  } else {
    res.setHeader('Cache-Control', 'no-store');    // never save an empty answer
  }
  res.status(200).json({ videos: videos });
};

async function getChannelId() {
  if (CHANNEL_ID) return CHANNEL_ID;
  if (cachedChannelId) return cachedChannelId;
  for (var attempt = 0; attempt < 3; attempt++) {
    try {
      var id = await resolveChannelId(CHANNEL_HANDLE);
      if (id) { cachedChannelId = id; return id; }
    } catch (e) { /* try again */ }
    await sleep(400 * (attempt + 1));
  }
  return null;
}

async function fetchVideos(channelId) {
  var feedResp = await fetchWithTimeout('https://www.youtube.com/feeds/videos.xml?channel_id=' + channelId, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' }
  }, 8000);
  if (!feedResp.ok) return [];
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
  var resp = await fetchWithTimeout('https://www.youtube.com/@' + handle, {
    headers: {
      'User-Agent': UA,
      'Accept-Language': 'en-US,en;q=0.9',
      // tells YouTube the cookie pop-up was already answered, so it returns the real page
      'Cookie': 'CONSENT=YES+1; SOCS=CAI'
    }
  }, 8000);
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
