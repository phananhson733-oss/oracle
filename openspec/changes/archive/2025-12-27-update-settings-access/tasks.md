<!-- INPUT: 设置入口与资料查看变更实施步骤与验证要求。 -->
<!-- OUTPUT: OpenSpec 任务清单。 -->
<!-- POS: 变更执行清单；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## 1. Navigation
- [x] 1.1 统一桌面端顶部导航标签间距
- [x] 1.2 新增"设置"入口并接入现有设置页面

## 2. Settings page
- [x] 2.1 新增只读用户资料摘要区块（姓名/出生信息/时区/准确度）
- [x] 2.2 更新中英文标签文案

## 3. Validation
- [x] 3.1 桌面冒烟：导航间距一致、设置入口可达、资料摘要可见
- [x] 3.2 运行 `openspec validate update-settings-access --strict`
