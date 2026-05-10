// Public probe of the Compass TEE enclave health. Returns the enclave's
// /health JSON when reachable, plus the configured base URL (for transparency
// / verifiability), and a short `mode` summary that the /about page or other
// surfaces can render without forcing a full /api/consume call.
//
// Stays open (no auth) — the enclave URL + signer address + composeHash are
// all already published in docs/notes/phala-deployment.md.

import { NextResponse } from "next/server";
import { getEnclaveUrl, probeEnclaveHealth } from "@/lib/compassEnclave";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const enclaveUrl = getEnclaveUrl();
  if (!enclaveUrl) {
    return NextResponse.json({
      mode: "unconfigured",
      enclaveUrl: null,
      reachable: false,
      message:
        "COMPASS_ENCLAVE_URL is not set. /api/consume falls back to the named stub digest.",
    });
  }
  const probe = await probeEnclaveHealth(enclaveUrl);
  if (!probe.ok) {
    return NextResponse.json({
      mode: "degraded",
      enclaveUrl,
      reachable: false,
      message:
        "Enclave configured but unreachable. /api/consume falls back to the named stub digest.",
    });
  }
  return NextResponse.json({
    mode: probe.source === "tee" ? "tee" : "env",
    enclaveUrl,
    reachable: true,
    signer: probe.signer ?? null,
    source: probe.source ?? null,
  });
}
