export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/dashboard/', '/test/', '/results/'],
      },
    ],
    sitemap: 'https://ielts-reading-simulator.netlify.app/sitemap.xml',
  }
}
