// CUSTOM CONFIGURATION
const BG_IMAGE_URL = 'https://raw.githubusercontent.com/LinuxFinn/assets/main/1266658.jpg'; // Change to your background URL
const CUSTOM_BIO = 'Anime & Manga Enthusiast'; // Fallback bio if empty on AniList

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
              episodes
            }
          }
          manga(page: 1, perPage: 3) {
            nodes {
              title { 
                english
                romaji
              }
              coverImage { medium }
              chapters
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

    // Clean bio (strip markdown/HTML tags and escape XML)
    const rawBio = user?.about ? user.about.replace(/<[^>]*>?/gm, '').replace(/[\r\n]+/g, ' ') : CUSTOM_BIO;
    const truncatedBio = rawBio.length > 55 ? rawBio.substring(0, 52) + '...' : rawBio;
    const bioText = escapeXml(truncatedBio);

    // Formatting Name Helper
    const getFormattedName = (item, isCharacter) => {
      if (isCharacter) {
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

    // Render Items
    const renderItems = (items, getType, isCharacter = false) => {
      return items.slice(0, 3).map((item, idx) => {
        const title = getFormattedName(item, isCharacter);
        const sub = escapeXml(getType(item));
        const img = escapeXml(item?.coverImage?.medium || item?.image?.medium || '');
        const y = idx * 56;

        return `
          <g transform="translate(0, ${y})">
            ${img ? `
              <clipPath id="clip-${isCharacter ? 'char' : 'media'}-${idx}">
                <rect width="${isCharacter ? '36' : '32'}" height="${isCharacter ? '36' : '46'}" rx="${isCharacter ? '18' : '4'}"/>
              </clipPath>
              <image href="${img}" width="${isCharacter ? '36' : '32'}" height="${isCharacter ? '36' : '46'}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-${isCharacter ? 'char' : 'media'}-${idx})"/>
            ` : ''}
            ${renderWrappedTitle(title, 44)}
            <text x="44" y="38" fill="#cbd5e1" font-size="10" font-family="sans-serif">${sub}</text>
          </g>
        `;
      }).join('');
    };

// CUSTOM CONFIGURATION
const BG_IMAGE_URL = 'https://raw.githubusercontent.com/LinuxFinn/assets/main/1266658.jpg'; // Change to your background URL
const CUSTOM_BIO = 'Anime & Manga Enthusiast'; // Fallback bio if empty on AniList

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
              episodes
            }
          }
          manga(page: 1, perPage: 3) {
            nodes {
              title { 
                english
                romaji
              }
              coverImage { medium }
              chapters
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

    // Clean bio (strip markdown/HTML tags and escape XML)
    const rawBio = user?.about ? user.about.replace(/<[^>]*>?/gm, '').replace(/[\r\n]+/g, ' ') : CUSTOM_BIO;
    const truncatedBio = rawBio.length > 55 ? rawBio.substring(0, 52) + '...' : rawBio;
    const bioText = escapeXml(truncatedBio);

    // Formatting Name Helper
    const getFormattedName = (item, isCharacter) => {
      if (isCharacter) {
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

    // Render Items
    const renderItems = (items, getType, isCharacter = false) => {
      return items.slice(0, 3).map((item, idx) => {
        const title = getFormattedName(item, isCharacter);
        const sub = escapeXml(getType(item));
        const img = escapeXml(item?.coverImage?.medium || item?.image?.medium || '');
        const y = idx * 56;

        return `
          <g transform="translate(0, ${y})">
            ${img ? `
              <clipPath id="clip-${isCharacter ? 'char' : 'media'}-${idx}">
                <rect width="${isCharacter ? '36' : '32'}" height="${isCharacter ? '36' : '46'}" rx="${isCharacter ? '18' : '4'}"/>
              </clipPath>
              <image href="${img}" width="${isCharacter ? '36' : '32'}" height="${isCharacter ? '36' : '46'}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-${isCharacter ? 'char' : 'media'}-${idx})"/>
            ` : ''}
            ${renderWrappedTitle(title, 44)}
            <text x="44" y="38" fill="#cbd5e1" font-size="10" font-family="sans-serif">${sub}</text>
          </g>
        `;
      }).join('');
    };

    const svg = `
      <svg width="740" height="430" viewBox="0 0 740 430" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="card-clip">
            <rect width="740" height="430" rx="16"/>
          </clipPath>
        </defs>

        <g clip-path="url(#card-clip)">
          <!-- Background Image -->
          ${BG_IMAGE_URL ? `<image href="${escapeXml(BG_IMAGE_URL)}" width="740" height="430" preserveAspectRatio="xMidYMid slice"/>` : ''}
          
          <!-- Translucent Dark Overlay (Adjust fill-opacity to tweak overall card transparency) -->
          <rect width="740" height="430" fill="#0b1120" fill-opacity="0.65"/>
          <rect width="740" height="430" rx="16" stroke="#ffffff" stroke-opacity="0.15"/>

          <!-- Header -->
          <g transform="translate(24, 20)">
            ${user?.avatar?.large ? `
              <clipPath id="avatar-clip"><circle cx="24" cy="24" r="24"/></clipPath>
              <image href="${escapeXml(user.avatar.large)}" x="0" y="0" width="48" height="48" clip-path="url(#avatar-clip)"/>
            ` : ''}
            <text x="60" y="24" fill="#ffffff" font-size="20" font-weight="bold" font-family="sans-serif">${escapeXml(user?.name || username)}</text>
            <text x="60" y="40" fill="#cbd5e1" font-size="11" font-family="sans-serif">${bioText}</text>
            
            <circle cx="560" cy="16" r="4" fill="#4ade80"/>
            <text x="572" y="20" fill="#4ade80" font-size="11" font-weight="bold" font-family="sans-serif" letter-spacing="0.5">SYNCED WITH ANILIST</text>
          </g>

          <!-- Stacked Overall Stats Bar (Semi-transparent background) -->
          <g transform="translate(24, 82)">
            <rect width="692" height="88" rx="10" fill="#000000" fill-opacity="0.3" stroke="#ffffff" stroke-opacity="0.1"/>
            
            <!-- Anime Row -->
            <g transform="translate(16, 12)">
              <text x="0" y="16" fill="#38bdf8" font-size="10" font-weight="bold" font-family="sans-serif">ANIME</text>
              
              <text x="110" y="14" fill="#38bdf8" font-size="14" font-weight="bold" font-family="sans-serif">${animeCount}</text>
              <text x="110" y="26" fill="#cbd5e1" font-size="9" font-family="sans-serif">Total Anime</text>

              <text x="250" y="14" fill="#38bdf8" font-size="14" font-weight="bold" font-family="sans-serif">${episodes.toLocaleString()}</text>
              <text x="250" y="26" fill="#cbd5e1" font-size="9" font-family="sans-serif">Episodes</text>

              <text x="390" y="14" fill="#38bdf8" font-size="14" font-weight="bold" font-family="sans-serif">${animeDays}</text>
              <text x="390" y="26" fill="#cbd5e1" font-size="9" font-family="sans-serif">Days Watched</text>

              <text x="540" y="14" fill="#38bdf8" font-size="14" font-weight="bold" font-family="sans-serif">${animeMean}</text>
              <text x="540" y="26" fill="#cbd5e1" font-size="9" font-family="sans-serif">Mean Score</text>
            </g>

            <line x1="16" y1="46" x2="676" y2="46" stroke="#ffffff" stroke-opacity="0.1"/>

            <!-- Manga Row -->
            <g transform="translate(16, 52)">
              <text x="0" y="16" fill="#34d399" font-size="10" font-weight="bold" font-family="sans-serif">MANGA</text>

              <text x="110" y="14" fill="#34d399" font-size="14" font-weight="bold" font-family="sans-serif">${mangaCount}</text>
              <text x="110" y="26" fill="#cbd5e1" font-size="9" font-family="sans-serif">Total Manga</text>

              <text x="250" y="14" fill="#34d399" font-size="14" font-weight="bold" font-family="sans-serif">${chapters.toLocaleString()}</text>
              <text x="250" y="26" fill="#cbd5e1" font-size="9" font-family="sans-serif">Chapters</text>

              <text x="390" y="14" fill="#34d399" font-size="14" font-weight="bold" font-family="sans-serif">${volumes.toLocaleString()}</text>
              <text x="390" y="26" fill="#cbd5e1" font-size="9" font-family="sans-serif">Volumes</text>

              <text x="540" y="14" fill="#34d399" font-size="14" font-weight="bold" font-family="sans-serif">${mangaMean}</text>
              <text x="540" y="26" fill="#cbd5e1" font-size="9" font-family="sans-serif">Mean Score</text>
            </g>
          </g>

          <!-- Content Columns -->
          <g transform="translate(24, 192)">
            <!-- Top Anime -->
            <g transform="translate(0, 0)">
              <text x="0" y="15" fill="#cbd5e1" font-size="11" font-weight="bold" font-family="sans-serif">TOP 3 ANIME</text>
              <g transform="translate(0, 30)">
                ${renderItems(animeList, i => i?.episodes ? `${i.episodes} Eps` : 'N/A')}
              </g>
            </g>

            <!-- Top Manga -->
            <g transform="translate(230, 0)">
              <text x="0" y="15" fill="#cbd5e1" font-size="11" font-weight="bold" font-family="sans-serif">TOP 3 MANGA</text>
              <g transform="translate(0, 30)">
                ${renderItems(mangaList, i => i?.chapters ? `${i.chapters} Chaps` : 'N/A')}
              </g>
            </g>

            <!-- Top Characters -->
            <g transform="translate(460, 0)">
              <text x="0" y="15" fill="#cbd5e1" font-size="11" font-weight="bold" font-family="sans-serif">TOP 3 CHARACTERS</text>
              <g transform="translate(0, 30)">
                ${renderItems(characterList, () => 'Favorite', true)}
              </g>
            </g>
          </g>
        </g>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(svg);
  } catch (error) {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(500).send(`Error: ${error.message}`);
  }
}

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(svg);
  } catch (error) {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(500).send(`Error: ${error.message}`);
  }
}
