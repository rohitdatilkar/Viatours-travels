/* ==========================================================================
   VIA TOURS & TRAVELS — UNIFIED LUXURY CATALOG & DATA STORE
   Central repository for baseline catalog data and bidirectional synchronization
   between Public Storefront (index.html), Admin Portal (admin.html),
   LocalStorage, and Supabase Cloud Database.
   ========================================================================== */

(function(window) {
    'use strict';

    // Baseline Luxury Catalog (7 Luxury Packages, 10 Destinations, 4 Articles, 4 Testimonials, 8 FAQs)
    window.LUXURY_CATALOG = {
  "destinations": [
    {
      "id": "dest-maldives",
      "name": "Maldives",
      "country": "Maldives",
      "region": "South Asia / Indian Ocean",
      "image_url": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
      "description": "Idyllic turquoise atolls, pristine overwater villas, private coral reefs, and world-class underwater dining.",
      "best_time": "November to April",
      "attractions": [
        "Male Atoll",
        "Baa Atoll Biosphere",
        "Ari Atoll Luxury Reefs"
      ],
      "is_published": true
    },
    {
      "id": "dest-switzerland",
      "name": "Switzerland",
      "country": "Switzerland",
      "region": "Europe",
      "image_url": "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&q=80",
      "description": "Majestic Alpine peaks, panoramic Glacier Express rail journeys, luxury chalets in Zermatt, and crystal lakes.",
      "best_time": "Year-round (Ski: Dec-Mar, Scenic: May-Oct)",
      "attractions": [
        "Jungfraujoch",
        "Matterhorn Zermatt",
        "Lake Geneva",
        "Interlaken"
      ],
      "is_published": true
    },
    {
      "id": "dest-bali",
      "name": "Bali",
      "country": "Indonesia",
      "region": "Southeast Asia",
      "image_url": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
      "description": "Lush terraced rice fields, sacred cliffside temples, private pool villas in Ubud, and breathtaking sunset beach clubs.",
      "best_time": "April to October",
      "attractions": [
        "Ubud Rainforest",
        "Uluwatu Cliff Temple",
        "Seminyak Luxury Beach",
        "Nusa Penida"
      ],
      "is_published": true
    },
    {
      "id": "dest-dubai",
      "name": "Dubai",
      "country": "United Arab Emirates",
      "region": "Middle East",
      "image_url": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
      "description": "Iconic architectural marvels, 7-star hospitality, luxury desert oasis glamping, and private superyacht charters.",
      "best_time": "October to April",
      "attractions": [
        "Burj Al Arab",
        "Palm Jumeirah",
        "Desert Conservation Reserve",
        "Dubai Marina"
      ],
      "is_published": true
    },
    {
      "id": "dest-kashmir",
      "name": "Kashmir",
      "country": "India",
      "region": "South Asia",
      "image_url": "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800&q=80",
      "description": "The Paradise on Earth. Royal wooden houseboats on Dal Lake, snow slopes of Gulmarg, and saffron valleys of Pahalgam.",
      "best_time": "March to October (Snow: Dec-Feb)",
      "attractions": [
        "Dal Lake Shikara",
        "Gulmarg Gondola",
        "Pahalgam Betaab Valley",
        "Sonamarg"
      ],
      "is_published": true
    },
    {
      "id": "dest-amalfi",
      "name": "Amalfi Coast",
      "country": "Italy",
      "region": "Europe",
      "image_url": "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80",
      "description": "Dramatic pastel cliffside villages, azure Mediterranean yachting, cliff-edge infinity pools, and Michelin dining.",
      "best_time": "May to September",
      "attractions": [
        "Positano",
        "Capri Island Yachting",
        "Ravello Gardens",
        "Amalfi Cathedral"
      ],
      "is_published": true
    },
    {
      "id": "dest-vietnam",
      "name": "Vietnam",
      "country": "Vietnam",
      "region": "Southeast Asia",
      "image_url": "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
      "description": "Emerald waters of Halong Bay, ancient lantern-lit streets of Hoi An, vibrant street cuisine, and breathtaking karst limestone mountains.",
      "best_time": "November to April",
      "attractions": [
        "Halong Bay Luxury Cruise",
        "Hoi An Ancient Lantern Town",
        "Golden Bridge Ba Na Hills",
        "Hanoi French Quarter"
      ],
      "is_published": true
    },
    {
      "id": "dest-paris",
      "name": "Paris & French Riviera",
      "country": "France",
      "region": "Western Europe",
      "image_url": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
      "description": "Iconic Parisian elegance, Haute Couture shopping, Michelin-starred gastronomy, and private yachts along the Côte d’Azur.",
      "best_time": "April to October",
      "attractions": [
        "Eiffel Tower VIP Access",
        "Louvre Museum Private Tour",
        "Monaco & Nice Yacht Charter",
        "Champagne Region Private Cellars"
      ],
      "is_published": true
    },
    {
      "id": "dest-japan",
      "name": "Kyoto & Tokyo",
      "country": "Japan",
      "region": "East Asia",
      "image_url": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
      "description": "Ancient Zen shrines, private geisha tea ceremonies in Gion, Shinkansen bullet train first-class, and Tokyo luxury penthouses.",
      "best_time": "March to May (Cherry Blossoms) & Sept to Nov (Autumn Foliage)",
      "attractions": [
        "Mount Fuji Luxury Onsen",
        "Fushimi Inari Shrine",
        "Tokyo Ginza Haute Shopping",
        "Kyoto Bamboo Grove"
      ],
      "is_published": true
    },
    {
      "id": "dest-singapore",
      "name": "Singapore",
      "country": "Singapore",
      "region": "Southeast Asia",
      "image_url": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
      "description": "Futuristic Gardens by the Bay, Marina Bay Sands infinity pool, Michelin-star hawker to fine dining, and Sentosa luxury beach clubs.",
      "best_time": "November to August",
      "attractions": [
        "Marina Bay Sands SkyPark",
        "Gardens by the Bay Cloud Forest",
        "Sentosa Island Private Yacht",
        "Jewel Changi Experience"
      ],
      "is_published": true
    }
  ],
  "packages": [
    {
      "id": "pkg-maldives-sanctuary",
      "title": "Maldives Overwater Luxury Sanctuary 5★",
      "price": 185000,
      "duration": "5 Days / 4 Nights",
      "category": "Luxury",
      "destination_id": "dest-maldives",
      "destinations": {
        "name": "Maldives",
        "country": "Maldives"
      },
      "image_url": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
      "gallery_images": [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
        "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80",
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80",
        "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800&q=80"
      ],
      "short_description": "Private overwater pool villa at a 5-star resort with roundtrip scenic seaplane transfers and sunset dolphin yacht cruise.",
      "description": "Surrender to absolute paradise. Wake up to panoramic turquoise views from your private overwater pool villa. Enjoy gourmet all-inclusive dining across 4 signature restaurants, guided coral reef snorkeling, and a sunset champagne yacht cruise with dolphin watching.",
      "itinerary": [
        {
          "title": "Day 1: Scenic Seaplane Arrival & Sunset Welcome",
          "desc": "Touch down at Velana Airport and board a scenic 35-minute seaplane flight over turquoise atolls. Check in to your private Overwater Pool Villa with complimentary champagne and evening sunset canapés."
        },
        {
          "title": "Day 2: Private Reef Snorkeling & Floating Breakfast",
          "desc": "Indulge in an iconic floating breakfast in your private infinity pool. Afternoon guided marine biologist coral safari to swim with sea turtles and manta rays."
        },
        {
          "title": "Day 3: Sunset Champagne Yacht Cruise",
          "desc": "Morning at leisure at the overwater spa with a signature 60-minute couple massage. Board a private luxury yacht for a sunset cruise with wild dolphin pod sightings."
        },
        {
          "title": "Day 4: Sandbank Private Picnic & Stargazing",
          "desc": "Speedboat transfer to an exclusive uninhabited sandbank for a private gourmet chef lunch. Evening candlelit beach dinner under the stars."
        },
        {
          "title": "Day 5: Farewell to Paradise",
          "desc": "Enjoy breakfast overlooking the lagoon before your return seaplane flight to Male for your international connection."
        }
      ],
      "inclusions": [
        "4 Nights in 5★ Overwater Pool Villa",
        "Roundtrip Scenic Seaplane Transfers",
        "Daily Gourmet Breakfast & Multi-Course Dinners",
        "Sunset Champagne Dolphin Yacht Cruise",
        "60-Minute Couple Overwater Spa Treatment",
        "Complimentary Snorkeling Gear & Non-Motorized Watersports",
        "24/7 Dedicated Island Butler Concierge"
      ],
      "exclusions": [
        "International Flight Tickets",
        "Premium Alcoholic Brands Outside Meal Package",
        "Personal Gratuities & Visa Fees",
        "Motorized Jet Ski & Scuba Certification"
      ],
      "important_info": [
        "Passport must be valid for at least 6 months from arrival.",
        "Complimentary 30-day tourist visa granted upon arrival in Maldives.",
        "Seaplane flights operate strictly during daylight hours (06:00 - 16:30)."
      ],
      "is_published": true
    },
    {
      "id": "pkg-swiss-alps-express",
      "title": "Swiss Alps & Glacier Express Grand Tour",
      "price": 245000,
      "duration": "7 Days / 6 Nights",
      "category": "Luxury",
      "destination_id": "dest-switzerland",
      "destinations": {
        "name": "Switzerland",
        "country": "Switzerland"
      },
      "image_url": "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&q=80",
      "gallery_images": [
        "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=800&q=80",
        "https://images.unsplash.com/photo-1491557345352-5929e343eb89?w=800&q=80",
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
        "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=800&q=80"
      ],
      "short_description": "First-class panoramic Glacier Express rail, 5-star alpine chalets in Zermatt & Interlaken, and Jungfraujoch summit.",
      "description": "Experience Switzerland in ultimate grandeur. Travel aboard First Class Swiss Panoramic rail through soaring Alpine valleys, stay in 5-star mountain view chalets, visit Jungfraujoch — The Top of Europe, and cruise Lake Lucerne.",
      "itinerary": [
        {
          "title": "Day 1: Zurich Arrival & Private Transfer to Lucerne",
          "desc": "VIP meet & greet at Zurich Airport. Private Mercedes chauffeur transfer to 5-star Grand Hotel National Lucerne. Evening private lake cruise with Swiss fondue."
        },
        {
          "title": "Day 2: Mount Pilatus Golden Round Trip",
          "desc": "Ascend the world's steepest cogwheel railway to Mount Pilatus summit for breathtaking views across 73 Alpine peaks."
        },
        {
          "title": "Day 3: Glacier Express First Class to Zermatt",
          "desc": "Board the legendary Glacier Express in First Class Excellence category. Travel through dramatic gorges and over 291 bridges with a 5-course gourmet lunch on board."
        },
        {
          "title": "Day 4: Matterhorn Glacier Paradise & Zermatt Luxury",
          "desc": "Cable car ascent to Matterhorn Glacier Paradise (3,883m). Afternoon luxury chocolate tasting and stroll through car-free Zermatt village."
        },
        {
          "title": "Day 5: Interlaken & Lauterbrunnen Valley of 72 Waterfalls",
          "desc": "Scenic journey to Interlaken. Private excursion through the fairytale Lauterbrunnen valley and Grindelwald First cliff walk."
        },
        {
          "title": "Day 6: Jungfraujoch — Top of Europe",
          "desc": "Board the modern Eiger Express tri-cable gondola to Jungfraujoch. Walk through the Ice Palace and step onto the eternal snow of the Aletsch Glacier."
        },
        {
          "title": "Day 7: Zurich Departure",
          "desc": "First class scenic train to Zurich Airport for your onward international flight."
        }
      ],
      "inclusions": [
        "6 Nights in 5★ Grand Alpine Hotels (Lucerne, Zermatt, Interlaken)",
        "First Class Swiss Travel Pass with All Mountain Rail Excursions",
        "Glacier Express First Class Reservation & 5-Course Dining",
        "Jungfraujoch Top of Europe & Mount Pilatus Excursions",
        "Private Mercedes Airport Transfers",
        "Daily Swiss Gourmet Breakfast & Fondue Experiences",
        "24/7 Dedicated Swiss Concierge Support"
      ],
      "exclusions": [
        "International Flights to/from Zurich",
        "Schengen Visa Processing Fees",
        "Personal Ski Rental & Ski Passes",
        "Travel Insurance"
      ],
      "important_info": [
        "Schengen visa required for Indian passport holders (Via Tours provides full document filing assistance).",
        "Warm layered clothing recommended even during summer months at high altitudes."
      ],
      "is_published": true
    },
    {
      "id": "pkg-bali-luxe-villas",
      "title": "Bali Luxe Retreat: Private Pool Villas & Ubud",
      "price": 115000,
      "duration": "6 Days / 5 Nights",
      "category": "Honeymoon",
      "destination_id": "dest-bali",
      "destinations": {
        "name": "Bali",
        "country": "Indonesia"
      },
      "image_url": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
      "gallery_images": [
        "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80",
        "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&q=80",
        "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80",
        "https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=800&q=80"
      ],
      "short_description": "Private pool villas in Ubud rainforest and Seminyak beachfront, floating breakfast, and Uluwatu sunset VIP dinner.",
      "description": "Indulge in the spiritual and luxury essence of Bali. Rejuvenate in private jungle pool villas overlooking the Ayung river valley, enjoy signature flower bath spas, and soak in cliffside Uluwatu sunsets.",
      "itinerary": [
        {
          "title": "Day 1: Arrival & Private Pool Villa Check-In",
          "desc": "VIP Fast Track airport welcome in Denpasar. Chauffeur transfer to your luxury private pool villa in Ubud. Romantic candlelit welcome dinner."
        },
        {
          "title": "Day 2: Ubud Hidden Waterfalls & Rice Terraces",
          "desc": "Private 4x4 tour to Tegallalang rice terraces, Bali jungle swing with photographer, and sacred Tirta Empul water temple blessing."
        },
        {
          "title": "Day 3: Transfer to Beachfront Seminyak & Sunset Club",
          "desc": "Scenic transfer to 5★ beachfront resort in Seminyak. Afternoon relaxation at a VIP beach club cabana."
        },
        {
          "title": "Day 4: Nusa Penida Island Private Speedboat Tour",
          "desc": "Private speedboat excursion to Kelingking T-Rex cliff, Angel's Billabong, and crystal bay snorkeling with manta rays."
        },
        {
          "title": "Day 5: Uluwatu Cliff Temple & Jimbaran Seafood Feast",
          "desc": "Visit Uluwatu temple perched on a 70-meter cliff. Watch the traditional Kecak fire dance followed by a private seafood dinner on the beach."
        },
        {
          "title": "Day 6: Spa Morning & Departure",
          "desc": "2-hour traditional Balinese couple spa treatment and private airport transfer for flight home."
        }
      ],
      "inclusions": [
        "5 Nights in Luxury Private Pool Villas (Ubud + Seminyak)",
        "Private Dedicated Chauffeur & Air-Conditioned SUV for Entire Tour",
        "Daily Floating & Gourmet Breakfasts",
        "Private Nusa Penida Island Speedboat Day Excursion",
        "2-Hour Royal Balinese Couple Spa Massage",
        "VIP Uluwatu Temple & Jimbaran Beach Candlelight Dinner"
      ],
      "exclusions": [
        "International Flights",
        "Indonesia Visa on Arrival ($35 USD paid directly at airport)",
        "Personal Shopping & Tips"
      ],
      "important_info": [
        "Visa on Arrival available for 80+ nationalities at DPS Airport.",
        "Currency: Indonesian Rupiah (IDR). Credit cards widely accepted."
      ],
      "is_published": true
    },
    {
      "id": "pkg-dubai-ultra-luxury",
      "title": "Dubai Ultra Luxury & Desert Oasis Glamping",
      "price": 165000,
      "duration": "5 Days / 4 Nights",
      "category": "Luxury",
      "destination_id": "dest-dubai",
      "destinations": {
        "name": "Dubai",
        "country": "United Arab Emirates"
      },
      "image_url": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
      "gallery_images": [
        "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&q=80",
        "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80",
        "https://images.unsplash.com/photo-1526495124232-a04e1849168c?w=800&q=80"
      ],
      "short_description": "5-star Burj Al Arab hospitality, private luxury yacht cruise around Palm Jumeirah, and desert oasis villa stay.",
      "description": "Step into a realm of modern opulence. From helicopter skyline tours to private desert glamping under Arabian stars with five-star banquet dining.",
      "itinerary": [
        {
          "title": "Day 1: Rolls Royce Airport Transfer & 5★ Hotel Check-In",
          "desc": "VIP meet at Dubai International Airport with executive transfer to Atlantis The Royal / Burj Al Arab."
        },
        {
          "title": "Day 2: Private Superyacht Cruise & Burj Khalifa Sky Lounge",
          "desc": "3-hour private yacht cruise around Palm Jumeirah with champagne. Afternoon VIP access to Burj Khalifa At The Top SKY (Level 148)."
        },
        {
          "title": "Day 3: Desert Oasis Resort & Starlight Dune Safari",
          "desc": "Transfer to Al Maha Luxury Desert Resort. Private vintage Land Rover wildlife safari, falconry show, and private dune dinner."
        },
        {
          "title": "Day 4: Miracle Garden, Museum of the Future & Fine Dining",
          "desc": "Priority access to Museum of the Future. Evening gourmet dining at Michelin-starred Ossiano underwater restaurant."
        },
        {
          "title": "Day 5: Gold Souk Shopping & Luxury Departure",
          "desc": "Private guided tour of old Dubai and Gold Souk. Airport transfer for onward flight."
        }
      ],
      "inclusions": [
        "4 Nights in 5★ Ultra Luxury Resorts & Desert Oasis Villa",
        "Private Chauffeur Fleet for All Transfers & Sightseeing",
        "Private 3-Hour Superyacht Cruise with Catering",
        "Burj Khalifa Level 148 SKY VIP Lounge Access",
        "Royal Desert Conservation Safari & Gourmet Dune Dinner",
        "Museum of the Future Priority Entry"
      ],
      "exclusions": [
        "International Flights",
        "UAE Tourist Visa (Assistance provided)",
        "Tourism Dirham Fee (approx $5/night)"
      ],
      "important_info": [
        "UAE Visa issued within 48 hours for most travelers.",
        "Dress code for fine dining venues is smart elegant."
      ],
      "is_published": true
    },
    {
      "id": "pkg-kashmir-paradise",
      "title": "Kashmir Paradise: Heritage Houseboat & Gulmarg",
      "price": 78000,
      "duration": "6 Days / 5 Nights",
      "category": "Family",
      "destination_id": "dest-kashmir",
      "destinations": {
        "name": "Kashmir",
        "country": "India"
      },
      "image_url": "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800&q=80",
      "gallery_images": [
        "https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=800&q=80",
        "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=800&q=80"
      ],
      "short_description": "Luxury cedar houseboat on Dal Lake, Gulmarg Phase 2 Gondola pass, and snow-capped pine valley escapes.",
      "description": "Discover the Crown of India. Float on the tranquil waters of Dal Lake with a traditional Shikara, take the world's highest cable car in Gulmarg, and stroll through Pahalgam's pine forests.",
      "itinerary": [
        {
          "title": "Day 1: Srinagar Arrival & Royal Houseboat Check-In",
          "desc": "Warm Kashmiri welcome at Srinagar Airport. Transfer to luxury heritage carved-wood houseboat on Dal Lake. Sunset Shikara ride."
        },
        {
          "title": "Day 2: Mughal Gardens & Old Srinagar Walk",
          "desc": "Tour of Nishat Bagh, Shalimar Bagh, and Shankaracharya Temple with local heritage expert."
        },
        {
          "title": "Day 3: Gulmarg — Meadow of Flowers & Phase 2 Gondola",
          "desc": "Scenic drive to Gulmarg. Ascend to Kongdoori and Apharwat Peak via high-altitude gondola."
        },
        {
          "title": "Day 4: Pahalgam — Valley of Shepherds",
          "desc": "Drive through saffron fields and apple orchards to Pahalgam. Visit Betaab Valley and Aru Valley."
        },
        {
          "title": "Day 5: Baisaran Valley & River Rafting Excursion",
          "desc": "Pony trek or hike to Mini Switzerland (Baisaran). Evening riverside bonfire with traditional Kashmiri Wazwan feast."
        },
        {
          "title": "Day 6: Srinagar Airport Departure",
          "desc": "Morning shikara photo tour and transfer to Srinagar Airport for your flight."
        }
      ],
      "inclusions": [
        "2 Nights Luxury Heritage Houseboat + 3 Nights 5★ Resort in Gulmarg/Pahalgam",
        "Private Heating & Luxury Transport Throughout",
        "Phase 1 & 2 Gulmarg Gondola Tickets Included",
        "Daily Traditional Breakfasts & 4-Course Dinners (Wazwan Included)",
        "Complimentary Sunset Shikara Rides"
      ],
      "exclusions": [
        "Domestic Airfare to Srinagar",
        "Personal Snow Activity Rentals (Skiing/Sledging)",
        "Pony Rides in Baisaran"
      ],
      "important_info": [
        "Postpaid mobile connections (Airtel/Jio/BSNL) work in Jammu & Kashmir.",
        "Carry warm jackets even in summer months for Gulmarg Phase 2."
      ],
      "is_published": true
    },
    {
      "id": "pkg-vietnam-charm",
      "title": "Vietnam... The Timeless Charm & Halong Bay Luxury Cruise",
      "price": 128000,
      "duration": "7 Days / 6 Nights",
      "category": "Adventure",
      "destination_id": "dest-vietnam",
      "destinations": {
        "name": "Vietnam",
        "country": "Vietnam"
      },
      "image_url": "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
      "gallery_images": [
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80",
        "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80"
      ],
      "short_description": "Value-Driven Luxury 5-star Halong Bay boutique cruise with private balcony, Hanoi French Quarter, and Hoi An ancient lantern town.",
      "description": "A mesmerizing journey through Vietnam's timeless landscapes and culinary wonders. Glide through thousands of limestone karst islands on a 5-star luxury cruise, and explore lantern-lit UNESCO ancient streets with dedicated private chauffeured transfers.",
      "itinerary": [
        {
          "title": "Day 1: Hanoi Arrival & French Quarter Stroll",
          "desc": "VIP airport transfer to 5★ French colonial hotel in Hanoi. Evening guided street food walk and Water Puppet show."
        },
        {
          "title": "Day 2: Hanoi to Halong Bay Luxury Cruise Boarding",
          "desc": "Limousine transfer to Halong Bay. Board your 5-star boutique ship. Cruise through emerald waters with cave kayaking and cooking class."
        },
        {
          "title": "Day 3: Sunrise Tai Chi & Flight to Danang / Hoi An",
          "desc": "Sunrise Tai Chi on sundeck, explore Sung Sot Cave. Transfer to airport for flight to Danang, continue to ancient Hoi An."
        },
        {
          "title": "Day 4: Hoi An Lantern Town & Basket Boat River Safari",
          "desc": "Cycle through organic herb villages, take a traditional round basket boat safari, and release floating lanterns on the river."
        },
        {
          "title": "Day 5: Ba Na Hills & Golden Hand Bridge",
          "desc": "Cable car to Ba Na Hills to walk along the iconic Golden Bridge held by giant stone hands."
        },
        {
          "title": "Day 6: Hue Imperial City Day Tour",
          "desc": "Excursion through Hai Van Pass to the ancient Imperial Citadel of Hue and tomb of Emperor Khai Dinh."
        },
        {
          "title": "Day 7: Danang Departure",
          "desc": "Transfer to Danang Airport for international flight home."
        }
      ],
      "inclusions": [
        "5 Nights in 5★ Luxury Boutique Hotels + 1 Night 5★ Halong Bay Cruise Suite",
        "All Domestic Vietnam Flights (Hanoi to Danang)",
        "Halong Bay Kayaking, Cooking Demonstration & All Ship Meals",
        "Ba Na Hills Golden Bridge Cable Car Priority Pass",
        "Private English-Speaking Tour Guides & Luxury Limousine Vans"
      ],
      "exclusions": [
        "International Flights",
        "Vietnam E-Visa Fee ($25 USD, assistance provided)",
        "Personal Beverages Outside Set Menus"
      ],
      "important_info": [
        "Vietnam E-Visa is processed online in 3-4 working days.",
        "Vegetarian and Indian dietary requests are fully accommodated on the cruise."
      ],
      "is_published": true
    },
    {
      "id": "pkg-amalfi-romance",
      "title": "Amalfi Coast & Capri Private Yacht Odyssey 5★",
      "slug": "amalfi-coast-capri-yacht-odyssey",
      "destination_id": "dest-amalfi",
      "price": 295000,
      "currency": "INR",
      "duration": "7 Days / 6 Nights",
      "category": "Honeymoon",
      "difficulty": "Relaxed / Ultra-Luxury",
      "image_url": "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80",
      "short_description": "Cliffside 5★ villas in Positano, private Riva yacht cruise to Capri’s Blue Grotto, and Ravello cliff-top dinners.",
      "description": "Experience Italy’s most breathtaking coastline in bespoke luxury. Stay at cliffside palace hotels overlooking the Tyrrhenian Sea, enjoy private skippered yacht charters to Capri and the Faraglioni rocks, private sommelier wine tastings in Ravello, and chauffeured vintage Alfa Romeo transfers.",
      "gallery_images": [
        "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80",
        "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80",
        "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&q=80"
      ],
      "inclusions": [
        "6 Nights in 5★ Luxury Sea-View Suites (Positano & Ravello)",
        "Daily Champagne breakfast with panoramic sea views",
        "Full-day private Riva yacht charter to Capri & Blue Grotto",
        "Private Mercedes S-Class chauffeured airport & coastal transfers",
        "Michelin-starred cliffside dining experience in Positano",
        "24/7 dedicated European luxury concierge support"
      ],
      "exclusions": [
        "International flights to Naples/Rome (can be arranged upon request)",
        "Tourist city tax payable locally at check-out",
        "Personal luxury shopping and discretionary gratuities"
      ],
      "important_info": [
        "Best travel window: May through October for sailing and beach clubs.",
        "Complimentary date modifications permitted up to 21 days prior to departure.",
        "Schengen Visa guidance and priority documentation provided."
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Arrival in Naples & Private Transfer to Positano",
          "desc": "Arrive at Naples Capodichino Airport. Your private chauffeur escorts you along the scenic coastal highway to your 5-star cliffside suite in Positano. Welcome prosecco reception at sunset."
        },
        {
          "day": 2,
          "title": "Positano Coastal Walk & Private Beach Club",
          "desc": "Morning stroll through Positano’s pastel boutiques. Spend an afternoon relaxing at an exclusive cliff-flanked beach club with reserved sun loungers and fresh seafood lunch."
        },
        {
          "day": 3,
          "title": "Private Riva Yacht Expedition to Capri",
          "desc": "Board your private skippered yacht from Positano dock. Sail past the Li Galli islands, circumnavigate Capri, swim in hidden sea caves, and visit the iconic Blue Grotto."
        },
        {
          "day": 4,
          "title": "Capri Town Exploration & Anacapri Chairlift",
          "desc": "Disembark at Marina Grande Capri for a scenic convertible taxi ride to Anacapri. Ascend Monte Solaro by chairlift for 360-degree vistas across the Bay of Naples."
        },
        {
          "day": 5,
          "title": "Transfer to Historic Ravello & Villa Cimbrone Gardens",
          "desc": "Chauffeured transfer high above the coastline to Ravello. Check into your luxury palace hotel. Afternoon stroll through the world-famous Infinity Terrace at Villa Cimbrone."
        },
        {
          "day": 6,
          "title": "Amalfi Cathedral & Lemon Grove Limoncello Tasting",
          "desc": "Visit the historic Amalfi town and its 9th-century Duomo. Enjoy a private tour of a cliffside organic lemon grove followed by an artisanal limoncello and mozzarella tasting."
        },
        {
          "day": 7,
          "title": "Farewell Amalfi & Chauffeured Airport Transfer",
          "desc": "Enjoy a leisurely breakfast on your private terrace. Private chauffeured transfer to Naples Airport for your flight home, filled with memories of the Italian coast."
        }
      ],
      "is_published": true
    }
  ],
  "blogs": [
    {
      "id": "blog-maldives-guide",
      "slug": "ultimate-maldives-luxury-guide",
      "title": "The Ultimate Guide to Selecting Your Dream Maldives Resort",
      "excerpt": "From private seaplane transfers to underwater restaurants, discover the key differences between atolls, overwater villas, and all-inclusive luxury.",
      "image_url": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
      "content": "\n                <p>When planning a journey to the Maldives, one of the most common questions travelers ask is how to choose between the hundreds of private island resorts. Each atoll in this archipelago offers unique geographic and marine advantages.</p>\n                <h2>1. Seaplane vs. Speedboat Transfers</h2>\n                <p>Resorts within North and South Male Atolls are accessible via a 20-45 minute luxury speedboat transfer, which operates 24/7. However, if you are seeking ultimate seclusion and pristine marine biodiversity, taking a 35-45 minute scenic seaplane flight to Baa Atoll or Raa Atoll offers unmatched bird's-eye views of turquoise coral rings.</p>\n                <h2>2. Overwater Villas vs. Beach Villas</h2>\n                <p>While overwater villas provide direct lagoon access and uninterrupted ocean sunsets, beach villas often feature larger private gardens and immediate soft white sand access. For trips of 5 nights or longer, we frequently recommend a split-stay experience (2 nights Beach Villa + 3 nights Overwater Pool Villa) for the best of both worlds.</p>\n                <h2>3. All-Inclusive Luxury Defined</h2>\n                <p>Not all all-inclusive plans are created equal. At Via Tours & Travels, we specifically partner with 5-star resorts that offer Premium All-Inclusive dining, including multi-course à la carte meals, premium cellar wines, complimentary spa sessions, and guided marine excursions.</p>\n            ",
      "created_at": "2026-02-15T10:00:00Z",
      "is_published": true
    },
    {
      "id": "blog-swiss-scenic-trains",
      "slug": "switzerland-scenic-train-routes",
      "title": "Riding the Clouds: Switzerland's Most Breathtaking Rail Journeys",
      "excerpt": "Why the Glacier Express, Bernina Express, and GoldenPass panoramic trains are best experienced with first-class Swiss travel passes.",
      "image_url": "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&q=80",
      "content": "\n                <p>Switzerland possesses the world's most sophisticated and breathtaking railway network. The experience of gazing through panoramic glass ceilings as alpine glaciers and pristine valleys glide by is unmatched.</p>\n                <h2>The Glacier Express: The World's Slowest Express Train</h2>\n                <p>Connecting Zermatt with St. Moritz in roughly 8 hours, the Glacier Express crosses 291 bridges and 91 tunnels. First Class Excellence class includes dedicated concierge service, a five-course gourmet meal, and guaranteed window seating.</p>\n                <h2>The GoldenPass Panoramic</h2>\n                <p>Running from Montreux on Lake Geneva to Interlaken and Lucerne, this route showcases historic Swiss vineyards, storybook wooden chalets, and shimmering turquoise lakes.</p>\n            ",
      "created_at": "2026-01-28T14:30:00Z",
      "is_published": true
    },
    {
      "id": "blog-bali-culture-villas",
      "slug": "bali-hidden-gems-luxury-retreat",
      "title": "Beyond the Crowds: Curating a Private Sanctuary in Bali",
      "excerpt": "How to experience Bali with private waterfall tours, cliffside infinity pools, and authentic temple water blessings.",
      "image_url": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
      "content": "\n                <p>While Bali is celebrated globally, experiencing the island with tranquility requires thoughtful itinerary curation and private chauffeured access.</p>\n                <h2>The Magic of Ubud's River Valleys</h2>\n                <p>Staying in Ubud allows you to immerse yourself in the sound of rushing rivers and lush jungle canopies. Morning yoga sessions, private cooking classes with master chefs, and quiet temple visits before public hours reveal Bali's true soul.</p>\n            ",
      "created_at": "2026-01-10T09:15:00Z",
      "is_published": true
    },
    {
      "id": "blog-packing-checklist",
      "slug": "luxury-international-travel-packing-checklist",
      "title": "Essential International Travel & Packing Checklist for Luxury Voyagers",
      "excerpt": "From passport validity and multi-currency prep to private seaplane luggage allowances, review our essential pre-departure checklist.",
      "image_url": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
      "content": "\n                <p>Preparing for a seamless luxury holiday requires thoughtful preparation. Here is our senior travel concierge-recommended pre-departure checklist to ensure effortless, stress-free journeys worldwide.</p>\n                <h2>1. Travel Documentation & Visa Clearance</h2>\n                <p>Always verify that your passport has at least 6 months validity from your scheduled date of return and at least 3 blank pages. Keep digital PDF copies of your flight tickets, luxury resort vouchers, and travel insurance accessible on your smartphone offline.</p>\n                <h2>2. Currency & Multi-Currency Cards</h2>\n                <p>While international credit cards are widely accepted at 5-star resorts, carrying a modest reserve of local currency (for gratuities, traditional bazaars, and local artisans) is recommended. Ensure international roaming and bank transaction alerts are activated before departure.</p>\n                <h2>3. Luggage & Packing Strategy</h2>\n                <p>When traveling to island destinations via seaplane (such as the Maldives), keep in mind luggage weight guidelines (typically 20kg checked + 5kg hand luggage). For European alpine expeditions, pack high-quality breathable thermal layers and UV-polarized sunglasses.</p>\n            ",
      "created_at": "2026-02-20T11:00:00Z",
      "is_published": true
    }
  ],
  "testimonials": [
    {
      "name": "Aarav & Meera Kapoor",
      "location": "Mumbai, India — Maldives Honeymoon Overwater Villa 5★",
      "rating": 5,
      "message": "Our Maldives honeymoon planned by Via Tours & Travels exceeded every expectation. The overwater pool villa was breathtaking, and our private seaplane and champagne yacht cruise went off without a hitch. Truly 5-star service!",
      "image_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
      "id": "test-1",
      "is_published": true
    },
    {
      "name": "Dr. Siddharth Sen & Family",
      "location": "Bengaluru, India — Switzerland Glacier Express Tour 5★",
      "rating": 5,
      "message": "Traveling with elderly parents and kids can be challenging, but Via Tours & Travels orchestrated every private transfer and Swiss rail ticket flawlessly. The Glacier Express was the highlight of our year!",
      "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
      "id": "test-2",
      "is_published": true
    },
    {
      "name": "Vikramaditya & Friends",
      "location": "Delhi, India — Dubai Ultra Luxury & Desert Safari 5★",
      "rating": 5,
      "message": "From the private superyacht around Palm Jumeirah to the desert glamping villa, the VIP treatment was top tier. The 24/7 WhatsApp concierge answered all our requests in seconds.",
      "image_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
      "id": "test-3",
      "is_published": true
    },
    {
      "name": "Priya & Arjun Mehta",
      "location": "Ahmedabad, India — Bali Private Pool Villa Retreat 5★",
      "rating": 5,
      "message": "The private jungle pool villa in Ubud and cliffside dinner in Uluwatu arranged by Via Tours & Travels were out of a fairy tale. Everything was curated with impeccable perfection and care.",
      "image_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80",
      "id": "test-4",
      "is_published": true
    }
  ],
  "faqs": [
    {
      "question": "How does Via Tours & Travels customize our travel itinerary?",
      "answer": "Every journey begins with understanding your preferences. After you submit your inquiry or speak with our travel concierge, we assign a dedicated senior destination architect who crafts a bespoke day-by-day itinerary including flights, 5-star resort options, private transfers, and handpicked local experiences. You can refine and modify the plan as many times as you like until it is completely tailored to your vision.",
      "id": "faq-1",
      "is_published": true
    },
    {
      "question": "Do you provide Visa documentation and appointment assistance?",
      "answer": "Yes! We provide complete end-to-end visa assistance for Schengen (Europe), UK, USA, UAE, Vietnam, Singapore, Japan, and 80+ other destinations. We guide you through document preparation, cover letters, appointment bookings, and flight/hotel proof vouchers.",
      "id": "faq-2",
      "is_published": true
    },
    {
      "question": "What is your Flexible Date Change policy?",
      "answer": "We provide 100% Free Date Changes up to 21 days prior to your departure date across all our customized private tour packages with zero administrative penalties. If unforeseen circumstances arise, your dedicated concierge will seamlessly re-align resort reservations and flight dates.",
      "id": "faq-3",
      "is_published": true
    },
    {
      "question": "What is the deposit and payment structure?",
      "answer": "To confirm your luxury itinerary and secure resort allocations, we request an initial booking deposit (typically 25% to 30% depending on the destination and peak seasonality). The remaining balance is payable prior to voucher issuance with full GST invoices and receipt acknowledgment.",
      "id": "faq-4",
      "is_published": true
    },
    {
      "question": "Can we personalize special dietary preferences (Vegetarian, Jain, Halal, Vegan)?",
      "answer": "Absolutely. Prior to your departure, our concierge coordinates directly with executive chefs at your 5-star resorts, private cruises, and booked fine-dining restaurants to guarantee seamless vegetarian, Jain, Halal, vegan, or allergen-free meals throughout your stay.",
      "id": "faq-5",
      "is_published": true
    },
    {
      "question": "Are flight tickets and airport transfers included?",
      "answer": "All our bespoke packages include private chauffeured airport transfers. We can also include international and domestic flights based on your preferred airlines, departure cities, and cabin class (Economy, Premium Economy, Business, or First Class).",
      "id": "faq-6",
      "is_published": true
    },
    {
      "question": "How does 24/7 dedicated concierge support work while we are traveling?",
      "answer": "You will have direct 24/7 WhatsApp and phone access to your dedicated senior travel specialist throughout your journey, paired with local on-ground representatives ready to assist with restaurant reservations, schedule tweaks, or emergency assistance in real time.",
      "id": "faq-7",
      "is_published": true
    },
    {
      "question": "What financial security and traveler protection guarantees are in place?",
      "answer": "Via Tours & Travels operates with full IATA & ASTA accreditation, bank-grade SSL encryption, and segregated client trust escrow accounts. All vouchers, booking reference numbers, and emergency contact directories are delivered to you well in advance of departure.",
      "id": "faq-8",
      "is_published": true
    }
  ]
};

    // Unified Catalog Store Engine
    window.CatalogStore = {
        STORAGE_PREFIX: 'via_catalog_',
        DELETED_KEY: 'via_catalog_deleted_ids',

        getDeletedIds: function() {
            try {
                var raw = localStorage.getItem(this.DELETED_KEY);
                return raw ? new Set(JSON.parse(raw)) : new Set();
            } catch (e) {
                return new Set();
            }
        },

        saveDeletedIds: function(set) {
            try {
                localStorage.setItem(this.DELETED_KEY, JSON.stringify(Array.from(set)));
            } catch (e) {
                console.warn('Could not persist deleted IDs:', e);
            }
        },

        getCustomMap: function(entity) {
            try {
                var raw = localStorage.getItem(this.STORAGE_PREFIX + entity);
                return raw ? JSON.parse(raw) : {};
            } catch (e) {
                return {};
            }
        },

        saveCustomMap: function(entity, map) {
            try {
                localStorage.setItem(this.STORAGE_PREFIX + entity, JSON.stringify(map));
            } catch (e) {
                console.warn('Could not persist custom map for ' + entity + ':', e);
            }
        },

        /**
         * Universal getter merging Supabase data, custom local edits/creations, and baseline catalog.
         * Explicitly excludes records in via_catalog_deleted_ids.
         */
        get: function(entity, supabaseData) {
            var deletedIds = this.getDeletedIds();
            var customMap = this.getCustomMap(entity);
            var baseline = (window.LUXURY_CATALOG && window.LUXURY_CATALOG[entity]) || [];

            var result = [];
            var seenIds = new Set();
            var seenKeys = new Set();

            function makeKey(item) {
                return (item.title || item.name || item.question || '').toLowerCase().trim();
            }

            // 1. Process custom local modifications & new items
            for (var id in customMap) {
                if (Object.prototype.hasOwnProperty.call(customMap, id)) {
                    if (!deletedIds.has(id)) {
                        var customItem = customMap[id];
                        result.push(customItem);
                        seenIds.add(id);
                        var k = makeKey(customItem);
                        if (k) seenKeys.add(k);
                    }
                }
            }

            // 2. Process Supabase remote items
            if (Array.isArray(supabaseData)) {
                for (var i = 0; i < supabaseData.length; i++) {
                    var sbItem = supabaseData[i];
                    if (!sbItem || !sbItem.id) continue;
                    if (deletedIds.has(sbItem.id)) continue;
                    if (seenIds.has(sbItem.id)) continue;

                    var sbKey = makeKey(sbItem);
                    if (sbKey && seenKeys.has(sbKey)) continue;

                    result.push(sbItem);
                    seenIds.add(sbItem.id);
                    if (sbKey) seenKeys.add(sbKey);
                }
            }

            // 3. Process baseline items
            for (var j = 0; j < baseline.length; j++) {
                var baseItem = baseline[j];
                if (!baseItem || !baseItem.id) continue;
                if (deletedIds.has(baseItem.id)) continue;
                if (seenIds.has(baseItem.id)) continue;

                var baseKey = makeKey(baseItem);
                var isFuzzyMatch = false;
                if (baseKey) {
                    seenKeys.forEach(function(existingKey) {
                        if (baseKey.length > 8 && existingKey.length > 8) {
                            if (baseKey.indexOf(existingKey.substring(0, 12)) !== -1 ||
                                existingKey.indexOf(baseKey.substring(0, 12)) !== -1) {
                                isFuzzyMatch = true;
                            }
                        } else if (baseKey === existingKey) {
                            isFuzzyMatch = true;
                        }
                    });
                }

                if (isFuzzyMatch) continue;

                result.push(baseItem);
                seenIds.add(baseItem.id);
                if (baseKey) seenKeys.add(baseKey);
            }

            return result;
        },

        /**
         * Universal async getter querying Supabase if available and merging with local catalog.
         */
        getAll: async function(entity, sbClient) {
            var sbData = [];
            if (sbClient) {
                try {
                    var tableMap = {
                        packages: 'packages',
                        destinations: 'destinations',
                        blogs: 'blog_posts',
                        testimonials: 'testimonials',
                        faqs: 'faqs'
                    };
                    var table = tableMap[entity] || entity;
                    var query = sbClient.from(table).select('*');
                    if (table === 'packages') {
                        query = sbClient.from(table).select('*, destinations(name, country)');
                    }
                    var response = await query;
                    if (!response.error && Array.isArray(response.data)) {
                        sbData = response.data;
                    }
                } catch (e) {
                    console.warn('Supabase fetch failed for ' + entity + ':', e);
                }
            }
            return this.get(entity, sbData);
        },

        /**
         * Universal save/update. Persists instantly to LocalStorage and syncs to Supabase.
         */
        save: async function(entity, payload, sbClient) {
            if (!payload.id) {
                payload.id = entity.substring(0, 4) + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
            }

            // Unmark from deleted if previously deleted
            var deletedIds = this.getDeletedIds();
            if (deletedIds.has(payload.id)) {
                deletedIds.delete(payload.id);
                this.saveDeletedIds(deletedIds);
            }

            // Persist locally
            var customMap = this.getCustomMap(entity);
            customMap[payload.id] = Object.assign({}, payload);
            this.saveCustomMap(entity, customMap);

            var sbSuccess = false;
            var sbError = null;

            if (sbClient) {
                try {
                    var tableMap = {
                        packages: 'packages',
                        destinations: 'destinations',
                        blogs: 'blog_posts',
                        testimonials: 'testimonials',
                        faqs: 'faqs'
                    };
                    var table = tableMap[entity] || entity;
                    var sbPayload = Object.assign({}, payload);
                    delete sbPayload.destinations; // Clean relation cache

                    var isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sbPayload.id);
                    if (isUUID) {
                        var res = await sbClient.from(table).upsert(sbPayload);
                        if (!res.error) sbSuccess = true;
                        else sbError = res.error;
                    } else {
                        // Table uses UUIDs for primary key. Check by title or name to update or insert
                        var matchCol = (entity === 'faqs') ? 'question' : ((entity === 'packages' || entity === 'blogs') ? 'title' : 'name');
                        var checkRes = await sbClient.from(table).select('id').eq(matchCol, sbPayload[matchCol]).maybeSingle();
                        if (checkRes.data && checkRes.data.id) {
                            delete sbPayload.id;
                            var updateRes = await sbClient.from(table).update(sbPayload).eq('id', checkRes.data.id);
                            if (!updateRes.error) {
                                sbSuccess = true;
                                customMap[payload.id].id = checkRes.data.id;
                                this.saveCustomMap(entity, customMap);
                            } else {
                                sbError = updateRes.error;
                            }
                        } else {
                            delete sbPayload.id;
                            var insertRes = await sbClient.from(table).insert([sbPayload]).select();
                            if (!insertRes.error && insertRes.data && insertRes.data[0]) {
                                sbSuccess = true;
                                customMap[payload.id].id = insertRes.data[0].id;
                                this.saveCustomMap(entity, customMap);
                            } else {
                                sbError = insertRes.error;
                            }
                        }
                    }
                } catch (e) {
                    sbError = e;
                }
            }

            return { success: true, sbSuccess: sbSuccess, sbError: sbError, item: customMap[payload.id] || payload };
        },

        /**
         * Universal delete. Adds ID to deleted IDs and syncs delete to Supabase.
         */
        delete: async function(entity, id, sbClient) {
            if (!id) return { success: false, message: 'Missing record ID' };

            var deletedIds = this.getDeletedIds();
            deletedIds.add(id);
            this.saveDeletedIds(deletedIds);

            var customMap = this.getCustomMap(entity);
            delete customMap[id];
            this.saveCustomMap(entity, customMap);

            var sbSuccess = false;
            var sbError = null;

            if (sbClient) {
                try {
                    var tableMap = {
                        packages: 'packages',
                        destinations: 'destinations',
                        blogs: 'blog_posts',
                        testimonials: 'testimonials',
                        faqs: 'faqs'
                    };
                    var table = tableMap[entity] || entity;
                    var isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
                    if (isUUID) {
                        var delRes = await sbClient.from(table).delete().eq('id', id);
                        if (!delRes.error) sbSuccess = true;
                        else sbError = delRes.error;
                    }
                } catch (e) {
                    sbError = e;
                }
            }

            return { success: true, sbSuccess: sbSuccess, sbError: sbError };
        },

        /**
         * Reset local custom store and deletions back to clean factory state.
         */
        resetToDefaults: function(entity) {
            if (entity) {
                localStorage.removeItem(this.STORAGE_PREFIX + entity);
                var baseline = (window.LUXURY_CATALOG && window.LUXURY_CATALOG[entity]) || [];
                var deletedIds = this.getDeletedIds();
                var changed = false;
                baseline.forEach(function(item) {
                    if (item && item.id && deletedIds.has(item.id)) {
                        deletedIds.delete(item.id);
                        changed = true;
                    }
                });
                if (changed) this.saveDeletedIds(deletedIds);
            } else {
                var self = this;
                ['packages', 'destinations', 'blogs', 'testimonials', 'faqs'].forEach(function(e) {
                    localStorage.removeItem(self.STORAGE_PREFIX + e);
                });
                localStorage.removeItem(this.DELETED_KEY);
            }
        },

        /**
         * Seed all baseline catalog items to Supabase cloud database.
         */
        seedToSupabase: async function(sbClient, progressCallback) {
            if (!sbClient) throw new Error('Supabase client is not initialized or connected.');

            var log = typeof progressCallback === 'function' ? progressCallback : function() {};
            var report = { inserted: 0, updated: 0, errors: [] };

            // 1. Seed Destinations
            var dests = this.get('destinations');
            for (var i = 0; i < dests.length; i++) {
                var d = dests[i];
                try {
                    var destPayload = {
                        name: d.name,
                        country: d.country || '',
                        region: d.region || '',
                        description: d.description || '',
                        image_url: d.image_url || '',
                        best_time: d.best_time || '',
                        attractions: d.attractions || [],
                        is_published: d.is_published !== false
                    };
                    var chk = await sbClient.from('destinations').select('id').eq('name', d.name).maybeSingle();
                    if (chk.data && chk.data.id) {
                        await sbClient.from('destinations').update(destPayload).eq('id', chk.data.id);
                        report.updated++;
                    } else {
                        await sbClient.from('destinations').insert([destPayload]);
                        report.inserted++;
                    }
                    log('Destination synced: ' + d.name);
                } catch (err) {
                    report.errors.push('Destination (' + d.name + '): ' + err.message);
                }
            }

            // Fetch live destinations to map destination_id by destination name
            var destMap = {};
            try {
                var freshDests = await sbClient.from('destinations').select('id, name');
                if (freshDests.data) {
                    freshDests.data.forEach(function(fd) {
                        destMap[fd.name.toLowerCase().trim()] = fd.id;
                    });
                }
            } catch (e) {}

            // 2. Seed Packages
            var pkgs = this.get('packages');
            for (var j = 0; j < pkgs.length; j++) {
                var p = pkgs[j];
                try {
                    var destUUID = null;
                    var baseDest = (window.LUXURY_CATALOG.destinations || []).find(function(d) {
                        return d.id === p.destination_id;
                    });
                    if (baseDest && destMap[baseDest.name.toLowerCase().trim()]) {
                        destUUID = destMap[baseDest.name.toLowerCase().trim()];
                    }

                    var pkgPayload = {
                        title: p.title,
                        price: Number(p.price) || 0,
                        duration: p.duration || '',
                        category: p.category || '',
                        short_description: p.short_description || '',
                        description: p.description || '',
                        itinerary: p.itinerary || [],
                        inclusions: p.inclusions || [],
                        exclusions: p.exclusions || [],
                        important_info: p.important_info || [],
                        image_url: p.image_url || '',
                        gallery_images: p.gallery_images || [],
                        is_published: p.is_published !== false
                    };
                    if (destUUID) pkgPayload.destination_id = destUUID;

                    var pChk = await sbClient.from('packages').select('id').eq('title', p.title).maybeSingle();
                    if (pChk.data && pChk.data.id) {
                        await sbClient.from('packages').update(pkgPayload).eq('id', pChk.data.id);
                        report.updated++;
                    } else {
                        await sbClient.from('packages').insert([pkgPayload]);
                        report.inserted++;
                    }
                    log('Package synced: ' + p.title);
                } catch (err) {
                    report.errors.push('Package (' + p.title + '): ' + err.message);
                }
            }

            // 3. Seed Blog Posts
            var blogs = this.get('blogs');
            for (var k = 0; k < blogs.length; k++) {
                var b = blogs[k];
                try {
                    var blogPayload = {
                        title: b.title,
                        slug: b.slug || b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                        excerpt: b.excerpt || '',
                        content: b.content || '',
                        image_url: b.image_url || '',
                        is_published: b.is_published !== false
                    };
                    var bChk = await sbClient.from('blog_posts').select('id').eq('title', b.title).maybeSingle();
                    if (bChk.data && bChk.data.id) {
                        await sbClient.from('blog_posts').update(blogPayload).eq('id', bChk.data.id);
                        report.updated++;
                    } else {
                        await sbClient.from('blog_posts').insert([blogPayload]);
                        report.inserted++;
                    }
                    log('Article synced: ' + b.title);
                } catch (err) {
                    report.errors.push('Blog (' + b.title + '): ' + err.message);
                }
            }

            // 4. Seed Testimonials
            var tests = this.get('testimonials');
            for (var m = 0; m < tests.length; m++) {
                var t = tests[m];
                try {
                    var testPayload = {
                        name: t.name,
                        location: t.location || '',
                        rating: Number(t.rating) || 5,
                        message: t.message || '',
                        image_url: t.image_url || ''
                    };
                    var tChk = await sbClient.from('testimonials').select('id').eq('name', t.name).maybeSingle();
                    if (tChk.data && tChk.data.id) {
                        await sbClient.from('testimonials').update(testPayload).eq('id', tChk.data.id);
                        report.updated++;
                    } else {
                        await sbClient.from('testimonials').insert([testPayload]);
                        report.inserted++;
                    }
                    log('Testimonial synced: ' + t.name);
                } catch (err) {
                    report.errors.push('Testimonial (' + t.name + '): ' + err.message);
                }
            }

            // 5. Seed FAQs
            var faqs = this.get('faqs');
            for (var n = 0; n < faqs.length; n++) {
                var f = faqs[n];
                try {
                    var faqPayload = {
                        question: f.question,
                        answer: f.answer,
                        is_published: f.is_published !== false
                    };
                    var fChk = await sbClient.from('faqs').select('id').eq('question', f.question).maybeSingle();
                    if (fChk.data && fChk.data.id) {
                        await sbClient.from('faqs').update(faqPayload).eq('id', fChk.data.id);
                        report.updated++;
                    } else {
                        await sbClient.from('faqs').insert([faqPayload]);
                        report.inserted++;
                    }
                    log('FAQ synced: ' + f.question.substring(0, 30) + '...');
                } catch (err) {
                    report.errors.push('FAQ: ' + err.message);
                }
            }

            return report;
        }
    };

})(typeof window !== 'undefined' ? window : global);
