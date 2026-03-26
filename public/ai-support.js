        (function () {
            if (window.__afAiSupportLoaded) return;
            window.__afAiSupportLoaded = true;

            var afAiSupportEnabled = true;
            if (!afAiSupportEnabled) {
                return;
            }

            function apiEndpoint(path) {
                var base = (window.afAiApiBase || '').replace(/\/+$/, '');
                return base ? (base + path) : path;
            }

            function assetEndpoint(path) {
                var base = (window.appBaseUrl || '').replace(/\/+$/, '');
                return base ? (base + path) : path;
            }

            function esc(str) {
                return String(str || '')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            }

            function linkify(text) {
                var safe = esc(text);
                return safe.replace(/(https?:\/\/[^\s<]+)/g, function (url) {
                    return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" style="color:#fff;text-decoration:underline;">' + url + '</a>';
                });
            }

            function normalizeCardPriceText(text) {
                var safe = String(text || '');
                return safe.replace(/(\d[\d,]*)\.00\b/g, '$1');
            }

            var css = '' +
                '@import url(\"https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap\");' +
                '.af-ai-btn{position:fixed;left:20px;bottom:26px;z-index:9999;border:0;background:transparent;padding:0;width:90px;height:90px;cursor:pointer;}' +
                '.af-ai-btn-cloud{position:relative;width:90px;height:90px;border-radius:28px;background:transparent;border:0;box-shadow:none;display:flex;align-items:center;justify-content:center;animation:afRobotFloat 3.4s ease-in-out infinite;}' +
                '.af-ai-btn-cloud:after{content:none;}' +
                '.af-ai-btn-main{width:70px;height:82px;border-radius:0;object-fit:contain;display:block;background:transparent;border:0;box-shadow:none;position:relative;z-index:1;animation:afRobotWave 1.9s ease-in-out infinite;transform-origin:60% 78%;}' +
                '.af-ai-btn-robot{position:absolute;right:-6px;top:-10px;width:36px;height:28px;border-radius:14px;object-fit:contain;background:#fff;border:2px solid #cfe0ff;box-shadow:0 10px 18px rgba(14,30,60,.18);z-index:3;padding:2px 4px;}' +
                '.af-ai-btn-robot:after{content:\"\";position:absolute;left:9px;bottom:-5px;width:10px;height:10px;background:#fff;border-right:2px solid #cfe0ff;border-bottom:2px solid #cfe0ff;transform:rotate(45deg);}' +
                '.af-ai-btn:hover .af-ai-btn-main{animation-duration:1.4s;}' +
                '@keyframes afRobotWave{0%{transform:rotate(0deg)}8%{transform:rotate(-13deg)}16%{transform:rotate(12deg)}24%{transform:rotate(-10deg)}32%{transform:rotate(8deg)}40%{transform:rotate(0deg)}100%{transform:rotate(0deg)}}' +
                '@keyframes afRobotFloat{0%{transform:translateY(0)}50%{transform:translateY(-4px)}100%{transform:translateY(0)}}' +
                '.af-ai-panel{position:fixed;left:18px;bottom:126px;width:360px;max-width:calc(100vw - 20px);height:560px;max-height:72vh;background:#f9fbff;border:1px solid #e4ecf8;border-radius:22px;z-index:9999;display:none;box-shadow:0 24px 48px rgba(12,26,55,.22);overflow:hidden;flex-direction:column;font-family:\"Space Grotesk\",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;}' +
                '.af-ai-head{background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#fff;padding:14px 16px;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:space-between;gap:10px;}' +
                '.af-ai-head-left{display:flex;align-items:center;gap:10px;min-width:0;}' +
                '.af-ai-head-logo{width:26px;height:26px;object-fit:contain;border-radius:8px;background:#fff;padding:2px;box-shadow:0 6px 14px rgba(14,30,60,.2);}' +
                '.af-ai-head-title{font-size:18px;font-weight:700;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.2px;}' +
                '.af-ai-body{flex:1 1 auto;min-height:0;overflow:auto;padding:14px;background:radial-gradient(circle at top,#f3f7ff 0%,#f7f9fc 45%,#ffffff 100%);}' +
                '.af-ai-body::-webkit-scrollbar{width:6px;}' +
                '.af-ai-body::-webkit-scrollbar-thumb{background:#d5deeb;border-radius:10px;}' +
                '.af-ai-msg{margin:10px 0;display:flex;}' +
                '.af-ai-msg.user{justify-content:flex-end;}' +
                '.af-ai-bubble{max-width:82%;padding:11px 13px;border-radius:16px;font-size:14px;line-height:1.5;white-space:normal;word-break:break-word;overflow-wrap:anywhere;box-shadow:0 6px 16px rgba(15,23,42,.08);}' +
                '.af-ai-bubble a{word-break:break-all;overflow-wrap:anywhere;color:#e0f2fe;}' +
                '.af-ai-msg.bot .af-ai-bubble{background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#fff;border-bottom-left-radius:6px;}' +
                '.af-ai-msg.user .af-ai-bubble{background:#ffffff;color:#0f172a;border:1px solid #e5eaf3;border-bottom-right-radius:6px;}' +
                '.af-ai-cards{display:grid;grid-template-columns:1fr;gap:10px;width:100%;}' +
                '.af-ai-card{display:flex;gap:12px;align-items:flex-start;background:#ffffff;border:1px solid #e6edf7;border-radius:14px;padding:10px 12px;box-shadow:0 10px 20px rgba(15,23,42,.08);text-decoration:none;}' +
                '.af-ai-card img{width:62px;height:62px;object-fit:cover;border-radius:10px;display:block;}' +
                '.af-ai-card-body{min-width:0;}' +
                '.af-ai-card-name{font-size:13px;font-weight:700;line-height:1.25;color:#0f172a;}' +
                '.af-ai-card-desc{font-size:11px;color:#475569;margin-top:4px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}' +
                '.af-ai-card-price{font-size:12px;color:#2563eb;font-weight:700;margin-top:4px;}' +
                '.af-ai-brands{display:grid;grid-template-columns:1fr;gap:10px;width:100%;}' +
                '.af-ai-brand-card{display:flex;align-items:center;justify-content:space-between;background:#ffffff;border:1px solid #e6edf7;border-radius:14px;padding:10px 12px;text-decoration:none;color:inherit;box-shadow:0 10px 18px rgba(15,23,42,.08);}' +
                '.af-ai-brand-name{font-size:13px;font-weight:700;line-height:1.2;color:#0f172a;}' +
                '.af-ai-brand-count{font-size:12px;color:#2563eb;font-weight:700;margin-left:10px;white-space:nowrap;}' +
                '.af-ai-brand-wrap{display:flex;flex-direction:column;gap:10px;width:100%;}' +
                '.af-ai-brand-footer{width:100%;}' +
                '.af-ai-brand-viewall{display:inline-block;font-size:12px;color:#2563eb;text-decoration:underline;}' +
                '.af-ai-quick{flex:0 0 auto;padding:10px 12px 0;background:#f7f9fc;display:flex;gap:8px;flex-wrap:wrap;max-height:96px;overflow:auto;}' +
                '.af-ai-qbtn{border:1px solid #cfe0ff;background:#ffffff;color:#2563eb;padding:7px 12px;border-radius:999px;font-size:12px;font-weight:600;box-shadow:0 6px 12px rgba(15,23,42,.06);}' +
                '.af-ai-foot{flex:0 0 auto;height:60px;border-top:1px solid #e6edf7;padding:10px;background:#ffffff;display:flex;gap:10px;align-items:center;}' +
                '.af-ai-input{flex:1;border:1px solid #d6e0ef;border-radius:999px;padding:10px 14px;font-size:14px;outline:none;}' +
                '.af-ai-input:focus{border-color:#93c5fd;box-shadow:0 0 0 3px rgba(147,197,253,.35);}' +
                '.af-ai-send{border:0;background:linear-gradient(135deg,#fb8c00,#f97316);color:#fff;border-radius:999px;padding:9px 14px;font-weight:700;box-shadow:0 8px 18px rgba(249,115,22,.32);}' +
                '@media (max-width:576px){.af-ai-panel{right:10px;left:10px;bottom:106px;width:auto;height:66vh}.af-ai-btn{left:10px;bottom:20px}}';

            var style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);

            var panel = document.createElement('div');
            panel.className = 'af-ai-panel';
            panel.innerHTML = '' +
                '<div class="af-ai-head">' +
                '  <div class="af-ai-head-left">' +
                '    <img class="af-ai-head-logo" src="' + esc(assetEndpoint('/Image/af.png')) + '" alt="AF">' +
                '    <span class="af-ai-head-title"><span style="color:orange; font-size:22px; font-weight:bold;">A</span><span style="color:#03AED2; font-size:22px; font-weight:bold;">F</span>Shop AI</span>' +
                '  </div>' +
                '  <button type="button" id="afAiClose" style="border:0;background:transparent;color:#fff;font-size:20px;line-height:1;cursor:pointer;">&times;</button>' +
                '</div>' +
                '<div id="afAiBody" class="af-ai-body"></div>' +
                '<div id="afAiQuick" class="af-ai-quick"></div>' +
                '<div class="af-ai-foot">' +
                '  <input id="afAiInput" class="af-ai-input" placeholder="Type your question..." />' +
                '  <button id="afAiSend" class="af-ai-send" type="button">Send</button>' +
                '</div>';
            document.body.appendChild(panel);

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'af-ai-btn';
            btn.id = 'afAiToggle';
            btn.innerHTML =
                '<span class="af-ai-btn-cloud">' +
                '<img class="af-ai-btn-main" src="' + esc(assetEndpoint('/Image/sir.png')) + '" alt="AI">' +
                '<img class="af-ai-btn-robot" src="' + esc(assetEndpoint('/Image/af.png')) + '" alt="Support">' +
                '</span>';
            document.body.appendChild(btn);

            var body = panel.querySelector('#afAiBody');
            var input = panel.querySelector('#afAiInput');
            var send = panel.querySelector('#afAiSend');
            var quick = panel.querySelector('#afAiQuick');
            var storageKey = 'af_ai_support_history_v1';
            var uiState = { messages: [], quickReplies: [] };
            var starterQuestions = [
                'What products match a minimalist style?',
                'Suggest items under PHP 5,000.',
                'What is best for office setup at home?',
                'What is the highest-rated product?',
                'What items are low in stock?',
                'Show me trending home decor.',
                'What if I received the wrong item?',
                'Do you accept GCash or online banking?',
                'How can I track my order?',
                'What happens if my item arrives damaged?',
                'What courier do you use?',
                'Can you recommend a sofa for small spaces?',
                'What are your best-selling living room products?',
                'Do you have items on sale right now?'
            ];

            function persistState() {
                try {
                    window.sessionStorage.setItem(storageKey, JSON.stringify(uiState));
                } catch (e) {}
            }

            function restoreState() {
                try {
                    var raw = window.sessionStorage.getItem(storageKey);
                    if (!raw) return;
                    var parsed = JSON.parse(raw);
                    if (!parsed || !Array.isArray(parsed.messages)) return;
                    uiState.messages = parsed.messages;
                    uiState.quickReplies = Array.isArray(parsed.quickReplies) ? parsed.quickReplies : [];
                } catch (e) {}
            }

            function addMsg(type, text) {
                var row = document.createElement('div');
                row.className = 'af-ai-msg ' + type;
                row.innerHTML = '<div class="af-ai-bubble">' + linkify(text) + '</div>';
                body.appendChild(row);
                body.scrollTop = body.scrollHeight;
                uiState.messages.push({ kind: 'text', role: type, text: String(text || '') });
                persistState();
            }

            function addProductCards(cards) {
                var list = Array.isArray(cards) ? cards : [];
                if (!list.length) return;
                var row = document.createElement('div');
                row.className = 'af-ai-msg bot';

                var html = '<div class="af-ai-cards">';
                list.slice(0, 10).forEach(function (card) {
                    var image = esc(card && card.image ? card.image : '');
                    var name = esc(card && card.name ? card.name : 'Product');
                    var price = esc(normalizeCardPriceText(card && card.price ? card.price : ''));
                    var desc = esc(card && card.description ? card.description : '');
                    var url = esc(card && card.url ? card.url : '#');
                    html += '<a class="af-ai-card" href="' + url + '">' +
                        '<img src="' + image + '" alt="' + name + '">' +
                        '<div class="af-ai-card-body"><div class="af-ai-card-name">' + name + '</div>' +
                        (desc ? '<div class="af-ai-card-desc">' + desc + '</div>' : '') +
                        (price ? '<div class="af-ai-card-price">' + price + '</div>' : '') + '</div>' +
                        '</a>';
                });
                html += '</div>';
                row.innerHTML = html;
                body.appendChild(row);
                body.scrollTop = body.scrollHeight;
                uiState.messages.push({ kind: 'cards', cards: list.slice(0, 10) });
                persistState();
            }

            function addBrandCards(cards, viewAllUrl) {
                var list = Array.isArray(cards) ? cards : [];
                if (!list.length) return;
                var row = document.createElement('div');
                row.className = 'af-ai-msg bot';
                var html = '<div class="af-ai-brand-wrap"><div class="af-ai-brands">';
                list.slice(0, 10).forEach(function (card) {
                    var name = esc(card && card.name ? card.name : 'Brand');
                    var count = parseInt(card && card.count ? card.count : 0, 10);
                    var countText = count > 0 ? (count + ' products') : '';
                    var url = esc(card && card.url ? card.url : '#');
                    html += '<a class="af-ai-brand-card" href="' + url + '">' +
                        '<div class="af-ai-brand-name">' + name + '</div>' +
                        '<div class="af-ai-brand-count">' + esc(countText) + '</div>' +
                        '</a>';
                });
                html += '</div>';
                if (viewAllUrl) {
                    html += '<div class="af-ai-brand-footer"><a class="af-ai-brand-viewall" href="' + esc(viewAllUrl) + '">View all brands</a></div>';
                }
                html += '</div>';
                row.innerHTML = html;
                body.appendChild(row);
                body.scrollTop = body.scrollHeight;
                uiState.messages.push({ kind: 'brand_cards', cards: list.slice(0, 10), viewAllUrl: viewAllUrl || '' });
                persistState();
            }

            function setQuickReplies(items) {
                quick.innerHTML = '';
                var limited = (items || []).slice(0, 14);
                limited.forEach(function (it) {
                    var b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'af-ai-qbtn';
                    b.textContent = it;
                    b.addEventListener('click', function () {
                        input.value = it;
                        doSend();
                    });
                    quick.appendChild(b);
                });
                uiState.quickReplies = limited;
                persistState();
            }

            function renderTextMessage(role, text) {
                var row = document.createElement('div');
                row.className = 'af-ai-msg ' + role;
                row.innerHTML = '<div class="af-ai-bubble">' + linkify(text) + '</div>';
                body.appendChild(row);
            }

            function renderCards(cards) {
                var list = Array.isArray(cards) ? cards : [];
                if (!list.length) return;
                var row = document.createElement('div');
                row.className = 'af-ai-msg bot';
                var html = '<div class="af-ai-cards">';
                list.slice(0, 10).forEach(function (card) {
                    var image = esc(card && card.image ? card.image : '');
                    var name = esc(card && card.name ? card.name : 'Product');
                    var price = esc(normalizeCardPriceText(card && card.price ? card.price : ''));
                    var desc = esc(card && card.description ? card.description : '');
                    var url = esc(card && card.url ? card.url : '#');
                    html += '<a class="af-ai-card" href="' + url + '">' +
                        '<img src="' + image + '" alt="' + name + '">' +
                        '<div class="af-ai-card-body"><div class="af-ai-card-name">' + name + '</div>' +
                        (desc ? '<div class="af-ai-card-desc">' + desc + '</div>' : '') +
                        (price ? '<div class="af-ai-card-price">' + price + '</div>' : '') + '</div>' +
                        '</a>';
                });
                html += '</div>';
                row.innerHTML = html;
                body.appendChild(row);
            }

            function renderBrandCards(cards, viewAllUrl) {
                var list = Array.isArray(cards) ? cards : [];
                if (!list.length) return;
                var row = document.createElement('div');
                row.className = 'af-ai-msg bot';
                var html = '<div class="af-ai-brand-wrap"><div class="af-ai-brands">';
                list.slice(0, 10).forEach(function (card) {
                    var name = esc(card && card.name ? card.name : 'Brand');
                    var count = parseInt(card && card.count ? card.count : 0, 10);
                    var countText = count > 0 ? (count + ' products') : '';
                    var url = esc(card && card.url ? card.url : '#');
                    html += '<a class="af-ai-brand-card" href="' + url + '">' +
                        '<div class="af-ai-brand-name">' + name + '</div>' +
                        '<div class="af-ai-brand-count">' + esc(countText) + '</div>' +
                        '</a>';
                });
                html += '</div>';
                if (viewAllUrl) {
                    html += '<div class="af-ai-brand-footer"><a class="af-ai-brand-viewall" href="' + esc(viewAllUrl) + '">View all brands</a></div>';
                }
                html += '</div>';
                row.innerHTML = html;
                body.appendChild(row);
            }

            function renderHistory() {
                body.innerHTML = '';
                uiState.messages.forEach(function (m) {
                    if (!m || !m.kind) return;
                    if (m.kind === 'text') {
                        renderTextMessage(m.role === 'user' ? 'user' : 'bot', m.text || '');
                        return;
                    }
                    if (m.kind === 'cards') {
                        renderCards(m.cards || []);
                        return;
                    }
                    if (m.kind === 'brand_cards') {
                        renderBrandCards(m.cards || [], m.viewAllUrl || '');
                    }
                });
                if (uiState.quickReplies && uiState.quickReplies.length) {
                    setQuickReplies(uiState.quickReplies);
                }
                body.scrollTop = body.scrollHeight;
            }

            function doSend() {
                var msg = (input.value || '').trim();
                if (!msg) return;
                addMsg('user', msg);
                input.value = '';

                fetch(apiEndpoint('/api/ai-support'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                    body: 'message=' + encodeURIComponent(msg)
                })
                    .then(function (res) { return res.json(); })
                    .then(function (res) {
                        if (res && res.status === 'ok') {
                            addMsg('bot', res.reply || 'I received your message.');
                            addProductCards(res.product_cards || []);
                            addBrandCards(res.brand_cards || [], res.brand_view_all_url || '');
                            setQuickReplies(res.quick_replies || []);
                            return;
                        }
                        addMsg('bot', 'I could not process your request right now.');
                    })
                    .catch(function () {
                        addMsg('bot', 'Support is temporarily unavailable. Please try again.');
                    });
            }

            function openPanel() {
                panel.style.display = 'flex';
                if (!uiState.messages.length) {
                    addMsg('bot', 'Hi! How can we help?');
                    setQuickReplies(starterQuestions);
                } else {
                    renderHistory();
                }
                input.focus();
            }

            function closePanel() {
                panel.style.display = 'none';
            }

            btn.addEventListener('click', function () {
                if (panel.style.display === 'block') {
                    closePanel();
                } else {
                    openPanel();
                }
            });

            panel.querySelector('#afAiClose').addEventListener('click', closePanel);
            send.addEventListener('click', doSend);
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    doSend();
                }
            });

            restoreState();
        })();
