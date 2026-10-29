# Ring turntable: research (29 Oct 2026)

Result: no post qualifies. No figure was built.

Candidates in content/topics/consistent-hashing.json, raw pages fetched with curl:

- Cloudflare, "Saving another 100TB of RAM with math (and Rust)" (18 Sep 2026). Confirmed on the raw page: 160 points per server (NGINX, Pingora), variation about 99% to about 8% for 100 servers with 1 vs 160 points, 6GB in some cases, 90% fewer points, 0.7% error gain from 10,000 to 100,000. The post explains why more points even out the arcs (error falls roughly with the square root of the point count), but it gives no ring layout, no key positions and no node-add or node-remove movement. A turntable ring needs positions for servers and keys. Any such positions would be a seeded random draw we made up, and a draw of 100 servers at 1 point would not reproduce the quoted 99%. The numbers would only fill a readout, so the ring itself would be invented geometry. Rejected under "only where the source gives the mechanism".
- Discord, "How Discord Scaled Elixir to 5,000,000 Concurrent Users": numbers are lookup costs (12 us, 7 us, 0.3 us, 30 s, 750 ms). The ring is a data structure, not a mechanism with positions or key movement. Rejected.

If a later source gives a worked ring (node positions, a key count and the fraction moved when a node joins), a turntable could be built from its numbers rows. Until then, leave it out.
