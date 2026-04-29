// 自动保存验证测试
const { chromium } = require('playwright');

const BASE_URL = 'https://sy52f8wsa395.space.minimaxi.com';

async function waitForHydration(page) {
  // 等待 hydration 完成
  await page.waitForFunction(() => {
    const loading = document.querySelector('[style*="加载中"]');
    return !loading || loading.textContent !== '加载中...';
  }, { timeout: 10000 }).catch(() => {});
  
  // 额外等待
  await page.waitForTimeout(2000);
}

async function testMaterialAutoSave() {
  console.log('\n=== 测试 1: 素材页自动保存 ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 访问素材页
    console.log('步骤1: 访问素材页...');
    await page.goto(`${BASE_URL}/create/material`, { waitUntil: 'networkidle' });
    await waitForHydration(page);
    
    // 检查页面加载状态
    const content = await page.content();
    const hasTextarea = content.includes('textarea') || await page.locator('textarea').count() > 0;
    console.log(`  - 文本框存在: ${hasTextarea ? '✅' : '❌'}`);
    
    if (hasTextarea) {
      // 2. 输入文本
      console.log('步骤2: 输入测试文本...');
      const testText = '我小时候很讨厌我外公，他偏心特别厉害，给我表哥买自行车，不给我买。';
      await page.locator('textarea').fill(testText);
      console.log('  - 已输入文本');
      
      // 3. 检查 localStorage
      const stored = await page.evaluate(() => {
        const data = localStorage.getItem('standup-project-v1');
        return data ? JSON.parse(data) : null;
      });
      
      if (stored && stored.state && stored.state.currentProject) {
        console.log(`  - localStorage 保存: ✅`);
        console.log(`    - 项目状态: ${stored.state.currentProject.status}`);
        console.log(`    - 素材内容: ${stored.state.currentProject.material?.content?.substring(0, 30)}...`);
      } else {
        console.log('  - localStorage 保存: ❌ 未找到数据');
      }
      
      // 4. 刷新页面
      console.log('步骤3: 刷新页面...');
      await page.reload({ waitUntil: 'networkidle' });
      await waitForHydration(page);
      
      // 5. 检查内容是否保留
      const textareaValue = await page.locator('textarea').inputValue();
      const preserved = textareaValue.includes('外公');
      console.log(`步骤4: 内容保留: ${preserved ? '✅' : '❌'}`);
      if (preserved) {
        console.log(`    保留内容: "${textareaValue.substring(0, 50)}..."`);
      }
      
      return preserved;
    } else {
      console.log('  ⚠️ 无法找到文本框，尝试查找其他输入元素...');
      const inputElements = await page.locator('input, [contenteditable]').count();
      console.log(`  找到 ${inputElements} 个可输入元素`);
      return false;
    }
    
  } catch (error) {
    console.log(`  ❌ 测试失败: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

async function testDiagnosisStep() {
  console.log('\n=== 测试 2: 诊断页自动保存 ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 设置初始状态
    console.log('步骤1: 设置初始状态（模拟完成素材步骤）...');
    await page.goto(`${BASE_URL}/create/material`, { waitUntil: 'networkidle' });
    await waitForHydration(page);
    
    // 设置 localStorage 模拟已有素材
    await page.evaluate(() => {
      const projectData = {
        state: {
          currentProject: {
            id: 'test-proj-1',
            title: '测试项目',
            status: 'in_progress',
            material: {
              content: '我小时候很讨厌我外公，他偏心特别厉害'
            },
            diagnosis: null,
            premiseId: null,
            angleId: null,
            selectedPunchlineIds: [],
            finalScript: null,
            wordCountFinal: null,
            durationFinal: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          currentStep: 'diagnosis',
          draftMaterial: null
        },
        version: 0
      };
      localStorage.setItem('standup-project-v1', JSON.stringify(projectData));
    });
    
    // 访问诊断页
    console.log('步骤2: 访问诊断页...');
    await page.reload({ waitUntil: 'networkidle' });
    await waitForHydration(page);
    
    // 检查页面内容
    const content = await page.content();
    const hasDiagnosis = content.includes('诊断') || content.includes('conflict') || content.includes('诊断');
    console.log(`  - 诊断内容加载: ${hasDiagnosis ? '✅' : '❌'}`);
    
    // 检查导航是否正确
    const currentUrl = page.url();
    console.log(`  - 当前URL: ${currentUrl}`);
    
    return hasDiagnosis;
    
  } catch (error) {
    console.log(`  ❌ 测试失败: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

async function testMobileViewport() {
  console.log('\n=== 测试 6: 移动端 375px 渲染 ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 } // iPhone X 尺寸
  });
  const page = await context.newPage();
  
  try {
    console.log('步骤1: 设置 375px 视口...');
    
    console.log('步骤2: 访问首页...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitForHydration(page);
    
    // 检查视口宽度
    const viewport = page.viewportSize();
    console.log(`  - 当前视口: ${viewport.width}x${viewport.height}`);
    
    // 检查按钮是否在视口内
    const button = page.locator('button').first();
    const buttonBox = await button.boundingBox();
    
    if (buttonBox) {
      console.log(`  - 按钮位置: x=${buttonBox.x.toFixed(0)}, y=${buttonBox.y.toFixed(0)}`);
      console.log(`  - 按钮尺寸: ${buttonBox.width.toFixed(0)}x${buttonBox.height.toFixed(0)}`);
      
      const fitsInViewport = buttonBox.x >= 0 && 
                              buttonBox.y >= 0 && 
                              buttonBox.x + buttonBox.width <= viewport.width;
      console.log(`  - 按钮在视口内: ${fitsInViewport ? '✅' : '❌'}`);
      
      return fitsInViewport;
    }
    
    return false;
    
  } catch (error) {
    console.log(`  ❌ 测试失败: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

async function testDarkMode() {
  console.log('\n=== 测试 7: 暗黑模式渲染 ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    colorScheme: 'dark'
  });
  const page = await context.newPage();
  
  try {
    console.log('步骤1: 启用暗黑模式...');
    
    console.log('步骤2: 访问首页...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitForHydration(page);
    
    // 检查背景色
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log(`  - 背景色: ${bgColor}`);
    
    // 检查 CSS 变量
    const cssVars = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return {
        background: styles.getPropertyValue('--background'),
        foreground: styles.getPropertyValue('--foreground')
      };
    });
    console.log(`  - CSS 变量 --background: ${cssVars.background || '(默认)'}`);
    console.log(`  - CSS 变量 --foreground: ${cssVars.foreground || '(默认)'}`);
    
    // 检查是否应用了深色样式
    const isDark = bgColor === 'rgb(10, 10, 10)' || bgColor === 'rgb(0, 0, 0)' || bgColor === 'rgb(26, 26, 26)';
    console.log(`  - 暗黑模式生效: ${isDark ? '✅' : '❌ (可能未完整实现)'}`);
    
    return isDark;
    
  } catch (error) {
    console.log(`  ❌ 测试失败: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

async function testKeyboardNavigation() {
  console.log('\n=== 测试 8: 键盘导航 ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('步骤1: 访问素材页...');
    await page.goto(`${BASE_URL}/create/material`, { waitUntil: 'networkidle' });
    await waitForHydration(page);
    
    // 检查是否有焦点管理
    const focusableElements = await page.evaluate(() => {
      const focusable = document.querySelectorAll(
        'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
      );
      return focusable.length;
    });
    console.log(`  - 可聚焦元素数量: ${focusableElements}`);
    
    // 检查是否有 skip-link 或辅助功能属性
    const hasA11y = await page.evaluate(() => {
      return {
        hasAriaLabels: document.querySelectorAll('[aria-label]').length > 0,
        hasRole: document.querySelectorAll('[role]').length > 0,
        hasTabIndex: document.querySelectorAll('[tabindex="0"]').length > 0
      };
    });
    console.log(`  - aria-label 属性: ${hasA11y.hasAriaLabels ? '✅' : '❌'}`);
    console.log(`  - role 属性: ${hasA11y.hasRole ? '✅' : '❌'}`);
    console.log(`  - tabindex=0 元素: ${hasA11y.hasTabIndex ? '✅' : '❌'}`);
    
    // 测试 Tab 键导航
    console.log('步骤2: 测试 Tab 键导航...');
    await page.keyboard.press('Tab');
    const focused1 = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`  - 首次 Tab 后焦点元素: ${focused1}`);
    
    return focusableElements > 0;
    
  } catch (error) {
    console.log(`  ❌ 测试失败: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('======================================');
  console.log('自动保存验证测试 - Playwright');
  console.log('======================================');
  
  const results = {};
  
  // 执行测试
  results['素材页自动保存'] = await testMaterialAutoSave();
  results['诊断页状态'] = await testDiagnosisStep();
  results['移动端375px'] = await testMobileViewport();
  results['暗黑模式'] = await testDarkMode();
  results['键盘导航'] = await testKeyboardNavigation();
  
  console.log('\n======================================');
  console.log('测试结果汇总');
  console.log('======================================');
  
  for (const [test, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  }
  
  const passCount = Object.values(results).filter(Boolean).length;
  console.log(`\n通过: ${passCount}/${Object.keys(results).length}`);
}

main().catch(console.error);
