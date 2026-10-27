// The signed-in user's "this month", from the tz cookie the browser sets (UTC if missing or invalid).
// Every query and insert takes its month from here; the database trigger is the backstop.
import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { currentMonth } from "./month";

export async function thisMonth() {
  await connection(); // "now" belongs to the request, never to a prerendered shell
  return currentMonth((await cookies()).get("tz")?.value, new Date());
}
