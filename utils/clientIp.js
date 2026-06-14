function getClientIp(req) {
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp) {
        return cfIp.trim();
    }

    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    return req.ip || '';
}

module.exports = { getClientIp };
