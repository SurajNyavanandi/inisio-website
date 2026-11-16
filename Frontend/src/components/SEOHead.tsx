import { useEffect } from 'react';

interface SEOHeadProps {
  activeTab: string;
  activeBlogSlug?: string;
}

interface PageSEOMeta {
  title: string;
  description: string;
  canonicalPath: string;
  keywords: string;
  schemaType?: string;
}

interface BlogArticleMeta {
  title: string;
  excerpt: string;
  category: string;
  slug: string;
}

const STATIC_BLOG_POSTS: Record<string, BlogArticleMeta> = {
  'greenfield-dscr-underwriting-norms-2025': {
    title: 'How PSU Banks Calculate DSCR for Greenfield Loans',
    excerpt: 'Detailed breakdown of gross vs net debt service coverage ratios, acceptable moratorium tenures, and how credit risk rating models evaluate projected EBITDA.',
    category: 'Project Underwriting',
    slug: 'greenfield-dscr-underwriting-norms-2025'
  },
  'central-state-subsidies-pmksy-food-processing': {
    title: 'Unlocking PMKSY 35%-50% Food Processing Grants',
    excerpt: 'Step-by-step roadmap to integrating Ministry of Food Processing Industries (MoFPI) capital investment grants into your project Means of Finance in India.',
    category: 'Subsidies & Grants',
    slug: 'central-state-subsidies-pmksy-food-processing'
  },
  'solar-park-dpr-power-purchase-agreements': {
    title: 'Key Clauses That Make Solar DPRs 100% Bankable',
    excerpt: 'Evaluating evacuation clearance, CUF generation models, and DISCOM payment escrow mechanisms to secure low-interest green loans from IREDA and SBI.',
    category: 'Renewable Energy',
    slug: 'solar-park-dpr-power-purchase-agreements'
  }
};

const PAGE_METADATA: Record<string, PageSEOMeta> = {
  home: {
    title: 'Inisio | Greenfield Project Advisory & Bank Syndication',
    description: 'Inisio provides institutional DPR preparation, debt syndication, bankability scorecards & CMA models for greenfield projects across India.',
    canonicalPath: '/',
    keywords: 'greenfield project advisory, bank loan syndication, DPR consultant Hyderabad, project finance advisory India, CMA report preparation, DSCR underwriting, bankability scorecard, capital subsidies',
    schemaType: 'FinancialService'
  },
  assessment: {
    title: 'Project Feasibility & Bankability Scorecard | Inisio',
    description: 'Calculate your greenfield project feasibility score, DSCR capability, and bank loan sanction eligibility with our free institutional appraisal tool.',
    canonicalPath: '/assessment',
    keywords: 'project bankability scorecard, greenfield feasibility calculator, bank loan eligibility check, DSCR underwriting tool, debt capacity estimator',
    schemaType: 'Service'
  },
  'how-it-works': {
    title: 'How It Works: Greenfield Debt Syndication | Inisio',
    description: 'Explore our 5-step roadmap from initial project intake and CMA modeling to credit committee review and commercial bank loan sanction letters.',
    canonicalPath: '/how-it-works',
    keywords: 'greenfield loan syndication roadmap, DPR preparation steps, bank loan sanction process, CMA modeling, credit committee submission',
    schemaType: 'Service'
  },
  about: {
    title: 'Why Choose Inisio | Greenfield Project & Debt Advisory',
    description: 'Discover why enterprise promoters and lenders trust Inisio for bank-grade Detailed Project Reports, RBI-aligned DSCR modeling, and debt syndication.',
    canonicalPath: '/about',
    keywords: 'why choose inisio, project finance consultants India, bankable DPR preparation, RBI compliant financial models, debt syndication experts Hyderabad',
    schemaType: 'AboutPage'
  },
  industries: {
    title: 'Industries & Sectors: Manufacturing, Solar & Agro | Inisio',
    description: 'Explore project debt syndication benchmarks, subsidies, and bankability metrics across manufacturing plants, solar parks, cold storage & healthcare.',
    canonicalPath: '/industries',
    keywords: 'manufacturing project finance, solar park DPR consultant, food processing subsidies PMKSY, cold storage loan syndication, industrial capex funding',
    schemaType: 'CollectionPage'
  },
  blogs: {
    title: 'Greenfield Debt Advisory Knowledge Hub & Insights | Inisio',
    description: 'In-depth research on PSU bank underwriting norms, RBI DSCR calculation, PMKSY capital grants, and bankable solar park DPR clauses in India.',
    canonicalPath: '/blogs',
    keywords: 'greenfield project finance blogs, DSCR calculation guide, PSU bank loan underwriting, PMKSY food processing subsidy, solar park DPR clauses',
    schemaType: 'CollectionPage'
  },
  contact: {
    title: 'Contact Inisio Capital Advisory | Hyderabad Desk & Help',
    description: 'Connect with our senior project advisory team in Madhapur, Hyderabad. Call +91 63020 26462 or schedule a confidential greenfield project consultation.',
    canonicalPath: '/contact',
    keywords: 'contact inisio, project finance advisory desk Hyderabad, greenfield loan consultants phone, Madhapur project advisory, debt syndication contact',
    schemaType: 'ContactPage'
  },
  faq: {
    title: 'Frequently Asked Questions: Greenfield Bank Funding | Inisio',
    description: 'Get expert answers on institutional DPR drafting, CMA financial models, bank sanction timelines, debt-equity norms, and central capital subsidies.',
    canonicalPath: '/faq',
    keywords: 'greenfield project funding FAQ, bank loan sanction timeline, DPR preparation cost, CMA report necessity, PMKSY subsidy eligibility',
    schemaType: 'FAQPage'
  },
  'user-dashboard': {
    title: 'Promoter Project Dashboard & Loan Tracking | Inisio',
    description: 'Securely manage your active greenfield project applications, financial models, underwriting scorecards, and consultant liaison.',
    canonicalPath: '/user-dashboard',
    keywords: 'promoter dashboard, loan application tracking, project financial appraisal',
    schemaType: 'WebPage'
  }
};

