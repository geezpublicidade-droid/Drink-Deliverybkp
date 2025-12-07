import { randomUUID } from "crypto";
import type { 
  User, InsertUser, 
  Address, InsertAddress,
  Category, InsertCategory,
  Product, InsertProduct,
  Order, InsertOrder,
  OrderItem, InsertOrderItem,
  Banner, InsertBanner,
  Motoboy, InsertMotoboy,
  StockLog, InsertStockLog,
  Settings, InsertSettings
} from "@shared/schema";

export interface IStorage {
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByWhatsapp(whatsapp: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;

  getAddresses(userId: string): Promise<Address[]>;
  getAddress(id: string): Promise<Address | undefined>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: string, address: Partial<InsertAddress>): Promise<Address | undefined>;
  deleteAddress(id: string): Promise<boolean>;

  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<Order>): Promise<Order | undefined>;

  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  getBanners(): Promise<Banner[]>;
  getBanner(id: string): Promise<Banner | undefined>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: string, banner: Partial<InsertBanner>): Promise<Banner | undefined>;
  deleteBanner(id: string): Promise<boolean>;

  getMotoboys(): Promise<Motoboy[]>;
  getMotoboy(id: string): Promise<Motoboy | undefined>;
  createMotoboy(motoboy: InsertMotoboy): Promise<Motoboy>;
  updateMotoboy(id: string, motoboy: Partial<InsertMotoboy>): Promise<Motoboy | undefined>;
  deleteMotoboy(id: string): Promise<boolean>;

  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;

  createStockLog(log: InsertStockLog): Promise<StockLog>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private addresses: Map<string, Address>;
  private categories: Map<string, Category>;
  private products: Map<string, Product>;
  private orders: Map<string, Order>;
  private orderItems: Map<string, OrderItem>;
  private banners: Map<string, Banner>;
  private motoboys: Map<string, Motoboy>;
  private stockLogs: Map<string, StockLog>;
  private settings: Settings | undefined;

  constructor() {
    this.users = new Map();
    this.addresses = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.banners = new Map();
    this.motoboys = new Map();
    this.stockLogs = new Map();

    this.seedData();
  }

  private seedData() {
    const adminId = randomUUID();
    this.users.set(adminId, {
      id: adminId,
      name: "Admin",
      whatsapp: "00000000000",
      role: "admin",
      password: "939393",
      isBlocked: false,
      createdAt: new Date(),
    });

    const kitchenId = randomUUID();
    this.users.set(kitchenId, {
      id: kitchenId,
      name: "Cozinha",
      whatsapp: "00000000001",
      role: "kitchen",
      password: "939393",
      isBlocked: false,
      createdAt: new Date(),
    });

    const pdvId = randomUUID();
    this.users.set(pdvId, {
      id: pdvId,
      name: "Balcao",
      whatsapp: "00000000002",
      role: "pdv",
      password: "939393",
      isBlocked: false,
      createdAt: new Date(),
    });

    const catDestiladosId = randomUUID();
    const catCervejasId = randomUUID();
    const catVinhosId = randomUUID();
    const catGelosId = randomUUID();
    const catEnergeticosId = randomUUID();
    const catMisturaId = randomUUID();
    const catPetiscosId = randomUUID();
    const catAguasId = randomUUID();
    
    this.categories.set(catDestiladosId, {
      id: catDestiladosId,
      name: "Destilados",
      iconUrl: "wine",
      sortOrder: 1,
      isActive: true,
      createdAt: new Date(),
    });
    this.categories.set(catCervejasId, {
      id: catCervejasId,
      name: "Cervejas",
      iconUrl: "beer",
      sortOrder: 2,
      isActive: true,
      createdAt: new Date(),
    });
    this.categories.set(catVinhosId, {
      id: catVinhosId,
      name: "Vinhos",
      iconUrl: "grape",
      sortOrder: 3,
      isActive: true,
      createdAt: new Date(),
    });
    this.categories.set(catGelosId, {
      id: catGelosId,
      name: "Gelos",
      iconUrl: "snowflake",
      sortOrder: 4,
      isActive: true,
      createdAt: new Date(),
    });
    this.categories.set(catEnergeticosId, {
      id: catEnergeticosId,
      name: "Energeticos",
      iconUrl: "zap",
      sortOrder: 5,
      isActive: true,
      createdAt: new Date(),
    });
    this.categories.set(catMisturaId, {
      id: catMisturaId,
      name: "Misturas",
      iconUrl: "glass-water",
      sortOrder: 6,
      isActive: true,
      createdAt: new Date(),
    });
    this.categories.set(catPetiscosId, {
      id: catPetiscosId,
      name: "Petiscos",
      iconUrl: "utensils",
      sortOrder: 7,
      isActive: true,
      createdAt: new Date(),
    });
    this.categories.set(catAguasId, {
      id: catAguasId,
      name: "Aguas e Sucos",
      iconUrl: "droplets",
      sortOrder: 8,
      isActive: true,
      createdAt: new Date(),
    });

    const products = [
      { categoryId: catDestiladosId, name: "Vodka Absolut 1L", description: "Vodka premium sueca, sabor puro e cristalino", costPrice: "45.00", profitMargin: "50.00", salePrice: "89.90", stock: 20, productType: "destilado" },
      { categoryId: catDestiladosId, name: "Whisky Jack Daniels 1L", description: "Whisky americano Tennessee, envelhecido em barris de carvalho", costPrice: "85.00", profitMargin: "45.00", salePrice: "159.90", stock: 15, productType: "destilado" },
      { categoryId: catDestiladosId, name: "Gin Tanqueray 750ml", description: "Gin britanico premium com notas citricas", costPrice: "55.00", profitMargin: "50.00", salePrice: "109.90", stock: 18, productType: "destilado" },
      { categoryId: catDestiladosId, name: "Tequila Jose Cuervo 750ml", description: "Tequila mexicana gold, perfeita para drinks", costPrice: "48.00", profitMargin: "55.00", salePrice: "99.90", stock: 12, productType: "destilado" },
      { categoryId: catDestiladosId, name: "Rum Bacardi Carta Branca 1L", description: "Rum caribenho leve e suave", costPrice: "35.00", profitMargin: "50.00", salePrice: "69.90", stock: 25, productType: "destilado" },
      { categoryId: catDestiladosId, name: "Cachaça 51 1L", description: "Cachaca tradicional brasileira", costPrice: "12.00", profitMargin: "80.00", salePrice: "29.90", stock: 40, productType: "destilado" },
      { categoryId: catDestiladosId, name: "Vodka Smirnoff 1L", description: "Vodka russa classica, tripla destilacao", costPrice: "28.00", profitMargin: "60.00", salePrice: "59.90", stock: 30, productType: "destilado" },
      { categoryId: catDestiladosId, name: "Whisky Red Label 1L", description: "Whisky escoces blend, sabor intenso", costPrice: "70.00", profitMargin: "45.00", salePrice: "129.90", stock: 20, productType: "destilado" },
      
      { categoryId: catCervejasId, name: "Heineken Long Neck 330ml", description: "Cerveja holandesa premium lager", costPrice: "3.50", profitMargin: "70.00", salePrice: "7.90", stock: 120, productType: null },
      { categoryId: catCervejasId, name: "Budweiser Long Neck 330ml", description: "Cerveja americana lager refrescante", costPrice: "3.00", profitMargin: "70.00", salePrice: "6.90", stock: 100, productType: null },
      { categoryId: catCervejasId, name: "Corona Extra 330ml", description: "Cerveja mexicana premium com toque citrico", costPrice: "4.00", profitMargin: "65.00", salePrice: "8.90", stock: 80, productType: null },
      { categoryId: catCervejasId, name: "Stella Artois 550ml", description: "Cerveja belga premium lager", costPrice: "5.00", profitMargin: "60.00", salePrice: "9.90", stock: 60, productType: null },
      { categoryId: catCervejasId, name: "Brahma Lata 350ml", description: "Cerveja brasileira tradicional", costPrice: "2.00", profitMargin: "80.00", salePrice: "4.90", stock: 200, productType: null },
      { categoryId: catCervejasId, name: "Skol Lata 350ml", description: "Cerveja brasileira leve e refrescante", costPrice: "2.00", profitMargin: "75.00", salePrice: "4.50", stock: 200, productType: null },
      
      { categoryId: catVinhosId, name: "Vinho Casillero del Diablo 750ml", description: "Vinho tinto chileno Cabernet Sauvignon", costPrice: "35.00", profitMargin: "50.00", salePrice: "69.90", stock: 20, productType: null },
      { categoryId: catVinhosId, name: "Vinho Miolo Seival 750ml", description: "Vinho brasileiro tannat de alta qualidade", costPrice: "40.00", profitMargin: "50.00", salePrice: "79.90", stock: 15, productType: null },
      { categoryId: catVinhosId, name: "Espumante Chandon 750ml", description: "Espumante argentino brut elegante", costPrice: "50.00", profitMargin: "55.00", salePrice: "99.90", stock: 12, productType: null },
      
      { categoryId: catGelosId, name: "Gelo Premium 2kg", description: "Gelo cristalino de alta qualidade, cubos perfeitos", costPrice: "3.00", profitMargin: "100.00", salePrice: "8.00", stock: 150, productType: "gelo" },
      { categoryId: catGelosId, name: "Gelo Triturado 2kg", description: "Gelo triturado ideal para caipirinhas e drinks", costPrice: "4.00", profitMargin: "90.00", salePrice: "10.00", stock: 100, productType: "gelo" },
      { categoryId: catGelosId, name: "Gelo Bola 1kg", description: "Gelo em formato de bola para whisky e drinks especiais", costPrice: "8.00", profitMargin: "80.00", salePrice: "18.00", stock: 50, productType: "gelo" },
      
      { categoryId: catEnergeticosId, name: "Red Bull 250ml", description: "Energetico classico com taurina e cafeina", costPrice: "5.00", profitMargin: "60.00", salePrice: "9.90", stock: 80, productType: "energetico" },
      { categoryId: catEnergeticosId, name: "Monster Energy 473ml", description: "Energetico potente sabor original", costPrice: "6.00", profitMargin: "55.00", salePrice: "11.90", stock: 60, productType: "energetico" },
      { categoryId: catEnergeticosId, name: "Red Bull Tropical 250ml", description: "Energetico sabor frutas tropicais", costPrice: "5.50", profitMargin: "55.00", salePrice: "10.90", stock: 50, productType: "energetico" },
      { categoryId: catEnergeticosId, name: "Monster Ultra 473ml", description: "Energetico zero acucar sabor citrus", costPrice: "6.50", profitMargin: "50.00", salePrice: "12.90", stock: 40, productType: "energetico" },
      
      { categoryId: catMisturaId, name: "Agua Tonica Schweppes 350ml", description: "Agua tonica original para gin tonica perfeito", costPrice: "2.50", profitMargin: "80.00", salePrice: "5.90", stock: 100, productType: null },
      { categoryId: catMisturaId, name: "Refrigerante Cola 350ml", description: "Refrigerante cola para drinks e consumo", costPrice: "2.00", profitMargin: "80.00", salePrice: "4.90", stock: 120, productType: null },
      { categoryId: catMisturaId, name: "Suco de Limao 500ml", description: "Suco natural de limao para caipirinhas", costPrice: "4.00", profitMargin: "70.00", salePrice: "8.90", stock: 40, productType: null },
      { categoryId: catMisturaId, name: "Agua de Coco 1L", description: "Agua de coco natural refrescante", costPrice: "5.00", profitMargin: "60.00", salePrice: "9.90", stock: 50, productType: null },
      
      { categoryId: catPetiscosId, name: "Amendoim Japonês 200g", description: "Amendoim crocante revestido", costPrice: "4.00", profitMargin: "75.00", salePrice: "8.90", stock: 60, productType: null },
      { categoryId: catPetiscosId, name: "Batata Chips 100g", description: "Batata chips crocante sabor original", costPrice: "3.00", profitMargin: "80.00", salePrice: "6.90", stock: 80, productType: null },
      { categoryId: catPetiscosId, name: "Salaminho 200g", description: "Salaminho fatiado para petisco", costPrice: "8.00", profitMargin: "60.00", salePrice: "15.90", stock: 30, productType: null },
      
      { categoryId: catAguasId, name: "Agua Mineral 500ml", description: "Agua mineral sem gas", costPrice: "1.00", profitMargin: "100.00", salePrice: "3.00", stock: 200, productType: null },
      { categoryId: catAguasId, name: "Agua com Gas 500ml", description: "Agua mineral com gas", costPrice: "1.50", profitMargin: "90.00", salePrice: "3.90", stock: 150, productType: null },
      { categoryId: catAguasId, name: "Suco Natural Laranja 300ml", description: "Suco de laranja natural gelado", costPrice: "4.00", profitMargin: "65.00", salePrice: "8.90", stock: 40, productType: null },
    ];

    products.forEach(prod => {
      const prodId = randomUUID();
      this.products.set(prodId, {
        id: prodId,
        categoryId: prod.categoryId,
        name: prod.name,
        description: prod.description,
        imageUrl: null,
        costPrice: prod.costPrice,
        profitMargin: prod.profitMargin,
        salePrice: prod.salePrice,
        stock: prod.stock,
        isActive: true,
        productType: prod.productType,
        createdAt: new Date(),
      });
    });

    this.settings = {
      id: randomUUID(),
      storeAddress: "Rua das Bebidas, 123 - Centro",
      storeLat: null,
      storeLng: null,
      deliveryRatePerKm: "1.25",
      minDeliveryFee: "5.00",
      maxDeliveryDistance: "15",
      pixKey: "vibedrinks@pix.com",
      openingHours: null,
      isOpen: true,
    };
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByWhatsapp(whatsapp: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.whatsapp === whatsapp);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id, 
      name: insertUser.name,
      whatsapp: insertUser.whatsapp,
      role: insertUser.role ?? "customer",
      password: insertUser.password ?? null,
      isBlocked: insertUser.isBlocked ?? false,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async getAddresses(userId: string): Promise<Address[]> {
    return Array.from(this.addresses.values()).filter(a => a.userId === userId);
  }

  async getAddress(id: string): Promise<Address | undefined> {
    return this.addresses.get(id);
  }

  async createAddress(insertAddress: InsertAddress): Promise<Address> {
    const id = randomUUID();
    const address: Address = { 
      id, 
      userId: insertAddress.userId,
      street: insertAddress.street,
      number: insertAddress.number,
      complement: insertAddress.complement ?? null,
      neighborhood: insertAddress.neighborhood,
      city: insertAddress.city,
      state: insertAddress.state,
      zipCode: insertAddress.zipCode,
      notes: insertAddress.notes ?? null,
      isDefault: insertAddress.isDefault ?? true 
    };
    this.addresses.set(id, address);
    return address;
  }

  async updateAddress(id: string, updates: Partial<InsertAddress>): Promise<Address | undefined> {
    const address = this.addresses.get(id);
    if (!address) return undefined;
    const updated = { ...address, ...updates };
    this.addresses.set(id, updated);
    return updated;
  }

  async deleteAddress(id: string): Promise<boolean> {
    return this.addresses.delete(id);
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values())
      .filter(c => c.isActive)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { 
      id, 
      name: insertCategory.name,
      iconUrl: insertCategory.iconUrl ?? null,
      sortOrder: insertCategory.sortOrder ?? 0,
      isActive: insertCategory.isActive ?? true,
      createdAt: new Date() 
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    const updated = { ...category, ...updates };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.isActive);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(p => p.categoryId === categoryId && p.isActive);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { 
      id, 
      categoryId: insertProduct.categoryId,
      name: insertProduct.name,
      description: insertProduct.description ?? null,
      imageUrl: insertProduct.imageUrl ?? null,
      costPrice: insertProduct.costPrice,
      profitMargin: insertProduct.profitMargin,
      salePrice: insertProduct.salePrice,
      stock: insertProduct.stock ?? 0,
      isActive: insertProduct.isActive ?? true,
      productType: insertProduct.productType ?? null,
      createdAt: new Date() 
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    const updated = { ...product, ...updates };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const product = this.products.get(id);
    if (product) {
      this.products.set(id, { ...product, isActive: false });
      return true;
    }
    return false;
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(o => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(o => o.status === status)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = { 
      id, 
      userId: insertOrder.userId,
      addressId: insertOrder.addressId ?? null,
      orderType: insertOrder.orderType ?? "delivery",
      status: insertOrder.status ?? "pending",
      subtotal: insertOrder.subtotal,
      deliveryFee: insertOrder.deliveryFee,
      deliveryDistance: insertOrder.deliveryDistance ?? null,
      discount: insertOrder.discount ?? "0",
      total: insertOrder.total,
      paymentMethod: insertOrder.paymentMethod,
      changeFor: insertOrder.changeFor ?? null,
      notes: insertOrder.notes ?? null,
      customerName: insertOrder.customerName ?? null,
      motoboyId: insertOrder.motoboyId ?? null,
      createdAt: new Date(),
      acceptedAt: null,
      preparingAt: null,
      readyAt: null,
      dispatchedAt: null,
      deliveredAt: null,
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const updated = { ...order, ...updates };
    this.orders.set(id, updated);
    return updated;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(i => i.orderId === orderId);
  }

  async createOrderItem(insertItem: InsertOrderItem): Promise<OrderItem> {
    const id = randomUUID();
    const item: OrderItem = { id, ...insertItem };
    this.orderItems.set(id, item);
    return item;
  }

  async getBanners(): Promise<Banner[]> {
    return Array.from(this.banners.values())
      .filter(b => b.isActive)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async getBanner(id: string): Promise<Banner | undefined> {
    return this.banners.get(id);
  }

  async createBanner(insertBanner: InsertBanner): Promise<Banner> {
    const id = randomUUID();
    const banner: Banner = { 
      id, 
      title: insertBanner.title,
      description: insertBanner.description ?? null,
      imageUrl: insertBanner.imageUrl,
      linkUrl: insertBanner.linkUrl ?? null,
      sortOrder: insertBanner.sortOrder ?? 0,
      isActive: insertBanner.isActive ?? true,
      createdAt: new Date() 
    };
    this.banners.set(id, banner);
    return banner;
  }

  async updateBanner(id: string, updates: Partial<InsertBanner>): Promise<Banner | undefined> {
    const banner = this.banners.get(id);
    if (!banner) return undefined;
    const updated = { ...banner, ...updates };
    this.banners.set(id, updated);
    return updated;
  }

  async deleteBanner(id: string): Promise<boolean> {
    return this.banners.delete(id);
  }

  async getMotoboys(): Promise<Motoboy[]> {
    return Array.from(this.motoboys.values());
  }

  async getMotoboy(id: string): Promise<Motoboy | undefined> {
    return this.motoboys.get(id);
  }

  async createMotoboy(insertMotoboy: InsertMotoboy): Promise<Motoboy> {
    const id = randomUUID();
    const motoboy: Motoboy = { 
      id, 
      name: insertMotoboy.name,
      whatsapp: insertMotoboy.whatsapp,
      photoUrl: insertMotoboy.photoUrl ?? null,
      isActive: insertMotoboy.isActive ?? true,
      createdAt: new Date() 
    };
    this.motoboys.set(id, motoboy);
    return motoboy;
  }

  async updateMotoboy(id: string, updates: Partial<InsertMotoboy>): Promise<Motoboy | undefined> {
    const motoboy = this.motoboys.get(id);
    if (!motoboy) return undefined;
    const updated = { ...motoboy, ...updates };
    this.motoboys.set(id, updated);
    return updated;
  }

  async deleteMotoboy(id: string): Promise<boolean> {
    return this.motoboys.delete(id);
  }

  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async updateSettings(updates: Partial<InsertSettings>): Promise<Settings> {
    if (!this.settings) {
      this.settings = {
        id: randomUUID(),
        storeAddress: null,
        storeLat: null,
        storeLng: null,
        deliveryRatePerKm: "1.25",
        minDeliveryFee: "5.00",
        maxDeliveryDistance: "15",
        pixKey: null,
        openingHours: null,
        isOpen: true,
        ...updates,
      };
    } else {
      this.settings = { ...this.settings, ...updates };
    }
    return this.settings;
  }

  async createStockLog(insertLog: InsertStockLog): Promise<StockLog> {
    const id = randomUUID();
    const log: StockLog = { id, ...insertLog, createdAt: new Date() };
    this.stockLogs.set(id, log);
    return log;
  }
}

export const storage = new MemStorage();
