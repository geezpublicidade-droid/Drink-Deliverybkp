import express, { type Request, Response, NextFunction } from "express";
import { storage, seedDatabase } from "../server/storage";
import bcrypt from "bcrypt";
import multer from "multer";
import { uploadFile, deleteFile } from "../server/supabase";

const app = express();

// Initialize database seed on cold start
let isSeeded = false;
async function ensureSeeded() {
  if (!isSeeded) {
    await seedDatabase();
    isSeeded = true;
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware to ensure database is seeded
app.use(async (_req, _res, next) => {
  await ensureSeeded();
  next();
});

// SSE endpoint - Not supported in serverless environment
app.get("/api/orders/sse", (_req, res) => {
  res.status(501).json({
    error: "SSE not supported",
    message: "Server-Sent Events (SSE) nao sao suportados em ambiente serverless. Use polling para atualizacoes em tempo real.",
    suggestion: "Configure um intervalo de polling de 5-10 segundos para verificar atualizacoes de pedidos."
  });
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const uploadCSV = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

const SALT_ROUNDS = 10;

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['dispatched', 'cancelled'],
  dispatched: ['arrived', 'delivered', 'cancelled'],
  arrived: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

const COUNTER_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['preparing', 'delivered', 'cancelled'],
  preparing: ['ready', 'delivered', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

function isValidStatusTransition(currentStatus: string, newStatus: string, orderType?: string): boolean {
  const transitions = orderType === 'counter' ? COUNTER_ORDER_TRANSITIONS : VALID_STATUS_TRANSITIONS;
  const allowed = transitions[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
}

// Users
app.get("/api/users", async (_req, res) => {
  const users = await storage.getUsers();
  res.json(users);
});

app.get("/api/users/:id", async (req, res) => {
  const user = await storage.getUser(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.post("/api/users", async (req, res) => {
  const userData = { ...req.body };
  if (userData.password) {
    userData.password = await bcrypt.hash(userData.password, SALT_ROUNDS);
  }
  const user = await storage.createUser(userData);
  res.status(201).json(user);
});

app.patch("/api/users/:id", async (req, res) => {
  const userData = { ...req.body };
  if (userData.password) {
    userData.password = await bcrypt.hash(userData.password, SALT_ROUNDS);
  }
  const user = await storage.updateUser(req.params.id, userData);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.delete("/api/users/:id", async (req, res) => {
  const user = await storage.getUser(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  await storage.deleteUser(req.params.id);
  res.status(204).send();
});

// Auth
app.post("/api/auth/login", async (req, res) => {
  const { username, password, role } = req.body;
  const users = await storage.getUsers();
  
  let candidates;
  if (role) {
    candidates = users.filter(u => 
      u.name.toLowerCase() === username.toLowerCase() && u.role === role
    );
  } else {
    candidates = users.filter(u => 
      u.name.toLowerCase() === username.toLowerCase() && 
      (u.role === 'admin' || u.role === 'kitchen' || u.role === 'motoboy' || u.role === 'pdv')
    );
  }
  
  let user = null;
  for (const candidate of candidates) {
    if (!candidate.password) continue;
    const isValid = await bcrypt.compare(password, candidate.password);
    if (isValid) {
      user = candidate;
      break;
    }
  }
  
  if (!user) {
    return res.status(401).json({ success: false, error: "Invalid credentials" });
  }
  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser, role: user.role });
});

app.post("/api/auth/whatsapp", async (req, res) => {
  const { whatsapp, name } = req.body;
  let user = await storage.getUserByWhatsapp(whatsapp);
  if (!user) {
    user = await storage.createUser({ 
      name, whatsapp, role: "customer", password: null, isBlocked: false
    });
  }
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

app.post("/api/auth/check-phone", async (req, res) => {
  const { whatsapp } = req.body;
  const motoboy = await storage.getMotoboyByWhatsapp(whatsapp);
  if (motoboy) {
    res.json({ exists: true, userName: motoboy.name, isMotoboy: true });
    return;
  }
  const user = await storage.getUserByWhatsapp(whatsapp);
  if (user) {
    res.json({ exists: true, userName: user.name, isMotoboy: false });
  } else {
    res.json({ exists: false, isMotoboy: false });
  }
});

app.post("/api/auth/customer-login", async (req, res) => {
  const { whatsapp, password } = req.body;
  
  if (!password || !/^\d{6}$/.test(password)) {
    return res.status(400).json({ success: false, error: "Senha deve ter exatamente 6 digitos" });
  }
  
  const motoboy = await storage.getMotoboyByWhatsapp(whatsapp);
  if (motoboy) {
    return res.status(403).json({ success: false, error: "Motoboys devem usar o login de funcionarios", isMotoboy: true });
  }
  
  const user = await storage.getUserByWhatsapp(whatsapp);
  if (!user) return res.status(401).json({ success: false, error: "Usuario nao encontrado" });
  if (user.isBlocked) return res.status(403).json({ success: false, error: "Usuario bloqueado" });
  if (!user.password) return res.status(401).json({ success: false, error: "Senha nao cadastrada" });
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).json({ success: false, error: "Senha incorreta" });
  
  const addresses = await storage.getAddresses(user.id);
  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
  
  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser, address: defaultAddress || null });
});

app.post("/api/auth/motoboy-login", async (req, res) => {
  const { whatsapp, password } = req.body;
  
  if (!password || !/^\d{6}$/.test(password)) {
    return res.status(400).json({ success: false, error: "Senha deve ter exatamente 6 digitos" });
  }
  
  const motoboy = await storage.getMotoboyByWhatsapp(whatsapp);
  if (!motoboy) return res.status(401).json({ success: false, error: "Motoboy nao encontrado" });
  if (!motoboy.isActive) return res.status(403).json({ success: false, error: "Motoboy desativado" });
  
  const user = await storage.getUserByWhatsapp(whatsapp);
  if (!user) return res.status(401).json({ success: false, error: "Usuario do motoboy nao encontrado" });
  if (!user.password) return res.status(401).json({ success: false, error: "Senha nao cadastrada pelo administrador" });
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).json({ success: false, error: "Senha incorreta" });
  
  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: { ...safeUser, role: 'motoboy' }, role: 'motoboy', motoboy });
});

app.post("/api/auth/register", async (req, res) => {
  const { user: userData, address: addressData } = req.body;
  
  if (!userData.password || !/^\d{6}$/.test(userData.password)) {
    return res.status(400).json({ error: "Senha deve ter exatamente 6 digitos" });
  }
  
  const motoboy = await storage.getMotoboyByWhatsapp(userData.whatsapp);
  if (motoboy) return res.status(400).json({ error: "Este numero pertence a um motoboy. Use o login de funcionarios." });
  
  const existingUser = await storage.getUserByWhatsapp(userData.whatsapp);
  if (existingUser) return res.status(400).json({ error: "Usuario ja cadastrado com este WhatsApp" });
  
  const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
  
  const user = await storage.createUser({
    name: userData.name,
    whatsapp: userData.whatsapp,
    role: "customer",
    password: hashedPassword,
    isBlocked: false
  });
  
  const address = await storage.createAddress({
    userId: user.id,
    street: addressData.street,
    number: addressData.number,
    complement: addressData.complement || null,
    neighborhood: addressData.neighborhood,
    city: addressData.city,
    state: addressData.state,
    zipCode: addressData.zipCode,
    notes: addressData.notes || null,
    isDefault: true
  });
  
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, address });
});

// Addresses
app.get("/api/addresses/:userId", async (req, res) => {
  const addresses = await storage.getAddresses(req.params.userId);
  res.json(addresses);
});

app.post("/api/addresses", async (req, res) => {
  const address = await storage.createAddress(req.body);
  res.status(201).json(address);
});

app.patch("/api/addresses/:id", async (req, res) => {
  const existingAddress = await storage.getAddress(req.params.id);
  if (!existingAddress) return res.status(404).json({ error: "Address not found" });
  
  if (req.body.isDefault === true && existingAddress.userId) {
    const userAddresses = await storage.getAddresses(existingAddress.userId);
    for (const addr of userAddresses) {
      if (addr.id !== req.params.id && addr.isDefault) {
        await storage.updateAddress(addr.id, { isDefault: false });
      }
    }
  }
  
  const address = await storage.updateAddress(req.params.id, req.body);
  if (!address) return res.status(404).json({ error: "Address not found" });
  res.json(address);
});

app.delete("/api/addresses/:id", async (req, res) => {
  const deleted = await storage.deleteAddress(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Address not found" });
  res.status(204).send();
});

// Categories
app.get("/api/categories", async (_req, res) => {
  const categories = await storage.getCategories();
  res.json(categories);
});

app.get("/api/categories/:id", async (req, res) => {
  const category = await storage.getCategory(req.params.id);
  if (!category) return res.status(404).json({ error: "Category not found" });
  res.json(category);
});

app.post("/api/categories", async (req, res) => {
  const category = await storage.createCategory(req.body);
  res.status(201).json(category);
});

app.patch("/api/categories/:id", async (req, res) => {
  const category = await storage.updateCategory(req.params.id, req.body);
  if (!category) return res.status(404).json({ error: "Category not found" });
  res.json(category);
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    const products = await storage.getProductsByCategory(req.params.id);
    if (products.length > 0) {
      return res.status(400).json({ error: `Nao e possivel excluir categoria com ${products.length} produto(s) vinculado(s).` });
    }
    const deleted = await storage.deleteCategory(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Category not found" });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === '23503') return res.status(400).json({ error: "Categoria possui produtos vinculados" });
    res.status(500).json({ error: "Erro ao excluir categoria" });
  }
});

app.patch("/api/categories/reorder", async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "items array required" });
  }
  
  try {
    for (const item of items) {
      if (item.id && typeof item.sortOrder === 'number') {
        await storage.updateCategory(item.id, { sortOrder: item.sortOrder });
      }
    }
    const categories = await storage.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to reorder categories" });
  }
});

// Products
app.get("/api/products", async (_req, res) => {
  const products = await storage.getProducts();
  res.json(products);
});

app.get("/api/products/all", async (_req, res) => {
  const products = await storage.getAllProducts();
  res.json(products);
});

app.get("/api/products/trending", async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const trendingProducts = await storage.getTrendingProducts(limit);
  res.json(trendingProducts);
});

