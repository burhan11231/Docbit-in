import fs from 'fs';
async function run() {
  const email = "testworkspace@example.com";
  const password = "password123";
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const loginData = await loginRes.json();
  const token = loginData.session?.access_token;

  const wsRes = await fetch("http://localhost:3000/api/workspaces", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const wsData = await wsRes.json();
  const wsId = wsData.workspaces?.[0]?.id;

  const pRes = await fetch("http://localhost:3000/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ name: "Upload Test", workspace_id: wsId })
  });
  const pData = await pRes.json();
  const pId = pData.project?.id;
  
  fs.writeFileSync('test_dummy.txt', 'Hello World!');
  const formData = new FormData();
  formData.append('project_id', pId);
  
  const fileContent = fs.readFileSync('test_dummy.txt');
  const blob = new Blob([fileContent], { type: 'text/plain' });
  formData.append('file', blob, 'test_dummy.txt');
  
  const res = await fetch("http://localhost:3000/api/files/upload", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: formData as any
  });
  
  console.log("Upload:", await res.json());
}
run();
