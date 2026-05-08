import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card, PageHeader } from "@/components/admin/ui";
import { formatDateTimeInSchoolTz } from "@/lib/format";
import { issueQrForMember, revokeQr } from "./actions";
import { qrPngDataUrl } from "@/lib/qr/image";
import { createHmac } from "node:crypto";

export const metadata = { title: "Member QR" };
export const dynamic = "force-dynamic";

// Reproduce the encoded form for an already-issued tokenId so the same
// PNG can be re-rendered any time without persisting the full encoded
// string. (The signature is derived from the tokenId + secret.)
function encodeFromTokenId(tokenId: string): string {
  const sig = createHmac("sha256", process.env.QR_TOKEN_SECRET ?? "")
    .update(tokenId)
    .digest("base64url");
  return `${tokenId}.${sig}`;
}

export default async function MemberQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: m } = await supabase
    .from("members")
    .select(
      "id,first_name,last_name,nickname,email,qr_token,qr_issued_at,qr_revoked_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!m) notFound();

  const hasQr = !!m.qr_token;
  // Use a fresh encoded string only as the on-page QR image.
  // We don't persist the signature (only the tokenId), so re-derive it.
  const encoded = hasQr ? encodeFromTokenId(m.qr_token!) : null;
  const dataUrl = encoded ? await qrPngDataUrl(encoded) : null;

  return (
    <>
      <PageHeader
        title="Attendance QR"
        description={`${m.first_name} ${m.last_name}${m.nickname ? ` (${m.nickname})` : ""}`}
        back={`/admin/members/${m.id}`}
      />

      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col items-center gap-5 p-8">
          {dataUrl ? (
            <>
              <div className="rounded-xl border border-foreground/10 bg-background p-3">
                {/* Inline data URL — print this page to give the member
                    a paper copy. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dataUrl}
                  alt="Member attendance QR code"
                  width={240}
                  height={240}
                  className="block"
                />
              </div>
              <p className="text-center text-xs text-muted-foreground max-w-xs">
                Show this code at class to log attendance. The token is
                signed and unique to {m.first_name}.
              </p>
              <a
                href={dataUrl}
                download={`wtc-qr-${m.last_name}-${m.first_name}.png`}
                className="text-sm text-vermillion underline-offset-4 hover:underline"
              >
                Download PNG
              </a>
            </>
          ) : (
            <div className="text-center text-muted-foreground">
              <p className="font-medium">No QR issued yet.</p>
              <p className="mt-1 text-sm">
                Issue one to enable QR-based attendance for this member.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-medium tracking-tight">
            Status
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <Row label="State">
              {hasQr ? (
                <Badge tone="jade">Active</Badge>
              ) : m.qr_revoked_at ? (
                <Badge tone="muted">Revoked</Badge>
              ) : (
                <Badge tone="muted">Not issued</Badge>
              )}
            </Row>
            {m.qr_issued_at && (
              <Row label="Issued">
                {formatDateTimeInSchoolTz(m.qr_issued_at)}
              </Row>
            )}
            {m.qr_revoked_at && (
              <Row label="Revoked">
                {formatDateTimeInSchoolTz(m.qr_revoked_at)}
              </Row>
            )}
            <Row label="Email">
              <a
                href={`mailto:${m.email}`}
                className="text-foreground/80 hover:text-foreground"
              >
                {m.email}
              </a>
            </Row>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-foreground/10 pt-5">
            <form action={issueQrForMember}>
              <input type="hidden" name="id" value={m.id} />
              <Button type="submit">{hasQr ? "Regenerate" : "Issue QR"}</Button>
            </form>

            {hasQr && (
              <form action={revokeQr}>
                <input type="hidden" name="id" value={m.id} />
                <Button type="submit" variant="ghost">
                  Revoke
                </Button>
              </form>
            )}
          </div>

          <p className="mt-5 text-xs text-muted-foreground leading-relaxed">
            Regenerating issues a new token and invalidates the old one
            immediately. Use this when a member loses their phone or the
            old QR was shared by accident.
          </p>
        </Card>
      </div>
      </div>
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[6rem_1fr] items-baseline gap-3">
      <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}
