import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDatabase } from './config/db.js';
import User from './models/User.js';
import Item from './models/Item.js';
import PromoCode from './models/PromoCode.js';

dotenv.config();

const seedItems = [
  // Marquee
  { name: 'Grand Wedding Marquee', description: 'Spacious white marquee tent with elegant draping, perfect for weddings and large celebrations. Includes side panels and flooring.', category: 'marquee', images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800'], rentalPrice: 350, stockQuantity: 8, dimensions: '60ft x 30ft x 14ft', material: 'PVC coated polyester, aluminum frame', averageRating: 4.9, reviewsCount: 34 },
  { name: 'Classic Party Marquee', description: 'Versatile marquee suitable for birthday parties, corporate events, and outdoor gatherings.', category: 'marquee', images: ['https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800'], rentalPrice: 200, stockQuantity: 12, dimensions: '40ft x 20ft x 12ft', material: 'Heavy-duty polyester, steel poles', averageRating: 4.6, reviewsCount: 48 },
  { name: 'Transparent Marquee', description: 'See-through marquee with clear roof panels for starlit evenings and daytime events with natural light.', category: 'marquee', images: ['https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800'], rentalPrice: 450, stockQuantity: 5, dimensions: '50ft x 25ft x 15ft', material: 'Clear PVC panels, aluminum frame', averageRating: 4.8, reviewsCount: 18 },
  { name: 'Garden Marquee', description: 'Compact marquee ideal for intimate garden parties and small ceremonies. Easy setup.', category: 'marquee', images: ['https://images.unsplash.com/photo-1478146059778-acee2962581c?w=800'], rentalPrice: 120, stockQuantity: 15, dimensions: '20ft x 15ft x 10ft', material: 'Waterproof canvas, galvanized steel', averageRating: 4.4, reviewsCount: 27 },
  // Canopy
  { name: 'Premium Event Canopy', description: 'Elegant peaked canopy with scalloped edges, ideal for receptions and formal outdoor events.', category: 'canopy', images: ['https://images.unsplash.com/photo-1510076857177-7470076d4098?w=800'], rentalPrice: 120, stockQuantity: 20, dimensions: '20ft x 20ft x 12ft', material: 'Flame-retardant polyester, powder-coated steel', averageRating: 4.7, reviewsCount: 41 },
  { name: 'Pop-Up Canopy', description: 'Quick-setup 10x10 pop-up canopy perfect for registration areas, food stalls, and vendor booths.', category: 'canopy', images: ['https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800'], rentalPrice: 40, stockQuantity: 30, dimensions: '10ft x 10ft x 8ft', material: 'Steel frame, UV-resistant polyester', averageRating: 4.2, reviewsCount: 62 },
  { name: 'Stretch Tent Canopy', description: 'Modern freeform stretch canopy that creates stunning organic shapes. Weatherproof and versatile.', category: 'canopy', images: ['https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800'], rentalPrice: 280, stockQuantity: 6, dimensions: '35ft x 25ft', material: 'Bedouin stretch fabric, wooden poles', averageRating: 4.8, reviewsCount: 22 },
  // Stage Setup
  { name: 'Modular Stage Platform', description: 'Professional modular stage with adjustable height legs. Includes safety railings and skirting.', category: 'stage-setup', images: ['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'], rentalPrice: 300, stockQuantity: 10, dimensions: '16ft x 12ft x 4ft', material: 'Industrial plywood, aluminum legs', averageRating: 4.7, reviewsCount: 29 },
  { name: 'Concert Stage Setup', description: 'Full concert stage with truss system, backdrop frame, and heavy-duty decking for performances.', category: 'stage-setup', images: ['https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'], rentalPrice: 800, stockQuantity: 3, dimensions: '24ft x 16ft x 5ft', material: 'Steel truss, marine plywood deck', averageRating: 4.9, reviewsCount: 12 },
  { name: 'Wedding Stage Package', description: 'Elegant wedding stage with draped backdrop, skirting, and carpet. Customizable colors available.', category: 'stage-setup', images: ['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800'], rentalPrice: 500, stockQuantity: 5, dimensions: '12ft x 10ft x 3ft', material: 'Plywood deck, chiffon draping', averageRating: 4.8, reviewsCount: 36 },
  { name: 'Portable PA System', description: 'Wireless PA speaker system with 2 microphones and Bluetooth connectivity. Perfect for speeches and music.', category: 'stage-setup', images: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800'], rentalPrice: 90, stockQuantity: 15, dimensions: '12in x 12in x 22in', material: 'MDF cabinet, polypropylene cone', averageRating: 4.3, reviewsCount: 45 },
  // Floral Design
  { name: 'Floral Arch Arrangement', description: 'Breathtaking floral arch with roses, hydrangeas, and greenery. Perfect for wedding ceremonies and photo backdrops.', category: 'floral-design', images: ['https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800'], rentalPrice: 180, stockQuantity: 8, dimensions: '8ft x 7ft arch span', material: 'Fresh premium flowers, metal arch frame', averageRating: 4.9, reviewsCount: 52 },
  { name: 'Table Centerpiece Collection', description: 'Set of 10 elegant floral centerpieces in varying heights with candle accents. Suits formal dining.', category: 'floral-design', images: ['https://images.unsplash.com/photo-1561128290-006dc4827214?w=800'], rentalPrice: 65, stockQuantity: 20, dimensions: '12in x 12in x 18in each', material: 'Silk flowers, crystal vases, LED candles', averageRating: 4.6, reviewsCount: 38 },
  { name: 'Hanging Floral Installation', description: 'Suspended floral chandelier with cascading blooms and greenery. Creates a magical ceiling focal point.', category: 'floral-design', images: ['https://images.unsplash.com/photo-1522413452208-996ff3f3e740?w=800'], rentalPrice: 250, stockQuantity: 6, dimensions: '4ft diameter x 3ft drop', material: 'Mixed fresh flowers, wire frame', averageRating: 4.8, reviewsCount: 19 },
  { name: 'Aisle Floral Runners', description: 'Lush floral runner arrangements for ceremony aisles. Set of 12 matching pieces with greenery garlands.', category: 'floral-design', images: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=800'], rentalPrice: 100, stockQuantity: 10, dimensions: '15in x 8in x 10in each', material: 'Mixed flowers, eucalyptus, rattan bases', averageRating: 4.5, reviewsCount: 24 },
  // Lighting
  { name: 'String Light Canopy', description: 'Warm white Edison bulb string lights with 100ft coverage. Creates magical ambient lighting for any venue.', category: 'lighting', images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800'], rentalPrice: 60, stockQuantity: 20, dimensions: '100ft total length', material: 'Copper wire, glass Edison bulbs', averageRating: 4.9, reviewsCount: 65 },
  { name: 'LED Uplighting Set', description: 'Set of 10 wireless LED uplights with 16 color options and remote control. Transform any space.', category: 'lighting', images: ['https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=800'], rentalPrice: 80, stockQuantity: 15, dimensions: '6in x 6in x 8in each', material: 'ABS plastic housing, RGB LEDs', averageRating: 4.6, reviewsCount: 33 },
  { name: 'Crystal Chandelier', description: 'Stunning K9 crystal chandelier for marquee or indoor use. Battery powered with dimming capability.', category: 'lighting', images: ['https://images.unsplash.com/photo-1543489822-c49534f3271f?w=800'], rentalPrice: 120, stockQuantity: 8, dimensions: '24in diameter x 30in height', material: 'K9 crystal, chrome frame', averageRating: 4.8, reviewsCount: 15 },
  { name: 'Fairy Light Curtain Wall', description: 'Cascading fairy light curtain creating a twinkling backdrop. Dimmable warm white 10ft x 8ft coverage.', category: 'lighting', images: ['https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800'], rentalPrice: 55, stockQuantity: 18, dimensions: '10ft x 8ft', material: 'Copper wire, micro LED bulbs', averageRating: 4.7, reviewsCount: 42 },
  // Catering
  { name: 'Full-Service Buffet Package', description: 'Complete buffet catering for up to 150 guests. Includes chafing dishes, serving utensils, table linens, and professional staff. Menu customization available.', category: 'catering', images: ['https://images.unsplash.com/photo-1555244162-803834f70033?w=800'], rentalPrice: 500, stockQuantity: 10, dimensions: 'Up to 150 guests', material: 'Stainless steel chafing dishes, linen tablecloths', averageRating: 4.9, reviewsCount: 58 },
  { name: 'BBQ & Grill Station', description: 'Outdoor BBQ and grill station with industrial gas grills, prep tables, and all utensils. Ideal for garden parties and corporate cookouts.', category: 'catering', images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800'], rentalPrice: 250, stockQuantity: 8, dimensions: '8ft x 4ft station', material: 'Stainless steel grills, hardwood charcoal', averageRating: 4.7, reviewsCount: 34 },
  { name: 'Dessert & Pastry Display', description: 'Elegant multi-tier dessert display with glass cloches, cake stands, and serving platters. Perfect for weddings and upscale events.', category: 'catering', images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80'], rentalPrice: 150, stockQuantity: 12, dimensions: '6ft x 3ft display', material: 'Crystal glass stands, marble platters', averageRating: 4.8, reviewsCount: 27 },
  { name: 'Beverage Station & Bar Setup', description: 'Complete mobile bar with cocktail equipment, glassware for 100 guests, ice bins, and garnish trays. Bartender-ready.', category: 'catering', images: ['https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800'], rentalPrice: 200, stockQuantity: 10, dimensions: '8ft bar counter', material: 'Mahogany bar top, stainless steel accessories', averageRating: 4.6, reviewsCount: 41 }
];

const seedPromos = [
  { code: 'WELCOME10', discountPercent: 10, active: true },
  { code: 'SUMMER20', discountPercent: 20, active: true },
  { code: 'VIP15', discountPercent: 15, active: true },
  { code: 'FLASH25', discountPercent: 25, active: false }
];

const run = async () => {
  await connectDatabase();

  // Clear existing data
  await Promise.all([User.deleteMany({}), Item.deleteMany({}), PromoCode.deleteMany({})]);

  // Create admin user
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@eventgoods.com',
    phone: '+1-800-555-0100',
    passwordHash: adminHash,
    role: 'admin'
  });

  // Create demo customer
  const customerHash = await bcrypt.hash('customer123', 10);
  await User.create({
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+1-555-123-4567',
    passwordHash: customerHash,
    role: 'customer',
    totalSpending: 0
  });

  // Create items
  await Item.insertMany(seedItems);

  // Create promo codes
  await PromoCode.insertMany(seedPromos);

  // eslint-disable-next-line no-console
  console.log('✓ Database seeded successfully!');
  console.log('  Admin login  → admin@eventgoods.com / admin123');
  console.log('  Customer login → jane@example.com / customer123');
  console.log(`  Items: ${seedItems.length}`);
  console.log(`  Promo codes: ${seedPromos.length} (active: WELCOME10, SUMMER20, VIP15)`);

  process.exit(0);
};

run().catch((error) => {
  console.error('Seed error:', error);
  process.exit(1);
});
