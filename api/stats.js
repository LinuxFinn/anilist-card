async function fetchAniListStats(username) {
  const query = `
    query ($username: String) {
      User(name: $username) {
        name
        avatar { large }
        statistics {
          anime {
            minutesWatched
          }
          manga {
            chaptersRead
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

    const minutesWatched = user?.statistics?.anime?.minutesWatched || 0;
    const animeHours = Math.floor(minutesWatched / 60);
    const animeDays = Math.floor(animeHours / 24);
    const chapters = user?.statistics?.manga?.chaptersRead || 0;

    const animeList = user?.favourites?.anime?.nodes || [];
    const mangaList = user?.favourites?.manga?.nodes || [];
    const characterList = user?.favourites?.characters?.nodes || [];

    // Helper to get formatted title/name
    const getFormattedName = (item, isCharacter) => {
      if (isCharacter) {
        const first = item?.name?.first;
        const last = item?.name?.last;
        // If both first and last exist, format as Western "First Last"
        if (first && last) {
          return `${first} ${last}`;
        }
        return item?.name?.full || 'N/A';
      }
      // Prioritize official English title over Romaji
      return item?.title?.english || item?.title?.romaji || 'N/A';
    };

    // Render List Items with proper proportions
    const renderItems = (items, getType, isCharacter = false) => {
      return items.slice(0, 3).map((item, idx) => {
        const title = getFormattedName(item, isCharacter);
        const sub = getType(item);
        const img = item?.coverImage?.medium || item?.image?.medium || '';
        const y = idx * 52;

        return `
          <g transform="translate(0, ${y})">
            ${img ? `
              <clipPath id="clip-${isCharacter ? 'char' : 'media'}-${idx}">
                <rect width="${isCharacter ? '36' : '32'}" height="${isCharacter ? '36' : '44'}" rx="${isCharacter ? '18' : '4'}"/>
              </clipPath>
              <image href="${img}" width="${isCharacter ? '36' : '32'}" height="${isCharacter ? '36' : '44'}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-${isCharacter ? 'char' : 'media'}-${idx})"/>
            ` : ''}
            <text x="44" y="18" fill="#ffffff" font-size="12" font-weight="bold" font-family="sans-serif">${title.length > 18 ? title.substring(0, 15) + '...' : title}</text>
            <text x="44" y="34" fill="#94a3b8" font-size="10" font-family="sans-serif">${sub}</text>
          </g>
        `;
      }).join('');
    };

    const svg = `
      <svg width="740" height="380" viewBox="0 0 740 380" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="740" height="380" rx="16" fill="#0f172a" stroke="#ffffff" stroke-opacity="0.1"/>
        
        <!-- Header -->
        <g transform="translate(24, 24)">
          ${user?.avatar?.large ? `
            <clipPath id="avatar-clip"><circle cx="24" cy="24" r="24"/></clipPath>
            <image href="${user.avatar.large}" x="0" y="0" width="48" height="48" clip-path="url(#avatar-clip)"/>
          ` : ''}
          <text x="60" y="31" fill="#ffffff" font-size="22" font-weight="bold" font-family="sans-serif">${user?.name || username}</text>
          
          <circle cx="560" cy="20" r="4" fill="#4ade80"/>
          <text x="572" y="24" fill="#4ade80" font-size="11" font-weight="bold" font-family="sans-serif" letter-spacing="0.5">SYNCED WITH ANILIST</text>
        </g>

        <!-- Stats Bar -->
        <g transform="translate(24, 90)">
          <rect width="692" height="54" rx="8" fill="#ffffff" fill-opacity="0.05"/>
          
          <text x="170" y="22" fill="#94a3b8" font-size="11" text-anchor="middle" font-family="sans-serif">ANIME WATCH TIME</text>
          <text x="170" y="42" fill="#38bdf8" font-size="16" font-weight="bold" text-anchor="middle" font-family="sans-serif">${animeHours.toLocaleString()} HRS (${animeDays} Days)</text>

          <line x1="346" y1="12" x2="346" y2="42" stroke="#ffffff" stroke-opacity="0.1"/>

          <text x="520" y="22" fill="#94a3b8" font-size="11" text-anchor="middle" font-family="sans-serif">MANGA READ</text>
          <text x="520" y="42" fill="#34d399" font-size="16" font-weight="bold" text-anchor="middle" font-family="sans-serif">${chapters.toLocaleString()} CHAPS</text>
        </g>

        <!-- Content Columns -->
        <g transform="translate(24, 170)">
          <!-- Top Anime -->
          <g transform="translate(0, 0)">
            <text x="0" y="15" fill="#94a3b8" font-size="12" font-weight="bold" font-family="sans-serif">TOP 3 ANIME</text>
            <g transform="translate(0, 30)">
              ${renderItems(animeList, i => i?.episodes ? `${i.episodes} Eps` : 'N/A')}
            </g>
          </g>

          <!-- Top Manga -->
          <g transform="translate(230, 0)">
            <text x="0" y="15" fill="#94a3b8" font-size="12" font-weight="bold" font-family="sans-serif">TOP 3 MANGA</text>
            <g transform="translate(0, 30)">
              ${renderItems(mangaList, i => i?.chapters ? `${i.chapters} Chaps` : 'N/A')}
            </g>
          </g>

          <!-- Top Characters -->
          <g transform="translate(460, 0)">
            <text x="0" y="15" fill="#94a3b8" font-size="12" font-weight="bold" font-family="sans-serif">TOP 3 CHARACTERS</text>
            <g transform="translate(0, 30)">
              ${renderItems(characterList, () => 'Favorite', true)}
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
