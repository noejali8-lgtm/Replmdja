import { useState } from "react";
import { Layers, Zap, Database, Globe, Server, Code2, Check, ChevronRight, Package, Sparkles } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tags: string[];
  color: string;
  files: Record<string, string>;
  packages: string[];
}

const TEMPLATES: Template[] = [
  {
    id: "t3",
    name: "T3 Stack",
    description: "Full-stack TypeScript with Next.js, Prisma, tRPC, and Tailwind CSS",
    icon: <Zap className="h-5 w-5" />,
    tags: ["Next.js", "tRPC", "Prisma", "Tailwind"],
    color: "from-[#6e40c9] to-[#a371f7]",
    packages: ["next", "@trpc/server", "@trpc/client", "@trpc/react-query", "@tanstack/react-query", "prisma", "@prisma/client", "tailwindcss", "typescript", "zod"],
    files: {
      "package.json": JSON.stringify({ name: "t3-app", scripts: { dev: "next dev", build: "next build", start: "next start", "db:push": "prisma db push" }, dependencies: { next: "^14", react: "^18", "@trpc/server": "^11", "zod": "^3", "@prisma/client": "^5" } }, null, 2),
      "prisma/schema.prisma": `generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\nmodel User {\n  id        String   @id @default(cuid())\n  email     String   @unique\n  name      String?\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n`,
      "src/server/trpc.ts": `import { initTRPC } from "@trpc/server";\nimport { z } from "zod";\n\nconst t = initTRPC.create();\n\nexport const router = t.router;\nexport const publicProcedure = t.procedure;\n\nexport const appRouter = router({\n  hello: publicProcedure\n    .input(z.object({ name: z.string() }))\n    .query(({ input }) => {\n      return { greeting: \`Hello, \${input.name}!\` };\n    }),\n});\n\nexport type AppRouter = typeof appRouter;\n`,
      "src/app/page.tsx": `export default function Home() {\n  return (\n    <main className="flex min-h-screen flex-col items-center justify-center">\n      <h1 className="text-4xl font-bold">T3 App</h1>\n      <p className="text-muted-foreground mt-2">Built with Next.js, tRPC, Prisma</p>\n    </main>\n  );\n}\n`,
    }
  },
  {
    id: "mern",
    name: "MERN Stack",
    description: "MongoDB, Express, React, Node.js — the classic full-stack setup",
    icon: <Server className="h-5 w-5" />,
    tags: ["MongoDB", "Express", "React", "Node.js"],
    color: "from-[#238636] to-[#3fb950]",
    packages: ["express", "mongoose", "cors", "dotenv", "react", "react-dom", "vite", "axios"],
    files: {
      "package.json": JSON.stringify({ name: "mern-app", scripts: { dev: "concurrently \"npm run server\" \"npm run client\"", server: "node server/index.js", client: "vite" } }, null, 2),
      "server/index.js": `const express = require("express");\nconst mongoose = require("mongoose");\nconst cors = require("cors");\nrequire("dotenv").config();\n\nconst app = express();\napp.use(cors());\napp.use(express.json());\n\nmongoose.connect(process.env.MONGODB_URI);\n\napp.get("/api/health", (req, res) => res.json({ ok: true }));\n\napp.listen(5000, () => console.log("Server running on port 5000"));\n`,
      "server/models/User.js": `const mongoose = require("mongoose");\n\nconst userSchema = new mongoose.Schema({\n  name: { type: String, required: true },\n  email: { type: String, required: true, unique: true },\n  createdAt: { type: Date, default: Date.now },\n});\n\nmodule.exports = mongoose.model("User", userSchema);\n`,
      "src/App.jsx": `import { useState, useEffect } from "react";\n\nfunction App() {\n  const [status, setStatus] = useState("loading");\n\n  useEffect(() => {\n    fetch("/api/health").then(r => r.json()).then(d => setStatus(d.ok ? "connected" : "error"));\n  }, []);\n\n  return (\n    <div style={{ fontFamily: "sans-serif", padding: 40 }}>\n      <h1>MERN Stack App</h1>\n      <p>API: {status}</p>\n    </div>\n  );\n}\n\nexport default App;\n`,
    }
  },
  {
    id: "next-prisma",
    name: "Next.js + Prisma",
    description: "Next.js App Router with Prisma ORM, PostgreSQL, and shadcn/ui",
    icon: <Globe className="h-5 w-5" />,
    tags: ["Next.js 14", "Prisma", "PostgreSQL", "shadcn/ui"],
    color: "from-[#0d1117] to-[#58a6ff]",
    packages: ["next", "prisma", "@prisma/client", "tailwindcss", "@radix-ui/react-slot", "class-variance-authority", "clsx"],
    files: {
      "package.json": JSON.stringify({ name: "next-prisma-app", scripts: { dev: "next dev", build: "next build", "db:push": "prisma db push", "db:studio": "prisma studio" } }, null, 2),
      "prisma/schema.prisma": `generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\nmodel Post {\n  id        Int      @id @default(autoincrement())\n  title     String\n  content   String?\n  published Boolean  @default(false)\n  createdAt DateTime @default(now())\n}\n`,
      "lib/prisma.ts": `import { PrismaClient } from "@prisma/client";\n\nconst globalForPrisma = globalThis as unknown as { prisma: PrismaClient };\n\nexport const prisma = globalForPrisma.prisma || new PrismaClient();\n\nif (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;\n`,
      "app/page.tsx": `import { prisma } from "@/lib/prisma";\n\nexport default async function Home() {\n  const posts = await prisma.post.findMany({ where: { published: true } });\n  return (\n    <main className="max-w-2xl mx-auto p-8">\n      <h1 className="text-3xl font-bold mb-6">Blog Posts</h1>\n      {posts.map(post => (\n        <article key={post.id} className="mb-4 p-4 border rounded">\n          <h2 className="text-xl font-semibold">{post.title}</h2>\n          <p className="text-gray-600 mt-1">{post.content}</p>\n        </article>\n      ))}\n    </main>\n  );\n}\n`,
    }
  },
  {
    id: "express-api",
    name: "Express REST API",
    description: "Production-ready REST API with Express, Zod validation, and Drizzle ORM",
    icon: <Database className="h-5 w-5" />,
    tags: ["Express", "TypeScript", "Zod", "Drizzle"],
    color: "from-[#d29922] to-[#f2cc60]",
    packages: ["express", "drizzle-orm", "postgres", "zod", "cors", "helmet", "morgan", "typescript"],
    files: {
      "src/index.ts": `import express from "express";\nimport cors from "cors";\nimport helmet from "helmet";\nimport morgan from "morgan";\nimport { userRouter } from "./routes/users";\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(helmet());\napp.use(cors());\napp.use(morgan("dev"));\napp.use(express.json());\n\napp.use("/api/users", userRouter);\n\napp.get("/health", (_, res) => res.json({ status: "ok", ts: new Date() }));\n\napp.listen(PORT, () => console.log(\`🚀 API on http://localhost:\${PORT}\`));\n`,
      "src/schema.ts": `import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";\n\nexport const users = pgTable("users", {\n  id:        serial("id").primaryKey(),\n  name:      text("name").notNull(),\n  email:     text("email").notNull().unique(),\n  active:    boolean("active").default(true),\n  createdAt: timestamp("created_at").defaultNow(),\n});\n`,
      "src/routes/users.ts": `import { Router } from "express";\nimport { z } from "zod";\n\nexport const userRouter = Router();\n\nconst CreateUser = z.object({ name: z.string().min(1), email: z.string().email() });\n\nlet users: any[] = [];\n\nuserRouter.get("/", (_, res) => res.json(users));\n\nuserRouter.post("/", (req, res) => {\n  const result = CreateUser.safeParse(req.body);\n  if (!result.success) return res.status(400).json(result.error);\n  const user = { id: users.length + 1, ...result.data, createdAt: new Date() };\n  users.push(user);\n  res.status(201).json(user);\n});\n`,
    }
  },
  {
    id: "react-vite",
    name: "React + Vite + TailwindCSS",
    description: "Lightning-fast React SPA with Vite bundler and Tailwind utility classes",
    icon: <Code2 className="h-5 w-5" />,
    tags: ["React 18", "Vite", "TypeScript", "Tailwind"],
    color: "from-[#f85149] to-[#ff7b72]",
    packages: ["react", "react-dom", "vite", "@vitejs/plugin-react", "tailwindcss", "postcss", "autoprefixer", "typescript"],
    files: {
      "index.html": `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>React App</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>\n`,
      "src/main.tsx": `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\nimport "./index.css";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode><App /></React.StrictMode>\n);\n`,
      "src/App.tsx": `import { useState } from "react";\n\nfunction App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6">\n      <h1 className="text-4xl font-bold text-gray-900">React + Vite</h1>\n      <button\n        onClick={() => setCount(c => c + 1)}\n        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">\n        count is {count}\n      </button>\n    </div>\n  );\n}\n\nexport default App;\n`,
      "tailwind.config.js": `/** @type {import("tailwindcss").Config} */\nexport default {\n  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],\n  theme: { extend: {} },\n  plugins: [],\n};\n`,
    }
  },
];

