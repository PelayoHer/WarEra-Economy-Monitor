
'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { fetchUserWorkers, getHelpers, fetchMarketPrices, getUserIdByUsername } from '@/lib/playground-api';

const TOKEN = process.env.WARERA_TOKEN || '';

export async function getPlaygroundData(username?: string) {
    noStore(); // Prevent Next.js from caching this server action
    let userId = '';

    // If a username was provided, resolve it to a userId first
    if (username && username.trim()) {
        console.log(`[Playground] Resolving username: ${username}`);
        const resolvedId = await getUserIdByUsername(username.trim());
        if (resolvedId) {
            userId = resolvedId;
            console.log(`[Playground] Resolved ${username} -> ${userId}`);
        } else {
            return { error: `Usuario "${username}" no encontrado. Verifica el nombre exacto.` };
        }
    }

    // Fall back to the token owner if no username given
    if (!userId) {
        const helpers = await getHelpers();
        const decodedId = helpers.getUserIdFromToken(TOKEN);
        if (decodedId) {
            userId = decodedId;
        } else {
            return { error: 'Could not decode token' };
        }
    }

    try {
        const [companies, prices] = await Promise.all([
            fetchUserWorkers(userId),
            fetchMarketPrices()
        ]);

        return {
            companies: companies.map(c => ({
                ...c,
                id: c.id, // Ensure id is mapped correctly if it differs
                product: c.itemCode,
                itemCode: c.itemCode,
            })),
            marketPrices: prices
        };
    } catch (e) {
        console.error('Action error', e);
        return { error: 'Failed to fetch data' };
    }
}

