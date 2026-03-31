export interface CategoryProduct {
    id?: number;
    name: string;
    type?: number;
    createdAt?: string | null;
    price: number;
    priceDp?: number;
    priceMember?: number;
    prodpv?: number;
    originalPrice?: number;
    image: string;
    images?: string[];
    description?: string;
    specifications?: string;
    sku?: string;
    stock?: number;
    variants?: Array<{
        id?: number;
        sku?: string;
        name?: string;
        color?: string;
        colorHex?: string;
        size?: string;
        width?: number;
        dimension?: number;
        height?: number;
        priceSrp?: number;
        priceDp?: number;
        priceMember?: number;
        prodpv?: number;
        qty?: number;
        status?: number;
        images?: string[];
    }>;
    badge?: string;
    brand?: string;
    verified?: boolean;
    musthave?: boolean;
    bestseller?: boolean;
    salespromo?: boolean;
    weight?: number;
    psweight?: number;
    pswidth?: number;
    pslenght?: number;
    psheight?: number;
    material?: string;
    assemblyRequired?: boolean;
    warranty?: string;
}

export const categoryProducts: Record<string, CategoryProduct[]> = {
    'chairs-stools': [
        { name: 'Nordic Accent Chair', price: 4500, originalPrice: 5500, image: '/Images/product_images/chairs_and_stools/1766103679_modena_dining_chair.jpg', badge: 'SALE', brand: 'AfroniaHome' },
        { name: 'Bar Stool Set (2pcs)', price: 2800, image: '/Images/product_images/chairs_and_stools/alpaca_seat_living_room.png', badge: 'NEW', brand: 'MediaIndia' },
        { name: 'Velvet Dining Chair', price: 3200, originalPrice: 4000, image: '/Images/product_images/chairs_and_stools/creative_design_polar_Bear.jpg', badge: 'SALE', brand: 'AfroniaHome' },
        { name: 'Ergonomic Office Chair', price: 7500, image: '/Images/product_images/chairs_and_stools/good_design_swan_footstool_soft_ottoman.png', brand: 'Bonnevie' },
        { name: 'Rattan Accent Stool', price: 1800, image: '/Images/product_images/chairs_and_stools/horse_ottooman_stool_with_sofa.png', brand: 'MEDFORM' },
        { name: 'Stackable Counter Stool', price: 2200, originalPrice: 2800, image: '/Images/product_images/chairs_and_stools/modern_leisure_chinese_lion_chairs_stool_ottoman.jpg', badge: '20% OFF', brand: 'MediaIndia' },
        { name: 'Pony Chair Ottoman', price: 3900, image: '/Images/product_images/chairs_and_stools/new_cute_pony_shaped_children_chair_pony_sofa_chair.png', badge: 'NEW', brand: 'AfroniaHome' },
        { name: 'Panda Footstool Classic', price: 2300, image: '/Images/product_images/chairs_and_stools/panda_footstool.jpg', brand: 'Bonnevie' },
        { name: 'Panda Footstool Ottoman', price: 2400, image: '/Images/product_images/chairs_and_stools/panda_footstool_ottoman.png', brand: 'MEDFORM' },
        { name: 'Sheep Stool Accent', price: 2600, image: '/Images/product_images/chairs_and_stools/sheep_stool.jpg', badge: 'NEW', brand: 'MediaIndia' },
    ],
    'dining-table': [
        { name: 'Solid Oak Dining Table', price: 18500, image: '/Images/HeroSection/Dinning_table.jpg', badge: 'NEW', brand: 'AfroniaHome' },
        { name: 'Glass Top Dining Set', price: 12000, originalPrice: 15000, image: '/Images/HeroSection/Dinning_table.jpg', badge: 'SALE', brand: 'Bonnevie' },
        { name: 'Extendable Dining Table', price: 21000, image: '/Images/HeroSection/Dinning_table.jpg', brand: 'AfroniaHome' },
        { name: 'Round Marble Dining Table', price: 25000, image: '/Images/HeroSection/Dinning_table.jpg', badge: 'PREMIUM', brand: 'MEDFORM' },
        { name: 'Rustic Wooden Table', price: 9500, originalPrice: 12000, image: '/Images/HeroSection/Dinning_table.jpg', badge: 'SALE', brand: 'MediaIndia' },
        { name: '6-Seater Dining Set', price: 32000, image: '/Images/HeroSection/Dinning_table.jpg', brand: 'AfroniaHome' },
    ],
    'sofas': [
        { name: 'GAYNOUR L-Shape Fabric Sofa', price: 13700, image: '/Images/product_images/sofas/1748399347_sofa.jpg', badge: 'NEW', brand: 'AfroniaHome' },
        { name: 'SARAH Corner L-Shape Sofa', price: 8547, originalPrice: 11000, image: '/Images/product_images/sofas/1750073173_astrid.png', badge: 'SALE', brand: 'Bonnevie' },
        { name: '3-Seater Velvet Sofa', price: 15000, image: '/Images/product_images/sofas/1755574295_harvey5.jpg', brand: 'MediaIndia' },
        { name: 'Modern Recliner Sofa', price: 22000, originalPrice: 28000, image: '/Images/product_images/sofas/1755574306_harvey6.jpg', badge: 'SALE', brand: 'AfroniaHome' },
        { name: 'Compact Loveseat Sofa', price: 7800, image: '/Images/product_images/sofas/1755574318_harvey7.jpg', badge: 'NEW', brand: 'MEDFORM' },
        { name: 'Sectional Modular Sofa', price: 35000, image: '/Images/product_images/sofas/1755670414_stella_fabric_sofa_2.jpg', brand: 'AfroniaHome' },
        { name: 'Orla Fabric Sofa Bed', price: 16800, image: '/Images/product_images/sofas/1756178131_orla_fabric_sofa_bed.jpg', badge: 'NEW', brand: 'Bonnevie' },
        { name: 'Migumi Bench Sofa', price: 9200, image: '/Images/product_images/sofas/1756262841_migumi_bench_sofa.jpg', brand: 'MediaIndia' },
        { name: 'Sven Fabric Bench Sofa', price: 9900, image: '/Images/product_images/sofas/1756272013_sven_fabric_bench6.jpg', brand: 'MEDFORM' },
    ],
    'tv-rack': [
        { name: 'Floating TV Cabinet', price: 6500, image: '/Images/product_images/tv_rack/1753926285_blythe_tv_rack.jpg', badge: 'NEW', brand: 'MediaIndia' },
        { name: 'Industrial TV Stand', price: 4800, originalPrice: 6000, image: '/Images/product_images/tv_rack/1753926371_blythe_tv_rack_-_open_2_.jpg', badge: 'SALE', brand: 'Bonnevie' },
        { name: 'Minimalist TV Unit', price: 8200, image: '/Images/product_images/tv_rack/1754987393_teemo_tv_rack00.jpg', brand: 'AfroniaHome' },
        { name: 'Entertainment Center', price: 12500, image: '/Images/product_images/tv_rack/1755053200_anivia_tv_rack0.jpg', brand: 'MEDFORM' },
        { name: 'Corner TV Rack', price: 5500, originalPrice: 7000, image: '/Images/product_images/tv_rack/1755061914_aron_tv_rack.jpg', badge: '20% OFF', brand: 'MediaIndia' },
        { name: 'Chest TV Console', price: 9800, image: '/Images/product_images/tv_rack/1757031412_lauri_tv_rack3.png', badge: 'NEW', brand: 'AfroniaHome' },
        { name: 'Reece TV Rack', price: 10400, image: '/Images/product_images/tv_rack/1759105474_reece_tv_rack.jpg', brand: 'Bonnevie' },
        { name: 'Reece TV Rack Open View', price: 10900, image: '/Images/product_images/tv_rack/1759105516_reece_tv_rack4.jpg', badge: 'NEW', brand: 'AfroniaHome' },
        { name: 'Boston TV Rack', price: 11200, image: '/Images/product_images/tv_rack/1764653803_boston_tv_rack.jpg', brand: 'MediaIndia' },
        { name: 'Maverick TV Rack', price: 11800, image: '/Images/product_images/tv_rack/1764658789_maverick_tv_rack.jpg', brand: 'MEDFORM' },
        { name: 'Shauna TV Rack', price: 12100, image: '/Images/product_images/tv_rack/1764661572_shauna_tv_rack.jpg', brand: 'AfroniaHome' },
        { name: 'Rei TV Console Rack', price: 12900, image: '/Images/product_images/tv_rack/1769387683_rei_tv_console_rack_-_closed2_cover_.jpg', badge: 'NEW', brand: 'Bonnevie' },
    ],
};

export const categoryMeta: Record<string, { label: string; image: string }> = {
    'chairs-stools': { label: 'Chairs & Stools', image: '/Images/HeroSection/chairs_stools.jpg' },
    'dining-table': { label: 'Dining Table', image: '/Images/HeroSection/Dinning_table.jpg' },
    'sofas': { label: 'Sofas', image: '/Images/HeroSection/sofas.jpg' },
    'tv-rack': { label: 'TV Rack', image: '/Images/HeroSection/tv_racks.jpg' },
};

export const CATEGORY_BRANDS = ['AfroniaHome', 'MediaIndia', 'Bonnevie', 'MEDFORM'];

export const PRICE_MAX = 50000;

export function getProductBySlug(slug: string): { product: CategoryProduct; category: string } | null {
    for (const [categorySlug, products] of Object.entries(categoryProducts)) {
        const product = products.find(p => p.name.toLowerCase().replace(/\s+/g, '-') === slug);
        if (product) return { product, category: categorySlug };
    }
    return null;
}
