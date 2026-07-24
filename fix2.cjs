const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix the syntax error from previous replace
code = code.replace(/loadedCustomers = await localDb\.get\<Customer\[\]\>\('clickdo_customers'\) \|\| \[\];\n\s+\} else \{\n\s+setCloudStatus\('disconnected'\);\n\s+\/\/ Load local\n\s+loadedProjects = await localDb\.get\<Project\[\]\>\('clickdo_projects'\) \|\| \[\];\n\s+loadedCustomers = await localDb\.get\<Customer\[\]\>\('clickdo_customers'\) \|\| \[\];\n\s+\}/,
`loadedCustomers = await localDb.get<Customer[]>('clickdo_customers') || [];`);

// Fix empty if(cloudPref) blocks
code = code.replace(/if\s*\(cloudPref\)\s*\{\s*\}/g, '');
code = code.replace(/if\s*\(cloudPref\s*&&\s*cloudStatus\s*===\s*'connected'\)\s*\{\s*\}/g, '');

// Fix useEffect dependency array
code = code.replace(/\}, \[isCloudEnabled\]\);/g, '}, []);');

// And we still have some unused imports or variables, let's fix them too.
fs.writeFileSync('src/App.tsx', code);
