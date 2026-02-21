export const users = {
  buyer: { id: 'buyer-1', role: 'buyer', handle: 'James Whitfield' },
  seller: { id: 'seller-1', role: 'seller', handle: 'Sarah Chen' },
  operator: { id: 'operator-1', role: 'operator', handle: 'Admin' }
};

export const listingsSeed = [
  {
    id: 'l-100',
    anonymizedName: 'B2B SaaS – Compliance Ops',
    category: 'SaaS',
    industryTags: ['Compliance', 'B2B'],
    location: 'United States',
    askingRange: '$900k – $1.2M',
    revenueRange: '$58k – $72k MRR',
    profitRange: '28% – 34% margin',
    age: '4.2 years',
    teaserDescription: 'Recurring compliance automation tool with sticky SMB and mid-market customer base. Low churn, high NPS, fully remote team of four.',
    status: 'live',
    verified: true,
    ndaRequired: true,
    escrowType: 'USDC',
    fullFinancials: {
      ttmRevenue: '$806,000',
      ttmProfit: '$244,000',
      momTrend: ['+3%', '+5%', '+2%', '+4%'],
      cacLtv: '1:5.1',
      churn: '2.4% monthly'
    },
    dataroomFolders: {
      Financials: ['P&L_24m.pdf', 'Stripe_Exports_Q4.csv', 'Bank_Reconciliations.zip'],
      Legal: ['Incorporation.pdf', 'MSA_Templates.pdf'],
      Product: ['Architecture_Overview.pdf', 'Roadmap_12m.pdf'],
      Ops: ['SOP_CustomerSupport.pdf', 'HiringPlan.xlsx'],
      Growth: ['Paid_Acquisition_Playbook.pdf']
    }
  },
  {
    id: 'l-101',
    anonymizedName: 'Ecom Brand – Outdoor Gear',
    category: 'Ecommerce',
    industryTags: ['DTC', 'Outdoor'],
    location: 'Canada',
    askingRange: '$650k – $820k',
    revenueRange: '$120k – $160k MRR',
    profitRange: '19% – 26% margin',
    age: '6.8 years',
    teaserDescription: 'Premium outdoor accessories brand with diversified channel mix and loyal repeat buyers. Strong Amazon and DTC split.',
    status: 'live',
    verified: true,
    ndaRequired: true,
    escrowType: 'USDC',
    fullFinancials: {
      ttmRevenue: '$1,720,000',
      ttmProfit: '$338,000',
      momTrend: ['+8%', '-1%', '+4%', '+6%'],
      cacLtv: '1:3.8',
      churn: 'N/A'
    },
    dataroomFolders: {
      Financials: ['Shopify_Statements.pdf', 'COGS_Breakdown.xlsx'],
      Legal: ['Trademarks.pdf', 'Supplier_Contracts.zip'],
      Product: ['SKU_Analysis.csv'],
      Ops: ['Warehouse_SLA.pdf', 'ReturnPolicy_History.pdf'],
      Growth: ['MetaAds_Historical.csv', 'EmailFlows.map']
    }
  },
  {
    id: 'l-102',
    anonymizedName: 'SaaS – HR Onboarding Platform',
    category: 'SaaS',
    industryTags: ['HR', 'B2B', 'SMB'],
    location: 'United Kingdom',
    askingRange: '$1.4M – $1.8M',
    revenueRange: '$88k – $105k MRR',
    profitRange: '31% – 38% margin',
    age: '5.1 years',
    teaserDescription: 'Automated employee onboarding and HR workflow platform serving 300+ SMB clients. Annual contracts, 94% renewal rate.',
    status: 'live',
    verified: true,
    ndaRequired: true,
    escrowType: 'USDC',
    fullFinancials: {
      ttmRevenue: '$1,152,000',
      ttmProfit: '$390,000',
      momTrend: ['+4%', '+3%', '+5%', '+4%'],
      cacLtv: '1:6.2',
      churn: '1.8% monthly'
    },
    dataroomFolders: {
      Financials: ['P&L_TTM.pdf', 'MRR_Cohorts.xlsx'],
      Legal: ['SaaS_Agreements.pdf', 'IP_Assignment.pdf'],
      Product: ['Tech_Stack.pdf', 'API_Docs.pdf'],
      Ops: ['Team_Structure.pdf'],
      Growth: ['SEO_Report.pdf', 'CAC_Analysis.xlsx']
    }
  },
  {
    id: 'l-103',
    anonymizedName: 'Developer Tools – API Monitoring',
    category: 'SaaS',
    industryTags: ['DevTools', 'API', 'Infrastructure'],
    location: 'United States',
    askingRange: '$2.1M – $2.6M',
    revenueRange: '$140k – $165k MRR',
    profitRange: '41% – 47% margin',
    age: '3.7 years',
    teaserDescription: 'API monitoring and alerting platform with usage-based pricing. Strong developer community and product-led growth flywheel.',
    status: 'live',
    verified: true,
    ndaRequired: true,
    escrowType: 'USDC',
    fullFinancials: {
      ttmRevenue: '$1,842,000',
      ttmProfit: '$798,000',
      momTrend: ['+6%', '+7%', '+5%', '+8%'],
      cacLtv: '1:7.4',
      churn: '1.2% monthly'
    },
    dataroomFolders: {
      Financials: ['Revenue_Breakdown.pdf', 'Stripe_TTM.csv'],
      Legal: ['ToS.pdf', 'Privacy_Policy.pdf'],
      Product: ['Architecture.pdf', 'Roadmap.pdf'],
      Ops: ['Runbook.pdf'],
      Growth: ['PLG_Metrics.pdf']
    }
  },
  {
    id: 'l-104',
    anonymizedName: 'Ecom – Skincare & Wellness Brand',
    category: 'Ecommerce',
    industryTags: ['Beauty', 'DTC', 'Skincare'],
    location: 'United States',
    askingRange: '$480k – $600k',
    revenueRange: '$75k – $95k MRR',
    profitRange: '22% – 29% margin',
    age: '3.4 years',
    teaserDescription: 'Clean beauty skincare brand with a cult following. Shopify-native with strong email and subscription revenue. 38% repeat purchase rate.',
    status: 'live',
    verified: false,
    ndaRequired: true,
    escrowType: 'USDC',
    fullFinancials: {
      ttmRevenue: '$1,020,000',
      ttmProfit: '$255,000',
      momTrend: ['+5%', '+9%', '+3%', '+7%'],
      cacLtv: '1:3.2',
      churn: 'N/A'
    },
    dataroomFolders: {
      Financials: ['Shopify_P&L.pdf', 'COGS_Detail.xlsx'],
      Legal: ['Brand_Trademarks.pdf'],
      Product: ['Formulation_IP.pdf', 'Supplier_List.pdf'],
      Ops: ['3PL_Agreement.pdf'],
      Growth: ['Email_Flow_Map.pdf', 'Influencer_Roster.xlsx']
    }
  },
  {
    id: 'l-105',
    anonymizedName: 'Newsletter – B2B Finance & Markets',
    category: 'Media',
    industryTags: ['Newsletter', 'Finance', 'B2B'],
    location: 'United States',
    askingRange: '$320k – $420k',
    revenueRange: '$22k – $30k MRR',
    profitRange: '55% – 65% margin',
    age: '2.9 years',
    teaserDescription: 'Curated finance and private markets newsletter with 42,000 verified subscribers. Sponsorship-first monetisation with growing paid tier.',
    status: 'live',
    verified: true,
    ndaRequired: false,
    escrowType: 'USDC',
    fullFinancials: {
      ttmRevenue: '$312,000',
      ttmProfit: '$187,000',
      momTrend: ['+4%', '+6%', '+4%', '+5%'],
      cacLtv: '1:8.1',
      churn: '3.1% monthly'
    },
    dataroomFolders: {
      Financials: ['Revenue_Sponsors.pdf', 'Paid_Sub_MRR.xlsx'],
      Legal: ['Advertiser_Agreements.pdf'],
      Product: ['Editorial_Calendar.pdf'],
      Ops: ['Subscriber_Export_Summary.pdf'],
      Growth: ['Open_Rate_History.xlsx']
    }
  },
  {
    id: 'l-106',
    anonymizedName: 'SaaS – Analytics for Shopify Brands',
    category: 'SaaS',
    industryTags: ['Analytics', 'Ecommerce', 'Shopify'],
    location: 'Australia',
    askingRange: '$750k – $950k',
    revenueRange: '$52k – $64k MRR',
    profitRange: '33% – 40% margin',
    age: '3.1 years',
    teaserDescription: 'Shopify-native analytics and cohort tool used by 600+ DTC brands. Usage-based pricing, low support overhead, strong word-of-mouth growth.',
    status: 'live',
    verified: true,
    ndaRequired: true,
    escrowType: 'USDC',
    fullFinancials: {
      ttmRevenue: '$696,000',
      ttmProfit: '$258,000',
      momTrend: ['+3%', '+4%', '+6%', '+3%'],
      cacLtv: '1:5.8',
      churn: '2.1% monthly'
    },
    dataroomFolders: {
      Financials: ['MRR_Dashboard.pdf', 'Stripe_Exports.csv'],
      Legal: ['ToS.pdf', 'Data_Processing_Agreement.pdf'],
      Product: ['Tech_Overview.pdf'],
      Ops: ['Support_SLA.pdf'],
      Growth: ['Partnership_Deck.pdf']
    }
  },
  {
    id: 'l-107',
    anonymizedName: 'Digital Agency – Paid Media',
    category: 'Agency',
    industryTags: ['Paid Media', 'Performance', 'DTC'],
    location: 'United States',
    askingRange: '$1.1M – $1.4M',
    revenueRange: '$95k – $115k MRR',
    profitRange: '24% – 30% margin',
    age: '7.2 years',
    teaserDescription: 'Performance marketing agency specialising in Meta and Google for DTC brands. 28-client roster, long average tenure, lean team of 11.',
    status: 'live',
    verified: true,
    ndaRequired: true,
    escrowType: 'USDC',
    fullFinancials: {
      ttmRevenue: '$1,260,000',
      ttmProfit: '$340,000',
      momTrend: ['+2%', '+3%', '+1%', '+4%'],
      cacLtv: '1:4.1',
      churn: '2.8% monthly'
    },
    dataroomFolders: {
      Financials: ['P&L_36m.pdf', 'Client_Revenue_Breakdown.xlsx'],
      Legal: ['MSA_Template.pdf', 'Non_Solicitation.pdf'],
      Ops: ['Client_Roster_Anon.pdf', 'Team_Org.pdf'],
      Growth: ['Pipeline_Summary.pdf']
    }
  },
  {
    id: 'l-108',
    anonymizedName: 'Marketplace – Freelance Legal Services',
    category: 'Marketplace',
    industryTags: ['Legal', 'Freelance', 'B2B'],
    location: 'United Kingdom',
    askingRange: '$1.8M – $2.3M',
    revenueRange: '$110k – $135k MRR',
    profitRange: '36% – 44% margin',
    age: '5.5 years',
    teaserDescription: 'Two-sided marketplace connecting businesses with vetted freelance lawyers. 1,200 active practitioners, 4,800 client accounts. Take rate 18%.',
    status: 'live',
    verified: true,
    ndaRequired: true,
    escrowType: 'USDC',
    fullFinancials: {
      ttmRevenue: '$1,500,000',
      ttmProfit: '$600,000',
      momTrend: ['+5%', '+4%', '+6%', '+5%'],
      cacLtv: '1:6.8',
      churn: '1.6% monthly'
    },
    dataroomFolders: {
      Financials: ['GMV_Report.pdf', 'Take_Rate_Analysis.xlsx'],
      Legal: ['Platform_ToS.pdf', 'Practitioner_Agreements.pdf'],
      Product: ['Platform_Overview.pdf', 'API_Integrations.pdf'],
      Ops: ['Trust_Safety_Process.pdf'],
      Growth: ['SEO_Traffic.pdf', 'Referral_Programme.pdf']
    }
  },
  {
    id: 'l-109',
    anonymizedName: 'Ecom – Premium Pet Accessories',
    category: 'Ecommerce',
    industryTags: ['Pet', 'DTC', 'Subscription'],
    location: 'United States',
    askingRange: '$390k – $510k',
    revenueRange: '$48k – $62k MRR',
    profitRange: '21% – 28% margin',
    age: '4.0 years',
    teaserDescription: 'Premium pet accessories brand with a strong subscription box component. 62% of revenue is recurring. Loyal customer base, 4.9-star average review.',
    status: 'live',
    verified: false,
    ndaRequired: true,
    escrowType: 'USDC',
    fullFinancials: {
      ttmRevenue: '$660,000',
      ttmProfit: '$165,000',
      momTrend: ['+3%', '+5%', '+4%', '+6%'],
      cacLtv: '1:4.4',
      churn: 'N/A'
    },
    dataroomFolders: {
      Financials: ['Shopify_TTM.pdf', 'Subscription_MRR.xlsx'],
      Legal: ['Supplier_NDA.pdf'],
      Product: ['SKU_List.pdf'],
      Ops: ['Fulfilment_SLA.pdf'],
      Growth: ['LTV_Cohorts.xlsx', 'Review_Summary.pdf']
    }
  },
  {
    id: 'l-110',
    anonymizedName: 'SaaS – Construction Project Management',
    category: 'SaaS',
    industryTags: ['Construction', 'B2B', 'Vertical SaaS'],
    location: 'United States',
    askingRange: '$3.2M – $4.0M',
    revenueRange: '$210k – $245k MRR',
    profitRange: '38% – 45% margin',
    age: '6.3 years',
    teaserDescription: 'Vertical SaaS for mid-size construction firms. Covers project scheduling, subcontractor management, and compliance tracking. 180 enterprise clients.',
    status: 'live',
    verified: true,
    ndaRequired: true,
    escrowType: 'USDC',
    fullFinancials: {
      ttmRevenue: '$2,730,000',
      ttmProfit: '$1,148,000',
      momTrend: ['+4%', '+3%', '+5%', '+4%'],
      cacLtv: '1:8.9',
      churn: '0.9% monthly'
    },
    dataroomFolders: {
      Financials: ['P&L_48m.pdf', 'ARR_Waterfall.xlsx', 'Stripe_Statements.pdf'],
      Legal: ['MSA_Enterprise.pdf', 'SOC2_Report.pdf'],
      Product: ['Architecture_Diagram.pdf', 'Integration_List.pdf'],
      Ops: ['CS_Playbook.pdf', 'Headcount_Plan.xlsx'],
      Growth: ['Pipeline_CRM_Export.xlsx', 'ICP_Analysis.pdf']
    }
  },
  {
    id: 'l-111',
    anonymizedName: 'Media – Online Education Platform',
    category: 'Media',
    industryTags: ['EdTech', 'Courses', 'Creator'],
    location: 'United States',
    askingRange: '$550k – $720k',
    revenueRange: '$40k – $55k MRR',
    profitRange: '44% – 52% margin',
    age: '3.8 years',
    teaserDescription: 'Creator-led online education platform in the design and creative space. 18,000 enrolled students, 92 courses, strong affiliate and SEO distribution.',
    status: 'live',
    verified: false,
    ndaRequired: false,
    escrowType: 'USDC',
    fullFinancials: {
      ttmRevenue: '$570,000',
      ttmProfit: '$270,000',
      momTrend: ['+2%', '+5%', '+3%', '+4%'],
      cacLtv: '1:5.5',
      churn: '4.2% monthly'
    },
    dataroomFolders: {
      Financials: ['Revenue_by_Course.xlsx', 'Stripe_TTM.pdf'],
      Legal: ['Creator_Agreements.pdf'],
      Product: ['Platform_Tech.pdf', 'Course_Catalogue.pdf'],
      Ops: ['Instructor_Roster.pdf'],
      Growth: ['SEO_Traffic_Report.pdf', 'Affiliate_Network.pdf']
    }
  }
];

