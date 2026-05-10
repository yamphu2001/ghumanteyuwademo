

import MarkerTemplate from "../components/MarkerTemplate";

export default function Page() {
  const DATA = {
    label: "LOCATION MARKER",
    tagline: "Walk close · Hold 5 s · Discover",
    section: "SECTION 01",
    gifFile: "location-demo.gif",
    steps: [
      { text: "Move within 5m of the marker, hold for 5 seconds until the progress completes, and the popup will appear to read and memorize." },
      // { text: "Hold for 5 seconds on the marker or wait until the progress animation is completed." },
      // { text: "The popup will show automatically. Read and memorize for future use." },
    ]
  };
  return <MarkerTemplate data={DATA} nextPage={{ link: "/tutorial/museummarker", label: "Museum Marker" }} />;
}