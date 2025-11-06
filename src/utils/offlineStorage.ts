// ========================================
// OFFLINE STORAGE - IndexedDB para pedidos pendentes
// ========================================

const DB_NAME = 'GamatauriDB';
const DB_VERSION = 1;
const ORDERS_STORE = 'pendingOrders';

export interface PendingOrder {
  id: string;
  data: any;
  timestamp: number;
}

// Abrir/criar banco IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(ORDERS_STORE)) {
        const store = db.createObjectStore(ORDERS_STORE, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Salvar pedido pendente
export async function savePendingOrder(orderData: any): Promise<string> {
  const db = await openDB();
  const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const order: PendingOrder = {
    id: orderId,
    data: orderData,
    timestamp: Date.now()
  };
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ORDERS_STORE, 'readwrite');
    const store = tx.objectStore(ORDERS_STORE);
    const request = store.add(order);
    
    request.onsuccess = () => resolve(orderId);
    request.onerror = () => reject(request.error);
  });
}

// Buscar todos os pedidos pendentes
export async function getPendingOrders(): Promise<PendingOrder[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ORDERS_STORE, 'readonly');
    const store = tx.objectStore(ORDERS_STORE);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Remover pedido pendente
export async function removePendingOrder(orderId: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ORDERS_STORE, 'readwrite');
    const store = tx.objectStore(ORDERS_STORE);
    const request = store.delete(orderId);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Limpar todos os pedidos pendentes
export async function clearPendingOrders(): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ORDERS_STORE, 'readwrite');
    const store = tx.objectStore(ORDERS_STORE);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
