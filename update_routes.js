const fs = require('fs');
const files = ['src/api/routes/workspaces.ts', 'src/api/routes/projects.ts', 'src/api/routes/files.ts'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the authenticate mock
  const mockAuthRegex = /\/\/ Middleware to mock.*?next\(\);\n\};\n/s;
  
  content = content.replace(mockAuthRegex, '');
  content = content.replace('import { supabaseService } from "../services/supabase.js";', 'import { supabaseService } from "../services/supabase.js";\nimport { authenticate } from "../middleware/auth.js";');
  
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
