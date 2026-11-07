import { useEffect } from 'react';
import { BLOG_POSTS } from './LatestBlogs';

interface SEOHeadProps {
  activeTab: string;
  activeBlogSlug?: string;
}

interface PageSEOMeta {
  title: string;
  description: string;
  canonicalPath: string;
  schemaType?: string;
}

const PAGE_METADATA: Record<string, PageSEOMeta> = {
  home: {
    title: 'Inisio | Greenfield Project Advisory & Bank Syndication',
    description: 'Inisio provides institutional DPR preparation, debt syndication, bankability scorecards & CMA models for greenfield projects across India.',
    canonicalPath: '/',
    schemaType: 'FinancialService'
  },
  assessment: {
    title: 'Project Feasibility & Bankability Scorecard | Inisio',
    description: 'Evaluate your greenfield project feasibility, DSCR capabilities, and bank loan eligibility with our free institutional appraisal tool.',
    canonicalPath: '/assessment',
    schemaType: 'Service'
  },
  'how-it-works': {
    title: 'How It Works: Greenfield Debt Syndication Roadmap | Inisio',
    description: 'Explore the 5-step roadmap from initial project intake and CMA modeling to credit committee review and bank loan sanction letters.',
    canonicalPath: '/how-it-works',
    schemaType: 'Service'
  },
  about: {
    title: 'Why Choose Inisio | Greenfield Project & Debt Syndication',
    description: 'Learn why promoters and lenders trust Inisio for audit-ready Detailed Project Reports, RBI-compliant DSCR models, and banking syndication.',
    canonicalPath: '/about',
    schemaType: 'AboutPage'
  },
  industries: {
    title: 'Industries & Clusters: Manufacturing, Solar & Agro | Inisio',
    description: 'Explore debt syndication, capital subsidies, and bankability benchmarks across manufacturing, solar parks, food processing & healthcare.',
    canonicalPath: '/industries',
    schemaType: 'CollectionPage'
  },
  blogs: {
    title: 'Greenfield Debt Advisory Knowledge Hub & Insights | Inisio',
    description: 'In-depth research on PSU bank underwriting norms, RBI DSCR calculation, PMKSY capital grants, and bankable solar park DPR clauses.',
    canonicalPath: '/blogs',
    schemaType: 'Blog'
  },
  contact: {
    title: 'Contact Inisio Capital Advisory | Hyderabad Desk & Helpline',
    description: 'Speak with our senior project advisory team in Madhapur, Hyderabad. Call +91 63020 26462 or book a confidential project appraisal.',
    canonicalPath: '/contact',
    schemaType: 'ContactPage'
  },
  faq: {
    title: 'Frequently Asked Questions: Greenfield Bank Funding | Inisio',
    description: 'Get clear answers on institutional DPR drafting, CMA financial models, bank sanction timelines, and central capital subsidies.',
    canonicalPath: '/faq',
    schemaType: 'FAQPage'
  },
  'user-dashboard': {
    title: 'Promoter Project Dashboard & Loan Tracking | Inisio',
    description: 'Securely manage your active greenfield project applications, financial models, underwriting scorecards, and consultant liaison.',
    canonicalPath: '/user-dashboard',
    schemaType: 'WebPage'
  }
};

export const SEOHead: React.FC<SEOHeadProps> = ({ activeTab, activeBlogSlug }) => {
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://inisio.vercel.app';
    let currentMeta: PageSEOMeta = PAGE_METADATA[activeTab] || PAGE_METADATA.home;
    let blogArticle: typeof BLOG_POSTS[0] | undefined;

    // Handle single blog post view
    if (activeTab === 'blogs' && activeBlogSlug) {
      blogArticle = BLOG_POSTS.find((b) => b.slug === activeBlogSlug);
      if (blogArticle) {
        currentMeta = {
          title: `${blogArticle.title} | Inisio Advisory`,
          description: blogArticle.excerpt.slice(0, 155),
          canonicalPath: `/blogs/${blogArticle.slug}`,
          schemaType: 'Article'
        };
      }
    }

    // 1. Update Document Title
    document.title = currentMeta.title;

    // Helper to set or create meta tag
    const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    // 2. Update Meta Description
    setMetaTag('meta[name="description"]', 'name', 'description', currentMeta.description);

    // 3. Update Canonical URL
    const canonicalHref = `${origin}${currentMeta.canonicalPath}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalHref;

    // 4. Update OpenGraph Social Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', currentMeta.title);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', currentMeta.description);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalHref);

    // 5. Update Twitter Social Tags
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', currentMeta.title);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', currentMeta.description);

    // 6. Dynamic JSON-LD Structured Data
    const scriptId = 'dynamic-page-jsonld';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    if (blogArticle) {
      // Schema: Article for Blog Post
      scriptTag.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: blogArticle.title,
        description: blogArticle.excerpt,
        datePublished: '2025-01-15T09:00:00+05:30',
        dateModified: '2025-02-15T12:00:00+05:30',
        author: {
          '@type': 'Organization',
          name: 'Inisio Capital Advisory Team',
          url: 'https://inisio.vercel.app/'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Inisio Capital',
          logo: {
            '@type': 'ImageObject',
            url: 'https://inisio.vercel.app/favicon.svg'
          }
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalHref
        }
      });
    } else {
      // Schema: BreadcrumbList for Clean Navigation
      scriptTag.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: origin
          },
          ...(currentMeta.canonicalPath !== '/'
            ? [
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: currentMeta.title.split('|')[0].trim(),
                  item: canonicalHref
                }
              ]
            : [])
        ]
      });
    }
  }, [activeTab, activeBlogSlug]);

  return null;
};
