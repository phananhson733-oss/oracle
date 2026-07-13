<!-- INPUT: 品牌标识派生静态图（导航/页脚小图与结构化数据 logo）。 -->
<!-- OUTPUT: brand 目录说明与文件清单。 -->
<!-- POS: public/brand 目录索引文档；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：public/brand

架构概要
- 存放由 `public/logo.png` 派生的压缩品牌图。
- 运行时 UI 使用小尺寸 logo，结构化数据使用 512px logo，避免请求原始大图。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录 brand 目录架构与文件清单。
- logo-mark-32.png｜地位：品牌小图｜功能：1x 导航/页脚图标候选。
- logo-mark-64.png｜地位：品牌小图｜功能：2x 导航/页脚图标默认资源。
- logo-mark-128.png｜地位：品牌小图｜功能：高密度备用品牌图。
- logo-mark-192.png｜地位：品牌小图｜功能：PWA/分享场景备用品牌图。
- logo-schema-512.png｜地位：结构化数据品牌图｜功能：Organization / Article publisher logo。

近期更新
- 新增由 `public/logo.png` 压缩派生的 32/64/128/192/512px 品牌图，用于 PageSpeed 图片传输优化。
