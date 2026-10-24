// Optional services. Each one is used only when its key is set; without keys, everything
// runs on the bundled city data and on-device storage.
export const services = {
  llm: Boolean(process.env.EXPO_PUBLIC_LLM_BASE_URL && process.env.EXPO_PUBLIC_LLM_API_KEY && process.env.EXPO_PUBLIC_LLM_MODEL),
  googleRoutes: Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY),
  googlePlaces: Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY),
  yelp: Boolean(process.env.EXPO_PUBLIC_YELP_KEY),
  supabase: Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  ticketmaster: Boolean(process.env.EXPO_PUBLIC_TICKETMASTER_KEY),
};
