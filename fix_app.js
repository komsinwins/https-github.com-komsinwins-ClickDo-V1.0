const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove firebase imports
code = code.replace(/import\s*\{\s*getFirebaseInstance[\s\S]*?\}\s*from\s*'(\.\/)?firebase';?\n/, '');

// 2. Remove Cloud Sync States and Custom Firebase fields state
code = code.replace(/\/\/ Cloud Sync States[\s\S]*?\/\/ View state/m, '// View state');

// 3. Remove // Load custom Firebase config if available block
code = code.replace(/\/\/ Load custom Firebase config if available[\s\S]*?\}\, \[\]\);\n/m, '');

// 4. Clean up initData inside useEffect
code = code.replace(/const initData = async \(\) => \{[\s\S]*?loadedProjects = await localDb\.get\<Project\[\]\>\('clickdo_projects'\) \|\| \[\];\n\s+loadedCustomers = await localDb\.get\<Customer\[\]\>\('clickdo_customers'\) \|\| \[\];\n\s+\}/, 
`const initData = async () => {
      let loadedProjects: Project[] = [];
      let loadedCustomers: Customer[] = [];

      loadedProjects = await localDb.get<Project[]>('clickdo_projects') || [];
      loadedCustomers = await localDb.get<Customer[]>('clickdo_customers') || [];`);

// 5. Clean up other firebase references like saveAllProjectsToFirebase etc.
// In save/delete functions, we just remove the lines containing them.
code = code.replace(/.*saveAllProjectsToFirebase.*/g, '');
code = code.replace(/.*saveAllCustomersToFirebase.*/g, '');
code = code.replace(/.*saveProjectToFirebase.*/g, '');
code = code.replace(/.*saveCustomerToFirebase.*/g, '');
code = code.replace(/.*deleteProjectFromFirebase.*/g, '');
code = code.replace(/.*deleteCustomerFromFirebase.*/g, '');

// 6. Remove cloud functions: toggleCloudMode, handleForceSyncCloud, handleDisconnectCloud, handleSaveCustomFirebase
code = code.replace(/\/\/ Cloud Feature Functions[\s\S]*?\/\/ --- Core Operations ---/m, '// --- Core Operations ---');

// 7. Remove Cloud Sync UI in DashboardOverview
code = code.replace(/isCloudEnabled=\{isCloudEnabled\}\n\s+firebaseStatus=\{cloudStatus\}/g, '');
code = code.replace(/onConfigureFirebase=\{.*\}\n/, '');

// 8. Remove Cloud Sync Sidebar Card
code = code.replace(/\{\/\* Real-time Cloud Sync Card \(Sidebar Widget\) \*\/\}[\s\S]*?\{\/\* App Info \*\/}/m, '{/* App Info */}');

// 9. Remove Cloud Sync Settings Modal
code = code.replace(/\{\/\* Real-time Cloud Sync Settings Modal \*\/\}[\s\S]*?\{\/\* ------------------------------------------------------------------------------------------------ \*\/}/m, '{/* ------------------------------------------------------------------------------------------------ */}');

fs.writeFileSync('src/App.tsx', code);
