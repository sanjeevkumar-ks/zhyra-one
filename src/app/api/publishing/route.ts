import { NextResponse } from "next/server";
import {
  getPublishingData,
  retryPublication,
  cancelSchedule,
  republishDestination,
  reconcileChannelStatus,
  toggleChannelConnection,
} from "@/lib/services/publishing-service";
import type { PublishingChannelId } from "@/lib/publishing-types";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = getPublishingData();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === "retry") {
      const pubId = body.pubId as string;
      const res = retryPublication(pubId);
      return NextResponse.json({ success: !!res, destination: res });
    }

    if (action === "cancel_schedule") {
      const pubId = body.pubId as string;
      const res = cancelSchedule(pubId);
      return NextResponse.json({ success: !!res, destination: res });
    }

    if (action === "republish") {
      const pubId = body.pubId as string;
      const res = republishDestination(pubId);
      return NextResponse.json({ success: !!res, destination: res });
    }

    if (action === "reconcile") {
      const channelId = body.channelId as PublishingChannelId;
      const res = reconcileChannelStatus(channelId);
      return NextResponse.json({ success: true, ...res });
    }

    if (action === "toggle_channel") {
      const channelId = body.channelId as PublishingChannelId;
      const connected = toggleChannelConnection(channelId);
      return NextResponse.json({ success: true, connected });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

