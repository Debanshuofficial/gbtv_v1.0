/**
 * Gour Bongo TV - News Portal App
 * Powered by Google Sheets
 */

// CONFIGURATION
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSBEEdaawV_WYCyebwSebB-n4eOWPMs2LQgPO8ncdOPh4dejAcNz0XGTqJlhBX1Qx2hB_3aXDJ4S4Yo/pub?gid=0&single=true&output=csv';

const CATEGORIES = [
    'নদীয়া', 'রাজ্য', 'দেশ', 'বিশ্ব',
    'খেলা', 'বিনোদন', 'স্বাস্থ্য', 'প্রযুক্তি'
];

const CATEGORY_MAPPING = {
    'all': 'all',
    'nodiya': 'নদীয়া',
    'rajya': 'রাজ্য',
    'desh': 'দেশ',
    'biswa': 'বিশ্ব',
    'khela': 'খেলা',
    'binodon': 'বিনোদন',
    'swasthya': 'স্বাস্থ্য',
    'projukti': 'প্রযুক্তি',
    'about': 'about',
    'contact': 'contact'
};

// Reverse mapping helper
function getCategoryKey(bengaliName) {
    return Object.keys(CATEGORY_MAPPING).find(key => CATEGORY_MAPPING[key] === bengaliName) || bengaliName;
}

// STATE
let allNews = [];
let currentCategory = 'all';

// DOM ELEMENTS
const heroSlider = document.getElementById('hero-slider');
const contentArea = document.getElementById('content-area');
const navLinks = document.querySelectorAll('.main-nav a, .mobile-nav a');
const marqueeContent = document.getElementById('marquee-content');
const homeView = document.getElementById('home-view');
const contactView = document.getElementById('contact-view');
const articleView = document.getElementById('article-view');
const liveTvSection = document.querySelector('.live-tv-section-start');

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    startClock();
});

async function initApp() {
    try {
        allNews = await fetchSheetData(SHEET_CSV_URL);

        // Initial Render
        renderHero(allNews);
        renderMarquee(allNews);
        renderContent(allNews);

        // Start Auto Scroll
        startHeroAutoScroll();

    } catch (e) {
        console.error('Failed to fetch news:', e);
        contentArea.innerHTML = `<div style="text-align:center; padding: 2rem;">Error loading news. Ensure standard CSV format.</div>`;
    }

    setupNavigation();
}

/**
 * FETCH & PARSE CSV
 */
async function fetchSheetData(url) {
    const response = await fetch(url);
    const text = await response.text();
    return parseCSV(text);
}

function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentVal = '';
    let insideQuote = false;

    // Normalize line endings to \n
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        const nextChar = cleanText[i + 1];

        if (char === '"') {
            if (insideQuote && nextChar === '"') {
                currentVal += '"';
                i++; // Skip next quote
            } else {
                insideQuote = !insideQuote;
            }
        } else if (char === ',' && !insideQuote) {
            currentRow.push(currentVal);
            currentVal = '';
        } else if (char === '\n' && !insideQuote) {
            currentRow.push(currentVal);
            if (currentRow.length > 0) rows.push(currentRow);
            currentRow = [];
            currentVal = '';
        } else {
            currentVal += char;
        }
    }
    // Push last row if exists
    if (currentVal || currentRow.length > 0) {
        currentRow.push(currentVal);
        rows.push(currentRow);
    }

    if (rows.length === 0) return [];

    // Extract Headers
    const headers = rows[0].map(h => h.trim().toLowerCase());
    const data = [];

    for (let i = 1; i < rows.length; i++) {
        const currentline = rows[i];
        if (currentline.length < 2) continue; // Skip empty rows

        const obj = {};
        headers.forEach((header, j) => {
            let val = currentline[j] ? currentline[j].trim() : '';
            obj[header] = val;
        });

        // Clean ID or Generate
        if (!obj.id) obj.id = 'news_' + i;

        // Parse Date DD/MM/YYYY
        if (obj.date) {
            const parts = obj.date.split('/'); // 16/01/2026
            if (parts.length === 3) {
                // new Date(year, monthIndex, day)
                obj.dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
            } else {
                obj.dateObj = new Date(0);
            }
        } else {
            obj.dateObj = new Date(0); // fallback
        }

        if (obj.title) data.push(obj);
    }

    // Sort by Date Descending (Latest First)
    data.sort((a, b) => b.dateObj - a.dateObj);

    return data;
}

/**
 * UTILS: Time & Format
 */
function startClock() {
    const timeEl = document.querySelector('.clock-time');
    const dateEl = document.querySelector('.clock-date');

    setInterval(() => {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        dateEl.textContent = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    }, 1000);
}

