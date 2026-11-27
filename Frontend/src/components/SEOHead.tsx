import { useEffect } from 'react';
import type { BlogPostItem } from '../types';

interface SEOHeadProps {
  activeTab: string;
  activeBlogSlug?: string;
  activeBlog?: BlogPostItem | null;
}

interface PageSEOMeta {
  title: string;
  description: string;
  canonicalPath: string;
  keywords: string;
  robots?: string;
  ogType?: 'website' | 'article';
  imageAlt?: string;
}

interface BlogArticleMeta {
  title: string;
  seoTitle: string;
  description: string;
  excerpt: string;
  category: string;
  slug: string;
  datePublished: string;
  author: string;
}

// TODO: Replace Cloudinary OG image with a dedicated 1200x630 branded asset hosted on the primary domain
const DEFAULT_OG_IMAGE =
  'https://res.cloudinary.com/aessymvl/image/upload/v1786547187/ChatGPT_Image_Aug_12_2026_08_34_57_PM_hb8xi9.png';

const PUBLIC_ROBOTS =
  'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
const PRIVATE_ROBOTS = 'noindex, nofollow';

const PRIVATE_TABS = new Set([
  'user-dashboard',
  'ca-dashboard',
  'dpr-dashboard',
  'prosync-dashboard',
  'admin-dashboard',
  'ca-admin-dashboard',
]);

const STATIC_BLOG_POSTS: Record<string, BlogArticleMeta> = {
  'greenfield-dscr-underwriting-norms-2025': {
    title: 'How PSU Banks Calculate DSCR for Greenfield Manufacturing in 2025',
    seoTitle: 'How PSU Banks Calculate DSCR for Greenfield | Inisio',
    description:
      'Learn how PSU banks in India calculate gross vs net DSCR, evaluate projected EBITDA, and set moratorium norms for greenfield manufacturing loans.',
    excerpt:
      'Detailed breakdown of gross vs net debt service coverage ratios, acceptable moratorium tenures, and how credit risk rating models evaluate projected EBITDA.',
    category: 'Debt Syndication',
    slug: 'greenfield-dscr-underwriting-norms-2025',
    datePublished: '2025-02-01T09:00:00+05:30',
    author: 'Inisio Research & Advisory Desk',
  },
  'central-state-subsidies-pmksy-food-processing': {
    title: 'Unlocking PMKSY 35%-50% Grants for Agro-Processing & Cold Storage Units',
    seoTitle: 'Unlock PMKSY 35%-50% Food Processing Grants | Inisio',
    description:
      'Step-by-step guide to integrating MoFPI PMKSY capital subsidies into Means of Finance for agro-processing and cold storage projects in India.',
    excerpt:
      'Step-by-step roadmap to integrating Ministry of Food Processing Industries (MoFPI) capital investment grants into your project Means of Finance.',
    category: 'Subsidies & Grants',
    slug: 'central-state-subsidies-pmksy-food-processing',
    datePublished: '2025-01-20T09:00:00+05:30',
    author: 'Inisio Research & Advisory Desk',
  },
  'solar-park-dpr-power-purchase-agreements': {
    title: 'Key Technical & Financial Clauses That Make Solar DPRs 100% Bankable',
    seoTitle: 'Clauses That Make Solar Park DPRs Bankable | Inisio',
    description:
      'Understand PVSyst generation models, DISCOM evacuation clearance, and PPA escrow clauses required for solar park loans from IREDA and SBI.',
    excerpt:
      'Evaluating evacuation clearance, CUF generation models, and DISCOM payment escrow mechanisms to secure low-interest green loans from IREDA and SBI.',
    category: 'Renewables',
    slug: 'solar-park-dpr-power-purchase-agreements',
    datePublished: '2025-01-10T09:00:00+05:30',
    author: 'Inisio Research & Advisory Desk',
  },
};

