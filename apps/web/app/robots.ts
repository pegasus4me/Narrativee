import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/workspace/',
                '/setting/',
                '/auth/',
                '/success/',
            ],
        },
        sitemap: 'https://narrativee.com/sitemap.xml',
    }
}
