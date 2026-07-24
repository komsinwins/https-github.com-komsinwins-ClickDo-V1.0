import fs from 'fs';
let code = fs.readFileSync('src/components/DashboardOverview.tsx', 'utf8');

code = code.replace(/\s*onConfigureFirebase\?:\s*\(\)\s*=>\s*void;\n\s*firebaseStatus\?:\s*'disconnected'\s*\|\s*'connecting'\s*\|\s*'connected'\s*\|\s*'error';/, '');
code = code.replace(/\s*onConfigureFirebase,\n\s*firebaseStatus,/, '');

// 2. Remove Cloud Sync Badge (Universal Access)
// We'll replace it with empty
code = code.replace(/\{\/\* Real-time Cloud Sync Badge \(Universal Access\) \*\/\}[\s\S]*?<\/button>\n\s*\}\n\s*<\/div>/, '');

fs.writeFileSync('src/components/DashboardOverview.tsx', code);

// Also remove it from App.tsx where it's passed as a prop
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/\s*firebaseStatus=\{cloudStatus\}/, '');
fs.writeFileSync('src/App.tsx', appCode);

