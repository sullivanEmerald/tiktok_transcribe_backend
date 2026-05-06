
import type { Request } from 'express';

export function getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];

    // x-forwarded-for can be a comma-separated list or an array (some frameworks)
    // Always take the first entry — that's the original client
    if (forwarded) {
        const first = Array.isArray(forwarded)
            ? forwarded[0]
            : forwarded.split(',')[0];

        return first.trim();
    }

    // Fallbacks in priority order
    return (
        req.socket?.remoteAddress ||
        req.ip ||
        'unknown'
    );
}