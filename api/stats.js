// CUSTOM CONFIGURATION
const BG_IMAGE_URL = 'https://raw.githubusercontent.com/LinuxFinn/anilist-card/main/1266658.jpg'; // Direct raw repo link
const CUSTOM_BIO = 'Just a guy whole fell in love with the Eastern way of storytelling.'; // Fallback bio if empty on AniList

// Helper to escape special XML characters for SVG compliance
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function fetchAniListStats(username) {
  const query = `
    query ($username: String) {
      User(name: $username) {
        name
        about
        avatar { large }
        statistics {
          anime {
            count
            episodesWatched
            minutesWatched
            meanScore
          }
          manga {
            count
            chaptersRead
            volumesRead
            meanScore
          }
        }
        favourites {
          anime(page: 1, perPage: 3) {
            nodes {
              title { 
                english
                romaji
              }
              coverImage { medium }
            }
          }
          manga(page: 1, perPage: 3) {
            nodes {
              title { 
                english
                romaji
              }
              coverImage { medium }
            }
          }
          characters(page: 1, perPage: 3) {
            nodes {
              name { 
                first
                last
                full
              }
              image { medium }
            }
          }
          staff(page: 1, perPage: 3) {
            nodes {
              name { 
                first
                last
                full
              }
              image { medium }
            }
          }
        }
      }
    }
  `;

  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables: { username } }),
  });

  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || 'User not found');
  return json.data.User;
}

