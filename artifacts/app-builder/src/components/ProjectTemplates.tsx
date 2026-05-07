import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProjectTemplate {
  id: string;
  emoji: string;
  name: string;
  tagline: string;
  category: string;
  tags: string[];
  stack: string;
  complexity: "Simple" | "Medium" | "Complex";
  prompt: string;
}

const TEMPLATES: ProjectTemplate[] = [
  // ── SaaS ──────────────────────────────────────────────────────────────────
  {
    id: "saas-crm",
    emoji: "🤝",
    name: "CRM Dashboard",
    tagline: "Manage leads, deals, and customers with a full pipeline view",
    category: "SaaS",
    tags: ["CRM", "Sales", "Pipeline"],
    stack: "React + Node.js + PostgreSQL",
    complexity: "Complex",
    prompt: "Build me a full CRM (Customer Relationship Management) web app. It should have: a leads pipeline with drag-and-drop Kanban columns (New → Contacted → Qualified → Proposal → Won/Lost), a contacts database with search and filters, a deals tracker with value and probability, activity feed with notes and calls log, dashboard with conversion rates and revenue charts, and email integration. Dark professional UI.",
  },
  {
    id: "saas-pm",
    emoji: "📋",
    name: "Project Manager",
    tagline: "Jira-style task board with sprints, issues, and team tracking",
    category: "SaaS",
    tags: ["Tasks", "Agile", "Team"],
    stack: "React + Node.js + PostgreSQL",
    complexity: "Complex",
    prompt: "Build a project management tool like Jira. Features: Kanban board with drag-and-drop, Sprint planning, issue tracker with priority/status/assignee, Gantt chart timeline view, team member management, project analytics dashboard, comments and file attachments on issues, and a notification system. Dark GitHub-inspired design.",
  },
  {
    id: "saas-invoice",
    emoji: "💰",
    name: "Invoice & Billing",
    tagline: "Create invoices, track payments, and manage clients",
    category: "SaaS",
    tags: ["Finance", "Invoicing", "Clients"],
    stack: "React + Node.js + PostgreSQL",
    complexity: "Medium",
    prompt: "Build an invoice and billing SaaS app. Features: create and send professional PDF invoices, client management with contact info and payment history, recurring billing and subscriptions, payment tracking (paid/unpaid/overdue), dashboard with revenue charts and outstanding amounts, expense tracking, tax calculation, and export to CSV/PDF. Clean minimal design.",
  },
  {
    id: "saas-analytics",
    emoji: "📊",
    name: "Analytics Platform",
    tagline: "Real-time event tracking and dashboards for any product",
    category: "SaaS",
    tags: ["Analytics", "Charts", "Data"],
    stack: "React + Node.js + PostgreSQL + Chart.js",
    complexity: "Complex",
    prompt: "Build a product analytics platform like Mixpanel. Features: event tracking dashboard with real-time charts, user journey funnel analysis, retention cohort tables, custom dashboard builder (drag to arrange widgets), user segmentation with filters, A/B test results tracker, geographic heatmap, and CSV/PDF report export. Dark data-dense UI.",
  },
  {
    id: "saas-lms",
    emoji: "🎓",
    name: "Learning Platform",
    tagline: "Online courses with video lessons, quizzes, and certificates",
    category: "SaaS",
    tags: ["Education", "Courses", "LMS"],
    stack: "React + Node.js + PostgreSQL",
    complexity: "Complex",
    prompt: "Build an online learning management system (LMS). Features: course creation with sections and video lessons, student enrollment and progress tracking, interactive quizzes with auto-grading, completion certificates (PDF), discussion forum per course, instructor dashboard with earnings and student analytics, student dashboard with enrolled courses and progress bars. Clean modern e-learning design.",
  },
  {
    id: "saas-booking",
    emoji: "📅",
    name: "Booking System",
    tagline: "Appointment scheduling for any service business",
    category: "SaaS",
    tags: ["Scheduling", "Calendar", "Appointments"],
    stack: "React + Node.js + PostgreSQL",
    complexity: "Medium",
    prompt: "Build an appointment booking system like Calendly. Features: service provider sets available slots and working hours, clients book appointments from a public page, email confirmation and reminders, calendar view of all bookings, cancellation and rescheduling, dashboard with upcoming appointments and statistics, multiple service types with different durations and prices. Clean white/blue design.",
  },

  // ── E-commerce ────────────────────────────────────────────────────────────
  {
    id: "ecom-store",
    emoji: "🛒",
    name: "Online Store",
    tagline: "Full e-commerce shop with cart, checkout, and order management",
    category: "E-commerce",
    tags: ["Shop", "Products", "Orders"],
    stack: "React + Node.js + PostgreSQL",
    complexity: "Complex",
    prompt: "Build a full-featured e-commerce store. Features: product catalog with categories and filters, product pages with image gallery and reviews, shopping cart with quantity management, checkout with address form and payment, order history and tracking, admin panel with product management (CRUD), inventory tracking, discount codes, and sales dashboard. Modern clean design.",
  },
  {
    id: "ecom-marketplace",
    emoji: "🏪",
    name: "Digital Marketplace",
    tagline: "Multi-vendor platform for selling digital products",
    category: "E-commerce",
    tags: ["Marketplace", "Vendors", "Digital"],
    stack: "React + Node.js + PostgreSQL",
    complexity: "Complex",
    prompt: "Build a digital marketplace platform like Gumroad. Features: creators can list digital products (ebooks, templates, code, designs), product pages with previews, secure purchase and instant download, creator dashboards with sales analytics, buyer library of all purchases, review and rating system, search and category browsing, featured products section. Clean creator-focused design.",
  },
  {
    id: "ecom-food",
    emoji: "🍕",
    name: "Food Delivery App",
    tagline: "Restaurant ordering with real-time delivery tracking",
    category: "E-commerce",
    tags: ["Food", "Delivery", "Restaurant"],
    stack: "React + Node.js + PostgreSQL",
    complexity: "Complex",
    prompt: "Build a food delivery app like DoorDash. Features: restaurant listings with menus and photos, add to cart and customize items (extras, notes), checkout with address and payment, real-time order status (Placed → Preparing → On the way → Delivered), order history, restaurant owner dashboard for managing orders and menu items, search and cuisine filter. Mobile-first dark design.",
  },
  {
    id: "ecom-subscription",
    emoji: "📦",
    name: "Subscription Box",
    tagline: "Monthly subscription service with box curation and member portal",
    category: "E-commerce",
    tags: ["Subscription", "Box", "Recurring"],
    stack: "React + Node.js + PostgreSQL + Stripe",
    complexity: "Medium",
    prompt: "Build a subscription box service app. Features: subscription plan picker (monthly/quarterly/annual), member portal to manage subscription (pause, cancel, change plan), curated box reveal page with this month's products, shipment tracking integration, billing history, referral program with discount codes, admin dashboard to manage boxes and members. Clean branded design.",
  },

  // ── Social ────────────────────────────────────────────────────────────────
  {
    id: "social-platform",
    emoji: "🌐",
    name: "Social Network",
    tagline: "Twitter/X-style posts, follows, likes, and real-time feed",
    category: "Social",
    tags: ["Social", "Feed", "Posts"],
    stack: "React + Node.js + PostgreSQL",
    complexity: "Complex",
    prompt: "Build a social media platform. Features: user registration and profiles with avatar and bio, post creation with text/images/links, infinite scroll feed (following + explore), like, comment, and repost, follow/unfollow system, trending topics and hashtags, real-time notifications, direct messages, profile edit page, and media gallery. Dark Twitter-inspired design.",
  },
  {
    id: "social-forum",
    emoji: "💬",
    name: "Community Forum",
    tagline: "Reddit-style discussion boards with voting and moderation",
    category: "Social",
    tags: ["Forum", "Community", "Discussion"],
    stack: "React + Node.js + PostgreSQL",
    complexity: "Medium",
    prompt: "Build a community forum platform like Reddit. Features: topic boards/communities, post creation with rich text and images, nested comments with upvote/downvote, community rules and moderation tools, hot/new/top sorting, user karma and badges, search across posts and comments, user profiles with post history, moderator controls. Dark Reddit-inspired design.",
  },
  {
    id: "social-dating",
    emoji: "❤️",
    name: "Dating App",
    tagline: "Profile swiping, matching, and in-app messaging",
    category: "Social",
    tags: ["Dating", "Matching", "Profiles"],
    stack: "React + Node.js + PostgreSQL",
    complexity: "Complex",
    prompt: "Build a dating app like Tinder. Features: profile creation with photos, age, bio, and interests, swipe UI (left to pass, right to like), mutual match detection with notification, match list and chat messaging, profile preferences filter (age range, distance, gender), discovery feed with cards, super like feature, settings page. Mobile-first dark/pink design.",
  },

  // ── Tools ─────────────────────────────────────────────────────────────────
  {
    id: "tool-notion",
    emoji: "📝",
    name: "Note-taking App",
    tagline: "Notion-style docs with rich editor, databases, and workspaces",
    category: "Tools",
    tags: ["Notes", "Docs", "Workspace"],
    stack: "React + Node.js + PostgreSQL",
    complexity: "Complex",
    prompt: "Build a Notion-like note-taking app. Features: block-based rich text editor (headings, bullets, code, images, tables, toggles), sidebar with nested page hierarchy, drag-and-drop page reordering, database views (table, board, gallery), inline database queries and filters, page sharing with view/edit permissions, search across all pages, dark/light mode, and emoji page icons.",
  },
  {
    id: "tool-kanban",
    emoji: "🗂",
    name: "Kanban Board",
    tagline: "Visual task management with drag-and-drop and team collaboration",
    category: "Tools",
    tags: ["Kanban", "Tasks", "Productivity"],
    stack: "React + Node.js + PostgreSQL",
    complexity: "Medium",
    prompt: "Build a Kanban board app like Trello. Features: multiple boards per workspace, columns with drag-and-drop cards, card detail modal with description/checklist/attachments/due date/labels, board members with permission levels, activity log on each card, card search and filter by label/member, board background customization, archive and restore cards. Dark clean design.",
  },
  {
    id: "tool-url-shortener",
    emoji: "🔗",
    name: "URL Shortener",
    tagline: "Shorten links with click analytics and QR codes",
    category: "Tools",
    tags: ["Links", "Analytics", "QR"],
    stack: "React + Node.js + PostgreSQL",
    complexity: "Simple",
    prompt: "Build a URL shortener service like Bitly. Features: paste a long URL and get a short link instantly, custom slug option, click analytics with charts (clicks over time, countries, devices, referrers), QR code generation for each link, link management dashboard with all your links, expiry date option, password-protected links, and bulk import via CSV. Minimal clean design.",
  },
  {
    id: "tool-ai-writer",
    emoji: "✍️",
    name: "AI Writing Assistant",
    tagline: "AI-powered document editor with tone, rewrite, and summarize",
    category: "Tools",
    tags: ["AI", "Writing", "Editor"],
    stack: "React + Node.js + Anthropic AI",
    complexity: "Medium",
    prompt: "Build an AI writing assistant app. Features: rich text document editor, AI sidebar with actions (rewrite, improve, summarize, translate, expand, shorten, change tone), multiple tone options (professional, casual, friendly, formal), document templates (email, report, blog post, social post), version history, export to PDF/Word, folder organization for documents, word count and readability score. Clean minimal design.",
  },
  {
    id: "tool-password",
    emoji: "🔐",
    name: "Password Manager",
    tagline: "Securely store and auto-fill passwords with vault encryption",
    category: "Tools",
    tags: ["Security", "Passwords", "Vault"],
    stack: "React + Node.js + PostgreSQL",
    complexity: "Medium",
    prompt: "Build a password manager app like 1Password. Features: encrypted vault for storing passwords, username, and URLs, master password authentication, strong password generator with customization, browser-style search and filter by category (social, banking, work, etc.), one-click copy for username/password, password strength indicator, secure notes storage, vault export (encrypted), and 2FA authenticator codes. Dark secure-feeling design.",
  },

  // ── Portfolio ─────────────────────────────────────────────────────────────
  {
    id: "portfolio-dev",
    emoji: "💻",
    name: "Developer Portfolio",
    tagline: "Stunning portfolio with projects, blog, and GitHub integration",
    category: "Portfolio",
    tags: ["Portfolio", "Dev", "Blog"],
    stack: "React + Vite + Tailwind CSS",
    complexity: "Simple",
    prompt: "Build a stunning developer portfolio website. Features: animated hero section with name, title, and typewriter effect, about section with skills grid (with icons), projects showcase with live demo and GitHub links, GitHub contribution graph integration, blog section with markdown posts, dark/light mode, contact form, social links, smooth scroll animations with Framer Motion, and mobile-responsive. Dark GitHub-inspired aesthetic.",
  },
  {
    id: "portfolio-agency",
    emoji: "🎨",
    name: "Design Agency Site",
    tagline: "Premium agency website with portfolio, services, and case studies",
    category: "Portfolio",
    tags: ["Agency", "Design", "Marketing"],
    stack: "React + Vite + Tailwind CSS + Framer Motion",
    complexity: "Medium",
    prompt: "Build a premium design agency website. Features: bold animated hero with video/canvas background, services section with hover cards, portfolio/case studies with full-page project showcases, team section with photos and bios, client testimonials carousel, animated statistics counter, contact form with service selection, smooth page transitions, and a blog. Premium dark-with-gold or bold gradient aesthetic.",
  },
  {
    id: "portfolio-blog",
    emoji: "✏️",
    name: "Blog Platform",
    tagline: "Full-featured blog with editor, categories, and newsletter",
    category: "Portfolio",
    tags: ["Blog", "Writing", "Newsletter"],
    stack: "React + Node.js + PostgreSQL",
    complexity: "Medium",
    prompt: "Build a personal blog platform like Medium. Features: rich text post editor with images and code blocks, category and tag system, post listing page with search and filter, individual post page with estimated reading time, related posts, comment section, newsletter subscription with email list, author profile page, social sharing buttons, RSS feed, dark/light mode, and SEO-friendly URLs. Clean editorial design.",
  },

  // ── Games ─────────────────────────────────────────────────────────────────
  {
    id: "game-quiz",
    emoji: "🧠",
    name: "Quiz Game",
    tagline: "Multiplayer trivia with categories, leaderboards, and live rooms",
    category: "Games",
    tags: ["Quiz", "Trivia", "Multiplayer"],
    stack: "React + Node.js + WebSockets",
    complexity: "Medium",
    prompt: "Build a multiplayer quiz game app like Kahoot. Features: create quiz rooms with a join code, host controls the game pace, multiple choice questions with a 30-second timer, real-time score updates as players answer, category selection (Science, History, Sports, Tech, etc.), final leaderboard with animations, player streaks and correct/wrong answer feedback, single-player practice mode, and 5000+ questions database. Fun colorful design.",
  },
  {
    id: "game-chess",
    emoji: "♟️",
    name: "Chess App",
    tagline: "Playable chess with AI opponent, move history, and analysis",
    category: "Games",
    tags: ["Chess", "AI", "Board Game"],
    stack: "React + chess.js + Stockfish",
    complexity: "Medium",
    prompt: "Build a chess web app. Features: fully playable chess board with legal move validation, AI opponent at multiple difficulty levels using Stockfish, drag-and-drop piece movement with move highlighting, move history in algebraic notation, game analysis mode (best move suggestions), clock/timer for both players, game save and replay, puzzle mode (solve in N moves), dark/light board themes. Elegant dark design.",
  },
];

