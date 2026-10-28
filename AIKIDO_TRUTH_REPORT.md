# Aikido.dev Findings Truth Check — Trimly

<span style="color:#94a3b8">Question: are the reported Aikido criticals real, or smoke alarms? Verdict: <span style="color:#ef4444">PARTLY REAL</span> — 2 critical dependency issues are genuinely reachable; most of the 85 Next.js CVEs are feature-specific or environment-specific false positives for this repo. Colour key: <span style="color:#22c55e">ACTION</span> <span style="color:#3b82f6">THOUGHT</span> <span style="color:#ef4444">REAL RISK</span> <span style="color:#f59e0b">SMOKE ALARM</span> <span style="color:#a855f7">FINDING</span> <span style="color:#06b6d4">INFO</span>.</span>

1. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Deleted branch kilo/tiny-sky-tgz locally and from origin; switched working tree to main.</span>
2. <span style="color:#3b82f6">[THOUGHT]</span> <span style="color:#e5e7eb">The task is verification only: determine whether Aikido's critical labels reflect reachable code, not just dependency presence.</span>
3. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Reinstalled dependencies on main with bun and trusted the three blocked postinstall scripts.</span>
4. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Confirmed installed versions: next@15.2.4, react@19.1.0, react-dom@19.1.0, @clerk/nextjs@6.20.2, @clerk/shared@3.9.5.</span>
5. <span style="color:#a855f7">[FINDING]</span> <span style="color:#e5e7eb">The repo matches the vulnerable versions cited by Aikido: Next.js 15.2.4 and Clerk 6.20.2/3.9.5.</span>
6. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Ran pnpm audit; it reports 123 advisories total: 8 critical, 70 high, 38 moderate, 7 low.</span>
7. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Grouped advisories by package: next has 36, @clerk/* has 6, the rest are transitive/dev tooling.</span>
8. <span style="color:#ef4444">[REAL RISK]</span> <span style="color:#e5e7eb">CVE-2025-55182 / CVE-2025-66478 (RCE in React flight protocol) is REAL: App Router + React Server Components + Server Actions are used.</span>
9. <span style="color:#3b82f6">[THOUGHT]</span> <span style="color:#e5e7eb">This is the headline critical: a malicious RSC payload can target the server component protocol, so patching is required.</span>
10. <span style="color:#ef4444">[REAL RISK]</span> <span style="color:#e5e7eb">Clerk middleware bypass (GHSA-vqx2-fgx2-5wq9) is REAL: middleware.ts uses clerkMiddleware to protect routes.</span>
11. <span style="color:#3b82f6">[THOUGHT]</span> <span style="color:#e5e7eb">Even though per-route auth exists in many handlers, middleware is the first gate, so the bypass is a credible risk.</span>
12. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">"Critical RCE on Windows-hosted servers" is NOT applicable: app runs on Linux/Vercel, not Windows.</span>
13. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">"Critical RCE in Image Optimization API (AVIF/SVG)" is NOT applicable: no next/image usage and no remotePatterns.</span>
14. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Grepped source: zero next/image imports and no images configuration in next.config.ts.</span>
15. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">"Middleware bypass via i18n (Pages Router)" is NOT applicable: no i18n and no Pages Router.</span>
16. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">"SSRF via rewrites" is NOT applicable: next.config.ts has no rewrites/redirects.</span>
17. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">"Edge runtime unbounded Server Action payload" is NOT applicable: runtime is nodejs only; no edge routes.</span>
18. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">"WebSocket upgrade SSRF" is NOT applicable: no WebSocket or custom server code.</span>
19. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Grepped source for WebSocket/upgrade/custom server; none found.</span>
20. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">"Cache Components DoS" is NOT applicable: no cache components feature enabled.</span>
21. <span style="color:#a855f7">[FINDING]</span> <span style="color:#e5e7eb">Some high-severity DoS advisories (Server Components) may be partially applicable because Server Actions exist.</span>
22. <span style="color:#3b82f6">[THOUGHT]</span> <span style="color:#e5e7eb">Treat Server Component DoS as a real but lower-priority operational risk, not a critical code-injection issue.</span>
23. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">"Middleware bypass via segment-prefetch" is partially applicable because App Router is used; verify exact patched version.</span>
24. <span style="color:#ef4444">[REAL RISK]</span> <span style="color:#e5e7eb">Middleware bypass advisories should be treated as real until Clerk/Next are upgraded.</span>
25. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">"Image optimizer disk cache growth" is NOT applicable: no next/image and no optimizer traffic.</span>
26. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">"SSRF in Server Actions on custom servers" is NOT applicable: no custom server.</span>
27. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">"Cache poisoning of SSG/ISR pages" is largely NOT applicable: no SSG/ISR pages and Vercel handles caching.</span>
28. <span style="color:#3b82f6">[THOUGHT]</span> <span style="color:#e5e7eb">Aikido's count (85) aggregates many feature-specific advisories across versions, inflating apparent risk.</span>
29. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked drizzle-orm optional peer dependency on gel; gel and shell-quote are installed but not used by neon-http runtime.</span>
30. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">shell-quote CVE is NOT a production runtime risk for this app (dev/optional dependency path).</span>
31. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked @clerk advisories: 3 for @clerk/nextjs, 2 for @clerk/shared, 1 for @clerk/clerk-react.</span>
32. <span style="color:#ef4444">[REAL RISK]</span> <span style="color:#e5e7eb">Clerk middleware bypass is real and relevant because the app relies on middleware for route protection.</span>
33. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">Clerk cookie/XSS minor advisories may not be reachable depending on SDK usage; verify individually.</span>
34. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked transitive tar/minimatch/postcss/zod advisories; these are tooling/dependency-level, not app features.</span>
35. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">tar extraction CVEs are NOT reachable: app does not extract tar archives.</span>
36. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">minimatch ReDoS is NOT directly reachable unless user-controlled glob patterns are passed.</span>
37. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">postcss XSS/source-map issues are build-time only, not runtime user input.</span>
38. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">zod memory exhaustion is a theoretical DoS; app validates small form payloads.</span>
39. <span style="color:#a855f7">[FINDING]</span> <span style="color:#e5e7eb">The true criticals are 2: Next.js RCE via RSC flight protocol and Clerk middleware bypass.</span>
40. <span style="color:#a855f7">[FINDING]</span> <span style="color:#e5e7eb">The remaining "critical" image/windows CVEs are environment/feature mismatches for this repo.</span>
41. <span style="color:#3b82f6">[THOUGHT]</span> <span style="color:#e5e7eb">Aikido's "85 CVEs" is a dependency-inventory alarm, not proof of 85 exploitable issues in Trimly.</span>
42. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Verified App Router usage: 6 page.tsx files and 11 server actions.</span>
43. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Verified middleware exists and protects all routes except sign-in, sign-up, and cron.</span>
44. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Verified no custom server, no WebSocket, no rewrites, no i18n, no next/image.</span>
45. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Verified runtime is nodejs only; no edge runtime routes.</span>
46. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Verified deployment target is Vercel (Linux), not Windows.</span>
47. <span style="color:#3b82f6">[THOUGHT]</span> <span style="color:#e5e7eb">Therefore the CVE labels must be filtered by reachability before prioritizing work.</span>
48. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked next.config.ts: empty config, no security headers, no image config.</span>
49. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">CSP/cache-poisoning advisories require specific caching/header setups not present.</span>
50. <span style="color:#a855f7">[FINDING]</span> <span style="color:#e5e7eb">Reachability summary: 2 critical real, 0 image/windows criticals real, several highs conditional.</span>
51. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Identified conditional highs: Server Component DoS, middleware segment-prefetch bypass, Server Action source exposure.</span>
52. <span style="color:#3b82f6">[THOUGHT]</span> <span style="color:#e5e7eb">These conditional highs deserve verification against actual traffic and Next version internals.</span>
53. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked for Server Action exposure: 11 'use server' files exist, so source exposure advisory is worth reviewing.</span>
54. <span style="color:#ef4444">[REAL RISK]</span> <span style="color:#e5e7eb">Server Action source code exposure could leak server-only logic; inspect build output and boundaries.</span>
55. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked auth boundaries: most API routes call auth() and getUserRole, but /api/visits/[id] has IDOR.</span>
56. <span style="color:#ef4444">[REAL RISK]</span> <span style="color:#e5e7eb">IDOR in /api/visits/[id] is a real application vulnerability independent of Aikido CVEs.</span>
57. <span style="color:#3b82f6">[THOUGHT]</span> <span style="color:#e5e7eb">This is more immediately exploitable than many dependency CVEs.</span>
58. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked profile route: array truthiness bug means 404 never returned.</span>
59. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">This is a logic bug, not an Aikido dependency CVE.</span>
60. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked booking conflict logic: N+1 and non-atomic, race-prone.</span>
61. <span style="color:#a855f7">[FINDING]</span> <span style="color:#e5e7eb">Race conditions are real but not part of Aikido's CVE list.</span>
62. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked calendar sync: reschedule API route skips calendar update and service validation.</span>
63. <span style="color:#a855f7">[FINDING]</span> <span style="color:#e5e7eb">Integration inconsistency is real but not an Aikido CVE.</span>
64. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked schema: serial used for FK columns; should be integer.</span>
65. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">Schema type issue is not a security CVE but a data-integrity risk.</span>
66. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked Google Calendar tokens: stored plaintext in DB.</span>
67. <span style="color:#ef4444">[REAL RISK]</span> <span style="color:#e5e7eb">Plaintext OAuth tokens are a real security issue if DB is exposed.</span>
68. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked cron endpoint: Bearer secret comparison with !==, not timing-safe.</span>
69. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">Timing side channel is theoretical; low practical impact.</span>
70. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked debug console.log statements in client components.</span>
71. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">Debug logging is a hygiene issue, not a CVE.</span>
72. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked for dangerous sinks; none found.</span>
73. <span style="color:#06b6d4">[INFO]</span> <span style="color:#e5e7eb">No XSS sinks in application code.</span>
74. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked for security headers; none configured.</span>
75. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">Missing headers are hardening gaps, not Aikido CVEs.</span>
76. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked tests; none exist.</span>
77. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">Lack of tests increases risk but is not a CVE.</span>
78. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked env handling: build fails without DATABASE_URL and Clerk keys.</span>
79. <span style="color:#a855f7">[FINDING]</span> <span style="color:#e5e7eb">Operational failure mode is real; not a security CVE.</span>
80. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked migrations: six migrations, no rollback scripts.</span>
81. <span style="color:#f59e0b">[SMOKE ALARM]</span> <span style="color:#e5e7eb">Operational gap, not a CVE.</span>
82. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Compared Aikido's "update to 16.4.1" with repo's 15.2.4.</span>
83. <span style="color:#3b82f6">[THOUGHT]</span> <span style="color:#e5e7eb">Major version jump requires compatibility validation; not a drop-in fix.</span>
84. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked if Next.js 15.2.6 patch would address the RCE; advisory says &gt;=15.2.6.</span>
85. <span style="color:#ef4444">[REAL RISK]</span> <span style="color:#e5e7eb">Upgrading to at least 15.2.8/15.5.x is the minimum credible remediation.</span>
86. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked Clerk patched version: &gt;=6.39.2 for nextjs, &gt;=3.47.4 for shared.</span>
87. <span style="color:#ef4444">[REAL RISK]</span> <span style="color:#e5e7eb">Clerk upgrade is required to close middleware bypass.</span>
88. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Checked if app uses Clerk's middleware-only protection; yes, but per-route checks also exist.</span>
89. <span style="color:#3b82f6">[THOUGHT]</span> <span style="color:#e5e7eb">Defense-in-depth reduces but does not eliminate the Clerk bypass impact.</span>
90. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Summarized: Aikido is a useful smoke detector but overstates criticality for this codebase.</span>
91. <span style="color:#a855f7">[FINDING]</span> <span style="color:#e5e7eb">Real criticals to fix now: Next.js RSC RCE and Clerk middleware bypass.</span>
92. <span style="color:#a855f7">[FINDING]</span> <span style="color:#e5e7eb">False positives for this repo: Windows RCE, image RCE, i18n bypass, rewrites SSRF, edge payload, websockets.</span>
93. <span style="color:#a855f7">[FINDING]</span> <span style="color:#e5e7eb">Conditional/high: Server Component DoS, middleware segment-prefetch, Server Action exposure.</span>
94. <span style="color:#a855f7">[FINDING]</span> <span style="color:#e5e7eb">Non-CVE app issues: IDOR, plaintext tokens, race conditions, schema FK types.</span>
95. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Recommended patching dependencies first, then fixing IDOR and token storage.</span>
96. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Recommended adding reachability filters to Aikido triage to reduce noise.</span>
97. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Recommended adding tests for authz and booking conflicts.</span>
98. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Recommended adding security headers and env validation.</span>
99. <span style="color:#3b82f6">[THOUGHT]</span> <span style="color:#e5e7eb">Bottom line: Aikido's critical alarm is partly real, mostly smoke for this specific app.</span>
100. <span style="color:#22c55e">[ACTION]</span> <span style="color:#e5e7eb">Wrote this truth-check report to AIKIDO_TRUTH_REPORT.md in the repository root.</span>
