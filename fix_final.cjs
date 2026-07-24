const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// The syntax error is: 
// loadedCustomers = await localDb.get<Customer[]>('clickdo_customers') || [];
//      } else {
//        setCloudStatus('disconnected');
//        // Load local
//        loadedProjects = await localDb.get<Project[]>('clickdo_projects') || [];
//        loadedCustomers = await localDb.get<Customer[]>('clickdo_customers') || [];
//      }

code = code.replace(/loadedCustomers = await localDb\.get\<Customer\[\]\>\('clickdo_customers'\) \|\| \[\];\n\s+\} else \{\n\s+setCloudStatus\('disconnected'\);\n\s+\/\/ Load local\n\s+loadedProjects = await localDb\.get\<Project\[\]\>\('clickdo_projects'\) \|\| \[\];\n\s+loadedCustomers = await localDb\.get\<Customer\[\]\>\('clickdo_customers'\) \|\| \[\];\n\s+\}/,
`loadedCustomers = await localDb.get<Customer[]>('clickdo_customers') || [];`);

// Also fix `if (cloudPref) {}`
code = code.replace(/if\s*\(cloudPref\)\s*\{\s*\}/g, '');
code = code.replace(/if\s*\(cloudPref\s*&&\s*cloudStatus\s*===\s*'connected'\)\s*\{\s*\}/g, '');

// Then fix the dummy variables. We will just add them back to the top of App()
// So that all the TS errors go away, but the cloud features are disabled.
code = code.replace(/export default function App\(\) \{/, 
`export default function App() {
  const isCloudEnabled = false;
  const cloudStatus = 'disconnected';
  const cloudError = null;
  const isCloudModalOpen = false;
  const setIsCloudModalOpen = (open: boolean) => {};
  const setCloudStatus = (s: string) => {};
  const setCloudError = (e: any) => {};
  const setIsCloudEnabled = (e: boolean) => {};
  const clearCustomFirebaseConfig = () => {};
  const setUseCustomFirebase = (b: boolean) => {};
  const setFbApiKey = (s: string) => {};
  const setFbAuthDomain = (s: string) => {};
  const setFbProjectId = (s: string) => {};
  const setFbStorageBucket = (s: string) => {};
  const setFbMessagingSenderId = (s: string) => {};
  const setFbAppId = (s: string) => {};
  const useCustomFirebase = false;
  const fbApiKey = '';
  const fbProjectId = '';
  const fbAuthDomain = '';
  const fbStorageBucket = '';
  const fbMessagingSenderId = '';
  const fbAppId = '';
  const saveCustomFirebaseConfig = (c: any) => {};
  const cloudProjects: any = [];
  const cloudCustomers: any = [];
  const getFirebaseInstance = () => null;
`);

fs.writeFileSync('src/App.tsx', code);
