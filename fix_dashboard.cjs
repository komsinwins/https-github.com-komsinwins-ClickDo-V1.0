const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardOverview.tsx', 'utf8');

// I need to add back onConfigureFirebase and firebaseStatus props to avoid ts errors from callers if any, or just fix it.
// Actually, since I removed the props in the previous script (which failed), I will run the dashboard script again properly.

code = code.replace(/\s*onConfigureFirebase\?:\s*\(\)\s*=>\s*void;\n\s*firebaseStatus\?:\s*'disconnected'\s*\|\s*'connecting'\s*\|\s*'connected'\s*\|\s*'error';/, '');
code = code.replace(/\s*onConfigureFirebase,\n\s*firebaseStatus,/, '');

// 2. Remove Cloud Sync Badge (Universal Access)
// We'll replace it with empty
code = code.replace(/\{\/\* Real-time Cloud Sync Badge \(Universal Access\) \*\/\}[\s\S]*?<\/button>\n\s*\}\n\s*<\/div>/, '');

fs.writeFileSync('src/components/DashboardOverview.tsx', code);
