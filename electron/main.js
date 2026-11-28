const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const net = require('net');

let mainWindow = null;
let serverProcess = null;
const PORT = 3000;

function checkPort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', () => reject(new Error('Le port 3000 est déjà utilisé. Fermez l’ancienne application avant de continuer.')));
    probe.listen(PORT, '127.0.0.1', () => probe.close(resolve));
  });
}

function waitForServer(retries = 60) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      if (serverProcess?.exitCode != null) return reject(new Error('Le serveur embarqué s’est arrêté.'));
      const retry = () => {
        if (--retries <= 0) reject(new Error('Serveur Next.js non démarré'));
        else setTimeout(attempt, 1000);
      };
      const request = http.get(`http://127.0.0.1:${PORT}/api/dashboard/daily?city=invalid`, response => {
        let body = '';
        response.on('data', chunk => { body += chunk; if (body.length > 4096) request.destroy(); });
        response.on('end', () => {
          try {
            if (response.statusCode === 400 && JSON.parse(body).error === 'UNKNOWN_CITY') return resolve(true);
          } catch {}
          retry();
        });
      });
      request.setTimeout(2000, () => request.destroy());
      request.on('error', retry);
    };
    attempt();
  });
}

function startNextServer() {
  const isDev = !app.isPackaged;
  // En prod, on pointe vers le dossier resources/app
  const cwd = isDev
    ? path.join(__dirname, '..')
    : path.join(process.resourcesPath, 'app');

  const env = {
    ...process.env,
    PORT: String(PORT),
    HOSTNAME: '127.0.0.1',
    NODE_ENV: isDev ? 'development' : 'production',
    DASHBOARD_MET_TERMS_ACCEPTED: process.env.DASHBOARD_MET_TERMS_ACCEPTED || 'true',
  };

  if (!isDev) {
    // No embedded database credential. Keep the installation's existing configuration.
    const envFiles = ['.env', '.env.local', '.env.production', '.env.production.local'];
    if (!env.DATABASE_URL && !envFiles.some(f => fs.existsSync(path.join(cwd, f)))) {
      throw new Error('Configuration de base de données absente. Utilisez la procédure de copie de votre configuration existante avant de lancer cette version.');
    }
    if (env.DATABASE_URL && !/^postgres(?:ql)?:\/\//i.test(env.DATABASE_URL)) {
      throw new Error('Configuration de base non PostgreSQL : mise à niveau interrompue.');
    }
  }
  if (isDev) {
    serverProcess = spawn('npm', ['run', 'dev'], { cwd, env, shell: true });
  } else {
    // Le fichier server.js sera à la racine de resources/app
    const serverPath = path.join(cwd, 'server.js'); 
    if (!fs.existsSync(serverPath)) throw new Error('Serveur embarqué introuvable.');
    serverProcess = spawn(process.execPath, [serverPath], {
      cwd,
      env: {
        ...env,
        ELECTRON_RUN_AS_NODE: '1', // Indispensable
      },
      stdio: 'ignore' // Pour éviter les erreurs de buffer
    });
  }

  serverProcess.stdout?.on('data', (d) => console.log('[Next]', d.toString()));
  serverProcess.stderr?.on('data', (d) => console.error('[Next]', d.toString()));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Gestion Commerciale Maroc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'hide' }, { role: 'quit' }],
    }] : []),
    {
      label: 'Fichier',
      submenu: [
        { label: 'Imprimer', accelerator: 'CmdOrCtrl+P', click: () => mainWindow?.webContents.print() },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: 'Quitter' },
      ],
    },
    {
      label: 'Édition',
      submenu: [
        { role: 'undo', label: 'Annuler' },
        { role: 'redo', label: 'Rétablir' },
        { type: 'separator' },
        { role: 'cut', label: 'Couper' },
        { role: 'copy', label: 'Copier' },
        { role: 'paste', label: 'Coller' },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload', label: 'Recharger' },
        { role: 'toggleDevTools', label: 'DevTools' },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(async () => {
  buildMenu();
  try {
    if (app.isPackaged) await checkPort();
    startNextServer();
    await waitForServer();
    createWindow();
  } catch (e) {
    dialog.showErrorBox('Erreur de démarrage', e.message);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  serverProcess?.kill();
});