interface EnvironmentTemplatesProps {
  onApply?: (template: Template) => void;
}

export function EnvironmentTemplates({ onApply }: EnvironmentTemplatesProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [applied, setApplied] = useState<string | null>(null);
  const [tab, setTab] = useState<"browse" | "detail">("browse");

  const selectedTpl = TEMPLATES.find(t => t.id === selected);

  const handleApply = async (tpl: Template) => {
    setApplying(tpl.id);
    await new Promise(r => setTimeout(r, 1200));
    onApply?.(tpl);
    setApplied(tpl.id);
    setApplying(null);
    setTimeout(() => setApplied(null), 3000);
  };

  if (tab === "detail" && selectedTpl) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
          <button onClick={() => setTab("browse")} className="text-[#8b949e] hover:text-[#e6edf3] text-xs flex items-center gap-1 transition-colors">
            ← Back
          </button>
          <span className="text-xs font-semibold text-[#e6edf3] flex-1 truncate">{selectedTpl.name}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className={`h-20 rounded-lg bg-gradient-to-br ${selectedTpl.color} flex items-center justify-center`}>
            <span className="text-white text-3xl">{selectedTpl.icon}</span>
          </div>
          <p className="text-xs text-[#8b949e]">{selectedTpl.description}</p>
          <div>
            <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest mb-1.5">Packages</p>
            <div className="flex flex-wrap gap-1">
              {selectedTpl.packages.map(pkg => (
                <span key={pkg} className="text-[10px] px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">{pkg}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest mb-1.5">Files</p>
            <div className="space-y-1">
              {Object.keys(selectedTpl.files).map(f => (
                <div key={f} className="flex items-center gap-2 px-2 py-1 rounded bg-[#161b22] border border-[#21262d]">
                  <Code2 className="h-3 w-3 text-[#8b949e] shrink-0" />
                  <span className="text-[10px] text-[#e6edf3] font-mono">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => handleApply(selectedTpl)}
            disabled={applying === selectedTpl.id}
            className="w-full py-2 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {applying === selectedTpl.id ? (
              <><div className="h-3 w-3 border border-white/30 border-t-white rounded-full animate-spin" />Applying…</>
            ) : applied === selectedTpl.id ? (
              <><Check className="h-3 w-3" />Applied!</>
            ) : (
              <><Sparkles className="h-3 w-3" />Apply Template</>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <Layers className="h-3.5 w-3.5 text-[#8b949e]" />
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest flex-1">Environment Templates</span>
        <Package className="h-3.5 w-3.5 text-[#484f58]" />
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <p className="text-[10px] text-[#484f58] px-1 pb-1">Quick-start with a production-ready project scaffold</p>
        {TEMPLATES.map(tpl => (
          <div
            key={tpl.id}
            className="border border-[#21262d] rounded-lg overflow-hidden hover:border-[#30363d] transition-colors cursor-pointer group"
            onClick={() => { setSelected(tpl.id); setTab("detail"); }}>
            <div className={`h-10 bg-gradient-to-r ${tpl.color} flex items-center px-3 gap-2`}>
              <span className="text-white">{tpl.icon}</span>
              <span className="text-white text-xs font-semibold flex-1">{tpl.name}</span>
              <ChevronRight className="h-3.5 w-3.5 text-white/60 group-hover:text-white transition-colors" />
            </div>
            <div className="p-2 bg-[#161b22]">
              <p className="text-[10px] text-[#8b949e] mb-1.5">{tpl.description}</p>
              <div className="flex flex-wrap gap-1">
                {tpl.tags.map(t => (
                  <span key={t} className="text-[9px] px-1 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#1f6feb]/20">{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export type { Template };
