const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace usages of `isCloudEnabled` and `cloudStatus`
// Actually, it's easier to just add dummy variables back at the top for them to fail gracefully, 
// OR even better, remove the UI blocks.

// Remove Cloud Sync badge in header (lines around 936-955)
code = code.replace(/\{\/\* Cloud Sync Indicator \*\/\}[\s\S]*?\{\/\* User profile \*\/}/m, '{/* User profile */}');

// Remove Mobile sync status (lines around 1113)
code = code.replace(/<div className=\{\`text-\[10px\] px-2 py-1 rounded-md flex items-center gap-1 \$\{[\s\S]*?<\/div>/m, '');

// Remove Mobile cloud sync modal button (lines around 1218)
code = code.replace(/<div className="pt-2">[\s\S]*?<button[\s\S]*?onClick=\{.*\s*=>\s*setIsCloudModalOpen\(true\)\}[\s\S]*?<\/button>[\s\S]*?<\/div>/m, '');

fs.writeFileSync('src/App.tsx', code);
