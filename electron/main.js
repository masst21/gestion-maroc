const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let serverProcess = null;
const PORT = 3000;

function waitForServer(retries = 60) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http.get(`http://localhost:${PORT}`, () => resolve(true))
        .on('error', () => {
          if (--retries <= 0) reject(new Error('Serveur Next.js non démarré'));
          else setTimeout(attempt, 1000);
        });
    };
    attempt();
  });
}

  const isDev = !app.isPackaged;
  const cwd = isDev
    ? path.join(__dirname, '..')
    : path.join(process.resourcesPath, 'app');

  const env = {
    ...process.env,
    PORT: String(PORT),
    HOSTNAME: '0.0.0.0',
    NODE_ENV: isDev ? 'development' : 'production',
  };

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
  };

  if (isDev) {
    serverProcess = spawn('npm', ['run', 'dev'], { cwd, env, shell: true });
  } else {
    // Le fichier server.js sera à la racine de resources/app
    const serverPath = path.join(cwd, 'server.js'); 
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
    shell.openExternal(url);
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
  startNextServer();

  try {
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