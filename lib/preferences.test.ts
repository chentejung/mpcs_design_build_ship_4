import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ session: vi.fn(), protect: vi.fn(), read: vi.fn(), write: vi.fn(), revalidate: vi.fn() }));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("@clerk/nextjs/server", () => ({ auth: Object.assign(mocks.session, { protect: mocks.protect }) }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("./supabase", () => ({ supabase: () => ({ from: () => ({ select: () => ({ maybeSingle: mocks.read }), upsert: mocks.write }) }) }));

import { browsePreferences, requirePreferences } from "./preferences";
import { completeOnboarding, updatePreferences } from "@/app/actions/preferences";

const answers = () => {
  const form = new FormData();
  form.set("display_name", "Ellie");
  form.set("favorite_genre_ids", "28");
  return form;
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.protect.mockResolvedValue({ userId: "user_A" });
  mocks.session.mockResolvedValue({ userId: "user_A" });
  mocks.read.mockResolvedValue({ data: null, error: null });
  mocks.write.mockResolvedValue({ error: null });
});
describe("required onboarding", () => {
  it("allows public browsing without querying private data", async () => {
    mocks.session.mockResolvedValue({ userId: null });
    expect(await browsePreferences()).toBeNull();
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it("redirects incomplete accounts and blocks preference editing", async () => {
    await expect(requirePreferences()).rejects.toThrow("REDIRECT:/onboarding");
    await expect(updatePreferences({}, answers())).rejects.toThrow("REDIRECT:/onboarding");
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("fails closed on a database outage", async () => {
    mocks.read.mockResolvedValue({ data: null, error: { message: "offline" } });
    await expect(requirePreferences()).rejects.toThrow("couldn’t load");
  });
  it("does not write invalid answers", async () => {
    expect((await completeOnboarding({}, new FormData())).errors).toHaveProperty("genres");
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("redirects only after both answers persist; identity comes from the JWT default", async () => {
    await expect(completeOnboarding({}, answers())).rejects.toThrow("REDIRECT:/");
    expect(mocks.write).toHaveBeenCalledWith({ display_name: "Ellie", favorite_genre_ids: [28] }, { onConflict: "user_id" });
    expect(mocks.revalidate).toHaveBeenCalled();
  });
  it("keeps onboarding open after a failed save", async () => {
    mocks.write.mockResolvedValue({ error: { message: "offline" } });
    expect(await completeOnboarding({}, answers())).toEqual({ message: expect.stringContaining("couldn’t be saved") });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("lets a completed account edit both answers", async () => {
    mocks.read.mockResolvedValue({ data: { display_name: "Old name", favorite_genre_ids: [35] }, error: null });
    expect(await updatePreferences({}, answers())).toEqual({ saved: true });
    expect(mocks.write).toHaveBeenCalledOnce();
  });
});
