// ==UserScript==
// @name         知乎极简净化 - 纯净专注与全回答展开终极版
// @namespace    https://github.com/zhengjiewen666/zhihu-minimal-clean
// @version      6.0
// @description  知乎首页纯白极简（隐藏瀑布流与侧栏，保留顶栏核心导航）；清空搜索框默认词；隐藏下拉热搜；搜索结果页100%放行并优化排版；问答与专栏页自动展开所有回答并沉浸居中；全站去广告与悬浮客服
// @author       zhengjiewen666
// @match        *://*.zhihu.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  // 1. 页面类型精准判定
  const getPageType = () => {
    const url = window.location.href;
    const path = window.location.pathname;

    const isHome = (path === '/' || path === '/explore' || path === '/follow' || path === '/hot') && !path.startsWith('/search');
    const isQuestion = url.includes('/question/');
    const isArticle = window.location.hostname === 'zhuanlan.zhihu.com' || path.startsWith('/p/');
    const isSearch = path.startsWith('/search') || url.includes('/search?');

    return { isHome, isQuestion, isArticle, isSearch };
  };

  // 给根节点标记当前页面类型
  const markPage = () => {
    const { isHome, isQuestion, isArticle, isSearch } = getPageType();
    if (isHome) {
      document.documentElement.setAttribute('data-zhihu-clean', 'home');
      document.body?.classList.add('is-zhihu-home');
    } else {
      document.documentElement.removeAttribute('data-zhihu-clean');
      document.body?.classList.remove('is-zhihu-home');
    }
  };

  markPage();

  // 2. 全局高优先级 CSS 注入（零白屏/零闪烁）
  const css = `
    /* ==========================================================================
       1. 全站通用清理：广告、横幅与右下角悬浮客服
       ========================================================================== */
    .Card.Banner,
    .Pc-card,
    .Pc-word,
    .Banner,
    div[class*="Banner-link"],
    div[class*="Commercial"],
    /* 移除右下角悬浮的客服小猫按钮与无用卡片 */
    div[class*="CornerButton"],
    div[class*="FloatCard"],
    div:has(> .css-1yuhvjn),
    .css-1yuhvjn,
    /* 隐藏页脚帮助中心、备案号等 */
    .Footer,
    footer {
        display: none !important;
    }

    /* 隐藏搜索框下拉菜单里的热搜与推荐，保留搜索历史 */
    .AutoComplete-group:not(:has(.AutoComplete-historyTitle)),
    div[class*="AutoComplete-trending"],
    div[class*="hot-list"],
    div[class*="HotSearch"] {
        display: none !important;
    }

    /* ==========================================================================
       2. 仅在首页生效：极简纯白看板模式（对齐截图效果）
       ========================================================================== */
    /* 隐藏首页瀑布流与右侧推荐模块 */
    html[data-zhihu-clean="home"] .Topstory-container,
    html[data-zhihu-clean="home"] main.App-main > div:not(.AppHeader),
    html[data-zhihu-clean="home"] .GlobalWrite,
    html[data-zhihu-clean="home"] .TopstoryMain {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
    }

    /* 隐藏首页顶栏的大蓝色知乎 Logo，保持导航栏与搜索框清爽对齐 */
    html[data-zhihu-clean="home"] a[aria-label="知乎"],
    html[data-zhihu-clean="home"] .AppHeader-inner > a:first-child {
        display: none !important;
    }

    /* 首页主体背景保持纯白统一 */
    html[data-zhihu-clean="home"] body {
        background: #ffffff !important;
    }

    /* ==========================================================================
       3. 问答页 & 专栏页：沉浸式阅读布局居中
       ========================================================================== */
    .Question-sideColumn,
    .Post-SideColumn,
    .GlobalSideBar {
        display: none !important;
    }

    .Question-mainColumn,
    .Post-Main {
        margin: 0 auto !important;
        float: none !important;
        width: 100% !important;
        max-width: 1000px !important;
    }

    /* ==========================================================================
       4. 搜索结果页：排版居中优化
       ========================================================================== */
    .Search-container,
    .SearchMain {
        max-width: 1100px !important;
        margin: 0 auto !important;
    }
  `;

  if (typeof GM_addStyle !== 'undefined') {
    GM_addStyle(css);
  } else {
    const style = document.createElement('style');
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  // 3. 自动展开问题的所有回答与正文（解除折叠）
  const autoExpandQuestion = () => {
    const { isQuestion } = getPageType();
    if (!isQuestion) return;

    // 点击“阅读全文”或“展开更多”按钮
    const expandButtons = document.querySelectorAll('.Button.QuestionRichText-more, .QuestionRichText-more, .QuestionMainAction');
    expandButtons.forEach(btn => {
      try {
        btn.click();
      } catch (e) {}
    });
  };

  // 4. 清理输入框推荐词（placeholder）
  const cleanInputPlaceholder = () => {
    const searchInputs = document.querySelectorAll('input.SearchBar-input, form input[type="text"], input[type="search"]');
    searchInputs.forEach(input => {
      if (input.placeholder && input.placeholder !== '') {
        input.placeholder = '';
      }
      input.setAttribute('placeholder', '');
    });
  };

  // 5. 专栏与问答页营销卡片深度清洗
  const cleanArticleAndQuestionPromo = () => {
    const { isQuestion, isArticle } = getPageType();
    if (!isQuestion && !isArticle) return;

    // 移除侧栏营销卡片（关于作者、相关推荐等）
    document.querySelectorAll('.Card').forEach(card => {
      const text = card.textContent || '';
      if (text.includes('关于作者') || text.includes('相关推荐')) {
        card.style.setProperty('display', 'none', 'important');
      }
    });

    document.querySelectorAll('[data-za-detail-view-path-module="RightSideBar"]').forEach(el => {
      el.remove();
    });
  };

  // 6. 核心循环调度巡查
  const patrol = () => {
    markPage();
    cleanInputPlaceholder();

    const { isQuestion, isArticle } = getPageType();
    if (isQuestion) {
      autoExpandQuestion();
      cleanArticleAndQuestionPromo();
    } else if (isArticle) {
      cleanArticleAndQuestionPromo();
    }
  };

  // 7. 高性能响应式调度：DOMContentLoaded + MutationObserver + 定时保底
  document.addEventListener('DOMContentLoaded', () => {
    patrol();

    // 延时再次自动展开以应对异步渲染
    setTimeout(autoExpandQuestion, 800);
    setTimeout(autoExpandQuestion, 2000);

    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(() => {
          patrol();
          scheduled = false;
        });
      }
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  });

  // 初次启动
  patrol();
  setInterval(patrol, 400);
})();
