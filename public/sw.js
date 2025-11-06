// ========================================
// GAMATAURI PWA SERVICE WORKER v2.0
// ========================================

const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `gamatauri-${CACHE_VERSION}`;
const API_CACHE = `gamatauri-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `gamatauri-images-${CACHE_VERSION}`;

// Assets críticos para cache (serão baixados na instalação)
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
// INSTALAÇÃO - Cachear assets críticos
// ========================================
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando assets críticos');
      return cache.addAll(STATIC_CACHE_URLS);
    }).catch((err) => {
      console.error('[SW] Erro ao cachear:', err);
    })
  );
  
  // Ativar imediatamente sem esperar
  self.skipWaiting();
});

// ========================================
// ATIVAÇÃO - Limpar caches antigos
// ========================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('gamatauri-') && cacheName !== CACHE_NAME && cacheName !== API_CACHE && cacheName !== IMAGE_CACHE) {
            console.log('[SW] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Assumir controle imediatamente
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
  // ESTRATÉGIA 1: API - Network First
  // ===============================
  if (API_URLS.some(apiUrl => request.url.includes(apiUrl))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cachear apenas respostas bem-sucedidas
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Se falhar, tentar cache
          return caches.match(request).then((cached) => {
            if (cached) {
              console.log('[SW] API offline - servindo do cache:', request.url);
              return cached;
            }
            // Fallback para offline page
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
            // Placeholder se imagem não carregar offline
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
  // ESTRATÉGIA 3: Outros Assets - Cache First
  // ===============================
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      
      return fetch(request).then((response) => {
        // Cachear apenas GET e respostas bem-sucedidas
        if (request.method === 'GET' && response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Fallback para index.html
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ========================================
// BACKGROUND SYNC - Sincronizar pedidos offline
// ========================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync disparado:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders());
  }
});

async function syncPendingOrders() {
  console.log('[SW] Sincronizando pedidos pendentes...');
  // Sincronização será implementada via IndexedDB
}

// ========================================
// MENSAGENS - Comunicação com o cliente
// ========================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

console.log('[SW] Service Worker carregado - v' + CACHE_VERSION);
