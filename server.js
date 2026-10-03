/* Solis Inverters Pakistan & Khata Dev Server & API */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = process.env.PORT || 8123;
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

const contentPath = path.join(root, 'data', 'content.json');
const subscribersPath = path.join(root, 'data', 'subscribers.json');
const ordersPath = path.join(root, 'data', 'orders.json');

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
    if (body.length > 5 * 1024 * 1024) {
      req.connection.destroy();
    }
  });
  req.on('end', () => {
    try {
      const data = body ? JSON.parse(body) : {};
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  });
}

const server = http.createServer((req, res) => {
  const urlParts = req.url.split('?');
  let p = decodeURIComponent(urlParts[0]);
  const queryString = urlParts[1] || '';

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
    return res.end();
  }

  // --- /admin redirects directly to Khata app login page ---
  if (p === '/admin' || p === '/admin/' || p.startsWith('/admin')) {
    res.writeHead(302, { Location: '/khata.html' });
    return res.end();
  }

  // --- Content API ---
  if (p === '/api/content') {
    if (req.method === 'GET') {
      fs.readFile(contentPath, 'utf8', (err, data) => {
        if (err) {
          try {
            const { DEFAULT_SOLIS_DATA } = require('./js/solis-data.js');
            return sendJson(res, 200, DEFAULT_SOLIS_DATA);
          } catch (e) {
            return sendJson(res, 500, { error: 'Failed to load content' });
          }
        }
        try {
          sendJson(res, 200, JSON.parse(data));
        } catch (e) {
          sendJson(res, 500, { error: 'Invalid stored content JSON' });
        }
      });
      return;
    }

    if (req.method === 'POST') {
      parseJsonBody(req, (err, data) => {
        if (err || !data) {
          return sendJson(res, 400, { error: 'Invalid JSON payload' });
        }
        fs.mkdir(path.dirname(contentPath), { recursive: true }, () => {
          fs.writeFile(contentPath, JSON.stringify(data, null, 2), 'utf8', (wErr) => {
            if (wErr) {
              return sendJson(res, 500, { error: 'Failed to save content to disk' });
            }
            sendJson(res, 200, { success: true, message: 'Website content updated successfully' });
          });
        });
      });
      return;
    }
  }

  // --- Orders API (Customer Estimates & Khata Tracking) ---
  if (p === '/api/orders') {
    if (req.method === 'GET') {
      fs.readFile(ordersPath, 'utf8', (err, data) => {
        if (err) return sendJson(res, 200, []);
        try {
          sendJson(res, 200, JSON.parse(data));
        } catch (e) {
          sendJson(res, 200, []);
        }
      });
      return;
    }

    if (req.method === 'POST') {
      parseJsonBody(req, (err, data) => {
        if (err || !data || !data.customerName || !data.phone) {
          return sendJson(res, 400, { error: 'Please provide customer name and contact phone number' });
        }
        fs.readFile(ordersPath, 'utf8', (rErr, raw) => {
          let orders = [];
          if (!rErr && raw) {
            try { orders = JSON.parse(raw); } catch (e) { orders = []; }
          }
          const orderId = 'PK-ORD-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
          const newOrder = {
            id: orderId,
            customerName: data.customerName.trim(),
            phone: data.phone.trim(),
            city: data.city || 'Karachi',
            area: data.area || 'Karachi, Pakistan',
            systemSize: data.systemSize || '10 kW',
            inverterModel: data.inverterModel || 'Solis S6 Hybrid Inverter',
            monthlyBill: data.monthlyBill || '',
            batteryType: data.batteryType || 'Lithium Battery',
            estimatedCost: data.estimatedCost || 'PKR 1,200,000',
            customSystemSize: data.customSystemSize || '',
            selectedItems: Array.isArray(data.selectedItems) ? data.selectedItems.map(item => ({ label: String(item.label || '').slice(0, 160), price: Math.max(0, Number(item.price) || 0) })) : [],
            customModules: data.customModules && typeof data.customModules === 'object' && !Array.isArray(data.customModules) ? data.customModules : {},
            notes: data.notes || '',
            status: 'Pending',
            createdAt: new Date().toISOString(),
            history: [
              { time: new Date().toISOString(), status: 'Estimate Order Submitted Online' }
            ]
          };
          orders.unshift(newOrder);
          fs.mkdir(path.dirname(ordersPath), { recursive: true }, (mkdirErr) => {
            if (mkdirErr) return sendJson(res, 500, { error: 'Could not create the orders data folder' });
            fs.writeFile(ordersPath, JSON.stringify(orders, null, 2), 'utf8', (writeErr) => {
              if (writeErr) return sendJson(res, 500, { error: 'Could not save the order' });
              sendJson(res, 200, {
                success: true,
                orderId: orderId,
                order: newOrder,
                message: `Your solar order has been received! Tracking ID: ${orderId}`
              });
            });
          });
        });
      });
      return;
    }
  }

  // --- Track Order by ID ---
  if (p === '/api/orders/track') {
    const params = new URLSearchParams(queryString);
    const searchId = (params.get('id') || '').trim().toUpperCase();
    fs.readFile(ordersPath, 'utf8', (err, data) => {
      let orders = [];
      if (!err && data) {
        try { orders = JSON.parse(data); } catch (e) { orders = []; }
      }
      const found = orders.find(o => o.id.toUpperCase() === searchId);
      if (!found) {
        return sendJson(res, 404, { error: `No solar order found with Tracking ID: ${searchId}` });
      }
      sendJson(res, 200, found);
    });
    return;
  }

  // --- Update Order Status from Khata Admin ---
  if (p === '/api/orders/update') {
    if (req.method === 'POST') {
      parseJsonBody(req, (err, data) => {
        const allowedStatuses = ['Pending', 'Contacted', 'Survey Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Invoiced in Khata'];
        if (err || !data || !data.id || !allowedStatuses.includes(data.status)) {
          return sendJson(res, 400, { error: 'Missing order ID or status' });
        }
        fs.readFile(ordersPath, 'utf8', (rErr, raw) => {
          let orders = [];
          if (!rErr && raw) {
            try { orders = JSON.parse(raw); } catch (e) { orders = []; }
          }
          const idx = orders.findIndex(o => o.id === data.id);
          if (idx === -1) {
            return sendJson(res, 404, { error: 'Order not found' });
          }
          orders[idx].status = data.status;
          if (data.invoiceId) {
            orders[idx].invoiceId = String(data.invoiceId);
            orders[idx].khataInvoiceId = String(data.invoiceId);
          }
          orders[idx].updatedAt = new Date().toISOString();
          if (!orders[idx].history) orders[idx].history = [];
          orders[idx].history.push({
            time: new Date().toISOString(),
            status: data.invoiceId ? `Converted to Khata invoice ${data.invoiceId}` : data.statusNote || `Status changed to: ${data.status}`
          });
          fs.writeFile(ordersPath, JSON.stringify(orders, null, 2), 'utf8', (writeErr) => {
            if (writeErr) return sendJson(res, 500, { error: 'Could not save order status' });
            sendJson(res, 200, { success: true, order: orders[idx] });
          });
        });
      });
      return;
    }
  }

  // --- Subscribers API ---
  if (p === '/api/subscribers') {
    if (req.method === 'GET') {
      fs.readFile(subscribersPath, 'utf8', (err, data) => {
        if (err) return sendJson(res, 200, []);
        try {
          sendJson(res, 200, JSON.parse(data));
        } catch (e) {
          sendJson(res, 200, []);
        }
      });
      return;
    }
  }

  if (p === '/api/subscribe') {
    if (req.method === 'POST') {
      parseJsonBody(req, (err, data) => {
        if (err || !data || !data.email || !data.email.includes('@')) {
          return sendJson(res, 400, { error: 'Please enter a valid email address' });
        }
        fs.readFile(subscribersPath, 'utf8', (rErr, raw) => {
          let list = [];
          if (!rErr && raw) {
            try { list = JSON.parse(raw); } catch (e) { list = []; }
          }
          const email = data.email.trim().toLowerCase();
          const exists = list.some(item => item.email === email);
          if (!exists) {
            list.unshift({
              email,
              subscribedAt: new Date().toISOString(),
              source: data.source || 'Pakistan Portal'
            });
            fs.writeFile(subscribersPath, JSON.stringify(list, null, 2), 'utf8', () => {});
          }
          sendJson(res, 200, {
            success: true,
            alreadySubscribed: exists,
            message: exists ? 'You are already subscribed to Solis Pakistan news!' : 'Thank you for subscribing to Solis Pakistan updates!'
          });
        });
      });
      return;
    }
  }

  if (p === '/api/reset') {
    if (req.method === 'POST') {
      try {
        const { DEFAULT_SOLIS_DATA } = require('./js/solis-data.js');
        fs.writeFile(contentPath, JSON.stringify(DEFAULT_SOLIS_DATA, null, 2), 'utf8', (wErr) => {
          if (wErr) return sendJson(res, 500, { error: 'Failed to reset content' });
          sendJson(res, 200, { success: true, message: 'Content restored to Solis Pakistan defaults' });
        });
      } catch (e) {
        sendJson(res, 500, { error: 'Failed to reset' });
      }
      return;
    }
  }

  // --- Static File Serving ---
  if (p === '/') p = '/index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root)) {
    res.writeHead(403);
    return res.end('Access Forbidden');
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      if (!path.extname(file)) {
        return fs.readFile(path.join(root, 'index.html'), (idxErr, idxData) => {
          if (idxErr) { res.writeHead(404); return res.end('Not found'); }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(idxData);
        });
      }
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mime[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache, must-revalidate'
    });
    res.end(data);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Solis Inverters Pakistan & Khata dev server: http://localhost:${port}`);
  console.log(`- Flagship Pakistan Website: http://localhost:${port}/`);
  console.log(`- Admin Portal (Khata login): http://localhost:${port}/admin`);
  console.log(`- Easy Khata App:            http://localhost:${port}/khata.html`);
});
