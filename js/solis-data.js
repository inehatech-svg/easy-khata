/**
 * Solis Inverters Pakistan (Karachi Regional Hub)
 * Default Data Repository with complete Pakistan/Karachi localization, PKR currency,
 * K-Electric net metering compliance, and full editable CMS capability.
 */
const DEFAULT_SOLIS_DATA = {
  company: {
    name: "Solis Pakistan",
    logoUrl: "",
    parentName: "Ginlong Technologies (Pakistan Regional Hub)",
    slogan: "Bankable, Reliable, Local — Engineered for Pakistan's Climate & Grid",
    primaryColor: "#F15A29",
    currency: "PKR (₨)",
    hotline: "+92 21 3456 7890",
    whatsapp: "+92 300 123 4567",
    email: "pakistan@ginlong.com",
    salesEmail: "sales.pk@ginlong.com",
    address: "Suite 402, 4th Floor, Business Avenue, Main Shahrah-e-Faisal, Karachi 75400, Pakistan",
    secondaryAddress: "Showroom 12, Commercial Broadway, Phase 8 DHA, Lahore, Pakistan",
    hours: "Mon – Sat: 9:00 AM – 7:00 PM PKT",
    copyright: "© 2019-2026 Ginlong Technologies Pakistan. All Rights Reserved.",
    icp: "NEPRA SRO Net-Metering Certified | K-Electric, LESCO, IESCO, FESCO Approved Inverter",
    solisCloudUrl: "https://www.soliscloud.com"
  },
  orderSettings: {
    systems: [
      { size: "3 kW", description: "5 Marla / 120 Yds", minPrice: 450000, maxPrice: 650000 },
      { size: "5 kW", description: "10 Marla / 240 Yds", minPrice: 750000, maxPrice: 980000 },
      { size: "10 kW", description: "1 Kanal / DHA / Gulshan", minPrice: 1450000, maxPrice: 1850000 },
      { size: "15 kW", description: "2 Kanal / Large Home", minPrice: 2400000, maxPrice: 2950000 },
      { size: "20 kW", description: "Commercial Building", minPrice: 3200000, maxPrice: 3900000 },
      { size: "50 kW+", description: "SITE / Korangi Factory", minPrice: 5750000, maxPrice: 7000000 }
    ],
    modules: { inverter: true, battery: true, monthlyBill: true },
    customModules: [],
    pricedItems: [
      { id: "battery-lithium", label: "Lithium battery bank", price: 525000, active: true },
      { id: "battery-tubular", label: "Tubular battery bank", price: 230000, active: true },
      { id: "net-metering", label: "Net-metering application", price: 85000, active: true }
    ],
    customRates: { minPerKw: 145000, maxPerKw: 175000 }
  },
  heroSlides: [
    {
      id: "slide-1",
      badge: "KARACHI & SINDH SOLAR HUB",
      title: "Bankable, Reliable, Local Solar Inverters",
      subtitle: "Engineered to withstand extreme 45°C+ Karachi coastal summers, voltage fluctuations, and heavy load shedding with certified K-Electric & NEPRA net-metering.",
      primaryCta: { label: "Estimate System & Order", link: "#estimate" },
      secondaryCta: { label: "Call Karachi Office", link: "tel:+922134567890" },
      imageUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1920&q=80",
      tag: "Karachi Flagship",
      active: true
    },
    {
      id: "slide-2",
      badge: "ZERO LOAD SHEDDING • 10MS SWITCHING",
      title: "S6 Hybrid Energy Storage for Pakistani Homes",
      subtitle: "Never face load shedding again. Seamless <10ms UPS transfer powers your air conditioners, refrigerators, and heavy loads with Lithium or Tubular battery banks.",
      primaryCta: { label: "Calculate Karachi Savings", link: "#estimate" },
      secondaryCta: { label: "View Hybrid Inverters", link: "#featured" },
      imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80",
      tag: "Home Hybrid",
      active: true
    },
    {
      id: "slide-3",
      badge: "COMMERCIAL & INDUSTRIAL (SITE & KORANGI)",
      title: "Heavy Duty Three-Phase Commercial Inverters",
      subtitle: "Slash crippling K-Electric commercial tariffs for Karachi industrial zones (SITE, Korangi, Landhi, North Karachi) with 99.0% peak efficiency string inverters.",
      primaryCta: { label: "Explore C&I Solutions", link: "#solutions" },
      secondaryCta: { label: "WhatsApp Engineering", link: "https://wa.me/923001234567" },
      imageUrl: "https://images.unsplash.com/photo-1497440001374-f26997328c1b?auto=format&fit=crop&w=1920&q=80",
      tag: "Industrial ROI",
      active: true
    },
    {
      id: "slide-4",
      badge: "NEPRA APPROVED NET-METERING",
      title: "Over 1.5 GW Installed Capacity in Pakistan",
      subtitle: "Top 3 global inverter manufacturer backed by dedicated local warranty, spare parts depot, and certified service engineers in Karachi and Lahore.",
      primaryCta: { label: "Order Quote Now", link: "#estimate" },
      secondaryCta: { label: "Trace Order Status", link: "#estimate-track" },
      imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1920&q=80",
      tag: "Nationwide Trust",
      active: true
    }
  ],
  categories: [
    {
      id: "cat-single",
      name: "Single Phase PV Inverter",
      shortDesc: "Affordable grid-tied residential solutions (2.5kW – 6kW) for 5-marla & 120-sq-yd homes with ultra-low 90V start-up.",
      count: "8 Models",
      icon: "solar-panel",
      imageUrl: "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "cat-three",
      name: "Three Phase PV Inverter",
      shortDesc: "Standard K-Electric / LESCO net metering inverters (10kW – 110kW) with multiple MPPTs, built-in AFCI, and zero export controller.",
      count: "12 Models",
      icon: "building-2",
      imageUrl: "https://images.unsplash.com/photo-1548337138-e87d889cc369?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "cat-storage",
      name: "Energy Storage Inverter",
      shortDesc: "S6 Hybrid inverters (3.8kW – 16kW) with instant <10ms UPS transfer, dual battery ports, and generator auto-start for load shedding.",
      count: "7 Models",
      icon: "battery-charging",
      imageUrl: "https://images.unsplash.com/photo-1558441719-8b489c63a79b?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "cat-utility",
      name: "Utility Scale PV Inverter",
      shortDesc: "High-voltage 1500V string inverters (100kW – 250kW) engineered for large solar farms in Sindh, Punjab, and Balochistan.",
      count: "5 Models",
      icon: "zap",
      imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "cat-accessories",
      name: "Accessories & Monitoring",
      shortDesc: "SolisCloud 4G Jazz/Zong sticks, Wi-Fi loggers, 3-phase smart meters, CT sensors, and rapid shutdown transmitters.",
      count: "15+ Items",
      icon: "cpu",
      imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"
    }
  ],
  featuredProducts: [
    {
      id: "prod-1",
      model: "S6-EH1P(3.8-6)K-H-PK",
      name: "S6 Residential Hybrid Energy Storage Inverter",
      category: "Energy Storage Inverter",
      badge: "Karachi Top Seller",
      pricePKR: "₨ 320,000",
      powerRange: "3.8 kW – 6.0 kW (Single Phase)",
      efficiency: "98.0% Peak (97.5% CEC)",
      mpptCount: "2-4 MPPTs (16A input)",
      batteryVoltage: "120V – 500V Lithium LiFePO4 & Tubular",
      switchTime: "< 10 ms (UPS Grade)",
      warranty: "5-10 Years Official Warranty",
      certifications: "NEPRA Approved, UL 1741 SB, IEEE 1547, K-Electric Ready",
      description: "Customized for Karachi residential homes (120 to 500 sq yds). Runs 1.5 ton Inverter AC + fans + fridge continuously during power outages without any flicker.",
      highlights: [
        "Instant <10ms automatic switchover — zero computer reset",
        "Supports both high-voltage Lithium & tubular battery banks",
        "Dual MPPTs with high DC current for modern 580W-650W panels",
        "Zero-export functionality for non-net-metered connections",
        "Built-in DC AFCI arc-fault protection to prevent fire risks"
      ],
      imageUrl: "https://images.unsplash.com/photo-1558441719-8b489c63a79b?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "prod-2",
      model: "S6-EH1P(8-11.4)K-H-PK",
      name: "S6 Whole-Home Heavy Duty Storage Inverter",
      category: "Energy Storage Inverter",
      badge: "Heavy Duty 1 Kanal",
      pricePKR: "₨ 540,000",
      powerRange: "8.0 kW – 11.4 kW",
      efficiency: "98.5% Peak",
      mpptCount: "4 MPPTs (Dual Battery Channels)",
      batteryVoltage: "Dual 150V – 600V Battery Ports",
      switchTime: "< 8 ms Seamless Transfer",
      warranty: "10 Years Official Warranty",
      certifications: "NEPRA Listed, UL 1741 SB, K-Electric / LESCO / IESCO",
      description: "The ultimate whole-house solar inverter for DHA & Bahria Karachi properties. Delivers uninterrupted power for 3-4 ACs, water pumps, and home automation.",
      highlights: [
        "Heavy-duty surge capacity to start water motors & compressors",
        "Direct generator auto-start with frequency sync during blackouts",
        "Dual independent battery channels for expandable backup",
        "Dynamic K-Electric peak-tariff shaving to maximize savings",
        "NEMA 4X / IP66 all-weather aluminum casing for Karachi coastal air"
      ],
      imageUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "prod-3",
      model: "S6-GR3P(10-20)K-PK",
      name: "S6 Three-Phase On-Grid Net Metering Inverter",
      category: "Three Phase PV Inverter",
      badge: "Net Metering Leader",
      pricePKR: "₨ 345,000",
      powerRange: "10.0 kW – 20.0 kW (400V 3-Phase)",
      efficiency: "98.7% Peak",
      mpptCount: "2-4 MPPTs (Wide 160V-1000V range)",
      batteryVoltage: "N/A (Pure Grid-Tied)",
      switchTime: "N/A (Interactive)",
      warranty: "10 Years Official Warranty",
      certifications: "NEPRA Certified, K-Electric Green Meter, LESCO, IESCO",
      description: "Pakistan's #1 chosen three-phase inverter for residential net-metering. Feed units back to K-Electric / WAPDA and reduce monthly bills to zero.",
      highlights: [
        "150%+ DC/AC oversizing for maximum morning and evening units",
        "Integrated Type II Surge Protection Devices (SPD) on AC & DC",
        "Whisper quiet natural convection cooling",
        "Pre-configured with Pakistan NEPRA grid code parameters",
        "Compatible with K-Electric bidirectional 3-phase meters"
      ],
      imageUrl: "https://images.unsplash.com/photo-1548337138-e87d889cc369?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "prod-4",
      model: "S5-GC(50-110)K-PK",
      name: "S5 Commercial Heavy Industrial Inverter",
      category: "Three Phase PV Inverter",
      badge: "Industrial SITE/Korangi",
      pricePKR: "₨ 980,000",
      powerRange: "50 kW – 110 kW (400V / 480V)",
      efficiency: "99.0% Maximum Efficiency",
      mpptCount: "6-10 MPPTs (Up to 20 Strings)",
      batteryVoltage: "N/A (Industrial Grid-Tied)",
      switchTime: "N/A (Interactive)",
      warranty: "10 Years Official Warranty",
      certifications: "NEPRA Category I, UL 1741 SB, IEEE 1547-2018",
      description: "Engineered specifically for Pakistani factories, textile mills, pharmaceutical plants, and cold storages. Withstands dusty and high-temperature environments.",
      highlights: [
        "Smart I-V curve diagnosis detects cracked panels and dust loss",
        "Intelligent redundant cooling fans with IP66 dust-proof rating",
        "Generator zero-export controller integration without grid trip",
        "String current up to 16A, tailored for 650W+ bifacial modules",
        "Centralized commercial dashboard via SolisCloud fleet management"
      ],
      imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "prod-5",
      model: "S6-GR1P(2.5-4)K-PK",
      name: "S6 Single Phase Compact Solar Inverter",
      category: "Single Phase PV Inverter",
      badge: "Budget Friendly",
      pricePKR: "₨ 165,000",
      powerRange: "2.5 kW – 4.0 kW (230V AC)",
      efficiency: "97.8% Peak",
      mpptCount: "1-2 MPPTs / 90V Ultra-Low Start",
      batteryVoltage: "N/A (Grid-Tied)",
      switchTime: "N/A (Interactive)",
      warranty: "5-10 Years Warranty",
      certifications: "NEPRA Listed, IEC 62109, CE",
      description: "Compact and reliable grid-tied inverter for smaller Pakistani homes and offices wanting clean solar power without battery maintenance.",
      highlights: [
        "Ultra-lightweight (<20 lbs) for quick rooftop or balcony mounting",
        "Ultra-low 90V start-up captures weak sunrise and winter sun",
        "Zero noise: fanless natural convection cooling",
        "Built-in Wi-Fi / 4G telemetry for daily mobile tracking",
        "High tolerance for unstable voltage grids (160V – 280V)"
      ],
      imageUrl: "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "prod-6",
      model: "Solis 4G Cellular / Wi-Fi Datalogger",
      name: "SolisCloud Telemetry & Smart Energy Stick",
      category: "Accessories",
      badge: "Pakistan Connectivity",
      pricePKR: "₨ 19,500",
      powerRange: "Plug & Play USB/RS485",
      efficiency: "99.9% Telemetry Uptime",
      mpptCount: "Universal Solis Compatibility",
      batteryVoltage: "Internal 5V USB",
      switchTime: "Real-time updates",
      warranty: "2 Years Warranty",
      certifications: "PTA Approved 4G Cellular, CE, FCC",
      description: "Stay connected even during broadband internet cuts. Supports Jazz, Zong, and Telenor 4G SIM cards or local Wi-Fi with automatic cloud reconnect.",
      highlights: [
        "PTA approved 4G LTE cellular data transmission",
        "Free lifetime access to SolisCloud web and mobile app",
        "Instant SMS / Push notifications for grid failures & inverter alarms",
        "Remote firmware upgrade without visiting the customer roof",
        "Weatherproof IP65 outdoor casing"
      ],
      imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=700&q=80"
    }
  ],
  solutions: [
    {
      id: "sol-res",
      title: "Karachi Residential Solar & Load Shedding Solution",
      subtitle: "Zero Power Cuts for DHA, Clifton, Gulshan, & Bahria Homes",
      description: "Karachi's power outages and surging K-Electric per-unit rates (₨ 65+/unit) demand a robust solution. Solis S6 hybrid systems automatically charge batteries with free daytime solar and power heavy household loads seamlessly day and night.",
      features: [
        "Sub-10ms automatic UPS transfer — uninterrupted power for home appliances",
        "Official NEPRA green-meter net-metering integration with K-Electric",
        "Run 1.5 ton Inverter ACs, water pumps, and lights off-grid",
        "Compatible with both affordable tubular lead-acid and high-tech LiFePO4 batteries"
      ],
      imageUrl: "https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=900&q=80",
      cta: "Estimate Home Solar"
    },
    {
      id: "sol-ci",
      title: "Commercial & Industrial (Karachi SITE, Korangi & Port Qasim)",
      subtitle: "Drastically Reduce Peak Tariff & Diesel Generator Expenses",
      description: "Pakistani industrial facilities face exorbitant fuel and electricity bills. Solis commercial inverters integrate smoothly with existing gas/diesel generators, synchronize power without tripping, and maximize peak energy harvest across large factory roofs.",
      features: [
        "Multi-MPPT design captures maximum sun across sawtooth factory sheds",
        "Integrated AFCI technology complies with international fire insurance audits",
        "Generator zero-export protection prevents back-feeding into diesel gensets",
        "Fleet-level centralized operations through SolisCloud enterprise portal"
      ],
      imageUrl: "https://images.unsplash.com/photo-1497440001374-f26997328c1b?auto=format&fit=crop&w=900&q=80",
      cta: "Estimate Industrial Solar"
    },
    {
      id: "sol-agri",
      title: "Agricultural Tubewell Solar Pumping (Sindh & Punjab)",
      subtitle: "Reliable Day-Long Irrigation Without High Diesel Costs",
      description: "Designed for farmers in Sindh (Thatta, Badin, Sukkur, Larkana) and Punjab. Solis high-torque solar drives and inverters operate deep tubewells and drip irrigation directly from solar panels from sunrise to sunset.",
      features: [
        "Wide MPPT voltage range guarantees reliable water discharge even on hazy days",
        "Dry-run and over-current protection for submersible pumps",
        "Hybrid dual-supply: switch between solar and WAPDA grid or genset",
        "Rapid return on investment compared to soaring diesel fuel costs"
      ],
      imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=900&q=80",
      cta: "Explore Agricultural Solar"
    },
    {
      id: "sol-netmetering",
      title: "Turnkey Net-Metering (K-Electric, LESCO, IESCO, FESCO)",
      subtitle: "Sell Excess Solar Units to the National Grid",
      description: "Turn your electricity meter backwards. We provide complete technical documentation, type tests, and compliance certificates required by NEPRA and DISCOs for swift green meter approval.",
      features: [
        "100% compliant with NEPRA SRO 892(I)/2015 net-metering regulations",
        "Pre-approved inverter model listings with K-Electric and WAPDA DISCOs",
        "Built-in bidirectional anti-islanding and grid protection features",
        "Typical payback period of only 2.5 to 3.5 years across Pakistan"
      ],
      imageUrl: "https://images.unsplash.com/photo-1558441719-8b489c63a79b?auto=format&fit=crop&w=900&q=80",
      cta: "Start Net Metering"
    }
  ],
  trustStats: {
    tagline: "Bankable, Reliable, Local",
    subtagline: "Karachi Regional Hub & Dedicated Pakistan Support Center",
    hotline: "+92 21 3456 7890",
    whatsapp: "+92 300 123 4567",
    hotlineHours: "Mon – Sat: 9:00 AM – 7:00 PM PKT | Fast WhatsApp Support",
    metrics: [
      { value: "Top 3", label: "Global Inverter Brand", detail: "Ranked by S&P Global & Wood Mackenzie" },
      { value: "1.5+ GW", label: "Capacity in Pakistan", detail: "Over 1,500 MW generating clean power in Pakistan" },
      { value: "18+ Yrs", label: "Manufacturing Heritage", detail: "Continuous Tier-1 innovation since 2005" },
      { value: "Karachi HQ", label: "Local Service & Spares", detail: "Main Shahrah-e-Faisal engineering & RMA hub" }
    ]
  },
  resources: [
    {
      title: "Video Center & Solis Academy",
      description: "Urdu and English installation guides, inverter commissioning tutorials, and net-metering wiring diagrams.",
      icon: "video",
      linkText: "Watch Training Videos",
      linkUrl: "#resources"
    },
    {
      title: "NEPRA Download Center",
      description: "Download official Solis datasheets, user manuals, and NEPRA / K-Electric compliance certificates.",
      icon: "file-text",
      linkText: "Download Certificates",
      linkUrl: "#resources"
    },
    {
      title: "SolisCloud Monitoring Portal",
      description: "Track your generation, battery storage percentage, and savings from your phone or desktop 24/7.",
      icon: "cloud",
      linkText: "Open SolisCloud",
      linkUrl: "https://www.soliscloud.com"
    },
    {
      title: "PV Plant & Sizing Calculator",
      description: "Calculate optimal inverter sizing, roof panel count, and annual kWh generation for Karachi sun levels.",
      icon: "layout",
      linkText: "Launch Calculator",
      linkUrl: "#estimate"
    },
    {
      title: "Karachi After-Sale & RMA Center",
      description: "Direct local warranty claims, genuine spare parts replacement, and certified field engineer inspection.",
      icon: "shield-check",
      linkText: "Book Service / RMA",
      linkUrl: "#trust-stats"
    }
  ],
  distributors: [
    { name: "Regal Solar Technologies", city: "Karachi", address: "Main Shahrah-e-Faisal, Karachi", phone: "+92 21 3432 1199", type: "Master Stockist & Service Center" },
    { name: "Alpha Solar Pakistan", city: "Karachi", address: "Block 4, Gulshan-e-Iqbal, Karachi", phone: "+92 300 829 4411", type: "Authorized Distributor" },
    { name: "Premier Energy Solar Hub", city: "Lahore", address: "Commercial Area, Phase 5 DHA, Lahore", phone: "+92 42 3574 2200", type: "Authorized Partner" },
    { name: "SkyElectric Power Partners", city: "Islamabad & Rawalpindi", address: "Blue Area, Islamabad", phone: "+92 51 280 1144", type: "Authorized Stockist" }
  ]
};

// Expose globally
if (typeof window !== 'undefined') {
  window.DEFAULT_SOLIS_DATA = DEFAULT_SOLIS_DATA;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_SOLIS_DATA };
}
