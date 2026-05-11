const http = require("http");
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.end("Hello from Node.js!");
}).listen(PORT, () => console.log(`Server on port ${PORT}`));