export default async function handler(req, res) {
  try {
    const username = req.query?.username || 'LinuxFinn';
    const user = await fetchAniListStats(username);

    // Anime Stats
    const animeCount = user?.statistics?.anime?.count || 0;
    const episodes = user?.statistics?.anime?.episodesWatched || 0;
    const animeDays = ( (user?.statistics?.anime?.minutesWatched || 0) / 1440 ).toFixed(1);
    const animeMean = user?.statistics?.anime?.meanScore || 0;

    // Manga Stats
    const mangaCount = user?.statistics?.manga?.count || 0;
    const chapters = user?.statistics?.manga?.chaptersRead || 0;
    const volumes = user?.statistics?.manga?.volumesRead || 0;
    const mangaMean = user?.statistics?.manga?.meanScore || 0;

    // Favorites
    const animeList = user?.favourites?.anime?.nodes || [];
    const mangaList = user?.favourites?.manga?.nodes || [];
    const characterList = user?.favourites?.characters?.nodes || [];
    const staffList = user?.favourites?.staff?.nodes || [];

    // Clean bio (strip markdown/HTML tags and escape XML)
    const rawBio = user?.about ? user.about.replace(/<[^>]*>?/gm, '').replace(/[\r\n]+/g, ' ') : CUSTOM_BIO;
    const truncatedBio = rawBio.length > 70 ? rawBio.substring(0, 67) + '...' : rawBio;
    const bioText = escapeXml(truncatedBio);

    // Formatting Name Helper
    const getFormattedName = (item, isPerson) => {
      if (isPerson) {
        const first = item?.name?.first;
        const last = item?.name?.last;
        return (first && last) ? `${first} ${last}` : (item?.name?.full || 'N/A');
      }
      return item?.title?.english || item?.title?.romaji || 'N/A';
    };

    // Helper for multiline wrapping titles
    const renderWrappedTitle = (text, x) => {
      const maxCharsPerLine = 15;
      
      if (text.length <= maxCharsPerLine) {
        return `<text x="${x}" y="18" fill="#ffffff" font-size="11" font-weight="bold" font-family="sans-serif">${escapeXml(text)}</text>`;
      }

      const words = text.split(' ');
      let line1 = '';
      let line2 = '';
      
      for (const word of words) {
        if ((line1 + word).length <= maxCharsPerLine) {
          line1 += (line1 ? ' ' : '') + word;
        } else {
          line2 += (line2 ? ' ' : '') + word;
        }
      }
      
      if (line2.length > maxCharsPerLine) {
        line2 = line2.substring(0, maxCharsPerLine - 3) + '...';
      }

      return `
        <text x="${x}" y="14" fill="#ffffff" font-size="10" font-weight="bold" font-family="sans-serif">${escapeXml(line1)}</text>
        <text x="${x}" y="26" fill="#ffffff" font-size="10" font-weight="bold" font-family="sans-serif">${escapeXml(line2)}</text>
      `;
    };

    // Render Items with unique category prefixes for unique clipPath IDs
    const renderItems = (items, categoryPrefix, isPerson = false) => {
      const ranks = ['1st', '2nd', '3rd'];
      return items.slice(0, 3).map((item, idx) => {
        const title = getFormattedName(item, isPerson);
        const sub = ranks[idx] || '';
        const img = escapeXml(item?.coverImage?.medium || item?.image?.medium || '');
        const y = idx * 56;
        
        // Dimensions for circles vs rectangular media covers
        const imgWidth = isPerson ? 36 : 32;
        const imgHeight = isPerson ? 36 : 46;
        const clipId = `clip-${categoryPrefix}-${idx}`;

        return `
          <g transform="translate(0, ${y})">
            ${img ? `
              <clipPath id="${clipId}">
                ${isPerson ? `<circle cx="18" cy="18" r="18"/>` : `<rect width="${imgWidth}" height="${imgHeight}" rx="4"/>`}
              </clipPath>
              <image href="${img}" width="${imgWidth}" height="${imgHeight}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>
            ` : ''}
            ${renderWrappedTitle(title, 44)}
            <text x="44" y="38" fill="#e2e8f0" font-size="10" font-family="sans-serif">${sub}</text>
          </g>
        `;
      }).join('');
    };

    const svg = `
      <svg width="940" height="430" viewBox="0 0 940 430" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="card-clip">
            <rect width="940" height="430" rx="16"/>
          </clipPath>
        </defs>

        <g clip-path="url(#card-clip)">
          <!-- Background Image (Widescreen 16:9 ratio) -->
          ${BG_IMAGE_URL ? `<image href="${escapeXml(BG_IMAGE_URL)}" width="940" height="430" preserveAspectRatio="xMidYMid slice"/>` : ''}
          
          <!-- Dimming Layer -->
          <rect width="940" height="430" fill="#000000" fill-opacity="0.45"/>
          <rect width="940" height="430" rx="16" stroke="#ffffff" stroke-opacity="0.15"/>

          <!-- Header -->
          <g transform="translate(24, 20)">
            ${user?.avatar?.large ? `
              <clipPath id="avatar-clip"><circle cx="24" cy="24" r="24"/></clipPath>
              <image href="${escapeXml(user.avatar.large)}" x="0" y="0" width="48" height="48" clip-path="url(#avatar-clip)"/>
            ` : ''}
            <text x="60" y="24" fill="#ffffff" font-size="20" font-weight="bold" font-family="sans-serif">${escapeXml(user?.name || username)}</text>
            <text x="60" y="40" fill="#e2e8f0" font-size="11" font-family="sans-serif">${bioText}</text>
            
            <circle cx="760" cy="16" r="4" fill="#4ade80"/>
            <text x="772" y="20" fill="#4ade80" font-size="11" font-weight="bold" font-family="sans-serif" letter-spacing="0.5">SYNCED WITH ANILIST</text>
          </g>

          <!-- Stacked Overall Stats Bar -->
          <g transform="translate(24, 82)">
            <rect width="892" height="88" rx="10" fill="#000000" fill-opacity="0.35" stroke="#ffffff" stroke-opacity="0.12"/>
            
            <!-- Anime Row -->
            <g transform="translate(16, 12)">
              <text x="0" y="16" fill="#38bdf8" font-size="10" font-weight="bold" font-family="sans-serif">ANIME</text>
              
              <text x="130" y="14" fill="#38bdf8" font-size="14" font-weight="bold" font-family="sans-serif">${animeCount}</text>
              <text x="130" y="26" fill="#e2e8f0" font-size="9" font-family="sans-serif">Total Anime</text>

              <text x="320" y="14" fill="#38bdf8" font-size="14" font-weight="bold" font-family="sans-serif">${episodes.toLocaleString()}</text>
              <text x="320" y="26" fill="#e2e8f0" font-size="9" font-family="sans-serif">Episodes</text>

              <text x="520" y="14" fill="#38bdf8" font-size="14" font-weight="bold" font-family="sans-serif">${animeDays}</text>
              <text x="520" y="26" fill="#e2e8f0" font-size="9" font-family="sans-serif">Days Watched</text>

              <text x="720" y="14" fill="#38bdf8" font-size="14" font-weight="bold" font-family="sans-serif">${animeMean}</text>
              <text x="720" y="26" fill="#e2e8f0" font-size="9" font-family="sans-serif">Mean Score</text>
            </g>

            <line x1="16" y1="46" x2="876" y2="46" stroke="#ffffff" stroke-opacity="0.1"/>

            <!-- Manga Row -->
            <g transform="translate(16, 52)">
              <text x="0" y="16" fill="#34d399" font-size="10" font-weight="bold" font-family="sans-serif">MANGA</text>

              <text x="130" y="14" fill="#34d399" font-size="14" font-weight="bold" font-family="sans-serif">${mangaCount}</text>
              <text x="130" y="26" fill="#e2e8f0" font-size="9" font-family="sans-serif">Total Manga</text>

              <text x="320" y="14" fill="#34d399" font-size="14" font-weight="bold" font-family="sans-serif">${chapters.toLocaleString()}</text>
              <text x="320" y="26" fill="#e2e8f0" font-size="9" font-family="sans-serif">Chapters</text>

              <text x="520" y="14" fill="#34d399" font-size="14" font-weight="bold" font-family="sans-serif">${volumes.toLocaleString()}</text>
              <text x="520" y="26" fill="#e2e8f0" font-size="9" font-family="sans-serif">Volumes</text>

              <text x="720" y="14" fill="#34d399" font-size="14" font-weight="bold" font-family="sans-serif">${mangaMean}</text>
              <text x="720" y="26" fill="#e2e8f0" font-size="9" font-family="sans-serif">Mean Score</text>
            </g>
          </g>

          <!-- Content Columns (4 Columns layout) -->
          <g transform="translate(24, 192)">
            <!-- Top Anime -->
            <g transform="translate(0, 0)">
              <text x="0" y="15" fill="#e2e8f0" font-size="11" font-weight="bold" font-family="sans-serif">TOP 3 ANIME</text>
              <g transform="translate(0, 30)">
                ${renderItems(animeList, 'anime', false)}
              </g>
            </g>

            <!-- Top Manga -->
            <g transform="translate(225, 0)">
              <text x="0" y="15" fill="#e2e8f0" font-size="11" font-weight="bold" font-family="sans-serif">TOP 3 MANGA</text>
              <g transform="translate(0, 30)">
                ${renderItems(mangaList, 'manga', false)}
              </g>
            </g>

            <!-- Top Characters -->
            <g transform="translate(450, 0)">
              <text x="0" y="15" fill="#e2e8f0" font-size="11" font-weight="bold" font-family="sans-serif">TOP 3 CHARACTERS</text>
              <g transform="translate(0, 30)">
                ${renderItems(characterList, 'char', true)}
              </g>
            </g>

            <!-- Top Staff -->
            <g transform="translate(675, 0)">
              <text x="0" y="15" fill="#e2e8f0" font-size="11" font-weight="bold" font-family="sans-serif">TOP 3 STAFF</text>
              <g transform="translate(0, 30)">
                ${renderItems(staffList, 'staff', true)}
              </g>
            </g>
          </g>
        </g>
      </svg>
    `;

    // Force browsers and Vercel CDN not to cache stale data
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader(
      'Cache-Control',
      'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).send(svg);
  } catch (error) {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(500).send(`Error: ${error.message}`);
  }
}
