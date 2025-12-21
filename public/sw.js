// ========================================
// GAMATAURI PWA SERVICE WORKER v4.0
// Auto-update system with aggressive cache busting
// HTML always Network First - never cache stale app
// ========================================

const CACHE_VERSION = 'v4.0.0';
const CACHE_NAME = `gamatauri-${CACHE_VERSION}`;
const API_CACHE = `gamatauri-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `gamatauri-images-${CACHE_VERSION}`;
// Assets críticos para cache
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// URLs da API (usam estratégia Network First)
const API_URLS = [
  'https://lsxukelagellagzvjyuy.supabase.co',
];

// ========================================
// INSTALAÇÃO - Cachear assets e limpar tudo antigo
// ========================================
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    // Limpar TODOS os caches antigos primeiro
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('gamatauri-')) {
            console.log('[SW] Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Depois cachear assets novos
      return caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Cacheando assets críticos');
        return cache.addAll(STATIC_CACHE_URLS);
      });
    }).catch((err) => {
      console.error('[SW] Erro ao cachear:', err);
    })
  );
  
  // Ativar imediatamente sem esperar
  self.skipWaiting();
});

// ========================================
// ATIVAÇÃO - Garantir limpeza completa
// ========================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Limpar qualquer cache que não seja da versão atual
          if (cacheName.startsWith('gamatauri-') && 
              cacheName !== CACHE_NAME && 
              cacheName !== API_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('[SW] Deletando cache obsoleto:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Notificar todos os clientes sobre a atualização
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        });
      });
    })
  );
  
  // Assumir controle de todas as páginas imediatamente
  self.clients.claim();
});

// ========================================
// FETCH - Estratégias de Cache
// ========================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar extensões do Chrome e requests não-HTTP
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }
  
  // ===============================
  // ESTRATÉGIA 0: HTML/Navegação - SEMPRE Network First
  // CRÍTICO: HTML velho = app inteiro velho
  // ===============================
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cachear HTML atualizado para fallback offline
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline: servir do cache
          return caches.match(request).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }
  
  // ===============================
  // ESTRATÉGIA 1: API - Network First
  // ===============================
  if (API_URLS.some(apiUrl => request.url.includes(apiUrl))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) {
              console.log('[SW] API offline - servindo do cache:', request.url);
              return cached;
            }
            return caches.match('/index.html');
          });
        })
    );
    return;
  }
  
  // ===============================
  // ESTRATÉGIA 2: Imagens - Cache First
  // ===============================
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cached) => {
          if (cached) {
            return cached;
          }
          
          return fetch(request).then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#ccc"/></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          });
        });
      })
    );
    return;
  }
  
  // ===============================
  // ESTRATÉGIA 3: JS/CSS - Network First para garantir atualizações
  // ===============================
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }
  
  // ===============================
  // ESTRATÉGIA 4: Outros Assets - Cache First
  // ===============================
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      
      return fetch(request).then((response) => {
        if (request.method === 'GET' && response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ========================================
// BACKGROUND SYNC
// ========================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync disparado:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders());
  }
});

async function syncPendingOrders() {
  console.log('[SW] Sincronizando pedidos pendentes...');
}

// ========================================
// MENSAGENS - Comunicação com o cliente
// ========================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Recebido SKIP_WAITING, ativando nova versão');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('gamatauri-')) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  }
});

// ========================================
// PUSH NOTIFICATIONS
// ========================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event.data?.text());
  
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'Gamatauri Delivery';
  const options = {
    body: data.body || 'Você tem uma atualização!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: {
      url: data.url || '/',
      orderId: data.orderId,
      cartItems: data.cartItems
    },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' }
    ],
    vibrate: [200, 100, 200],
    tag: data.tag || 'notification',
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ========================================
// NOTIFICATION CLICK
// ========================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event.action);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data.url || '/';
  const cartItems = event.notification.data.cartItems;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if (cartItems) {
            client.postMessage({
              type: 'RESTORE_CART',
              cart: cartItems
            });
          }
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        let finalUrl = urlToOpen;
        if (cartItems) {
          finalUrl += `?restoreCart=true`;
        }
        return clients.openWindow(finalUrl);
      }
    })
  );
});

console.log('[SW] Service Worker carregado - v' + CACHE_VERSION);