const CATEGORIES = ["All", "SaaS", "E-commerce", "Social", "Tools", "Portfolio", "Games"] as const;
type Category = (typeof CATEGORIES)[number];

const COMPLEXITY_COLOR: Record<string, string> = {
  Simple: "text-green-400 bg-green-500/10 border-green-400/20",
  Medium: "text-yellow-400 bg-yellow-500/10 border-yellow-400/20",
  Complex: "text-rose-400 bg-rose-500/10 border-rose-400/20",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (template: ProjectTemplate) => void;
}

export default function ProjectTemplates({ open, onClose, onSelect }: Props) {
  const [category, setCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return TEMPLATES.filter(t => {
      const matchCat = category === "All" || t.category === category;
      const q = search.toLowerCase();
      const matchSearch = !q || t.name.toLowerCase().includes(q) || t.tagline.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [category, search]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-[#0d1117] border-t border-white/[0.09] rounded-t-3xl"
            style={{ height: "90dvh" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 pb-3 shrink-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-400" />
                  <h2 className="text-base font-bold text-white">Project Templates</h2>
                  <span className="text-[10px] bg-purple-500/20 border border-purple-400/25 text-purple-300 px-1.5 py-0.5 rounded-full font-bold">{TEMPLATES.length}</span>
                </div>
                <p className="text-[11px] text-white/40 mt-0.5">Pick a template — AI will plan it with you before building</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pb-3 shrink-0">
              <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 h-9">
                <Search size={13} className="text-white/30 shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search templates…"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-white/30 hover:text-white/60">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 pb-3 shrink-0">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border",
                    category === cat
                      ? "bg-purple-500/25 border-purple-400/40 text-purple-300"
                      : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.08]"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Template grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-white/25 space-y-2">
                  <Search size={28} />
                  <p className="text-sm">No templates match "{search}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {filtered.map((t, i) => (
                    <motion.button
                      key={t.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onSelect(t)}
                      className="flex flex-col text-left bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3 gap-2.5 hover:bg-white/[0.06] hover:border-white/[0.14] transition-all group active:scale-[0.97]"
                    >
                      {/* Emoji + complexity */}
                      <div className="flex items-start justify-between">
                        <span className="text-2xl leading-none">{t.emoji}</span>
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", COMPLEXITY_COLOR[t.complexity])}>
                          {t.complexity}
                        </span>
                      </div>

                      {/* Name + tagline */}
                      <div className="space-y-0.5">
                        <p className="text-[13px] font-bold text-white leading-tight">{t.name}</p>
                        <p className="text-[11px] text-white/45 leading-relaxed line-clamp-2">{t.tagline}</p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {t.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[9px] text-white/35 bg-white/[0.05] px-1.5 py-0.5 rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Stack + CTA */}
                      <div className="flex items-center justify-between pt-0.5 border-t border-white/[0.06]">
                        <p className="text-[9px] text-white/25 truncate flex-1 mr-1">{t.stack.split(" + ")[0]}</p>
                        <ChevronRight size={12} className="text-white/20 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Plan Mode hint footer */}
            <div className="shrink-0 px-4 py-3 border-t border-white/[0.06] bg-[#0d1117]">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Sparkles size={12} className="text-purple-400" />
                </div>
                <p className="text-[11px] text-white/35 leading-relaxed">
                  Selecting a template enables <span className="text-white/60 font-semibold">Plan Mode</span> — AI proposes features, asks for your input, then builds.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