const BLOG_CUSTOM_TITLES: Record<string, { title: string; description: string }> = {
  'greenfield-dscr-underwriting-norms-2025': {
    title: 'How PSU Banks Calculate DSCR for Greenfield Loans | Inisio',
    description: 'Detailed breakdown of gross vs net debt service coverage ratios, acceptable moratorium tenures, and how credit risk rating models evaluate projected EBITDA.'
  },
  'central-state-subsidies-pmksy-food-processing': {
    title: 'Unlocking PMKSY 35%-50% Food Processing Grants | Inisio',
    description: 'Step-by-step roadmap to integrating Ministry of Food Processing Industries (MoFPI) capital investment grants into your project Means of Finance in India.'
  },
  'solar-park-dpr-power-purchase-agreements': {
    title: 'Key Clauses That Make Solar DPRs 100% Bankable | Inisio',
    description: 'Evaluating evacuation clearance, CUF generation models, and DISCOM payment escrow mechanisms to secure low-interest green loans from IREDA and SBI.'
  }
};

export const SEOHead: React.FC<SEOHeadProps> = ({ activeTab, activeBlogSlug }) => {
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://inisio.vercel.app';
    let currentMeta: PageSEOMeta = PAGE_METADATA[activeTab] || PAGE_METADATA.home;
    let blogArticle: BlogArticleMeta | undefined;

    // Handle single blog post view
    if (activeTab === 'blogs' && activeBlogSlug) {
      blogArticle = STATIC_BLOG_POSTS[activeBlogSlug];
      const customBlogMeta = BLOG_CUSTOM_TITLES[activeBlogSlug];

      if (blogArticle) {
        currentMeta = {
          title: customBlogMeta?.title || `${blogArticle.title.slice(0, 50)} | Inisio`,
          description: customBlogMeta?.description || blogArticle.excerpt.slice(0, 155),
          canonicalPath: `/blogs/${blogArticle.slug}`,
          keywords: `${blogArticle.category}, greenfield project finance, debt syndication, ${blogArticle.title.toLowerCase()}`,
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

    // 2. Update Meta Description and Keywords
    setMetaTag('meta[name="description"]', 'name', 'description', currentMeta.description);
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', currentMeta.keywords);

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

    const breadcrumbSchema = {
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
    };

    let pageSpecificSchema: Record<string, any> | null = null;

    if (blogArticle) {
      pageSpecificSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: blogArticle.title,
        description: blogArticle.excerpt,
        image: 'https://res.cloudinary.com/aessymvl/image/upload/v1786547187/ChatGPT_Image_Aug_12_2026_08_34_57_PM_hb8xi9.png',
        datePublished: '2025-01-15T09:00:00+05:30',
        dateModified: '2026-11-16T12:00:00+05:30',
        author: {
          '@type': 'Organization',
          name: 'Inisio Capital Advisory Team',
          url: origin
        },
        publisher: {
          '@type': 'Organization',
          name: 'Inisio Capital',
          logo: {
            '@type': 'ImageObject',
            url: `${origin}/favicon.svg`
          }
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalHref
        }
      };
    } else if (activeTab === 'contact') {
      pageSpecificSchema = {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: currentMeta.title,
        description: currentMeta.description,
        url: canonicalHref,
        mainEntity: {
          '@type': 'Organization',
          name: 'Inisio Capital',
          telephone: '+916302026462',
          email: 'contact@inisio.com',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Plot 24 & 25, Kakatiya Hills, Road No 9, Madhapur',
            addressLocality: 'Hyderabad',
            addressRegion: 'Telangana',
            postalCode: '500081',
            addressCountry: 'IN'
          }
        }
      };
    } else if (activeTab === 'about') {
      pageSpecificSchema = {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: currentMeta.title,
        description: currentMeta.description,
        url: canonicalHref,
        mainEntity: {
          '@type': 'Organization',
          '@id': `${origin}/#organization`,
          name: 'Inisio Capital'
        }
      };
    } else if (activeTab === 'assessment' || activeTab === 'how-it-works') {
      pageSpecificSchema = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: activeTab === 'assessment' ? 'Greenfield Project Bankability Scorecard & Appraisal' : 'Greenfield Debt Syndication & DPR Roadmap',
        description: currentMeta.description,
        provider: {
          '@type': 'Organization',
          name: 'Inisio Capital',
          url: origin
        },
        areaServed: {
          '@type': 'Country',
          name: 'India'
        }
      };
    }

    const schemasToInject = pageSpecificSchema
      ? [breadcrumbSchema, pageSpecificSchema]
      : [breadcrumbSchema];

    scriptTag.textContent = JSON.stringify(schemasToInject.length === 1 ? schemasToInject[0] : {
      '@context': 'https://schema.org',
      '@graph': schemasToInject
    });
  }, [activeTab, activeBlogSlug]);

  return null;
};
