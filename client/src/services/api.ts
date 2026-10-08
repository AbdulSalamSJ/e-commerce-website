import axios from 'axios';

export interface User {
  id: string;
  email: string;
  role: 'superadmin' | 'admin' | 'customer';
  shopId?: string | null;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  theme?: 'cyber-neon' | 'luxury-gold' | 'sunset-flare' | string;
  category?: string | null;
  status?: 'active' | 'suspended' | string;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description?: string | null;
  price: string | number;
  weight?: string; // new field, e.g., 'Below 250g'
  stock?: number; // optional for legacy code
  imageUrl?: string | null;
  category?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name?: string;
  quantity: number;
  price: string | number;
}

export interface Order {
  id: string;
  shopId: string;
  customerId: string;
  customerEmail?: string;
  items: OrderItem[];
  totalAmount: string | number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  createdAt: string;
}

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (payload: { email: string; password: string; name?: string }) => {
    const res = await api.post('/auth/register', payload);
    return res.data;
  },
};

// Super-Admin Services
export const superAdminService = {
  getOverview: async () => {
    const res = await api.get('/superadmin/overview');
    return res.data?.metrics || res.data;
  },
  getShops: async () => {
    const res = await api.get('/superadmin/shops');
    return res.data?.shops || res.data;
  },
  createShop: async (data: { name: string; slug: string; description?: string; theme?: string; category?: string }) => {
    const res = await api.post('/superadmin/shops', data);
    return res.data?.shop || res.data;
  },
  updateShop: async (id: string, data: Partial<Shop>) => {
    const res = await api.put(`/superadmin/shops/${id}`, data);
    return res.data?.shop || res.data;
  },
  deleteShop: async (id: string) => {
    const res = await api.delete(`/superadmin/shops/${id}`);
    return res.data;
  },
  getAdmins: async () => {
    const res = await api.get('/superadmin/admins');
    return res.data?.admins || res.data;
  },
  createAdmin: async (data: { email: string; password: string; shopId: string }) => {
    const res = await api.post('/superadmin/admins', data);
    return res.data?.admin || res.data;
  },
  deleteAdmin: async (id: string) => {
    const res = await api.delete(`/superadmin/admins/${id}`);
    return res.data;
  },
};

// Admin Services
export const adminService = {
  getShopProfile: async () => {
    const res = await api.get('/admin/shop');
    return res.data?.shop || res.data;
  },
  updateShopProfile: async (data: Partial<Shop>) => {
    const res = await api.put('/admin/shop', data);
    return res.data?.shop || res.data;
  },
  getProducts: async () => {
    const res = await api.get('/admin/products');
    return res.data?.products || res.data;
  },
  createProduct: async (data: Partial<Product>) => {
    const res = await api.post('/admin/products', data);
    return res.data?.product || res.data;
  },
  updateProduct: async (id: string, data: Partial<Product>) => {
    const res = await api.put(`/admin/products/${id}`, data);
    return res.data?.product || res.data;
  },
  deleteProduct: async (id: string) => {
    const res = await api.delete(`/admin/products/${id}`);
    return res.data;
  },
  getOrders: async () => {
    const res = await api.get('/admin/orders');
    return res.data?.orders || res.data;
  },
  updateOrderStatus: async (id: string, status: Order['status']) => {
    const res = await api.put(`/admin/orders/${id}/status`, { status });
    return res.data?.order || res.data;
  },
};

// Customer & Public Catalog Services
export const customerService = {
  getShops: async () => {
    const res = await api.get('/shops');
    return res.data?.shops || res.data;
  },
  getShopBySlug: async (slug: string) => {
    const res = await api.get(`/shops/${slug}`);
    return res.data?.shop || res.data;
  },
  getProducts: async (params?: { shopId?: string; category?: string; search?: string }) => {
    const res = await api.get('/products', { params });
    return res.data?.products || res.data;
  },
  getProductById: async (id: string) => {
    const res = await api.get(`/products/${id}`);
    return res.data?.product || res.data;
  },
  createOrder: async (data: { shopId: string; items: OrderItem[]; shippingAddress: string }) => {
    const res = await api.post('/orders', data);
    return res.data?.order || res.data;
  },
  getMyOrders: async () => {
    const res = await api.get('/orders');
    return res.data?.orders || res.data;
  },
};

export default api;
