const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove firebase imports
code = code.replace(/import\s*\{\s*getFirebaseInstance[\s\S]*?\}\s*from\s*'(\.\/)?firebase';?\n/, '');

// 2. Remove Cloud Sync States and Custom Firebase fields state
code = code.replace(/\/\/ Cloud Sync States[\s\S]*?\/\/ View state:/m, '// View state:');

// 3. Remove // Load custom Firebase config if available block
code = code.replace(/\/\/ Load custom Firebase config if available[\s\S]*?\}\, \[\]\);\n/m, '');

// 4. Clean up initData
code = code.replace(/const initData = async \(\) => \{[\s\S]*?loadedProjects = await localDb\.get\<Project\[\]\>\('clickdo_projects'\) \|\| \[\];\n\s+loadedCustomers = await localDb\.get\<Customer\[\]\>\('clickdo_customers'\) \|\| \[\];\n\s+\}/m, 
`const initData = async () => {
      let loadedProjects: Project[] = [];
      let loadedCustomers: Customer[] = [];

      loadedProjects = await localDb.get<Project[]>('clickdo_projects') || [];
      loadedCustomers = await localDb.get<Customer[]>('clickdo_customers') || [];`);

// Fix empty if(cloudPref) and useEffect array
code = code.replace(/if\s*\(cloudPref\)\s*\{\s*\}/g, '');
code = code.replace(/if\s*\(cloudPref\s*&&\s*cloudStatus\s*===\s*'connected'\)\s*\{\s*\}/g, '');
code = code.replace(/\}, \[isCloudEnabled\]\);/g, '}, []);');

// 5. Remove all save/delete firebase calls
const fnsToRemove = [
  'saveAllProjectsToFirebase',
  'saveAllCustomersToFirebase',
  'saveProjectToFirebase',
  'saveCustomerToFirebase',
  'deleteProjectFromFirebase',
  'deleteCustomerFromFirebase',
  'fetchProjectsFromFirebase',
  'fetchCustomersFromFirebase'
];
fnsToRemove.forEach(fn => {
  const regex = new RegExp(`.*${fn}.*\\n`, 'g');
  code = code.replace(regex, '');
});

// 6. Remove cloud functions block
code = code.replace(/\/\/ Cloud Feature Functions[\s\S]*?\/\/ --- Core Operations ---/m, '// --- Core Operations ---');

// 7. Remove Cloud Sync props in DashboardOverview
code = code.replace(/\s*isCloudEnabled=\{isCloudEnabled\}\n\s*firebaseStatus=\{cloudStatus\}/g, '');
code = code.replace(/\s*onConfigureFirebase=\{.*\}\n/, '\n');

// 8. Remove Cloud Sync badge in header (lines around 936-955)
code = code.replace(/\{\/\* Cloud Sync Indicator \*\/\}[\s\S]*?\{\/\* User profile \*\/}/m, '{/* User profile */}');

// 9. Remove Mobile sync status (lines around 1113)
code = code.replace(/<div className=\{\`text-\[10px\] px-2 py-1 rounded-md flex items-center gap-1 \$\{[\s\S]*?<\/div>/m, '');

// 10. Remove Mobile cloud sync modal button (lines around 1218)
code = code.replace(/<div className="pt-2">[\s\S]*?<button[\s\S]*?onClick=\{.*\s*=>\s*setIsCloudModalOpen\(true\)\}[\s\S]*?<\/button>[\s\S]*?<\/div>/m, '');

// 11. Remove Cloud Sync Sidebar Card
code = code.replace(/\{\/\* Real-time Cloud Sync Card \(Sidebar Widget\) \*\/\}[\s\S]*?\{\/\* App Info \*\/}/m, '{/* App Info */}');

// 12. Remove Cloud Sync Settings Modal
code = code.replace(/\{\/\* Real-time Cloud Sync Settings Modal \*\/\}[\s\S]*?\{\/\* ------------------------------------------------------------------------------------------------ \*\/}/m, '{/* ------------------------------------------------------------------------------------------------ */}');

// 13. Fix any leftover variable references by removing the code blocks using them
// For example, the `handleForceSyncCloud` button or other usages. Since we removed the modal and the buttons, there shouldn't be much left.
// Let's remove the whole `if (isCloudEnabled && cloudStatus === 'connected')` inside `handleSaveProject`
code = code.replace(/if\s*\(isCloudEnabled\s*&&\s*cloudStatus\s*===\s*'connected'\)\s*\{[\s\S]*?\}/g, '');

fs.writeFileSync('src/App.tsx', code);
