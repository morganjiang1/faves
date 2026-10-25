# Faves Local Spots

The spots locals love for a vibe in a city. Say what you want in plain words ("cozy bookstore",
"lit pickleball courts", "hot pot", "a quiet view") and get the places that fit, ranked by what
locals actually say about them, each with a **Locals Score** (0 to 10) and a **hidden gem** flag.

Built for [Faves](https://github.com/morganjiang1/faves), where the Scout agent runs it live when a
group asks for something niche that Faves' own city data doesn't have yet.

## How it works

1. **Where.** Finds the city (and the neighborhood, if you give one) on OpenStreetMap.
2. **What.** Turns the vibe into OpenStreetMap tags (`shop=books`, `sport=pickleball`,
   `cuisine=ramen`, `tourism=viewpoint`...) and pulls every named place that fits. Courts are
   usually unnamed in OpenStreetMap, so they take the name of the park they're in.
3. **What locals say.** Reads the top threads about that vibe on the city's ask-locals subreddit
   (r/AskSF, r/AskNYC...), comments included. When Reddit blocks direct reads (it often blocks
   servers), it reads the same threads with Apify's Reddit scraper, within a small budget you set.
4. **Rank.** The Locals Score weighs how often and how warmly (upvotes) locals name each place,
   then whether it's real and open (hours, website). A place nobody has named yet stays under 5.
   A **hidden gem** is one locals love when they mention it, but that comes up far less than the
   famous ones, and isn't a chain.

## Input

| Field | What | Default |
|---|---|---|
| `city` | A city: San Francisco, New York, Los Angeles... | San Francisco |
| `vibe` | What you're looking for, in plain words | required |
| `neighborhood` | Keep results near this neighborhood | none |
| `subreddit` | Where locals talk | the city's ask-locals subreddit |
| `maxResults` | How many spots | 10 |
| `redditThreads` | How many top threads to read | 6 |
| `useApifyProxy` | Route Reddit reads through Apify Proxy | false |
| `redditScraper` | Fall back to Apify's Reddit scraper when Reddit blocks direct reads | true |
| `redditBudgetUsd` | The most that fallback may cost per run | 0.3 |

## Output

One dataset item per spot, best first. An example item (the values are illustrative):

```json
{
  "rank": 1,
  "name": "Green Apple Books",
  "kind": "bookstore",
  "address": "506 Clement Street",
  "lat": 37.7831, "lng": -122.4647,
  "localsScore": 8.9,
  "hiddenGem": false,
  "redditMentions": 14,
  "redditUpvotes": 612,
  "evidence": [{ "source": "reddit", "url": "https://www.reddit.com/r/AskSF/comments/...", "upvotes": 120 }],
  "openingHours": "Mo-Su 10:00-22:30",
  "osmUrl": "https://www.openstreetmap.org/node/..."
}
```

The run's summary (what was read, from where) is in the key-value store under `OUTPUT`.

## Run it

```bash
npm install
npm test                 # the ranking, offline
apify run --input '{"city":"San Francisco","vibe":"cozy bookstore"}'
apify push               # deploy to your Apify account
```

Place data © OpenStreetMap contributors (ODbL). Reddit content is linked, not copied.