function getRelativeTime(dateInput) {
    if (!dateInput) return '';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
}

/**
 * NAVIGATION & ROUTING
 */
function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = link.getAttribute('data-cat');
            if (!cat) return; // Ignore dropdown toggles or links without category

            // Switch Views
            homeView.classList.add('hidden');
            contactView.classList.add('hidden');
            document.getElementById('about-view').classList.add('hidden');
            articleView.classList.add('hidden');

            // Update Nav Highlighting
            setActiveNav(cat);

            // Hide Live TV by default, show only on Home/Category views
            liveTvSection.classList.add('hidden');

            // Handle Views
            if (cat === 'contact') {
                contactView.classList.remove('hidden');
            } else if (cat === 'about') {
                document.getElementById('about-view').classList.remove('hidden');
            } else {
                homeView.classList.remove('hidden');
                liveTvSection.classList.remove('hidden');

                // Use mapped Bengali name for data filtering
                const dataCat = CATEGORY_MAPPING[cat.toLowerCase()] || cat;
                currentCategory = dataCat;

                if (cat === 'all') {
                    document.getElementById('hero-section').classList.remove('hidden');
                    renderContent(allNews);
                } else {
                    document.getElementById('hero-section').classList.add('hidden');
                    const filtered = allNews.filter(n => n.category && n.category === dataCat);
                    renderContent(filtered, dataCat);
                }
            }
        });
    });


    // Handle Browser Back Button
    window.onpopstate = function (event) {
        if (!articleView.classList.contains('hidden')) {
            // If in article view, go back to home/category
            goBackToHome();
        }
    };
}

function setActiveNav(cat) {
    // Remove active from all
    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelector('.dropdown-toggle').classList.remove('active');

    // Add active to matching links
    const catLinks = document.querySelectorAll(`.main-nav a[data-cat="${cat}"], .mobile-nav a[data-cat="${cat}"]`);
    catLinks.forEach(l => l.classList.add('active'));

    // Highlight More tab if needed
    const dropdownCats = ['Biswa', 'Khela', 'Binodon', 'Swasthya', 'Projukti'];
    if (dropdownCats.includes(cat) || dropdownCats.includes(cat.charAt(0).toUpperCase() + cat.slice(1))) { // Case safe check
        document.querySelector('.dropdown-toggle').classList.add('active');
    }
}

window.goBackToHome = function () {
    articleView.classList.add('hidden');
    contactView.classList.add('hidden');
    document.getElementById('about-view').classList.add('hidden');
    document.getElementById('about-view').classList.add('hidden');
    homeView.classList.remove('hidden');
    liveTvSection.classList.remove('hidden');
    window.scrollTo(0, 0); // Optional: preserve scroll pos if possible? Simple scroll top is okay.
}

/**
 * RENDERING: Marquee
 */
function renderMarquee(news) {
    // Top 5 latest news
    const latest = news.slice().sort((a, b) => b.dateObj - a.dateObj).slice(0, 10);
    marqueeContent.innerHTML = latest.map(item =>
        `<span class="ticker-item">${item.title}</span>`
    ).join('');
}

/**
 * RENDERING: Hero Slider
 */
function renderHero(news) {
    heroSlider.innerHTML = '';
    const latestPerCat = [];

    CATEGORIES.forEach(cat => {
        const catNews = news.filter(n => n.category && n.category.toLowerCase() === cat.toLowerCase());
        if (catNews.length > 0) {
            catNews.sort((a, b) => b.dateObj - a.dateObj);
            latestPerCat.push(catNews[0]);
        }
    });

    if (latestPerCat.length === 0) return;

    latestPerCat.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'hero-card';
        card.onclick = () => openArticle(item);

        card.innerHTML = `
            <img src="${item.image_url || 'https://via.placeholder.com/800x600'}" class="hero-bg" alt="${item.title}">
            <div class="hero-overlay">
                <span class="hero-category">${item.category}</span>
                <h3 class="hero-title">${item.title}</h3>
                <div class="hero-meta">
                    <span><i class="far fa-clock"></i> ${getRelativeTime(item.dateObj)}</span>
                </div>
            </div>
        `;
        heroSlider.appendChild(card);
    });
}

