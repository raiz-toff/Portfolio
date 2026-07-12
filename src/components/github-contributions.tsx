// GitHub contribution graph, fetched server-side. The third-party API is
// hit at most once per revalidate window (not once per visitor), and the
// graph arrives in the initial HTML. If the API is down at render time the
// section collapses quietly, same as before.

import Graph, { type Activity } from "./github-contributions-graph";
import { Panel } from "./panel";

const GITHUB_USERNAME = "raiz-toff";

export default async function GitHubContributions() {
  let data: Activity[] | null = null;
  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=last`,
      { next: { revalidate: 86400 } },
    );
    if (res.ok) {
      const json = (await res.json()) as { contributions?: Activity[] };
      if (json.contributions?.length) data = json.contributions;
    }
  } catch {
    // API unreachable — render nothing rather than failing the page.
  }

  if (!data) return null;

  return (
    <Panel className="screen-line-top-none">
      <h2 className="sr-only">GitHub contributions</h2>
      <Graph data={data} />
      <div className="h-px" />
    </Panel>
  );
}
