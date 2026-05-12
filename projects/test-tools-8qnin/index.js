const http = require("http");
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.end(`<h1 style="font-family:sans-serif;padding:2rem">Hello from Node.js! 🚀</h1><p>Running on port ${PORT}</p>`);
}).listen(PORT, () => console.log(`✅ Server on http://localhost:${PORT}`));
