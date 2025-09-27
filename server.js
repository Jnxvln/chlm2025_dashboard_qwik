#!/usr/bin/env node

/**
 * Railway Production Server
 * Direct Node.js server that loads the Qwik application
 */

import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

// Set environment variables for Qwik to detect HTTPS properly
process.env.ORIGIN = process.env.ORIGIN || `https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'dashboard.chlandscapematerials.com'}`;
process.env.PROTOCOL_HEADER = 'x-forwarded-proto';
process.env.HOST_HEADER = 'x-forwarded-host';

console.log('🚀 Starting Qwik server...');
console.log('📁 Current directory:', __dirname);

// Check for required files
const serverPath = join(__dirname, 'server', 'entry.preview.js');
const distPath = join(__dirname, 'dist');

console.log('🔍 Checking server file:', serverPath);
console.log('✅ Server file exists:', existsSync(serverPath));
console.log('✅ Dist directory exists:', existsSync(distPath));

let qwikHandler;

try {
  console.log('📦 Loading Qwik handler...');
  const fileUrl = `file://${serverPath.replace(/\\/g, '/')}`;
  console.log('🔗 Loading from URL:', fileUrl);
  const module = await import(fileUrl);
  
  // QwikCity createQwikCity returns an object with router and notFound
  const defaultExport = module.default;
  
  if (defaultExport && typeof defaultExport === 'object' && defaultExport.router) {
    qwikHandler = defaultExport.router;
  } else {
    qwikHandler = defaultExport || module.handler || module;
  }
  
  if (typeof qwikHandler !== 'function') {
    console.error('❌ Qwik handler is not a function.');
    process.exit(1);
  }
  
  console.log('✅ Qwik handler loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Qwik handler:', error);
  process.exit(1);
}

const server = createServer(async (req, res) => {
  try {
    // Handle static assets
    if (req.url?.startsWith('/build/') || req.url?.startsWith('/assets/')) {
      const filePath = join(__dirname, 'dist', req.url);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath);
        const ext = req.url.split('.').pop();
        
        // Set appropriate content type
        switch (ext) {
          case 'js':
            res.setHeader('Content-Type', 'application/javascript');
            break;
          case 'css':
            res.setHeader('Content-Type', 'text/css');
            break;
          case 'svg':
            res.setHeader('Content-Type', 'image/svg+xml');
            break;
          default:
            res.setHeader('Content-Type', 'application/octet-stream');
        }
        
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.end(content);
        return;
      }
    }

    // Handle favicon and other root assets
    if (req.url === '/favicon.svg' || req.url === '/favicon.png' || req.url === '/favicon.ico' || req.url === '/manifest.json' || req.url === '/robots.txt') {
      const filePath = join(__dirname, 'dist', req.url);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath);
        if (req.url.endsWith('.svg')) {
          res.setHeader('Content-Type', 'image/svg+xml');
        } else if (req.url.endsWith('.png') || req.url.endsWith('.ico')) {
          res.setHeader('Content-Type', 'image/png');
        } else if (req.url.endsWith('.json')) {
          res.setHeader('Content-Type', 'application/json');
        } else {
          res.setHeader('Content-Type', 'text/plain');
        }
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        res.end(content);
        return;
      } else {
        // Return 404 for missing favicon instead of passing to Qwik
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Not Found');
        return;
      }
    }

    // Log request details before handling
    console.log(`🌐 Processing request: ${req.method} ${req.url}`);

    // Set essential headers for Qwik actions and CORS
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Fix HTTPS/HTTP origin mismatch for Railway
    // Railway serves on HTTPS but Qwik might detect HTTP internally
    const originalUrl = req.url;
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || (req.headers['x-forwarded-ssl'] === 'on' ? 'https' : 'http');

    // Set proper origin headers for Qwik CSRF protection
    if (!req.headers.origin && host) {
      req.headers.origin = `${protocol}://${host}`;
    }

    // Ensure x-forwarded-proto is set for Railway HTTPS
    if (!req.headers['x-forwarded-proto']) {
      req.headers['x-forwarded-proto'] = 'https';
    }

    console.log(`🔍 Request details: ${req.method} ${req.url}`);
    console.log(`🔍 Protocol: ${protocol}, Host: ${host}, Origin: ${req.headers.origin}`);

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      console.log(`✅ OPTIONS request completed: ${req.url}`);
      return;
    }

    // Use Qwik handler for all other requests
    await qwikHandler(req, res);

    console.log(`✅ Request completed: ${req.method} ${req.url}`);
  } catch (error) {
    console.error(`❌ Request error for ${req.method} ${req.url}:`, error);
    console.error('❌ Error details:', error.stack);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Internal Server Error');
    }
  }
});

server.listen(port, host, () => {
  console.log(`🚀 Server running at http://${host}:${port}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});