app.get("/api/products/category/:categoryId", async (req, res) => {
  const products = await storage.getProductsByCategory(req.params.categoryId);
  res.json(products);
});

app.get("/api/products/:id", async (req, res) => {
  const product = await storage.getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

app.post("/api/products", async (req, res) => {
  const product = await storage.createProduct(req.body);
  res.status(201).json(product);
});

app.patch("/api/products/:id", async (req, res) => {
  const product = await storage.updateProduct(req.params.id, req.body);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

app.delete("/api/products/:id", async (req, res) => {
  const deleted = await storage.deleteProduct(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Product not found" });
  res.status(204).send();
});

app.put("/api/products/:id/image", async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });
  try {
    const product = await storage.updateProduct(req.params.id, { imageUrl });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/products/reorder", async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: "items array required" });
  
  try {
    for (const item of items) {
      if (item.id && typeof item.sortOrder === 'number') {
        await storage.updateProduct(item.id, { sortOrder: item.sortOrder });
      }
    }
    const products = await storage.getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to reorder products" });
  }
});

// Import products from CSV
app.post("/api/products/import-csv", uploadCSV.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ error: "CSV vazio ou sem dados" });
    }

    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const produtoIdx = header.findIndex(h => h === 'produto' || h === 'nome' || h === 'name');
    const categoriaIdx = header.findIndex(h => h === 'categoria' || h === 'category');
    const precoCompraIdx = header.findIndex(h => h === 'precocompra' || h === 'costprice' || h === 'custo');
    const precoVendaIdx = header.findIndex(h => h === 'precovenda' || h === 'saleprice' || h === 'preco');
    const estoqueIdx = header.findIndex(h => h === 'quantidadeestoque' || h === 'estoque' || h === 'stock');

    if (produtoIdx === -1) {
      return res.status(400).json({ error: "Coluna 'Produto' nao encontrada no CSV" });
    }

    const existingCategories = await storage.getCategories();
    const categoryMap = new Map(existingCategories.map(c => [c.name.toLowerCase(), c.id]));

    let imported = 0;
    let errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const productName = values[produtoIdx];
      if (!productName) {
        errors.push(`Linha ${i + 1}: Nome do produto vazio`);
        continue;
      }

      let categoryId: string | null = null;
      if (categoriaIdx !== -1 && values[categoriaIdx]) {
        const categoryName = values[categoriaIdx];
        const existingCategoryId = categoryMap.get(categoryName.toLowerCase());
        
        if (existingCategoryId) {
          categoryId = existingCategoryId;
        } else {
          const newCategory = await storage.createCategory({
            name: categoryName,
            iconUrl: null,
            isActive: true,
          });
          categoryMap.set(categoryName.toLowerCase(), newCategory.id);
          categoryId = newCategory.id;
        }
      }

      const costPrice = precoCompraIdx !== -1 ? parseFloat(values[precoCompraIdx]) || 0 : 0;
      const salePrice = precoVendaIdx !== -1 ? parseFloat(values[precoVendaIdx]) || 0 : 0;
      const stock = estoqueIdx !== -1 ? parseInt(values[estoqueIdx]) || 0 : 0;
      const profitMargin = costPrice > 0 ? ((salePrice - costPrice) / costPrice) * 100 : 0;

      try {
        const productData: any = {
          name: productName,
          description: null,
          costPrice: costPrice.toString(),
          salePrice: salePrice.toString(),
          profitMargin: profitMargin.toFixed(2),
          stock,
          imageUrl: null,
          productType: null,
          isActive: true,
        };
        if (categoryId) {
          productData.categoryId = categoryId;
        }
        await storage.createProduct(productData);
        imported++;
      } catch (err) {
        errors.push(`Linha ${i + 1}: Erro ao criar produto "${productName}"`);
      }
    }

    res.json({ 
      success: true, 
      imported, 
      errors: errors.length > 0 ? errors : undefined,
      message: `${imported} produtos importados com sucesso${errors.length > 0 ? `, ${errors.length} erros` : ''}`
    });
  } catch (error: any) {
    console.error("Error importing CSV:", error);
    res.status(500).json({ error: "Erro ao processar CSV: " + error.message });
  }
});

