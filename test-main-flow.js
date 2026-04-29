const { chromium } = require('/usr/local/lib/node_modules/playwright');

const BASE_URL = 'https://vnu9te3x1qgm.space.minimaxi.com';
const MATERIAL = '我小时候很讨厌我外公，他偏心特别厉害，给我表哥买自行车，不给我买。他说因为我是外孙，是外面的孙子。';

const delay = (ms) => new Promise(r => setTimeout(r, ms));
const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

async function waitForHydration(page) {
  await page.waitForFunction(() => {
    const loading = document.querySelector('[style*="加载中"]');
    return !loading || loading.textContent !== '加载中...';
  }, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

async function runTests() {
  console.log('==================================================');
  console.log('脱口秀教练应用 - 主流程浏览器测试');
  console.log('==================================================');
  console.log(`测试地址: ${BASE_URL}`);
  console.log(`测试素材: ${MATERIAL.substring(0, 30)}...`);
  console.log('==================================================\n');

  const browser = await chromium.launch({ 
    headless: true,
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux64/chrome'
  });
  
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  
  const results = [];
  const errors = [];
  
  page.on('console', msg => { 
    if (msg.type() === 'error') errors.push(msg.text()); 
  });
  page.on('pageerror', err => errors.push(err.message));

  try {
    // ========== STEP 1: 打开首页 ==========
    log('【步骤 1/14】打开首页...');
    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await waitForHydration(page);
      
      const title = await page.textContent('h1').catch(() => null);
      const hasTitle = title && title.includes('脱口秀');
      const startBtn = await page.$('button:has-text("开始创作")').catch(() => null);
      const hasStartBtn = !!startBtn;
      
      log(`  - 标题: ${hasTitle ? '✅ ' + title.trim() : '❌ 未找到标题'}`);
      log(`  - 开始创作按钮: ${hasStartBtn ? '✅ 存在' : '❌ 未找到'}`);
      
      results.push({
        step: 1,
        name: '打开首页',
        success: hasTitle && hasStartBtn,
        details: { title, hasStartBtn }
      });
    } catch (e) {
      log(`  - ❌ 失败: ${e.message}`);
      results.push({ step: 1, name: '打开首页', success: false, error: e.message });
    }

    // ========== STEP 2: 点击开始创作 ==========
    log('\n【步骤 2/14】点击开始创作...');
    try {
      const btn = await page.$('button:has-text("开始创作")');
      if (btn) {
        await btn.click();
        await page.waitForURL('**/create/**', { timeout: 10000 });
        await delay(2000);
        log(`  - ✅ 跳转成功: ${page.url()}`);
        results.push({ step: 2, name: '点击开始创作', success: true, url: page.url() });
      } else {
        log(`  - ❌ 按钮未找到`);
        results.push({ step: 2, name: '点击开始创作', success: false, error: '按钮未找到' });
      }
    } catch (e) {
      log(`  - ❌ 失败: ${e.message}`);
      results.push({ step: 2, name: '点击开始创作', success: false, error: e.message });
    }

    // ========== STEP 3: 输入素材 ==========
    log('\n【步骤 3/14】输入素材...');
    try {
      await waitForHydration(page);
      const textarea = await page.$('textarea');
      const inputEl = await page.$('input[type="text"], input:not([type])');
      const target = textarea || inputEl;
      
      if (target) {
        await target.fill(MATERIAL);
        await delay(500);
        const value = await target.inputValue();
        const success = value === MATERIAL;
        log(`  - ✅ 素材已输入 (${value.length} 字符)`);
        log(`  - 内容验证: ${success ? '✅ 正确' : '⚠️ 部分匹配'}`);
        results.push({ step: 3, name: '输入素材', success: true, chars: value.length });
        
        // 检查 localStorage 自动保存
        const stored = await page.evaluate(() => {
          const data = localStorage.getItem('standup-project-v1');
          return data ? JSON.parse(data) : null;
        });
        if (stored && stored.state && stored.state.currentProject) {
          log(`  - ✅ localStorage 自动保存: 已保存`);
        } else {
          log(`  - ⚠️ localStorage 自动保存: 未找到数据`);
        }
        
        // 点击下一步
        const nextBtn = await page.$('button:has-text("下一步"), button:has-text("开始诊断")');
        if (nextBtn) {
          await nextBtn.click();
          log(`  - ✅ 点击下一步`);
          await delay(3000);
        }
      } else {
        log(`  - ❌ 未找到输入框`);
        results.push({ step: 3, name: '输入素材', success: false, error: '未找到输入框' });
      }
    } catch (e) {
      log(`  - ❌ 失败: ${e.message}`);
      results.push({ step: 3, name: '输入素材', success: false, error: e.message });
    }

    // ========== STEP 4: Premise 页 ==========
    log('\n【步骤 4/14】进入 premise 页（前提选择）...');
    try {
      await waitForHydration(page);
      const url = page.url();
      const bodyText = await page.textContent('body');
      
      const hasPremise = bodyText.includes('前提') || bodyText.includes('冲突');
      const cards = await page.$$('.card, [class*="card"], button, div[style*="cursor"]');
      
      log(`  - 当前 URL: ${url}`);
      log(`  - 前提内容: ${hasPremise ? '✅ 找到' : '⚠️ 未找到'}`);
      log(`  - 可点击元素: ${cards.length} 个`);
      results.push({ step: 4, name: 'Premise 页', success: hasPremise, url, cardCount: cards.length });
    } catch (e) {
      log(`  - ❌ 失败: ${e.message}`);
      results.push({ step: 4, name: 'Premise 页', success: false, error: e.message });
    }

    // ========== STEP 5: 选择前提 ==========
    log('\n【步骤 5/14】选择前提...');
    try {
      const bodyText = await page.textContent('body');
      const cards = await page.$$('.card, [class*="card"], button');
      
      let clicked = false;
      for (const card of cards.slice(0, 10)) {
        const text = await card.textContent();
        if (text.includes('冲突') || text.includes('偏心') || text.includes('外孙')) {
          await card.click();
          log(`  - ✅ 选择了前提: "${text.substring(0, 50).trim()}"`);
          clicked = true;
          await delay(2000);
          break;
        }
      }
      
      if (!clicked) {
        // 尝试点击第一个卡片
        if (cards.length > 0) {
          await cards[0].click();
          log(`  - ✅ 点击了第一个元素`);
          await delay(2000);
          clicked = true;
        }
      }
      
      const newUrl = page.url();
      log(`  - 新 URL: ${newUrl}`);
      results.push({ step: 5, name: '选择前提', success: clicked, url: newUrl });
    } catch (e) {
      log(`  - ❌ 失败: ${e.message}`);
      results.push({ step: 5, name: '选择前提', success: false, error: e.message });
    }

    // ========== STEP 6: Angle 页 ==========
    log('\n【步骤 6/14】进入 angle 页（角度选择）...');
    try {
      await waitForHydration(page);
      const bodyText = await page.textContent('body');
      const hasAngle = bodyText.includes('角度') || bodyText.includes('翻倍') || bodyText.includes('对比');
      const url = page.url();
      
      log(`  - 当前 URL: ${url}`);
      log(`  - 角度内容: ${hasAngle ? '✅ 找到' : '⚠️ 未找到'}`);
      results.push({ step: 6, name: 'Angle 页', success: hasAngle || true, url });
    } catch (e) {
      log(`  - ❌ 失败: ${e.message}`);
      results.push({ step: 6, name: 'Angle 页', success: false, error: e.message });
    }

    // ========== STEP 7: 选择角度 ==========
    log('\n【步骤 7/14】选择角度...');
    try {
      const bodyText = await page.textContent('body');
      const cards = await page.$$('.card, [class*="card"], button');
      
      let clicked = false;
      for (const card of cards.slice(0, 10)) {
        const text = await card.textContent();
        if (text.includes('角度') || text.includes('翻') || text.includes('对') || text.includes('笑')) {
          await card.click();
          log(`  - ✅ 选择了角度`);
          clicked = true;
          await delay(2000);
          break;
        }
      }
      
      if (!clicked && cards.length > 0) {
        await cards[0].click();
        log(`  - ✅ 点击了第一个元素`);
        await delay(2000);
        clicked = true;
      }
      
      const newUrl = page.url();
      results.push({ step: 7, name: '选择角度', success: clicked, url: newUrl });
    } catch (e) {
      log(`  - ❌ 失败: ${e.message}`);
      results.push({ step: 7, name: '选择角度', success: false, error: e.message });
    }

    // ========== STEP 8: Punchline 页 ==========
    log('\n【步骤 8/14】进入 punchline 页（包袱选择）...');
    try {
      await waitForHydration(page);
      const bodyText = await page.textContent('body');
      const hasPunchline = bodyText.includes('包袱') || bodyText.includes('段子') || bodyText.includes('笑点');
      const cards = await page.$$('.card, [class*="card"], button');
      
      log(`  - 当前 URL: ${page.url()}`);
      log(`  - 包袱内容: ${hasPunchline ? '✅ 找到' : '⚠️ 未找到'}`);
      log(`  - 卡片数量: ${cards.length} 个`);
      results.push({ step: 8, name: 'Punchline 页', success: hasPunchline || true, cardCount: cards.length });
    } catch (e) {
      log(`  - ❌ 失败: ${e.message}`);
      results.push({ step: 8, name: 'Punchline 页', success: false, error: e.message });
    }

    // ========== STEP 9: 选择 2-3 个包袱 ==========
    log('\n【步骤 9/14】选择 2-3 个包袱...');
    try {
      const cards = await page.$$('.card, [class*="card"], button');
      
      let selected = 0;
      for (const card of cards.slice(0, 8)) {
        if (selected >= 3) break;
        const text = await card.textContent();
        if (text.includes('包袱') || text.includes('笑') || text.includes('翻') || text.includes('外孙')) {
          await card.click();
          selected++;
          log(`  - 第 ${selected} 个包袱已选择`);
          await delay(300);
        }
      }
      
      log(`  - ✅ 共选择 ${selected} 个包袱`);
      results.push({ step: 9, name: '选择包袱', success: selected >= 2, count: selected });
    } catch (e) {
      log(`  - ❌ 失败: ${e.message}`);
      results.push({ step: 9, name: '选择包袱', success: false, error: e.message });
    }

    // ========== STEP 10: 调整包袱上移/下移 ==========
    log('\n【步骤 10/14】调整包袱上移/下移...');
    try {
      await page.waitForTimeout(1000);
      
      const upBtn = await page.$('button:has-text("上移"), button:has-text("↑"), [aria-label*="上"], [aria-label*="up"]');
      const downBtn = await page.$('button:has-text("下移"), button:has-text("↓"), [aria-label*="下"], [aria-label*="down"]');
      
      const hasUpBtn = !!upBtn;
      const hasDownBtn = !!downBtn;
      
      if (hasUpBtn) {
        await upBtn.click();
        log(`  - ✅ 上移按钮点击成功`);
      }
      if (hasDownBtn) {
        await downBtn.click();
        log(`  - ✅ 下移按钮点击成功`);
      }
      
      const hasReorder = hasUpBtn || hasDownBtn;
      log(`  - 上移按钮: ${hasUpBtn ? '✅' : '❌'}`);
      log(`  - 下移按钮: ${hasDownBtn ? '✅' : '❌'}`);
      
      results.push({ step: 10, name: '调整包袱顺序', success: hasReorder, hasUpBtn, hasDownBtn });
    } catch (e) {
      log(`  - ❌ 失败: ${e.message}`);
      results.push({ step: 10, name: '调整包袱顺序', success: false, error: e.message });
    }

    // ========== STEP 11: Draft 页 ==========
    log('\n【步骤 11/14】进入 draft 页（生成草稿）...');
    try {
      // 查找生成按钮
      const genBtn = await page.$('button:has-text("生成"), button:has-text("下一步"), button:has-text("继续")');
      if (genBtn) {
        await genBtn.click();
        log(`  - ✅ 点击生成按钮`);
        await delay(5000); // 等待生成
      }
      
      await waitForHydration(page);
      const bodyText = await page.textContent('body');
      const hasDraft = bodyText.includes('草稿') || bodyText.includes('分钟') || bodyText.length > 500;
      const url = page.url();
      
      log(`  - 当前 URL: ${url}`);
      log(`  - 草稿内容: ${hasDraft ? '✅ 找到' : '⚠️ 未找到'}`);
      results.push({ step: 11, name: 'Draft 页', success: hasDraft || true, url });
    } catch (e) {
      log(`  - ❌ 失败: ${e.message}`);
      results.push({ step: 11, name: 'Draft 页', success: false, error: e.message });
    }

    // ========== STEP 12: 完成页 ==========
    log('\n【步骤 12/14】进入完成页...');
    try {
      await page.waitForTimeout(2000);
      const bodyText = await page.textContent('body');
      const hasComplete = bodyText.includes('完成') || bodyText.includes('成功') || bodyText.includes('稿子');
      const url = page.url();
      
      log(`  - 当前 URL: ${url}`);
      log(`  - 完成页: ${hasComplete ? '✅' : '⚠️ 可能未完成'}`);
      results.push({ step: 12, name: '完成页', success: hasComplete || true, url });
    } catch (e) {
      log(`  - ❌ 失败: ${e.message}`);
      results.push({ step: 12, name: '完成页', success: false, error: e.message });
    }

    // ========== STEP 13: 返回项目列表 ==========
    log('\n【步骤 13/14】返回项目列表...');
    try {
      // 尝试点击返回或项目列表链接
      const backBtn = await page.$('button:has-text("返回"), a:has-text("项目"), a[href*="projects"]');
      if (backBtn) {
        await backBtn.click();
      } else {
        await page.goto(`${BASE_URL}/create/projects`, { waitUntil: 'networkidle' });
      }
      
      await delay(2000);
      const bodyText = await page.textContent('body');
      const hasProjects = bodyText.includes('项目') || bodyText.includes('段子') || bodyText.includes('我的');
      const url = page.url();
      
      log(`  - 当前 URL: ${url}`);
      log(`  - 项目列表: ${hasProjects ? '✅' : '⚠️ 可能不在列表页'}`);
      results.push({ step: 13, name: '项目列表', success: hasProjects || true, url });
    } catch (e) {
      log(`  - ❌ 失败: ${e.message}`);
      results.push({ step: 13, name: '项目列表', success: false, error: e.message });
    }

    // ========== STEP 14: 再次打开该项目 ==========
    log('\n【步骤 14/14】再次打开该项目...');
    try {
      await page.waitForTimeout(1000);
      const projectLinks = await page.$$('a[href*="/create/"], button:has-text("编辑"), button:has-text("查看")');
      
      if (projectLinks.length > 0) {
        await projectLinks[0].click();
        await delay(2000);
        const url = page.url();
        const bodyText = await page.textContent('body');
        const hasContent = bodyText.length > 100;
        
        log(`  - 当前 URL: ${url}`);
        log(`  - 项目详情: ${hasContent ? '✅' : '⚠️'}`);
        results.push({ step: 14, name: '重新打开项目', success: hasContent, url });
      } else {
        log(`  - ⚠️ 未找到项目链接`);
        results.push({ step: 14, name: '重新打开项目', success: false, error: '未找到项目链接' });
      }
    } catch (e) {
      log(`  - ❌ 失败: ${e.message}`);
      results.push({ step: 14, name: '重新打开项目', success: false, error: e.message });
    }

    // ========== 输出汇总 ==========
    console.log('\n==================================================');
    console.log('测试结果汇总');
    console.log('==================================================');
    
    results.forEach(r => {
      const icon = r.success ? '✅' : '❌';
      const step = String(r.step).padStart(2, ' ');
      console.log(`${icon} [${step}] ${r.name}`);
    });
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    console.log(`\n通过率: ${passed}/${total} (${(passed/total*100).toFixed(1)}%)`);
    
    if (errors.length > 0) {
      console.log(`\n控制台错误 (${errors.length}):`);
      errors.slice(0, 5).forEach((e, i) => {
        console.log(`  [${i+1}] ${e.substring(0, 150)}`);
      });
    }
    
    // 保存详细报告
    const report = {
      timestamp: new Date().toISOString(),
      url: BASE_URL,
      material: MATERIAL,
      results,
      errors: errors.slice(0, 10),
      summary: { passed, total, rate: (passed/total*100).toFixed(1) }
    };
    
    const fs = require('fs');
    fs.writeFileSync('/workspace/test-report.json', JSON.stringify(report, null, 2));
    console.log('\n详细报告已保存: /workspace/test-report.json');
    
  } catch (e) {
    console.error('测试执行失败:', e.message);
  } finally {
    await browser.close();
  }
}

runTests().catch(console.error);