const PAGE_METADATA: Record<string, PageSEOMeta> = {
  home: {
    title: 'Inisio | Greenfield Project Advisory & Bank Syndication',
    description:
      'Inisio Capital offers bankable DPR preparation, debt syndication, CMA modeling, and greenfield project advisory in Hyderabad & across India.',
    canonicalPath: '/',
    keywords:
      'Inisio, Inisio Capital, Inisio Advisory, greenfield project advisory, bank loan syndication India, DPR consultant in Hyderabad, Hyderabad DPR consultant, project finance advisory in Hyderabad, Hyderabad project finance advisory, debt syndication Hyderabad, CMA report preparation, DSCR underwriting, bankability scorecard',
    imageAlt: 'Inisio Capital Greenfield Project Advisory and Bank Debt Syndication Desk in Hyderabad',
  },
  assessment: {
    title: 'Project Feasibility & Bankability Scorecard | Inisio',
    description:
      "Calculate your greenfield project feasibility score, DSCR, and term loan eligibility in minutes with Inisio's free bankability scorecard.",
    canonicalPath: '/assessment',
    keywords:
      'project bankability scorecard, greenfield feasibility calculator India, bank loan eligibility check, DSCR underwriting tool, debt capacity estimator, DPR feasibility check Hyderabad, Inisio Capital assessment',
    imageAlt: 'Inisio Greenfield Project Feasibility and Bankability Scorecard Tool',
  },
  'how-it-works': {
    title: 'How It Works: 6-Step Debt Syndication Process | Inisio',
    description:
      "Explore Inisio's 6-step greenfield funding roadmap from feasibility check and DPR drafting to credit committee review and bank loan sanction.",
    canonicalPath: '/how-it-works',
    keywords:
      'greenfield loan syndication roadmap, DPR preparation process India, bank loan sanction steps Hyderabad, CMA financial modeling process, project teaser DOCX, Inisio Capital funding roadmap',
    imageAlt: 'Inisio 6-Step Greenfield Project Debt Syndication Process',
  },
  about: {
    title: 'Why Choose Inisio Capital | Project & Debt Advisory',
    description:
      'Learn why industrial promoters trust Inisio Capital in Hyderabad for RBI-aligned DPRs, CMA financial modeling, subsidies, and bank syndication.',
    canonicalPath: '/about',
    keywords:
      'about Inisio, Inisio Capital Hyderabad, project finance consultants in Hyderabad, best DPR consultant Hyderabad, Telangana debt syndication advisory, bankable DPR consultants India, TEV study certification',
    imageAlt: 'Why Greenfield Promoters Partner with Inisio Capital Advisory in Hyderabad',
  },
  industries: {
    title: 'Industries: Manufacturing, Solar & Agro Loans | Inisio',
    description:
      'Review greenfield project finance norms, DSCR benchmarks, and capital subsidies for solar, food processing, warehousing, and hospital projects.',
    canonicalPath: '/industries',
    keywords:
      'solar park DPR consultant India, basmati rice mill project loan Telangana, warehouse logistics park finance Hyderabad, hospital project debt syndication, eco-resort project loan, PMKSY subsidies Telangana, greenfield project sectors India',
    imageAlt: 'Inisio Greenfield Project Finance Benchmarks Across Priority Sectors',
  },
  blogs: {
    title: 'Greenfield Project Finance & DPR Insights Hub | Inisio',
    description:
      'Read practical research from Inisio on PSU bank DSCR underwriting, PMKSY food processing grants, CMA modeling, and bankable solar park DPRs.',
    canonicalPath: '/blogs',
    keywords:
      'greenfield project finance blogs, DSCR calculation guide India, PSU bank underwriting norms, PMKSY food processing subsidy guide, solar park DPR clauses, Inisio Capital research Hyderabad',
    imageAlt: 'Inisio Capital Greenfield Project Finance Knowledge Hub',
  },
  contact: {
    title: 'Contact Inisio Capital Advisory Desk | Hyderabad India',
    description:
      "Speak with Inisio's greenfield project finance and DPR consultants in Madhapur, Hyderabad. Call +91 63020 26462 or book a confidential review.",
    canonicalPath: '/contact',
    keywords:
      'contact Inisio, Inisio Capital Madhapur Hyderabad, DPR consultant in Madhapur Hyderabad, greenfield project loan advisory Telangana, debt syndication desk Hyderabad',
    imageAlt: 'Contact Inisio Capital Project Advisory Headquarters in Madhapur Hyderabad',
  },
  faq: {
    title: 'Greenfield Bank Funding & DPR Advisory FAQs | Inisio',
    description:
      'Get clear answers from Inisio on bank-grade DPR drafting, CMA financial models, bank sanction timelines, subsidy mapping, and NDA security.',
    canonicalPath: '/faq',
    keywords:
      'greenfield project funding FAQ, bank loan sanction timeline India, DPR preparation questions Hyderabad, CMA report requirements, government subsidy mapping Telangana, Inisio Capital FAQs',
    imageAlt: 'Frequently Asked Questions on Greenfield Project Funding and DPR Advisory',
  },
  'user-dashboard': {
    title: 'Promoter Project Dashboard & Loan Tracking | Inisio',
    description:
      'Manage your greenfield project assessments, financial models, bankability scorecards, and advisory liaison inside the Inisio promoter portal.',
    canonicalPath: '/user-dashboard',
    keywords: 'promoter dashboard, Inisio account, project financial appraisal',
    robots: PRIVATE_ROBOTS,
  },
  'ca-dashboard': {
    title: 'Chartered Accountant Audit Portal | Inisio Capital',
    description: 'Internal CA and CMA audit workspace for verified Inisio partners.',
    canonicalPath: '/ca-dashboard',
    keywords: 'CA portal, CMA audit',
    robots: PRIVATE_ROBOTS,
  },
  'ca-admin-dashboard': {
    title: 'CA Operations Admin Portal | Inisio Capital',
    description: 'Internal CA operations administration portal for Inisio.',
    canonicalPath: '/ca-admin',
    keywords: 'CA admin portal',
    robots: PRIVATE_ROBOTS,
  },
  'dpr-dashboard': {
    title: 'DPR Consultant Workspace | Inisio Capital',
    description: 'Internal Detailed Project Report consultant workspace for Inisio.',
    canonicalPath: '/dpr-dashboard',
    keywords: 'DPR consultant portal',
    robots: PRIVATE_ROBOTS,
  },
  'prosync-dashboard': {
    title: 'Prosync Banking Desk Portal | Inisio Capital',
    description: 'Internal institutional banking syndication desk for Inisio.',
    canonicalPath: '/prosync-dashboard',
    keywords: 'banking desk portal',
    robots: PRIVATE_ROBOTS,
  },
  'admin-dashboard': {
    title: 'Executive Admin Console | Inisio Capital',
    description: 'Restricted executive administration portal for Inisio.',
    canonicalPath: '/admin',
    keywords: 'admin console',
    robots: PRIVATE_ROBOTS,
  },
};

