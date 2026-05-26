// Cloudflare Worker 核心处理逻辑 - src/index.js

export default {
  async fetch(request, env, ctx) {
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "admin123"; // 优先读取 KV 绑定的环境变量密码，默认 fallback
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };

    // 处理跨域预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);

    // GET /api/link - 从 KV 中读取 "MAIN_LINK"
    if (request.method === "GET" && url.pathname === "/api/link") {
      try {
        const data = await env.CONFIG_KV.get("MAIN_LINK");
        if (!data) {
          // 若 KV 数据库为空，返回默认赛博朋克风中国占位数据
          const defaultData = {
            title: "点击",
            url: "https://gordoncyber.net",
            link_type: "web",
            bg_image: "",
            accent_color: "#00f0ff"
          };
          return new Response(JSON.stringify(defaultData), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            },
            status: 200,
          });
        }
        return new Response(data, {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          },
          status: 200,
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "服务器内部故障: " + err.message }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          },
          status: 500,
        });
      }
    }

    // POST /api/link - 验证密码后覆写存入 KV CONFIG_KV
    if (request.method === "POST" && url.pathname === "/api/link") {
      try {
        const body = await request.json();
        const { title, url: targetUrl, link_type, bg_image, accent_color, password } = body;

        // 校验基本必填内容
        if (!title || !targetUrl || !link_type) {
          return new Response(JSON.stringify({ error: "参数校验失败：缺少关键必填字段信息" }), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            },
            status: 400,
          });
        }

        // 验证系统管理员权限密码
        if (password !== ADMIN_PASSWORD) {
          return new Response(JSON.stringify({ error: "鉴权失败：系统管理员访问密码不匹配" }), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            },
            status: 401,
          });
        }

        const dataToStore = { 
          title, 
          url: targetUrl, 
          link_type, 
          bg_image: bg_image || "", 
          accent_color: accent_color || "#00f0ff" 
        };
        await env.CONFIG_KV.put("MAIN_LINK", JSON.stringify(dataToStore));

        return new Response(JSON.stringify({ success: true, data: dataToStore }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          },
          status: 200,
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "存储写入失败: " + err.message }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          },
          status: 500,
        });
      }
    }

    // 默认 404
    return new Response(JSON.stringify({ error: "接口访问路径不存在" }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 404,
    });
  }
};
