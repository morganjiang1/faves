// What we ask each platform for, per city. Each source returns one or more Apify runs.
// Inputs follow each Actor's published input schema.

const unique = (list) => [...new Set(list)];

export const SOURCES = {
  google: {
    actor: "compass/crawler-google-places",
    maxChargeUsd: 6,
    runs: (city, categories) => [{
      searchStringsArray: unique(categories.flatMap((c) => c.google ?? [])),
      locationQuery: city.google,
      maxCrawledPlacesPerSearch: 25,
      language: "en",
      maxReviews: 0,
      maxImages: 0,
    }],
  },

  yelp: {
    actor: "api-ninja/yelp-ultimate-scraper",
    maxChargeUsd: 0.2,
    runs: (city, categories) => unique(categories.flatMap((c) => c.yelp ?? [])).map((query) => ({
      location: city.yelp,
      query,
      categorySearch: false,
      details: "basic",
      includeAds: false,
      numberOfResults: 40,
    })),
  },

  tiktok: {
    actor: "xmolodtsov/tiktok-search-scraper",
    maxChargeUsd: 0.5,
    runs: (city) => [{
      keywords: [
        `${city.tiktok} hidden gems`, `things to do in ${city.tiktok}`, `${city.tiktok} date ideas`,
        `${city.tiktok} food spots`, `${city.tiktok} things to do with friends`, `${city.tiktok} best views`,
        `${city.tiktok} night out`, `${city.tiktok} underrated spots`, `${city.tiktok} rainy day`, `day trip from ${city.tiktok}`,
      ],
      maxItemsPerKeyword: 60,
      maxItems: 600,
      sortType: "RELEVANCE",
      includeSearchKeywords: true,
    }],
  },

  reddit: {
    actor: "harshmaur/reddit-scraper",
    maxChargeUsd: 1.5,
    runs: (city) => [{
      searchTerms: ["hidden gem", "underrated", "things to do this weekend", "date night", "with friends", "best view", "pickleball", "rainy day", "day trip", "favorite spot", "must try"],
      withinCommunity: city.subreddit,
      searchPosts: true,
      searchComments: true,
      searchSort: "relevance",
      searchTime: "all",
      maxPostsCount: 20,
      maxCommentsCount: 40,
      crawlCommentsPerPost: false,
      includeNSFW: false,
    }],
  },

  tripadvisor: {
    actor: "maxcopell/tripadvisor",
    maxChargeUsd: 0.6,
    runs: (city) => [{
      query: city.tripadvisor,
      maxItemsPerQuery: 150,
      includeAttractions: true,
      includeRestaurants: false,
      includeHotels: false,
      includeTags: true,
      language: "en",
      currency: "USD",
    }],
  },
};