const ON_PAGE_FAQS = [
  {
    question: 'How is Inisio different from conventional DPR writers or local agents?',
    answer:
      'Traditional brokers provide boilerplate word documents that fail institutional credit committee audits. Inisio prepares institutional-grade financial models (CMA, DCF, Sensitivity & Break-even models) built specifically to satisfy RBI guidelines and the credit scoring rubrics used by commercial banks.',
  },
  {
    question: 'What is the typical timeline to secure a bank sanction letter?',
    answer:
      'With a verified institutional DPR and audit-ready financial model from Inisio, typical term loan sanctions take 20 to 45 working days, compared to 4 to 8 months through conventional unguided bank submissions.',
  },
  {
    question: 'Can Inisio assist in identifying state and central government subsidies?',
    answer:
      'Yes. Every project evaluation maps your location, sector, and capital expenditure against active central schemes (like PM-KUSUM, PMKSY, PLI, CGTMSE) and state industrial promotion policies (SGST reimbursement, stamp duty waivers, and capital subsidies).',
  },
  {
    question: 'What documents do I need to start my free project feasibility assessment?',
    answer:
      'You can begin instantly with basic project estimates: estimated project cost, proposed land status, sector, and preliminary promoter contribution. Detailed balance sheets and quotations can be uploaded later during bank submission preparation.',
  },
  {
    question: 'How is project data confidentiality protected?',
    answer:
      'All financial data, proprietary technical specifications, and promoter details are encrypted and bound by strict Non-Disclosure Agreements (NDA). Your data is never shared with unauthorized parties or external sales brokers.',
  },
];

