import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove firebase imports
code = code.replace(/import \{.*?\} from '\.\/firebase';?\n?/s, '');

// 2. Remove states
code = code.replace(/\/\/ Cloud Sync States.*?\/\/ View state/s, '// View state');

// 3. Remove custom firebase config load
code = code.replace(/\/\/ Load custom Firebase config if available.*?\}\, \[\]\);\n/s, '');

// 4. Update initData
code = code.replace(/const initData = async \(\) => \{.*?\/\/ 2\. Positions/s, `const initData = async () => {
      let loadedProjects: Project[] = [];
      let loadedCustomers: Customer[] = [];

      loadedProjects = await localDb.get<Project[]>('clickdo_projects') || [];
      loadedCustomers = await localDb.get<Customer[]>('clickdo_customers') || [];

      // If still empty, fall back to INITIAL_PROJECTS
      if (loadedProjects.length === 0) {
        const storedProjects = localStorage.getItem('clickdo_projects');
        if (storedProjects) {
          try {
            loadedProjects = JSON.parse(storedProjects);
          } catch (e) {
            loadedProjects = INITIAL_PROJECTS;
          }
        } else {
          loadedProjects = INITIAL_PROJECTS;
        }
        await localDb.set('clickdo_projects', loadedProjects);
      }
      setProjects(loadedProjects);

      // 6. Customers
      if (loadedCustomers.length === 0) {
        const storedCustomers = localStorage.getItem('clickdo_customers');
        if (storedCustomers) {
          try {
            loadedCustomers = JSON.parse(storedCustomers);
          } catch (e) {
            loadedCustomers = INITIAL_CUSTOMERS;
          }
        } else {
          loadedCustomers = INITIAL_CUSTOMERS;
        }
        await localDb.set('clickdo_customers', loadedCustomers);
      }
      setCustomers(loadedCustomers);

      // 2. Positions`);

// Fix Customer block inside initData to not have the cloud logic at the end (handled above)
code = code.replace(/\/\/ 6\. Customers.*?\}\n\s+setCustomers\(loadedCustomers\);/s, '');

// Fix useEffect dependency
code = code.replace(/\}\;\n\n    initData\(\);\n  \}, \[isCloudEnabled\]\);/s, '};\n\n    initData();\n  }, []);');

// 5. Remove saveAllProjectsToFirebase
code = code.replace(/if \(isCloudEnabled[\s\S]*?saveAllProjectsToFirebase.*?\n\s+\}/sg, '');
code = code.replace(/if \(isCloudEnabled[\s\S]*?saveAllCustomersToFirebase.*?\n\s+\}/sg, '');

// Also inside handleSaveProject
code = code.replace(/if \(isCloudEnabled.*?\)\s*\{\s*await saveProjectToFirebase.*?\}\n/g, '');
// inside handleSaveCustomer
code = code.replace(/if \(isCloudEnabled.*?\)\s*\{\s*await saveCustomerToFirebase.*?\}\n/g, '');
// inside handleDeleteProject
code = code.replace(/if \(isCloudEnabled.*?\)\s*\{\s*await deleteProjectFromFirebase.*?\}\n/g, '');
// inside handleDeleteCustomer
code = code.replace(/if \(isCloudEnabled.*?\)\s*\{\s*await deleteCustomerFromFirebase.*?\}\n/g, '');

// Also the "If Cloud Sync is connected, offer to sync" in handleImportData
code = code.replace(/\/\/ If Cloud Sync is connected, offer to sync.*?\}\s*\}\s*\}\s*catch \(parseErr: any\)/s, '} catch (parseErr: any)');

// 6. Remove Cloud Feature Functions
code = code.replace(/\/\/ Cloud Feature Functions.*?\/\/ --- Core Operations ---/s, '// --- Core Operations ---');

// 7. Remove DashboardOverview props
code = code.replace(/isCloudEnabled=\{isCloudEnabled\}\n\s+firebaseStatus=\{cloudStatus\}/g, '');
code = code.replace(/onConfigureFirebase=\{.*?\}\n/g, '');

// 8. Remove Cloud Sync Indicator
code = code.replace(/\{\/\* Cloud Sync Indicator \*\/}.*?\{\/\* User profile \*\//s, '{/* User profile */');

// 9. Remove Mobile menu sync status
code = code.replace(/<div className=\{`text-\[10px\] px-2 py-1 rounded-md flex items-center gap-1.*?(?=<\/div>\n\s*<button\n\s*onClick=\{.*isCloudModalOpen)/s, '');
code = code.replace(/<button\n\s*onClick=\{.*isCloudModalOpen.*?<\/button>/s, '');

// 10. Remove Sidebar cloud sync widget
code = code.replace(/\{\/\* Real-time Cloud Sync Card \(Sidebar Widget\) \*\/}.*?\{\/\* App Info \*\//s, '{/* App Info */');

// 11. Remove Modal
code = code.replace(/\{\/\* Real-time Cloud Sync Settings Modal \*\/}.*?\{\/\* ------------------------------------------------------------------------------------------------ \*\//s, '{/* ------------------------------------------------------------------------------------------------ */');

// 12. Remove the "Connect to Cloud" icon from header title (just the database icon)
code = code.replace(/<Database className="w-5 h-5 text-zinc-600 hidden sm:block" \/>/g, '');

fs.writeFileSync('src/App.tsx', code);
