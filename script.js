const byId = (id) => document.getElementById(id);

const parseCidrs = (value) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const buildPrefixList = ({ name, entries, geValue }) => {
  const lines = [];
  entries.forEach((cidr, index) => {
    const seq = (index + 1) * 5;
    if (geValue !== undefined && geValue !== null && geValue !== "") {
      lines.push(`ip prefix-list ${name} seq ${seq} permit ${cidr} ge ${geValue}`);
    } else {
      lines.push(`ip prefix-list ${name} seq ${seq} permit ${cidr}`);
    }
  });
  if (lines.length) {
    lines.push("!");
  }
  return lines;
};

const repeatedAsn = (asn, count) => Array.from({ length: count }, () => asn).join(" ");

const buildRouteMaps = ({ azureNextHop, localAsn, globalPriority }) => {
  const prependCount = Math.max(0, Number(globalPriority) - 1);
  const prependString = prependCount > 0 ? repeatedAsn(localAsn, prependCount) : "";

  const lines = [
    "route-map FROM_CLOUD_IMPORT permit 5",
    " match ip address prefix-list CLOUD_PREFIXES",
    ` set ip next-hop ${azureNextHop}`,
    "!",
    "route-map FROM_CLOUD_IMPORT deny 999",
    "!",
    "route-map TO_SDWAN_EXPORT permit 5",
    " match ip address prefix-list CLOUD_PREFIXES",
    ` set ip next-hop ${azureNextHop}`,
    "!",
    "route-map TO_SDWAN_EXPORT permit 10",
    " match ip address prefix-list SSE_PREFIXES",
    "!",
    "route-map TO_SDWAN_EXPORT deny 999",
    "!",
    "route-map TO_CLOUD_EXPORT permit 10",
    " match ip address prefix-list SSE_PREFIXES",
    "!",
    "route-map TO_CLOUD_EXPORT permit 998",
    " match ip address prefix-list SDWAN_SPECIFICS",
    " set ip next-hop unchanged",
  ];

  if (prependCount > 0 && localAsn) {
    lines.push(` set as-path prepend ${prependString}`);
  }

  lines.push(
    "!",
    "route-map TO_CLOUD_EXPORT deny 999",
    "!",
    "route-map FROM_SSE_IMPORT permit 5",
    " match ip address prefix-list SSE_PREFIXES",
    "!",
    "route-map FROM_SSE_IMPORT deny 999",
    "!",
    "route-map TO_SSE_EXPORT permit 5",
    " match ip address prefix-list SDWAN_SUMMARIES",
    "!",
    "route-map TO_SSE_EXPORT permit 10",
    " match ip address prefix-list CLOUD_PREFIXES",
    "!",
    "route-map TO_SSE_EXPORT deny 999"
  );

  return lines;
};

const generateConfig = () => {
  const cloudPrefixes = parseCidrs(byId("cloudPrefixes").value);
  const sdwanSummaries = parseCidrs(byId("sdwanSummaries").value);
  const sdwanSpecifics = parseCidrs(byId("sdwanSpecifics").value);
  const ssePrefixes = parseCidrs(byId("ssePrefixes").value);

  const sdwanSpecificsGe = byId("sdwanSpecificsGe").value;
  const globalPriority = byId("globalPriority").value;
  const localAsn = byId("localAsn").value.trim();
  const azureNextHop = byId("azureNextHop").value.trim() || "0.0.0.0";

  const prefixLines = [
    ...buildPrefixList({ name: "CLOUD_PREFIXES", entries: cloudPrefixes }),
    ...buildPrefixList({ name: "SDWAN_SUMMARIES", entries: sdwanSummaries }),
    ...buildPrefixList({ name: "SDWAN_SPECIFICS", entries: sdwanSpecifics, geValue: sdwanSpecificsGe }),
    ...buildPrefixList({ name: "SSE_PREFIXES", entries: ssePrefixes }),
  ];

  const routeMapLines = buildRouteMaps({ azureNextHop, localAsn, globalPriority });
  const output = [...prefixLines, ...routeMapLines].join("\n");
  byId("output").textContent = output;
};

byId("generateBtn").addEventListener("click", generateConfig);

byId("copyBtn").addEventListener("click", async () => {
  const text = byId("output").textContent;
  if (!text.trim()) return;
  await navigator.clipboard.writeText(text);
});

byId("downloadBtn").addEventListener("click", () => {
  const text = byId("output").textContent;
  if (!text.trim()) return;

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sse-policy-builder-ios-xe.txt";
  a.click();
  URL.revokeObjectURL(url);
});

generateConfig();