const HOW_IT_WORKS_SCHEMA_STEPS = [
  {
    name: 'Tell Us About Your Project',
    text: 'Share initial information about your project vision, target industry, land status, planned capacity, and capital requirements.',
  },
  {
    name: 'Assess Your Project',
    text: 'Structure your project financial model, capital cost breakdown (civil, machinery, consultancy), and means of finance.',
  },
  {
    name: 'Check Your Credit Profile',
    text: 'Evaluate promoter background, management track record, existing credit history, and equity contribution readiness.',
  },
  {
    name: 'Get Bankability Insights',
    text: 'Receive instant institutional underwriting metrics including DSCR thresholds, debt service capacity, and a bankability rating from AAA to BBB.',
  },
  {
    name: 'Download AI Project Teaser',
    text: 'Generate and download an Executive Project Teaser formatted for institutional lenders and investors in editable DOCX and PDF formats.',
  },
  {
    name: 'Choose Your Next Step / Move Towards Funding',
    text: 'Collaborate with Chartered Accountants and Project Finance specialists for bank-ready DPR preparation, CMA modeling, and institutional sanction support.',
  },
];

const SECTOR_LIST_ITEMS = [
  'Basmati Rice Processing & Export Unit',
  'Solar Power Plant (Ground-Mounted & Rooftop)',
  'Rice Mill Project (Paddy Milling)',
  'Warehouse Logistics Park (Grade-A)',
  'Multi-Specialty Hospital Project (50 Beds)',
  'Resort & Eco-Tourism Hospitality',
];

function formatDynamicTitle(rawTitle: string): string {
  const suffix = ' | Inisio';
  const maxBaseLen = 60 - suffix.length;
  const trimmed = rawTitle.trim();
  if (trimmed.length <= maxBaseLen) {
    return `${trimmed}${suffix}`;
  }
  return `${trimmed.slice(0, maxBaseLen - 1).trim()}…${suffix}`;
}

