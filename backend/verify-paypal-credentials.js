// PayPal 凭证验证脚本
// 用于检测凭证是 Sandbox 还是 Live
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const mode = process.env.PAYPAL_MODE || 'sandbox';

console.log('\n🔍 PayPal 凭证验证\n');
console.log('='.repeat(50));

if (!clientId || !clientSecret) {
  console.error('❌ 错误：未找到 PAYPAL_CLIENT_ID 或 PAYPAL_CLIENT_SECRET');
  console.log('\n请检查 backend/.env.local 文件是否正确配置。\n');
  process.exit(1);
}

console.log(`📋 配置信息：`);
console.log(`   PAYPAL_MODE: ${mode}`);
console.log(`   PAYPAL_CLIENT_ID: ${clientId.substring(0, 20)}...`);
console.log(`   PAYPAL_CLIENT_SECRET: ${clientSecret.substring(0, 10)}...`);
console.log('\n' + '='.repeat(50) + '\n');

// 测试 Sandbox API
async function testSandboxAPI() {
  console.log('🧪 测试 1: 尝试使用 Sandbox API');

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Sandbox API 调用成功！');
      console.log(`   ✅ 获得 Access Token: ${data.access_token.substring(0, 20)}...`);
      return { success: true, isSandbox: true };
    } else {
      const error = await response.json();
      console.log('   ❌ Sandbox API 调用失败');
      console.log(`   错误信息: ${error.error_description || error.error || response.statusText}`);
      return { success: false, isSandbox: false };
    }
  } catch (err) {
    console.log('   ❌ Sandbox API 请求异常:', err.message);
    return { success: false, isSandbox: false };
  }
}

// 测试 Live API
async function testLiveAPI() {
  console.log('\n🧪 测试 2: 尝试使用 Live API');

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Live API 调用成功！');
      console.log(`   ✅ 获得 Access Token: ${data.access_token.substring(0, 20)}...`);
      return { success: true, isLive: true };
    } else {
      const error = await response.json();
      console.log('   ❌ Live API 调用失败');
      console.log(`   错误信息: ${error.error_description || error.error || response.statusText}`);
      return { success: false, isLive: false };
    }
  } catch (err) {
    console.log('   ❌ Live API 请求异常:', err.message);
    return { success: false, isLive: false };
  }
}

// 创建测试订单并检查返回的 URL
async function testOrderCreation() {
  console.log('\n🧪 测试 3: 创建测试订单并检查跳转 URL');

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  // 使用 Sandbox API（因为 PAYPAL_MODE=sandbox）
  const apiBase = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  try {
    // 先获取 token
    const tokenResponse = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      console.log('   ❌ 无法获取 Access Token');
      return { success: false };
    }

    const { access_token } = await tokenResponse.json();

    // 创建测试订单
    const orderResponse = await fetch(`${apiBase}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: '10.00',
          },
          description: 'Test Order - Credential Verification',
        }],
        application_context: {
          return_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel',
        },
      }),
    });

    if (!orderResponse.ok) {
      console.log('   ❌ 创建订单失败');
      const error = await orderResponse.json();
      console.log('   错误信息:', error);
      return { success: false };
    }

    const order = await orderResponse.json();
    const approveLink = order.links?.find(link => link.rel === 'approve');

    if (approveLink) {
      console.log('   ✅ 订单创建成功！');
      console.log(`   订单 ID: ${order.id}`);
      console.log(`   跳转 URL: ${approveLink.href}`);

      // 检查 URL 类型
      if (approveLink.href.includes('sandbox.paypal.com')) {
        console.log('   ✅ 跳转到 Sandbox 环境 (sandbox.paypal.com)');
        return { success: true, isSandbox: true, url: approveLink.href };
      } else if (approveLink.href.includes('www.paypal.com')) {
        console.log('   ⚠️  跳转到 Live 环境 (www.paypal.com)');
        return { success: true, isLive: true, url: approveLink.href };
      }
    }

    return { success: false };
  } catch (err) {
    console.log('   ❌ 订单创建异常:', err.message);
    return { success: false };
  }
}

// 执行验证
async function verify() {
  const sandboxResult = await testSandboxAPI();
  const liveResult = await testLiveAPI();
  const orderResult = await testOrderCreation();

  console.log('\n' + '='.repeat(50));
  console.log('📊 验证结果总结\n');

  if (sandboxResult.success && !liveResult.success) {
    console.log('✅ 结论: 这是 **Sandbox 凭证**');
    console.log('   - Sandbox API 认证成功');
    console.log('   - Live API 认证失败');
    console.log('   - 配置正确！');

    if (orderResult.isSandbox) {
      console.log('   - 订单跳转到 sandbox.paypal.com ✅');
      console.log('\n🎉 太好了！你的配置完全正确，可以开始测试了！\n');
    } else if (orderResult.isLive) {
      console.log('   - ⚠️  但订单仍跳转到 www.paypal.com');
      console.log('\n这很奇怪，可能是 PayPal API 的缓存问题。');
      console.log('建议：等待几分钟后再试，或联系 PayPal 技术支持。\n');
    }
  } else if (!sandboxResult.success && liveResult.success) {
    console.log('❌ 结论: 这是 **Live（生产）凭证**');
    console.log('   - Sandbox API 认证失败');
    console.log('   - Live API 认证成功');
    console.log('   - ⚠️  配置错误！');

    if (orderResult.isLive) {
      console.log('   - 订单跳转到 www.paypal.com（生产环境）');
    }

    console.log('\n🔧 解决方案：');
    console.log('1. 访问 https://developer.paypal.com/dashboard/');
    console.log('2. 点击顶部的 "Sandbox" 标签页（不是 "Live"）');
    console.log('3. 进入 "Apps & Credentials"');
    console.log('4. 复制 Sandbox 应用的 Client ID 和 Secret');
    console.log('5. 更新 backend/.env.local');
    console.log('6. 重新运行此脚本验证\n');
  } else if (sandboxResult.success && liveResult.success) {
    console.log('⚠️  异常: 凭证同时通过 Sandbox 和 Live 认证');
    console.log('   这通常不应该发生，请检查配置。\n');
  } else {
    console.log('❌ 异常: 凭证无法通过任何 API 认证');
    console.log('   可能的原因：');
    console.log('   - Client ID 或 Secret 输入错误');
    console.log('   - 凭证已被撤销');
    console.log('   - 网络连接问题\n');
  }

  console.log('='.repeat(50) + '\n');
}

verify().catch(err => {
  console.error('验证脚本异常:', err);
  process.exit(1);
});
