import { NextResponse } from "next/server";
import { listMemes, saveMeme } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const memes = listMemes();
  return NextResponse.json({ memes });
}

type SaveBody = {
  templateId?: unknown;
  topText?: unknown;
  bottomText?: unknown;
};

export async function POST(request: Request) {
  let body: SaveBody;
  try {
    body = (await request.json()) as SaveBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const templateId = Number(body.templateId);
  if (!Number.isInteger(templateId) || templateId <= 0) {
    return NextResponse.json(
      { ok: false, error: "templateId must be a positive integer" },
      { status: 400 }
    );
  }

  const topText =
    typeof body.topText === "string" && body.topText.length > 0
      ? body.topText
      : null;
  const bottomText =
    typeof body.bottomText === "string" && body.bottomText.length > 0
      ? body.bottomText
      : null;

  const { id } = saveMeme({ templateId, topText, bottomText });
  return NextResponse.json({ ok: true, id });
}
