// 测试积分充值完整流程
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const API_BASE = 'http://localhost:3001/api';

// 模拟前端请求（需要真实的 JWT token）
const TEST_TOKEN = process.env.TEST_JWT_TOKEN || '';

console.log('\n🧪 测试积分充值完整流程\n');
console.log('='.repeat(60));

if (!TEST_TOKEN) {
  console.log('\n⚠️  未提供测试 Token');
  console.log('请在 backend/.env.local 中添加：');
  console.log('TEST_JWT_TOKEN=你的JWT_Token\n');
  console.log('或者跳过认证测试，直接调用 PayPal API...\n');
}

async function testCreateOrder() {
  console.log('\n📦 Step 1: 测试创建积分购买订单\n');

  const packageId = 'credits_300';
  const successUrl = 'https://example.com/payment/credits-success';
  const cancelUrl = 'https://example.com/cancel';

  try {
    const response = await fetch(`${API_BASE}/paypal/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(TEST_TOKEN && { 'Authorization': `Bearer ${TEST_TOKEN}` }),
      },
      body: JSON.stringify({
        packageId,
        successUrl,
        cancelUrl,
      }),
    });

    console.log(`状态码: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ 订单创建成功！');
      console.log(`   订单 ID: ${data.orderId}`);
      console.log(`   跳转 URL: ${data.approvalUrl}\n`);

      // 检查 URL 类型
      if (data.approvalUrl.includes('sandbox.paypal.com')) {
        console.log('✅ 正确：跳转到 Sandbox 环境');
        console.log('   URL 包含: sandbox.paypal.com\n');
      } else if (data.approvalUrl.includes('www.paypal.com')) {
        console.log('❌ 错误：跳转到 Live 环境');
        console.log('   URL 包含: www.paypal.com');
        console.log('   这说明后端使用的凭证可能有问题\n');
      }

      return { success: true, data };
    } else {
      const error = await response.json().catch(() => ({}));
      console.log('❌ 订单创建失败');
      console.log(`   错误: ${error.error || response.statusText}`);

      if (response.status === 401) {
        console.log('\n💡 提示：需要提供有效的 JWT Token');
        console.log('   请先登录应用，然后从浏览器开发者工具中获取 Token：');
        console.log('   1. 打开应用并登录');
        console.log('   2. 按 F12 打开开发者工具');
        console.log('   3. Application → Local Storage → accessToken');
        console.log('   4. 复制 Token 到 backend/.env.local：TEST_JWT_TOKEN=...\n');
      } else if (response.status === 503) {
        console.log('\n💡 提示：PayPal 服务未配置');
        console.log('   请检查 backend/.env.local 中的 PayPal 配置\n');
      }

      return { success: false };
    }
  } catch (err) {
    console.log('❌ 请求异常:', err.message);

    if (err.code === 'ECONNREFUSED') {
      console.log('\n💡 提示：后端服务未启动');
      console.log('   请在 backend 目录运行: npm run dev\n');
    }

    return { success: false };
  }
}

async function testBackendStatus() {
  console.log('\n🔍 Step 0: 检查后端服务状态\n');

  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
    });

    if (response.ok) {
      console.log('✅ 后端服务正常运行');
      console.log(`   API Base: ${API_BASE}\n`);
      return true;
    } else {
      console.log('❌ 后端服务响应异常');
      console.log(`   状态码: ${response.status}\n`);
      return false;
    }
  } catch (err) {
    console.log('❌ 无法连接到后端服务');
    console.log(`   错误: ${err.message}`);

    if (err.code === 'ECONNREFUSED') {
      console.log('\n💡 提示：后端服务未启动或端口错误');
      console.log('   1. 确认后端正在运行: cd backend && npm run dev');
      console.log('   2. 检查端口配置: backend/.env.local 中的 PORT=3001\n');
    }

    return false;
  }
}

async function testPayPalConfig() {
  console.log('\n⚙️  Step 2: 检查后端 PayPal 配置\n');

  try {
    const response = await fetch(`${API_BASE}/paypal/pricing`, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ PayPal 配置正常');
      console.log('   积分套餐:');
      data.credits.forEach(pkg => {
        console.log(`      ${pkg.credits} 积分 - ${pkg.display}`);
      });
      console.log('');
      return true;
    } else if (response.status === 503) {
      console.log('❌ PayPal 服务未配置');
      console.log('   请检查 backend/.env.local 中的：');
      console.log('   - PAYPAL_CLIENT_ID');
      console.log('   - PAYPAL_CLIENT_SECRET');
      console.log('   - PAYPAL_MODE=sandbox\n');
      return false;
    } else {
      console.log('❌ 获取配置失败');
      console.log(`   状态码: ${response.status}\n`);
      return false;
    }
  } catch (err) {
    console.log('❌ 请求异常:', err.message);
    return false;
  }
}

// 执行测试
async function runTests() {
  const backendOk = await testBackendStatus();
  if (!backendOk) {
    console.log('='.repeat(60));
    console.log('\n❌ 后端服务不可用，测试终止\n');
    return;
  }

  const configOk = await testPayPalConfig();
  if (!configOk) {
    console.log('='.repeat(60));
    console.log('\n❌ PayPal 配置有问题，测试终止\n');
    return;
  }

  const orderResult = await testCreateOrder();

  console.log('='.repeat(60));

  if (orderResult.success) {
    console.log('\n✅ 测试通过！\n');
    console.log('📝 下一步：');
    console.log('   1. 在应用中登录');
    console.log('   2. 点击"充值积分"按钮');
    console.log('   3. 选择套餐并点击"PayPal 支付"');
    console.log('   4. 应该跳转到 sandbox.paypal.com\n');
  } else {
    console.log('\n❌ 测试失败\n');
    console.log('📝 请根据上述提示排查问题\n');
  }
}

runTests().catch(err => {
  console.error('\n测试脚本异常:', err);
  process.exit(1);
});
