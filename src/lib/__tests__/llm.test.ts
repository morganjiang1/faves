import { parseRequest } from "../parser";

// The optional model path: its JSON fills the same request shape, and anything invalid keeps
// the deterministic value.
describe("llmParse with an OpenAI-compatible endpoint", () => {
  const OLD = { ...process.env };
  afterEach(() => { process.env = { ...OLD }; jest.restoreAllMocks(); });

  test("merges valid fields and ignores invalid ones", async () => {
    process.env.EXPO_PUBLIC_LLM_BASE_URL = "https://llm.example/v1";
    process.env.EXPO_PUBLIC_LLM_API_KEY = "test";
    process.env.EXPO_PUBLIC_LLM_MODEL = "test-model";
    const reply = { who: "friends", groupSize: 4, budget: 40, start: 840, end: 1260, transport: "transit", hood: "Not A Hood", mustDos: [{ label: "Pickleball", category: "courts", keywords: ["pickleball"] }, { label: "hot pot", category: "food", keywords: ["hot pot"] }], interests: [{ word: "Gundam", category: "shops", keywords: ["gundam", "hobby"] }] };
    const fetchMock = jest.fn(async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(reply) } }] }) }));
    (globalThis as { fetch: unknown }).fetch = fetchMock;
    let llm: typeof import("../llm");
    jest.isolateModules(() => { llm = require("../llm"); });
    expect(llm!.llmEnabled).toBe(true);
    const base = parseRequest("pickleball then hot pot with 3 friends", { hoods: ["Mission District"] });
    const out = await llm!.llmParse("pickleball then hot pot with 3 friends", base, ["Mission District"]);
    expect(fetchMock).toHaveBeenCalledWith("https://llm.example/v1/chat/completions", expect.objectContaining({ method: "POST" }));
    expect(out.groupSize).toBe(4);
    expect(out.budget).toBe(40);
    expect(out.hood).toBeNull(); // not one of the city's neighborhoods
    expect(out.mustDos.map((m) => m.label)).toEqual(["pickleball", "hot pot"]);
    expect(out.mustDos[0].sport).toBe("pickleball");
    expect(out.interests[0].word).toBe("Gundam");
  });

  test("a failing endpoint throws, so the caller keeps the deterministic parse", async () => {
    process.env.EXPO_PUBLIC_LLM_BASE_URL = "https://llm.example/v1";
    process.env.EXPO_PUBLIC_LLM_API_KEY = "test";
    process.env.EXPO_PUBLIC_LLM_MODEL = "test-model";
    (globalThis as { fetch: unknown }).fetch = jest.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    let llm: typeof import("../llm");
    jest.isolateModules(() => { llm = require("../llm"); });
    const base = parseRequest("date night");
    await expect(llm!.llmParse("date night", base, [])).rejects.toThrow();
  });
});
