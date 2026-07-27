import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

async function fetchAniListStats(username) {
  const query = `
    query ($username: String) {
      User(name: $username) {
        name
        avatar { large }
        stats {
          watchedTime
          chaptersRead
        }
        favourites {
          anime(page: 1, perPage: 3) {
            nodes {
              title { userPreferred }
              coverImage { medium }
              episodes
            }
          }
          manga(page: 1, perPage: 3) {
            nodes {
              title { userPreferred }
              coverImage { medium }
              chapters
            }
          }
          characters(page: 1, perPage: 3) {
            nodes {
              name { full }
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
  return json.data.User;
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username') || 'LinuxFinn';

    const user = await fetchAniListStats(username);

    const minutesWatched = user.stats.watchedTime || 0;
    const animeHours = Math.floor(minutesWatched / 60);
    const animeDays = Math.floor(animeHours / 24);
    const chapters = user.stats.chaptersRead || 0;

    const bgUrl = 'https://raw.githubusercontent.com/LinuxFinn/assets/main/1266658.jpg';

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '740px',
              backgroundColor: 'rgba(15, 23, 42, 0.88)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '24px',
              color: '#ffffff',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={user.avatar.large}
                  style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #38bdf8' }}
                />
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{user.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '14px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
                <span>SYNCED WITH ANILIST</span>
              </div>
            </div>

            {/* Stats Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>ANIME WATCH TIME</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8' }}>
                  {animeHours.toLocaleString()} HRS ({animeDays} Days)
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>MANGA READ</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#34d399' }}>
                  {chapters.toLocaleString()} CHAPS
                </span>
              </div>
            </div>

            {/* Columns */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              {/* Anime */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>
                  TOP 3 ANIME
                </span>
                {user.favourites.anime.nodes.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <img src={item.coverImage.medium} style={{ width: '36px', height: '48px', borderRadius: '4px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', width: '130px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {item.title.userPreferred}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{item.episodes || '?'} Eps</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Manga */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>
                  TOP 3 MANGA
                </span>
                {user.favourites.manga.nodes.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <img src={item.coverImage.medium} style={{ width: '36px', height: '48px', borderRadius: '4px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', width: '130px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {item.title.userPreferred}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{item.chapters || '?'} Chaps</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Characters */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>
                  TOP 3 CHARACTERS
                </span>
                {user.favourites.characters.nodes.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <img src={item.image.medium} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                    <span style={{ fontSize: '13px', fontWeight: 'bold', width: '130px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {item.name.full}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 800,
        height: 480,
      }
    );
  } catch (e) {
    return new Response(`Failed to generate card: ${e.message}`, { status: 500 });
  }
}
