import { NextResponse } from "next/server";
import stadiumsData from "@/data/stadiums.json";

export async function GET() {
  return NextResponse.json({ stadiums: stadiumsData, total: stadiumsData.length });
}
