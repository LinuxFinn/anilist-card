import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

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
      {
        type: 'div',
        props: {
          style: {
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
          },
          children: [
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  width: '740px',
                  backgroundColor: 'rgba(15, 23, 42, 0.88)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '24px',
                  color: '#ffffff',
                },
                children: [
                  // Header
                  {
                    type: 'div',
                    props: {
                      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', alignItems: 'center', gap: '12px' },
                            children: [
                              { type: 'img', props: { src: user.avatar.large, style: { width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #38bdf8' } } },
                              { type: 'span', props: { style: { fontSize: '24px', fontWeight: 'bold' }, children: user.name } }
                            ]
                          }
                        },
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '14px' },
                            children: [
                              { type: 'div', props: { style: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80' } } },
                              { type: 'span', props: { children: 'SYNCED WITH ANILIST' } }
                            ]
                          }
                        }
                      ]
                    }
                  },
                  // Stats bar
                  {
                    type: 'div',
                    props: {
                      style: { display: 'flex', justifyContent: 'space-around', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '12px', marginBottom: '20px' },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
                            children: [
                              { type: 'span', props: { style: { fontSize: '12px', color: '#94a3b8' }, children: 'ANIME WATCH TIME' } },
                              { type: 'span', props: { style: { fontSize: '20px', fontWeight: 'bold', color: '#38bdf8' }, children: `${animeHours.toLocaleString()} HRS (${animeDays} Days)` } }
                            ]
                          }
                        },
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
                            children: [
                              { type: 'span', props: { style: { fontSize: '12px', color: '#94a3b8' }, children: 'MANGA READ' } },
                              { type: 'span', props: { style: { fontSize: '20px', fontWeight: 'bold', color: '#34d399' }, children: `${chapters.toLocaleString()} CHAPS` } }
                            ]
                          }
                        }
                      ]
                    }
                  },
                  // Columns
                  {
                    type: 'div',
                    props: {
                      style: { display: 'flex', justifyContent: 'space-between', gap: '16px' },
                      children: [
                        // Top Anime
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', flexDirection: 'column', flex: 1 },
                            children: [
                              { type: 'span', props: { style: { fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }, children: 'TOP 3 ANIME' } },
                              ...user.favourites.anime.nodes.slice(0, 3).map((item) => ({
                                type: 'div',
                                props: {
                                  style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
                                  children: [
                                    { type: 'img', props: { src: item.coverImage.medium, style: { width: '36px', height: '48px', borderRadius: '4px' } } },
                                    {
                                      type: 'div',
                                      props: {
                                        style: { display: 'flex', flexDirection: 'column' },
                                        children: [
                                          { type: 'span', props: { style: { fontSize: '13px', fontWeight: 'bold', width: '130px', overflow: 'hidden', whiteSpace: 'nowrap' }, children: item.title.userPreferred } },
                                          { type: 'span', props: { style: { fontSize: '11px', color: '#94a3b8' }, children: `${item.episodes || '?'} Eps` } }
                                        ]
                                      }
                                    }
                                  ]
                                }
                              }))
                            ]
                          }
                        },
                        // Top Manga
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', flexDirection: 'column', flex: 1 },
                            children: [
                              { type: 'span', props: { style: { fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }, children: 'TOP 3 MANGA' } },
                              ...user.favourites.manga.nodes.slice(0, 3).map((item) => ({
                                type: 'div',
                                props: {
                                  style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
                                  children: [
                                    { type: 'img', props: { src: item.coverImage.medium, style: { width: '36px', height: '48px', borderRadius: '4px' } } },
                                    {
                                      type: 'div',
                                      props: {
                                        style: { display: 'flex', flexDirection: 'column' },
                                        children: [
                                          { type: 'span', props: { style: { fontSize: '13px', fontWeight: 'bold', width: '130px', overflow: 'hidden', whiteSpace: 'nowrap' }, children: item.title.userPreferred } },
                                          { type: 'span', props: { style: { fontSize: '11px', color: '#94a3b8' }, children: `${item.chapters || '?'} Chaps` } }
                                        ]
                                      }
                                    }
                                  ]
                                }
                              }))
                            ]
                          }
                        },
                        // Top Characters
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', flexDirection: 'column', flex: 1 },
                            children: [
                              { type: 'span', props: { style: { fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }, children: 'TOP 3 CHARACTERS' } },
                              ...user.favourites.characters.nodes.slice(0, 3).map((item) => ({
                                type: 'div',
                                props: {
                                  style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
                                  children: [
                                    { type: 'img', props: { src: item.image.medium, style: { width: '40px', height: '40px', borderRadius: '50%' } } },
                                    { type: 'span', props: { style: { fontSize: '13px', fontWeight: 'bold', width: '130px', overflow: 'hidden', whiteSpace: 'nowrap' }, children: item.name.full } }
                                  ]
                                }
                              }))
                            ]
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        }
      },
      { width: 800, height: 480 }
    );
  } catch (e) {
    return new Response(`Failed to generate card: ${e.message}`, { status: 500 });
  }
}
