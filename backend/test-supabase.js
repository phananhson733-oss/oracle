// 测试 Supabase 连接和数据库表
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 验证 Supabase 配置...\n');
console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : '未配置');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 配置缺失！');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 需要验证的表
const requiredTables = [
  'users',
  'subscriptions',
  'free_usage',
  'purchases',
  'reports',
  'purchase_records',
  'synastry_records',
  'subscription_usage'
];

console.log('📡 测试数据库连接和表结构...\n');

let allTablesExist = true;
const tableStatus = {};

for (const tableName of requiredTables) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    if (error) {
      if (error.code === 'PGRST204' || error.code === 'PGRST205') {
        console.log(`❌ ${tableName} - 表不存在`);
        tableStatus[tableName] = false;
        allTablesExist = false;
      } else {
        console.log(`⚠️  ${tableName} - 查询错误: ${error.message}`);
        tableStatus[tableName] = 'error';
      }
    } else {
      console.log(`✅ ${tableName} - 表存在`);
      tableStatus[tableName] = true;
    }
  } catch (err) {
    console.log(`❌ ${tableName} - 异常: ${err.message}`);
    tableStatus[tableName] = 'exception';
    allTablesExist = false;
  }
}

console.log('\n' + '='.repeat(50));

if (allTablesExist) {
  console.log('\n🎉 所有数据库表验证成功！');
  console.log('✅ Supabase 配置完全正确！');
  console.log('\n可以启动后端服务了：npm run dev');
} else {
  console.log('\n⚠️  部分表缺失，请检查迁移脚本是否完全执行');
  console.log('\n缺失的表：');
  for (const [table, status] of Object.entries(tableStatus)) {
    if (status === false) {
      console.log(`  - ${table}`);
    }
  }
}

console.log('');
