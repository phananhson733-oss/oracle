// INPUT: 任意 JSON-LD schema 对象（来自 SEO 生成器）。
// OUTPUT: safeJsonLd —— HTML <script> 安全的 JSON 序列化字符串。
// POS: SEO 静态页 JSON-LD 注入的唯一安全序列化点；防止 </script> 突破型 XSS。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

// JSON.stringify 不转义 `<` / `>` / `&`，含 `</script>` 的字段会突破 <script>
// 标签注入活动标记（构建期静态页存储型 XSS 类）。转义 `<`/`>`/`&` 与行分隔符
// U+2028/U+2029（后者会破坏部分 JSON 解析器）。输出仍是合法 JSON，浏览器内解析回原值。
export const safeJsonLd = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/[\u2028\u2029]/g, (c) => (c === "\u2028" ? "\\u2028" : "\\u2029"));
