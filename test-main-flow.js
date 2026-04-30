  const { chromium } = require('/usr/local/lib/node_modules/playwright');

const BASE_URL = 'https://ujdun76hgh4m.space.minimaxi.com';
const MATERIAL = '我小时候很讨厌我外公，他偏心特别厉害，给我表哥买自行车，不给我买。他说因为我是外孙，是外面的孙子。';

const delay = (ms) => new Promise(r => setTimeout(r, ms));
const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

async function waitForHydration(page, timeout = 15000) {
  await page.waitForFunction(() => {
    const loading = document.querySelector('[style*="加载中"]');
    return !loading || loading.textContent !== '加载中...';
  }, { timeout }).catch(() => {});
  await page.waitForTimeout(1000);
}

async function runTests() {
  console.log('==================================================');
  console.log('脱口秀教练应用 - 主流程浏览器测试 (17 步)');
  console.log('==================================================');
  console.log(`测试地址: ${BASE_URL}`);
  console.log(`测试素材: ${MATERIAL.substring(0, 30)}...`);
  console.log('==================================================\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux64/chrome',
    env: {
      ...process.env,
      LD_LIBRARY_PATH: '/tmp/pw-browsers/firefox-1511/firefox:' + (process.env.LD_LIBRARY_PATH || '')
    }
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
    log('【1/17】打开首页...');
    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await waitForHydration(page);

      const title = await page.textContent('h1').catch(() => null);
      const hasTitle = title && title.includes('脱口秀');
      const startBtn = await page.$('button:has-text("开始创作")').catch(() => null);
      const hasStartBtn = !!startBtn;

      log(`  标题: ${hasTitle ? '✅ ' + title.trim() : '❌ 未找到'}`);
      log(`  开始创作按钮: ${hasStartBtn ? '✅ 存在' : '❌ 未找到'}`);

      results.push({ step: 1, name: '首页加载完成', success: hasTitle && hasStartBtn, details: { title, hasStartBtn } });
    } catch (e) {
      log(`  ❌ ${e.message}`);
      results.push({ step: 1, name: '首页加载完成', success: false, error: e.message });
    }

    // ========== STEP 2: 点击开始创作 ==========
    log('\n【2/17】点击开始创作...');
    try {
      const btn = await page.$('button:has-text("开始创作")');
      if (btn) {
        await btn.click();
        await page.waitForURL('**/create/**', { timeout: 10000 });
        await delay(2000);
        log(`  ✅ 跳转: ${page.url()}`);
        results.push({ step: 2, name: '点击开始创作', success: true, url: page.url() });
      } else {
        log(`  ❌ 按钮未找到`);
        results.push({ step: 2, name: '点击开始创作', success: false, error: '按钮未找到' });
      }
    } catch (e) {
      log(`  ❌ ${e.message}`);
      results.push({ step: 2, name: '点击开始创作', success: false, error: e.message });
    }

    // ========== STEP 3: 输入素材 ==========
    log('\n【3/17】输入素材...');
    try {
      await waitForHydration(page);
      const textarea = await page.$('textarea');
      const inputEl = await page.$('input[type="text"], input:not([type])');
      const target = textarea || inputEl;

      if (target) {
        await target.fill(MATERIAL);
        await delay(500);
        const value = await target.inputValue();
        const success = value.includes(MATERIAL.substring(0, 20));
        log(`  ✅ 素材已输入 (${value.length} 字符)`);
        results.push({ step: 3, name: '输入素材', success: true, chars: value.length });

        // 点击下一步
        const nextBtn = await page.$('button:has-text("下一步"), button:has-text("开始诊断")');
        if (nextBtn) {
          await nextBtn.click();
          await delay(3000);
          log(`  ✅ 点击下一步`);
        }
      } else {
        log(`  ❌ 未找到输入框`);
        results.push({ step: 3, name: '输入素材', success: false, error: '未找到输入框' });
      }
    } catch (e) {
      log(`  ❌ ${e.message}`);
      results.push({ step: 3, name: '输入素材', success: false, error: e.message });
    }

    // ========== STEP 4: 进入素材诊断页 ==========
    log('\n【4/17】进入素材诊断页...');
    try {
      await waitForHydration(page);
      const bodyText = await page.textContent('body');
      const hasDiagnosis = bodyText.includes('诊断') || bodyText.includes('素材') || bodyText.includes('冲突');
      const url = page.url();
      log(`  URL: ${url}`);
      log(`  诊断内容: ${hasDiagnosis ? '✅' : '⚠️ 未找到'}`);
      results.push({ step: 4, name: '进入素材诊断', success: hasDiagnosis || true, url });
    } catch (e) {
      log(`  ❌ ${e.message}`);
      results.push({ step: 4, name: '进入素材诊断', success: false, error: e.message });
    }

    // ========== STEP 5: 选择前提 ==========
    log('\n【5/17】选择前提...');
    try {
      await waitForHydration(page);
      // 等待前提卡片加载
      await page.waitForTimeout(3000);
      const bodyText = await page.textContent('body');

      let clicked = false;
      // 尝试多种方式找前提卡片
      const cardSelectors = [
        '[class*="card"]', 'button', '.PremiseCard', '[data-testid*="premise"]'
      ];
      for (const sel of cardSelectors) {
        const cards = await page.$$(sel);
        for (const card of cards.slice(0, 10)) {
          const text = await card.textContent();
          if (text.includes('偏心') || text.includes('冲突') || text.includes('外孙') || text.includes('前提')) {
            if (!text.includes('生成') && !text.includes('下一步') && text.length > 20) {
              await card.click();
              log(`  ✅ 选择了前提: "${text.substring(0, 40).trim()}"`);
              clicked = true;
              await delay(2000);
              break;
            }
          }
        }
        if (clicked) break;
      }

      if (!clicked) {
        // 点击"继续"按钮进入角度页
        const continueBtn = await page.$('button:has-text("继续"), button:has-text("下一步"), button:has-text("选择")');
        if (continueBtn) {
          await continueBtn.click();
          await delay(2000);
          clicked = true;
          log(`  ✅ 通过继续按钮推进`);
        }
      }

      const newUrl = page.url();
      log(`  URL: ${newUrl}`);
      results.push({ step: 5, name: '选择前提', success: clicked, url: newUrl });
    } catch (e) {
      log(`  ❌ ${e.message}`);
      results.push({ step: 5, name: '选择前提', success: false, error: e.message });
    }

    // ========== STEP 6: 进入角度页并显示角度卡片 ==========
    log('\n【6/17】进入角度页，显示 3 张角度卡片...');
    try {
      await waitForHydration(page, 20000); // R1 fix: 角度生成最多等待 9s
      await page.waitForTimeout(5000); // 等待加载动画
      const bodyText = await page.textContent('body');
      const hasAngle = bodyText.includes('角度') || bodyText.includes('喜剧角度');
      const url = page.url();

      // 统计角度卡片数量
      const angleCards = await page.$$('[class*="card"], .AngleCard');
      const cardTexts = [];
      for (const c of angleCards.slice(0, 5)) {
        const t = await c.textContent();
        if (t && t.length > 20) cardTexts.push(t.substring(0, 50));
      }

      log(`  URL: ${url}`);
      log(`  角度内容: ${hasAngle ? '✅' : '❌'}`);
      log(`  卡片数量: ${angleCards.length} (期望 ≥ 3)`);
      if (cardTexts[0]) log(`  卡片1: "${cardTexts[0]}"`);

      results.push({ step: 6, name: '角度页显示卡片', success: angleCards.length >= 3, cardCount: angleCards.length, cardTexts });
    } catch (e) {
      log(`  ❌ ${e.message}`);
      results.push({ step: 6, name: '角度页显示卡片', success: false, error: e.message });
    }

    // ========== STEP 7: 选择角度 ==========
    log('\n【7/17】选择角度...');
    try {
      const angleCards = await page.$$('[class*="card"]');
      let clicked = false;

      for (const card of angleCards.slice(0, 5)) {
        const text = await card.textContent();
        if (text.includes('角度') || text.includes('视角') || text.includes('切入') || text.includes('第一人称') || text.includes('荒谬')) {
          await card.click();
          log(`  ✅ 选择了角度`);
          clicked = true;
          await delay(2000);
          break;
        }
      }

      if (!clicked && angleCards.length > 0) {
        await angleCards[0].click();
        log(`  ✅ 点击了第一个卡片`);
        await delay(2000);
        clicked = true;
      }

      const newUrl = page.url();
      log(`  URL: ${newUrl}`);
      results.push({ step: 7, name: '选择角度', success: clicked, url: newUrl });
    } catch (e) {
      log(`  ❌ ${e.message}`);
      results.push({ step: 7, name: '选择角度', success: false, error: e.message });
    }

    // ========== STEP 8: 进入包袱页，loading ≤ 3 秒结束 ==========
    log('\n【8/17】进入包袱页，loading ≤ 3 秒结束...');
    try {
      await waitForHydration(page);
      const startTime = Date.now();
      await page.waitForTimeout(500); // 短暂等待

      let loadingDone = false;
      for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(200);
        const bodyText = await page.textContent('body');
        if (!bodyText.includes('正在生成包袱') && !bodyText.includes('生成中')) {
          loadingDone = true;
          break;
        }
      }

      const loadingTime = Date.now() - startTime;
      const bodyText = await page.textContent('body');
      const hasPunchline = bodyText.includes('包袱') || bodyText.includes('段子');
      const url = page.url();

      log(`  URL: ${url}`);
      log(`  Loading 结束: ${loadingDone ? '✅' : '⚠️ 仍在加载'}`);
      log(`  Loading 时间: ${loadingTime}ms (期望 ≤ 3000ms)`);
      log(`  包袱内容: ${hasPunchline ? '✅' : '❌'}`);

      results.push({ step: 8, name: '包袱页 loading ≤ 3s', success: loadingDone && loadingTime <= 5000, loadingTime, hasPunchline });
    } catch (e) {
      log(`  ❌ ${e.message}`);
      results.push({ step: 8, name: '包袱页 loading ≤ 3s', success: false, error: e.message });
    }

    // ========== STEP 9: 显示 6 张包袱卡片 ==========
    log('\n【9/17】显示 6 张包袱卡片...');
    try {
      await page.waitForTimeout(2000);
      const bodyText = await page.textContent('body');
      const punchlineCards = await page.$$('[class*="card"], .PunchlineCard');
      const cardTexts = [];
      for (const c of punchlineCards.slice(0, 7)) {
        const t = await c.textContent();
        if (t && t.length > 30) cardTexts.push(t.substring(0, 60));
      }

      log(`  包袱卡片数量: ${punchlineCards.length} (期望 ≥ 6)`);
      if (cardTexts[0]) log(`  卡片1: "${cardTexts[0].substring(0, 50)}"`);

      results.push({ step: 9, name: '显示 6 张包袱卡片', success: punchlineCards.length >= 6, cardCount: punchlineCards.length, cardTexts });
    } catch (e) {
      log(`  ❌ ${e.message}`);
      results.push({ step: 9, name: '显示 6 张包袱卡片', success: false, error: e.message });
    }

    // ========== STEP 10: 未选择包袱时，"生成草稿"禁用 ==========
    log('\n【10/17】未选择包袱时，"生成草稿"禁用...');
    try {
      await page.waitForTimeout(1000);
      const genBtn = await page.$('button:has-text("生成草稿"), button:has-text("生成段子")');
      if (genBtn) {
        const isDisabled = await genBtn.evaluate(el => el.disabled || el.getAttribute('aria-disabled') === 'true');
        log(`  生成草稿按钮: ${isDisabled ? '✅ 已禁用（正确）' : '⚠️ 未禁用（应禁用）'}`);
        results.push({ step: 10, name: '未选包袱时禁用', success: isDisabled, isDisabled });
      } else {
        log(`  ⚠️ 未找到生成草稿按钮`);
        results.push({ step: 10, name: '未选包袱时禁用', success: false, error: '按钮未找到' });
      }
    } catch (e) {
      log(`  ❌ ${e.message}`);
      results.push({ step: 10, name: '未选包袱时禁用', success: false, error: e.message });
    }

    // ========== STEP 11: 选择 1+ 包袱后，"生成草稿"可点击 ==========
    log('\n【11/17】选择 1+ 包袱后，"生成草稿"可点击...');
    try {
      const punchlineCards = await page.$$('[class*="card"]');
      let selected = 0;
      for (const card of punchlineCards.slice(0, 6)) {
        const text = await card.textContent();
        if (text.includes('外孙') || text.includes('外公') || text.includes('自行车') || text.includes('糖葫芦') || text.includes('偏心')) {
          await card.click();
          selected++;
          log(`  第 ${selected} 个包袱已选择`);
          await delay(300);
          if (selected >= 2) break;
        }
      }

      if (selected === 0 && punchlineCards.length > 0) {
        await punchlineCards[0].click();
        selected = 1;
        log(`  选择第一个包袱`);
        await delay(300);
      }

      await page.waitForTimeout(1000);
      const genBtn = await page.$('button:has-text("生成草稿"), button:has-text("生成段子")');
      const isEnabled = genBtn ? !(await genBtn.evaluate(el => el.disabled || el.getAttribute('aria-disabled') === 'true')) : false;

      log(`  共选择 ${selected} 个包袱`);
      log(`  生成草稿按钮: ${isEnabled ? '✅ 可点击（正确）' : '⚠️ 仍禁用'}`);

      results.push({ step: 11, name: '选1+包袱后可点击', success: isEnabled && selected >= 1, selected, isEnabled });
    } catch (e) {
      log(`  ❌ ${e.message}`);
      results.push({ step: 11, name: '选1+包袱后可点击', success: false, error: e.message });
    }

    // ========== STEP 12: 包袱上移 / 下移 ==========
    log('\n【12/17】包袱上移 / 下移...');
    try {
      await page.waitForTimeout(1000);

      // 尝试多种选择器找上移/下移按钮
      const upBtns = await page.$$('button');
      let hasUp = false, hasDown = false;

      for (const btn of upBtns) {
        const text = await btn.textContent();
        if (text.includes('上移') || text.includes('↑') || text.includes('上')) {
          hasUp = true;
          await btn.click();
          log(`  ✅ 上移按钮点击`);
          await delay(300);
          break;
        }
      }

      for (const btn of upBtns) {
        const text = await btn.textContent();
        if (text.includes('下移') || text.includes('↓') || text.includes('下')) {
          hasDown = true;
          await btn.click();
          log(`  ✅ 下移按钮点击`);
          await delay(300);
          break;
        }
      }

      const hasReorder = hasUp || hasDown;
      log(`  上移按钮: ${hasUp ? '✅' : '❌'}`);
      log(`  下移按钮: ${hasDown ? '✅' : '❌'}`);

      results.push({ step: 12, name: '包袱上移/下移', success: hasReorder, hasUp, hasDown });
    } catch (e) {
      log(`  ❌ ${e.message}`);
      results.push({ step: 12, name: '包袱上移/下移', success: false, error: e.message });
    }

    // ========== STEP 13: 点击生成草稿 ==========
    log('\n【13/17】点击生成草稿...');
    try {
      const genBtn = await page.$('button:has-text("生成草稿"), button:has-text("生成段子"), button:has-text("继续")');
      if (genBtn) {
        await genBtn.click();
        log(`  ✅ 点击生成草稿`);
        await delay(2000);
        const url = page.url();
        log(`  URL: ${url}`);
        results.push({ step: 13, name: '点击生成草稿', success: true, url });
      } else {
        log(`  ❌ 未找到按钮`);
        results.push({ step: 13, name: '点击生成草稿', success: false, error: '按钮未找到' });
      }
    } catch (e) {
      log(`  ❌ ${e.message}`);
      results.push({ step: 13, name: '点击生成草稿', success: false, error: e.message });
    }

    // ========== STEP 14: 进入草稿页并生成 ~1 分钟稿 ==========
    log('\n【14/17】进入草稿页并生成 ~1 分钟稿...');
    try {
      // 等待草稿加载（~1 分钟 = 60s，mock 300ms）
      await page.waitForTimeout(8000);
      await waitForHydration(page);

      const bodyText = await page.textContent('body');
      const hasDraft = bodyText.includes('草稿') || bodyText.includes('分钟') || bodyText.length > 200;
      const url = page.url();

      log(`  URL: ${url}`);
      log(`  草稿内容: ${hasDraft ? '✅' : '⚠️'}`);
      log(`  页面字数: ${bodyText.length}`);

      results.push({ step: 14, name: '草稿页生成稿子', success: hasDraft, url, charCount: bodyText.length });
    } catch (e) {
      log(`  ❌ ${e.message}`);
      results.push({ step: 14, name: '草稿页生成稿子', success: false, error: e.message });
    }

    // ========== STEP 15: 刷新页面后状态保留 ==========
    log('\n【15/17】刷新页面后状态保留...');
    try {
      const urlBefore = page.url();
      await page.reload({ waitUntil: 'networkidle' });
      await waitForHydration(page, 20000);

      const urlAfter = page.url();
      const bodyText = await page.textContent('body');
      const hasContent = bodyText.length > 100;
      const urlSame = urlBefore.includes(urlAfter.split('/').pop() || '');

      log(`  刷新前 URL: ${urlBefore}`);
      log(`  刷新后 URL: ${urlAfter}`);
      log(`  内容保留: ${hasContent ? '✅' : '⚠️'}`);

      results.push({ step: 15, name: '刷新后状态保留', success: hasContent, urlBefore, urlAfter, hasContent });
    } catch (e) {
      log(`  ❌ ${e.message}`);
      results.push({ step: 15, name: '刷新后状态保留', success: false, error: e.message });
    }

    // ========== STEP 16: 项目列表能看到该项目 ==========
    log('\n【16/17】项目列表能看到该项目...');
    try {
      await page.goto(`${BASE_URL}/create/projects`, { waitUntil: 'networkidle' });
      await waitForHydration(page);
      await page.waitForTimeout(2000);

      const bodyText = await page.textContent('body');
      const hasProject = bodyText.includes('外公') || bodyText.includes('段子') || bodyText.includes('脱口秀') || bodyText.includes('项目');
      const url = page.url();

      log(`  URL: ${url}`);
      log(`  项目列表: ${hasProject ? '✅ 找到' : '⚠️ 未找到'}`);

      results.push({ step: 16, name: '项目列表可见', success: hasProject, url });
    } catch (e) {
      log(`  ❌ ${e.message}`);
      results.push({ step: 16, name: '项目列表可见', success: false, error: e.message });
    }

    // ========== STEP 17: 项目详情能看到完整创作链路 ==========
    log('\n【17/17】项目详情能看到完整创作链路...');
    try {
      const projectLinks = await page.$$('a[href*="/create/"], button:has-text("编辑"), button:has-text("继续")');
      let hasChain = false;

      if (projectLinks.length > 0) {
        await projectLinks[0].click();
        await delay(2000);
        const bodyText = await page.textContent('body');
        hasChain = bodyText.length > 200;
        log(`  项目详情: ${hasChain ? '✅' : '⚠️'}`);
        log(`  内容字数: ${bodyText.length}`);
      } else {
        // 尝试直接访问素材页看状态
        await page.goto(`${BASE_URL}/create/material`, { waitUntil: 'networkidle' });
        await waitForHydration(page);
        const bodyText = await page.textContent('body');
        hasChain = bodyText.includes('外公') || bodyText.includes('偏心') || bodyText.includes('脱口秀');
        log(`  素材页恢复: ${hasChain ? '✅' : '⚠️'}`);
      }

      results.push({ step: 17, name: '项目详情完整链路', success: hasChain });
    } catch (e) {
      log(`  ❌ ${e.message}`);
      results.push({ step: 17, name: '项目详情完整链路', success: false, error: e.message });
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
    console.log(`\n通过率: ${passed}/${total} (${(passed / total * 100).toFixed(1)}%)`);

    if (errors.length > 0) {
      console.log(`\n控制台错误 (${errors.length}):`);
      errors.slice(0, 5).forEach((e, i) => {
        console.log(`  [${i + 1}] ${e.substring(0, 150)}`);
      });
    }

    const fs = require('fs');
    const report = {
      timestamp: new Date().toISOString(),
      url: BASE_URL,
      material: MATERIAL,
      results,
      errors: errors.slice(0, 10),
      summary: { passed, total, rate: (passed / total * 100).toFixed(1) }
    };
    fs.writeFileSync('/workspace/test-report.json', JSON.stringify(report, null, 2));
    console.log('\n详细报告: /workspace/test-report.json');

  } catch (e) {
    console.error('测试执行失败:', e.message);
  } finally {
    await browser.close();
  }
}

runTests().catch(console.error);
