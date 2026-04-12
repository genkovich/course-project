import { NextResponse } from "next/server";
import { getRandomCaption, getRandomTemplate } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const template = getRandomTemplate();
  const top = getRandomCaption();
  const bottom = getRandomCaption();

  return NextResponse.json({
    template: {
      id: template.id,
      name: template.name,
      imagePath: template.image_path,
    },
    topText: top.text,
    bottomText: bottom.text,
  });
}
