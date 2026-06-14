const Visit = require('../models/Visit');
const { getClientIp } = require('../utils/clientIp');
const { lookupIpGeo } = require('../utils/ipGeo');
const { createModuleLogger } = require('../utils/logger');

const analyticsLogger = createModuleLogger('analytics-controller');

const VALID_PERIODS = ['day', 'week', 'month', 'year'];

function startOfDay(date = new Date()) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

function startOfWeek(date = new Date()) {
    const d = startOfDay(date);
    const day = d.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setUTCDate(d.getUTCDate() - diff);
    return d;
}

function startOfMonth(date = new Date()) {
    const d = startOfDay(date);
    d.setUTCDate(1);
    return d;
}

function startOfYear(date = new Date()) {
    const d = startOfDay(date);
    d.setUTCMonth(0, 1);
    return d;
}

function getPeriodStart(period, now = new Date()) {
    switch (period) {
        case 'day':
            return startOfDay(now);
        case 'week':
            return startOfWeek(now);
        case 'month':
            return startOfMonth(now);
        case 'year':
            return startOfYear(now);
        default:
            return startOfWeek(now);
    }
}

function getBreakdownConfig(period) {
    switch (period) {
        case 'day':
            return {
                label: 'hour',
                groupFormat: '%Y-%m-%d %H:00',
                sortKey: 'label',
            };
        case 'year':
            return {
                label: 'month',
                groupFormat: '%Y-%m',
                sortKey: 'label',
            };
        default:
            return {
                label: 'day',
                groupFormat: '%Y-%m-%d',
                sortKey: 'label',
            };
    }
}

const analyticsController = {
    recordVisit: async (req, res) => {
        try {
            const ip = getClientIp(req);
            if (!ip) {
                return res.status(400).json({ error: 'Unable to determine client IP' });
            }

            const referer = req.headers.referer || req.headers.referrer || '';
            const userAgent = req.headers['user-agent'] || '';
            const geo = lookupIpGeo(ip);

            await Visit.create({
                ip,
                referer,
                userAgent,
                country: geo.country,
                region: geo.region,
                city: geo.city,
                timezone: geo.timezone,
            });

            res.status(201).json({ ok: true });
        } catch (error) {
            analyticsLogger.error({
                type: 'record_visit_error',
                error: error.message,
            });
            res.status(500).json({ error: 'Failed to record visit' });
        }
    },

    getStats: async (req, res) => {
        try {
            const period = VALID_PERIODS.includes(req.query.period)
                ? req.query.period
                : 'week';

            const now = new Date();
            const periodStart = getPeriodStart(period, now);
            const dateFilter = { visitedAt: { $gte: periodStart } };
            const breakdownConfig = getBreakdownConfig(period);

            const [periodVisits, uniqueIps, breakdown, visits, topCountries] = await Promise.all([
                Visit.countDocuments(dateFilter),
                Visit.distinct('ip', dateFilter),
                Visit.aggregate([
                    { $match: dateFilter },
                    {
                        $group: {
                            _id: {
                                $dateToString: {
                                    format: breakdownConfig.groupFormat,
                                    date: '$visitedAt',
                                    timezone: 'UTC',
                                },
                            },
                            visits: { $sum: 1 },
                            uniqueIps: { $addToSet: '$ip' },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            label: '$_id',
                            visits: 1,
                            uniqueIps: { $size: '$uniqueIps' },
                        },
                    },
                    { $sort: { label: -1 } },
                ]),
                Visit.find(dateFilter)
                    .sort({ visitedAt: -1 })
                    .select('ip referer userAgent country region city timezone visitedAt')
                    .lean(),
                Visit.aggregate([
                    { $match: { ...dateFilter, country: { $ne: '' } } },
                    {
                        $group: {
                            _id: '$country',
                            visits: { $sum: 1 },
                        },
                    },
                    { $sort: { visits: -1 } },
                    { $limit: 10 },
                    {
                        $project: {
                            _id: 0,
                            country: '$_id',
                            visits: 1,
                        },
                    },
                ]),
            ]);

            res.json({
                period,
                retentionDays: 30,
                summary: {
                    visits: periodVisits,
                    uniqueIps: uniqueIps.length,
                },
                breakdown: {
                    unit: breakdownConfig.label,
                    items: breakdown,
                },
                topCountries,
                visits: visits.map((visit) => ({
                    ip: visit.ip,
                    referer: visit.referer,
                    userAgent: visit.userAgent,
                    country: visit.country,
                    region: visit.region,
                    city: visit.city,
                    timezone: visit.timezone,
                    visitedAt: visit.visitedAt,
                })),
            });
        } catch (error) {
            analyticsLogger.error({
                type: 'get_stats_error',
                error: error.message,
            });
            res.status(500).json({ error: 'Failed to load analytics' });
        }
    },
};

module.exports = analyticsController;
