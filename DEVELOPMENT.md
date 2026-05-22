# Code Diff Beautifier - Development Server Guide

## How to Start the Development Server

To start the development server for the Code Diff Beautifier application, follow these steps:

### Prerequisites
- Ensure you have [pnpm](https://pnpm.io/) installed (version 11.2.2+ recommended)
- All dependencies should already be installed (run `pnpm install` if needed)

### Start the Server
Run the following command in your terminal:

```bash
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/code-tools dev
```

### Environment Variables Explained
- `PORT`: The port number where the server will run (default: 5173)
- `BASE_PATH`: The base path for the application (use `/` for root access)

### Access the Application
Once the server starts successfully, you can access the application at:
- **Local**: http://localhost:5173/
- **Network**: http://[your-local-ip]:5173/

### Expected Output
When starting correctly, you should see output similar to:
```
  VITE v7.3.3  ready in 333 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.111:5173/
```

### Troubleshooting
If you encounter issues:
1. **Missing native bindings**: Ensure you're running on a supported platform (darwin-x64 in this case)
2. **Port already in use**: Try a different PORT value (e.g., PORT=5174)
3. **Dependency issues**: Run `pnpm install` to refresh dependencies

### Stopping the Server
To stop the development server, press `Ctrl+C` in the terminal where it's running.

---
*Guide created for future reference. Last updated: $(date)*