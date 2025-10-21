// server.ts - Next.js Standalone + Socket.IO
import { setupSocket } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || (dev ? '127.0.0.1' : '0.0.0.0');

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      hostname,
      port
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer(async (req, res) => {
      try {
        // Skip socket.io requests from Next.js handler
        if (req.url?.startsWith('/api/socketio')) {
          return;
        }
        
        // Set timeout for requests
        res.setTimeout(30000, () => {
          console.warn('Request timeout');
          res.writeHead(408);
          res.end('Request Timeout');
        });
        
        await handle(req, res);
      } catch (err) {
        console.error('Request handling error:', err);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end('Internal Server Error');
        }
      }
    });

    // Setup Socket.IO
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      transports: ['polling', 'websocket']
    });

    setupSocket(io);

    // Handle server errors
    server.on('error', (err) => {
      console.error('Server error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

    // Start the server
    server.listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO server running at ws://${hostname}:${port}/api/socketio`);
      console.log(`> Environment: ${dev ? 'development' : 'production'}`);
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();