function startHeroAutoScroll() {
    let scrollAmount = 0;
    const cards = document.querySelectorAll('.hero-card');
    if (cards.length === 0) return;

    setInterval(() => {
        const cardWidth = cards[0].offsetWidth + 24; // Width + Gap
        const maxScroll = heroSlider.scrollWidth - heroSlider.clientWidth;

        scrollAmount += cardWidth;
        if (scrollAmount > maxScroll) scrollAmount = 0;

        heroSlider.scrollTo({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }, 4000); // 3-4 seconds delay
}

/**
 * RENDERING: Grid
 */
function renderContent(news, filterTitle = '') {
    contentArea.innerHTML = '';

    if (filterTitle && filterTitle !== 'all') {
        const sorted = news.sort((a, b) => new Date(b.date) - new Date(a.date));
        renderSection(filterTitle, sorted, true); // True = Enable Load More
    } else {
        CATEGORIES.forEach(cat => {
            const catNews = news.filter(n => n.category && n.category.toLowerCase() === cat.toLowerCase());
            if (catNews.length > 0) {
                renderSection(cat, catNews.slice(0, 5)); // Show only 5 initially plus View All
            }
        });
    }
}

function renderSection(title, articles, allowLoadMore = false) {
    if (!articles || articles.length === 0) return;

    const section = document.createElement('section');
    const gridId = `grid-${title}`;

    // Initial display: 6 items for detail view, 5 for homepage
    const initialCount = allowLoadMore ? 6 : 5;
    const visibleArticles = articles.slice(0, initialCount);

    let html = `
        <div class="section-header">
            <h3 class="section-title">${title}</h3>
        </div>
        <div class="news-grid" id="${gridId}">
            ${visibleArticles.map(item => createNewsCard(item)).join('')}
            ${!allowLoadMore ? createViewAllCard(title) : ''}
        </div>
    `;

    // Load More Button
    if (allowLoadMore && articles.length > initialCount) {
        html += `
            <div style="text-align:center; margin-top:2rem;">
                <button class="load-more-btn" onclick="loadMore('${title}', ${initialCount}, '${gridId}')">Load More</button>
            </div>
        `;
    }

    section.innerHTML = html;
    contentArea.appendChild(section);
}

// Global scope for onclick access
window.loadMore = function (catTitle, currentCount, gridId) {
    const moreArticles = allNews
        .filter(n => n.category.toLowerCase() === catTitle.toLowerCase())
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(currentCount, currentCount + 6);

    const grid = document.getElementById(gridId);
    moreArticles.forEach(item => {
        grid.insertAdjacentHTML('beforeend', createNewsCard(item));
    });

    // Update button onclick to next batch, or hide if done
    const btn = grid.parentElement.querySelector('.load-more-btn');
    if (btn) {
        const nextCount = currentCount + 6;
        const totalCat = allNews.filter(n => n.category.toLowerCase() === catTitle.toLowerCase()).length;
        if (nextCount >= totalCat) {
            btn.style.display = 'none';
        } else {
            btn.setAttribute('onclick', `loadMore('${catTitle}', ${nextCount}, '${gridId}')`);
        }
    }
}

function createNewsCard(item) {
    const isVideo = item.video_url && item.video_url.length > 5;
    // Store object for onclick? We can use ID lookup.
    return `
        <article class="news-card" onclick="openArticleByID('${item.id}')">
            <div class="card-image-wrapper">
                <img src="${item.image_url || 'https://via.placeholder.com/400x300'}" class="card-image" alt="${item.title}">
                ${isVideo ? `<div style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.6); color:white; padding:4px 10px; border-radius:4px; font-size:0.7rem;"><i class="fas fa-play"></i> Watch</div>` : ''}
            </div>
            <div class="card-content">
                <div class="card-meta">
                    <span class="card-cat">${item.category}</span>
                    <span class="card-time"><i class="far fa-clock"></i> ${getRelativeTime(item.dateObj)}</span>
                </div>
                <h4 class="card-title">${item.title}</h4>
                <p class="card-summary">${item.summary || (item.content ? item.content.substring(0, 100) + '...' : '')}</p>
            </div>
        </article>
    `;
}

// Global scope function for card click
window.openArticleByID = function (id) {
    const item = allNews.find(n => n.id === id);
    if (item) openArticle(item);
}

/**
 * ARTICLE DETAIL VIEW
 */
function openArticle(item) {
    homeView.classList.add('hidden');
    contactView.classList.add('hidden');
    document.getElementById('about-view').classList.add('hidden');
    liveTvSection.classList.add('hidden');
    articleView.classList.remove('hidden');
    window.scrollTo(0, 0);

    // Add history state so back button works
    history.pushState({ view: 'article', id: item.id }, '', '#article-' + item.id);

    const isVideo = item.video_url && item.video_url.length > 5;

    const sidebarHTML = renderLatestNewsSidebar(item.id);

    articleView.innerHTML = `
        <div class="article-view-container">
            <button onclick="history.back()" class="back-btn" style="margin: 1rem 0 1rem 1rem; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                <i class="fas fa-arrow-left"></i> Back
            </button>
            
            <div class="article-content-wrapper">
                <div class="article-main">
                    ${isVideo
            ? `<div style="position:relative; padding-top:56.25%;"><iframe src="${convertYoutube(item.video_url)}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen></iframe></div>`
            : `<img src="${item.image_url}" class="article-hero-img">`
        }
                    <div class="article-body">
                        <div class="article-header">
                            <div class="article-cats">${item.category}</div>
                            <h1 class="article-headline">${item.title}</h1>
                            <div class="article-meta">
                                <span class="article-author">
                                    ${item.reporter || 'GBTV Desk'}
                                </span>
                                <span><i class="far fa-clock"></i> ${getRelativeTime(item.dateObj)}</span>
                                <button onclick="shareArticle('${item.id}', '${item.title.replace(/'/g, "\\'")}')" class="share-btn" style="background: rgba(255,255,255,0.1); border: none; color: white; padding: 4px 10px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.85rem; margin-left: auto;">
                                    <i class="fas fa-share-alt"></i> Share
                                </button>
                            </div>
                        </div>
                        <div class="article-text">
                            ${formatContent(item.content)}
                        </div>
                        
                    </div>
                </div>

                <div class="article-sidebar">
                    <h3 class="sidebar-title">Latest News</h3>
                    <div class="sidebar-news-list">
                        ${sidebarHTML}
                    </div>
                </div>
            </div>
            
            <div class="article-actions" style="margin: 3rem 2rem 0; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 2rem;">
                <button onclick="goBackToHome()" class="load-more-btn" style="font-size: 1rem; padding: 12px 30px;">
                    <i class="fas fa-home"></i> Back to Home
                </button>
            </div>
        </div>
    `;
}

function renderLatestNewsSidebar(currentId) {
    const latest = allNews.filter(n => n.id !== currentId).sort((a, b) => b.dateObj - a.dateObj).slice(0, 5);
    return latest.map(item => `
        <div class="sidebar-card" onclick="openArticleByID('${item.id}')">
            <img src="${item.image_url || 'https://via.placeholder.com/100'}" alt="${item.title}">
            <div class="sidebar-card-content">
                <h4>${item.title}</h4>
                <span><i class="far fa-clock"></i> ${getRelativeTime(item.dateObj)}</span>
            </div>
        </div>
    `).join('');
}

function convertYoutube(url) {
    // Simple converter from watch?v= to embed/
    if (url.includes('youtube.com/watch?v=')) {
        return url.replace('watch?v=', 'embed/');
    } else if (url.includes('youtu.be/')) {
        return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    return url;
}

function formatContent(text) {
    if (!text) return '';
    return text.split('\n').map(p => `<p style="margin-bottom:1.5rem;">${p}</p>`).join('');
}

function createViewAllCard(category) {
    return `
        <article class="news-card view-all-card" onclick="openCategory('${category}')">
            <div class="view-all-content">
                <span class="view-all-icon"><i class="fas fa-arrow-right"></i></span>
                <span class="view-all-text">View All<br>${category}</span>
            </div>
        </article>
    `;
}

window.openCategory = function (catInput) {
    // catInput might be Bengali (from View All) or English key
    let catKey = getCategoryKey(catInput); // Try to find English key
    let dataCat = CATEGORY_MAPPING[catKey.toLowerCase()] || catInput; // Back to Bengali/Data name

    // Switch Views
    homeView.classList.add('hidden');
    contactView.classList.add('hidden');
    document.getElementById('about-view').classList.add('hidden');
    articleView.classList.add('hidden');

    // Update Nav using English Key
    setActiveNav(catKey);

    homeView.classList.remove('hidden');
    liveTvSection.classList.remove('hidden');
    currentCategory = dataCat;

    if (catKey === 'all') {
        document.getElementById('hero-section').classList.remove('hidden');
        renderContent(allNews);
    } else {
        document.getElementById('hero-section').classList.add('hidden');
        const filtered = allNews.filter(n => n.category && n.category === dataCat);
        renderContent(filtered, dataCat);
    }
    window.scrollTo(0, 0);
}

window.shareArticle = function (id, title) {
    const url = window.location.href.split('#')[0] + '#article-' + id;
    if (navigator.share) {
        navigator.share({
            title: title + ' | Gour Bongo TV',
            text: 'Check out this news on Gour Bongo TV!',
            url: url
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            alert('Link copied to clipboard!');
        }).catch(() => {
            prompt('Copy this link:', url);
        });
    }
}
