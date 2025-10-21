export type Language = 'en' | 'fi';

export interface Translations {
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    back: string;
    logout: string;
    settings: string;
    active: string;
    inactive: string;
    yes: string;
    no: string;
  };
  landing: {
    hero: {
      title: string;
      subtitle: string;
      cta: string;
      ctaSecondary: string;
    };
    features: {
      title: string;
      aiAnalysis: {
        title: string;
        description: string;
      };
      autoReplies: {
        title: string;
        description: string;
      };
      analytics: {
        title: string;
        description: string;
      };
    };
    pricing: {
      title: string;
      monthly: string;
    };
    cta: {
      title: string;
      button: string;
    };
  };
  auth: {
    login: {
      title: string;
      subtitle: string;
      email: string;
      password: string;
      emailPlaceholder: string;
      passwordPlaceholder: string;
      button: string;
      buttonLoading: string;
      forgotPassword: string;
      noAccount: string;
      signupLink: string;
      backToHome: string;
    };
    signup: {
      title: string;
      subtitle: string;
      fullName: string;
      fullNamePlaceholder: string;
      businessName: string;
      businessNamePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      passwordHint: string;
      button: string;
      buttonLoading: string;
      hasAccount: string;
      loginLink: string;
      backToHome: string;
      successMessage: string;
    };
  };
  dashboard: {
    title: string;
    connectInstagram: {
      title: string;
      description: string;
      button: string;
    };
    connected: {
      title: string;
      description: string;
      disconnect: string;
    };
    stats: {
      totalMessages: string;
      priceInquiries: string;
      availability: string;
      locationRequests: string;
    };
    recentMessages: string;
    viewAll: string;
    sync: string;
    syncing: string;
    noMessages: string;
    topFollowers: string;
    noFollowerData: string;
    messages: string;
    aiSuggestion: string;
  };
  messages: {
    title: string;
    backToDashboard: string;
    messagesTitle: string;
    messageDetails: string;
    from: string;
    date: string;
    intent: string;
    message: string;
    confidence: string;
    aiReplySuggestions: string;
    finnish: string;
    english: string;
    copy: string;
    copied: string;
    noSuggestions: string;
    selectMessage: string;
  };
  settings: {
    title: string;
    subtitle: string;
    backToDashboard: string;
    addNewRule: string;
    type: string;
    key: string;
    value: string;
    question: string;
    answer: string;
    addRule: string;
    sections: {
      prices: string;
      businessInfo: string;
      inventory: string;
      faqs: string;
      other: string;
    };
    ruleTypes: {
      price: string;
      business_info: string;
      inventory: string;
      faq: string;
      other: string;
    };
    placeholders: {
      priceKey: string;
      priceValue: string;
      faqQuestion: string;
      faqAnswer: string;
      genericKey: string;
      genericValue: string;
    };
    noRules: string;
    confirmDelete: string;
    activate: string;
    deactivate: string;
    fillAllFields: string;
  };
  intents: {
    price_inquiry: string;
    availability: string;
    location: string;
    general_question: string;
    complaint: string;
    compliment: string;
    other: string;
  };
  pricing: {
    title: string;
    subtitle: string;
    monthly: string;
    perMonth: string;
    messagesPerMonth: string;
    unlimitedMessages: string;
    freeTrial: string;
    trialDays: string;
    selectPlan: string;
    currentPlan: string;
    upgrade: string;
    features: string;
    viewPlans: string;
  };
  subscription: {
    title: string;
    currentPlan: string;
    usage: string;
    usageOf: string;
    unlimited: string;
    resetDate: string;
    manageBilling: string;
    upgradeNow: string;
    cancelSubscription: string;
    billingHistory: string;
    trialEnds: string;
    trialExpired: string;
    limitReached: string;
    limitWarning: string;
    activated: string;
    activatedMessage: string;
  };
  messageStatus: {
    all: string;
    unanswered: string;
    answered: string;
    markAsAnswered: string;
    markAsUnanswered: string;
    repliedAuto: string;
    repliedManual: string;
    repliedAt: string;
  };
  analytics: {
    title: string;
    totalMessages: string;
    repliedMessages: string;
    responseRate: string;
    avgResponseTime: string;
    engagement: string;
    active: string;
    noActivity: string;
    messagesOverTime: string;
    intentDistribution: string;
    intentBreakdown: string;
    total: string;
    replied: string;
    last7Days: string;
    last30Days: string;
    last90Days: string;
    export: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      back: 'Back',
      logout: 'Logout',
      settings: 'Settings',
      active: 'Active',
      inactive: 'Inactive',
      yes: 'Yes',
      no: 'No',
    },
    landing: {
      hero: {
        title: 'AI-Powered Instagram DM Management for Finnish Businesses',
        subtitle: 'Automate customer conversations with intelligent message analysis and instant reply suggestions',
        cta: 'Get Started',
        ctaSecondary: 'Learn More',
      },
      features: {
        title: 'Why Choose ViloAi?',
        aiAnalysis: {
          title: 'AI Message Analysis',
          description: 'Automatically categorize customer messages by intent - price inquiries, availability questions, and more',
        },
        autoReplies: {
          title: 'Smart Reply Suggestions',
          description: 'Get AI-generated reply suggestions in Finnish and English, tailored to your business',
        },
        analytics: {
          title: 'Customer Insights',
          description: 'Track message trends and identify your most engaged followers',
        },
      },
      pricing: {
        title: 'Simple Pricing',
        monthly: 'per month',
      },
      cta: {
        title: 'Ready to Transform Your Instagram DMs?',
        button: 'Start Free Trial',
      },
    },
    auth: {
      login: {
        title: 'Welcome Back',
        subtitle: 'Sign in to your account',
        email: 'Email',
        password: 'Password',
        emailPlaceholder: 'your@email.com',
        passwordPlaceholder: '••••••••',
        button: 'Sign In',
        buttonLoading: 'Signing in...',
        forgotPassword: 'Forgot your password?',
        noAccount: "Don't have an account?",
        signupLink: 'Sign up',
        backToHome: '← Back to home',
      },
      signup: {
        title: 'Create Account',
        subtitle: 'Start your free trial today',
        fullName: 'Full Name',
        fullNamePlaceholder: 'John Doe',
        businessName: 'Business Name',
        businessNamePlaceholder: 'My Finnish Business',
        email: 'Email',
        emailPlaceholder: 'your@email.com',
        password: 'Password',
        passwordPlaceholder: '••••••••',
        passwordHint: 'Must be at least 6 characters',
        button: 'Create Account',
        buttonLoading: 'Creating account...',
        hasAccount: 'Already have an account?',
        loginLink: 'Sign in',
        backToHome: '← Back to home',
        successMessage: 'Account created successfully! Redirecting...',
      },
    },
    dashboard: {
      title: 'ViloAi Dashboard',
      connectInstagram: {
        title: 'Connect Your Instagram Account',
        description: 'Connect your Instagram Business account to start analyzing messages and gaining insights.',
        button: 'Connect Instagram',
      },
      connected: {
        title: 'Instagram Connected',
        description: 'Your Instagram Business account is connected and ready to sync messages.',
        disconnect: 'Disconnect',
      },
      stats: {
        totalMessages: 'Total Messages',
        priceInquiries: 'Price Inquiries',
        availability: 'Availability',
        locationRequests: 'Location Requests',
      },
      recentMessages: 'Recent Messages',
      viewAll: 'View All →',
      sync: 'Sync',
      syncing: 'Syncing...',
      noMessages: 'No messages yet',
      topFollowers: 'Top Engaged Followers',
      noFollowerData: 'No follower data yet',
      messages: 'messages',
      aiSuggestion: 'AI Suggestion',
    },
    messages: {
      title: 'Messages & AI Suggestions',
      backToDashboard: 'Back to Dashboard',
      messagesTitle: 'Messages',
      messageDetails: 'Message Details',
      from: 'From',
      date: 'Date',
      intent: 'Intent',
      message: 'Message',
      confidence: 'confidence',
      aiReplySuggestions: 'AI Reply Suggestions',
      finnish: 'Finnish (Suomi)',
      english: 'English',
      copy: 'Copy',
      copied: 'Copied!',
      noSuggestions: 'No AI suggestions available for this message',
      selectMessage: 'Select a message to view details and AI suggestions',
    },
    settings: {
      title: 'Business Rules & Settings',
      subtitle: 'Configure your business information so AI can provide accurate, personalized responses to your customers.',
      backToDashboard: 'Back to Dashboard',
      addNewRule: 'Add New Rule',
      type: 'Type',
      key: 'Key / Name',
      value: 'Value',
      question: 'Question',
      answer: 'Answer',
      addRule: 'Add Rule',
      sections: {
        prices: 'Product Prices',
        businessInfo: 'Business Information',
        inventory: 'Inventory & Availability',
        faqs: 'Frequently Asked Questions',
        other: 'Other Rules',
      },
      ruleTypes: {
        price: 'Price',
        business_info: 'Business Info',
        inventory: 'Inventory',
        faq: 'FAQ',
        other: 'Other',
      },
      placeholders: {
        priceKey: 'e.g., Running Shoes',
        priceValue: 'e.g., €60',
        faqQuestion: 'e.g., Do you ship internationally?',
        faqAnswer: 'e.g., Yes, we ship worldwide for €10',
        genericKey: 'e.g., Business Hours',
        genericValue: 'e.g., Mon-Fri 10:00-18:00',
      },
      noRules: 'No rules configured yet',
      confirmDelete: 'Are you sure you want to delete this rule?',
      activate: 'Activate',
      deactivate: 'Deactivate',
      fillAllFields: 'Please fill in all fields',
    },
    intents: {
      price_inquiry: 'Price Inquiry',
      availability: 'Availability',
      location: 'Location',
      general_question: 'General Question',
      complaint: 'Complaint',
      compliment: 'Compliment',
      other: 'Other',
    },
    pricing: {
      title: 'Choose Your Plan',
      subtitle: 'Select the perfect plan for your business size and message volume',
      monthly: 'Monthly',
      perMonth: '/ month',
      messagesPerMonth: 'messages/month',
      unlimitedMessages: 'Unlimited messages',
      freeTrial: 'Free Trial',
      trialDays: '14 days free',
      selectPlan: 'Select Plan',
      currentPlan: 'Current Plan',
      upgrade: 'Upgrade',
      features: 'Features',
      viewPlans: 'View Plans',
    },
    subscription: {
      title: 'Subscription & Usage',
      currentPlan: 'Current Plan',
      usage: 'Usage This Month',
      usageOf: 'of',
      unlimited: 'Unlimited',
      resetDate: 'Resets on',
      manageBilling: 'Manage Billing',
      upgradeNow: 'Upgrade Now',
      cancelSubscription: 'Cancel Subscription',
      billingHistory: 'Billing History',
      trialEnds: 'Trial ends',
      trialExpired: 'Trial expired',
      limitReached: 'Monthly limit reached. Upgrade to continue analyzing messages.',
      limitWarning: 'You\'re approaching your monthly limit.',
      activated: 'Subscription Activated!',
      activatedMessage: 'Your subscription has been successfully activated. You can now start using ViloAi!',
    },
    messageStatus: {
      all: 'All Messages',
      unanswered: 'Unanswered',
      answered: 'Answered',
      markAsAnswered: 'Mark as Answered',
      markAsUnanswered: 'Mark as Unanswered',
      repliedAuto: 'Replied (Instagram)',
      repliedManual: 'Replied (Manual)',
      repliedAt: 'Replied',
    },
    analytics: {
      title: 'Analytics Dashboard',
      totalMessages: 'Total Messages',
      repliedMessages: 'Replied Messages',
      responseRate: 'response rate',
      avgResponseTime: 'Avg Response Time',
      engagement: 'Engagement',
      active: 'Active',
      noActivity: 'No activity',
      messagesOverTime: 'Messages Over Time',
      intentDistribution: 'Message Intent Distribution',
      intentBreakdown: 'Intent Breakdown',
      total: 'Total',
      replied: 'Replied',
      last7Days: 'Last 7 days',
      last30Days: 'Last 30 days',
      last90Days: 'Last 90 days',
      export: 'Export CSV',
    },
  },
  fi: {
    common: {
      loading: 'Ladataan...',
      save: 'Tallenna',
      cancel: 'Peruuta',
      delete: 'Poista',
      edit: 'Muokkaa',
      add: 'Lisää',
      back: 'Takaisin',
      logout: 'Kirjaudu ulos',
      settings: 'Asetukset',
      active: 'Aktiivinen',
      inactive: 'Ei aktiivinen',
      yes: 'Kyllä',
      no: 'Ei',
    },
    landing: {
      hero: {
        title: 'Tekoälyavusteinen Instagram DM-hallinta suomalaisille yrityksille',
        subtitle: 'Automatisoi asiakaskeskustelut älykkäällä viestianalyysillä ja välittömillä vastausehdotuksilla',
        cta: 'Aloita',
        ctaSecondary: 'Lue lisää',
      },
      features: {
        title: 'Miksi valita ViloAi?',
        aiAnalysis: {
          title: 'Tekoälyavusteinen viestianalyysi',
          description: 'Luokittele automaattisesti asiakasviestit tarkoituksen mukaan - hintakyselyt, saatavuuskysymykset ja paljon muuta',
        },
        autoReplies: {
          title: 'Älykkäät vastausehdotukset',
          description: 'Saa tekoälyn luomia vastausehdotuksia suomeksi ja englanniksi, räätälöity yrityksellesi',
        },
        analytics: {
          title: 'Asiakasymmärrys',
          description: 'Seuraa viestitrendejä ja tunnista aktiivisimmat seuraajasi',
        },
      },
      pricing: {
        title: 'Yksinkertainen hinnoittelu',
        monthly: 'kuukaudessa',
      },
      cta: {
        title: 'Valmis muuttamaan Instagram DM-viestisi?',
        button: 'Aloita ilmainen kokeilu',
      },
    },
    auth: {
      login: {
        title: 'Tervetuloa takaisin',
        subtitle: 'Kirjaudu tilillesi',
        email: 'Sähköposti',
        password: 'Salasana',
        emailPlaceholder: 'sinun@sahkoposti.fi',
        passwordPlaceholder: '••••••••',
        button: 'Kirjaudu sisään',
        buttonLoading: 'Kirjaudutaan...',
        forgotPassword: 'Unohditko salasanasi?',
        noAccount: 'Eikö sinulla ole tiliä?',
        signupLink: 'Rekisteröidy',
        backToHome: '← Takaisin etusivulle',
      },
      signup: {
        title: 'Luo tili',
        subtitle: 'Aloita ilmainen kokeilujakso tänään',
        fullName: 'Koko nimi',
        fullNamePlaceholder: 'Matti Meikäläinen',
        businessName: 'Yrityksen nimi',
        businessNamePlaceholder: 'Minun Suomalainen Yritys',
        email: 'Sähköposti',
        emailPlaceholder: 'sinun@sahkoposti.fi',
        password: 'Salasana',
        passwordPlaceholder: '••••••••',
        passwordHint: 'Vähintään 6 merkkiä',
        button: 'Luo tili',
        buttonLoading: 'Luodaan tiliä...',
        hasAccount: 'Onko sinulla jo tili?',
        loginLink: 'Kirjaudu sisään',
        backToHome: '← Takaisin etusivulle',
        successMessage: 'Tili luotu onnistuneesti! Ohjataan...',
      },
    },
    dashboard: {
      title: 'ViloAi Hallintapaneeli',
      connectInstagram: {
        title: 'Yhdistä Instagram-tilisi',
        description: 'Yhdistä Instagram Business -tilisi aloittaaksesi viestien analysoinnin ja seurannan.',
        button: 'Yhdistä Instagram',
      },
      connected: {
        title: 'Instagram yhdistetty',
        description: 'Instagram Business -tilisi on yhdistetty ja valmis synkronoimaan viestejä.',
        disconnect: 'Katkaise yhteys',
      },
      stats: {
        totalMessages: 'Viestit yhteensä',
        priceInquiries: 'Hintakyselyt',
        availability: 'Saatavuus',
        locationRequests: 'Sijaintipyynnöt',
      },
      recentMessages: 'Viimeisimmät viestit',
      viewAll: 'Näytä kaikki →',
      sync: 'Synkronoi',
      syncing: 'Synkronoidaan...',
      noMessages: 'Ei viestejä vielä',
      topFollowers: 'Aktiivisimmat seuraajat',
      noFollowerData: 'Ei seuraajatietoja vielä',
      messages: 'viestiä',
      aiSuggestion: 'Tekoälyn ehdotus',
    },
    messages: {
      title: 'Viestit ja tekoälyn ehdotukset',
      backToDashboard: 'Takaisin hallintapaneeliin',
      messagesTitle: 'Viestit',
      messageDetails: 'Viestin tiedot',
      from: 'Lähettäjä',
      date: 'Päivämäärä',
      intent: 'Tarkoitus',
      message: 'Viesti',
      confidence: 'varmuus',
      aiReplySuggestions: 'Tekoälyn vastausehdotukset',
      finnish: 'Suomi',
      english: 'Englanti',
      copy: 'Kopioi',
      copied: 'Kopioitu!',
      noSuggestions: 'Ei tekoälyn ehdotuksia tälle viestille',
      selectMessage: 'Valitse viesti nähdäksesi tiedot ja tekoälyn ehdotukset',
    },
    settings: {
      title: 'Liiketoimintasäännöt ja asetukset',
      subtitle: 'Määritä yrityksesi tiedot, jotta tekoäly voi tarjota tarkkoja, yksilöllisiä vastauksia asiakkaillesi.',
      backToDashboard: 'Takaisin hallintapaneeliin',
      addNewRule: 'Lisää uusi sääntö',
      type: 'Tyyppi',
      key: 'Avain / Nimi',
      value: 'Arvo',
      question: 'Kysymys',
      answer: 'Vastaus',
      addRule: 'Lisää sääntö',
      sections: {
        prices: 'Tuotehinnat',
        businessInfo: 'Yritystiedot',
        inventory: 'Varasto ja saatavuus',
        faqs: 'Usein kysytyt kysymykset',
        other: 'Muut säännöt',
      },
      ruleTypes: {
        price: 'Hinta',
        business_info: 'Yritystieto',
        inventory: 'Varasto',
        faq: 'UKK',
        other: 'Muu',
      },
      placeholders: {
        priceKey: 'esim. Juoksukengät',
        priceValue: 'esim. 60€',
        faqQuestion: 'esim. Toimitetaanko kansainvälisesti?',
        faqAnswer: 'esim. Kyllä, toimitamme maailmanlaajuisesti 10€ hintaan',
        genericKey: 'esim. Aukioloajat',
        genericValue: 'esim. Ma-Pe 10:00-18:00',
      },
      noRules: 'Ei vielä määritettyjä sääntöjä',
      confirmDelete: 'Haluatko varmasti poistaa tämän säännön?',
      activate: 'Aktivoi',
      deactivate: 'Poista käytöstä',
      fillAllFields: 'Täytä kaikki kentät',
    },
    intents: {
      price_inquiry: 'Hintakysely',
      availability: 'Saatavuus',
      location: 'Sijainti',
      general_question: 'Yleinen kysymys',
      complaint: 'Valitus',
      compliment: 'Kehut',
      other: 'Muu',
    },
    pricing: {
      title: 'Valitse sopiva paketti',
      subtitle: 'Valitse yrityksesi koolle ja viestimäärälle sopiva paketti',
      monthly: 'Kuukausittain',
      perMonth: '/ kk',
      messagesPerMonth: 'viestiä/kk',
      unlimitedMessages: 'Rajattomasti viestejä',
      freeTrial: 'Ilmainen kokeilu',
      trialDays: '14 päivää ilmaiseksi',
      selectPlan: 'Valitse paketti',
      currentPlan: 'Nykyinen paketti',
      upgrade: 'Päivitä',
      features: 'Ominaisuudet',
      viewPlans: 'Näytä paketit',
    },
    subscription: {
      title: 'Tilaus ja käyttö',
      currentPlan: 'Nykyinen paketti',
      usage: 'Käyttö tässä kuussa',
      usageOf: '/',
      unlimited: 'Rajoittamaton',
      resetDate: 'Nollautuu',
      manageBilling: 'Hallinnoi laskutusta',
      upgradeNow: 'Päivitä nyt',
      cancelSubscription: 'Peruuta tilaus',
      billingHistory: 'Laskutushistoria',
      trialEnds: 'Kokeilu päättyy',
      trialExpired: 'Kokeilu päättynyt',
      limitReached: 'Kuukauden raja saavutettu. Päivitä jatkaaksesi viestien analysointia.',
      limitWarning: 'Olet lähestymässä kuukauden rajaa.',
      activated: 'Tilaus aktivoitu!',
      activatedMessage: 'Tilauksesi on aktivoitu onnistuneesti. Voit nyt aloittaa ViloAi:n käytön!',
    },
    messageStatus: {
      all: 'Kaikki viestit',
      unanswered: 'Vastaamattomat',
      answered: 'Vastatut',
      markAsAnswered: 'Merkitse vastatuksi',
      markAsUnanswered: 'Merkitse vastaamattomaksi',
      repliedAuto: 'Vastattu (Instagram)',
      repliedManual: 'Vastattu (Manuaalinen)',
      repliedAt: 'Vastattu',
    },
    analytics: {
      title: 'Analytiikka',
      totalMessages: 'Viestit yhteensä',
      repliedMessages: 'Vastatut viestit',
      responseRate: 'vastausprosentti',
      avgResponseTime: 'Keskim. vastausaika',
      engagement: 'Sitoutuminen',
      active: 'Aktiivinen',
      noActivity: 'Ei aktiviteettia',
      messagesOverTime: 'Viestit aikajaksolla',
      intentDistribution: 'Viestien tarkoitusten jakauma',
      intentBreakdown: 'Tarkoitusten erittely',
      total: 'Yhteensä',
      replied: 'Vastattu',
      last7Days: 'Viimeiset 7 päivää',
      last30Days: 'Viimeiset 30 päivää',
      last90Days: 'Viimeiset 90 päivää',
      export: 'Vie CSV',
    },
  },
};
