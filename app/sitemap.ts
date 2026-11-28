import { MetadataRoute } from 'next';

const BASE_URL = 'https://mysupportinfo.com';
const LAST_MODIFIED = new Date('2026-11-28T00:00:00.000Z');

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: BASE_URL,
            lastModified: LAST_MODIFIED,
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/what-is-my-browser`,
            lastModified: LAST_MODIFIED,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/what-is-my-ip`,
            lastModified: LAST_MODIFIED,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/what-is-my-screen-resolution`,
            lastModified: LAST_MODIFIED,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/bufferbloat`,
            lastModified: LAST_MODIFIED,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/faq`,
            lastModified: LAST_MODIFIED,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/privacy`,
            lastModified: LAST_MODIFIED,
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${BASE_URL}/terms`,
            lastModified: LAST_MODIFIED,
            changeFrequency: 'monthly',
            priority: 0.4,
        },
    ];
}
