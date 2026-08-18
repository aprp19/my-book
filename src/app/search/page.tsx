import { redirect } from "next/navigation";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const browseParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) {
      browseParams.set(key, value);
    } else if (Array.isArray(value) && value[0]) {
      browseParams.set(key, value[0]);
    }
  }

  const query = browseParams.toString();
  redirect(query ? `/browse?${query}` : "/browse");
}
