import { MetadataRoute } from 'next';

const BASE_URL = 'https://mysupportinfo.com';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/private/'],
        },
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