export const accessRequestsSeed = [
  {
    id: 'ar-1',
    listingId: 'l-100',
    buyerId: 'buyer-1',
    ndaSigned: true,
    proofOfFundsStatus: 'verified',
    proofAmountUSDC: 12000,
    proofMethod: 'deposit',
    sellerDecision: 'approved',
    accessLevel: 'Level 2',
    requestedAt: '2026-02-12'
  },
  {
    id: 'ar-2',
    listingId: 'l-101',
    buyerId: 'buyer-1',
    ndaSigned: true,
    proofOfFundsStatus: 'pending',
    proofAmountUSDC: 7000,
    proofMethod: 'wallet',
    sellerDecision: 'pending',
    accessLevel: null,
    requestedAt: '2026-02-17'
  }
];

export const offersSeed = [
  {
    offerId: 'off-1',
    listingId: 'l-100',
    buyerId: 'buyer-1',
    amountUSDC: 980000,
    terms: {
      dealType: 'asset sale',
      closeWindow: '45 days',
      diligencePeriod: '21 days'
    },
    notes: 'Able to fund escrow within 24 hours.',
    status: 'shortlisted'
  }
];

export const escrowsSeed = [
  {
    escrowId: 'esc-1',
    offerId: 'off-1',
    buyerDepositTx: null,
    sellerTransferTx: null,
    amountUSDC: 980000,
    status: 'awaitingDeposit'
  }
];
