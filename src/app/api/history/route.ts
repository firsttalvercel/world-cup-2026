import { NextResponse } from "next/server";
import historyData from "@/data/history.json";

export async function GET() {
  return NextResponse.json(historyData);
}