// Orders
app.get("/api/orders", async (_req, res) => {
  const orders = await storage.getOrders();
  res.json(orders);
});

app.get("/api/order-items", async (req, res) => {
  const orderIdsParam = req.query.orderIds;
  if (orderIdsParam) {
    const orderIds = typeof orderIdsParam === 'string' 
      ? orderIdsParam.split(',').map(id => id.trim()).filter(id => id)
      : Array.isArray(orderIdsParam) ? (orderIdsParam as string[]).map(id => id.trim()).filter(id => id) : [];
    if (orderIds.length === 0) return res.json([]);
    const items = await storage.getOrderItemsByOrderIds(orderIds);
    return res.json(items);
  }
  return res.json([]);
});

app.get("/api/orders/user/:userId", async (req, res) => {
  const orders = await storage.getOrdersByUser(req.params.userId);
  res.json(orders);
});

app.get("/api/orders/status/:status", async (req, res) => {
  const orders = await storage.getOrdersByStatus(req.params.status);
  res.json(orders);
});

app.get("/api/orders/:id", async (req, res) => {
  const order = await storage.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

app.get("/api/orders/:id/items", async (req, res) => {
  const items = await storage.getOrderItems(req.params.id);
  res.json(items);
});

app.post("/api/orders", async (req, res) => {
  try {
    const order = await storage.createOrder(req.body);
    
    if (req.body.items && Array.isArray(req.body.items)) {
      for (const item of req.body.items) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        });
        
        const product = await storage.getProduct(item.productId);
        if (product) {
          const previousStock = product.stock;
          const newStock = Math.max(0, previousStock - item.quantity);
          await storage.updateProduct(item.productId, { stock: newStock });
          await storage.createStockLog({
            productId: item.productId,
            previousStock,
            newStock,
            change: -item.quantity,
            reason: `Pedido #${order.id.slice(0, 8)}`,
          });
        }
      }
    }
    
    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.patch("/api/orders/:id", async (req, res) => {
  const existingOrder = await storage.getOrder(req.params.id);
  if (!existingOrder) return res.status(404).json({ error: "Order not found" });
  
  if (req.body.status && req.body.status !== existingOrder.status) {
    if (!isValidStatusTransition(existingOrder.status, req.body.status, existingOrder.orderType)) {
      return res.status(400).json({ error: `Transicao de status invalida: ${existingOrder.status} -> ${req.body.status}` });
    }
  }
  
  const order = await storage.updateOrder(req.params.id, req.body);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

app.patch("/api/orders/:id/status", async (req, res) => {
  const { status } = req.body;
  const order = await storage.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const transitions = order.orderType === 'counter' ? COUNTER_ORDER_TRANSITIONS : VALID_STATUS_TRANSITIONS;
  if (!isValidStatusTransition(order.status, status, order.orderType)) {
    return res.status(400).json({ 
      error: `Transicao invalida: ${order.status} -> ${status}`,
      currentStatus: order.status,
      allowedTransitions: transitions[order.status] || []
    });
  }

  const updates: any = { status };
  const now = new Date();

  switch (status) {
    case "accepted": updates.acceptedAt = now; break;
    case "preparing": updates.preparingAt = now; break;
    case "ready": updates.readyAt = now; break;
    case "dispatched": updates.dispatchedAt = now; break;
    case "arrived": updates.arrivedAt = now; break;
    case "delivered": updates.deliveredAt = now; break;
  }

  const updated = await storage.updateOrder(req.params.id, updates);
  res.json(updated);
});

app.patch("/api/orders/:id/assign", async (req, res) => {
  const { motoboyId } = req.body;
  const order = await storage.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (order.status !== 'ready') {
    return res.status(400).json({ 
      error: `Pedido deve estar com status 'pronto' para atribuir motoboy. Status atual: ${order.status}` 
    });
  }

  const updated = await storage.updateOrder(req.params.id, { 
    motoboyId, 
    status: "dispatched",
    dispatchedAt: new Date()
  });
  res.json(updated);
});

app.delete("/api/orders/:id", async (req, res) => {
  const order = await storage.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  await storage.deleteOrder(req.params.id);
  res.status(204).send();
});

app.patch("/api/orders/:id/delivery-fee", async (req, res) => {
  try {
    const { deliveryFee } = req.body;
    if (deliveryFee === undefined || isNaN(parseFloat(deliveryFee))) {
      return res.status(400).json({ error: "Taxa de entrega invalida" });
    }

    const order = await storage.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: "Pedido nao encontrado" });

    const originalFee = order.originalDeliveryFee || order.deliveryFee;
    const newFee = parseFloat(deliveryFee).toFixed(2);
    const newTotal = (parseFloat(order.subtotal) - parseFloat(order.discount || "0") + parseFloat(newFee)).toFixed(2);

    const updatedOrder = await storage.updateOrder(req.params.id, {
      deliveryFee: newFee,
      originalDeliveryFee: originalFee,
      deliveryFeeAdjusted: true,
      deliveryFeeAdjustedAt: new Date(),
      total: newTotal,
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar taxa de entrega" });
  }
});

// Motoboy
app.get("/api/motoboys", async (_req, res) => {
  const motoboys = await storage.getMotoboys();
  res.json(motoboys);
});

app.get("/api/motoboys/:id", async (req, res) => {
  const motoboy = await storage.getMotoboy(req.params.id);
  if (!motoboy) return res.status(404).json({ error: "Motoboy not found" });
  res.json(motoboy);
});

app.get("/api/motoboys/:id/details", async (req, res) => {
  const motoboy = await storage.getMotoboy(req.params.id);
  if (!motoboy) return res.status(404).json({ error: "Motoboy not found" });
  
  const user = await storage.getUserByWhatsapp(motoboy.whatsapp);
  const hasPassword = user?.password ? true : false;
  
  res.json({
    ...motoboy,
    hasPassword,
    userId: user?.id || null,
  });
});

app.get("/api/motoboys/:id/orders", async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;
  
  const motoboy = await storage.getMotoboy(id);
  if (!motoboy) return res.status(404).json({ error: "Motoboy not found" });
  
  const start = startDate && typeof startDate === 'string' ? new Date(startDate) : undefined;
  const end = endDate && typeof endDate === 'string' ? new Date(endDate) : undefined;
  
  const orders = await storage.getOrdersByMotoboy(id, start, end);
  res.json(orders);
});

app.post("/api/motoboys", async (req, res) => {
  const { name, whatsapp, photoUrl, isActive, password } = req.body;
  
  if (password && !/^\d{6}$/.test(password)) {
    return res.status(400).json({ error: "Senha deve ter exatamente 6 digitos numericos" });
  }
  
  const existingMotoboy = await storage.getMotoboyByWhatsapp(whatsapp);
  if (existingMotoboy) {
    return res.status(400).json({ error: "Ja existe um motoboy com este WhatsApp" });
  }
  
  const motoboy = await storage.createMotoboy({ name, whatsapp, photoUrl, isActive });
  
  let user = await storage.getUserByWhatsapp(whatsapp);
  if (!user) {
    const hashedPassword = password ? await bcrypt.hash(password, SALT_ROUNDS) : null;
    user = await storage.createUser({
      name,
      whatsapp,
      role: "motoboy",
      password: hashedPassword,
    });
  } else if (password) {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await storage.updateUser(user.id, { 
      password: hashedPassword,
      role: "motoboy",
      name,
    });
  }
  
  res.status(201).json(motoboy);
});

app.patch("/api/motoboys/:id", async (req, res) => {
  const { name, whatsapp, photoUrl, isActive, password } = req.body;
  
  if (password && !/^\d{6}$/.test(password)) {
    return res.status(400).json({ error: "Senha deve ter exatamente 6 digitos numericos" });
  }
  
  const existingMotoboy = await storage.getMotoboy(req.params.id);
  if (!existingMotoboy) return res.status(404).json({ error: "Motoboy not found" });
  
  if (whatsapp && whatsapp !== existingMotoboy.whatsapp) {
    const motoboyWithWhatsapp = await storage.getMotoboyByWhatsapp(whatsapp);
    if (motoboyWithWhatsapp && motoboyWithWhatsapp.id !== req.params.id) {
      return res.status(400).json({ error: "Ja existe outro motoboy com este WhatsApp" });
    }
  }
  
  const motoboyData: any = {};
  if (name !== undefined) motoboyData.name = name;
  if (whatsapp !== undefined) motoboyData.whatsapp = whatsapp;
  if (photoUrl !== undefined) motoboyData.photoUrl = photoUrl;
  if (isActive !== undefined) motoboyData.isActive = isActive;
  
  const motoboy = await storage.updateMotoboy(req.params.id, motoboyData);
  
  const oldUser = await storage.getUserByWhatsapp(existingMotoboy.whatsapp);
  if (oldUser) {
    const userUpdates: any = {};
    if (name !== undefined) userUpdates.name = name;
    if (whatsapp !== undefined) userUpdates.whatsapp = whatsapp;
    if (password) {
      userUpdates.password = await bcrypt.hash(password, SALT_ROUNDS);
    }
    if (Object.keys(userUpdates).length > 0) {
      await storage.updateUser(oldUser.id, userUpdates);
    }
  } else if (password || whatsapp) {
    const hashedPassword = password ? await bcrypt.hash(password, SALT_ROUNDS) : null;
    await storage.createUser({
      name: name || existingMotoboy.name,
      whatsapp: whatsapp || existingMotoboy.whatsapp,
      role: "motoboy",
      password: hashedPassword,
    });
  }
  
  res.json(motoboy);
});

app.delete("/api/motoboys/:id", async (req, res) => {
  const motoboy = await storage.getMotoboy(req.params.id);
  if (!motoboy) return res.status(404).json({ error: "Motoboy not found" });
  
  const deleted = await storage.deleteMotoboy(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Motoboy not found" });
  
  const user = await storage.getUserByWhatsapp(motoboy.whatsapp);
  if (user && user.role === 'motoboy') {
    await storage.updateUser(user.id, { role: 'customer' });
  }
  
  res.status(204).send();
});

app.get("/api/motoboy/:motoboyId/orders", async (req, res) => {
  const { motoboyId } = req.params;
  const motoboy = await storage.getMotoboy(motoboyId);
  if (!motoboy) return res.status(404).json({ error: "Motoboy not found" });
  
  const allOrders = await storage.getOrders();
  const motoboyOrders = allOrders.filter(order => 
    order.motoboyId === motoboyId && (order.status === 'dispatched' || order.status === 'arrived')
  );
  
  res.json(motoboyOrders);
});

app.get("/api/motoboy/:motoboyId/report", async (req, res) => {
  const { motoboyId } = req.params;
  const { startDate, endDate } = req.query;
  
  const motoboy = await storage.getMotoboy(motoboyId);
  if (!motoboy) return res.status(404).json({ error: "Motoboy not found" });
  
  const start = startDate ? new Date(startDate as string) : undefined;
  const end = endDate ? new Date(endDate as string) : undefined;
  
  const orders = await storage.getOrdersByMotoboy(motoboyId, start, end);
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  
  const totalDeliveries = deliveredOrders.length;
  const totalDeliveryFees = deliveredOrders.reduce((sum, o) => sum + parseFloat(o.deliveryFee), 0);
  
  res.json({ motoboy, totalDeliveries, totalDeliveryFees, orders: deliveredOrders });
});

// Banners
app.get("/api/banners", async (_req, res) => {
  const banners = await storage.getBanners();
  res.json(banners);
});

app.get("/api/banners/:id", async (req, res) => {
  const banner = await storage.getBanner(req.params.id);
  if (!banner) return res.status(404).json({ error: "Banner not found" });
  res.json(banner);
});

app.post("/api/banners", async (req, res) => {
  const banner = await storage.createBanner(req.body);
  res.status(201).json(banner);
});

app.patch("/api/banners/:id", async (req, res) => {
  const banner = await storage.updateBanner(req.params.id, req.body);
  if (!banner) return res.status(404).json({ error: "Banner not found" });
  res.json(banner);
});

app.delete("/api/banners/:id", async (req, res) => {
  const deleted = await storage.deleteBanner(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Banner not found" });
  res.status(204).send();
});

// Settings
app.get("/api/settings", async (_req, res) => {
  const settings = await storage.getSettings();
  res.json(settings || {});
});

app.patch("/api/settings", async (req, res) => {
  const settings = await storage.updateSettings(req.body);
  res.json(settings);
});

// Stock Reports
app.get("/api/stock/report", async (_req, res) => {
  try {
    const allProducts = await storage.getAllProducts();
    const categories = await storage.getCategories();
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    
    const productDetails = allProducts.map(product => {
      const costPrice = parseFloat(product.costPrice);
      const salePrice = parseFloat(product.salePrice);
      const profitMargin = parseFloat(product.profitMargin);
      const stock = product.stock;
      
      return {
        id: product.id,
        name: product.name,
        categoryId: product.categoryId,
        categoryName: categoryMap.get(product.categoryId) || 'Sem categoria',
        stock,
        costPrice,
        salePrice,
        profitMargin,
        profitPerUnit: salePrice - costPrice,
        totalCostValue: costPrice * stock,
        totalSaleValue: salePrice * stock,
        totalPotentialProfit: (salePrice - costPrice) * stock,
        isActive: product.isActive,
      };
    });
    
    const summary = {
      totalProducts: allProducts.length,
      activeProducts: allProducts.filter(p => p.isActive).length,
      totalUnitsInStock: productDetails.reduce((sum, p) => sum + p.stock, 0),
      totalCostValue: productDetails.reduce((sum, p) => sum + p.totalCostValue, 0),
      totalSaleValue: productDetails.reduce((sum, p) => sum + p.totalSaleValue, 0),
      totalPotentialProfit: productDetails.reduce((sum, p) => sum + p.totalPotentialProfit, 0),
      lowStockCount: productDetails.filter(p => p.stock < 10 && p.isActive).length,
      outOfStockCount: productDetails.filter(p => p.stock === 0 && p.isActive).length,
    };
    
    res.json({ summary, products: productDetails });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate stock report" });
  }
});

app.get("/api/stock/low-stock", async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 10;
    const allProducts = await storage.getAllProducts();
    const categories = await storage.getCategories();
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    
    const lowStockProducts = allProducts
      .filter(p => p.isActive && p.stock < threshold)
      .map(product => ({
        id: product.id,
        name: product.name,
        categoryId: product.categoryId,
        categoryName: categoryMap.get(product.categoryId) || 'Sem categoria',
        currentStock: product.stock,
        suggestedPurchase: Math.max(10 - product.stock, 5),
        costPrice: parseFloat(product.costPrice),
        estimatedPurchaseCost: parseFloat(product.costPrice) * Math.max(10 - product.stock, 5),
      }))
      .sort((a, b) => a.currentStock - b.currentStock);
    
    res.json({
      summary: {
        totalLowStockItems: lowStockProducts.length,
        totalEstimatedPurchaseCost: lowStockProducts.reduce((sum, p) => sum + p.estimatedPurchaseCost, 0),
        threshold,
      },
      products: lowStockProducts,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get low stock suggestions" });
  }
});

// Delivery Zones
app.get("/api/delivery-zones", async (_req, res) => {
  const zones = await storage.getDeliveryZones();
  res.json(zones);
});

app.get("/api/delivery-zones/:id", async (req, res) => {
  const zone = await storage.getDeliveryZone(req.params.id);
  if (!zone) return res.status(404).json({ error: "Zone not found" });
  res.json(zone);
});

app.post("/api/delivery-zones", async (req, res) => {
  try {
    const zone = await storage.createDeliveryZone(req.body);
    res.status(201).json(zone);
  } catch (error: any) {
    if (error.code === '23505') return res.status(400).json({ error: "Codigo de zona ja existe" });
    res.status(500).json({ error: "Erro ao criar zona" });
  }
});

app.patch("/api/delivery-zones/:id", async (req, res) => {
  try {
    const zone = await storage.updateDeliveryZone(req.params.id, req.body);
    if (!zone) return res.status(404).json({ error: "Zone not found" });
    res.json(zone);
  } catch (error: any) {
    if (error.code === '23505') return res.status(400).json({ error: "Codigo de zona ja existe" });
    res.status(500).json({ error: "Erro ao atualizar zona" });
  }
});

app.delete("/api/delivery-zones/:id", async (req, res) => {
  try {
    const neighborhoods = await storage.getNeighborhoodsByZone(req.params.id);
    if (neighborhoods.length > 0) {
      return res.status(400).json({ error: `Nao e possivel excluir zona com ${neighborhoods.length} bairro(s) vinculado(s).` });
    }
    const deleted = await storage.deleteDeliveryZone(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Zone not found" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir zona" });
  }
});

// Neighborhoods
app.get("/api/neighborhoods", async (_req, res) => {
  const neighborhoods = await storage.getNeighborhoods();
  res.json(neighborhoods);
});

app.get("/api/neighborhoods/zone/:zoneId", async (req, res) => {
  const neighborhoods = await storage.getNeighborhoodsByZone(req.params.zoneId);
  res.json(neighborhoods);
});

app.get("/api/neighborhoods/:id", async (req, res) => {
  const neighborhood = await storage.getNeighborhood(req.params.id);
  if (!neighborhood) return res.status(404).json({ error: "Neighborhood not found" });
  res.json(neighborhood);
});

app.post("/api/neighborhoods", async (req, res) => {
  try {
    const zone = await storage.getDeliveryZone(req.body.zoneId);
    if (!zone) return res.status(400).json({ error: "Zona nao encontrada" });
    const neighborhood = await storage.createNeighborhood(req.body);
    res.status(201).json(neighborhood);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar bairro" });
  }
});

app.patch("/api/neighborhoods/:id", async (req, res) => {
  try {
    if (req.body.zoneId) {
      const zone = await storage.getDeliveryZone(req.body.zoneId);
      if (!zone) return res.status(400).json({ error: "Zona nao encontrada" });
    }
    const neighborhood = await storage.updateNeighborhood(req.params.id, req.body);
    if (!neighborhood) return res.status(404).json({ error: "Neighborhood not found" });
    res.json(neighborhood);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar bairro" });
  }
});

app.delete("/api/neighborhoods/:id", async (req, res) => {
  try {
    const deleted = await storage.deleteNeighborhood(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Neighborhood not found" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir bairro" });
  }
});

// Storage upload
app.post("/api/storage/upload", upload.single('file'), async (req, res) => {
  const userId = req.headers['x-user-id'] as string | undefined;
  const { folder = 'products' } = req.body;
  
  if (!userId) return res.status(401).json({ error: "Unauthorized: User ID required" });
  
  const user = await storage.getUser(userId);
  if (!user) return res.status(401).json({ error: "Unauthorized: User not found" });
  if (user.role !== 'admin' && user.role !== 'pdv') return res.status(403).json({ error: "Forbidden: Admin access required" });
  
  if (!req.file) return res.status(400).json({ error: "No file provided" });
  
  try {
    const result = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, folder);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to upload file" });
  }
});

app.delete("/api/storage/delete", async (req, res) => {
  const userId = req.headers['x-user-id'] as string | undefined;
  const { path } = req.body;
  
  if (!userId) return res.status(401).json({ error: "Unauthorized: User ID required" });
  
  const user = await storage.getUser(userId);
  if (!user || (user.role !== 'admin' && user.role !== 'pdv')) return res.status(403).json({ error: "Forbidden: Admin access required" });
  
  if (!path) return res.status(400).json({ error: "Path is required" });
  
  try {
    await deleteFile(path);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export default app;
