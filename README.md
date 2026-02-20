# SSE Policy Builder for IOS-XE

Simple static web app to generate IOS-XE prefix-lists and route-maps for SSE policy workflows.

## Features

- Builds prefix-lists for:
  - `CLOUD_PREFIXES`
  - `SDWAN_SUMMARIES`
  - `SDWAN_SPECIFICS` (enter one CIDR per line with inline `ge`, e.g., `10.0.0.0/8 ge 9`)
  - `SSE_PREFIXES` (shown as **SSE VPN Pool Summaries** in the form)
- Prefix-list sequence numbers start at 5 and increment by 5.
- Builds route-maps using:
  - Local Router's Global Priority for SD-WAN Ingress (1-10), mapped to AS-path prepend count (`priority - 1`)
  - Local Router ASN
  - Azure VNET Gateway IP address for `set ip next-hop`
- Ensures all generated route-maps include `deny 999` sequence.
- Copy output to clipboard.
- Download generated configuration as a `.txt` file.

## Run

Open `index.html` in a browser, or serve locally:

```bash
python3 -m http.server 8000
```

Then browse to `http://localhost:8000`.