function formatDynamicDescription(rawText: string): string {
  const cleaned = rawText.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 158) return cleaned;
  return `${cleaned.slice(0, 155).trim()}...`;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ activeTab, activeBlogSlug, activeBlog }) => {
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://inisio.vercel.app';
    let currentMeta: PageSEOMeta = PAGE_METADATA[activeTab] || PAGE_METADATA.home;
    let resolvedBlog: BlogArticleMeta | undefined;

    if (activeTab === 'blogs' && activeBlogSlug) {
      const staticMatch = STATIC_BLOG_POSTS[activeBlogSlug];
      if (staticMatch) {
        resolvedBlog = staticMatch;
      } else if (activeBlog && activeBlog.slug === activeBlogSlug) {
        resolvedBlog = {
          title: activeBlog.title,
          seoTitle: formatDynamicTitle(activeBlog.title),
          description: formatDynamicDescription(activeBlog.excerpt || activeBlog.title),
          excerpt: activeBlog.excerpt || activeBlog.title,
          category: activeBlog.category || 'Project Finance',
          slug: activeBlog.slug,
          datePublished: '2025-01-15T09:00:00+05:30',
          author: activeBlog.author || 'Inisio Research & Advisory Desk',
        };
      }

      if (resolvedBlog) {
        currentMeta = {
          title: resolvedBlog.seoTitle,
          description: resolvedBlog.description,
          canonicalPath: `/blogs/${resolvedBlog.slug}`,
          keywords: `${resolvedBlog.category}, greenfield project finance, Inisio Capital, debt syndication India, ${resolvedBlog.title.toLowerCase()}`,
          ogType: 'article',
          imageAlt: resolvedBlog.title,
        };
      }
    }

    const robotsContent =
      currentMeta.robots || (PRIVATE_TABS.has(activeTab) ? PRIVATE_ROBOTS : PUBLIC_ROBOTS);

    // 1. Update Document Title
    document.title = currentMeta.title;

    const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    // 2. Standard Meta Tags
    setMetaTag('meta[name="description"]', 'name', 'description', currentMeta.description);
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', currentMeta.keywords);
    setMetaTag('meta[name="robots"]', 'name', 'robots', robotsContent);

    // 3. Canonical URL
    const canonicalHref = `${origin}${currentMeta.canonicalPath}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalHref;

    // 4. Open Graph Social Tags
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', currentMeta.ogType || 'website');
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Inisio Capital');
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'en_IN');
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', currentMeta.title);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', currentMeta.description);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalHref);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', DEFAULT_OG_IMAGE);
    setMetaTag('meta[property="og:image:width"]', 'property', 'og:image:width', '1200');
    setMetaTag('meta[property="og:image:height"]', 'property', 'og:image:height', '630');
    setMetaTag(
      'meta[property="og:image:alt"]',
      'property',
      'og:image:alt',
      currentMeta.imageAlt || currentMeta.title
    );

    // 5. Twitter / X Social Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', currentMeta.title);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', currentMeta.description);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', DEFAULT_OG_IMAGE);
    setMetaTag(
      'meta[name="twitter:image:alt"]',
      'name',
      'twitter:image:alt',
      currentMeta.imageAlt || currentMeta.title
    );

    // 6. Dynamic Route-Specific JSON-LD Structured Data
    const scriptId = 'dynamic-page-jsonld';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    // Do not emit rich public structured data on private noindex portals
    if (PRIVATE_TABS.has(activeTab)) {
      scriptTag.textContent = '';
      return;
    }

    const graphNodes: Record<string, any>[] = [];

    // BreadcrumbList for all public routes
    const breadcrumbItems: Record<string, any>[] = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${origin}/`,
      },
    ];

    if (resolvedBlog) {
      breadcrumbItems.push(
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Blogs & Insights',
          item: `${origin}/blogs`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: resolvedBlog.title,
          item: canonicalHref,
        }
      );
    } else if (currentMeta.canonicalPath !== '/') {
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 2,
        name: currentMeta.title.split('|')[0].trim(),
        item: canonicalHref,
      });
    }

    graphNodes.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalHref}#breadcrumb`,
      itemListElement: breadcrumbItems,
    });

    // Page-specific Schema.org nodes matching only real on-page content
    if (resolvedBlog) {
      graphNodes.push({
        '@type': 'Article',
        '@id': `${canonicalHref}#article`,
        headline: resolvedBlog.title,
        description: resolvedBlog.description,
        articleSection: resolvedBlog.category,
        inLanguage: 'en-IN',
        image: DEFAULT_OG_IMAGE,
        datePublished: resolvedBlog.datePublished,
        dateModified: '2026-11-27T12:00:00+05:30',
        author: {
          '@type': 'Organization',
          name: resolvedBlog.author,
          url: `${origin}/`,
        },
        publisher: {
          '@type': 'Organization',
          '@id': `${origin}/#organization`,
          name: 'Inisio Capital',
          logo: {
            '@type': 'ImageObject',
            url: `${origin}/favicon.svg`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalHref,
        },
      });
    } else if (activeTab === 'home' || activeTab === 'faq') {
      graphNodes.push({
        '@type': 'FAQPage',
        '@id': `${canonicalHref}#faq`,
        mainEntity: ON_PAGE_FAQS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      });
    } else if (activeTab === 'contact') {
      graphNodes.push({
        '@type': 'ContactPage',
        '@id': `${canonicalHref}#contactpage`,
        name: currentMeta.title,
        description: currentMeta.description,
        url: canonicalHref,
        mainEntity: {
          '@type': 'FinancialService',
          '@id': `${origin}/#organization`,
          name: 'Inisio Capital',
          telephone: '+916302026462',
          // TODO: Confirm official contact email (advisory@inisio.in vs contact@inisio.com in Footer)
          email: 'advisory@inisio.in',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '2nd Floor, Plot 24 & 25, Kakatiya Hills, Road No 9, Madhapur',
            addressLocality: 'Hyderabad',
            addressRegion: 'Telangana',
            postalCode: '500081',
            addressCountry: 'IN',
          },
        },
      });
    } else if (activeTab === 'about') {
      graphNodes.push({
        '@type': 'AboutPage',
        '@id': `${canonicalHref}#aboutpage`,
        name: currentMeta.title,
        description: currentMeta.description,
        url: canonicalHref,
        mainEntity: {
          '@type': 'FinancialService',
          '@id': `${origin}/#organization`,
          name: 'Inisio Capital',
        },
      });
    } else if (activeTab === 'how-it-works') {
      graphNodes.push(
        {
          '@type': 'Service',
          '@id': `${canonicalHref}#service`,
          name: '6-Step Greenfield Debt Syndication & DPR Roadmap',
          description: currentMeta.description,
          provider: {
            '@type': 'FinancialService',
            '@id': `${origin}/#organization`,
            name: 'Inisio Capital',
          },
          areaServed: [
            { '@type': 'City', name: 'Hyderabad' },
            { '@type': 'State', name: 'Telangana' },
            { '@type': 'Country', name: 'India' },
          ],
        },
        {
          '@type': 'HowTo',
          '@id': `${canonicalHref}#howto`,
          name: 'How to Assess Greenfield Project Bankability and Secure Debt Funding',
          description: currentMeta.description,
          step: HOW_IT_WORKS_SCHEMA_STEPS.map((step, index) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name: step.name,
            text: step.text,
          })),
        }
      );
    } else if (activeTab === 'assessment') {
      graphNodes.push(
        {
          '@type': 'Service',
          '@id': `${canonicalHref}#service`,
          name: 'Greenfield Project Feasibility & Bankability Scorecard',
          description: currentMeta.description,
          provider: {
            '@type': 'FinancialService',
            '@id': `${origin}/#organization`,
            name: 'Inisio Capital',
          },
          areaServed: [
            { '@type': 'City', name: 'Hyderabad' },
            { '@type': 'State', name: 'Telangana' },
            { '@type': 'Country', name: 'India' },
          ],
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'INR',
            description: 'Free Starter greenfield project feasibility check and bankability assessment.',
          },
        },
        {
          '@type': 'WebApplication',
          '@id': `${canonicalHref}#webapp`,
          name: 'Inisio Greenfield Project Bankability Scorecard',
          url: canonicalHref,
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'INR',
          },
        }
      );
    } else if (activeTab === 'industries') {
      graphNodes.push({
        '@type': 'CollectionPage',
        '@id': `${canonicalHref}#collection`,
        name: currentMeta.title,
        description: currentMeta.description,
        url: canonicalHref,
        mainEntity: {
          '@type': 'ItemList',
          name: 'Priority Greenfield Project Finance Sectors',
          itemListElement: SECTOR_LIST_ITEMS.map((sectorName, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: sectorName,
          })),
        },
      });
    } else if (activeTab === 'blogs') {
      graphNodes.push({
        '@type': 'CollectionPage',
        '@id': `${canonicalHref}#collection`,
        name: currentMeta.title,
        description: currentMeta.description,
        url: canonicalHref,
        mainEntity: {
          '@type': 'ItemList',
          name: 'Inisio Greenfield Project Finance & DPR Research Articles',
          itemListElement: Object.values(STATIC_BLOG_POSTS).map((post, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: post.title,
            url: `${origin}/blogs/${post.slug}`,
          })),
        },
      });
    }

    scriptTag.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': graphNodes,
    });
  }, [activeTab, activeBlogSlug, activeBlog]);

  return null;
};
