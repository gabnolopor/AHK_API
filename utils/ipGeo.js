const geoip = require('geoip-lite');

function isPrivateOrLocalIp(ip) {
    if (!ip) return true;

    const normalized = ip.replace(/^::ffff:/, '');

    if (normalized === '127.0.0.1' || normalized === '::1' || normalized === 'localhost') {
        return true;
    }

    if (normalized.startsWith('10.') ||
        normalized.startsWith('192.168.') ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) {
        return true;
    }

    return false;
}

function lookupIpGeo(ip) {
    if (isPrivateOrLocalIp(ip)) {
        return {
            country: '',
            region: '',
            city: '',
            timezone: '',
        };
    }

    const lookup = geoip.lookup(ip);

    if (!lookup) {
        return {
            country: '',
            region: '',
            city: '',
            timezone: '',
        };
    }

    return {
        country: lookup.country || '',
        region: lookup.region || '',
        city: lookup.city || '',
        timezone: lookup.timezone || '',
    };
}

module.exports = { lookupIpGeo, isPrivateOrLocalIp };
