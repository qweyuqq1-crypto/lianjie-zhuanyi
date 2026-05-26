// 预览全栈仿真后端服务器 - server.ts
import express from "express";
import path from "path";
import fs from "fs";

const app = express();
const PORT = 3000;

const DB_PATH = path.join(process.cwd(), "db_link.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// 标准内建 JSON 解析器
app.use(express.json());

// 获取动态 CONFIG_KV 仿真文件数据
function loadConfigData() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const dataStr = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(dataStr);
    }
  } catch (err) {
    console.warn("读取虚拟 db_link.json 失败，使用系统默认值:", err);
  }
  // 默认占位数据
  return {
    title: "点击",
    url: "https://github.com",
    link_type: "web",
    bg_image: "",
    accent_color: "#00f0ff"
  };
}

// 保存动态 CONFIG_KV 仿真文件数据
function saveConfigData(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("保存虚拟配置文件存储失败", err);
  }
}

// ---------------- API 接口拦截处理器 ----------------

// GET /api/link - 返回当前绑定的链入数据
app.get("/api/link", (req, res) => {
  const data = loadConfigData();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json(data);
});

// POST /api/link - 验证系统安全密码后覆写入临时配置数据库
app.post("/api/link", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { title, url, link_type, bg_image, accent_color, password } = req.body;

  if (!title || !url || !link_type) {
    return res.status(400).json({ error: "参数校验失败：缺少关键必填字段信息" });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "鉴权失败：系统管理员访问密码不匹配" });
  }

  const updatedConfig = { 
    title, 
    url, 
    link_type, 
    bg_image: bg_image || "", 
    accent_color: accent_color || "#00f0ff" 
  };
  saveConfigData(updatedConfig);

  res.json({ success: true, data: updatedConfig });
});

// ---------------- 静态资源路由响应分配器 ----------------

// 顶层渲染入口分配
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "admin.html"));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "admin.html"));
});

// 全站静态资源路由映射
app.use(express.static(path.join(process.cwd(), "public")));

// 路由保底处理器
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[SYS] 赛博朋克控制中枢已成功在宿主端口 ${PORT} 启动运行`);
});
