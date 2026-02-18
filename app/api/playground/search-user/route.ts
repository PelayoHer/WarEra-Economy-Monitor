import { NextRequest, NextResponse } from 'next/server';
import { getUserIdByUsername } from '@/lib/playground-api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const username = req.nextUrl.searchParams.get('q')?.trim();

    if (!username || username.length < 2) {
        return NextResponse.json({ found: false, username: null });
    }

    try {
        const userId = await getUserIdByUsername(username);
        if (userId) {
            return NextResponse.json({ found: true, username });
        } else {
            return NextResponse.json({ found: false, username });
        }
    } catch (e) {
        return NextResponse.json({ found: false, username });
    }
}
