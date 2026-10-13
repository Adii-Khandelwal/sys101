# Content audit: dns

Audit and fixes, run 2026-10-13, same method and rules as docs/audit/caching.md. Sources were fetched raw with curl and compared sentence by sentence; fixes were applied in the same pass (status shown per finding).

## Summary

| Severity | Count |
|---|---|
| wrong | 0 |
| misleading | 6 |
| weak | 3 |
| style | 3 |

12 findings. Applied: 12 (fixed 10, softened 1, cut 1); left 0.

Verified clean: Cloudflare numbers (5 to 10 and 250 changes per second, 25x, up to 35 s, 34 s vs 8 ms, 4,250x, 150x, 13%); Slack numbers (under 1%, 24 hours, four months, attempts on September 7, 8 and 30, three hours, 24 h and 6 h DS caching, nearly an hour); post titles and dates (Cloudflare 2022-05-25, Slack 2021-11-29); label and name length limits (63 and 255 octets, RFC 1035); 13 named root authorities and hundreds of servers (IANA); UDP port 53 with optional TCP and TLS (BIND); DNSSEC provides no confidentiality and no protection against denial of service (RFC 4033); the 6 Background quotes (verbatim).

## Findings

**T1** `Cloudflare failures; walkthrough "Model updates"`. Severity: misleading. Status: fixed.
- Current: "The fix was to send every update as a delete followed by a create."
- Source: "Ultimately, this was fixed by replacing those specific update events with both a creation and a deletion event."
- Problem: The post says those update events were replaced by a creation and a deletion event, not that every update became a delete followed by a create.
- Rewrite: Replace with a deletion event and a creation event.

**T2** `Cloudflare constraints`. Severity: weak. Status: fixed.
- Current: Constraints omit the DNSSEC dependency.
- Source: "none of this per-record architecture would be possible without the use of Cloudflare's black lie approach to negative answers with DNSSEC. Normally... all the records within the zone must be canonically sorted."
- Problem: A condition the source gives is missing: per-record builds depend on Cloudflare's "black lie" approach to DNSSEC negative answers.
- Rewrite: Add the sentence.

**T3** `Cloudflare tradeoffs.why`. Severity: weak. Status: softened.
- Current: "…their cost stays flat no matter how large the zone grows."
- Source: "As the size of the zone increases, the difference between full build time and per-record build time also increases."
- Problem: The post shows the gap widening, not that per-record cost is flat.
- Rewrite: Reword to what the post shows.

**T4** `lesson workedExample "Compare an ordinary edit"`. Severity: misleading. Status: fixed.
- Current: "A record edit at Cloudflare after its rebuild takes 8 ms or less to build, against about 34 seconds before for a million-record zone."
- Source: "I used a test zone of one million records... per-record builds... no more than 8ms... full build... on average 34 seconds."
- Problem: Presents a test-zone result as an ordinary edit.
- Rewrite: Say it is the test zone.

**T5** `Slack tradeoffs.chosen`. Severity: misleading. Status: fixed.
- Current: "During the incident, pull the DS record first, then remove signing, then flush caches."
- Source: "As soon as the rollback was pushed out things got much worse"; "The team knew removing the DNSKEY from the authoritative zone is a high-risk operation unless the DS record is not published anymore."
- Problem: Lists what Slack did during the incident as the chosen approach, though the post says removing signing made things much worse.
- Rewrite: State what happened and that it made things worse.

**T6** `Slack tradeoffs.rejected`. Severity: misleading. Status: fixed.
- Current: "…which would have produced a new signing key that matched nothing cached…"
- Source: "the ZSK would have been different... all DNSSEC validating resolvers would have continued failing to validate. So this action would have neither made things better nor made them worse."
- Problem: Imprecise: the zone signing key would have differed (the key signing key was recoverable), and the post says re-signing would not have helped.
- Rewrite: Say the zone signing key would differ.

**T7** `Slack failures`. Severity: misleading. Status: fixed.
- Current: "…the rollback deleted signing keys that could not be recreated identically."
- Source: "For us to restore signing, we would have had to recover some keys which had been deleted... the KSK was going to be the same... Amazon's Route53 team confirmed that the ZSK would have been different."
- Problem: Only the zone signing key would have changed; the key signing key was recoverable.
- Rewrite: Name the zone signing key.

**T8** `Slack walkthrough "Find the root cause" and takeaways`. Severity: style. Status: fixed.
- Current: "Browser network logs showed…"; "here browser network logs"
- Source: "Slack applications are based on Chromium and integrate a way to export a NetLog capture."
- Problem: The logs came from Slack client apps (NetLog captures), not a browser.
- Rewrite: Name the client logs.

**T9** `Slack numbers "three hour"`. Severity: style. Status: fixed.
- Current: "three hour"
- Source: "After a three hour 'soak time'"
- Problem: Grammar: the value should be plural.
- Rewrite: three hours

**L1** `how body[2] (zone name servers)`. Severity: misleading. Status: fixed.
- Current: "A zone is expected to run two or more name servers, so one failure does not take its names offline [[bind-arm]]."
- Source: CS168 (not the BIND manual): "By convention, zones are required to have two name servers, though in practice, most zones will have at least three." The BIND chapter 1 text has no such sentence.
- Problem: Wrong citation and stronger wording ("two or more" expected).
- Rewrite: Cite CS168.

**L2** `message-queue and eventual-consistency gists`. Severity: style. Status: cut.
- Current: "The gist is enough here." ends both explanations.
- Source: n/a (our wording)
- Problem: Repeated filler; the Background page legend already says it.
- Rewrite: Delete the sentence.

**B1** `nsec-negative-answers quote`. Severity: weak. Status: fixed.
- Current: "This NSEC response is cached."
- Source: "When a request is made to a DNSSEC-enabled domain for a wildcard record which type does not exist, the answer is a signed NSEC record confirming that while the domain name exists, the requested type does not."
- Problem: The quote does not show what an NSEC record is.
- Rewrite: Use the defining sentence.

## Could not verify

- The two videos (NANOG, APNIC) cannot be watched; only their metadata is on the page.
- RFC 4592/4034 and etcd Background sources were not re-read line by line beyond the explanations they back.
- Quiz and exercise statements that are general DNS knowledge (TTL planning before a move) have no cited source on the topic page; they match the posts' lessons but are not stated in them.
