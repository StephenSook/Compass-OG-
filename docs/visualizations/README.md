# Compass — Visualizations

Three pre-rendered visualizations of the Compass codebase, in increasing order of architectural detail.

| Artifact | What it is | Open with |
|---|---|---|
| [`compass-gource.mp4`](./compass-gource.mp4) (3.2 MB) | Animated git-history time-lapse: every commit, every file, every contributor, growing the repo from `init` to `v0.5` in ~30 seconds. Rendered with [gource 0.56](https://gource.io/). | Any video player. Loops well as a B-roll backdrop. |
| [`compass-architecture-3d.html`](./compass-architecture-3d.html) (18 KB) | Hand-curated **3D force-directed knowledge graph** of the six Compass layers (holder / credential / 0G Storage / 0G Chain / TEE / verifier). 22 nodes, 27 directed edges. Hover to trace neighbors, click for layer detail. Built on [three.js](https://threejs.org/) + [3d-force-graph](https://vasturiano.github.io/3d-force-graph/) with bloom post-processing. | `python3 -m http.server 8888` then open <http://localhost:8888/docs/visualizations/compass-architecture-3d.html>. Import maps require HTTP — `file://` will not load. |
| [`compass-knowledge-graph.html`](./compass-knowledge-graph.html) (374 KB) + [`.json`](./compass-knowledge-graph.json) (423 KB) | **Auto-generated full-codebase graph** via [graphify](https://github.com/sokratesgmbh/graphify): 484 nodes (files + symbols), 491 edges (containment, imports, calls), 132 communities. Standard force-directed viz. RAG-ready JSON. | `python3 -m http.server 8888` then open <http://localhost:8888/docs/visualizations/compass-knowledge-graph.html>. |
| [`compass-graph-report.md`](./compass-graph-report.md) (35 KB) | Plain-language audit of every node + edge from `graphify`. Useful for grepping "what touches `verifyReceipt.ts`?" without parsing JSON. | Any markdown viewer. |

## Why two graphs?

- **`compass-architecture-3d.html`** is the **demo-grade story**: 22 hand-picked nodes a non-engineer judge can follow. Use this for the live walkthrough.
- **`compass-knowledge-graph.html`** is the **engineering-grade index**: every TypeScript symbol and Solidity contract surface. Use this when answering "what would break if I refactored `consumeGrantAndIssueReceipt`?"

## Regenerating

```bash
# 3D architecture graph — edit the inline nodes/links in compass-architecture-3d.html
$EDITOR docs/visualizations/compass-architecture-3d.html

# Full-codebase graphify — re-runs in ~30 seconds, no LLM needed
graphify update .
cp graphify-out/{graph.html,graph.json,GRAPH_REPORT.md} docs/visualizations/
mv docs/visualizations/{graph.html,compass-knowledge-graph.html}
mv docs/visualizations/{graph.json,compass-knowledge-graph.json}
mv docs/visualizations/{GRAPH_REPORT.md,compass-graph-report.md}

# Gource time-lapse — see the command in this repo's CHANGELOG entry for v0.5
gource --start-date "2026-05-06" --seconds-per-day 6 \
  --hide mouse,progress,filenames -1280x720 --output-ppm-stream - \
  | ffmpeg -y -r 30 -f image2pipe -vcodec ppm -i - \
    -vcodec libx264 -preset fast -pix_fmt yuv420p -crf 23 \
    docs/visualizations/compass-gource.mp4
```

## Notes

- The 3D HTML files are **standalone** — no build step, only CDN imports. They will keep working as long as `esm.sh` mirrors `three@0.181.0` and `3d-force-graph@1.73.4`.
- `compass-knowledge-graph.json` is **GraphRAG-ready** (NetworkX node-link format). Drop it into a vector index alongside the codebase to enable semantic queries like *"find every function that references the receipt-signer key"*.
- The Gource video is rendered with bloom + neon background to match the rest of the Cinematic Privacy aesthetic.
