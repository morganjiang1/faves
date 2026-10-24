# iPhone flows (Maestro)

These flows drive Faves inside Expo Go on an iPhone simulator. Each one opens the app from
the dev server, so start it first:

```sh
npx expo start --ios          # boots the simulator, installs Expo Go and opens Faves
maestro test maestro/         # run every flow (or one file)
```

`APP_URL` defaults to `exp://127.0.0.1:8081`; pass `-e APP_URL=exp://127.0.0.1:8082` for another port.
Selectors are the same `testID`s the Playwright web flows use (React Native exposes them as
accessibility identifiers on iOS).

| Flow | What it checks |
|---|---|
| `01_onboarding.yaml` | First run: splash, name, city, three interests, crew, transport, lands on Home |
| `02_plan_a_day.yaml` | Plain-language request to a streamed plan, the itinerary, a stop's place page |
| `03_replan.yaml` | Live re-plan: it's raining, running late, swap a stop |
| `04_popular_day.yaml` | Home's most-done day, Do this day, the recap |
| `05_explore_and_moments.yaml` | Explore map, a category, a place's Spot Moments |
